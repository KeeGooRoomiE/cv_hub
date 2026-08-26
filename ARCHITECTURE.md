# Architecture

> Full engineering notes — [docs/ENGINEERING.md](docs/ENGINEERING.md)

CV Hub — статический сайт-резюме, построенный как инженерная система.
Основной принцип: **Resume as Code** — резюме версионируемо, воспроизводимо и независимо от платформ.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro | Static-first, zero client-JS by default, predictable build output |
| Data | YAML | Human-readable single source of truth, easy to diff and version |
| Deploy | GitHub Pages + Actions | Free, immutable builds, no runtime server |
| Styles | Plain CSS + custom properties | No build overhead, theme switching via one token file |
| Docs | DOCX / PDF / TXT | Generated from YAML at build time via docx.js (DOCX/TXT) and Playwright (PDF) |

---

## Folder structure

```
cv_hub/
├── src/
│   ├── components/       # Astro UI components
│   ├── content/          # YAML sources (cv, changelog, i18n, config)
│   ├── pages/            # File-based routing
│   ├── scripts/          # i18n helper, merge pipeline
│   └── styles/           # global.css + theme overrides
├── public/
│   ├── cv/               # Merged YAML artifacts (output of merge.mjs)
│   ├── media/projects/   # Project assets + case study YAML
│   └── themes/           # CSS theme files
├── docs/                 # Engineering and setup notes
└── scripts/              # Build-time scripts (merge, generate, pdf)
```

---

## Data pipeline

```
src/content/cv/{lang}.yaml         ← base CV
src/content/cv/{lang}_{spec}.yaml  ← spec delta (only overrides)
          +
     merge.mjs
          ↓
  public/cv/{lang}.yaml
  public/cv/{lang}_{spec}.yaml
          ↓
    ┌─────┴──────────────────────────┐
    ↓                                ↓
generate-resume.js             astro build
resume-export-pdf.mjs
    ↓                                ↓
DOCX / TXT / PDF              static site
```

Merge rules: scalars — spec wins; `experience` — whitelist by `company` key; arrays — spec wins whole block if present.

---

## Multi-profile system

N profiles × N languages from one YAML source.

```
en.yaml          ← full base resume
en_devops.yaml   ← DevOps delta (only what changes)
en_gamedev.yaml  ← GameDev delta
```

Adding a new profile: create a delta YAML → `merge.mjs` picks it up automatically → documents generated, routes built, download links updated. No code changes required.

**Invariant:** a profile's `slug` (routing/URL) must equal its `spec` (CV-file and download key). `merge.mjs` enforces this with a fail-fast guard, so a profile's page can never silently desync from its CV and downloads.

---

## Routing

```
/                        → default profile, default lang
/{lang}                  → default profile, other lang
/{profile}               → named profile, default lang
/{profile}/{lang}        → named profile, named lang
/showcase                → project grid
/showcase/{slug}         → case study (default lang)
/showcase/{slug}/{lang}  → case study (other lang)
/changelog               → version history
```

Language and profile are URL state — no cookies, no localStorage. Shareable, SEO-correct, zero JS dependency.

---

## Theming

Themes are CSS files that override `:root` custom properties from `global.css`.
Activated via `?theme=name` URL parameter — no JS storage, fully shareable as a link.

```
/cv_hub/?theme=frosted    ← frosted glass theme
/cv_hub/?theme=nordic     ← Nordic dark theme
```

---

## Background components

Interchangeable canvas/CSS backgrounds. Drop any one into `Layout.astro`:

| Component | Type | Notes |
|---|---|---|
| `AnimatedBackground` | CSS only | Blur orbs, no JS, disabled on mobile |
| `GalaxyBackground` | Canvas RAF | Spiral galaxy with mouse parallax |
| `PlayStationWaves` | Canvas RAF | XMB-style filled sine waves, time-of-day hue |
| `WaveLines` | Canvas RAF | XMB-style glowing stroke lines, offscreen glow compositing |

All respect `prefers-reduced-motion`: draw one static frame, cancel RAF.

---

## CI/CD

Three workflows, one shared pipeline:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | pull request | Full generation pipeline + uploads generated resumes and site as artifacts. Never deploys. |
| `deploy.yml` | push to `main` | Same pipeline → GitHub Pages → Telegram notification |
| `release.yml` | release published | Regenerates documents and attaches PDF/DOCX/TXT to the release (skips `astro build` — a release only needs the documents) |

The four pipeline stages run as separate named steps rather than one opaque `npm run build`, so the Actions UI shows per-stage timing and the exact failure point.

```
push → main  (runner: Node 24)
  ↓
npm ci
verify chrome   (runner's preinstalled Google Chrome — no browser download)
  ↓
npm run build
  ├── cv:build          → public/cv/*.yaml
  ├── resume:generate   → DOCX + TXT
  ├── resume:pdf        → PDF via Playwright (drives system Chrome on CI)
  └── astro build       → static site + sitemap-index.xml
  ↓
GitHub Pages deploy
  ↓
notify_telegram  (always; success / build-fail / deploy-fail)
```

The Telegram step passes secrets and context through an `env:` block (never inline `${{ }}` in shell) and skips silently if secrets are absent. Workflow: `.github/workflows/deploy.yml`.

**PDF browser strategy:** PDF export uses Playwright's Node API, but the browser binary differs by environment. On CI it drives the runner's **preinstalled Google Chrome** (`channel: 'chrome'`, gated on `process.env.CI`) — no browser is downloaded, which avoids `cdn.playwright.dev` download stalls that were hanging deploys. Local builds use Playwright's bundled chromium. See `src/scripts/resume-export-pdf.mjs`.

---

## SEO

- `@astrojs/sitemap` generates `sitemap-index.xml` at build time, covering every profile × language route.
- `public/robots.txt` allows all and points to the sitemap.
- Per-page canonical, Open Graph and Twitter Card meta are built in `Layout.astro`, language-aware via `og:locale`.

---

## Lighthouse (production)

| Metric | Score |
|---|---|
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 96 |
| SEO | 100 |

Best Practices 96 — CSP headers not configurable on GitHub Pages without a proxy server.

---

## Key trade-offs

| Decision | Rationale |
|---|---|
| No CMS | Full control over data shape and build process |
| No SSR | Static output is sufficient; no dynamic data needed |
| Lang in URL, not cookies | SEO-correct, explicit state, no JS dependency |
| Case study YAML in `public/` | Lives next to assets; avoids Astro content collection schema for free-form content |
| Manual delta files | Explicit over magic; easy to audit what changed per profile |
