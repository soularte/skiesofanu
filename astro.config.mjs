import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Keep canonical URLs and public/robots.txt on the same primary domain.
  site: 'https://skiesofanu.ru',
  integrations: [
    tailwind(),
    sitemap({
      // Unfinished reading paths remain available for review, but not indexing.
      filter: (page) => !new URL(page).pathname.startsWith('/paths/'),
    }),
  ],
});
