import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  serverExternalPackages: ["@daytona/sdk", "@napi-rs/canvas", "pdfjs-dist", "sharp"],
};

export default nextConfig;
