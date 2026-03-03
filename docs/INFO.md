<!--
  INFO.md
  CV Hub

  Created by Alexander Gusarov on 03.03.2026.
  @spartan121
-->

# CV Hub

## Overview

CV Hub is a static, data-driven personal professional website built with Astro.

The project replaces traditional resume formats and no-code builders (e.g. Tilda)
with a version-controlled, extensible and automation-friendly solution.

It provides:
- A main CV page (primary focus: DevOps)
- A Showcase page with projects and case studies
- Multi-language support (RU / EN)
- Downloadable resume formats (PDF / DOCX / TXT — generated later from YAML)

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
- Minimal CSS (can be upgraded to Tailwind later)
- GitHub Pages for deployment

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
    Layout.astro       # Общий layout (шапка + <main>)
    Header.astro       # Шапка (логотип, навигация, переключатель языка)
    HomePage.astro     # Разметка главной страницы (блоки, которые можно тасовать)
```

### Content Model

All professional data is stored in YAML files.

Example: `cv/en.yaml`

- name
- title
- summary
- contacts[]
- skills[]
- experience[]

Example: `showcase/projects.yaml`

- projects[]
  - name
  - role
  - year
  - description
  - stack[]
  - links[]

Pages load content using `astro:content` and render it via components.

---

## Data Flow

YAML → Astro Content Collection → Page → Component → Static HTML

Later extension:

YAML → Generator Script → PDF / DOCX / TXT

---

## Home page layout (how to reorder blocks)

The main page (EN and RU versions) is assembled via the shared `HomePage.astro` component.

- `src/pages/index.astro` and `src/pages/ru.astro`:
  - read data from `cv/en.yaml` / `cv/ru.yaml`;
  - prepare resume download links;
  - call `<HomePage lang=... data=... pdfUrl=... />`.
- All markup and block order lives in `src/components/HomePage.astro`.

### `HomePage.astro` structure

Uses a two-column layout internally:

- left column — `aside.sidebar`
- right column — `main.main-content`

Each major block is a separate `<article>` or `<section>` with a comment.

**Left column (`sidebar`):**

- **Download resume** block — PDF / DOCX / TXT buttons
- **Skills** block — skills grouped by category

**Right column (`main-content`):**

- **Hero** block — name, title, summary, contacts
- **Achievements** block — achievements (if present in YAML)
- **Experience** block — experience timeline

To change the block order:

1. Open `src/components/HomePage.astro`.
2. Find the relevant commented block (Download, Skills, Hero, Achievements, Experience).
3. Move the corresponding `<article>` / `<section>` up or down inside `aside` or `main`.
4. To hide a block — delete it entirely (or comment it out).

Language logic (`lang`) and UI strings (`t.*`) live inside `HomePage.astro`, so EN/RU pages don't duplicate markup — they only pass data in.

---


---

## Showcase Project Fields (How to Fill `projects.yaml`)

All fields in `showcase/projects.yaml` are technically optional (schema allows empty values),
but some are strongly recommended for a meaningful project card.

Minimum recommended field:
- `name` — Project title (string). If missing, card falls back to "Untitled".

---

### Core Fields

- `slug` (string)
  Internal identifier. Used for anchors or future routing. Optional.

- `name` (string)
  Project title displayed on the card. Recommended.

- `role` (string)
  Your role in the project (e.g. "DevOps Engineer", "Gameplay Engineer"). Optional.

- `year` (string | number)
  Time reference (e.g. "2024", "2023–2024"). Stored as string internally. Optional.

- `description` (string)
  Short project summary. Optional but recommended.

---

### Visual & Theming

- `theme` (string)
  Predefined visual theme token (e.g. `blue`, `purple`, `emerald`, `red`, etc.).
  Controlled in CSS.

- `accent` (HEX string)
  Custom color override (e.g. `"#3b82f6"`).
  If provided, overrides theme accent.

- `featured` (boolean)
  Marks project as featured (affects sorting and future highlighting). Optional.

---

### Structured Data Blocks

- `platforms` (string[])
  Target platforms (e.g. `[Linux, iOS, Web]`). Optional.

- `stack` (string[])
  Technologies used. Optional.

- `tags` (string[])
  Keywords for filtering/grouping. Optional.

---

### Metrics

```yaml
metrics:
  - label: Deploy time
    value: "8m → 2m"
    source: https://example.com
```

- `label` (string)
  What was done / measured.
- `value` (string)
  Result or impact.
- `source` (string)
  Optional link to proof or reference.

All metric fields are optional.

---

### Links

```yaml
links:
  - label: Repo
    url: https://example.com
    type: repo
```

- `label` (string)
  Link text.
- `url` (string)
  Destination URL.
- `type` (string)
  Semantic type (repo, demo, store, article, etc.). Optional.

Links without both `label` and `url` are not rendered.

---

### Media

```yaml
media:
  - type: image | gif | video
    src: /media/projects/.../file.jpg
    alt: Description
    featured: true
```

- `type` (`image` | `gif` | `video`)
- `src` (string)
  Path relative to `/public`.
- `alt` (string)
  Accessibility description.
- `featured` (boolean)
  Determines primary preview media.

If media file fails to load, it is automatically removed from rendering.

---

### Optionality Philosophy

All fields are optional by schema design.

UI renders only what exists:
- Empty blocks are not displayed.
- Missing arrays do not break layout.
- Broken media is removed automatically.

This allows flexible, minimal, or highly detailed project entries.

---

## Why This Approach

Traditional resume formats create duplication:
- Website version
- PDF version
- DOC version
- LinkedIn version

This project aims to:

- Centralize data
- Reduce duplication
- Enable automation
- Provide clean public professional hub

---

## Future Improvements

- Strict Zod schema validation for YAML
- Automatic resume generation (Playwright / Pandoc / Rust tool)
- Dark theme
- Project filtering by tags
- SEO + OpenGraph metadata
- GitHub Actions CI for build & deploy

---

## Philosophy

Treat your resume as infrastructure.

Version-controlled.
Composable.
Automatable.
Portable.

This repository is designed to be forked and adapted by other developers who want
full control over their professional presentation.

---

## License

Source code: MIT (recommended)
Content: © Author
