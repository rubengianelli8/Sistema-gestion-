import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Menu,
  X,
  Warehouse,
  Building2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: null, // Everyone can see dashboard
  },
  {
    title: 'Productos',
    icon: Package,
    path: '/dashboard/productos',
    permission: 'productos:ver',
  },
  {
    title: 'Categorías',
    icon: FolderOpen,
    path: '/dashboard/categorias',
    permission: 'productos:ver',
  },
  {
    title: 'Ventas',
    icon: ShoppingCart,
    path: '/dashboard/ventas',
    permission: 'ventas:ver',
  },
  {
    title: 'Clientes',
    icon: Users,
    path: '/dashboard/clientes',
    permission: 'clientes:ver',
  },
  {
    title: 'Presupuestos',
    icon: FileText,
    path: '/dashboard/presupuestos',
    permission: 'presupuestos:ver',
  },
  {
    title: 'Depósitos',
    icon: Warehouse,
    path: '/dashboard/depositos',
    permission: 'depositos:ver',
  },
  {
    title: 'Proveedores',
    icon: Building2,
    path: '/dashboard/proveedores',
    permission: 'proveedores:ver',
  },
  {
    title: 'Compras',
    icon: ShoppingBag,
    path: '/dashboard/compras',
    permission: 'compras:ver',
  },
  {
    title: 'Configuración',
    icon: Settings,
    path: '/dashboard/configuracion',
    permission: 'usuarios:ver',
  },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Ferretería
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Menu size={20} />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div
        className={cn(
          'bg-slate-900 text-white h-screen transition-all duration-300 flex flex-col',
          'fixed md:relative z-40',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
