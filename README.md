# EstéticaCRM

CRM minimalista de alto rendimiento para clínicas de estética.

## Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI**: React 19 + TypeScript strict + Tailwind CSS + shadcn/ui
- **Auth**: NextAuth v5 (Credentials + Google OAuth)
- **Database**: PostgreSQL auto-hospedado en **CubePath VPS** + Drizzle ORM
- **Forms**: React Hook Form + Zod
- **Calendar**: react-big-calendar + date-fns
- **State**: TanStack Query (client) + React.cache (server)
- **Notifications**: Sonner

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Rellena `.env.local` con los datos de tu VPS de CubePath:

```env
DATABASE_URL=postgresql://crm_user:tu_password@IP_DE_CUBEPATH:5432/beautycrm
AUTH_SECRET=genera-con-openssl-rand-base64-32
AUTH_GOOGLE_ID=tu-google-client-id       # opcional
AUTH_GOOGLE_SECRET=tu-google-client-secret
```

### 3. Instalar y configurar PostgreSQL en tu VPS de CubePath

Conéctate a tu VPS por SSH y ejecuta:

```bash
# Instalar PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Iniciar el servicio
sudo systemctl enable postgresql && sudo systemctl start postgresql

# Crear usuario y base de datos
sudo -u postgres psql <<EOF
CREATE USER crm_user WITH PASSWORD 'tu_password';
CREATE DATABASE beautycrm OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE beautycrm TO crm_user;
EOF
```

Permitir conexiones remotas (edita `pg_hba.conf` y `postgresql.conf`):

```bash
# En postgresql.conf
listen_addresses = '*'

# En pg_hba.conf — añade al final (reemplaza TU_IP con la IP de tu servidor Next.js)
host  beautycrm  crm_user  TU_IP/32  scram-sha-256

sudo systemctl restart postgresql
```

> **Tip:** Si Next.js corre en el mismo VPS, usa `localhost` como host y no necesitas abrir el puerto 5432 al exterior.

### 4. Ejecutar el script SQL inicial

Desde tu máquina local (con `psql` instalado):

```bash
psql "$DATABASE_URL" -f scripts/setup-db.sql
```

O copia el contenido de `scripts/setup-db.sql` y ejecútalo directamente en el servidor:

```bash
sudo -u postgres psql beautycrm -f /ruta/scripts/setup-db.sql
```

### 5. Sincronizar schema con Drizzle

```bash
npm run db:push
```

### 6. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

**Credenciales por defecto:**
- Email: `admin@esteticacrm.com`
- Contraseña: `Admin1234!`

> ⚠️ Cambia la contraseña inmediatamente tras el primer login.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Sincronizar schema → base de datos |
| `npm run db:studio` | Drizzle Studio (interfaz visual DB) |
| `npm run db:generate` | Generar migraciones SQL |

## Estructura del proyecto

```
app/
├── (auth)/          # Login, Register (rutas públicas)
├── (app)/           # Dashboard, Patients, Schedule, Settings (protegidas)
│   ├── dashboard/
│   ├── patients/
│   │   └── [id]/
│   │       └── medical-record/
│   ├── schedule/
│   └── settings/
├── api/
│   └── auth/        # NextAuth handler + register endpoint
│   └── appointments/# Citas API endpoint
└── globals.css

components/
├── auth/            # LoginForm, RegisterForm
├── layout/          # Sidebar, Header
├── dashboard/       # Stats, RecentPatients, Skeletons
├── patients/        # PatientsTable, PatientModal
├── schedule/        # ScheduleCalendar, AppointmentModal
├── medical-records/ # MedicalRecordClient
├── settings/        # SettingsClient
└── providers/       # ThemeProvider, QueryProvider

lib/
├── db/
│   ├── schema.ts    # Drizzle ORM schema
│   └── index.ts     # DB client
├── auth.ts          # NextAuth config
├── queries.ts       # Server queries (React.cache)
├── actions.ts       # Server actions
├── validations.ts   # Zod schemas
└── utils.ts         # Utility functions

scripts/
└── setup-db.sql     # SQL inicial para PostgreSQL
```

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Añade las variables de entorno en la configuración del proyecto
3. Deploy automático en cada push a `main`

## Módulos

- **Dashboard**: Estadísticas generales, pacientes recientes, acciones rápidas
- **Pacientes**: CRUD completo con búsqueda, paginación y modales
- **Agenda**: Calendario mensual/semanal/diario con react-big-calendar, drag & drop de citas
- **Historia Médica**: Entradas clínicas estructuradas por secciones (anamnesis, tratamiento, evolución)
- **Configuración**: Gestión de staff y tipos de tratamiento
