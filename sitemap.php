<?php

// Dynamic XML sitemap for public HTML pages (fallback; prefer static sitemap.xml).

require_once __DIR__ . '/includes/seo.php';

require_once __DIR__ . '/includes/config.php';



header('Content-Type: application/xml; charset=utf-8');

header('Cache-Control: public, max-age=3600');



$base = seo_public_base_url();

$pages = seo_public_pages();



$contentMtime = 0;

if (defined('CONTENT_FILE') && is_file(CONTENT_FILE)) {

    $contentMtime = (int) filemtime(CONTENT_FILE);

}



echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";

echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";



foreach ($pages as $page) {

    $file = BASE_PATH . '/' . $page['file'];

    $fileMtime = is_file($file) ? (int) filemtime($file) : 0;

    $lastTs = max($fileMtime, $contentMtime);

    $lastmod = $lastTs > 0 ? gmdate('Y-m-d', $lastTs) : gmdate('Y-m-d');

    $loc = $base . ($page['loc'] === '/' ? '/' : $page['loc']);

    echo "  <url>\n";

    echo '    <loc>' . htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";

    echo '    <lastmod>' . $lastmod . "</lastmod>\n";

    echo '    <changefreq>' . $page['changefreq'] . "</changefreq>\n";

    echo '    <priority>' . $page['priority'] . "</priority>\n";

    echo "  </url>\n";

}



echo "</urlset>\n";


