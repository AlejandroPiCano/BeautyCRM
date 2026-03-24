"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { medicalRecordSchema } from "@/lib/validations";
import type { MedicalRecordFormData } from "@/lib/validations";
import type { MedicalRecord, MedicalRecordPhoto } from "@/lib/db/schema";
import { createMedicalRecord, updateMedicalRecord } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  patientId: string;
  patientName: string;
  medicalRecords: MedicalRecord[];
  photos: MedicalRecordPhoto[];
}

export function MedicalRecordClient({ patientId, patientName, medicalRecords, photos }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(medicalRecords[0]?.id ?? null);

  const {
    register, handleSubmit, reset,
    formState: { isSubmitting },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: { pacienteId: patientId, fecha: format(new Date(), "yyyy-MM-dd") },
  });

  const handleCreate = async (data: MedicalRecordFormData) => {
    const result = await createMedicalRecord(data);
    if ("error" in result && result.error) {
      toast.error("Error al crear la historia");
      return;
    }
    toast.success("Historia clínica creada");
    setShowForm(false);
    reset({ pacienteId: patientId, fecha: format(new Date(), "yyyy-MM-dd") });
    router.refresh();
  };

  const handleUpdate = async (data: MedicalRecordFormData) => {
    if (!editingRecord) return;
    const result = await updateMedicalRecord(editingRecord.id, data);
    if ("error" in result && result.error) {
      toast.error("Error al actualizar la historia");
      return;
    }
    toast.success("Historia actualizada");
    setEditingRecord(null);
    setShowForm(false);
    reset({ pacienteId: patientId, fecha: format(new Date(), "yyyy-MM-dd") });
    router.refresh();
  };

  const startEdit = (h: MedicalRecord) => {
    setEditingRecord(h);
    reset({
      pacienteId: patientId,
      fecha: h.fecha,
      seccion: h.seccion,
      notas: h.notas ?? "",
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* New Record button */}
      {!showForm && (
        <button
          onClick={() => { setEditingRecord(null); reset({ pacienteId: patientId, fecha: format(new Date(), "yyyy-MM-dd") }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva entrada
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">
              {editingRecord ? "Editar historia" : "Nueva entrada clínica"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingRecord(null); }}
              aria-label="Cancelar"
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit(editingRecord ? handleUpdate : handleCreate)} className="space-y-5" noValidate>
            <input type="hidden" {...register("pacienteId")} />

            <div className="space-y-1.5">
              <label htmlFor="h-fecha" className="text-sm font-medium text-foreground">Fecha</label>
              <input
                {...register("fecha")}
                id="h-fecha"
                type="date"
                className="w-full max-w-xs rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Anamnesis */}
            <fieldset className="border border-border rounded-lg p-4 space-y-3">
              <legend className="text-xs font-semibold text-foreground uppercase tracking-wider px-1">
                Anamnesis
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Motivo de consulta</label>
                  <textarea {...register("seccion.anamnesis.motivoConsulta")} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Antecedentes</label>
                  <textarea {...register("seccion.anamnesis.antecedentes")} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Alergias</label>
                  <input {...register("seccion.anamnesis.alergias")} type="text" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Medicamentos</label>
                  <input {...register("seccion.anamnesis.medicamentos")} type="text" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </fieldset>

            {/* Treatment */}
            <fieldset className="border border-border rounded-lg p-4 space-y-3">
              <legend className="text-xs font-semibold text-foreground uppercase tracking-wider px-1">
                Tratamiento aplicado
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { field: "seccion.tratamiento.tipo" as const, label: "Tipo de tratamiento" },
                  { field: "seccion.tratamiento.zona" as const, label: "Zona tratada" },
                  { field: "seccion.tratamiento.tecnica" as const, label: "Técnica" },
                  { field: "seccion.tratamiento.productosUsados" as const, label: "Productos usados" },
                  { field: "seccion.tratamiento.parametros" as const, label: "Parámetros" },
                  { field: "seccion.tratamiento.resultado" as const, label: "Resultado" },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <input {...register(field)} type="text" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Evolution */}
            <fieldset className="border border-border rounded-lg p-4 space-y-3">
              <legend className="text-xs font-semibold text-foreground uppercase tracking-wider px-1">
                Evolución
              </legend>
              <div className="space-y-3">
                {[
                  { field: "seccion.evolucion.observaciones" as const, label: "Observaciones" },
                  { field: "seccion.evolucion.recomendaciones" as const, label: "Recomendaciones" },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <textarea {...register(field)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* General Notes */}
            <div className="space-y-1.5">
              <label htmlFor="h-notas" className="text-sm font-medium text-foreground">Notas adicionales</label>
              <textarea {...register("notas")} id="h-notas" rows={3} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingRecord(null); }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {isSubmitting ? "Guardando..." : editingRecord ? "Guardar cambios" : "Guardar entrada"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      {medicalRecords.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center shadow-xs">
          <p className="text-muted-foreground text-sm">No hay entradas clínicas aún.</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-primary font-medium hover:underline">
            Crear la primera entrada
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {medicalRecords.map((h) => {
            const isExpanded = expandedId === h.id;
            return (
              <div key={h.id} className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : h.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/40 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{formatDate(h.fecha)}</p>
                    {h.notas && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{h.notas}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEdit(h); }}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      Editar
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
                    {h.seccion.anamnesis && Object.values(h.seccion.anamnesis).some(Boolean) && (
                      <Section title="Anamnesis" data={h.seccion.anamnesis as Record<string, unknown>} />
                    )}
                    {h.seccion.tratamiento && Object.values(h.seccion.tratamiento).some(Boolean) && (
                      <Section title="Tratamiento" data={h.seccion.tratamiento as Record<string, unknown>} />
                    )}
                    {h.seccion.evolucion && Object.values(h.seccion.evolucion).some(Boolean) && (
                      <Section title="Evolución" data={h.seccion.evolucion as Record<string, unknown>} />
                    )}
                    {h.notas && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                        <p className="text-sm text-foreground">{h.notas}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, data }: { title: string; data: Record<string, unknown> }) {
  const fieldLabels: Record<string, string> = {
    motivoConsulta: "Motivo de consulta",
    antecedentes: "Antecedentes",
    alergias: "Alergias",
    medicamentos: "Medicamentos",
    embarazo: "Embarazo",
    tipo: "Tipo",
    zona: "Zona",
    tecnica: "Técnica",
    productosUsados: "Productos usados",
    parametros: "Parámetros",
    resultado: "Resultado",
    observaciones: "Observaciones",
    recomendaciones: "Recomendaciones",
    proximaCita: "Próxima cita",
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(data).map(([key, value]) =>
          value ? (
            <div key={key}>
              <dt className="text-xs text-muted-foreground">{fieldLabels[key] ?? key}</dt>
              <dd className="text-sm text-foreground">{String(value)}</dd>
            </div>
          ) : null
        )}
      </dl>
    </div>
  );
}
