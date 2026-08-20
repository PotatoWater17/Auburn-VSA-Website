<?php
// Construction-mode admin preview auth (sign in / out / status).
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/construction.php';
require_once __DIR__ . '/../includes/security.php';

send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$ip = client_ip();

function construction_mode_is_on(): bool
{
    $content = get_content();
    return construction_mode_flag_on((string) ($content['site']['constructionMode'] ?? 'no'));
}

if ($method === 'GET') {
    // Ensure a session + CSRF token exist so the gate can POST safely.
    start_session();
    $on = construction_mode_is_on();
    $sessionOk = is_logged_in() && current_user() !== null;
    $preview = construction_preview_enabled();
    echo json_encode([
        'ok' => true,
        'constructionMode' => $on,
        'preview' => $preview,
        'loggedIn' => $preview,
        'adminSession' => $sessionOk,
        'username' => $sessionOk ? current_username() : '',
        'ipBlocked' => is_ip_blocked($ip),
        'csrf' => csrf_token(),
    ]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_same_origin_write();

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    $body = $_POST;
}

$csrfSent = csrf_from_request(is_array($body) ? $body : null);
if (!verify_csrf($csrfSent)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Invalid session token. Refresh and try again.']);
    exit;
}

$action = (string) ($body['action'] ?? '');

if ($action === 'logout') {
    // Return to the construction gate without ending the /admin/ CMS session.
    $was = current_username();
    if ($was !== '') {
        log_activity('construction_preview_logout', [
            'ip' => $ip,
            'username' => $was,
            'detail' => 'Returned to construction screen (admin session kept)',
        ]);
    }
    construction_return_to_gate();
    echo json_encode(['ok' => true, 'preview' => false, 'adminSession' => is_logged_in(), 'csrf' => csrf_token()]);
    exit;
}

if ($action === 'resume') {
    // Already signed into /admin/ — unlock preview without re-entering password.
    if (!construction_mode_is_on()) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Construction mode is not active.']);
        exit;
    }
    if (!is_logged_in() || current_user() === null) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Sign in with username and password.']);
        exit;
    }
    construction_enter_preview();
    log_activity('construction_preview_resume', [
        'ip' => $ip,
        'username' => current_username(),
        'detail' => 'Resumed preview from existing admin session',
    ]);
    echo json_encode([
        'ok' => true,
        'preview' => true,
        'username' => current_username(),
        'csrf' => csrf_token(),
    ]);
    exit;
}

if ($action !== 'login') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

if (!construction_mode_is_on()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Construction mode is not active.']);
    exit;
}

// Honeypot
if (trim((string) ($body['website'] ?? '')) !== '') {
    construction_login_fail($ip, 'honeypot');
    echo json_encode(['ok' => true, 'preview' => false]);
    exit;
}

if (is_ip_blocked($ip)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Unable to sign in from this network right now.']);
    exit;
}

if (construction_login_attempt_count($ip) >= CONSTRUCTION_LOGIN_MAX_ATTEMPTS) {
    http_response_code(429);
    echo json_encode([
        'ok' => false,
        'blocked' => true,
        'error' => 'Too many failed sign-in attempts. This network has been temporarily blocked.',
    ]);
    exit;
}

$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Enter username and password.']);
    exit;
}

if (!login_user($username, $password)) {
    $fail = construction_login_fail($ip, $username);
    $count = construction_login_attempt_count($ip);
    if ($count === 5 && empty($fail['blocked'])) {
        add_security_message(
            'Suspicious construction-gate sign-in activity from IP ' . $ip .
            ' (' . $count . ' failed attempts; last username “' . $username . '”).',
            [
                'ip' => $ip,
                'name' => 'System',
                'source' => 'Security · Failed logins',
            ]
        );
    }
    http_response_code(!empty($fail['blocked']) ? 429 : 401);
    echo json_encode([
        'ok' => false,
        'error' => $fail['error'] ?? 'Incorrect username or password.',
        'blocked' => !empty($fail['blocked']),
    ]);
    exit;
}

construction_login_clear_attempts($ip);
construction_enter_preview();

log_activity('construction_preview_login', [
    'ip' => $ip,
    'username' => current_username(),
    'detail' => 'Admin preview unlocked while site is under construction',
]);

echo json_encode([
    'ok' => true,
    'preview' => true,
    'username' => current_username(),
    'csrf' => csrf_token(),
]);
