import { Lock } from "lucide-react";

import { Avatar } from "@/components/tailgrids/core/avatar";
import { ROLE_LABEL, RoleBadge } from "@/components/tailgrids/core/role-badge";
import type { Role, User } from "@/db/user/users";

export type AccountInfo = Pick<User, "username" | "email" | "role" | "createdAt">;

// Figma 09.2 / 09.3: who can change the email differs by role.
const FOOTER_NOTE: Record<Role, string> = {
  superadmin: "แก้ไข email ของบัญชีได้ที่หน้า User & Permissions",
  admin: "ต้องการเปลี่ยน email หรือขอสิทธิ์เพิ่ม โปรดติดต่อ Superadmin",
};

export function AccountInfoCard({ user }: { user: AccountInfo }) {
  const fields = [
    ["Username", user.username],
    ["Email", user.email],
    ["Role", ROLE_LABEL[user.role]],
    ["สร้างเมื่อ", user.createdAt],
  ] as const;

  return (
    <section
      aria-labelledby="account-info-title"
      className="overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-center border-b border-line px-6 py-4">
        <h2 id="account-info-title" className="text-title font-semibold text-fg">
          ข้อมูลบัญชี
        </h2>
      </div>

      <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
        <div className="flex items-center gap-3.5">
          <Avatar username={user.username} className="size-14 bg-primary text-h3 text-on-primary" />
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <p className="max-w-full truncate text-h3 font-semibold text-fg">{user.username}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          {fields.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1 rounded-lg bg-subtle px-3.5 py-2.5">
              <dt className="text-caption font-medium text-fg-3">{label}</dt>
              <dd className="truncate text-control font-medium text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2">
          <Lock size={14} aria-hidden="true" className="shrink-0 text-fg-3" />
          <p className="text-label text-fg-2">{FOOTER_NOTE[user.role]}</p>
        </div>
      </div>
    </section>
  );
}
