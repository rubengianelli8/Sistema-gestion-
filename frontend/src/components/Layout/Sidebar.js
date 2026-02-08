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
    title: 'Configuración',
    icon: Settings,
    path: '/dashboard/configuracion',
    permission: 'usuarios:ver',
  },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <div
      className={cn(
        'bg-slate-900 text-white h-screen transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
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
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
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
    </div>
  );
};

export default Sidebar;
