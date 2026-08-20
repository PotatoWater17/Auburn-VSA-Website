<?php
// Admin newsletter compose API — named draft library + HTML/plain export.

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/newsletter_compose.php';

require_permission_api('subscribers');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        $sel = newsletter_compose_select($id);
        if (empty($sel['ok'])) {
            admin_json_response(['ok' => false, 'error' => $sel['error'] ?? 'Draft not found.'], 404);
        }
    }

    $draft = newsletter_compose_load();
    $format = strtolower(trim((string) ($_GET['format'] ?? '')));

    if ($format === 'html') {
        $html = newsletter_compose_render_html($draft, true);
        $name = 'vsa-newsletter-' . date('Y-m') . '.html';
        if (!headers_sent()) {
            header_remove('Content-Type');
            header('Content-Type: text/html; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $name . '"');
        }
        echo $html;
        exit;
    }
    if ($format === 'plain' || $format === 'txt') {
        $plain = newsletter_compose_render_plain($draft, true);
        $name = 'vsa-newsletter-' . date('Y-m') . '.txt';
        if (!headers_sent()) {
            header_remove('Content-Type');
            header('Content-Type: text/plain; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $name . '"');
        }
        echo $plain;
        exit;
    }

    admin_json_response(newsletter_compose_api_payload($draft));
}

if ($method !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw !== false ? $raw : '', true);
if (!is_array($body)) {
    admin_json_response(['ok' => false, 'error' => 'Invalid body'], 400);
}

$action = strtolower(trim((string) ($body['action'] ?? 'save')));
$forEmail = !empty($body['forEmail']);

if ($action === 'preview') {
    $draft = newsletter_compose_normalize($body['draft'] ?? $body);
    admin_json_response([
        'ok' => true,
        'draft' => $draft,
        'html' => newsletter_compose_render_html($draft, $forEmail),
        'plain' => newsletter_compose_render_plain($draft, $forEmail),
    ]);
}

if ($action === 'select') {
    $result = newsletter_compose_select((string) ($body['id'] ?? ''));
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not open draft.'], 404);
    }
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action === 'create' || $action === 'new') {
    $from = null;
    if (!empty($body['fromCurrent']) && isset($body['draft'])) {
        $from = is_array($body['draft']) ? $body['draft'] : null;
    }
    $result = newsletter_compose_create(
        isset($body['name']) ? (string) $body['name'] : null,
        $from,
    );
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not create draft.'], 400);
    }
    log_admin_action('newsletter_compose_create', 'Created newsletter draft', [
        'meta' => [
            'id' => $result['draft']['id'] ?? '',
            'name' => $result['draft']['name'] ?? '',
        ],
    ]);
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action === 'duplicate') {
    $result = newsletter_compose_duplicate(
        (string) ($body['id'] ?? ''),
        isset($body['name']) ? (string) $body['name'] : null,
    );
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not duplicate draft.'], 400);
    }
    log_admin_action('newsletter_compose_duplicate', 'Duplicated newsletter draft', [
        'meta' => [
            'id' => $result['draft']['id'] ?? '',
            'name' => $result['draft']['name'] ?? '',
        ],
    ]);
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action === 'rename') {
    $result = newsletter_compose_rename((string) ($body['id'] ?? ''), (string) ($body['name'] ?? ''));
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not rename draft.'], 400);
    }
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action === 'delete') {
    $result = newsletter_compose_delete((string) ($body['id'] ?? ''));
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not delete draft.'], 400);
    }
    log_admin_action('newsletter_compose_delete', 'Deleted newsletter draft', [
        'meta' => ['id' => (string) ($body['id'] ?? '')],
    ]);
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action === 'save_as') {
    $result = newsletter_compose_create(
        isset($body['name']) ? (string) $body['name'] : null,
        is_array($body['draft'] ?? null) ? $body['draft'] : null,
    );
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not save as new draft.'], 400);
    }
    log_admin_action('newsletter_compose_save_as', 'Saved newsletter as new draft', [
        'meta' => [
            'id' => $result['draft']['id'] ?? '',
            'name' => $result['draft']['name'] ?? '',
        ],
    ]);
    admin_json_response(newsletter_compose_api_payload($result['draft'], $result['store'] ?? null));
}

if ($action !== 'save') {
    admin_json_response(['ok' => false, 'error' => 'Unknown action'], 400);
}

$result = newsletter_compose_save(
    is_array($body['draft'] ?? null) ? $body['draft'] : $body,
    isset($body['id']) ? (string) $body['id'] : null,
    isset($body['name']) ? (string) $body['name'] : null,
);
if (empty($result['ok'])) {
    $err = (string) ($result['error'] ?? 'Could not save draft.');
    admin_json_response(['ok' => false, 'error' => $err], $err === 'Draft not found.' ? 404 : 500);
}

$saved = $result['draft'];
log_admin_action('newsletter_compose_save', 'Saved newsletter compose draft', [
    'meta' => [
        'id' => $saved['id'] ?? '',
        'name' => $saved['name'] ?? '',
        'subject' => $saved['subject'] ?? '',
        'items' => is_array($saved['items'] ?? null) ? count($saved['items']) : 0,
    ],
]);

admin_json_response(newsletter_compose_api_payload($saved, $result['store'] ?? null));
