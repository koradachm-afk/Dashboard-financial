"use client";

import Image from "next/image";
import { Building2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { siteConfig } from "@/config/site";
import { audit } from "@/db/audit/audit";
import { setSettings, useSettings } from "@/db/settings/settings";
import { cn } from "@/utils/cn";

const MAX_FILE_SIZE = 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function validateLogo(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error("ไฟล์ต้องมีขนาดไม่เกิน 1 MB");

  if (file.type === "image/png") {
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width < 256 || bitmap.height < 256 || bitmap.width !== bitmap.height) {
        throw new Error("รูปโลโก้ต้องเป็นสี่เหลี่ยมจัตุรัส ขนาดอย่างน้อย 256 × 256 px");
      }
    } finally {
      bitmap.close();
    }
    return readAsDataUrl(file);
  }

  if (file.type !== "image/svg+xml") {
    throw new Error("รองรับเฉพาะไฟล์ PNG หรือ SVG");
  }

  const source = await file.text();
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  if (root.localName !== "svg" || document.querySelector("parsererror")) {
    throw new Error("ไฟล์ SVG ไม่ถูกต้อง");
  }

  const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const width = viewBox?.length === 4 ? viewBox[2] : Number.parseFloat(root.getAttribute("width") ?? "");
  const height = viewBox?.length === 4 ? viewBox[3] : Number.parseFloat(root.getAttribute("height") ?? "");
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 256 || height < 256 || width !== height) {
    throw new Error("รูปโลโก้ต้องเป็นสี่เหลี่ยมจัตุรัส ขนาดอย่างน้อย 256 × 256 px");
  }

  document.querySelectorAll("script,foreignObject,iframe,object,embed,style").forEach((node) => node.remove());
  document.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (
        name.startsWith("on") ||
        (name.endsWith("href") && value && !value.startsWith("#")) ||
        value.includes("url(") ||
        value.includes("@import")
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return readAsDataUrl(new Blob([new XMLSerializer().serializeToString(root)], {
    type: "image/svg+xml",
  }));
}

function BrandMark({ logo, size = "size-9" }: { logo: string | null; size?: string }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-on-primary", size)}>
      {logo ? (
        <Image src={logo} alt="" fill unoptimized sizes="64px" className="object-contain" />
      ) : (
        <Building2 size={22} aria-hidden />
      )}
    </span>
  );
}

export function BranchSettingsTab({
  actor,
  role,
  onSaved,
}: {
  actor: string;
  role: "Superadmin" | "Admin";
  onSaved: () => void;
}) {
  const settings = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<{ branchName: string; branchLogo: string | null } | null>(null);
  const [error, setError] = useState("");

  const branchName = draft?.branchName ?? settings.branchName;
  const branchLogo = draft ? draft.branchLogo : settings.branchLogo;

  async function chooseLogo(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const logo = await validateLogo(file);
      setDraft((current) => ({
        branchName: current?.branchName ?? settings.branchName,
        branchLogo: logo,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ไม่สามารถใช้ไฟล์นี้ได้");
    }
  }

  function save() {
    const name = branchName.trim();
    if (!name) {
      setError("กรุณากรอกชื่อสาขา");
      return;
    }

    const next = { ...settings, branchName: name, branchLogo };
    setSettings(next);
    audit({
      ip: "127.0.0.1",
      actor,
      role,
      action: "แก้ไข",
      page: "System Settings",
      detail: "แก้ไขข้อมูลสาขา",
      target: "System Settings · ข้อมูลสาขา",
      device: "Admin Web",
      result: "สำเร็จ",
      title: "แก้ไขข้อมูลสาขา",
      changes: [
        ...(settings.branchName !== name
          ? [{ field: "ชื่อสาขา", before: settings.branchName, after: name }]
          : []),
        ...(settings.branchLogo !== branchLogo
          ? [{ field: "โลโก้", before: settings.branchLogo ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า", after: branchLogo ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้งค่า" }]
          : []),
      ],
    });
    setDraft(null);
    setError("");
    onSaved();
  }

  function cancel() {
    setDraft(null);
    setError("");
  }

  function updateBranchName(name: string) {
    setDraft((current) => ({
      branchName: name,
      branchLogo: current?.branchLogo ?? settings.branchLogo,
    }));
  }

  function updateBranchLogo(logo: string | null) {
    setDraft((current) => ({
      branchName: current?.branchName ?? settings.branchName,
      branchLogo: logo,
    }));
  }

  const changed =
    branchName.trim() !== settings.branchName || branchLogo !== settings.branchLogo;

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-h3 font-semibold text-fg">ข้อมูลสาขา</h2>
          <p className="mt-1 text-label text-fg-3">ใช้แสดงในระบบ (ระบบติดต่อแยกแต่ละสาขา)</p>
        </header>
        <div className="flex flex-col gap-5 px-5 py-5">
          <label className="flex flex-col gap-2 text-body font-medium text-fg">
            ชื่อสาขา <span className="text-danger">*</span>
            <Input
              aria-label="ชื่อสาขา"
              value={branchName}
              onChange={(event) => updateBranchName(event.target.value)}
              placeholder="ระบุชื่อสาขา"
              maxLength={60}
            />
            <span className="text-label font-normal text-fg-3">แสดงใต้โลโก้ใน sidebar และบนหน้าเข้าสู่ระบบ</span>
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-body font-medium text-fg">โลโก้</span>
            <div className="flex flex-wrap items-center gap-3">
              <BrandMark logo={branchLogo} size="size-16 rounded-xl" />
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/svg+xml"
                className="sr-only"
                aria-label="เลือกไฟล์โลโก้"
                onChange={(event) => {
                  void chooseLogo(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileInput.current?.click()}>
                อัปโหลดโลโก้
              </Button>
              {branchLogo ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => updateBranchLogo(null)}
                >
                  ลบโลโก้
                </Button>
              ) : (
                <span className="text-label text-fg-3">ยังไม่ได้ตั้งค่า</span>
              )}
            </div>
            <p className="text-label text-fg-3">
              PNG หรือ SVG · สี่เหลี่ยมจัตุรัสอย่างน้อย 256 × 256 px · ไม่เกิน 1 MB
            </p>
            {error && <p role="alert" className="text-label text-danger">{error}</p>}
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-5 py-3.5">
          <p className="text-label text-fg-3">การเปลี่ยนแปลงจะบันทึกลง Audit Logs</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={cancel} disabled={!changed}>ยกเลิก</Button>
            <Button onClick={save} disabled={!changed || !branchName.trim()}>บันทึก</Button>
          </div>
        </footer>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-h3 font-semibold text-fg">ตัวอย่างการแสดงผล</h2>
        </header>
        <div className="flex flex-col gap-4 p-5">
          <PreviewLabel>Sidebar</PreviewLabel>
          <BrandPreview logo={branchLogo} branchName={branchName || "ชื่อสาขา"} />
          <PreviewLabel>หน้าเข้าสู่ระบบ</PreviewLabel>
          <BrandPreview logo={branchLogo} branchName={branchName || "ชื่อสาขา"} inverted />
        </div>
      </section>
    </div>
  );
}

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label font-medium text-fg-3">{children}</p>;
}

function BrandPreview({
  logo,
  branchName,
  inverted = false,
}: {
  logo: string | null;
  branchName: string;
  inverted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-line p-3", inverted && "bg-primary text-on-primary")}>
      <BrandMark logo={logo} />
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate text-control font-bold", inverted ? "text-on-primary" : "text-fg")}>
          {siteConfig.brandName}
        </span>
        <span className={cn("truncate text-label", inverted ? "text-on-primary/80" : "text-fg-2")}>
          {branchName}
        </span>
      </span>
    </div>
  );
}
