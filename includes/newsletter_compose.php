<?php
// Newsletter compose draft + HTML/plain render for Admin → Newsletter (Gmail export).

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';

define('NEWSLETTER_DRAFT_FILE', DATA_DIR . '/newsletter_drafts.json');
/** Soft cap so the JSON file stays manageable in admin. */
define('NEWSLETTER_DRAFT_MAX', 40);

/**
 * Public origin for absolute image URLs in email HTML (Gmail needs https://…).
 *
 * @param bool $forEmail When true, never use localhost — use VSA_PUBLIC_ORIGIN or production.
 */
function newsletter_compose_public_origin(bool $forEmail = false): string
{
    $env = getenv('VSA_PUBLIC_ORIGIN');
    if (is_string($env) && trim($env) !== '') {
        return rtrim(trim($env), '/');
    }

    $hostHeader = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $host = strtolower($hostHeader);
    $isLocal = $host === '' || (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $host);

    $requestOrigin = static function () use ($hostHeader): string {
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443')
            || (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https');
        return ($https ? 'https' : 'http') . '://' . $hostHeader;
    };

    // Admin preview: use this request host (including localhost) so uploads/ load in the iframe.
    if (!$forEmail && $hostHeader !== '') {
        return $requestOrigin();
    }

    // Gmail / file export: prefer the live host when the admin session is already on it.
    if ($forEmail && !$isLocal && $hostHeader !== '') {
        return $requestOrigin();
    }

    return 'https://www.auburnvsa.com';
}

function newsletter_compose_abs_url(string $url, bool $forEmail = false): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $url)) {
        return $url;
    }
    if (str_starts_with($url, '//')) {
        return 'https:' . $url;
    }
    // Bare domains (youtube.com, www.youtu.be/xyz) — not site-relative paths.
    if (newsletter_compose_looks_like_domain($url)) {
        return 'https://' . ltrim(str_replace('\\', '/', $url), '/');
    }
    return newsletter_compose_public_origin($forEmail) . '/' . ltrim(str_replace('\\', '/', $url), '/');
}

/**
 * True for host-like strings without a scheme (e.g. youtube.com, www.auburn.edu/path).
 * Not true for site files like events.html or uploads/… paths.
 */
function newsletter_compose_looks_like_domain(string $url): bool
{
    $url = trim($url);
    if ($url === '' || str_starts_with($url, '/') || str_starts_with($url, '.') || str_starts_with($url, '#')) {
        return false;
    }
    if (preg_match('#^(mailto:|tel:|https?:|javascript:|data:)#i', $url)) {
        return false;
    }
    if (!preg_match(
        '~^([a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+)([/:?#]|$)~i',
        $url,
        $m,
    )) {
        return false;
    }
    $host = strtolower($m[1]);
    if (!preg_match('/\.([a-z]{2,24})$/', $host, $t)) {
        return false;
    }
    // Treat common web file extensions as site paths, not TLDs.
    static $fileExt = [
        'html' => true,
        'htm' => true,
        'php' => true,
        'css' => true,
        'js' => true,
        'png' => true,
        'jpg' => true,
        'jpeg' => true,
        'gif' => true,
        'webp' => true,
        'svg' => true,
        'pdf' => true,
        'json' => true,
        'txt' => true,
        'xml' => true,
        'ico' => true,
        'map' => true,
        'woff' => true,
        'woff2' => true,
    ];
    return empty($fileExt[$t[1]]);
}

/**
 * Normalize user-entered hrefs: add https:// for bare domains; leave paths/mailto alone.
 */
function newsletter_compose_normalize_href(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if (preg_match('#^(mailto:|tel:)#i', $url)) {
        return $url;
    }
    if (preg_match('#^https?://#i', $url) || str_starts_with($url, '//')) {
        return $url;
    }
    if (newsletter_compose_looks_like_domain($url)) {
        return 'https://' . ltrim(str_replace('\\', '/', $url), '/');
    }
    return $url;
}

/**
 * Absolute href for email clients (relative paths break in Gmail).
 * Leaves mailto:/tel: alone.
 */
function newsletter_compose_href(string $url, bool $forEmail = false): string
{
    $url = newsletter_compose_normalize_href(trim($url));
    if ($url === '') {
        return '';
    }
    if (preg_match('#^(mailto:|tel:)#i', $url)) {
        return $url;
    }
    return newsletter_compose_abs_url($url, $forEmail);
}

/**
 * @return array<string,mixed>
 */
/**
 * Inbox preview line (Gmail / Apple Mail gray text under the subject).
 * Caps length and appends hidden filler so clients don't leak the brand header.
 *
 * Uses near-invisible body text (not only display:none) so Gmail paste keeps the
 * preview line instead of substituting “Auburn VSA Vietnamese Student Association…”.
 */
function newsletter_compose_preheader_html(string $text): string
{
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    if ($text === '') {
        return '';
    }
    // Most inbox lists show ~85–100 characters; keep a clean ellipsis cut.
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($text) > 110) {
            $text = rtrim(mb_substr($text, 0, 107), " \t.,;:-") . '…';
        }
    } elseif (strlen($text) > 110) {
        $text = rtrim(substr($text, 0, 107), " \t.,;:-") . '...';
    }

    $esc = newsletter_compose_esc($text);
    // Filler prevents following body copy from appending after a short preview.
    $filler = str_repeat('&#847;&zwnj;&nbsp;', 30) . str_repeat('&shy;', 20);

    return
        // Primary (hidden) — works in Apple Mail / Outlook / many ESPs
        '<div style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;' .
        'max-height:0;max-width:0;opacity:0;overflow:hidden;color:#ffffff;">' .
        $esc . '&nbsp;' . $filler .
        '</div>' .
        // Gmail paste fallback — same color as outer email background, 1px tall
        '<div style="font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;' .
        'color:#e8ecf3;mso-hide:all;" aria-hidden="true">' .
        $esc . '&nbsp;' . $filler .
        '</div>';
}

/**
 * Prefer explicit preheader; otherwise first intro sentence (polished for inbox).
 */
function newsletter_compose_preheader_text(array $draft): string
{
    $pre = trim((string) ($draft['preheader'] ?? ''));
    if ($pre !== '') {
        return $pre;
    }
    $intro = trim((string) ($draft['intro'] ?? ''));
    if ($intro === '') {
        return 'Meetings, events, and community news from Auburn VSA.';
    }
    $intro = preg_replace('/\s+/u', ' ', str_replace(["\r\n", "\n", "\r"], ' ', $intro)) ?? $intro;
    // First sentence-ish chunk.
    if (preg_match('/^(.+?[.!?])(?:\s|$)/u', $intro, $m)) {
        return trim($m[1]);
    }
    return $intro;
}

function newsletter_compose_default_draft(): array
{
    $month = date('F Y');
    return [
        'subject' => 'Auburn VSA — ' . $month,
        'preheader' => 'Meetings, events, and community news from Auburn VSA this month.',
        'headline' => 'This month with Auburn VSA',
        'intro' => "Hi everyone,\n\nHere are the upcoming events and reminders for this month. We hope to see you there!",
        'heroImage' => '',
        'items' => [
            [
                'title' => '',
                'when' => '',
                'where' => '',
                'blurb' => '',
                'link' => '',
                'image' => '',
            ],
        ],
        'ctaLabel' => 'Join on AUinvolve',
        'ctaUrl' => 'https://auburn.campuslabs.com/engage/organization/vsa',
        'closing' => "Questions? Reply to this email or reach us at vsaauburn@gmail.com.\n\nWar Eagle!",
        'signoff' => 'Auburn VSA',
        'updatedAt' => '',
    ];
}

/**
 * @param mixed $raw
 * @return array<string,mixed>
 */
function newsletter_compose_normalize($raw): array
{
    $base = newsletter_compose_default_draft();
    if (!is_array($raw)) {
        return $base;
    }

    $out = $base;
    foreach (['subject', 'preheader', 'headline', 'intro', 'ctaLabel', 'closing', 'signoff'] as $key) {
        if (array_key_exists($key, $raw)) {
            $out[$key] = trim((string) $raw[$key]);
        }
    }

    $hero = trim((string) ($raw['heroImage'] ?? ''));
    $out['heroImage'] = ($hero !== '' && is_safe_media_url($hero)) ? $hero : '';

    $ctaUrl = newsletter_compose_normalize_href(trim((string) ($raw['ctaUrl'] ?? $base['ctaUrl'])));
    $out['ctaUrl'] = ($ctaUrl !== '' && is_safe_public_url($ctaUrl)) ? $ctaUrl : '';

    $items = [];
    $incoming = is_array($raw['items'] ?? null) ? $raw['items'] : [];
    foreach ($incoming as $row) {
        if (!is_array($row)) {
            continue;
        }
        $link = newsletter_compose_normalize_href(trim((string) ($row['link'] ?? '')));
        $image = trim((string) ($row['image'] ?? ''));
        $items[] = [
            'title' => trim((string) ($row['title'] ?? '')),
            'when' => trim((string) ($row['when'] ?? '')),
            'where' => trim((string) ($row['where'] ?? '')),
            'blurb' => trim((string) ($row['blurb'] ?? '')),
            'link' => ($link !== '' && is_safe_public_url($link)) ? $link : '',
            'image' => ($image !== '' && is_safe_media_url($image)) ? $image : '',
        ];
    }
    if ($items === []) {
        $items = $base['items'];
    }
    $out['items'] = array_slice($items, 0, 12);
    $out['updatedAt'] = trim((string) ($raw['updatedAt'] ?? ''));

    return $out;
}

function newsletter_compose_new_id(): string
{
    try {
        return bin2hex(random_bytes(8));
    } catch (Throwable $e) {
        return substr(sha1(uniqid((string) mt_rand(), true)), 0, 16);
    }
}

function newsletter_compose_default_name(array $draft = []): string
{
    $subject = trim((string) ($draft['subject'] ?? ''));
    if ($subject !== '') {
        // Prefer "Month Year" from subject; else a short subject clip.
        if (preg_match(
            '/\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})\b/i',
            $subject,
            $m,
        )) {
            return $m[1];
        }
        if (function_exists('mb_strlen') && mb_strlen($subject) > 48) {
            return rtrim(mb_substr($subject, 0, 45)) . '…';
        }
        if (strlen($subject) > 48) {
            return rtrim(substr($subject, 0, 45)) . '...';
        }
        return $subject;
    }
    return 'Newsletter — ' . date('F Y');
}

/**
 * @param mixed $raw
 * @return array{id:string,name:string,createdAt:string,updatedAt:string}&array<string,mixed>
 */
function newsletter_compose_normalize_entry($raw, ?string $fallbackId = null): array
{
    $content = newsletter_compose_normalize($raw);
    $id = trim((string) (is_array($raw) ? ($raw['id'] ?? '') : ''));
    if ($id === '' || !preg_match('/^[a-f0-9]{8,32}$/i', $id)) {
        $id = $fallbackId ?: newsletter_compose_new_id();
    }
    $name = trim((string) (is_array($raw) ? ($raw['name'] ?? '') : ''));
    if ($name === '') {
        $name = newsletter_compose_default_name($content);
    }
    if (function_exists('mb_substr')) {
        $name = mb_substr($name, 0, 80);
    } else {
        $name = substr($name, 0, 80);
    }
    $created = trim((string) (is_array($raw) ? ($raw['createdAt'] ?? '') : ''));
    if ($created === '') {
        $created = trim((string) ($content['updatedAt'] ?? '')) ?: date('c');
    }
    $updated = trim((string) ($content['updatedAt'] ?? ''));
    if ($updated === '') {
        $updated = $created;
    }
    $content['id'] = $id;
    $content['name'] = $name;
    $content['createdAt'] = $created;
    $content['updatedAt'] = $updated;
    return $content;
}

/**
 * @return array{version:int,activeId:string,drafts:list<array<string,mixed>>}
 */
function newsletter_compose_empty_store(): array
{
    $entry = newsletter_compose_normalize_entry(newsletter_compose_default_draft());
    return [
        'version' => 2,
        'activeId' => (string) $entry['id'],
        'drafts' => [$entry],
    ];
}

/**
 * True when the file is the old single-draft object (no drafts[] library).
 */
function newsletter_compose_is_legacy_payload($decoded): bool
{
    if (!is_array($decoded)) {
        return false;
    }
    if (isset($decoded['drafts']) && is_array($decoded['drafts'])) {
        return false;
    }
    // Legacy files always had content keys like subject / items.
    return array_key_exists('subject', $decoded) || array_key_exists('items', $decoded);
}

/**
 * @param mixed $decoded
 * @return array{version:int,activeId:string,drafts:list<array<string,mixed>>}
 */
function newsletter_compose_normalize_store($decoded): array
{
    if (newsletter_compose_is_legacy_payload($decoded)) {
        $entry = newsletter_compose_normalize_entry($decoded);
        if (trim((string) ($entry['name'] ?? '')) === '' || $entry['name'] === newsletter_compose_default_name([])) {
            $entry['name'] = newsletter_compose_default_name($entry);
        }
        return [
            'version' => 2,
            'activeId' => (string) $entry['id'],
            'drafts' => [$entry],
        ];
    }

    if (!is_array($decoded)) {
        return newsletter_compose_empty_store();
    }

    $drafts = [];
    $incoming = is_array($decoded['drafts'] ?? null) ? $decoded['drafts'] : [];
    foreach ($incoming as $row) {
        if (!is_array($row)) {
            continue;
        }
        $drafts[] = newsletter_compose_normalize_entry($row);
    }
    if ($drafts === []) {
        return newsletter_compose_empty_store();
    }
    // Newest first for the picker; cap length.
    usort($drafts, static function ($a, $b) {
        return strcmp((string) ($b['updatedAt'] ?? ''), (string) ($a['updatedAt'] ?? ''));
    });
    $drafts = array_slice(array_values($drafts), 0, NEWSLETTER_DRAFT_MAX);

    $activeId = trim((string) ($decoded['activeId'] ?? ''));
    $ids = [];
    foreach ($drafts as $d) {
        $ids[(string) $d['id']] = true;
    }
    if ($activeId === '' || !isset($ids[$activeId])) {
        $activeId = (string) $drafts[0]['id'];
    }

    return [
        'version' => 2,
        'activeId' => $activeId,
        'drafts' => $drafts,
    ];
}

/**
 * @return array{version:int,activeId:string,drafts:list<array<string,mixed>>}
 */
function newsletter_compose_load_store(): array
{
    $path = NEWSLETTER_DRAFT_FILE;
    if (!is_readable($path)) {
        return newsletter_compose_empty_store();
    }
    $decoded = json_decode((string) file_get_contents($path), true);
    $store = newsletter_compose_normalize_store($decoded);
    // Persist migration from legacy single-draft shape.
    if (newsletter_compose_is_legacy_payload($decoded)) {
        newsletter_compose_save_store($store);
    }
    return $store;
}

/**
 * @param array{version?:int,activeId?:string,drafts?:list<array<string,mixed>>} $store
 */
function newsletter_compose_save_store(array $store): bool
{
    $store = newsletter_compose_normalize_store($store);
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    return security_write_json(NEWSLETTER_DRAFT_FILE, $store);
}

/**
 * @return list<array{id:string,name:string,subject:string,updatedAt:string,createdAt:string,itemCount:int}>
 */
function newsletter_compose_summaries(array $store): array
{
    $out = [];
    foreach ($store['drafts'] as $d) {
        if (!is_array($d)) {
            continue;
        }
        $out[] = [
            'id' => (string) ($d['id'] ?? ''),
            'name' => (string) ($d['name'] ?? 'Untitled'),
            'subject' => (string) ($d['subject'] ?? ''),
            'updatedAt' => (string) ($d['updatedAt'] ?? ''),
            'createdAt' => (string) ($d['createdAt'] ?? ''),
            'itemCount' => is_array($d['items'] ?? null) ? count($d['items']) : 0,
        ];
    }
    return $out;
}

function newsletter_compose_find_index(array $store, string $id): ?int
{
    $id = trim($id);
    foreach ($store['drafts'] as $i => $d) {
        if (is_array($d) && (string) ($d['id'] ?? '') === $id) {
            return (int) $i;
        }
    }
    return null;
}

/**
 * Active draft (or by id). Includes id/name metadata.
 *
 * @return array<string,mixed>
 */
function newsletter_compose_load(?string $id = null): array
{
    $store = newsletter_compose_load_store();
    $want = trim((string) ($id ?? $store['activeId']));
    $idx = newsletter_compose_find_index($store, $want);
    if ($idx === null) {
        $idx = 0;
    }
    return newsletter_compose_normalize_entry($store['drafts'][$idx] ?? newsletter_compose_default_draft());
}

/**
 * Save content into an existing draft (by id) or the active draft.
 *
 * @param array<string,mixed> $draft
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_save(array $draft, ?string $id = null, ?string $name = null): array
{
    $store = newsletter_compose_load_store();
    $want = trim((string) ($id ?? ($draft['id'] ?? $store['activeId'])));
    $idx = newsletter_compose_find_index($store, $want);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'Draft not found.'];
    }
    $existing = $store['drafts'][$idx];
    $entry = newsletter_compose_normalize_entry(array_merge($existing, $draft, [
        'id' => (string) $existing['id'],
        'createdAt' => (string) ($existing['createdAt'] ?? ''),
        'name' => $name !== null && trim($name) !== ''
            ? trim($name)
            : (string) ($draft['name'] ?? $existing['name'] ?? ''),
    ]));
    $entry['updatedAt'] = date('c');
    $store['drafts'][$idx] = $entry;
    $store['activeId'] = (string) $entry['id'];
    if (!newsletter_compose_save_store($store)) {
        return ['ok' => false, 'error' => 'Could not save draft.'];
    }
    $fresh = newsletter_compose_load_store();
    return [
        'ok' => true,
        'draft' => newsletter_compose_load((string) $entry['id']),
        'store' => $fresh,
    ];
}

/**
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_create(?string $name = null, $from = null): array
{
    $store = newsletter_compose_load_store();
    if (count($store['drafts']) >= NEWSLETTER_DRAFT_MAX) {
        return [
            'ok' => false,
            'error' => 'Draft library is full (' . NEWSLETTER_DRAFT_MAX . '). Delete an old draft first.',
        ];
    }
    $base = is_array($from) ? $from : newsletter_compose_default_draft();
    $entry = newsletter_compose_normalize_entry($base, newsletter_compose_new_id());
    $entry['id'] = newsletter_compose_new_id();
    $entry['name'] = trim((string) ($name ?? '')) !== ''
        ? trim((string) $name)
        : newsletter_compose_default_name($entry);
    $now = date('c');
    $entry['createdAt'] = $now;
    $entry['updatedAt'] = $now;
    array_unshift($store['drafts'], $entry);
    $store['activeId'] = (string) $entry['id'];
    if (!newsletter_compose_save_store($store)) {
        return ['ok' => false, 'error' => 'Could not create draft.'];
    }
    $fresh = newsletter_compose_load_store();
    return [
        'ok' => true,
        'draft' => newsletter_compose_load((string) $entry['id']),
        'store' => $fresh,
    ];
}

/**
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_duplicate(string $id, ?string $name = null): array
{
    $store = newsletter_compose_load_store();
    if (newsletter_compose_find_index($store, $id) === null) {
        return ['ok' => false, 'error' => 'Draft not found.'];
    }
    $src = newsletter_compose_load($id);
    $copyName = trim((string) ($name ?? ''));
    if ($copyName === '') {
        $copyName = trim((string) ($src['name'] ?? 'Draft')) . ' (copy)';
    }
    unset($src['id'], $src['createdAt'], $src['updatedAt']);
    return newsletter_compose_create($copyName, $src);
}

/**
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_rename(string $id, string $name): array
{
    $name = trim($name);
    if ($name === '') {
        return ['ok' => false, 'error' => 'Enter a draft name.'];
    }
    return newsletter_compose_save(['name' => $name], $id, $name);
}

/**
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_delete(string $id): array
{
    $store = newsletter_compose_load_store();
    $idx = newsletter_compose_find_index($store, $id);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'Draft not found.'];
    }
    if (count($store['drafts']) <= 1) {
        // Replace the last draft with a fresh blank instead of emptying the library.
        $blank = newsletter_compose_normalize_entry(newsletter_compose_default_draft());
        $now = date('c');
        $blank['createdAt'] = $now;
        $blank['updatedAt'] = $now;
        $store['drafts'] = [$blank];
        $store['activeId'] = (string) $blank['id'];
    } else {
        array_splice($store['drafts'], $idx, 1);
        if ($store['activeId'] === trim($id)) {
            $store['activeId'] = (string) ($store['drafts'][0]['id'] ?? '');
        }
    }
    if (!newsletter_compose_save_store($store)) {
        return ['ok' => false, 'error' => 'Could not delete draft.'];
    }
    $fresh = newsletter_compose_load_store();
    return [
        'ok' => true,
        'draft' => newsletter_compose_load(),
        'store' => $fresh,
    ];
}

/**
 * @return array{ok:bool,error?:string,draft?:array,store?:array}
 */
function newsletter_compose_select(string $id): array
{
    $store = newsletter_compose_load_store();
    $idx = newsletter_compose_find_index($store, $id);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'Draft not found.'];
    }
    $store['activeId'] = trim($id);
    if (!newsletter_compose_save_store($store)) {
        return ['ok' => false, 'error' => 'Could not open draft.'];
    }
    $fresh = newsletter_compose_load_store();
    return [
        'ok' => true,
        'draft' => newsletter_compose_load($id),
        'store' => $fresh,
    ];
}

/**
 * JSON payload helpers for the admin compose API.
 *
 * @return array{ok:bool,draft:array,drafts:list,activeId:string,html:string,plain:string}
 */
function newsletter_compose_api_payload(?array $draft = null, ?array $store = null, bool $forEmail = false): array
{
    $store = $store ?? newsletter_compose_load_store();
    $draft = $draft ?? newsletter_compose_load((string) ($store['activeId'] ?? ''));
    return [
        'ok' => true,
        'draft' => $draft,
        'drafts' => newsletter_compose_summaries($store),
        'activeId' => (string) ($store['activeId'] ?? ''),
        'html' => newsletter_compose_render_html($draft, $forEmail),
        'plain' => newsletter_compose_render_plain($draft, $forEmail),
    ];
}

function newsletter_compose_esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function newsletter_compose_nl2br_esc(string $s): string
{
    return nl2br(newsletter_compose_esc($s), false);
}

/**
 * Site logo from CMS branding (absolute URL for Gmail).
 */
function newsletter_compose_logo_url(bool $forEmail = false): string
{
    if (!is_readable(CONTENT_FILE)) {
        return '';
    }
    $data = json_decode((string) file_get_contents(CONTENT_FILE), true);
    if (!is_array($data) || !is_array($data['branding'] ?? null)) {
        return '';
    }
    $logo = trim((string) ($data['branding']['logo'] ?? ''));
    if ($logo === '' || !is_safe_media_url($logo)) {
        return '';
    }
    return newsletter_compose_abs_url($logo, $forEmail);
}

/**
 * Site branding bits for newsletter chrome (logo handled separately).
 *
 * @return array{orgName:string,university:string,instagram:string,email:string}
 */
function newsletter_compose_site_meta(): array
{
    $out = [
        'orgName' => 'Vietnamese Student Association',
        'university' => 'Auburn University',
        'instagram' => 'https://www.instagram.com/auburnvsa',
        'email' => 'vsaauburn@gmail.com',
    ];
    if (!is_readable(CONTENT_FILE)) {
        return $out;
    }
    $data = json_decode((string) file_get_contents(CONTENT_FILE), true);
    if (!is_array($data)) {
        return $out;
    }
    $site = is_array($data['site'] ?? null) ? $data['site'] : [];
    if (trim((string) ($site['orgName'] ?? '')) !== '') {
        $out['orgName'] = trim((string) $site['orgName']);
    }
    if (trim((string) ($site['university'] ?? '')) !== '') {
        $out['university'] = trim((string) $site['university']);
    }
    if (trim((string) ($site['email'] ?? '')) !== '') {
        $out['email'] = trim((string) $site['email']);
    }
    $socials = is_array($data['socials'] ?? null) ? $data['socials'] : [];
    foreach ($socials as $row) {
        if (!is_array($row)) {
            continue;
        }
        $label = strtolower(trim((string) ($row['label'] ?? '')));
        $icon = strtolower(trim((string) ($row['icon'] ?? '')));
        $href = trim((string) ($row['href'] ?? ''));
        if ($href === '' || !is_safe_public_url($href)) {
            continue;
        }
        if ($icon === 'instagram' || str_contains($label, 'instagram') || str_contains($href, 'instagram.com')) {
            $out['instagram'] = $href;
            break;
        }
    }
    return $out;
}

/**
 * Short issue label for the header (e.g. "July 2026") from subject, else current month.
 */
function newsletter_compose_issue_label(array $draft): string
{
    $subject = trim((string) ($draft['subject'] ?? ''));
    if ($subject !== '' && preg_match(
        '/\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})\b/i',
        $subject,
        $m,
    )) {
        return $m[1];
    }
    if ($subject !== '' && preg_match('/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+20\d{2})\b/i', $subject, $m)) {
        return $m[1];
    }
    return date('F Y');
}

/**
 * Inset photo (editorial padding) — safer in Gmail than CSS-only rounded cards.
 */
function newsletter_compose_image_inset(string $src, string $alt = '', bool $forEmail = false, string $pad = '8px 32px 0'): string
{
    $abs = newsletter_compose_abs_url($src, $forEmail);
    if ($abs === '') {
        return '';
    }
    return '<tr><td style="padding:' . $pad . ';background:#ffffff;line-height:0;font-size:0;">' .
        '<img src="' . newsletter_compose_esc($abs) . '" alt="' . newsletter_compose_esc($alt) . '" width="536" ' .
        'style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:10px;" />' .
        '</td></tr>';
}

/**
 * Full-bleed photo row (hero only).
 */
function newsletter_compose_image_row(string $src, string $alt = '', bool $forEmail = false): string
{
    $abs = newsletter_compose_abs_url($src, $forEmail);
    if ($abs === '') {
        return '';
    }
    return '<tr><td style="padding:0;line-height:0;font-size:0;">' .
        '<img src="' . newsletter_compose_esc($abs) . '" alt="' . newsletter_compose_esc($alt) . '" width="600" ' .
        'style="display:block;width:100%;max-width:600px;height:auto;border:0;" />' .
        '</td></tr>';
}

/**
 * Modern navy + orange HTML email for Gmail paste: CMS logo, photo dividers, sign-off at end.
 *
 * @param array<string,mixed> $draft
 * @param bool $forEmail Use public image URLs suitable for Gmail (not localhost).
 */
function newsletter_compose_render_html(array $draft, bool $forEmail = false): string
{
    $draft = newsletter_compose_normalize($draft);
    $meta = newsletter_compose_site_meta();
    $issue = newsletter_compose_issue_label($draft);

    $navy = '#344E74';
    $navyDark = '#1a3560';
    $orange = '#FF811D';
    $ink = '#243447';
    $muted = '#5c6b7f';
    $rule = '#e6ebf2';
    $soft = '#f5f7fb';
    $bg = '#e8ecf3';
    $sans = "Be Vietnam Pro,Segoe UI,Helvetica Neue,Arial,sans-serif";

    $homeUrl = newsletter_compose_abs_url('/', $forEmail);
    $unsubUrl = newsletter_compose_abs_url('unsubscribe.html', $forEmail);
    $igUrl = newsletter_compose_href($meta['instagram'], $forEmail);

    $logoAbs = newsletter_compose_logo_url($forEmail);
    $logoCell = $logoAbs !== ''
        ? '<td width="56" valign="middle" style="width:56px;padding:0 14px 0 0;">' .
            '<img src="' . newsletter_compose_esc($logoAbs) . '" alt="Auburn VSA" width="48" height="48" ' .
            'style="display:block;width:48px;height:48px;object-fit:contain;border:0;border-radius:10px;' .
            'background:#ffffff;padding:4px;" />' .
            '</td>'
        : '';
    $logoFooter = $logoAbs !== ''
        ? '<img src="' . newsletter_compose_esc($logoAbs) . '" alt="" width="28" height="28" ' .
            'style="display:inline-block;vertical-align:middle;width:28px;height:28px;object-fit:contain;' .
            'border:0;margin:0 8px 0 0;opacity:0.9;" />'
        : '';

    $eventCount = 0;
    foreach ($draft['items'] as $probe) {
        if (!is_array($probe)) {
            continue;
        }
        if (
            trim((string) ($probe['title'] ?? '')) === ''
            && trim((string) ($probe['when'] ?? '')) === ''
            && trim((string) ($probe['where'] ?? '')) === ''
            && trim((string) ($probe['blurb'] ?? '')) === ''
            && trim((string) ($probe['link'] ?? '')) === ''
            && trim((string) ($probe['image'] ?? '')) === ''
        ) {
            continue;
        }
        $eventCount++;
    }

    $sections = '';
    $hasEvent = false;
    $eventNum = 0;
    foreach ($draft['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = (string) ($item['title'] ?? '');
        $when = (string) ($item['when'] ?? '');
        $where = (string) ($item['where'] ?? '');
        $blurb = (string) ($item['blurb'] ?? '');
        $link = (string) ($item['link'] ?? '');
        $image = (string) ($item['image'] ?? '');
        if ($title === '' && $when === '' && $where === '' && $blurb === '' && $link === '' && $image === '') {
            continue;
        }
        $hasEvent = true;
        $eventNum++;

        if ($eventNum === 1) {
            $sections .=
                '<tr><td style="padding:10px 32px 2px;background:#ffffff;">' .
                '<div style="width:36px;height:3px;line-height:3px;font-size:0;background:' . $orange .
                ';margin:0 0 14px;">&nbsp;</div>' .
                '<p style="margin:0;font-family:' . $sans .
                ';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:' . $muted .
                ';font-weight:700;">What&rsquo;s coming up</p>' .
                ($eventCount > 1
                    ? '<p style="margin:6px 0 0;font-family:' . $sans .
                        ';font-size:13px;color:' . $muted . ';">' .
                        $eventCount . ' updates this issue</p>'
                    : '') .
                '</td></tr>';
        }

        if ($image !== '') {
            $sections .= newsletter_compose_image_inset(
                $image,
                $title !== '' ? $title : 'Event photo',
                $forEmail,
                '18px 32px 0',
            );
        }

        $metaRows = '';
        if ($when !== '') {
            $metaRows .=
                '<tr><td style="padding:0 0 4px;font-family:' . $sans .
                ';font-size:12px;line-height:1.4;color:' . $muted . ';">' .
                '<span style="display:inline-block;min-width:3.4em;font-weight:700;letter-spacing:0.06em;' .
                'text-transform:uppercase;color:' . $orange . ';font-size:10px;">When</span> ' .
                newsletter_compose_esc($when) . '</td></tr>';
        }
        if ($where !== '') {
            $metaRows .=
                '<tr><td style="padding:0 0 4px;font-family:' . $sans .
                ';font-size:12px;line-height:1.4;color:' . $muted . ';">' .
                '<span style="display:inline-block;min-width:3.4em;font-weight:700;letter-spacing:0.06em;' .
                'text-transform:uppercase;color:' . $orange . ';font-size:10px;">Where</span> ' .
                newsletter_compose_esc($where) . '</td></tr>';
        }
        $metaTable = $metaRows !== ''
            ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">' .
                $metaRows . '</table>'
            : '';

        $linkLine = $link !== ''
            ? '<p style="margin:14px 0 0;font-family:' . $sans . ';">' .
                '<a href="' . newsletter_compose_esc(newsletter_compose_href($link, $forEmail)) .
                '" style="display:inline-block;color:' . $navy . ';font-weight:700;font-size:14px;' .
                'text-decoration:none;border-bottom:2px solid ' . $orange . ';padding-bottom:2px;">' .
                'View details</a></p>'
            : '';

        $indexBadge = '<span style="display:inline-block;margin:0 0 8px;padding:3px 8px;border-radius:6px;' .
            'background:' . $soft . ';color:' . $navy . ';font-family:' . $sans .
            ';font-size:11px;font-weight:700;letter-spacing:0.04em;">' .
            str_pad((string) $eventNum, 2, '0', STR_PAD_LEFT) . ' / ' .
            str_pad((string) $eventCount, 2, '0', STR_PAD_LEFT) . '</span>';

        $sections .=
            '<tr><td style="padding:' . ($image !== '' ? '16px' : '22px') . ' 32px 6px;background:#ffffff;">' .
            $indexBadge .
            ($title !== ''
                ? '<h2 style="margin:0 0 10px;font-family:' . $sans .
                    ';font-size:21px;line-height:1.28;font-weight:700;color:' . $navyDark . ';">' .
                    newsletter_compose_esc($title) . '</h2>'
                : '') .
            $metaTable .
            ($blurb !== ''
                ? '<p style="margin:0;font-family:' . $sans .
                    ';font-size:15px;line-height:1.65;color:' . $ink . ';">' .
                    newsletter_compose_nl2br_esc($blurb) . '</p>'
                : '') .
            $linkLine .
            '</td></tr>';

        if ($eventNum < $eventCount) {
            $sections .=
                '<tr><td style="padding:20px 32px 0;background:#ffffff;">' .
                '<div style="height:1px;line-height:1px;font-size:0;background:' . $rule . ';">&nbsp;</div>' .
                '</td></tr>';
        }
    }
    if (!$hasEvent) {
        $sections = '';
    }

    $cta = '';
    if ($draft['ctaLabel'] !== '' && $draft['ctaUrl'] !== '') {
        $cta =
            '<tr><td style="padding:28px 32px;background:' . $soft . ';">' .
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;' .
            'border:1px solid ' . $rule . ';border-radius:12px;">' .
            '<tr><td style="padding:26px 24px;text-align:center;">' .
            '<p style="margin:0 0 6px;font-family:' . $sans .
            ';font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:' . $muted .
            ';font-weight:700;">Get involved</p>' .
            '<p style="margin:0 0 18px;font-family:' . $sans .
            ';font-size:16px;line-height:1.4;font-weight:700;color:' . $navyDark . ';">' .
            'Ready for the next event?</p>' .
            '<a href="' . newsletter_compose_esc(newsletter_compose_href($draft['ctaUrl'], $forEmail)) .
            '" style="display:inline-block;background:' . $orange .
            ';color:#ffffff;font-family:' . $sans .
            ';font-weight:700;font-size:15px;letter-spacing:0.01em;text-decoration:none;' .
            'padding:14px 30px;border-radius:8px;">' .
            newsletter_compose_esc($draft['ctaLabel']) .
            '</a></td></tr></table></td></tr>';
    }

    $signoffBlock =
        '<tr><td style="padding:28px 32px 32px;background:#ffffff;">' .
        '<div style="height:1px;line-height:1px;font-size:0;background:' . $rule . ';margin:0 0 22px;">&nbsp;</div>' .
        ($draft['closing'] !== ''
            ? '<p style="margin:0 0 14px;font-family:' . $sans .
                ';font-size:15px;line-height:1.65;color:' . $ink . ';">' .
                newsletter_compose_nl2br_esc($draft['closing']) . '</p>'
            : '') .
        ($draft['signoff'] !== ''
            ? '<p style="margin:0;font-family:' . $sans .
                ';font-size:15px;font-weight:700;color:' . $navy . ';">' .
                newsletter_compose_nl2br_esc($draft['signoff']) . '</p>'
            : '') .
        '</td></tr>';

    $preheader = newsletter_compose_preheader_html(newsletter_compose_preheader_text($draft));

    $hero = $draft['heroImage'] !== ''
        ? newsletter_compose_image_inset(
            $draft['heroImage'],
            $draft['headline'] !== '' ? $draft['headline'] : 'Auburn VSA',
            $forEmail,
            '8px 32px 4px',
        )
        : '';

    $introHtml = '';
    if ($draft['intro'] !== '') {
        $introParts = preg_split("/\n\s*\n/", trim($draft['intro']), 2) ?: [];
        if (count($introParts) === 2) {
            $introHtml =
                '<p style="margin:0 0 12px;font-family:' . $sans .
                ';font-size:17px;line-height:1.6;color:' . $ink . ';font-weight:600;">' .
                newsletter_compose_nl2br_esc(trim($introParts[0])) . '</p>' .
                '<p style="margin:0;font-family:' . $sans .
                ';font-size:16px;line-height:1.7;color:' . $ink . ';">' .
                newsletter_compose_nl2br_esc(trim($introParts[1])) . '</p>';
        } else {
            $introHtml =
                '<p style="margin:0;font-family:' . $sans .
                ';font-size:16px;line-height:1.7;color:' . $ink . ';">' .
                newsletter_compose_nl2br_esc($draft['intro']) . '</p>';
        }
    }

    $opening =
        '<tr><td style="padding:30px 32px 18px;background:#ffffff;">' .
        '<p style="margin:0 0 10px;font-family:' . $sans .
        ';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:' . $orange .
        ';font-weight:700;">Monthly newsletter</p>' .
        '<h1 style="margin:0 0 18px;font-family:' . $sans .
        ';font-size:30px;line-height:1.18;font-weight:700;color:' . $navyDark . ';letter-spacing:-0.01em;">' .
        newsletter_compose_esc($draft['headline'] !== '' ? $draft['headline'] : 'This month with Auburn VSA') .
        '</h1>' .
        $introHtml .
        '</td></tr>';

    $footerLinks =
        '<a href="' . newsletter_compose_esc($homeUrl) .
        '" style="color:#FFD4A8;font-weight:600;text-decoration:none;">Website</a>' .
        '&nbsp;&nbsp;·&nbsp;&nbsp;' .
        '<a href="' . newsletter_compose_esc($igUrl) .
        '" style="color:#FFD4A8;font-weight:600;text-decoration:none;">Instagram</a>' .
        '&nbsp;&nbsp;·&nbsp;&nbsp;' .
        '<a href="' . newsletter_compose_esc($unsubUrl) .
        '" style="color:rgba(255,255,255,0.72);font-weight:600;text-decoration:underline;">Unsubscribe</a>';

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' .
        '<title>' . newsletter_compose_esc($draft['subject'] !== '' ? $draft['subject'] : 'Auburn VSA') . '</title></head>' .
        '<body style="margin:0;padding:0;background:' . $bg . ';font-family:' . $sans . ';">' .
        $preheader .
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $bg . ';padding:32px 12px;">' .
        '<tr><td align="center">' .
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;' .
        'background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d5dce8;">' .
        // Brand header — horizontal lockup + issue date
        '<tr><td style="background:' . $navy . ';padding:22px 28px;">' .
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' .
        '<tr>' .
        $logoCell .
        '<td valign="middle" style="padding:0;">' .
        '<p style="margin:0;font-family:' . $sans .
        ';font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;font-weight:700;">Auburn VSA</p>' .
        '<p style="margin:4px 0 0;font-family:' . $sans .
        ';font-size:13px;color:rgba(255,255,255,0.78);font-weight:500;">' .
        newsletter_compose_esc($meta['orgName']) . '</p>' .
        '</td>' .
        '<td valign="middle" align="right" style="padding:0 0 0 12px;white-space:nowrap;">' .
        '<p style="margin:0;font-family:' . $sans .
        ';font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.65);font-weight:700;">Issue</p>' .
        '<p style="margin:4px 0 0;font-family:' . $sans .
        ';font-size:13px;color:#ffffff;font-weight:700;">' .
        newsletter_compose_esc($issue) . '</p>' .
        '</td></tr></table></td></tr>' .
        '<tr><td style="padding:0;height:3px;line-height:3px;font-size:0;background:' . $orange . ';">&nbsp;</td></tr>' .
        $opening .
        $hero .
        $sections .
        $cta .
        $signoffBlock .
        '<tr><td style="padding:26px 28px 24px;background:' . $navyDark . ';">' .
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' .
        '<tr><td style="padding:0 0 14px;">' .
        '<p style="margin:0;font-family:' . $sans . ';font-size:13px;line-height:1.45;color:#ffffff;font-weight:700;">' .
        $logoFooter . 'Auburn VSA</p>' .
        '<p style="margin:6px 0 0;font-family:' . $sans .
        ';font-size:12px;line-height:1.45;color:rgba(255,255,255,0.7);">' .
        newsletter_compose_esc($meta['university']) .
        ($meta['email'] !== ''
            ? ' · <a href="mailto:' . newsletter_compose_esc($meta['email']) .
                '" style="color:rgba(255,255,255,0.7);text-decoration:none;">' .
                newsletter_compose_esc($meta['email']) . '</a>'
            : '') .
        '</p></td></tr>' .
        '<tr><td style="padding:14px 0 0;border-top:1px solid rgba(255,255,255,0.12);">' .
        '<p style="margin:0 0 10px;font-family:' . $sans .
        ';font-size:12px;line-height:1.5;color:rgba(255,255,255,0.62);">' .
        'You received this because you subscribed on auburnvsa.com' .
        '</p>' .
        '<p style="margin:0;font-family:' . $sans . ';font-size:12px;line-height:1.5;">' .
        $footerLinks .
        '</p></td></tr></table></td></tr>' .
        '</table></td></tr></table></body></html>';
}

/**
 * @param array<string,mixed> $draft
 * @param bool $forEmail Use public image URLs suitable for Gmail (not localhost).
 */
function newsletter_compose_render_plain(array $draft, bool $forEmail = false): string
{
    $draft = newsletter_compose_normalize($draft);
    $lines = [];
    if ($draft['subject'] !== '') {
        $lines[] = $draft['subject'];
        $lines[] = str_repeat('=', min(48, max(8, strlen($draft['subject']))));
        $lines[] = '';
    }
    $pre = newsletter_compose_preheader_text($draft);
    if ($pre !== '') {
        $lines[] = $pre;
        $lines[] = '';
    }
    if ($draft['headline'] !== '') {
        $lines[] = $draft['headline'];
        $lines[] = '';
    }
    if ($draft['intro'] !== '') {
        $lines[] = $draft['intro'];
        $lines[] = '';
    }
    foreach ($draft['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = (string) ($item['title'] ?? '');
        $when = (string) ($item['when'] ?? '');
        $where = (string) ($item['where'] ?? '');
        $blurb = (string) ($item['blurb'] ?? '');
        $link = (string) ($item['link'] ?? '');
        $image = (string) ($item['image'] ?? '');
        if ($title === '' && $when === '' && $where === '' && $blurb === '' && $link === '' && $image === '') {
            continue;
        }
        if ($image !== '') {
            $lines[] = '[Photo] ' . newsletter_compose_abs_url($image, $forEmail);
        }
        if ($title !== '') {
            $lines[] = $title;
        }
        if ($when !== '' || $where !== '') {
            $bits = array_filter([$when, $where], static fn ($v) => $v !== '');
            $lines[] = implode(' · ', $bits);
        }
        if ($blurb !== '') {
            foreach (preg_split("/\r\n|\n|\r/", $blurb) ?: [] as $bl) {
                $lines[] = $bl;
            }
        }
        if ($link !== '') {
            $lines[] = newsletter_compose_href($link, $forEmail);
        }
        $lines[] = '';
    }
    if ($draft['ctaLabel'] !== '' && $draft['ctaUrl'] !== '') {
        $lines[] = $draft['ctaLabel'] . ': ' . newsletter_compose_href($draft['ctaUrl'], $forEmail);
        $lines[] = '';
    }
    $lines[] = '—';
    if ($draft['closing'] !== '') {
        $lines[] = $draft['closing'];
        $lines[] = '';
    }
    if ($draft['signoff'] !== '') {
        $lines[] = $draft['signoff'];
    }
    $lines[] = '';
    $lines[] = 'Unsubscribe: ' . newsletter_compose_abs_url('unsubscribe.html', $forEmail);

    return implode("\n", $lines);
}
