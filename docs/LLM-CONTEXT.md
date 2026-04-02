<!--
  llm-context.md
  CV Hub

  One-file project context for LLMs (Claude, ChatGPT, Cursor, etc.)
  Feed this document to any AI tool before making changes to the project.

  Created by Alexander Gusarov on 02.04.2026.
  @spartan121
-->

# CV Hub — LLM Context

Feed this file to any AI tool before working on the project.
It covers architecture, routing, data model, conventions and common tasks.

---

## What is CV Hub

CV Hub is a static personal website and resume system built with Astro and YAML.

Core concept: **Resume as Code**. One YAML file is the single source of truth. Everything else — website, PDF, DOCX, TXT, multiple language versions, multiple role-specific profiles — is generated from it automatically.

**Stack:** Astro (static), YAML (data), TypeScript, GitHub Actions (CI/CD), GitHub Pages (hosting). Zero client-side JS by default.

---

## Project structure

```
src/
  content/
    cv/
      en.yaml              # base CV in English
      ru.yaml              # base CV in Russian
      en_devops.yaml       # DevOps delta (spec)
      ru_devops.yaml
      en_gamedev.yaml      # GameDev delta (spec)
      ru_gamedev.yaml
    profiles/
      profiles.yml         # profile registry
    languages/
      languages.yml        # language config + default
    i18n/
      translations.yaml    # all UI strings for all languages
    showcase/
      projects.yaml        # showcase project list
    changelog/
      changelog.yaml       # version history
  pages/
    index.astro            # default profile + default lang → /
    [...slug].astro        # all other profile × lang combos
    showcase/
      index.astro          # showcase list, default lang → /showcase
      [...rest].astro      # showcase list non-default lang + case study pages
    changelog.astro
    404.astro
  components/
    Layout.astro           # shared layout: header, nav, lang switcher, footer
    HomePage.astro         # CV page renderer
    ProjectCard.astro      # showcase project card (featured + archived modes)
    ProjectPage.astro      # case study page template
    AnimatedBackground.astro
    blocks/
      TextBlock.astro      # case study text block
      ImageBlock.astro     # case study image block
      DividerBlock.astro   # case study divider
  scripts/
    merge.mjs              # YAML merge pipeline (base + spec → public/cv/)
    t.ts                   # i18n helper makeT()
    resume-export-pdf.mjs  # PDF generator via Playwright
    resume-import-json.mjs # JSON Resume → YAML converter
    resume-import-linkedin.mjs
  styles/
    global.css             # all styles + CSS design tokens
    themes/                # frosted, light, nordic, peachy

public/
  cv/                      # merged YAML artifacts (generated, do not edit)
  themes/                  # built theme files
  downloads/               # generated resume files (PDF/DOCX/TXT)
  media/
    projects/
      {slug}/              # project assets: cover.png, screenshots, etc.
        cover.png
        {slug_underscored}_{lang}.yaml  # case study content (optional)

.github/
  scripts/
    generate-resume.js     # DOCX + TXT generator
  workflows/
    deploy.yml             # full CI/CD pipeline

docs/
  INFO.md                  # data structure reference
  ENGINEERING.md           # architecture decisions
  BKG_INFO.md              # AnimatedBackground docs
  llm-context.md           # this file
  examples/
    example_cv.yaml        # full CV YAML example
    example_cv.json        # JSON Resume example
    example_project.yaml   # showcase project entry example
    example_cs.yaml        # case study YAML example (all block types)
```

---

## Routing

| URL | File | Notes |
|---|---|---|
| `/` | `index.astro` | default profile + default lang |
| `/en` | `[...slug].astro` | default profile, non-default lang |
| `/devops` | `[...slug].astro` | devops profile, default lang |
| `/devops/en` | `[...slug].astro` | devops profile, non-default lang |
| `/showcase` | `showcase/index.astro` | default lang |
| `/showcase/en` | `showcase/[...rest].astro` | non-default lang, kind=list |
| `/showcase/{slug}` | `showcase/[...rest].astro` | case study, default lang |
| `/showcase/{slug}/en` | `showcase/[...rest].astro` | case study, non-default lang |
| `/changelog` | `changelog.astro` | |
| `/404` | `404.astro` | |

**Rules:**
- Default lang has no lang segment in URL: `/` not `/ru` when `default: ru`
- Default profile has no slug: `/` not `/default`
- Case study pages exist only if `public/media/projects/{slug}/{slug_}_{lang}.yaml` exists

---

## Language system

Configured in `src/content/languages/languages.yml`:

```yaml
default: "ru"
languages:
  - id: "ru"
    label: "RU"
  - id: "en"
    label: "EN"
```

`default` determines which lang gets the root URL (`/`, `/showcase`, etc.).

The language switcher in `Layout.astro` builds links via `customLangLinks` prop.
**Every page that is not a CV page must pass `customLangLinks` explicitly**, otherwise the switcher falls back to CV routes and redirects incorrectly.

Pages that pass `customLangLinks`:
- `showcase/index.astro` — links to `/showcase` and `/showcase/{lang}`
- `showcase/[...rest].astro` (list) — same
- `ProjectPage.astro` — links to `/showcase/{slug}` and `/showcase/{slug}/{lang}`

CV pages (`index.astro`, `[...slug].astro`) do NOT pass `customLangLinks` — Layout builds them automatically from profile + lang.

**`showcaseHref` in Layout** is lang-aware:
```ts
const showcaseHref = lang === defaultLang
  ? `${base}/showcase`
  : `${base}/showcase/${lang}`;
```

---

## Profile system

Configured in `src/content/profiles/profiles.yml`:

```yaml
profiles:
  - id: default
    label: "Generalist"
    slug: ""       # empty = root URL
    spec: null     # null = copy base as-is
  - id: devops
    label: "DevOps"
    slug: "devops"
    spec: devops   # reads en_devops.yaml, ru_devops.yaml
```

`slug` = URL segment. `spec` = delta filename prefix. They can differ.

If `profiles.yml` is missing — graceful fallback to single default profile.

---

## YAML merge pipeline

`src/scripts/merge.mjs` runs before `astro build`:

```
src/content/cv/en.yaml + en_devops.yaml → public/cv/en_devops.yaml
```

**Merge rules:**
- Scalar fields (`title`, `summary`, `name`): spec wins, missing → base
- `skills`: entirely replaced if present in spec
- `experience`: whitelist by `company` key; fields merged per entry
- `achievements`, `contacts`, `education`, `languages`: spec wins entirely if present
- `spec: null`: base copied as-is

Pages read from `public/cv/` (merged artifacts), not `src/content/cv/`.

---

## i18n system

All UI strings in `src/content/i18n/translations.yaml`:

```yaml
nav:
  home:
    en: "Home"
    ru: "Главная"
```

Helper in `src/scripts/t.ts`:

```ts
const t = makeT(translations.data, lang);
t('nav.home') // → "Главная"
```

Fallback chain: requested lang → `en` → key path string.

---

## BASE_URL and assets

The site is deployed to GitHub Pages under a base path (`/cv_hub/`). Locally it's `/`.

**Rules:**
- Never hardcode `/cv_hub/` anywhere
- All internal links and asset paths must go through `withBase()` or use `import.meta.env.BASE_URL`
- In YAML files (projects, case studies) — use paths without base: `/media/projects/...`, `/showcase/...`
- `withBase()` is available in `ProjectCard.astro` and `ImageBlock.astro`
- In `Layout.astro`: `const base = import.meta.env.BASE_URL.replace(/\/$/, '')`

---

## CSS and theming

All styles in `src/styles/global.css`. Token-based via CSS custom properties in `:root`.

**Key tokens:**
```css
--bg, --text, --muted, --border, --border-2
--accent, --accent-rgb, --accent-2, --accent-2-rgb
--card-bg, --shadow, --shadow-soft
--r-lg, --r-pill, --container
--header-bg, --brand-grad
```

**Theme switching:** `?theme=nordic` in URL. Loads `/themes/{name}.css` via inline script in `<head>`. Available: `frosted`, `light`, `nordic`, `peachy`.

**Project card accent colors** via `--card-accent-rgb`:
```css
.project--blue    { --card-accent-rgb: 59 130 246; }
.project--cyan    { --card-accent-rgb: 34 211 238; }
.project--emerald { --card-accent-rgb: 16 185 129; }
.project--magenta { --card-accent-rgb: 236 72 153; }
```

---

## Showcase and case studies

### Project list (`src/content/showcase/projects.yaml`)

Each entry:
```yaml
- slug: my-project        # folder name in public/media/projects/
  name: "My Project"
  order: 1
  role: "Lead Developer"
  year: "2024"
  description: "Short description for the card."
  platforms: [iOS, Android]
  stack: [Unity, C#]
  tags: [Mobile, Multiplayer]
  theme: blue             # blue | cyan | emerald | magenta
  featured: true          # shows pin icon
  archived: false         # collapses card with toggle
  metrics:
    - label: Revenue
      value: "$100K+"
  media:
    - type: image
      src: /media/projects/my-project/cover.png
      alt: "Cover"
      featured: true
  links:
    - label: App Store
      url: https://apps.apple.com/...
      type: store
```

`links` in project cards are rendered without `withBase()` — external URLs only. Internal links (like `type: product` pointing to case study) go through `withBase()` in `ProjectCard.astro`.

### Case study pages

Case study YAML lives at:
```
public/media/projects/{slug}/{slug_with_underscores}_{lang}.yaml
```

Example: `public/media/projects/cv-hub/cv_hub_ru.yaml`

The page is auto-generated if the file exists. No registration needed.

URL pattern:
```
/showcase/{slug}       ← default lang
/showcase/{slug}/en    ← non-default lang
```

Case study YAML structure:
```yaml
title: "Project Title"
role: "My Role"
year: "2024"
tagline: "One-line description shown under the title."

platforms: [Web]
stack: [Astro, TypeScript]

links:
  - label: GitHub
    url: https://github.com/...

blocks:
  - type: image
    src: /media/projects/my-project/cover.png
    alt: "Cover"

  - type: divider

  - type: text
    title: "Overview"
    body: |
      Multi-line text here.

  - type: text
    title: "What I did"
    bullets:
      - Built the backend
      - Reduced latency by 40%

  - type: text
    title: "Links"
    links:
      - label: Documentation
        url: https://docs.example.com

  - type: image
    title: "Architecture"
    subtitle: "Service interaction diagram"
    src: /media/projects/my-project/arch.png
    alt: "Architecture diagram"
    caption: "Caption text under image"
```

Block types: `text`, `image`, `divider`. All fields in `text` and `image` blocks are optional — render only what's present.

---

## How to add a new language

1. Add entry to `src/content/languages/languages.yml`
2. Create `src/content/cv/{lang}.yaml`
3. Add translations to `src/content/i18n/translations.yaml`
4. Optionally create `src/content/cv/{lang}_{spec}.yaml` per profile
5. Build — new routes, downloads and switcher links appear automatically

---

## How to add a new profile

1. Add entry to `src/content/profiles/profiles.yml`
2. Create `src/content/cv/{defaultLang}_{spec}.yaml` (delta file)
3. Create other lang deltas if needed
4. Build — new routes and downloads appear automatically

---

## How to add a case study

1. Create folder: `public/media/projects/{slug}/`
2. Add assets (images, etc.)
3. Create `{slug_underscored}_{lang}.yaml` with content blocks
4. The page `/showcase/{slug}` is generated automatically

No changes to any `.astro` file needed.

---

## How to add a project to showcase

Add an entry to `src/content/showcase/projects.yaml`. That's it.

To link a project card to its case study:
```yaml
links:
  - label: Case Study
    url: /showcase/{slug}
    type: product
```

---

## Resume generation

```bash
npm run build
# runs in order:
# 1. cv:build          → merge YAMLs → public/cv/
# 2. resume:generate   → DOCX + TXT for all profiles × langs
# 3. resume:pdf        → PDF via Playwright
# 4. astro build       → static site
```

Output naming: `resume_{lang}[_{spec}].{ext}`
Examples: `resume_ru.pdf`, `resume_en_devops.docx`

---

## How to generate CV YAML from a resume

Use any LLM (Claude, ChatGPT) with this prompt:

```
You are helping convert a resume into structured YAML for the CV Hub project.

Task: transform the provided resume into YAML files for each required language.
Return ONLY raw YAML. No explanations, no markdown code fences.

Structure (same for each language file):

name: ""
title: ""
summary: ""

contacts:
  - label: Email
    url: mailto:

achievements:
  - ""

skills:
  - group: ""
    items: []

experience:
  - company: ""
    role: ""
    period: ""
    description:
      - ""
    stack: []

education:
  - institution: ""
    degree: ""
    period: ""

languages:
  - language: ""
    level: ""

Rules:
- Never invent information not present in the resume
- summary: 2-3 sentences, first person, based on resume content
- skills: group by category (Languages, Frameworks, DevOps, Cloud, etc.)
- experience: newest first
- experience.description: bullet list, not a single string
- experience.stack: only technologies mentioned in that specific role

Provide one file per language. Label each with the language code:
--- en ---
[yaml here]
--- ru ---
[yaml here]
```

Save output as `src/content/cv/{lang}.yaml`.

---

## Common mistakes to avoid

- **Never hardcode `/cv_hub/`** in YAML or components — use `withBase()` or relative paths
- **Never skip `customLangLinks`** on showcase or case study pages — switcher will redirect to home
- **Never read from `src/content/cv/` in pages** — always use `public/cv/` (merged artifacts)
- **Case study YAML lives in `public/media/projects/`**, not in `src/content/`
- **`showcaseHref` must include lang** — it's built in `Layout.astro`, not hardcoded
- **Profiles without `profiles.yml`** work fine — graceful fallback
- **Adding a language or profile** requires no changes to `.astro` files — only YAML and config

---

## Key files to know

| File | Purpose |
|---|---|
| `src/styles/global.css` | All styles. Edit `:root` to retheme. |
| `src/content/languages/languages.yml` | Languages + default |
| `src/content/profiles/profiles.yml` | Profiles + slugs |
| `src/content/i18n/translations.yaml` | All UI strings |
| `src/content/showcase/projects.yaml` | Showcase project list |
| `src/scripts/merge.mjs` | YAML merge logic |
| `src/components/Layout.astro` | Header, nav, lang switcher, footer |
| `src/components/ProjectPage.astro` | Case study page template |
| `public/media/projects/` | Project assets + case study YAMLs |