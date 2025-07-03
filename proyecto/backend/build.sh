#!/usr/bin/env bash
# Script de construcción para Render

set -o errexit

echo "Instalando dependencias..."
pip install -r requirements.txt

echo "Creando directorios necesarios..."
mkdir -p data

echo "Construcción completada."