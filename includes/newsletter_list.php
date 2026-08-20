<?php
// Shared newsletter subscriber list (data/newsletters.json).

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';

define('NEWSLETTER_LIST_FILE', DATA_DIR . '/newsletters.json');

/**
 * @return list<array{email?:string,ts?:string,token?:string}|string>
 */
function newsletter_list_load_raw(): array
{
    $file = NEWSLETTER_LIST_FILE;
    if (!is_file($file)) {
        return [];
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * @param list<mixed> $list
 */
function newsletter_list_save(array $list): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    return security_write_json(NEWSLETTER_LIST_FILE, array_values($list));
}

/**
 * @param mixed $row
 */
function newsletter_list_row_email($row): string
{
    if (is_string($row)) {
        return strtolower(trim($row));
    }
    if (is_array($row)) {
        return strtolower(trim((string) ($row['email'] ?? '')));
    }
    return '';
}

/**
 * @param mixed $row
 */
function newsletter_list_row_token($row): string
{
    if (!is_array($row)) {
        return '';
    }
    return strtolower(trim((string) ($row['token'] ?? '')));
}

function newsletter_list_new_token(): string
{
    try {
        return bin2hex(random_bytes(16));
    } catch (Throwable $e) {
        return hash('sha256', uniqid('nl', true) . microtime(true));
    }
}

/**
 * Ensure every subscriber row is an array with email + token. Saves if changed.
 *
 * @return list<array{email:string,ts:string,token:string}>
 */
function newsletter_list_ensure_tokens(): array
{
    $raw = newsletter_list_load_raw();
    $out = [];
    $changed = false;
    foreach ($raw as $row) {
        $email = newsletter_list_row_email($row);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $changed = true;
            continue;
        }
        $ts = '';
        $token = '';
        if (is_array($row)) {
            $ts = trim((string) ($row['ts'] ?? $row['at'] ?? $row['createdAt'] ?? ''));
            $token = newsletter_list_row_token($row);
        } else {
            $changed = true;
        }
        if ($token === '' || !preg_match('/^[a-f0-9]{16,64}$/', $token)) {
            $token = newsletter_list_new_token();
            $changed = true;
        }
        if ($ts === '') {
            $ts = date('c');
            $changed = true;
        }
        $out[] = [
            'email' => $email,
            'ts' => $ts,
            'token' => $token,
        ];
    }
    if ($changed) {
        newsletter_list_save($out);
    }
    return $out;
}

/**
 * @return array{email:string,ts:string,token:string}|null
 */
function newsletter_list_find_by_token(string $token): ?array
{
    $token = strtolower(trim($token));
    if ($token === '' || !preg_match('/^[a-f0-9]{16,64}$/', $token)) {
        return null;
    }
    foreach (newsletter_list_ensure_tokens() as $row) {
        if (($row['token'] ?? '') === $token) {
            return $row;
        }
    }
    return null;
}

/**
 * Public origin for unsubscribe links (same rules as newsletter compose).
 */
function newsletter_list_public_origin(): string
{
    $env = getenv('VSA_PUBLIC_ORIGIN');
    if (is_string($env) && trim($env) !== '') {
        return rtrim(trim($env), '/');
    }
    $hostHeader = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $host = strtolower($hostHeader);
    $isLocal = $host === '' || (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $host);
    if (!$isLocal && $hostHeader !== '') {
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443')
            || (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https');
        return ($https ? 'https' : 'http') . '://' . $hostHeader;
    }
    return 'https://www.auburnvsa.com';
}

function newsletter_list_unsub_url(string $token): string
{
    $token = strtolower(trim($token));
    return newsletter_list_public_origin() . '/unsubscribe?t=' . rawurlencode($token);
}

function newsletter_list_mask_email(string $email): string
{
    $email = strtolower(trim($email));
    $at = strpos($email, '@');
    if ($at === false) {
        return 'your address';
    }
    $local = substr($email, 0, $at);
    $domain = substr($email, $at + 1);
    $keep = min(2, max(1, strlen($local)));
    return substr($local, 0, $keep) . '…@' . $domain;
}

/**
 * Remove by secret token (cannot unsubscribe others without their link).
 *
 * @return array{ok:bool,removed:bool,email?:string,error?:string}
 */
function newsletter_list_remove_by_token(string $token): array
{
    $token = strtolower(trim($token));
    if ($token === '' || !preg_match('/^[a-f0-9]{16,64}$/', $token)) {
        return ['ok' => false, 'removed' => false, 'error' => 'Invalid unsubscribe link.'];
    }

    $list = newsletter_list_ensure_tokens();
    $next = [];
    $removed = false;
    $email = '';
    foreach ($list as $row) {
        if (($row['token'] ?? '') === $token) {
            $removed = true;
            $email = (string) ($row['email'] ?? '');
            continue;
        }
        $next[] = $row;
    }

    if (!$removed) {
        // Already gone or bad token — same success message (no enumeration).
        return ['ok' => true, 'removed' => false];
    }

    if (!newsletter_list_save($next)) {
        return ['ok' => false, 'removed' => false, 'error' => 'Could not update the list. Try again.'];
    }

    return ['ok' => true, 'removed' => true, 'email' => $email];
}

/**
 * Admin / internal remove by email.
 *
 * @return array{ok:bool,removed:bool,error?:string}
 */
function newsletter_list_remove(string $email): array
{
    $email = strtolower(trim($email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'removed' => false, 'error' => 'Please enter a valid email address.'];
    }

    $list = newsletter_list_ensure_tokens();
    $next = [];
    $removed = false;
    foreach ($list as $row) {
        if (($row['email'] ?? '') === $email) {
            $removed = true;
            continue;
        }
        $next[] = $row;
    }

    if (!$removed) {
        return ['ok' => true, 'removed' => false];
    }

    if (!newsletter_list_save($next)) {
        return ['ok' => false, 'removed' => false, 'error' => 'Could not update the list. Try again.'];
    }

    return ['ok' => true, 'removed' => true];
}

define('NEWSLETTER_UNSUB_REQUESTS_FILE', DATA_DIR . '/newsletter_unsub_requests.json');

/**
 * @return list<array{id:string,email:string,ts:string,ip:string,status:string}>
 */
function newsletter_unsub_requests_load(): array
{
    $decoded = security_read_json(NEWSLETTER_UNSUB_REQUESTS_FILE, []);
    if (!is_array($decoded)) {
        return [];
    }
    $out = [];
    foreach ($decoded as $row) {
        if (!is_array($row)) {
            continue;
        }
        $email = strtolower(trim((string) ($row['email'] ?? '')));
        $id = trim((string) ($row['id'] ?? ''));
        if ($email === '' || $id === '') {
            continue;
        }
        $out[] = [
            'id' => $id,
            'email' => $email,
            'ts' => (string) ($row['ts'] ?? ''),
            'ip' => (string) ($row['ip'] ?? ''),
            'status' => (string) ($row['status'] ?? 'pending'),
        ];
    }
    return $out;
}

/**
 * @param list<array<string,string>> $rows
 */
function newsletter_unsub_requests_save(array $rows): bool
{
    return security_write_json(NEWSLETTER_UNSUB_REQUESTS_FILE, array_values($rows));
}

/**
 * Queue an unsubscribe request — does NOT remove the subscriber.
 * Scripts can spam requests; they cannot wipe the list without admin approval.
 * Success is returned only after the pending row is confirmed on disk (admin portal).
 *
 * @return array{ok:bool,error?:string,queued?:bool,confirmed?:bool,requestId?:string,message?:string}
 */
function newsletter_unsub_request_add(string $email, string $ip = ''): array
{
    $email = strtolower(trim($email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Please enter a valid email address.'];
    }
    if ($ip === '' && function_exists('client_ip')) {
        $ip = client_ip();
    }

    $rows = newsletter_unsub_requests_load();
    foreach ($rows as $row) {
        if (($row['status'] ?? '') === 'pending' && ($row['email'] ?? '') === $email) {
            $existingId = (string) ($row['id'] ?? '');
            // Confirm it is still visible to the admin pending list before telling the user.
            if ($existingId !== '' && newsletter_unsub_request_is_pending($existingId, $email)) {
                return [
                    'ok' => true,
                    'queued' => false,
                    'confirmed' => true,
                    'requestId' => $existingId,
                    'message' => 'Your unsubscribe request is already with Auburn VSA. Please allow a little time for it to be processed.',
                ];
            }
        }
    }

    $id = bin2hex(random_bytes(8));
    $rows[] = [
        'id' => $id,
        'email' => $email,
        'ts' => date('c'),
        'ip' => $ip,
        'status' => 'pending',
    ];

    // Keep the queue from growing forever.
    if (count($rows) > 300) {
        $rows = array_slice($rows, -300);
    }

    if (!newsletter_unsub_requests_save($rows)) {
        return ['ok' => false, 'error' => 'Could not save your request. Try again.'];
    }

    // Must be readable back into the admin pending queue before we confirm to the visitor.
    if (!newsletter_unsub_request_is_pending($id, $email)) {
        return [
            'ok' => false,
            'error' => 'Could not confirm your request was saved. Please try again in a moment.',
        ];
    }

    return [
        'ok' => true,
        'queued' => true,
        'confirmed' => true,
        'requestId' => $id,
        'message' => 'Request received by Auburn VSA. You will be removed from the newsletter list after an admin confirms.',
    ];
}

/** True when id+email is present as pending in the admin queue (fresh disk read). */
function newsletter_unsub_request_is_pending(string $id, string $email = ''): bool
{
    $id = trim($id);
    $email = strtolower(trim($email));
    if ($id === '') {
        return false;
    }
    clearstatcache(true, NEWSLETTER_UNSUB_REQUESTS_FILE);
    foreach (newsletter_unsub_requests_pending() as $row) {
        if (($row['id'] ?? '') !== $id) {
            continue;
        }
        if ($email !== '' && ($row['email'] ?? '') !== $email) {
            continue;
        }
        return ($row['status'] ?? '') === 'pending';
    }
    return false;
}

/**
 * @return list<array{id:string,email:string,ts:string,ip:string,status:string}>
 */
function newsletter_unsub_requests_pending(): array
{
    $pending = [];
    foreach (newsletter_unsub_requests_load() as $row) {
        if (($row['status'] ?? '') === 'pending') {
            $pending[] = $row;
        }
    }
    usort($pending, static function ($a, $b) {
        return strcmp((string) ($b['ts'] ?? ''), (string) ($a['ts'] ?? ''));
    });
    return $pending;
}

/**
 * Approve a pending request: remove subscriber + mark request approved.
 *
 * @return array{ok:bool,error?:string,email?:string}
 */
function newsletter_unsub_request_approve(string $id): array
{
    $id = trim($id);
    $rows = newsletter_unsub_requests_load();
    $email = '';
    $found = false;
    foreach ($rows as &$row) {
        if (($row['id'] ?? '') === $id && ($row['status'] ?? '') === 'pending') {
            $email = (string) ($row['email'] ?? '');
            $row['status'] = 'approved';
            $row['resolvedAt'] = date('c');
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$found || $email === '') {
        return ['ok' => false, 'error' => 'Request not found (it may already be resolved).'];
    }

    $remove = newsletter_list_remove($email);
    if (empty($remove['ok'])) {
        return ['ok' => false, 'error' => $remove['error'] ?? 'Could not remove subscriber.'];
    }

    if (!newsletter_unsub_requests_save($rows)) {
        return ['ok' => false, 'error' => 'Removed subscriber but could not update the request queue.'];
    }

    return ['ok' => true, 'email' => $email];
}

/**
 * @return array{ok:bool,error?:string}
 */
function newsletter_unsub_request_dismiss(string $id): array
{
    $id = trim($id);
    $rows = newsletter_unsub_requests_load();
    $found = false;
    foreach ($rows as &$row) {
        if (($row['id'] ?? '') === $id && ($row['status'] ?? '') === 'pending') {
            $row['status'] = 'dismissed';
            $row['resolvedAt'] = date('c');
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$found) {
        return ['ok' => false, 'error' => 'Request not found (it may already be resolved).'];
    }
    if (!newsletter_unsub_requests_save($rows)) {
        return ['ok' => false, 'error' => 'Could not update the request queue.'];
    }
    return ['ok' => true];
}

/**
 * When unsubscribe rate limit trips: temporary blocked-IP row (admin UI) + Messages alert.
 * Soft lock (source unsub_cooldown) — does not sitewide-block; only slows unsubscribe.
 * Idempotent while an active unsub_cooldown row already exists for the IP.
 */
function newsletter_unsub_rate_lockout(string $ip = '', int $retryAfter = 0): void
{
    require_once __DIR__ . '/construction.php';

    if ($ip === '') {
        $ip = function_exists('client_ip') ? client_ip() : '';
    }
    $ip = trim($ip);
    if ($ip === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
        return;
    }

    $seconds = $retryAfter > 0
        ? max(60, (int) $retryAfter)
        : (defined('NEWSLETTER_UNSUB_RATE_WINDOW') ? (int) NEWSLETTER_UNSUB_RATE_WINDOW : 43200);
    $windowHours = max(1, (int) ceil($seconds / 3600));

    $alreadyActive = false;
    foreach (get_blocked_ips() as $row) {
        if (!is_array($row)) {
            continue;
        }
        if ((string) ($row['ip'] ?? '') !== $ip) {
            continue;
        }
        if ((string) ($row['source'] ?? '') !== 'unsub_cooldown') {
            continue;
        }
        if (blocked_ip_is_active($row)) {
            $alreadyActive = true;
            break;
        }
    }

    if ($alreadyActive) {
        return;
    }

    block_ip($ip, [
        'source' => 'unsub_cooldown',
        'name' => 'Unsubscribe cooldown',
        'reason' => 'Too many unsubscribe attempts (5 per ' . $windowHours . 'h)',
        'note' => 'Soft lock — unsubscribe only; Unblock clears the rate bucket',
        'expiresIn' => $seconds,
    ]);

    add_security_message(
        'IP ' . $ip . ' hit the unsubscribe limit (5 attempts / ' . $windowHours
            . 'h). Listed under Blocked IPs → Unsubscribe cooldowns until '
            . date('M j, Y g:ia', time() + $seconds) . ' (or until you unblock).',
        [
            'ip' => $ip,
            'name' => 'System',
            'source' => 'Security · Unsubscribe cooldown',
        ]
    );
}
