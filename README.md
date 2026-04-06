# Quiniela 2026

Aplicacion de quiniela con frontend web y API en Node.js. Ahora usa PostgreSQL para guardar participantes, predicciones y resultados oficiales.

## Requisitos

- Node.js 18+
- PostgreSQL (local o en la nube)

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de variables:

```bash
cp .env.example .env
```

3. Ajusta en `.env`:
- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`

4. Inicia:

```bash
npm start
```

La primera vez, el servidor:
- crea tablas si no existen
- migra automaticamente datos legacy desde `data/entries.json` y `data/results.json` si la tabla `submissions` esta vacia

## Endpoints principales

- `POST /api/predict`
- `GET /api/leaderboard`
- `GET /api/admin/entries` (requiere header `Authorization`)
- `POST /api/admin/set-result` (requiere header `Authorization`)
- `POST /api/admin/reset-results` (requiere header `Authorization`)
- `POST /api/admin/reset-all` (requiere header `Authorization`)

## Despliegue recomendado

### 1) Base de datos (Supabase, Neon o Railway)

- Crea una base PostgreSQL
- Copia el `DATABASE_URL`

### 2) Backend (Render o Railway)

- Sube este repo
- Comando de build: `npm install`
- Comando de start: `npm start`
- Variables de entorno:
  - `DATABASE_URL`
  - `ADMIN_PASSWORD`
  - `CORS_ORIGIN` (URL de tu frontend, por ejemplo `https://tuapp.netlify.app`)
  - `NODE_ENV=production`

### 3) Frontend (Netlify o Vercel)

Tienes dos opciones:

- **Simple:** servir frontend desde el mismo backend (`/public`) y solo desplegar API.
- **Separado:** subir solo frontend estatico y apuntarlo a la API publica.

Para frontend separado, define antes de tus scripts:

```html
<script>
  window.API_BASE_URL = "https://tu-api.onrender.com";
</script>
```

y luego cargas `js/script.js` (y en admin funciona igual).

## Seguridad minima recomendada

- No usar clave admin por defecto
- Restringir `CORS_ORIGIN` solo a tu dominio real
- Si hay dinero de por medio, agregar autenticacion real para admin (JWT + usuario/clave)
