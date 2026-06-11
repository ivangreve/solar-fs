import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No bundlear TypeORM/pg: usan requires dinámicos de drivers opcionales que
  // rompen el bundler. Se mantienen como dependencias externas (runtime Node).
  serverExternalPackages: ["typeorm", "pg"],
  // El dev corre detrás de nginx (localhost:8080) y next dev (localhost:3009).
  // Permitir ambos orígenes para el chequeo anti-CSRF de las Server Actions.
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:8080", "localhost:3009"],
    },
  },
};

export default nextConfig;
