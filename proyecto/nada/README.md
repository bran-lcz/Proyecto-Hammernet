# Frontend Ferretería Patricio

Este es el frontend de la aplicación web para Ferretería Patricio, desarrollado con Astro y TailwindCSS.

## Configuración para despliegue

### Configuración local

1. Clona este repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Configuración para producción

Este proyecto está configurado para ser desplegado en Render.com como una aplicación estática, separada del backend.

#### Pasos para desplegar en Render

1. Crea una cuenta en [Render](https://render.com) si aún no tienes una.
2. Desde el dashboard de Render, haz clic en "New" y selecciona "Static Site".
3. Conecta tu repositorio de GitHub o GitLab donde está alojado este código.
4. Configura los siguientes ajustes:
   - **Name**: Nombre para tu sitio (ej. frontend-ferreteria)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. En la sección de variables de entorno, agrega:
   - `SITE_URL`: La URL completa de tu sitio (ej. https://frontend-ferreteria.onrender.com)

#### Configuración de la URL del backend

Para que el frontend se conecte correctamente al backend, puedes usar variables de entorno:

1. Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# URL del sitio (usado en astro.config.mjs)
SITE_URL=https://tu-frontend-app.onrender.com

# URL de la API
API_URL=https://backend-ferreteria-patricio.onrender.com/api
```

2. El archivo `src/scripts/config.js` está configurado para usar esta variable de entorno:

```javascript
// Determinar la URL de la API según el entorno
const getApiUrl = () => {
  // Verificar si hay una variable de entorno definida para la URL de la API
  if (import.meta.env.API_URL) {
    return import.meta.env.API_URL;
  }
  
  // Si no hay variable de entorno, usar la URL de producción por defecto
  return 'https://backend-ferreteria-patricio.onrender.com/api';
};
```

## Estructura del proyecto

- `src/`: Código fuente de la aplicación
  - `layouts/`: Plantillas de diseño
  - `pages/`: Páginas de la aplicación
  - `scripts/`: Scripts JavaScript
- `public/`: Archivos estáticos
- `astro.config.mjs`: Configuración de Astro
- `tailwind.config.mjs`: Configuración de TailwindCSS
- `render.yaml`: Configuración para despliegue en Render

## Solución de problemas comunes

### Problemas de conexión con la API

Si experimentas errores como `ERR_CONNECTION_REFUSED` o `Failed to fetch`, sigue estos pasos:

1. Verifica que estás usando la URL correcta de la API en el archivo `.env`:
   ```
   API_URL=https://backend-ferreteria-patricio.onrender.com/api
   ```

2. Asegúrate de tener instalada la dependencia `dotenv`:
   ```bash
   npm install dotenv
   ```

3. Verifica que la API esté funcionando correctamente visitando:
   https://backend-ferreteria-patricio.onrender.com/api/health

### CORS (Cross-Origin Resource Sharing)

Si experimentas problemas de CORS al conectar con el backend, asegúrate de que tu backend tenga configurados los encabezados CORS correctamente para permitir solicitudes desde el dominio de tu frontend.

### Rutas en producción

Si tienes problemas con las rutas en producción, verifica la configuración en `astro.config.mjs` y asegúrate de que `site` y `base` estén configurados correctamente.

### Módulos ES

Este proyecto utiliza módulos ES para los scripts. Si tienes problemas con la importación de módulos, asegúrate de que todos los scripts tengan el atributo `type="module"` en las etiquetas script.