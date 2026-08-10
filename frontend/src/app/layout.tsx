import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKU Analytics & Forecast",
  description: "Tra cứu SKU, EDA và dự báo theo chi nhánh",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
