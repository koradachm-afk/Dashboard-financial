import { Lock, Mail } from "lucide-react";
import Link from "next/link";

import { homePathFor, NAV } from "@/components/admin-nav";
import { ErrorCard } from "@/components/error-card";
import { buttonVariants } from "@/components/tailgrids/core/button";
import { getCurrentUser } from "@/db/auth/auth";
import { getUsers } from "@/db/user/users";

const CONTACT = "หากต้องการสิทธิ์ โปรดติดต่อ Superadmin ขององค์กร";

/** Page name for a `from` key, or null when unknown. Only labels from NAV are ever shown, never the raw value. */
function labelFor(from: unknown): string | null {
  if (typeof from !== "string") return null;
  return NAV.flatMap((g) => g.items).find((i) => i.pages.some((p) => p === from))?.label ?? null;
}

function descriptionFor(from: unknown): string {
  if (from === "users") return `หน้า User & Permissions ใช้ได้เฉพาะ Superadmin ${CONTACT}`;
  const label = labelFor(from);
  return `คุณยังไม่ได้รับสิทธิ์เข้าหน้า${label ? ` ${label}` : "นี้"} ${CONTACT}`;
}

/** Reads the session and `?from=` behind the page's Suspense boundary. */
export async function ForbiddenView({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const [{ from }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const superadmin = getUsers().find((u) => u.role === "superadmin");

  return (
    <div className="flex h-full items-center justify-center">
      <ErrorCard
        icon={Lock}
        code="403"
        title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
        description={descriptionFor(from)}
        actions={
          <>
            {superadmin && (
              <a href={`mailto:${superadmin.email}`} className={buttonVariants({ variant: "secondary" })}>
                <Mail size={16} className="shrink-0" aria-hidden />
                ติดต่อ Superadmin
              </a>
            )}
            <Link href={homePathFor(user)} className={buttonVariants({ variant: "primary" })}>
              กลับไปหน้าแรก
            </Link>
          </>
        }
      />
    </div>
  );
}
