<?php
/**
 * Resize / recompress uploaded images for web delivery.
 */

function image_normalize_mime(string $mime): string
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
        default:
            return $mime;
    }
}

function image_has_visible_alpha($im, int $w, int $h): bool
{
    if (!function_exists('imagecolorat')) {
        return false;
    }
    if (function_exists('imageistruecolor') && !imageistruecolor($im)) {
        @imagepalettetotruecolor($im);
    }
    $points = [
        [0, 0],
        [max(0, $w - 1), 0],
        [0, max(0, $h - 1)],
        [max(0, $w - 1), max(0, $h - 1)],
        [(int) ($w / 2), (int) ($h / 2)],
        [(int) ($w / 4), (int) ($h / 4)],
        [(int) (3 * $w / 4), (int) (3 * $h / 4)],
    ];
    foreach ($points as [$x, $y]) {
        $rgba = @imagecolorat($im, $x, $y);
        if ($rgba === false) {
            continue;
        }
        $alpha = ($rgba & 0x7F000000) >> 24;
        if ($alpha > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Optimize an image for the web. Returns final filesystem path, or null on skip/failure.
 * - Longest edge capped at $maxEdge
 * - Opaque photos become JPEG (quality $jpegQuality)
 * - Images with transparency stay PNG
 */
function optimize_image_file(string $srcPath, ?string $destPath = null, int $maxEdge = 1600, int $jpegQuality = 82): ?string
{
    if (!extension_loaded('gd') || !is_file($srcPath)) {
        return null;
    }
    $destPath = $destPath ?: $srcPath;
    $info = @getimagesize($srcPath);
    if ($info === false || empty($info[0]) || empty($info[1])) {
        return null;
    }
    $w = (int) $info[0];
    $h = (int) $info[1];
    $mime = image_normalize_mime((string) ($info['mime'] ?? ''));
    $bytes = (int) @filesize($srcPath);

    if ($mime === 'image/jpeg') {
        $src = @imagecreatefromjpeg($srcPath);
    } elseif ($mime === 'image/png') {
        $src = @imagecreatefrompng($srcPath);
    } elseif ($mime === 'image/webp') {
        $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : false;
    } elseif ($mime === 'image/gif') {
        $src = @imagecreatefromgif($srcPath);
    } else {
        $src = false;
    }
    if ($src === false) {
        return null;
    }

    $scale = min(1.0, $maxEdge / max($w, $h));
    $nw = max(1, (int) round($w * $scale));
    $nh = max(1, (int) round($h * $scale));
    $needsResize = $scale < 1.0;
    $needsRecompress = $bytes > 400 * 1024;
    if (!$needsResize && !$needsRecompress) {
        imagedestroy($src);
        return $srcPath;
    }

    $hasAlpha = in_array($mime, ['image/png', 'image/webp', 'image/gif'], true)
        && image_has_visible_alpha($src, $w, $h);

    $dst = imagecreatetruecolor($nw, $nh);
    if ($dst === false) {
        imagedestroy($src);
        return null;
    }

    if ($hasAlpha) {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        imagealphablending($dst, true);
    } else {
        $bg = imagecolorallocate($dst, 255, 255, 255);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $bg);
    }

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imagedestroy($src);

    $tmp = $destPath . '.opt.tmp';
    $finalPath = $destPath;
    $ok = false;

    if ($hasAlpha) {
        $ok = imagepng($dst, $tmp, 6);
        if ($ok && !preg_match('/\.png$/i', $finalPath)) {
            $finalPath = preg_replace('/\.[a-z0-9]+$/i', '.png', $destPath) ?: ($destPath . '.png');
        }
    } else {
        $ok = imagejpeg($dst, $tmp, $jpegQuality);
        if ($ok && !preg_match('/\.(jpe?g)$/i', $finalPath)) {
            $finalPath = preg_replace('/\.[a-z0-9]+$/i', '.jpg', $destPath) ?: ($destPath . '.jpg');
        }
    }
    imagedestroy($dst);

    if (!$ok || !is_file($tmp)) {
        @unlink($tmp);
        return null;
    }

    $newBytes = (int) filesize($tmp);
    if (!$needsResize && $newBytes >= $bytes) {
        @unlink($tmp);
        return $srcPath;
    }

    if (is_file($finalPath) && realpath($finalPath) !== realpath($tmp)) {
        @unlink($finalPath);
    }
    if (!@rename($tmp, $finalPath)) {
        if (!@copy($tmp, $finalPath)) {
            @unlink($tmp);
            return null;
        }
        @unlink($tmp);
    }
    @chmod($finalPath, 0644);

    if ($finalPath !== $srcPath && is_file($srcPath) && realpath($srcPath) !== realpath($finalPath)) {
        @unlink($srcPath);
    }

    return $finalPath;
}

/**
 * Convert an uploaded logo into a navy (#344E74) silhouette PNG with transparency.
 * Matches admin social thumbs; public footer tints via CSS mask + currentColor.
 *
 * - Transparent / near-white pixels become transparent
 * - Opaque ink becomes navy with alpha from darkness or source alpha
 *
 * @return string|null Final filesystem path, or null on failure
 */
function convert_image_to_navy_icon(string $srcPath, ?string $destPath = null, int $maxEdge = 256): ?string
{
    if (!extension_loaded('gd') || !is_file($srcPath)) {
        return null;
    }
    $destPath = $destPath ?: $srcPath;
    $info = @getimagesize($srcPath);
    if ($info === false || empty($info[0]) || empty($info[1])) {
        return null;
    }
    $w = (int) $info[0];
    $h = (int) $info[1];
    $mime = image_normalize_mime((string) ($info['mime'] ?? ''));

    if ($mime === 'image/jpeg') {
        $src = @imagecreatefromjpeg($srcPath);
    } elseif ($mime === 'image/png') {
        $src = @imagecreatefrompng($srcPath);
    } elseif ($mime === 'image/webp') {
        $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : false;
    } elseif ($mime === 'image/gif') {
        $src = @imagecreatefromgif($srcPath);
    } else {
        $src = false;
    }
    if ($src === false) {
        return null;
    }
    if (function_exists('imagepalettetotruecolor') && !imageistruecolor($src)) {
        @imagepalettetotruecolor($src);
    }
    imagealphablending($src, false);
    imagesavealpha($src, true);

    $scale = min(1.0, $maxEdge / max($w, $h));
    $nw = max(1, (int) round($w * $scale));
    $nh = max(1, (int) round($h * $scale));

    if ($nw !== $w || $nh !== $h) {
        $resized = imagecreatetruecolor($nw, $nh);
        if ($resized === false) {
            imagedestroy($src);
            return null;
        }
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $clear = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefilledrectangle($resized, 0, 0, $nw, $nh, $clear);
        imagealphablending($resized, true);
        imagecopyresampled($resized, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);
        $src = $resized;
        imagealphablending($src, false);
        imagesavealpha($src, true);
        $w = $nw;
        $h = $nh;
    }

    $hasAlpha = image_has_visible_alpha($src, $w, $h);
    $dst = imagecreatetruecolor($w, $h);
    if ($dst === false) {
        imagedestroy($src);
        return null;
    }
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $clear = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $w, $h, $clear);

    // Brand navy --navy
    $nr = 0x34;
    $ng = 0x4e;
    $nb = 0x74;

    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $rgba = @imagecolorat($src, $x, $y);
            if ($rgba === false) {
                continue;
            }
            $a = ($rgba & 0x7f000000) >> 24;
            $r = ($rgba >> 16) & 0xff;
            $g = ($rgba >> 8) & 0xff;
            $b = $rgba & 0xff;
            $lum = (0.299 * $r) + (0.587 * $g) + (0.114 * $b);
            $srcOpacity = 1.0 - ($a / 127.0);

            if ($hasAlpha) {
                $ink = $srcOpacity;
            } else {
                // Opaque logos on light backgrounds: darker = more ink.
                $ink = max(0.0, min(1.0, (245.0 - $lum) / 245.0)) * $srcOpacity;
            }

            if ($ink < 0.04) {
                continue;
            }
            // GD alpha: 0 opaque … 127 transparent
            $outA = (int) round((1.0 - $ink) * 127.0);
            $outA = max(0, min(127, $outA));
            $col = imagecolorallocatealpha($dst, $nr, $ng, $nb, $outA);
            imagesetpixel($dst, $x, $y, $col);
        }
    }
    imagedestroy($src);

    $finalPath = preg_replace('/\.[a-z0-9]+$/i', '.png', $destPath) ?: ($destPath . '.png');
    $tmp = $finalPath . '.navy.tmp';
    $ok = imagepng($dst, $tmp, 6);
    imagedestroy($dst);
    if (!$ok || !is_file($tmp)) {
        @unlink($tmp);
        return null;
    }

    if (is_file($finalPath) && realpath($finalPath) !== realpath($tmp)) {
        @unlink($finalPath);
    }
    if (!@rename($tmp, $finalPath)) {
        if (!@copy($tmp, $finalPath)) {
            @unlink($tmp);
            return null;
        }
        @unlink($tmp);
    }
    @chmod($finalPath, 0644);

    if ($finalPath !== $srcPath && is_file($srcPath) && realpath($srcPath) !== realpath($finalPath)) {
        @unlink($srcPath);
    }

    return $finalPath;
}
