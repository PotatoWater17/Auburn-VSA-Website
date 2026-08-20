<?php
// Lightweight health / uptime probe — for Admin dashboard and external monitors.
// GET returns JSON; records a heartbeat so downtime gaps can be detected later.
require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/uptime.php';

send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

uptime_heartbeat(true);
$status = uptime_status();

echo json_encode([
    'ok' => true,
    'at' => date('c'),
    'status' => $status['status'],
    'statusLabel' => $status['statusLabel'],
    'lastSeen' => $status['lastSeen'],
    'continuousSeconds' => $status['continuousSeconds'],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
