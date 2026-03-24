import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getOrigenLabel(origen: string): string {
  const labels: Record<string, string> = {
    web: "Web",
    redes_sociales: "Redes Sociales",
    google: "Google",
    conocido: "Conocido",
    otro: "Otro",
  };
  return labels[origen] ?? origen;
}

// English alias
export const getSourceLabel = getOrigenLabel;

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendiente: "bg-amber-100 text-amber-700",
    confirmada: "bg-emerald-100 text-emerald-700",
    cancelada: "bg-red-100 text-red-700",
    completada: "bg-blue-100 text-blue-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    completada: "Completada",
  };
  return labels[status] ?? status;
}

export function getRolLabel(rol: string): string {
  const labels: Record<string, string> = {
    admin: "Administrador",
    medico: "Médico",
    esteticista: "Esteticista",
    recepcion: "Recepción",
  };
  return labels[rol] ?? rol;
}

// English alias
export const getRoleLabel = getRolLabel;

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return "—";
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

// English alias
export const calculateAge = calcularEdad;
