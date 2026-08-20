<?php
/**
 * Keep CSS/JS cache-bust tokens in sync across static HTML + admin PHP.
 *
 * Usage (from repo root):
 *   php tools/bump-assets.php           # apply current assets/ASSET_VERSION
 *   php tools/bump-assets.php --bump    # stamp today's date + letter, then apply
 *
 * After editing styles.css / site.js / admin.css / admin.js, run --bump
 * (or edit ASSET_VERSION by hand, then run without --bump).
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli' && PHP_SAPI !== 'phpdbg') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden\n";
    exit(1);
}

/**
 * Increment a lowercase letter run: a→b … z→aa → ab … (base-26, no zero digit).
 * Returns '' if the result would be unreasonably long.
 */
function bump_version_letters(string $letters): string
{
    $letters = strtolower($letters);
    if ($letters === '' || !preg_match('/^[a-z]+$/', $letters)) {
        return 'a';
    }
    $chars = str_split($letters);
    $i = count($chars) - 1;
    while ($i >= 0) {
        if ($chars[$i] !== 'z') {
            $chars[$i] = chr(ord($chars[$i]) + 1);
            return implode('', $chars);
        }
        $chars[$i] = 'a';
        $i--;
    }
    if (count($chars) >= 4) {
        return '';
    }
    return 'a' . implode('', $chars);
}

$root = dirname(__DIR__);
$versionFile = $root . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'ASSET_VERSION';

$bump = in_array('--bump', $argv, true);
$version = '';

if ($bump) {
    $today = date('Ymd');
    $prev = is_readable($versionFile) ? trim((string) file_get_contents($versionFile)) : '';
    $letter = 'a';
    $base = $today;
    // Continue the latest stamped day so clock skew cannot mint a token that
    // sorts "before" an already-shipped ?v= (also supports multi-letter: aq→ar).
    if (preg_match('/^(\d{8})([a-z]+)$/i', $prev, $m)) {
        $prevDay = $m[1];
        $prevLetters = strtolower($m[2]);
        if ($prevDay > $today) {
            $base = $prevDay;
            $letter = bump_version_letters($prevLetters);
        } elseif ($prevDay === $today) {
            $letter = bump_version_letters($prevLetters);
        }
    }
    if ($letter === '') {
        fwrite(STDERR, "Too many bumps for {$base}; edit assets/ASSET_VERSION manually.\n");
        exit(1);
    }
    $version = $base . $letter;
    file_put_contents($versionFile, $version . "\n");
    echo "Bumped ASSET_VERSION → {$version}\n";
} else {
    if (!is_readable($versionFile)) {
        fwrite(STDERR, "Missing assets/ASSET_VERSION. Create it or pass --bump.\n");
        exit(1);
    }
    $version = trim((string) file_get_contents($versionFile));
    if ($version === '' || !preg_match('/^\d{8}[a-z]+$/i', $version)) {
        fwrite(STDERR, "Invalid ASSET_VERSION: {$version}\n");
        exit(1);
    }
    echo "Applying ASSET_VERSION = {$version}\n";
}

$targets = [];
foreach (glob($root . DIRECTORY_SEPARATOR . '*.html') ?: [] as $f) {
    $targets[] = $f;
}
foreach ([
    'admin/index.php',
    'admin/login.php',
    'admin/password.php',
] as $rel) {
    $path = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (is_file($path)) {
        $targets[] = $path;
    }
}

$patterns = [
    // public
    '/(assets\/css\/styles\.css\?v=)[A-Za-z0-9._-]+/' => '${1}' . $version,
    '/(assets\/js\/site\.js\?v=)[A-Za-z0-9._-]+/' => '${1}' . $version,
    // admin (relative from admin/)
    '/(assets\/css\/admin\.css\?v=)[A-Za-z0-9._-]+/' => '${1}' . $version,
    '/(assets\/js\/admin\.js\?v=)[A-Za-z0-9._-]+/' => '${1}' . $version,
];

$changed = 0;
foreach ($targets as $path) {
    $before = file_get_contents($path);
    if ($before === false) {
        fwrite(STDERR, "Skip unreadable: {$path}\n");
        continue;
    }
    $after = $before;
    foreach ($patterns as $re => $repl) {
        $after = preg_replace($re, $repl, $after) ?? $after;
    }
    if ($after !== $before) {
        file_put_contents($path, $after);
        $changed++;
        echo '  updated ' . str_replace($root . DIRECTORY_SEPARATOR, '', $path) . "\n";
    }
}

echo "Done. {$changed} file(s) updated.\n";
