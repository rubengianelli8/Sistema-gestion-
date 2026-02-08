import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
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
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

const Usuarios = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'vendedor',
  });

  const canCreate = hasPermission('usuarios:crear');
  const canEdit = hasPermission('usuarios:editar');
  const canDelete = hasPermission('usuarios:eliminar');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '', // Don't show password
        rol: user.rol,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'vendedor',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const updateData = {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
        };
        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersAPI.update(editingUser.id, updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Create user using register endpoint
        const { register } = await import('../context/AuthContext');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Error al crear usuario');
        }
        
        toast.success('Usuario creado exitosamente');
      }
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(userToDelete.id);
      toast.success('Usuario desactivado exitosamente');
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (rol) => {
    const roles = {
      admin: 'Administrador',
      vendedor: 'Vendedor',
      almacenero: 'Almacenero',
      contador: 'Contador',
    };
    return roles[rol] || rol;
  };

  const getRolColor = (rol) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      vendedor: 'bg-blue-100 text-blue-800',
      almacenero: 'bg-green-100 text-green-800',
      contador: 'bg-orange-100 text-orange-800',
    };
    return colors[rol] || 'bg-slate-100 text-slate-800';
  };

  const filteredUsers = users.filter((user) =>
    user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count users by role
  const userStats = {
    total: users.length,
    activos: users.filter(u => u.estado).length,
    inactivos: users.filter(u => !u.estado).length,
    admin: users.filter(u => u.rol === 'admin').length,
    vendedor: users.filter(u => u.rol === 'vendedor').length,
    almacenero: users.filter(u => u.rol === 'almacenero').length,
    contador: users.filter(u => u.rol === 'contador').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="usuarios-title">
            Usuarios
          </h1>
          <p className="text-slate-600 mt-1">Gestión de usuarios y permisos</p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenDialog()} data-testid="create-user-button">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userStats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userStats.inactivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-medium">{userStats.admin}</span>
              </div>
              <div className="flex justify-between">
                <span>Vendedor:</span>
                <span className="font-medium">{userStats.vendedor}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="user-search-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(user.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.nombre}</p>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">Tú</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRolColor(user.rol)}>
                        {getRoleName(user.rol)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.estado ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <UserCheck className="mr-1 h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <UserX className="mr-1 h-3 w-3" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <span className="text-sm text-slate-600">
                          {new Date(user.last_login).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {canEdit && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToDelete(user);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Actualiza los datos del usuario' : 'Ingresa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  data-testid="user-nombre-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="user-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Dejar vacío para mantener actual' : ''}
                  data-testid="user-password-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value) => setFormData({ ...formData, rol: value })}
                  required
                >
                  <SelectTrigger data-testid="user-rol-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="almacenero">Almacenero</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {formData.rol === 'admin' && 'Acceso total al sistema'}
                  {formData.rol === 'vendedor' && 'Ventas, clientes y presupuestos'}
                  {formData.rol === 'almacenero' && 'Productos e inventario'}
                  {formData.rol === 'contador' && 'Solo lectura de ventas y reportes'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="user-submit-button">
                {editingUser ? 'Actualizar' : 'Crear'}
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
              Esta acción desactivará al usuario "{userToDelete?.nombre}". 
              El usuario no podrá acceder al sistema pero sus datos se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
