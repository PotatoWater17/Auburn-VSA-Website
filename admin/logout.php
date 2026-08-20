<?php
require __DIR__ . '/../includes/auth.php';

if (is_logged_in()) {
    log_admin_action('admin_logout', 'Admin console sign-out', [
        'username' => current_username(),
        'role' => current_user_is_root() ? 'root' : 'editor',
    ]);
}

logout_admin();
header('Location: login.php');
exit;
