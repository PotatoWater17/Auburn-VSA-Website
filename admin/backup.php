<?php
// Admin backup API — prepare/progress/download zip + import restore.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/backup.php';

start_session();
send_security_headers(true);

if (!is_logged_in() || !current_user()) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!current_user_can('backup')) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'You do not have permission for backups.']);
    exit;
}

$csrf = csrf_from_request(null);
if (!verify_csrf($csrf)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Invalid CSRF token']);
    exit;
}

/** Release session lock so progress polls can run while prepare is working. */
function backup_api_unlock_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $action = strtolower((string) ($_GET['action'] ?? 'download'));
    $job = strtolower(trim((string) ($_GET['job'] ?? '')));

    if ($action === 'progress') {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        backup_api_unlock_session();
        if (!backup_job_id_valid($job)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid job id']);
            exit;
        }
        $prog = backup_progress_read($job);
        if ($prog === null) {
            echo json_encode([
                'ok' => true,
                'state' => 'pending',
                'percent' => 0,
                'label' => 'Waiting…',
            ]);
            exit;
        }
        echo json_encode([
            'ok' => true,
            'state' => (string) ($prog['state'] ?? 'working'),
            'percent' => (int) ($prog['percent'] ?? 0),
            'label' => (string) ($prog['label'] ?? ''),
            'filename' => (string) ($prog['filename'] ?? ''),
            'error' => (string) ($prog['error'] ?? ''),
        ]);
        exit;
    }

    if ($action === 'download') {
        backup_api_unlock_session();

        // Preferred path: serve a previously prepared job zip.
        if ($job !== '') {
            if (!backup_job_id_valid($job)) {
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['ok' => false, 'error' => 'Invalid job id']);
                exit;
            }
            $paths = backup_job_paths($job);
            $prog = backup_progress_read($job);
            if ($paths === null || $prog === null || (string) ($prog['state'] ?? '') !== 'done') {
                http_response_code(404);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['ok' => false, 'error' => 'Backup is not ready yet.']);
                exit;
            }
            $path = $paths['zip'];
            $filename = (string) ($prog['filename'] ?? 'auburn-vsa-backup.zip');
            if (!is_file($path)) {
                backup_job_cleanup($job);
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['ok' => false, 'error' => 'Backup file missing.']);
                exit;
            }
            $size = filesize($path);
            if ($size === false) {
                backup_job_cleanup($job);
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['ok' => false, 'error' => 'Backup file missing.']);
                exit;
            }
            $safeName = preg_replace('/[^A-Za-z0-9._-]/', '', $filename) ?: 'auburn-vsa-backup.zip';
            log_admin_action('backup_download', 'Downloaded site backup', [
                'meta' => ['filename' => $safeName, 'size' => $size],
            ]);
            header('Content-Type: application/zip');
            header('Content-Length: ' . $size);
            header('Content-Disposition: attachment; filename="' . $safeName . '"');
            header('Cache-Control: no-store');
            readfile($path);
            backup_job_cleanup($job);
            exit;
        }

        // Legacy one-shot create + download (no progress UI).
        $result = backup_create_zip();
        if (!$result['ok']) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Backup failed']);
            exit;
        }

        $path = $result['path'];
        $filename = $result['filename'] ?? 'auburn-vsa-backup.zip';
        $size = filesize($path);
        if ($size === false) {
            @unlink($path);
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'error' => 'Backup file missing after create.']);
            exit;
        }

        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '', $filename) ?: 'auburn-vsa-backup.zip';
        log_admin_action('backup_download', 'Downloaded site backup', [
            'meta' => ['filename' => $safeName, 'size' => $size],
        ]);
        header('Content-Type: application/zip');
        header('Content-Length: ' . $size);
        header('Content-Disposition: attachment; filename="' . $safeName . '"');
        header('Cache-Control: no-store');
        readfile($path);
        @unlink($path);
        exit;
    }

    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$action = strtolower((string) ($_POST['action'] ?? ''));
if ($action === '' && empty($_FILES['file'])) {
    // JSON body for prepare
    $raw = file_get_contents('php://input');
    $jsonBody = json_decode($raw ?: '', true);
    if (is_array($jsonBody)) {
        $action = strtolower((string) ($jsonBody['action'] ?? ''));
        $_POST = array_merge($_POST, $jsonBody);
    }
}

if ($action === 'prepare') {
    $job = strtolower(trim((string) ($_POST['job'] ?? '')));
    if (!backup_job_id_valid($job)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid job id']);
        exit;
    }

    $paths = backup_job_paths($job);
    if ($paths === null) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid job id']);
        exit;
    }

    backup_api_unlock_session();
    @set_time_limit(300);
    ignore_user_abort(true);

    backup_progress_write($job, [
        'state' => 'working',
        'percent' => 1,
        'label' => 'Preparing zip…',
    ]);

    $result = backup_create_zip(
        static function (int $percent, string $label) use ($job): void {
            backup_progress_write($job, [
                'state' => 'working',
                'percent' => $percent,
                'label' => $label,
            ]);
        },
        $paths['zip']
    );

    if (!$result['ok']) {
        backup_progress_write($job, [
            'state' => 'error',
            'percent' => 0,
            'label' => 'Backup failed',
            'error' => $result['error'] ?? 'Backup failed',
        ]);
        if (is_file($paths['zip'])) {
            @unlink($paths['zip']);
        }
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Backup failed']);
        exit;
    }

    $filename = $result['filename'] ?? 'auburn-vsa-backup.zip';
    $size = is_file($paths['zip']) ? filesize($paths['zip']) : false;
    if ($size === false) {
        backup_progress_write($job, [
            'state' => 'error',
            'percent' => 0,
            'label' => 'Backup failed',
            'error' => 'Backup file missing after create.',
        ]);
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Backup file missing after create.']);
        exit;
    }

    backup_progress_write($job, [
        'state' => 'done',
        'percent' => 100,
        'label' => 'Backup ready',
        'filename' => $filename,
        'size' => $size,
    ]);

    echo json_encode([
        'ok' => true,
        'job' => $job,
        'filename' => $filename,
        'size' => $size,
    ]);
    exit;
}

// Restore can overwrite passwords and code-adjacent data — root only.
if (!current_user_is_root()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Only the root admin can restore a backup.']);
    exit;
}

if ($action !== 'import') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No backup zip uploaded.']);
    exit;
}

$file = $_FILES['file'];
$err = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($err !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'Zip is larger than the server upload limit.',
        UPLOAD_ERR_FORM_SIZE => 'Zip is larger than the form limit.',
        UPLOAD_ERR_PARTIAL => 'Upload was incomplete. Try again.',
        UPLOAD_ERR_NO_FILE => 'No backup zip uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server temp folder is missing.',
        UPLOAD_ERR_CANT_WRITE => 'Server could not save the upload.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by a PHP extension.',
    ];
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $messages[$err] ?? 'Upload failed.']);
    exit;
}

$maxBytes = 120 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Backup zip too large (max 120 MB).']);
    exit;
}

$tmp = (string) ($file['tmp_name'] ?? '');
if ($tmp === '' || !is_uploaded_file($tmp)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid upload.']);
    exit;
}

$ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
$mime = function_exists('mime_content_type') ? (string) @mime_content_type($tmp) : '';
$okMime = in_array($mime, ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', ''], true);
if ($ext !== 'zip' && !$okMime) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please upload a .zip backup file.']);
    exit;
}

$restorePassword = !empty($_POST['restorePassword']) && $_POST['restorePassword'] !== '0' && $_POST['restorePassword'] !== 'false';
$result = backup_restore_zip($tmp, $restorePassword);
if (!$result['ok']) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Import failed']);
    exit;
}

log_admin_action('backup_restore', 'Restored site from backup zip', [
    'meta' => [
        'restorePassword' => $restorePassword ? 'yes' : 'no',
        'restored' => $result['restored'] ?? [],
    ],
]);

echo json_encode([
    'ok' => true,
    'message' => 'Backup imported. Reloading…',
    'restored' => $result['restored'] ?? [],
]);
