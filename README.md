# CV Hub

🌐 [English](README_en.md) | **Русский**

![Deploy](https://github.com/KeeGooRoomiE/cv_hub/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Astro](https://img.shields.io/badge/built%20with-Astro-ff5d01)
[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse-Performance%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomii.github.io/cv_hub/)
[![Lighthouse Accessibility](https://img.shields.io/badge/Lighthouse-Accessibility%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomii.github.io/cv_hub/)
[![Lighthouse Best Practices](https://img.shields.io/badge/Lighthouse-Best%20Practices%2096-00C853?logo=lighthouse&logoColor=white)](https://keegooroomii.github.io/cv_hub/)
[![Lighthouse SEO](https://img.shields.io/badge/Lighthouse-SEO%20100-00C853?logo=lighthouse&logoColor=white)](https://keegooroomii.github.io/cv_hub/)
[![Last Commit](https://img.shields.io/github/last-commit/KeeGooRoomiE/cv_hub?color=blue)](https://github.com/KeeGooRoomiE/cv_hub/commits/main)
[![Stars](https://img.shields.io/github/stars/KeeGooRoomiE/cv_hub?style=social)](https://github.com/KeeGooRoomiE/cv_hub/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/KeeGooRoomiE/cv_hub/blob/main/CONTRIBUTING.md)

**Ваш личный сайт, резюме и портфолио проектов — из одного YAML-файла.**

🌐 **Живое демо:** https://keegooroomie.github.io/cv_hub/

![CV Hub Preview](docs/repo-assets/preview_main.jpeg)

---

## ⚡ Запустите сайт за 5 минут

```bash
git clone https://github.com/YOUR_ACCOUNT/cv_hub.git
cd cv_hub
npm install
npm run dev
```

Откройте `http://localhost:4321`. Отредактируйте `src/content/cv/en.yaml`. Сделайте push — сайт задеплоится автоматически.

> Уже есть резюме? Вставьте его в Claude или ChatGPT с промптом из [`docs/LLM-CONTEXT.md`](docs/LLM-CONTEXT.md) и получите готовый YAML за секунды.

---

## Что вы получаете

Один YAML-файл генерирует всё:

| | |
|---|---|
| 🌐 Живой сайт | Чистый личный сайт с резюме, проектами и кейсами |
| 📄 PDF / DOCX / TXT | Автоматически генерируемые файлы резюме для каждого профиля и языка |
| 🎭 Несколько профилей | DevOps, GameDev, Fullstack — разные версии резюме из одного источника |
| 🌍 Мультиязычность | EN, RU или любой другой язык — переключатель включён |
| 📁 Кейсы | Страницы с детальным разбором проектов: текст, изображения, архитектура |
| 🎨 Темы | 4 встроенные темы, переключаемые через URL |

Никаких дублирующихся резюме. Никакой привязки к платформе. Никаких визуальных конструкторов.

---

## Зачем CV Hub

Скорее всего, вы поддерживаете:
- PDF-резюме (как минимум в двух версиях)
- Профиль на LinkedIn
- Портфолио на Notion, Tilda или какой-то другой платформе
- DOCX где-то на рабочем столе

Все они постепенно расходятся.

CV Hub заменяет всё это одним YAML-файлом и детерминированным пайплайном. Редактируете один раз — обновляется всё. Один источник одновременно генерирует ваше DevOps-резюме, GameDev-резюме и сайт-портфолио.

---

## Как редактировать данные

Все данные хранятся в `src/content/`:

```
src/content/
  cv/
    en.yaml            ← базовое резюме на английском
    ru.yaml            ← базовое резюме на русском
    en_devops.yaml     ← DevOps-дельта (опционально)
    ru_devops.yaml     ← DevOps-дельта на русском (опционально)
  profiles/
    profiles.yml       ← реестр профилей (опционально)
  languages/
    languages.yml      ← конфигурация языков
  showcase/
    projects.yaml      ← список проектов
  changelog/
    changelog.yaml     ← история версий
  i18n/
    translations.yaml  ← строки интерфейса
```

Полный справочник по структуре YAML — см. **[`docs/INFO.md`](docs/INFO.md)**.

---

## Система нескольких профилей

CV Hub поддерживает несколько версий резюме под разные роли из одного базового YAML.

1. `src/content/cv/en.yaml` — ваше полное базовое резюме
2. `src/content/cv/en_devops.yaml` — дельта только с изменёнными полями
3. `src/scripts/merge.mjs` объединяет их в `public/cv/en_devops.yaml`
4. Сайт генерирует `/devops` с объединённым результатом

Правила слияния и формат дельта-файла — см. **[`docs/INFO.md`](docs/INFO.md)**.

---

## Витрина и кейсы

### Карточки проектов

Добавляйте проекты в `src/content/showcase/projects.yaml`. Каждая карточка поддерживает метрики, медиагалерею, теги стека, архивный переключатель и ссылки.

Полный аннотированный пример — см. `docs/examples/example_project.yaml`.

### Страницы кейсов

Для любого проекта, которому нужна страница с детальным разбором, создайте YAML-файл:

```
public/media/projects/{slug}/{slug_underscored}_{lang}.yaml
```

Пример: `public/media/projects/cv-hub/cv_hub_en.yaml` → `/showcase/cv-hub/en`

Страница генерируется автоматически. Изменения в коде не нужны.

Содержимое кейса строится из блоков — `text`, `image`, `divider`. Все поля опциональны. Все типы блоков — см. `docs/examples/example_cs.yaml`.

Чтобы связать карточку проекта с его кейсом:
```yaml
links:
  - label: Case Study
    url: /showcase/cv-hub    # без префикса /cv_hub/ — базовый путь добавляется автоматически
    type: product
```

---

## Конфигурация языков

```yaml
# src/content/languages/languages.yml
default: "ru"
languages:
  - id: "ru"
    label: "RU"
  - id: "en"
    label: "EN"
```

Добавьте любой язык — создайте `{lang}.yaml`, добавьте строки интерфейса в `translations.yaml`, и он автоматически появится в переключателе языков.

---

## Как заполнить данные

### Вариант A — Редактировать YAML напрямую

Откройте `src/content/cv/en.yaml` и заполните свои данные.
Полный справочник по полям — см. [`docs/INFO.md`](docs/INFO.md).

### Вариант B — Импорт из JSON Resume

```bash
npm run resume:import -- docs/cv_en.json en
npm run resume:import:all
```

### Вариант C — Генерация через LLM

Передайте своё резюме (PDF, DOCX, обычный текст) в Claude или ChatGPT с промптом из `docs/llm-context.md`. Документ также содержит полный контекст проекта для AI-инструментов — передайте его перед внесением любых изменений в код.

---

## Кастомизация

Все стили находятся в `src/styles/global.css`. Основаны на токенах — для изменения внешнего вида редактируйте только блок `:root`:

```css
:root {
  --bg: #070a10;
  --accent: #3b82f6;
  --text: rgba(233, 238, 247, 0.96);
}
```

### Темы

| Файл | Описание |
|---|---|
| `frosted.css` | Тёмное стекло, приглушённые тона |
| `light.css` | Светлый фон, тёмный текст |
| `nordic.css` | Вдохновлено Nord, холодный сине-серый |
| `peachy.css` | Тёплый персиковый, светлый фон |

Предпросмотр любой темы прямо в браузере через URL:

```
https://YOUR_ACCOUNT.github.io/cv_hub/?theme=peachy
```

---

## Как задеплоить

### 1. Включите GitHub Pages

`Settings → Pages → Source: GitHub Actions`

### 2. Запушьте изменения

```bash
git add .
git commit -m "update cv data"
git push
```

Ваш сайт будет доступен по адресу `https://YOUR_ACCOUNT.github.io/cv_hub/`

Воркфлоу деплоя запускается автоматически при каждом пуше в `main`. `BASE_URL` и `siteUrl` определяются динамически из `GITHUB_REPOSITORY` — форки работают из коробки без изменений конфигурации.

---

## Генерация файлов резюме

```bash
npm run build
```

Порядок сборки:
1. `cv:build` — объединение YAML → `public/cv/`
2. `resume:generate` — DOCX + TXT
3. `resume:pdf` — PDF через Playwright
4. `astro build` — статический сайт

Результат: `public/downloads/resume_{lang}[_{spec}].{pdf|docx|txt}`

---

## Справочник CLI

```bash
npm run dev                  # запустить локальный dev-сервер
npm run build                # полная сборка: merge → generate → pdf → astro
npm run cv:build             # объединить базовые + spec YAML → public/cv/
npm run resume:generate      # сгенерировать DOCX + TXT для всех профилей
npm run resume:pdf           # сгенерировать PDF для всех профилей через Playwright
npm run resume:import        # конвертировать JSON Resume → YAML (один файл)
npm run resume:import:all    # конвертировать cv_en.json и cv_ru.json
npm run resume:linkedin      # разобрать PDF-экспорт LinkedIn → YAML (по возможности)
```

---

## Структура проекта

```
src/
  content/
    cv/                    # данные резюме (базовые + дельты)
    profiles/profiles.yml
    languages/languages.yml
    i18n/translations.yaml
    showcase/projects.yaml
    changelog/changelog.yaml
  pages/
    index.astro            # профиль по умолчанию + язык по умолчанию
    [...slug].astro        # все остальные комбинации профиль × язык
    showcase/
      index.astro          # язык по умолчанию
      [...rest].astro      # остальные языки + страницы кейсов
    changelog.astro
  components/
    Layout.astro
    HomePage.astro
    ProjectCard.astro
    ProjectPage.astro      # шаблон страницы кейса
    blocks/                # TextBlock, ImageBlock, DividerBlock
    AnimatedBackground.astro
  scripts/
    merge.mjs
    t.ts
    resume-export-pdf.mjs
    resume-import-json.mjs
  styles/
    global.css
    themes/

public/
  cv/                      # объединённые YAML (генерируются)
  downloads/               # файлы резюме (генерируются)
  media/projects/          # ресурсы проектов + YAML кейсов
  themes/

.github/
  scripts/generate-resume.js
  workflows/deploy.yml

docs/
  INFO.md                  # структура данных + справочник по полям
  ENGINEERING.md           # архитектурные решения
  BKG_INFO.md              # документация AnimatedBackground
  llm-context.md           # полный контекст проекта для AI-инструментов
  examples/
    example_cv.yaml
    example_cv.json
    example_project.yaml
    example_cs.yaml        # все типы блоков кейса
```

---

## Технологический стек

- [Astro](https://astro.build) — генератор статических сайтов
- YAML — единственный источник истины
- [docx](https://docx.js.org) — генерация DOCX
- [Playwright](https://playwright.dev) — генерация PDF
- GitHub Pages — хостинг
- GitHub Actions — CI/CD

---

## Документация

| Файл | Описание |
|---|---|
| [INFO.md](docs/INFO.md) | Справочник по полям YAML, маршрутизация, i18n, профили, кейсы |
| [ENGINEERING.md](docs/ENGINEERING.md) | Архитектурные решения, дизайн системы, компромиссы |
| [`LLM-CONTEXT.md`](docs/LLM-CONTEXT.md) | Полный контекст проекта для AI-инструментов (Claude, ChatGPT, Cursor) |
| [BKG_INFO.md](docs/BKG_INFO.md) | Документация компонента AnimatedBackground |

---

## ⭐ Если это полезно

```
⭐ Поставьте звезду, если хотите перестать переписывать резюме при каждом отклике
🍴 Форкните — ваш сайт будет готов за несколько минут
🐛 Нашли баг или есть идея? Откройте issue
```

---

## Лицензия

Исходный код: MIT
Контент (данные резюме): © Автор
