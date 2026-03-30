import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pacientes, citas } from "@/lib/db/schema";
import { eq, gte, lte, and, count } from "drizzle-orm";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY no está configurado en el archivo .env" },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const next7End = endOfDay(addDays(now, 6));

    const [totalPacientes, citasHoy, citasProximas] = await Promise.all([
      db.select({ count: count() }).from(pacientes).where(eq(pacientes.activo, true)),
      db
        .select({
          fecha: citas.fecha,
          tipo: citas.tipo,
          status: citas.status,
          duracionMin: citas.duracionMin,
          pacienteNombre: pacientes.nombre,
        })
        .from(citas)
        .innerJoin(pacientes, eq(citas.pacienteId, pacientes.id))
        .where(and(gte(citas.fecha, todayStart), lte(citas.fecha, todayEnd)))
        .orderBy(citas.fecha),
      db
        .select({ fecha: citas.fecha, status: citas.status, duracionMin: citas.duracionMin })
        .from(citas)
        .where(and(gte(citas.fecha, todayStart), lte(citas.fecha, next7End)))
        .orderBy(citas.fecha),
    ]);

    // Build per-day summary for next 7 days
    const citasPorDia: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = addDays(now, i);
      citasPorDia[format(d, "yyyy-MM-dd")] = 0;
    }
    for (const c of citasProximas) {
      const key = format(new Date(c.fecha), "yyyy-MM-dd");
      if (key in citasPorDia) citasPorDia[key] = (citasPorDia[key] ?? 0) + 1;
    }

    const diasLibres = Object.entries(citasPorDia)
      .filter(([, n]) => n === 0)
      .map(([f]) => {
        const d = new Date(f);
        return `${DIAS[d.getDay()]} ${format(d, "d 'de' MMMM", { locale: es })}`;
      });

    const diasConCitas = Object.entries(citasPorDia)
      .filter(([, n]) => n > 0)
      .map(([f, n]) => {
        const d = new Date(f);
        return `${DIAS[d.getDay()]} ${format(d, "d 'de' MMMM", { locale: es })}: ${n} cita(s)`;
      });

    const fechaActual = format(now, "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es });

    const systemPrompt = `Eres un asistente inteligente para una clínica de estética llamada AesthAI. Tienes acceso a los datos en tiempo real de la clínica y ayudas al personal con preguntas sobre pacientes, citas y agenda.

DATOS EN TIEMPO REAL (${fechaActual}):

PACIENTES:
- Total de pacientes activos: ${totalPacientes[0]?.count ?? 0}

CITAS DE HOY (${DIAS[now.getDay()]} ${format(now, "d 'de' MMMM", { locale: es })}):
- Total citas hoy: ${citasHoy.length}
${
  citasHoy.length > 0
    ? citasHoy
        .map(
          (c) =>
            `  • ${format(new Date(c.fecha), "HH:mm")} — ${c.pacienteNombre} (${c.tipo}, estado: ${c.status}, ${c.duracionMin}min)`
        )
        .join("\n")
    : "  (Sin citas programadas para hoy)"
}

PRÓXIMOS 7 DÍAS:
Días con citas:
${diasConCitas.length > 0 ? diasConCitas.map((d) => `  • ${d}`).join("\n") : "  Ningún día tiene citas"}
Días libres (sin ninguna cita):
${diasLibres.length > 0 ? diasLibres.map((d) => `  • ${d}`).join("\n") : "  Todos los días tienen al menos una cita"}

INSTRUCCIONES:
- Responde siempre en español, de forma concisa y directa.
- Usa los datos anteriores para responder preguntas sobre citas, disponibilidad y pacientes.
- Si te preguntan algo que no puedes saber con estos datos, indícalo claramente.
- No inventes datos que no estén en el contexto.`;

    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.AUTH_URL ?? "http://localhost:3000",
        "X-Title": "EstéticaCRM",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!openrouterRes.ok) {
      const errText = await openrouterRes.text();
      console.error("OpenRouter HTTP status:", openrouterRes.status);
      console.error("OpenRouter error body:", errText);
      let message = "Error al conectar con OpenRouter";
      try {
        const parsed = JSON.parse(errText);
        message = parsed?.error?.message ?? parsed?.error ?? message;
        console.error("Parsed error:", message);
      } catch { /* keep default */ }
      return NextResponse.json({ error: `${message} (HTTP ${openrouterRes.status})` }, { status: 502 });
    }

    return new Response(openrouterRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
