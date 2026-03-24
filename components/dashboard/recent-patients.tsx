import Link from "next/link";
import { getInitials, getOrigenLabel, formatDate } from "@/lib/utils";

interface Patient {
  id: string;
  nombre: string;
  email: string | null;
  origen: string;
  createdAt: Date;
  avatarUrl: string | null;
}

export function RecentPatients({ patients }: { patients: Patient[] }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Pacientes recientes
        </h2>
        <Link
          href="/patients"
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {patients.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No hay pacientes aún.{" "}
          <Link href="/patients?new=1" className="text-primary font-medium">
            Añade el primero
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border" aria-label="Lista de pacientes recientes">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(p.nombre)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.email ?? "Sin email"} · {getOrigenLabel(p.origen)}
                  </p>
                </div>
                <time
                  dateTime={p.createdAt.toISOString()}
                  className="text-xs text-muted-foreground flex-shrink-0"
                >
                  {formatDate(p.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
