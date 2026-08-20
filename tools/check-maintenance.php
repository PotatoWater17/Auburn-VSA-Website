<?php
/**
 * Quick sanity checks for common maintenance drift.
 * Usage: php tools/check-maintenance.php
 *
 * Catches: stale cache-bust tokens, missing chrome markers, nav/footer drift,
 * and (when possible) mismatched topbar/header/footer blocks across HTML pages.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli' && PHP_SAPI !== 'phpdbg') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden\n";
    exit(1);
}

$root = dirname(__DIR__);
require_once $root . '/includes/config.php'; // PHP 7.4 string-helper polyfills
$errors = 0;

function fail(string $msg): void
{
    global $errors;
    $errors++;
    echo "FAIL  {$msg}\n";
}

function ok(string $msg): void
{
    echo "OK    {$msg}\n";
}

$versionFile = $root . '/assets/ASSET_VERSION';
$version = is_readable($versionFile) ? trim((string) file_get_contents($versionFile)) : '';
if ($version === '') {
    fail('assets/ASSET_VERSION missing or empty');
} else {
    ok("ASSET_VERSION = {$version}");
}

$expectedPages = [
    'index.html',
    'executive-board.html',
    'tech-team.html',
    'au-royale-directors.html',
    'events.html',
    'au-royale.html',
    'gallery.html',
    'merch.html',
    'faqs.html',
    'unsubscribe.html',
];

$htmlFiles = glob($root . '/*.html') ?: [];
$foundBasenames = [];
foreach ($htmlFiles as $path) {
    $foundBasenames[] = basename($path);
}
sort($foundBasenames);
$expectedSorted = $expectedPages;
sort($expectedSorted);
if ($foundBasenames !== $expectedSorted) {
    fail(
        'root HTML pages differ from expected set. found=[' .
        implode(', ', $foundBasenames) .
        '] expected=[' .
        implode(', ', $expectedSorted) .
        ']'
    );
} else {
    ok(count($expectedSorted) . ' public HTML pages present');
}

$files = array_merge(
    $htmlFiles,
    [
        $root . '/admin/index.php',
        $root . '/admin/login.php',
        $root . '/admin/password.php',
    ]
);

$requiredNavHrefs = [
    './',
    'executive-board',
    'tech-team',
    'au-royale-directors',
    'events',
    'au-royale',
    'gallery',
    'merch',
    'faqs',
];

$htmlMarkers = [
    'class="skip-link"',
    'href="#main"',
    'class="topbar"',
    'class="site-header"',
    'assets/css/styles.css?v=',
    'assets/js/site.js?v=',
    'data-page=',
    'data-nav=',
    'id="mobile-menu"',
    'data-bind="site.email"',
    'data-bind="site.phone"',
    'footer-legal-links',
];

$newsletterMarkers = [
    'data-newsletter',
    'btn btn-orange full">Subscribe</button>',
];

/** Normalize chrome regions so page-only active classes don't create false diffs. */
function normalize_chrome(string $html): string
{
    $html = preg_replace('/\s+/', ' ', $html) ?? $html;
    $html = str_replace(' class="nav-link active"', ' class="nav-link"', $html);
    $html = str_replace(' class="nav-link dropdown-toggle active"', ' class="nav-link dropdown-toggle"', $html);
    return trim($html);
}

function extract_between(string $html, string $startNeedle, string $endNeedle): ?string
{
    $start = strpos($html, $startNeedle);
    if ($start === false) {
        return null;
    }
    $end = strpos($html, $endNeedle, $start);
    if ($end === false) {
        return null;
    }
    return substr($html, $start, $end - $start);
}

$chromeFingerprints = [
    'topbar' => [],
    'header' => [],
    'footer' => [],
];

foreach ($files as $path) {
    if (!is_file($path)) {
        fail('missing ' . str_replace($root . '/', '', $path));
        continue;
    }
    $html = (string) file_get_contents($path);
    $rel = str_replace('\\', '/', substr($path, strlen($root) + 1));
    if (preg_match_all('/\?v=([A-Za-z0-9._-]+)/', $html, $m)) {
        foreach (array_unique($m[1]) as $tok) {
            if ($tok !== $version) {
                fail("{$rel} has ?v={$tok} (expected {$version})");
            }
        }
    }
    if (!str_ends_with($rel, '.html')) {
        continue;
    }

    $isUnsubscribe = ($rel === 'unsubscribe.html');

    if (str_contains($html, 'Subscribe to newsletter')) {
        fail("{$rel} footer still says 'Subscribe to newsletter'");
    }

    if (preg_match('#href="/assets/(css|js)/#', $html)) {
        fail("{$rel} uses root-absolute /assets/… paths (prefer relative assets/…)");
    }

    if (!preg_match('/property="og:image"\s+content="https?:\/\//', $html)) {
        fail("{$rel} og:image should be an absolute https URL for social scrapers");
    }

    if (!preg_match('/class="[^"]*\bsite-footer\b/', $html)) {
        fail("{$rel} missing chrome/marker: site-footer");
    }

    foreach ($htmlMarkers as $marker) {
        if (!str_contains($html, $marker)) {
            fail("{$rel} missing chrome/marker: {$marker}");
        }
    }

    if ($isUnsubscribe) {
        if (str_contains($html, 'data-newsletter')) {
            fail('unsubscribe.html should omit the footer Subscribe form');
        }
    } else {
        foreach ($newsletterMarkers as $marker) {
            if (!str_contains($html, $marker)) {
                fail("{$rel} missing chrome/marker: {$marker}");
            }
        }
    }

    foreach ($requiredNavHrefs as $href) {
        if (!str_contains($html, 'href="' . $href . '"')) {
            fail("{$rel} missing nav href=\"{$href}\"");
        }
    }

    // Heading hierarchy: page title should be an h1 (unsubscribe already has one).
    if (in_array($rel, ['gallery.html', 'faqs.html', 'merch.html'], true)) {
        if (!preg_match('/<h1[\s>]/', $html)) {
            fail("{$rel} missing page <h1>");
        }
    }

    // Team pages must declare which roster to render.
    if (preg_match('/data-page=["\']team["\']/', $html) && !preg_match('/data-team=["\']/', $html)) {
        fail("{$rel} has data-page=team but no data-team");
    }

    $topbar = extract_between($html, '<div class="topbar">', '<header class="site-header">');
    $header = extract_between($html, '<header class="site-header">', '</header>');
    $footer = extract_between($html, '<footer class="site-footer', '</footer>');
    if ($topbar !== null) {
        $chromeFingerprints['topbar'][$rel] = md5(normalize_chrome($topbar));
    } else {
        fail("{$rel} could not extract topbar block");
    }
    if ($header !== null) {
        $chromeFingerprints['header'][$rel] = md5(normalize_chrome($header));
    } else {
        fail("{$rel} could not extract site-header block");
    }
    if ($footer !== null) {
        // unsubscribe.html intentionally uses a slim footer (no newsletter signup).
        if (!$isUnsubscribe) {
            $chromeFingerprints['footer'][$rel] = md5(normalize_chrome($footer));
        }
    } else {
        fail("{$rel} could not extract site-footer block");
    }
}

foreach ($chromeFingerprints as $region => $map) {
    if (count($map) < 2) {
        continue;
    }
    $unique = array_unique(array_values($map));
    if (count($unique) === 1) {
        ok("{$region} chrome matches across all HTML pages");
        continue;
    }
    // Group pages by fingerprint for a readable fail message.
    $groups = [];
    foreach ($map as $rel => $hash) {
        $groups[$hash][] = $rel;
    }
    $parts = [];
    foreach ($groups as $pages) {
        $parts[] = implode(', ', $pages);
    }
    fail("{$region} chrome differs across pages — copy the correct block from index.html into the others. Groups: " . implode(' | ', $parts));
}

$docsDeny = $root . '/docs/.htaccess';
if (!is_file($docsDeny)) {
    fail('docs/.htaccess missing (should deny web access)');
} else {
    ok('docs/.htaccess present');
}

if ($errors === 0) {
    echo "\nAll maintenance checks passed.\n";
    exit(0);
}
echo "\n{$errors} issue(s) found.\n";
exit(1);
