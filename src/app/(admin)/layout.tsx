import { Suspense } from "react";

import AdminThemeProvider from "@/app/(admin)/_components/admin-theme-provider";
import SessionSidebar from "@/app/(admin)/_components/session-sidebar";
import SidebarSkeleton from "@/app/(admin)/_components/sidebar-skeleton";
import { SidebarProvider } from "@/components/tailgrids/core/sidebar";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <AdminThemeProvider>
      <div className="fixed inset-0 flex min-h-0 w-full flex-col">
        <div className="flex min-h-0 w-full flex-1 overflow-hidden border-b border-line bg-page">
          <SidebarProvider defaultOpen className="h-full min-h-0">
            <Suspense fallback={<SidebarSkeleton />}>
              <SessionSidebar />
            </Suspense>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-auto bg-page p-4 md:p-6">
                <div className="h-full w-full">{children}</div>
              </div>
            </div>
          </SidebarProvider>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
