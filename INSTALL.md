# Instalacion de cav-frontend

## 1. Instalar Node.js

Instala una version LTS compatible con el proyecto: Node.js 22.18 o Node.js 24.12 o superior. Verifica la instalacion:

```powershell
node --version
npm --version
```

## 2. Instalar dependencias

Desde la raiz de `cav-frontend`:

```powershell
npm install
```

`package-lock.json` debe conservarse en el repositorio para instalaciones reproducibles.

## 3. Configurar variables de entorno

Copia la plantilla:

```powershell
Copy-Item .env.example .env
```

Edita `.env` cuando sea necesario:

```dotenv
VITE_API_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=10000
```

Vite solo expone al navegador variables con prefijo `VITE_`. No coloques secretos en ellas.

## 4. Ejecutar en desarrollo

```powershell
npm run dev
```

Abre `http://localhost:5173`.

## 5. Build de produccion

```powershell
npm run build
npm run preview
```

El build se genera en `dist/`. Esta carpeta es un artefacto local y no debe subirse a GitHub.
