// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'server',
  integrations: [react()],
  adapter: cloudflare({
    imageService: 'cloudflare', // Usa la optimización de imágenes de Cloudflare
    platformProxy: {
      enabled: true, // Permite simular el entorno Cloudflare en tu PC
    },
  }),
});