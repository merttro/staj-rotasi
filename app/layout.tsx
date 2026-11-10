import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staj Rotası | Proje ve Görev Takibi",
  description:
    "Projelerini planla, görevlerini takip et ve öğrenme notlarını bir arada tut. Tarayıcında çalışan kişisel çalışma alanın.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
