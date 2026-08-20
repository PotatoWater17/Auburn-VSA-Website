<?php

// Dynamic robots.txt — absolute Sitemap URL + block private areas.

require_once __DIR__ . '/includes/seo.php';



header('Content-Type: text/plain; charset=utf-8');

header('Cache-Control: public, max-age=3600');

header('X-Robots-Tag: noindex'); // this endpoint itself isn't a page



$base = seo_public_base_url();



echo "User-agent: *\n";

echo "Allow: /\n";

echo "Disallow: /admin/\n";

echo "Disallow: /api/\n";

echo "Disallow: /data/\n";

echo "Disallow: /includes/\n";

echo "Disallow: /tools/\n";

echo "Disallow: /docs/\n";

echo "Disallow: /workers/\n";

echo "\n";

// Canonical sitemap is the static root file (Apache serves sitemap.xml directly).

echo 'Sitemap: ' . $base . "/sitemap.xml\n";


