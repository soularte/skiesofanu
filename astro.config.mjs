import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://skiesofanu.com',
  integrations: [
    tailwind(),
    sitemap(),
  ],
});