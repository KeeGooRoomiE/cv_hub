# CV Hub — INFO

Полный справочник по структуре данных, конфигурации и архитектуре проекта.

---

## Содержание

1. [Структура файлов данных](#1-структура-файлов-данных)
2. [CV YAML — полный справочник полей](#2-cv-yaml--полный-справочник-полей)
3. [Multi-profile система](#3-multi-profile-система)
4. [Языки и i18n](#4-языки-и-i18n)
5. [Showcase — projects.yaml](#5-showcase--projectsyaml)
6. [Case Study страницы](#6-case-study-страницы)
7. [Changelog — changelog.yaml](#7-changelog--changelogyaml)
8. [Поток данных](#8-поток-данных)
9. [Компоненты](#9-компоненты)
10. [Роутинг](#10-роутинг)
11. [Генерация документов](#11-генерация-документов)
12. [LLM-контекст](#12-llm-контекст)

---

## 1. Структура файлов данных

```
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
    projects.yaml        ← showcase projects
  changelog/
    changelog.yaml       ← version history

public/
  media/
    projects/
      {slug}/            ← project assets
        cover.png
        {slug_}_{lang}.yaml  ← case study content (optional)
```

После выполнения `npm run cv:build` в `public/cv/` появляются смёрженные артефакты.

---

## 2. CV YAML — полный справочник полей

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

`skills` поддерживает и плоский формат (массив строк), и групповой. Оба можно смешивать.

---

## 3. Multi-profile система

### profiles.yml

```yaml
profiles:
  - id: default
    label: "Generalist"
    slug: ""        # пустая строка = корень /
    spec: null      # null = копировать base как есть
  - id: devops
    label: "DevOps"
    slug: "devops"
    spec: devops    # читает en_devops.yaml, ru_devops.yaml
```

`slug` (URL) и `spec` (префикс файла) — разные вещи, могут отличаться.

### Delta-файл

Содержит только то, что меняется. Остальное берётся из base.

```yaml
# src/content/cv/en_devops.yaml
title: "DevOps / Platform Engineer | Kubernetes · Terraform · AWS"

skills:
  - group: Orchestration
    items: [Kubernetes, Helm, Docker]

experience:
  - company: InfoScale        # берётся целиком из base
  - company: AZNResearch
    role: "Backend Engineer"  # переопределяем role
    description:
      - "Focused bullet for DevOps context"
```

### Правила merge

| Поле | Поведение |
|---|---|
| Скалярные (`title`, `summary`) | spec wins; отсутствующие — из base |
| `skills` | Целиком заменяется если указан в spec |
| `experience` | Whitelist по `company`; поля мёрджатся per entry |
| `achievements`, `contacts`, `education`, `languages` | Целиком заменяется если указан в spec |

---

## 4. Языки и i18n

### languages.yml

```yaml
default: "ru"
languages:
  - id: "ru"
    label: "RU"
  - id: "en"
    label: "EN"
```

`default` определяет язык для URL без языкового сегмента.

### Добавление языка

1. Добавить запись в `languages.yml`
2. Создать `src/content/cv/{lang}.yaml`
3. Добавить переводы в `translations.yaml`
4. Опционально: `src/content/cv/{lang}_{spec}.yaml` для каждого профиля

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

Фоллбек-цепочка: запрошенный язык → `en` → ключ пути.

---

## 5. Showcase — projects.yaml

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
    featured: true            # показывает pin-иконку
    archived: false           # сворачивает карточку с toggle
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
        url: /showcase/bhop-jump   # без /cv_hub/ — base подставится автоматически
        type: product
```

**Никогда не хардкодить `/cv_hub/` в URL.** Внутренние пути пишутся без base-префикса.

---

## 6. Case Study страницы

### Как это работает

Страница генерируется автоматически если файл существует:

```
public/media/projects/{slug}/{slug_underscored}_{lang}.yaml
```

Примеры:
```
public/media/projects/cv-hub/cv_hub_ru.yaml   → /showcase/cv-hub
public/media/projects/cv-hub/cv_hub_en.yaml   → /showcase/cv-hub/en
```

Никаких изменений в `.astro` файлах не нужно.

### Структура YAML

```yaml
title: "Project Title"
role: "My Role"           # опционально
year: "2024"              # опционально
tagline: "Короткое описание под заголовком."

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
      Многострочный текст.

  - type: text
    title: "What I did"
    bullets:
      - Пункт один
      - Пункт два

  - type: image
    title: "Architecture"
    subtitle: "Схема"
    body: "Текст над картинкой."
    src: /media/projects/my-project/arch.png
    alt: "Architecture"
    caption: "Подпись под картинкой"
```

### Типы блоков

| Тип | Поля |
|---|---|
| `text` | `title`, `subtitle`, `body`, `bullets`, `links` — все опциональны |
| `image` | `title`, `subtitle`, `body`, `src`, `alt`, `caption` — все опциональны |
| `divider` | нет полей |

Полный пример всех блоков — `docs/examples/example_cs.yaml`.

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

Типы: `added`, `changed`, `fixed`, `removed`.

---

## 8. Поток данных

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

## 9. Компоненты

### Layout.astro

Props:
- `title`, `lang`, `section`, `profile`
- `customLangLinks` — переопределяет автоматические ссылки language switcher

**Showcase и case study страницы обязаны передавать `customLangLinks`**, иначе переключатель языка ведёт на CV-роуты.

### ProjectPage.astro

Props: `data`, `showcaseHref`, `langLinks`, `lang`

### ProjectCard.astro

Два режима: обычная карточка и сворачиваемая архивная.

### Блоки (`blocks/`)

`TextBlock.astro`, `ImageBlock.astro`, `DividerBlock.astro` — используются в `ProjectPage`.

---

## 10. Роутинг

| URL | Файл | Данные |
|---|---|---|
| `/` | `index.astro` | `public/cv/{defaultLang}.yaml` |
| `/en` | `[...slug].astro` | `public/cv/en.yaml` |
| `/devops` | `[...slug].astro` | `public/cv/{defaultLang}_devops.yaml` |
| `/devops/en` | `[...slug].astro` | `public/cv/en_devops.yaml` |
| `/showcase` | `showcase/index.astro` | `projects.yaml` |
| `/showcase/en` | `showcase/[...rest].astro` | kind=list |
| `/showcase/{slug}` | `showcase/[...rest].astro` | case study, default lang |
| `/showcase/{slug}/en` | `showcase/[...rest].astro` | case study, en |
| `/changelog` | `changelog.astro` | `changelog.yaml` |

---

## 11. Генерация документов

```bash
npm run build
# 1. cv:build          → public/cv/ (merged YAMLs)
# 2. resume:generate   → DOCX + TXT
# 3. resume:pdf        → PDF via Playwright
# 4. astro build       → static site
```

Именование: `resume_{lang}[_{spec}].{ext}`

| Профиль | Язык | Файл |
|---|---|---|
| default | ru | `resume_ru.pdf` |
| devops | en | `resume_en_devops.pdf` |
| gamedev | ru | `resume_ru_gamedev.docx` |

---

## 12. LLM-контекст

Для работы с проектом через AI-инструменты (Claude, ChatGPT, Cursor) используйте файл `docs/llm-context.md`.

Скормите его нейросети перед любыми правками в проекте. Он содержит:
- Полную архитектуру, роутинг и дерево файлов
- Правила работы с BASE_URL
- Частые ошибки и как их избежать
- Промпт для генерации CV YAML из резюме
- Инструкции по добавлению языков, профилей, кейс стади