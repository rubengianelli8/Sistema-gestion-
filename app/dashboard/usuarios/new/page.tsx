import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getBranchesByBusinessAction } from "@/app/actions/branch.actions";
import { UserForm } from "@/components/users/user-form";

export default async function NuevoUsuarioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.USUARIOS_CREAR);
  } catch {
    redirect("/dashboard");
  }

  const branchesResult = await getBranchesByBusinessAction();
  const branches = branchesResult.data ?? [];

  return (
    <div className="p-6">
      <UserForm branches={branches} />
    </div>
  );
}
