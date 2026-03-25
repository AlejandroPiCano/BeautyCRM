"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { patientSchema, sourceValues } from "@/lib/validations";
import type { PatientFormData } from "@/lib/validations";
import type { Patient } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => Promise<boolean>;
}

const sourceLabels: Record<string, string> = {
  web: "Web", redes_sociales: "Redes Sociales", google: "Google",
  conocido: "Conocido", otro: "Otro",
};

export function PatientModal({ open, patient, onClose, onSubmit }: Props) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { origen: "otro" },
  });

  useEffect(() => {
    if (patient) {
      reset({
        nombre: patient.nombre,
        email: patient.email ?? "",
        telefono: patient.telefono ?? "",
        fechaNacimiento: patient.fechaNacimiento ?? "",
        origen: patient.origen,
        avatarUrl: patient.avatarUrl ?? "",
        notas: patient.notas ?? "",
      });
    } else {
      reset({ origen: "otro" });
    }
  }, [patient, reset]);

  const handleFormSubmit = async (data: PatientFormData) => {
    const ok = await onSubmit(data);
    if (ok) reset({ origen: "otro" });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 id="patient-modal-title" className="font-semibold text-foreground">
            {patient ? "Editar paciente" : "Nuevo paciente"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-4 sm:px-6 py-5 space-y-4" noValidate>
          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="p-nombre" className="text-sm font-medium text-foreground">
              Nombre completo <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input
              {...register("nombre")}
              id="p-nombre"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? "p-nombre-error" : undefined}
              className={cn(
                "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                errors.nombre ? "border-destructive" : "border-input"
              )}
            />
            {errors.nombre && (
              <p id="p-nombre-error" role="alert" className="text-xs text-destructive">
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Email + Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="p-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                {...register("email")}
                id="p-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={cn(
                  "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.email ? "border-destructive" : "border-input"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-telefono" className="text-sm font-medium text-foreground">
                Teléfono
              </label>
              <input
                {...register("telefono")}
                id="p-telefono"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Fecha nacimiento + Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="p-nacimiento" className="text-sm font-medium text-foreground">
                Fecha de nacimiento
              </label>
              <input
                {...register("fechaNacimiento")}
                id="p-nacimiento"
                type="date"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-origen" className="text-sm font-medium text-foreground">
                Origen contacto
              </label>
              <select
                {...register("origen")}
                id="p-origen"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sourceValues.map((v) => (
                  <option key={v} value={v}>
                    {sourceLabels[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label htmlFor="p-notas" className="text-sm font-medium text-foreground">
              Notas
            </label>
            <textarea
              {...register("notas")}
              id="p-notas"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "Guardando..." : patient ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
