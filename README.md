# CV Hub

![Deploy](https://github.com/KeeGooRoomiE/cv_hub/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Astro](https://img.shields.io/badge/built%20with-Astro-ff5d01)

**Resume as Code.** A static, data-driven personal CV site built with Astro and powered by a single YAML source of truth.

Instead of maintaining separate PDF, DOC, web, and LinkedIn versions — one YAML file generates everything.

🌐 **[keegooroomie.github.io/cv_hub](https://keegooroomie.github.io/cv_hub/)**

---

## Who is this for

CV Hub works for anyone who wants a professional website with full personal control:

- Developers, DevOps engineers, designers, managers, analysts — any specialist
- Anyone tired of Tilda, Notion, Canva, and other platforms
- Anyone who wants to version their resume with Git and automate format generation

> Minimum requirement — basic familiarity with the command line and Git. If you can clone a repo and edit text files, that's enough.

---

## What you get

- Main page — CV
- Showcase page — projects and case studies
- Two language support (RU / EN)
- Downloadable resume files (PDF / DOCX / TXT) generated automatically from YAML
- Clean static HTML deployed on GitHub Pages
- Full control over the visual style through a single CSS file

---

## Quick start

### 1. Fork the repository

Click **Fork** in the top right corner of the repository page on GitHub.

After forking you'll have your own copy: `github.com/YOUR_ACCOUNT/cv-hub`

### 2. Clone to your local machine

```bash
git clone https://github.com/YOUR_ACCOUNT/cv-hub.git
cd cv-hub
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run locally

```bash
npm run dev
```

The site will be available at:

```
http://localhost:4321
```

Pages:
- `http://localhost:4321/` — main CV page
- `http://localhost:4321/showcase` — projects showcase

---

## How to edit your data

All data is stored in YAML files inside `src/content/`.

```
src/content/
  cv/
    en.yaml       ← CV in English
    ru.yaml       ← CV in Russian
  showcase/
    projects.yaml ← projects list
```

For full YAML structure reference and field descriptions — see **[`docs/INFO.md`](docs/INFO.md)**.

---

## How to customize the look

All styles live in one file:

```
public/styles/global.css
```

The file is token-based — to change the color scheme of the entire site, just edit the `:root` block at the top:

```css
:root {
  --bg: #0b0f14;          /* background color */
  --surface: #0f1620;     /* card background */
  --text: #e9eef7;        /* primary text */
  --muted: #a6b1c2;       /* secondary text */
  --accent: #3b82f6;      /* accent color (blue by default) */
  --accent-2: #60a5fa;    /* secondary accent / hover */
}
```

Change one variable — the whole site updates. Dark theme is used by default.

---

## How to deploy to GitHub Pages

### 1. Enable GitHub Pages in repository settings

`Settings → Pages → Source: GitHub Actions`

### 2. Push your changes

```bash
git add .
git commit -m "update cv data"
git push
```

Your site will be live at:

```
https://YOUR_ACCOUNT.github.io/cv-hub/
```

The deploy workflow runs automatically on every push to `main`. The `base` URL is resolved dynamically from `GITHUB_REPOSITORY` — so forks work out of the box without any config changes.

---

## Resume file generation

DOCX and TXT files are generated automatically from YAML during build:

```bash
npm run build
# runs: node scripts/generate-resume.js && astro build
```

To generate files without building the site:

```bash
npm run generate
```

Output:
```
public/downloads/resume_en.txt
public/downloads/resume_ru.txt
public/downloads/resume_en.docx
public/downloads/resume_ru.docx
```

PDF is placed manually into `public/downloads/` for now. Automated PDF generation via Playwright is planned.

---

## Generate YAML from an existing resume

If you already have a resume in PDF or DOCX — no need to fill in the YAML manually.

Use an LLM (ChatGPT, Claude, etc.) with the ready-made prompt:

👉 **[See `docs/llm-resume-guide.md`](docs/llm-resume-guide.md)**

Step-by-step instructions and a prompt that takes your resume and returns ready YAML to drop into the project.

---

## Documentation

```
docs/
  INFO.md                ← Project overview, YAML reference, data flow
  ENGINEERING.md         ← Engineering decisions and project philosophy
  llm-resume-guide.md    ← How to generate YAML from a resume using an LLM
```

**`INFO.md`** — start here if you want to understand the project or adapt it. Covers goals, architecture, full YAML schema with examples, and component structure.

**`ENGINEERING.md`** — architectural journal. Explains why Astro over React or Angular, why YAML, what trade-offs were made deliberately.

---

## Project structure

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
    showcase.astro     # Showcase page
  components/
    Layout.astro
    Header.astro
    HomePage.astro
public/
  styles/
    global.css         # All site styles
  downloads/           # Generated resume files
scripts/
  generate-resume.js   # DOCX + TXT generator
docs/
  INFO.md
  ENGINEERING.md
  llm-resume-guide.md
```

---

## Tech stack

- [Astro](https://astro.build) — static site generator
- YAML — single source of truth
- [docx](https://docx.js.org) — DOCX generation
- GitHub Pages — deployment
- GitHub Actions — CI/CD

---

## License

Source code: MIT  
Content (resume data): © Author