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
| Docs | DOCX / PDF / TXT | Generated from YAML at build time via Playwright + docx.js |

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

```
push → main
  ↓
npm ci
playwright install chromium
  ↓
npm run build
  ├── cv:build          → public/cv/*.yaml
  ├── resume:generate   → DOCX + TXT
  ├── resume:pdf        → PDF via Playwright
  └── astro build       → static site
  ↓
GitHub Pages deploy
```

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
