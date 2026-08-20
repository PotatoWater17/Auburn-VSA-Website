<?php
// Admin scheduled-publish API — list / cancel / enqueue batch.

require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/publish.php';

require_admin_api();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $pending = publish_list_pending();
    admin_json_response(['ok' => true, 'pending' => $pending]);
}

if ($method !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw !== false ? $raw : '', true);
if (!is_array($body)) {
    admin_json_response(['ok' => false, 'error' => 'Invalid body'], 400);
}

$action = strtolower(trim((string) ($body['action'] ?? '')));

if ($action === 'cancel') {
    $id = (string) ($body['id'] ?? '');
    $result = publish_cancel($id);
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Cancel failed'], 400);
    }
    log_admin_action('publish_cancel', 'Cancelled scheduled publish', [
        'meta' => ['id' => $id],
    ]);
    admin_json_response([
        'ok' => true,
    ]);
}

if ($action === 'enqueue') {
    $pageId = (string) ($body['page'] ?? '');
    $at = (string) ($body['at'] ?? '');
    $incoming = is_array($body['sections'] ?? null) ? $body['sections'] : [];
    if ($incoming === []) {
        admin_json_response(['ok' => false, 'error' => 'No sections to schedule.'], 400);
    }

    $linkKeysByPage = [
        'home' => ['learnMore', 'join'],
        'royale' => ['purchaseTickets'],
    ];

    $prepared = [];
    foreach ($incoming as $section => $value) {
        if (!in_array($section, CONTENT_SECTIONS, true)) {
            admin_json_response(['ok' => false, 'error' => 'Unknown section: ' . $section], 400);
        }
        $perm = section_permission($section);
        if ($perm === false) {
            admin_json_response(['ok' => false, 'error' => 'Unknown section'], 400);
        }

        if ($section === 'links') {
            if ($pageId === '' || !current_user_can($pageId)) {
                admin_json_response(['ok' => false, 'error' => 'You do not have permission to schedule these links.'], 403);
            }
            $allowed = $linkKeysByPage[$pageId] ?? [];
            if (!$allowed) {
                admin_json_response(['ok' => false, 'error' => 'This page cannot edit site links.'], 403);
            }
            $patch = [];
            $src = is_array($value) ? $value : [];
            foreach ($allowed as $key) {
                if (array_key_exists($key, $src)) {
                    $url = trim((string) $src[$key]);
                    $patch[$key] = is_safe_public_url($url) ? $url : '';
                }
            }
            $prepared['links'] = $patch;
            continue;
        }

        if ($perm !== null && !current_user_can($perm)) {
            admin_json_response(['ok' => false, 'error' => 'You do not have permission to schedule “' . $section . '”.'], 403);
        }
        if (is_array($value)) {
            $value = sanitize_cms_urls($value);
        }
        if ($section === 'branding') {
            if (!is_array($value)) {
                $value = [];
            }
            $logo = trim((string) ($value['logo'] ?? ''));
            if ($logo !== '' && !is_safe_media_url($logo)) {
                admin_json_response(['ok' => false, 'error' => 'Logo URL is not allowed.'], 400);
            }
            $value = ['logo' => $logo];
        }
        $prepared[$section] = $value;
    }

    $result = publish_enqueue($prepared, $at, [
        'page' => $pageId,
        'username' => current_username(),
    ]);
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not schedule.'], 400);
    }

    log_admin_action('publish_schedule', 'Scheduled page publish', [
        'meta' => [
            'page' => $pageId,
            'sections' => array_keys($prepared),
            'publishAt' => $at,
            'id' => $result['id'] ?? '',
        ],
    ]);

    admin_json_response([
        'ok' => true,
        'publishMode' => 'schedule',
        'scheduleId' => $result['id'] ?? '',
        'publishAt' => $result['item']['publishAt'] ?? $at,
        'pending' => publish_list_pending(),
    ]);
}

admin_json_response(['ok' => false, 'error' => 'Unknown action'], 400);
