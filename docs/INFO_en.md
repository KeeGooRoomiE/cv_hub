# CV Hub — INFO

> 🌐 **Русская версия:** [`docs/INFO_ru.md`](INFO_ru.md)

Full reference for the project's data structure, configuration, and architecture.

---

## Contents

1. [Data file structure](#1-data-file-structure)
2. [CV YAML — full field reference](#2-cv-yaml--full-field-reference)
3. [Multi-profile system](#3-multi-profile-system)
4. [Languages & i18n](#4-languages--i18n)
5. [Showcase — project list](#5-showcase--project-list)
6. [Case Study pages](#6-case-study-pages)
7. [Changelog — changelog.yaml](#7-changelog--changelogyaml)
8. [Data flow](#8-data-flow)
9. [Components](#9-components)
10. [Routing](#10-routing)
11. [Document generation](#11-document-generation)
12. [OG-image pipeline](#12-og-image-pipeline)
13. [LLM context](#13-llm-context)
14. [npm run init — fork onboarding](#14-npm-run-init--fork-onboarding)
15. [Custom domain — SITE_URL / BASE_PATH](#15-custom-domain--site_url--base_path)
16. [JSON-LD and hreflang](#16-json-ld-and-hreflang)
17. [site.yml — site-level settings](#17-siteyml--site-level-settings)

---

## 1. Data file structure

```
src/content.config.ts    ← collection schemas + Content Layer glob() loaders
src/content/
  cv/
    en.yaml              ← base CV in English
    ru.yaml              ← base CV in Russian
    en_devops.yaml       ← DevOps delta (optional)
    ru_devops.yaml
    en_gamedev.yaml      ← GameDev delta (optional)
    ru_gamedev.yaml
  profiles/
    profiles.yml         ← profile registry (optional)
  languages/
    languages.yml        ← language config
  i18n/
    translations.yaml    ← UI strings for all languages
  showcase/
    projects_en.yaml     ← showcase projects (English)
    projects_ru.yaml     ← showcase projects (Russian)
  changelog/
    changelog.yaml       ← version history

src/components/
  Layout.astro           ← main layout, background wiring
  AnimatedBackground.astro  ← CSS-only orbs
  GalaxyBackground.astro    ← canvas galaxy with parallax
  PlayStationWaves.astro    ← canvas XMB filled sine waves
  WaveLines.astro           ← canvas XMB glowing lines
  blocks/
    TextBlock.astro
    ImageBlock.astro
    DividerBlock.astro

public/
  media/
    projects/
      {slug}/            ← project assets
        cover.png
        {slug_}_{lang}.yaml  ← case study content (optional)
  themes/
    frosted.css / light.css / nordic.css / peachy.css

docs/
  ENGINEERING.md         ← architecture decisions and philosophy
  INFO_en.md             ← this file, data reference (English)
  INFO_ru.md             ← Russian translation of this file
  BKG_INFO.md            ← background component reference
  LLM-CONTEXT.md         ← context for AI tools
  examples/              ← example YAML for CV, showcase, case study
```

After running `npm run cv:build`, merged artifacts appear in `public/cv/`.

---

## 2. CV YAML — full field reference

```yaml
name: "Alexander Gusarov"
title: "DevOps Engineer | Kubernetes · Terraform · AWS"
summary: >
  Multi-line summary text.

contacts:
  - label: Email
    url: mailto:your@email.com
  - label: GitHub
    url: https://github.com/username

achievements:
  - "Managed infrastructure for 750+ Linux servers"
  - "Reduced deploy time from 8 to 2 minutes (−75%)"

skills:
  - group: Orchestration
    items: [Kubernetes, Helm, Docker]
  - group: IaC & Automation
    items: [Terraform, Ansible]

experience:
  - company: "InfoScale"
    role: "DevOps Engineer"
    period: "Dec 2024 — Jan 2026"
    description:
      - "Administered Kubernetes production clusters"
      - "Built IaC solution with Terraform + Ansible on AWS"
    stack: [Kubernetes, Helm, Docker, Terraform, AWS]

education:
  - institution: "Udemy"
    degree: "Certified Kubernetes Administrator"
    period: "2025"

languages:
  - language: Russian
    level: Native
  - language: English
    level: IELTS 7.0 (B2)
```

`skills` supports both a flat format (array of strings) and a grouped one. Both can be mixed.

---

## 3. Multi-profile system

### profiles.yml

```yaml
profiles:
  - id: default
    label: "Generalist"
    slug: ""        # empty string = root /
    spec: null      # null = copy base as-is
  - id: devops
    label: "DevOps"
    slug: "devops"
    spec: devops    # reads en_devops.yaml, ru_devops.yaml
```

`slug` (URL) and `spec` (file prefix) **must match** — `merge.mjs` fails with an error if they differ (routing is keyed on slug, while the CV and download files are keyed on spec).

### Delta file

Contains only what changes. Everything else comes from base.

```yaml
# src/content/cv/en_devops.yaml
title: "DevOps / Platform Engineer | Kubernetes · Terraform · AWS"

skills:
  - group: Orchestration
    items: [Kubernetes, Helm, Docker]

experience:
  - company: InfoScale        # taken as-is from base
  - company: AZNResearch
    role: "Backend Engineer"  # overrides role
    description:
      - "Focused bullet for DevOps context"
```

### Merge rules

| Field | Behavior |
|---|---|
| Scalars (`title`, `summary`) | spec wins; missing ones fall back to base |
| `skills` | Replaced wholesale if present in spec |
| `experience` | Whitelisted by `company`; fields are merged per entry |
| `achievements`, `contacts`, `education`, `languages` | Replaced wholesale if present in spec |

---

## 4. Languages & i18n

### languages.yml

```yaml
default: "ru"
languages:
  - id: "ru"
    label: "RU"
  - id: "en"
    label: "EN"
```

`default` determines the language used for URLs with no language segment.

### Adding a language

1. Add an entry to `languages.yml`
2. Create `src/content/cv/{lang}.yaml`
3. Add translations to `translations.yaml`
4. Optional: `src/content/cv/{lang}_{spec}.yaml` for each profile

### translations.yaml

```yaml
nav:
  home:
    en: "Home"
    ru: "Главная"
  showcase:
    en: "Showcase"
    ru: "Проекты"

cv:
  skills:
    en: "Skills"
    ru: "Навыки"

meta:
  description:
    en: "CV Hub - one place for your actual resume."
    ru: "CV Hub - единое место для твоего резюме."
  locale:
    en: "en_US"
    ru: "ru_RU"
```

Fallback chain: requested language → `en` → the literal dotted key.

---

## 5. Showcase — project list

```yaml
projects:
  - slug: bhop-jump
    name: "Bhop Jump"
    order: 1
    role: "Gameplay Engineer"
    year: "2017"
    description: "Competitive mobile parkour game."
    platforms: [iOS, Android]
    stack: [Unity, C#]
    tags: [Mobile, Multiplayer]
    theme: blue               # blue | cyan | emerald | magenta
    featured: true            # shows a pin icon
    archived: false           # collapses the card behind a toggle
    metrics:
      - label: Revenue
        value: "$160K+"
    media:
      - type: image
        src: /media/projects/bhop-jump/01.jpg
        alt: "Bhop Jump gameplay"
        featured: true
    links:
      - label: App Store
        url: https://apps.apple.com/...
        type: store
      - label: Case Study
        url: /showcase/bhop-jump   # no /cv_hub/ — base is substituted automatically
        type: product
```

**Never hardcode `/cv_hub/` in a URL.** Internal paths are written without the base prefix.

---

## 6. Case Study pages

### How it works

The page is generated automatically if the file exists:

```
public/media/projects/{slug}/{slug_underscored}_{lang}.yaml
```

Examples:
```
public/media/projects/cv-hub/cv_hub_ru.yaml   → /showcase/cv-hub
public/media/projects/cv-hub/cv_hub_en.yaml   → /showcase/cv-hub/en
```

No changes to any `.astro` file are needed.

### YAML structure

```yaml
title: "Project Title"
role: "My Role"           # optional
year: "2024"              # optional
tagline: "Short description under the title."

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
      Multi-line text.

  - type: text
    title: "What I did"
    bullets:
      - Item one
      - Item two

  - type: image
    title: "Architecture"
    subtitle: "Diagram"
    body: "Text above the image."
    src: /media/projects/my-project/arch.png
    alt: "Architecture"
    caption: "Caption under the image"
```

### Block types

| Type | Fields |
|---|---|
| `text` | `title`, `subtitle`, `body`, `bullets`, `links` — all optional |
| `image` | `title`, `subtitle`, `body`, `src`, `alt`, `caption` — all optional |
| `video` | `title`, `subtitle`, `body`, `src`, `poster`, `alt`, `caption`, `loop` — all optional except `src`. See below |
| `code` | `title`, `subtitle`, `body`, `caption` — all optional except `body`. See below |
| `divider` | no fields |

Every block except `divider` also accepts `anchor` — an id for deep-linking (`/showcase/{slug}#anchor-name`), see below.

Full example of every block — `docs/examples/example_cs.yaml`.

#### Inline code in prose

In `title`, `subtitle`, `body`, and `bullets` items of any block (`text`, `image`, `video`, `code`), `` `text in backticks` `` renders as a styled `<code>` span instead of literal quote marks. Full markdown is not parsed — only this one inline pattern.

```yaml
- type: text
  body: |
    Config lives in `astro.config.mjs`, and data is read from `public/cv/`.
```

Component — `src/components/blocks/InlineText.astro`, shared across all blocks.

#### `anchor` — deep links

Any block (except `divider`) can set `anchor: "some-id"` — its root element then gets `id="some-id"` and can be linked to directly: `/showcase/{slug}#some-id` (or `/showcase/{slug}/{lang}#some-id`). Accounts for the sticky header's height (`scroll-margin-top`), so jumping to the anchor doesn't hide the block's title under the header.

```yaml
- type: text
  title: "Quickstart"
  anchor: "quickstart"
  body: |
    This section can be opened directly via .../showcase/cv-hub#quickstart
```

#### `code` block

A monospace block for commands/snippets. `body` renders **verbatim** — without inline-code parsing (it's code meant to be copied, not prose); `title`/`subtitle`/`caption` are regular prose supporting `` `backticks` ``. No syntax-highlighting engine — deliberately, to avoid pulling in a dependency for a handful of bash commands.

```yaml
- type: code
  title: "Cloning"
  body: |
    git clone https://github.com/YOUR_ACCOUNT/cv_hub.git
    cd cv_hub
```

Component — `src/components/blocks/CodeBlock.astro`.

#### `video` block

`src` determines the render mode:

- **YouTube** — if `src` looks like `youtube.com/watch?v=...`, `youtu.be/...`, or `youtube.com/embed/...`, the video id is extracted automatically and the block renders a responsive 16:9 `<iframe>` (YouTube Player API, `loading="lazy"`).
- **Local/self-hosted file** — any other `src` (usually `/media/projects/{slug}/clip.mp4`) renders as a `<video>`:
  - `loop: true` → silent autoplay loop, no controls (short background clips)
  - `loop: false` / unspecified → controls + optional `poster`, `preload="metadata"` (longer clips)

```yaml
# YouTube — trailer/gameplay footage without hosting your own mp4
- type: video
  title: "Trailer"
  src: https://www.youtube.com/watch?v=dQw4w9WgXcQ
  caption: "Official trailer"

# Local file — a short looping clip
- type: video
  src: /media/projects/my-project/boss-fight.mp4
  loop: true
  alt: "Final boss"
```

Component — `src/components/blocks/VideoBlock.astro`.

---

## 7. Changelog — changelog.yaml

```yaml
changelog:
  - version: "1.5.1"
    date: "2026-04-02"
    changes:
      - type: fixed
        text: "Language switcher on Showcase now works correctly"
      - type: added
        text: "New feature"
      - type: changed
        text: "Changed behavior"
      - type: removed
        text: "Removed feature"
```

Types: `added`, `changed`, `fixed`, `removed`.

---

## 8. Data flow

```
src/content/cv/en.yaml + en_devops.yaml
         ↓
     merge.mjs
         ↓
  public/cv/en_devops.yaml
         ↓
    ┌────┴──────────────────────────────┐
    ↓                                   ↓
generate-resume.js               astro build
resume-export-pdf.mjs                   ↓
    ↓                       [...slug].astro
DOCX / TXT / PDF            reads public/cv/
                                        ↓
                               HomePage.astro renders CV

public/media/projects/{slug}/{slug_}_{lang}.yaml
         ↓
showcase/[...rest].astro
         ↓
ProjectPage.astro renders case study
```

---

## 9. Components

### Layout.astro

Props:
- `title`, `lang`, `section`, `profile`
- `description` — page meta description (optional, defaults from translations)
- `ogImage` — OG image URL (optional, defaults to `/media/og-image-{lang}.png` — matching the page's own language, auto-generated, see section 12)
- `customLangLinks` — overrides the automatic language-switcher links

**Showcase and case study pages must pass `customLangLinks`**, otherwise the language switcher points at CV routes.

Contains the role dropdown menu (if there is more than one profile). The dropdown works via JS click-toggle with click-outside and Escape to close.

### ProjectPage.astro

Props: `data`, `showcaseHref`, `langLinks`, `lang`

### ProjectCard.astro

Two modes: a regular card, and a collapsible archived one (`archived: true` in YAML).
`hasCasePage` prop — adds a link to the case study if the page exists.

### Blocks (`blocks/`)

`TextBlock.astro`, `ImageBlock.astro`, `DividerBlock.astro` — used inside `ProjectPage`.

### Background components

Interchangeable — one is wired up in `Layout.astro`. Full parameter reference — `docs/BKG_INFO.md`.

| Component | Description |
|---|---|
| `AnimatedBackground` | CSS-only, no JS, 4 blurred orbs, theme-aware |
| `GalaxyBackground` | Canvas, spiral galaxy with mouse parallax |
| `PlayStationWaves` | Canvas, XMB-style, filled sine waves |
| `WaveLines` | Canvas, XMB-style, glowing lines |

---

## 10. Routing

| URL | File | Data |
|---|---|---|
| `/` | `index.astro` | `public/cv/{defaultLang}.yaml` |
| `/en` | `[...slug].astro` | `public/cv/en.yaml` |
| `/devops` | `[...slug].astro` | `public/cv/{defaultLang}_devops.yaml` |
| `/devops/en` | `[...slug].astro` | `public/cv/en_devops.yaml` |
| `/showcase` | `showcase/index.astro` | `projects_{lang}.yaml` |
| `/showcase/en` | `showcase/[...rest].astro` | kind=list |
| `/showcase/{slug}` | `showcase/[...rest].astro` | case study, default lang |
| `/showcase/{slug}/en` | `showcase/[...rest].astro` | case study, en |
| `/changelog` | `changelog.astro` | `changelog.yaml` |

---

## 11. Document generation

```bash
npm run build
# 1. cv:build          → public/cv/ (merged YAMLs)
# 2. resume:generate   → DOCX + TXT
# 3. resume:pdf        → PDF via Playwright
# 4. astro build       → static site
# 5. og:generate        → public/media/og-image.png + dist/media/og-image.png
```

Naming: `resume_{lang}[_{spec}].{ext}`. PDF has two variants per `lang[_spec]` — the regular one (two-column, for a human reader) and the ATS-safe one (single-column, `_ats` suffix, for parsers).

| Profile | Language | File |
|---|---|---|
| default | ru | `resume_ru.pdf` |
| default | ru | `resume_ru_ats.pdf` |
| devops | en | `resume_en_devops.pdf` |
| gamedev | ru | `resume_ru_gamedev.docx` |

---

## 12. OG-image pipeline

Script: `src/scripts/generate-og-image.mjs`. Runs as the last stage of `npm run build` (after `astro build`), but can also run standalone — a fresh `dist/` is needed first in that case:

```bash
GITHUB_REPOSITORY="KeeGooRoomiE/cv_hub" npx astro build   # first — a fresh dist/
npm run og:generate                                       # then — the pipeline itself
```

### One image per language, not per profile and not per case

A deliberate trade-off: full coverage (per profile and per case too) would multiply the number of Playwright screenshots and build time, and a deep link to a specific case is still lower priority than the resume preview showing real data instead of a mock persona. Instead — one image per configured language (`en`, `ru`), from the **default profile**: `/devops`, `/showcase/{slug}`, and any other page in the same locale simply reuse it via `Layout.astro`'s default `ogImage ?? .../og-image-{lang}.png` — every page already knows its own `lang`, so the match happens for free, with no separate per-page pass.

### How it works

1. Spins up `astro preview` on port `4523` (doesn't clash with the dev server's `4321`), serving the already-built `dist/`.
2. Reads the language list directly from `src/content/languages/languages.yml` (not through Astro content collections — this is a standalone Node script).
3. For each language — with a real headless browser (Playwright, `channel: 'chrome'` on CI, so no browser download — the same pattern `resume-export-pdf.mjs` uses) it renders `/og-preview/{lang}` (a `getStaticPaths()` route, `src/pages/og-preview/[lang].astro`) — it shows the real default-profile CV from `public/cv/{lang}.yaml` (the same file `index.astro` reads; it falls back to the mock `docs/examples/example_cv.yaml` only if that file doesn't exist yet — e.g. the script was run without first running `cv:build`).
4. Takes a 1600×1000 screenshot. Design tokens (`--bg`, `--accent`, etc.) are read from the rendered page's computed styles once (on the first language) and reused for every other language — the theme doesn't depend on CV content, so there's no reason to recompute it per language.
5. Composites on a second page: the screenshot in a frame (rounded corners, white border, shadow) over a background wallpaper — either a radial gradient built from the same tokens, or a specified image.
6. Writes `public/media/og-image-{lang}.png` per language (gitignored, regenerated on every build) and patches the already-built `dist/media/og-image-{lang}.png` — without a second full `astro build`.
7. Finally deletes all of `dist/og-preview/` — those routes exist only to be screenshotted, they don't ship to production (and are also excluded from the sitemap).

### CLI arguments

```bash
node src/scripts/generate-og-image.mjs [--theme=<name>] [--wallpaper=gradient|<path>]
```

| Flag | Values | Default |
|---|---|---|
| `--theme` | File name from `src/styles/themes/` without `.css` (`frosted`, `light`, `nordic`, `peachy`) | unspecified → default theme. Unknown name — a console warning and the same fallback |
| `--wallpaper` | `gradient` — a gradient built from the active theme's tokens (always in sync, no extra file) · path to an image relative to the repo root — embedded as a `background-image` (data URI) | `gradient` |

Examples:

```bash
npm run og:generate -- --theme=nordic
npm run og:generate -- --wallpaper=docs/repo-assets/bkg-samples/wavelines_example.png
npm run og:generate -- --theme=peachy --wallpaper=gradient
```

### In CI

Runs as a separate step in both `deploy.yml` and `ci.yml` (after `astro build`, before uploading artifacts) — CI uses the same default arguments (no theme specified, wallpaper=gradient). In `ci.yml` the result is additionally uploaded as the `og-images` artifact (mask `public/media/og-image-*.png`, every language), so the preview can be checked straight from the PR without waiting for a deploy.

---

## 13. LLM context

To work with the project through AI tools (Claude, ChatGPT, Cursor), use `docs/LLM-CONTEXT.md`.

Feed it to the model before making any edits to the project. It contains:
- Full architecture, routing, and file tree
- BASE_URL handling rules
- Common mistakes and how to avoid them
- A prompt for generating CV YAML from a resume
- Instructions for adding languages, profiles, and case studies

---

## 14. npm run init — fork onboarding

Script: `src/scripts/init.mjs`. Interactive, no new dependencies (`node:readline/promises`). A one-time wipe of the author's personal data, replaced with a placeholder from `docs/examples/*`, so a new fork's owner edits a clean example instead of someone else's resume.

```bash
npm run init
```

Asks: your name, title/role, whether to keep the RU slot (seeded with the same English placeholder text, marked `TODO: translate`, for you to translate yourself) or English only.

Touches:

| What | How |
|---|---|
| `src/content/cv/*.yaml` | Every variant is deleted (including `_devops`/`_gamedev`), a fresh `en.yaml` (+ `ru.yaml` if "both languages" is chosen) is written from `docs/examples/example_cv.yaml` with the name/title substituted in |
| `src/content/profiles/profiles.yml` | Reset to a single `default` profile — multi-profile is disabled; see section 3 to turn it back on |
| `src/content/showcase/projects_{lang}.yaml` | Replaced with one example from `docs/examples/example_project.yaml` (no `media:` — there's no cover yet, the card renders without one) |
| `public/media/projects/*` | All old folders are deleted, `my-project/my_project_{lang}.yaml` is created — a short, clean case (not the full "kitchen sink" of `example_cs.yaml`, which stays as a separate reference for every block type) |
| `src/content/languages/languages.yml` | Only the `default:` line is patched → `"en"` (the language list itself is untouched) — since `en.yaml` is now the only file with real text, the site's default language must match it |

**Untouched:** `translations.yaml` (shared UI strings, not personal data), badges in `README.md` (updated manually — those link to `KeeGooRoomiE/cv_hub`), `CHANGELOG.md`/`changelog.yaml` (project history). `Layout.astro`'s footer (the `GitHub` link, copyright) already derives itself from `GITHUB_REPOSITORY` — no need to touch it.

**Safety:**
- Before any overwrite, everything is backed up to `.cv-hub-backup-{timestamp}/` (gitignored, local only).
- A second run without `--force` is refused (marker file `.cv-hub-initialized`).
- `--dry-run` — shows what would happen, writes nothing.
- Non-interactive mode for tests/scripts: `--yes --name="..." --title="..." --lang=en|both`.

Afterward it prints a checklist of next steps (add a cover image, flesh out the case study, update the README badges, etc.).

---

## 15. Custom domain — SITE_URL / BASE_PATH

By default, `site`/`base` in `astro.config.mjs` are derived from `GITHUB_REPOSITORY` (`https://{owner}.github.io`, `/{repo}`) — the address of a standard GitHub Pages project page. Two env overrides sit on top:

```js
// astro.config.mjs
const site = process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'http://localhost:4321');
const base = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : (name ? `/${name}` : undefined);
```

- `SITE_URL` — e.g. `https://cv.example.com`. Unset → falls back to `{owner}.github.io`.
- `BASE_PATH` — usually an empty string (`""`), since a custom domain is most often served from the root rather than `/cv_hub/`. Unset (the env var is absent entirely) → falls back to `/{repo}`; set to an empty string → used as-is (these are deliberately different cases, hence `!== undefined` rather than a plain truthy check).

Pass it into `deploy.yml` as `env:` in the build job (`SITE_URL: ${{ vars.SITE_URL }}`, `BASE_PATH: ${{ vars.BASE_PATH }}`) — store the actual values under the repository's `Settings → Secrets and variables → Actions → Variables`.

You'll also need a `public/CNAME` file with a single domain inside (`cv.example.com`, no protocol) — a plain file under `public/`, copied into `dist/` like any other asset; GitHub Pages reads it for custom-domain routing. And the domain's DNS must point at GitHub Pages ([GitHub's instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).

### Where the site's absolute URL comes from

`siteUrl` for canonical/OG tags used to be recomputed manually in `Layout.astro` straight from `GITHUB_REPOSITORY`, bypassing `SITE_URL`. Now it comes from `Astro.site` (Astro's built-in getter, mirroring `site` from the config), so `SITE_URL`/`BASE_PATH` are picked up automatically everywhere: canonical, `og:image`, `twitter:image`, the sitemap (`@astrojs/sitemap` also reads `site` straight from the config).

This also fixed two real bugs that had been live in production:
- **A double slash** in the canonical/OG URL on every page (`https://…github.io//cv_hub/…`) — `siteUrl` already ended in `/`, and the concatenation added another `/`.
- **`og:image` was broken** — it ignored `base` entirely, pointing at `https://{owner}.github.io/media/og-image.png` instead of `https://{owner}.github.io/cv_hub/media/og-image.png` — a 404 on the real deployment the whole time.

---

## 16. JSON-LD and hreflang

### JSON-LD (`schema.org/Person`)

Only on CV/profile pages (`HomePage.astro`, rendered by `index.astro` and `[...slug].astro`) — not on cases, not on the showcase, not on the changelog; none of those describe a person.

`HomePage.astro` assembles `personJsonLd` from the already-parsed `contacts`/`skillGroups` (no separate schema — the same data that already goes into the markup):

```js
{
  name, jobTitle, description,
  email,      // contacts[].url starting with mailto: — the prefix is stripped
  sameAs,     // contacts[].url starting with http(s):// — GitHub/LinkedIn/Habr profiles, etc.
  knowsAbout, // every item from skills, as a flat list
}
```

`Layout.astro` fills in `url`/`image` (already computed for canonical/OG), wraps it in `@context`/`@type`, drops empty/undefined fields, and serializes it into a `<script type="application/ld+json">`. An important safety detail: `<` in the serialized string is escaped to `<` before insertion — otherwise a `</script>` inside a value (e.g. if a `description` happens to mention markup) would close the tag early.

Verify with: `https://validator.schema.org/` or Google's Rich Results Test on any CV page.

### hreflang

`Layout.astro` reuses `langLinks` — the same data that renders the language switcher in the header — so hreflang is exactly as accurate as the switcher already is, nothing is recomputed separately. For each language alternative — `<link rel="alternate" hreflang="{id}" href="{absolute URL}">`, plus one `hreflang="x-default"` pointing at the default language's URL.

Not rendered (`showHreflang = false`) when:
- there are fewer than two alternatives (`langLinks.length <= 1`);
- the page is `noindex` (404 is the only case today);
- `section === 'changelog'` — that page doesn't override `langLinks` (there's no separate RU changelog build, see section 7 and the decision recorded in the `.claude` audit — not a bug, deliberate), so the inherited default would point hreflang at the homepage instead of a nonexistent RU changelog — a deliberately wrong signal to Google, better to not emit it at all.

---

## 17. site.yml — site-level settings

Collection: `src/content/site/site.yml`, schema — `content.config.ts` (`site`). Not tied to any profile or language — settings for the deployment itself. Grows as needed (an analytics toggle, an "open to work" status — not implemented yet); today it has two fields: `downloads` and `footerCredit`.

### `downloads` — which download buttons to show

Two shapes:

```yaml
# Flat — one implicit, unlabeled group. Only when the set is unambiguous:
# no two entries would render the same button label.
downloads: [pdf, docx]
```

```yaml
# Grouped — required as soon as you want to show pdf and pdfAts together:
# both render as "PDF" — the group heading disambiguates them, not the button label.
downloads:
  - group: people
    items: [pdf, docx]
  - group: ats
    items: [pdfAts, txt]
```

Schema — `z.union([z.array(downloadFormat), z.array({group, items})])`, `downloadFormat = z.enum(['pdf', 'pdfAts', 'docx', 'txt'])`. These are two mutually exclusive shapes for the whole field (not a per-element normalizer like `skills`, where a bare string and `{group, items}` can sit side by side in one list) — a flat list means exactly "one shared group," not "N one-item groups."

`group` is a key into `translations.yaml` under `cv.downloads_{group}` (`people` and `ats` are currently defined); with no translation, the literal key is used as-is.

#### Why not all four by default

The files split into two different audiences:

| Format | Who actually needs it | Why |
|---|---|---|
| `pdf` | a visitor (recruiter, hiring manager) | the regular, readable version — what they visually expect to see |
| `docx` | recruiting agencies | they reformat resumes onto their own letterhead — a real, live use case, the button stays |
| `pdfAts` | **the site owner** | the single-column ATS-safe version — what you paste into a job-portal upload form yourself. A site visitor has no use for it, and "ATS" reads as jargon to them, not a benefit |
| `txt` | **the site owner** | paste into a "paste your resume" textarea or an email body — also an outgoing scenario for the owner, not an incoming one for a visitor |

Personal site — `[pdf, docx]`: only what a visitor recognizes. Demo/marketing deployment — the grouped list above: shows the ATS-PDF feature to people evaluating the product, not just the owner. Generation doesn't change — all four files are always built (`resume:pdf`, `resume:generate`), and `release.yml` attaches all four to a release regardless of what's visible on the site.

#### Convention: the qualifier never goes in the button label

If a label needs a second word ("ATS PDF" instead of "PDF") — it needs its own group, not a longer label. This guards against repeating a situation where two formats had to be told apart with a wordy caption right on the button. Future check: for a new artifact, first decide the audience (people? ATS?), then the placement (group, or GitHub Release). Ceiling — 2 groups × 3 items; needing a fourth item in a group is a signal that a third audience is needed, or that the file belongs in a release rather than on the page.

#### Hierarchy and accessibility

`PDF` inside the `pdf` key always renders as `class="btn"` (accent, "solid") — the one button with that weight; everything else is `btn--ghost` (secondary). So any configuration has exactly one clear primary choice.

`pdf` and `pdfAts` deliberately show the same visible text, "PDF" (per the convention above) — so each button gets its own `aria-label` ("Resume PDF" / "ATS-optimized PDF", etc.), otherwise a screen reader would announce two identical items in a row. The visible label itself doesn't change.

#### How it's wired up

`index.astro` and `[...slug].astro` collect all four URLs into a single `downloadUrls` object (not four separate props) and pass it to `<HomePage>`. `HomePage.astro` reads `site.yml` itself via `getEntry('site', 'site')` — the same pattern `Layout.astro` already uses to read `languages`/`profiles`/`i18n` itself rather than receiving them as props from above — normalizes the flat/grouped shape, resolves the group headings, and filters/orders the buttons.

### `footerCredit` — "Made with CV Hub" in the footer

```yaml
footerCredit: true   # default; false to remove it
```

A link to the upstream project next to the `GitHub` link in the footer (`Layout.astro`). Unlike the `GitHub` link and the byline (both derived from `GITHUB_REPOSITORY` — pointing at **your own** fork), "Made with CV Hub" is **always** hardcoded to `github.com/KeeGooRoomiE/cv_hub` — that's the whole point: every deployed fork stays a discoverable backlink to the original, which is the mechanism behind the template's organic growth. On by default, turned off with one line — no judgment either way, it's every fork's own footer.

On the upstream itself (when `authorGit` already points at `github.com/KeeGooRoomiE/cv_hub`) the credit doesn't render automatically — otherwise there'd be two links side by side with different labels and the same href, pure noise. The condition is `authorGit !== upstreamGit`, not a separate flag: nothing extra needs to be switched off on the original repository, it simply doesn't appear on its own.
