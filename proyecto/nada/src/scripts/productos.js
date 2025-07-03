// Script para cargar productos desde la API
import { getData } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productosContainer = document.querySelector('.grid');
    const buscador = document.querySelector('input[placeholder="Buscar Producto"]');
    const paginacionContainer = document.querySelector('.mt-12.flex.justify-center');
    const rangoPrecios = document.querySelector('input[type="range"]');
    const categoriasCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const disponibilidadRadios = document.querySelectorAll('input[name="disponibilidad"]');
    
    let productos = [];
    let productosFiltrados = [];
    let paginaActual = 1;
    const productosPorPagina = 8;
    
    // Función para cargar productos desde la API
    async function cargarProductos() {
        try {
            // Usar la función getData con autenticación
            productos = await getData('/productos');
            mostrarProductos(productos);
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error al usuario
            productosContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">No se pudieron cargar los productos. Intente nuevamente más tarde.</p>
                </div>
            `;
            actualizarPaginacion(0);
        }
    }
    
    // Función para mostrar productos en la interfaz con paginación
    function mostrarProductos(productosArray) {
        if (productosArray.length === 0) {
            productosContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">No se encontraron productos.</p>
                </div>
            `;
            actualizarPaginacion(0);
            return;
        }
        
        productosFiltrados = productosArray;
        actualizarPaginacion(productosArray.length);
        
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPagina = productosArray.slice(inicio, fin);
        
        productosContainer.innerHTML = '';
        
        productosPagina.forEach((producto, index) => {
            const productoElement = document.createElement('a');
            productoElement.href = `/productos/${producto.nombre.toLowerCase().replace(/ /g, '-')}`;
            productoElement.className = 'group bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col h-full';
            productoElement.setAttribute('data-aos', 'fade-up');
            productoElement.setAttribute('data-aos-duration', '1000');
            productoElement.setAttribute('data-aos-delay', (index % 4) * 100);
            
            // Formatear precio
            const precioFormateado = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(producto.precio);
            
            // Extraer descripción para mostrar en la tarjeta (reducir a 40 caracteres para mejor ajuste)
            const descripcion = producto.descripcion ? producto.descripcion.substring(0, 40) + (producto.descripcion.length > 40 ? '...' : '') : '';
            
            productoElement.innerHTML = `
                <div class="relative overflow-hidden rounded-lg mb-2">
                    <img src="${producto.imagen || '/martillo.svg'}" alt="${producto.nombre}" class="w-full h-36 object-contain transform group-hover:scale-105 transition-transform duration-300">
                </div>
                <h3 class="text-md font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 mb-1">${producto.nombre}</h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2 flex-grow overflow-hidden">${descripcion}</p>
                <p class="text-blue-600 font-medium mt-2">${precioFormateado}</p>
            `;
            
            productosContainer.appendChild(productoElement);
        });
    }
    
    // Función para actualizar la paginación
    function actualizarPaginacion(totalProductos) {
        if (!paginacionContainer) return;
        
        const totalPaginas = Math.ceil(totalProductos / productosPorPagina);
        if (totalPaginas <= 1) {
            paginacionContainer.style.display = 'none';
            return;
        }
        
        paginacionContainer.style.display = 'flex';
        
        // Crear botones de paginación
        const botonesHTML = [];
        
        // Botón anterior
        botonesHTML.push(`
            <button class="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                ${paginaActual === 1 ? 'disabled' : ''} data-page="prev">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        `);
        
        // Contenedor de números de página
        botonesHTML.push('<div class="flex gap-2">');
        
        // Determinar qué botones mostrar
        let startPage = Math.max(1, paginaActual - 2);
        let endPage = Math.min(totalPaginas, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Generar botones de número de página
        for (let i = startPage; i <= endPage; i++) {
            botonesHTML.push(`
                <button class="px-4 py-2 ${paginaActual === i ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors duration-200" 
                    data-page="${i}">${i}</button>
            `);
        }
        
        // Agregar puntos suspensivos si hay más páginas
        if (endPage < totalPaginas) {
            botonesHTML.push('<span class="px-4 py-2">...</span>');
            botonesHTML.push(`
                <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
                    data-page="${totalPaginas}">${totalPaginas}</button>
            `);
        }
        
        botonesHTML.push('</div>');
        
        // Botón siguiente
        botonesHTML.push(`
            <button class="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : ''}" 
                ${paginaActual === totalPaginas ? 'disabled' : ''} data-page="next">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            </button>
        `);
        
        paginacionContainer.innerHTML = botonesHTML.join('');
        
        // Agregar eventos a los botones de paginación
        const botones = paginacionContainer.querySelectorAll('button');
        botones.forEach(boton => {
            boton.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                
                if (page === 'prev' && paginaActual > 1) {
                    paginaActual--;
                } else if (page === 'next' && paginaActual < totalPaginas) {
                    paginaActual++;
                } else if (page !== 'prev' && page !== 'next') {
                    paginaActual = parseInt(page);
                }
                
                mostrarProductos(productosFiltrados);
            });
        });
    }
    
    // Función para aplicar todos los filtros
    function aplicarFiltros() {
        // Obtener término de búsqueda
        const termino = buscador ? buscador.value.toLowerCase() : '';
        
        // Obtener rango de precio
        const precioMax = rangoPrecios ? parseInt(rangoPrecios.value) : 100000;
        
        // Obtener categorías seleccionadas
        const categoriasSeleccionadas = [];
        categoriasCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const categoriaTexto = checkbox.nextElementSibling.textContent.trim();
                categoriasSeleccionadas.push(categoriaTexto);
            }
        });
        
        // Obtener disponibilidad
        let soloEnStock = false;
        disponibilidadRadios.forEach(radio => {
            if (radio.checked && radio.nextElementSibling.textContent.trim() === 'En stock') {
                soloEnStock = true;
            }
        });
        
        // Aplicar todos los filtros
        const filtrados = productos.filter(producto => {
            // Filtro por término de búsqueda
            const coincideTermino = termino === '' || 
                producto.nombre.toLowerCase().includes(termino) ||
                producto.descripcion.toLowerCase().includes(termino) ||
                producto.categoria.toLowerCase().includes(termino);
            
            // Filtro por precio
            const coincidePrecio = producto.precio <= precioMax;
            
            // Filtro por categoría
            const coincideCategoria = categoriasSeleccionadas.length === 0 || 
                categoriasSeleccionadas.some(cat => {
                    // Convertir nombres de categoría a formato de base de datos
                    let catDB = cat.toLowerCase();
                    if (cat === 'Jardinería y Exteriores') catDB = 'jardineria_y_exteriores';
                    if (cat === 'Hogar y Limpieza') catDB = 'hogar_y_limpieza';
                    if (cat === 'Tornillos y Clavos') catDB = 'tornillos_y_clavos';
                    
                    return producto.categoria === catDB || producto.categoria.includes(catDB);
                });
            
            // Filtro por disponibilidad
            const coincideStock = !soloEnStock || producto.stock > 0;
            
            return coincideTermino && coincidePrecio && coincideCategoria && coincideStock;
        });
        
        // Resetear a la primera página cuando se aplican filtros
        paginaActual = 1;
        
        // Mostrar productos filtrados
        mostrarProductos(filtrados);
    }
    
    // Evento para el buscador
    if (buscador) {
        buscador.addEventListener('input', () => {
            aplicarFiltros();
        });
    }
    
    // Evento para el rango de precios
    if (rangoPrecios) {
        rangoPrecios.addEventListener('input', () => {
            // Actualizar el valor mostrado
            const valorFormateado = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(rangoPrecios.value);
            
            const valoresTexto = rangoPrecios.nextElementSibling;
            if (valoresTexto) {
                const spans = valoresTexto.querySelectorAll('span');
                if (spans.length > 1) {
                    spans[1].textContent = valorFormateado;
                }
            }
            
            aplicarFiltros();
        });
    }
    
    // Eventos para los checkboxes de categorías
    categoriasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            aplicarFiltros();
        });
    });
    
    // Eventos para los radios de disponibilidad
    disponibilidadRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            aplicarFiltros();
        });
    });
    
    // Cargar productos al iniciar
    cargarProductos();
});