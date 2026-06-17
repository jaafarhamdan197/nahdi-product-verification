import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // image for Cloud Run stays small and needs no node_modules at runtime.
  output: "standalone",
};

export default nextConfig;
