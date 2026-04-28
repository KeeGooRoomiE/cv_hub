# Changelog

All notable changes to CV Hub are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/).

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
