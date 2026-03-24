"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import type { Patient } from "@/lib/db/schema";
import {
  getInitials, getSourceLabel, getStatusColor, formatDate, calculateAge, cn,
} from "@/lib/utils";
import { createPatient, updatePatient, deletePatient } from "@/lib/actions";
import { PatientModal } from "./patient-modal";

interface Props {
  patients: Patient[];
  total: number;
  pages: number;
  page: number;
  search: string;
  openNew: boolean;
}

const sourceColors: Record<string, string> = {
  web: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  redes_sociales: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  google: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  conocido: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  otro: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function PatientsTable({
  patients, total, pages, page, search, openNew,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(openNew);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreate = async (data: unknown) => {
    const result = await createPatient(data);
    if ("error" in result && result.error) {
      toast.error("Error al crear paciente");
      return false;
    }
    toast.success("Paciente creado correctamente");
    setModalOpen(false);
    router.refresh();
    return true;
  };

  const handleUpdate = async (data: unknown) => {
    if (!editingPatient) return false;
    const result = await updatePatient(editingPatient.id, data);
    if ("error" in result && result.error) {
      toast.error("Error al actualizar paciente");
      return false;
    }
    toast.success("Paciente actualizado correctamente");
    setEditingPatient(null);
    router.refresh();
    return true;
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deletePatient(id);
      toast.success("Paciente eliminado");
      setDeleteConfirm(null);
      router.refresh();
    });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            {total.toLocaleString("es-ES")} pacientes en total
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar pacientes..."
              defaultValue={search}
              aria-label="Buscar pacientes"
              onChange={(e) => {
                const v = e.target.value;
                const timer = setTimeout(() => handleSearch(v), 400);
                return () => clearTimeout(timer);
              }}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => { setEditingPatient(null); setModalOpen(true); }}
            aria-label="Añadir nuevo paciente"
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        {patients.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? `No se encontraron pacientes para "${search}"` : "No hay pacientes aún."}
            </p>
            {!search && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                Añadir el primer paciente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Lista de pacientes">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Paciente
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Contacto
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Origen
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                      Alta
                    </th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(p.nombre)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{p.nombre}</p>
                            {p.fechaNacimiento && (
                              <p className="text-xs text-muted-foreground">
                                {calculateAge(p.fechaNacimiento)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-foreground">{p.email ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.telefono ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          sourceColors[p.origen] ?? sourceColors["otro"]!
                        )}>
                          {getSourceLabel(p.origen)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell text-muted-foreground text-xs">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link
                            href={`/patients/${p.id}`}
                            aria-label={`Ver historial de ${p.nombre}`}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => { setEditingPatient(p); setModalOpen(true); }}
                            aria-label={`Editar ${p.nombre}`}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            aria-label={`Eliminar ${p.nombre}`}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {pages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pages}
                    aria-label="Página siguiente"
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
            aria-hidden="true"
          />
          <div className="relative bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-sm animate-fade-in">
            <h3 id="delete-title" className="font-semibold text-foreground mb-2">
              ¿Eliminar paciente?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción desactivará al paciente. Sus datos se conservarán.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isPending}
                className="rounded-lg bg-destructive text-destructive-foreground px-3.5 py-2 text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <PatientModal
        open={modalOpen}
        patient={editingPatient}
        onClose={() => { setModalOpen(false); setEditingPatient(null); }}
        onSubmit={editingPatient ? handleUpdate : handleCreate}
      />
    </>
  );
}
