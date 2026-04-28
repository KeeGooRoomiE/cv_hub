# Background Components — CV Hub

Все фоновые компоненты взаимозаменяемы. Подключаются в `Layout.astro` как первый дочерний элемент `<body>`. Одновременно активен только один.

```astro
// Layout.astro
import AnimatedBackground from './AnimatedBackground.astro';
// import GalaxyBackground   from './GalaxyBackground.astro';
// import PlayStationWaves   from './PlayStationWaves.astro';
// import WaveLines          from './WaveLines.astro';

<body>
  <AnimatedBackground />   {/* ← меняй здесь */}
  ...
</body>
```

Все canvas-компоненты:
- `position: fixed; inset: 0; z-index: 0; pointer-events: none`
- Уважают `prefers-reduced-motion` — останавливают RAF, рисуют один статичный кадр
- Не рендерятся поверх контента (контент идёт с `position: relative; z-index: 1` через `.container`)

---

## AnimatedBackground

**Тип:** CSS-only, без JS, без canvas  
**Файл:** `src/components/AnimatedBackground.astro`  
**Props:** нет — всё настраивается напрямую в `<style>` компонента

Четыре светящихся орба с `filter: blur(80px)` и бесконечной drift-анимацией. Цвет орбов берётся из CSS-переменных темы (`--accent-rgb`, `--accent-2-rgb`) — автоматически меняется при смене темы.

На мобильных (`max-width: 768px`) орбы скрываются (`display: none`) — экономия ресурсов.

### Что и где менять

| Что | Где в коде |
|---|---|
| Размер орба | `.orb--N { width / height }` |
| Интенсивность свечения | `.orb { opacity }` |
| Радиус размытия | `.orb { filter: blur(...) }` |
| Скорость анимации | `animation: drift-N Xs` |
| Диапазон движения | `@keyframes drift-N { transform: translate(...) }` |
| Позиция орба на экране | `.orb--N { top / left / right / bottom }` |
| Шум-оверлей | `.noise { opacity }` — 0 чтобы убрать |

### Параметры орбов (дефолт)

| Орб | Размер | Позиция | Opacity источника | Период |
|---|---|---|---|---|
| 1 | 600×600px | top-left | `--accent-rgb / 0.55` | 3.6s |
| 2 | 500×500px | top-right | `--accent-2-rgb / 0.45` | 4.4s |
| 3 | 400×400px | bottom-center | `--accent-rgb / 0.30` | 5.2s |
| 4 | 300×300px | bottom-right | `--accent-2-rgb / 0.25` | 4.0s |

---

## GalaxyBackground

**Тип:** Canvas + `requestAnimationFrame` + mouse parallax  
**Файл:** `src/components/GalaxyBackground.astro`  
**Движок:** портировано из GML galaxy_create (DragonGameStudios, 2016) → Canvas API

Спиральная галактика с несколькими рукавами, туманностями и тремя параллакс-слоями звёзд. Реагирует на движение мыши — каждый слой смещается с разной скоростью. Галактика медленно вращается.

### Props

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `stars` | `number` | `1800` | Общее количество звёзд |
| `arms` | `number` | `4` | Количество спиральных рукавов |
| `tightness` | `number` | `0.42` | Плотность закручивания спирали (выше = туже) |
| `radius` | `number` | `0.38` | Радиус галактики как доля от `min(W, H)` |

### Внутренние параметры (только через код)

| Параметр | Дефолт | Описание |
|---|---|---|
| `fanRate` | `0.52` | Веер разброса звёзд по рукаву |
| `bunching` | `0.9` | Концентрация звёзд к центру |
| `bunching2` | `1.2` | Концентрация дополнительного смещения |
| `displacementFactor` | `0.18` | Максимальный разброс от оси рукава |
| `mouseStrength` | `0.035` | Сила параллакс-сдвига от мыши |
| `rotationSpeed` | `0.000015` | Скорость вращения галактики (рад/мс) |
| `nebulaCount` | `5` | Количество туманностей |

### Детали рендера

- **3 параллакс-слоя** — дальние звёзды (layer 0) двигаются медленнее, ближние (layer 2) — быстрее
- **Звёздная генерация** — детерминирована через LCG (seed=42), одинаковый вид при каждом resize
- **Цвета:** ядро — тёплые оттенки (hue 45–65°), рукава — синий/голубой (hue 190–250°)
- **Туманности** — 5 радиальных градиентных пятен, alpha 0.03–0.07
- **Фон** — радиальный градиент `#05050f → #00000a`

### Ограничения

- Нет `prefers-reduced-motion` (RAF не останавливается)
- Нет `will-change`, нет оптимизации для мобильных
- Mousemove без throttle — на частых событиях может нагружать JS-поток

---

## PlayStationWaves

**Тип:** Canvas + `requestAnimationFrame`  
**Файл:** `src/components/PlayStationWaves.astro`  
**Вдохновение:** Sony PlayStation 3 XMB (XrossMediaBar) фон

Несколько заливочных синусоидальных волн, layered поверх градиентного фона. Hue автоматически меняется в зависимости от времени суток (полный оборот 360° за 24 часа). Анимация стартует с непредсказуемой фазы через `Date.now() % 50000`.

### Props — Волны

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `waves` | `number` | `6` | Количество волн |
| `baseSpeed` | `number` | `0.0025` | Скорость анимации волны 0 |
| `speedStep` | `number` | `0.001` | Прирост скорости на каждую следующую волну |
| `baseAmplitude` | `number` | `18` | Амплитуда волны 0 (px) |
| `amplitudeStep` | `number` | `14` | Прирост амплитуды на волну (px) |
| `yStart` | `number` | `0.22` | Y-позиция первой волны (доля высоты canvas) |
| `yStep` | `number` | `0.13` | Расстояние между волнами по Y (доля высоты) |
| `phaseOffset` | `number` | `1.2` | Фазовый сдвиг между соседними волнами (рад) |
| `secondaryBlend` | `number` | `0.5` | Вклад вторичной синусоиды в форму волны (0..1) |

### Props — Цвет

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `hueStep` | `number` | `15` | Сдвиг hue между волнами (°) |
| `saturation` | `number` | `72` | Насыщенность цвета волн (%) |
| `lightness` | `number` | `62` | Светлота цвета волн (%) |
| `alphaDark` | `number` | `0.055` | Прозрачность волн в тёмной теме |
| `alphaLight` | `number` | `0.08` | Прозрачность волн в светлой теме |

### Props — Фоновый градиент

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `bgDarkSat` | `number` | `28` | Насыщенность фона (тёмная тема, %) |
| `bgDarkLow` | `number` | `7` | Светлота верхнего цвета фона (тёмная тема, %) |
| `bgDarkHigh` | `number` | `13` | Светлота нижнего цвета фона (тёмная тема, %) |
| `bgLightSat` | `number` | `38` | Насыщенность фона (светлая тема, %) |
| `bgLightLow` | `number` | `90` | Светлота верхнего цвета (светлая тема, %) |
| `bgLightHigh` | `number` | `80` | Светлота нижнего цвета (светлая тема, %) |

### Props — Качество

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `drawStep` | `number` | `4` | Шаг по X при построении волны (px). Меньше = плавнее, тяжелее |

### Пример использования

```astro
<PlayStationWaves />

<!-- Плотные медленные волны в нижней части -->
<PlayStationWaves
  waves={8}
  yStart={0.45}
  yStep={0.07}
  baseSpeed={0.001}
  alphaDark={0.04}
/>
```

---

## WaveLines

**Тип:** Canvas + `requestAnimationFrame` + offscreen compositing  
**Файл:** `src/components/WaveLines.astro`  
**Вдохновение:** Sony PlayStation 3 XMB — версия со светящимися линиями-штрихами (в отличие от заливочных волн PlayStationWaves)

Симметричный пучок синусоидальных линий вокруг центральной оси. Центральная линия — самая яркая, широкая и медленная; крайние — тусклее, тоньше, быстрее. Каждая линия имеет свечение (glow) вниз, реализованное через offscreen canvas.

**Техническая деталь:** свечение каждой линии рисуется на отдельном offscreen canvas с `destination-in` маской для горизонтального затухания по краям — это не затрагивает основной canvas и не разрушает фон.

### Props — Линии

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `lines` | `number` | `8` | Количество линий (нечётное даёт чистую центральную) |
| `centerY` | `number` | `0.75` | Центр пучка по Y (доля высоты canvas) |
| `lineSpacing` | `number` | `0.02` | Расстояние между линиями (доля высоты) |
| `baseAmplitude` | `number` | `40` | Амплитуда центральной линии (px) |
| `ampStep` | `number` | `6` | Убыль амплитуды на шаг от центра (px) |
| `baseSpeed` | `number` | `0.01` | Скорость центральной линии |
| `speedStep` | `number` | `0.005` | Прирост скорости на шаг от центра |
| `phaseOffset` | `number` | `1.4` | Фазовый сдвиг между соседними линиями (рад) |

### Props — Свечение

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `glowHeight` | `number` | `36` | Высота полосы свечения под линией (px) |
| `edgeFade` | `number` | `0.10` | Ширина зоны горизонтального затухания (доля W). `0.10` = затухание в первых и последних 10% ширины |

### Props — Цвет

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `hueStep` | `number` | `22` | Сдвиг hue на шаг от центра (°) |
| `saturation` | `number` | `88` | Насыщенность цвета линий (%) |
| `lineLightness` | `number` | `76` | Светлота штриха линии (%) |
| `glowLightness` | `number` | `72` | Светлота полосы свечения (%) |
| `centerBright` | `number` | `0.80` | Яркость (opacity) центральной линии |
| `brightStep` | `number` | `0.21` | Убыль яркости на шаг от центра |

### Props — Фоновый градиент

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `bgDarkSat` | `number` | `30` | Насыщенность фона (тёмная тема, %) |
| `bgDarkLow` | `number` | `6` | Светлота верхнего цвета (тёмная тема, %) |
| `bgDarkHigh` | `number` | `11` | Светлота нижнего цвета (тёмная тема, %) |
| `bgHueShift` | `number` | `30` | Сдвиг hue нижнего цвета фона относительно верхнего (°) |
| `bgLightSat` | `number` | `40` | Насыщенность фона (светлая тема, %) |
| `bgLightLow` | `number` | `82` | Светлота верхнего цвета (светлая тема, %) |
| `bgLightHigh` | `number` | `72` | Светлота нижнего цвета (светлая тема, %) |

### Props — Качество

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `drawStep` | `number` | `2` | Шаг по X при построении волны (px). Меньше = плавнее, тяжелее |

### Как линии строятся симметрично

Линии генерируются автоматически от центра:

```
dist = i - floor(lines/2)   // -2, -1, 0, 1, 2 для 5 линий

t       = centerY + dist * lineSpacing
speed   = baseSpeed  + |dist| * speedStep
amp     = baseAmplitude - |dist| * ampStep
lw      = 2.0 - |dist| * 0.5
bright  = centerBright - |dist| * brightStep
hueShift = dist * hueStep
```

Добавить больше линий: просто изменить `lines={11}` — формула пересчитает всё автоматически.

### Пример использования

```astro
<WaveLines />

<!-- 5 линий в центре экрана, широкое свечение -->
<WaveLines
  lines={5}
  centerY={0.50}
  lineSpacing={0.04}
  glowHeight={50}
  baseSpeed={0.007}
/>
```

---

## Сравнительная таблица

| | AnimatedBackground | GalaxyBackground | PlayStationWaves | WaveLines |
|---|---|---|---|---|
| Тип | CSS | Canvas RAF | Canvas RAF | Canvas RAF |
| JS | нет | да | да | да |
| Props | нет | 4 | 18 | 18 |
| Мобильные | ✅ отключается | ⚠️ нет защиты | ✅ `prefers-reduced-motion` | ✅ `prefers-reduced-motion` |
| Mouse parallax | нет | да | нет | нет |
| Light mode | через тему | нет | да | да |
| Time-of-day hue | нет | нет | да | да |
| Фиксированный фон | через `--bg` | встроен | встроен | встроен |
| Offscreen compositing | — | — | — | да (glow) |
| Производительность | 🟢 лёгкий | 🔴 тяжёлый | 🟡 средний | 🟡 средний |
