import { Suspense } from "react";

import { AccountView } from "./_components/account-view";

// Any signed-in user may open their own account, so there is no page permission to check.
// AccountView reads the session behind this boundary and redirects to /login without one.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountView />
    </Suspense>
  );
}
