"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Trash2 } from "lucide-react";
import { appointmentSchema, appointmentTypeValues, appointmentStatusValues } from "@/lib/validations";
import type { AppointmentFormData } from "@/lib/validations";
import type { Patient, TreatmentType } from "@/lib/db/schema";
import { cn, getStatusLabel } from "@/lib/utils";
import { format } from "date-fns";

interface CalendarAppointment {
  id: string;
  fecha: Date;
  duracionMin: number;
  tipo: string;
  status: string;
  notas: string | null;
  pacienteNombre: string;
  pacienteId: string;
  staffId: string | null;
  tipoTratamientoNombre: string | null;
}

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  appointment: CalendarAppointment | null;
  initialSlot: { start: Date; end: Date } | null;
  patients: Patient[];
  staffList: StaffUser[];
  treatmentTypes: TreatmentType[];
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => Promise<boolean>;
  onDelete?: () => void;
  onStatusChange?: (status: "pendiente" | "confirmada" | "cancelada" | "completada") => void;
}

const typeLabels: Record<string, string> = {
  consulta: "Consulta",
  tratamiento: "Tratamiento",
  revision: "Revisión",
  otro: "Otro",
};

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
};

const statusColors: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  confirmada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
  completada: "bg-blue-100 text-blue-700",
};

export function AppointmentModal({
  open, appointment, initialSlot, patients, staffList, treatmentTypes,
  onClose, onSubmit, onDelete, onStatusChange,
}: Props) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { tipo: "consulta", status: "pendiente", duracionMin: 60 },
  });

  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.fecha);
      reset({
        pacienteId: appointment.pacienteId,
        staffId: appointment.staffId ?? undefined,
        fecha: format(appointmentDate, "yyyy-MM-dd"),
        hora: format(appointmentDate, "HH:mm"),
        duracionMin: appointment.duracionMin,
        tipo: appointment.tipo as AppointmentFormData["tipo"],
        status: appointment.status as AppointmentFormData["status"],
        notas: appointment.notas ?? "",
      });
    } else if (initialSlot) {
      reset({
        tipo: "consulta",
        status: "pendiente",
        duracionMin: 60,
        fecha: format(initialSlot.start, "yyyy-MM-dd"),
        hora: format(initialSlot.start, "HH:mm"),
      });
    } else {
      reset({ tipo: "consulta", status: "pendiente", duracionMin: 60 });
    }
  }, [appointment, initialSlot, reset]);

  const handleFormSubmit = async (data: AppointmentFormData) => {
    const ok = await onSubmit(data);
    if (ok) reset({ tipo: "consulta", status: "pendiente", duracionMin: 60 });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin mx-2 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <h2 id="appointment-modal-title" className="font-semibold text-foreground">
              {appointment ? "Editar cita" : "Nueva cita"}
            </h2>
            {appointment && (
              <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", statusColors[appointment.status] ?? "bg-slate-100 text-slate-600")}>
                {getStatusLabel(appointment.status)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Eliminar cita"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button onClick={onClose} aria-label="Cerrar modal" className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Status quick change */}
        {appointment && onStatusChange && (
          <div className="px-6 py-3 border-b border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Cambiar estado rápido:</p>
            <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Estado de la cita">
              {appointmentStatusValues.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    "text-xs rounded-full px-2.5 py-1 font-medium transition-all border",
                    appointment.status === s
                      ? (statusColors[s] ?? "") + " border-transparent ring-2 ring-offset-1 ring-current"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-5 space-y-4" noValidate>
          {/* Patient */}
          <div className="space-y-1.5">
            <label htmlFor="c-patient" className="text-sm font-medium text-foreground">
              Paciente <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <select
              {...register("pacienteId")}
              id="c-patient"
              aria-invalid={!!errors.pacienteId}
              className={cn(
                "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                errors.pacienteId ? "border-destructive" : "border-input"
              )}
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {errors.pacienteId && (
              <p role="alert" className="text-xs text-destructive">{errors.pacienteId.message}</p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="c-date" className="text-sm font-medium text-foreground">
                Fecha <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <input
                {...register("fecha")}
                id="c-date"
                type="date"
                aria-invalid={!!errors.fecha}
                className={cn(
                  "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.fecha ? "border-destructive" : "border-input"
                )}
              />
              {errors.fecha && (
                <p role="alert" className="text-xs text-destructive">{errors.fecha.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-time" className="text-sm font-medium text-foreground">
                Hora <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <input
                {...register("hora")}
                id="c-time"
                type="time"
                aria-invalid={!!errors.hora}
                className={cn(
                  "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.hora ? "border-destructive" : "border-input"
                )}
              />
              {errors.hora && (
                <p role="alert" className="text-xs text-destructive">{errors.hora.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label htmlFor="c-duration" className="text-sm font-medium text-foreground">
              Duración (min)
            </label>
            <input
              {...register("duracionMin", { valueAsNumber: true })}
              id="c-duration"
              type="number"
              min={15}
              max={480}
              step={15}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="c-type" className="text-sm font-medium text-foreground">
                Tipo
              </label>
              <select
                {...register("tipo")}
                id="c-type"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {appointmentTypeValues.map((v) => (
                  <option key={v} value={v}>{typeLabels[v]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-status" className="text-sm font-medium text-foreground">
                Estado
              </label>
              <select
                {...register("status")}
                id="c-status"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {appointmentStatusValues.map((v) => (
                  <option key={v} value={v}>{statusLabels[v]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff + Treatment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="c-staff" className="text-sm font-medium text-foreground">
                Profesional
              </label>
              <select
                {...register("staffId")}
                id="c-staff"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin asignar</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name ?? s.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-treatment" className="text-sm font-medium text-foreground">
                Tipo tratamiento
              </label>
              <select
                {...register("tipoTratamientoId")}
                id="c-treatment"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin especificar</option>
                {treatmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="c-notes" className="text-sm font-medium text-foreground">
              Notas
            </label>
            <textarea
              {...register("notas")}
              id="c-notes"
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
              {isSubmitting ? "Guardando..." : appointment ? "Guardar cambios" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
