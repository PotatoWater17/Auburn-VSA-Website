<?php
// Central configuration for the Auburn VSA site.

// Absolute paths.
define('BASE_PATH', dirname(__DIR__));
define('DATA_DIR', BASE_PATH . '/data');
define('CONTENT_FILE', DATA_DIR . '/content.json');
define('UPLOADS_DIR', BASE_PATH . '/uploads');
define('ADMIN_PASSWORD_HASH_FILE', DATA_DIR . '/.admin_password_hash');
define('USERS_FILE_NAME', 'users.json');

// Web path (relative) where uploaded images are served from.
define('UPLOADS_URL', 'uploads');

/** Admin session idle timeout (seconds). Override with ADMIN_SESSION_IDLE_SECONDS env. */
define('ADMIN_SESSION_IDLE_SECONDS', 7200); // 2 hours

/** Max admin session lifetime from login (seconds). Override with ADMIN_SESSION_MAX_SECONDS env. */
define('ADMIN_SESSION_MAX_SECONDS', 43200); // 12 hours

// No password or fallback hash ships in source. Root credentials come from
// data/users.json, data/.admin_password_hash, or ADMIN_PASSWORD_HASH (one-way hash).

// Make sure runtime directories exist.
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0775, true);
}
if (!is_dir(UPLOADS_DIR)) {
    @mkdir(UPLOADS_DIR, 0775, true);
}

// Minimum PHP 7.4 (arrow functions). Prefer 8.1+ on new hosts.
if (PHP_VERSION_ID < 70400) {
    if (PHP_SAPI === 'cli' || PHP_SAPI === 'phpdbg') {
        fwrite(STDERR, 'Auburn VSA requires PHP 7.4 or newer. This server has ' . PHP_VERSION . ".\n");
        exit(1);
    }
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "This site needs PHP 7.4 or newer.\n";
    echo 'This server is running PHP ' . PHP_VERSION . ".\n";
    echo "Ask your host to switch the site to PHP 8.1 or 8.2 if available.\n";
    exit;
}

// PHP 8.0 string helpers — polyfilled so PHP 7.4 hosts still run.
if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool
    {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        if ($needle === '') {
            return true;
        }
        $len = strlen($needle);
        return $len === 0 || substr($haystack, -$len) === $needle;
    }
}
if (!function_exists('array_is_list')) {
    function array_is_list(array $array): bool
    {
        $i = 0;
        foreach ($array as $key => $_value) {
            if ($key !== $i++) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Soften private file modes for shared hosts where the FTP user and the PHP
 * user differ — 0640 stays group-readable; web access is still blocked by
 * data/.htaccess. Falls back silently if chmod is disallowed.
 */
function vsa_chmod_private(string $file): void
{
    if (is_file($file)) {
        @chmod($file, 0640);
    }
}

// Capture fatals/exceptions to data/error_log.json (surfaced in Admin → Dashboard).
require_once __DIR__ . '/errorlog.php';
vsa_install_error_handlers();
