import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  rol: UserRole;
  businessId?: number | null;
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

  async create(data: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        rol: data.rol,
        ...(data.businessId != null && { businessId: data.businessId }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  async findAll(businessId?: number) {
    return await this.prisma.user.findMany({
      where: {
        ...(businessId != null && { businessId }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.password && { password: data.password }),
        ...(data.rol && { rol: data.rol }),
        ...(data.estado !== undefined && { estado: data.estado }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        rol: true,
        estado: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.user.update({
      where: { id: parseInt(id, 10) },
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

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: parseInt(id, 10) },
    });
    return count > 0;
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        ...(excludeId && { id: { not: parseInt(excludeId, 10) } }),
      },
    });
    return count > 0;
  }
}
