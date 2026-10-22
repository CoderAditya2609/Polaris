# Polaris

A minimalist, private, single-user digital journal PWA. Same sky. New thoughts. Your journal stays on this device.

## What it is

Polaris is a client-only journaling app: write today’s thoughts, add one photo per day, browse a calendar and a polaroid wall, track moods/streaks, and keep everything encrypted at rest in IndexedDB. There is no backend, no account, no analytics, and no network calls. If you lose your passphrase, nothing can be recovered.

### Core features
- **Single-user encrypted journal** — PBKDF2-SHA256 (600,000 iterations, 16-byte salt) → AES-256-GCM for every entry, photo, settings box, and unlock check. Only ciphertext ever touches IndexedDB (`polaris-journal` database).
- **Offline-first PWA** — service worker via `vite-plugin-pwa` (`injectManifest`) precaches the app; works without a network.
- **Views** — Today’s journal (title, mood, rich text, daily polaroid), Calendar (October-style grid, photo/day markers), Polaroid Wall, Insights (streak, counts, mood breakdown), Settings.
- **Themes** — Night (default) and Day paper panels over the same unmodified background image.
- **Auto-lock** — 1–60 minutes of idle time (default 5), then locks and clears decrypted data from memory.
- **Encrypted backups** — one JSON file with salt/check/settings/entries/photos; import replaces all data and verifies the passphrase before restoring.
- **Keyboard** — `Ctrl/Cmd+K` opens global search; `Ctrl/Cmd+Shift+L` locks.

## Quick start

Requires Node.js (built/tested with Node v24) and npm.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + vite build (dist/)
npm run preview        # serve production build
npm test               # vitest (crypto + date helpers)
npm run typecheck      # tsc --noEmit
```

Production build artifacts: `dist/` plus `dist/sw.js` (129 precached entries). `npm run preview` is the intended way to QA the build locally.

## Data and privacy

- **Encryption:** `src/lib/crypto.ts` — PBKDF2-SHA256, 600k iterations, random 16-byte salt, AES-256-GCM with a 12-byte IV per record.
- **Storage:** `src/lib/db.ts` — IndexedDB `polaris-journal` with `meta`, `entries`, `photos` stores. `meta` holds `kdf` (salt + iterations), `check` (unlock verifier), and `settings` (display name + auto-lock), all encrypted. Entries and photos are ciphertext-only.
- **Photos:** processed (`src/lib/photo.ts`) to ≤1200px edge, WebP/JPEG, then encrypted with their MIME type before storage. Object URLs are revoked on lock/navigation.
- **Passphrase:** never stored. `setup` derives and stores a check box; `unlock` re-derives and decrypts the check box. `changePassphrase` verifies the current passphrase, then re-encrypts every entry and photo under a new key/salt.
- **Backup (`src/lib/backup.ts`):** export writes `Polaris-backup-<date>.json`; import validates app/version/salt/iterations, decrypts the verifier with the supplied passphrase, clears existing data, then writes the restored ciphertext. Importing replaces everything currently in the journal and locks with a notice (`localStorage['polaris:notice']`).

### Threat model / limitations
- **No passphrase recovery.** Forgetting it destroys the journal — by design.
- **Single browser profile.** Data lives in that browser’s IndexedDB; there is no sync or cloud export of your plaintext.
- **Offline by intent.** No network calls are ever made; the app is fully usable after the first load.
- **Audits:** `npm audit` reports 43 vulnerabilities, all in transitive dev/build dependencies (e.g. `braces`, `chokidar`, `tailwindcss`, `vite`, `vitest`, `tinypool`) at install time; none are production runtime advisories reachable by this local-only app. Re-run `npm audit`/`npm audit fix` before shipping if you change dependencies.
- **XSS:** TipTap editor output is sanitized with DOMPurify (`src/lib/html.ts`) before storage/rendering; date navigation is strictly validated as `YYYY-MM-DD`.

## Security notes
- **CSP** is injected at build time by `polaris-strict-csp` (`vite.config.ts`) as a `<meta http-equiv="Content-Security-Policy">`. `frame-ancestors` cannot be enforced via meta and is intentionally omitted; if you host Polaris, set `frame-ancestors 'none'` in your server headers.
- **Service worker** registered from `/sw.js`; scope `/`. Navigation fallback to `index.html`.
- **Fonts** are local (`@fontsource` Inter / Cormorant Garamond / Caveat) — no Google Fonts requests.
- **Background image** (`public/bg.png`) is byte-identical to the reference `polar-bg.png` and is never replaced or dimmed by the app (SHA-256 `A60DBEFE97E6106119016444585A08DC8539C9E585075910728D1EDBB80E7676`, 2,279,773 bytes). Readability relies on frosted glass panels only.

## Project structure

```
src/
  main.tsx, App.tsx, index.css, vite-env.d.ts, sw.ts
  components/   Icons, Logo, Shell, Sidebar, TopBar, SearchPalette, LockScreen,
                SetupScreen, Modal, MoodPicker, Editor, Polaroid, PhotoPickerModal,
                CalendarGrid
  context/      ThemeContext, AuthContext, DataContext
  lib/          types, crypto, date, db, html, photo, backup
  pages/        JournalPage, CalendarPage, WallPage, InsightsPage, SettingsPage
  test/         crypto.test.ts, date.test.ts
public/
  bg.png, pwa-192.png, pwa-512.png, manifest (generated by VitePWA)
scripts/
  qa-smoke.mjs      (automated Playwright smoke tests; requires Edge)
```

Routes: `/` (today), `/journal/:date`, `/calendar`, `/wall`, `/insights`, `/settings`.

## QA

A Playwright smoke test (`scripts/qa-smoke.mjs`, runs against `npm run preview -- --port 4173` with Microsoft Edge) exercises: setup, title/mood/rich-text entry, photo upload, autosave, calendar/wall/insights/settings navigation, wrong-passphrase rejection, passphrase change/re-encryption, encrypted backup export/import, IndexedDB ciphertext inspection, CSP/SW/manifest checks, mobile layout, and light/dark theme toggling. The run passed with no console/page errors and screenshots saved to `C:/Users/HP/AppData/Local/Temp/opencode/polaris-qa/`.

```
npm run preview -- --port 4173 --strictPort
node scripts/qa-smoke.mjs
```

## Decisions / caveats
- Project folder is `Polaris` (capital P), not lowercase `polaris`.
- The build path contains an apostrophe (`E:/Adi's Work/Coding/Polaris`), which broke Workbox `generateSW` imports; switched to `injectManifest` (`src/sw.ts`, 5 MB file cap so `bg.png` caches).
- TipTap’s `Mod+K` link shortcut is overridden so global `Ctrl/Cmd+K` search wins.
- No fake/sample data anywhere; dates are real, not seeded.
- TypeScript 5.x `Uint8Array<ArrayBuffer>` typing is used intentionally for Web Crypto values.

## License

Private project — no license file included by default.