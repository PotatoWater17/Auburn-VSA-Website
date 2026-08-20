# Auburn VSA website — handoff

Give this to whoever takes over the site.
**Never put passwords in this file** — use a password manager.
This folder is blocked from the public web.

---

## Go live

No database. No Composer. No Node. Just files.

1. On the current machine, run:
   ```
   php tools/pack-deploy.php --with-data --with-uploads
   ```
2. Upload `auburn-vsa-deploy.zip` into the host’s web root (often `public_html`) and extract it.
3. Open `https://YOUR-DOMAIN/` and `https://YOUR-DOMAIN/admin/`.
4. **Change every password** right away.
5. Admin → Backup → Download a zip. Keep it offline.

Done. Day-to-day editing is only `/admin/` in a browser.

---

## Server needs

- Apache (must allow `.htaccess`)
- PHP **7.4+** (prefer **8.1** or **8.2**)
- Writable `data/` and `uploads/`
- HTTPS preferred

Not needed: MySQL, Composer, Node, npm.

Most shared hosts and university Apache + PHP panels work. IIS / Nginx-only do not (without rewriting the rules).

If the site is under a path like `school.edu/~vsa/` and clean URLs 404, edit `.htaccess` and uncomment `RewriteBase /~vsa/` (use your real path).
If the whole site returns HTTP 500 right after upload, comment out the `Options -Indexes` lines in `.htaccess` and `uploads/.htaccess`.

---

## Checklist

- [ ] Site loads at `/`
- [ ] `/admin/` login works; passwords changed
- [ ] Image upload works
- [ ] `/data/` `/includes/` `/tools/` `/docs/` return **403**
- [ ] Offline backup downloaded
- [ ] Hosting / domain / HTTPS renewals on a calendar

---

## Day to day

Officers edit everything in `/admin/` (events, gallery, merch, FAQs, team, newsletter, FAQ inbox).

**Download Admin → Backup before any code upload and after big content changes.**

A developer is only needed for CSS/JS, moving hosts, or PHP fixes.

---

## If something breaks

| Problem | Try |
|---|---|
| Blank pages | Open `/api/content.php` — should show JSON |
| Can’t save / upload | Are `data/` and `uploads/` writable? Still logged in? |
| Site-wide 500 | PHP too old, or comment out `Options -Indexes` |
| Restore content | Admin → Backup → Import (download a fresh backup first — import overwrites) |

For full technical detail: `docs/SITE-RECREATE.txt`.
