import { defineConfig } from 'astro/config';
import { cpSync } from 'fs';

import sitemap from '@astrojs/sitemap';

const repo = process.env.GITHUB_REPOSITORY;
const [owner, name] = repo ? repo.split('/') : [null, null];

export default defineConfig({
  site: owner ? `https://${owner}.github.io` : 'http://localhost:4321',
  base: name ? `/${name}` : undefined,

  vite: {
    plugins: [{
      name: 'copy-themes',
      configResolved() {
        cpSync('src/styles/themes', 'public/themes', { recursive: true });
      }
    }]
  },

  integrations: [
    sitemap({
      filter: (page) =>
        // og-preview renders sample/mock data for the OG-image screenshot
        // pipeline and is deleted from dist/ before deploy — never a real page.
        !page.includes('/og-preview') &&
        // quickstart and get-started are both short redirect stubs to
        // /showcase/cv-hub#quickstart (two aliases, kept for presentation
        // variety) — same content, avoid duplicate-content sitemap entries.
        !page.includes('/quickstart') &&
        !page.includes('/get-started'),
    }),
  ]
});