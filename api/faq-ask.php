<?php
// Public FAQ question submission — stores pending items in data/faq_inbox.json.
require_once __DIR__ . '/../includes/faq_inbox.php';
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

if (is_ip_blocked()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Unable to submit from this network right now.']);
    exit;
}

$rate = public_api_rate_check('faq-ask');
if (empty($rate['ok'])) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => $rate['error'] ?? 'Too many requests.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '', true);
if (!is_array($body)) {
    $body = $_POST;
}

// Honeypot — bots fill this; humans never see it.
if (trim((string) ($body['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true, 'message' => 'Thanks! Your question was submitted.']);
    exit;
}

$question = trim((string) ($body['question'] ?? ''));
$name = trim((string) ($body['name'] ?? ''));
$email = trim((string) ($body['email'] ?? ''));

if ($question === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a question.']);
    exit;
}

$len = function_exists('mb_strlen') ? mb_strlen($question) : strlen($question);
if ($len > 500) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please keep your question under 500 characters.']);
    exit;
}
$nameLen = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
if ($nameLen > 80) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Name is too long.']);
    exit;
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email, or leave it blank.']);
    exit;
}

$inbox = get_faq_inbox();

// Soft rate limit: same question text within the last hour.
$now = time();
$norm = function_exists('mb_strtolower') ? mb_strtolower($question) : strtolower($question);
foreach ($inbox as $item) {
    $prevRaw = trim((string) ($item['question'] ?? ''));
    $prev = function_exists('mb_strtolower') ? mb_strtolower($prevRaw) : strtolower($prevRaw);
    $ts = strtotime((string) ($item['createdAt'] ?? '')) ?: 0;
    if ($prev === $norm && ($now - $ts) < 3600) {
        echo json_encode(['ok' => true, 'message' => 'Thanks! We already have this question and will review it soon.']);
        exit;
    }
}

$inbox[] = [
    'id' => bin2hex(random_bytes(8)),
    'question' => $question,
    'name' => $name,
    'email' => $email === '' ? '' : strtolower($email),
    'createdAt' => date('c'),
];

if (!save_faq_inbox($inbox)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not save your question. Try again.']);
    exit;
}

require_once __DIR__ . '/../includes/activity.php';
log_activity('public_faq_ask', [
    'username' => 'public',
    'role' => 'public',
    'detail' => 'Public FAQ question submitted',
    'meta' => [
        'hasName' => $name !== '',
        'hasEmail' => $email !== '',
    ],
]);

echo json_encode(['ok' => true, 'message' => 'Thanks! Your question was submitted for review.']);
