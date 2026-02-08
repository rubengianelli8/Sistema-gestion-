import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { quotesAPI, productsAPI, customersAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, FileText, Trash2, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Presupuestos = () => {
  const { hasPermission } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    items: [],
    validez_dias: 15,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const canCreate = hasPermission('presupuestos:crear');
  const canConvert = hasPermission('presupuestos:convertir');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadData = async () => {
    try {
      const [quotesRes, productsRes, customersRes] = await Promise.all([
        quotesAPI.getAll().catch(() => ({ data: [] })),
        productsAPI.getAll().catch(() => ({ data: [] })),
        customersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setQuotes(quotesRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await productsAPI.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      cliente_id: '',
      items: [],
      validez_dias: 15,
    });
    setDialogOpen(true);
  };

  const addProduct = (product) => {
    const existingItem = formData.items.find((item) => item.producto_id === product.id);
    
    if (existingItem) {
      setFormData({
        ...formData,
        items: formData.items.map((item) =>
          item.producto_id === product.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
            : item
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            producto_id: product.id,
            producto_nombre: product.nombre,
            cantidad: 1,
            precio_unitario: product.precio_minorista,
            subtotal: product.precio_minorista,
          },
        ],
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.producto_id === productId
          ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precio_unitario }
          : item
      ),
    });
  };

  const removeItem = (productId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.producto_id !== productId),
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cliente_id) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    try {
      await quotesAPI.create(formData);
      toast.success('Presupuesto creado exitosamente');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleConvertToSale = async (quoteId) => {
    try {
      await quotesAPI.convertToSale(quoteId);
      toast.success('Presupuesto convertido a venta exitosamente');
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'default',
      aprobado: 'default',
      rechazado: 'destructive',
      convertido: 'secondary',
    };
    return colors[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="presupuestos-title">
            Presupuestos
          </h1>
          <p className="text-slate-600 mt-1">Gestión de presupuestos y cotizaciones</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenDialog} data-testid="create-quote-button">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos</CardTitle>
          <CardDescription>{quotes.length} presupuestos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay presupuestos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Validez</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{new Date(quote.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {customers.find(c => c.id === quote.cliente_id)?.nombre || 'Cliente'}
                    </TableCell>
                    <TableCell>{quote.items.length}</TableCell>
                    <TableCell className="font-semibold">${quote.total.toFixed(2)}</TableCell>
                    <TableCell>{quote.validez_dias} días</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(quote.estado)}>
                        {quote.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(quote)}
                      >
                        Ver
                      </Button>
                      {canConvert && quote.estado === 'pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConvertToSale(quote.id)}
                          className="text-green-600"
                        >
                          <ArrowRight className="mr-1 h-4 w-4" />
                          Convertir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
            <DialogDescription>Crea un presupuesto para un cliente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Productos</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar producto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer text-sm"
                          onClick={() => addProduct(product)}
                        >
                          <span>{product.nombre}</span>
                          <span className="text-slate-600">${product.precio_minorista}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Productos ({formData.items.length})</Label>
                  {formData.items.length === 0 ? (
                    <div className="text-center py-4 text-sm text-slate-500">
                      No hay productos agregados
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {formData.items.map((item) => (
                        <div key={item.producto_id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.producto_nombre}</p>
                            <p className="text-xs text-slate-500">${item.precio_unitario}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.producto_id, item.cantidad - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{item.cantidad}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.producto_id, item.cantidad + 1)}
                            >
                              +
                            </Button>
                            <span className="w-20 text-right text-sm font-medium">
                              ${item.subtotal.toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.producto_id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Validez (días)</Label>
                  <Input
                    type="number"
                    value={formData.validez_dias}
                    onChange={(e) => setFormData({ ...formData, validez_dias: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="quote-submit-button">
                Crear Presupuesto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Presupuesto</DialogTitle>
            <DialogDescription>
              {selectedQuote && new Date(selectedQuote.fecha).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm">
                    {customers.find(c => c.id === selectedQuote.cliente_id)?.nombre || 'Cliente'}
                  </p>
                </div>
                <div>
                  <Label>Validez</Label>
                  <p className="text-sm">{selectedQuote.validez_dias} días</p>
                </div>
              </div>
              <div>
                <Label>Productos</Label>
                <div className="mt-2 space-y-2">
                  {selectedQuote.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 bg-slate-50 rounded">
                      <span>{item.producto_nombre} x {item.cantidad}</span>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">${selectedQuote.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Presupuestos;
