import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// ─── Pacientes ────────────────────────────────────────────────────────────────
export const origenValues = [
  "web",
  "redes_sociales",
  "google",
  "conocido",
  "otro",
] as const;

// English alias
export const sourceValues = origenValues;

export const pacienteSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  origen: z.enum(origenValues).default("otro"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  notas: z.string().optional(),
});

// English alias
export const patientSchema = pacienteSchema;

export type PacienteFormData = z.infer<typeof pacienteSchema>;
// English alias
export type PatientFormData = PacienteFormData;

// ─── Citas ────────────────────────────────────────────────────────────────────
export const citaStatusValues = [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
] as const;

// English aliases
export const appointmentStatusValues = citaStatusValues;

export const citaTipoValues = [
  "consulta",
  "tratamiento",
  "revision",
  "otro",
] as const;

// English alias
export const appointmentTypeValues = citaTipoValues;

export const citaSchema = z.object({
  pacienteId: z.string().uuid("Paciente requerido"),
  staffId: z.string().uuid().optional(),
  tipoTratamientoId: z.string().uuid().optional(),
  fecha: z.string().min(1, "Fecha requerida"),
  hora: z.string().min(1, "Hora requerida"),
  duracionMin: z.number().int().min(15).max(480).default(60),
  tipo: z.enum(citaTipoValues).default("consulta"),
  status: z.enum(citaStatusValues).default("pendiente"),
  notas: z.string().optional(),
});

// English alias
export const appointmentSchema = citaSchema;

export type CitaFormData = z.infer<typeof citaSchema>;
// English alias
export type AppointmentFormData = CitaFormData;

// ─── Historia Clínica ─────────────────────────────────────────────────────────
export const historiaSchema = z.object({
  pacienteId: z.string().uuid(),
  fecha: z.string().min(1, "Fecha requerida"),
  seccion: z.object({
    anamnesis: z
      .object({
        motivoConsulta: z.string().optional(),
        antecedentes: z.string().optional(),
        alergias: z.string().optional(),
        medicamentos: z.string().optional(),
        embarazo: z.boolean().optional(),
      })
      .optional(),
    tratamiento: z
      .object({
        tipo: z.string().optional(),
        zona: z.string().optional(),
        tecnica: z.string().optional(),
        productosUsados: z.string().optional(),
        parametros: z.string().optional(),
        resultado: z.string().optional(),
      })
      .optional(),
    evolucion: z
      .object({
        observaciones: z.string().optional(),
        recomendaciones: z.string().optional(),
        proximaCita: z.string().optional(),
      })
      .optional(),
  }),
  notas: z.string().optional(),
});

// English alias
export const medicalRecordSchema = historiaSchema;

export type HistoriaFormData = z.infer<typeof historiaSchema>;
// English alias
export type MedicalRecordFormData = HistoriaFormData;

// ─── Tipo Tratamiento ─────────────────────────────────────────────────────────
export const tipoTratamientoSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  descripcion: z.string().optional(),
  duracionMin: z.number().int().min(15).max(480).default(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido"),
});

// English alias
export const treatmentTypeSchema = tipoTratamientoSchema;

export type TipoTratamientoFormData = z.infer<typeof tipoTratamientoSchema>;
// English alias
export type TreatmentTypeFormData = TipoTratamientoFormData;

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staffRolValues = [
  "admin",
  "medico",
  "esteticista",
  "recepcion",
] as const;

// English alias
export const staffRoleValues = staffRolValues;

export const staffSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  rol: z.enum(staffRolValues).default("recepcion"),
  password: z.string().min(8, "Mínimo 8 caracteres").optional(),
});

export type StaffFormData = z.infer<typeof staffSchema>;
