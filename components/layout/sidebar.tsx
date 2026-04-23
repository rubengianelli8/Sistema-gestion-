"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ShoppingBag,
  Truck,
  Settings,
  LogOut,
  X,
  Tags,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/categorias", label: "Categorías", icon: Tags },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Truck },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Settings },
];

interface SidebarAsideProps {
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarAside({
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarAsideProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-full transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-b border-gray-200 flex items-center gap-2 shrink-0",
          collapsed ? "p-2 justify-center" : "p-4 justify-end",
        )}
      >
        <div className="flex items-center gap-1 shrink-0">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex p-1 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? (
                <ChevronsRight className="w-5 h-5" />
              ) : (
                <ChevronsLeft className="w-5 h-5" />
              )}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-1",
          collapsed ? "p-2" : "p-4",
        )}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md transition-colors",
                collapsed
                  ? "justify-center px-2 py-2 gap-0"
                  : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={cn("border-t border-gray-200", collapsed ? "p-2" : "p-4")}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "flex items-center rounded-md text-gray-700 hover:bg-gray-100 w-full",
            collapsed
              ? "justify-center px-2 py-2 gap-0"
              : "gap-3 px-3 py-2",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </aside>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  open = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Desktop: barra lateral colapsable */}
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarAside
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      {/* Mobile: overlay + drawer siempre expandido */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
            <SidebarAside collapsed={false} onClose={onClose} />
          </div>
        </>
      )}
    </>
  );
}
