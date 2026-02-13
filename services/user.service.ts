import { UserRepository, CreateUserDto, UpdateUserDto } from "@/repositories/user.repository";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto) {
    // Check if email already exists
    const emailExists = await this.repository.emailExists(data.email);
    if (emailExists) {
      throw new Error("El email ya está registrado");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.repository.create({
      ...data,
      password: passwordHash,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        usuarioId: user.id,
        usuarioNombre: user.name,
        accion: "crear",
        modulo: "usuarios",
        detalles: `Usuario creado: ${user.email}`,
      },
    });

    return user;
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    return await this.repository.findAll();
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto, currentUserId: string) {
    // Check if user exists
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Usuario no encontrado");
    }

    // Cannot delete yourself
    if (id === currentUserId && data.estado === false) {
      throw new Error("No puedes desactivar tu propio usuario");
    }

    // Check if email is being changed and already exists
    if (data.email) {
      const emailExists = await this.repository.emailExists(data.email, id);
      if (emailExists) {
        throw new Error("El email ya está registrado");
      }
    }

    // Hash password if provided
    const updateData: UpdateUserDto = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // Update user
    const user = await this.repository.update(id, updateData);

    // Get current user for audit
    const currentUser = await this.repository.findById(currentUserId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUser?.name || "Sistema",
        accion: "actualizar",
        modulo: "usuarios",
        detalles: `Usuario actualizado: ${id}`,
      },
    });

    return user;
  }

  /**
   * Delete (deactivate) user
   */
  async deleteUser(id: string, currentUserId: string) {
    // Cannot delete yourself
    if (id === currentUserId) {
      throw new Error("No puedes eliminar tu propio usuario");
    }

    // Check if user exists
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Usuario no encontrado");
    }

    // Deactivate user
    const user = await this.repository.delete(id);

    // Get current user for audit
    const currentUser = await this.repository.findById(currentUserId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        usuarioId: currentUserId,
        usuarioNombre: currentUser?.name || "Sistema",
        accion: "eliminar",
        modulo: "usuarios",
        detalles: `Usuario desactivado: ${id}`,
      },
    });

    return user;
  }
}

