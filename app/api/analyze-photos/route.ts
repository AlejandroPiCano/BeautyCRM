import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      const code = (err as { cause?: { code?: string } })?.cause?.code;
      if (code !== "UND_ERR_CONNECT_TIMEOUT") throw err; // otro error → no reintentar
      if (attempt < maxAttempts) {
        console.warn(`OpenAI connect timeout, reintento ${attempt}/${maxAttempts - 1}…`);
      }
    }
  }
  throw lastErr;
}

const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, minutesLeft: Math.ceil((entry.resetAt - now) / 60_000) };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurado en el archivo .env" },
      { status: 500 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Límite de análisis alcanzado (${RATE_LIMIT} por hora). Podrás hacer más análisis en ${limit.minutesLeft} min.` },
      { status: 429 }
    );
  }

  try {
    const { beforeImage, afterImage, treatment } = await req.json();

    if (!beforeImage || !afterImage) {
      return NextResponse.json(
        { error: "Se requieren las dos imágenes (antes y después)" },
        { status: 400 }
      );
    }

    const prompt = `Eres un especialista en estética y tratamientos de belleza. Se te proporcionan dos fotografías de un paciente: la PRIMERA imagen es el ANTES del tratamiento y la SEGUNDA imagen es el DESPUÉS.${treatment ? ` El tratamiento aplicado fue: ${treatment}.` : ""}

Analiza visualmente ambas imágenes y responde ÚNICAMENTE con un objeto JSON válido con este formato exacto (sin texto adicional ni bloques de código markdown):
{
  "observaciones": "Descripción clínica detallada de los cambios visibles entre el antes y el después",
  "score": 85,
  "recomendaciones": "Recomendaciones para la próxima sesión o mantenimiento",
  "resumen": "Resumen ejecutivo en 1-2 frases del resultado del tratamiento"
}

El campo "score" es un número entero del 0 al 100 que representa la efectividad visible del tratamiento (100 = resultado óptimo claramente visible, 0 = sin cambios apreciables). Sé objetivo y clínico.`;

    const model = process.env.OPENAI_VISION_MODEL ?? DEFAULT_MODEL;

    const openaiRes = await fetchWithRetry(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: beforeImage } },
              { type: "image_url", image_url: { url: afterImage } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI vision error:", openaiRes.status, errText);
      let message = "Error del modelo de visión";
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        message = parsed.error?.message ?? message;
      } catch { /* keep default */ }
      return NextResponse.json(
        { error: `${message} (HTTP ${openaiRes.status})` },
        { status: 502 }
      );
    }

    const data = await openaiRes.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Unexpected OpenAI response:", content);
      return NextResponse.json(
        { error: "El modelo no devolvió un análisis estructurado válido", raw: content },
        { status: 422 }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]) as {
      observaciones: string;
      score: number;
      recomendaciones: string;
      resumen: string;
    };

    analysis.score = Math.min(100, Math.max(0, Number(analysis.score) || 0));

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("analyze-photos route error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
