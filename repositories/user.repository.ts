import prisma from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  rol: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  rol?: UserRole;
  estado?: boolean;
}

export class UserRepository {
  private prisma = prisma;

  /**
   * Create a new user
   */
  async create(data: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password, // Should be hashed before calling
        rol: data.rol,
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  /**
   * Find all users
   */
  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.password && { password: data.password }), // Should be hashed before calling
        ...(data.rol && { rol: data.rol }),
        ...(data.estado !== undefined && { estado: data.estado }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  /**
   * Delete (deactivate) user
   */
  async delete(id: string) {
    return await this.prisma.user.update({
      where: { id },
      data: { estado: false },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
      },
    });
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}

