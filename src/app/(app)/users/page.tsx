import { listUsers } from "@/modules/auth/services/users-service";
import { UsersManager } from "@/modules/auth/components/users-manager";

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Solo master. Vincula cuentas Auth y activa/desactiva vendedores.
        </p>
      </div>
      <UsersManager users={users} />
    </div>
  );
}
