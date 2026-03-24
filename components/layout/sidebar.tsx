"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/patients",
    label: "Pacientes",
    icon: Users,
  },
  {
    href: "/schedule",
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-5 border-b border-slate-800 overflow-hidden",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">
            EstéticaCRM
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Menú principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                  active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150 w-full",
            collapsed && "justify-center px-0 w-10 mx-auto"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 flex-shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
            aria-hidden="true"
          />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
