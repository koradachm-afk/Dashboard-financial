"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Toast } from "@/components/tailgrids/core/toast";
import { cn } from "@/utils/cn";
import { BranchSettingsTab } from "./branch-settings-tab";
import { FeeSettingsTab } from "./fee-settings-tab";
import { SlotTypesSettingsTab } from "./slot-types-settings-tab";

const TAB_DETAILS = {
  "settings.branch": { id: "branch", label: "ข้อมูลสาขา" },
  "settings.slot-types": { id: "slot-types", label: "ประเภทช่องจอด" },
  "settings.fees": { id: "fees", label: "ค่าจอดและการชำระเงิน" },
} as const;

type SettingsPageKey = keyof typeof TAB_DETAILS;
type SettingsTab = (typeof TAB_DETAILS)[SettingsPageKey]["id"];

export function SettingsView({
  allowedTabs,
  initialTab,
  actor,
  actorRole,
}: {
  allowedTabs: readonly { key: SettingsPageKey; id: SettingsTab }[];
  initialTab: string;
  actor: string;
  actorRole: "superadmin" | "admin";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab as SettingsTab);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function showSaved(message: string) {
    setToastMessage(message);
    setToastOpen(true);
  }

  function selectTab(tab: string) {
    if (!allowedTabs.some((item) => item.id === tab)) return;
    setActiveTab(tab as SettingsTab);
    router.replace(`/settings?tab=${encodeURIComponent(tab)}`, { scroll: false });
  }

  const actorData = {
    actor,
    role: actorRole === "superadmin" ? "Superadmin" as const : "Admin" as const,
  };

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-fg">System Settings</h1>
        <p className="text-body text-fg-2">
          Admin เห็นเฉพาะแท็บที่ได้รับสิทธิ์ · การเปลี่ยนแปลงทั้งหมดถูกบันทึกลง Audit Logs
        </p>
      </header>

      <div className="flex gap-4 overflow-x-auto overflow-y-hidden border-b border-line" role="tablist" aria-label="System Settings">
        {allowedTabs.map(({ key, id }) => {
          const tab = TAB_DETAILS[key];
          const selected = id === activeTab;
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              id={`settings-tab-${id}`}
              aria-selected={selected}
              aria-controls={`settings-panel-${id}`}
              onClick={() => selectTab(id)}
              className={cn(
                "-mb-px h-auto shrink-0 rounded-none border-b-2 px-1 py-3 text-body font-medium",
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-fg-2",
              )}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === "branch" && (
        <div id="settings-panel-branch" role="tabpanel" aria-labelledby="settings-tab-branch">
          <BranchSettingsTab {...actorData} onSaved={() => showSaved("บันทึกข้อมูลสาขาแล้ว")} />
        </div>
      )}
      {activeTab === "slot-types" && (
        <div id="settings-panel-slot-types" role="tabpanel" aria-labelledby="settings-tab-slot-types">
          <SlotTypesSettingsTab {...actorData} onSaved={showSaved} />
        </div>
      )}
      {activeTab === "fees" && (
        <div id="settings-panel-fees" role="tabpanel" aria-labelledby="settings-tab-fees">
          <FeeSettingsTab {...actorData} onSaved={() => showSaved("บันทึกค่าจอดและการชำระเงินแล้ว")} />
        </div>
      )}

      <Toast
        open={toastOpen}
        title={toastMessage}
        description="บันทึกการเปลี่ยนแปลงลง Audit Logs แล้ว"
        onClose={() => setToastOpen(false)}
      />
    </main>
  );
}
