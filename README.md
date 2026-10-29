# Campo Inteligente — Plataforma Agrocomercial

Plataforma agrocomercial modular desarrollada como **Progressive Web App (PWA)** para conectar a **productores agrícolas**, **transportistas** y **compradores** en una sola cadena de comercialización.

---

## 📋 Tabla de contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [API — Endpoints](#api--endpoints)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y configuración](#instalación-y-configuración)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Base de datos y seed](#base-de-datos-y-seed)
- [Estado actual y hoja de ruta](#estado-actual-y-hoja-de-ruta)

---

## 🏁 Descripción

**Campo Inteligente** es una plataforma agrocomercial que digitaliza la intermediación entre los actores del sector agrícola:

- El **productor** publica sus ofertas de venta (producto, cantidad, calidad, precio y fecha de disponibilidad).
- El **comprador** publica sus solicitudes o busca productos con presupuesto definido.
- Se generan **operaciones comerciales** que pueden escalar a **cotizaciones de transporte** y **gestión financiera**.
- Un **asistente inteligente** orienta la interacción inicial de los usuarios.

Todo el producto se entrega como una **PWA**, accesible desde dispositivos móviles y de escritorio.

## 🛠️ Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, `vite-plugin-pwa`, lucide-react |
| Backend | Node.js, Express 5, TypeScript, Better Auth, Prisma ORM |
| Base de datos | SQLite (Prisma provider: `sqlite`) |

## 🏗️ Arquitectura

El repositorio está organizado como un **monorepo** con npm workspaces:

```
campo-inteligente/
├── client/    # Frontend PWA (React + Vite)
├── server/    # API REST (Express + Better Auth + Prisma)
├── prisma/    # Definición del esquema y seed
└── package.json  # Workspaces y scripts del monorepo
```

- **Frontend (`client/`):** SPA construida con React + TypeScript y empaquetada con Vite. Incluye soporte PWA mediante `vite-plugin-pwa` (manifest + Service Worker).
- **Backend (`server/`):** API REST construida con Express, autenticación con **Better Auth** (email/password) con adaptador Prisma, y acceso a datos mediante **Prisma Client**.
- **Base de datos (`prisma/`):** Esquema Prisma con SQLite y migraciones.

## ✨ Funcionalidades

### 🔐 Autenticación y perfiles

- Autenticación con **email y contraseña** mediante **Better Auth**.
- Modelos de sesión, cuenta y verificación de email gestionados por el adaptador Prisma.
- Tres roles de usuario:
  - `producer` — productor agrícola.
  - `transporter` — transportista.
  - `buyer` — comprador.
- Perfiles desglosados por rol:
  - `ProducerProfile` (finca, ubicación, hectáreas, cultivos, capacidad de almacenamiento).
  - `TransporterProfile` (ubicación base, tipo de vehículo, capacidad de carga, rutas).
  - `BuyerProfile` (empresa, ubicación de entrega, cultivos preferidos).

### 📦 Ofertas comerciales

- Creación de ofertas por parte del productor con los campos:
  - `productName`, `quantity`, `unit` (`toneladas`, `kg`, `bultos`), `quality` (`primera`, `segunda`), `pricePerUnit`, `availableDate`.
- Estados de oferta: `published`, `negotiating`, `confirmed`, `completed`, `cancelled`.

### 🤝 Operaciones comerciales

- Vinculación entre ofertas y solicitudes de comprador.
- Estados de operación: `draft`, `published`, `negotiating`, `awaiting_confirmation`, `confirmed`, `transport_pending`, `in_transit`, `delivered`, `completed`, `cancelled`, `disputed`.
- Precio acordado (`agreedPrice`).

### 🚚 Gestión de transporte

- Cotizaciones de transporte (`TransportQuote`) con origen, destino, distancia (`distanceKm`) y precio (`quotedPrice`).
- Estados: `pending`, `accepted`, `rejected`.

### 💰 Finanzas y notificaciones

- Solicitudes financieras (`FinancialRequest`) con costos estimados, monto solicitado y ventas proyectadas.
- Estados: `submitted`, `reviewing`, `estimated`.
- Notificaciones (`Notification`) con título, mensaje y estado de lectura.

### 🤖 Asistente inteligente

- Interfaz de chat orientada a asesorar al usuario.
- Flujo actual: el usuario escribe → el asistente responde con opciones de oferta → se abre detalle → se registra compra.

## 🔌 API — Endpoints

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/health` | Health check del servicio | Público |
| GET | `/api/offers` | Lista de ofertas comerciales con estado `published` | Público |
| POST | `/api/offers` | Crea una oferta comercial | Autenticado (rol `producer`) |
| `/api/auth/*` | — | Endpoints de autenticación (Better Auth) | Variable |

**Endpoint de creación de oferta** — `POST /api/offers`:

```json
{
  "productName": "string",
  "quantity": 0,
  "unit": "toneladas",
  "quality": "primera",
  "pricePerUnit": 0,
  "availableDate": "2026-10-29T00:00:00.000Z"
}
```

## 📁 Estructura del proyecto

```
.
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       └── main.tsx
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── dev.db
│   └── src/
│       ├── index.ts
│       ├── lib/
│       │   ├── auth.ts
│       │   └── prisma.ts
│       └── routes/
│           └── commercial.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
└── .env.example
```

## 🚀 Requisitos previos

- **Node.js** v18 o superior.
- **npm**.

## 📦 Instalación y configuración

1. Clonar el repositorio:

   ```bash
   git clone <repository-url>
   cd Hackaton-Campo-Inteligente
   ```

2. Configurar las variables de entorno a partir de `.env.example`:

   ```env
   PORT=4000
   DATABASE_URL="file:./dev.db"
   BETTER_AUTH_SECRET="super-secret-key-change-in-production-campo-inteligente"
   BETTER_AUTH_URL="http://localhost:4000"
   CLIENT_URL="http://localhost:5173"
   ```

3. Instalar las dependencias del monorepo:

   ```bash
   npm run install:all
   ```

4. Configurar la base de datos y cargar los perfiles de prueba:

   ```bash
   npm run db:setup
   ```

## 🛠️ Ejecución en desarrollo

Para levantar backend y frontend en paralelo:

```bash
npm run dev
```

- **Backend:** `http://localhost:4000`
- **Frontend PWA:** `http://localhost:5173`

## 🧪 Pruebas

```bash
npm run test
```

Ejecuta las suites de test definidas en los workspaces `server` y `client`.

## 📱 Funcionalidades PWA

La aplicación incluye **manifest** y **Service Worker** configurados mediante `vite-plugin-pwa` (tipo `autoUpdate`), permitiendo la instalación en dispositivos móviles Android y escritorio.

## 🗄️ Base de datos y seed

- Motor: **SQLite** gestionado con **Prisma**.
- Esquema: `server/prisma/schema.prisma`.
- Migraciones: `server/prisma/migrations/`.
- Archivo de base de datos: `server/prisma/dev.db`.

### 👥 Perfiles de prueba (Seed)

El script de seed crea usuarios con los roles y perfiles descritos a continuación:

| Rol | Identificadores | Descripción |
|---|---|---|
| Productor | `PROD-01` – `PROD-10` | Perfiles con fincas, cultivos y capacidades productivas registradas. |
| Transportista | `TRAN-01` – `TRAN-10` | Perfiles con tipo de vehículo, capacidad de carga y rutas habituales. |
| Comprador | `BUY-01` – `BUY-10` | Perfiles con empresas, ubicaciones de entrega y cultivos preferidos. |

Además, se crea una **oferta comercial de ejemplo** (`Jitomate Saladette`) asociada al productor `PROD-01`.

## 🗺️ Estado actual y hoja de ruta

- ✅ Frontend PWA (React + Vite) con asistente de chat y detalle de ofertas.
- ✅ Backend con autenticación (Better Auth) y endpoints de ofertas comerciales.
- ✅ Esquema Prisma completo de usuarios, perfiles, ofertas, operaciones, transporte, finanzas y notificaciones.
- 🚧 Integración del frontend con la API real (actualmente el chat y el login son simulados en UI).
- 🚧 Implementación de endpoints para solicitudes de comprador, operaciones, cotizaciones, finanzas y notificaciones.

---

## 🤝 Contribución

1. Crear rama feature desde `main`.
2. Desarrollar con convenciones TypeScript/React.
3. Ejecutar `npm run build` para validación de tipos y build.
4. Abrir pull request.


