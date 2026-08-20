<?php
// Refresh CSRF for the open Admin tab (no CSRF required — session auth only).
require_once __DIR__ . '/../includes/auth.php';

@ini_set('display_errors', '0');
send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!is_logged_in() || !current_user()) {
    admin_json_response(['ok' => false, 'error' => 'Unauthorized'], 401);
}

admin_json_response([
    'ok' => true,
    'csrf' => csrf_token(),
    'username' => current_username(),
]);
