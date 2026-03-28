import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  pacienteSchema,
  citaSchema,
  historiaSchema,
  tipoTratamientoSchema,
  staffSchema,
} from "@/lib/validations";

// ─── loginSchema ──────────────────────────────────────────────────────────────
describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const result = loginSchema.safeParse({
      email: "admin@estetica.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const result = loginSchema.safeParse({
      email: "no-es-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("rechaza contraseña menor de 6 caracteres", () => {
    const result = loginSchema.safeParse({
      email: "admin@estetica.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });
});

// ─── registerSchema ───────────────────────────────────────────────────────────
describe("registerSchema", () => {
  const validData = {
    name: "María López",
    email: "maria@clinica.com",
    password: "Segura1234",
    confirmPassword: "Segura1234",
  };

  it("acepta datos de registro válidos", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Diferente999",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.confirmPassword).toBeDefined();
  });

  it("rechaza nombre menor de 2 caracteres", () => {
    const result = registerSchema.safeParse({ ...validData, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rechaza contraseña menor de 8 caracteres", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "abc123",
      confirmPassword: "abc123",
    });
    expect(result.success).toBe(false);
  });
});

// ─── pacienteSchema ───────────────────────────────────────────────────────────
describe("pacienteSchema", () => {
  it("acepta un paciente mínimo válido", () => {
    const result = pacienteSchema.safeParse({ nombre: "Ana García" });
    expect(result.success).toBe(true);
    expect(result.data?.origen).toBe("otro");
  });

  it("acepta teléfono español móvil válido", () => {
    const result = pacienteSchema.safeParse({
      nombre: "Ana García",
      telefono: "612345678",
    });
    expect(result.success).toBe(true);
  });

  it("acepta teléfono español con prefijo +34", () => {
    const result = pacienteSchema.safeParse({
      nombre: "Ana García",
      telefono: "+34612345678",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza teléfono inválido", () => {
    const result = pacienteSchema.safeParse({
      nombre: "Ana García",
      telefono: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const result = pacienteSchema.safeParse({
      nombre: "Ana García",
      email: "no-email",
    });
    expect(result.success).toBe(false);
  });

  it("acepta email vacío (campo opcional)", () => {
    const result = pacienteSchema.safeParse({
      nombre: "Ana García",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("acepta todos los orígenes válidos", () => {
    const origenes = ["web", "redes_sociales", "google", "conocido", "otro"] as const;
    for (const origen of origenes) {
      const result = pacienteSchema.safeParse({ nombre: "Test", origen });
      expect(result.success).toBe(true);
    }
  });

  it("rechaza nombre menor de 2 caracteres", () => {
    const result = pacienteSchema.safeParse({ nombre: "A" });
    expect(result.success).toBe(false);
  });
});

// ─── citaSchema ───────────────────────────────────────────────────────────────
describe("citaSchema", () => {
  const validCita = {
    pacienteId: "550e8400-e29b-41d4-a716-446655440000",
    fecha: "2025-06-15",
    hora: "10:00",
    duracionMin: 60,
    tipo: "consulta" as const,
    status: "pendiente" as const,
  };

  it("acepta una cita mínima válida", () => {
    const result = citaSchema.safeParse(validCita);
    expect(result.success).toBe(true);
  });

  it("rechaza UUID de paciente inválido", () => {
    const result = citaSchema.safeParse({ ...validCita, pacienteId: "no-uuid" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.pacienteId).toBeDefined();
  });

  it("rechaza fecha vacía", () => {
    const result = citaSchema.safeParse({ ...validCita, fecha: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza duración menor de 15 minutos", () => {
    const result = citaSchema.safeParse({ ...validCita, duracionMin: 10 });
    expect(result.success).toBe(false);
  });

  it("rechaza duración mayor de 480 minutos", () => {
    const result = citaSchema.safeParse({ ...validCita, duracionMin: 500 });
    expect(result.success).toBe(false);
  });

  it("acepta todos los tipos de cita válidos", () => {
    const tipos = ["consulta", "tratamiento", "revision", "otro"] as const;
    for (const tipo of tipos) {
      const result = citaSchema.safeParse({ ...validCita, tipo });
      expect(result.success).toBe(true);
    }
  });

  it("acepta todos los estados válidos", () => {
    const statuses = ["pendiente", "confirmada", "cancelada", "completada"] as const;
    for (const status of statuses) {
      const result = citaSchema.safeParse({ ...validCita, status });
      expect(result.success).toBe(true);
    }
  });

  it("acepta staffId UUID válido opcional", () => {
    const result = citaSchema.safeParse({
      ...validCita,
      staffId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });
});

// ─── historiaSchema ───────────────────────────────────────────────────────────
describe("historiaSchema", () => {
  const validHistoria = {
    pacienteId: "550e8400-e29b-41d4-a716-446655440000",
    fecha: "2025-06-15",
    seccion: {
      anamnesis: { motivoConsulta: "Consulta general" },
      tratamiento: { tipo: "Facial" },
    },
  };

  it("acepta una historia válida con sección parcial", () => {
    const result = historiaSchema.safeParse(validHistoria);
    expect(result.success).toBe(true);
  });

  it("acepta historia sin sección (objeto vacío)", () => {
    const result = historiaSchema.safeParse({
      pacienteId: "550e8400-e29b-41d4-a716-446655440000",
      fecha: "2025-06-15",
      seccion: {},
    });
    expect(result.success).toBe(true);
  });

  it("rechaza pacienteId inválido", () => {
    const result = historiaSchema.safeParse({ ...validHistoria, pacienteId: "no-uuid" });
    expect(result.success).toBe(false);
  });

  it("rechaza fecha vacía", () => {
    const result = historiaSchema.safeParse({ ...validHistoria, fecha: "" });
    expect(result.success).toBe(false);
  });
});

// ─── tipoTratamientoSchema ────────────────────────────────────────────────────
describe("tipoTratamientoSchema", () => {
  it("acepta tratamiento válido", () => {
    const result = tipoTratamientoSchema.safeParse({
      nombre: "Botox",
      duracionMin: 45,
      color: "#ff5733",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza color hex inválido", () => {
    const result = tipoTratamientoSchema.safeParse({
      nombre: "Botox",
      duracionMin: 45,
      color: "rojo",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.color).toBeDefined();
  });

  it("rechaza color hex de 3 dígitos (debe ser de 6)", () => {
    const result = tipoTratamientoSchema.safeParse({
      nombre: "Botox",
      duracionMin: 45,
      color: "#fff",
    });
    expect(result.success).toBe(false);
  });

  it("acepta color hex en mayúsculas", () => {
    const result = tipoTratamientoSchema.safeParse({
      nombre: "Botox",
      duracionMin: 45,
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre menor de 2 caracteres", () => {
    const result = tipoTratamientoSchema.safeParse({
      nombre: "A",
      duracionMin: 60,
      color: "#3b82f6",
    });
    expect(result.success).toBe(false);
  });
});

// ─── staffSchema ──────────────────────────────────────────────────────────────
describe("staffSchema", () => {
  it("acepta staff válido sin contraseña", () => {
    const result = staffSchema.safeParse({
      name: "Dr. Ramírez",
      email: "dr.ramirez@clinica.com",
      rol: "medico",
    });
    expect(result.success).toBe(true);
  });

  it("acepta staff con contraseña válida", () => {
    const result = staffSchema.safeParse({
      name: "Laura Gómez",
      email: "laura@clinica.com",
      rol: "esteticista",
      password: "Segura1234",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza contraseña menor de 8 caracteres", () => {
    const result = staffSchema.safeParse({
      name: "Laura Gómez",
      email: "laura@clinica.com",
      rol: "esteticista",
      password: "corta",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const result = staffSchema.safeParse({
      name: "Test",
      email: "no-email",
      rol: "recepcion",
    });
    expect(result.success).toBe(false);
  });

  it("acepta todos los roles válidos", () => {
    const roles = ["admin", "medico", "esteticista", "recepcion"] as const;
    for (const rol of roles) {
      const result = staffSchema.safeParse({
        name: "Test User",
        email: "test@clinica.com",
        rol,
      });
      expect(result.success).toBe(true);
    }
  });
});
