"use server";

import { requireBranchContext, tenantActionError, productScope } from "@/lib/tenant-context";
import { productService } from "@/services";
import { requirePermission, Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { deleteFileFromS3ByUrl } from "@/lib/s3";

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
  precio?: number;
  supplierPrices?: SupplierPriceInput[];
}

export async function createProductAction(data: ProductInput) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_CREAR);

    const { supplierPrices, ...productData } = data;

    const product = await productService.createProduct(
      context,
      {
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        codigoBarras: productData.codigoBarras,
        imagenUrl: productData.imagenUrl,
        categoriaId: productData.categoriaId,
        unitId: productData.unitId,
        stock: productData.stock ?? 0,
        stockMinimo: productData.stockMinimo ?? 0,
        precio: productData.precio ?? 0,
      },
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
      error: tenantActionError(error),
    };
  }
}

export async function getProductByIdAction(id: string) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const product = await productService.getProductById(context, parseInt(id, 10));

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function getAllProductsAction() {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const products = await productService.getAllProducts(context);
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function getPaginatedProductsAction(params: {
  q?: string;
  page: number;
  pageSize: number;
}) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const data = await productService.getPaginatedProducts(context, params);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function searchProductsAction(query: string) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_VER);

    const products = await productService.searchProducts(context, query);
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}

export async function updateProductAction(id: string, data: Partial<ProductInput>) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_EDITAR);

    const productId = parseInt(id);
    const { supplierPrices, ...productData } = data;
    const existingProduct = await productService.getProductById(context, productId);

    const product = await productService.updateProduct(
      context,
      productId,
      {
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        codigoBarras: productData.codigoBarras,
        imagenUrl: productData.imagenUrl,
        categoriaId: productData.categoriaId,
        unitId: productData.unitId,
        stock: productData.stock,
        stockMinimo: productData.stockMinimo,
        precio: productData.precio,
      },
    );

    if (supplierPrices !== undefined) {
      // Eliminar precios que ya no están en la lista
      const incomingProveedorIds = supplierPrices.map((sp) => sp.proveedorId);
      await prisma.supplierPrice.deleteMany({
        where: {
          productoId: productId,
          producto: productScope(context),
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
                  productoId: productId,
                  proveedorId: sp.proveedorId,
                },
              },
              update: {
                precio: sp.precio,
                codigoProveedor: sp.codigoProveedor,
              },
              create: {
                productoId: productId,
                proveedorId: sp.proveedorId,
                precio: sp.precio,
                codigoProveedor: sp.codigoProveedor,
              },
            }),
          ),
        );
      }
    }

    const previousImage = existingProduct?.imagenUrl ?? null;
    const currentImage = product.imagenUrl ?? null;
    if (previousImage && previousImage !== currentImage) {
      try {
        await deleteFileFromS3ByUrl(previousImage);
      } catch {
        // Evita bloquear la actualización del producto por fallas al limpiar archivos viejos.
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
      error: tenantActionError(error),
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const context = await requireBranchContext();

    requirePermission(context.rol, Permission.PRODUCTOS_ELIMINAR);

    const result = await productService.deleteProduct(
      context,
      parseInt(id),
    );

    return {
      success: true,
      data: result,
      message: "Producto eliminado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error: tenantActionError(error),
    };
  }
}
