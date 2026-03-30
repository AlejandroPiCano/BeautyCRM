import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Iniciar Sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/10" />
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            AesthAI
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestiona tu clínica
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              con elegancia
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Pacientes, agenda y historias clínicas en un solo lugar.
            Minimalista, rápido y pensado para profesionales.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Pacientes", value: "∞" },
            { label: "Citas/día", value: "48" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 lg:hidden mb-6">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-md flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                AesthAI
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
