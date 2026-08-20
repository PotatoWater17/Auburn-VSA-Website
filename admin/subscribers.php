<?php
// Admin newsletter subscriber list / CSV export / remove.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/newsletter_list.php';

require_permission_api('subscribers');

$file = NEWSLETTER_LIST_FILE;

function load_newsletter_raw(string $file): array
{
    return newsletter_list_load_raw();
}

function normalize_newsletter_emails(array $list): array
{
    // Backfill missing tokens so CSV / admin links always work.
    $ensured = newsletter_list_ensure_tokens();
    $emails = [];
    foreach ($ensured as $row) {
        $email = strtolower(trim((string) ($row['email'] ?? '')));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            continue;
        }
        $token = (string) ($row['token'] ?? '');
        $emails[] = [
            'email' => $email,
            'at' => (string) ($row['ts'] ?? ''),
            'token' => $token,
            'unsubUrl' => $token !== '' ? newsletter_list_unsub_url($token) : '',
        ];
    }

    usort($emails, function ($a, $b) {
        return strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
    });

    return $emails;
}

function save_newsletter_list(string $file, array $list): bool
{
    return newsletter_list_save($list);
}

function row_email($row): string
{
    return newsletter_list_row_email($row);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid body']);
        exit;
    }

    $action = (string) ($body['action'] ?? '');

    if ($action === 'remove') {
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid email']);
            exit;
        }

        $removed = newsletter_list_remove($email);
        if (empty($removed['ok'])) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => $removed['error'] ?? 'Could not update subscribers']);
            exit;
        }
        if (empty($removed['removed'])) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Email not found (it may already be removed).']);
            exit;
        }

        log_admin_action('newsletter_remove', 'Removed newsletter subscriber', [
            'meta' => ['email' => $email],
        ]);
        $emails = normalize_newsletter_emails([]);
        echo json_encode([
            'ok' => true,
            'count' => count($emails),
            'items' => $emails,
            'unsubRequests' => newsletter_unsub_requests_pending(),
        ]);
        exit;
    }

    if ($action === 'approve_unsub') {
        $id = trim((string) ($body['id'] ?? ''));
        $result = newsletter_unsub_request_approve($id);
        if (empty($result['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Could not approve.']);
            exit;
        }
        log_admin_action('newsletter_unsub_approve', 'Approved newsletter unsubscribe request', [
            'meta' => ['email' => $result['email'] ?? '', 'id' => $id],
        ]);
        $emails = normalize_newsletter_emails([]);
        echo json_encode([
            'ok' => true,
            'count' => count($emails),
            'items' => $emails,
            'unsubRequests' => newsletter_unsub_requests_pending(),
        ]);
        exit;
    }

    if ($action === 'dismiss_unsub') {
        $id = trim((string) ($body['id'] ?? ''));
        $result = newsletter_unsub_request_dismiss($id);
        if (empty($result['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $result['error'] ?? 'Could not dismiss.']);
            exit;
        }
        log_admin_action('newsletter_unsub_dismiss', 'Dismissed newsletter unsubscribe request', [
            'meta' => ['id' => $id],
        ]);
        $emails = normalize_newsletter_emails([]);
        echo json_encode([
            'ok' => true,
            'count' => count($emails),
            'items' => $emails,
            'unsubRequests' => newsletter_unsub_requests_pending(),
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$emails = normalize_newsletter_emails(load_newsletter_raw($file));

$format = strtolower((string) ($_GET['format'] ?? 'json'));
if ($format === 'csv') {
    log_admin_action('newsletter_export', 'Exported newsletter subscribers CSV', [
        'meta' => ['count' => count($emails)],
    ]);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="vsa-newsletter-subscribers.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['email', 'signed_up_at', 'unsubscribe_url']);
    foreach ($emails as $row) {
        fputcsv($out, [$row['email'], $row['at'], $row['unsubUrl'] ?? '']);
    }
    fclose($out);
    exit;
}

echo json_encode([
    'ok' => true,
    'count' => count($emails),
    'items' => $emails,
    'unsubRequests' => newsletter_unsub_requests_pending(),
]);
