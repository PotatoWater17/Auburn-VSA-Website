<?php
// Server uptime / heartbeat — records when PHP last handled traffic and
// suspects downtime when a long gap appears between heartbeats.
// Not a substitute for an external monitor (UptimeRobot etc.), but shows
// "did the host go quiet recently?" on Admin → Dashboard.

require_once __DIR__ . '/config.php';

define('VSA_UPTIME_FILE', DATA_DIR . '/uptime.json');
/** How often to persist a heartbeat (seconds). Avoids writing on every page view. */
const VSA_UPTIME_WRITE_INTERVAL = 300; // 5 minutes
/** Gap larger than this between heartbeats → record a suspected outage. */
const VSA_UPTIME_GAP_SECONDS = 7200; // 2 hours
const VSA_UPTIME_MAX_OUTAGES = 40;

/**
 * @return array{
 *   version:int,
 *   firstSeen:int,
 *   lastSeen:int,
 *   hits:int,
 *   outages:list<array{from:int,to:int,gapSeconds:int}>
 * }
 */
function uptime_read(): array
{
    $empty = [
        'version' => 1,
        'firstSeen' => 0,
        'lastSeen' => 0,
        'hits' => 0,
        'outages' => [],
    ];
    if (!is_readable(VSA_UPTIME_FILE)) {
        return $empty;
    }
    $decoded = json_decode((string) file_get_contents(VSA_UPTIME_FILE), true);
    if (!is_array($decoded)) {
        return $empty;
    }
    $outages = [];
    if (is_array($decoded['outages'] ?? null)) {
        foreach ($decoded['outages'] as $row) {
            if (!is_array($row)) {
                continue;
            }
            $from = (int) ($row['from'] ?? 0);
            $to = (int) ($row['to'] ?? 0);
            if ($from <= 0 || $to <= $from) {
                continue;
            }
            $outages[] = [
                'from' => $from,
                'to' => $to,
                'gapSeconds' => (int) ($row['gapSeconds'] ?? ($to - $from)),
            ];
        }
    }
    return [
        'version' => 1,
        'firstSeen' => (int) ($decoded['firstSeen'] ?? 0),
        'lastSeen' => (int) ($decoded['lastSeen'] ?? 0),
        'hits' => (int) ($decoded['hits'] ?? 0),
        'outages' => $outages,
    ];
}

function uptime_write(array $state): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    if (count($state['outages']) > VSA_UPTIME_MAX_OUTAGES) {
        $state['outages'] = array_slice($state['outages'], -VSA_UPTIME_MAX_OUTAGES);
    }
    $json = json_encode(
        [
            'version' => 1,
            'firstSeen' => (int) ($state['firstSeen'] ?? 0),
            'lastSeen' => (int) ($state['lastSeen'] ?? 0),
            'hits' => (int) ($state['hits'] ?? 0),
            'outages' => array_values($state['outages'] ?? []),
        ],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    if ($json === false) {
        return false;
    }
    $ok = @file_put_contents(VSA_UPTIME_FILE, $json, LOCK_EX) !== false;
    if ($ok) {
        vsa_chmod_private(VSA_UPTIME_FILE);
    }
    return $ok;
}

/**
 * Record that the site handled a request. Throttled disk writes.
 * Call from public traffic paths (content API / health check).
 */
function uptime_heartbeat(bool $force = false): void
{
    static $done = false;
    if ($done && !$force) {
        return;
    }
    $done = true;

    $now = time();
    $state = uptime_read();
    $last = (int) ($state['lastSeen'] ?? 0);

    if (!$force && $last > 0 && ($now - $last) < VSA_UPTIME_WRITE_INTERVAL) {
        return;
    }

    if ($state['firstSeen'] <= 0) {
        $state['firstSeen'] = $now;
    }

    // Long silence while the process was down / unreachable → suspected outage.
    if ($last > 0 && ($now - $last) >= VSA_UPTIME_GAP_SECONDS) {
        $state['outages'][] = [
            'from' => $last,
            'to' => $now,
            'gapSeconds' => $now - $last,
        ];
    }

    $state['lastSeen'] = $now;
    $state['hits'] = (int) ($state['hits'] ?? 0) + 1;
    uptime_write($state);
}

/**
 * Snapshot for Admin → Dashboard.
 *
 * @return array{
 *   ok:bool,
 *   lastSeen:?string,
 *   lastSeenAgeSeconds:?int,
 *   firstSeen:?string,
 *   continuousSeconds:int,
 *   hits:int,
 *   gapThresholdSeconds:int,
 *   recentOutages:list<array{from:string,to:string,gapSeconds:int,label:string}>,
 *   status:string,
 *   statusLabel:string
 * }
 */
function uptime_status(): array
{
    $state = uptime_read();
    $now = time();
    $last = (int) ($state['lastSeen'] ?? 0);
    $first = (int) ($state['firstSeen'] ?? 0);
    $age = $last > 0 ? max(0, $now - $last) : null;

    // Find end of most recent outage to estimate continuous uptime stretch.
    $continuousFrom = $first > 0 ? $first : $now;
    if (!empty($state['outages'])) {
        $lastOutage = $state['outages'][count($state['outages']) - 1];
        $continuousFrom = max($continuousFrom, (int) ($lastOutage['to'] ?? 0));
    }
    $continuous = max(0, $now - $continuousFrom);

    $recent = [];
    $slice = array_slice($state['outages'], -8);
    $slice = array_reverse($slice);
    foreach ($slice as $row) {
        $gap = (int) ($row['gapSeconds'] ?? 0);
        $recent[] = [
            'from' => date('c', (int) $row['from']),
            'to' => date('c', (int) $row['to']),
            'gapSeconds' => $gap,
            'label' => uptime_human_duration($gap) . ' quiet',
        ];
    }

    // Fresh heartbeat while viewing admin: treat as online.
    $status = 'unknown';
    $statusLabel = 'No heartbeat yet — visit the public site once to start tracking.';
    if ($last > 0) {
        if ($age !== null && $age < VSA_UPTIME_WRITE_INTERVAL * 2) {
            $status = 'online';
            $statusLabel = 'Responding (last heartbeat ' . uptime_human_duration((int) $age) . ' ago)';
        } elseif ($age !== null && $age < VSA_UPTIME_GAP_SECONDS) {
            $status = 'quiet';
            $statusLabel = 'No recent public traffic (last heartbeat ' . uptime_human_duration((int) $age) . ' ago)';
        } else {
            $status = 'stale';
            $statusLabel = 'Long silence before this check — host may have been offline';
        }
    }

    return [
        'ok' => true,
        'lastSeen' => $last > 0 ? date('c', $last) : null,
        'lastSeenAgeSeconds' => $age,
        'firstSeen' => $first > 0 ? date('c', $first) : null,
        'continuousSeconds' => $continuous,
        'hits' => (int) ($state['hits'] ?? 0),
        'gapThresholdSeconds' => VSA_UPTIME_GAP_SECONDS,
        'recentOutages' => $recent,
        'status' => $status,
        'statusLabel' => $statusLabel,
    ];
}

function uptime_human_duration(int $seconds): string
{
    if ($seconds < 60) {
        return $seconds . 's';
    }
    if ($seconds < 3600) {
        $m = (int) round($seconds / 60);
        return $m . ' min';
    }
    if ($seconds < 86400) {
        $h = (int) floor($seconds / 3600);
        $m = (int) floor(($seconds % 3600) / 60);
        return $m > 0 ? $h . 'h ' . $m . 'm' : $h . 'h';
    }
    $d = (int) floor($seconds / 86400);
    $h = (int) floor(($seconds % 86400) / 3600);
    return $h > 0 ? $d . 'd ' . $h . 'h' : $d . 'd';
}
