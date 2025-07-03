// Configuración de la API según el entorno

// Determinar la URL de la API según el entorno
const getApiUrl = () => {
  // Verificar si estamos en un entorno de navegador (cliente) o servidor
  const isBrowser = typeof window !== 'undefined';
  
  // Si estamos en el navegador y no es localhost, usar la URL de producción
  if (isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // URL de la API en producción - Actualizada para conectar correctamente a PostgreSQL
    return 'https://hammernet-backend.onrender.com';
  }
  
  // Verificar si hay una variable de entorno definida para la URL de la API
  if (import.meta.env.API_URL) {
    return import.meta.env.API_URL;
  }
  
  // Si no hay variable de entorno, usar la URL de producción por defecto
  return 'https://hammernet-backend.onrender.com';
};

// Configuración de CORS para las solicitudes
export const corsConfig = {
  credentials: 'include',
  mode: 'cors',  // Asegurar que el modo CORS esté siempre activado
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
};

// Función para manejar errores de CORS y conexión
export const handleApiError = (error) => {
  console.error('Error de API:', error);
  
  // Determinar el tipo de error
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return {
      type: 'connection',
      message: 'No se pudo conectar con el servidor. Verifique su conexión a internet o si el servidor está disponible.'
    };
  } else if (error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'La conexión al servidor ha tardado demasiado tiempo.'
    };
  } else if (error.message && error.message.includes('CORS')) {
    return {
      type: 'cors',
      message: 'Error de política de CORS. El servidor no permite solicitudes desde este origen.'
    };
  }
  
  // Error genérico o desconocido
  return {
    type: 'unknown',
    message: error.message || 'Error desconocido al conectar con la API'
  };
};

// Exportar la URL de la API
export const API_URL = getApiUrl();

// Función para verificar si el servidor está disponible
export const checkServerAvailability = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      ...corsConfig,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Servidor disponible');
      return { available: true, message: 'Servidor disponible' };
    } else {
      console.warn('Servidor no disponible:', response.status);
      return { available: false, message: `Servidor no disponible: ${response.status}` };
    }
  } catch (error) {
    const errorInfo = handleApiError(error);
    console.warn('Error al verificar disponibilidad del servidor:', errorInfo.message);
    return { available: false, message: errorInfo.message, type: errorInfo.type };
  }
};