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

Astro позволяет использовать React-компоненты точечно при необходимости, без превращения всего проекта в SPA.

#### Почему не Angular

Angular — полноценный application framework. Для двух статических страниц это избыточно: большой runtime, сложная конфигурация, высокий порог входа.

---

### Почему всего несколько страниц

Цель — минимизировать когнитивную нагрузку.

- Главная — кто я
- Showcase — что я сделал
- Changelog — история проекта

Рекрутеру не нужно 12 разделов.

---

### Почему YAML как источник данных

YAML — удобный человекочитаемый формат, который легко редактировать, валидировать и парсить.

YAML выступает как Single Source of Truth. Всё остальное генерируется из него автоматически:

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

Темы переключаются через `?theme=name` в URL — без JavaScript-хранилища.

Причины:
- URL — shareable: можно поделиться конкретной темой как ссылкой
- Нет зависимости от браузерного состояния
- Работает при первом открытии без flash of unstyled content
- Прозрачно и предсказуемо

Доступные значения: `frosted`, `light`, `nordic`, `peachy`

---

### Почему siteUrl берётся из GITHUB_REPOSITORY

Вместо хардкода `https://username.github.io/cv_hub` сайт вычисляет URL динамически:

```js
const repo = import.meta.env.GITHUB_REPOSITORY; // "username/cv_hub"
const [owner, repoName] = repo.split('/');
const siteUrl = `https://${owner}.github.io/${repoName}`;
```

Это позволяет форкам работать без изменений в конфигурации. OG-теги, canonical URLs и мета-описания автоматически используют правильный домен.

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
| `achievements`, `contacts`, `education` | spec wins целиком, если указан |
| `spec: null` | копируется base как есть |

### Роутинг

```
/              → default profile, default lang
/ru            → default profile, ru
/devops        → devops profile, default lang
/devops/ru     → devops profile, ru
/gamedev       → gamedev profile, default lang
```

`src/pages/index.astro` обрабатывает только `/`. Все остальные маршруты генерирует `[...slug].astro` через `getStaticPaths`, который итерируется по profiles × languages и пропускает default profile + default lang (чтобы не дублировать `/`).

### Fallback-логика

Если `profiles.yml` отсутствует — система падает обратно к одному дефолтному профилю. Форки без профилей работают без изменений.

Если для языка нет базового файла (например, добавили `cn` в `languages.yml`, но не создали `cn.yaml`) — merge.mjs использует base дефолтного языка с warning.

---

## 4. i18n система

### Структура

```
src/content/i18n/translations.yaml  ← все UI-строки
src/scripts/t.ts                    ← хелпер makeT()
```

### Как работает

```ts
// t.ts
export function makeT(data: TranslationSection, lang: string) {
  return function t(path: string): string {
    const [section, key] = path.split('.');
    return data?.[section]?.[key]?.[lang]
      ?? data?.[section]?.[key]?.['en']
      ?? path;
  };
}
```

Фоллбек-цепочка: запрошенный язык → `en` → сам ключ (как дефолт).

```ts
const t = makeT(translations.data, 'ru');
t('nav.home')   // → 'Главная'
t('cv.skills')  // → 'Навыки'
```

### Добавление нового языка

1. Добавить запись в `languages.yml`
2. Создать `src/content/cv/{lang}.yaml`
3. Добавить переводы в `translations.yaml`
4. `merge.mjs` автоматически создаст артефакты
5. Новый язык появится в switcher и роутинге

---

## 5. Генерация документов

### Build pipeline

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

### Динамическая генерация по профилям

Оба скрипта (`generate-resume.js` и `resume-export-pdf.mjs`) динамически читают все файлы из `public/cv/`:

```js
const files = fs.readdirSync(path.join(ROOT, 'public/cv'))
  .filter(f => f.endsWith('.yaml'));

for (const file of files) {
  const suffix = file.replace('.yaml', '');  // en, ru, en_devops, ru_gamedev...
  const lang   = suffix.split('_')[0];       // en, ru
  // generate resume_${suffix}.pdf/.docx/.txt
}
```

Добавление нового профиля или языка автоматически добавляет новые файлы документов без изменений в скриптах.

### URL документов

Ссылки на скачивание формируются с учётом профиля:

```js
const specSuffix = profileData.spec ? `_${profileData.spec}` : '';
const pdfUrl = `${base}/downloads/resume_${langId}${specSuffix}.pdf`;
```

Страница `/devops` предлагает `resume_en_devops.pdf`, `/` предлагает `resume_en.pdf`.

---

## 6. Модель данных

Структура CV намеренно плоская и читаемая. Принципы:
- Ясные секции (name, title, summary, skills, experience)
- Минимальная вложенность
- Отсутствие логики в данных
- Только декларативная информация

Данные отделены от представления.

---

## 7. DevOps-подход

Проект следует принципам инфраструктуры:

- Git-based versioning
- Immutable builds
- CI/CD pipeline через GitHub Actions
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
  ├── cv:build          → public/cv/*.yaml (merged)
  ├── resume:generate   → DOCX + TXT (все профили × языки)
  ├── resume:pdf        → PDF (все профили × языки)
  └── astro build       → статический сайт
  ↓
upload artifact → deploy → GitHub Pages
```

---

## 9. Осознанные компромиссы (Trade-offs)

- Нет CMS
- Нет базы данных
- Нет SSR
- Нет динамического backend

Все ограничения приняты сознательно. Цель — простота и контроль.

Единственный trade-off, который стоит отметить: добавление нового профиля требует ручного создания delta-файла. Это сделано намеренно — дельта должна быть явной.

---

## 10. Расширяемость

Реализовано:
- Multi-profile система — N профилей × N языков из одного YAML
- URL-based theme switching — shareable ссылки
- Changelog страница — версионирование самого проекта
- Динамический siteUrl — фorks работают без конфига

Возможные улучшения:
- Валидация схемы YAML через Zod
- Фильтрация проектов по тегам на Showcase
- Lighthouse CI для отслеживания метрик качества
- Release-артефакты (PDF / DOCX) как GitHub Releases assets

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