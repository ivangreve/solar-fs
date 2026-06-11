import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "solar-fs · Monitoreo solar",
  description: "Estadísticas útiles para tu sistema solar Felicity",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El tema se decide server-side desde la cookie (oscuro por default).
  // Así el HTML llega con la clase correcta: sin flash y sin <script> (React 19).
  const theme = (await cookies()).get("theme")?.value;
  const themeClass = theme === "light" ? "light" : "";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
