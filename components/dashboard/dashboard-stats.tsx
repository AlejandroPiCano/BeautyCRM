import { Users, CalendarDays, CalendarCheck, TrendingUp } from "lucide-react";

interface Stats {
  totalPacientes: number;
  citasHoy: number;
  citasSemana: number;
  pacientesRecientes: unknown[];
}

const statCards = [
  {
    key: "totalPacientes" as const,
    label: "Total Pacientes",
    icon: Users,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
    trend: "+12% este mes",
  },
  {
    key: "citasHoy" as const,
    label: "Citas Hoy",
    icon: CalendarDays,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
    trend: "Próximas 8h",
  },
  {
    key: "citasSemana" as const,
    label: "Citas esta Semana",
    icon: CalendarCheck,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400",
    trend: "Lun – Dom",
  },
  {
    key: "ingresos" as const,
    label: "Ocupación",
    icon: TrendingUp,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    trend: "Estimado",
  },
];

export function DashboardStats({ stats }: { stats: Stats }) {
  const values: Record<string, number> = {
    totalPacientes: stats.totalPacientes,
    citasHoy: stats.citasHoy,
    citasSemana: stats.citasSemana,
    ingresos: Math.round((stats.citasSemana / 40) * 100),
  };

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Estadísticas generales"
    >
      {statCards.map(({ key, label, icon: Icon, color, trend }) => (
        <div
          key={key}
          className="bg-card border border-border rounded-xl p-5 shadow-xs hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {key === "ingresos"
              ? `${values[key] ?? 0}%`
              : (values[key] ?? 0).toLocaleString("es-ES")}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{trend}</p>
        </div>
      ))}
    </div>
  );
}
