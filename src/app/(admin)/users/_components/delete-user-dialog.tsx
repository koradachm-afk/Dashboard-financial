"use client";

import { History, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/tailgrids/core/dialog";
import { RoleBadge } from "@/components/tailgrids/core/role-badge";
import type { User } from "@/db/user/users";

/** 07.7 delete confirm. UI only: "ลบถาวร" just closes, nothing is deleted. */
export function DeleteUserDialog({
  user,
  onClose,
}: {
  user: Pick<User, "username" | "email" | "role"> | null;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      isOpen={user !== null}
      onOpenChange={(open) => !open && onClose()}
      icon={Trash2}
      iconTone="danger"
      title={`ลบผู้ใช้ ${user?.username ?? ""}?`}
      description="บัญชีนี้จะถูกลบถาวรและเข้าสู่ระบบไม่ได้อีก การลบย้อนกลับไม่ได้"
      confirmLabel="ลบถาวร"
      confirmVariant="danger"
      onConfirm={onClose}
      footerNote={
        <span className="flex items-center gap-1.5 text-label text-fg-3">
          <History size={14} aria-hidden />
          บันทึกลง Audit Logs
        </span>
      }
    >
      {user && (
        <div className="flex items-center gap-2 pt-1">
          <span className="min-w-0 truncate text-label text-fg-2">{user.email}</span>
          <RoleBadge role={user.role} className="shrink-0" />
        </div>
      )}
    </ConfirmDialog>
  );
}
