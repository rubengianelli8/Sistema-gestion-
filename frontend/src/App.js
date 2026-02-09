import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Presupuestos from './pages/Presupuestos';
import Usuarios from './pages/Usuarios';
import Depositos from './pages/Depositos';
import Proveedores from './pages/Proveedores';
import Compras from './pages/Compras';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/categorias"
            element={
              <DashboardLayout>
                <Categorias />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/productos"
            element={
              <DashboardLayout>
                <Productos />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/clientes"
            element={
              <DashboardLayout>
                <Clientes />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/ventas"
            element={
              <DashboardLayout>
                <Ventas />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/presupuestos"
            element={
              <DashboardLayout>
                <Presupuestos />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/configuracion"
            element={
              <DashboardLayout>
                <Usuarios />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/depositos"
            element={
              <DashboardLayout>
                <Depositos />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/proveedores"
            element={
              <DashboardLayout>
                <Proveedores />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/dashboard/compras"
            element={
              <DashboardLayout>
                <Compras />
              </DashboardLayout>
            }
          />
          
          {/* Placeholder routes for remaining modules */}
          <Route
            path="/dashboard/*"
            element={
              <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Módulo en desarrollo
                    </h2>
                    <p className="text-slate-600">
                      Esta sección estará disponible próximamente
                    </p>
                  </div>
                </div>
              </DashboardLayout>
            }
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
