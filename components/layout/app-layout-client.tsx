"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-3.5 left-4 z-[60] w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <main
          id="main-content"
          className="flex-1 overflow-y-auto scrollbar-thin"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
