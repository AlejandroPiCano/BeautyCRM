import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  integer,
  pgEnum,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const origenEnum = pgEnum("origen_contacto", [
  "web",
  "redes_sociales",
  "google",
  "conocido",
  "otro",
]);

export const citaStatusEnum = pgEnum("cita_status", [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
]);

export const citaTipoEnum = pgEnum("cita_tipo", [
  "consulta",
  "tratamiento",
  "revision",
  "otro",
]);

export const staffRolEnum = pgEnum("staff_rol", [
  "admin",
  "medico",
  "esteticista",
  "recepcion",
]);

// ─── Users / Staff ────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    passwordHash: text("password_hash"),
    rol: staffRolEnum("rol").default("recepcion").notNull(),
    activo: boolean("activo").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

// NextAuth required tables
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    index("accounts_user_id_idx").on(t.userId),
    uniqueIndex("accounts_provider_account_idx").on(
      t.provider,
      t.providerAccountId
    ),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [uniqueIndex("vt_identifier_token_idx").on(t.identifier, t.token)]
);

// ─── Pacientes ────────────────────────────────────────────────────────────────
export const pacientes = pgTable(
  "pacientes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nombre: text("nombre").notNull(),
    email: text("email"),
    telefono: text("telefono"),
    fechaNacimiento: date("fecha_nacimiento"),
    origen: origenEnum("origen").default("otro").notNull(),
    avatarUrl: text("avatar_url"),
    notas: text("notas"),
    activo: boolean("activo").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("pacientes_nombre_idx").on(t.nombre),
    index("pacientes_email_idx").on(t.email),
    index("pacientes_created_at_idx").on(t.createdAt),
  ]
);

// ─── Tipos Tratamiento ────────────────────────────────────────────────────────
export const tiposTratamiento = pgTable("tipos_tratamiento", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  duracionMin: integer("duracion_min").default(60).notNull(),
  color: text("color").default("#3b82f6").notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Citas ────────────────────────────────────────────────────────────────────
export const citas = pgTable(
  "citas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pacienteId: uuid("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => users.id, {
      onDelete: "set null",
    }),
    tipoTratamientoId: uuid("tipo_tratamiento_id").references(
      () => tiposTratamiento.id,
      { onDelete: "set null" }
    ),
    fecha: timestamp("fecha", { mode: "date" }).notNull(),
    duracionMin: integer("duracion_min").default(60).notNull(),
    tipo: citaTipoEnum("tipo").default("consulta").notNull(),
    status: citaStatusEnum("status").default("pendiente").notNull(),
    notas: text("notas"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("citas_paciente_idx").on(t.pacienteId),
    index("citas_staff_idx").on(t.staffId),
    index("citas_fecha_idx").on(t.fecha),
    index("citas_status_idx").on(t.status),
  ]
);

// ─── Historias Clínicas ───────────────────────────────────────────────────────
export const historias = pgTable(
  "historias",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pacienteId: uuid("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    fecha: date("fecha").notNull(),
    seccion: jsonb("seccion").$type<HistoriaSeccion>().notNull(),
    notas: text("notas"),
    creadoPor: uuid("creado_por").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("historias_paciente_idx").on(t.pacienteId),
    index("historias_fecha_idx").on(t.fecha),
  ]
);

// ─── Historia Fotos ───────────────────────────────────────────────────────────
export const historiaFotos = pgTable(
  "historia_fotos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    historiaId: uuid("historia_id")
      .notNull()
      .references(() => historias.id, { onDelete: "cascade" }),
    pacienteId: uuid("paciente_id")
      .notNull()
      .references(() => pacientes.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    tipo: text("tipo").$type<"before" | "after" | "progreso">().notNull(),
    descripcion: text("descripcion"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("fotos_historia_idx").on(t.historiaId)]
);

// ─── Relations ────────────────────────────────────────────────────────────────
export const pacientesRelations = relations(pacientes, ({ many }) => ({
  citas: many(citas),
  historias: many(historias),
  fotos: many(historiaFotos),
}));

export const citasRelations = relations(citas, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [citas.pacienteId],
    references: [pacientes.id],
  }),
  staff: one(users, { fields: [citas.staffId], references: [users.id] }),
  tipoTratamiento: one(tiposTratamiento, {
    fields: [citas.tipoTratamientoId],
    references: [tiposTratamiento.id],
  }),
}));

export const historiasRelations = relations(historias, ({ one, many }) => ({
  paciente: one(pacientes, {
    fields: [historias.pacienteId],
    references: [pacientes.id],
  }),
  fotos: many(historiaFotos),
}));

export const usersRelations = relations(users, ({ many }) => ({
  citas: many(citas),
  accounts: many(accounts),
  sessions: many(sessions),
}));

// ─── JSONB Type ───────────────────────────────────────────────────────────────
export interface HistoriaSeccion {
  anamnesis?: {
    motivoConsulta?: string;
    antecedentes?: string;
    alergias?: string;
    medicamentos?: string;
    embarazo?: boolean;
  };
  tratamiento?: {
    tipo?: string;
    zona?: string;
    tecnica?: string;
    productosUsados?: string;
    parametros?: string;
    resultado?: string;
  };
  evolucion?: {
    observaciones?: string;
    recomendaciones?: string;
    proximaCita?: string;
  };
}

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Spanish types (original)
export type Paciente = typeof pacientes.$inferSelect;
export type NewPaciente = typeof pacientes.$inferInsert;
export type Cita = typeof citas.$inferSelect;
export type NewCita = typeof citas.$inferInsert;
export type Historia = typeof historias.$inferSelect;
export type NewHistoria = typeof historias.$inferInsert;
export type TipoTratamiento = typeof tiposTratamiento.$inferSelect;
export type HistoriaFoto = typeof historiaFotos.$inferSelect;

// English aliases (for code)
export type Patient = Paciente;
export type NewPatient = NewPaciente;
export type Appointment = Cita;
export type NewAppointment = NewCita;
export type MedicalRecord = Historia;
export type NewMedicalRecord = NewHistoria;
export type TreatmentType = TipoTratamiento;
export type MedicalRecordPhoto = HistoriaFoto;
