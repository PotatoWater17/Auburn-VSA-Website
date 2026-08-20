<?php
// Public newsletter signup / token unsubscribe — data/newsletters.json.
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/construction.php';
require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/newsletter_list.php';
require_once __DIR__ . '/../includes/activity.php';

send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Lookup masked email for a token (for the unsubscribe confirm UI).
if ($method === 'GET') {
    $token = strtolower(trim((string) ($_GET['t'] ?? $_GET['token'] ?? '')));
    if ($token === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing unsubscribe token.']);
        exit;
    }
    $row = newsletter_list_find_by_token($token);
    if ($row === null) {
        // Do not reveal whether the token was ever valid.
        echo json_encode([
            'ok' => true,
            'found' => false,
            'message' => 'This unsubscribe link is invalid or already used.',
        ]);
        exit;
    }
    echo json_encode([
        'ok' => true,
        'found' => true,
        'emailMasked' => newsletter_list_mask_email((string) ($row['email'] ?? '')),
    ]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_same_origin_write();

if (is_ip_blocked()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Unable to update newsletter preferences from this network right now.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '', true);
if (!is_array($body)) {
    $body = $_POST;
}

// Honeypot — bots fill this; humans never see it.
// Do not return a partial "ok" shape that the public form treats as confirmed.
$honeypot = trim((string) ($body['vsa_hp'] ?? $body['website'] ?? ''));
if ($honeypot !== '') {
    echo json_encode([
        'ok' => true,
        'confirmed' => false,
        'queued' => false,
        'message' => 'Thanks! Your request was received.',
    ]);
    exit;
}

$action = strtolower(trim((string) ($body['action'] ?? 'subscribe')));

if ($action === 'unsubscribe') {
    $token = strtolower(trim((string) ($body['token'] ?? $body['t'] ?? '')));
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $emailConfirm = strtolower(trim((string) ($body['emailConfirm'] ?? $body['confirm'] ?? '')));

    if ($token !== '') {
        // Rate after we know this is a real token attempt (not a blank form).
        $rate = public_api_rate_check(
            'newsletter_unsub',
            '',
            NEWSLETTER_UNSUB_RATE_LIMIT,
            NEWSLETTER_UNSUB_RATE_WINDOW
        );
        if (empty($rate['ok'])) {
            $retry = (int) ($rate['retryAfter'] ?? NEWSLETTER_UNSUB_RATE_WINDOW);
            newsletter_unsub_rate_lockout('', $retry);
            http_response_code(429);
            header('Retry-After: ' . max(1, $retry));
            echo json_encode([
                'ok' => false,
                'error' => 'Too many unsubscribe attempts from this network. Please try again after 12 hours.',
            ]);
            exit;
        }
        if (is_newsletter_unsub_cooldown()) {
            http_response_code(429);
            header('Retry-After: ' . (int) NEWSLETTER_UNSUB_RATE_WINDOW);
            echo json_encode([
                'ok' => false,
                'error' => 'Too many unsubscribe attempts from this network. Please try again after 12 hours.',
            ]);
            exit;
        }

        $result = newsletter_list_remove_by_token($token);
        if (empty($result['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Could not unsubscribe.']);
            exit;
        }
        if (!empty($result['removed'])) {
            log_activity('public_newsletter_unsubscribe', [
                'username' => 'public',
                'role' => 'public',
                'detail' => 'Public newsletter unsubscribe (token)',
                'meta' => [
                    'email' => (string) ($result['email'] ?? ''),
                    'via' => 'token',
                ],
            ]);
        }
        echo json_encode([
            'ok' => true,
            'message' => 'You are unsubscribed. You will not receive future VSA newsletters at this address.',
        ]);
        exit;
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
        exit;
    }
    if ($emailConfirm === '' || $emailConfirm !== $email) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Email confirmation does not match.']);
        exit;
    }

    // Rate only after validation — typos / blank submits must not lock the IP out.
    // Max 5 attempts per IP, then 12-hour cooldown (+ admin Blocked IPs / Messages).
    $rate = public_api_rate_check(
        'newsletter_unsub',
        '',
        NEWSLETTER_UNSUB_RATE_LIMIT,
        NEWSLETTER_UNSUB_RATE_WINDOW
    );
    if (empty($rate['ok'])) {
        $retry = (int) ($rate['retryAfter'] ?? NEWSLETTER_UNSUB_RATE_WINDOW);
        newsletter_unsub_rate_lockout('', $retry);
        http_response_code(429);
        header('Retry-After: ' . max(1, $retry));
        echo json_encode([
            'ok' => false,
            'error' => 'Too many unsubscribe attempts from this network. Please try again after 12 hours.',
        ]);
        exit;
    }
    if (is_newsletter_unsub_cooldown()) {
        http_response_code(429);
        header('Retry-After: ' . (int) NEWSLETTER_UNSUB_RATE_WINDOW);
        echo json_encode([
            'ok' => false,
            'error' => 'Too many unsubscribe attempts from this network. Please try again after 12 hours.',
        ]);
        exit;
    }

    // Do NOT remove immediately — queue for admin approval (stops scripted mass unsub).
    $queued = newsletter_unsub_request_add($email);
    if (empty($queued['ok']) || empty($queued['confirmed'])) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => $queued['error'] ?? 'Could not confirm your request was saved for admin review. Try again.',
        ]);
        exit;
    }

    if (!empty($queued['queued'])) {
        log_activity('public_newsletter_unsub_request', [
            'username' => 'public',
            'role' => 'public',
            'detail' => 'Public newsletter unsubscribe request (pending admin)',
            'meta' => [
                'email' => $email,
                'requestId' => (string) ($queued['requestId'] ?? ''),
            ],
        ]);
    }

    echo json_encode([
        'ok' => true,
        'confirmed' => true,
        'queued' => !empty($queued['queued']),
        'requestId' => (string) ($queued['requestId'] ?? ''),
        'message' => $queued['message'] ?? 'Request received by Auburn VSA for admin review.',
    ]);
    exit;
}

if ($action !== 'subscribe') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

$rate = public_api_rate_check('newsletter');
if (empty($rate['ok'])) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => $rate['error'] ?? 'Too many requests.']);
    exit;
}

$email = trim((string) ($body['email'] ?? ''));
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}
$email = strtolower($email);

$list = newsletter_list_ensure_tokens();
foreach ($list as $entry) {
    if (($entry['email'] ?? '') === $email) {
        echo json_encode(['ok' => true, 'message' => 'You are already subscribed.']);
        exit;
    }
}

$list[] = [
    'email' => $email,
    'ts' => date('c'),
    'token' => newsletter_list_new_token(),
];

if (!newsletter_list_save($list)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not save subscription.']);
    exit;
}

log_activity('public_newsletter_subscribe', [
    'username' => 'public',
    'role' => 'public',
    'detail' => 'Public newsletter signup',
    'meta' => ['email' => $email],
]);

echo json_encode(['ok' => true, 'message' => 'Thanks! You have been added to the list.']);
