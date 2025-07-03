import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  // Configuración para scripts como módulos ES
  vite: {
    build: {
      // Asegurarse de que los scripts se manejen como módulos ES
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    }
  },
  // Configuración para el despliegue en Render
  site: process.env.SITE_URL || 'https://tu-frontend-app.onrender.com',
  base: '/',
});