import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, ShoppingCart, Users, FileText, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const resumen = stats?.resumen || {};
  const ingresosChange = resumen.cambio_porcentual || 0;
  const isPositiveChange = ingresosChange >= 0;

  const statCards = [
    {
      title: 'Productos',
      value: resumen.total_productos || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ventas',
      value: resumen.total_ventas || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Clientes',
      value: resumen.total_clientes || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Presupuestos',
      value: resumen.total_presupuestos || 0,
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

      {/* Stats Cards */}
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
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ingresos Totales</CardTitle>
              <CardDescription>Comparación mensual</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isPositiveChange ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <Badge variant={isPositiveChange ? 'default' : 'destructive'}>
                {isPositiveChange ? '+' : ''}{ingresosChange.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total General</p>
              <p className="text-2xl font-bold text-slate-900">
                ${resumen.ingresos_totales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Mes Actual</p>
              <p className="text-2xl font-bold text-blue-700">
                ${resumen.ingresos_mes_actual?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Mes Anterior</p>
              <p className="text-2xl font-bold text-slate-700">
                ${resumen.ingresos_mes_anterior?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.ingresos_diarios || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 por cantidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.productos_mas_vendidos || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad_vendida" fill="#10b981" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Alertas de Stock Bajo</CardTitle>
            </div>
            <CardDescription>
              {stats?.alertas_stock_bajo?.length || 0} productos con stock mínimo o menor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.alertas_stock_bajo || stats.alertas_stock_bajo.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                ✓ No hay productos con stock bajo
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.alertas_stock_bajo.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{product.nombre}</p>
                      <p className="text-sm text-slate-600">
                        Stock mínimo: {product.stock_minimo}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {product.stock_actual} unidades
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>Últimas 5 transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.ventas_recientes || stats.ventas_recientes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay ventas registradas
              </div>
            ) : (
              <div className="space-y-2">
                {stats.ventas_recientes.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">
                        ${sale.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(sale.fecha).toLocaleString()} • {sale.vendedor}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {sale.items_count} items
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Productos Más Vendidos</CardTitle>
          <CardDescription>Información completa de ventas por producto</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.productos_mas_vendidos || stats.productos_mas_vendidos.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay datos de productos vendidos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">#</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Producto</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Cantidad Vendida</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.productos_mas_vendidos.map((product, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{product.nombre}</td>
                      <td className="py-3 px-4 text-right">{product.cantidad_vendida}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        ${product.ingresos.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
