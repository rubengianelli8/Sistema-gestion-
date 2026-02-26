import { UserRepository, CreateUserDto, UpdateUserDto } from "@/repositories/user.repository";
import { hashPassword } from "@/lib/auth";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(data: CreateUserDto) {
    const emailExists = await this.repository.emailExists(data.email);
    if (emailExists) {
      throw new Error("El email ya está registrado");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await this.repository.create({
      ...data,
      password: passwordHash,
    });

    return user;
  }

  async getAllUsers(businessId?: number) {
    return await this.repository.findAll(businessId);
  }

  async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto, currentUserId: string) {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Usuario no encontrado");
    }

    if (id === currentUserId && data.estado === false) {
      throw new Error("No puedes desactivar tu propio usuario");
    }

    if (data.email) {
      const emailExists = await this.repository.emailExists(data.email, id);
      if (emailExists) {
        throw new Error("El email ya está registrado");
      }
    }

    const updateData: UpdateUserDto = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await this.repository.update(id, updateData);

    return user;
  }

  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error("No puedes eliminar tu propio usuario");
    }

    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error("Usuario no encontrado");
    }

    const user = await this.repository.delete(id);

    return user;
  }
}
