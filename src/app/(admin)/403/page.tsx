import { Suspense } from "react";

import { ForbiddenView } from "./_components/forbidden-view";

// requirePage redirects here as /403?from=<page key>. searchParams is a Promise in Next 16;
// the view awaits it and reads the session behind this boundary.
export default function Page({ searchParams }: PageProps<"/403">) {
  return (
    <Suspense fallback={null}>
      <ForbiddenView searchParams={searchParams} />
    </Suspense>
  );
}
