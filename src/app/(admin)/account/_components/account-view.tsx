import { redirect } from "next/navigation";

import { getCurrentUser } from "@/db/auth/auth";

import { AccountInfoCard, type AccountInfo } from "./account-info-card";
import { ChangePasswordCard } from "./change-password-card";
import { PermissionsCard, type AccountPermissions } from "./permissions-card";

/** Reads the session behind Suspense (the page's boundary) and hands the cards display fields only. */
export async function AccountView() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const picked: AccountInfo & AccountPermissions = {
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    permissions: user.permissions,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-fg">บัญชีของฉัน</h1>
        <p className="text-body text-fg-2">ข้อมูลบัญชี รหัสผ่าน และสิทธิ์การใช้งานของคุณ</p>
      </header>

      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <AccountInfoCard user={picked} />
          <PermissionsCard user={picked} />
        </div>
        <div className="w-110 shrink-0">
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
