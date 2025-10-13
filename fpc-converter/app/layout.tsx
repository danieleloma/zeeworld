import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPC Grid to Row Converter",
  description: "Convert FPC grid-format Excel files to row format",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

