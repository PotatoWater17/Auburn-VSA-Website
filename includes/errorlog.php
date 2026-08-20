<?php
// Application error log — admin APIs run with display_errors off, so without this a
// fatal looks like a dead button. Entries surface in Admin → Dashboard.

require_once __DIR__ . '/config.php';

define('VSA_ERROR_LOG_FILE', DATA_DIR . '/error_log.json');
const VSA_ERROR_LOG_MAX = 200;
// Repeats of the same fault inside this window bump a counter instead of adding rows.
const VSA_ERROR_LOG_DEDUPE_SECONDS = 300;

/** @return list<array<string,mixed>> */
function vsa_error_log_read(): array
{
    if (!is_readable(VSA_ERROR_LOG_FILE)) {
        return [];
    }
    $decoded = json_decode((string) file_get_contents(VSA_ERROR_LOG_FILE), true);
    if (!is_array($decoded)) {
        return [];
    }
    $entries = $decoded['entries'] ?? $decoded;
    return is_array($entries) ? array_values(array_filter($entries, 'is_array')) : [];
}

function vsa_error_log_write(array $entries): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    if (count($entries) > VSA_ERROR_LOG_MAX) {
        $entries = array_slice($entries, -VSA_ERROR_LOG_MAX);
    }
    $json = json_encode(
        ['version' => 1, 'entries' => array_values($entries)],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    if ($json === false) {
        return false;
    }
    $ok = @file_put_contents(VSA_ERROR_LOG_FILE, $json, LOCK_EX) !== false;
    if ($ok) {
        vsa_chmod_private(VSA_ERROR_LOG_FILE);
    }
    return $ok;
}

/** Strip the server path prefix so logs stay readable and don't leak the doc root. */
function vsa_error_log_relpath(string $file): string
{
    $base = str_replace('\\', '/', BASE_PATH);
    $file = str_replace('\\', '/', $file);
    if ($base !== '' && str_starts_with($file, $base . '/')) {
        return substr($file, strlen($base) + 1);
    }
    return $file;
}

/**
 * Record an application error. Always mirrors to the host error log so a
 * technical admin can find it even if data/ is unwritable.
 *
 * @param array{file?:string,line?:int,kind?:string,trace?:string} $context
 */
function vsa_log_error(string $message, array $context = []): void
{
    static $writing = false;
    if ($writing) {
        return; // never recurse if logging itself fails
    }
    $writing = true;

    $message = trim($message);
    if ($message === '') {
        $writing = false;
        return;
    }
    if (strlen($message) > 1000) {
        $message = substr($message, 0, 1000) . '…';
    }

    $file = isset($context['file']) ? vsa_error_log_relpath((string) $context['file']) : '';
    $line = isset($context['line']) ? (int) $context['line'] : 0;
    $kind = (string) ($context['kind'] ?? 'error');

    @error_log('[auburn-vsa] ' . $kind . ': ' . $message . ($file !== '' ? ' in ' . $file . ':' . $line : ''));

    $path = (string) ($_SERVER['REQUEST_URI'] ?? (PHP_SAPI === 'cli' ? 'cli' : ''));
    if (strlen($path) > 200) {
        $path = substr($path, 0, 200);
    }
    $user = function_exists('current_username') ? (string) current_username() : '';

    $entry = [
        'at' => time(),
        'kind' => $kind,
        'message' => $message,
        'file' => $file,
        'line' => $line,
        'path' => $path,
        'user' => $user,
        'count' => 1,
    ];
    if (isset($context['trace']) && is_string($context['trace']) && $context['trace'] !== '') {
        $entry['trace'] = substr($context['trace'], 0, 2000);
    }

    $entries = vsa_error_log_read();
    $last = $entries ? $entries[count($entries) - 1] : null;
    $sameFault = $last
        && ($last['message'] ?? '') === $entry['message']
        && ($last['file'] ?? '') === $entry['file']
        && (int) ($last['line'] ?? 0) === $entry['line']
        && (time() - (int) ($last['at'] ?? 0)) <= VSA_ERROR_LOG_DEDUPE_SECONDS;

    if ($sameFault) {
        $entries[count($entries) - 1]['count'] = (int) ($last['count'] ?? 1) + 1;
        $entries[count($entries) - 1]['at'] = $entry['at'];
    } else {
        $entries[] = $entry;
    }

    vsa_error_log_write($entries);
    $writing = false;
}

/** @return list<array<string,mixed>> Newest first. */
function vsa_recent_errors(int $limit = 20): array
{
    $entries = vsa_error_log_read();
    $entries = array_reverse($entries);
    return array_slice($entries, 0, max(1, $limit));
}

/** Errors newer than $sinceTs (used for the admin needs-attention strip). */
function vsa_error_count_since(int $sinceTs): int
{
    $n = 0;
    foreach (vsa_error_log_read() as $entry) {
        if ((int) ($entry['at'] ?? 0) > $sinceTs) {
            $n++;
        }
    }
    return $n;
}

function vsa_clear_error_log(): bool
{
    return vsa_error_log_write([]);
}

/**
 * Catch uncaught exceptions and fatals. Warnings/notices are left to PHP so the
 * log only collects things that actually broke a request.
 */
function vsa_install_error_handlers(): void
{
    static $installed = false;
    if ($installed) {
        return;
    }
    $installed = true;

    set_exception_handler(static function (Throwable $e): void {
        vsa_log_error(get_class($e) . ': ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'kind' => 'exception',
            'trace' => $e->getTraceAsString(),
        ]);
    });

    register_shutdown_function(static function (): void {
        $err = error_get_last();
        if ($err === null) {
            return;
        }
        $fatal = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;
        if (((int) $err['type'] & $fatal) === 0) {
            return;
        }
        vsa_log_error($err['message'], [
            'file' => $err['file'] ?? '',
            'line' => $err['line'] ?? 0,
            'kind' => 'fatal',
        ]);
    });
}
