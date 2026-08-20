<?php
// Admin / staff action audit log (append-only capped JSON in data/).

require_once __DIR__ . '/config.php';

define('ACTIVITY_LOG_FILE', DATA_DIR . '/activity_log.json');
define('ACTIVITY_LOG_MAX', 5000);

/** Keys never stored in activity meta (case-insensitive substring match). */
function activity_secret_key_patterns(): array
{
    return [
        'password',
        'passwd',
        'passhash',
        'hash',
        'token',
        'csrf',
        'secret',
        'cookie',
        'session',
        'authorization',
        'api_key',
        'apikey',
    ];
}

function activity_key_looks_secret(string $key): bool
{
    $k = strtolower($key);
    foreach (activity_secret_key_patterns() as $pat) {
        if (str_contains($k, $pat)) {
            return true;
        }
    }
    return false;
}

/**
 * Strip secrets and oversized values from meta before persisting.
 * @param mixed $value
 * @return mixed
 */
function activity_sanitize_meta($value, int $depth = 0)
{
    if ($depth > 3) {
        return null;
    }
    if (is_array($value)) {
        $out = [];
        $n = 0;
        foreach ($value as $k => $v) {
            if ($n >= 40) {
                break;
            }
            $key = is_string($k) ? $k : (string) $k;
            if (activity_key_looks_secret($key)) {
                continue;
            }
            $clean = activity_sanitize_meta($v, $depth + 1);
            if ($clean === null && !is_bool($v) && $v !== 0 && $v !== '0') {
                continue;
            }
            $out[$key] = $clean;
            $n++;
        }
        return $out;
    }
    if (is_bool($value) || is_int($value) || is_float($value)) {
        return $value;
    }
    if ($value === null) {
        return null;
    }
    $str = (string) $value;
    if (function_exists('mb_substr')) {
        return mb_substr($str, 0, 500);
    }
    return substr($str, 0, 500);
}

function activity_client_ip(): string
{
    if (function_exists('client_ip')) {
        return client_ip();
    }
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if (filter_var($remote, FILTER_VALIDATE_IP)) {
        return $remote;
    }
    return '0.0.0.0';
}

function activity_read_json(string $file, $fallback = [])
{
    if (!is_readable($file)) {
        return $fallback;
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $fallback;
}

function activity_write_json(string $file, $data): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return false;
    }
    vsa_chmod_private($file);
    return true;
}

/** @return list<array> */
function get_activity_log(): array
{
    $decoded = activity_read_json(ACTIVITY_LOG_FILE, []);
    if (isset($decoded['entries']) && is_array($decoded['entries'])) {
        return array_values(array_filter($decoded['entries'], 'is_array'));
    }
    return array_values(array_filter($decoded, 'is_array'));
}

function save_activity_log(array $entries): bool
{
    return activity_write_json(ACTIVITY_LOG_FILE, [
        'version' => 1,
        'updatedAt' => date('c'),
        'entries' => array_values($entries),
    ]);
}

/**
 * Resolve actor fields from an explicit meta override or the current admin session.
 * @return array{username:string,role:string}
 */
function activity_resolve_actor(array $meta): array
{
    $username = trim((string) ($meta['username'] ?? ''));
    $role = trim((string) ($meta['role'] ?? ''));

    if ($username === '' && function_exists('is_logged_in') && is_logged_in()) {
        if (function_exists('current_username')) {
            $username = (string) current_username();
        }
        if ($role === '' && function_exists('current_user_is_root')) {
            $role = current_user_is_root() ? 'root' : 'editor';
        } elseif ($role === '' && !empty($_SESSION['vsa_role'])) {
            $role = (string) $_SESSION['vsa_role'];
        }
    }

    if ($role === '' && $username === 'public') {
        $role = 'public';
    }

    return ['username' => $username, 'role' => $role];
}

/**
 * Append an activity entry (login, logout, CMS saves, etc.).
 * Meta may include: ip, username, role, detail/summary, and arbitrary safe fields under meta.
 */
function log_activity(string $action, array $meta = []): void
{
    $action = preg_replace('/[^a-z0-9_.-]+/i', '_', trim($action)) ?: 'unknown';
    $actor = activity_resolve_actor($meta);
    $detail = (string) ($meta['detail'] ?? $meta['summary'] ?? '');
    if (function_exists('mb_substr')) {
        $detail = mb_substr($detail, 0, 400);
    } else {
        $detail = substr($detail, 0, 400);
    }

    $extra = $meta;
    unset($extra['ip'], $extra['username'], $extra['role'], $extra['detail'], $extra['summary'], $extra['userAgent']);
    if (isset($meta['meta']) && is_array($meta['meta'])) {
        unset($extra['meta']);
        $extra = array_merge($extra, $meta['meta']);
    }
    $cleanMeta = activity_sanitize_meta($extra);
    if (!is_array($cleanMeta)) {
        $cleanMeta = [];
    }

    $entry = [
        'id' => bin2hex(random_bytes(6)),
        'action' => $action,
        'ip' => (string) ($meta['ip'] ?? activity_client_ip()),
        'username' => $actor['username'],
        'role' => $actor['role'],
        'detail' => $detail,
        'meta' => $cleanMeta,
        'userAgent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 240),
        'createdAt' => date('c'),
    ];

    $entries = get_activity_log();
    $entries[] = $entry;
    $max = defined('ACTIVITY_LOG_MAX') ? (int) ACTIVITY_LOG_MAX : 5000;
    if ($max < 100) {
        $max = 100;
    }
    if (count($entries) > $max) {
        $entries = array_slice($entries, -$max);
    }
    save_activity_log($entries);
}

/**
 * Convenience wrapper for authenticated privileged actions.
 * Auto-fills actor from the session when username/role are omitted.
 */
function log_admin_action(string $action, string $summary = '', array $meta = []): void
{
    if ($summary !== '' && !isset($meta['detail']) && !isset($meta['summary'])) {
        $meta['summary'] = $summary;
    }
    log_activity($action, $meta);
}

/**
 * Newest-first filtered view for the admin UI.
 *
 * @return array{items:list<array>,total:int,filtered:int}
 */
function filter_activity_log(array $opts = []): array
{
    $entries = get_activity_log();
    $total = count($entries);
    $actor = strtolower(trim((string) ($opts['actor'] ?? '')));
    $action = strtolower(trim((string) ($opts['action'] ?? '')));
    $q = strtolower(trim((string) ($opts['q'] ?? '')));
    $limit = (int) ($opts['limit'] ?? 200);
    if ($limit < 1) {
        $limit = 200;
    }
    if ($limit > 1000) {
        $limit = 1000;
    }

    $filtered = [];
    for ($i = $total - 1; $i >= 0; $i--) {
        $row = $entries[$i];
        if (!is_array($row)) {
            continue;
        }
        $rowActor = strtolower((string) ($row['username'] ?? ''));
        $rowAction = strtolower((string) ($row['action'] ?? ''));
        $rowDetail = strtolower((string) ($row['detail'] ?? ''));
        if ($actor !== '' && $rowActor !== $actor && !str_contains($rowActor, $actor)) {
            continue;
        }
        if ($action !== '' && $rowAction !== $action && !str_contains($rowAction, $action)) {
            continue;
        }
        if ($q !== '') {
            $hay = $rowActor . ' ' . $rowAction . ' ' . $rowDetail . ' ' . strtolower((string) ($row['ip'] ?? ''));
            if (!str_contains($hay, $q)) {
                continue;
            }
        }
        $filtered[] = $row;
        if (count($filtered) >= $limit) {
            break;
        }
    }

    return [
        'items' => $filtered,
        'total' => $total,
        'filtered' => count($filtered),
    ];
}

/** Distinct actors / actions for filter dropdowns (from recent log). */
function activity_log_facets(int $scan = 2000): array
{
    $entries = get_activity_log();
    $n = count($entries);
    $start = max(0, $n - $scan);
    $actors = [];
    $actions = [];
    for ($i = $start; $i < $n; $i++) {
        $row = $entries[$i];
        if (!is_array($row)) {
            continue;
        }
        $u = trim((string) ($row['username'] ?? ''));
        $a = trim((string) ($row['action'] ?? ''));
        if ($u !== '') {
            $actors[$u] = true;
        }
        if ($a !== '') {
            $actions[$a] = true;
        }
    }
    $actorList = array_keys($actors);
    $actionList = array_keys($actions);
    sort($actorList, SORT_STRING | SORT_FLAG_CASE);
    sort($actionList, SORT_STRING | SORT_FLAG_CASE);
    return ['actors' => $actorList, 'actions' => $actionList];
}

/**
 * Dashboard timeline: last live publish vs last admin content edit.
 * Uses activity log when present; falls back to content / schedule file mtimes.
 *
 * @return array{lastPublished:?string,lastEdited:?string,lastPublishedSource:string,lastEditedSource:string}
 */
function activity_content_timeline(): array
{
    $publishedActions = [
        'content_save' => true,
        'faq_inbox_publish' => true,
        'publish_apply' => true,
    ];
    $editedActions = [
        'content_save' => true,
        'faq_inbox_publish' => true,
        'publish_apply' => true,
        'publish_schedule' => true,
    ];

    $lastPublished = null;
    $lastEdited = null;
    $pubSource = 'none';
    $editSource = 'none';

    $entries = get_activity_log();
    for ($i = count($entries) - 1; $i >= 0; $i--) {
        $row = $entries[$i];
        if (!is_array($row)) {
            continue;
        }
        $action = strtolower((string) ($row['action'] ?? ''));
        $at = trim((string) ($row['createdAt'] ?? ''));
        if ($at === '') {
            continue;
        }
        if ($lastPublished === null && isset($publishedActions[$action])) {
            $lastPublished = $at;
            $pubSource = 'activity:' . $action;
        }
        if ($lastEdited === null && isset($editedActions[$action])) {
            $lastEdited = $at;
            $editSource = 'activity:' . $action;
        }
        if ($lastPublished !== null && $lastEdited !== null) {
            break;
        }
    }

    $contentFile = defined('CONTENT_FILE') ? CONTENT_FILE : (DATA_DIR . '/content.json');
    if (is_file($contentFile)) {
        $mtime = (int) @filemtime($contentFile);
        if ($mtime > 0) {
            $iso = date('c', $mtime);
            if ($lastPublished === null) {
                $lastPublished = $iso;
                $pubSource = 'content_mtime';
            }
            if ($lastEdited === null) {
                $lastEdited = $iso;
                $editSource = 'content_mtime';
            }
        }
    }

    $schedFile = DATA_DIR . '/scheduled_publish.json';
    if (is_file($schedFile)) {
        $mtime = (int) @filemtime($schedFile);
        if ($mtime > 0) {
            $iso = date('c', $mtime);
            $editTs = $lastEdited ? (strtotime($lastEdited) ?: 0) : 0;
            if ($mtime > $editTs) {
                $lastEdited = $iso;
                $editSource = 'schedule_mtime';
            }
        }
    }

    return [
        'lastPublished' => $lastPublished,
        'lastEdited' => $lastEdited,
        'lastPublishedSource' => $pubSource,
        'lastEditedSource' => $editSource,
    ];
}
