"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  LogOut,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/modules/shared/lib/cn";
import { ThemeToggle } from "@/modules/shared/components/theme-toggle";
import { canAccessRoute } from "@/modules/core/permissions";
import type { Role } from "@/modules/core/constants";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Ventas", icon: Receipt },
  { href: "/catalog", label: "Productos", icon: Package },
  { href: "/inventory", label: "Stock", icon: Boxes },
  { href: "/users", label: "Usuarios", icon: Users },
];

type AppSidebarProps = {
  role: Role;
  fullName: string;
  signOutAction: () => Promise<void>;
};

export function AppSidebar({ role, fullName, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => canAccessRoute(role, item.href));

  return (
    <aside className="flex h-screen w-[88px] shrink-0 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-sidebar)] py-4">
      <Link
        href="/pos"
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-sm font-bold text-white shadow-[var(--shadow-sm)]"
        aria-label="Argo POS"
      >
        A
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-[72px] flex-col items-center gap-1 rounded-[var(--radius-lg)] px-2 py-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <ThemeToggle />
        <p
          className="max-w-[72px] truncate text-center text-[10px] text-[var(--color-muted)]"
          title={fullName}
        >
          {fullName}
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)]"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
