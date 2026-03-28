import { describe, it, expect } from "vitest";
import { buildCitaWebhookPayload } from "@/lib/webhook";

const baseCita = {
  id: "cita-uuid-001",
  fecha: new Date("2025-06-15T10:00:00Z"),
  duracionMin: 60,
  tipo: "consulta",
  status: "pendiente",
  notas: "Primera visita",
};

const basePaciente = {
  id: "paciente-uuid-001",
  nombre: "Ana García",
  email: "ana@example.com",
  telefono: "612345678",
};

// ─── buildCitaWebhookPayload ───────────────────────────────────────────────────
describe("buildCitaWebhookPayload", () => {
  it("construye el payload con evento cita_creada", () => {
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente);

    expect(payload.event).toBe("cita_creada");
    expect(payload.data.citaId).toBe("cita-uuid-001");
    expect(payload.data.paciente.nombre).toBe("Ana García");
    expect(payload.data.paciente.email).toBe("ana@example.com");
    expect(payload.data.staff).toBeNull();
    expect(payload.data.tipoTratamiento).toBeNull();
  });

  it("incluye fecha como string ISO en el payload", () => {
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente);

    expect(typeof payload.data.fecha).toBe("string");
    expect(payload.data.fecha).toBe(baseCita.fecha.toISOString());
  });

  it("incluye timestamp como string ISO", () => {
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente);

    expect(typeof payload.timestamp).toBe("string");
    expect(() => new Date(payload.timestamp)).not.toThrow();
  });

  it("construye payload con evento cita_actualizada", () => {
    const payload = buildCitaWebhookPayload("cita_actualizada", baseCita, basePaciente);
    expect(payload.event).toBe("cita_actualizada");
  });

  it("construye payload con evento cita_cancelada", () => {
    const payload = buildCitaWebhookPayload("cita_cancelada", baseCita, basePaciente);
    expect(payload.event).toBe("cita_cancelada");
  });

  it("incluye datos del staff cuando se proporciona", () => {
    const staff = { id: "staff-001", name: "Dr. López", email: "dr.lopez@clinica.com" };
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente, staff);

    expect(payload.data.staff).not.toBeNull();
    expect(payload.data.staff?.id).toBe("staff-001");
    expect(payload.data.staff?.nombre).toBe("Dr. López");
    expect(payload.data.staff?.email).toBe("dr.lopez@clinica.com");
  });

  it("acepta staff con nombre null", () => {
    const staff = { id: "staff-001", name: null, email: "anon@clinica.com" };
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente, staff);

    expect(payload.data.staff?.nombre).toBeNull();
  });

  it("incluye tipo de tratamiento cuando se proporciona", () => {
    const tipoTratamiento = {
      id: "tipo-001",
      nombre: "Botox",
      duracionMin: 45,
      color: "#ff5733",
    };
    const payload = buildCitaWebhookPayload(
      "cita_creada",
      baseCita,
      basePaciente,
      null,
      tipoTratamiento
    );

    expect(payload.data.tipoTratamiento).not.toBeNull();
    expect(payload.data.tipoTratamiento?.nombre).toBe("Botox");
    expect(payload.data.tipoTratamiento?.color).toBe("#ff5733");
    expect(payload.data.tipoTratamiento?.duracionMin).toBe(45);
  });

  it("incluye notas de la cita en el payload", () => {
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente);
    expect(payload.data.notas).toBe("Primera visita");
  });

  it("acepta cita sin notas (null)", () => {
    const citaSinNotas = { ...baseCita, notas: null };
    const payload = buildCitaWebhookPayload("cita_creada", citaSinNotas, basePaciente);
    expect(payload.data.notas).toBeNull();
  });

  it("acepta paciente sin email ni teléfono", () => {
    const pacienteSinContacto = {
      id: "paciente-002",
      nombre: "Paciente Anónimo",
      email: null,
      telefono: null,
    };
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, pacienteSinContacto);

    expect(payload.data.paciente.email).toBeNull();
    expect(payload.data.paciente.telefono).toBeNull();
    expect(payload.data.paciente.nombre).toBe("Paciente Anónimo");
  });

  it("propaga duracionMin y tipo correctamente", () => {
    const payload = buildCitaWebhookPayload("cita_creada", baseCita, basePaciente);

    expect(payload.data.duracionMin).toBe(60);
    expect(payload.data.tipo).toBe("consulta");
    expect(payload.data.status).toBe("pendiente");
  });
});
