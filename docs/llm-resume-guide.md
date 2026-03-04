<!--
  llm-resume-guide.md
  CV Hub

  Created by Alexander Gusarov on 04.03.2026.
  @spartan121
-->

# LLM Resume Guide

How to generate YAML resume files using language models (Claude, ChatGPT, etc.)

---

## Why this exists

CV Hub stores all resume data in YAML files (`cv/en.yaml`, `cv/ru.yaml`).

If you already have a resume in PDF, DOCX, plain text, or any other format — no need to fill in the YAML manually. Hand it to an LLM with the prompt below and get ready YAML to drop into the project.

Alternatively, if your resume exists as a JSON Resume file, you can convert it directly via CLI — no LLM needed.

---

## Supported input formats

- PDF — paste the text or attach the file directly in Claude / ChatGPT
- DOCX — open and copy the content, or attach the file
- Plain text / Markdown
- LinkedIn — `linkedin.com/in/you → More → Save to PDF`
- JSON Resume — convert directly via `npm run resume:import`
- Any other text format with professional information

---

## Option A — Convert from JSON Resume (CLI, no LLM)

If your resume is already in [JSON Resume](https://jsonresume.org) format, you can convert it directly to YAML without using an LLM.

### 1. Place your JSON file

```
docs/cv_en.json   ← English version
docs/cv_ru.json   ← Russian version
```

### 2. Run the converter

```bash
# Single language
npm run resume:import -- docs/cv_en.json en
npm run resume:import -- docs/cv_ru.json ru

# Both at once
npm run resume:import:all
```

### 3. Result

```
src/content/cv/en.yaml   ← ready to use
src/content/cv/ru.yaml   ← ready to use
public/downloads/json/cv_en.json
public/downloads/json/cv_ru.json
```

### JSON Resume field mapping

| JSON Resume | CV Hub YAML |
|---|---|
| `basics.label` | `title` |
| `basics.profiles[]` | `contacts[]` |
| `work[].name` | `experience[].company` |
| `work[].position` | `experience[].role` |
| `work[].highlights[]` | `experience[].description[]` |
| `work[].keywords[]` | `experience[].stack[]` |
| `work[].startDate` + `endDate` | `experience[].period` |
| `skills[].name` | `skills[].group` |
| `skills[].keywords[]` | `skills[].items[]` |
| `languages[].fluency` | `languages[].level` |
| `education[].studyType` + `area` | `education[].degree` |
| `x_achievements[]` | `achievements[]` |

> **Note:** `x_achievements` is a custom field outside the JSON Resume standard.
> Add it manually to your JSON file if needed.

---

## Option B — Generate from any resume via LLM

### 1. Prepare your resume

Copy all text from your resume, or attach the PDF/DOCX file directly — Claude and ChatGPT can read attachments.

### 2. Open a language model

Recommended:
- [Claude](https://claude.ai) — handles attachments and structured data well
- [ChatGPT](https://chat.openai.com)

### 3. Paste the prompt and attach your resume

Copy the full prompt below, paste it into the chat, then attach your resume file (or paste the text after the prompt).

---

## Prompt

```
You are helping convert a resume into structured YAML for the CV Hub project.

Your task: transform the provided resume into two YAML files — English and Russian versions.
If the original is in only one language, translate the other yourself.

Return ONLY raw YAML. No explanations, no comments, no markdown code fences.

---

Structure of cv/en.yaml (same structure for cv/ru.yaml):

name: ""
title: ""
summary: ""

contacts:
  - label: Email
    url: mailto:
  - label: GitHub
    url: https://github.com/
  - label: Telegram
    url: https://t.me/
  - label: LinkedIn
    url: https://linkedin.com/in/

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

---

Rules:
- Never invent information. Use only what is in the resume.
- If a field is not present in the resume — leave an empty string or empty list.
- summary: write a concise professional summary in first person (2–3 sentences) based on the resume content.
- achievements: key career highlights with numbers. Omit if none exist.
- skills: group by logical categories (Languages, Frameworks, DevOps, Cloud, Databases, Tools, etc.).
- experience: chronological order, newest first.
- experience.description: use a list of bullet points, not a single string.
- experience.stack: only technologies actually mentioned in that job description.
- contacts: include only contacts present in the resume.

Return en.yaml first, then ru.yaml, separated by exactly this line: --- RU ---
```

---

### 4. Get the YAML

The model will return two blocks — English and Russian versions separated by `--- RU ---`.

### 5. Insert into the project

Copy each block into the corresponding file:

```
src/content/cv/en.yaml
src/content/cv/ru.yaml
```

**Via GitHub UI:**
1. Open `src/content/cv/en.yaml`
2. Click **Edit** (pencil icon)
3. Paste the generated YAML
4. Click **Commit changes**

Repeat for `ru.yaml`. The site will rebuild and deploy automatically.

**Via terminal:**
```bash
# paste content into files, then:
git add src/content/cv/
git commit -m "update cv data"
git push
```

### 6. Verify locally

```bash
npm run dev
```

Open `http://localhost:4321` and check that everything renders correctly.

---

## Expected output example

```yaml
name: "Jane Doe"
title: "Frontend Developer"
summary: >
  Frontend Developer with 5 years of experience building React applications.
  Focused on performance, accessibility and clean component architecture.

contacts:
  - label: Email
    url: mailto:jane@example.com
  - label: GitHub
    url: https://github.com/janedoe

achievements:
  - Led migration from CRA to Vite — build time reduced from 90s to 8s
  - Open source component library — 2K+ GitHub stars

skills:
  - group: Languages
    items: [JavaScript, TypeScript]
  - group: Frameworks
    items: [React, Next.js, Vue]

experience:
  - company: "Acme Corp"
    role: "Frontend Developer"
    period: "Jan 2022 — present"
    description:
      - Built and maintained design system used across 4 products
      - Reduced bundle size by 40% through code splitting and lazy loading
    stack: [React, TypeScript, Vite, Storybook]

education:
  - institution: "State University"
    degree: "Computer Science"
    period: "2015–2019"

languages:
  - language: English
    level: Native
```

---

## Common situations

**Resume is only in Russian:**
The prompt will ask the model to translate. You can add: *"Original is in Russian, translate en.yaml into professional English."*

**Non-standard sections (certifications, publications, open source):**
Add to the prompt:
```
Also include this section:
certifications:
  - name: ""
    issuer: ""
    year: ""
```

**Resume is too long to paste:**
Split it — send experience first, then skills and education in a follow-up message.

**Only need EN or only RU:**
Remove the `--- RU ---` line from the prompt and specify which language you need.

---

## Flow

```
PDF / DOCX / TXT / LinkedIn PDF
        ↓
   LLM + prompt          ← Option B
        ↓
   en.yaml + ru.yaml
        ↑
   JSON Resume (.json)
        ↓
   npm run resume:import  ← Option A (no LLM)
        ↓
   git commit + push
        ↓
   CV Hub rebuilds → site + resume files regenerated
```

YAML is the single source of truth. Everything else is generated from it.