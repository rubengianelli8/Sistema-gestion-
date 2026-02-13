import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllQuotesAction } from "@/app/actions/quote.actions";
import { getAllCustomersAction } from "@/app/actions/customer.actions";
import { getAllProductsAction } from "@/app/actions/product.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { QuotesTable } from "@/components/quotes/quotes-table";

export default async function PresupuestosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.PRESUPUESTOS_VER);
  } catch {
    redirect("/dashboard");
  }

  const [quotesResult, customersResult, productsResult] = await Promise.all([
    getAllQuotesAction(),
    getAllCustomersAction(),
    getAllProductsAction(),
  ]);

  if (!quotesResult.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Presupuestos</h1>
        <p className="text-red-600">Error: {quotesResult.error}</p>
      </div>
    );
  }

  const quotes = quotesResult.data || [];
  const customers = customersResult.success ? customersResult.data || [] : [];
  const products = productsResult.success ? productsResult.data || [] : [];

  return (
    <div className="p-6">
      <QuotesTable quotes={quotes} customers={customers} products={products} />
    </div>
  );
}

