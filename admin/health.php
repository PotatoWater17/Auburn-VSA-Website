<?php
// Admin health API — read/clear the application error log. Root only:
// entries contain server file paths.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/errorlog.php';
require_once __DIR__ . '/../includes/activity.php';

start_session();
require_admin_api();

if (!current_user_is_root()) {
    admin_json_response(['ok' => false, 'error' => 'Owner access required.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    admin_json_response([
        'ok' => true,
        'errors' => vsa_recent_errors(20),
    ]);
}

if ($method !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode((string) file_get_contents('php://input'), true);
$action = is_array($input) ? (string) ($input['action'] ?? '') : '';

if ($action !== 'clear') {
    admin_json_response(['ok' => false, 'error' => 'Unknown action.'], 400);
}

if (!vsa_clear_error_log()) {
    admin_json_response(['ok' => false, 'error' => 'Could not clear the error log.'], 500);
}

log_admin_action('health_clear_errors', 'Cleared the site error log');
admin_json_response(['ok' => true, 'errors' => []]);
