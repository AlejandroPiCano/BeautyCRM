import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAppointmentsForCalendar } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start y end son requeridos" }, { status: 400 });
  }

  const appointments = await getAppointmentsForCalendar(new Date(start), new Date(end));
  return NextResponse.json(appointments);
}
