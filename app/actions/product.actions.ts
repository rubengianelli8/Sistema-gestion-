"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { productService } from "@/services";
import { requirePermission, Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

interface SupplierPriceInput {
  proveedorId: number;
  precio: number;
  codigoProveedor?: string;
}

interface ProductInput {
  nombre: string;
  descripcion?: string;
  codigoBarras?: string;
  imagenUrl?: string;
  categoriaId?: number | null;
  unitId?: number | null;
  stock?: number;
  stockMinimo?: number;
  supplierPrices?: SupplierPriceInput[];
}

export async function createProductAction(data: ProductInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);

    const branchId = session.user.branchId;
    if (!branchId) {
      return { success: false, error: "No se encontró la sucursal del usuario" };
    }

    const { supplierPrices, ...productData } = data;

    const product = await productService.createProduct(
      {
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        codigoBarras: productData.codigoBarras,
        imagenUrl: productData.imagenUrl,
        categoriaId: productData.categoriaId ?? undefined,
        unitId: productData.unitId ?? undefined,
        stock: productData.stock ?? 0,
        stockMinimo: productData.stockMinimo ?? 0,
        branchId,
      },
      parseInt(session.user.id),
      session.user.name,
    );

    if (supplierPrices && supplierPrices.length > 0) {
      await Promise.all(
        supplierPrices.map((sp) =>
          prisma.supplierPrice.upsert({
            where: {
              productoId_proveedorId: {
                productoId: product.id,
                proveedorId: sp.proveedorId,
              },
            },
            update: {
              precio: sp.precio,
              codigoProveedor: sp.codigoProveedor,
            },
            create: {
              productoId: product.id,
              proveedorId: sp.proveedorId,
              precio: sp.precio,
              codigoProveedor: sp.codigoProveedor,
            },
          }),
        ),
      );
    }

    return {
      success: true,
      data: product,
      message: "Producto creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getProductByIdAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        Unit: true,
        supplierPrices: {
          include: { proveedor: true },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getAllProductsAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const products = await productService.getAllProducts();
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function searchProductsAction(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_VER);

    const products = await productService.searchProducts(query);
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateProductAction(id: string, data: Partial<ProductInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);

    const { supplierPrices, ...productData } = data;

    const product = await productService.updateProduct(
      parseInt(id),
      {
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        codigoBarras: productData.codigoBarras,
        imagenUrl: productData.imagenUrl,
        categoriaId: productData.categoriaId ?? undefined,
        unitId: productData.unitId ?? undefined,
        stock: productData.stock,
        stockMinimo: productData.stockMinimo,
      },
      parseInt(session.user.id),
      session.user.name,
    );

    if (supplierPrices !== undefined) {
      // Eliminar precios que ya no están en la lista
      const incomingProveedorIds = supplierPrices.map((sp) => sp.proveedorId);
      await prisma.supplierPrice.deleteMany({
        where: {
          productoId: parseInt(id),
          proveedorId: { notIn: incomingProveedorIds },
        },
      });

      // Upsert los precios actuales
      if (supplierPrices.length > 0) {
        await Promise.all(
          supplierPrices.map((sp) =>
            prisma.supplierPrice.upsert({
              where: {
                productoId_proveedorId: {
                  productoId: parseInt(id),
                  proveedorId: sp.proveedorId,
                },
              },
              update: {
                precio: sp.precio,
                codigoProveedor: sp.codigoProveedor,
              },
              create: {
                productoId: parseInt(id),
                proveedorId: sp.proveedorId,
                precio: sp.precio,
                codigoProveedor: sp.codigoProveedor,
              },
            }),
          ),
        );
      }
    }

    return {
      success: true,
      data: product,
      message: "Producto actualizado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_ELIMINAR);

    const result = await productService.deleteProduct(
      parseInt(id),
      parseInt(session.user.id),
      session.user.name,
    );

    return {
      success: true,
      data: result,
      message: "Producto eliminado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
