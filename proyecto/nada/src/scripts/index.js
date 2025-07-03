// Script para cargar productos destacados desde la API en la página de inicio
import { getData } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productosDestacadosContainer = document.querySelector('#productos-destacados');
    
    // Función para cargar productos destacados desde la API
    async function cargarProductosDestacados() {
        try {
            // Usar la función getData con autenticación
            const productos = await getData('/productos');
            
            // Seleccionar 4 productos aleatorios para mostrar como destacados
            const productosDestacados = productos
                .sort(() => 0.5 - Math.random()) // Mezclar aleatoriamente
                .slice(0, 4); // Tomar los primeros 4
            
            mostrarProductosDestacados(productosDestacados);
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error al usuario
            if (productosDestacadosContainer) {
                productosDestacadosContainer.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <p class="text-gray-500">No se pudieron cargar los productos destacados. Intente nuevamente más tarde.</p>
                    </div>
                `;
            }
        }
    }
    
    // Función para mostrar productos destacados en la interfaz
    function mostrarProductosDestacados(productosArray) {
        if (!productosDestacadosContainer) return;
        
        if (productosArray.length === 0) {
            productosDestacadosContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">No se encontraron productos destacados.</p>
                </div>
            `;
            return;
        }
        
        productosDestacadosContainer.innerHTML = '';
        
        productosArray.forEach((producto, index) => {
            const productoElement = document.createElement('a');
            productoElement.href = `/productos/${producto.nombre.toLowerCase().replace(/ /g, '-')}`;
            productoElement.className = 'bg-white p-6 rounded-xl shadow-lg group hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300';
            productoElement.setAttribute('data-aos', 'fade-up');
            productoElement.setAttribute('data-aos-duration', '1000');
            productoElement.setAttribute('data-aos-delay', index * 100);
            
            // Formatear precio
            const precioFormateado = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(producto.precio);
            
            productoElement.innerHTML = `
                <div class="relative overflow-hidden rounded-lg mb-6">
                    <img src="${producto.imagen || '/martillo.svg'}" alt="${producto.nombre}" class="w-full h-48 object-contain transform group-hover:scale-110 transition-transform duration-300">
                </div>
                <h3 class="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-300">${producto.nombre}</h3>
                <p class="text-blue-600 font-medium">${precioFormateado}</p>
            `;
            
            productosDestacadosContainer.appendChild(productoElement);
        });
    }
    
    // Cargar productos destacados al iniciar
    cargarProductosDestacados();
});