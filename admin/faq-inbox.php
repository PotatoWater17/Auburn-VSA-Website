<?php
// Admin FAQ inbox API — list / publish / dismiss pending questions.
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/faq_inbox.php';

require_permission_api('faq-inbox');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $inbox = get_faq_inbox();
    echo json_encode(['ok' => true, 'items' => $inbox, 'count' => count($inbox)]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid body']);
    exit;
}

$action = (string) ($body['action'] ?? '');
$id = trim((string) ($body['id'] ?? ''));
if ($id === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing question id']);
    exit;
}

$inbox = get_faq_inbox();
$index = faq_inbox_find($inbox, $id);
if ($index === null) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Question not found (it may have already been handled).']);
    exit;
}

if ($action === 'dismiss') {
    array_splice($inbox, $index, 1);
    if (!save_faq_inbox($inbox)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not update inbox']);
        exit;
    }
    log_admin_action('faq_inbox_dismiss', 'Dismissed FAQ inbox item', [
        'meta' => ['id' => $id],
    ]);
    echo json_encode(['ok' => true, 'items' => $inbox, 'count' => count($inbox)]);
    exit;
}

if ($action === 'publish') {
    if (!current_user_can('faqs')) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'You need FAQs permission to publish.']);
        exit;
    }
    $question = trim((string) ($body['question'] ?? ($inbox[$index]['question'] ?? '')));
    $answer = trim((string) ($body['answer'] ?? ''));
    if ($question === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Question cannot be empty.']);
        exit;
    }
    if ($answer === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Add an answer before publishing.']);
        exit;
    }

    $content = get_content();
    if (!isset($content['faqs']) || !is_array($content['faqs'])) {
        $content['faqs'] = [];
    }

    // Avoid duplicates if content saved but inbox removal previously failed.
    $already = false;
    foreach ($content['faqs'] as $existing) {
        if (!is_array($existing)) {
            continue;
        }
        if (strcasecmp(trim((string) ($existing['question'] ?? '')), $question) === 0) {
            $already = true;
            break;
        }
    }
    if (!$already) {
        $content['faqs'][] = [
            'question' => $question,
            'answer' => $answer,
        ];
        if (!save_content($content)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Could not save published FAQ.']);
            exit;
        }
    }

    array_splice($inbox, $index, 1);
    if (!save_faq_inbox($inbox)) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => $already
                ? 'FAQ already live, but inbox could not be updated. Dismiss the inbox item.'
                : 'FAQ was published but inbox could not be updated. Dismiss the inbox item (do not publish again).',
        ]);
        exit;
    }

    log_admin_action('faq_inbox_publish', 'Published FAQ from inbox', [
        'meta' => [
            'id' => $id,
            'alreadyPublished' => $already,
        ],
    ]);
    echo json_encode([
        'ok' => true,
        'items' => $inbox,
        'count' => count($inbox),
        'faqs' => $content['faqs'],
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action']);
