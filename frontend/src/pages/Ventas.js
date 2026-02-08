import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI, customersAPI } from '../services/api';
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
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Plus, ShoppingCart, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const Ventas = () => {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos');
  
  // POS State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Sale Details Dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const canCreate = hasPermission('ventas:crear');
  const canAnular = hasPermission('ventas:anular');

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
      const [salesRes, productsRes, customersRes] = await Promise.all([
        salesAPI.getAll().catch(() => ({ data: [] })),
        productsAPI.getAll().catch(() => ({ data: [] })),
        customersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setSales(salesRes.data);
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

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.producto_id === product.id);
    
    if (existingItem) {
      if (existingItem.cantidad >= product.stock_actual) {
        toast.error('No hay suficiente stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.producto_id === product.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
            : item
        )
      );
    } else {
      if (product.stock_actual === 0) {
        toast.error('Producto sin stock');
        return;
      }
      setCart([
        ...cart,
        {
          producto_id: product.id,
          producto_nombre: product.nombre,
          cantidad: 1,
          precio_unitario: product.precio_minorista,
          subtotal: product.precio_minorista,
        },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    const product = products.find((p) => p.id === productId);
    if (newQuantity > product.stock_actual) {
      toast.error('No hay suficiente stock');
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.producto_id === productId
          ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precio_unitario }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.producto_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    try {
      const saleData = {
        cliente_id: selectedCustomer || null,
        items: cart,
        metodo_pago: paymentMethod,
      };

      await salesAPI.create(saleData);
      toast.success('Venta creada exitosamente');
      
      // Reset
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('efectivo');
      loadData();
      setActiveTab('historial');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAnularSale = async (saleId) => {
    try {
      await salesAPI.anular(saleId);
      toast.success('Venta anulada exitosamente');
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" data-testid="ventas-title">
          Ventas
        </h1>
        <p className="text-slate-600 mt-1">Punto de venta e historial</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pos" disabled={!canCreate}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Punto de Venta
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* POS Tab */}
        <TabsContent value="pos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Product Search and Cart */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Productos</CardTitle>
                  <CardDescription>Escanea o busca productos para agregar al carrito</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nombre o código de barras..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="product-search-pos"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-medium">{product.nombre}</p>
                            <p className="text-sm text-slate-500">
                              Stock: {product.stock_actual} | ${product.precio_minorista}
                            </p>
                          </div>
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Carrito ({cart.length} items)</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      El carrito está vacío
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.producto_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.producto_nombre}</p>
                            <p className="text-sm text-slate-500">${item.precio_unitario} c/u</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.producto_id, item.cantidad - 1)}
                              >
                                -
                              </Button>
                              <span className="w-12 text-center font-medium">{item.cantidad}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.producto_id, item.cantidad + 1)}
                              >
                                +
                              </Button>
                            </div>
                            <div className="w-24 text-right font-semibold">
                              ${item.subtotal.toFixed(2)}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.producto_id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Sale Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Resumen de Venta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente (Opcional)</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin cliente</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateSale}
                    disabled={cart.length === 0}
                    data-testid="complete-sale-button"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Completar Venta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>{sales.length} ventas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay ventas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.fecha).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.cliente_id ? customers.find(c => c.id === sale.cliente_id)?.nombre || 'Cliente' : '-'}</TableCell>
                        <TableCell>{sale.items.length}</TableCell>
                        <TableCell className="font-semibold">${sale.total.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{sale.metodo_pago}</TableCell>
                        <TableCell>
                          <Badge variant={sale.estado === 'completada' ? 'default' : 'destructive'}>
                            {sale.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(sale)}
                          >
                            Ver
                          </Button>
                          {canAnular && sale.estado === 'completada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAnularSale(sale.id)}
                              className="text-red-600"
                            >
                              Anular
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
        </TabsContent>
      </Tabs>

      {/* Sale Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
            <DialogDescription>
              {selectedSale && new Date(selectedSale.fecha).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendedor</Label>
                  <p className="text-sm">{selectedSale.vendedor_nombre}</p>
                </div>
                <div>
                  <Label>Método de Pago</Label>
                  <p className="text-sm capitalize">{selectedSale.metodo_pago}</p>
                </div>
              </div>
              <div>
                <Label>Productos</Label>
                <div className="mt-2 space-y-2">
                  {selectedSale.items.map((item, index) => (
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
                  <span className="text-blue-600">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ventas;
