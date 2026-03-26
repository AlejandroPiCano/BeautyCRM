import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboardStats } from "@/lib/queries";
import { Header } from "@/components/layout/header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { StatsSkeleton, RecentSkeleton } from "@/components/dashboard/skeletons";
import { DashboardChatbot } from "@/components/dashboard/chatbot";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsLoader />
        </Suspense>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<RecentSkeleton />}>
              <RecentLoader />
            </Suspense>
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
        <DashboardChatbot />
      </div>
    </>
  );
}

async function StatsLoader() {
  const stats = await getDashboardStats();
  return <DashboardStats stats={stats} />;
}

async function RecentLoader() {
  const stats = await getDashboardStats();
  return <RecentPatients patients={stats.pacientesRecientes} />;
}

function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Acciones rápidas
      </h2>
      <div className="space-y-2">
        {[
          { href: "/patients?new=1", label: "Nuevo paciente", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400" },
          { href: "/schedule?new=1", label: "Nueva cita", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400" },
          { href: "/patients", label: "Ver todos los pacientes", color: "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300" },
          { href: "/schedule", label: "Ver agenda", color: "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300" },
        ].map((action) => (
          <a
            key={action.href}
            href={action.href}
            className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${action.color}`}
          >
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}
