from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import json
import os
from database import USE_DB, get_db
from sqlalchemy.orm import Session

# Configuración del hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Secret key para JWT - Usar variable de entorno en producción
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "clave_super_secreta_hammernet")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verificar_contraseña(plain_password, hashed_password):
    """Verifica si la contraseña coincide con el hash"""
    # Si la contraseña almacenada no es un hash bcrypt (no comienza con $2)
    # entonces comparamos directamente (para contraseñas en texto plano)
    if not hashed_password.startswith("$2"):
        return plain_password == hashed_password
    
    # Si es un hash bcrypt, usamos el verificador de passlib
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        # Si hay un error al verificar (por ejemplo, el hash no es válido)
        print(f"Error al verificar contraseña: {e}")
        return False

def hash_contraseña(password):
    """Genera un hash de la contraseña"""
    return pwd_context.hash(password)

def crear_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verificar_token(token: str):
    """Verifica un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return {"username": username}
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtiene el usuario actual a partir del token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_data = verificar_token(token)
    if user_data is None:
        raise credentials_exception
    
    username = user_data["username"]
    
    if USE_DB and db is not None:
        # Usar la base de datos SQL
        from models import UsuarioDB
        user = db.query(UsuarioDB).filter(UsuarioDB.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    else:
        # Usar JSON como fallback
        if not os.path.exists("data/usuarios.json"):
            raise credentials_exception
        
        with open("data/usuarios.json", "r", encoding="utf-8") as f:
            usuarios = json.load(f)
        
        for usuario in usuarios:
            if usuario["username"] == username:
                return usuario
        
        raise credentials_exception