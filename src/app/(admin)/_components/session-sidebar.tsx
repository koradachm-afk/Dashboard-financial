import Sidebarmenu from "@/components/sidebarmenu";
import { getCurrentUser } from "@/db/auth/auth";

/** Reads the session behind Suspense and hands the client sidebar display fields only. */
export default async function SessionSidebar() {
  const user = await getCurrentUser();
  return (
    <Sidebarmenu
      user={
        user
          ? {
              username: user.username,
              email: user.email,
              role: user.role,
              permissions: user.permissions,
            }
          : null
      }
    />
  );
}
