# Auburn VSA Website

Public website and admin CMS for the **Auburn University Vietnamese Student Association**.

**Live:** [www.auburnvsa.com](https://www.auburnvsa.com)

---

## What it is

A club brochure site plus a browser CMS. There is **no** React/Next, Composer, Node build, or MySQL database.

| Layer | Technology |
|--------|------------|
| Public pages | Static HTML at the repo root |
| Front-end behavior | Vanilla JS (`assets/js/site.js`) |
| Styling | Plain CSS (`assets/css/styles.css`) |
| Content API | Small PHP endpoints under `api/` |
| Admin CMS | PHP + vanilla JS (`admin/`, `assets/js/admin.js`) |
| Storage | JSON files in `data/` + images in `uploads/` |

Editors change copy, events, gallery, merch, FAQs, team, and media in **`/admin/`**. The public site loads defaults-plus-saved content from `GET /api/content.php` and fills the page in the browser.

---

## How the site is implemented

### Request flow (public)

1. Visitor opens a page such as `events.html` (or the clean URL `events` via Apache rewrite).
2. Shared chrome (topbar, nav, footer) is **copy-pasted** into each HTML file (no SSI / PHP templates on public pages).
3. `site.js` reads `data-page` / `data-nav` / `data-team` on `<body>`, fetches `/api/content.php`, and hydrates headings, lists, images, and interactive widgets (carousels, FAQ accordion, event sheets, next-up strip, etc.).
4. Missing images render as navy CMS placeholders until an admin uploads media.

### Content model

- Defaults live in PHP: `includes/content.php` → `default_content()`.
- Saved CMS data: `data/content.json` (created on first publish; **git-ignored**).
- Scheduled publishes: `data/scheduled_publish.json` (applied when due on the next content read).
- Deleting `content.json` resets the public site to defaults.

### Admin CMS

- Login and sessions: `includes/auth.php` / `includes/users.php` (bcrypt hashes in `data/users.json` — **not in git**).
- Section editors are defined in `assets/js/admin.js` (`SECTION_DEFS`) and must stay aligned with `default_content()`.
- Saves open a publish dialog: **ASAP** (write `content.json`) or **schedule**.
- CSRF (`X-CSRF-Token`) + same-origin checks on write APIs.
- Media library scans where each `/uploads` file is used (live content, newsletter drafts, scheduled jobs) and can rename, retarget references, or bulk-delete.

### Security posture (web root)

Apache `.htaccess` rules deny direct web access to `data/`, `includes/`, `tools/`, `docs/`, and `workers/`. Do not commit secrets: passwords, hashes, `.env`, or upload binaries are git-ignored.

### Brand

- Navy: `#344E74` (`--navy`)
- Orange: `#FF811D` (`--orange`)

Prefer CSS variables over one-off hex when editing styles.

---

## Requirements

- **PHP 7.4+** (prefer **8.1** or **8.2**)
- **Apache** with `.htaccess` allowed (typical shared host / XAMPP), **or** PHP’s built-in server for local preview
- Writable `data/` and `uploads/` directories

**Not required:** MySQL, Composer, Node, npm.

> Note: the PHP built-in server does **not** apply `.htaccess`. Use Apache (XAMPP) when you need clean URLs, deny rules, or production-like redirects.

---

## How to run locally

### Option A — XAMPP (recommended on Windows)

1. Install [XAMPP](https://www.apachefriends.org/) with Apache + PHP.
2. Place this repo in the web root (e.g. `C:\xampp\htdocs`) **or** point a vhost / alias at the repo folder.
3. Start **Apache** from the XAMPP control panel.
4. Open:
   - Site: `http://localhost/` (or your vhost)
   - Admin: `http://localhost/admin/`

### Option B — PHP built-in server

From the repo root:

```bash
php -S 0.0.0.0:8000 -t .
```

- Site: `http://localhost:8000/`
- Admin: `http://localhost:8000/admin/`
- Content API smoke test: `http://localhost:8000/api/content.php` (should return JSON)

### First-time admin

1. Open `/admin/` and sign in with the account created on this machine (or bootstrap per host docs).
2. **Change every password** before any shared or production use.
3. Confirm you can upload an image (writes under `uploads/`).
4. Optional: Admin → Backup → download a zip and keep it offline.

This clone does **not** ship `data/users.json` or upload files. On a fresh tree, the first successful admin bootstrap / deploy with `--with-data` creates runtime files locally.

---

## Public pages

| File | Page |
|------|------|
| `index.html` | Home |
| `executive-board.html` | Executive Board |
| `tech-team.html` | Tech Team |
| `au-royale-directors.html` | AU Royale Directors |
| `events.html` | Events |
| `au-royale.html` | AU Royale |
| `gallery.html` | Gallery |
| `merch.html` | Merch |
| `faqs.html` | FAQs |
| `unsubscribe.html` | Newsletter unsubscribe |

Nav links prefer extensionless paths (`events`, `gallery`). Home uses `./`.

---

## Repository layout

| Path | Role |
|------|------|
| `*.html` | Public pages |
| `assets/css/` | Public + admin styles |
| `assets/js/site.js` | Public hydration + widgets |
| `assets/js/admin.js` | Admin UI + CMS schemas |
| `assets/ASSET_VERSION` | Cache-bust token (`?v=…` on CSS/JS) |
| `api/` | Public PHP API |
| `admin/` | CMS console (login, dashboard, media, …) |
| `includes/` | Shared PHP (web-denied) |
| `data/` | Runtime JSON + password hashes (**git-ignored**) |
| `uploads/` | CMS media (**git-ignored** except `.gitkeep` / `.htaccess`) |
| `tools/` | CLI: bump assets, pack deploy, maintenance checks |
| `docs/HANDOFF.md` | Non-developer successor checklist |
| `docs/SITE-RECREATE.txt` | Full ops / recreate spec (web-denied) |
| `AGENTS.md` | Contributor conventions for this codebase |
| `workers/vsa-mail/` | Optional Cloudflare Email Worker source (inbound mail; deploy separately) |

---

## Day-to-day editing

### Content (officers)

Use **`/admin/`** only — Home, Team, Events, Royale, Gallery, Merch, FAQs, Media, Newsletter, FAQ Inbox, etc. No code required.

### Code (developers)

**Add a CMS field**

1. Default in `includes/content.php` → `default_content()`
2. Admin field in `assets/js/admin.js` → `SECTION_DEFS`
3. Render in `assets/js/site.js` (and HTML mount if new)
4. Bump assets if JS changed

**Edit CSS or JS (cache bust)**

```bash
# from repo root
php tools/bump-assets.php --bump
php tools/check-maintenance.php
```

That updates `assets/ASSET_VERSION` and rewrites `?v=` on public HTML + admin PHP entrypoints.

**Edit shared chrome** (header / nav / footer)

1. Change `index.html` first (canonical).
2. Copy the same blocks into every other root `*.html`.
3. Run `php tools/check-maintenance.php` to catch drift.

Do **not** convert public pages into PHP templates — keep static HTML + `api/content.php`.

---

## Deploy to hosting

No database migrate step. Pack files and upload:

```bash
php tools/pack-deploy.php --with-data --with-uploads
```

1. Upload / extract `auburn-vsa-deploy.zip` into the host web root (often `public_html`).
2. Visit `https://YOUR-DOMAIN/` and `https://YOUR-DOMAIN/admin/`.
3. **Change all passwords** immediately.
4. Admin → Backup → download an offline zip.

### Host needs

- Apache with `.htaccess`
- PHP 7.4+ (8.1/8.2 preferred)
- Writable `data/` and `uploads/`
- HTTPS preferred

If the site lives under a path like `school.edu/~vsa/`, set `RewriteBase` in `.htaccess`. If you get an immediate HTTP 500 on some hosts, try commenting out `Options -Indexes` in `.htaccess` / `uploads/.htaccess`.

---

## What is intentionally not in Git

| Kept local / on server only | Why |
|-----------------------------|-----|
| `data/*.json`, password hashes | Live CMS content + credentials |
| `uploads/*` (images, video, audio) | Large / private runtime media |
| `.env`, worker `.dev.vars` | Secrets |

Only empty-folder markers (`.gitkeep`, deny `.htaccess`) are committed for `data/` and `uploads/`.

---

## Troubleshooting

| Problem | Try |
|---------|-----|
| Blank public pages | Open `/api/content.php` — should be JSON |
| Can’t save or upload | Writable `data/` + `uploads/`? Still logged in? |
| Site-wide HTTP 500 | PHP version; or comment out `Options -Indexes` |
| CSS/JS not updating | Hard refresh; run `php tools/bump-assets.php --bump` |
| Clean URLs 404 on PHP built-in server | Expected — use Apache, or open `*.html` paths |
| Reset public copy to defaults | Delete `data/content.json` (after a backup) |

---

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).

## More documentation

- [`docs/HANDOFF.md`](docs/HANDOFF.md) — handoff checklist for a non-developer successor  
- `docs/SITE-RECREATE.txt` — exhaustive recreate/ops spec (blocked from the public web)  
- [`AGENTS.md`](AGENTS.md) — conventions for people (and coding agents) changing this repo  
