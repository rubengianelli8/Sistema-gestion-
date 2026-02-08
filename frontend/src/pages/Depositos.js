import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { warehousesAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Pencil, Trash2, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

const Depositos = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    encargado: '',
    telefono: '',
  });

  const canCreate = hasPermission('depositos:crear');
  const canEdit = hasPermission('depositos:editar');
  const canDelete = hasPermission('depositos:eliminar');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data);
    } catch (error) {
      toast.error('Error al cargar depósitos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        nombre: warehouse.nombre,
        direccion: warehouse.direccion || '',
        encargado: warehouse.encargado || '',
        telefono: warehouse.telefono || '',
      });
    } else {
      setEditingWarehouse(null);
      setFormData({ nombre: '', direccion: '', encargado: '', telefono: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await warehousesAPI.update(editingWarehouse.id, formData);
        toast.success('Depósito actualizado exitosamente');
      } else {
        await warehousesAPI.create(formData);
        toast.success('Depósito creado exitosamente');
      }
      setDialogOpen(false);
      loadWarehouses();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await warehousesAPI.delete(warehouseToDelete.id);
      toast.success('Depósito eliminado exitosamente');
      setDeleteDialogOpen(false);
      loadWarehouses();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="depositos-title">
            Depósitos
          </h1>
          <p className="text-slate-600 mt-1">Gestión de almacenes y ubicaciones</p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenDialog()} data-testid="create-warehouse-button">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Depósito
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Depósitos</CardTitle>
          <CardDescription>
            {warehouses.length} depósito{warehouses.length !== 1 ? 's' : ''} registrado{warehouses.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay depósitos registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Encargado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-blue-600" />
                          {warehouse.nombre}
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.direccion || '-'}</TableCell>
                      <TableCell>{warehouse.encargado || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={warehouse.activo ? 'default' : 'secondary'}>
                          {warehouse.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(warehouse)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setWarehouseToDelete(warehouse);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Editar Depósito' : 'Nuevo Depósito'}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse ? 'Actualiza los datos del depósito' : 'Ingresa los datos del nuevo depósito'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  data-testid="warehouse-nombre-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="encargado">Encargado</Label>
                <Input
                  id="encargado"
                  value={formData.encargado}
                  onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="warehouse-submit-button">
                {editingWarehouse ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el depósito "{warehouseToDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Depositos;