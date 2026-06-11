import type { MetadataRoute } from "next";

/** PWA: instalable en el homescreen (Android/desktop; iOS usa apple-touch-icon). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "solar-fs · Monitoreo solar",
    short_name: "solar-fs",
    description: "Dashboard de tu sistema solar off-grid Felicity",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
