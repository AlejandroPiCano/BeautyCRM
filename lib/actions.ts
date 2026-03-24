"use server";

import { db } from "@/lib/db";
import {
  pacientes,
  citas,
  historias,
  users,
  tiposTratamiento,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  pacienteSchema,
  citaSchema,
  historiaSchema,
  tipoTratamientoSchema,
  staffSchema,
} from "@/lib/validations";

// ─── Pacientes ────────────────────────────────────────────────────────────────
export async function createPaciente(formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = pacienteSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { nombre, email, telefono, fechaNacimiento, origen, avatarUrl, notas } =
    parsed.data;

  const [newPaciente] = await db
    .insert(pacientes)
    .values({
      nombre,
      email: email || null,
      telefono: telefono || null,
      fechaNacimiento: fechaNacimiento || null,
      origen,
      avatarUrl: avatarUrl || null,
      notas: notas || null,
      createdBy: session.user?.id ?? null,
    })
    .returning();

  revalidatePath("/patients");
  return { data: newPaciente };
}

// English alias
export const createPatient = createPaciente;

export async function updatePaciente(id: string, formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = pacienteSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(pacientes)
    .set({
      ...parsed.data,
      email: parsed.data.email || null,
      avatarUrl: parsed.data.avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(pacientes.id, id))
    .returning();

  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  return { data: updated };
}

// English alias
export const updatePatient = updatePaciente;

export async function deletePaciente(id: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  await db
    .update(pacientes)
    .set({ activo: false, updatedAt: new Date() })
    .where(eq(pacientes.id, id));

  revalidatePath("/patients");
  return { success: true };
}

// English alias
export const deletePatient = deletePaciente;

// ─── Citas ────────────────────────────────────────────────────────────────────
export async function createCita(formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = citaSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [newCita] = await db
    .insert(citas)
    .values({
      ...parsed.data,
      fecha: new Date(parsed.data.fecha),
      staffId: parsed.data.staffId ?? null,
      tipoTratamientoId: parsed.data.tipoTratamientoId ?? null,
    })
    .returning();

  revalidatePath("/schedule");
  return { data: newCita };
}

// English alias
export const createAppointment = createCita;

export async function updateCita(id: string, formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = citaSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(citas)
    .set({
      ...parsed.data,
      fecha: new Date(parsed.data.fecha),
      staffId: parsed.data.staffId ?? null,
      tipoTratamientoId: parsed.data.tipoTratamientoId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(citas.id, id))
    .returning();

  revalidatePath("/schedule");
  return { data: updated };
}

// English alias
export const updateAppointment = updateCita;

export async function updateCitaStatus(
  id: string,
  status: "pendiente" | "confirmada" | "cancelada" | "completada"
) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  await db
    .update(citas)
    .set({ status, updatedAt: new Date() })
    .where(eq(citas.id, id));

  revalidatePath("/schedule");
  return { success: true };
}

// English alias
export const updateAppointmentStatus = updateCitaStatus;

export async function deleteCita(id: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  await db.delete(citas).where(eq(citas.id, id));
  revalidatePath("/schedule");
  return { success: true };
}

// English alias
export const deleteAppointment = deleteCita;

// ─── Historias ────────────────────────────────────────────────────────────────
export async function createHistoria(formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = historiaSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [newHistoria] = await db
    .insert(historias)
    .values({
      ...parsed.data,
      creadoPor: session.user?.id ?? null,
    })
    .returning();

  revalidatePath(`/patients/${parsed.data.pacienteId}/medical-records`);
  return { data: newHistoria };
}

// English alias
export const createMedicalRecord = createHistoria;

export async function updateHistoria(id: string, formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = historiaSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(historias)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(historias.id, id))
    .returning();

  revalidatePath(`/patients/${parsed.data.pacienteId}/medical-records`);
  return { data: updated };
}

// English alias
export const updateMedicalRecord = updateHistoria;

// ─── Tipos Tratamiento ────────────────────────────────────────────────────────
export async function createTipoTratamiento(formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = tipoTratamientoSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [newTipo] = await db
    .insert(tiposTratamiento)
    .values(parsed.data)
    .returning();

  revalidatePath("/settings");
  return { data: newTipo };
}

// English alias
export const createTreatmentType = createTipoTratamiento;

export async function updateTipoTratamiento(id: string, formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = tipoTratamientoSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(tiposTratamiento)
    .set(parsed.data)
    .where(eq(tiposTratamiento.id, id))
    .returning();

  revalidatePath("/settings");
  return { data: updated };
}

// English alias
export const updateTreatmentType = updateTipoTratamiento;

// ─── Staff / Users ────────────────────────────────────────────────────────────
export async function createStaffUser(formData: unknown) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const parsed = staffSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, email, rol, password } = parsed.data;
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const [newUser] = await db
    .insert(users)
    .values({ name, email, rol, passwordHash })
    .returning();

  revalidatePath("/settings");
  return { data: newUser };
}

// English alias
export const createStaffMember = createStaffUser;

export async function toggleStaffActivo(id: string, activo: boolean) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  await db
    .update(users)
    .set({ activo, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/settings");
  return { success: true };
}

// English alias
export const toggleStaffActive = toggleStaffActivo;
