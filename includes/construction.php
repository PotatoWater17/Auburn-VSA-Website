<?php
// Construction mode: visitor messages, IP rate limits, and blocked IPs.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/activity.php';

define('CONSTRUCTION_MESSAGES_FILE', DATA_DIR . '/construction_messages.json');
define('BLOCKED_IPS_FILE', DATA_DIR . '/blocked_ips.json');
define('CONSTRUCTION_RATE_FILE', DATA_DIR . '/construction_rate.json');

/** Max construction-message POSTs per IP per rolling hour before auto-block. */
define('CONSTRUCTION_RATE_LIMIT', 50);
define('CONSTRUCTION_RATE_WINDOW', 3600);
/** Default auto-block duration (seconds). */
define('CONSTRUCTION_AUTO_BLOCK_SECONDS', 86400);

// client_ip() lives in includes/security.php (shared with activity / login / blocks).

function construction_read_json(string $file, $fallback = [])
{
    if (!is_readable($file)) {
        return $fallback;
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $fallback;
}

function construction_write_json(string $file, $data): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return false;
    }
    vsa_chmod_private($file);
    return true;
}

/** @return list<array> */
function get_construction_messages(): array
{
    $decoded = construction_read_json(CONSTRUCTION_MESSAGES_FILE, []);
    if (isset($decoded['messages']) && is_array($decoded['messages'])) {
        return array_values(array_filter($decoded['messages'], 'is_array'));
    }
    return array_values(array_filter($decoded, 'is_array'));
}

function save_construction_messages(array $items): bool
{
    return construction_write_json(CONSTRUCTION_MESSAGES_FILE, [
        'version' => 1,
        'updatedAt' => date('c'),
        'messages' => array_values($items),
    ]);
}

function construction_message_find(array $items, string $id): ?int
{
    foreach ($items as $i => $item) {
        if (($item['id'] ?? '') === $id) {
            return (int) $i;
        }
    }
    return null;
}

/** @return list<array> */
function get_blocked_ips(): array
{
    $decoded = construction_read_json(BLOCKED_IPS_FILE, []);
    if (isset($decoded['ips']) && is_array($decoded['ips'])) {
        return array_values(array_filter($decoded['ips'], 'is_array'));
    }
    return array_values(array_filter($decoded, 'is_array'));
}

function save_blocked_ips(array $items): bool
{
    return construction_write_json(BLOCKED_IPS_FILE, [
        'version' => 1,
        'updatedAt' => date('c'),
        'ips' => array_values($items),
    ]);
}

function blocked_ip_find(array $items, string $ip): ?int
{
    $ip = trim($ip);
    foreach ($items as $i => $item) {
        if (($item['ip'] ?? '') === $ip) {
            return (int) $i;
        }
    }
    return null;
}

function blocked_ip_is_active(array $row, ?int $now = null): bool
{
    $now = $now ?? time();
    $expires = $row['expiresAt'] ?? null;
    if ($expires === null || $expires === '') {
        return true; // permanent
    }
    $ts = is_numeric($expires) ? (int) $expires : (strtotime((string) $expires) ?: 0);
    return $ts === 0 || $ts > $now;
}

/**
 * Parse an expiry value into ISO-8601 or null (permanent).
 * Accepts null / '' / 'permanent', unix timestamps, ISO strings, or datetime-local.
 *
 * @return array{ok:bool,expiresAt?:?string,error?:string}
 */
function parse_blocked_ip_expiry($val): array
{
    if ($val === null || $val === '' || $val === false || $val === 'permanent') {
        return ['ok' => true, 'expiresAt' => null];
    }
    if (is_numeric($val)) {
        $ts = (int) $val;
        if ($ts <= 0) {
            return ['ok' => true, 'expiresAt' => null];
        }
        return ['ok' => true, 'expiresAt' => date('c', $ts)];
    }
    $raw = trim((string) $val);
    if ($raw === '' || strcasecmp($raw, 'permanent') === 0) {
        return ['ok' => true, 'expiresAt' => null];
    }
    $ts = strtotime($raw);
    if ($ts === false || $ts <= 0) {
        return ['ok' => false, 'error' => 'Invalid expiration date/time.'];
    }
    return ['ok' => true, 'expiresAt' => date('c', $ts)];
}

/**
 * @return array{ok:bool,expiresAt?:?string,error?:string}
 */
function parse_blocked_ip_expires_in($secs): array
{
    $secs = (int) $secs;
    if ($secs <= 0) {
        return ['ok' => true, 'expiresAt' => null];
    }
    return ['ok' => true, 'expiresAt' => date('c', time() + $secs)];
}

/**
 * Resolve expiry from opts/patch. expiresIn wins when both are present.
 *
 * @return array{ok:bool,expiresAt?:?string,error?:string,set:bool}
 */
function resolve_blocked_ip_expiry_opts(array $opts): array
{
    if (array_key_exists('expiresIn', $opts)) {
        $parsed = parse_blocked_ip_expires_in($opts['expiresIn']);
        $parsed['set'] = true;
        return $parsed;
    }
    if (array_key_exists('expiresAt', $opts)) {
        $parsed = parse_blocked_ip_expiry($opts['expiresAt']);
        $parsed['set'] = true;
        return $parsed;
    }
    return ['ok' => true, 'set' => false];
}

function is_ip_blocked(?string $ip = null): bool
{
    $ip = $ip ?? client_ip();
    foreach (get_blocked_ips() as $row) {
        if (($row['ip'] ?? '') !== $ip) {
            continue;
        }
        // Soft unsubscribe cooldowns are listed for admins but do not sitewide-block.
        if ((string) ($row['source'] ?? '') === 'unsub_cooldown') {
            continue;
        }
        if (blocked_ip_is_active($row)) {
            return true;
        }
    }
    return false;
}

/** Active soft lock from newsletter unsubscribe rate limit (not a full site block). */
function is_newsletter_unsub_cooldown(?string $ip = null): bool
{
    $ip = $ip ?? client_ip();
    foreach (get_blocked_ips() as $row) {
        if (($row['ip'] ?? '') !== $ip) {
            continue;
        }
        if ((string) ($row['source'] ?? '') !== 'unsub_cooldown') {
            continue;
        }
        if (blocked_ip_is_active($row)) {
            return true;
        }
    }
    return false;
}

/**
 * Public view of a blocked IP row (no secrets).
 */
function public_blocked_ip_view(array $row): array
{
    $now = time();
    $expires = $row['expiresAt'] ?? null;
    $expiresIso = null;
    $expiresTs = null;
    if ($expires !== null && $expires !== '') {
        if (is_numeric($expires)) {
            $expiresTs = (int) $expires;
            $expiresIso = date('c', $expiresTs);
        } else {
            $ts = strtotime((string) $expires);
            if ($ts) {
                $expiresTs = $ts;
                $expiresIso = date('c', $ts);
            }
        }
    }
    $active = blocked_ip_is_active($row, $now);
    $remaining = null;
    if ($expiresTs !== null) {
        $remaining = max(0, $expiresTs - $now);
    }
    return [
        'id' => (string) ($row['id'] ?? ''),
        'ip' => (string) ($row['ip'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'note' => (string) ($row['note'] ?? ''),
        'reason' => (string) ($row['reason'] ?? ''),
        'source' => (string) ($row['source'] ?? 'admin'),
        'blockedAt' => (string) ($row['blockedAt'] ?? ''),
        'expiresAt' => $expiresIso,
        'remainingSeconds' => $remaining,
        'active' => $active,
        'permanent' => $expiresIso === null,
    ];
}

/**
 * @return array{ok:bool,error?:string,row?:array,updated?:bool}
 */
function block_ip(string $ip, array $opts = []): array
{
    $ip = trim($ip);
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return ['ok' => false, 'error' => 'Invalid IP address.'];
    }
    $items = get_blocked_ips();
    $idx = blocked_ip_find($items, $ip);
    $expiry = resolve_blocked_ip_expiry_opts($opts);
    if (empty($expiry['ok'])) {
        return ['ok' => false, 'error' => (string) ($expiry['error'] ?? 'Invalid expiration.')];
    }
    $expiresAt = !empty($expiry['set'])
        ? ($expiry['expiresAt'] ?? null)
        : date('c', time() + CONSTRUCTION_AUTO_BLOCK_SECONDS);

    $existing = $idx !== null ? $items[$idx] : null;
    $row = [
        'id' => $existing !== null
            ? (string) ($existing['id'] ?? bin2hex(random_bytes(8)))
            : bin2hex(random_bytes(8)),
        'ip' => $ip,
        'name' => (string) ($opts['name'] ?? ($existing['name'] ?? '')),
        'note' => (string) ($opts['note'] ?? ($existing['note'] ?? '')),
        'reason' => (string) ($opts['reason'] ?? ($existing['reason'] ?? '')),
        'source' => (string) ($opts['source'] ?? ($existing['source'] ?? 'admin')),
        'blockedAt' => $existing !== null
            ? (string) ($existing['blockedAt'] ?? date('c'))
            : date('c'),
        'expiresAt' => $expiresAt,
        'updatedAt' => date('c'),
    ];
    if (array_key_exists('name', $opts)) {
        $row['name'] = (string) $opts['name'];
    }
    if (array_key_exists('note', $opts)) {
        $row['note'] = (string) $opts['note'];
    }
    if (array_key_exists('reason', $opts)) {
        $row['reason'] = (string) $opts['reason'];
    }

    if ($idx !== null) {
        $items[$idx] = $row;
    } else {
        $items[] = $row;
    }
    if (!save_blocked_ips($items)) {
        return ['ok' => false, 'error' => 'Could not save blocked IPs.'];
    }
    return [
        'ok' => true,
        'row' => public_blocked_ip_view($row),
        'updated' => $idx !== null,
    ];
}

/**
 * @return array{ok:bool,error?:string}
 */
function unblock_ip(string $ip): array
{
    $items = get_blocked_ips();
    $idx = blocked_ip_find($items, $ip);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'IP not found.'];
    }
    array_splice($items, $idx, 1);
    if (!save_blocked_ips($items)) {
        return ['ok' => false, 'error' => 'Could not save blocked IPs.'];
    }
    return ['ok' => true];
}

/**
 * Remove expired (inactive) block rows. Permanent and active rows are kept.
 *
 * @return array{ok:bool,error?:string,removed?:int}
 */
function clear_expired_blocked_ips(): array
{
    $items = get_blocked_ips();
    $kept = [];
    $removed = 0;
    foreach ($items as $row) {
        if (blocked_ip_is_active($row)) {
            $kept[] = $row;
        } else {
            $removed++;
        }
    }
    if ($removed === 0) {
        return ['ok' => true, 'removed' => 0];
    }
    if (!save_blocked_ips($kept)) {
        return ['ok' => false, 'error' => 'Could not save blocked IPs.'];
    }
    return ['ok' => true, 'removed' => $removed];
}

/**
 * @return array{ok:bool,error?:string,row?:array}
 */
function update_blocked_ip(string $ip, array $patch): array
{
    $items = get_blocked_ips();
    $idx = blocked_ip_find($items, $ip);
    if ($idx === null) {
        return ['ok' => false, 'error' => 'IP not found.'];
    }
    $row = $items[$idx];
    if (array_key_exists('name', $patch)) {
        $row['name'] = (string) $patch['name'];
    }
    if (array_key_exists('note', $patch)) {
        $row['note'] = (string) $patch['note'];
    }
    if (array_key_exists('reason', $patch)) {
        $row['reason'] = (string) $patch['reason'];
    }
    $expiry = resolve_blocked_ip_expiry_opts($patch);
    if (empty($expiry['ok'])) {
        return ['ok' => false, 'error' => (string) ($expiry['error'] ?? 'Invalid expiration.')];
    }
    if (!empty($expiry['set'])) {
        $row['expiresAt'] = $expiry['expiresAt'] ?? null;
    }
    $row['updatedAt'] = date('c');
    $items[$idx] = $row;
    if (!save_blocked_ips($items)) {
        return ['ok' => false, 'error' => 'Could not save blocked IPs.'];
    }
    return ['ok' => true, 'row' => public_blocked_ip_view($row)];
}

/** @return array<string, list<int>> ip => unix timestamps */
function construction_rate_load(): array
{
    $decoded = construction_read_json(CONSTRUCTION_RATE_FILE, []);
    if (!is_array($decoded)) {
        return [];
    }
    $out = [];
    foreach ($decoded as $ip => $times) {
        if (!is_array($times)) {
            continue;
        }
        $out[(string) $ip] = array_values(array_map('intval', $times));
    }
    return $out;
}

function construction_rate_save(array $map): bool
{
    return construction_write_json(CONSTRUCTION_RATE_FILE, $map);
}

/**
 * Record a submission attempt. Auto-blocks when over limit.
 * @return array{ok:bool,blocked?:bool,error?:string,count?:int}
 */
function construction_rate_hit(string $ip): array
{
    $now = time();
    $windowStart = $now - CONSTRUCTION_RATE_WINDOW;
    $map = construction_rate_load();
    $times = $map[$ip] ?? [];
    $times = array_values(array_filter($times, static fn($t) => (int) $t >= $windowStart));
    $times[] = $now;
    $map[$ip] = $times;

    // Prune stale IPs.
    foreach ($map as $k => $list) {
        $kept = array_values(array_filter($list, static fn($t) => (int) $t >= $windowStart));
        if ($kept) {
            $map[$k] = $kept;
        } else {
            unset($map[$k]);
        }
    }
    construction_rate_save($map);

    $count = count($times);
    if ($count >= CONSTRUCTION_RATE_LIMIT) {
        block_ip($ip, [
            'source' => 'auto',
            'reason' => 'Auto-blocked: ' . CONSTRUCTION_RATE_LIMIT . '+ message attempts within 1 hour',
            'note' => 'Rate limit',
            'expiresIn' => CONSTRUCTION_AUTO_BLOCK_SECONDS,
        ]);
        return [
            'ok' => false,
            'blocked' => true,
            'count' => $count,
            'error' => 'Too many messages. Please try again later.',
        ];
    }
    return ['ok' => true, 'count' => $count];
}

/**
 * @param array{type?:string,source?:string,name?:string,email?:string,ip?:string} $opts
 * @return array{ok:bool,error?:string,message?:array}
 */
function add_inbox_message(string $message, array $opts = []): array
{
    $ip = (string) ($opts['ip'] ?? client_ip());
    $message = trim($message);
    $name = trim((string) ($opts['name'] ?? ''));
    $email = trim((string) ($opts['email'] ?? ''));
    $type = (string) ($opts['type'] ?? 'visitor');
    if ($type !== 'security' && $type !== 'visitor') {
        $type = 'visitor';
    }
    $source = trim((string) ($opts['source'] ?? ''));
    if ($source === '') {
        $source = $type === 'security' ? 'Security alert' : 'Construction form';
    }

    if ($message === '') {
        return ['ok' => false, 'error' => 'Please enter a message.'];
    }
    $len = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);
    $maxLen = $type === 'security' ? 4000 : 2000;
    if ($len > $maxLen) {
        return ['ok' => false, 'error' => 'Please keep your message under ' . $maxLen . ' characters.'];
    }
    $nameLen = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
    if ($nameLen > 80) {
        return ['ok' => false, 'error' => 'Name is too long.'];
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Please enter a valid email, or leave it blank.'];
    }

    $items = get_construction_messages();
    $row = [
        'id' => bin2hex(random_bytes(8)),
        'type' => $type,
        'source' => $source,
        'message' => $message,
        'name' => $name,
        'email' => $email === '' ? '' : strtolower($email),
        'ip' => $ip,
        'userAgent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 240),
        'createdAt' => date('c'),
    ];
    $items[] = $row;
    if (count($items) > 2000) {
        $items = array_slice($items, -2000);
    }
    if (!save_construction_messages($items)) {
        return ['ok' => false, 'error' => 'Could not save your message. Try again.'];
    }
    return ['ok' => true, 'message' => $row];
}

/**
 * @return array{ok:bool,error?:string,message?:array}
 */
function add_construction_message(string $message, string $name = '', string $email = '', ?string $ip = null): array
{
    return add_inbox_message($message, [
        'type' => 'visitor',
        'source' => 'Construction form',
        'name' => $name,
        'email' => $email,
        'ip' => $ip ?? client_ip(),
    ]);
}

function add_security_message(string $message, array $opts = []): array
{
    return add_inbox_message($message, array_merge([
        'type' => 'security',
        'source' => 'Security alert',
    ], $opts));
}

define('CONSTRUCTION_LOGIN_ATTEMPTS_FILE', DATA_DIR . '/construction_login_attempts.json');
define('CONSTRUCTION_LOGIN_MAX_ATTEMPTS', 10);

/** @return array<string,int> ip => failed attempt count */
function construction_login_attempts_load(): array
{
    $decoded = construction_read_json(CONSTRUCTION_LOGIN_ATTEMPTS_FILE, []);
    $out = [];
    foreach ($decoded as $ip => $count) {
        if (is_array($count) && isset($count['count'])) {
            $out[(string) $ip] = (int) $count['count'];
        } elseif (is_numeric($count)) {
            $out[(string) $ip] = (int) $count;
        }
    }
    return $out;
}

function construction_login_attempts_save(array $map): bool
{
    $payload = [];
    foreach ($map as $ip => $count) {
        $payload[(string) $ip] = [
            'count' => (int) $count,
            'updatedAt' => date('c'),
        ];
    }
    return construction_write_json(CONSTRUCTION_LOGIN_ATTEMPTS_FILE, $payload);
}

function construction_login_attempt_count(string $ip): int
{
    $map = construction_login_attempts_load();
    return (int) ($map[$ip] ?? 0);
}

function construction_login_clear_attempts(string $ip): void
{
    $map = construction_login_attempts_load();
    unset($map[$ip]);
    construction_login_attempts_save($map);
}

/**
 * Record a failed construction-gate login. At max attempts → block IP + security inbox.
 * @return array{ok:bool,blocked?:bool,remaining?:int,error?:string}
 */
function construction_login_fail(string $ip, string $username = ''): array
{
    $map = construction_login_attempts_load();
    $count = (int) ($map[$ip] ?? 0) + 1;
    $map[$ip] = $count;
    construction_login_attempts_save($map);

    log_activity('construction_login_failed', [
        'ip' => $ip,
        'username' => $username,
        'detail' => 'Attempt ' . $count . '/' . CONSTRUCTION_LOGIN_MAX_ATTEMPTS,
    ]);

    $remaining = max(0, CONSTRUCTION_LOGIN_MAX_ATTEMPTS - $count);

    if ($count >= CONSTRUCTION_LOGIN_MAX_ATTEMPTS) {
        block_ip($ip, [
            'source' => 'auto',
            'reason' => 'Auto-blocked: ' . CONSTRUCTION_LOGIN_MAX_ATTEMPTS . ' failed construction login attempts',
            'note' => 'Brute-force protection',
            'name' => 'Login lockout',
            'expiresIn' => CONSTRUCTION_AUTO_BLOCK_SECONDS,
        ]);
        add_security_message(
            'Blocked IP ' . $ip . ' after ' . CONSTRUCTION_LOGIN_MAX_ATTEMPTS .
            ' failed admin sign-in attempts on the construction gate' .
            ($username !== '' ? ' (last username tried: “' . $username . '”)' : '') . '.',
            [
                'ip' => $ip,
                'name' => 'System',
                'source' => 'Security · Login lockout',
            ]
        );
        log_activity('construction_login_lockout', [
            'ip' => $ip,
            'username' => $username,
            'detail' => 'IP blocked after max failed attempts',
        ]);
        return [
            'ok' => false,
            'blocked' => true,
            'remaining' => 0,
            'error' => 'Too many failed sign-in attempts. This network has been temporarily blocked.',
        ];
    }

    return [
        'ok' => false,
        'blocked' => false,
        'error' => 'Incorrect username or password.',
    ];
}

/** Whether a CMS constructionMode string means “on”. */
function construction_mode_flag_on(string $mode): bool
{
    $mode = strtolower(trim($mode));
    return in_array($mode, ['yes', 'on', '1', 'true'], true);
}

/**
 * Minimal public CMS payload while construction mode is on and preview is off.
 * Omits teams, events, merch, gallery, FAQs, and other pre-launch content.
 *
 * @return array{site:array,_constructionRestricted:bool}
 */
function construction_public_gate_payload(array $fullContent): array
{
    $site = is_array($fullContent['site'] ?? null) ? $fullContent['site'] : [];
    $holiday = strtolower(trim((string) ($site['holidayTheme'] ?? 'auto')));
    $holidayAllowed = [
        'auto' => true,
        'off' => true,
        'halloween' => true,
        'christmas' => true,
        'july4' => true,
        'valentines' => true,
        'newyear' => true,
        'stpatricks' => true,
    ];
    if (!isset($holidayAllowed[$holiday])) {
        $holiday = 'auto';
    }

    return [
        'site' => [
            'constructionMode' => 'yes',
            'constructionTitle' => (string) ($site['constructionTitle'] ?? "We'll be back soon"),
            'constructionBody' => (string) ($site['constructionBody'] ?? 'Auburn VSA’s website is temporarily unavailable while we make updates. Please check back soon — or leave us a message below.'),
            'orgName' => (string) ($site['orgName'] ?? 'Vietnamese Student Association'),
            'university' => (string) ($site['university'] ?? 'Auburn University'),
            // Keep seasonal chrome + button style in sync even when the rest of CMS is gated.
            'holidayTheme' => $holiday,
            'buttonEffect' => construction_safe_button_effect($site['buttonEffect'] ?? 'lift'),
        ],
        '_constructionRestricted' => true,
    ];
}

function construction_safe_button_effect($raw): string
{
    $raw = strtolower(trim((string) $raw));
    $allowed = [
        'flat' => true,
        'lift' => true,
        'shine' => true,
        'jelly' => true,
        'playful' => true,
        'pop' => true,
        'pulse' => true,
        'fill' => true,
        'neon' => true,
        'wiggle' => true,
    ];
    return isset($allowed[$raw]) ? $raw : 'lift';
}

function construction_preview_enabled(): bool
{
    if (!function_exists('is_logged_in') || !function_exists('current_user')) {
        return false;
    }
    if (!is_logged_in() || current_user() === null) {
        return false;
    }
    if (function_exists('start_session')) {
        start_session();
    }
    // Admin chose “return to construction screen” — keep CMS session but show the gate.
    if (!empty($_SESSION['vsa_construction_gate'])) {
        return false;
    }
    return true;
}

function construction_enter_preview(): void
{
    if (function_exists('start_session')) {
        start_session();
    }
    unset($_SESSION['vsa_construction_gate']);
    $_SESSION['vsa_construction_preview'] = true;
}

function construction_return_to_gate(): void
{
    if (function_exists('start_session')) {
        start_session();
    }
    $_SESSION['vsa_construction_gate'] = true;
    unset($_SESSION['vsa_construction_preview']);
}

