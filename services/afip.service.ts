import prisma from "@/lib/prisma";

// Tipos para AFIP
export type TipoComprobante = 1 | 6 | 11; // 1: Factura A, 6: Factura B, 11: Factura C
export type CondicionIVA = 1 | 4 | 5 | 6; // 1: IVA Responsable Inscripto, 4: IVA Sujeto Exento, 5: Consumidor Final, 6: Responsable Monotributo

export interface AfipConfig {
  cuit: string;
  certPath?: string;
  keyPath?: string;
  certContent?: string;
  keyContent?: string;
  puntoVenta: number;
  ambiente: "testing" | "production";
}

export interface FacturaItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  iva: number; // Porcentaje de IVA (ej: 21 para 21%)
  importe: number;
}

export interface DatosFacturacion {
  tipoComprobante: TipoComprobante;
  condicionIVA: CondicionIVA;
  clienteCUIT?: string;
  clienteNombre: string;
  clienteDomicilio?: string;
  items: FacturaItem[];
  fechaComprobante?: Date;
  concepto?: number; // 1: Productos, 2: Servicios, 3: Productos y Servicios
}

export interface ResultadoFacturacion {
  cae: string;
  caeFchVto: string;
  puntoVenta: number;
  numeroComprobante: number;
  fechaEmision: string;
  importeTotal: number;
  importeNeto: number;
  importeIVA: number;
}

export class AfipService {
  private config: AfipConfig;
  private afipClient: any; // Se inicializará con la librería afip.js

  constructor(config: AfipConfig) {
    this.config = config;
    this.initializeAfipClient();
  }

  private initializeAfipClient() {
    // Nota: Necesitarás instalar la librería afip.js
    // npm install afip.js
    // o usar @afip/afip.js
    
    try {
      // Intentar cargar la librería afip.js
      const Afip = require("afip.js");
      
      this.afipClient = new Afip({
        CUIT: this.config.cuit,
        cert: this.config.certContent || this.config.certPath,
        key: this.config.keyContent || this.config.keyPath,
        production: this.config.ambiente === "production",
      });
    } catch (error) {
      console.warn("Librería afip.js no encontrada. Instala con: npm install afip.js");
      // En modo desarrollo, podemos simular la respuesta
      this.afipClient = null;
    }
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  async obtenerUltimoComprobanteAutorizado(
    puntoVenta: number,
    tipoComprobante: TipoComprobante
  ): Promise<number> {
    if (!this.afipClient) {
      throw new Error("Cliente AFIP no inicializado. Instala afip.js");
    }

    try {
      const ultimoComprobante = await this.afipClient.ElectronicBilling.getLastVoucher(
        puntoVenta,
        tipoComprobante
      );

      return ultimoComprobante || 0;
    } catch (error: any) {
      throw new Error(`Error al obtener último comprobante: ${error.message}`);
    }
  }

  /**
   * Crea una factura electrónica en AFIP
   */
  async crearFactura(datos: DatosFacturacion): Promise<ResultadoFacturacion> {
    if (!this.afipClient) {
      throw new Error("Cliente AFIP no inicializado. Instala afip.js");
    }

    try {
      // Obtener último número de comprobante
      const ultimoComprobante = await this.obtenerUltimoComprobanteAutorizado(
        this.config.puntoVenta,
        datos.tipoComprobante
      );

      const numeroComprobante = ultimoComprobante + 1;

      // Preparar datos para AFIP
      const datosAFIP = {
        CantReg: 1, // Cantidad de comprobantes a registrar
        PtoVta: this.config.puntoVenta,
        CbteTipo: datos.tipoComprobante,
        Concepto: datos.concepto || 1, // 1: Productos
        DocTipo: datos.clienteCUIT ? 80 : 99, // 80: CUIT, 99: Sin identificar
        DocNro: datos.clienteCUIT ? parseInt(datos.clienteCUIT.replace(/-/g, "")) : 0,
        CbteDesde: numeroComprobante,
        CbteHasta: numeroComprobante,
        CbteFch: this.formatearFecha(datos.fechaComprobante || new Date()),
        ImpTotal: this.calcularTotal(datos.items),
        ImpTotConc: 0, // Importe neto no gravado
        ImpNeto: this.calcularNeto(datos.items),
        ImpOpEx: 0, // Importe exento
        ImpIVA: this.calcularIVA(datos.items),
        ImpTrib: 0, // Importe de tributos
        MonId: "PES", // Moneda: Peso Argentino
        MonCotiz: 1, // Cotización de la moneda
        Iva: this.obtenerAlicuotasIVA(datos.items),
      };

      // Agregar datos del cliente si es factura A o B
      if (datos.tipoComprobante === 1 || datos.tipoComprobante === 6) {
        datosAFIP.DocTipo = datos.clienteCUIT ? 80 : 99;
        datosAFIP.DocNro = datos.clienteCUIT ? parseInt(datos.clienteCUIT.replace(/-/g, "")) : 0;
      }

      // Crear la factura
      const resultado = await this.afipClient.ElectronicBilling.createVoucher(datosAFIP);

      if (resultado.CAE) {
        return {
          cae: resultado.CAE,
          caeFchVto: resultado.CAEFchVto,
          puntoVenta: this.config.puntoVenta,
          numeroComprobante: numeroComprobante,
          fechaEmision: this.formatearFecha(new Date()),
          importeTotal: this.calcularTotal(datos.items),
          importeNeto: this.calcularNeto(datos.items),
          importeIVA: this.calcularIVA(datos.items),
        };
      } else {
        throw new Error("No se recibió CAE de AFIP");
      }
    } catch (error: any) {
      throw new Error(`Error al crear factura en AFIP: ${error.message}`);
    }
  }

  /**
   * Factura una venta existente
   */
  async facturarVenta(
    ventaId: number,
    tipoComprobante: TipoComprobante,
    condicionIVA: CondicionIVA
  ): Promise<ResultadoFacturacion> {
    // Obtener la venta con sus items y cliente
    const venta = await prisma.sale.findUnique({
      where: { id: ventaId },
      include: {
        cliente: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!venta) {
      throw new Error("Venta no encontrada");
    }

    if (venta.facturaAFIP) {
      throw new Error("Esta venta ya está facturada en AFIP");
    }

    // Determinar tipo de comprobante según condición IVA del cliente
    // Si no hay cliente o es consumidor final, usar Factura B o C
    const tipoComprobanteFinal = tipoComprobante || (venta.cliente ? 6 : 11);

    // Preparar items para facturación
    const itemsFactura: FacturaItem[] = venta.items.map((item) => ({
      codigo: item.producto.codigoBarras || `PROD-${item.productoId}`,
      descripcion: item.productoNombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      iva: 21, // IVA general (puedes ajustar según tu necesidad)
      importe: item.subtotal,
    }));

    // Preparar datos de facturación
    const datosFacturacion: DatosFacturacion = {
      tipoComprobante: tipoComprobanteFinal,
      condicionIVA: condicionIVA || (venta.cliente ? 1 : 5),
      clienteCUIT: venta.cliente?.dni || undefined,
      clienteNombre: venta.cliente?.nombre || "Consumidor Final",
      clienteDomicilio: venta.cliente?.direccion || undefined,
      items: itemsFactura,
      fechaComprobante: venta.fecha,
      concepto: 1, // Productos
    };

    // Crear la factura en AFIP
    const resultado = await this.crearFactura(datosFacturacion);

    // Actualizar la venta con los datos de la factura
    await prisma.sale.update({
      where: { id: ventaId },
      data: {
        facturaAFIP: true,
        facturaNumero: resultado.numeroComprobante,
        facturaCAE: resultado.cae,
        facturaCAEFchVto: new Date(resultado.caeFchVto),
        facturaPuntoVenta: resultado.puntoVenta,
        facturaTipo: tipoComprobanteFinal,
      },
    });

    return resultado;
  }

  /**
   * Obtiene información de un comprobante por CAE
   */
  async obtenerComprobantePorCAE(cae: string): Promise<any> {
    if (!this.afipClient) {
      throw new Error("Cliente AFIP no inicializado. Instala afip.js");
    }

    try {
      const comprobante = await this.afipClient.ElectronicBilling.getVoucherInfo(
        this.config.puntoVenta,
        1, // Tipo comprobante (ajustar según necesidad)
        cae
      );

      return comprobante;
    } catch (error: any) {
      throw new Error(`Error al obtener comprobante: ${error.message}`);
    }
  }

  /**
   * Calcula el total de los items
   */
  private calcularTotal(items: FacturaItem[]): number {
    return items.reduce((sum, item) => sum + item.importe, 0);
  }

  /**
   * Calcula el neto gravado (sin IVA)
   */
  private calcularNeto(items: FacturaItem[]): number {
    return items.reduce((sum, item) => {
      const importeSinIVA = item.importe / (1 + item.iva / 100);
      return sum + importeSinIVA;
    }, 0);
  }

  /**
   * Calcula el IVA total
   */
  private calcularIVA(items: FacturaItem[]): number {
    return items.reduce((sum, item) => {
      const importeSinIVA = item.importe / (1 + item.iva / 100);
      const iva = item.importe - importeSinIVA;
      return sum + iva;
    }, 0);
  }

  /**
   * Obtiene las alícuotas de IVA para AFIP
   */
  private obtenerAlicuotasIVA(items: FacturaItem[]): any[] {
    // Agrupar por alícuota de IVA
    const alicuotasMap = new Map<number, number>();

    items.forEach((item) => {
      const importeSinIVA = item.importe / (1 + item.iva / 100);
      const iva = item.importe - importeSinIVA;

      const alicuotaId = this.obtenerIdAlicuotaIVA(item.iva);
      const ivaActual = alicuotasMap.get(alicuotaId) || 0;
      alicuotasMap.set(alicuotaId, ivaActual + iva);
    });

    // Convertir a formato AFIP
    const alicuotas: any[] = [];
    alicuotasMap.forEach((baseImp, id) => {
      const importeSinIVA = this.calcularBaseImp(items, id);
      alicuotas.push({
        Id: id,
        BaseImp: importeSinIVA,
        Importe: baseImp,
      });
    });

    return alicuotas;
  }

  /**
   * Obtiene el ID de alícuota IVA según el porcentaje
   */
  private obtenerIdAlicuotaIVA(porcentaje: number): number {
    // IDs de alícuotas IVA según AFIP
    const alicuotas: Record<number, number> = {
      0: 3, // 0% - No gravado
      10.5: 4, // 10.5%
      21: 5, // 21%
      27: 6, // 27%
    };

    return alicuotas[porcentaje] || 5; // Por defecto 21%
  }

  /**
   * Calcula la base imponible para una alícuota específica
   */
  private calcularBaseImp(items: FacturaItem[], alicuotaId: number): number {
    return items.reduce((sum, item) => {
      if (this.obtenerIdAlicuotaIVA(item.iva) === alicuotaId) {
        const importeSinIVA = item.importe / (1 + item.iva / 100);
        return sum + importeSinIVA;
      }
      return sum;
    }, 0);
  }

  /**
   * Formatea la fecha para AFIP (AAAAMMDD)
   */
  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  /**
   * Valida la configuración de AFIP
   */
  async validarConfiguracion(): Promise<boolean> {
    if (!this.afipClient) {
      return false;
    }

    try {
      // Intentar obtener el último comprobante como prueba
      await this.obtenerUltimoComprobanteAutorizado(this.config.puntoVenta, 1);
      return true;
    } catch (error) {
      return false;
    }
  }
}

