// Utilidad para manejar las solicitudes a la API con autenticación
import { API_URL, corsConfig } from './config.js';

/**
 * Realiza una solicitud a la API con el token de autenticación
 * @param {string} endpoint - Endpoint de la API (sin la URL base)
 * @param {Object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise} - Promesa con la respuesta
 */
export async function fetchWithAuth(endpoint, options = {}) {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  console.log('Token obtenido:', token ? 'Token presente' : 'Token ausente');
  
  // Preparar las cabeceras con el token de autenticación
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Añadir el token de autorización si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Cabecera de autorización añadida');
  } else {
    console.warn('No se encontró token de autenticación');
  }
  
  // Realizar la petición con las opciones configuradas
  console.log(`Realizando petición a: ${API_URL}${endpoint}`);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      ...corsConfig,
      headers: {
        ...corsConfig.headers,
        ...headers
      }
    });
    
    console.log(`Respuesta recibida: ${response.status} ${response.statusText}`);
    
    // Si recibimos un 401 (No autorizado), redirigir al login
    if (response.status === 401) {
       console.error('Error 401: No autorizado');
       // Limpiar datos de autenticación
       localStorage.removeItem('isLoggedIn');
       localStorage.removeItem('nombreUsuario');
       localStorage.removeItem('token');
       localStorage.removeItem('userId');
       localStorage.removeItem('role');
       
       window.location.href = '/login';
       return null;
     }
     
     return response;
   } catch (error) {
     console.error('Error en la petición:', error);
     throw error;
   }
}

/**
 * Obtiene datos de la API con autenticación
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise} - Promesa con los datos
 */
export async function getData(endpoint) {
  const response = await fetchWithAuth(endpoint);
  if (!response) return null;
  
  if (!response.ok) {
    throw new Error(`Error al obtener datos: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Envía datos a la API con autenticación (POST)
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} data - Datos a enviar
 * @returns {Promise} - Promesa con la respuesta
 */
export async function postData(endpoint, data) {
  const response = await fetchWithAuth(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!response) return null;
  
  if (!response.ok) {
    throw new Error(`Error al enviar datos: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Actualiza datos en la API con autenticación (PUT)
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} data - Datos a actualizar
 * @returns {Promise} - Promesa con la respuesta
 */
export async function updateData(endpoint, data) {
  const response = await fetchWithAuth(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response) return null;
  
  if (!response.ok) {
    throw new Error(`Error al actualizar datos: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Elimina datos en la API con autenticación (DELETE)
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise} - Promesa con la respuesta
 */
export async function deleteData(endpoint) {
  const response = await fetchWithAuth(endpoint, {
    method: 'DELETE'
  });
  if (!response) return null;
  
  if (!response.ok && response.status !== 204) {
    throw new Error(`Error al eliminar datos: ${response.statusText}`);
  }
  
  return true;
}