<?php
// Scheduled publish queue — apply due jobs on content read.

require_once __DIR__ . '/config.php';

define('SCHEDULED_PUBLISH_FILE', DATA_DIR . '/scheduled_publish.json');

/**
 * @return array{items:list<array>}
 */
function publish_queue_default(): array
{
    return ['items' => []];
}

function publish_queue_path(): string
{
    return SCHEDULED_PUBLISH_FILE;
}

/**
 * @return array{items:list<array>}
 */
function publish_queue_read(): array
{
    $path = publish_queue_path();
    if (!is_readable($path)) {
        return publish_queue_default();
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw !== false ? $raw : '', true);
    if (!is_array($data)) {
        return publish_queue_default();
    }
    if (!isset($data['items']) || !is_array($data['items'])) {
        $data['items'] = [];
    }
    return $data;
}

/**
 * @param array{items:list<array>} $queue
 */
function publish_queue_write(array $queue): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    if (!isset($queue['items']) || !is_array($queue['items'])) {
        $queue['items'] = [];
    }
    $json = json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $path = publish_queue_path();
    $tmp = $path . '.tmp.' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (@rename($tmp, $path)) {
        return true;
    }
    if (is_file($path) && !@unlink($path)) {
        @unlink($tmp);
        return false;
    }
    if (@rename($tmp, $path)) {
        return true;
    }
    $ok = @copy($tmp, $path);
    @unlink($tmp);
    return $ok;
}

/**
 * Parse publish-at string to Unix timestamp, or null if invalid.
 */
function publish_parse_at(string $at): ?int
{
    $at = trim($at);
    if ($at === '') {
        return null;
    }
    try {
        $dt = new DateTimeImmutable($at);
    } catch (Exception $e) {
        return null;
    }
    return $dt->getTimestamp();
}

/**
 * @param array<string,mixed> $sections sectionKey => value
 * @param array{page?:string,username?:string} $meta
 * @return array{ok:bool,error?:string,id?:string,item?:array}
 */
function publish_enqueue(array $sections, string $publishAt, array $meta = []): array
{
    $ts = publish_parse_at($publishAt);
    if ($ts === null) {
        return ['ok' => false, 'error' => 'Invalid publish date/time.'];
    }
    if ($ts <= time()) {
        return ['ok' => false, 'error' => 'Scheduled time must be in the future. Use Publish ASAP instead.'];
    }
    if ($sections === []) {
        return ['ok' => false, 'error' => 'Nothing to schedule.'];
    }
    foreach ($sections as $key => $_val) {
        if (!in_array($key, CONTENT_SECTIONS, true)) {
            return ['ok' => false, 'error' => 'Unknown section: ' . $key];
        }
    }

    $id = bin2hex(random_bytes(8));
    $item = [
        'id' => $id,
        'publishAt' => (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone(date_default_timezone_get() ?: 'UTC'))->format(DateTimeInterface::ATOM),
        'publishAtUnix' => $ts,
        'sections' => $sections,
        'page' => (string) ($meta['page'] ?? ''),
        'createdAt' => date('c'),
        'createdBy' => (string) ($meta['username'] ?? ''),
    ];

    $queue = publish_queue_read();
    $queue['items'][] = $item;
    if (!publish_queue_write($queue)) {
        return ['ok' => false, 'error' => 'Could not write schedule queue.'];
    }
    return ['ok' => true, 'id' => $id, 'item' => $item];
}

/**
 * @return list<array>
 */
function publish_list_pending(): array
{
    $queue = publish_queue_read();
    $now = time();
    $out = [];
    foreach ($queue['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $ts = (int) ($item['publishAtUnix'] ?? 0);
        if ($ts <= 0 && isset($item['publishAt'])) {
            $ts = publish_parse_at((string) $item['publishAt']) ?? 0;
        }
        // Still pending if not yet due (due ones are applied on read).
        if ($ts > $now) {
            $out[] = $item;
        }
    }
    usort($out, static function ($a, $b) {
        return ((int) ($a['publishAtUnix'] ?? 0)) <=> ((int) ($b['publishAtUnix'] ?? 0));
    });
    return $out;
}

/**
 * @return array{ok:bool,error?:string}
 */
function publish_cancel(string $id): array
{
    $id = preg_replace('/[^a-f0-9]/', '', strtolower($id)) ?? '';
    if ($id === '') {
        return ['ok' => false, 'error' => 'Invalid schedule id.'];
    }
    $queue = publish_queue_read();
    $before = count($queue['items']);
    $queue['items'] = array_values(array_filter(
        $queue['items'],
        static function ($item) use ($id) {
            return !is_array($item) || (string) ($item['id'] ?? '') !== $id;
        }
    ));
    if (count($queue['items']) === $before) {
        return ['ok' => false, 'error' => 'Schedule not found.'];
    }
    if (!publish_queue_write($queue)) {
        return ['ok' => false, 'error' => 'Could not update schedule queue.'];
    }
    return ['ok' => true];
}

/**
 * Load raw saved content (no defaults merge, no apply) for apply path.
 *
 * @return array<string,mixed>
 */
function publish_load_saved_content(): array
{
    if (!file_exists(CONTENT_FILE)) {
        return default_content();
    }
    $raw = file_get_contents(CONTENT_FILE);
    $saved = json_decode($raw !== false ? $raw : '', true);
    if (!is_array($saved)) {
        return default_content();
    }
    return merge_content(default_content(), $saved);
}

/**
 * Apply due scheduled jobs into live content.json.
 *
 * @return array{applied:list<string>,sections:list<string>}
 */
function publish_apply_due(): array
{
    static $busy = false;
    if ($busy) {
        return ['applied' => [], 'sections' => []];
    }
    $busy = true;
    try {
        $queue = publish_queue_read();
        if ($queue['items'] === []) {
            return ['applied' => [], 'sections' => []];
        }

        $now = time();
        $due = [];
        $keep = [];
        foreach ($queue['items'] as $item) {
            if (!is_array($item)) {
                continue;
            }
            $ts = (int) ($item['publishAtUnix'] ?? 0);
            if ($ts <= 0 && isset($item['publishAt'])) {
                $ts = publish_parse_at((string) $item['publishAt']) ?? 0;
            }
            if ($ts > 0 && $ts <= $now) {
                $due[] = $item;
            } else {
                $keep[] = $item;
            }
        }

        if ($due === []) {
            return ['applied' => [], 'sections' => []];
        }

        $content = publish_load_saved_content();
        $appliedIds = [];
        $sectionKeys = [];

        foreach ($due as $item) {
            $sections = $item['sections'] ?? null;
            if (!is_array($sections)) {
                $appliedIds[] = (string) ($item['id'] ?? '');
                continue;
            }
            foreach ($sections as $key => $value) {
                if (!in_array($key, CONTENT_SECTIONS, true)) {
                    continue;
                }
                if ($key === 'links' && is_array($value) && is_array($content['links'] ?? null)) {
                    foreach ($value as $lk => $lv) {
                        $content['links'][$lk] = $lv;
                    }
                } else {
                    $content[$key] = $value;
                }
                $sectionKeys[$key] = true;
            }
            $appliedIds[] = (string) ($item['id'] ?? '');
        }

        if (!save_content($content)) {
            return ['applied' => [], 'sections' => []];
        }

        $queue['items'] = $keep;
        publish_queue_write($queue);

        if (!function_exists('log_activity')) {
            require_once __DIR__ . '/activity.php';
        }
        if (function_exists('log_activity')) {
            log_activity('publish_apply', [
                'summary' => 'Applied scheduled publish',
                'meta' => [
                    'ids' => $appliedIds,
                    'sections' => array_keys($sectionKeys),
                ],
            ]);
        }

        return ['applied' => $appliedIds, 'sections' => array_keys($sectionKeys)];
    } finally {
        $busy = false;
    }
}

/**
 * Drop section keys from future jobs (ASAP publish supersedes them).
 * Removes jobs that become empty.
 *
 * @param list<string> $sectionKeys
 */
function publish_remove_sections_from_pending(array $sectionKeys): void
{
    if ($sectionKeys === []) {
        return;
    }
    $want = [];
    foreach ($sectionKeys as $k) {
        $want[$k] = true;
    }
    $queue = publish_queue_read();
    $next = [];
    foreach ($queue['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $ts = (int) ($item['publishAtUnix'] ?? 0);
        if ($ts > 0 && $ts <= time()) {
            // Leave due items for apply_due
            $next[] = $item;
            continue;
        }
        $sections = is_array($item['sections'] ?? null) ? $item['sections'] : [];
        foreach ($want as $key => $_true) {
            unset($sections[$key]);
        }
        if ($sections === []) {
            continue;
        }
        $item['sections'] = $sections;
        $next[] = $item;
    }
    $queue['items'] = $next;
    publish_queue_write($queue);
}

/**
 * Overlay future pending section values onto content for the admin editor.
 *
 * @param array<string,mixed> $content
 * @param list<array> $pending
 * @return array<string,mixed>
 */
function publish_merge_pending_for_admin(array $content, array $pending): array
{
    foreach ($pending as $item) {
        if (!is_array($item)) {
            continue;
        }
        $sections = $item['sections'] ?? null;
        if (!is_array($sections)) {
            continue;
        }
        foreach ($sections as $key => $value) {
            if (!in_array($key, CONTENT_SECTIONS, true)) {
                continue;
            }
            if ($key === 'links' && is_array($value) && is_array($content['links'] ?? null)) {
                foreach ($value as $lk => $lv) {
                    $content['links'][$lk] = $lv;
                }
            } else {
                $content[$key] = $value;
            }
        }
    }
    return $content;
}
