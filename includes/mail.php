<?php
/**
 * Admin Mail MVP — shared club mailboxes (info@, sale@).
 * Inbound-only via Cloudflare Worker → api/mail-inbound.php.
 * Outreach replies: club Gmail (vsaauburn@gmail.com), not Admin send.
 */
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';

function mail_domain(): string
{
    $env = getenv('MAIL_DOMAIN');
    if (is_string($env) && preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/i', $env)) {
        return strtolower($env);
    }
    return 'auburnvsa.com';
}

/** @return array<string, array{id:string,label:string,address:string}> */
function mail_mailbox_catalog(): array
{
    $domain = mail_domain();
    return [
        'info' => [
            'id' => 'info',
            'label' => 'Info',
            'address' => 'info@' . $domain,
        ],
        'sale' => [
            'id' => 'sale',
            'label' => 'Sale',
            'address' => 'sale@' . $domain,
        ],
    ];
}

function mail_dir(): string
{
    $dir = DATA_DIR . '/mail';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir;
}

function mail_mailbox_file(string $mailboxId): string
{
    return mail_dir() . '/' . $mailboxId . '.json';
}

function mail_is_valid_mailbox(string $mailboxId): bool
{
    return isset(mail_mailbox_catalog()[$mailboxId]);
}

/** @return list<string> */
function mail_folders(): array
{
    return ['inbox', 'archive', 'trash'];
}

function mail_is_valid_folder(string $folder): bool
{
    return in_array($folder, mail_folders(), true);
}

/**
 * Mailboxes this user may open. Root → all. Others → user.mailboxes ∩ catalog
 * (empty mailboxes + mail permission → none until assigned).
 *
 * @return list<string>
 */
function mail_user_mailbox_ids(?array $user): array
{
    if (!$user || empty($user['active'])) {
        return [];
    }
    $catalog = array_keys(mail_mailbox_catalog());
    if (function_exists('user_is_root') && user_is_root($user)) {
        return $catalog;
    }
    if (!function_exists('user_can') || !user_can($user, 'mail')) {
        return [];
    }
    $raw = $user['mailboxes'] ?? [];
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $id) {
        $id = strtolower(trim((string) $id));
        if (in_array($id, $catalog, true)) {
            $out[] = $id;
        }
    }
    return array_values(array_unique($out));
}

function mail_user_can_mailbox(?array $user, string $mailboxId): bool
{
    return in_array($mailboxId, mail_user_mailbox_ids($user), true);
}

/** @return list<string> */
function mail_normalize_mailbox_ids(array $ids): array
{
    $catalog = array_keys(mail_mailbox_catalog());
    $out = [];
    foreach ($ids as $id) {
        $id = strtolower(trim((string) $id));
        if (in_array($id, $catalog, true)) {
            $out[] = $id;
        }
    }
    return array_values(array_unique($out));
}

/**
 * @return array{messages:list<array>}
 */
function mail_load_mailbox(string $mailboxId): array
{
    if (!mail_is_valid_mailbox($mailboxId)) {
        return ['messages' => []];
    }
    $file = mail_mailbox_file($mailboxId);
    if (!is_readable($file)) {
        return ['messages' => []];
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    if (!is_array($decoded)) {
        return ['messages' => []];
    }
    $messages = $decoded['messages'] ?? [];
    if (!is_array($messages)) {
        $messages = [];
    }
    $clean = [];
    foreach ($messages as $m) {
        if (is_array($m) && trim((string) ($m['id'] ?? '')) !== '') {
            $clean[] = $m;
        }
    }
    return ['messages' => $clean];
}

function mail_save_mailbox(string $mailboxId, array $data): bool
{
    if (!mail_is_valid_mailbox($mailboxId)) {
        return false;
    }
    $messages = $data['messages'] ?? [];
    if (!is_array($messages)) {
        $messages = [];
    }
    // Cap growth — keep newest 500.
    usort($messages, static function ($a, $b) {
        return strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? ''));
    });
    if (count($messages) > 500) {
        $messages = array_slice($messages, 0, 500);
    }
    return security_write_json(mail_mailbox_file($mailboxId), ['messages' => array_values($messages)]);
}

function mail_new_id(): string
{
    try {
        return bin2hex(random_bytes(8));
    } catch (Throwable $e) {
        return uniqid('m', true);
    }
}

/** @return list<string> */
function mail_parse_address_list(string $raw): array
{
    $parts = preg_split('/[,;]+/', $raw) ?: [];
    $out = [];
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '') {
            continue;
        }
        if (preg_match('/<([^>]+)>/', $p, $m)) {
            $p = trim($m[1]);
        }
        $p = strtolower($p);
        if (filter_var($p, FILTER_VALIDATE_EMAIL)) {
            $out[] = $p;
        }
    }
    return array_values(array_unique($out));
}

function mail_inbound_secret(): string
{
    $env = getenv('MAIL_INBOUND_SECRET');
    if (is_string($env) && strlen($env) >= 16) {
        return $env;
    }
    $file = DATA_DIR . '/.mail_inbound_secret';
    if (is_readable($file)) {
        $s = trim((string) file_get_contents($file));
        if (strlen($s) >= 16) {
            return $s;
        }
    }
    return '';
}

function mail_ensure_inbound_secret(): string
{
    $existing = mail_inbound_secret();
    if ($existing !== '') {
        return $existing;
    }
    try {
        $secret = bin2hex(random_bytes(24));
    } catch (Throwable $e) {
        $secret = hash('sha256', uniqid('mail', true));
    }
    @file_put_contents(DATA_DIR . '/.mail_inbound_secret', $secret . "\n", LOCK_EX);
    vsa_chmod_private(DATA_DIR . '/.mail_inbound_secret');
    return $secret;
}

/**
 * @return array{ok:bool,mode:string,domain:string,inboundReady:bool}
 */
function mail_status(): array
{
    return [
        'ok' => true,
        'mode' => 'receive-only',
        'domain' => mail_domain(),
        'inboundReady' => mail_inbound_secret() !== '',
    ];
}

/**
 * Unread inbox messages across mailboxes the user can open.
 */
function mail_unread_count_for_user(?array $user): int
{
    $total = 0;
    foreach (mail_user_mailbox_ids($user) as $mailboxId) {
        $store = mail_load_mailbox($mailboxId);
        foreach ($store['messages'] as $m) {
            if (($m['folder'] ?? 'inbox') !== 'inbox') {
                continue;
            }
            if (empty($m['read'])) {
                $total++;
            }
        }
    }
    return $total;
}

/**
 * Store an inbound (or local) message.
 *
 * @param array{
 *   mailbox:string,folder?:string,from:string,to?:list<string>|string,cc?:list<string>|string,
 *   subject?:string,text?:string,html?:string,date?:string,inReplyTo?:string,references?:string,
 *   messageId?:string,read?:bool
 * } $input
 * @return array{ok:bool,error?:string,message?:array}
 */
function mail_store_message(array $input): array
{
    $mailbox = strtolower(trim((string) ($input['mailbox'] ?? '')));
    if (!mail_is_valid_mailbox($mailbox)) {
        return ['ok' => false, 'error' => 'Unknown mailbox.'];
    }
    $folder = strtolower(trim((string) ($input['folder'] ?? 'inbox')));
    if (!mail_is_valid_folder($folder) || $folder === 'trash') {
        $folder = 'inbox';
    }
    $from = trim((string) ($input['from'] ?? ''));
    if ($from === '') {
        return ['ok' => false, 'error' => 'Missing From.'];
    }
    $to = $input['to'] ?? [];
    if (is_string($to)) {
        $to = mail_parse_address_list($to);
    } elseif (is_array($to)) {
        $to = mail_parse_address_list(implode(',', array_map('strval', $to)));
    } else {
        $to = [];
    }
    $cc = $input['cc'] ?? [];
    if (is_string($cc)) {
        $cc = mail_parse_address_list($cc);
    } elseif (is_array($cc)) {
        $cc = mail_parse_address_list(implode(',', array_map('strval', $cc)));
    } else {
        $cc = [];
    }
    $subject = trim((string) ($input['subject'] ?? ''));
    $text = (string) ($input['text'] ?? '');
    $html = (string) ($input['html'] ?? '');
    if ($text === '' && $html !== '') {
        $text = trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
    $date = trim((string) ($input['date'] ?? ''));
    if ($date === '' || strtotime($date) === false) {
        $date = date('c');
    } else {
        $date = date('c', (int) strtotime($date));
    }

    $msg = [
        'id' => mail_new_id(),
        'mailbox' => $mailbox,
        'folder' => $folder,
        'from' => $from,
        'to' => $to,
        'cc' => $cc,
        'subject' => $subject !== '' ? $subject : '(no subject)',
        'text' => mb_substr($text, 0, 200000),
        'html' => '', // store text only in MVP (avoid XSS from raw HTML in admin)
        'date' => $date,
        'inReplyTo' => trim((string) ($input['inReplyTo'] ?? '')),
        'references' => trim((string) ($input['references'] ?? '')),
        'messageId' => trim((string) ($input['messageId'] ?? '')),
        'read' => !empty($input['read']),
    ];

    // Dedupe by provider message-id when present.
    $store = mail_load_mailbox($mailbox);
    if ($msg['messageId'] !== '') {
        foreach ($store['messages'] as $existing) {
            if (($existing['messageId'] ?? '') === $msg['messageId'] && ($existing['folder'] ?? '') === $folder) {
                return ['ok' => true, 'message' => $existing, 'duplicate' => true];
            }
        }
    }
    array_unshift($store['messages'], $msg);
    if (!mail_save_mailbox($mailbox, $store)) {
        return ['ok' => false, 'error' => 'Could not save message.'];
    }
    return ['ok' => true, 'message' => $msg];
}

function mail_find_message(string $mailboxId, string $id): ?array
{
    $store = mail_load_mailbox($mailboxId);
    foreach ($store['messages'] as $m) {
        if (($m['id'] ?? '') === $id) {
            return $m;
        }
    }
    return null;
}

/**
 * @return array{ok:bool,error?:string,message?:array}
 */
function mail_patch_message(string $mailboxId, string $id, array $patch): array
{
    $store = mail_load_mailbox($mailboxId);
    $found = null;
    foreach ($store['messages'] as $i => $m) {
        if (($m['id'] ?? '') !== $id) {
            continue;
        }
        if (array_key_exists('read', $patch)) {
            $m['read'] = (bool) $patch['read'];
        }
        if (array_key_exists('folder', $patch)) {
            $folder = strtolower(trim((string) $patch['folder']));
            if (mail_is_valid_folder($folder)) {
                $m['folder'] = $folder;
            }
        }
        if (array_key_exists('prevFolder', $patch)) {
            $prevRaw = $patch['prevFolder'];
            if ($prevRaw === null || $prevRaw === '') {
                unset($m['prevFolder']);
            } else {
                $prev = strtolower(trim((string) $prevRaw));
                if (in_array($prev, ['inbox', 'archive'], true)) {
                    $m['prevFolder'] = $prev;
                }
            }
        }
        if (array_key_exists('deletedAt', $patch)) {
            $deletedAt = $patch['deletedAt'];
            if ($deletedAt === null || $deletedAt === '') {
                unset($m['deletedAt']);
            } else {
                $m['deletedAt'] = (string) $deletedAt;
            }
        }
        $store['messages'][$i] = $m;
        $found = $m;
        break;
    }
    if ($found === null) {
        return ['ok' => false, 'error' => 'Message not found.'];
    }
    if (!mail_save_mailbox($mailboxId, $store)) {
        return ['ok' => false, 'error' => 'Could not update message.'];
    }
    return ['ok' => true, 'message' => $found];
}

/**
 * Soft-delete: move to Trash, remember previous folder for restore.
 *
 * @return array{ok:bool,error?:string,message?:array}
 */
function mail_soft_delete(string $mailboxId, string $id): array
{
    $msg = mail_find_message($mailboxId, $id);
    if ($msg === null) {
        return ['ok' => false, 'error' => 'Message not found.'];
    }
    $cur = strtolower(trim((string) ($msg['folder'] ?? 'inbox')));
    if ($cur === 'trash') {
        return ['ok' => true, 'message' => $msg];
    }
    $prev = in_array($cur, ['inbox', 'archive'], true) ? $cur : 'inbox';
    return mail_patch_message($mailboxId, $id, [
        'folder' => 'trash',
        'prevFolder' => $prev,
        'deletedAt' => date('c'),
    ]);
}

/**
 * Restore soft-deleted message to prevFolder (inbox/archive).
 *
 * @return array{ok:bool,error?:string,message?:array}
 */
function mail_restore_message(string $mailboxId, string $id): array
{
    $msg = mail_find_message($mailboxId, $id);
    if ($msg === null) {
        return ['ok' => false, 'error' => 'Message not found.'];
    }
    $prev = strtolower(trim((string) ($msg['prevFolder'] ?? 'inbox')));
    if (!in_array($prev, ['inbox', 'archive'], true)) {
        $prev = 'inbox';
    }
    return mail_patch_message($mailboxId, $id, [
        'folder' => $prev,
        'prevFolder' => '',
        'deletedAt' => null,
    ]);
}

/**
 * Move inbox ↔ archive (not from trash).
 *
 * @return array{ok:bool,error?:string,message?:array}
 */
function mail_set_folder(string $mailboxId, string $id, string $folder): array
{
    $folder = strtolower(trim($folder));
    if (!in_array($folder, ['inbox', 'archive'], true)) {
        return ['ok' => false, 'error' => 'Invalid folder.'];
    }
    $msg = mail_find_message($mailboxId, $id);
    if ($msg === null) {
        return ['ok' => false, 'error' => 'Message not found.'];
    }
    if (($msg['folder'] ?? '') === 'trash') {
        return ['ok' => false, 'error' => 'Restore from Trash first.'];
    }
    return mail_patch_message($mailboxId, $id, [
        'folder' => $folder,
        'prevFolder' => '',
        'deletedAt' => null,
    ]);
}

function mail_resolve_mailbox_from_recipient(string $toAddress): ?string
{
    $toAddress = strtolower(trim($toAddress));
    foreach (mail_mailbox_catalog() as $id => $box) {
        if ($box['address'] === $toAddress) {
            return $id;
        }
        // plus-addressing: info+tag@domain
        $local = explode('@', $box['address'], 2)[0] ?? '';
        $domain = explode('@', $box['address'], 2)[1] ?? '';
        if ($local !== '' && $domain !== '' && preg_match('/^' . preg_quote($local, '/') . '\+.+@' . preg_quote($domain, '/') . '$/', $toAddress)) {
            return $id;
        }
    }
    return null;
}
