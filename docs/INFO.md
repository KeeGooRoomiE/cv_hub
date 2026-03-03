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
- Minimal CSS with CSS variables (token-based)
- GitHub Pages for deployment
- GitHub Actions for CI/CD

---

## Project Structure

```
src/
  content/
    cv/
      en.yaml
      ru.yaml
    showcase/
      projects.yaml
  pages/
    index.astro        # Main CV page (EN)
    ru.astro           # Main CV page (RU)
    showcase.astro     # Projects showcase page (EN)
    showcase/ru.astro  # Projects showcase page (RU)
  components/
    Layout.astro       # Shared layout (header + <main>)
    Header.astro       # Header (logo, navigation, language switcher)
    HomePage.astro     # Main page markup (blocks can be reordered)
public/
  styles/
    global.css         # All site styles
  downloads/           # Generated resume files (PDF / DOCX / TXT)
scripts/
  generate-resume.js   # DOCX + TXT generator (runs before astro build)
docs/
  INFO.md
  ENGINEERING.md
  llm-resume-guide.md
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
        └── scripts/generate-resume.js
                  │
                  ├── public/downloads/resume_en.docx
                  ├── public/downloads/resume_ru.docx
                  ├── public/downloads/resume_en.txt
                  └── public/downloads/resume_ru.txt
```

Everything is generated from the same YAML source at build time.

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
- `experience.description` — accepts either a list (rendered as bullets) or a plain string
- `experience.stack` — rendered as tags below the description

---

## YAML Reference — `showcase/projects.yaml`

```yaml
projects:
  - name: "Project Name"
    slug: "project-name"
    role: "DevOps Engineer"
    year: "2024"
    description: "Short project summary."
    featured: true
    theme: "blue"
    accent: "#3b82f6"
    platforms: [Linux, Web]
    stack: [Go, Docker, Kubernetes]
    tags: [devops, infrastructure]
    metrics:
      - label: "Deploy time"
        value: "8m → 2m"
        source: https://example.com
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
        featured: true
```

### Field notes

- All fields are optional by schema design — missing fields are not rendered
- `theme` — predefined CSS token (`blue`, `purple`, `emerald`, `red`, etc.)
- `accent` — HEX color override, takes precedence over `theme`
- `featured` — affects card sorting and future highlight treatment
- `metrics.source` — optional proof link, not displayed visually
- `links.type` — semantic only (`repo`, `demo`, `store`, `article`); affects icon if implemented
- `media.src` — path relative to `/public`
- Broken media files are automatically removed from rendering

---

## Home Page Layout — How to Reorder Blocks

The main page (EN and RU) is assembled via the shared `HomePage.astro` component.

- `src/pages/index.astro` and `src/pages/ru.astro`:
  - read data from `cv/en.yaml` / `cv/ru.yaml`
  - prepare resume download links
  - call `<HomePage lang=... data=... pdfUrl=... docxUrl=... txtUrl=... />`
- All markup and block order live in `src/components/HomePage.astro`

### Two-column layout

- Left column — `aside.sidebar`
- Right column — `main.main-content`

Each major block is a separate `<article>` or `<section>` with a comment.

**Left column (`sidebar`):**
- **Download resume** — PDF / DOCX / TXT buttons
- **Skills** — grouped by category

**Right column (`main-content`):**
- **Hero** — name, title, summary, contacts
- **Achievements** — if present in YAML
- **Experience** — timeline

To change block order:
1. Open `src/components/HomePage.astro`
2. Find the relevant block by its comment
3. Move the `<article>` / `<section>` up or down within `aside` or `main`
4. To hide a block — delete or comment it out

Language logic (`lang`) and UI strings (`t.*`) live inside `HomePage.astro` — EN/RU pages only pass data in, no markup duplication.

---

## Why This Approach

Traditional resume formats create duplication:
- Website version
- PDF version
- DOC version
- LinkedIn version

CV Hub centralizes everything into one YAML file, reduces duplication, enables automation, and keeps you independent from any platform.

---

## Philosophy

Treat your resume as infrastructure.

Version-controlled.
Composable.
Automatable.
Portable.

This repository is designed to be forked and adapted by any specialist who wants
full control over their professional presentation.

---

## License

Source code: MIT  
Content (resume data): © Author