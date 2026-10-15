# cav-frontend

## Descripcion

Interfaz web progresiva para el Sistema Web de Control de Acceso Vehicular del Hotel Chable Maroma.

## Objetivo

Proporcionar la interfaz para autenticacion, consulta del estado de integracion y operacion del sistema de control vehicular, consumiendo la API REST de `cav-backend`.

## Tecnologias

- Vue 3 y Vite
- Vue Router y Pinia
- Axios
- Bootstrap 5
- PWA mediante `vite-plugin-pwa`

## Estructura del proyecto

```text
cav-frontend/
|- src/
|  |- router/
|  |- services/api/
|  |- stores/
|  `- views/
|- public/
|- .env.example
|- package.json
|- INSTALL.md
`- vite.config.js
```

## Requisitos previos

- Node.js 22.18 o Node.js 24.12 o superior.
- npm incluido con Node.js.
- `cav-backend` disponible en `http://localhost:8080` para probar la integracion.

## Instalacion y ejecucion

Consulta [INSTALL.md](INSTALL.md) para la instalacion completa.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

La aplicacion se sirve normalmente en `http://localhost:5173`.

## Variables de entorno

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API backend | `http://localhost:8080/api/v1` |
| `VITE_API_TIMEOUT` | Tiempo maximo de espera en milisegundos | `10000` |

## Autor

Bryan Martinez Jimenez  
Proyecto de Estadias Profesionales  
Hotel Chable Maroma
