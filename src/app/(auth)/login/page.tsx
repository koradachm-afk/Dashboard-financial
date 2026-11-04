import { BrandPanel } from "./_components/brand-panel";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 bg-surface">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <LoginForm />
      </section>
    </main>
  );
}
