# Servicio de Facturación AFIP

Este servicio permite facturar ventas electrónicamente a través de AFIP (Administración Federal de Ingresos Públicos de Argentina).

## Instalación

Primero, instala la librería necesaria:

```bash
npm install afip.js
```

## Configuración

Agrega las siguientes variables de entorno en tu archivo `.env`:

```env
# Configuración AFIP
AFIP_CUIT=20123456789                    # CUIT del contribuyente (sin guiones)
AFIP_PUNTO_VENTA=1                       # Número de punto de venta
AFIP_AMBIENTE=testing                    # "testing" o "production"

# Opción 1: Rutas a archivos de certificado y clave
AFIP_CERT_PATH=./certificados/cert.pem
AFIP_KEY_PATH=./certificados/key.pem

# Opción 2: Contenido del certificado y clave (base64 o texto)
AFIP_CERT_CONTENT=-----BEGIN CERTIFICATE-----...
AFIP_KEY_CONTENT=-----BEGIN PRIVATE KEY-----...
```

### Obtención de Certificados

Para obtener los certificados necesarios:

1. **Registrarse en AFIP**: Debes tener una clave fiscal nivel 3 o superior
2. **Generar certificado**: Usa la herramienta de AFIP para generar tu certificado digital
3. **Habilitar Web Services**: En AFIP, habilita el servicio "Wsfe" (Web Service de Facturación Electrónica)
4. **Configurar punto de venta**: Configura tu punto de venta en AFIP

### Ambiente de Testing

Para pruebas, puedes usar el ambiente de homologación de AFIP:
- **CUIT de prueba**: 20111111111
- **Ambiente**: `testing`
- Los certificados de prueba se pueden obtener desde el portal de AFIP

## Uso

### Facturar una Venta Existente

```typescript
import { afipService } from "@/services";

if (afipService) {
  try {
    const resultado = await afipService.facturarVenta(
      ventaId,           // ID de la venta
      6,                 // Tipo de comprobante (1: Factura A, 6: Factura B, 11: Factura C)
      5                  // Condición IVA (5: Consumidor Final)
    );

    console.log(`Factura creada: ${resultado.numeroComprobante}`);
    console.log(`CAE: ${resultado.cae}`);
  } catch (error) {
    console.error("Error al facturar:", error);
  }
}
```

### Crear Factura Directamente

```typescript
import { afipService } from "@/services";

if (afipService) {
  const resultado = await afipService.crearFactura({
    tipoComprobante: 6,  // Factura B
    condicionIVA: 5,     // Consumidor Final
    clienteNombre: "Juan Pérez",
    clienteCUIT: "20123456789",  // Opcional
    items: [
      {
        codigo: "PROD-001",
        descripcion: "Producto ejemplo",
        cantidad: 2,
        precioUnitario: 1000,
        iva: 21,          // Porcentaje de IVA
        importe: 2420,   // Total con IVA
      },
    ],
  });
}
```

### Obtener Último Comprobante

```typescript
const ultimoNumero = await afipService.obtenerUltimoComprobanteAutorizado(
  1,  // Punto de venta
  6   // Tipo de comprobante
);
```

### Validar Configuración

```typescript
const esValida = await afipService.validarConfiguracion();
if (esValida) {
  console.log("Configuración válida");
}
```

## Tipos de Comprobantes

- **1**: Factura A (Responsables Inscriptos)
- **6**: Factura B (Consumidores Finales, Monotributistas)
- **11**: Factura C (Sin facturación)

## Condiciones de IVA

- **1**: IVA Responsable Inscripto
- **4**: IVA Sujeto Exento
- **5**: Consumidor Final
- **6**: Responsable Monotributo

## Campos Agregados al Modelo Sale

El servicio agrega los siguientes campos al modelo `Sale`:

- `facturaAFIP`: Boolean - Indica si la venta está facturada
- `facturaNumero`: Int - Número de comprobante
- `facturaCAE`: String - Código de Autorización Electrónico
- `facturaCAEFchVto`: DateTime - Fecha de vencimiento del CAE
- `facturaPuntoVenta`: Int - Punto de venta utilizado
- `facturaTipo`: Int - Tipo de comprobante (1, 6, 11)

## Migración de Base de Datos

Después de actualizar el schema, ejecuta la migración:

```bash
npm run db:push
# o
npm run db:migrate
```

## Manejo de Errores

El servicio lanza errores descriptivos en caso de problemas:

- `"Cliente AFIP no inicializado"`: La librería afip.js no está instalada
- `"Venta no encontrada"`: La venta con el ID proporcionado no existe
- `"Esta venta ya está facturada"`: La venta ya tiene una factura AFIP asociada
- `"Error al crear factura en AFIP"`: Error en la comunicación con AFIP

## Notas Importantes

1. **Ambiente de Producción**: Asegúrate de usar certificados válidos en producción
2. **CAE**: El CAE tiene una fecha de vencimiento. Las facturas deben emitirse antes de esa fecha
3. **Punto de Venta**: Debe estar habilitado en AFIP
4. **Límites**: AFIP tiene límites en la cantidad de comprobantes que se pueden emitir por día

## Referencias

- [Documentación oficial de AFIP](https://www.afip.gob.ar/fe/)
- [Librería afip.js](https://github.com/afipsdk/afip.js)

