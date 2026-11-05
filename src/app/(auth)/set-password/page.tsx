import { Suspense } from "react";

import { SetPasswordGate } from "./_components/set-password-gate";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordGate />
    </Suspense>
  );
}
