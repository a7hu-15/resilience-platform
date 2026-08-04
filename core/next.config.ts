import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'pg', 'better-sqlite3', '@kubernetes/client-node'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
