<?php
/**
 * Cloudflare Email Worker webhook — store inbound messages for Admin Mail.
 * Auth: Authorization: Bearer <MAIL_INBOUND_SECRET> or X-Mail-Secret header.
 */
declare(strict_types=1);

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/mail.php';
require_once __DIR__ . '/../includes/security.php';

send_security_headers(true);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$secret = mail_inbound_secret();
if ($secret === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Inbound secret not configured.']);
    exit;
}

$auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
$hdr = (string) ($_SERVER['HTTP_X_MAIL_SECRET'] ?? '');
$token = '';
if (preg_match('/^Bearer\s+(\S+)/i', $auth, $m)) {
    $token = $m[1];
} elseif ($hdr !== '') {
    $token = $hdr;
}
if ($token === '' || !hash_equals($secret, $token)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

$raw = (string) file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$toRaw = $body['to'] ?? '';
if (is_array($toRaw)) {
    $toList = mail_parse_address_list(implode(',', array_map('strval', $toRaw)));
} else {
    $toList = mail_parse_address_list((string) $toRaw);
}
$mailbox = strtolower(trim((string) ($body['mailbox'] ?? '')));
if ($mailbox === '' || !mail_is_valid_mailbox($mailbox)) {
    foreach ($toList as $addr) {
        $resolved = mail_resolve_mailbox_from_recipient($addr);
        if ($resolved !== null) {
            $mailbox = $resolved;
            break;
        }
    }
}
if ($mailbox === '' || !mail_is_valid_mailbox($mailbox)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Could not map recipient to a mailbox.']);
    exit;
}

$result = mail_store_message([
    'mailbox' => $mailbox,
    'folder' => 'inbox',
    'from' => (string) ($body['from'] ?? ''),
    'to' => $toList,
    'cc' => $body['cc'] ?? [],
    'subject' => (string) ($body['subject'] ?? ''),
    'text' => (string) ($body['text'] ?? ''),
    'html' => (string) ($body['html'] ?? ''),
    'date' => (string) ($body['date'] ?? ''),
    'inReplyTo' => (string) ($body['inReplyTo'] ?? ''),
    'references' => (string) ($body['references'] ?? ''),
    'messageId' => (string) ($body['messageId'] ?? ''),
    'read' => false,
]);

if (empty($result['ok'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Store failed']);
    exit;
}

echo json_encode([
    'ok' => true,
    'mailbox' => $mailbox,
    'id' => $result['message']['id'] ?? '',
    'duplicate' => !empty($result['duplicate']),
]);
