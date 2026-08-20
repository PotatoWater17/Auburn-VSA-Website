<?php
// Admin construction messages API — list / delete.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/construction.php';

require_permission_api('messages');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $items = get_construction_messages();
    // Newest first for admin.
    usort($items, static function ($a, $b) {
        return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });
    echo json_encode([
        'ok' => true,
        'items' => $items,
        'count' => count($items),
    ]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid body']);
    exit;
}

$action = (string) ($body['action'] ?? '');

if ($action === 'delete') {
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing message id']);
        exit;
    }
    $items = get_construction_messages();
    $index = construction_message_find($items, $id);
    if ($index === null) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Message not found.']);
        exit;
    }
    array_splice($items, $index, 1);
    if (!save_construction_messages($items)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not update messages.']);
        exit;
    }
    log_admin_action('messages_delete', 'Deleted construction message', [
        'meta' => ['id' => $id],
    ]);
    usort($items, static function ($a, $b) {
        return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });
    echo json_encode(['ok' => true, 'items' => $items, 'count' => count($items)]);
    exit;
}

if ($action === 'delete_all') {
    if (!save_construction_messages([])) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not clear messages.']);
        exit;
    }
    log_admin_action('messages_delete_all', 'Cleared all construction messages');
    echo json_encode(['ok' => true, 'items' => [], 'count' => 0]);
    exit;
}

if ($action === 'block_ip') {
    if (!current_user_can('blocked-ips')) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'You need Blocked IPs permission to block an address.']);
        exit;
    }
    $ip = trim((string) ($body['ip'] ?? ''));
    $result = block_ip($ip, [
        'source' => 'admin',
        'name' => (string) ($body['name'] ?? ''),
        'note' => (string) ($body['note'] ?? ''),
        'reason' => (string) ($body['reason'] ?? 'Blocked from Messages'),
        'expiresIn' => isset($body['expiresIn']) ? (int) $body['expiresIn'] : CONSTRUCTION_AUTO_BLOCK_SECONDS,
    ]);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    log_admin_action('blocked_ip_add', 'Blocked IP ' . $ip . ' from Messages', [
        'meta' => ['targetIp' => $ip, 'source' => 'messages'],
    ]);
    echo json_encode(['ok' => true, 'row' => $result['row']]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action']);
