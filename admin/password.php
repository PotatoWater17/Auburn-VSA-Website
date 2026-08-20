<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/content.php';

require_admin();

$content = get_content();
$csrf = csrf_token();
$logo = $content['branding']['logo'] ?? '';
$logoSrc = $logo === ''
    ? ''
    : (preg_match('#^(https?:)?//#', $logo) || str_starts_with($logo, '/')
        ? $logo
        : '../' . ltrim($logo, '/'));

$locked = current_user_is_root() && admin_password_is_env_locked();
$error = '';
$success = '';
$me = current_username();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$locked) {
    if (!is_same_origin_request()) {
        $error = 'Invalid request origin. Refresh and try again.';
    } elseif (!verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'Invalid session token. Refresh and try again.';
    } else {
        $current = (string) ($_POST['current_password'] ?? '');
        $new = (string) ($_POST['new_password'] ?? '');
        $confirm = (string) ($_POST['confirm_password'] ?? '');
        if ($new !== $confirm) {
            $error = 'New password and confirmation do not match.';
        } else {
            $result = change_own_password($current, $new);
            if (!empty($result['ok'])) {
                log_admin_action('password_change', 'Changed own password', [
                    'meta' => ['targetUser' => $me],
                ]);
                $success = 'Password updated. Use the new password next time you log in.';
            } else {
                $error = $result['error'] ?? 'Could not update password.';
            }
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Change password | Auburn VSA Admin</title>
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
<body>
    <header class="admin-header">
        <div class="admin-header-inner">
            <div class="admin-header-lead">
                <a href="index.php" class="admin-brand">
                    <?php if ($logoSrc !== ''): ?>
                    <img src="<?= htmlspecialchars($logoSrc, ENT_QUOTES, 'UTF-8') ?>" alt="">
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
                <a href="index.php">Dashboard</a>
                <a href="logout.php" class="btn btn-orange sm">Log out</a>
            </div>
        </div>
    </header>

    <main class="admin-password-wrap">
        <div class="login-card admin-password-card">
            <h1>Change password</h1>
            <p class="muted">Update the password for <strong><?= htmlspecialchars($me, ENT_QUOTES, 'UTF-8') ?></strong>. Stored as a bcrypt hash only (never plaintext). Minimum 10 characters, with at least one letter and one number.</p>

            <?php if ($locked): ?>
            <p class="error">Password is locked by the server environment and can&rsquo;t be changed here.</p>
            <?php else: ?>
                <?php if ($error): ?><p class="error"><?= htmlspecialchars($error) ?></p><?php endif; ?>
                <?php if ($success): ?><p class="save-status ok"><?= htmlspecialchars($success) ?></p><?php endif; ?>
                <form method="post" autocomplete="off">
                    <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
                    <label for="current_password">Current password</label>
                    <input id="current_password" name="current_password" type="password" required autocomplete="current-password">
                    <label for="new_password">New password</label>
                    <input id="new_password" name="new_password" type="password" required minlength="10" maxlength="256" autocomplete="new-password">
                    <label for="confirm_password">Confirm new password</label>
                    <input id="confirm_password" name="confirm_password" type="password" required minlength="10" maxlength="256" autocomplete="new-password">
                    <button type="submit" class="btn btn-orange full">Update password</button>
                </form>
            <?php endif; ?>

            <p class="admin-password-back"><a href="index.php">&larr; Back to dashboard</a></p>
        </div>
    </main>
<script>
(function () {
  var THEME_KEY = "vsa-theme";
  var ORDER = ["light", "dark", "system"];
  function pref() {
    try {
      var p = localStorage.getItem(THEME_KEY);
      return (p === "light" || p === "dark" || p === "system") ? p : "light";
    } catch (e) { return "light"; }
  }
  function resolved(p) {
    if (p === "dark") return "dark";
    if (p === "system") {
      try { return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { return "light"; }
    }
    return "light";
  }
  function apply(p, persist) {
    p = p || pref();
    if (p !== "light" && p !== "dark" && p !== "system") p = "light";
    var r = resolved(p);
    document.documentElement.setAttribute("data-theme", r);
    document.documentElement.setAttribute("data-theme-pref", p);
    if (persist) { try { localStorage.setItem(THEME_KEY, p); } catch (e) {} }
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.setAttribute("data-pref", p);
    btn.setAttribute("aria-pressed", r === "dark" ? "true" : "false");
    var labels = { light: "Color theme: Light. Click for Dark.", dark: "Color theme: Dark. Click for System.", system: "Color theme: System. Click for Light." };
    btn.setAttribute("aria-label", labels[p] || labels.light);
    btn.title = "Theme: " + p.charAt(0).toUpperCase() + p.slice(1);
  }
  apply(pref(), false);
  var btn = document.getElementById("theme-toggle");
  if (btn) btn.addEventListener("click", function () {
    var i = ORDER.indexOf(pref());
    apply(ORDER[(i + 1) % ORDER.length], true);
  });
})();
</script>
</body>
</html>
