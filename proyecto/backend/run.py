# Este archivo sirve como punto de entrada alternativo para ejecutar la aplicación

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)