<?php
/**
 * One-time: optimize oversized uploads referenced by the homepage (and any file > 400KB).
 * Run: C:\xampp\php\php.exe tools/optimize-uploads.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli' && PHP_SAPI !== 'phpdbg') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden\n";
    exit(1);
}

require __DIR__ . '/../includes/content.php';
require __DIR__ . '/../includes/image_optimize.php';

if (!extension_loaded('gd')) {
    fwrite(STDERR, "GD extension required. Enable extension=gd in php.ini and re-run.\n");
    exit(1);
}

$content = get_content();
$paths = [];

$collect = function ($value) use (&$paths, &$collect) {
    if (is_string($value) && preg_match('#^uploads/[A-Za-z0-9._/-]+$#', $value)) {
        $paths[$value] = true;
        return;
    }
    if (is_array($value)) {
        foreach ($value as $v) {
            $collect($v);
        }
    }
};
$collect($content);

$changed = [];
foreach (array_keys($paths) as $rel) {
    $abs = BASE_PATH . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (!is_file($abs)) {
        echo "missing {$rel}\n";
        continue;
    }
    $before = filesize($abs);
    // Logos stay smaller; home hero up to 2560; everything else up to 2400.
    $isLogo = str_contains($rel, (string) ($content['branding']['logo'] ?? '___'));
    $isHero = str_contains($rel, (string) ($content['home']['heroImage'] ?? '___'));
    $max = $isLogo ? 512 : ($isHero ? 2560 : 2400);
    $out = optimize_image_file($abs, $abs, $max, 82);
    if (!$out) {
        echo "skip {$rel}\n";
        continue;
    }
    $newRel = 'uploads/' . basename($out);
    $after = is_file($out) ? filesize($out) : 0;
    echo sprintf(
        "%s -> %s  %s KB → %s KB\n",
        $rel,
        $newRel,
        number_format($before / 1024, 0),
        number_format($after / 1024, 0)
    );
    if ($newRel !== $rel) {
        $changed[$rel] = $newRel;
    }
}

if ($changed) {
    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $raw = file_get_contents(CONTENT_FILE);
    foreach ($changed as $old => $new) {
        $raw = str_replace('"' . $old . '"', '"' . $new . '"', $raw);
        $raw = str_replace($old, $new, $raw);
    }
    // Re-decode to keep valid JSON
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fwrite(STDERR, "Failed to rewrite content.json paths\n");
        exit(1);
    }
    if (!save_content($decoded)) {
        fwrite(STDERR, "Failed to save content.json\n");
        exit(1);
    }
    echo "Updated content.json paths: " . count($changed) . "\n";
}

echo "Done.\n";
