<?php
// Public construction-mode message submission.
require_once __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/construction.php';
require_once __DIR__ . '/../includes/security.php';

send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_same_origin_write();

$content = get_content();
$mode = strtolower((string) ($content['site']['constructionMode'] ?? 'no'));
if (!construction_mode_flag_on($mode)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'The site is not in construction mode.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '', true);
if (!is_array($body)) {
    $body = $_POST;
}

$ip = client_ip();

if (is_ip_blocked($ip)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Unable to send a message from this network right now.']);
    exit;
}

// Honeypot — bots fill this; humans never see it.
if (trim((string) ($body['website'] ?? '')) !== '') {
    construction_rate_hit($ip);
    echo json_encode(['ok' => true, 'message' => 'Thanks! We received your message.']);
    exit;
}

$rate = construction_rate_hit($ip);
if (empty($rate['ok'])) {
    http_response_code(429);
    echo json_encode([
        'ok' => false,
        'error' => $rate['error'] ?? 'Too many messages. Please try again later.',
        'blocked' => !empty($rate['blocked']),
    ]);
    exit;
}

$result = add_construction_message(
    (string) ($body['message'] ?? ''),
    (string) ($body['name'] ?? ''),
    (string) ($body['email'] ?? ''),
    $ip
);

if (empty($result['ok'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Could not save message.']);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Thanks! We received your message.']);
