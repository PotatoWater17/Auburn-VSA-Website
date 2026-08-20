<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/publish.php';

require_admin_api();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw !== false ? $raw : '', true);
if (!is_array($body) || !isset($body['section'])) {
    admin_json_response(['ok' => false, 'error' => 'Invalid body'], 400);
}

$section = $body['section'];
if (!in_array($section, CONTENT_SECTIONS, true)) {
    admin_json_response(['ok' => false, 'error' => 'Unknown section'], 400);
}

$pageId = (string) ($body['page'] ?? '');
$perm = section_permission($section);

if ($perm === false) {
    admin_json_response(['ok' => false, 'error' => 'Unknown section'], 400);
}

$publish = is_array($body['publish'] ?? null) ? $body['publish'] : [];
$publishMode = strtolower(trim((string) ($publish['mode'] ?? 'asap')));
if ($publishMode !== 'asap' && $publishMode !== 'schedule') {
    $publishMode = 'asap';
}

/** Link keys each admin page is allowed to overwrite (never replace the whole links blob). */
$linkKeysByPage = [
    'home' => ['learnMore', 'join'],
    'royale' => ['purchaseTickets'],
];

$content = get_content();
$sectionValue = null;

if ($section === 'links') {
    if ($pageId === '' || !current_user_can($pageId)) {
        admin_json_response(['ok' => false, 'error' => 'You do not have permission to save these links.'], 403);
    }
    $allowed = $linkKeysByPage[$pageId] ?? [];
    if (!$allowed) {
        admin_json_response(['ok' => false, 'error' => 'This page cannot edit site links.'], 403);
    }
    $incoming = is_array($body['value'] ?? null) ? $body['value'] : [];
    if (!isset($content['links']) || !is_array($content['links'])) {
        $content['links'] = [];
    }
    $linkPatch = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $incoming)) {
            $url = trim((string) $incoming[$key]);
            $safe = is_safe_public_url($url) ? $url : '';
            $content['links'][$key] = $safe;
            $linkPatch[$key] = $safe;
        }
    }
    $sectionValue = $linkPatch;
} else {
    if ($perm !== null && !current_user_can($perm)) {
        admin_json_response(['ok' => false, 'error' => 'You do not have permission to edit this section.'], 403);
    }
    $value = $body['value'] ?? null;
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
    if ($section === 'site' && is_array($value)) {
        $phone = trim((string) ($value['phone'] ?? ''));
        $custom = (($value['phoneCustomFormat'] ?? 'no') === 'yes') ? 'yes' : 'no';
        $value['phoneCustomFormat'] = $custom;
        if ($custom !== 'yes' && $phone !== '') {
            $digits = preg_replace('/\D+/', '', $phone) ?? '';
            if (strlen($digits) === 11 && str_starts_with($digits, '1')) {
                $digits = substr($digits, 1);
            }
            if (strlen($digits) === 10) {
                $value['phone'] = sprintf(
                    '(%s) %s-%s',
                    substr($digits, 0, 3),
                    substr($digits, 3, 3),
                    substr($digits, 6, 4)
                );
            } elseif (strlen($digits) > 0 && strlen($digits) < 10) {
                admin_json_response([
                    'ok' => false,
                    'error' => 'Phone needs 10 digits, or enable custom format in Site & Branding.',
                ], 400);
            } else {
                $value['phone'] = $phone;
            }
        } else {
            $value['phone'] = $phone;
        }
    }
    $content[$section] = $value;
    $sectionValue = $value;
}

if ($publishMode === 'schedule') {
    $at = (string) ($publish['at'] ?? '');
    $result = publish_enqueue(
        [$section => $sectionValue],
        $at,
        [
            'page' => $pageId,
            'username' => current_username(),
        ]
    );
    if (empty($result['ok'])) {
        admin_json_response(['ok' => false, 'error' => $result['error'] ?? 'Could not schedule.'], 400);
    }
    log_admin_action('publish_schedule', 'Scheduled content section “' . $section . '”', [
        'meta' => [
            'section' => $section,
            'page' => $pageId,
            'publishAt' => $at,
            'id' => $result['id'] ?? '',
        ],
    ]);
    admin_json_response([
        'ok' => true,
        'section' => $section,
        'publishMode' => 'schedule',
        'scheduleId' => $result['id'] ?? '',
        'publishAt' => $result['item']['publishAt'] ?? $at,
    ]);
}

if (save_content($content)) {
    $summary = $section === 'links'
        ? 'Saved site links (' . $pageId . ')'
        : 'Saved content section “' . $section . '”';
    $meta = ['section' => $section];
    if ($pageId !== '') {
        $meta['page'] = $pageId;
    }
    if ($section === 'site' && is_array($content['site'] ?? null)) {
        $mode = strtolower((string) ($content['site']['constructionMode'] ?? 'no'));
        $meta['constructionMode'] = $mode;
        $summary .= $mode === 'yes' ? ' (construction mode ON)' : ' (construction mode off)';
    }
    publish_remove_sections_from_pending([$section]);
    log_admin_action('content_save', $summary, ['meta' => $meta]);
    admin_json_response([
        'ok' => true,
        'section' => $section,
        'publishMode' => 'asap',
        'pending' => publish_list_pending(),
    ]);
}

admin_json_response(['ok' => false, 'error' => 'Could not write content file'], 500);
