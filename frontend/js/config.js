/**
 * Configuración Global del Frontend
 * Cambia API_BASE_URL por la URL de tu backend en producción (ej. de Render o Railway).
 * En local, usa 'http://localhost:3000'.
 */
window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : 'https://TU-URL-DE-BACKEND.render.com'; // REEMPLAZA ESTO
