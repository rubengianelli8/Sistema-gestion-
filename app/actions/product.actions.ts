"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { productService } from "@/services";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "@/lib/validations/product.schema";
import { requirePermission, Permission } from "@/lib/permissions";
import * as XLSX from "xlsx";

export async function createProductAction(data: ProductCreateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);

    const validatedData = productCreateSchema.parse(data);
    const product = await productService.createProduct(
      validatedData,
      parseInt(session.user.id),
      session.user.name
    );

    return { success: true, data: product, message: "Producto creado exitosamente" };
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

    const product = await productService.getProductById(parseInt(id));
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

export async function updateProductAction(id: string, data: Partial<ProductUpdateInput>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_EDITAR);

    const validatedData = productUpdateSchema.parse(data);
    const product = await productService.updateProduct(
      parseInt(id),
      validatedData,
      parseInt(session.user.id),
      session.user.name
    );

    return { success: true, data: product, message: "Producto actualizado exitosamente" };
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
      session.user.name
    );

    return { success: true, data: result, message: "Producto eliminado exitosamente" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function importProductsAction(base64File: string, fileName: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    requirePermission(session.user.rol, Permission.PRODUCTOS_CREAR);

    // Convertir base64 a buffer
    const binary = atob(base64File);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Leer el archivo Excel
    let workbook: XLSX.WorkBook;
    if (fileName.endsWith('.csv')) {
      const csv = new TextDecoder().decode(bytes);
      workbook = XLSX.read(csv, { type: 'string' });
    } else {
      workbook = XLSX.read(bytes, { type: 'array' });
    }

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      return { success: false, error: "El archivo está vacío o no tiene datos" };
    }

    // Obtener los encabezados (primera fila)
    const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
    
    // Mapear nombres de columnas posibles
    const columnMap: Record<string, string> = {};
    headers.forEach((header, index) => {
      const lower = header.toLowerCase();
      if (lower.includes('nombre') || lower.includes('name')) {
        columnMap.nombre = index;
      } else if (lower.includes('código') || lower.includes('codigo') || lower.includes('barras') || lower.includes('barcode')) {
        columnMap.codigoBarras = index;
      } else if (lower.includes('minorista') || lower.includes('retail') || lower.includes('precio minorista')) {
        columnMap.precioMinorista = index;
      } else if (lower.includes('mayorista') || lower.includes('wholesale') || lower.includes('precio mayorista')) {
        columnMap.precioMayorista = index;
      }
    });

    if (!columnMap.nombre || columnMap.precioMinorista === undefined || columnMap.precioMayorista === undefined) {
      return { 
        success: false, 
        error: "El archivo debe contener las columnas: Nombre, Precio Minorista, Precio Mayorista" 
      };
    }

    const errors: string[] = [];
    let imported = 0;

    // Procesar cada fila (empezando desde la segunda)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const nombre = row[columnMap.nombre] ? String(row[columnMap.nombre]).trim() : "";
        if (!nombre) {
          errors.push(`Fila ${i + 1}: El nombre es requerido`);
          continue;
        }

        const codigoBarras = columnMap.codigoBarras !== undefined && row[columnMap.codigoBarras] 
          ? String(row[columnMap.codigoBarras]).trim() 
          : undefined;

        const precioMinorista = parseFloat(String(row[columnMap.precioMinorista] || 0));
        const precioMayorista = parseFloat(String(row[columnMap.precioMayorista] || 0));

        if (isNaN(precioMinorista) || precioMinorista < 0) {
          errors.push(`Fila ${i + 1}: Precio minorista inválido`);
          continue;
        }

        if (isNaN(precioMayorista) || precioMayorista < 0) {
          errors.push(`Fila ${i + 1}: Precio mayorista inválido`);
          continue;
        }

        const productData: ProductCreateInput = {
          nombre,
          codigoBarras: codigoBarras || undefined,
          precioMinorista,
          precioMayorista,
          stockActual: 0,
          stockMinimo: 0,
        };

        const validatedData = productCreateSchema.parse(productData);
        await productService.createProduct(
          validatedData,
          parseInt(session.user.id),
          session.user.name
        );

        imported++;
      } catch (error) {
        errors.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }

    return {
      success: true,
      data: {
        imported,
        errors: errors.slice(0, 50), // Limitar a 50 errores
        total: data.length - 1,
      },
      message: `Se importaron ${imported} productos exitosamente${errors.length > 0 ? `. ${errors.length} errores.` : ""}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar el archivo Excel",
    };
  }
}
