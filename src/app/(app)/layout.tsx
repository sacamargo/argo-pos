import { redirect } from "next/navigation";
import { getCurrentProfile, signOut } from "@/modules/auth/services/auth-service";
import { AppSidebar } from "@/modules/shared/components/app-sidebar";
import type { Role } from "@/modules/core/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      <AppSidebar
        role={profile.role as Role}
        fullName={profile.full_name}
        signOutAction={signOutAction}
      />
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
