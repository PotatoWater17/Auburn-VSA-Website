# Auburn VSA Website

Website + admin CMS for the Auburn University Vietnamese Student Association (VSA). Public pages are **static HTML** hydrated by JavaScript from a small PHP content API. PHP is used for stored data (admin CMS, content API, uploads, newsletter, FAQ ask, construction mode). No framework, no build step.

## Project structure

- Root `*.html` — public pages: `index.html` (Home), `executive-board.html`, `tech-team.html`, `au-royale-directors.html`, `events.html`, `au-royale.html`, `gallery.html`, `merch.html`, `faqs.html`, `unsubscribe.html`.
- `assets/js/site.js` — public interactivity + fetches `api/content.php` to fill CMS fields.
- `assets/js/admin.js` — admin UI; section schemas live in `SECTION_DEFS` (keep in sync with `includes/content.php` defaults when adding fields).
- `api/` — `content.php`, `newsletter.php`, `faq-ask.php`, `construction-auth.php`, `construction-message.php`.
- `includes/` — shared PHP (`config.php`, `content.php`, `auth.php`, `users.php`, `security.php`, `construction.php`, `faq_inbox.php`, `seo.php`, `backup.php`, …). Blocked from web via `.htaccess`.
- `admin/` — CMS console (login, dashboard, users, messages, blocked IPs, FAQ inbox, subscribers, mail, publish queue, backup, …).
- `workers/vsa-mail/` — Cloudflare Email Worker for Admin Mail inbound. **Never deployed** — the Admin Mail tab cannot receive anything until this worker is set up.
- `assets/` — `css/styles.css`, `css/admin.css`, `js/site.js`, `js/admin.js`, `ASSET_VERSION` (cache-bust token).
- `data/` — runtime JSON + password hashes. Git-ignored; denied by `data/.htaccess`.
- `uploads/` — CMS media. Git-ignored except `.gitkeep` / `.htaccess`.
- `tools/` — CLI helpers (`bump-assets.php`, `optimize-uploads.php`, `check-maintenance.php`, `check-hosting.php`, `pack-deploy.php`). Denied by `tools/.htaccess`.
- `docs/` — maintainer docs: **`docs/HANDOFF.md`** (what a successor needs to keep the site online) and **`docs/SITE-RECREATE.txt`** (full recreate/ops spec). Denied by `docs/.htaccess`.

Navy placeholder boxes (rendered in JS) stand in wherever an image has not yet been uploaded via the admin console.

## Brand

- Navy: `#344E74` (`--navy`) and darker variants (`--navy-dark`, `#1a3560` for highlight strips).
- Orange: `#FF811D` (`--orange`). Prefer CSS variables over hard-coded hex when editing styles.

## Auth & admin

- Multi-user admins via `data/users.json` (`includes/users.php`). Permissions gate CMS sections. Manage users offers multi-select role checkboxes (Content / Comms / Ops) that combine access; section checkboxes remain the source of truth.
- Needs-attention strip under the admin header surfaces FAQ inbox, messages, unsubscribe requests, unread mail, and scheduled publishes. Root additionally sees logged site errors.
- Fatals/uncaught exceptions are recorded to `data/error_log.json` by `includes/errorlog.php` (installed from `config.php`) and shown under Admin → Dashboard → Site health; `admin/health.php` clears it.
- Server uptime heartbeats (`includes/uptime.php` → `data/uptime.json`) track when the host last handled traffic; quiet gaps ≥ 2 h show on Dashboard → Server uptime. Probe: `GET /api/health.php`.
- Dashboard landing page (status, attention, last published/edited, ring-chart stats, quick tasks). Shared / Pages nav groups collapse by default; on narrow screens the nav is a **current-page bar + dropdown** (tap the arrow for all sections).
- Media tab lists `/uploads` images with search; click an image for usage across CMS content, newsletter drafts, and scheduled publishes. Rename updates the file and all references. Delete permanently removes the file (warns if still referenced).
- Music tab (Ops): footer-logo easter-egg player — enable, click count, track upload/rename (title). Unlock persists in `localStorage`. Search `EASTER_EGG_MUSIC` to remove.
- Image controls include a Library picker (`GET admin/upload.php?action=list`) to reuse recent uploads.
- Root password: `data/users.json`, or env `ADMIN_PASSWORD_HASH` → `data/.admin_password_hash` for legacy/bootstrap use. No password or fallback hash ships in source.
- **First handoff step:** change passwords; do not ship defaults to production.
- Session cookies: `HttpOnly`, `SameSite=Lax`, `Secure` when HTTPS. Expire after **2 h idle** or **12 h from login** (env `ADMIN_SESSION_IDLE_SECONDS` / `ADMIN_SESSION_MAX_SECONDS`). User-Agent binding on session (env `VSA_SESSION_BIND_UA=0` to disable). Write APIs require CSRF (`X-CSRF-Token`) **and** same-origin checks.
- Saves open a publish dialog (ASAP default, or schedule). ASAP writes `data/content.json`. Schedule queues `data/scheduled_publish.json` (applied on next `get_content()` after the due time). Delete `content.json` to reset to `default_content()`.
- FAQ Inbox → Answer & publish (same dialog); Newsletter compose can **Add from Events**. No public chatbot.

## Maintenance (read this before editing chrome / CSS / JS)

### Hosting-admin recreate spec (mandatory)

- Keep **`docs/SITE-RECREATE.txt`** in sync on every meaningful change (behavior, structure, CMS fields, auth/ops, chrome, security deny paths, or maintenance workflow). That file is the hosting-admin recreate/ops spec; it is web-denied (`docs/.htaccess` + root rewrite) — never link it from public HTML. No secrets/passwords/hashes in it.

### Cache-bust tokens (important)

CSS/JS are served with long `immutable` caching. Every public HTML page and admin PHP file references assets as `?v=TOKEN`.

1. Edit CSS/JS as needed.
2. Run from repo root: `php tools/bump-assets.php --bump`
3. That updates `assets/ASSET_VERSION` and rewrites tokens in all root `*.html`, `admin/index.php`, `admin/login.php`, and `admin/password.php`.
4. Optional sanity check: `php tools/check-maintenance.php`

To re-apply the current token without changing it: `php tools/bump-assets.php`.

### Shared HTML chrome (no includes)

Topbar, header/nav, and footer are **copy-pasted** across the public HTML pages (static hosting; no SSI). Do **not** convert public pages to PHP templates — keep the static HTML + `api/content.php` model.

1. Use `index.html` as the canonical reference for the chrome blocks.
2. Replicate into **every** root `*.html` the same way (`unsubscribe.html` may omit the newsletter column).
3. Keep footer Subscribe button label identical (`Subscribe`).
4. Prefer extensionless nav hrefs without a leading slash (`events`, not `/events`); home uses `./`. Include skip-link → `#main` and a quiet Unsubscribe link in footer-legal.
5. Page-only diffs belong in `<main id="main">` / `<head>` meta / `data-page` / `data-nav` / `data-team`.
6. Team pages share `data-page="team"`; use `data-team` (`executiveBoard`, `techTeam`, `royaleDirectors`) for which roster.
7. Run `php tools/check-maintenance.php` after chrome edits (detects nav/footer drift + cache tokens).

### Adding a CMS field

1. Default in `includes/content.php` → `default_content()`.
2. Admin schema in `assets/js/admin.js` → `SECTION_DEFS`.
3. Public render in `assets/js/site.js` (and HTML mount point if new).
4. Bump assets if JS changed.

### CSS order / brand tokens

Put new **base** rules above the large `@media` blocks at the bottom of `styles.css`. Rules after those media queries are harder to override predictably.

Brand colors live in `styles.css` `:root` (`--navy`, `--orange`, `--navy-deep`, …). Prefer `var(--…)` over one-off hex. Admin CSS is self-contained — keep its `:root` hex values in sync when the brand changes.

## Public features

- Home: next-up strip, recent-events slideshow, hero (join path hint), about (Join + board), Why Join + CTA, How to join steps, Instagram/alumni (when filled), newsletter footer; mobile sticky Join chip (dismissible).
- Merch: showcase slideshow + product grid with detail sheet.
- Sticky orange site header (email/phone topbar scrolls away).
- Holiday themes (Admin → Site → Holiday theme): `auto` / `off` / force; top bar color takeover + right-side mark (`newyear` = Chinese New Year). Search `HOLIDAY_THEMES` to remove.
- Button hover effects (Admin → Site → Button hover effect): `flat` / `lift` (default) / `shine` / `jelly` / `playful` / `pop` / `pulse` / `fill` / `neon` / `wiggle`. Search `BUTTON_EFFECTS` to remove.
- Page body copy (headings, subtexts, button labels) is CMS-editable per page. Brand headings use `|` to mark orange words (e.g. `About | Auburn VSA`). FAQ page chrome lives in `faqPage`; Q&A list stays in `faqs`.
- Home also exposes next-up action labels, empty-state copy, and (under Site) shared nav / Email-Phone / newsletter field labels.
- Next-up strip appears sitewide when a dated upcoming event exists; users can collapse it for the session (label + title only).
- Events: carousel + view-all modal + detail sheet.
- Gallery: school-year dropdown, albums, lightbox.
- FAQs: accordion + ask sheet → FAQ Inbox.
- AU Royale: navy hero, about / what to expect / who’s welcome, share under About, gallery highlights (from Gallery “Royale” albums), sponsors slideshow, ticketing CTA.

## Handoff checklist

Full version for a non-developer successor: **`docs/HANDOFF.md`**.

1. Log into `/admin/` and **change passwords** (and review users).
2. Confirm Apache serves `data/.htaccess`, `includes/.htaccess`, `uploads/.htaccess`, `tools/.htaccess`, `docs/.htaccess` (direct access should 403).
3. Replace placeholder CMS content before launch.
4. Set Join Now + Purchase Tickets links under Home / AU Royale.
5. Export newsletter emails from Admin → Newsletter (CSV / BCC chunks). Compose the monthly email there (named draft library + HTML/plain for Gmail).
6. Confirm `docs/SITE-RECREATE.txt` matches current site behavior after any recent changes.

## Cursor Cloud / local PHP

- Requires PHP CLI **7.4+** (`php`). Prefer 8.1/8.2. No Composer deps.
- `str_contains` / `str_starts_with` / `str_ends_with` are polyfilled in `includes/config.php` for 7.4.
- Dev server: `php -S 0.0.0.0:8000 -t .` — Site `/`, admin `/admin/`.
- PHP built-in server does **not** process `.htaccess`.
- Image URLs are root-relative (`uploads/x.png`). Admin previews prefix `../`.
- Validate PHP with `php -l <file>` before committing.
