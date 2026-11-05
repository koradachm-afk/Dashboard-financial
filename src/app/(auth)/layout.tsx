import { BrandPanel } from "./_components/brand-panel";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-theme="light" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="flex min-h-full flex-1 bg-surface">
        <BrandPanel />
        <section className="flex flex-1 items-center justify-center px-6 py-10">
          {children}
        </section>
      </main>
    </div>
  );
}
