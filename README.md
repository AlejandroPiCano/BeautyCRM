# EstéticaCRM

Sistema de gestión integral para clínicas de estética con automatización inteligente y asistente IA en tiempo real.

## Características principales

### 🤖 Asistente IA integrado (OpenRouter)
Chatbot conversacional en el dashboard que responde preguntas sobre tu negocio en tiempo real:
- "¿Cuántos pacientes tengo hoy?"
- "¿Qué días de la semana tengo disponibilidad?"
- "¿Cuál es el estado de las citas de esta semana?"

El asistente consulta directamente la base de datos y proporciona respuestas contextualizadas basadas en datos actuales de pacientes, citas y disponibilidad. Compatible con múltiples modelos de IA (Gemini, GPT-4, Claude, Llama, Mistral) a través de OpenRouter.

### 📧 Automatización de notificaciones (n8n)
Integración con n8n para workflows automáticos:
- **Recordatorios de citas**: Envío automático de emails 24h antes de cada cita
- **Confirmación de nuevas citas**: Notificación instantánea al paciente tras agendar
- **Webhooks personalizables**: Arquitectura extensible para añadir más automatizaciones (SMS, WhatsApp, etc.)

### 📊 Gestión completa de clínica
- **Dashboard inteligente**: Métricas en tiempo real, pacientes recientes y acciones rápidas
- **Gestión de pacientes**: CRUD completo con búsqueda, historial de citas y fichas médicas
- **Agenda visual**: Calendario interactivo con vistas mensual/semanal/diaria
- **Historias clínicas**: Registro estructurado de tratamientos, evolución y fotografías
- **Multi-usuario**: Sistema de roles (admin, médico, esteticista, recepción)

## Stack tecnológico

- **Framework**: Next.js 15 (App Router, React Server Components, Turbopack)
- **UI**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Autenticación**: NextAuth v5 (Credentials + OAuth)
- **Base de datos**: PostgreSQL + Drizzle ORM (type-safe queries)
- **IA**: OpenRouter API (multi-provider: OpenAI, Anthropic, Google, Meta)
- **Automatización**: n8n (workflow automation, self-hosted)
- **Formularios**: React Hook Form + Zod validation
- **Calendario**: react-big-calendar + date-fns
- **Estado**: TanStack Query + React.cache
- **Notificaciones**: Sonner (toast notifications)

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tu configuración:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://crm_user:tu_password@IP_DE_CUBEPATH:5432/beautycrm

# Autenticación
AUTH_SECRET=genera-con-openssl-rand-base64-32
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=tu-google-client-id       # opcional
AUTH_GOOGLE_SECRET=tu-google-client-secret

# n8n Webhook (automatización)
N8N_WEBHOOK_URL=http://tu-ip-cubepath:5678/webhook/cita-creada
INTERNAL_API_KEY=genera-con-openssl-rand-hex-32

# OpenRouter (Asistente IA)
OPENROUTER_API_KEY=sk-or-v1-tu-clave-desde-openrouter-ai
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free  # o cualquier modelo compatible
```

**Obtener claves:**
- **OpenRouter**: Regístrate en [openrouter.ai](https://openrouter.ai/keys) y genera una API key
- **n8n**: Instala n8n en tu VPS (ver sección de automatización más abajo)

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

### 6. Configurar n8n (opcional pero recomendado)

n8n es la plataforma de automatización que gestiona el envío de emails de recordatorio y confirmación de citas.

**Instalación en tu VPS:**

```bash
# Opción 1: Docker (recomendado)
docker run -d --restart unless-stopped \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Opción 2: npm global
npm install -g n8n
n8n start
```

**Configurar workflow de citas:**

1. Accede a n8n en `http://tu-ip:5678`
2. Crea un nuevo workflow con trigger "Webhook"
3. Configura la URL del webhook: `/webhook/cita-creada`
4. Añade nodos para:
   - Parsear datos de la cita (paciente, fecha, tipo)
   - Enviar email de confirmación inmediata
   - Programar recordatorio 24h antes (usando nodo Schedule)
5. Copia la URL del webhook y añádela a `N8N_WEBHOOK_URL` en tu `.env`

**Endpoints disponibles para n8n:**
- `POST /api/appointments/tomorrow` - Lista de citas del día siguiente (para recordatorios)
- `POST /api/health` - Health check del sistema

> 💡 **Tip**: Puedes extender los workflows para enviar SMS vía Twilio, notificaciones de WhatsApp, o integrar con Google Calendar.

### 7. Iniciar en desarrollo

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

## Arquitectura y decisiones técnicas

### React Server Components + Streaming
- Renderizado híbrido: componentes de servidor para queries pesadas, componentes de cliente para interactividad
- Suspense boundaries para carga progresiva y mejor UX
- React.cache para deduplicación automática de queries

### Type-safety end-to-end
- Drizzle ORM con inferencia de tipos desde el schema de base de datos
- Zod para validación runtime con tipos TypeScript automáticos
- NextAuth con tipos extendidos para sesiones personalizadas

### Optimización de rendimiento
- Turbopack para builds 700% más rápidos en desarrollo
- TanStack Query para cache inteligente en cliente
- Índices estratégicos en PostgreSQL para queries frecuentes
- Lazy loading de componentes pesados (calendario, modales)

### Seguridad
- Autenticación con bcrypt (10 rounds) para passwords
- API keys para proteger webhooks internos
- Validación de entrada en cliente y servidor
- Sanitización de queries con Drizzle (prevención de SQL injection)

### Escalabilidad
- Base de datos auto-hospedada (control total, sin vendor lock-in)
- Arquitectura stateless (compatible con múltiples instancias)
- Webhooks desacoplados (n8n puede escalar independientemente)
- OpenRouter como abstracción multi-provider (cambio de modelo sin refactoring)

## Deploy en producción

### Opción 1: Vercel (recomendado para Next.js)

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Añade todas las variables de entorno (`.env.example` como referencia)
3. Deploy automático en cada push a `main`
4. Configura dominio personalizado y SSL automático

### Opción 2: VPS (control total)

```bash
# En tu VPS
git clone <tu-repo>
cd BeautyCRM
npm install
npm run build

# Usar PM2 para proceso persistente
npm install -g pm2
pm2 start npm --name "beautycrm" -- start
pm2 save
pm2 startup
```

Configura Nginx como reverse proxy y SSL con Let's Encrypt.

## Módulos y funcionalidades

### Dashboard
- **Métricas en tiempo real**: Total pacientes, citas del día, citas de la semana, ocupación
- **Pacientes recientes**: Lista de últimos registros con acceso rápido
- **Acciones rápidas**: Atajos a funciones comunes
- **🤖 Asistente IA**: Chatbot conversacional con acceso a datos en tiempo real
  - Consultas sobre disponibilidad y carga de trabajo
  - Estadísticas instantáneas de pacientes y citas
  - Respuestas contextualizadas basadas en tu negocio

### Pacientes
- CRUD completo con validación de formularios
- Búsqueda en tiempo real (nombre, email, teléfono)
- Paginación server-side
- Historial completo de citas por paciente
- Campos personalizables (origen, notas, avatar)

### Agenda
- Calendario interactivo con vistas mensual/semanal/diaria
- Creación rápida de citas con modal
- Estados: pendiente, confirmada, cancelada, completada
- Asignación de staff y tipos de tratamiento
- **📧 Automatización**: Envío automático de confirmación y recordatorios vía n8n

### Historia Médica
- Registro estructurado por secciones:
  - **Anamnesis**: Motivo de consulta, antecedentes, alergias
  - **Tratamiento**: Técnica, productos, parámetros, resultados
  - **Evolución**: Observaciones, recomendaciones, próxima cita
- Galería de fotografías (antes/después/progreso)
- Timeline cronológico de tratamientos

### Configuración
- Gestión de usuarios y roles (admin, médico, esteticista, recepción)
- Tipos de tratamiento personalizables con colores
- Configuración de duración por defecto de citas

## Capturas de pantalla

### Dashboard con Asistente IA
![Dashboard](./docs/screenshots/dashboard.jpg)
*Vista principal con métricas en tiempo real y chatbot conversacional integrado*

### Gestión de Pacientes
![Pacientes](./docs/screenshots/pacientes.jpg)
*Lista de pacientes con búsqueda y acceso rápido a historiales*

### Calendario de Citas
![Agenda](./docs/screenshots/agenda.jpg)
*Calendario interactivo con vistas múltiples y gestión de citas*

### Historia Clínica
![Historia Clínica](./docs/screenshots/historia_clinica.jpg)
*Registro detallado de tratamientos y evolución del paciente*

### Nueva Cita
![Nueva Cita](./docs/screenshots/nueva_cita.jpg)
*Formulario intuitivo para agendar citas*

### Asistente IA en Acción
![Chatbot](./docs/screenshots/chatbot.jpg)
*Consultas en tiempo real sobre disponibilidad y estadísticas de la clínica*

### Configuración
![Configuración](./docs/screenshots/configuracion.jpg)
*Panel de configuración de la clínica*

## Roadmap

- [ ] Integración con pasarelas de pago (Stripe, PayPal)
- [ ] App móvil con React Native
- [ ] Reportes y analytics avanzados
- [ ] Integración con WhatsApp Business API
- [ ] Sistema de inventario de productos
- [ ] Multi-tenancy para franquicias

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**Desarrollado con Next.js 15, React 19, PostgreSQL, n8n y OpenRouter**
