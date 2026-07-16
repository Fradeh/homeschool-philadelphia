import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const schoolSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-school-sans"
});

export const metadata: Metadata = {
  title: "Portal Escolar | Philadelphia International School",
  description: "Portal académico de Philadelphia International School."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={schoolSans.variable}>{children}</body>
    </html>
  );
}
