<?php
// FAQ question inbox — public submissions awaiting admin review/publish.

require_once __DIR__ . '/config.php';

function faq_inbox_file(): string
{
    return DATA_DIR . '/faq_inbox.json';
}

function get_faq_inbox(): array
{
    $file = faq_inbox_file();
    if (!is_file($file)) {
        return [];
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    return is_array($decoded) ? array_values($decoded) : [];
}

function save_faq_inbox(array $items): bool
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0775, true);
    }
    $json = json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return file_put_contents(faq_inbox_file(), $json, LOCK_EX) !== false;
}

function faq_inbox_find(array $items, string $id): ?int
{
    foreach ($items as $i => $item) {
        if (($item['id'] ?? '') === $id) {
            return (int) $i;
        }
    }
    return null;
}
