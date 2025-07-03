import os
import json
import sys
import base64
import requests
from datetime import datetime
from cloudinary_config import configure_cloudinary, upload_image

# Configurar Cloudinary
configure_cloudinary()

def add_test_product():
    """Añade un producto de prueba con una imagen de Cloudinary"""
    try:
        # Ruta del archivo JSON de productos
        json_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "productos.json")
        
        if not os.path.exists(json_file_path):
            print(f"Archivo de productos no encontrado en: {json_file_path}")
            return False
            
        with open(json_file_path, "r", encoding="utf-8") as f:
            productos = json.load(f)
        
        # Generar un nuevo ID
        nuevo_id = max(p["id"] for p in productos) + 1 if productos else 1
        
        # Imagen de prueba (logo de Hammernet)
        imagen_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "logo.webp")
        
        if not os.path.exists(imagen_path):
            print(f"Imagen no encontrada: {imagen_path}")
            return False
        
        print(f"Subiendo imagen de prueba: {imagen_path}")
        
        # Subir la imagen a Cloudinary
        with open(imagen_path, "rb") as img_file:
            image_data = img_file.read()
            public_id = f"producto_test_{nuevo_id}_logo"
            cloudinary_url = upload_image(image_data, public_id=public_id)
        
        if not cloudinary_url:
            print("Error al subir la imagen a Cloudinary")
            return False
        
        print(f"Imagen subida exitosamente: {cloudinary_url}")
        
        # Crear nuevo producto
        nuevo_producto = {
            "id": nuevo_id,
            "nombre": "Producto de Prueba Cloudinary",
            "descripcion": "Este es un producto de prueba para verificar la integración con Cloudinary",
            "caracteristicas": "Característica 1: Valor 1, Característica 2: Valor 2",
            "precio": 99.99,
            "stock": 10,
            "categoria": "Pruebas",
            "imagen": cloudinary_url,
            "fecha_creacion": datetime.now().isoformat()
        }
        
        # Añadir el nuevo producto
        productos.append(nuevo_producto)
        
        # Guardar los cambios
        with open(json_file_path, "w", encoding="utf-8") as f:
            json.dump(productos, f, ensure_ascii=False, indent=4)
        
        print(f"\n✅ Producto de prueba creado con ID {nuevo_id}")
        return True
    
    except Exception as e:
        print(f"Error al crear producto de prueba: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_api_upload():
    """Prueba la carga de imágenes a través de la API"""
    try:
        # URL de la API
        api_url = "http://localhost:8000/upload-image"
        
        # Imagen de prueba
        imagen_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "hammernet.webp")
        
        if not os.path.exists(imagen_path):
            print(f"Imagen no encontrada: {imagen_path}")
            return False
        
        print(f"Enviando imagen a la API: {imagen_path}")
        
        # Preparar la solicitud
        with open(imagen_path, "rb") as img_file:
            files = {"file": ("test_upload.webp", img_file, "image/webp")}
            response = requests.post(api_url, files=files)
        
        # Verificar la respuesta
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Imagen subida exitosamente a través de la API")
            print(f"URL: {result.get('url')}")
            return True
        else:
            print(f"\n❌ Error al subir imagen a través de la API: {response.status_code}")
            print(response.text)
            return False
    
    except Exception as e:
        print(f"Error al probar la API: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Prueba de creación de producto con Cloudinary ===")
    
    # Añadir producto de prueba
    resultado_producto = add_test_product()
    
    if resultado_producto:
        print("\n✅ Producto creado exitosamente")
    else:
        print("\n❌ Error al crear el producto")
    
    # Probar la API de carga de imágenes
    print("\n=== Prueba de carga de imágenes a través de la API ===")
    
    try:
        resultado_api = test_api_upload()
        if resultado_api:
            print("\n✅ Prueba de API completada exitosamente")
        else:
            print("\n❌ Error en la prueba de API")
    except Exception as e:
        print(f"\n❌ Error al ejecutar la prueba de API: {str(e)}")
    
    # Resultado final
    if resultado_producto:
        print("\n✅ Proceso completado exitosamente")
        sys.exit(0)
    else:
        print("\n⚠️ El proceso finalizó con errores")
        sys.exit(1)