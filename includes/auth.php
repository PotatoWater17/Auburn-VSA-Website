<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/users.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/activity.php';

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    @ini_set('session.use_only_cookies', '1');
    @ini_set('session.use_strict_mode', '1');
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.use_trans_sid', '0');
    @ini_set('session.gc_maxlifetime', (string) admin_session_max_seconds());
    $secure = function_exists('is_https_request') ? is_https_request() : (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443')
    );
    // Scope the cookie to the app mount when installed under a subdirectory
    // (e.g. /~vsa/admin/login.php → path /~vsa). Domain-root installs keep "/".
    $cookiePath = '/';
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    if (preg_match('#^(.*?)/(?:admin|api)(?:/|$)#', $script, $m)) {
        $cookiePath = ($m[1] === '' ? '/' : $m[1]);
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $cookiePath,
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Idle timeout before an unused admin session is invalidated. Min 5 minutes. */
function admin_session_idle_seconds(): int
{
    $env = getenv('ADMIN_SESSION_IDLE_SECONDS');
    if (is_string($env) && ctype_digit(trim($env))) {
        return max(300, (int) trim($env));
    }
    return (int) ADMIN_SESSION_IDLE_SECONDS;
}

/** Hard cap on admin session lifetime from login. Min 10 minutes. */
function admin_session_max_seconds(): int
{
    $env = getenv('ADMIN_SESSION_MAX_SECONDS');
    if (is_string($env) && ctype_digit(trim($env))) {
        return max(600, (int) trim($env));
    }
    return (int) ADMIN_SESSION_MAX_SECONDS;
}

/**
 * True when session flags are present and idle/max lifetimes have not elapsed.
 * Does not extend the session clock (session.php must not call touch).
 */
function admin_session_is_valid(): bool
{
    if (empty($_SESSION['vsa_admin'])) {
        return false;
    }
    $now = time();
    $loginAt = (int) ($_SESSION['vsa_login_at'] ?? 0);
    $lastAt = (int) ($_SESSION['vsa_last_activity'] ?? 0);
    // Sessions created before expiry tracking: stamp once, then enforce on next request.
    if ($loginAt <= 0 || $lastAt <= 0) {
        $_SESSION['vsa_login_at'] = $now;
        $_SESSION['vsa_last_activity'] = $now;
        return true;
    }
    if ($now - $lastAt > admin_session_idle_seconds()) {
        return false;
    }
    if ($now - $loginAt > admin_session_max_seconds()) {
        return false;
    }
    if (!admin_session_client_matches()) {
        return false;
    }
    return true;
}

/** SHA-256 of User-Agent — binds session cookie to the signing-in browser. */
function admin_session_ua_fingerprint(): string
{
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    return $ua === '' ? '' : hash('sha256', $ua);
}

/** Store browser fingerprint at login (skipped when VSA_SESSION_BIND_UA=0). */
function admin_session_bind_client(): void
{
    if (getenv('VSA_SESSION_BIND_UA') === '0') {
        return;
    }
    $_SESSION['vsa_ua'] = admin_session_ua_fingerprint();
}

/** False when the User-Agent changed — likely cookie theft or browser swap. */
function admin_session_client_matches(): bool
{
    if (getenv('VSA_SESSION_BIND_UA') === '0') {
        return true;
    }
    $stored = (string) ($_SESSION['vsa_ua'] ?? '');
    if ($stored === '') {
        admin_session_bind_client();
        return true;
    }
    $current = admin_session_ua_fingerprint();
    if ($current === '') {
        return true;
    }
    return hash_equals($stored, $current);
}

/** Bump last-activity on authenticated admin work (not on passive CSRF reads). */
function admin_session_touch(): void
{
    if (!empty($_SESSION['vsa_admin'])) {
        $_SESSION['vsa_last_activity'] = time();
    }
}

function is_logged_in(): bool
{
    start_session();
    if (empty($_SESSION['vsa_admin']) || empty($_SESSION['vsa_username'])) {
        return false;
    }
    if (!admin_session_is_valid()) {
        logout_admin();
        return false;
    }
    return true;
}

function current_username(): string
{
    start_session();
    return (string) ($_SESSION['vsa_username'] ?? '');
}

function current_user(): ?array
{
    if (!is_logged_in()) {
        return null;
    }
    $user = find_user(current_username());
    if (!$user || empty($user['active'])) {
        return null;
    }
    return $user;
}

function current_permissions(): array
{
    return user_permissions(current_user());
}

function current_user_can(string $perm): bool
{
    return user_can(current_user(), $perm);
}

function current_user_is_root(): bool
{
    return user_is_root(current_user());
}

/** True when password is locked by ADMIN_PASSWORD_HASH env (not changeable in UI). */
function admin_password_is_env_locked(): bool
{
    $env = getenv('ADMIN_PASSWORD_HASH');
    return is_string($env) && password_hash_looks_valid($env);
}

/** Active bcrypt hash for legacy root password file / env. */
function admin_password_hash(): string
{
    if (admin_password_is_env_locked()) {
        $env = (string) getenv('ADMIN_PASSWORD_HASH');
        return trim($env);
    }
    if (is_readable(ADMIN_PASSWORD_HASH_FILE)) {
        $stored = trim((string) file_get_contents(ADMIN_PASSWORD_HASH_FILE));
        if ($stored !== '' && password_hash_looks_valid($stored)) {
            return $stored;
        }
    }
    return '';
}

function verify_admin_password(string $password): bool
{
    return verify_password_hash($password, admin_password_hash());
}

/**
 * Change the logged-in user's password (requires current password).
 * New password is bcrypt-hashed; plaintext is never stored.
 * @return array{ok:bool,error?:string}
 */
function change_own_password(string $current, string $new): array
{
    $user = current_user();
    if (!$user) {
        return ['ok' => false, 'error' => 'Not signed in.'];
    }
    if (user_is_root($user) && admin_password_is_env_locked()) {
        return [
            'ok' => false,
            'error' => 'Password is locked by the ADMIN_PASSWORD_HASH environment variable on this server.',
        ];
    }
    $hash = (string) ($user['passwordHash'] ?? '');
    if (!verify_password_hash($current, $hash)) {
        return ['ok' => false, 'error' => 'Current password is incorrect.'];
    }
    $policy = validate_password_policy($new);
    if (empty($policy['ok'])) {
        return ['ok' => false, 'error' => $policy['error'] ?? 'Invalid password.'];
    }
    if (hash_equals($current, $new)) {
        return ['ok' => false, 'error' => 'New password must be different from the current password.'];
    }

    $result = update_user((string) $user['username'], [
        'password' => $new,
        'allowRootPasswordReset' => true,
    ]);
    if (empty($result['ok'])) {
        return ['ok' => false, 'error' => $result['error'] ?? 'Could not update password.'];
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));

    return ['ok' => true];
}

/** @deprecated use change_own_password — kept for older password.php flow */
function change_admin_password(string $current, string $new): array
{
    return change_own_password($current, $new);
}

/**
 * Log in with username + password.
 * Passwords are verified against bcrypt hashes only; plaintext is never stored.
 */
function login_user(string $username, string $password): bool
{
    $username = normalize_username($username);
    // Legacy: password-only forms posted empty username → treat as admin.
    if ($username === '') {
        $username = 'admin';
    }

    $user = find_user($username);
    if (!$user || empty($user['active'])) {
        // Constant-time-ish miss: still run a verify against a dummy hash.
        verify_password_hash($password, '');
        return false;
    }

    $hash = (string) ($user['passwordHash'] ?? '');
    $ok = verify_password_hash($password, $hash);

    if (!$ok) {
        // Legacy fallback: root admin may still match old single-hash file/env.
        if (user_is_root($user) && verify_admin_password($password)) {
            // Re-hash into users.json (and legacy file) — never keep plaintext.
            update_user('admin', ['password' => $password, 'allowRootPasswordReset' => true]);
            $user = find_user('admin');
            if (!$user) {
                return false;
            }
            $ok = true;
            $hash = (string) ($user['passwordHash'] ?? '');
        } else {
            return false;
        }
    }

    // Transparently upgrade older/weaker hashes after a successful login.
    if ($ok && $password !== '' && password_hash_needs_upgrade($hash)) {
        update_user((string) $user['username'], [
            'password' => $password,
            'allowRootPasswordReset' => true,
        ]);
        $user = find_user((string) $user['username']) ?: $user;
    }

    start_session();
    $sameUser = !empty($_SESSION['vsa_admin'])
        && strtolower((string) ($_SESSION['vsa_username'] ?? '')) === strtolower((string) $user['username']);
    // Re-auth of the same account (e.g. construction preview while Admin is open)
    // must not rotate CSRF — that orphans window.CSRF_TOKEN and breaks Save/Upload.
    if (!$sameUser) {
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    $_SESSION['vsa_admin'] = true;
    $_SESSION['vsa_username'] = (string) $user['username'];
    $_SESSION['vsa_role'] = user_is_root($user) ? 'root' : 'editor';
    $_SESSION['vsa_perms'] = user_permissions($user);
    $now = time();
    $_SESSION['vsa_login_at'] = $now;
    $_SESSION['vsa_last_activity'] = $now;
    admin_session_bind_client();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return true;
}

/** @deprecated password-only login — maps to admin user */
function login_admin(string $password): bool
{
    return login_user('admin', $password);
}

function logout_admin(): void
{
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'] ?? '/',
            'domain' => $params['domain'] ?? '',
            'secure' => !empty($params['secure']),
            'httponly' => !empty($params['httponly']),
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

function require_admin(): void
{
    send_security_headers();
    if (!is_logged_in() || !current_user()) {
        logout_admin();
        header('Location: login.php');
        exit;
    }
    admin_session_touch();
}

function require_permission(string $perm): void
{
    require_admin();
    if (!current_user_can($perm)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Forbidden';
        exit;
    }
}

function csrf_token(): string
{
    start_session();
    // Do not mint CSRF for an expired admin session (stolen token window closes with session).
    if (!empty($_SESSION['vsa_admin']) && !admin_session_is_valid()) {
        logout_admin();
        return '';
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function verify_csrf(?string $token): bool
{
    start_session();
    if (!empty($_SESSION['vsa_admin']) && !admin_session_is_valid()) {
        logout_admin();
        return false;
    }
    return is_string($token)
        && $token !== ''
        && !empty($_SESSION['csrf'])
        && hash_equals($_SESSION['csrf'], $token);
}

/**
 * Read CSRF from header and/or body. Apache rewrites sometimes expose
 * REDIRECT_HTTP_*; some stacks drop custom headers on multipart uploads.
 */
function csrf_from_request(?array $jsonBody = null): ?string
{
    $candidates = [
        $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null,
        $_SERVER['REDIRECT_HTTP_X_CSRF_TOKEN'] ?? null,
    ];
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (is_string($name) && strcasecmp($name, 'X-CSRF-Token') === 0) {
                $candidates[] = $value;
            }
        }
    }
    if (is_array($jsonBody) && isset($jsonBody['csrf'])) {
        $candidates[] = $jsonBody['csrf'];
    }
    if (isset($_POST['csrf'])) {
        $candidates[] = $_POST['csrf'];
    }
    foreach ($candidates as $token) {
        if (is_string($token) && $token !== '') {
            return $token;
        }
    }
    return null;
}

/**
 * Emit a clean JSON API response (strips any accidental PHP warnings from the body).
 * display_errors is forced off for admin APIs so notices cannot corrupt JSON.
 */
function admin_json_response(array $payload, int $status = 200): void
{
    @ini_set('display_errors', '0');
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        send_security_headers(true);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function require_admin_api(): void
{
    @ini_set('display_errors', '0');
    if (ob_get_level() === 0) {
        ob_start();
    }
    send_security_headers(true);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    start_session();
    $hadAdmin = !empty($_SESSION['vsa_admin']);
    if (!$hadAdmin || !admin_session_is_valid()) {
        if ($hadAdmin) {
            logout_admin();
        }
        admin_json_response([
            'ok' => false,
            'error' => $hadAdmin ? 'Session expired. Sign in again.' : 'Unauthorized',
        ], 401);
    }
    if (empty($_SESSION['vsa_username']) || !current_user()) {
        logout_admin();
        admin_json_response(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
    // Header / multipart field only here — do not consume php://input (JSON APIs read it later).
    $sent = csrf_from_request(null);
    if (!verify_csrf($sent)) {
        admin_json_response(['ok' => false, 'error' => 'Invalid CSRF token'], 403);
    }
    require_same_origin_write();
    admin_session_touch();
}

function require_permission_api(string $perm): void
{
    require_admin_api();
    if (!current_user_can($perm)) {
        admin_json_response(['ok' => false, 'error' => 'You do not have permission for this action.'], 403);
    }
}

/* ------- Private owner recovery (disabled unless an environment hash is set) ------- */

function owner_recovery_hash(): string
{
    $env = getenv('VSA_RECOVERY_HASH');
    if (is_string($env) && password_hash_looks_valid($env)) {
        return trim($env);
    }
    return '';
}

function owner_recovery_enabled(): bool
{
    return owner_recovery_hash() !== '';
}

function owner_recovery_verify(string $password): bool
{
    $hash = owner_recovery_hash();
    return $hash !== '' && verify_password_hash($password, $hash);
}

function owner_recovery_is_unlocked(): bool
{
    start_session();
    return !empty($_SESSION['recovery_ok']) && !empty($_SESSION['recovery_at'])
        && (time() - (int) $_SESSION['recovery_at']) < 1800;
}

function owner_recovery_unlock(): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['recovery_ok'] = true;
    $_SESSION['recovery_at'] = time();
    // Always rotate CSRF after owner unlock.
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function owner_recovery_lock(): void
{
    start_session();
    unset($_SESSION['recovery_ok'], $_SESSION['recovery_at']);
}

/**
 * Reset the root admin password from an owner-verified recovery session.
 * @return array{ok:bool,error?:string}
 */
function owner_recovery_set_admin_password(string $new): array
{
    if (!owner_recovery_is_unlocked()) {
        return ['ok' => false, 'error' => 'Owner verification required.'];
    }
    if (admin_password_is_env_locked()) {
        return ['ok' => false, 'error' => 'Admin password is locked by ADMIN_PASSWORD_HASH on this server.'];
    }
    $policy = validate_password_policy($new);
    if (empty($policy['ok'])) {
        return ['ok' => false, 'error' => $policy['error'] ?? 'Invalid password.'];
    }
    // Ensure users file exists / admin row present.
    load_users();
    $result = update_user('admin', [
        'password' => $new,
        'active' => true,
        'allowRootPasswordReset' => true,
    ]);
    if (empty($result['ok'])) {
        return ['ok' => false, 'error' => $result['error'] ?? 'Could not update admin password.'];
    }
    return ['ok' => true];
}
