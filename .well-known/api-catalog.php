<?php
// RFC 9727 API catalog — advertises the public content API for agent discovery.
require_once __DIR__ . '/../includes/seo.php';

$base = seo_public_base_url();
$catalog = [
    'linkset' => [
        [
            'anchor' => $base . '/api/content.php',
            'service-desc' => [
                [
                    'href' => $base . '/.well-known/openapi-content.json',
                    'type' => 'application/openapi+json',
                ],
            ],
            'service-doc' => [
                [
                    'href' => $base . '/llms.txt',
                    'type' => 'text/plain',
                ],
            ],
            'status' => [
                [
                    'href' => $base . '/api/content.php',
                    'type' => 'application/json',
                ],
            ],
        ],
    ],
];

header('Content-Type: application/linkset+json; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('Access-Control-Allow-Origin: *');
echo json_encode($catalog, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
