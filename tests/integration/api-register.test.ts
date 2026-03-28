import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([
      { id: "new-user-001", email: "nuevo@clinica.com", name: "Nuevo Usuario" },
    ]),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_mock"),
  },
}));

import { db } from "@/lib/db";
import { POST } from "@/app/api/auth/register/route";

const mockDb = vi.mocked(db);

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "new-user-001", email: "nuevo@clinica.com", name: "Nuevo Usuario" },
        ]),
      }),
    });
  });

  it("retorna 400 si el body no cumple la validación", async () => {
    const req = buildRequest({ email: "no-es-email", password: "123" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Datos inválidos");
    expect(body.details).toBeDefined();
  });

  it("retorna 400 si falta el nombre", async () => {
    const req = buildRequest({
      email: "test@clinica.com",
      password: "Segura1234",
      confirmPassword: "Segura1234",
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it("retorna 400 si las contraseñas no coinciden", async () => {
    const req = buildRequest({
      name: "Test User",
      email: "test@clinica.com",
      password: "Segura1234",
      confirmPassword: "Diferente999",
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it("retorna 409 si el email ya está registrado", async () => {
    (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "existing-user" }]),
        }),
      }),
    });

    const req = buildRequest({
      name: "Test User",
      email: "existente@clinica.com",
      password: "Segura1234",
      confirmPassword: "Segura1234",
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/email/i);
  });

  it("retorna 201 con el usuario creado para datos válidos", async () => {
    const req = buildRequest({
      name: "Nuevo Usuario",
      email: "nuevo@clinica.com",
      password: "Segura1234",
      confirmPassword: "Segura1234",
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("nuevo@clinica.com");
  });

  it("retorna 500 para errores internos del servidor", async () => {
    (mockDb.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("DB connection failed");
    });

    const req = buildRequest({
      name: "Test User",
      email: "test@clinica.com",
      password: "Segura1234",
      confirmPassword: "Segura1234",
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Error interno del servidor");
  });
});
