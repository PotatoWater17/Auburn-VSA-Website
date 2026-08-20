<?php

// Public read-only content API for HTML pages to hydrate from.

require_once __DIR__ . '/../includes/content.php';

require_once __DIR__ . '/../includes/security.php';

require_once __DIR__ . '/../includes/construction.php';



send_security_headers(true);

header('Content-Type: application/json; charset=utf-8');



if ($_SERVER['REQUEST_METHOD'] !== 'GET') {

    http_response_code(405);

    header('Cache-Control: no-store');

    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);

    exit;

}



$full = get_content();

$site = is_array($full['site'] ?? null) ? $full['site'] : [];

$constructionOn = construction_mode_flag_on((string) ($site['constructionMode'] ?? 'no'));

$restricted = false;



if ($constructionOn) {

    // Preview unlock uses the same admin session as /admin/ (cookie + gate flags).

    require_once __DIR__ . '/../includes/auth.php';

    if (!construction_preview_enabled()) {

        $full = construction_public_gate_payload($full);

        $restricted = true;

    }

}



$payload = sanitize_cms_urls($full);



$mtime = is_file(CONTENT_FILE) ? (int) filemtime(CONTENT_FILE) : time();

$size = is_file(CONTENT_FILE) ? (int) filesize(CONTENT_FILE) : 0;

// Distinct ETag for gate vs full so a cached 304 cannot cross the boundary.

$etag = '"' . dechex($mtime) . '-' . dechex($size) . ($restricted ? '-gate' : '') . '"';



header('ETag: ' . $etag);

if ($restricted) {

    header('Cache-Control: no-store');

} else {

    // Always revalidate so admin logo/content edits show up immediately (ETag still allows cheap 304s).

    header('Cache-Control: no-cache, must-revalidate');

}

header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');



$ifNoneMatch = trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));

if ($ifNoneMatch !== '' && $ifNoneMatch === $etag) {

    http_response_code(304);

    exit;

}



// Soft heartbeat for Admin → Dashboard uptime (throttled writes inside helper).
require_once __DIR__ . '/../includes/uptime.php';
uptime_heartbeat();

echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);


