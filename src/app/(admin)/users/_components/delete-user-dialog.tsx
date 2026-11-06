"use client";

import { History, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/tailgrids/core/dialog";
import { FormAlert } from "@/components/tailgrids/core/form-alert";
import { RoleBadge } from "@/components/tailgrids/core/role-badge";
import { audit } from "@/db/audit/audit";
import { deleteUser } from "@/db/user/user-actions";
import type { UserRow } from "@/db/user/users";

const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/** 07.7 delete confirm. "ลบถาวร" deletes on the server, writes the audit entry and reports the toast title via `onDone`. */
export function DeleteUserDialog({
  user,
  onClose,
  onDone,
}: {
  user: Pick<UserRow, "id" | "username" | "email" | "role"> | null;
  onClose: () => void;
  onDone: (toastTitle: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  const confirm = () => {
    if (!user || pending) return;
    setFailed(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof deleteUser>>;
      try {
        r = await deleteUser({ id: user.id });
      } catch {
        setFailed(true);
        return;
      }
      if (!r.ok) {
        setFailed(true);
        return;
      }
      const { username, email } = user;
      audit({
        ...r.audit,
        action: "ลบ",
        page: "User & Permissions",
        detail: `ลบผู้ใช้ ${username}`,
        target: `${username} · ${email}`,
        result: "สำเร็จ",
      });
      onClose();
      router.refresh();
      onDone(`ลบผู้ใช้ ${username} แล้ว`);
    });
  };

  return (
    <ConfirmDialog
      isOpen={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          setFailed(false);
          onClose();
        }
      }}
      icon={Trash2}
      iconTone="danger"
      title={`ลบผู้ใช้ ${user?.username ?? ""}?`}
      description="บัญชีนี้จะถูกลบถาวรและเข้าสู่ระบบไม่ได้อีก การลบย้อนกลับไม่ได้"
      confirmLabel="ลบถาวร"
      confirmVariant="danger-solid"
      pending={pending}
      onConfirm={confirm}
      showCloseButton
      className="w-112"
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
      {failed && (
        <div className="pt-3">
          <FormAlert id="delete-user-error">{ERROR_MESSAGE}</FormAlert>
        </div>
      )}
    </ConfirmDialog>
  );
}
