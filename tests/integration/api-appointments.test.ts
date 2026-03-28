import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/queries", () => ({
  getAppointmentsForCalendar: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { getAppointmentsForCalendar } from "@/lib/queries";
import { GET } from "@/app/api/appointments/route";

const mockAuth = vi.mocked(auth);
const mockGetAppointments = vi.mocked(getAppointmentsForCalendar);

const mockSession = {
  user: { id: "user-001", email: "admin@clinica.com", name: "Admin" },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockAppointments = [
  {
    id: "cita-001",
    fecha: new Date("2025-06-15T10:00:00Z"),
    duracionMin: 60,
    tipo: "consulta",
    status: "pendiente",
    notas: null,
    pacienteNombre: "Ana García",
    pacienteId: "paciente-001",
    staffNombre: "Dr. López",
    staffId: "staff-001",
    tipoTratamientoNombre: "Botox",
    tipoTratamientoColor: "#ff5733",
  },
];

describe("GET /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesión activa", async () => {
    mockAuth.mockResolvedValue(null as never);

    const req = new NextRequest(
      "http://localhost:3000/api/appointments?start=2025-06-01&end=2025-06-30"
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("No autorizado");
  });

  it("retorna 400 si faltan parámetros start/end", async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const req = new NextRequest("http://localhost:3000/api/appointments");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/start y end/);
  });

  it("retorna 400 si solo se pasa start sin end", async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const req = new NextRequest(
      "http://localhost:3000/api/appointments?start=2025-06-01"
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it("retorna las citas en formato JSON con sesión válida", async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockGetAppointments.mockResolvedValue(mockAppointments as never);

    const req = new NextRequest(
      "http://localhost:3000/api/appointments?start=2025-06-01&end=2025-06-30"
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("cita-001");
  });

  it("llama a getAppointmentsForCalendar con fechas correctas", async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockGetAppointments.mockResolvedValue([] as never);

    const req = new NextRequest(
      "http://localhost:3000/api/appointments?start=2025-06-01T00:00:00Z&end=2025-06-30T23:59:59Z"
    );
    await GET(req);

    expect(mockGetAppointments).toHaveBeenCalledOnce();
    const call = mockGetAppointments.mock.calls[0];
    expect(call).toBeDefined();
    expect(call![0]).toBeInstanceOf(Date);
    expect(call![1]).toBeInstanceOf(Date);
  });

  it("retorna array vacío cuando no hay citas en el rango", async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockGetAppointments.mockResolvedValue([] as never);

    const req = new NextRequest(
      "http://localhost:3000/api/appointments?start=2025-01-01&end=2025-01-02"
    );
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
