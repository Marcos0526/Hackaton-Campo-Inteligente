# Hackaton-Campo-Inteligente

## 📌 Descripción del reto

La idea de este reto es desarrollar una herramienta que ayude a productores en el campo a resolver tres problemáticas:

1. **El campo** — que nos habla de una capacidad operativa, maximización de ganancias.
2. **Transporte de mercancias** — en base a la localidad del productor y a dónde se venderá el producto.
3. **Acceso a financiamientos** — información basada en los productos y en la capacidad de generar dinero.

---

## 🧠 Explicación profesional

### Visión general

Se resume la declaración de intención del hackathon: el agro no es solo producción, sino un **sistema productivo → logístico → financiero**. La herramienta busca apoyar al productor en la toma de decisiones económicas a través de tres módulos integrados.

### Problema 1 — "El campo" (capacidad operativa y maximización de ganancias)

- **Capacidad operativa:** gestión de la finca, cultivos, insumos, tierras y recursos.
- **Maximización de ganancias:** eficiencia en costos, estimación de rendimiento y decisiones orientadas a incrementar el margen del productor.

### Problema 2 — Transporte de mercancías (localidad + punto de venta)

- La logística depende de la **localidad del productor** y del **destino de venta**.
- Gestiona rutas, tiempos, costos de transporte y capacidad de carga, impactando en pérdidas post-cosecha y en el precio final percibido.

### Problema 3 — Acceso a financiamiento (información basada en productos / capacidad de generar dinero)

- El productor carece de historial crediticio.
- La herramienta genera la información necesaria (basada en sus productos y en su capacidad de generar ingresos) para respaldar el acceso a financiamiento.

### Objetivo general

> Desarrollar una herramienta integral que conecte gestión agrícola, optimización logística de transporte y acceso a financiamiento, para que el productor tome decisiones económicas informadas.

---

## 💻 Implementación

La aplicación web se encuentra en [`web/`](./web/README.md).

- **Stack:** Next.js 16 + TypeScript, Tailwind CSS v4, Better Auth, Drizzle ORM
  (SQLite local), TanStack Query, Zod y Recharts.
- **Incluye:** registro e inicio de sesión, ajustes de cuenta (perfil,
  contraseña y preferencias), modo claro/oscuro/sistema, y un panel con
  indicadores y gráficas de producción, transporte y financiamiento.
- **Datos:** el panel consume `/api/metrics`, que puede apuntar a una API real
  mediante `METRICS_API_URL`. Sin esa variable usa un conjunto de datos de
  demostración determinista.

### Arranque rápido

```bash
cd web
npm install
cp .env.example .env.local   # agrega BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate
npm run dev                  # http://localhost:3000
```

Consulta [`web/README.md`](./web/README.md) para el contrato de la API, scripts
y notas de despliegue.
