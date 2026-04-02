<!--
  ENGINEERING.md
  CV Hub

  Created by Alexander Gusarov on 03.03.2026.
  @spartan121
-->

# ENGINEERING NOTES

## 1. Общая идея проекта

CV Hub — это не просто сайт-резюме.

Это попытка рассматривать профессиональное представление как инженерную систему.

Основная концепция:

> Resume as Code.

Резюме должно быть:
- версионируемым
- воспроизводимым
- автоматизируемым
- независимым от платформ

---

## 2. Архитектурные решения

### Почему Astro

Astro выбран как статический генератор с минимальным runtime.

Основные причины:
- Static-first архитектура (рендер на этапе сборки, а не в браузере)
- Нулевой client-JS по умолчанию
- Предсказуемый build-output
- Высокая производительность без дополнительной оптимизации
- Простая интеграция с GitHub Pages

#### Почему не React SPA

Для CV Hub нет необходимости в сложном состоянии, динамическом API или hydration всего приложения. SPA увеличивает размер бандла и сложность без архитектурной необходимости.

#### Почему не Angular

Angular — полноценный application framework. Для статических страниц это избыточно.

---

### Почему YAML как источник данных

YAML — удобный человекочитаемый формат, который легко редактировать, валидировать и парсить.

YAML выступает как Single Source of Truth. Всё остальное генерируется из него:

```
src/content/cv/{lang}.yaml
         +
src/content/cv/{lang}_{spec}.yaml
         ↓
     merge.mjs
         ↓
  public/cv/{lang}.yaml
  public/cv/{lang}_{spec}.yaml
         ↓
    ┌────┴────────────────────────┐
    ↓                             ↓
generate-resume.js         astro build
resume-export-pdf.mjs
    ↓                             ↓
DOCX / TXT / PDF          статический сайт
```

---

### Почему URL-параметр для тем, а не localStorage

Темы переключаются через `?theme=name` — без JavaScript-хранилища.

- URL shareable: можно поделиться конкретной темой как ссылкой
- Нет зависимости от браузерного состояния
- Прозрачно и предсказуемо

---

### Почему язык хранится в URL, а не в cookies/localStorage

Язык — часть роутинга, а не браузерного состояния.

`?lang=ru` выглядит простым решением, но требует загрузки всех языков в одну страницу и переключения через JS. Это регресс по SEO и архитектурная грязь.

Текущий подход (`/en`, `/showcase/cv-hub/en`) — правильный для Astro static:
- Каждый язык — отдельная страница с правильными `lang` и OG meta
- Нет лишнего JS
- URL — единственный источник состояния языка

Language switcher знает текущую страницу через `customLangLinks` — каждая страница явно передаёт правильные lang-ссылки в Layout.

---

### Почему siteUrl берётся из GITHUB_REPOSITORY

```js
const repo = import.meta.env.GITHUB_REPOSITORY; // "username/cv_hub"
const [owner] = repo.split('/');
const siteUrl = `https://${owner}.github.io/`;
```

Форки работают без изменений в конфигурации. OG-теги и canonical URLs используют правильный домен автоматически.

---

### BASE_URL и assets

Сайт деплоится на GitHub Pages под base path (`/cv_hub/`), локально — `/`.

Правила:
- Никогда не хардкодить `/cv_hub/` в YAML или компонентах
- В YAML писать пути без base: `/media/projects/...`, `/showcase/...`
- В компонентах использовать `withBase()` или `import.meta.env.BASE_URL`

---

## 3. Multi-profile система

### Проблема

HR-фидбек: DevOps-резюме показывает слишком много GameDev истории, что размывает фокус. Нужны профиль-специфичные версии CV при едином источнике данных.

### Решение

Двухуровневая YAML-модель: base + spec delta.

```
src/content/cv/
  en.yaml            ← полное базовое резюме
  en_devops.yaml     ← только то, что меняется для DevOps
  en_gamedev.yaml    ← только то, что меняется для GameDev
```

`merge.mjs` читает `profiles.yml` и `languages.yml`, итерируется по комбинациям профиль × язык и записывает смёрженные артефакты в `public/cv/`.

### Правила merge

| Поле | Правило |
|---|---|
| `title`, `summary` и другие скаляры | spec wins; если нет в spec — из base |
| `skills` | spec wins целиком, если указан |
| `experience` | whitelist — только компании из spec; поля мёрджатся по ключу `company` |
| `achievements`, `contacts`, `education`, `languages` | spec wins целиком, если указан |
| `spec: null` | копируется base как есть |

---

## 4. i18n система

```ts
export function makeT(data: TranslationSection, lang: string) {
  return function t(path: string): string {
    const [section, key] = path.split('.');
    return data?.[section]?.[key]?.[lang]
      ?? data?.[section]?.[key]?.['en']
      ?? path;
  };
}
```

Фоллбек-цепочка: запрошенный язык → `en` → сам ключ.

### Language switcher

На CV-страницах Layout строит lang-ссылки автоматически через `buildHref(profile, langId)`.

На showcase и case study страницах — каждая страница явно передаёт `customLangLinks` в Layout. Это необходимо: без `customLangLinks` switcher строит CV-роуты и переключение ведёт на главную вместо текущей страницы.

---

## 5. Case Study система

### Зачем

Showcase-карточки дают превью проекта: стек, метрики, скриншот.

Case study — полноценный нарратив: почему, что именно, как, с какими компромиссами. Это отдельная страница с текстом, изображениями и архитектурными решениями в свободной структуре.

Целевой сценарий — рекрутер или инженер хочет понять реальную глубину проекта, а не только названия технологий.

### Архитектура

Case study YAML живёт рядом с ассетами проекта:

```
public/media/projects/{slug}/{slug_underscored}_{lang}.yaml
```

Страница генерируется `showcase/[...rest].astro` автоматически при наличии файла — никаких изменений в коде не нужно.

Блочная система (`text`, `image`, `divider`) позволяет строить любой нарратив без кастомной вёрстки. Все поля блоков опциональны — рендерится только то, что задано.

### Роутинг case study

```
/showcase/{slug}        ← дефолтный язык
/showcase/{slug}/en     ← остальные языки
```

Language switcher на странице кейс стади переключает язык именно этого проекта. Если YAML для запрошенного языка отсутствует — страница не генерируется (нет fallback на другой язык, чтобы не показывать смешанный контент).

---

## 6. Генерация документов

```
npm run build
    ↓
npm run cv:build        # merge.mjs → public/cv/*.yaml
    ↓
npm run resume:generate # generate-resume.js → DOCX + TXT
    ↓
npm run resume:pdf      # resume-export-pdf.mjs → PDF via Playwright
    ↓
astro build             # статический сайт
```

Добавление нового профиля или языка автоматически добавляет новые файлы документов без изменений в скриптах — они итерируются по `public/cv/` динамически.

---

## 7. DevOps-подход

Проект следует принципам инфраструктуры:
- Git-based versioning
- Immutable builds
- CI/CD через GitHub Actions
- Статический деплой на GitHub Pages
- Отсутствие runtime-сервера

Резюме рассматривается как артефакт сборки.

---

## 8. CI / GitHub Actions

```
push → main
  ↓
npm ci
  ↓
playwright install chromium
  ↓
npm run build
  ├── cv:build          → public/cv/*.yaml
  ├── resume:generate   → DOCX + TXT
  ├── resume:pdf        → PDF
  └── astro build       → статический сайт
  ↓
upload artifact → deploy → GitHub Pages
```

---

## 9. Осознанные компромиссы

- Нет CMS — осознанный выбор ради контроля
- Нет SSR — полностью статическая архитектура
- Язык в URL, не в cookies — правильно для SEO и статики, требует explicit `customLangLinks` на каждой нон-CV странице
- Ручное создание delta-файлов — явность важнее магии
- Case study YAML в `public/`, не в `src/content/` — чтобы лежал рядом с ассетами проекта и не требовал Astro content collection schema

---

## 10. Расширяемость

Реализовано:
- Multi-profile система — N профилей × N языков из одного YAML
- URL-based theme switching
- Changelog страница
- Динамический siteUrl — форки работают без конфига
- Case Study страницы — блочная система контента

Возможные улучшения:
- Валидация схемы YAML через Zod
- Фильтрация проектов по тегам на Showcase
- Lighthouse CI
- Permalink-компонент на страницах кейс стади

---

## 11. Метрики

Текущий Lighthouse (production):

| Метрика | Score |
|---|---|
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 96 |
| SEO | 100 |

Best Practices 96 — ограничение GitHub Pages: CSP-заголовки нельзя настроить без собственного сервера.

---

## 12. Философия

Резюме не должно быть статичным PDF, застывшим во времени.

Это версия профессиональной идентичности, которая эволюционирует вместе с инженером.

CV Hub — это способ придать этой эволюции структуру.