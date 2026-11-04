export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-theme="light" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {children}
    </div>
  );
}
