# Campo Inteligente — Plataforma Agrocomercial

Plataforma agrocomercial modular desarrollada como Progressive Web App (PWA) para conectar a productores agrícolas, transportistas y compradores.

## 🚀 Requisitos previos

- Node.js (v18 o superior)
- npm

## 📦 Instalación y configuración

1. Clonar el repositorio y configurar las variables de entorno basándose en `.env.example`.
2. Instalar todas las dependencias del monorepo:

```bash
npm run install:all
```

3. Configurar la base de datos y cargar los **9 perfiles de prueba**:

```bash
npm run db:setup
```

## 🛠️ Ejecución local en desarrollo

Para iniciar tanto el backend como el frontend en paralelo:

```bash
npm run dev
```

- **Backend:** `http://localhost:4000`
- **Frontend PWA:** `http://localhost:5173`

---

## 👥 Perfiles de prueba iniciales (Seed)

| Identificador | Rol | Descripción |
|---|---|---|
| PROD-01 | Productor | Producto disponible inmediatamente |
| PROD-02 | Productor | Cosecha futura y estimación de costos |
| PROD-03 | Productor | Capacidad productiva registrada |
| TRAN-01 | Transportista | Capacidad para carga completa |
| TRAN-02 | Transportista | Carga parcial |
| TRAN-03 | Transportista | Disponibilidad limitada |
| BUY-01 | Comprador | Busca producto con presupuesto definido |
| BUY-02 | Comprador | Flexibilidad de precio y fecha |
| BUY-03 | Comprador | Sin coincidencias actuales |

## 📱 Funcionalidades PWA

La aplicación incluye un manifest y Service Worker configurados mediante `vite-plugin-pwa`, permitiendo su instalación en dispositivos móviles Android y escritorio.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Code <noreply@anthropic.com>
