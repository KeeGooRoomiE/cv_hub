//
//  generate-og-image.mjs
//  CV Hub
//
//  Created by Alexander Gusarov on 27.08.2026.
//  @spartan121
//
//  Renders /og-preview/{lang} (real default-profile CV, see
//  src/pages/og-preview/[lang].astro) through a real headless browser, once
//  per configured language, and composites each into a 1200×630 OG-card
//  image — a rounded, shadowed "browser window" screenshot floating on a
//  wallpaper background, in the spirit of a manual Arc-browser screenshot.
//  One image per language (not per profile, not per case study) — every
//  page picks its OG image by its own `lang`, so a devops/gamedev page just
//  reuses the same-language default-profile image instead of paying for a
//  dedicated screenshot per profile.
//
//  Must run AFTER `astro build` (npm run build already sequences it that
//  way) — it serves the just-built dist/ via `astro preview --background` so
//  the screenshots are the real, fully-styled site (fonts, backgrounds,
//  theme CSS), not a reconstruction. Results are written to both
//  public/media/og-image-{lang}.png (source, gitignored — regenerated every
//  build) and dist/media/og-image-{lang}.png (this build's artifact already
//  exists; we patch the fresh images straight into it instead of paying for
//  a second full `astro build`).
//
//  Usage:
//    node src/scripts/generate-og-image.mjs [--theme=<name>] [--wallpaper=gradient|<path/to/image>]
//
//  --theme      Falls back to the default (no theme) look if the name isn't
//               one of the themes in src/styles/themes/.
//  --wallpaper  "gradient" (default) draws a wallpaper from the active theme's
//               own CSS tokens — always in sync, no extra asset. A path
//               (relative to the repo root) embeds that image as the
//               wallpaper instead.
//
//  CI note: drives the runner's preinstalled Google Chrome (channel: 'chrome'),
//  same pattern as resume-export-pdf.mjs — no Playwright browser download.
//

import { chromium } from 'playwright';
import { parse } from 'yaml';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PORT = 4523; // unlikely to collide with dev (4321) or anything else running

// --- CLI args ---
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const themesDir = join(ROOT, 'src/styles/themes');
const availableThemes = existsSync(themesDir)
  ? readdirSync(themesDir).filter((f) => f.endsWith('.css')).map((f) => f.replace('.css', ''))
  : [];

let theme = null;
if (args.theme) {
  if (availableThemes.includes(args.theme)) {
    theme = args.theme;
  } else {
    console.warn(`⚠ Unknown theme "${args.theme}" (available: ${availableThemes.join(', ')}) — falling back to default`);
  }
}

const wallpaperArg = typeof args.wallpaper === 'string' ? args.wallpaper : 'gradient';
const wallpaperIsImage = wallpaperArg !== 'gradient';
if (wallpaperIsImage && !existsSync(join(ROOT, wallpaperArg))) {
  console.error(`❌ Wallpaper image not found: ${wallpaperArg}`);
  process.exit(1);
}

// --- Languages ---
const languagesPath = join(ROOT, 'src/content/languages/languages.yml');
const langIds = existsSync(languagesPath)
  ? (parse(readFileSync(languagesPath, 'utf8')).languages ?? []).map((l) => l.id)
  : ['en'];

// --- 1. Serve the already-built dist/ ---
const distDir = join(ROOT, 'dist');

for (const lang of langIds) {
  const htmlPath = join(distDir, `og-preview/${lang}/index.html`);
  if (!existsSync(htmlPath)) {
    console.error(
      `❌ ${htmlPath} not found — run \`astro build\` (fresh, this script deletes dist/og-preview after every run) before generate-og-image.mjs`
    );
    process.exit(1);
  }
}

console.log('▸ Starting preview server…');
execSync(`npx astro preview --port ${PORT} --background`, { stdio: 'inherit', env: process.env });

// Give the server a moment past its own "running" message to finish binding.
await new Promise((r) => setTimeout(r, 800));

try {
  const browser = await chromium.launch(process.env.CI ? { channel: 'chrome' } : {});

  // Theme tokens are identical across languages (theme is a global CSS
  // concern, unrelated to CV content) — extracted once from the first page
  // and reused for every composite below, instead of re-reading per language.
  let rootVars = null;

  const wallpaperCss = wallpaperIsImage
    ? `background-image:url(data:image/${wallpaperArg.split('.').pop()};base64,${readFileSync(join(ROOT, wallpaperArg)).toString('base64')});background-size:cover;background-position:center;`
    : `background:
         radial-gradient(900px 600px at 15% 10%, rgba(var(--accent-rgb) / 0.45), transparent 60%),
         radial-gradient(800px 560px at 90% 90%, rgba(var(--accent-2-rgb) / 0.35), transparent 55%),
         var(--bg);`;

  for (const lang of langIds) {
    // --- 2. Screenshot the real page ---
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

    const themeParam = theme ? `?theme=${theme}` : '';
    // og-preview's own served base path can be `/` locally or `/cv_hub/` on
    // CI — read it from the built HTML rather than assume it.
    const htmlPath = join(distDir, `og-preview/${lang}/index.html`);
    const baseHtml = readFileSync(htmlPath, 'utf8');
    const base = baseHtml.match(/data-base="([^"]*)"/)?.[1] ?? '';
    const url = `http://localhost:${PORT}${base}/og-preview/${lang}/${themeParam}`;

    console.log(`▸ Rendering ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    // Let canvas/CSS background animations settle to a clean first frame.
    await page.waitForTimeout(300);

    if (!rootVars) {
      // --- 3. Composite: frame + wallpaper on a second page, so `var()`
      //     design tokens resolve exactly like the live site (no hardcoded
      //     colors here). global.css isn't served standalone (it's bundled
      //     per-page by Astro), so pull the resolved :root tokens straight
      //     from the built page instead of re-linking a stylesheet.
      rootVars = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        const names = [
          '--bg', '--accent', '--accent-2', '--accent-rgb', '--accent-2-rgb',
          '--bg-glow-1', '--bg-glow-2', '--border-2', '--shadow', '--r-lg',
        ];
        return names.map((n) => `${n}: ${cs.getPropertyValue(n).trim()};`).join(' ');
      });
    }

    const rawShot = await page.screenshot({ type: 'png' });
    const rawDataUri = `data:image/png;base64,${rawShot.toString('base64')}`;
    await page.close();

    const compositeHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
      :root { ${rootVars} }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1200px; height: 630px; overflow: hidden; }
      body { ${wallpaperCss} display: flex; align-items: center; justify-content: center; }
      .frame {
        width: 880px;
        aspect-ratio: 16 / 10;
        border-radius: var(--r-lg, 18px);
        overflow: hidden;
        border: 8px solid rgba(255,255,255,.75);
        box-shadow: var(--shadow, 0 40px 100px rgba(0,0,0,.55)), 0 40px 100px rgba(0,0,0,.45);
      }
      .frame img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
    </style></head><body>
      <div class="frame"><img src="${rawDataUri}"></div>
    </body></html>`;

    const compositePage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await compositePage.setContent(compositeHtml, { waitUntil: 'load' });
    const finalShot = await compositePage.screenshot({ type: 'png' });
    await compositePage.close();

    // --- 4. Write output ---
    const outPath = join(ROOT, `public/media/og-image-${lang}.png`);
    mkdirSync(join(ROOT, 'public/media'), { recursive: true });
    writeFileSync(outPath, finalShot);
    console.log(`✔ ${outPath}`);

    // dist/ was already assembled by this same `astro build` — patch the
    // fresh image straight in rather than triggering a second full build.
    const distOutPath = join(distDir, `media/og-image-${lang}.png`);
    mkdirSync(join(distDir, 'media'), { recursive: true });
    copyFileSync(outPath, distOutPath);
    console.log(`✔ ${distOutPath}`);
  }

  await browser.close();

  // og-preview never ships — it only exists to be screenshotted.
  rmSync(join(distDir, 'og-preview'), { recursive: true, force: true });
  console.log('✔ Removed dist/og-preview (never deploys)');
} finally {
  execSync('npx astro preview stop', { stdio: 'inherit' });
}
