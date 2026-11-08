import { Suspense } from "react";

import { requirePage } from "@/db/auth/auth";
import { SETTINGS_PAGES, accessFor } from "@/db/user/access";
import { SettingsView } from "./_components/settings-view";

export const instant = false;

const TABS = [
  { key: "settings.branch", id: "branch" },
  { key: "settings.slot-types", id: "slot-types" },
  { key: "settings.fees", id: "fees" },
] as const;
type SettingsTabAccess = (typeof TABS)[number];

export default async function Page(props: PageProps<"/settings">) {
  const user = await requirePage(SETTINGS_PAGES);
  const allowedTabs = TABS.filter(({ key }) => accessFor(user, key) === "edit");

  return (
    <Suspense fallback={<div className="min-h-full bg-page" />}>
      <SettingsPageContent
        searchParams={props.searchParams}
        allowedTabs={allowedTabs}
        actor={user.username}
        actorRole={user.role}
      />
    </Suspense>
  );
}

async function SettingsPageContent({
  searchParams,
  allowedTabs,
  actor,
  actorRole,
}: {
  searchParams: PageProps<"/settings">["searchParams"];
  allowedTabs: readonly SettingsTabAccess[];
  actor: string;
  actorRole: "superadmin" | "admin";
}) {
  const query = await searchParams;
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const initialTab =
    allowedTabs.find(({ id }) => id === requestedTab)?.id ?? allowedTabs[0].id;

  return (
    <SettingsView
      allowedTabs={allowedTabs}
      initialTab={initialTab}
      actor={actor}
      actorRole={actorRole}
    />
  );
}
