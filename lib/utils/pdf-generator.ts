import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface QuotePDFData {
  id: number;
  fecha: Date;
  cliente: {
    nombre: string;
    dni?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  total: number;
  validezDias: number;
  notas?: string | null;
  items: Array<{
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

export function generateQuotePDF(quote: QuotePDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PRESUPUESTO", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Número de presupuesto
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${quote.id}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Fecha
  const fecha = new Date(quote.fecha);
  doc.setFontSize(10);
  doc.text(
    `Fecha: ${fecha.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })}`,
    pageWidth - 20,
    yPosition,
    { align: "right" },
  );
  yPosition += 15;

  // Información del cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${quote.cliente.nombre}`, 20, yPosition);
  yPosition += 5;

  if (quote.cliente.dni) {
    doc.text(`DNI: ${quote.cliente.dni}`, 20, yPosition);
    yPosition += 5;
  }

  if (quote.cliente.telefono) {
    doc.text(`Teléfono: ${quote.cliente.telefono}`, 20, yPosition);
    yPosition += 5;
  }

  if (quote.cliente.email) {
    doc.text(`Email: ${quote.cliente.email}`, 20, yPosition);
    yPosition += 5;
  }

  if (quote.cliente.direccion) {
    doc.text(`Dirección: ${quote.cliente.direccion}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Tabla de productos
  autoTable(doc, {
    startY: yPosition,
    head: [["Producto", "Cantidad", "Precio Unit.", "Subtotal"]],
    body: quote.items.map((item) => [
      "NOMBRE DE PRODUCTO HARDCODEADO",
      item.cantidad.toString(),
      `$${item.precioUnitario.toFixed(2)}`,
      `$${item.subtotal.toFixed(2)}`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: "bold" },
    margin: { left: 20, right: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${quote.total.toFixed(2)}`, pageWidth - 20, finalY + 10, {
    align: "right",
  });

  // Validez
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Validez: ${quote.validezDias} días`, pageWidth - 20, finalY + 20, {
    align: "right",
  });

  // Fecha de vencimiento
  const fechaVencimiento = new Date(fecha);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + quote.validezDias);
  doc.text(
    `Válido hasta: ${fechaVencimiento.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })}`,
    pageWidth - 20,
    finalY + 25,
    { align: "right" },
  );

  // Notas
  if (quote.notas) {
    doc.setFontSize(10);
    doc.text("Notas:", 20, finalY + 35);
    const splitNotas = doc.splitTextToSize(quote.notas, pageWidth - 40);
    doc.text(splitNotas, 20, finalY + 40);
  }

  // Vendedor
  doc.setFontSize(9);
  doc.text(
    `Vendedor: NOMBRE DE VENDEDOR HARDCODEADO`,
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" },
  );

  // Descargar PDF
  doc.save(`presupuesto-${quote.id}.pdf`);
}
