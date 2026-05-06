import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
//import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://astounding-chebakia-15d9f1.netlify.app',
  integrations: [
    tailwind(),
    // sitemap()
],
});