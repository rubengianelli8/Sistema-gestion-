"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import Image from "next/image";

const SIDEBAR_COLLAPSED_KEY = "sidebar:collapsed";

interface DashboardShellProps {
  children: ReactNode;
  headerContent: ReactNode;
}

export function DashboardShell({
  children,
  headerContent,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const skipNextPersist = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex h-screen bg-muted">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header con botón hamburguesa en mobile */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Image
                src="/logo.png"
                alt="Venta Agil"
                width={280}
                height={68}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            {headerContent}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
