import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/permissions";
import { getBranchesByBusinessAction } from "@/app/actions/branch.actions";
import { getUserByIdAction } from "@/app/actions/user.actions";
import { UserForm } from "@/components/users/user-form";

interface EditUsuarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarUsuarioPage({ params }: EditUsuarioPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    requirePermission(session.user.rol, Permission.USUARIOS_EDITAR);
  } catch {
    redirect("/dashboard");
  }

  const [userResult, branchesResult] = await Promise.all([
    getUserByIdAction(id),
    getBranchesByBusinessAction(),
  ]);

  if (!userResult.success || !userResult.data) {
    notFound();
  }

  const branches = branchesResult.data ?? [];

  return (
    <div className="p-6">
      <UserForm user={userResult.data} branches={branches} />
    </div>
  );
}
