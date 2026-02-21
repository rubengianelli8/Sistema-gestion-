import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllCustomersAction } from "@/app/actions/customer.actions";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { CustomersTable } from "@/components/customers/customers-table";

export default async function ClientesPage() {
  console.log("acaa")
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.CLIENTES_VER);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAllCustomersAction();
  console.log(result)

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Clientes</h1>
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    );
  }

  const customers = result.data || [];

  return (
    <div className="p-6">
      <CustomersTable customers={customers} />
    </div>
  );
}

