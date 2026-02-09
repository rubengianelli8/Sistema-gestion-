import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsAPI, categoriesAPI, supplierPricesAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Plus, Pencil, Trash2, Search, Upload, Download, DollarSign, TrendingDown, Building2, QrCode, DownloadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const Productos = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceCompareOpen, setPriceCompareOpen] = useState(false);
  const [priceCompareData, setPriceCompareData] = useState(null);
  const [priceCompareLoading, setPriceCompareLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrProduct, setQrProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo_barras: '',
    categoria_id: '',
    precio_minorista: '',
    precio_mayorista: '',
    stock_actual: '',
    stock_minimo: '',
  });

  const canCreate = hasPermission('productos:crear');
  const canEdit = hasPermission('productos:editar');
  const canDelete = hasPermission('productos:eliminar');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        codigo_barras: product.codigo_barras || '',
        categoria_id: product.categoria_id || '',
        precio_minorista: product.precio_minorista,
        precio_mayorista: product.precio_mayorista,
        stock_actual: product.stock_actual,
        stock_minimo: product.stock_minimo,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigo_barras: '',
        categoria_id: '',
        precio_minorista: '',
        precio_mayorista: '',
        stock_actual: '',
        stock_minimo: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        precio_minorista: parseFloat(formData.precio_minorista),
        precio_mayorista: parseFloat(formData.precio_mayorista),
        stock_actual: parseInt(formData.stock_actual),
        stock_minimo: parseInt(formData.stock_minimo),
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productsAPI.create(data);
        toast.success('Producto creado exitosamente');
      }
      setDialogOpen(false);
      loadProducts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await productsAPI.delete(productToDelete.id);
      toast.success('Producto eliminado exitosamente');
      setDeleteDialogOpen(false);
      loadProducts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await productsAPI.importExcel(file);
      toast.success(
        `Importación completada: ${response.data.productos_creados} creados, ${response.data.productos_actualizados} actualizados`
      );
      loadProducts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    try {
      const response = await productsAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'productos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Productos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar productos');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.codigo_barras?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleComparePrices = async (product) => {
    setPriceCompareLoading(true);
    setPriceCompareOpen(true);
    try {
      const response = await supplierPricesAPI.comparePrices(product.id);
      setPriceCompareData(response.data);
    } catch (error) {
      toast.error('Error al cargar precios de proveedores');
      setPriceCompareOpen(false);
    } finally {
      setPriceCompareLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const calculateSavings = (currentPrice, bestPrice) => {
    if (!currentPrice || !bestPrice) return null;
    const savings = ((currentPrice - bestPrice) / currentPrice) * 100;
    return savings > 0 ? savings.toFixed(1) : null;
  };

  const handleOpenQrDialog = (product) => {
    setQrProduct(product);
    setQrDialogOpen(true);
  };

  const generateQrData = (product) => {
    return JSON.stringify({
      type: 'FERRETERIA_PRODUCT',
      id: product.id,
      nombre: product.nombre,
      precio: product.precio_minorista,
      codigo: product.codigo_barras || `QR-${product.id.slice(0, 8)}`
    });
  };

  const handleDownloadQr = () => {
    if (!qrProduct) return;
    
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 380;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code centered
      ctx.drawImage(img, 50, 20, 200, 200);
      
      // Add product info text
      ctx.fillStyle = 'black';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(qrProduct.nombre.slice(0, 30), 150, 250);
      
      ctx.font = '12px Arial';
      ctx.fillText(`Código: ${qrProduct.codigo_barras || 'QR-' + qrProduct.id.slice(0, 8)}`, 150, 275);
      
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`$${qrProduct.precio_minorista}`, 150, 300);
      
      // Download
      const link = document.createElement('a');
      link.download = `QR_${qrProduct.nombre.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Código QR descargado');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="productos-title">
            Productos
          </h1>
          <p className="text-slate-600 mt-1">Gestión de productos e inventario</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="import-excel"
              />
              <Button variant="outline" onClick={() => document.getElementById('import-excel').click()}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={() => handleOpenDialog()} data-testid="create-product-button">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Productos</CardTitle>
              <CardDescription>
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="product-search-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Precio Min.</TableHead>
                  <TableHead>Precio May.</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.nombre}</TableCell>
                    <TableCell>{product.codigo_barras || '-'}</TableCell>
                    <TableCell>${product.precio_minorista}</TableCell>
                    <TableCell>${product.precio_mayorista}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stock_actual <= product.stock_minimo ? 'destructive' : 'secondary'}
                      >
                        {product.stock_actual}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenQrDialog(product)}
                        title="Generar código QR"
                        data-testid={`generate-qr-${product.id}`}
                      >
                        <QrCode className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComparePrices(product)}
                        title="Comparar precios de proveedores"
                        data-testid={`compare-prices-${product.id}`}
                      >
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProductToDelete(product);
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Actualiza los datos del producto' : 'Ingresa los datos del nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  data-testid="product-nombre-input"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_barras">Código de Barras</Label>
                <Input
                  id="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria_id">Categoría</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_minorista">Precio Minorista *</Label>
                <Input
                  id="precio_minorista"
                  type="number"
                  step="0.01"
                  value={formData.precio_minorista}
                  onChange={(e) => setFormData({ ...formData, precio_minorista: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_mayorista">Precio Mayorista *</Label>
                <Input
                  id="precio_mayorista"
                  type="number"
                  step="0.01"
                  value={formData.precio_mayorista}
                  onChange={(e) => setFormData({ ...formData, precio_mayorista: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_actual">Stock Actual *</Label>
                <Input
                  id="stock_actual"
                  type="number"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="product-submit-button">
                {editingProduct ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto "{productToDelete?.nombre}".
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

      {/* Price Comparison Dialog */}
      <Dialog open={priceCompareOpen} onOpenChange={setPriceCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Comparativa de Precios
            </DialogTitle>
            <DialogDescription>
              {priceCompareData?.producto?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          {priceCompareLoading ? (
            <div className="text-center py-8">Cargando precios...</div>
          ) : priceCompareData ? (
            <div className="space-y-4">
              {/* Best Price Highlight */}
              {priceCompareData.mejor_precio && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Mejor Precio Encontrado</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(priceCompareData.mejor_precio.precio)}
                      </p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <Building2 className="h-4 w-4" />
                        {priceCompareData.mejor_precio.proveedor_nombre}
                      </p>
                    </div>
                    {priceCompareData.producto?.precio_minorista && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Tu precio actual</p>
                        <p className="text-lg font-semibold text-slate-600">
                          {formatCurrency(priceCompareData.producto.precio_minorista)}
                        </p>
                        {calculateSavings(
                          priceCompareData.producto.precio_minorista,
                          priceCompareData.mejor_precio.precio
                        ) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                            Ahorra {calculateSavings(
                              priceCompareData.producto.precio_minorista,
                              priceCompareData.mejor_precio.precio
                            )}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price List */}
              {priceCompareData.precios.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {priceCompareData.total_proveedores} proveedor{priceCompareData.total_proveedores !== 1 ? 'es' : ''} con precio registrado
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Código Proveedor</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceCompareData.precios.map((price, index) => (
                        <TableRow 
                          key={price.id || index}
                          className={index === 0 ? 'bg-green-50' : ''}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Badge variant="default" className="bg-green-600">
                                  Mejor
                                </Badge>
                              )}
                              {price.proveedor_nombre}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {price.codigo_proveedor || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(price.precio)}
                          </TableCell>
                          <TableCell className="text-right">
                            {index > 0 && priceCompareData.mejor_precio && (
                              <span className="text-red-600 text-sm">
                                +{formatCurrency(price.precio - priceCompareData.mejor_precio.precio)}
                              </span>
                            )}
                            {index === 0 && (
                              <span className="text-green-600 text-sm font-medium">
                                Mejor opción
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No hay precios de proveedores registrados para este producto.</p>
                  <p className="text-sm mt-1">
                    Puedes agregar precios desde el módulo de Proveedores.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceCompareOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Código QR del Producto
            </DialogTitle>
            <DialogDescription>
              {qrProduct?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          {qrProduct && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={generateQrData(qrProduct)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Producto:</span>
                  <span className="text-sm font-medium">{qrProduct.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Código:</span>
                  <span className="text-sm font-mono">
                    {qrProduct.codigo_barras || `QR-${qrProduct.id.slice(0, 8)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Precio Minorista:</span>
                  <span className="text-sm font-bold text-green-600">
                    ${qrProduct.precio_minorista}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 text-center">
                Este QR puede ser escaneado desde el módulo de Ventas para agregar el producto al carrito.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleDownloadQr} data-testid="download-qr-button">
              <DownloadCloud className="mr-2 h-4 w-4" />
              Descargar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Productos;
