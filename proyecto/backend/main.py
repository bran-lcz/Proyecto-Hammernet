from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from sqlalchemy.orm import Session
import uvicorn
import json
import os
import shutil
import base64
from datetime import datetime, timedelta

# Importar módulos personalizados
from database import get_db, Base, engine, USE_DB, get_json_data, save_json_data
from models import Producto, ProductoCreate, ProductoBase, Usuario, UsuarioCreate, UsuarioLogin, Token, ProductoDB, UsuarioDB
from auth import hash_contraseña, verificar_contraseña, crear_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from cloudinary_config import configure_cloudinary, upload_image, delete_image, get_public_id_from_url

# Configurar Cloudinary
configure_cloudinary()

# Inicializar la aplicación FastAPI
app = FastAPI(
    title="API de Hammernet",
    description="API para la gestión de productos y usuarios de Hammernet",
    version="1.0.0",
    root_path=os.environ.get("ROOT_PATH", "")  # Para despliegue en subdirectorios si es necesario
)

# Crear tablas en la base de datos si se está usando SQLAlchemy
if USE_DB:
    try:
        Base.metadata.create_all(bind=engine)
        print("Tablas creadas correctamente en la base de datos")
    except Exception as e:
        print(f"Error al crear tablas: {e}")
        print("Continuando con almacenamiento JSON como fallback")

# Configurar CORS para permitir solicitudes desde el frontend
origins = [
    "https://hammernet-frontend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
# Los modelos de datos se han movido al archivo models.py

# Rutas para productos
@app.get("/productos", response_model=List[Producto], tags=["Productos"])
async def get_productos(db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            productos_db = db.query(ProductoDB).all()
            productos = [
                {
                    "id": p.id,
                    "nombre": p.nombre,
                    "descripcion": p.descripcion,
                    "caracteristicas": p.caracteristicas,
                    "precio": p.precio,
                    "stock": p.stock,
                    "categoria": p.categoria,
                    "imagen": p.imagen,
                    "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else datetime.now().isoformat()
                } for p in productos_db
            ]
            return productos
        else:
            # Usar JSON como fallback
            return get_json_data("productos.json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/productos/{producto_id}", response_model=Producto, tags=["Productos"])
async def get_producto(producto_id: int, db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            producto_db = db.query(ProductoDB).filter(ProductoDB.id == producto_id).first()
            if not producto_db:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            return {
                "id": producto_db.id,
                "nombre": producto_db.nombre,
                "descripcion": producto_db.descripcion,
                "caracteristicas": producto_db.caracteristicas,
                "precio": producto_db.precio,
                "stock": producto_db.stock,
                "categoria": producto_db.categoria,
                "imagen": producto_db.imagen,
                "fecha_creacion": producto_db.fecha_creacion.isoformat() if producto_db.fecha_creacion else datetime.now().isoformat()
            }
        else:
            # Usar JSON como fallback
            productos = get_json_data("productos.json")
            for producto in productos:
                if producto["id"] == producto_id:
                    return producto
            
            raise HTTPException(status_code=404, detail="Producto no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/productos", response_model=Producto, status_code=status.HTTP_201_CREATED, tags=["Productos"])
async def create_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    try:
        fecha_creacion = datetime.now()
        
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            nuevo_producto_db = ProductoDB(
                nombre=producto.nombre,
                descripcion=producto.descripcion,
                caracteristicas=producto.caracteristicas,
                precio=producto.precio,
                stock=producto.stock,
                categoria=producto.categoria,
                imagen=producto.imagen,
                fecha_creacion=fecha_creacion
            )
            
            db.add(nuevo_producto_db)
            db.commit()
            db.refresh(nuevo_producto_db)
            
            return {
                "id": nuevo_producto_db.id,
                "nombre": nuevo_producto_db.nombre,
                "descripcion": nuevo_producto_db.descripcion,
                "caracteristicas": nuevo_producto_db.caracteristicas,
                "precio": nuevo_producto_db.precio,
                "stock": nuevo_producto_db.stock,
                "categoria": nuevo_producto_db.categoria,
                "imagen": nuevo_producto_db.imagen,
                "fecha_creacion": nuevo_producto_db.fecha_creacion.isoformat() if nuevo_producto_db.fecha_creacion else fecha_creacion.isoformat()
            }
        else:
            # Usar JSON como fallback
            productos = get_json_data("productos.json")
            
            # Crear nuevo producto
            nuevo_id = 1
            if productos:
                nuevo_id = max(p["id"] for p in productos) + 1
            
            nuevo_producto = {
                **producto.dict(),
                "id": nuevo_id,
                "fecha_creacion": fecha_creacion.isoformat()
            }
            
            productos.append(nuevo_producto)
            save_json_data("productos.json", productos)
            
            return nuevo_producto
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/productos/{producto_id}", response_model=Producto, tags=["Productos"])
async def update_producto(producto_id: int, producto_update: ProductoCreate, db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            producto_db = db.query(ProductoDB).filter(ProductoDB.id == producto_id).first()
            if not producto_db:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            # Actualizar los campos
            for key, value in producto_update.dict().items():
                setattr(producto_db, key, value)
            
            db.commit()
            db.refresh(producto_db)
            
            return {
                "id": producto_db.id,
                "nombre": producto_db.nombre,
                "descripcion": producto_db.descripcion,
                "caracteristicas": producto_db.caracteristicas,
                "precio": producto_db.precio,
                "stock": producto_db.stock,
                "categoria": producto_db.categoria,
                "imagen": producto_db.imagen,
                "fecha_creacion": producto_db.fecha_creacion.isoformat() if producto_db.fecha_creacion else datetime.now().isoformat()
            }
        else:
            # Usar JSON como fallback
            productos = get_json_data("productos.json")
            if not productos:
                raise HTTPException(status_code=404, detail="No hay productos registrados")
            
            producto_encontrado = False
            for i, producto in enumerate(productos):
                if producto["id"] == producto_id:
                    productos[i] = {
                        **producto,
                        **producto_update.dict()
                    }
                    producto_encontrado = True
                    break
            
            if not producto_encontrado:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            save_json_data("productos.json", productos)
            
            return next(p for p in productos if p["id"] == producto_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/productos/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Productos"])
async def delete_producto(producto_id: int, db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            producto_db = db.query(ProductoDB).filter(ProductoDB.id == producto_id).first()
            if not producto_db:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            db.delete(producto_db)
            db.commit()
        else:
            # Usar JSON como fallback
            productos = get_json_data("productos.json")
            if not productos:
                raise HTTPException(status_code=404, detail="No hay productos registrados")
            
            productos_filtrados = [p for p in productos if p["id"] != producto_id]
            
            if len(productos) == len(productos_filtrados):
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            save_json_data("productos.json", productos_filtrados)
        
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rutas para usuarios
@app.get("/usuarios", response_model=List[Usuario], tags=["Usuarios"])
async def get_usuarios(db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            usuarios_db = db.query(UsuarioDB).all()
            usuarios = [
                {
                    "id": u.id,
                    "nombre": u.nombre,
                    "username": u.username,
                    "role": u.role,
                    "fecha_creacion": u.fecha_creacion.isoformat() if u.fecha_creacion else datetime.now().isoformat()
                } for u in usuarios_db
            ]
            return usuarios
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            # No devolver las contraseñas
            for usuario in usuarios:
                if "password" in usuario:
                    del usuario["password"]
            return usuarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/usuarios", response_model=Usuario, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
async def create_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        fecha_creacion = datetime.now()
        
        # Validar que el rol sea uno de los permitidos
        roles_permitidos = ["administrador", "vendedor", "bodeguero"]
        if usuario.role not in roles_permitidos:
            raise HTTPException(
                status_code=400, 
                detail=f"Rol no válido. Los roles permitidos son: {', '.join(roles_permitidos)}"
            )
        
        # Hashear la contraseña
        password_hash = hash_contraseña(usuario.password)
        
        if USE_DB and db is not None:
            # Verificar si el username ya existe
            if db.query(UsuarioDB).filter(UsuarioDB.username == usuario.username).first():
                raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
            
            # Crear nuevo usuario en la base de datos
            nuevo_usuario_db = UsuarioDB(
                nombre=usuario.nombre,
                username=usuario.username,
                password=password_hash,
                role=usuario.role,
                fecha_creacion=fecha_creacion
            )
            
            db.add(nuevo_usuario_db)
            db.commit()
            db.refresh(nuevo_usuario_db)
            
            return {
                "id": nuevo_usuario_db.id,
                "nombre": nuevo_usuario_db.nombre,
                "username": nuevo_usuario_db.username,
                "role": nuevo_usuario_db.role,
                "fecha_creacion": nuevo_usuario_db.fecha_creacion.isoformat() if nuevo_usuario_db.fecha_creacion else fecha_creacion.isoformat()
            }
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            
            # Verificar si el username ya existe
            if any(u["username"] == usuario.username for u in usuarios):
                raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
            
            # Crear nuevo usuario
            nuevo_id = 1
            if usuarios:
                nuevo_id = max(u["id"] for u in usuarios) + 1
            
            nuevo_usuario = {
                "id": nuevo_id,
                "nombre": usuario.nombre,
                "username": usuario.username,
                "password": password_hash,
                "role": usuario.role,
                "fecha_creacion": fecha_creacion.isoformat()
            }
            
            usuarios.append(nuevo_usuario)
            save_json_data("usuarios.json", usuarios)
            
            # No devolver la contraseña
            usuario_response = nuevo_usuario.copy()
            del usuario_response["password"]
            return usuario_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=Token, tags=["Autenticación"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            usuario = db.query(UsuarioDB).filter(UsuarioDB.username == form_data.username).first()
            if not usuario or not verificar_contraseña(form_data.password, usuario.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Generar token JWT
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = crear_token(
                data={"sub": usuario.username},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "id": usuario.id,
                "nombre": usuario.nombre,
                "username": usuario.username,
                "role": usuario.role
            }
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            
            for usuario in usuarios:
                if usuario["username"] == form_data.username:
                    # Si es la primera vez que se usa el sistema con contraseñas hasheadas
                    if "password" in usuario and not usuario["password"].startswith("$2"):
                        # Verificar contraseña sin hash (compatibilidad con datos antiguos)
                        if usuario["password"] != form_data.password:
                            continue
                        # Opcional: actualizar la contraseña a formato hasheado
                        # usuario["password"] = hash_contraseña(form_data.password)
                        # save_json_data("usuarios.json", usuarios)
                    else:
                        # Verificar contraseña hasheada
                        if not verificar_contraseña(form_data.password, usuario["password"]):
                            continue
                    
                    # Generar token JWT
                    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = crear_token(
                        data={"sub": usuario["username"]},
                        expires_delta=access_token_expires
                    )
                    
                    return {
                        "access_token": access_token,
                        "token_type": "bearer",
                        "id": usuario["id"],
                        "nombre": usuario["nombre"],
                        "username": usuario["username"],
                        "role": usuario["role"]
                    }
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Obtener un usuario por ID
@app.get("/usuarios/{usuario_id}", response_model=Usuario, tags=["Usuarios"])
async def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            usuario_db = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
            if not usuario_db:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            return {
                "id": usuario_db.id,
                "nombre": usuario_db.nombre,
                "username": usuario_db.username,
                "role": usuario_db.role,
                "fecha_creacion": usuario_db.fecha_creacion.isoformat() if usuario_db.fecha_creacion else datetime.now().isoformat()
            }
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            for usuario in usuarios:
                if usuario["id"] == usuario_id:
                    usuario_response = usuario.copy()
                    if "password" in usuario_response:
                        del usuario_response["password"]
                    return usuario_response
            
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Actualizar un usuario existente
@app.put("/usuarios/{usuario_id}", response_model=Usuario, tags=["Usuarios"])
async def update_usuario(usuario_id: int, usuario_update: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        # Validar que el rol sea uno de los permitidos
        roles_permitidos = ["administrador", "vendedor", "bodeguero"]
        if usuario_update.role not in roles_permitidos:
            raise HTTPException(
                status_code=400, 
                detail=f"Rol no válido. Los roles permitidos son: {', '.join(roles_permitidos)}"
            )
        
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            usuario_db = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
            if not usuario_db:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            # Verificar si el nuevo username ya existe y no es el mismo usuario
            if usuario_update.username != usuario_db.username:
                if db.query(UsuarioDB).filter(UsuarioDB.username == usuario_update.username).first():
                    raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
            
            # Actualizar los campos
            usuario_db.nombre = usuario_update.nombre
            usuario_db.username = usuario_update.username
            usuario_db.role = usuario_update.role
            
            # Solo actualizar la contraseña si se proporciona una nueva
            if usuario_update.password and usuario_update.password.strip():
                usuario_db.password = hash_contraseña(usuario_update.password)
            
            db.commit()
            db.refresh(usuario_db)
            
            return {
                "id": usuario_db.id,
                "nombre": usuario_db.nombre,
                "username": usuario_db.username,
                "role": usuario_db.role,
                "fecha_creacion": usuario_db.fecha_creacion.isoformat() if usuario_db.fecha_creacion else datetime.now().isoformat()
            }
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            if not usuarios:
                raise HTTPException(status_code=404, detail="No hay usuarios registrados")
            
            # Verificar si el nuevo username ya existe y no es el mismo usuario
            for u in usuarios:
                if u["username"] == usuario_update.username and u["id"] != usuario_id:
                    raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
            
            usuario_encontrado = False
            for i, usuario in enumerate(usuarios):
                if usuario["id"] == usuario_id:
                    # Crear una copia del usuario actual
                    usuario_actualizado = usuario.copy()
                    
                    # Actualizar los campos
                    usuario_actualizado["nombre"] = usuario_update.nombre
                    usuario_actualizado["username"] = usuario_update.username
                    usuario_actualizado["role"] = usuario_update.role
                    
                    # Solo actualizar la contraseña si se proporciona una nueva
                    if usuario_update.password and usuario_update.password.strip():
                        usuario_actualizado["password"] = hash_contraseña(usuario_update.password)
                    
                    usuarios[i] = usuario_actualizado
                    usuario_encontrado = True
                    break
            
            if not usuario_encontrado:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            save_json_data("usuarios.json", usuarios)
            
            # Devolver el usuario actualizado sin la contraseña
            usuario_response = next(u for u in usuarios if u["id"] == usuario_id).copy()
            if "password" in usuario_response:
                del usuario_response["password"]
            
            return usuario_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Eliminar un usuario
@app.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuarios"])
async def delete_usuario(usuario_id: int, db: Session = Depends(get_db)):
    try:
        if USE_DB and db is not None:
            # Usar la base de datos SQL
            usuario_db = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
            if not usuario_db:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            db.delete(usuario_db)
            db.commit()
        else:
            # Usar JSON como fallback
            usuarios = get_json_data("usuarios.json")
            if not usuarios:
                raise HTTPException(status_code=404, detail="No hay usuarios registrados")
            
            usuarios_filtrados = [u for u in usuarios if u["id"] != usuario_id]
            
            if len(usuarios) == len(usuarios_filtrados):
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            save_json_data("usuarios.json", usuarios_filtrados)
        
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ruta para subir imágenes a Cloudinary
@app.post("/upload-image", tags=["Imágenes"])
async def upload_image_to_cloudinary(file: UploadFile = File(...)):
    try:
        # Verificar que el archivo sea una imagen
        content_type = file.content_type
        if not content_type or not content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail=f"Tipo de archivo no válido: {content_type}. Se esperaba una imagen.")
        
        # Leer el contenido del archivo
        try:
            contents = await file.read()
            if not contents:
                raise HTTPException(status_code=400, detail="Archivo vacío o corrupto")
        except Exception as read_error:
            raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(read_error)}")
        
        # Subir la imagen a Cloudinary
        print(f"Subiendo imagen {file.filename} de tipo {content_type} a Cloudinary...")
        cloudinary_url = upload_image(contents)
        
        if not cloudinary_url:
            raise HTTPException(status_code=500, detail="Error al subir la imagen a Cloudinary. Revise los logs del servidor para más detalles.")
        
        print(f"Imagen subida exitosamente: {cloudinary_url}")
        return {"url": cloudinary_url, "filename": file.filename}
    except HTTPException as he:
        # Re-lanzar excepciones HTTP ya formateadas
        raise he
    except Exception as e:
        print(f"Error inesperado al subir imagen: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error inesperado al procesar la imagen: {str(e)}")

# Ruta para subir imágenes en base64 a Cloudinary
@app.post("/upload-image-base64", tags=["Imágenes"])
async def upload_image_base64(image_data: str = Form(...)):
    try:
        # Verificar que los datos sean base64 válidos
        if not image_data or not image_data.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Formato de imagen no válido")
        
        # Extraer el tipo de imagen y los datos base64
        try:
            # Formato esperado: data:image/jpeg;base64,/9j/4AAQSkZJRg...
            content_type, encoded_data = image_data.split(';base64,')
            if not encoded_data:
                raise ValueError("Datos base64 no encontrados")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Formato base64 inválido: {str(e)}")
        
        # Subir la imagen a Cloudinary
        cloudinary_url = upload_image(image_data)
        
        if not cloudinary_url:
            raise HTTPException(status_code=500, detail="Error al subir la imagen a Cloudinary")
        
        return {"url": cloudinary_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")

# Iniciar el servidor si se ejecuta directamente
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)