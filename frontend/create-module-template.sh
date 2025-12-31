#!/bin/bash

# Script para criar estrutura base de um módulo
# Uso: ./create-module-template.sh <module-name> <display-name> <category>

MODULE_NAME=$1
DISPLAY_NAME=$2
CATEGORY=$3
MODULE_DIR="src/modules/$MODULE_NAME"

# Criar diretórios
mkdir -p "$MODULE_DIR/types"
mkdir -p "$MODULE_DIR/services"
mkdir -p "$MODULE_DIR/pages"

echo "Módulo $MODULE_NAME criado em $MODULE_DIR"
