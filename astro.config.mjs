import { defineConfig } from 'astro/config';
import { mkdirSync, readdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';

const repo = process.env.GITHUB_REPOSITORY;
const [owner, name] = repo ? repo.split('/') : [null, null];

/**
 * Recursively copies a directory from src to dest.
 * Replaces fs.cpSync which crashes on Node 22 / Windows with Cyrillic paths.
 */
function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  site: owner ? `https://${owner}.github.io` : 'http://localhost:4321',
  base: name ? `/${name}` : undefined,
  vite: {
    plugins: [{
      name: 'copy-themes',
      configResolved() {
        try {
          copyDirSync('src/styles/themes', 'public/themes');
        } catch (e) {
          console.warn('[copy-themes] skipped:', e.message);
        }
      }
    }]
  }
});