import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPatientWithHistory } from "@/lib/queries";
import { Header } from "@/components/layout/header";
import {
  ArrowLeft, Mail, Phone, Calendar, FileText,
} from "lucide-react";
import {
  formatDate, formatDateTime, getInitials, getOrigenLabel,
  getStatusColor, getStatusLabel, calcularEdad,
} from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { paciente } = await getPatientWithHistory(id);
  return { title: paciente ? paciente.nombre : "Paciente" };
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { paciente, citas, historias } = await getPatientWithHistory(id);

  if (!paciente) notFound();

  return (
    <>
      <Header />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Volver a pacientes"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{paciente.nombre}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile card */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(paciente.nombre)}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{paciente.nombre}</h2>
                  {paciente.fechaNacimiento && (
                    <p className="text-sm text-muted-foreground">
                      {calcularEdad(paciente.fechaNacimiento)}
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2.5 py-0.5">
                  {getOrigenLabel(paciente.origen)}
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                {paciente.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground truncate">{paciente.email}</span>
                  </div>
                )}
                {paciente.telefono && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground">{paciente.telefono}</span>
                  </div>
                )}
                {paciente.fechaNacimiento && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground">{formatDate(paciente.fechaNacimiento)}</span>
                  </div>
                )}
              </dl>

              {paciente.notas && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm text-foreground">{paciente.notas}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/patients/${id}/medical-records`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  Historia clínica
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
                <p className="text-2xl font-bold text-foreground">{citas.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Citas totales</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
                <p className="text-2xl font-bold text-foreground">{historias.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Historias</p>
              </div>
            </div>
          </div>

          {/* Right: Appointments history */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Historial de citas</h3>
                <Link
                  href={`/schedule?new=1`}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  + Nueva cita
                </Link>
              </div>
              {citas.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin citas registradas
                </div>
              ) : (
                <ul className="divide-y divide-border" aria-label="Historial de citas">
                  {citas.map((c) => (
                    <li key={c.id} className="flex items-start gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {formatDateTime(c.fecha)}
                          </p>
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${getStatusColor(c.status)}`}>
                            {getStatusLabel(c.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.tipo} · {c.duracionMin} min
                          {c.staffNombre ? ` · ${c.staffNombre}` : ""}
                        </p>
                        {c.notas && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {c.notas}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
