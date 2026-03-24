import { cache } from "react";
import { db } from "@/lib/db";
import {
  pacientes,
  citas,
  historias,
  users,
  tiposTratamiento,
  historiaFotos,
} from "@/lib/db/schema";
import { eq, desc, count, gte, lte, and, ilike, or } from "drizzle-orm";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = cache(async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [totalPacientes, citasHoy, citasSemana, pacientesRecientes] =
    await Promise.all([
      db.select({ count: count() }).from(pacientes).where(eq(pacientes.activo, true)),
      db
        .select({ count: count() })
        .from(citas)
        .where(and(gte(citas.fecha, todayStart), lte(citas.fecha, todayEnd))),
      db
        .select({ count: count() })
        .from(citas)
        .where(and(gte(citas.fecha, weekStart), lte(citas.fecha, weekEnd))),
      db
        .select({
          id: pacientes.id,
          nombre: pacientes.nombre,
          email: pacientes.email,
          origen: pacientes.origen,
          createdAt: pacientes.createdAt,
          avatarUrl: pacientes.avatarUrl,
        })
        .from(pacientes)
        .where(eq(pacientes.activo, true))
        .orderBy(desc(pacientes.createdAt))
        .limit(5),
    ]);

  return {
    totalPacientes: totalPacientes[0]?.count ?? 0,
    citasHoy: citasHoy[0]?.count ?? 0,
    citasSemana: citasSemana[0]?.count ?? 0,
    pacientesRecientes,
  };
});

// ─── Pacientes ────────────────────────────────────────────────────────────────
export const getPacientes = cache(
  async (search?: string, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(pacientes.nombre, `%${search}%`),
          ilike(pacientes.email, `%${search}%`),
          ilike(pacientes.telefono, `%${search}%`)
        )
      : eq(pacientes.activo, true);

    const [data, total] = await Promise.all([
      db
        .select()
        .from(pacientes)
        .where(whereClause)
        .orderBy(desc(pacientes.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(pacientes).where(whereClause),
    ]);

    return {
      data,
      total: total[0]?.count ?? 0,
      pages: Math.ceil((total[0]?.count ?? 0) / limit),
    };
  }
);

// English alias
export const getPatients = getPacientes;

export const getPacienteById = cache(async (id: string) => {
  const [paciente] = await db
    .select()
    .from(pacientes)
    .where(eq(pacientes.id, id))
    .limit(1);
  return paciente ?? null;
});

// English alias
export const getPatientById = getPacienteById;

export const getPacienteWithHistory = cache(async (id: string) => {
  const [paciente, pacienteCitas, pacienteHistorias] = await Promise.all([
    db
      .select()
      .from(pacientes)
      .where(eq(pacientes.id, id))
      .limit(1),
    db
      .select({
        id: citas.id,
        fecha: citas.fecha,
        duracionMin: citas.duracionMin,
        tipo: citas.tipo,
        status: citas.status,
        notas: citas.notas,
        staffNombre: users.name,
      })
      .from(citas)
      .leftJoin(users, eq(citas.staffId, users.id))
      .where(eq(citas.pacienteId, id))
      .orderBy(desc(citas.fecha)),
    db
      .select()
      .from(historias)
      .where(eq(historias.pacienteId, id))
      .orderBy(desc(historias.fecha)),
  ]);

  return {
    paciente: paciente[0] ?? null,
    citas: pacienteCitas,
    historias: pacienteHistorias,
  };
});

// English alias
export const getPatientWithHistory = getPacienteWithHistory;

// ─── Citas ────────────────────────────────────────────────────────────────────
export const getCitasForCalendar = cache(
  async (start: Date, end: Date, staffId?: string) => {
    const filters = staffId
      ? and(
          gte(citas.fecha, start),
          lte(citas.fecha, end),
          eq(citas.staffId, staffId)
        )
      : and(gte(citas.fecha, start), lte(citas.fecha, end));

    return db
      .select({
        id: citas.id,
        fecha: citas.fecha,
        duracionMin: citas.duracionMin,
        tipo: citas.tipo,
        status: citas.status,
        notas: citas.notas,
        pacienteNombre: pacientes.nombre,
        pacienteId: pacientes.id,
        staffNombre: users.name,
        staffId: citas.staffId,
        tipoTratamientoNombre: tiposTratamiento.nombre,
        tipoTratamientoColor: tiposTratamiento.color,
      })
      .from(citas)
      .innerJoin(pacientes, eq(citas.pacienteId, pacientes.id))
      .leftJoin(users, eq(citas.staffId, users.id))
      .leftJoin(
        tiposTratamiento,
        eq(citas.tipoTratamientoId, tiposTratamiento.id)
      )
      .where(filters)
      .orderBy(citas.fecha);
  }
);

// English alias
export const getAppointmentsForCalendar = getCitasForCalendar;

// ─── Historias ────────────────────────────────────────────────────────────────
export const getHistoriasByPaciente = cache(async (pacienteId: string) => {
  const [historiasData, fotosData] = await Promise.all([
    db
      .select()
      .from(historias)
      .where(eq(historias.pacienteId, pacienteId))
      .orderBy(desc(historias.fecha)),
    db
      .select()
      .from(historiaFotos)
      .where(eq(historiaFotos.pacienteId, pacienteId))
      .orderBy(desc(historiaFotos.createdAt)),
  ]);

  return { historias: historiasData, fotos: fotosData };
});

// English alias
export const getMedicalRecordsByPatient = getHistoriasByPaciente;

// ─── Staff ────────────────────────────────────────────────────────────────────
export const getStaffList = cache(async () => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      rol: users.rol,
      image: users.image,
      activo: users.activo,
    })
    .from(users)
    .where(eq(users.activo, true))
    .orderBy(users.name);
});

// ─── Tipos Tratamiento ────────────────────────────────────────────────────────
export const getTiposTratamiento = cache(async () => {
  return db
    .select()
    .from(tiposTratamiento)
    .where(eq(tiposTratamiento.activo, true))
    .orderBy(tiposTratamiento.nombre);
});

// English alias
export const getTreatmentTypes = getTiposTratamiento;
