<?php
// Shared security helpers: headers, login rate limits, URL validation.

require_once __DIR__ . '/config.php';

/**
 * Cloudflare edge IPv4 CIDRs (https://www.cloudflare.com/ips-v4/).
 * Refresh periodically if Cloudflare publishes new ranges.
 *
 * @return list<string>
 */
function cloudflare_ipv4_cidrs(): array
{
    return [
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/13',
        '104.24.0.0/14',
        '172.64.0.0/13',
        '131.0.72.0/22',
    ];
}

/**
 * Cloudflare edge IPv6 CIDRs (https://www.cloudflare.com/ips-v6/).
 *
 * @return list<string>
 */
function cloudflare_ipv6_cidrs(): array
{
    return [
        '2400:cb00::/32',
        '2606:4700::/32',
        '2803:f800::/32',
        '2405:b500::/32',
        '2405:8100::/32',
        '2a06:98c0::/29',
        '2c0f:f248::/32',
    ];
}

/** Whether $ip falls inside a CIDR (IPv4 or IPv6). */
function ip_in_cidr(string $ip, string $cidr): bool
{
    if (!str_contains($cidr, '/')) {
        return $ip === $cidr;
    }
    [$subnet, $bitsRaw] = explode('/', $cidr, 2);
    $bits = (int) $bitsRaw;
    $ipBin = @inet_pton($ip);
    $subnetBin = @inet_pton($subnet);
    if ($ipBin === false || $subnetBin === false || strlen($ipBin) !== strlen($subnetBin)) {
        return false;
    }
    $maxBits = strlen($ipBin) * 8;
    if ($bits < 0 || $bits > $maxBits) {
        return false;
    }
    $fullBytes = intdiv($bits, 8);
    $remBits = $bits % 8;
    if ($fullBytes > 0 && substr($ipBin, 0, $fullBytes) !== substr($subnetBin, 0, $fullBytes)) {
        return false;
    }
    if ($remBits === 0) {
        return true;
    }
    $mask = (~((1 << (8 - $remBits)) - 1)) & 0xFF;
    return (ord($ipBin[$fullBytes]) & $mask) === (ord($subnetBin[$fullBytes]) & $mask);
}

/** True when REMOTE_ADDR is a known Cloudflare edge address. */
function is_cloudflare_edge_ip(string $ip): bool
{
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return false;
    }
    $cidrs = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)
        ? cloudflare_ipv6_cidrs()
        : cloudflare_ipv4_cidrs();
    foreach ($cidrs as $cidr) {
        if (ip_in_cidr($ip, $cidr)) {
            return true;
        }
    }
    return false;
}

/** True for local loopback (cloudflared → Apache often shows ::1 / 127.0.0.1). */
function is_loopback_ip(string $ip): bool
{
    if ($ip === '::1' || $ip === '127.0.0.1') {
        return true;
    }
    if (str_starts_with($ip, '::ffff:127.')) {
        return true;
    }
    return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
        ? ip_in_cidr($ip, '127.0.0.0/8')
        : false;
}

/**
 * Trust Cloudflare request hints (CF-Connecting-IP / proto) only when the TCP
 * peer is a Cloudflare edge IP, or loopback (local cloudflared connector).
 * Never trust spoofable X-Forwarded-For from arbitrary internet peers.
 */
function trust_cloudflare_headers(string $remoteAddr): bool
{
    return is_cloudflare_edge_ip($remoteAddr) || is_loopback_ip($remoteAddr);
}

/**
 * Visitor IP for activity log, login rate limits, and blocked-IP checks.
 * Uses REMOTE_ADDR normally; trusts CF-Connecting-IP when the peer is a
 * Cloudflare edge IP or loopback (tunnel). Never bare X-Forwarded-For.
 */
function client_ip(): string
{
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if (trust_cloudflare_headers($remote)) {
        $cf = trim((string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
        if ($cf !== '' && str_contains($cf, ',')) {
            $cf = trim(explode(',', $cf, 2)[0]);
        }
        if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP)) {
            return $cf;
        }
    }
    if (filter_var($remote, FILTER_VALIDATE_IP)) {
        return $remote;
    }
    return '0.0.0.0';
}

/**
 * Whether this request arrived over HTTPS (direct or Cloudflare edge hint).
 * Trusts X-Forwarded-Proto / CF-Visitor when REMOTE_ADDR is a Cloudflare edge
 * IP or loopback (local tunnel) — never from arbitrary internet peers.
 */
function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    if (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443') {
        return true;
    }
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if (!trust_cloudflare_headers($remote)) {
        return false;
    }
    $fwd = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    if ($fwd !== '' && explode(',', $fwd)[0] === 'https') {
        return true;
    }
    $cfVisitor = (string) ($_SERVER['HTTP_CF_VISITOR'] ?? '');
    if ($cfVisitor !== '' && str_contains($cfVisitor, '"scheme":"https"')) {
        return true;
    }
    return false;
}

/** Send baseline security headers (safe for HTML + JSON APIs). */
function send_security_headers(bool $jsonApi = false): void
{
    if (headers_sent()) {
        return;
    }
    block_unsafe_http_methods();
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('X-Permitted-Cross-Domain-Policies: none');
    if ($jsonApi) {
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('X-Robots-Tag: noindex, nofollow');
        header('Cross-Origin-Resource-Policy: same-site');
    } else {
        // Static site + CMS; inline boot scripts remain; external fonts + media embeds allowed.
        header(
            "Content-Security-Policy: default-src 'self'; "
            . "script-src 'self' 'unsafe-inline'; "
            . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            . "font-src 'self' https://fonts.gstatic.com data:; "
            . "img-src 'self' data: https: blob:; "
            . "media-src 'self' https: blob:; "
            . "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com "
            . "https://player.vimeo.com https://calendar.google.com https://www.google.com; "
            . "connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'"
        );
    }
    if (is_https_request()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

/** Reject TRACE/TRACK and other non-application verbs early. */
function block_unsafe_http_methods(): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['TRACE', 'TRACK', 'CONNECT'], true)) {
        return;
    }
    if (!headers_sent()) {
        http_response_code(405);
        header('Allow: GET, POST, HEAD, OPTIONS');
        header('Content-Type: text/plain; charset=utf-8');
    }
    echo 'Method Not Allowed';
    exit;
}

/** Host part of the current request (no port). */
function request_host(): string
{
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? '')));
    if ($host === '') {
        return '';
    }
    if (str_contains($host, ':')) {
        $host = explode(':', $host, 2)[0];
    }
    return $host;
}

/** True when Origin or Referer matches this site's host (blocks cross-site POST abuse). */
function is_same_origin_request(): bool
{
    $host = request_host();
    if ($host === '') {
        return false;
    }
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        $parsed = parse_url($origin);
        if (!is_array($parsed) || empty($parsed['host'])) {
            return false;
        }
        $scheme = strtolower((string) ($parsed['scheme'] ?? ''));
        if ($scheme !== 'http' && $scheme !== 'https') {
            return false;
        }
        return strtolower((string) $parsed['host']) === $host;
    }
    $referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
    if ($referer === '') {
        return false;
    }
    $parsed = parse_url($referer);
    if (!is_array($parsed) || empty($parsed['host'])) {
        return false;
    }
    return strtolower((string) $parsed['host']) === $host;
}

/**
 * Block cross-origin write requests (CSRF belt-and-suspenders for cookie-less public forms
 * and session-cookie admin APIs). Skips GET/HEAD/OPTIONS.
 */
function require_same_origin_write(): void
{
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }
    if (is_same_origin_request()) {
        return;
    }
    if (!headers_sent()) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }
    echo json_encode(['ok' => false, 'error' => 'Cross-origin request blocked.']);
    exit;
}

/**
 * Normalize a URL candidate before safety checks (decode, strip controls).
 */
function normalize_public_url_candidate(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    // Decode percent-encoding once so javascript%3A / java%09script: cannot slip through.
    $decoded = rawurldecode($url);
    if (is_string($decoded) && $decoded !== '') {
        $url = $decoded;
    }
    // Strip C0 controls + DEL (and common whitespace tricks inside the scheme).
    $url = preg_replace('/[\x00-\x1F\x7F]+/', '', $url) ?? '';
    return trim($url);
}

/**
 * Whether a stored URL is safe to put in href on the public site.
 */
function is_safe_public_url(string $url): bool
{
    $url = normalize_public_url_candidate($url);
    if ($url === '' || $url === '#') {
        return true;
    }
    // Relative site paths / anchors / query-only (never allow path traversal)
    if (preg_match('~^(?:[./?]|\#|[A-Za-z0-9][A-Za-z0-9._/-]*\.html?)~', $url)) {
        return !str_contains($url, '..');
    }
    $schemeProbe = strtolower(preg_replace('/\s+/', '', $url) ?? $url);
    if (
        str_starts_with($schemeProbe, 'javascript:')
        || str_starts_with($schemeProbe, 'data:')
        || str_starts_with($schemeProbe, 'vbscript:')
        || str_starts_with($schemeProbe, 'file:')
    ) {
        return false;
    }
    if (preg_match('#^(https?:|mailto:|tel:)#i', $url)) {
        if (preg_match('#^mailto:#i', $url) === 1) {
            $addr = substr($url, 7);
            return $addr !== ''
                && !preg_match('/[\r\n<>\"]/', $addr)
                && filter_var($addr, FILTER_VALIDATE_EMAIL) !== false;
        }
        if (preg_match('#^tel:#i', $url) === 1) {
            $num = substr($url, 4);
            return $num !== '' && (bool) preg_match('/^[0-9+()\-\s.ext]{3,40}$/i', $num);
        }
        return filter_var($url, FILTER_VALIDATE_URL) !== false
            && preg_match('#^https?://#i', $url) === 1;
    }
    // Allow simple relative filenames / uploads paths without scheme
    if (!preg_match('#^[a-z][a-z0-9+.-]*:#i', $url)) {
        return !str_contains($url, '..');
    }
    return false;
}

/**
 * Whether a CMS media path/URL is safe for img/src, video, favicon (no javascript:/data:).
 */
function is_safe_media_url(string $url): bool
{
    $url = normalize_public_url_candidate($url);
    if ($url === '') {
        return true;
    }
    if (preg_match('#^uploads/[A-Za-z0-9._/-]+$#', $url)) {
        return !str_contains($url, '..');
    }
    if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
        return !str_contains($url, '..');
    }
    return is_safe_public_url($url)
        && (bool) preg_match('#^https?://#i', $url);
}

/**
 * Recursively blank unsafe href/link/url/src-like string fields in CMS payloads.
 *
 * @param mixed $value
 * @return mixed
 */
function sanitize_cms_urls($value)
{
    static $urlKeys = [
        'href' => true,
        'link' => true,
        'url' => true,
        'join' => true,
        'learnMore' => true,
        'purchaseTickets' => true,
        'logo' => true,
        'image' => true,
        'poster' => true,
        'src' => true,
        'video' => true,
        'videoUrl' => true,
        'videoImage' => true,
        'heroImage' => true,
    ];
    static $mediaKeys = [
        'logo' => true,
        'image' => true,
        'poster' => true,
        'src' => true,
        'video' => true,
        'videoUrl' => true,
        'videoImage' => true,
        'heroImage' => true,
    ];
    if (is_array($value)) {
        $out = [];
        foreach ($value as $k => $v) {
            if (is_string($k) && isset($urlKeys[$k]) && is_string($v)) {
                $trim = trim($v);
                if ($trim === '') {
                    $out[$k] = '';
                } elseif (isset($mediaKeys[$k])) {
                    $out[$k] = is_safe_media_url($trim) ? $trim : '';
                } else {
                    $out[$k] = is_safe_public_url($trim) ? $trim : '';
                }
            } elseif (is_int($k) && is_string($v)) {
                // Gallery / slideshow lists sometimes store bare media paths as strings.
                $trim = trim($v);
                if ($trim !== '' && preg_match('#^(uploads/|https?://|/|javascript:|data:|vbscript:)#i', $trim)) {
                    $out[$k] = is_safe_media_url($trim) ? $trim : '';
                } else {
                    $out[$k] = $v;
                }
            } else {
                $out[$k] = sanitize_cms_urls($v);
            }
        }
        return $out;
    }
    return $value;
}

define('ADMIN_LOGIN_ATTEMPTS_FILE', DATA_DIR . '/admin_login_attempts.json');
define('ADMIN_LOGIN_MAX_ATTEMPTS', 10);
define('ADMIN_LOGIN_WINDOW', 3600);

/** Human-readable remaining lockout / wait time for login UI. */
function admin_login_human_duration(int $seconds): string
{
    if ($seconds <= 0) {
        return 'a short while';
    }
    if ($seconds >= 86400) {
        $days = (int) round($seconds / 86400);
        if ($days < 1) {
            $days = 1;
        }
        return 'about ' . $days . ' day' . ($days === 1 ? '' : 's');
    }
    if ($seconds >= 3600) {
        $hours = (int) round($seconds / 3600);
        if ($hours < 1) {
            $hours = 1;
        }
        return 'about ' . $hours . ' hour' . ($hours === 1 ? '' : 's');
    }
    if ($seconds >= 60) {
        $mins = max(1, (int) round($seconds / 60));
        return 'about ' . $mins . ' minute' . ($mins === 1 ? '' : 's');
    }
    return 'about a minute';
}

/**
 * Lockout copy for blocked / rate-limited IPs (includes rough wait when known).
 */
function admin_login_lockout_message(string $ip): string
{
    $base = 'Too many failed sign-in attempts. This IP has been temporarily blocked.';

    if (function_exists('get_blocked_ips') && function_exists('blocked_ip_is_active') && function_exists('public_blocked_ip_view')) {
        foreach (get_blocked_ips() as $row) {
            if (($row['ip'] ?? '') !== $ip) {
                continue;
            }
            if (!blocked_ip_is_active($row)) {
                continue;
            }
            $view = public_blocked_ip_view($row);
            $remaining = $view['remainingSeconds'] ?? null;
            if ($remaining !== null && (int) $remaining > 0) {
                return $base . ' Try again in ' . admin_login_human_duration((int) $remaining) . '.';
            }
            if (($view['expiresAt'] ?? null) === null) {
                return 'Too many failed sign-in attempts. This IP is blocked. Contact an administrator if you need access.';
            }
        }
    }

    $state = admin_login_attempt_state($ip);
    if ($state['count'] >= ADMIN_LOGIN_MAX_ATTEMPTS) {
        $left = max(0, ADMIN_LOGIN_WINDOW - (time() - (int) $state['first']));
        if ($left > 0) {
            return $base . ' Try again in ' . admin_login_human_duration($left) . '.';
        }
    }

    $secs = defined('CONSTRUCTION_AUTO_BLOCK_SECONDS') ? (int) CONSTRUCTION_AUTO_BLOCK_SECONDS : 86400;
    return $base . ' Try again in ' . admin_login_human_duration($secs) . '.';
}

function security_read_json(string $file, $fallback = [])
{
    if (!is_readable($file)) {
        return $fallback;
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $fallback;
}

function security_write_json(string $file, $data): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $tmp = $file . '.tmp.' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    // Atomic-ish replace that works on Windows (rename over existing often fails).
    if (is_file($file)) {
        $bak = $file . '.bak.' . bin2hex(random_bytes(3));
        if (!@rename($file, $bak)) {
            // Fall back to direct overwrite.
            $ok = @file_put_contents($file, $json, LOCK_EX) !== false;
            @unlink($tmp);
            return $ok;
        }
        if (!@rename($tmp, $file)) {
            @rename($bak, $file); // restore
            @unlink($tmp);
            return false;
        }
        @unlink($bak);
    } elseif (!@rename($tmp, $file)) {
        $ok = @copy($tmp, $file);
        @unlink($tmp);
        if (!$ok) {
            return false;
        }
    }
    vsa_chmod_private($file);
    clearstatcache(true, $file);
    return is_file($file) && is_readable($file);
}

/** @return array{count:int,first:int} */
function admin_login_attempt_state(string $ip): array
{
    $map = security_read_json(ADMIN_LOGIN_ATTEMPTS_FILE, []);
    $row = $map[$ip] ?? null;
    if (!is_array($row)) {
        return ['count' => 0, 'first' => time()];
    }
    $first = (int) ($row['first'] ?? time());
    $count = (int) ($row['count'] ?? 0);
    if ((time() - $first) > ADMIN_LOGIN_WINDOW) {
        return ['count' => 0, 'first' => time()];
    }
    return ['count' => $count, 'first' => $first];
}

function admin_login_clear_attempts(string $ip): void
{
    $map = security_read_json(ADMIN_LOGIN_ATTEMPTS_FILE, []);
    unset($map[$ip]);
    security_write_json(ADMIN_LOGIN_ATTEMPTS_FILE, $map);
}

/**
 * Record a failed privileged login. Auto-blocks IP at max attempts when construction helpers exist.
 * @return array{ok:bool,blocked:bool,count:int,maxAttempts:int,remaining:int,error:string}
 */
function admin_login_fail(string $ip, string $context = 'admin', string $username = ''): array
{
    $state = admin_login_attempt_state($ip);
    $count = $state['count'] + 1;
    $max = ADMIN_LOGIN_MAX_ATTEMPTS;
    $map = security_read_json(ADMIN_LOGIN_ATTEMPTS_FILE, []);
    $map[$ip] = [
        'count' => $count,
        'first' => $state['first'],
        'updatedAt' => date('c'),
        'context' => $context,
    ];
    security_write_json(ADMIN_LOGIN_ATTEMPTS_FILE, $map);

    if (function_exists('log_activity')) {
        log_activity($context . '_login_failed', [
            'ip' => $ip,
            'username' => $username,
            'detail' => 'Attempt ' . $count . '/' . $max,
        ]);
    }

    if ($count >= $max) {
        $blockSecs = defined('CONSTRUCTION_AUTO_BLOCK_SECONDS') ? (int) CONSTRUCTION_AUTO_BLOCK_SECONDS : 86400;
        if (function_exists('block_ip')) {
            block_ip($ip, [
                'source' => 'auto',
                'reason' => 'Auto-blocked: ' . $max . ' failed ' . $context . ' login attempts',
                'note' => 'Brute-force protection',
                'name' => 'Login lockout',
                'expiresIn' => $blockSecs,
            ]);
        }
        if (function_exists('add_security_message')) {
            add_security_message(
                'Blocked IP ' . $ip . ' after ' . $max .
                ' failed ' . $context . ' sign-in attempts' .
                ($username !== '' ? ' (last username: “' . $username . '”)' : '') . '.',
                [
                    'ip' => $ip,
                    'name' => 'System',
                    'source' => 'Security · ' . ucfirst($context) . ' lockout',
                ]
            );
        }
        return [
            'ok' => false,
            'blocked' => true,
            'count' => $count,
            'maxAttempts' => $max,
            'remaining' => 0,
            'error' => admin_login_lockout_message($ip),
        ];
    }

    $remaining = max(0, $max - $count);
    return [
        'ok' => false,
        'blocked' => false,
        'count' => $count,
        'maxAttempts' => $max,
        'remaining' => $remaining,
        'error' => 'Incorrect username or password. Attempt ' . $count . ' of ' . $max .
            '. After ' . $max . ' failed attempts this IP may be temporarily blocked.',
    ];
}

function admin_login_is_locked(string $ip): bool
{
    return admin_login_attempt_state($ip)['count'] >= ADMIN_LOGIN_MAX_ATTEMPTS;
}

define('PUBLIC_API_RATE_FILE', DATA_DIR . '/public_api_rate.json');
define('PUBLIC_API_RATE_LIMIT', 30);
define('PUBLIC_API_RATE_WINDOW', 3600);
/** Public /unsubscribe email+token attempts per IP. */
define('NEWSLETTER_UNSUB_RATE_LIMIT', 5);
define('NEWSLETTER_UNSUB_RATE_WINDOW', 12 * 3600);

/**
 * Soft per-IP rate limit for public POST APIs (newsletter, FAQ ask, etc.).
 * @return array{ok:bool,error?:string,retryAfter?:int}
 */
function public_api_rate_check(string $bucket, string $ip = '', ?int $limit = null, ?int $window = null): array
{
    if ($ip === '' && function_exists('client_ip')) {
        $ip = client_ip();
    }
    if ($ip === '') {
        $ip = 'unknown';
    }
    $limit = $limit ?? PUBLIC_API_RATE_LIMIT;
    $window = $window ?? PUBLIC_API_RATE_WINDOW;
    $now = time();
    $map = security_read_json(PUBLIC_API_RATE_FILE, []);
    $key = $bucket . '|' . $ip;
    $row = is_array($map[$key] ?? null) ? $map[$key] : ['count' => 0, 'first' => $now];
    $first = (int) ($row['first'] ?? $now);
    $count = (int) ($row['count'] ?? 0);
    if (($now - $first) > $window) {
        $first = $now;
        $count = 0;
    }
    $count++;
    $map[$key] = ['count' => $count, 'first' => $first, 'updatedAt' => date('c')];
    // Prune stale keys occasionally
    if (count($map) > 500) {
        foreach ($map as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['first'] ?? 0)) > max($window, PUBLIC_API_RATE_WINDOW)) {
                unset($map[$k]);
            }
        }
    }
    security_write_json(PUBLIC_API_RATE_FILE, $map);
    if ($count > $limit) {
        $retryAfter = max(1, $window - ($now - $first));
        return [
            'ok' => false,
            'retryAfter' => $retryAfter,
            'error' => 'Too many requests from this network. Please try again later.',
        ];
    }
    return ['ok' => true];
}

/** Clear a public API rate bucket for one IP (e.g. after admin unblock). */
function public_api_rate_clear(string $bucket, string $ip = ''): void
{
    if ($ip === '' && function_exists('client_ip')) {
        $ip = client_ip();
    }
    $ip = trim($ip);
    if ($ip === '' || $bucket === '') {
        return;
    }
    $map = security_read_json(PUBLIC_API_RATE_FILE, []);
    $key = $bucket . '|' . $ip;
    if (!isset($map[$key])) {
        return;
    }
    unset($map[$key]);
    security_write_json(PUBLIC_API_RATE_FILE, $map);
}
