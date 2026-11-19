import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Keep canonical URLs and public/robots.txt on the same primary domain.
  site: 'https://skiesofanu.ru',
  integrations: [
    tailwind(),
    sitemap({
      // Keep review pages out of the sitemap.
      filter: (page) => !/^\/(?:paths|feed)(?:\/|$)/.test(new URL(page).pathname),
    }),
  ],
});
