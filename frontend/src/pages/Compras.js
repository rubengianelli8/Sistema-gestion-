import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { purchasesAPI, suppliersAPI, warehousesAPI, productsAPI } from '../services/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, PackageCheck, Trash2, ShoppingBag, Search } from 'lucide-react';
import { toast } from 'sonner';

const Compras = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [formData, setFormData] = useState({
    proveedor_id: '',
    deposito_id: '',
    items: [],
    notas: '',
  });

  const canCreate = hasPermission('compras:crear');
  const canReceive = hasPermission('compras:recibir');

  const loadData = useCallback(async () => {
    try {
      const [purchasesRes, suppliersRes, warehousesRes, productsRes] = await Promise.all([
        purchasesAPI.getAll(),
        suppliersAPI.getAll(),
        warehousesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setWarehouses(warehousesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = () => {
    setFormData({
      proveedor_id: '',
      deposito_id: '',
      items: [],
      notas: '',
    });
    setSearchQuery('');
    setSearchResults([]);
    setDialogOpen(true);
  };

  const handleSearchProduct = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const filtered = products.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.codigo_barras && p.codigo_barras.includes(query))
      );
      setSearchResults(filtered.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddProduct = (product) => {
    const existingIndex = formData.items.findIndex(
      (item) => item.producto_id === product.id
    );

    if (existingIndex >= 0) {
      const newItems = [...formData.items];
      newItems[existingIndex].cantidad += 1;
      newItems[existingIndex].subtotal =
        newItems[existingIndex].cantidad * newItems[existingIndex].precio_unitario;
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            producto_id: product.id,
            producto_nombre: product.nombre,
            cantidad: 1,
            precio_unitario: product.precio_costo || product.precio,
            subtotal: product.precio_costo || product.precio,
          },
        ],
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateQuantity = (index, cantidad) => {
    const newItems = [...formData.items];
    newItems[index].cantidad = parseInt(cantidad) || 0;
    newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_unitario;
    setFormData({ ...formData, items: newItems });
  };

  const handleUpdatePrice = (index, precio) => {
    const newItems = [...formData.items];
    newItems[index].precio_unitario = parseFloat(precio) || 0;
    newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_unitario;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const getTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.proveedor_id) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (!formData.deposito_id) {
      toast.error('Selecciona un depósito');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    try {
      await purchasesAPI.create(formData);
      toast.success('Orden de compra creada exitosamente');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReceive = async (purchaseId) => {
    try {
      await purchasesAPI.receive(purchaseId);
      toast.success('Compra recibida y stock actualizado');
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' },
      recibida: { label: 'Recibida', variant: 'default' },
      cancelada: { label: 'Cancelada', variant: 'destructive' },
    };
    const config = statusConfig[estado] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="compras-title">
            Órdenes de Compra
          </h1>
          <p className="text-slate-600 mt-1">Gestión de compras a proveedores</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenDialog} data-testid="create-purchase-button">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Compra
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras</CardTitle>
          <CardDescription>
            {purchases.length} orden{purchases.length !== 1 ? 'es' : ''} de compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay órdenes de compra registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Depósito</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{formatDate(purchase.fecha)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-purple-600" />
                          {purchase.proveedor_nombre}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {purchase.deposito_nombre}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(purchase.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.estado)}</TableCell>
                      <TableCell className="text-right">
                        {canReceive && purchase.estado === 'pendiente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReceive(purchase.id)}
                            data-testid={`receive-purchase-${purchase.id}`}
                          >
                            <PackageCheck className="mr-1 h-4 w-4" />
                            Recibir
                          </Button>
                        )}
                        {purchase.estado === 'recibida' && purchase.recibida_por && (
                          <span className="text-xs text-slate-500">
                            Por: {purchase.recibida_por}
                          </span>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription>
              Selecciona proveedor, depósito y productos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor *</Label>
                  <Select
                    value={formData.proveedor_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, proveedor_id: value })
                    }
                  >
                    <SelectTrigger data-testid="purchase-supplier-select">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        .filter((s) => s.activo)
                        .map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposito">Depósito Destino *</Label>
                  <Select
                    value={formData.deposito_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deposito_id: value })
                    }
                  >
                    <SelectTrigger data-testid="purchase-warehouse-select">
                      <SelectValue placeholder="Seleccionar depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter((w) => w.activo)
                        .map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buscar Producto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Nombre o código de barras..."
                    value={searchQuery}
                    onChange={(e) => handleSearchProduct(e.target.value)}
                    className="pl-10"
                    data-testid="purchase-product-search"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border rounded-md shadow-lg mt-1">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="font-medium">{product.nombre}</div>
                        <div className="text-xs text-slate-500">
                          {product.codigo_barras && `Código: ${product.codigo_barras} | `}
                          Stock: {product.stock_actual}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="w-32">Precio Unit.</TableHead>
                        <TableHead className="w-32">Subtotal</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.producto_nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleUpdateQuantity(index, e.target.value)
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                handleUpdatePrice(index, e.target.value)
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="bg-slate-50 p-4 flex justify-end">
                    <div className="text-lg font-bold">
                      Total: {formatCurrency(getTotal())}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Input
                  id="notas"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="purchase-submit-button">
                Crear Orden
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;
