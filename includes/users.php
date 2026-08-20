<?php
// Admin users store — root "admin" + permissioned accounts.

require_once __DIR__ . '/config.php';

define('USERS_FILE', DATA_DIR . '/users.json');

/** Bcrypt cost for new password hashes (PASSWORD_BCRYPT). */
define('VSA_PASSWORD_BCRYPT_COST', 12);

/** Dummy bcrypt hash for timing-safe failed logins (never accepted as a real login). */
define(
    'VSA_PASSWORD_DUMMY_HASH',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);

/**
 * Validate a new password before hashing. Never store plaintext.
 * @return array{ok:bool,error?:string}
 */
function validate_password_policy(string $password): array
{
    $len = strlen($password);
    if ($len < 10) {
        return ['ok' => false, 'error' => 'Password must be at least 10 characters.'];
    }
    if ($len > 256) {
        return ['ok' => false, 'error' => 'Password is too long (max 256 characters).'];
    }
    // Reject all-whitespace / trivial blanks after trim (but allow spaces inside).
    if (trim($password) === '') {
        return ['ok' => false, 'error' => 'Password cannot be blank.'];
    }
    // Soft complexity: at least one letter and one digit (shared-hosting pragmatic floor).
    if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        return ['ok' => false, 'error' => 'Password must include at least one letter and one number.'];
    }
    $lower = strtolower($password);
    static $blocked = [
        'password', 'password1', 'password123', 'admin123', 'admin1234',
        'auburnvsa', 'changeme', 'letmein', 'qwerty123', 'welcome1',
    ];
    foreach ($blocked as $bad) {
        if ($lower === $bad || str_contains($lower, $bad)) {
            return ['ok' => false, 'error' => 'Please choose a less common password.'];
        }
    }
    return ['ok' => true];
}

/**
 * Hash a plaintext password with bcrypt. Returns null on failure.
 * Callers must never persist the plaintext.
 */
function hash_password_secure(string $password): ?string
{
    $policy = validate_password_policy($password);
    if (empty($policy['ok'])) {
        return null;
    }
    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => VSA_PASSWORD_BCRYPT_COST]);
    if ($hash === false || !is_string($hash) || !password_hash_looks_valid($hash)) {
        return null;
    }
    return $hash;
}

function password_hash_looks_valid(string $hash): bool
{
    // bcrypt ($2y$ / $2a$ / $2b$) or argon2 if PHP ever migrates defaults in stored rows
    return (bool) preg_match('/^\$2[ayb]\$\d{2}\$[A-Za-z0-9.\/]{53}$/', $hash)
        || str_starts_with($hash, '$argon2');
}

/**
 * Verify password against stored hash. Uses a dummy hash when missing to reduce timing leaks.
 */
function verify_password_hash(string $password, string $hash): bool
{
    if ($hash === '' || !password_hash_looks_valid($hash)) {
        password_verify($password, VSA_PASSWORD_DUMMY_HASH);
        return false;
    }
    return password_verify($password, $hash);
}

/**
 * Whether a stored hash should be upgraded (cost / algorithm).
 */
function password_hash_needs_upgrade(string $hash): bool
{
    if (!password_hash_looks_valid($hash)) {
        return true;
    }
    return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => VSA_PASSWORD_BCRYPT_COST]);
}

/** Permission keys match admin console page ids. */
function admin_permission_catalog(): array
{
    return [
        'site' => 'Site (logo, contact, socials, construction)',
        'faq-inbox' => 'FAQ Inbox',
        'messages' => 'Construction messages',
        'blocked-ips' => 'Blocked IPs',
        'subscribers' => 'Newsletter (compose + subscribers)',
        'mail' => 'Mail (info@ / sale@)',
        'publish' => 'Scheduled publish queue',
        'backup' => 'Backup download (restore: root only)',
        'media' => 'Media library (uploads + usage)',
        'music' => 'Music easter egg (footer logo player)',
        'home' => 'Home page',
        'team' => 'Team pages',
        'events' => 'Events',
        'royale' => 'AU Royale',
        'gallery' => 'Gallery',
        'merch' => 'Merch',
        'faqs' => 'Published FAQs',
        'users' => 'Manage users',
    ];
}

function admin_all_permission_ids(): array
{
    return array_keys(admin_permission_catalog());
}

function users_default_admin_record(string $passwordHash): array
{
    return [
        'username' => 'admin',
        'role' => 'root',
        'passwordHash' => $passwordHash,
        'permissions' => admin_all_permission_ids(),
        'active' => true,
        'createdAt' => date('c'),
        'updatedAt' => date('c'),
    ];
}

/**
 * Load users; migrate single-password install into root admin on first run.
 * @return list<array>
 */
function load_users(): array
{
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR, 0775, true);
    }

    if (is_readable(USERS_FILE)) {
        $decoded = json_decode((string) file_get_contents(USERS_FILE), true);
        $list = null;
        if (is_array($decoded) && isset($decoded['users']) && is_array($decoded['users'])) {
            $list = $decoded['users'];
        } elseif (is_array($decoded) && array_is_list($decoded)) {
            $list = $decoded;
        }
        if (is_array($list)) {
            $users = [];
            foreach ($list as $row) {
                if (!is_array($row)) {
                    continue;
                }
                // Never keep accidental plaintext fields; only bcrypt/argon hashes.
                unset($row['password'], $row['pass'], $row['plaintext'], $row['password_plain']);
                $hash = (string) ($row['passwordHash'] ?? '');
                if ($hash !== '' && !password_hash_looks_valid($hash)) {
                    $row['passwordHash'] = '';
                }
                $users[] = $row;
            }
            return array_values($users);
        }
    }

    // Bootstrap from a separately configured one-way hash. If none exists,
    // create a disabled root row (empty hash); there is no shipped password.
    $hash = '';
    $env = getenv('ADMIN_PASSWORD_HASH');
    if (is_string($env) && $env !== '' && password_hash_looks_valid($env)) {
        $hash = $env;
    } elseif (is_readable(ADMIN_PASSWORD_HASH_FILE)) {
        $stored = trim((string) file_get_contents(ADMIN_PASSWORD_HASH_FILE));
        if ($stored !== '' && password_hash_looks_valid($stored)) {
            $hash = $stored;
        }
    }
    $users = [users_default_admin_record($hash)];
    save_users($users);
    return $users;
}

function save_users(array $users): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    $payload = [
        'version' => 1,
        'updatedAt' => date('c'),
        'users' => array_values($users),
    ];
    $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $tmp = USERS_FILE . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($tmp, USERS_FILE)) {
        @unlink($tmp);
        return false;
    }
    vsa_chmod_private(USERS_FILE);
    return true;
}

function find_user(string $username): ?array
{
    $username = strtolower(trim($username));
    foreach (load_users() as $user) {
        if (strtolower((string) ($user['username'] ?? '')) === $username) {
            return $user;
        }
    }
    return null;
}

function find_user_index(array $users, string $username): ?int
{
    $username = strtolower(trim($username));
    foreach ($users as $i => $user) {
        if (!is_array($user)) {
            continue;
        }
        if (strtolower((string) ($user['username'] ?? '')) === $username) {
            return $i;
        }
    }
    return null;
}

function user_is_root(?array $user): bool
{
    return is_array($user) && (($user['role'] ?? '') === 'root' || strtolower((string) ($user['username'] ?? '')) === 'admin');
}

function user_permissions(?array $user): array
{
    if (!$user) {
        return [];
    }
    if (user_is_root($user)) {
        return admin_all_permission_ids();
    }
    $perms = $user['permissions'] ?? [];
    if (!is_array($perms)) {
        return [];
    }
    $allowed = admin_all_permission_ids();
    $out = [];
    foreach ($perms as $p) {
        $p = (string) $p;
        if (in_array($p, $allowed, true)) {
            $out[] = $p;
        }
    }
    return array_values(array_unique($out));
}

function user_can(?array $user, string $perm): bool
{
    if (!$user || empty($user['active'])) {
        return false;
    }
    // Only root may manage users or view the admin action log.
    if ($perm === 'users' || $perm === 'activity') {
        return user_is_root($user);
    }
    if (user_is_root($user)) {
        return true;
    }
    return in_array($perm, user_permissions($user), true);
}

function public_user_view(array $user): array
{
    require_once __DIR__ . '/mail.php';
    // Intentionally omits passwordHash — APIs never expose hashes to the browser.
    $mailboxes = mail_normalize_mailbox_ids(is_array($user['mailboxes'] ?? null) ? $user['mailboxes'] : []);
    if (user_is_root($user)) {
        $mailboxes = array_keys(mail_mailbox_catalog());
    }
    return [
        'username' => (string) ($user['username'] ?? ''),
        'role' => user_is_root($user) ? 'root' : 'editor',
        'permissions' => user_permissions($user),
        'mailboxes' => $mailboxes,
        'active' => !empty($user['active']),
        'createdAt' => (string) ($user['createdAt'] ?? ''),
        'updatedAt' => (string) ($user['updatedAt'] ?? ''),
    ];
}

function normalize_username(string $username): string
{
    $username = strtolower(trim($username));
    $username = preg_replace('/[^a-z0-9._-]/', '', $username) ?? '';
    return $username;
}

/**
 * @return array{ok:bool,error?:string,user?:array}
 */
function create_user(string $username, string $password, array $permissions, bool $active = true, array $mailboxes = []): array
{
    require_once __DIR__ . '/mail.php';
    $username = normalize_username($username);
    if ($username === '' || strlen($username) < 3) {
        return ['ok' => false, 'error' => 'Username must be at least 3 characters (letters, numbers, . _ -).'];
    }
    if ($username === 'admin') {
        return ['ok' => false, 'error' => 'The admin account already exists.'];
    }
    $policy = validate_password_policy($password);
    if (empty($policy['ok'])) {
        return ['ok' => false, 'error' => $policy['error'] ?? 'Invalid password.'];
    }
    $users = load_users();
    if (find_user_index($users, $username) !== null) {
        return ['ok' => false, 'error' => 'That username is already taken.'];
    }
    $hash = hash_password_secure($password);
    if ($hash === null) {
        return ['ok' => false, 'error' => 'Could not hash password.'];
    }
    $allowed = admin_all_permission_ids();
    $perms = [];
    foreach ($permissions as $p) {
        $p = (string) $p;
        if ($p === 'users') {
            continue; // only root manages users
        }
        if (in_array($p, $allowed, true)) {
            $perms[] = $p;
        }
    }
    $boxIds = mail_normalize_mailbox_ids($mailboxes);
    // Mailboxes only apply when Mail permission is granted.
    if (!in_array('mail', $perms, true)) {
        $boxIds = [];
    }
    $user = [
        'username' => $username,
        'role' => 'editor',
        'passwordHash' => $hash,
        'permissions' => array_values(array_unique($perms)),
        'mailboxes' => $boxIds,
        'active' => $active,
        'createdAt' => date('c'),
        'updatedAt' => date('c'),
    ];
    $users[] = $user;
    if (!save_users($users)) {
        return ['ok' => false, 'error' => 'Could not save users file.'];
    }
    return ['ok' => true, 'user' => public_user_view($user)];
}

/**
 * @return array{ok:bool,error?:string,user?:array}
 */
function update_user(string $username, array $patch): array
{
    $users = load_users();
    $idx = find_user_index($users, $username);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'User not found.'];
    }
    $user = $users[$idx];
    $isRoot = user_is_root($user);

    if (array_key_exists('active', $patch)) {
        if ($isRoot && !$patch['active']) {
            return ['ok' => false, 'error' => 'The root admin account cannot be deactivated.'];
        }
        $user['active'] = (bool) $patch['active'];
    }

    if (array_key_exists('permissions', $patch) && is_array($patch['permissions'])) {
        if ($isRoot) {
            $user['permissions'] = admin_all_permission_ids();
        } else {
            $allowed = admin_all_permission_ids();
            $perms = [];
            foreach ($patch['permissions'] as $p) {
                $p = (string) $p;
                if ($p === 'users') {
                    continue;
                }
                if (in_array($p, $allowed, true)) {
                    $perms[] = $p;
                }
            }
            $user['permissions'] = array_values(array_unique($perms));
        }
    }

    if (array_key_exists('mailboxes', $patch) && is_array($patch['mailboxes'])) {
        require_once __DIR__ . '/mail.php';
        if ($isRoot) {
            $user['mailboxes'] = array_keys(mail_mailbox_catalog());
        } else {
            $user['mailboxes'] = mail_normalize_mailbox_ids($patch['mailboxes']);
            $permsNow = is_array($user['permissions'] ?? null) ? $user['permissions'] : [];
            if (!in_array('mail', $permsNow, true)) {
                $user['mailboxes'] = [];
            }
        }
    }

    if (!empty($patch['password'])) {
        // Root admin password cannot be set via Manage users — use Change password
        // (requires the current password) or the separately configured recovery endpoint.
        if ($isRoot && empty($patch['allowRootPasswordReset'])) {
            return [
                'ok' => false,
                'error' => 'Root admin password can only be changed via Change password with the current password.',
            ];
        }
        $password = (string) $patch['password'];
        $policy = validate_password_policy($password);
        if (empty($policy['ok'])) {
            return ['ok' => false, 'error' => $policy['error'] ?? 'Invalid password.'];
        }
        $hash = hash_password_secure($password);
        if ($hash === null) {
            return ['ok' => false, 'error' => 'Could not hash password.'];
        }
        $user['passwordHash'] = $hash;
        // Keep legacy hash file in sync when resetting root admin (hash only, never plaintext).
        if ($isRoot) {
            $env = getenv('ADMIN_PASSWORD_HASH');
            $envLocked = is_string($env) && $env !== '';
            if (!$envLocked) {
                @file_put_contents(ADMIN_PASSWORD_HASH_FILE, $hash . "\n", LOCK_EX);
                vsa_chmod_private(ADMIN_PASSWORD_HASH_FILE);
            }
        }
    }

    $user['updatedAt'] = date('c');
    $users[$idx] = $user;
    if (!save_users($users)) {
        return ['ok' => false, 'error' => 'Could not save users file.'];
    }
    return ['ok' => true, 'user' => public_user_view($user)];
}

/**
 * @return array{ok:bool,error?:string}
 */
function delete_user(string $username): array
{
    $users = load_users();
    $idx = find_user_index($users, $username);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'User not found.'];
    }
    if (user_is_root($users[$idx])) {
        return ['ok' => false, 'error' => 'The root admin account cannot be deleted.'];
    }
    array_splice($users, $idx, 1);
    if (!save_users($users)) {
        return ['ok' => false, 'error' => 'Could not save users file.'];
    }
    return ['ok' => true];
}

/**
 * Map content section keys to the console page permission that may edit them.
 */
function section_permission(string $section): string|false|null
{
    $map = [
        'branding' => 'site',
        'site' => 'site',
        'socials' => 'site',
        'home' => 'home',
        'team' => 'team',
        'effects' => 'team',
        'events' => 'events',
        'royale' => 'royale',
        'gallery' => 'gallery',
        'merch' => 'merch',
        'faqPage' => 'faqs',
        'faqs' => 'faqs',
        'music' => 'music',
        'links' => null,
    ];
    if (!array_key_exists($section, $map)) {
        return false;
    }
    return $map[$section];
}
