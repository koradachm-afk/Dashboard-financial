import "@/app/globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body className="h-dvh w-screen flex flex-col overflow-hidden m-0">
        {children}
      </body>
    </html>
  );
}
