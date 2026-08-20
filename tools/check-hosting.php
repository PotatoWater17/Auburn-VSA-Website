<?php
/**
 * Hosting / migration readiness checks (CLI).
 * Usage: php tools/check-hosting.php
 *
 * Run locally before upload, and again via SSH/CLI on the host if available.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli' && PHP_SAPI !== 'phpdbg') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden\n";
    exit(1);
}

$root = dirname(__DIR__);
$errors = 0;
$warns = 0;

function fail(string $msg): void
{
    global $errors;
    $errors++;
    echo "FAIL  {$msg}\n";
}

function warn(string $msg): void
{
    global $warns;
    $warns++;
    echo "WARN  {$msg}\n";
}

function ok(string $msg): void
{
    echo "OK    {$msg}\n";
}

echo "Auburn VSA — hosting readiness\n";
echo "Root: {$root}\n";
echo "PHP:  " . PHP_VERSION . " (" . PHP_SAPI . ")\n\n";

// --- PHP version ---
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    fail('PHP 7.4+ required (found ' . PHP_VERSION . ')');
} elseif (version_compare(PHP_VERSION, '8.0.0', '<')) {
    warn('PHP 8.1+ preferred; this host is on ' . PHP_VERSION . ' (supported via polyfills)');
} elseif (version_compare(PHP_VERSION, '8.1.0', '<')) {
    warn('PHP 8.1+ preferred for shared hosting longevity (found ' . PHP_VERSION . ')');
} else {
    ok('PHP version ' . PHP_VERSION);
}

// --- Extensions ---
$required = ['json', 'session'];
$recommended = ['gd', 'mbstring', 'openssl'];
foreach ($required as $ext) {
    if (extension_loaded($ext)) {
        ok("extension {$ext}");
    } else {
        fail("missing required extension: {$ext}");
    }
}
foreach ($recommended as $ext) {
    if (extension_loaded($ext)) {
        ok("extension {$ext}");
    } else {
        warn("missing recommended extension: {$ext}" . ($ext === 'gd' ? ' (image upload resize will skip)' : ''));
    }
}

// --- Deny / security files ---
$htaccessPaths = [
    '.htaccess',
    'data/.htaccess',
    'includes/.htaccess',
    'uploads/.htaccess',
    'tools/.htaccess',
    'docs/.htaccess',
    'admin/.htaccess',
    'api/.htaccess',
    '.well-known/.htaccess',
];
foreach ($htaccessPaths as $rel) {
    $path = $root . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (is_readable($path)) {
        ok(".htaccess present: {$rel}");
    } else {
        fail("missing .htaccess: {$rel}");
    }
}

$rootHt = (string) @file_get_contents($root . DIRECTORY_SEPARATOR . '.htaccess');
if (
    $rootHt !== ''
    && preg_match(
        '/RewriteRule\s+\^\(tools\|docs\|data\|includes(?:\|workers)?\)/i',
        $rootHt
    )
) {
    ok('root rewrite deny for tools|docs|data|includes');
} else {
    fail('root .htaccess missing rewrite deny for sensitive trees');
}

// --- Writable runtime dirs ---
foreach (['data', 'uploads'] as $dir) {
    $path = $root . DIRECTORY_SEPARATOR . $dir;
    if (!is_dir($path)) {
        if (@mkdir($path, 0775, true)) {
            ok("created missing directory: {$dir}/");
        } else {
            fail("cannot create directory: {$dir}/");
            continue;
        }
    }
    if (is_writable($path)) {
        ok("writable: {$dir}/");
    } else {
        fail("not writable by PHP: {$dir}/ (chmod/chown on host)");
    }
}

// Probe write
$probe = $root . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . '.hosting_write_probe';
if (@file_put_contents($probe, 'ok') !== false) {
    @unlink($probe);
    ok('data/ write probe succeeded');
} else {
    fail('data/ write probe failed');
}

// --- Core app files ---
$core = [
    'index.html',
    'api/content.php',
    'api/newsletter.php',
    'api/faq-ask.php',
    'admin/index.php',
    'admin/login.php',
    'includes/config.php',
    'includes/content.php',
    'includes/auth.php',
    'includes/security.php',
    'assets/js/site.js',
    'assets/css/styles.css',
    'assets/ASSET_VERSION',
    'robots.php',
    'sitemap.xml',
    'docs/SITE-RECREATE.txt',
    'docs/HANDOFF.md',
];
foreach ($core as $rel) {
    $path = $root . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (is_readable($path)) {
        ok("present: {$rel}");
    } else {
        fail("missing: {$rel}");
    }
}

// --- PHP syntax (key entrypoints) ---
$lintFiles = [
    'api/content.php',
    'api/newsletter.php',
    'api/faq-ask.php',
    'api/construction-auth.php',
    'api/construction-message.php',
    'admin/index.php',
    'admin/login.php',
    'admin/save.php',
    'admin/upload.php',
    'includes/config.php',
    'includes/content.php',
    'includes/auth.php',
    'includes/security.php',
    'robots.php',
];
$phpBin = PHP_BINARY ?: 'php';
foreach ($lintFiles as $rel) {
    $path = $root . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (!is_readable($path)) {
        fail("lint skip (missing): {$rel}");
        continue;
    }
    $cmd = escapeshellarg($phpBin) . ' -l ' . escapeshellarg($path) . ' 2>&1';
    $out = [];
    $code = 0;
    exec($cmd, $out, $code);
    if ($code === 0) {
        ok("php -l {$rel}");
    } else {
        fail("php -l {$rel}: " . trim(implode(' ', $out)));
    }
}

// --- Credentials / runtime checks ---
require_once $root . '/includes/config.php';
$usersFile = DATA_DIR . '/users.json';
if (is_readable($usersFile)) {
    ok('data/users.json present (will deploy only if you pack --with-data)');
} else {
    warn('data/users.json absent — no shipped login exists; provide ADMIN_PASSWORD_HASH or deploy --with-data');
}

$contentFile = CONTENT_FILE;
if (is_readable($contentFile)) {
    ok('data/content.json present locally (pack with --with-data to ship CMS content)');
} else {
    warn('data/content.json absent — live site will use default_content() until you save in admin');
}

echo "\n";
if ($errors === 0) {
    echo "Ready: {$errors} failures, {$warns} warning(s).\n";
    echo "Next: php tools/pack-deploy.php   then upload the zip to your host.\n";
    echo "Guide: docs/HANDOFF.md\n";
    exit(0);
}

echo "Not ready: {$errors} failure(s), {$warns} warning(s).\n";
exit(1);
