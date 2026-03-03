

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
    index.astro        # Main CV page
    showcase.astro     # Projects showcase page
  components/
    Layout.astro
    Header.astro
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