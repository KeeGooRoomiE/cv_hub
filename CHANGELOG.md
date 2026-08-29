# Changelog

All notable changes to CV Hub are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/).

---

## [1.6.0] — 2026-08-26

### Added
- JSON-LD `schema.org/Person` markup on CV/profile pages — name, job title, summary, email and `sameAs` links (GitHub/LinkedIn/Habr/etc. from `contacts`), `knowsAbout` from skills. Built from data the page already parses, no new schema
- `hreflang` alternate tags, reusing the same data that drives the language switcher — CV pages, showcase list and case studies (each scoped to the languages that actually have content); skipped on `noindex`'d pages and on the changelog, which doesn't have a real per-language build
- `noindex` on the 404 page
- Custom domain support — `SITE_URL` / `BASE_PATH` env overrides in `astro.config.mjs`, layered on top of the `GITHUB_REPOSITORY`-derived defaults (`{owner}.github.io` / `/{repo}`). Combined with a `public/CNAME` file, a fork can serve from its own domain instead of the default project-page URL
- `npm run init` — one-time onboarding script for a fresh fork. Backs up and clears the repo's own CV, showcase and case-study data (multi-profile reset to a single default) and reseeds it from `docs/examples/*`, so a new user edits a blank placeholder instead of someone else's resume. Interactive prompts for name/title/language, `--dry-run` to preview, `--force` to re-run, no new dependencies (`node:readline/promises`)
- ATS-safe PDF resume — `resume:pdf` now renders a second, single-column PDF (`resume_{lang}[_{spec}]_ats.pdf`) alongside the existing two-column one, from the same CV data. The flagship two-column layout risks scrambled text on ATS parsers that read multi-column pages left-to-right across both columns; the new variant is plain Arial/Helvetica, standard section headings, contacts in the body flow, no icons — reading order in the file matches visual order top to bottom. Linked as a fourth "ATS PDF" download button next to PDF/DOCX/TXT
- Automated OG-image pipeline — `src/scripts/generate-og-image.mjs` screenshots one dedicated `/og-preview/{lang}` route per configured language through Playwright and composites each into a framed, wallpapered 1200×630 card, matching the active theme's own design tokens. Each screenshot renders the real default-profile CV (`public/cv/{lang}.yaml` — same data the site itself shows), not mock data — every page picks the matching-language image automatically via `Layout.astro`, so a `/devops`, `/gamedev` or case-study page reuses the same-language default-profile card instead of a dedicated screenshot per page. Supports `--theme=<name>` (falls back to the default look if unknown) and `--wallpaper=gradient|<image path>`. Runs as the last stage of `npm run build` and in CI (`deploy.yml`, `ci.yml`); images are regenerated every build and never committed to git
- Case-study video block now embeds YouTube — a `src` pointing at `youtube.com/watch`, `youtu.be` or `youtube.com/embed` renders a responsive 16:9 iframe instead of a local `<video>` tag, so a gameplay trailer or clip can be linked directly without hosting an mp4
- New `code` content block (`type: code`) — a verbatim monospace block for terminal commands and short snippets, no syntax-highlighting engine by design
- Any content block (`text`, `image`, `video`, `code`) now accepts `anchor: "id"` for deep-linking into a specific section, e.g. `/showcase/{slug}#quickstart` — accounts for the sticky header so the target isn't hidden underneath it
- Backtick-quoted spans in block prose (`title`, `subtitle`, `body`, `bullets`, `caption`) now render as styled inline code instead of literal backtick characters, via a shared `InlineText` component — fixes existing case studies that already used backticks to mention file names and identifiers
- `/quickstart` and `/get-started` — two short, memorable redirects to the CV Hub quickstart section, meant to replace a bare GitHub repo link in release announcements
- Showcase card featured media now supports an autoplaying, looping `type: video` cover — a lighter drop-in replacement for a heavy animated GIF (silent, muted, no controls)

### Changed
- Upgraded to **Astro 7** (from 5) — brings Vite 8 and closes every outstanding npm advisory; `npm audit` now reports **0 vulnerabilities**, down from 15
- Content collections migrated to the Astro **Content Layer** — `src/content/config.ts` replaced by `src/content.config.ts`, with each collection switched from the removed `type: 'data'` to an explicit `glob()` loader. Rendered output is byte-identical: all 20 pages verified against the Astro 5 build with no content differences
- **Node 24 is now required** to build locally, matching `.nvmrc`, `package.json` `engines` and the CI runner — Astro 7 dropped support for Node 20

### Fixed
- `og:image`/`twitter:image` pointed at the wrong URL on every page — the meta tag never included `base`, so on the deployed project-page site it resolved to `{owner}.github.io/media/og-image.png` instead of `{owner}.github.io/cv_hub/media/og-image.png` and 404'd. Link/social previews have been showing no image because of this
- Canonical, OG and Twitter meta URLs had a literal double slash on every page (`https://…github.io//cv_hub/…`) — `siteUrl` already carried a trailing slash and every consumer added its own leading one. `Layout.astro` now derives `siteUrl` from Astro's own `Astro.site` (which `SITE_URL`/`BASE_PATH` also flow through) instead of hand-rolling it from `GITHUB_REPOSITORY`
- Footer credit (`GitHub` link, "Alexander Gusarov" byline URL) was hardcoded to the original repo — now derived from `GITHUB_REPOSITORY`, same as `siteUrl` already was, so a fork's footer points at itself
- CI: Telegram deploy notification no longer misreports a cancelled run as a failed build — `deploy.yml` now skips the notification entirely when `concurrency: cancel-in-progress` supersedes a run, instead of sending a false "Build failed!"
- 404 page rendered a doubled `<html>`/`<head>`/`<body>` document — it wrapped its own scaffold around `<Layout>`, which already renders a full document — so the page was missing the site header/nav/footer and carried two competing `<title>` tags. Now renders through `<Layout>` like every other page
- i18n: the `notfound404` translation block existed in `translations.yaml` but was missing from the content schema, so it was silently stripped on load — the 404 page's title now actually resolves instead of falling through
- Favicon — `favicon.ico`/`favicon.svg` were committed but never linked from `<head>`, and the browser's passive fallback missed them entirely under the GitHub Pages base path (`/cv_hub/`) — added explicit `<link rel="icon">`, base-path aware
- Case-study hero image (the first `image` block on a Deep Dive page, usually the cover shot under the title) now loads eagerly with `fetchpriority="high"` instead of lazy — same LCP treatment the showcase grid's first card already had
- Case-study images now reserve a 16:9 aspect ratio before loading instead of collapsing to zero height, preventing layout shift as they load in
- Every page previously shared one generic meta description and OG image regardless of content — case studies now use their own `tagline`, CV pages their `summary`, changelog its own subtitle
- Case-study and changelog `<title>` now carry the "— CV Hub" suffix, matching how CV/profile pages already read in a browser tab or search result
- `resume-import-json.mjs` and `resume-import-linkedin.mjs` printed a usage message pointing at npm scripts that don't exist (`npm run convert`, `npm run parse`) — now reference the real `resume:import`/`resume:linkedin` commands
- `resume-import-linkedin.mjs` wrote its JSON output to `docs/` instead of `public/downloads/json/`, contradicting its own doc comment and the sibling import script's convention, and risking collision with the example input files `README.md` documents at that same `docs/` path

### Removed
- `public/themes/*.css` untracked from git — it's a mechanical copy of `src/styles/themes/*.css` regenerated on every dev/build (`astro.config.mjs`'s `copy-themes` plugin), not a source file; committing it separately from its source risked the two drifting out of sync
- ~5.1 MB of orphaned media — stale cover-image variants no longer referenced by any showcase or case-study YAML, plus a duplicate `diceroll/` media folder left over from a prior rename (only `apple-watch-diceroll` is a real slug)

---

## [1.5.5] — 2026-08-26

### Added
- Case-study video block — `type: video` content block, either a silent autoplay loop (short clips) or poster + controls (longer clips)
- CI workflow (`ci.yml`) — pull requests now run the full generation pipeline (merge → DOCX/TXT → PDF → Astro build) and upload the generated resumes and site as downloadable artifacts, so a broken build or malformed YAML is caught before it reaches `main`
- Release workflow (`release.yml`) — publishing a GitHub Release regenerates the resume documents and attaches all PDF/DOCX/TXT files to it, making every version a self-contained CV snapshot
- Dependabot — weekly grouped npm updates and monthly GitHub Actions updates; every update PR is verified by the CI pipeline instead of being merged blind
- Node version pinned via `.nvmrc` and `package.json` `engines` (>=24), matching the CI runner

### Changed
- CI: GitHub Actions runner upgraded to Node 24
- `package.json` version synced to the changelog version (was stuck at `0.0.1` while the project shipped 1.5.x)
- CI: the deploy build step split into named per-stage steps (merge / DOCX+TXT / PDF / Astro) — same runner and cost, but the Actions UI now shows per-stage timing and points at the exact stage that failed
- CI: PDF export now drives the runner's preinstalled Google Chrome (`channel: 'chrome'`) instead of downloading Playwright's chromium — removes the `cdn.playwright.dev` download that was stalling and hanging deploys; the Playwright browser-cache step was dropped. Local builds still use Playwright's bundled chromium
- Responsive breakpoints consolidated from seven ad-hoc values to two — `768px` (desktop/mobile base: header, fonts, paddings, animated background) and `960px` (multi-column CV and showcase grids); mobile container side padding tightened

### Fixed
- PDF export now HTML-escapes all interpolated CV data (company names, bullets, contacts, skills) — a stray `<` or `&` in a field no longer breaks or injects into the generated PDF
- Mobile header — the Role dropdown button rendered larger than the nav links (16px vs 14px, wider padding) because a later `.dropdown__trigger { font: inherit }` overrode the mobile rule; the mobile rule's specificity was raised so the button now matches the links

### Removed
- Two unused dependencies — `hast-util-parse-selector` and `serve` were not imported or referenced by any script

---
## [1.5.4] — 2026-06-12

### Added
- Click-to-zoom lightbox for case-study images — clicking any Deep Dive image opens it fullscreen; close via backdrop click, close button or Escape
- SEO: `sitemap.xml` (via `@astrojs/sitemap`, covers all profile × language routes) and `robots.txt` pointing to it
- `merge.mjs` validates the profile `slug === spec` invariant and fails fast with a clear message, preventing silent desync between a profile's URL and its CV/download files

### Changed
- Tags de-emphasized — removed borders and muted text on Platforms/Stack/Tags pills so the identical-looking groups stop competing for attention and section hierarchy reads clearer (lead designer feedback)
- CI: Telegram notification now passes secrets and context through an `env` block instead of inline `${{ }}` interpolation in the shell script

### Fixed
- Removed hover-lift from passive cards (Experience and others) — the global `.card:hover` translate/shadow was a false affordance on non-clickable cards; hover now stays only on interactive showcase project cards (lead designer feedback)
- AnimatedBackground performance — reduced orb blur (80px → 60px), slowed drift cycles to 16–22s and removed `scale()` from keyframes so the blurred layer is cached instead of re-rasterized every frame; cuts desktop scroll/idle jank
- Showcase LCP — first card with an actual image cover now loads `eager` with `fetchpriority="high"`; remaining covers stay lazy
- Role dropdown accessibility — added `aria-haspopup`, `aria-controls` and `aria-expanded` synced with open state; removed a stray always-true `active` class on the trigger
- i18n: showcase card labels (Platforms/Stack/Tags/Featured) on non-default-language lists no longer fall back to English literals — a stray `[lang]` index on an already-resolved string was dropping the real translations; now correctly localized and ready for additional languages
- Build robustness: home page now guards a missing merged CV artifact with a fallback instead of crashing the build (matches the dynamic profile route)

### Removed
- Dead code in the dynamic showcase route — unused featured/regular/archived split, leftover CSS classes and a stray `...` token in the card markup

---
## [1.5.3] — 2026-04-26

### Added
- `PlayStationWaves.astro` — XMB-inspired filled sine-wave canvas background; configurable via props (wave count, speed, amplitude, color, opacity, background gradient, draw quality); time-of-day hue shift; non-deterministic start via `Date.now()` offset
- `WaveLines.astro` — XMB-style glowing stroke wave lines canvas background; symmetric line arrangement around center Y; per-line glow via offscreen canvas compositing; same prop/config system
- GitHub Actions Telegram notification — `deploy.yml` notifies a Telegram bot on deploy success/failure via `PIPLINE_BOT_SECRET` and `CHAT_ID` secrets; gracefully skips if secrets are not configured
- CI: Playwright Chromium cached by `package-lock.json` hash — saves ~2 min per deploy on cache hit
- `LICENSE` — MIT license added to repository
- `ARCHITECTURE.md` — root-level architecture overview: stack, data pipeline, routing, theming, background components, CI/CD, key trade-offs
- `CHANGELOG.md` — this file; root-level changelog in Keep a Changelog format covering full version history from 1.0.0

### Fixed
- `WaveLines` glow compositing bug — original `destination-in` mask was applied to the full canvas each iteration, progressively destroying background alpha at edges; fixed by isolating each line's glow on a dedicated offscreen canvas
- Telegram notification now covers build failures — `notify_telegram` uses `needs: [build, deploy]` with `if: always()` so a failed build also triggers notification; message extended with branch name and short commit SHA
- Sticky header now works unconditionally — `html, body { height: 100% }` constrained body to viewport height, causing scroll to happen on `<html>` and making `position: sticky` ineffective; changed to `html { height: 100% }` / `body { min-height: 100% }`
- Role dropdown — replaced CSS `:hover` toggle with JS click-toggle and click-outside to close; menu no longer closes on accidental cursor exit; added smooth opacity/transform transition
- Scroll jank — body `background-attachment: fixed` replaced with a fixed pseudo-element layer; gradients no longer repaint on every scroll frame
- Removed `mix-blend-mode: overlay` from the scanline noise layer — eliminated a fullscreen compositing pass per frame with no visible difference at 0.06 opacity

---

## [1.5.2] — 2026-04-05

### Added
- Share button for case study pages (`shareable: true` in YAML, added to example_cs)

### Changed
- ProjectCard translation props — simplified from object-based to direct strings

### Fixed
- Mobile pages performance — removed unnecessary CSS rules
- Language switcher on showcase pages now correctly switches between project translations

---

## [1.5.1] — 2026-04-02

### Fixed
- Language switcher on Showcase list now correctly switches language instead of redirecting to home
- Language switcher on Case Study pages now correctly switches language of the current project
- Back button and Showcase nav link now preserve current language across navigation
- Project card links now respect BASE_URL — no more hardcoded `/cv_hub/` prefix required in YAML
- ProjectPage mobile layout — horizontal padding now correctly applied on small screens
- Showcase slug setup for other languages was incorrect for projects with `archived` and `featured` flags

---

## [1.5.0] — 2026-03-31

### Added
- Case Study pages — dedicated per-project pages with flexible content structure
- Block-based content system (`image`, `text`, `divider`, `links`) for project storytelling
- Projects can now include full narratives — architecture, decisions, and outcomes
- Showcase extended with deep-dive pages (Notion-like but static and controlled)
- Per-project routing for case studies

### Changed
- Showcase transformed from preview-only to entry point for detailed project pages

---

## [1.4.1] — 2026-03-29

### Changed
- Showcase style fixes
- Error page 404 works correctly now, fallbacks to main page with default language
- Dropdown styles moved from `/changelog` to `global.css`
- Fixed linking in footer menu in Layout

---

## [1.4.0] — 2026-03-12

### Added
- Multi-profile system — N profiles × N languages from one YAML source
- `merge.mjs` — YAML merge pipeline with base + spec delta model
- `profiles.yml` — profile registry (optional, graceful fallback)
- `languages.yml` — language config, dynamic language switcher
- i18n system — `translations.yaml` + `makeT()` helper with fallback chain
- Profile dropdown in header (Role ▾)
- `[...slug].astro` — dynamic routing for all profile × language combos
- Per-profile PDF/DOCX/TXT generation for all profiles and languages

### Changed
- `generate-resume.js` and `resume-export-pdf.mjs` now iterate `public/cv/` dynamically
- Download links now point to profile-specific files (`resume_en_devops.pdf`)

### Removed
- `ru.astro` and `showcase/ru.astro` — replaced by `[...slug].astro`

---

## [1.3.1] — 2026-03-11

### Added
- README, ENGINEERING.md and INFO.md fully updated to reflect new architecture

### Changed
- `siteUrl` resolved dynamically from `GITHUB_REPOSITORY` — forks work without config
- Dropdown styles moved to `global.css`

---

## [1.3.0] — 2026-03-06

### Added
- URL-based theme switching (`?theme=peachy`)
- OG tags and Twitter Card meta
- Animated background (`AnimatedBackground.astro`)
- Lighthouse badges in README (100/100/96/100)
- Changelog page with version history

---

## [1.2.0] — 2026-03-05

### Added
- Projects pin & archive options

### Changed
- Style and structure updates
- Documentation updated
- DOM tree and CSS structure refactor

### Fixed
- Mobile layout fixes
- Index page fix

---

## [1.1.0] — 2026-03-04

### Added
- Automated PDF generation via Playwright
- New theme presets
- Theme previews in docs

---

## [1.0.0] — 2026-03-03

### Added
- Initial release — YAML-driven CV site
- Two languages (EN/RU)
- Export to PDF, DOCX, TXT
- GitHub Actions CI/CD deploy
