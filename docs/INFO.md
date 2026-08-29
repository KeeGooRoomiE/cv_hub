# CV Hub — INFO

> 🌐 **This reference is Russian-only for now** (established convention for this file — see `CLAUDE.md`). If you don't read Russian: [README.md](../README.md) covers quickstart/CLI/deployment in English, and [`docs/LLM-CONTEXT.md`](LLM-CONTEXT.md) is English too. A full English version of this file is tracked as a pre-launch item, not done yet — feel free to open an issue if you need something from here translated sooner.

Полный справочник по структуре данных, конфигурации и архитектуре проекта.

---

## Содержание

1. [Структура файлов данных](#1-структура-файлов-данных)
2. [CV YAML — полный справочник полей](#2-cv-yaml--полный-справочник-полей)
3. [Multi-profile система](#3-multi-profile-система)
4. [Языки и i18n](#4-языки-и-i18n)
5. [Showcase — project list](#5-showcase--project-list)
6. [Case Study страницы](#6-case-study-страницы)
7. [Changelog — changelog.yaml](#7-changelog--changelogyaml)
8. [Поток данных](#8-поток-данных)
9. [Компоненты](#9-компоненты)
10. [Роутинг](#10-роутинг)
11. [Генерация документов](#11-генерация-документов)
12. [OG-image пайплайн](#12-og-image-пайплайн)
13. [LLM-контекст](#13-llm-контекст)
14. [npm run init — онбординг форка](#14-npm-run-init--онбординг-форка)
15. [Свой домен — SITE_URL / BASE_PATH](#15-свой-домен--site_url--base_path)
16. [JSON-LD и hreflang](#16-json-ld-и-hreflang)
17. [site.yml — настройки уровня сайта](#17-siteyml--настройки-уровня-сайта)

---

## 1. Структура файлов данных

```
src/content.config.ts    ← схемы коллекций + Content Layer glob() лоадеры
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
  Layout.astro           ← главный лейаут, подключение фона
  AnimatedBackground.astro  ← CSS-only орбы
  GalaxyBackground.astro    ← canvas галактика с parallax
  PlayStationWaves.astro    ← canvas XMB заливочные волны
  WaveLines.astro           ← canvas XMB световые линии
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
  ENGINEERING.md         ← архитектурные решения и философия
  INFO.md                ← этот файл, справочник по данным
  BKG_INFO.md            ← справочник по фоновым компонентам
  LLM-CONTEXT.md         ← контекст для AI-инструментов
  examples/              ← примеры YAML для CV, showcase, case study
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

`slug` (URL) и `spec` (префикс файла) **должны совпадать** — `merge.mjs` падает с ошибкой, если они разные (роутинг завязан на slug, а файлы CV и скачивания — на spec).

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
| `video` | `title`, `subtitle`, `body`, `src`, `poster`, `alt`, `caption`, `loop` — все опциональны, кроме `src`. См. ниже |
| `code` | `title`, `subtitle`, `body`, `caption` — все опциональны, кроме `body`. См. ниже |
| `divider` | нет полей |

Все блоки, кроме `divider`, дополнительно принимают `anchor` — id для якорной ссылки (`/showcase/{slug}#anchor-name`), см. ниже.

Полный пример всех блоков — `docs/examples/example_cs.yaml`.

#### Инлайн-код в тексте

В `title`, `subtitle`, `body` и элементах `bullets` любого блока (`text`, `image`, `video`, `code`) `` `текст в бэктиках` `` рендерится как стилизованный `<code>`, а не буквальными кавычками. Полноценный markdown не парсится — только этот один инлайн-паттерн.

```yaml
- type: text
  body: |
    Конфиг лежит в `astro.config.mjs`, а данные читаются из `public/cv/`.
```

Компонент — `src/components/blocks/InlineText.astro`, общий для всех блоков.

#### `anchor` — якорные ссылки

Любой блок (кроме `divider`) может задать `anchor: "some-id"` — тогда его корневой элемент получает `id="some-id"`, и на него можно сослаться напрямую: `/showcase/{slug}#some-id` (или `/showcase/{slug}/{lang}#some-id`). Учитывает высоту sticky-шапки (`scroll-margin-top`), так что переход по якорю не прячет заголовок блока под хедером.

```yaml
- type: text
  title: "Quickstart"
  anchor: "quickstart"
  body: |
    Этот раздел можно открыть напрямую по ссылке .../showcase/cv-hub#quickstart
```

#### `code`-блок

Моноширинный блок для команд/сниппетов. `body` рендерится **дословно** — без парсинга инлайн-кода (это код для копирования, а не проза); `title`/`subtitle`/`caption` — обычная проза с поддержкой `` `бэктиков` ``. Без движка подсветки синтаксиса — намеренно, чтобы не тащить лишнюю зависимость ради нескольких bash-команд.

```yaml
- type: code
  title: "Клонирование"
  body: |
    git clone https://github.com/YOUR_ACCOUNT/cv_hub.git
    cd cv_hub
```

Компонент — `src/components/blocks/CodeBlock.astro`.

#### `video`-блок

`src` определяет режим рендера:

- **YouTube** — если `src` похож на `youtube.com/watch?v=...`, `youtu.be/...` или `youtube.com/embed/...`, id видео вытаскивается автоматически и блок рендерит адаптивный `<iframe>` 16:9 (YouTube Player API, `loading="lazy"`).
- **Локальный/захостенный файл** — любой другой `src` (обычно `/media/projects/{slug}/clip.mp4`) рендерится как `<video>`:
  - `loop: true` → тихий автоплей в цикле, без controls (короткие фоновые клипы)
  - `loop: false` / не указано → controls + опциональный `poster`, `preload="metadata"` (длинные клипы)

```yaml
# YouTube — трейлер/геймплей без хостинга своего mp4
- type: video
  title: "Trailer"
  src: https://www.youtube.com/watch?v=dQw4w9WgXcQ
  caption: "Официальный трейлер"

# Локальный файл — короткий зацикленный клип
- type: video
  src: /media/projects/my-project/boss-fight.mp4
  loop: true
  alt: "Финальный босс"
```

Компонент — `src/components/blocks/VideoBlock.astro`.

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
- `description` — мета-описание страницы (опционально, есть дефолт из translations)
- `ogImage` — URL OG-картинки (опционально, есть дефолт `/media/og-image-{lang}.png` — по языку страницы, автогенерируется, см. раздел 12)
- `customLangLinks` — переопределяет автоматические ссылки language switcher

**Showcase и case study страницы обязаны передавать `customLangLinks`**, иначе переключатель языка ведёт на CV-роуты.

Содержит dropdown-меню ролей (если профилей > 1). Dropdown работает через JS click-toggle с click-outside и Escape для закрытия.

### ProjectPage.astro

Props: `data`, `showcaseHref`, `langLinks`, `lang`

### ProjectCard.astro

Два режима: обычная карточка и сворачиваемая архивная (`archived: true` в YAML).  
Prop `hasCasePage` — добавляет ссылку на case study если страница существует.

### Блоки (`blocks/`)

`TextBlock.astro`, `ImageBlock.astro`, `DividerBlock.astro` — используются в `ProjectPage`.

### Фоновые компоненты

Взаимозаменяемы — подключается один в `Layout.astro`. Подробный справочник по всем параметрам — `docs/BKG_INFO.md`.

| Компонент | Описание |
|---|---|
| `AnimatedBackground` | CSS-only, без JS, 4 blur-орба, theme-aware |
| `GalaxyBackground` | Canvas, спиральная галактика с mouse parallax |
| `PlayStationWaves` | Canvas, XMB-стиль, заливочные синусоидальные волны |
| `WaveLines` | Canvas, XMB-стиль, световые линии с glow |

---

## 10. Роутинг

| URL | Файл | Данные |
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

## 11. Генерация документов

```bash
npm run build
# 1. cv:build          → public/cv/ (merged YAMLs)
# 2. resume:generate   → DOCX + TXT
# 3. resume:pdf        → PDF via Playwright
# 4. astro build       → static site
# 5. og:generate        → public/media/og-image.png + dist/media/og-image.png
```

Именование: `resume_{lang}[_{spec}].{ext}`. У PDF два варианта на каждый `lang[_spec]` — обычный (двухколоночный, для человека) и ATS-safe (одноколоночный, суффикс `_ats`, для парсеров).

| Профиль | Язык | Файл |
|---|---|---|
| default | ru | `resume_ru.pdf` |
| default | ru | `resume_ru_ats.pdf` |
| devops | en | `resume_en_devops.pdf` |
| gamedev | ru | `resume_ru_gamedev.docx` |

---

## 12. OG-image пайплайн

Скрипт: `src/scripts/generate-og-image.mjs`. Идёт последней стадией `npm run build` (после `astro build`), но можно запускать и отдельно — тогда сначала нужен свежий `dist/`:

```bash
GITHUB_REPOSITORY="KeeGooRoomiE/cv_hub" npx astro build   # сначала — свежий dist/
npm run og:generate                                       # затем — сам пайплайн
```

### Одна картинка на язык, не на профиль и не на кейс

Сознательный размен: полный охват (по профилю и по кейсу тоже) кратно увеличил бы число Playwright-скриншотов и время сборки, а дип-линк на конкретный кейс всё равно менее приоритетен, чем то, что показывает превью резюме реальные данные, а не мок-персону. Вместо этого — по одной картинке на настроенный язык (`en`, `ru`), из **дефолтного профиля**: `/devops`, `/showcase/{slug}` и любая другая страница той же локали просто переиспользуют её через `Layout.astro`'шный дефолт `ogImage ?? .../og-image-{lang}.png` — каждая страница уже знает свой `lang`, поэтому подбор происходит бесплатно, без отдельного прохода на страницу.

### Как это работает

1. Поднимает `astro preview` на порту `4523` (не пересекается с dev `4321`), обслуживая уже собранный `dist/`.
2. Список языков читает напрямую из `src/content/languages/languages.yml` (не через Astro content collections — это отдельный Node-скрипт).
3. На каждый язык — реальным headless-браузером (Playwright, `channel: 'chrome'` на CI — без загрузки браузера, тот же паттерн, что и у `resume-export-pdf.mjs`) рендерит `/og-preview/{lang}` (`getStaticPaths()`-роут, `src/pages/og-preview/[lang].astro`) — он показывает реальный CV дефолтного профиля из `public/cv/{lang}.yaml` (тот же файл, что читает `index.astro`; фоллбэк на мок `docs/examples/example_cv.yaml` только если этого файла ещё нет — например, скрипт запустили в обход `cv:build`).
4. Снимает скриншот 1600×1000. Design-токены (`--bg`, `--accent` и т.д.) читает из вычисленных стилей отрендеренной страницы один раз (на первом языке) и переиспользует для всех остальных — тема не зависит от контента CV, пересчитывать на каждый язык незачем.
5. Композитит на второй странице: скриншот в рамке (скруглённые углы, белая обводка, тень) поверх фонового wallpaper — либо радиального градиента из тех же токенов, либо указанного изображения.
6. На каждый язык пишет `public/media/og-image-{lang}.png` (gitignored, пересобирается каждый билд) и патчит уже собранный `dist/media/og-image-{lang}.png` — без второго полного `astro build`.
7. В конце удаляет весь `dist/og-preview/` — эти роуты существуют только чтобы быть заскриншоченными, в продакшн не идут (также исключены из sitemap).

### Аргументы CLI

```bash
node src/scripts/generate-og-image.mjs [--theme=<name>] [--wallpaper=gradient|<path>]
```

| Флаг | Значения | По умолчанию |
|---|---|---|
| `--theme` | Имя файла из `src/styles/themes/` без `.css` (`frosted`, `light`, `nordic`, `peachy`) | не указан → дефолтная тема. Неизвестное имя — предупреждение в консоль и тот же фоллбэк |
| `--wallpaper` | `gradient` — градиент из токенов активной темы (всегда синхронен, без лишнего файла) · путь к изображению относительно корня репо — встраивается как `background-image` (data URI) | `gradient` |

Примеры:

```bash
npm run og:generate -- --theme=nordic
npm run og:generate -- --wallpaper=docs/repo-assets/bkg-samples/wavelines_example.png
npm run og:generate -- --theme=peachy --wallpaper=gradient
```

### В CI

Идёт отдельным шагом и в `deploy.yml`, и в `ci.yml` (после `astro build`, до аплоада артефактов) — на CI одинаковые аргументы по умолчанию (тема не указана, wallpaper=gradient). Результат в `ci.yml` дополнительно выгружается как артефакт `og-images` (маска `public/media/og-image-*.png`, все языки), чтобы можно было посмотреть превью прямо из PR, не дожидаясь деплоя.

---

## 13. LLM-контекст

Для работы с проектом через AI-инструменты (Claude, ChatGPT, Cursor) используйте файл `docs/LLM-CONTEXT.md`.

Скормите его нейросети перед любыми правками в проекте. Он содержит:
- Полную архитектуру, роутинг и дерево файлов
- Правила работы с BASE_URL
- Частые ошибки и как их избежать
- Промпт для генерации CV YAML из резюме
- Инструкции по добавлению языков, профилей, кейс стади

---

## 14. npm run init — онбординг форка

Скрипт: `src/scripts/init.mjs`. Интерактивный, без новых зависимостей (`node:readline/promises`). Одноразово чистит личные данные автора и подставляет вместо них плейсхолдер из `docs/examples/*`, чтобы новый пользователь форка правил чистый пример, а не чужое резюме.

```bash
npm run init
```

Спрашивает: имя, тайтл/роль, оставить ли RU-слот (тем же английским текстом-плейсхолдером, с пометкой `TODO: translate`, для самостоятельного перевода) или только EN.

Затрагивает:

| Что | Как |
|---|---|
| `src/content/cv/*.yaml` | Удаляются все варианты (включая `_devops`/`_gamedev`), пишется свежий `en.yaml` (+ `ru.yaml` при выборе «оба языка») из `docs/examples/example_cv.yaml` с подставленными именем/тайтлом |
| `src/content/profiles/profiles.yml` | Сбрасывается к одному профилю `default` — мультипрофиль отключается, читай раздел 3, чтобы включить обратно |
| `src/content/showcase/projects_{lang}.yaml` | Заменяется одним примером из `docs/examples/example_project.yaml` (без `media:` — обложки ещё нет, карточка рендерится без неё) |
| `public/media/projects/*` | Все старые папки удаляются, создаётся `my-project/my_project_{lang}.yaml` — короткий чистый кейс (не полный «кухонный набор» из `example_cs.yaml`, тот остаётся отдельным референсом по всем типам блоков) |
| `src/content/languages/languages.yml` | Патчится только строка `default:` → `"en"` (список языков не трогается) — раз `en.yaml` теперь единственный файл с настоящим текстом, дефолтный язык сайта должен ему соответствовать |

**Не трогает:** `translations.yaml` (общие UI-строки, не персональные данные), бейджи в `README.md` (обновляются вручную — там ссылки на `KeeGooRoomiE/cv_hub`), `CHANGELOG.md`/`changelog.yaml` (история проекта). `Layout.astro`'шный футер (`GitHub`-ссылка, копирайт) уже сам выводится из `GITHUB_REPOSITORY` — трогать не нужно.

**Безопасность:**
- Перед любой перезаписью всё бэкапится в `.cv-hub-backup-{timestamp}/` (гитигнорится, только локально).
- Второй прогон без `--force` откажет (маркер `.cv-hub-initialized`).
- `--dry-run` — показывает, что будет сделано, ничего не пишет.
- Неинтерактивный режим для тестов/скриптов: `--yes --name="..." --title="..." --lang=en|both`.

После — печатает чеклист следующих шагов (добавить обложку, дописать кейс, поправить бейджи в README и т.д.).

---

## 15. Свой домен — SITE_URL / BASE_PATH

По умолчанию `site`/`base` в `astro.config.mjs` выводятся из `GITHUB_REPOSITORY` (`https://{owner}.github.io`, `/{repo}`) — это адрес обычной GitHub Pages project-страницы. Два env-оверрайда поверх:

```js
// astro.config.mjs
const site = process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'http://localhost:4321');
const base = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : (name ? `/${name}` : undefined);
```

- `SITE_URL` — например `https://cv.example.com`. Не задан → фоллбэк на `{owner}.github.io`.
- `BASE_PATH` — обычно пустая строка (`""`), т.к. свой домен чаще всего отдаётся с корня, а не из `/cv_hub/`. Не задан (env вообще отсутствует) → фоллбэк на `/{repo}`; задан пустой строкой — используется как есть (это осознанно разные случаи, `!== undefined`, а не просто truthy-проверка).

Прокинуть в `deploy.yml` как `env:` в build-джобе (`SITE_URL: ${{ vars.SITE_URL }}`, `BASE_PATH: ${{ vars.BASE_PATH }}`) — сами значения хранить в `Settings → Secrets and variables → Actions → Variables` репозитория.

Плюс нужен `public/CNAME` с одним доменом внутри (`cv.example.com`, без протокола) — обычный файл в `public/`, копируется в `dist/` как любой другой ассет, GitHub Pages читает его для роутинга кастомного домена. И DNS домена должен указывать на GitHub Pages ([инструкция GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).

### Откуда берётся абсолютный URL сайта

Раньше `siteUrl` для canonical/OG-тегов пересчитывался вручную в `Layout.astro` прямо из `GITHUB_REPOSITORY`, в обход `SITE_URL`. Теперь — `Astro.site` (встроенный геттер Astro, зеркалит `site` из конфига), поэтому `SITE_URL`/`BASE_PATH` подхватываются автоматически везде: canonical, `og:image`, `twitter:image`, sitemap (`@astrojs/sitemap` тоже читает `site` из конфига напрямую).

Заодно это исправило два реальных бага, живших в проде:
- **Двойной слэш** в canonical/OG URL на каждой странице (`https://…github.io//cv_hub/…`) — `siteUrl` уже оканчивался на `/`, а конкатенация добавляла свой `/`.
- **`og:image` был битым** — не учитывал `base` вообще, ссылался на `https://{owner}.github.io/media/og-image.png` вместо `https://{owner}.github.io/cv_hub/media/og-image.png` — то есть 404 на реальном деплое всё это время.

---

## 16. JSON-LD и hreflang

### JSON-LD (`schema.org/Person`)

Только на CV/профильных страницах (`HomePage.astro`, куда рендерятся `index.astro` и `[...slug].astro`) — не на кейсах, не на шоукейсе, не на чейнджлоге, у них нет персоны для описания.

`HomePage.astro` собирает `personJsonLd` из уже распарсенных `contacts`/`skillGroups` (никакой отдельной схемы, те же данные, что уже идут в разметку):

```js
{
  name, jobTitle, description,
  email,      // contacts[].url, начинающийся на mailto: — префикс срезается
  sameAs,     // contacts[].url, начинающиеся на http(s):// — профили GitHub/LinkedIn/Habr и т.д.
  knowsAbout, // все items из skills, плоским списком
}
```

`Layout.astro` дополняет `url`/`image` (уже посчитанные для canonical/OG) и оборачивает в `@context`/`@type`, отбрасывает пустые/undefined поля, сериализует в `<script type="application/ld+json">`. Важная деталь безопасности: `<` в сериализованной строке экранируется в `<` перед вставкой — иначе `</script>` внутри значения (например, в `description`, если кто-то упомянёт разметку) преждевременно закрыл бы тег.

Проверить: `https://validator.schema.org/` или Google's Rich Results Test на любой CV-странице.

### hreflang

`Layout.astro` переиспользует `langLinks` — те же данные, что рендерят переключатель языка в шапке — так что hreflang настолько же точен, насколько уже точен свитчер, ничего отдельно не пересчитывается. На каждую языковую альтернативу — `<link rel="alternate" hreflang="{id}" href="{абсолютный URL}">`, плюс одна `hreflang="x-default"` на URL дефолтного языка.

Не рендерится (`showHreflang = false`), когда:
- альтернатив меньше двух (`langLinks.length <= 1`);
- страница `noindex` (404 — единственный кейс сейчас);
- `section === 'changelog'` — эта страница не переопределяет `langLinks` (нет отдельной RU-сборки чейнджлога, см. раздел 7 и решение в `.claude`-аудите — не баг, осознанно), поэтому унаследованный дефолт указывал бы hreflang на главную страницу вместо несуществующего RU-чейнджлога — заведомо неверный сигнал для Google, лучше не отдавать вообще.

---

## 17. site.yml — настройки уровня сайта

Коллекция: `src/content/site/site.yml`, схема — `content.config.ts` (`site`). Не привязана ни к профилю, ни к языку — настройки самого деплоя. Растёт по мере надобности (тумблер аналитики, статус «open to work» — пока не реализованы); на сегодня два поля: `downloads` и `footerCredit`.

### `downloads` — какие кнопки скачивания показывать

Две формы:

```yaml
# Плоская — одна неявная группа без заголовка. Только когда набор
# однозначен: ни у одной пары элементов не совпадёт лейбл кнопки.
downloads: [pdf, docx]
```

```yaml
# Групповая — обязательна, как только хочешь показать pdf и pdfAts вместе:
# оба рендерятся как «PDF», различает их заголовок группы, а не лейбл кнопки.
downloads:
  - group: people
    items: [pdf, docx]
  - group: ats
    items: [pdfAts, txt]
```

Схема — `z.union([z.array(downloadFormat), z.array({group, items})])`, `downloadFormat = z.enum(['pdf', 'pdfAts', 'docx', 'txt'])`. Это две взаимоисключающие формы для всего поля целиком (не поэлементный нормализатор, как у `skills`, где голая строка и `{group, items}` могут стоять рядом в одном списке) — плоский список означает именно «одна общая группа», а не «N группок по одному элементу».

`group` — ключ в `translations.yaml` под `cv.downloads_{group}` (сейчас определены `people` и `ats`); нет перевода — используется буквальный ключ как есть.

#### Почему не все четыре по умолчанию

Файлы делятся на две разные аудитории:

| Формат | Кому реально нужен | Почему |
|---|---|---|
| `pdf` | посетителю (рекрутер, хайринг-менеджер) | обычная, читаемая версия — это то, что визуально ожидают увидеть |
| `docx` | рекрутинговым агентствам | переверстывают резюме под свой бланк — живой сценарий, кнопка остаётся |
| `pdfAts` | **владельцу сайта** | одноколоночный ATS-safe вариант — то, что сам заливаешь в форму джоб-портала. Посетитель сайта в нём не нуждается, а «ATS» для него — жаргон, не выгода |
| `txt` | **владельцу сайта** | вставить в textarea «paste your resume» или в тело письма — тоже исходящий сценарий владельца, не входящий сценарий посетителя |

Личный сайт — `[pdf, docx]`: только то, что узнаёт посетитель. Демо/маркетинговый деплой — сгруппированный список выше: показывает фичу ATS-PDF тем, кто оценивает продукт, а не только владельцу. Генерация не меняется — все четыре файла собираются всегда (`resume:pdf`, `resume:generate`), `release.yml` прикладывает все четыре к релизу вне зависимости от того, что видно на сайте.

#### Конвенция: квалификатор никогда не идёт в лейбл кнопки

Если лейблу нужно второе слово («ATS PDF» вместо «PDF») — значит, ему нужна своя группа, а не более длинный лейбл. Это защита от повторения ситуации, где два формата пришлось различать многословной подписью прямо на кнопке. Проверка на будущее: новый артефакт — сначала определи аудиторию (людям? ATS?), потом место (группа или GitHub Release). Потолок — 2 группы × 3 элемента; понадобился четвёртый в группе — сигнал, что нужна третья аудитория или файлу место в релизе, а не на странице.

#### Иерархия и доступность

`PDF` внутри `pdf`-ключа всегда рендерится как `class="btn"` (акцентный, «solid») — единственная кнопка такого веса; всё остальное — `btn--ghost` (вторичные). Так на любой конфигурации есть ровно один явный primary-выбор.

`pdf` и `pdfAts` намеренно показывают одинаковый видимый текст «PDF» (см. конвенцию выше) — поэтому у каждой кнопки свой `aria-label` («Resume PDF» / «ATS-optimized PDF» и т.д.), иначе скринридер объявит два одинаковых пункта подряд. Визуальный лейбл при этом не меняется.

#### Как это подключено

`index.astro` и `[...slug].astro` собирают все четыре URL в один объект `downloadUrls` (не четыре отдельных пропа) и передают его в `<HomePage>`. `HomePage.astro` сам читает `site.yml` через `getEntry('site', 'site')` — тем же паттерном, каким `Layout.astro` сам читает `languages`/`profiles`/`i18n`, а не получает их пропами сверху — нормализует плоскую/групповую форму, резолвит заголовки групп и фильтрует/упорядочивает кнопки.

### `footerCredit` — «Made with CV Hub» в футере

```yaml
footerCredit: true   # по умолчанию; false — убрать
```

Ссылка на апстрим-проект рядом со ссылкой `GitHub` в футере (`Layout.astro`). В отличие от самой ссылки `GitHub` и байлайна (оба выводятся из `GITHUB_REPOSITORY` — указывают на **свой** форк), «Made with CV Hub» **всегда** захардкожена на `github.com/KeeGooRoomiE/cv_hub` — в этом весь смысл: каждый задеплоенный форк остаётся обнаруживаемой обратной ссылкой на оригинал, это и есть механизм органического роста шаблона. Включена по умолчанию, отключается одной строкой — без осуждения, это футер каждого конкретного форка.

На самом апстриме (когда `authorGit` уже указывает на `github.com/KeeGooRoomiE/cv_hub`) кредит автоматически не рендерится — иначе рядом стояли бы две ссылки с разными подписями и одинаковым href, чистый шум. Условие — `authorGit !== upstreamGit`, а не отдельный флаг: не нужно ничего дополнительно выключать на оригинальном репозитории, оно само не появится.