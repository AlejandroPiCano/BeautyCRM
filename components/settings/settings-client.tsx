"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  treatmentTypeSchema, staffSchema,
  staffRoleValues,
} from "@/lib/validations";
import type { TreatmentTypeFormData, StaffFormData } from "@/lib/validations";
import type { TreatmentType } from "@/lib/db/schema";
import {
  createTreatmentType, updateTreatmentType,
  createStaffMember, toggleStaffActive,
} from "@/lib/actions";
import { getRoleLabel, cn } from "@/lib/utils";

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  rol: string;
  image: string | null;
  activo: boolean;
}

interface Props {
  staffList: StaffUser[];
  treatmentTypes: TreatmentType[];
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  medico: "Médico",
  esteticista: "Esteticista",
  recepcion: "Recepción",
};

export function SettingsClient({ staffList, treatmentTypes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingTreatmentType, setEditingTreatmentType] = useState<TreatmentType | null>(null);

  const treatmentForm = useForm<TreatmentTypeFormData>({
    resolver: zodResolver(treatmentTypeSchema),
    defaultValues: { duracionMin: 60, color: "#3b82f6" },
  });

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { rol: "recepcion" },
  });

  const handleCreateTreatmentType = async (data: TreatmentTypeFormData) => {
    if (editingTreatmentType) {
      const result = await updateTreatmentType(editingTreatmentType.id, data);
      if ("error" in result && result.error) { toast.error("Error al actualizar"); return; }
      toast.success("Tipo de tratamiento actualizado");
    } else {
      const result = await createTreatmentType(data);
      if ("error" in result && result.error) { toast.error("Error al crear"); return; }
      toast.success("Tipo de tratamiento creado");
    }
    setShowTreatmentForm(false);
    setEditingTreatmentType(null);
    treatmentForm.reset({ duracionMin: 60, color: "#3b82f6" });
    router.refresh();
  };

  const handleCreateStaff = async (data: StaffFormData) => {
    const result = await createStaffMember(data);
    if ("error" in result && result.error) { toast.error("Error al crear usuario"); return; }
    toast.success("Usuario creado correctamente");
    setShowStaffForm(false);
    staffForm.reset({ rol: "recepcion" });
    router.refresh();
  };

  const handleToggleStaff = (id: string, activo: boolean) => {
    startTransition(async () => {
      await toggleStaffActive(id, !activo);
      toast.success(activo ? "Usuario desactivado" : "Usuario activado");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* ─── Staff ─────────────────────────────────────────────────── */}
      <section aria-labelledby="staff-title">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="staff-title" className="text-base font-semibold text-foreground">
              Equipo / Staff
            </h2>
            <p className="text-sm text-muted-foreground">Usuarios con acceso al sistema</p>
          </div>
          <button
            onClick={() => setShowStaffForm(!showStaffForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Añadir usuario
          </button>
        </div>

        {showStaffForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Nuevo usuario</h3>
              <button onClick={() => setShowStaffForm(false)} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={staffForm.handleSubmit(handleCreateStaff)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="s-name" className="text-sm font-medium text-foreground">Nombre</label>
                <input {...staffForm.register("name")} id="s-name" type="text" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="s-email" className="text-sm font-medium text-foreground">Email</label>
                <input {...staffForm.register("email")} id="s-email" type="email" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="s-rol" className="text-sm font-medium text-foreground">Rol</label>
                <select {...staffForm.register("rol")} id="s-rol" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {staffRoleValues.map((v) => (
                    <option key={v} value={v}>{roleLabels[v]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="s-pass" className="text-sm font-medium text-foreground">Contraseña</label>
                <input {...staffForm.register("password")} id="s-pass" type="password" autoComplete="new-password" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowStaffForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
                <button type="submit" disabled={staffForm.formState.isSubmitting} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {staffForm.formState.isSubmitting ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {staffList.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sin usuarios configurados</p>
          ) : (
            <ul className="divide-y divide-border" aria-label="Lista de usuarios">
              {staffList.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(s.name ?? s.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name ?? s.email}</p>
                    <p className="text-xs text-muted-foreground">{s.email} · {getRoleLabel(s.rol)}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStaff(s.id, s.activo)}
                    disabled={isPending}
                    aria-label={s.activo ? "Desactivar usuario" : "Activar usuario"}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      s.activo
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {s.activo ? "Activo" : "Inactivo"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ─── Treatment Types ──────────────────────────────────────── */}
      <section aria-labelledby="treatments-title">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="treatments-title" className="text-base font-semibold text-foreground">
              Tipos de Tratamiento
            </h2>
            <p className="text-sm text-muted-foreground">Define los servicios que ofrece la clínica</p>
          </div>
          <button
            onClick={() => { setEditingTreatmentType(null); treatmentForm.reset({ duracionMin: 60, color: "#3b82f6" }); setShowTreatmentForm(!showTreatmentForm); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Añadir tipo
          </button>
        </div>

        {showTreatmentForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {editingTreatmentType ? "Editar tipo" : "Nuevo tipo de tratamiento"}
              </h3>
              <button onClick={() => { setShowTreatmentForm(false); setEditingTreatmentType(null); }} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={treatmentForm.handleSubmit(handleCreateTreatmentType)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="t-nombre" className="text-sm font-medium text-foreground">Nombre</label>
                <input {...treatmentForm.register("nombre")} id="t-nombre" type="text" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="t-desc" className="text-sm font-medium text-foreground">Descripción</label>
                <input {...treatmentForm.register("descripcion")} id="t-desc" type="text" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="t-dur" className="text-sm font-medium text-foreground">Duración (min)</label>
                <input {...treatmentForm.register("duracionMin", { valueAsNumber: true })} id="t-dur" type="number" min={15} step={15} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="t-color" className="text-sm font-medium text-foreground">Color en agenda</label>
                <div className="flex items-center gap-2">
                  <input {...treatmentForm.register("color")} id="t-color" type="color" className="h-10 w-10 rounded-lg border border-input cursor-pointer" />
                  <input {...treatmentForm.register("color")} type="text" placeholder="#3b82f6" className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowTreatmentForm(false); setEditingTreatmentType(null); }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
                <button type="submit" disabled={treatmentForm.formState.isSubmitting} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {treatmentForm.formState.isSubmitting ? "Guardando..." : editingTreatmentType ? "Guardar cambios" : "Crear tipo"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {treatmentTypes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sin tipos de tratamiento configurados</p>
          ) : (
            <ul className="divide-y divide-border" aria-label="Tipos de tratamiento">
              {treatmentTypes.map((t) => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3.5 group">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.descripcion ? `${t.descripcion} · ` : ""}
                      {t.duracionMin} min
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTreatmentType(t);
                      treatmentForm.reset({
                        nombre: t.nombre,
                        descripcion: t.descripcion ?? "",
                        duracionMin: t.duracionMin,
                        color: t.color,
                      });
                      setShowTreatmentForm(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1 hover:bg-accent transition-all"
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
