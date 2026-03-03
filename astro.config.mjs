// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Автоматически подстраиваем base под имя репозитория GitHub
  // Локально (npm run dev) GITHUB_REPOSITORY не задан, поэтому base = undefined.
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
    : undefined,
});
