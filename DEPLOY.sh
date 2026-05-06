#!/bin/bash
# DEPLOY.sh — Deploy do Kroc Admin para Vercel via GitHub
# Uso: bash DEPLOY.sh

echo "🥣 Kroc Admin — Iniciando deploy..."

# Limpa git anterior (force push)
rm -rf .git

# Inicializa novo repo
git init
git add .
git commit -m "Kroc Admin — deploy $(date '+%d/%m/%Y %H:%M')"

# Push para GitHub (Vercel detecta automaticamente)
git remote add origin https://github.com/caiokroc/kroc-admin.git
git branch -M main
git push --force origin main

echo ""
echo "✅ Push feito! O Vercel vai buildar automaticamente."
echo "📍 Acesse: https://kroc-admin.vercel.app (após conectar no Vercel)"
echo ""
