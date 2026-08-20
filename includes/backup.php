<?php
// Site backup helpers — zip export / restore of CMS data + uploads.

require_once __DIR__ . '/config.php';

const VSA_BACKUP_FORMAT = 'auburn-vsa-backup';
const VSA_BACKUP_VERSION = 1;

function backup_zip_available(): bool
{
    // ZipArchive preferred; lite writer/reader always works for STORE zips.
    return true;
}

function backup_has_ziparchive(): bool
{
    return class_exists('ZipArchive');
}

/** @return list<string> Absolute paths of files currently in uploads/ (not dirs). */
function backup_list_upload_files(): array
{
    $files = [];
    if (!is_dir(UPLOADS_DIR)) {
        return $files;
    }
    $dh = opendir(UPLOADS_DIR);
    if ($dh === false) {
        return $files;
    }
    while (($name = readdir($dh)) !== false) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        $path = UPLOADS_DIR . DIRECTORY_SEPARATOR . $name;
        if (is_file($path) && backup_is_safe_upload_name($name)) {
            $files[] = $path;
        }
    }
    closedir($dh);
    sort($files);
    return $files;
}

function backup_is_safe_upload_name(string $name): bool
{
    if ($name === '.gitkeep') {
        return true;
    }
    if ($name === '' || str_contains($name, '/') || str_contains($name, '\\') || str_contains($name, '..')) {
        return false;
    }
    // Deny config/script droppers even if somehow packaged.
    $lower = strtolower($name);
    if ($lower === '.htaccess' || $lower === '.user.ini' || str_starts_with($lower, '.')) {
        return false;
    }
    if (preg_match('/\.(?i:php\d*|phtml|phar|cgi|pl|py|jsp|asp|aspx|sh|shtml|htaccess)$/', $name)) {
        return false;
    }
    // Only CMS upload naming pattern (or legacy simple media names with safe ext).
    // Keep extensions in sync with admin/upload.php ($allowedImages/$allowedVideo/$allowedAudio).
    return (bool) preg_match(
        '/^(?:[0-9]{14}-[a-f0-9]{10}|[A-Za-z0-9._-]+)\.(?:png|jpe?g|webp|gif|mp4|webm|mov|mp3|m4a|ogg|wav)$/i',
        $name
    );
}

/** @return list<string> Mailbox ids that have a stored file, e.g. ['info','sale']. */
function backup_mail_mailbox_ids(): array
{
    require_once __DIR__ . '/mail.php';
    $ids = [];
    foreach (array_keys(mail_mailbox_catalog()) as $id) {
        if (is_readable(DATA_DIR . '/mail/' . $id . '.json')) {
            $ids[] = $id;
        }
    }
    return $ids;
}

/**
 * Build a zip backup to a temp file.
 * @param callable|null $onProgress function(int $percent, string $label): void
 * @param string|null $destPath If set, write zip here instead of a random temp name.
 * @return array{ok:bool,path?:string,error?:string,filename?:string}
 */
function backup_create_zip(?callable $onProgress = null, ?string $destPath = null): array
{
    require_once __DIR__ . '/content.php';
    require_once __DIR__ . '/backup_zip_lite.php';

    $tick = static function (int $percent, string $label) use ($onProgress): void {
        if ($onProgress) {
            $onProgress(max(0, min(100, $percent)), $label);
        }
    };

    $tick(2, 'Starting backup…');

    if ($destPath !== null && $destPath !== '') {
        $zipPath = $destPath;
        if (is_file($zipPath)) {
            @unlink($zipPath);
        }
    } else {
        $tmp = tempnam(sys_get_temp_dir(), 'vsa-bak-');
        if ($tmp === false) {
            return ['ok' => false, 'error' => 'Could not create a temporary file.'];
        }
        $zipPath = $tmp . '.zip';
        @unlink($tmp);
    }

    $included = [
        'content' => false,
        'newsletters' => false,
        'newsletterDraft' => false,
        'newsletterUnsubRequests' => false,
        'faqInbox' => false,
        'users' => false,
        'constructionMessages' => false,
        'blockedIps' => false,
        'activityLog' => false,
        'scheduledPublish' => false,
        'mail' => 0,
        'passwordHash' => false,
        'uploads' => 0,
    ];
    $entries = [];

    $tick(5, 'Collecting site content…');
    if (is_readable(CONTENT_FILE)) {
        $entries['data/content.json'] = (string) file_get_contents(CONTENT_FILE);
    } else {
        $entries['data/content.json'] = json_encode(
            get_content(),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }
    $included['content'] = true;

    $tick(10, 'Collecting newsletters…');
    $newsFile = DATA_DIR . '/newsletters.json';
    $entries['data/newsletters.json'] = is_readable($newsFile)
        ? (string) file_get_contents($newsFile)
        : '[]';
    $included['newsletters'] = true;

    $tick(12, 'Collecting newsletter draft…');
    $draftFile = DATA_DIR . '/newsletter_drafts.json';
    $entries['data/newsletter_drafts.json'] = is_readable($draftFile)
        ? (string) file_get_contents($draftFile)
        : json_encode(
            ['subject' => '', 'items' => []],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    $included['newsletterDraft'] = true;

    $tick(13, 'Collecting unsubscribe requests…');
    $unsubReqFile = DATA_DIR . '/newsletter_unsub_requests.json';
    $entries['data/newsletter_unsub_requests.json'] = is_readable($unsubReqFile)
        ? (string) file_get_contents($unsubReqFile)
        : '[]';
    $included['newsletterUnsubRequests'] = true;

    $tick(14, 'Collecting FAQ inbox…');
    $faqFile = DATA_DIR . '/faq_inbox.json';
    $entries['data/faq_inbox.json'] = is_readable($faqFile)
        ? (string) file_get_contents($faqFile)
        : '[]';
    $included['faqInbox'] = true;

    $tick(18, 'Collecting users…');
    $usersFile = DATA_DIR . '/users.json';
    if (is_readable($usersFile)) {
        $entries['data/users.json'] = (string) file_get_contents($usersFile);
        $included['users'] = true;
    }

    $tick(22, 'Collecting messages…');
    $msgFile = DATA_DIR . '/construction_messages.json';
    if (is_readable($msgFile)) {
        $entries['data/construction_messages.json'] = (string) file_get_contents($msgFile);
        $included['constructionMessages'] = true;
    }

    $tick(26, 'Collecting blocked IPs…');
    $blockedFile = DATA_DIR . '/blocked_ips.json';
    if (is_readable($blockedFile)) {
        $entries['data/blocked_ips.json'] = (string) file_get_contents($blockedFile);
        $included['blockedIps'] = true;
    }

    $tick(27, 'Collecting scheduled publishes…');
    $schedFile = DATA_DIR . '/scheduled_publish.json';
    if (is_readable($schedFile)) {
        $entries['data/scheduled_publish.json'] = (string) file_get_contents($schedFile);
        $included['scheduledPublish'] = true;
    }

    $tick(28, 'Collecting activity log…');
    $activityFile = DATA_DIR . '/activity_log.json';
    if (is_readable($activityFile)) {
        $entries['data/activity_log.json'] = (string) file_get_contents($activityFile);
        $included['activityLog'] = true;
    }

    $tick(29, 'Collecting mail…');
    foreach (backup_mail_mailbox_ids() as $mailboxId) {
        $raw = @file_get_contents(DATA_DIR . '/mail/' . $mailboxId . '.json');
        if ($raw === false) {
            continue;
        }
        $entries['data/mail/' . $mailboxId . '.json'] = $raw;
        $included['mail']++;
    }

    if (is_readable(ADMIN_PASSWORD_HASH_FILE)) {
        $entries['data/.admin_password_hash'] = (string) file_get_contents(ADMIN_PASSWORD_HASH_FILE);
        $included['passwordHash'] = true;
    }

    $uploadFiles = backup_list_upload_files();
    $uploadTotal = count($uploadFiles);
    $tick(30, $uploadTotal ? ('Reading uploads (0/' . $uploadTotal . ')…') : 'No uploads to include…');

    foreach ($uploadFiles as $i => $abs) {
        $base = basename($abs);
        $bytes = @file_get_contents($abs);
        if ($bytes === false) {
            continue;
        }
        if ($base === '.gitkeep') {
            $entries['uploads/.gitkeep'] = $bytes;
        } else {
            $entries['uploads/' . $base] = $bytes;
            $included['uploads']++;
        }
        if ($uploadTotal > 0) {
            $pct = 30 + (int) floor((($i + 1) / $uploadTotal) * 50);
            $tick($pct, 'Reading uploads (' . ($i + 1) . '/' . $uploadTotal . ')…');
        }
    }

    $manifest = [
        'format' => VSA_BACKUP_FORMAT,
        'version' => VSA_BACKUP_VERSION,
        'createdAt' => date('c'),
        'included' => $included,
    ];
    $entries['manifest.json'] = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    $tick(85, 'Writing zip archive…');
    $wrote = false;
    if (backup_has_ziparchive()) {
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $n = count($entries);
            $j = 0;
            foreach ($entries as $name => $data) {
                $zip->addFromString($name, $data);
                $j++;
                if ($n > 0 && ($j % 5 === 0 || $j === $n)) {
                    $pct = 85 + (int) floor(($j / $n) * 12);
                    $tick($pct, 'Writing zip (' . $j . '/' . $n . ')…');
                }
            }
            $zip->close();
            $wrote = is_file($zipPath);
        }
    }
    if (!$wrote) {
        $tick(90, 'Writing zip archive…');
        if (!backup_zip_write_store($zipPath, $entries)) {
            return ['ok' => false, 'error' => 'Could not write backup zip.'];
        }
    }

    $tick(100, 'Backup ready');
    $stamp = date('Ymd-His');
    return [
        'ok' => true,
        'path' => $zipPath,
        'filename' => 'auburn-vsa-backup-' . $stamp . '.zip',
    ];
}

/** Validate client job id used for progress tracking. */
function backup_job_id_valid(string $job): bool
{
    return (bool) preg_match('/^[a-f0-9]{16,64}$/', $job);
}

/** @return array{progress:string,zip:string}|null */
function backup_job_paths(string $job): ?array
{
    if (!backup_job_id_valid($job)) {
        return null;
    }
    $base = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vsa-bakjob-' . $job;
    return [
        'progress' => $base . '.json',
        'zip' => $base . '.zip',
    ];
}

function backup_progress_write(string $job, array $data): void
{
    $paths = backup_job_paths($job);
    if ($paths === null) {
        return;
    }
    $data['user'] = function_exists('current_username') ? current_username() : '';
    $data['updatedAt'] = time();
    @file_put_contents(
        $paths['progress'],
        json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

/** @return array<string,mixed>|null */
function backup_progress_read(string $job): ?array
{
    $paths = backup_job_paths($job);
    if ($paths === null || !is_readable($paths['progress'])) {
        return null;
    }
    $decoded = json_decode((string) file_get_contents($paths['progress']), true);
    if (!is_array($decoded)) {
        return null;
    }
    $user = function_exists('current_username') ? current_username() : '';
    if ($user === '' || (string) ($decoded['user'] ?? '') !== $user) {
        return null;
    }
    return $decoded;
}

function backup_job_cleanup(string $job): void
{
    $paths = backup_job_paths($job);
    if ($paths === null) {
        return;
    }
    if (is_file($paths['zip'])) {
        @unlink($paths['zip']);
    }
    if (is_file($paths['progress'])) {
        @unlink($paths['progress']);
    }
}

/**
 * Normalize zip entry name to forward-slash relative path without leading ./ 
 */
function backup_normalize_entry(string $name): string
{
    $name = str_replace('\\', '/', $name);
    $name = ltrim($name, '/');
    while (str_starts_with($name, './')) {
        $name = substr($name, 2);
    }
    return $name;
}

/**
 * Map a zip entry to an allowed restore target, or null if rejected.
 * @return array{kind:string,name?:string}|null
 */
function backup_map_entry(string $entry): ?array
{
    $entry = backup_normalize_entry($entry);
    if ($entry === '' || str_ends_with($entry, '/')) {
        return null;
    }
    if (str_contains($entry, '..')) {
        return null;
    }

    // Allow optional top-level folder wrapper: auburn-vsa-backup/...
    if (preg_match('#^[^/]+/(data/|uploads/|manifest\.json$)#', $entry)) {
        $entry = preg_replace('#^[^/]+/#', '', $entry, 1);
    }

    if ($entry === 'manifest.json') {
        return ['kind' => 'manifest'];
    }
    if ($entry === 'data/content.json') {
        return ['kind' => 'content'];
    }
    if ($entry === 'data/newsletters.json') {
        return ['kind' => 'newsletters'];
    }
    if ($entry === 'data/newsletter_drafts.json') {
        return ['kind' => 'newsletterDraft'];
    }
    if ($entry === 'data/newsletter_unsub_requests.json') {
        return ['kind' => 'newsletterUnsubRequests'];
    }
    if ($entry === 'data/faq_inbox.json') {
        return ['kind' => 'faqInbox'];
    }
    if ($entry === 'data/users.json') {
        return ['kind' => 'users'];
    }
    if ($entry === 'data/construction_messages.json') {
        return ['kind' => 'constructionMessages'];
    }
    if ($entry === 'data/blocked_ips.json') {
        return ['kind' => 'blockedIps'];
    }
    if ($entry === 'data/scheduled_publish.json') {
        return ['kind' => 'scheduledPublish'];
    }
    if ($entry === 'data/activity_log.json') {
        return ['kind' => 'activityLog'];
    }
    if (preg_match('#^data/mail/([a-z0-9_-]+)\.json$#', $entry, $mm)) {
        require_once __DIR__ . '/mail.php';
        if (!mail_is_valid_mailbox($mm[1])) {
            return null;
        }
        return ['kind' => 'mail', 'name' => $mm[1]];
    }
    if ($entry === 'data/.admin_password_hash') {
        return ['kind' => 'passwordHash'];
    }
    if (preg_match('#^uploads/([^/]+)$#', $entry, $m)) {
        $name = $m[1];
        if (!backup_is_safe_upload_name($name)) {
            return null;
        }
        return ['kind' => 'upload', 'name' => $name];
    }
    return null;
}

/**
 * Restore from an uploaded zip path.
 * @return array{ok:bool,error?:string,restored?:array}
 */
function backup_restore_zip(string $zipPath, bool $restorePassword): array
{
    require_once __DIR__ . '/backup_zip_lite.php';

    $zipEntries = backup_zip_read_entries($zipPath);
    if ($zipEntries === null) {
        return ['ok' => false, 'error' => 'Could not open the zip file.'];
    }

    $pending = [
        'content' => null,
        'newsletters' => null,
        'newsletterDraft' => null,
        'newsletterUnsubRequests' => null,
        'faqInbox' => null,
        'users' => null,
        'constructionMessages' => null,
        'blockedIps' => null,
        'scheduledPublish' => null,
        'activityLog' => null,
        'mail' => [],
        'passwordHash' => null,
        'uploads' => [],
    ];
    $sawManifest = false;
    $formatOk = false;

    foreach ($zipEntries as $entry => $raw) {
        $mapped = backup_map_entry($entry);
        if ($mapped === null) {
            continue;
        }

        if ($mapped['kind'] === 'manifest') {
            $sawManifest = true;
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && ($decoded['format'] ?? '') === VSA_BACKUP_FORMAT) {
                $formatOk = true;
            }
            continue;
        }

        if ($mapped['kind'] === 'upload') {
            $pending['uploads'][$mapped['name']] = $raw;
            continue;
        }

        if ($mapped['kind'] === 'mail') {
            $decodedMail = json_decode($raw, true);
            if (!is_array($decodedMail)) {
                return ['ok' => false, 'error' => 'Invalid JSON in backup (mail/' . $mapped['name'] . ').'];
            }
            $pending['mail'][$mapped['name']] = $raw;
            continue;
        }

        if ($mapped['kind'] === 'passwordHash') {
            $pending['passwordHash'] = $raw;
            continue;
        }

        $decoded = json_decode($raw, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            return ['ok' => false, 'error' => 'Invalid JSON in backup (' . $mapped['kind'] . ').'];
        }
        $pending[$mapped['kind']] = $raw;
    }

    // Accept backups without manifest if they clearly contain content.json (older / hand-made).
    if ($sawManifest && !$formatOk) {
        return ['ok' => false, 'error' => 'This zip is not a recognized Auburn VSA backup.'];
    }
    if ($pending['content'] === null && empty($pending['uploads']) && $pending['newsletters'] === null && $pending['newsletterDraft'] === null && $pending['newsletterUnsubRequests'] === null && $pending['faqInbox'] === null) {
        return ['ok' => false, 'error' => 'No site content found in this zip.'];
    }

    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return ['ok' => false, 'error' => 'Could not create data directory.'];
    }
    if (!is_dir(UPLOADS_DIR) && !@mkdir(UPLOADS_DIR, 0775, true) && !is_dir(UPLOADS_DIR)) {
        return ['ok' => false, 'error' => 'Could not create uploads directory.'];
    }

    $writeAtomic = function (string $dest, string $contents): bool {
        $tmp = $dest . '.tmp.' . bin2hex(random_bytes(4));
        if (@file_put_contents($tmp, $contents, LOCK_EX) === false) {
            return false;
        }
        if (!@rename($tmp, $dest)) {
            @unlink($tmp);
            return false;
        }
        return true;
    };

    $restored = [
        'content' => false,
        'newsletters' => false,
        'newsletterDraft' => false,
        'newsletterUnsubRequests' => false,
        'faqInbox' => false,
        'users' => false,
        'constructionMessages' => false,
        'blockedIps' => false,
        'scheduledPublish' => false,
        'activityLog' => false,
        'mail' => 0,
        'passwordHash' => false,
        'uploads' => 0,
    ];

    if ($pending['content'] !== null) {
        $check = json_decode($pending['content'], true);
        if (!is_array($check)) {
            return ['ok' => false, 'error' => 'content.json must be a JSON object.'];
        }
        if (!$writeAtomic(CONTENT_FILE, $pending['content'])) {
            return ['ok' => false, 'error' => 'Could not write content.json.'];
        }
        $restored['content'] = true;
    }

    if ($pending['newsletters'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/newsletters.json', $pending['newsletters'])) {
            return ['ok' => false, 'error' => 'Could not write newsletters.json.'];
        }
        $restored['newsletters'] = true;
    }

    if ($pending['newsletterDraft'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/newsletter_drafts.json', $pending['newsletterDraft'])) {
            return ['ok' => false, 'error' => 'Could not write newsletter_drafts.json.'];
        }
        $restored['newsletterDraft'] = true;
    }

    if ($pending['newsletterUnsubRequests'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/newsletter_unsub_requests.json', $pending['newsletterUnsubRequests'])) {
            return ['ok' => false, 'error' => 'Could not write newsletter_unsub_requests.json.'];
        }
        $restored['newsletterUnsubRequests'] = true;
    }

    if ($pending['faqInbox'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/faq_inbox.json', $pending['faqInbox'])) {
            return ['ok' => false, 'error' => 'Could not write faq_inbox.json.'];
        }
        $restored['faqInbox'] = true;
    }

    if ($pending['users'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/users.json', $pending['users'])) {
            return ['ok' => false, 'error' => 'Could not write users.json.'];
        }
        vsa_chmod_private(DATA_DIR . '/users.json');
        $restored['users'] = true;
    }

    if ($pending['constructionMessages'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/construction_messages.json', $pending['constructionMessages'])) {
            return ['ok' => false, 'error' => 'Could not write construction_messages.json.'];
        }
        vsa_chmod_private(DATA_DIR . '/construction_messages.json');
        $restored['constructionMessages'] = true;
    }

    if ($pending['blockedIps'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/blocked_ips.json', $pending['blockedIps'])) {
            return ['ok' => false, 'error' => 'Could not write blocked_ips.json.'];
        }
        vsa_chmod_private(DATA_DIR . '/blocked_ips.json');
        $restored['blockedIps'] = true;
    }

    if ($pending['scheduledPublish'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/scheduled_publish.json', $pending['scheduledPublish'])) {
            return ['ok' => false, 'error' => 'Could not write scheduled_publish.json.'];
        }
        $restored['scheduledPublish'] = true;
    }

    if ($pending['activityLog'] !== null) {
        if (!$writeAtomic(DATA_DIR . '/activity_log.json', $pending['activityLog'])) {
            return ['ok' => false, 'error' => 'Could not write activity_log.json.'];
        }
        vsa_chmod_private(DATA_DIR . '/activity_log.json');
        $restored['activityLog'] = true;
    }

    if ($pending['mail']) {
        $mailDir = DATA_DIR . '/mail';
        if (!is_dir($mailDir) && !@mkdir($mailDir, 0775, true) && !is_dir($mailDir)) {
            return ['ok' => false, 'error' => 'Could not create mail directory.'];
        }
        foreach ($pending['mail'] as $mailboxId => $raw) {
            $dest = $mailDir . '/' . $mailboxId . '.json';
            if (!$writeAtomic($dest, $raw)) {
                return ['ok' => false, 'error' => 'Could not write mail/' . $mailboxId . '.json.'];
            }
            vsa_chmod_private($dest);
            $restored['mail']++;
        }
    }

    if ($restorePassword && $pending['passwordHash'] !== null) {
        require_once __DIR__ . '/auth.php';
        if (!admin_password_is_env_locked()) {
            $hash = trim($pending['passwordHash']);
            if ($hash !== '' && str_starts_with($hash, '$2')) {
                if (!$writeAtomic(ADMIN_PASSWORD_HASH_FILE, $hash . "\n")) {
                    return ['ok' => false, 'error' => 'Could not write admin password hash.'];
                }
                vsa_chmod_private(ADMIN_PASSWORD_HASH_FILE);
                $restored['passwordHash'] = true;
            }
        }
    }

    foreach (backup_list_upload_files() as $abs) {
        $base = basename($abs);
        if ($base === '.gitkeep') {
            continue;
        }
        @unlink($abs);
    }

    foreach ($pending['uploads'] as $name => $bytes) {
        if ($name === '.gitkeep') {
            $dest = UPLOADS_DIR . DIRECTORY_SEPARATOR . '.gitkeep';
            @file_put_contents($dest, $bytes);
            continue;
        }
        $dest = UPLOADS_DIR . DIRECTORY_SEPARATOR . $name;
        if (@file_put_contents($dest, $bytes, LOCK_EX) === false) {
            return ['ok' => false, 'error' => 'Could not write upload: ' . $name];
        }
        $restored['uploads']++;
    }

    return ['ok' => true, 'restored' => $restored];
}
