import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Package, ShoppingCart, Users, FileText } from 'lucide-react';
import { productsAPI, salesAPI, customersAPI, quotesAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    sales: 0,
    customers: 0,
    quotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, salesRes, customersRes, quotesRes] = await Promise.all([
        productsAPI.getAll().catch(() => ({ data: [] })),
        salesAPI.getAll().catch(() => ({ data: [] })),
        customersAPI.getAll().catch(() => ({ data: [] })),
        quotesAPI.getAll().catch(() => ({ data: [] })),
      ]);

      setStats({
        products: productsRes.data.length,
        sales: salesRes.data.length,
        customers: customersRes.data.length,
        quotes: quotesRes.data.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Productos',
      value: stats.products,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ventas',
      value: stats.sales,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Clientes',
      value: stats.customers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Presupuestos',
      value: stats.quotes,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" data-testid="dashboard-title">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-slate-600 mt-1">
          Sistema de Gestión de Ferretería
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase()}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
          <CardDescription>
            Información general del sistema de gestión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Tu Rol</h3>
              <p className="text-slate-600">
                {user?.rol === 'admin' && '👨‍💼 Administrador - Acceso completo al sistema'}
                {user?.rol === 'vendedor' && '🛒 Vendedor - Gestión de ventas, clientes y presupuestos'}
                {user?.rol === 'almacenero' && '📦 Almacenero - Gestión de productos e inventario'}
                {user?.rol === 'contador' && '📊 Contador - Acceso a reportes y estadísticas'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Funcionalidades</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Gestión de productos con control de stock</li>
                <li>Sistema de ventas con punto de venta (POS)</li>
                <li>Administración de clientes con historial</li>
                <li>Creación y seguimiento de presupuestos</li>
                <li>Importación/Exportación de datos en Excel</li>
                <li>Sistema de permisos por roles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
