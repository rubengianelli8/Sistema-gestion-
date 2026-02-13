"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "./quote-form";
import { getQuoteByIdAction } from "@/app/actions/quote.actions";
import { generateQuotePDF } from "@/lib/utils/pdf-generator";
import { Plus, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface Quote {
  id: number;
  clienteId: number;
  vendedorNombre: string;
  total: number;
  estado: string;
  validezDias: number;
  fecha: Date;
  cliente: {
    nombre: string;
    dni?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  items: Array<{
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

interface QuotesTableProps {
  quotes: Quote[];
  customers: Array<{ id: number; nombre: string }>;
  products: Array<{
    id: number;
    nombre: string;
    precioMinorista: number;
  }>;
}

export function QuotesTable({
  quotes: initialQuotes,
  customers,
  products,
}: QuotesTableProps) {
  const router = useRouter();
  const [quotes] = useState(initialQuotes);
  const [formOpen, setFormOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);

  const handleFormSuccess = () => {
    router.refresh();
  };

  const handleDownloadPDF = async (quoteId: number) => {
    setGeneratingPDF(quoteId);
    try {
      const result = await getQuoteByIdAction(quoteId.toString());
      if (result.success && result.data) {
        generateQuotePDF(result.data);
      } else {
        alert("Error al obtener los datos del presupuesto");
      }
    } catch (error) {
      alert("Error al generar el PDF");
    } finally {
      setGeneratingPDF(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Fecha</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Cliente</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Vendedor</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay presupuestos registrados
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">#{quote.id}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(quote.fecha).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {quote.cliente.nombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {quote.vendedorNombre}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{quote.estado}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">
                    ${quote.total.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(quote.id)}
                      disabled={generatingPDF === quote.id}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      {generatingPDF === quote.id ? "Generando..." : "PDF"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <QuoteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customers={customers}
        products={products}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

