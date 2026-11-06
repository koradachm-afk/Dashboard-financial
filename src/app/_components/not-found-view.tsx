import { Search } from "lucide-react";
import Link from "next/link";

import { homePathFor } from "@/components/admin-nav";
import { ErrorCard } from "@/components/error-card";
import { buttonVariants } from "@/components/tailgrids/core/button";
import { getCurrentUser } from "@/db/auth/auth";

/** Reads the session behind not-found.tsx's Suspense boundary. */
export async function NotFoundView() {
  const user = await getCurrentUser();
  return (
    <ErrorCard
      icon={Search}
      code="404"
      title="ไม่พบหน้าที่ต้องการ"
      description="ลิงก์อาจพิมพ์ผิด หรือหน้านี้ถูกย้ายไปแล้ว ตรวจสอบ URL อีกครั้ง หรือกลับไปหน้าแรก"
      actions={
        <Link href={homePathFor(user)} className={buttonVariants({ variant: "primary" })}>
          กลับไปหน้าแรก
        </Link>
      }
    />
  );
}
