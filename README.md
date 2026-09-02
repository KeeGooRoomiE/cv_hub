# CV Hub

**Your personal site, CV, and project portfolio — from one YAML file.**

[![Deploy](https://github.com/KeeGooRoomiE/cv_hub/actions/workflows/deploy.yml/badge.svg)](https://github.com/KeeGooRoomiE/cv_hub/actions/workflows/deploy.yml)
[![Latest Release](https://img.shields.io/github/v/release/KeeGooRoomiE/cv_hub?label=release&color=blue)](https://github.com/KeeGooRoomiE/cv_hub/releases)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stars](https://img.shields.io/github/stars/KeeGooRoomiE/cv_hub?style=flat)

![CV Hub Preview — one YAML file in, a full site out](docs/repo-assets/preview_yaml_to_site.png)

🌐 **Live demo:** **[keegooroomie.github.io/cv_hub](https://keegooroomie.github.io/cv_hub/)** — this is the author's real CV, running on CV Hub. There's no separate demo deployment on purpose: what you see is exactly what your fork becomes once you put your own data in.

---

## ⚡ Get your site live in 5 minutes

1. **[Fork this repo](https://github.com/KeeGooRoomiE/cv_hub/fork)** — the button, not `git clone` on this repo directly. Everything below assumes you're inside your own fork.
2. Clone your fork and run it — **requires Node 24+** (`node -v` to check):

```bash
git clone https://github.com/YOUR_ACCOUNT/cv_hub.git
cd cv_hub
npm install
npm run init      # wipe the example CV/portfolio, start from a blank placeholder
npm run dev
```

Open `http://localhost:4321`. Edit `src/content/cv/en.yaml`. Push — site deploys automatically.

`npm run init` is optional but recommended on a fresh fork — it clears this repo's own CV, showcase and case-study data (backed up locally first, never touches git history) and reseeds it from `docs/examples/*`, so you're editing a blank placeholder instead of someone else's resume. Safe to skip if you'd rather study the real example content first.

> Already have a resume? Paste it into Claude or ChatGPT with the prompt from [`docs/LLM-CONTEXT.md`](docs/LLM-CONTEXT.md) and get ready YAML in seconds.

---

## Who this is for

- **You apply as more than one thing.** DevOps *and* fullstack, gamedev *and* Unity tools — and you keep three resumes that drift apart.
- **Your work needs explaining, not listing.** A link to a repo doesn't show how you think; a case-study page does.
- **You apply in more than one language.** EN and RU from one source, not two documents you edit twice.
- **You want to own it.** No platform account, no subscription, no builder that can shut down and take your page with it.

If you need one resume, in one language, for one role — a plain PDF is genuinely a better tool than this.

---

## What you get

Your content lives in YAML — one CV file per language, plus optional deltas for role variants. The build pipeline turns it into everything below:

| | |
|---|---|
| 🌐 Live website | Clean personal site with CV, projects, and case studies |
| 📄 Resume files | PDF, DOCX and TXT for every profile and language — **plus a separate ATS-safe single-column PDF** |
| 🎭 Multiple profiles | DevOps, GameDev, Fullstack — different CV versions, one source |
| 🌍 Multi-language | EN, RU, or any language — switcher included |
| 📁 Case studies | Per-project deep-dive pages: text, images, video, code blocks, deep links |
| 🖨️ Print-ready | `Ctrl+P` on any page produces a clean document, not a dark-theme screenshot |
| 🔍 Findable | `schema.org/Person` structured data, `hreflang`, sitemap, per-page meta |
| 🎨 Themes | 4 built-in themes and 4 animated backgrounds, token-based restyling |
| 🖼️ Social cards | Auto-generated on every build, one per language, from your real CV data |
| ⚙️ Deploy | GitHub Actions → GitHub Pages, custom domain supported, zero config on a fork |

No duplicated resumes. No platform lock-in. No visual builders.

---

## Why CV Hub

You probably maintain:
- A PDF resume (two versions, at least)
- A LinkedIn profile
- A portfolio on Notion, Tilda, or some other platform
- A DOCX somewhere on your desktop

They all drift out of sync.

CV Hub replaces all of them with a single YAML file and a deterministic pipeline:

```
src/content/cv/*.yaml  →  merge  →  DOCX + TXT  →  PDF + ATS PDF  →  static site  →  GitHub Pages
```

Edit once — everything updates. The same source generates your DevOps CV, your GameDev CV, and your portfolio site simultaneously.

---

## Multi-profile system

![Role switcher — one CV source, one URL per role](public/media/projects/cv-hub/profiles.jpg)

The advice everyone gives is "tailor your resume to each role." The reason nobody does it is that maintaining four resumes by hand is miserable. CV Hub does it with deltas:

1. `src/content/cv/en.yaml` — your full base CV
2. `src/content/cv/en_devops.yaml` — a delta with **only the fields that change**
3. `src/scripts/merge.mjs` merges them into `public/cv/en_devops.yaml`
4. The site generates `/devops`, with its own PDF/DOCX/TXT set

Fix a typo in your base CV and every role version inherits it. Add a role and you write ten lines, not another resume.

See **[`docs/INFO.md`](docs/INFO.md)** for merge rules and delta file format.

---

## Resume files — and the ATS problem

![Download card — PDF as the primary action, DOCX secondary](public/media/projects/cv-hub/cover.jpg)

Every build produces four artifacts per profile × language:

| File | Who it's for |
|---|---|
| `resume_{lang}.pdf` | **A human.** Two-column, typeset, the one you link and hand over |
| `resume_{lang}_ats.pdf` | **A parser.** Single column, Arial/Helvetica, standard headings, contacts in the body flow, no icons — reading order in the file matches visual order, top to bottom |
| `resume_{lang}.docx` | **Recruiting agencies**, who reformat resumes onto their own letterhead |
| `resume_{lang}.txt` | **Paste targets** — "paste your resume" textareas, email bodies |

Multi-column layouts are a well-known source of parsing errors in applicant tracking systems: some parsers read straight across both columns and interleave your job titles with your skills. Most resume tools make you choose between a document that looks good and one that parses cleanly. CV Hub generates both from the same data, so you never maintain a stripped-down copy by hand.

Which of them appear as buttons on your site is up to you — see [`site.yml`](#site-wide-settings--siteyml) below. The default is the pair a visitor recognizes.

---

## Showcase and case studies

![Case study page with an embedded video block](public/media/projects/cv-hub/video-block-demo.jpg)

### Project cards

Add projects to `src/content/showcase/projects_{lang}.yaml`. Each card supports metrics, a media gallery, stack tags, an archive toggle and links. A featured card cover can be an image, a GIF, or a silent looping video.

See `docs/examples/example_project.yaml` for a full annotated example.

### Case study pages

For any project you want a deep-dive page, create a YAML file:

```
public/media/projects/{slug}/{slug_underscored}_{lang}.yaml
```

Example: `public/media/projects/cv-hub/cv_hub_en.yaml` → `/showcase/cv-hub/en`

The page is generated automatically. No code changes needed.

Content is built from blocks — `text`, `image`, `video` (local file or a YouTube URL), `code`, `divider`, `links`. Any block takes an `anchor: "id"` for deep-linking (`/showcase/{slug}#quickstart`), and backticks in prose render as inline code. All fields optional. See `docs/examples/example_cs.yaml` for every block type.

To link a project card to its case study:
```yaml
links:
  - label: Case Study
    url: /showcase/cv-hub    # no /cv_hub/ prefix — base is added automatically
    type: product
```

---

## How it compares

All of these are good tools. The table is about scope, not quality — pick the smallest one that covers what you need.

| | CV Hub | RenderCV / YAMLResume | JSON Resume | Reactive Resume | Astro/Hugo portfolio themes |
|---|:--:|:--:|:--:|:--:|:--:|
| Resume as plain text you version in git | ✅ | ✅ | ✅ | — | — |
| Typeset PDF | ✅ | ✅ | ✅ | ✅ | — |
| Separate ATS-oriented variant | ✅ | — | — | — | — |
| DOCX / TXT output | ✅ | — | partial | — | — |
| Personal site with portfolio | ✅ | — | — | — | ✅ |
| Per-project case-study pages | ✅ | — | — | — | partial |
| Role-specific CV versions from one source | ✅ | — | — | — | — |
| Multi-language from one source | ✅ | — | — | partial | partial |
| Runs with no database or account | ✅ | ✅ | ✅ | — | ✅ |

If you only need a beautiful PDF, RenderCV is less machinery. If you want a GUI and don't mind hosting a database, Reactive Resume is friendlier. CV Hub is for the case where the resume, the role variants and the portfolio are one thing.

<sub>Compared against each project's capabilities as of the 1.6.0 release. These tools move; if a row is out of date, open an issue and it gets fixed.</sub>

---

## Site-wide settings — `site.yml`

`src/content/site/site.yml` holds settings that belong to the deployment rather than to any profile or language.

### `downloads` — which buttons appear

```yaml
downloads: [pdf, docx]     # default
```

Available keys: `pdf`, `pdfAts`, `docx`, `txt`. PDF always renders as the single solid primary button; everything else is secondary.

Showing more than one PDF-shaped file needs the **grouped** form, because `pdf` and `pdfAts` would both render a button labeled "PDF". The qualifier lives on the group heading, never on the button:

```yaml
downloads:
  - group: people
    items: [pdf, docx]
  - group: ats
    items: [pdfAts, txt]
```

Group headings are translatable. Full field reference → [`docs/INFO.md`](docs/INFO.md) §17.

### `footerCredit` — the "Made with CV Hub" link

```yaml
footerCredit: true   # default; set to false to remove it
```

Adds a small **Made with CV Hub** link next to the GitHub link in your footer, pointing back at this project. It's on by default because backlinks from real deployed sites are how a project like this gets found at all — and it's one line to turn off, with no hard feelings. Everything else in the footer points at *your* repo, not this one.

---

## How to edit your data

All data lives in `src/content/`:

```
src/content/
  cv/
    en.yaml            ← base CV in English
    ru.yaml            ← base CV in Russian
    en_devops.yaml     ← DevOps delta (optional)
    ru_devops.yaml     ← DevOps delta in Russian (optional)
  profiles/
    profiles.yml       ← profile registry (optional)
  languages/
    languages.yml      ← language config
  site/
    site.yml           ← deployment-wide settings
  showcase/
    projects_{lang}.yaml  ← projects list (per language)
  changelog/
    changelog.yaml     ← version history
  i18n/
    translations.yaml  ← UI strings
```

For the full YAML structure reference — see **[`docs/INFO.md`](docs/INFO.md)**.

### Three ways to fill it in

**A — Edit YAML directly.** Open `src/content/cv/en.yaml`. Field reference in [`docs/INFO.md`](docs/INFO.md).

**B — Import from JSON Resume.**

```bash
npm run resume:import -- docs/cv_en.json en
npm run resume:import:all
npm run resume:linkedin      # parse a LinkedIn PDF export (best-effort)
```

**C — Generate via LLM.** Feed your existing resume (PDF, DOCX, plain text) to Claude or ChatGPT with the prompt from `docs/LLM-CONTEXT.md`. That document also carries full project context for AI tools — feed it before making any code changes.

---

## Language configuration

```yaml
# src/content/languages/languages.yml
default: "ru"
languages:
  - id: "ru"
    label: "RU"
  - id: "en"
    label: "EN"
```

Add any language — create `{lang}.yaml`, add UI strings to `translations.yaml`, and it appears in the language switcher automatically. Every language gets its own resume files, its own social card, and `hreflang` alternates linking the versions together.

---

## Customization

All styles live in `src/styles/global.css`. Token-based — edit only the `:root` block to restyle everything:

```css
:root {
  --bg: #070a10;
  --accent: #3b82f6;
  --text: rgba(233, 238, 247, 0.96);
}
```

### Themes

Four built-in themes. Pick one for your deployment by swapping the import in `Layout.astro`:

| | |
|:--:|:--:|
| ![Frosted](docs/repo-assets/frosted.jpeg) **`frosted.css`** — dark glass, muted tones | ![Light](docs/repo-assets/light.jpeg) **`light.css`** — light background, dark text |
| ![Nordic](docs/repo-assets/nordic.jpeg) **`nordic.css`** — Nord-inspired, cold blue-grey | ![Peachy](docs/repo-assets/peachy.jpeg) **`peachy.css`** — warm peach, light background |

To look at one before committing to it, append `?theme=` to any URL:

```
https://YOUR_ACCOUNT.github.io/cv_hub/?theme=peachy
```

That switch is a developer convenience for choosing your look — visitors to your site don't get a theme picker, and that's deliberate: your CV should look the way you designed it.

### Backgrounds

4 interchangeable backgrounds — swap in one line in `Layout.astro`:

![WaveLines background](docs/repo-assets/bkg-samples/wavelines_example.png)

| Component | Type | Description |
|---|---|---|
| `AnimatedBackground` | CSS-only | Glowing blur orbs, theme-aware, zero JS |
| `GalaxyBackground` | Canvas | Spiral galaxy with mouse parallax |
| `PlayStationWaves` | Canvas | XMB-style filled sine waves, time-of-day hue |
| `WaveLines` | Canvas | XMB-style glowing stroke lines |

Full props reference → [`docs/BKG_INFO.md`](docs/BKG_INFO.md)

---

## How to deploy

### 1. Enable GitHub Pages

`Settings → Pages → Source: GitHub Actions`

### 2. Push your changes

```bash
git add .
git commit -m "update cv data"
git push
```

Your site will be live at `https://YOUR_ACCOUNT.github.io/cv_hub/`

The deploy workflow runs automatically on every push to `main`. `BASE_URL` and `siteUrl` are resolved dynamically from `GITHUB_REPOSITORY` — forks work out of the box without config changes.

### Using your own domain

By default `site`/`base` in `astro.config.mjs` are derived from `GITHUB_REPOSITORY`, which assumes the default `https://YOUR_ACCOUNT.github.io/cv_hub/` project-page URL. To serve from your own domain instead:

1. Set repo variables (`Settings → Secrets and variables → Actions → Variables`) — `SITE_URL=https://cv.example.com` and `BASE_PATH=` (empty — a custom domain is normally served from the root, not a `/cv_hub/` subpath). Pass them into `deploy.yml`'s build job as `env:` alongside the existing steps.
2. Add a `public/CNAME` file containing just your domain (`cv.example.com`, no protocol) — GitHub Pages reads this to route the custom domain. It's a plain `public/` asset, copied to `dist/` like anything else.
3. Point your domain's DNS at GitHub Pages ([GitHub's own guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).

A fork already runs this way in the wild — [antlis.is-a.dev/cv](https://antlis.is-a.dev/cv/en/), on its own domain with the repo renamed.

Everything that needs the site's absolute URL (canonical tags, OG image, sitemap) reads from Astro's own `site` config — set `SITE_URL`/`BASE_PATH` once and the rest follows.

---

## Resume file generation

```bash
npm run build
```

Build order:
1. `cv:build` — merge YAMLs → `public/cv/`
2. `resume:generate` — DOCX + TXT
3. `resume:pdf` — PDF + ATS PDF via Playwright
4. `astro build` — static site
5. `og:generate` — social cards, one per language

Output: `public/downloads/resume_{lang}[_{spec}].{pdf|docx|txt}`, plus the ATS-safe single-column PDF at `resume_{lang}[_{spec}]_ats.pdf`.

Publishing a GitHub Release regenerates all of them and attaches them to the release, so every version is a self-contained CV snapshot.

---

## CLI reference

```bash
npm run init                 # fresh fork: wipe example CV/portfolio, reseed from docs/examples/*
npm run dev                  # start local dev server
npm run build                # full build: merge → generate → pdf → astro → og
npm run cv:build             # merge base + spec YAMLs → public/cv/
npm run resume:generate      # generate DOCX + TXT for all profiles
npm run resume:pdf           # generate PDF + ATS PDF for all profiles via Playwright
npm run og:generate          # regenerate social cards
npm run resume:import        # convert JSON Resume → YAML (single file)
npm run resume:import:all    # convert both cv_en.json and cv_ru.json
npm run resume:linkedin      # parse LinkedIn PDF export → YAML (best-effort)
```

---

## Project structure

```
src/
  content/
    cv/                    # CV data (base + deltas)
    profiles/profiles.yml
    languages/languages.yml
    site/site.yml          # deployment-wide settings
    i18n/translations.yaml
    showcase/projects_{lang}.yaml
    changelog/changelog.yaml
  pages/
    index.astro            # default profile + default lang
    [...slug].astro        # all other profile × lang combos
    showcase/
      index.astro          # default lang
      [...rest].astro      # non-default langs + case study pages
    changelog.astro
    og-preview/[lang].astro  # screenshot source for social cards
  components/
    Layout.astro
    HomePage.astro
    ProjectCard.astro
    ProjectPage.astro      # case study page template
    blocks/                # Text, Image, Video, Code, Divider, InlineText
    AnimatedBackground.astro
    GalaxyBackground.astro
    PlayStationWaves.astro
    WaveLines.astro
  scripts/
    init.mjs               # fresh-fork onboarding
    merge.mjs
    resume-export-pdf.mjs  # PDF + ATS PDF
    resume-import-json.mjs
    generate-og-image.mjs
  styles/
    global.css
    themes/

public/
  cv/                      # merged YAMLs (generated)
  downloads/               # resume files (generated)
  media/projects/          # project assets + case study YAMLs
  themes/

.github/
  scripts/generate-resume.js
  workflows/               # deploy.yml, ci.yml, release.yml

docs/
  INFO.md                  # data structure + field reference
  ENGINEERING.md           # architecture decisions
  BKG_INFO.md              # background components
  LLM-CONTEXT.md           # full project context for AI tools
  examples/
    example_cv.yaml
    example_cv.json
    example_project.yaml
    example_cs.yaml        # all case study block types
```

---

## Tech stack

- [Astro 7](https://astro.build) — static site generator
- YAML — single source of truth, validated by Zod schemas
- [docx](https://docx.js.org) — DOCX generation
- [Playwright](https://playwright.dev) — PDF and social-card rendering
- GitHub Pages — deployment
- GitHub Actions — CI on every PR, deploy on every push, artifacts on every release

Requires Node 24.

---

## Documentation

| File | Description |
|---|---|
| [INFO.md](docs/INFO.md) | YAML field reference, routing, i18n, profiles, case studies, `site.yml` |
| [ENGINEERING.md](docs/ENGINEERING.md) | Architecture decisions, system design, trade-offs |
| [`LLM-CONTEXT.md`](docs/LLM-CONTEXT.md) | Full project context for AI tools (Claude, ChatGPT, Cursor) |
| [BKG_INFO.md](docs/BKG_INFO.md) | All background components — props, tuning, previews |
| [CHANGELOG.md](CHANGELOG.md) | Full technical changelog · [live history](https://keegooroomie.github.io/cv_hub/changelog) · [releases](https://github.com/KeeGooRoomiE/cv_hub/releases) |

---

## Sites built with CV Hub

| Site | Who | |
|---|---|---|
| [keegooroomie.github.io/cv_hub](https://keegooroomie.github.io/cv_hub/) | Alexander Gusarov — DevOps / Fullstack / GameDev | the original |
| [antlis.is-a.dev/cv](https://antlis.is-a.dev/cv/en/) | Anton Lisovsky — Senior Front-end Developer (Vue.js) | own domain |
| [kennusk.github.io/cv_hub](https://kennusk.github.io/cv_hub/) | Valeria Kovalikova — Product / UX-UI Designer | not an engineer |
| [lemonbw.github.io/cv_hub](https://lemonbw.github.io/cv_hub/) | Sergey Shter — Fullstack Developer | GitHub Pages |

**Yours belongs here.** If you've deployed a fork, [open a pull request](https://github.com/KeeGooRoomiE/cv_hub/compare) adding one row to this table — your live URL and a short line about you. That's the whole review process. Seeing real sites is what convinces the next person that this works, so it genuinely helps.

Not ready for a PR? [Open an issue](https://github.com/KeeGooRoomiE/cv_hub/issues/new) with your link and it'll get added.

---

## Contributing

Bug reports, ideas and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Issues tagged `good first issue` are a reasonable place to start.

[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse-Performance%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomie.github.io/cv_hub/)
[![Lighthouse Accessibility](https://img.shields.io/badge/Lighthouse-Accessibility%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomie.github.io/cv_hub/)
[![Lighthouse Best Practices](https://img.shields.io/badge/Lighthouse-Best%20Practices%2096-00C853?logo=lighthouse&logoColor=white)](https://keegooroomie.github.io/cv_hub/)
[![Lighthouse SEO](https://img.shields.io/badge/Lighthouse-SEO%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomie.github.io/cv_hub/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/KeeGooRoomiE/cv_hub/blob/main/CONTRIBUTING.md)

---

## License

Source code: MIT
Content (resume data): © Author
