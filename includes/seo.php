<?php
// Shared SEO helpers — public base URL, crawlable page list.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/content.php';

/**
 * Absolute public site origin, e.g. https://example.com (no trailing slash).
 */
function seo_public_base_url(): string
{
    $content = get_content();
    $configured = trim((string) ($content['site']['publicBaseUrl'] ?? ''));
    if ($configured !== '') {
        return rtrim($configured, '/');
    }

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    // Strip default ports from host if present.
    $host = preg_replace('/:(80|443)$/', '', $host) ?? $host;

    // If the site lives in a subdirectory, include it (e.g. /vsa/).
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $dir = rtrim(str_replace('\\', '/', dirname($script)), '/');
    if ($dir === '/' || $dir === '\\' || $dir === '.' || str_ends_with($dir, '/admin')) {
        $dir = '';
    }
    // robots.php / sitemap.php live at web root of this app.
    if (preg_match('#/(robots|sitemap)\.php$#', $script)) {
        $dir = rtrim(str_replace('\\', '/', dirname($script)), '/');
        if ($dir === '/' || $dir === '.') {
            $dir = '';
        }
    }

    return $scheme . '://' . $host . $dir;
}

/**
 * Public crawlable pages for sitemap / discovery.
 * @return list<array{loc:string,file:string,changefreq:string,priority:string}>
 */
function seo_public_pages(): array
{
    return [
        ['loc' => '/', 'file' => 'index.html', 'changefreq' => 'weekly', 'priority' => '1.0'],
        ['loc' => '/events', 'file' => 'events.html', 'changefreq' => 'weekly', 'priority' => '0.9'],
        ['loc' => '/au-royale', 'file' => 'au-royale.html', 'changefreq' => 'weekly', 'priority' => '0.9'],
        ['loc' => '/gallery', 'file' => 'gallery.html', 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['loc' => '/merch', 'file' => 'merch.html', 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['loc' => '/faqs', 'file' => 'faqs.html', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['loc' => '/executive-board', 'file' => 'executive-board.html', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['loc' => '/tech-team', 'file' => 'tech-team.html', 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['loc' => '/au-royale-directors', 'file' => 'au-royale-directors.html', 'changefreq' => 'monthly', 'priority' => '0.6'],
    ];
}
