"use client";

import { Check, ShieldCheck } from "lucide-react";

import { ConfirmDialog } from "@/components/tailgrids/core/dialog";

const GRANTS = [
  "เข้าถึงได้ทุกหน้า (แก้ไขได้ทั้งหมด)",
  "เพิ่ม แก้ไข และลบผู้ใช้คนอื่นได้",
  "สิทธิ์รายหน้าที่ตั้งไว้จะถูกแทนที่ด้วยสิทธิ์เต็ม",
];

/** 07.5 confirm before promoting a user from Admin to Superadmin. */
export function RoleChangeDialog({
  username,
  isOpen,
  onConfirm,
  onCancel,
}: {
  username: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      icon={ShieldCheck}
      iconTone="warning"
      title={`เปลี่ยน ${username} เป็น Superadmin?`}
      description="ผู้ใช้นี้จะได้รับสิทธิ์ต่อไปนี้ทันทีหลังบันทึก"
      confirmLabel="ยืนยันเปลี่ยนเป็น Superadmin"
      onConfirm={onConfirm}
      layout="stacked"
    >
      <ul className="flex flex-col gap-2 rounded-lg bg-subtle p-3">
        {GRANTS.map((text) => (
          <li key={text} className="flex items-center gap-2 text-body text-fg">
            <Check size={14} className="shrink-0 text-primary" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </ConfirmDialog>
  );
}
