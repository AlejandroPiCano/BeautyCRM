import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatDateTime,
  formatTime,
  getOrigenLabel,
  getStatusColor,
  getStatusLabel,
  getRolLabel,
  getInitials,
  calcularEdad,
} from "@/lib/utils";

// ─── cn ───────────────────────────────────────────────────────────────────────
describe("cn", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("descarta valores falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("resuelve conflictos de Tailwind (último gana)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("retorna string vacío sin argumentos", () => {
    expect(cn()).toBe("");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────
describe("formatDate", () => {
  it("retorna '—' para null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formatea una Date correctamente (locale es-ES)", () => {
    const result = formatDate(new Date("2025-01-15"));
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it("formatea un string de fecha", () => {
    const result = formatDate("2025-06-20");
    expect(result).toMatch(/20/);
    expect(result).toMatch(/2025/);
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────
describe("formatDateTime", () => {
  it("retorna '—' para null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("incluye año y hora en el resultado", () => {
    const result = formatDateTime(new Date("2025-06-15T14:30:00"));
    expect(result).toMatch(/2025/);
  });
});

// ─── formatTime ───────────────────────────────────────────────────────────────
describe("formatTime", () => {
  it("retorna '—' para null", () => {
    expect(formatTime(null)).toBe("—");
  });

  it("formatea hora a formato HH:MM", () => {
    const result = formatTime(new Date("2025-06-15T09:05:00"));
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ─── getOrigenLabel ───────────────────────────────────────────────────────────
describe("getOrigenLabel", () => {
  it("retorna etiqueta para 'web'", () => {
    expect(getOrigenLabel("web")).toBe("Web");
  });

  it("retorna etiqueta para 'redes_sociales'", () => {
    expect(getOrigenLabel("redes_sociales")).toBe("Redes Sociales");
  });

  it("retorna etiqueta para 'google'", () => {
    expect(getOrigenLabel("google")).toBe("Google");
  });

  it("retorna etiqueta para 'conocido'", () => {
    expect(getOrigenLabel("conocido")).toBe("Conocido");
  });

  it("retorna etiqueta para 'otro'", () => {
    expect(getOrigenLabel("otro")).toBe("Otro");
  });

  it("retorna el valor original para origen desconocido", () => {
    expect(getOrigenLabel("desconocido")).toBe("desconocido");
  });
});

// ─── getStatusColor ───────────────────────────────────────────────────────────
describe("getStatusColor", () => {
  it("retorna clase para 'pendiente'", () => {
    expect(getStatusColor("pendiente")).toContain("amber");
  });

  it("retorna clase para 'confirmada'", () => {
    expect(getStatusColor("confirmada")).toContain("emerald");
  });

  it("retorna clase para 'cancelada'", () => {
    expect(getStatusColor("cancelada")).toContain("red");
  });

  it("retorna clase para 'completada'", () => {
    expect(getStatusColor("completada")).toContain("blue");
  });

  it("retorna clase gris para estado desconocido", () => {
    expect(getStatusColor("unknown")).toContain("gray");
  });
});

// ─── getStatusLabel ───────────────────────────────────────────────────────────
describe("getStatusLabel", () => {
  it("retorna 'Pendiente' para 'pendiente'", () => {
    expect(getStatusLabel("pendiente")).toBe("Pendiente");
  });

  it("retorna 'Confirmada' para 'confirmada'", () => {
    expect(getStatusLabel("confirmada")).toBe("Confirmada");
  });

  it("retorna 'Cancelada' para 'cancelada'", () => {
    expect(getStatusLabel("cancelada")).toBe("Cancelada");
  });

  it("retorna 'Completada' para 'completada'", () => {
    expect(getStatusLabel("completada")).toBe("Completada");
  });

  it("retorna el valor original para status desconocido", () => {
    expect(getStatusLabel("otro")).toBe("otro");
  });
});

// ─── getRolLabel ──────────────────────────────────────────────────────────────
describe("getRolLabel", () => {
  it("retorna 'Administrador' para 'admin'", () => {
    expect(getRolLabel("admin")).toBe("Administrador");
  });

  it("retorna 'Médico' para 'medico'", () => {
    expect(getRolLabel("medico")).toBe("Médico");
  });

  it("retorna 'Esteticista' para 'esteticista'", () => {
    expect(getRolLabel("esteticista")).toBe("Esteticista");
  });

  it("retorna 'Recepción' para 'recepcion'", () => {
    expect(getRolLabel("recepcion")).toBe("Recepción");
  });

  it("retorna el valor original para rol desconocido", () => {
    expect(getRolLabel("unknown")).toBe("unknown");
  });
});

// ─── getInitials ──────────────────────────────────────────────────────────────
describe("getInitials", () => {
  it("retorna '?' para nombre null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("retorna '?' para nombre undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });

  it("retorna iniciales en mayúsculas de nombre compuesto", () => {
    expect(getInitials("Ana García")).toBe("AG");
  });

  it("retorna inicial única para nombre simple", () => {
    expect(getInitials("Laura")).toBe("L");
  });

  it("retorna solo las 2 primeras iniciales para nombre largo", () => {
    expect(getInitials("María José López Martínez")).toBe("MJ");
  });
});

// ─── calcularEdad ─────────────────────────────────────────────────────────────
describe("calcularEdad", () => {
  it("retorna '—' para null", () => {
    expect(calcularEdad(null)).toBe("—");
  });

  it("calcula edad correctamente", () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const birthDate = `${birthYear}-01-01`;
    const result = calcularEdad(birthDate);
    expect(result).toMatch(/\d+ años/);
    const age = parseInt(result);
    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(30);
  });

  it("retorna formato con 'años'", () => {
    const result = calcularEdad("1990-05-20");
    expect(result).toMatch(/años/);
  });
});
