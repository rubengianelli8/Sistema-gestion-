# Sistema de Gestión - Ferretería

Sistema de gestión integral para ferreterías construido con Next.js 16, TypeScript, Prisma y PostgreSQL.

## Stack Tecnológico

- **Framework**: Next.js 16.1.1 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth (Auth.js v5)
- **UI**: Tailwind CSS + shadcn/ui
- **Validación**: Zod

## Características

- ✅ Autenticación con NextAuth
- ✅ Sistema de permisos basado en roles (Admin, Vendedor, Almacenero, Contador)
- ✅ Gestión de usuarios
- ✅ Gestión de categorías
- ✅ Gestión de productos (con código de barras)
- ✅ Gestión de clientes
- ✅ Punto de venta (Ventas)
- ✅ Presupuestos
- ✅ Multi-depósitos
- ✅ Gestión de proveedores
- ✅ Órdenes de compra
- ✅ Dashboard con estadísticas
- ✅ Auditoría de acciones

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sistema_gestion?schema=public"
AUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Configurar base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# O usar db:push para desarrollo
npm run db:push
```

### 4. Crear usuario administrador

Ejecuta un script de seed o crea manualmente el primer usuario en la base de datos.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
Sistema-gestion/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── api/               # API routes
│   ├── actions/           # Server Actions
│   ├── dashboard/         # Dashboard
│   ├── productos/         # Gestión de productos
│   ├── categorias/        # Gestión de categorías
│   ├── clientes/          # Gestión de clientes
│   ├── ventas/           # Punto de venta
│   ├── presupuestos/     # Presupuestos
│   ├── depositos/        # Multi-depósitos
│   ├── proveedores/      # Proveedores
│   ├── compras/          # Órdenes de compra
│   └── usuarios/         # Gestión de usuarios
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── forms/            # Formularios
│   └── layout/           # Layout components
├── lib/                  # Utilidades
│   ├── prisma.ts         # Cliente Prisma
│   ├── auth.ts           # Utilidades de autenticación
│   ├── permissions.ts    # Sistema de permisos
│   └── validations/      # Schemas de validación (Zod)
├── repositories/         # Capa de acceso a datos
├── services/             # Lógica de negocio
└── prisma/               # Schema y migraciones
```

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Ejecutar linter
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:push` - Sincronizar schema con base de datos (desarrollo)
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:studio` - Abrir Prisma Studio

## Roles y Permisos

- **Admin**: Acceso completo a todas las funcionalidades
- **Vendedor**: Puede ver productos, clientes, crear ventas y presupuestos
- **Almacenero**: Puede gestionar productos, depósitos, proveedores y compras
- **Contador**: Solo lectura de productos, clientes, ventas, presupuestos y compras

## Notas

- El proyecto está en proceso de migración desde Python/FastAPI + React CRA
- Algunos módulos pueden necesitar implementación completa de UI
- Los componentes UI básicos están implementados, pero pueden necesitar mejoras

## Licencia

Privado
