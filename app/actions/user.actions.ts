"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/services";
import { userCreateSchema, userUpdateSchema, type UserCreateInput, type UserUpdateInput } from "@/lib/validations/user.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export async function createUserAction(data: UserCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.USUARIOS_CREAR);

    // Validate data
    const validatedData = userCreateSchema.parse(data);

    const user = await userService.createUser(validatedData);

    return {
      success: true,
      data: user,
      message: "Usuario creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllUsersAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.USUARIOS_VER);

    const users = await userService.getAllUsers();

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getUserByIdAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.USUARIOS_VER);

    const user = await userService.getUserById(id);

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateUserAction(id: string, data: Partial<UserUpdateInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.USUARIOS_EDITAR);

    // Validate data
    const validatedData = userUpdateSchema.parse(data);

    const user = await userService.updateUser(id, validatedData, session.user.id);

    return {
      success: true,
      data: user,
      message: "Usuario actualizado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.USUARIOS_ELIMINAR);

    const user = await userService.deleteUser(id, session.user.id);

    return {
      success: true,
      data: user,
      message: "Usuario desactivado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

