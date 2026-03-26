import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { citas, pacientes, users, tiposTratamiento } from "@/lib/db/schema";
import { and, gte, lt, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Simple API key authentication for n8n
  const apiKey = req.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate date range for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Get tomorrow's appointments that are not cancelled
    const appointmentsTomorrow = await db
      .select({
        id: citas.id,
        fecha: citas.fecha,
        duracionMin: citas.duracionMin,
        tipo: citas.tipo,
        status: citas.status,
        notas: citas.notas,
        paciente: {
          id: pacientes.id,
          nombre: pacientes.nombre,
          email: pacientes.email,
          telefono: pacientes.telefono,
        },
        staff: {
          id: users.id,
          nombre: users.name,
          email: users.email,
        },
        tipoTratamiento: {
          id: tiposTratamiento.id,
          nombre: tiposTratamiento.nombre,
          duracionMin: tiposTratamiento.duracionMin,
          color: tiposTratamiento.color,
        },
      })
      .from(citas)
      .leftJoin(pacientes, eq(citas.pacienteId, pacientes.id))
      .leftJoin(users, eq(citas.staffId, users.id))
      .leftJoin(tiposTratamiento, eq(citas.tipoTratamientoId, tiposTratamiento.id))
      .where(
        and(
          gte(citas.fecha, tomorrow),
          lt(citas.fecha, dayAfterTomorrow),
          eq(citas.status, "confirmada")
        )
      );

    // Filter only those with email
    const appointmentsWithEmail = appointmentsTomorrow.filter(
      (apt) => apt.paciente?.email
    );

    // Format response
    const formattedAppointments = appointmentsWithEmail.map((apt) => ({
      citaId: apt.id,
      fecha: apt.fecha.toISOString(),
      duracionMin: apt.duracionMin,
      tipo: apt.tipo,
      status: apt.status,
      notas: apt.notas,
      paciente: {
        id: apt.paciente!.id,
        nombre: apt.paciente!.nombre,
        email: apt.paciente!.email,
        telefono: apt.paciente!.telefono,
      },
      staff: apt.staff
        ? {
            id: apt.staff.id,
            nombre: apt.staff.nombre,
            email: apt.staff.email,
          }
        : null,
      tipoTratamiento: apt.tipoTratamiento
        ? {
            id: apt.tipoTratamiento.id,
            nombre: apt.tipoTratamiento.nombre,
            duracionMin: apt.tipoTratamiento.duracionMin,
            color: apt.tipoTratamiento.color,
          }
        : null,
    }));

    return NextResponse.json({
      count: formattedAppointments.length,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("[API] Error getting tomorrow's appointments:", error);
    return NextResponse.json(
      { error: "Error getting appointments" },
      { status: 500 }
    );
  }
}
