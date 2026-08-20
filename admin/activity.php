<?php
// Admin activity / audit log API — list (filter) + optional clear (root only).
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/activity.php';

require_permission_api('activity');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $result = filter_activity_log([
        'actor' => (string) ($_GET['actor'] ?? ''),
        'action' => (string) ($_GET['action'] ?? ''),
        'q' => (string) ($_GET['q'] ?? ''),
        'limit' => (int) ($_GET['limit'] ?? 300),
    ]);
    $facets = activity_log_facets();
    echo json_encode([
        'ok' => true,
        'items' => $result['items'],
        'total' => $result['total'],
        'filtered' => $result['filtered'],
        'actors' => $facets['actors'],
        'actions' => $facets['actions'],
        'maxEntries' => defined('ACTIVITY_LOG_MAX') ? (int) ACTIVITY_LOG_MAX : 5000,
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

if ($action === 'clear') {
    if (!current_user_is_root()) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Only the root admin can clear the activity log.']);
        exit;
    }
    $before = count(get_activity_log());
    if (!save_activity_log([])) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not clear activity log.']);
        exit;
    }
    log_admin_action('activity_log_cleared', 'Cleared admin activity log (' . $before . ' entries removed)', [
        'meta' => ['removed' => $before],
    ]);
    $result = filter_activity_log(['limit' => 300]);
    $facets = activity_log_facets();
    echo json_encode([
        'ok' => true,
        'items' => $result['items'],
        'total' => $result['total'],
        'filtered' => $result['filtered'],
        'actors' => $facets['actors'],
        'actions' => $facets['actions'],
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action']);
