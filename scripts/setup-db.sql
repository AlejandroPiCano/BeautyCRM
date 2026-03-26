-- ─── EstéticaCRM Database Setup ──────────────────────────────────────────────
-- Run this against your CubePath VPS PostgreSQL database (psql)
-- Drizzle ORM will manage migrations going forward with `npm run db:push`

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE origen_contacto AS ENUM ('web', 'redes_sociales', 'google', 'conocido', 'otro');
CREATE TYPE cita_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');
CREATE TYPE cita_tipo AS ENUM ('consulta', 'tratamiento', 'revision', 'otro');
CREATE TYPE staff_rol AS ENUM ('admin', 'medico', 'esteticista', 'recepcion');

-- ─── NextAuth Tables ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT,
  email          TEXT NOT NULL UNIQUE,
  email_verified TIMESTAMPTZ,
  image          TEXT,
  password_hash  TEXT,
  rol            staff_rol NOT NULL DEFAULT 'recepcion',
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT NOT NULL UNIQUE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ─── Pacientes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT NOT NULL,
  email            TEXT,
  telefono         TEXT,
  fecha_nacimiento DATE,
  origen           origen_contacto NOT NULL DEFAULT 'otro',
  avatar_url       TEXT,
  notas            TEXT,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre);
CREATE INDEX IF NOT EXISTS idx_pacientes_email  ON pacientes(email);

-- ─── Tipos Tratamiento ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_tratamiento (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  duracion_min INTEGER NOT NULL DEFAULT 60,
  color        TEXT NOT NULL DEFAULT '#3b82f6',
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Citas ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id          UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  staff_id             UUID REFERENCES users(id),
  tipo_tratamiento_id  UUID REFERENCES tipos_tratamiento(id),
  fecha                TIMESTAMPTZ NOT NULL,
  duracion_min         INTEGER NOT NULL DEFAULT 60,
  tipo                 cita_tipo NOT NULL DEFAULT 'consulta',
  status               cita_status NOT NULL DEFAULT 'pendiente',
  notas                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_fecha       ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_staff_id    ON citas(staff_id);

-- ─── Historias Clínicas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  seccion     JSONB NOT NULL DEFAULT '{}',
  notas       TEXT,
  creado_por  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historias_paciente_id ON historias(paciente_id);

-- ─── Historia Fotos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historia_fotos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  historia_id UUID NOT NULL REFERENCES historias(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  descripcion TEXT,
  zona        TEXT,
  tipo        TEXT NOT NULL DEFAULT 'antes',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed: admin user ─────────────────────────────────────────────────────────
-- Password: Admin1234! (bcrypt hash) – change immediately
INSERT INTO users (name, email, password_hash, rol)
VALUES (
  'Administrador',
  'admin@esteticacrm.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCBNh/bX6YtC2X.MaBwlEpy',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ─── Seed: tipos de tratamiento ───────────────────────────────────────────────
INSERT INTO tipos_tratamiento (nombre, descripcion, duracion_min, color) VALUES
  ('Consulta inicial',     'Primera visita del paciente',           30,  '#3b82f6'),
  ('Botox',                'Toxina botulínica',                     45,  '#8b5cf6'),
  ('Ácido hialurónico',    'Relleno facial',                        60,  '#ec4899'),
  ('Limpieza facial',      'Limpieza profunda',                     60,  '#10b981'),
  ('Peeling químico',      'Peeling superficial / medio',           45,  '#f59e0b'),
  ('Láser',                'Tratamiento láser',                     60,  '#ef4444'),
  ('Mesoterapia',          'Microinyecciones vitamínicas',          45,  '#06b6d4'),
  ('Revisión',             'Revisión de tratamiento anterior',      20,  '#64748b')
ON CONFLICT DO NOTHING;
