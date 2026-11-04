import Sidebarmenu from "@/components/sidebarmenu";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <Sidebarmenu>{children}</Sidebarmenu>;
}
