import { Suspense } from "react";

import SessionSidebar from "@/app/(admin)/_components/session-sidebar";
import SidebarSkeleton from "@/app/(admin)/_components/sidebar-skeleton";
import { SidebarProvider } from "@/components/tailgrids/core/sidebar";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-col h-dvh w-full">
      <div className="flex flex-1 w-full overflow-hidden border-b border-line bg-page">
        <SidebarProvider defaultOpen className="h-full">
          <Suspense fallback={<SidebarSkeleton />}>
            <SessionSidebar />
          </Suspense>

          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-page">
              <div className="h-full w-full">{children}</div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
