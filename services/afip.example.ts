/**
 * Ejemplo de uso del servicio de AFIP
 * 
 * Este archivo muestra cómo usar el servicio de facturación AFIP
 */

import { afipService } from "./index";
import { TipoComprobante, CondicionIVA } from "./afip.service";

async function ejemploFacturarVenta() {
  if (!afipService) {
    console.error("El servicio de AFIP no está configurado. Verifica las variables de entorno.");
    return;
  }

  try {
    // Ejemplo 1: Facturar una venta existente
    const ventaId = 1; // ID de la venta a facturar
    const tipoComprobante: TipoComprobante = 6; // Factura B
    const condicionIVA: CondicionIVA = 5; // Consumidor Final

    const resultado = await afipService.facturarVenta(
      ventaId,
      tipoComprobante,
      condicionIVA
    );

    console.log("Factura creada exitosamente:");
    console.log(`CAE: ${resultado.cae}`);
    console.log(`Número de comprobante: ${resultado.numeroComprobante}`);
    console.log(`Punto de venta: ${resultado.puntoVenta}`);
    console.log(`Fecha de vencimiento CAE: ${resultado.caeFchVto}`);
    console.log(`Importe total: $${resultado.importeTotal}`);
  } catch (error: any) {
    console.error("Error al facturar:", error.message);
  }
}

async function ejemploCrearFacturaDirecta() {
  if (!afipService) {
    console.error("El servicio de AFIP no está configurado.");
    return;
  }

  try {
    // Ejemplo 2: Crear una factura directamente con datos personalizados
    const resultado = await afipService.crearFactura({
      tipoComprobante: 6, // Factura B
      condicionIVA: 5, // Consumidor Final
      clienteNombre: "Juan Pérez",
      items: [
        {
          codigo: "PROD-001",
          descripcion: "Producto de ejemplo",
          cantidad: 2,
          precioUnitario: 1000,
          iva: 21, // 21% de IVA
          importe: 2420, // 2000 + 420 de IVA
        },
      ],
    });

    console.log("Factura creada:", resultado);
  } catch (error: any) {
    console.error("Error al crear factura:", error.message);
  }
}

async function ejemploObtenerUltimoComprobante() {
  if (!afipService) {
    console.error("El servicio de AFIP no está configurado.");
    return;
  }

  try {
    // Ejemplo 3: Obtener el último número de comprobante autorizado
    const ultimoNumero = await afipService.obtenerUltimoComprobanteAutorizado(
      1, // Punto de venta
      6  // Tipo de comprobante (Factura B)
    );

    console.log(`Último comprobante autorizado: ${ultimoNumero}`);
    console.log(`Próximo número a usar: ${ultimoNumero + 1}`);
  } catch (error: any) {
    console.error("Error al obtener último comprobante:", error.message);
  }
}

async function ejemploValidarConfiguracion() {
  if (!afipService) {
    console.error("El servicio de AFIP no está configurado.");
    return;
  }

  try {
    // Ejemplo 4: Validar la configuración de AFIP
    const esValida = await afipService.validarConfiguracion();
    
    if (esValida) {
      console.log("✅ La configuración de AFIP es válida");
    } else {
      console.error("❌ La configuración de AFIP no es válida");
    }
  } catch (error: any) {
    console.error("Error al validar configuración:", error.message);
  }
}

// Exportar ejemplos para uso en otros archivos
export {
  ejemploFacturarVenta,
  ejemploCrearFacturaDirecta,
  ejemploObtenerUltimoComprobante,
  ejemploValidarConfiguracion,
};

