"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { RhfInput } from "@/components/ui/rhf-input";
import { RhfSelect } from "@/components/ui/rhf-select";
import { createUserAction, updateUserAction } from "@/app/actions/user.actions";
import {
  userCreateYupSchema,
  userUpdateYupSchema,
  type UserCreateFormValues,
  type UserUpdateFormValues,
} from "@/lib/validations/user-form.schema";
import { UserRole } from "@prisma/client";

interface Branch {
  id: number;
  number: number;
  direccion: string | null;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  rol: UserRole;
  estado: boolean;
}

interface UserFormProps {
  user?: UserData | null;
  branches: Branch[];
}

const rolOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "ALMACENERO", label: "Almacenero" },
  { value: "REPOSITOR", label: "Repositor" },
  { value: "CONTADOR", label: "Contador" },
];

export function UserForm({ user, branches }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;

  const [serverError, setServerError] = useState<string | null>(null);

  const branchOptions = branches.map((b) => ({
    value: b.id.toString(),
    label: `Sucursal ${b.number}${b.direccion ? ` — ${b.direccion}` : ""}`,
  }));

  const methods = useForm<UserCreateFormValues | UserUpdateFormValues>({
    resolver: yupResolver(isEdit ? userUpdateYupSchema : userCreateYupSchema) as never,
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      rol: user?.rol ?? "VENDEDOR",
      branchId: branches[0]?.id?.toString() ?? "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);

    if (isEdit) {
      const updateData = data as UserUpdateFormValues;
      const result = await updateUserAction(user.id.toString(), {
        name: updateData.name,
        email: updateData.email,
        password: updateData.password || undefined,
        rol: updateData.rol as UserRole,
      });

      if (!result.success) {
        setServerError(result.error || "Error al actualizar el usuario");
        return;
      }
    } else {
      const createData = data as UserCreateFormValues;
      const result = await createUserAction({
        name: createData.name,
        email: createData.email,
        password: createData.password,
        rol: createData.rol as UserRole,
      });

      if (!result.success) {
        setServerError(result.error || "Error al crear el usuario");
        return;
      }
    }

    router.push("/dashboard/usuarios");
    router.refresh();
  });

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/usuarios")}
        >
          ← Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {serverError}
              </div>
            )}

            <RhfInput
              name="name"
              label="Nombre completo *"
              placeholder="Nombre y apellido"
            />

            <RhfInput
              name="email"
              label="Email *"
              type="email"
              placeholder="usuario@ejemplo.com"
            />

            <RhfInput
              name="password"
              label={isEdit ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
              type="password"
              placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
            />

            <RhfSelect name="rol" label="Rol *" options={rolOptions} />

            {branchOptions.length > 0 && (
              <RhfSelect
                name="branchId"
                label="Sucursal"
                options={branchOptions}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/usuarios")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEdit
                  ? "Actualizar Usuario"
                  : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
