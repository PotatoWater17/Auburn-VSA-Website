<?php
require __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/users.php';
require_once __DIR__ . '/../includes/config.php';

require_once __DIR__ . '/../includes/media_library.php';

require_admin_api();

/**
 * Recent upload library for admin media picker (images only).
 */
function upload_list_recent_images(int $limit = 60): array
{
    return media_list_images(max(1, min(120, $limit)));
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $action = strtolower(trim((string) ($_GET['action'] ?? 'list')));
    if ($action !== 'list') {
        admin_json_response(['ok' => false, 'error' => 'Unknown action'], 400);
    }
    $items = upload_list_recent_images((int) ($_GET['limit'] ?? 60));
    admin_json_response(['ok' => true, 'items' => $items, 'count' => count($items)]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    admin_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

// Optional page gate — editors may only upload while editing a permitted section.
$pageId = (string) ($_POST['page'] ?? '');
if ($pageId !== '') {
    if ($pageId === 'users' || !current_user_can($pageId)) {
        admin_json_response(['ok' => false, 'error' => 'You do not have permission to upload for this section.'], 403);
    }
} elseif (!current_user_is_root()) {
    admin_json_response(['ok' => false, 'error' => 'Missing page permission for upload.'], 403);
}

if (empty($_FILES['file'])) {
    admin_json_response(['ok' => false, 'error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];
$uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($uploadError !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'File too large for server limit.',
        UPLOAD_ERR_FORM_SIZE => 'File too large.',
        UPLOAD_ERR_PARTIAL => 'Upload was interrupted. Try again.',
        UPLOAD_ERR_NO_FILE => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Server temp folder missing.',
        UPLOAD_ERR_CANT_WRITE => 'Server could not write the file.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by server extension.',
    ];
    admin_json_response(['ok' => false, 'error' => $messages[$uploadError] ?? 'Upload failed.'], 400);
}

$tmp = (string) ($file['tmp_name'] ?? '');
if ($tmp === '' || !is_uploaded_file($tmp)) {
    admin_json_response(['ok' => false, 'error' => 'Invalid upload.'], 400);
}

$allowedImages = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];
$allowedVideos = [
    'video/mp4' => 'mp4',
    'video/webm' => 'webm',
    'video/quicktime' => 'mov',
];
$allowedAudio = [
    'audio/mpeg' => 'mp3',
    'audio/mp3' => 'mp3',
    'audio/mp4' => 'm4a',
    'audio/x-m4a' => 'm4a',
    'audio/aac' => 'm4a',
    'audio/ogg' => 'ogg',
    'application/ogg' => 'ogg',
    'audio/wav' => 'wav',
    'audio/x-wav' => 'wav',
    'audio/vnd.wave' => 'wav',
    'audio/webm' => 'webm',
];

/**
 * Normalize odd MIME aliases browsers/OS libraries sometimes emit.
 */
function upload_normalize_mime(string $mime): string
{
    $mime = strtolower(trim($mime));
    switch ($mime) {
        case 'image/jpg':
        case 'image/pjpeg':
            return 'image/jpeg';
        case 'image/x-png':
            return 'image/png';
        case 'image/x-webp':
            return 'image/webp';
        case 'audio/mp3':
        case 'audio/x-mp3':
        case 'audio/mpeg3':
            return 'audio/mpeg';
        case 'audio/x-m4a':
        case 'audio/m4a':
            return 'audio/mp4';
        case 'audio/x-wav':
        case 'audio/wave':
        case 'audio/vnd.wave':
            return 'audio/wav';
        case 'application/ogg':
            return 'audio/ogg';
        default:
            return $mime;
    }
}

/**
 * Detect MIME: for images prefer getimagesize (authoritative); fall back to finfo / mime_content_type.
 */
function upload_detect_mime(string $tmp): string
{
    $info = @getimagesize($tmp);
    if (is_array($info) && !empty($info['mime'])) {
        return upload_normalize_mime((string) $info['mime']);
    }
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->file($tmp);
        if (is_string($detected) && $detected !== '') {
            return upload_normalize_mime($detected);
        }
    }
    if (function_exists('mime_content_type')) {
        $detected = @mime_content_type($tmp);
        if (is_string($detected) && $detected !== '') {
            return upload_normalize_mime($detected);
        }
    }
    return '';
}

/**
 * Lightweight magic-byte checks for audio containers.
 */
function upload_audio_signature_ok(string $tmp, string $mime): bool
{
    $fh = @fopen($tmp, 'rb');
    $head = $fh ? (string) fread($fh, 16) : '';
    if ($fh) {
        fclose($fh);
    }
    if (strlen($head) < 4) {
        return false;
    }
    if ($mime === 'audio/mpeg') {
        return str_starts_with($head, 'ID3')
            || (ord($head[0]) === 0xFF && (ord($head[1]) & 0xE0) === 0xE0);
    }
    if ($mime === 'audio/mp4' || $mime === 'audio/aac') {
        return strlen($head) >= 8 && substr($head, 4, 4) === 'ftyp';
    }
    if ($mime === 'audio/ogg') {
        return str_starts_with($head, 'OggS');
    }
    if ($mime === 'audio/wav') {
        return str_starts_with($head, 'RIFF') && strlen($head) >= 12 && substr($head, 8, 4) === 'WAVE';
    }
    if ($mime === 'audio/webm') {
        return str_starts_with($head, "\x1A\x45\xDF\xA3");
    }
    return false;
}

$intent = strtolower(trim((string) ($_POST['intent'] ?? '')));
$mime = upload_detect_mime($tmp);
$allowed = $allowedImages + $allowedVideos + $allowedAudio;
if ($mime === '' || !isset($allowed[$mime])) {
    admin_json_response([
        'ok' => false,
        'error' => 'Unsupported file type. Use PNG, JPG, WEBP, GIF, MP4, WEBM, MP3, M4A, OGG, or WAV.',
    ], 400);
}

$isVideo = isset($allowedVideos[$mime]);
$isAudio = isset($allowedAudio[$mime]);
$isImage = isset($allowedImages[$mime]);

if ($intent === 'audio') {
    if (!$isAudio) {
        admin_json_response(['ok' => false, 'error' => 'Audio upload requires MP3, M4A, OGG, WAV, or WEBM audio.'], 400);
    }
} elseif ($isAudio) {
    admin_json_response(['ok' => false, 'error' => 'Audio files must be uploaded from the Music track control.'], 400);
}

$maxBytes = $isVideo ? 80 * 1024 * 1024 : ($isAudio ? 25 * 1024 * 1024 : 10 * 1024 * 1024);
if (($file['size'] ?? 0) > $maxBytes) {
    $limitLabel = $isVideo ? 'Video too large (max 80 MB)' : ($isAudio ? 'Audio too large (max 25 MB)' : 'File too large (max 10 MB)');
    admin_json_response(['ok' => false, 'error' => $limitLabel], 400);
}

// Images must actually parse as images (blocks polyglot / fake MIME uploads).
if ($isImage) {
    $info = @getimagesize($tmp);
    if ($info === false || empty($info[0]) || empty($info[1])) {
        admin_json_response(['ok' => false, 'error' => 'File is not a valid image.'], 400);
    }
} elseif ($isVideo) {
    // Reject tiny/empty video stubs; real media starts with recognizable bytes.
    $fh = @fopen($tmp, 'rb');
    $head = $fh ? (string) fread($fh, 12) : '';
    if ($fh) {
        fclose($fh);
    }
    $okVideo = false;
    if ($mime === 'video/webm' && str_starts_with($head, "\x1A\x45\xDF\xA3")) {
        $okVideo = true;
    } elseif ($mime === 'video/mp4' || $mime === 'video/quicktime') {
        // ISO BMFF: bytes 4-7 are typically "ftyp"
        $okVideo = strlen($head) >= 8 && substr($head, 4, 4) === 'ftyp';
    }
    if (!$okVideo) {
        admin_json_response(['ok' => false, 'error' => 'File is not a valid video.'], 400);
    }
} elseif ($isAudio) {
    if (!upload_audio_signature_ok($tmp, $mime)) {
        admin_json_response(['ok' => false, 'error' => 'File is not a valid audio file.'], 400);
    }
} else {
    admin_json_response(['ok' => false, 'error' => 'Unsupported file type.'], 400);
}

if (!is_dir(UPLOADS_DIR) && !@mkdir(UPLOADS_DIR, 0775, true) && !is_dir(UPLOADS_DIR)) {
    admin_json_response(['ok' => false, 'error' => 'Uploads folder is not writable.'], 500);
}

$name = date('YmdHis') . '-' . bin2hex(random_bytes(5)) . '.' . $allowed[$mime];
$dest = UPLOADS_DIR . DIRECTORY_SEPARATOR . $name;

if (!move_uploaded_file($tmp, $dest)) {
    admin_json_response(['ok' => false, 'error' => 'Could not save file'], 500);
}

// Ensure the final path stays inside uploads/ (blocks unexpected rename tricks).
$uploadsReal = realpath(UPLOADS_DIR);
$destReal = realpath($dest);
if ($uploadsReal === false || $destReal === false || !str_starts_with($destReal, $uploadsReal . DIRECTORY_SEPARATOR)) {
    @unlink($dest);
    admin_json_response(['ok' => false, 'error' => 'Could not save file'], 500);
}
@chmod($dest, 0644);

$urlName = $name;
$socialIcon = ($intent === 'social-icon' || $intent === 'navy-icon');

if ($socialIcon && !$isImage) {
    @unlink($dest);
    admin_json_response(['ok' => false, 'error' => 'Social icons must be images (PNG, JPG, WEBP, or GIF).'], 400);
}

if ($isImage) {
    require_once __DIR__ . '/../includes/image_optimize.php';
    if ($socialIcon) {
        // Flatten / recolor toward brand navy silhouette for footer social icons.
        $converted = convert_image_to_navy_icon($dest, $dest, 256);
        if (is_string($converted) && $converted !== '') {
            $urlName = basename($converted);
            $dest = $converted;
        } else {
            @unlink($dest);
            admin_json_response(['ok' => false, 'error' => 'Could not convert icon to navy theme.'], 500);
        }
    } else {
        // Logos / small UI art: tighter max edge.
        // Home hero is full-bleed on large screens — keep up to 2560px.
        // Other CMS photos: 2400px (was 1600; soft on 1080p+/retina).
        $fieldKey = strtolower(trim((string) ($_POST['field'] ?? '')));
        if ($pageId === 'site') {
            $maxEdge = 800;
        } elseif ($pageId === 'home' && ($fieldKey === 'heroimage' || $fieldKey === 'hero_image')) {
            $maxEdge = 2560;
        } elseif ($pageId === 'home') {
            $maxEdge = 2400;
        } else {
            $maxEdge = 2400;
        }
        $jpegQuality = $maxEdge >= 2400 ? 86 : 82;
        $optimized = optimize_image_file($dest, $dest, $maxEdge, $jpegQuality);
        if (is_string($optimized) && $optimized !== '') {
            $urlName = basename($optimized);
            $dest = $optimized;
        }
    }
}

$mediaType = $isVideo ? 'video' : ($isAudio ? 'audio' : 'image');
log_admin_action('upload', 'Uploaded ' . $mediaType . ': ' . $urlName, [
    'meta' => [
        'file' => $urlName,
        'type' => $mediaType,
        'page' => $pageId,
        'themed' => $socialIcon && $isImage,
    ],
]);

admin_json_response([
    'ok' => true,
    'url' => UPLOADS_URL . '/' . $urlName,
    'type' => $mediaType,
    'themed' => $socialIcon && $isImage,
]);

