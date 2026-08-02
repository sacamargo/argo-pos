import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components";

type CreateUserFormProps = {
  busy: boolean;
  username: string;
  password: string;
  role: "admin" | "vendedor";
  onUsername: (value: string) => void;
  onPassword: (value: string) => void;
  onRole: (value: "admin" | "vendedor") => void;
  onSubmit: () => void;
};

export function CreateUserForm({
  busy,
  username,
  password,
  role,
  onUsername,
  onPassword,
  onRole,
  onSubmit,
}: CreateUserFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo usuario</CardTitle>
        <CardDescription>Admin o vendedor</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Usuario</span>
          <Input
            value={username}
            onChange={(event) => onUsername(event.target.value)}
            disabled={busy}
            autoComplete="off"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Contraseña</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => onPassword(event.target.value)}
            disabled={busy}
            autoComplete="new-password"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Rol</span>
          <select
            className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={role}
            onChange={(event) => onRole(event.target.value as "admin" | "vendedor")}
            disabled={busy}
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Button disabled={busy} onClick={onSubmit}>
          {busy ? "Creando…" : "Crear usuario"}
        </Button>
      </CardContent>
    </Card>
  );
}

type ChangePasswordFormProps = {
  busy: boolean;
  username: string;
  password: string;
  onPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ChangePasswordForm({
  busy,
  username,
  password,
  onPassword,
  onSubmit,
  onCancel,
}: ChangePasswordFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>{username}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          type="password"
          value={password}
          onChange={(event) => onPassword(event.target.value)}
          disabled={busy}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
        />
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={busy || password.length < 6} onClick={onSubmit}>
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoleBadge({ role }: { role: "admin" | "vendedor" }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"}>
      {role === "admin" ? "Admin" : "Vendedor"}
    </Badge>
  );
}
