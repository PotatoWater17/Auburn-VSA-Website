<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/content.php';
require_once __DIR__ . '/../includes/construction.php';
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
start_session();

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';
$errorClass = 'error';
$ip = client_ip();
$csrf = csrf_token();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_same_origin_request()) {
        $error = 'Invalid request origin. Refresh and try again.';
    } elseif (!verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'Invalid session token. Refresh and try again.';
        $csrf = csrf_token();
    } elseif (is_ip_blocked($ip) || admin_login_is_locked($ip)) {
        $error = admin_login_lockout_message($ip);
        $errorClass = 'error error--locked';
    } else {
        $username = (string) ($_POST['username'] ?? 'admin');
        $password = (string) ($_POST['password'] ?? '');
        if (login_user($username, $password)) {
            admin_login_clear_attempts($ip);
            log_admin_action('admin_login', 'Admin console sign-in', [
                'ip' => $ip,
                'username' => current_username(),
                'role' => current_user_is_root() ? 'root' : 'editor',
            ]);
            header('Location: index.php');
            exit;
        }
        $fail = admin_login_fail($ip, 'admin', $username);
        $error = $fail['error'] ?? 'Incorrect username or password.';
        if (!empty($fail['blocked'])) {
            $errorClass = 'error error--locked';
        } elseif ((int) ($fail['count'] ?? 0) >= 7) {
            $errorClass = 'error error--severe';
        }
    }
}

$content = get_content();
$logo = $content['branding']['logo'] ?? '';
$logoSrc = $logo === ''
    ? ''
    : (preg_match('#^(https?:)?//#', $logo) || str_starts_with($logo, '/')
        ? $logo
        : '../' . ltrim($logo, '/'));
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Log in | Auburn VSA Admin</title>
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
    <style>.admin-login-body .admin-theme-toggle{background:var(--navy)}</style>
</head>
<body class="admin-login-body">
    <button type="button" class="admin-theme-toggle" id="theme-toggle" data-pref="light" aria-label="Color theme: Light. Click for Dark." aria-pressed="false" title="Theme: Light" style="position:fixed;top:1rem;right:1rem;z-index:5">
        <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round"/></svg>
        <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <svg class="theme-icon-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" stroke-linecap="round"/></svg>
    </button>
    <div class="login-card">
        <?php if ($logoSrc !== ''): ?>
        <img class="login-logo" src="<?= htmlspecialchars($logoSrc, ENT_QUOTES, 'UTF-8') ?>" alt="Auburn VSA">
        <?php endif; ?>
        <h1>Admin Console</h1>
        <p class="muted">Sign in with your admin username and password.</p>
        <?php if ($error): ?><p class="<?= htmlspecialchars($errorClass, ENT_QUOTES, 'UTF-8') ?>" role="alert"><?= htmlspecialchars($error) ?></p><?php endif; ?>
        <form method="post" autocomplete="on">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required autofocus autocomplete="username" value="">
            <label for="password">Password</label>
            <div class="users-pass-wrap">
                <input id="password" name="password" type="password" required autocomplete="current-password" maxlength="256">
                <button type="button" class="users-pass-toggle" id="login-pass-toggle" title="Hold to show password" aria-label="Hold to show password">Show</button>
            </div>
            <button type="submit" class="btn btn-orange full">Log in</button>
        </form>
        <p class="login-back"><a href="../index.html">&larr; Back to site</a></p>
    </div>
    <script>
      (function () {
        var input = document.getElementById("password");
        var btn = document.getElementById("login-pass-toggle");
        if (!input || !btn) return;
        function hide() { input.type = "password"; btn.textContent = "Show"; }
        function show() { input.type = "text"; btn.textContent = "Hide"; }
        btn.addEventListener("mousedown", function (e) { e.preventDefault(); show(); });
        btn.addEventListener("mouseup", hide);
        btn.addEventListener("mouseleave", hide);
        btn.addEventListener("touchstart", function (e) { e.preventDefault(); show(); }, { passive: false });
        btn.addEventListener("touchend", hide);
        btn.addEventListener("touchcancel", hide);
        btn.addEventListener("blur", hide);
      })();
    </script>
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
