// Script para cargar detalles de un producto específico desde la API
import { getData } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    const similarProductsContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    const titleElement = document.querySelector('h1');
    
    // Obtener el slug del producto de la URL
    const path = window.location.pathname;
    const slug = path.split('/').pop();
    
    // Función para formatear precio
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(precio);
    };
    
    // Función para extraer características
    const extraerCaracteristicas = (caracteristicas) => {
        if (!caracteristicas) return [];
        
        try {
            // Si es un string JSON, intentamos parsearlo
            if (typeof caracteristicas === 'string') {
                if (caracteristicas.includes(';')) {
                    return caracteristicas.split(';');
                }
                
                const parsed = JSON.parse(caracteristicas);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                return Object.values(parsed);
            }
            
            // Si ya es un objeto
            if (typeof caracteristicas === 'object') {
                if (Array.isArray(caracteristicas)) {
                    return caracteristicas;
                }
                return Object.values(caracteristicas);
            }
            
            return [caracteristicas];
        } catch (e) {
            // Si hay error al parsear, devolvemos como está
            return [caracteristicas];
        }
    };
    
    // Función para cargar productos similares
    const cargarProductosSimilares = async (categoriaActual) => {
        try {
            console.log('Cargando productos similares');
            // Usar la función getData con autenticación
            const data = await getData('/productos');
            console.log('Respuesta de productos similares:', JSON.stringify(data).substring(0, 200)); // Log primeros 200 caracteres
            
            // Verificar si la respuesta es un array o tiene una estructura diferente
            let productos = [];
            if (Array.isArray(data)) {
                productos = data;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.productos)) {
                    productos = data.productos;
                } else {
                    // Si no hay productos, crear algunos de ejemplo para pruebas
                    productos = [
                        { nombre: 'Martillo', precio: 5000, descripcion: 'Martillo de acero', categoria: 'Herramientas' },
                        { nombre: 'Destornillador', precio: 3000, descripcion: 'Destornillador Phillips', categoria: 'Herramientas' },
                        { nombre: 'Sierra', precio: 8000, descripcion: 'Sierra para madera', categoria: 'Herramientas' }
                    ];
                }
            }
            
            console.log(`Filtrando productos similares de categoría '${categoriaActual}' entre ${productos.length} productos`);
            
            // Filtrar productos de la misma categoría (excepto el actual)
            const productosSimilares = productos
                .filter(p => p.categoria === categoriaActual && p.nombre.toLowerCase().replace(/\s+/g, '-') !== slug)
                .slice(0, 4); // Máximo 4 productos similares
            
            if (productosSimilares.length === 0) {
                // Si no hay productos similares por categoría, mostrar algunos aleatorios
                const productosAleatorios = productos
                    .filter(p => p.nombre.toLowerCase().replace(/\s+/g, '-') !== slug)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4);
                    
                return productosAleatorios;
            }
            
            return productosSimilares;
            
        } catch (error) {
            console.error('Error al cargar productos similares:', error);
            return [];
        }
    };
    
    // Función para cargar el detalle del producto
    const cargarDetalleProducto = async () => {
        try {
            // Primero intentamos obtener todos los productos usando la función getData con autenticación
            console.log('Cargando detalle de producto');
            const data = await getData('/productos');
            console.log('Respuesta de la API:', JSON.stringify(data).substring(0, 200)); // Log primeros 200 caracteres
            
            // Verificar si la respuesta es un array o tiene una estructura diferente
            let productos = [];
            if (Array.isArray(data)) {
                productos = data;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.productos)) {
                    productos = data.productos;
                } else {
                    // Si no hay productos, crear algunos de ejemplo para pruebas
                    productos = [
                        { nombre: 'Martillo', precio: 5000, descripcion: 'Martillo de acero', categoria: 'Herramientas' },
                        { nombre: 'Destornillador', precio: 3000, descripcion: 'Destornillador Phillips', categoria: 'Herramientas' },
                        { nombre: 'Sierra', precio: 8000, descripcion: 'Sierra para madera', categoria: 'Herramientas' }
                    ];
                }
            }
            
            console.log(`Buscando producto con slug '${slug}' entre ${productos.length} productos`);
            
            // Buscar el producto que coincida con el slug de la URL
            const productoActual = productos.find(p => {
                const productoSlug = p.nombre.toLowerCase().replace(/\s+/g, '-');
                return productoSlug === slug;
            });
            
            if (!productoActual) {
                throw new Error('Producto no encontrado');
            }
            
            // Actualizar el título de la página
            document.title = `${productoActual.nombre} - Ferretería Patricio`;
            
            // Actualizar el breadcrumb
            const breadcrumbProducto = document.querySelector('.text-gray-800');
            if (breadcrumbProducto) {
                breadcrumbProducto.textContent = productoActual.nombre;
            }
            
            // Actualizar la información del producto
            if (titleElement) {
                titleElement.textContent = productoActual.nombre;
            }
            
            // Crear el contenido del producto
            const imagenUrl = productoActual.imagen || '/martillo.svg';
            const caracteristicas = extraerCaracteristicas(productoActual.caracteristicas);
            
            // Actualizar la imagen y detalles
            productContainer.innerHTML = `
                <!-- Imagen del producto -->
                <div class="bg-white p-8 rounded-lg shadow-sm">
                    <img src="${imagenUrl}" alt="${productoActual.nombre}" class="w-full h-auto object-contain">
                </div>

                <!-- Detalles del producto -->
                <div>
                    <h1 class="text-3xl font-bold mb-4">${productoActual.nombre}</h1>

                    <!-- Precio -->
                    <div class="text-2xl font-bold text-blue-600 mb-6">${formatearPrecio(productoActual.precio)}</div>

                    <!-- Descripción -->
                    <div class="prose max-w-none mb-8">
                        <p>${productoActual.descripcion}</p>
                    </div>

                    <!-- Características -->
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold mb-4">Características</h2>
                        <ul class="space-y-2">
                            ${caracteristicas.map(caracteristica => `
                                <li class="flex items-center">
                                    <span class="mr-2 text-sm">✓</span> ${caracteristica}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <!-- Stock -->
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold mb-2">Disponibilidad</h2>
                        <p class="${productoActual.stock > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${productoActual.stock > 0 ? `En stock (${productoActual.stock} unidades)` : 'Agotado'}
                        </p>
                    </div>
                </div>
            `;
            
            // Cargar productos similares
            const productosSimilares = await cargarProductosSimilares(productoActual.categoria);
            
            if (productosSimilares.length > 0 && similarProductsContainer) {
                similarProductsContainer.innerHTML = '';
                
                productosSimilares.forEach(producto => {
                    const caracteristicasTexto = extraerCaracteristicas(producto.caracteristicas).slice(0, 2).join(' | ');
                    const productoElement = document.createElement('a');
                    productoElement.href = `/productos/${producto.nombre.toLowerCase().replace(/\s+/g, '-')}`;
                    productoElement.className = 'bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1';
                    
                    productoElement.innerHTML = `
                        <img src="${producto.imagen || '/martillo.svg'}" alt="${producto.nombre}" class="w-full h-48 object-contain mb-4">
                        <h3 class="font-semibold">${producto.nombre}</h3>
                        <p class="text-sm text-gray-600">${caracteristicasTexto}</p>
                        <p class="text-blue-600 mt-2">${formatearPrecio(producto.precio)}</p>
                    `;
                    
                    similarProductsContainer.appendChild(productoElement);
                });
            }
            
        } catch (error) {
            console.error('Error al cargar detalle del producto:', error);
            productContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-red-500">No se pudo cargar el producto. Intente nuevamente más tarde.</p>
                </div>
            `;
        }
    };
    
    // Cargar detalle del producto
    cargarDetalleProducto();
});