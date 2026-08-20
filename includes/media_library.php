<?php
// Media library helpers — list uploads and find where each file is referenced.

require_once __DIR__ . '/config.php';

/**
 * @return list<array{name:string,url:string,mtime:int,size:int}>
 */
function media_list_images(int $limit = 0): array
{
    if (!is_dir(UPLOADS_DIR)) {
        return [];
    }
    $files = [];
    $dh = opendir(UPLOADS_DIR);
    if ($dh === false) {
        return [];
    }
    while (($name = readdir($dh)) !== false) {
        if ($name === '.' || $name === '..' || $name === '.gitkeep') {
            continue;
        }
        if (str_contains($name, '/') || str_contains($name, '\\') || str_contains($name, '..')) {
            continue;
        }
        if (!preg_match('/\.(png|jpe?g|webp|gif)$/i', $name)) {
            continue;
        }
        if (!preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
            continue;
        }
        $path = UPLOADS_DIR . DIRECTORY_SEPARATOR . $name;
        if (!is_file($path)) {
            continue;
        }
        $files[] = [
            'name' => $name,
            'url' => UPLOADS_URL . '/' . $name,
            'mtime' => (int) filemtime($path),
            'size' => (int) filesize($path),
        ];
    }
    closedir($dh);
    usort($files, static function ($a, $b) {
        return ($b['mtime'] ?? 0) <=> ($a['mtime'] ?? 0);
    });
    if ($limit > 0) {
        return array_slice($files, 0, max(1, $limit));
    }
    return $files;
}

/**
 * If $value points at an uploads/ file, return its basename; else null.
 */
function media_upload_basename(string $value): ?string
{
    $value = trim($value);
    if ($value === '' || str_contains($value, '..')) {
        return null;
    }
    // Absolute or protocol-relative URLs: keep path only.
    if (preg_match('#^(?:https?:)?//[^/]+(/.*)$#i', $value, $m)) {
        $value = $m[1];
    }
    $value = str_replace('\\', '/', $value);
    if ($value !== '' && $value[0] === '/') {
        $value = substr($value, 1);
    }
    $prefix = UPLOADS_URL . '/';
    if (stripos($value, $prefix) !== 0) {
        // Bare filename that looks like a CMS upload.
        if (preg_match('/^[A-Za-z0-9._-]+\.(png|jpe?g|webp|gif)$/i', $value)) {
            $path = UPLOADS_DIR . DIRECTORY_SEPARATOR . $value;
            return is_file($path) ? $value : null;
        }
        return null;
    }
    $name = substr($value, strlen($prefix));
    if ($name === '' || str_contains($name, '/') || !preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
        return null;
    }
    if (!preg_match('/\.(png|jpe?g|webp|gif)$/i', $name)) {
        return null;
    }
    return $name;
}

/**
 * @return array<string, string> top-level content key → admin page id
 */
function media_section_page_map(): array
{
    return [
        'site' => 'site',
        'branding' => 'site',
        'effects' => 'team',
        'socials' => 'site',
        'links' => 'home',
        'home' => 'home',
        'team' => 'team',
        'events' => 'events',
        'royale' => 'royale',
        'gallery' => 'gallery',
        'merch' => 'merch',
        'faqs' => 'faqs',
        'music' => 'music',
    ];
}

/**
 * @return array<string, string>
 */
function media_section_labels(): array
{
    return [
        'site' => 'Site',
        'branding' => 'Site · Branding',
        'effects' => 'Team · Effects',
        'socials' => 'Site · Socials',
        'links' => 'Links',
        'home' => 'Home',
        'team' => 'Team',
        'events' => 'Events',
        'royale' => 'AU Royale',
        'gallery' => 'Gallery',
        'merch' => 'Merch',
        'faqs' => 'FAQs',
        'music' => 'Music',
        'tracks' => 'Tracks',
        'executiveBoard' => 'Executive Board',
        'techTeam' => 'Tech Team',
        'royaleDirectors' => 'AU Royale Directors',
        'whyJoin' => 'Why Join',
        'galleryImages' => 'Org pictures',
        'howToJoinSteps' => 'How to join',
        'instagramPosts' => 'Instagram',
        'alumni' => 'Where we are now',
        'upcoming' => 'Upcoming',
        'past' => 'Past',
        'sponsors' => 'Sponsors',
        'showcase' => 'Showcase',
        'products' => 'Products',
        'years' => 'School years',
        'albums' => 'Albums',
        'images' => 'Photos',
        'heroImage' => 'Hero image',
        'image' => 'Image',
        'logo' => 'Logo',
        'endOfYearVideo' => 'End-of-year video',
        'cover' => 'Cover',
    ];
}

/**
 * @param list<string|int> $parts
 */
function media_usage_label(array $parts, string $source): string
{
    $labels = media_section_labels();
    $bits = [];
    foreach ($parts as $part) {
        if (is_int($part) || (is_string($part) && ctype_digit($part))) {
            $bits[] = '#' . ((int) $part + 1);
            continue;
        }
        $key = (string) $part;
        if (isset($labels[$key])) {
            $bits[] = $labels[$key];
        } else {
            // camelCase / snake → spaced
            $bits[] = ucwords(trim(preg_replace('/([a-z])([A-Z])/', '$1 $2', str_replace('_', ' ', $key)) ?? $key));
        }
    }
    $label = implode(' · ', array_values(array_filter($bits, static fn ($b) => $b !== '')));
    if ($source === 'newsletter-draft') {
        return ($label !== '' ? $label : 'Draft fields') . ' (Newsletter draft)';
    }
    if ($source === 'scheduled-publish') {
        return ($label !== '' ? $label : 'Queued sections') . ' (Scheduled publish)';
    }
    return $label !== '' ? $label : 'Content';
}

/**
 * @param mixed $node
 * @param list<string|int> $path
 * @param array<string, list<array<string, mixed>>> $out keyed by basename
 */
function media_walk_refs($node, array $path, string $source, array &$out): void
{
    if (is_string($node)) {
        $base = media_upload_basename($node);
        if ($base === null) {
            return;
        }
        $pageMap = media_section_page_map();
        $top = isset($path[0]) ? (string) $path[0] : '';
        $page = $pageMap[$top] ?? ($source === 'newsletter-draft' ? 'subscribers' : 'home');
        if ($source === 'scheduled-publish') {
            $page = $pageMap[$top] ?? 'publish';
        }
        $out[$base][] = [
            'page' => $page,
            'section' => $top,
            'path' => media_path_string($path),
            'label' => media_usage_label($path, $source),
            'source' => $source,
        ];
        return;
    }
    if (!is_array($node)) {
        return;
    }
    foreach ($node as $key => $child) {
        if ($key === '_meta' || $key === 'passwordHash' || $key === 'password') {
            continue;
        }
        $next = $path;
        $next[] = is_int($key) ? $key : (string) $key;
        media_walk_refs($child, $next, $source, $out);
    }
}

/**
 * @param list<string|int> $parts
 */
function media_path_string(array $parts): string
{
    $s = '';
    foreach ($parts as $part) {
        if (is_int($part) || (is_string($part) && ctype_digit($part))) {
            $s .= '[' . (int) $part . ']';
        } else {
            $s .= ($s === '' ? '' : '.') . $part;
        }
    }
    return $s;
}

/**
 * @return array<string, list<array<string, mixed>>>
 */
function media_usage_index(): array
{
    $out = [];

    require_once __DIR__ . '/content.php';
    $content = get_content();
    media_walk_refs($content, [], 'content', $out);

    $draftFile = DATA_DIR . '/newsletter_drafts.json';
    if (is_readable($draftFile)) {
        $draftPayload = json_decode((string) file_get_contents($draftFile), true);
        if (is_array($draftPayload)) {
            if (isset($draftPayload['drafts']) && is_array($draftPayload['drafts'])) {
                foreach ($draftPayload['drafts'] as $i => $entry) {
                    if (!is_array($entry)) {
                        continue;
                    }
                    $label = trim((string) ($entry['name'] ?? ''));
                    if ($label === '') {
                        $label = 'Draft ' . ((int) $i + 1);
                    }
                    media_walk_refs($entry, ['newsletter', $label], 'newsletter-draft', $out);
                }
            } else {
                // Legacy single-draft file.
                media_walk_refs($draftPayload, ['newsletter'], 'newsletter-draft', $out);
            }
        }
    }

    $schedFile = DATA_DIR . '/scheduled_publish.json';
    if (is_readable($schedFile)) {
        $sched = json_decode((string) file_get_contents($schedFile), true);
        if (is_array($sched)) {
            $jobs = $sched['items'] ?? $sched['jobs'] ?? null;
            if (is_array($jobs)) {
                foreach ($jobs as $job) {
                    if (!is_array($job)) {
                        continue;
                    }
                    $sections = $job['sections'] ?? null;
                    if (is_array($sections)) {
                        media_walk_refs($sections, [], 'scheduled-publish', $out);
                    }
                }
            }
        }
    }

    // Deduplicate identical usage rows per file.
    foreach ($out as $name => $rows) {
        $seen = [];
        $unique = [];
        foreach ($rows as $row) {
            $key = ($row['source'] ?? '') . '|' . ($row['path'] ?? '') . '|' . ($row['label'] ?? '');
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $row;
        }
        $out[$name] = $unique;
    }

    return $out;
}

/**
 * Validate an uploads basename for delete/list detail operations.
 */
function media_safe_basename(string $name): ?string
{
    $name = basename(str_replace('\\', '/', trim($name)));
    if ($name === '' || $name === '.' || $name === '..' || $name === '.gitkeep') {
        return null;
    }
    if (!preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
        return null;
    }
    if (!preg_match('/\.(png|jpe?g|webp|gif)$/i', $name)) {
        return null;
    }
    return $name;
}

/**
 * Permanently delete an image from /uploads.
 *
 * @return array{ok:bool,error?:string,name?:string,url?:string,usageCount?:int}
 */
function media_delete_image(string $name): array
{
    $safe = media_safe_basename($name);
    if ($safe === null) {
        return ['ok' => false, 'error' => 'Invalid file name.'];
    }
    $path = UPLOADS_DIR . DIRECTORY_SEPARATOR . $safe;
    $realUploads = realpath(UPLOADS_DIR);
    $realFile = realpath($path);
    if ($realUploads === false || $realFile === false || !is_file($realFile)) {
        return ['ok' => false, 'error' => 'File not found.'];
    }
    // Stay inside uploads/ (defend against odd realpath edge cases).
    $prefix = $realUploads . DIRECTORY_SEPARATOR;
    if (!str_starts_with($realFile, $prefix) && $realFile !== $realUploads) {
        return ['ok' => false, 'error' => 'Invalid file path.'];
    }
    $index = media_usage_index();
    $usageCount = count($index[$safe] ?? []);
    if (!@unlink($realFile)) {
        return ['ok' => false, 'error' => 'Could not delete the file.'];
    }
    clearstatcache(true, $realFile);
    return [
        'ok' => true,
        'name' => $safe,
        'url' => UPLOADS_URL . '/' . $safe,
        'usageCount' => $usageCount,
    ];
}

/**
 * Build a safe new basename from user input, keeping the original extension.
 */
function media_propose_basename(string $desired, string $oldName): ?string
{
    $desired = trim(str_replace(['\\', '/'], '', $desired));
    $desired = preg_replace('/\s+/', '-', $desired) ?? $desired;
    $oldSafe = media_safe_basename($oldName);
    if ($oldSafe === null) {
        return null;
    }
    $oldExt = strtolower(pathinfo($oldSafe, PATHINFO_EXTENSION));
    if ($oldExt === '') {
        return null;
    }

    $base = $desired;
    $dot = strrpos($desired, '.');
    if ($dot !== false) {
        $ext = strtolower(substr($desired, $dot + 1));
        $stem = substr($desired, 0, $dot);
        if ($ext !== '' && $ext !== $oldExt) {
            return null; // keep extension stable so content type stays valid
        }
        $base = $stem !== '' ? $stem : pathinfo($oldSafe, PATHINFO_FILENAME);
    }
    $base = preg_replace('/[^A-Za-z0-9._-]+/', '-', $base) ?? '';
    $base = trim($base, '.-_');
    if ($base === '') {
        return null;
    }
    if (function_exists('mb_substr')) {
        $base = mb_substr($base, 0, 80);
    } else {
        $base = substr($base, 0, 80);
    }
    return media_safe_basename($base . '.' . $oldExt);
}

/**
 * Rewrite a string leaf that pointed at $oldName to the new uploads path.
 */
function media_rewrite_string_ref(string $value, string $oldName, string $newName): string
{
    $matched = media_upload_basename($value);
    if ($matched === null || strcasecmp($matched, $oldName) !== 0) {
        return $value;
    }
    $newUrl = UPLOADS_URL . '/' . $newName;
    $trim = trim($value);
    // Absolute / protocol-relative URL → swap basename only.
    if (preg_match('#^(https?:)?//#i', $trim)) {
        return preg_replace('#/[^/]+$#', '/' . $newName, $trim) ?: $newUrl;
    }
    // Bare filename only.
    if (!str_contains(str_replace('\\', '/', $trim), '/')) {
        return $newName;
    }
    return $newUrl;
}

/**
 * @param mixed $node
 * @return int number of string leaves rewritten
 */
function media_rewrite_refs_in_tree(&$node, string $oldName, string $newName): int
{
    $n = 0;
    if (is_string($node)) {
        $next = media_rewrite_string_ref($node, $oldName, $newName);
        if ($next !== $node) {
            $node = $next;
            return 1;
        }
        return 0;
    }
    if (!is_array($node)) {
        return 0;
    }
    foreach ($node as $k => &$child) {
        $n += media_rewrite_refs_in_tree($child, $oldName, $newName);
    }
    unset($child);
    return $n;
}

/**
 * Rename an upload and rewrite CMS / newsletter draft / scheduled-publish refs.
 *
 * @return array{ok:bool,error?:string,oldName?:string,name?:string,url?:string,rewritten?:int,usageCount?:int}
 */
function media_rename_image(string $oldName, string $newName): array
{
    require_once __DIR__ . '/content.php';
    require_once __DIR__ . '/publish.php';
    require_once __DIR__ . '/security.php';

    $oldSafe = media_safe_basename($oldName);
    if ($oldSafe === null) {
        return ['ok' => false, 'error' => 'Invalid current file name.'];
    }
    $newSafe = media_propose_basename($newName, $oldSafe);
    if ($newSafe === null) {
        return [
            'ok' => false,
            'error' => 'Invalid new name. Use letters, numbers, dots, dashes, or underscores — keep the same image extension.',
        ];
    }
    if (strcasecmp($oldSafe, $newSafe) === 0) {
        return [
            'ok' => true,
            'oldName' => $oldSafe,
            'name' => $oldSafe,
            'url' => UPLOADS_URL . '/' . $oldSafe,
            'rewritten' => 0,
            'usageCount' => count(media_usage_index()[$oldSafe] ?? []),
        ];
    }

    $oldPath = UPLOADS_DIR . DIRECTORY_SEPARATOR . $oldSafe;
    $newPath = UPLOADS_DIR . DIRECTORY_SEPARATOR . $newSafe;
    $realUploads = realpath(UPLOADS_DIR);
    $realFile = realpath($oldPath);
    if ($realUploads === false || $realFile === false || !is_file($realFile)) {
        return ['ok' => false, 'error' => 'File not found.'];
    }
    $prefix = $realUploads . DIRECTORY_SEPARATOR;
    if (!str_starts_with($realFile, $prefix) && $realFile !== $realUploads) {
        return ['ok' => false, 'error' => 'Invalid file path.'];
    }
    if (is_file($newPath)) {
        return ['ok' => false, 'error' => 'A file named “' . $newSafe . '” already exists.'];
    }

    $usageBefore = count(media_usage_index()[$oldSafe] ?? []);

    // Rewrite data first so a failed rename doesn't leave broken refs under the new name.
    $rewritten = 0;

    $content = publish_load_saved_content();
    $rewritten += media_rewrite_refs_in_tree($content, $oldSafe, $newSafe);
    if (!save_content($content)) {
        return ['ok' => false, 'error' => 'Could not update live content references.'];
    }

    $draftFile = DATA_DIR . '/newsletter_drafts.json';
    if (is_readable($draftFile)) {
        $draftPayload = json_decode((string) file_get_contents($draftFile), true);
        if (is_array($draftPayload)) {
            $before = $rewritten;
            $rewritten += media_rewrite_refs_in_tree($draftPayload, $oldSafe, $newSafe);
            if ($rewritten > $before && !security_write_json($draftFile, $draftPayload)) {
                return ['ok' => false, 'error' => 'Could not update newsletter draft references.'];
            }
        }
    }

    $queue = publish_queue_read();
    $before = $rewritten;
    $rewritten += media_rewrite_refs_in_tree($queue, $oldSafe, $newSafe);
    if ($rewritten > $before && !publish_queue_write($queue)) {
        return ['ok' => false, 'error' => 'Could not update scheduled publish references.'];
    }

    if (!@rename($realFile, $newPath)) {
        // Best-effort rollback of content refs to the old name.
        $content = publish_load_saved_content();
        media_rewrite_refs_in_tree($content, $newSafe, $oldSafe);
        save_content($content);
        if (is_readable($draftFile)) {
            $draftPayload = json_decode((string) file_get_contents($draftFile), true);
            if (is_array($draftPayload)) {
                media_rewrite_refs_in_tree($draftPayload, $newSafe, $oldSafe);
                security_write_json($draftFile, $draftPayload);
            }
        }
        $queue = publish_queue_read();
        media_rewrite_refs_in_tree($queue, $newSafe, $oldSafe);
        publish_queue_write($queue);
        return ['ok' => false, 'error' => 'Could not rename the file on disk.'];
    }
    clearstatcache(true, $realFile);
    clearstatcache(true, $newPath);

    return [
        'ok' => true,
        'oldName' => $oldSafe,
        'name' => $newSafe,
        'url' => UPLOADS_URL . '/' . $newSafe,
        'rewritten' => $rewritten,
        'usageCount' => $usageBefore,
    ];
}

/**
 * Full library payload for the Media admin tab.
 *
 * @return array{items: list<array>, count: int, used: int, unused: int}
 */
function media_library_payload(): array
{
    $files = media_list_images(0);
    $index = media_usage_index();
    $used = 0;
    $unused = 0;
    $items = [];
    foreach ($files as $file) {
        $name = $file['name'];
        $usages = $index[$name] ?? [];
        $n = count($usages);
        if ($n > 0) {
            $used++;
        } else {
            $unused++;
        }
        $items[] = [
            'name' => $name,
            'url' => $file['url'],
            'mtime' => $file['mtime'],
            'size' => $file['size'],
            'usageCount' => $n,
            'usages' => $usages,
        ];
    }
    return [
        'items' => $items,
        'count' => count($items),
        'used' => $used,
        'unused' => $unused,
    ];
}
