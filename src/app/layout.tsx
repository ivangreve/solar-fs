import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar FS · Monitoreo solar",
  description: "Estadísticas útiles para tu sistema solar Felicity",
  // PWA en iOS (Android/desktop usan el manifest)
  appleWebApp: { capable: true, title: "Solar FS", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#0b0e13",
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
      className={`${instrument.variable} ${jetbrains.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
