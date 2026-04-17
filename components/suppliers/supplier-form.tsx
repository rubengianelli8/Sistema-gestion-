"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSupplierAction,
  updateSupplierAction,
} from "@/app/actions/supplier.actions";
import { toast } from "sonner";
import type { SupplierCreateInput } from "@/lib/validations/supplier.schema";
import type { Supplier } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

interface SupplierFormProps {
  supplier?: Supplier | null;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const isEdit = !!supplier?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    cuit: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        nombre: supplier.nombre ?? "",
        contacto: supplier.contacto ?? "",
        email: supplier.email ?? "",
        telefono: supplier.telefono ?? "",
        direccion: supplier.direccion ?? "",
        cuit: supplier.cuit ?? "",
      });
    } else {
      setFormData({
        nombre: "",
        contacto: "",
        email: "",
        telefono: "",
        direccion: "",
        cuit: "",
      });
    }
    setError(null);
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: SupplierCreateInput = {
        nombre: formData.nombre,
        contacto: formData.contacto || undefined,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        cuit: formData.cuit || undefined,
      };

      if (supplier?.id) {
        const result = await updateSupplierAction(
          supplier.id.toString(),
          data,
        );
        if (!result.success) {
          const msg = result.error || "Error al actualizar el proveedor";
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Proveedor actualizado exitosamente");
      } else {
        const result = await createSupplierAction(data);
        if (!result.success) {
          const msg = result.error || "Error al crear el proveedor";
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Proveedor creado exitosamente");
      }

      router.push("/dashboard/proveedores");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/proveedores")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            required
            placeholder="Razón social o nombre"
          />
        </div>

        <div>
          <Label htmlFor="contacto">Contacto</Label>
          <Input
            id="contacto"
            value={formData.contacto}
            onChange={(e) =>
              setFormData({ ...formData, contacto: e.target.value })
            }
            placeholder="Persona de contacto"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="email@ejemplo.com"
          />
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) =>
              setFormData({ ...formData, telefono: e.target.value })
            }
            placeholder="Número de teléfono"
          />
        </div>

        <div>
          <Label htmlFor="cuit">CUIT</Label>
          <Input
            id="cuit"
            value={formData.cuit}
            onChange={(e) =>
              setFormData({ ...formData, cuit: e.target.value })
            }
            placeholder="CUIT / CUIL"
          />
        </div>

        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) =>
              setFormData({ ...formData, direccion: e.target.value })
            }
            placeholder="Dirección completa"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/proveedores")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}
