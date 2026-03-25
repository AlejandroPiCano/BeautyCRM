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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out z-50",
          collapsed ? "w-16" : "w-60",
          // Mobile: controlled by mobileOpen state
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden absolute right-4 top-5 text-slate-400 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
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
              onClick={() => onMobileClose?.()}
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

      {/* Collapse toggle - desktop only */}
      <div className="px-2 pb-4 hidden lg:block">
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
    </>
  );
}
