<!--
  INFO.md
  CV Hub

  Created by Alexander Gusarov on 03.03.2026.
  @spartan121
-->

# CV Hub — Project Info

## Overview

CV Hub is a static, data-driven personal professional website built with Astro.

The project replaces traditional resume formats and no-code builders (e.g. Tilda)
with a version-controlled, extensible and automation-friendly solution.

It provides:
- A main CV page
- A Showcase page with projects and case studies
- Multi-language support (RU / EN)
- Downloadable resume formats (PDF / DOCX / TXT — generated from YAML at build time)

The core idea: **Single Source of Truth via YAML.**

---

## Goals

1. Maintain resume content in structured YAML format
2. Render website pages directly from structured data
3. Enable automatic generation of downloadable resume files
4. Keep the architecture minimal (2 pages only)
5. Make it easy to extend and fork for other developers

---

## Architecture

### Tech Stack

- Astro (static site generator)
- YAML content collections
- Token-based CSS with theme support
- GitHub Pages for deployment
- GitHub Actions for CI/CD

---

## Project Structure

```
src/
  content/
    cv/
      en.yaml              ← CV data (English)
      ru.yaml              ← CV data (Russian)
    showcase/
      projects.yaml        ← Projects list
    config.ts              ← Astro content collection schemas
  pages/
    index.astro            ← Main CV page (EN)
    ru.astro               ← Main CV page (RU)
    showcase/
      index.astro          ← Projects showcase page (EN)
      ru.astro             ← Projects showcase page (RU)
  components/
    Layout.astro           ← Shared layout: header, AnimatedBackground, <slot>
    HomePage.astro         ← Main page blocks (reorderable)
    ProjectCard.astro      ← Project card: normal + archived (collapse) modes
    AnimatedBackground.astro ← CSS-only animated orb background
  scripts/
    resume-export-pdf.mjs  ← PDF generator via Playwright
    resume-import-json.mjs ← JSON Resume → YAML converter
    resume-import-linkedin.mjs ← LinkedIn PDF → YAML parser (best-effort)
    resume.schema.json     ← JSON Resume validation schema
  styles/
    global.css             ← All site styles + design tokens (:root)
    themes/
      frosted.css          ← Frosted glass dark theme
      light.css            ← Light theme
      nordic.css           ← Nord-inspired cold blue theme
      peachy.css           ← Warm peach light theme
public/
  media/
    projects/              ← Showcase media files
      project-slug/        ← One folder per project
  downloads/               ← Generated resume files (after build)
    json/                  ← JSON Resume exports
  favicon.ico
  favicon.svg
.github/
  scripts/
    generate-resume.js     ← DOCX + TXT generator
  workflows/
    deploy.yml             ← CI/CD pipeline
  ISSUE_TEMPLATE/
  FUNDING.yml
docs/
  INFO.md                  ← This file
  ENGINEERING.md           ← Architecture decisions and philosophy
  BKG_INFO.md              ← AnimatedBackground component docs
  llm-resume-guide.md      ← How to generate YAML from resume via LLM
  examples/
    example_cv.yaml        ← Full YAML example with all supported fields
    example_cv.json        ← JSON Resume format example
  repo-assets/             ← README images and release docs
```

---

## Data Flow

```
src/content/cv/en.yaml
src/content/cv/ru.yaml
        │
        ├── Astro Content Collection
        │         │
        │         └── Page → Component → Static HTML
        │
        ├── .github/scripts/generate-resume.js
        │         │
        │         ├── public/downloads/resume_en.docx
        │         ├── public/downloads/resume_ru.docx
        │         ├── public/downloads/resume_en.txt
        │         └── public/downloads/resume_ru.txt
        │
        └── src/scripts/resume-export-pdf.mjs
                  │
                  ├── public/downloads/resume_en.pdf
                  └── public/downloads/resume_ru.pdf
```

Build order: `resume:generate` → `resume:pdf` → `astro build`

---

## YAML Reference — `cv/en.yaml`

Full field reference with examples.

```yaml
name: "Alexander Gusarov"
title: "Software Engineer | DevOps"
summary: >
  Multidisciplinary Software Engineer with 10+ years of experience.
  Covers the full development cycle: architecture, code, APIs, CI/CD.

contacts:
  - label: Email
    url: mailto:you@example.com
  - label: GitHub
    url: https://github.com/yourhandle
  - label: Telegram
    url: https://t.me/yourhandle
  - label: LinkedIn
    url: https://linkedin.com/in/yourhandle

achievements:
  - Project X — 1M+ downloads
  - Top Rated Plus on Upwork — top 5% of performers

skills:
  - group: "Languages"
    items: [Go, Python, TypeScript]
  - group: "DevOps & Infrastructure"
    items: [Kubernetes, Docker, Terraform, Ansible]
  - group: "Cloud"
    items: [AWS (EC2, S3, VPC, IAM)]
  - group: "Databases"
    items: [PostgreSQL, Redis, MySQL]

experience:
  - company: "Company Name"
    role: "DevOps Engineer"
    period: "Jan 2024 — present"
    description:
      - Administered production Kubernetes clusters
      - Built CI/CD pipelines with GitHub Actions
      - Automated provisioning of 100+ servers with Ansible
    stack: [Kubernetes, Docker, Ansible, GitHub Actions]

education:
  - institution: "University Name"
    degree: "Computer Science"
    period: "2017–2021"

languages:
  - language: English
    level: Professional working proficiency
  - language: Russian
    level: Native
```

### Field notes

- All top-level fields are optional — missing fields are simply not rendered
- `summary` supports multi-line YAML block scalar (`>`)
- `contacts` — `url` for email must start with `mailto:`
- `skills` — `group` is the category label; `items` is a flat list
- `experience.description` — list of strings, rendered as bullets
- `experience.stack` — rendered as tags below the description

---

## YAML Reference — `showcase/projects.yaml`

```yaml
projects:
  - name: "Project Name"
    slug: "project-name"
    order: 1
    featured: true          # ← shows in Featured section (top of showcase)
    archived: false         # ← collapses into spoiler row (bottom of showcase)
    role: "DevOps Engineer"
    year: "2024"
    description: "Short project summary."
    theme: "blue"
    accent: "#3b82f6"       # ← HEX override, takes priority over theme
    platforms: [Linux, Web]
    stack: [Go, Docker, Kubernetes]
    tags: [devops, infrastructure]
    metrics:
      - label: "Deploy time"
        value: "8m → 2m"
    links:
      - label: "GitHub"
        url: https://github.com/yourhandle/project
        type: repo
      - label: "Live"
        url: https://example.com
        type: demo
    media:
      - type: image
        src: /media/projects/project-name/cover.jpg
        alt: "Project screenshot"
        featured: true       # ← which media item to show first
```

### Field notes

- `order` — numeric sort priority (lower = shown first; missing = last)
- `featured: true` — placed in Featured section at top of showcase
- `archived: true` — card collapses into a single summary row; expands on click. Shows only: name, role, year, platforms in collapsed state
- If both `featured` and `archived` are true — `featured` wins, card shown normally
- `theme` — predefined CSS class: `blue`, `purple`, `amber`, `emerald`, `red`, `slate`, `auto`
- `accent` — HEX color, overrides `theme` entirely
- `links.type` — semantic only (`repo`, `demo`, `store`, `article`)
- `media.src` — path relative to `/public`
- Broken media files are automatically removed from rendering via `onerror`

### Showcase sections

Projects are split into three visual groups by `ProjectCard.astro` and `showcase/index.astro`:

```
Featured   ← featured: true              full cards, shown first
           ← no flags                    full cards, shown after featured
Archive    ← archived: true              collapsed rows, expand on click
```

Filtering logic in `showcase/index.astro`:

```js
const featured = projects.filter(p => p.featured && !p.archived);
const regular  = projects.filter(p => !p.featured && !p.archived);
const archived = projects.filter(p => p.archived);
```

---

## Themes

All styles use CSS custom properties defined in `:root` in `global.css`.
To switch themes, import a theme file in `src/components/Layout.astro`:

```js
import '../styles/themes/nordic.css';
```

Available themes in `src/styles/themes/`:

| File | Description |
|---|---|
| `frosted.css` | Dark glass, muted tones |
| `light.css` | Light background, dark cards |
| `nordic.css` | Nord-inspired, cold blue-grey |
| `peachy.css` | Warm peach, light background |

To create a custom theme — create a new CSS file and override only the `:root` tokens.
All available tokens are listed with comments at the top of `global.css`.

Key tokens that affect the entire site:

```css
:root {
  --bg              /* page background */
  --bg-glow-1       /* radial glow top-left on body */
  --bg-glow-2       /* radial glow top-right on body */
  --text            /* primary text */
  --text-strong     /* headings and bold text */
  --muted           /* secondary / dimmed text */
  --border          /* card and element borders */
  --border-2        /* active / hover borders */
  --accent          /* primary accent color */
  --accent-2        /* secondary accent */
  --accent-rgb      /* accent in RGB for rgba() usage */
  --accent-2-rgb    /* secondary accent in RGB */
  --brand-grad      /* header logo gradient */
  --card-bg         /* card background gradient */
  --shadow          /* card hover shadow */
  --shadow-soft     /* card resting shadow */
  --r-lg            /* card border radius */
  --r-pill          /* pill / tag border radius */
  --header-bg       /* header background (with opacity) */
  --t               /* transition shorthand */
  --ring            /* focus ring */
}
```

---

## Animated Background

`AnimatedBackground.astro` replaces the static radial gradients on `body`.

It renders 4 CSS-animated glowing orbs that drift and pulse independently.
Colors are pulled from `--accent-rgb` and `--accent-2-rgb` — theme-aware automatically.
No JavaScript. Respects `prefers-reduced-motion`.

Included in `Layout.astro` by default.
See `docs/BKG_INFO.md` for tuning options (size, speed, opacity, blur).

---

## Home Page Layout — How to Reorder Blocks

The main page is assembled via `src/components/HomePage.astro`.

### Two-column layout (desktop)

- Left column — `aside.sidebar`: Download buttons, Skills
- Right column — `main.main-content`: Hero, Achievements, Experience

### Mobile order

On screens under 960px, columns dissolve via `display: contents`
and blocks stack in this fixed order (controlled by CSS `order`):

```
1. Download
2. Hero (name + summary + contacts)
3. Achievements
4. Experience
5. Skills
```

To adjust mobile order — edit `order` values in `global.css` under `@media (max-width: 959px)`.
To adjust desktop order — move `<article>` / `<section>` blocks within `HomePage.astro`.

---

## CLI Reference

```bash
npm run dev                  # local dev server → http://localhost:4321
npm run build                # generate resume files + build site
npm run resume:generate      # DOCX + TXT from YAML
npm run resume:pdf           # PDF from YAML via Playwright
npm run resume:import        # JSON Resume → YAML (single file)
npm run resume:import:all    # convert docs/cv_en.json and docs/cv_ru.json
npm run resume:linkedin      # LinkedIn PDF → YAML (best-effort)
```

---

## Why This Approach

Traditional resume formats create duplication:
- Website version
- PDF version
- DOC version
- LinkedIn version

CV Hub centralizes everything into one YAML file, reduces duplication,
enables automation, and keeps you independent from any platform.

---

## Philosophy

Treat your resume as infrastructure.

Version-controlled.
Composable.
Automatable.
Portable.

This repository is designed to be forked and adapted by any specialist
who wants full control over their professional presentation.

---

## License

Source code: MIT  
Content (resume data): © Author