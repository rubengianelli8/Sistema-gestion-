import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function Header() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sistema de Gestión</h2>
        {session?.user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {session.user.rol}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

