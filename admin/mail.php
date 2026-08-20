<?php
// Admin Mail API — inbound list / read / archive / soft-delete (trash).
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/mail.php';

require_permission_api('mail');

$user = current_user();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$allowedBoxes = mail_user_mailbox_ids($user);

if ($method === 'GET') {
    $action = (string) ($_GET['action'] ?? 'list');
    if ($action === 'status') {
        $st = mail_status();
        $payload = [
            'ok' => true,
            'status' => $st,
            'unreadCount' => mail_unread_count_for_user($user),
            'mailboxes' => array_values(array_map(static function ($id) {
                return mail_mailbox_catalog()[$id];
            }, $allowedBoxes)),
            'allMailboxes' => array_values(mail_mailbox_catalog()),
        ];
        // Root needs the webhook secret once to configure the Cloudflare Worker.
        if (current_user_is_root()) {
            $payload['inboundSecret'] = mail_ensure_inbound_secret();
            $payload['inboundUrl'] = '../api/mail-inbound.php';
        }
        echo json_encode($payload);
        exit;
    }

    $mailbox = strtolower(trim((string) ($_GET['mailbox'] ?? ($allowedBoxes[0] ?? ''))));
    if ($mailbox === '' || !mail_user_can_mailbox($user, $mailbox)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'No access to that mailbox.']);
        exit;
    }
    $folder = strtolower(trim((string) ($_GET['folder'] ?? 'inbox')));
    if (!mail_is_valid_folder($folder)) {
        $folder = 'inbox';
    }
    $id = trim((string) ($_GET['id'] ?? ''));
    $store = mail_load_mailbox($mailbox);
    if ($id !== '') {
        $msg = mail_find_message($mailbox, $id);
        if ($msg === null) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Message not found.']);
            exit;
        }
        if (empty($msg['read'])) {
            mail_patch_message($mailbox, $id, ['read' => true]);
            $msg['read'] = true;
        }
        echo json_encode(['ok' => true, 'message' => $msg]);
        exit;
    }

    $items = [];
    foreach ($store['messages'] as $m) {
        if (($m['folder'] ?? 'inbox') !== $folder) {
            continue;
        }
        $items[] = [
            'id' => $m['id'] ?? '',
            'mailbox' => $mailbox,
            'folder' => $folder,
            'from' => $m['from'] ?? '',
            'to' => $m['to'] ?? [],
            'cc' => $m['cc'] ?? [],
            'subject' => $m['subject'] ?? '',
            'date' => $m['date'] ?? '',
            'read' => !empty($m['read']),
            'preview' => mb_substr(preg_replace('/\s+/', ' ', (string) ($m['text'] ?? '')) ?? '', 0, 140),
        ];
    }
    usort($items, static function ($a, $b) {
        return strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? ''));
    });
    echo json_encode([
        'ok' => true,
        'mailbox' => $mailbox,
        'folder' => $folder,
        'items' => $items,
        'count' => count($items),
        'unreadCount' => mail_unread_count_for_user($user),
        'status' => mail_status(),
        'mailboxes' => array_values(array_map(static function ($id) {
            return mail_mailbox_catalog()[$id];
        }, $allowedBoxes)),
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
$mailbox = strtolower(trim((string) ($body['mailbox'] ?? '')));
if ($mailbox === '' || !mail_user_can_mailbox($user, $mailbox)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'No access to that mailbox.']);
    exit;
}

$id = trim((string) ($body['id'] ?? ''));
if ($id === '' && in_array($action, ['mark', 'archive', 'unarchive', 'trash', 'delete', 'restore'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing message id']);
    exit;
}

if ($action === 'mark') {
    $result = mail_patch_message($mailbox, $id, ['read' => !empty($body['read'])]);
} elseif ($action === 'archive') {
    $result = mail_set_folder($mailbox, $id, 'archive');
} elseif ($action === 'unarchive') {
    $result = mail_set_folder($mailbox, $id, 'inbox');
} elseif ($action === 'trash' || $action === 'delete') {
    // Soft delete — message stays in storage under Trash.
    $result = mail_soft_delete($mailbox, $id);
} elseif ($action === 'restore') {
    $result = mail_restore_message($mailbox, $id);
} else {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

if (empty($result['ok'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Update failed']);
    exit;
}
echo json_encode(['ok' => true, 'message' => $result['message']]);
