#!/bin/sh
# Compile l'interface React dans dist/ (servi par server.js et embarqué par Tauri)
cd "$(dirname "$0")/web" && npx vite build
