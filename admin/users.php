<?php
// Admin users API — list / create / update / reset / delete (root or users permission).
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/users.php';

require_permission_api('users');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $users = array_map('public_user_view', load_users());
    echo json_encode([
        'ok' => true,
        'catalog' => admin_permission_catalog(),
        'users' => $users,
        'me' => current_username(),
        'isRoot' => current_user_is_root(),
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

if ($action === 'create') {
    $result = create_user(
        (string) ($body['username'] ?? ''),
        (string) ($body['password'] ?? ''),
        is_array($body['permissions'] ?? null) ? $body['permissions'] : [],
        !isset($body['active']) || !empty($body['active']),
        is_array($body['mailboxes'] ?? null) ? $body['mailboxes'] : []
    );
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    $created = (string) ($result['user']['username'] ?? $body['username'] ?? '');
    log_admin_action('user_create', 'Created user “' . $created . '”', [
        'meta' => ['targetUser' => $created],
    ]);
    echo json_encode(['ok' => true, 'user' => $result['user'], 'users' => array_map('public_user_view', load_users())]);
    exit;
}

if ($action === 'update') {
    $username = (string) ($body['username'] ?? '');
    $patch = [];
    if (array_key_exists('permissions', $body)) {
        $patch['permissions'] = $body['permissions'];
    }
    if (array_key_exists('mailboxes', $body)) {
        $patch['mailboxes'] = is_array($body['mailboxes']) ? $body['mailboxes'] : [];
    }
    if (array_key_exists('active', $body)) {
        $patch['active'] = !empty($body['active']);
    }
    if (!empty($body['password'])) {
        $patch['password'] = (string) $body['password'];
    }
    $result = update_user($username, $patch);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    $bits = [];
    if (array_key_exists('permissions', $body)) {
        $bits[] = 'permissions';
    }
    if (array_key_exists('mailboxes', $body)) {
        $bits[] = 'mailboxes';
    }
    if (array_key_exists('active', $body)) {
        $bits[] = !empty($body['active']) ? 'activated' : 'deactivated';
    }
    if (!empty($body['password'])) {
        $bits[] = 'password reset';
    }
    log_admin_action('user_update', 'Updated user “' . $username . '”' . ($bits ? ' (' . implode(', ', $bits) . ')' : ''), [
        'meta' => [
            'targetUser' => $username,
            'changed' => $bits,
        ],
    ]);
    echo json_encode(['ok' => true, 'user' => $result['user'], 'users' => array_map('public_user_view', load_users())]);
    exit;
}

if ($action === 'delete') {
    $target = (string) ($body['username'] ?? '');
    $result = delete_user($target);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    log_admin_action('user_delete', 'Deleted user “' . $target . '”', [
        'meta' => ['targetUser' => $target],
    ]);
    echo json_encode(['ok' => true, 'users' => array_map('public_user_view', load_users())]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action']);
