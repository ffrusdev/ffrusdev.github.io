// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Hosted on GitHub Pages at the user-site address (repo: ffrusdev/ffrusdev.github.io).
// sitemap() writes sitemap-index.xml at build time: a list of every page,
// so search engines can find them all (robots.txt points to it).
export default defineConfig({
  site: 'https://ffrusdev.github.io',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
