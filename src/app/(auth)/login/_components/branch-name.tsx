"use client";

import { useSettings } from "@/db/settings/settings";

export function BranchName() {
  return <>{useSettings().branchName}</>;
}
