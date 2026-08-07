import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { ManagedUser } from "@/domain/entities/user";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import {
  ChangePasswordForm,
  CreateUserForm,
  RoleBadge,
} from "@/modules/users/components/users-forms";
import { useSessionStore } from "@/shared/hooks/use-session";
import { notify } from "@/shared/hooks/use-toast";
import { getErrorMessage } from "@/shared/utils/error-message";

export function UsersScreen() {
  const sessionUser = useSessionStore((state) => state.user);
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "vendedor">("vendedor");

  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const reload = useCallback(async () => {
    const { users } = await getAppServices();
    setRows(await users.list());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "No se pudieron cargar los usuarios"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const createUser = async () => {
    setBusy(true);
    setError(null);
    try {
      const { users } = await getAppServices();
      await users.create({ username, password, role });
      setUsername("");
      setPassword("");
      setRole("vendedor");
      await reload();
      notify({ tone: "success", title: "Usuario creado", description: username });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo crear el usuario");
      setError(message);
      notify({ tone: "error", title: "Usuarios", description: message });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (user: ManagedUser) => {
    setBusy(true);
    setError(null);
    try {
      const { users } = await getAppServices();
      await users.setActive({ id: user.id, active: !user.active });
      await reload();
      notify({
        tone: "success",
        title: user.active ? "Usuario desactivado" : "Usuario activado",
        description: user.username,
      });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo cambiar el estado");
      setError(message);
      notify({ tone: "error", title: "Usuarios", description: message });
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!passwordUserId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { users } = await getAppServices();
      await users.changePassword({ id: passwordUserId, password: newPassword });
      setPasswordUserId(null);
      setNewPassword("");
      await reload();
      notify({ tone: "success", title: "Contraseña actualizada" });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo cambiar la contraseña");
      setError(message);
      notify({ tone: "error", title: "Usuarios", description: message });
    } finally {
      setBusy(false);
    }
  };

  const passwordTarget = rows.find((row) => row.id === passwordUserId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Solo admin. No se puede desactivar el último admin activo.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateUserForm
          busy={busy}
          username={username}
          password={password}
          role={role}
          onUsername={setUsername}
          onPassword={setPassword}
          onRole={setRole}
          onSubmit={() => void createUser()}
        />
        {passwordTarget ? (
          <ChangePasswordForm
            busy={busy}
            username={passwordTarget.username}
            password={newPassword}
            onPassword={setNewPassword}
            onSubmit={() => void savePassword()}
            onCancel={() => {
              setPasswordUserId(null);
              setNewPassword("");
            }}
          />
        ) : (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              Elige “Contraseña” en un usuario para resetearla.
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {!loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => {
                  const isSelf = sessionUser?.id === user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "success" : "secondary"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setPasswordUserId(user.id);
                            setNewPassword("");
                          }}
                        >
                          Contraseña
                        </Button>
                        <Button
                          size="sm"
                          variant={user.active ? "destructive" : "secondary"}
                          disabled={busy}
                          onClick={() => void toggleActive(user)}
                        >
                          {user.active ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
