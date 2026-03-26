interface WebhookPayload {
  event: "cita_creada" | "cita_actualizada" | "cita_cancelada";
  timestamp: string;
  data: {
    citaId: string;
    fecha: string;
    duracionMin: number;
    tipo: string;
    status: string;
    notas?: string | null;
    paciente: {
      id: string;
      nombre: string;
      email?: string | null;
      telefono?: string | null;
    };
    staff?: {
      id: string;
      nombre: string | null;
      email: string;
    } | null;
    tipoTratamiento?: {
      id: string;
      nombre: string;
      duracionMin: number;
      color: string;
    } | null;
  };
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function sendWebhook(payload: WebhookPayload): Promise<void> {
  if (!N8N_WEBHOOK_URL) {
    console.warn("[Webhook] N8N_WEBHOOK_URL no configurado, omitiendo envío");
    return;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Webhook] Error enviando a n8n: ${response.status} ${response.statusText}`,
        errorText
      );
      return;
    }

    console.log(`[Webhook] Enviado exitosamente: ${payload.event} - cita ${payload.data.citaId}`);
  } catch (error) {
    console.error("[Webhook] Error de red enviando a n8n:", error);
  }
}

export function buildCitaWebhookPayload(
  event: WebhookPayload["event"],
  cita: {
    id: string;
    fecha: Date;
    duracionMin: number;
    tipo: string;
    status: string;
    notas?: string | null;
  },
  paciente: {
    id: string;
    nombre: string;
    email?: string | null;
    telefono?: string | null;
  },
  staff?: {
    id: string;
    name: string | null;
    email: string;
  } | null,
  tipoTratamiento?: {
    id: string;
    nombre: string;
    duracionMin: number;
    color: string;
  } | null
): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data: {
      citaId: cita.id,
      fecha: cita.fecha.toISOString(),
      duracionMin: cita.duracionMin,
      tipo: cita.tipo,
      status: cita.status,
      notas: cita.notas,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        email: paciente.email,
        telefono: paciente.telefono,
      },
      staff: staff
        ? {
            id: staff.id,
            nombre: staff.name,
            email: staff.email,
          }
        : null,
      tipoTratamiento: tipoTratamiento
        ? {
            id: tipoTratamiento.id,
            nombre: tipoTratamiento.nombre,
            duracionMin: tipoTratamiento.duracionMin,
            color: tipoTratamiento.color,
          }
        : null,
    },
  };
}
