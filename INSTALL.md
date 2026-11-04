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
VITE_API_URL=
VITE_DEV_API_TARGET=http://localhost:8080
VITE_API_TIMEOUT=10000
```

Vite solo expone al navegador variables con prefijo `VITE_`. No coloques secretos en ellas.

## 4. Ejecutar en desarrollo

```powershell
npm run dev
```

Vite queda disponible en todas las interfaces de red. Abre `http://<IP-DE-ESTE-EQUIPO>:5173`
desde otro dispositivo conectado a la misma red. Si Windows Firewall muestra un aviso,
permite el acceso para Node.js en redes privadas.

### HTTPS local para la cámara

Genera el certificado una sola vez desde la raíz de `cav-frontend`:

```powershell
mkcert -install
New-Item -ItemType Directory -Force .certs
mkcert -key-file .certs\cav-key.pem -cert-file .certs\cav.pem localhost 127.0.0.1 172.18.130.80
```

Después ejecuta:

```powershell
npm run dev
```

Accede desde otro dispositivo con:

```text
https://172.18.130.80:5173
```

El dispositivo remoto debe confiar en la CA local de `mkcert`; copia el archivo
mostrado por `mkcert -CAROOT` al dispositivo e instálalo como certificado raíz.
El certificado y la clave están en `.certs/`, una carpeta excluida de Git.

## 5. Build de produccion

```powershell
npm run build
npm run preview
```

El build se genera en `dist/`. Esta carpeta es un artefacto local y no debe subirse a GitHub.
