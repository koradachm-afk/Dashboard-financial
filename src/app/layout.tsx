import { Inter, Noto_Sans_Thai } from "next/font/google";

import "@/app/globals.css";
import { BootSync } from "@/app/_components/boot-sync";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});
const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${thai.variable}`}
      suppressHydrationWarning
    >
      <body className="h-dvh w-screen flex flex-col overflow-hidden m-0">
        <BootSync />
        {children}
      </body>
    </html>
  );
}
