"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  headerContent: ReactNode;
}

export function DashboardShell({ children, headerContent }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header con botón hamburguesa en mobile */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">Sistema de Gestión</h2>
            </div>
            {headerContent}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
