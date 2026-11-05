import ThemeSync from "@/app/(admin)/_components/theme-sync";
import Sidebarmenu, { type SidebarUser } from "@/components/sidebarmenu";
import { getCurrentUser } from "@/db/auth/auth";

/** Reads the session behind Suspense and hands the client sidebar display fields only. */
export default async function SessionSidebar() {
  const user = await getCurrentUser();
  const picked: SidebarUser | null = user
    ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        theme: user.theme,
      }
    : null;
  return (
    <>
      <ThemeSync user={picked} />
      <Sidebarmenu user={picked} />
    </>
  );
}
