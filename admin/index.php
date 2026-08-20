<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/publish.php';
require_once __DIR__ . '/../includes/users.php';
require_once __DIR__ . '/../includes/mail.php';
require_once __DIR__ . '/../includes/activity.php';
require_once __DIR__ . '/../includes/uptime.php';

require_admin();

$content = get_content();
$publishPending = publish_list_pending();
$content = publish_merge_pending_for_admin($content, $publishPending);
$csrf = csrf_token();
$user = current_user();
$siteTimeline = activity_content_timeline();
// Admin viewing the console counts as alive; also detects gaps since last public hit.
uptime_heartbeat(true);
$siteUptime = uptime_status();
$logo = $content['branding']['logo'] ?? '';
// Admin lives under /admin/, so root-relative asset paths need ../
$logoSrc = $logo === ''
    ? ''
    : (preg_match('#^(https?:)?//#', $logo) || str_starts_with($logo, '/')
        ? $logo
        : '../' . ltrim($logo, '/'));

// Ensure inbound webhook secret exists for Cloudflare Worker setup.
mail_ensure_inbound_secret();

$adminUser = [
    'username' => current_username(),
    'role' => current_user_is_root() ? 'root' : 'editor',
    'permissions' => current_permissions(),
    'mailboxes' => mail_user_mailbox_ids($user),
    'isRoot' => current_user_is_root(),
];
$permCatalog = admin_permission_catalog();
$mailCatalog = mail_mailbox_catalog();

// Health signals are root-only: error entries include server file paths.
$siteHealth = ['errors' => [], 'errorCount' => 0];
if (current_user_is_root()) {
    require_once __DIR__ . '/../includes/errorlog.php';
    $siteHealth['errors'] = vsa_recent_errors(20);
    $siteHealth['errorCount'] = count($siteHealth['errors']);
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Dashboard | Auburn VSA Admin</title>
    <?php if ($logoSrc !== ''): ?>
    <link rel="icon" href="<?= htmlspecialchars($logoSrc, ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
        <script>
    (function () {
      try {
        var k = "vsa-theme";
        var p = localStorage.getItem(k);
        if (p !== "light" && p !== "dark" && p !== "system") p = "light";
        var dark = p === "dark" || (p === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        document.documentElement.setAttribute("data-theme-pref", p);
      } catch (e) {}
    })();
    </script>
    <link rel="stylesheet" href="../assets/css/admin.css?v=20260818b">
</head>
<body class="admin-app">
    <header class="admin-header">
        <div class="admin-header-inner">
            <div class="admin-header-lead">
                <a href="index.php" class="admin-brand">
                    <?php if ($logoSrc !== ''): ?>
                    <img id="admin-brand-logo" src="<?= htmlspecialchars($logoSrc, ENT_QUOTES, 'UTF-8') ?>" alt="">
                    <?php else: ?>
                    <img id="admin-brand-logo" alt="" hidden>
                    <?php endif; ?>
                    <span>Auburn VSA <span class="hl">Admin</span></span>
                </a>
                <button type="button" class="admin-theme-toggle" id="theme-toggle" data-pref="light" aria-label="Color theme: Light. Click for Dark." aria-pressed="false" title="Theme: Light">
                    <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round"/></svg>
                    <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <svg class="theme-icon-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" stroke-linecap="round"/></svg>
                </button>
            </div>
            <div class="admin-header-actions">
                <span class="admin-user-chip" title="Signed in as"><?= htmlspecialchars($adminUser['username'], ENT_QUOTES, 'UTF-8') ?></span>
                <a href="../" target="_blank" rel="noopener noreferrer">View site &#8599;</a>
                <a href="password.php">Change password</a>
                <a href="logout.php" class="btn btn-orange sm">Log out</a>
            </div>
        </div>
    </header>

    <div class="admin-top-alerts">
        <div id="publish-banner-host" class="publish-banner-host" hidden></div>
        <div id="admin-attention-host" class="admin-attention-host" hidden></div>
    </div>
    <main class="admin-main">
        <aside class="admin-sidebar" aria-label="Admin sections">
            <nav id="admin-nav" class="admin-nav"></nav>
            <p class="admin-hint">Pick the page that matches what you&rsquo;re looking at on the site. Save asks when to publish (ASAP or scheduled).</p>
        </aside>
        <section id="admin-panel" class="admin-panel" tabindex="-1">
            <p class="muted">Loading&hellip;</p>
        </section>
    </main>

    <script id="content-data" type="application/json"><?= json_encode($content, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?></script>
    <script>
      window.CSRF_TOKEN = <?= json_encode($csrf) ?>;
      window.ADMIN_USER = <?= json_encode($adminUser, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.ADMIN_PERM_CATALOG = <?= json_encode($permCatalog, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.ADMIN_MAIL_CATALOG = <?= json_encode(array_values($mailCatalog), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.PUBLISH_PENDING = <?= json_encode($publishPending, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.SITE_TIMELINE = <?= json_encode($siteTimeline, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.SITE_HEALTH = <?= json_encode($siteHealth, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
      window.SITE_UPTIME = <?= json_encode($siteUptime, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
    </script>
    <script src="../assets/js/admin.js?v=20260818b"></script>
</body>
</html>
