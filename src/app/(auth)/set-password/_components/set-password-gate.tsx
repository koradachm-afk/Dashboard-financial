import { redirect } from "next/navigation";

import { getPasswordSetter } from "@/db/auth/auth";

import { SetPasswordForm } from "./set-password-form";

/** Reads the reset / session cookies behind Suspense; hands the client form the username only. */
export async function SetPasswordGate() {
  const setter = await getPasswordSetter();
  if (!setter) redirect("/login");
  return <SetPasswordForm username={setter.user.username} />;
}
