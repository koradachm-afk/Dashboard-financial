import { CircleCheck, TriangleAlert, Wrench } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

import type { SlotAlert } from "./dashboard-data";
import { LiveBadge } from "./live-badge";

const KIND = {
  unknown: { title: "ไม่ทราบสถานะ", icon: TriangleAlert, box: "bg-warning-soft", iconClass: "text-warning" },
  disabled: { title: "ปิดใช้งาน", icon: Wrench, box: "bg-subtle", iconClass: "text-fg-2" },
} as const;

export function AlertsCard({ alerts }: { alerts: readonly SlotAlert[] }) {
  return (
    <Card>
      <CardHeader title="แจ้งเตือน" action={<LiveBadge />} />
      <CardBody>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CircleCheck size={24} aria-hidden className="text-success" />
            <p className="text-body text-fg-2">ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((a) => {
              const { title, icon: Icon, box, iconClass } = KIND[a.status];
              return (
                <li key={a.status} className={cn("flex gap-3 rounded-lg px-3.5 py-3", box)}>
                  <Icon size={20} aria-hidden className={cn("mt-0.5 shrink-0", iconClass)} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-body font-semibold text-fg">
                      {title} {a.ids.length} ช่อง
                    </p>
                    <p className="text-label text-fg-2">{[a.ids.join(", "), ...a.reasons].join(" · ")}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
