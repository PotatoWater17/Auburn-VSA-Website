<?php
require __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/users.php';
require_once __DIR__ . '/../includes/media_library.php';
require_once __DIR__ . '/../includes/activity.php';

require_admin_api();

/**
 * Media tab: any editor who can touch content/site/backup, or explicit media perm.
 */
function media_library_allowed(): bool
{
    if (current_user_is_root() || current_user_can('media')) {
        return true;
    }
    if (current_user_can('site') || current_user_can('backup')) {
        return true;
    }
    foreach (['home', 'team', 'events', 'royale', 'gallery', 'merch', 'faqs'] as $perm) {
        if (current_user_can($perm)) {
            return true;
        }
    }
    return false;
}

if (!media_library_allowed()) {
    admin_json_response(['ok' => false, 'error' => 'You do not have permission to view the media library.'], 403);
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    $action = strtolower(trim((string) ($_GET['action'] ?? 'list')));

    if ($action === 'list') {
        $payload = media_library_payload();
        admin_json_response(array_merge(['ok' => true], $payload));
    }

    if ($action === 'stats') {
        $payload = media_library_payload();
        admin_json_response([
            'ok' => true,
            'count' => $payload['count'],
            'used' => $payload['used'],
            'unused' => $payload['unused'],
        ]);
    }

    if ($action === 'usage') {
        $name = media_safe_basename((string) ($_GET['name'] ?? ''));
        if ($name === null) {
            admin_json_response(['ok' => false, 'error' => 'Invalid file name.'], 400);
        }
        $path = UPLOADS_DIR . DIRECTORY_SEPARATOR . $name;
        if (!is_file($path)) {
            admin_json_response(['ok' => false, 'error' => 'File not found.'], 404);
        }
        $index = media_usage_index();
        $usages = $index[$name] ?? [];
        admin_json_response([
            'ok' => true,
            'name' => $name,
            'url' => UPLOADS_URL . '/' . $name,
            'mtime' => (int) filemtime($path),
            'size' => (int) filesize($path),
            'usageCount' => count($usages),
            'usages' => $usages,
        ]);
    }

    admin_json_response(['ok' => false, 'error' => 'Unknown action'], 400);
}

if ($method !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    admin_json_response(['ok' => false, 'error' => 'Invalid body'], 400);
}

$action = strtolower(trim((string) ($body['action'] ?? '')));

if ($action === 'delete') {
    $result = media_delete_image((string) ($body['name'] ?? ''));
    if (empty($result['ok'])) {
        $err = (string) ($result['error'] ?? 'Delete failed.');
        $status = $err === 'File not found.' ? 404 : 400;
        admin_json_response(['ok' => false, 'error' => $err], $status);
    }
    log_admin_action('media_deleted', 'Deleted upload ' . ($result['name'] ?? ''), [
        'detail' => 'Deleted upload ' . ($result['name'] ?? '') .
            ((int) ($result['usageCount'] ?? 0) > 0
                ? ' (was referenced in ' . (int) $result['usageCount'] . ' place(s))'
                : ' (unused)'),
        'name' => $result['name'] ?? '',
        'usageCount' => (int) ($result['usageCount'] ?? 0),
    ]);
    admin_json_response([
        'ok' => true,
        'name' => $result['name'],
        'url' => $result['url'],
        'usageCount' => (int) ($result['usageCount'] ?? 0),
    ]);
}

if ($action === 'delete_many') {
    $names = $body['names'] ?? null;
    if (!is_array($names) || !$names) {
        admin_json_response(['ok' => false, 'error' => 'No files selected.'], 400);
    }
    if (count($names) > 200) {
        admin_json_response(['ok' => false, 'error' => 'Too many files at once (max 200).'], 400);
    }
    $result = media_delete_images($names);
    $deleted = $result['deleted'] ?? [];
    $failed = $result['failed'] ?? [];
    if ($deleted) {
        log_admin_action(
            'media_deleted_bulk',
            'Deleted ' . count($deleted) . ' upload(s)',
            [
                'detail' => 'Bulk deleted ' . count($deleted) . ' file(s)' .
                    ($failed ? '; ' . count($failed) . ' failed' : ''),
                'names' => $deleted,
                'failedCount' => count($failed),
            ]
        );
    }
    if (!$deleted && $failed) {
        admin_json_response([
            'ok' => false,
            'error' => (string) ($failed[0]['error'] ?? 'Delete failed.'),
            'deleted' => [],
            'failed' => $failed,
            'deletedCount' => 0,
        ], 400);
    }
    admin_json_response([
        'ok' => true,
        'deleted' => $deleted,
        'failed' => $failed,
        'deletedCount' => count($deleted),
    ]);
}

if ($action === 'rename') {
    $result = media_rename_image((string) ($body['name'] ?? ''), (string) ($body['newName'] ?? ''));
    if (empty($result['ok'])) {
        $err = (string) ($result['error'] ?? 'Rename failed.');
        $status = str_contains($err, 'not found') ? 404 : 400;
        admin_json_response(['ok' => false, 'error' => $err], $status);
    }
    log_admin_action('media_renamed', 'Renamed upload ' . ($result['oldName'] ?? '') . ' → ' . ($result['name'] ?? ''), [
        'detail' => 'Renamed ' . ($result['oldName'] ?? '') . ' to ' . ($result['name'] ?? '') .
            ' (updated ' . (int) ($result['rewritten'] ?? 0) . ' reference(s))',
        'oldName' => $result['oldName'] ?? '',
        'name' => $result['name'] ?? '',
        'rewritten' => (int) ($result['rewritten'] ?? 0),
        'usageCount' => (int) ($result['usageCount'] ?? 0),
    ]);
    admin_json_response([
        'ok' => true,
        'oldName' => $result['oldName'],
        'name' => $result['name'],
        'url' => $result['url'],
        'rewritten' => (int) ($result['rewritten'] ?? 0),
        'usageCount' => (int) ($result['usageCount'] ?? 0),
    ]);
}

if ($action === 'retarget') {
    $paths = $body['paths'] ?? null;
    if ($paths !== null && !is_array($paths)) {
        admin_json_response(['ok' => false, 'error' => 'Invalid places list.'], 400);
    }
    $pathList = null;
    if (is_array($paths)) {
        $pathList = [];
        foreach ($paths as $p) {
            $p = trim((string) $p);
            if ($p !== '') {
                $pathList[] = $p;
            }
        }
    }
    $deleteFrom = !empty($body['deleteFrom']);
    $result = media_retarget_usages(
        (string) ($body['from'] ?? $body['name'] ?? ''),
        (string) ($body['to'] ?? ''),
        $pathList,
        $deleteFrom
    );
    if (empty($result['ok'])) {
        $err = (string) ($result['error'] ?? 'Replace failed.');
        $status = (str_contains($err, 'not found') || str_contains($err, 'not used')) ? 404 : 400;
        admin_json_response(['ok' => false, 'error' => $err], $status);
    }
    log_admin_action(
        'media_retargeted',
        'Retargeted upload ' . ($result['from'] ?? '') . ' → ' . ($result['to'] ?? ''),
        [
            'detail' => 'Moved ' . (int) ($result['rewritten'] ?? 0) . ' reference(s) from ' .
                ($result['from'] ?? '') . ' to ' . ($result['to'] ?? '') .
                ((int) ($result['remaining'] ?? 0) > 0
                    ? ' (' . (int) $result['remaining'] . ' left on source)'
                    : '') .
                (!empty($result['deleted']) ? '; deleted source file' : ''),
            'from' => $result['from'] ?? '',
            'to' => $result['to'] ?? '',
            'rewritten' => (int) ($result['rewritten'] ?? 0),
            'remaining' => (int) ($result['remaining'] ?? 0),
            'deleted' => !empty($result['deleted']),
        ]
    );
    admin_json_response([
        'ok' => true,
        'from' => $result['from'],
        'to' => $result['to'],
        'url' => $result['url'],
        'rewritten' => (int) ($result['rewritten'] ?? 0),
        'remaining' => (int) ($result['remaining'] ?? 0),
        'deleted' => !empty($result['deleted']),
    ]);
}

admin_json_response(['ok' => false, 'error' => 'Unknown action'], 400);
