import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deutsch Lernen",
  description: "Người Việt học tiếng Đức qua YouTube",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
