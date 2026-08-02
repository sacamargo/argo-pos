import { LoginForm } from "@/modules/auth/components/login-form";
import { ThemeToggle } from "@/modules/shared/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-accent-muted),_var(--color-background)_45%)] p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </main>
  );
}
