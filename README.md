# Auburn VSA Website

Public website and admin CMS for the **Auburn University Vietnamese Student Association**.

Live site: [www.auburnvsa.com](https://www.auburnvsa.com)

## What it is

Static HTML pages hydrated by JavaScript from a small PHP content API. Editors manage copy, events, gallery, merch, FAQs, and media in `/admin/` — no framework and no build step.

## Quick start (local)

Requires **PHP 7.4+** (8.1/8.2 preferred) and Apache (e.g. XAMPP) or the PHP built-in server:

```bash
php -S 0.0.0.0:8000 -t .
```

- Public site: `http://localhost:8000/`
- Admin: `http://localhost:8000/admin/`

Change admin passwords before any real deploy. Runtime data lives in `data/` and uploads in `uploads/` (both git-ignored).

## Layout

| Path | Role |
|------|------|
| `*.html` | Public pages (Home, Events, AU Royale, Gallery, …) |
| `assets/` | CSS, JS, cache-bust token (`ASSET_VERSION`) |
| `api/` | Public PHP endpoints (`content.php`, newsletter, FAQ ask, …) |
| `admin/` | CMS console |
| `includes/` | Shared PHP (web-denied) |
| `data/` | Runtime JSON / sessions (git-ignored) |
| `uploads/` | CMS media (git-ignored except `.gitkeep`) |
| `docs/` | Maintainer docs — start with [`docs/HANDOFF.md`](docs/HANDOFF.md) |
| `tools/` | CLI helpers (`bump-assets.php`, deploy pack, checks) |

## After editing CSS/JS

```bash
php tools/bump-assets.php --bump
php tools/check-maintenance.php
```

## Deploy pack

```bash
php tools/pack-deploy.php --with-data --with-uploads
```

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).

## Maintainer notes

- Full recreate / ops spec: `docs/SITE-RECREATE.txt` (not linked from the public site)
- Agent / contributor conventions: `AGENTS.md`
- Brand: navy `#344E74`, orange `#FF811D`
