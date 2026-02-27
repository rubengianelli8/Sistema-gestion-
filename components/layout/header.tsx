import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function HeaderUserInfo() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 hidden sm:block">{session.user.name}</span>
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {session.user.rol}
      </span>
    </div>
  );
}
