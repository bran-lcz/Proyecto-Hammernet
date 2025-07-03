@echo off
echo Configurando el proyecto de Ferreteria Patricio...

echo Instalando dependencias...
npm install

echo Creando archivo .env si no existe...
if not exist .env (
    echo # Variables de entorno para la aplicacion frontend > .env
    echo. >> .env
    echo # URL del sitio (usado en astro.config.mjs) >> .env
    echo SITE_URL=https://tu-frontend-app.onrender.com >> .env
    echo. >> .env
    echo # URL de la API >> .env
    echo API_URL=https://backend-ferreteria-patricio.onrender.com/api >> .env
    echo Archivo .env creado correctamente.
) else (
    echo El archivo .env ya existe.
)

echo Configuracion completada. Ahora puedes ejecutar el proyecto con:
echo npm run dev

pause