//
//  generate-og-image.mjs
//  CV Hub
//
//  Created by Alexander Gusarov on 27.08.2026.
//  @spartan121
//
//  Renders /og-preview (sample CV, see src/pages/og-preview.astro) through a
//  real headless browser and composites it into a 1200×630 OG-card image —
//  a rounded, shadowed "browser window" screenshot floating on a wallpaper
//  background, in the spirit of a manual Arc-browser screenshot.
//
//  Must run AFTER `astro build` (npm run build already sequences it that way)
//  — it serves the just-built dist/ via `astro preview --background` so the
//  screenshot is the real, fully-styled site (fonts, backgrounds, theme CSS),
//  not a reconstruction. The result is written to both public/media/og-image.png
//  (source, gitignored — regenerated every build) and dist/media/og-image.png
//  (this build's artifact already exists; we patch the fresh image straight
//  into it instead of paying for a second full `astro build`).
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

// --- 1. Serve the already-built dist/ ---
const distDir = join(ROOT, 'dist');
const ogPreviewHtmlPath = join(distDir, 'og-preview/index.html');
if (!existsSync(ogPreviewHtmlPath)) {
  console.error(
    `❌ ${ogPreviewHtmlPath} not found — run \`astro build\` (fresh, this script deletes it after every run) before generate-og-image.mjs`
  );
  process.exit(1);
}

console.log('▸ Starting preview server…');
execSync(`npx astro preview --port ${PORT} --background`, { stdio: 'inherit', env: process.env });

// Give the server a moment past its own "running" message to finish binding.
await new Promise((r) => setTimeout(r, 800));

try {
  // --- 2. Screenshot the real page ---
  const browser = await chromium.launch(process.env.CI ? { channel: 'chrome' } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  const themeParam = theme ? `?theme=${theme}` : '';
  // og-preview's own served base path can be `/` locally or `/cv_hub/` on CI
  // — read it from the built HTML rather than assume it.
  const baseHtml = readFileSync(ogPreviewHtmlPath, 'utf8');
  const base = baseHtml.match(/data-base="([^"]*)"/)?.[1] ?? '';
  const url = `http://localhost:${PORT}${base}/og-preview/${themeParam}`;

  console.log(`▸ Rendering ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  // Let canvas/CSS background animations settle to a clean first frame.
  await page.waitForTimeout(300);

  const rawShot = await page.screenshot({ type: 'png' });
  const rawDataUri = `data:image/png;base64,${rawShot.toString('base64')}`;

  // --- 3. Composite: frame + wallpaper on a second page, so `var()` design
  //     tokens resolve exactly like the live site (no hardcoded colors here).
  // global.css isn't served standalone (it's bundled per-page by Astro), so
  // pull the resolved :root tokens straight from the built page instead of
  // re-linking a stylesheet — the composite page reads the same custom
  // properties the live site computed.
  const rootVars = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const names = [
      '--bg', '--accent', '--accent-2', '--accent-rgb', '--accent-2-rgb',
      '--bg-glow-1', '--bg-glow-2', '--border-2', '--shadow', '--r-lg',
    ];
    return names.map((n) => `${n}: ${cs.getPropertyValue(n).trim()};`).join(' ');
  });

  await page.close();

  const wallpaperCss = wallpaperIsImage
    ? `background-image:url(data:image/${wallpaperArg.split('.').pop()};base64,${readFileSync(join(ROOT, wallpaperArg)).toString('base64')});background-size:cover;background-position:center;`
    : `background:
         radial-gradient(900px 600px at 15% 10%, rgba(var(--accent-rgb) / 0.45), transparent 60%),
         radial-gradient(800px 560px at 90% 90%, rgba(var(--accent-2-rgb) / 0.35), transparent 55%),
         var(--bg);`;

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
  await browser.close();

  // --- 4. Write output ---
  const outPath = join(ROOT, 'public/media/og-image.png');
  mkdirSync(join(ROOT, 'public/media'), { recursive: true });
  writeFileSync(outPath, finalShot);
  console.log(`✔ ${outPath}`);

  // dist/ was already assembled by this same `astro build` — patch the fresh
  // image straight in rather than triggering a second full build.
  const distOutPath = join(distDir, 'media/og-image.png');
  mkdirSync(join(distDir, 'media'), { recursive: true });
  copyFileSync(outPath, distOutPath);
  console.log(`✔ ${distOutPath}`);

  // og-preview never ships — it only exists to be screenshotted.
  rmSync(join(distDir, 'og-preview'), { recursive: true, force: true });
  console.log('✔ Removed dist/og-preview (mock-data route never deploys)');
} finally {
  execSync('npx astro preview stop', { stdio: 'inherit' });
}
