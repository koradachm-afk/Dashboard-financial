"use client";

import { useSettings } from "@/db/settings";

export function BranchName() {
  return <>{useSettings().branchName}</>;
}
