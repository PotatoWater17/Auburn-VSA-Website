<?php
// Admin blocked IPs API — list / add / update / remove / clear expired.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/construction.php';

require_permission_api('blocked-ips');

/**
 * Sort: active first, then newest blockedAt.
 *
 * @param list<array> $items
 * @return list<array>
 */
function sort_blocked_ip_views(array $items): array
{
    usort($items, static function ($a, $b) {
        $aActive = !empty($a['active']) ? 1 : 0;
        $bActive = !empty($b['active']) ? 1 : 0;
        if ($aActive !== $bActive) {
            return $bActive - $aActive;
        }
        return strcmp((string) ($b['blockedAt'] ?? ''), (string) ($a['blockedAt'] ?? ''));
    });
    return $items;
}

function blocked_ips_timezone_meta(): array
{
    $tz = date_default_timezone_get();
    return [
        'timezone' => $tz,
        'timezoneLabel' => $tz . ' (UTC' . date('P') . ')',
        'serverNow' => date('c'),
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $items = sort_blocked_ip_views(array_map('public_blocked_ip_view', get_blocked_ips()));
    $active = 0;
    foreach ($items as $row) {
        if (!empty($row['active'])) {
            $active++;
        }
    }
    echo json_encode(array_merge(
        ['ok' => true, 'items' => $items, 'count' => count($items), 'activeCount' => $active],
        blocked_ips_timezone_meta()
    ));
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

if ($action === 'add') {
    $opts = [
        'source' => 'admin',
        'name' => (string) ($body['name'] ?? ''),
        'note' => (string) ($body['note'] ?? ''),
        'reason' => (string) ($body['reason'] ?? 'Manually blocked'),
    ];
    if (array_key_exists('expiresIn', $body)) {
        $opts['expiresIn'] = (int) $body['expiresIn'];
    } elseif (array_key_exists('expiresAt', $body)) {
        $opts['expiresAt'] = $body['expiresAt'];
    } else {
        $opts['expiresIn'] = CONSTRUCTION_AUTO_BLOCK_SECONDS;
    }
    $result = block_ip((string) ($body['ip'] ?? ''), $opts);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    $blockedIp = (string) ($result['row']['ip'] ?? $body['ip'] ?? '');
    log_admin_action('blocked_ip_add', 'Blocked IP ' . $blockedIp, [
        'meta' => [
            'targetIp' => $blockedIp,
            'updated' => !empty($result['updated']),
        ],
    ]);
    $items = sort_blocked_ip_views(array_map('public_blocked_ip_view', get_blocked_ips()));
    echo json_encode([
        'ok' => true,
        'row' => $result['row'],
        'updated' => !empty($result['updated']),
        'items' => $items,
    ]);
    exit;
}

if ($action === 'update') {
    $patch = [];
    foreach (['name', 'note', 'reason', 'expiresAt', 'expiresIn'] as $k) {
        if (array_key_exists($k, $body)) {
            $patch[$k] = $body[$k];
        }
    }
    $targetIp = (string) ($body['ip'] ?? '');
    $result = update_blocked_ip($targetIp, $patch);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    log_admin_action('blocked_ip_update', 'Updated blocked IP ' . $targetIp, [
        'meta' => [
            'targetIp' => $targetIp,
            'fields' => array_keys($patch),
        ],
    ]);
    $items = sort_blocked_ip_views(array_map('public_blocked_ip_view', get_blocked_ips()));
    echo json_encode(['ok' => true, 'row' => $result['row'], 'items' => $items]);
    exit;
}

if ($action === 'remove') {
    $targetIp = (string) ($body['ip'] ?? '');
    $wasUnsubCooldown = false;
    foreach (get_blocked_ips() as $row) {
        if (($row['ip'] ?? '') === $targetIp && (string) ($row['source'] ?? '') === 'unsub_cooldown') {
            $wasUnsubCooldown = true;
            break;
        }
    }
    $result = unblock_ip($targetIp);
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    // Clearing the rate bucket lets them try unsubscribe again immediately.
    if ($wasUnsubCooldown && function_exists('public_api_rate_clear')) {
        public_api_rate_clear('newsletter_unsub', $targetIp);
    }
    log_admin_action('blocked_ip_remove', 'Removed blocked IP ' . $targetIp, [
        'meta' => [
            'targetIp' => $targetIp,
            'clearedUnsubRate' => $wasUnsubCooldown,
        ],
    ]);
    $items = sort_blocked_ip_views(array_map('public_blocked_ip_view', get_blocked_ips()));
    echo json_encode(['ok' => true, 'items' => $items, 'count' => count($items)]);
    exit;
}

if ($action === 'clear_expired') {
    $result = clear_expired_blocked_ips();
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }
    $removed = (int) ($result['removed'] ?? 0);
    log_admin_action('blocked_ip_clear_expired', 'Cleared ' . $removed . ' expired blocked IP(s)', [
        'meta' => ['removed' => $removed],
    ]);
    $items = sort_blocked_ip_views(array_map('public_blocked_ip_view', get_blocked_ips()));
    echo json_encode([
        'ok' => true,
        'removed' => $removed,
        'items' => $items,
        'count' => count($items),
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action']);
