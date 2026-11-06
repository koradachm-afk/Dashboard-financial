import { Suspense } from "react";

import { NotFoundView } from "./_components/not-found-view";

// Outside every route group, so no sidebar. Always light, like the auth layout.
export default function NotFound() {
  return (
    <div data-theme="light" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="flex min-h-full flex-1 items-center justify-center bg-page p-6">
        <Suspense fallback={null}>
          <NotFoundView />
        </Suspense>
      </main>
    </div>
  );
}
