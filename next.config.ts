import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  serverExternalPackages: ["@daytona/sdk"],
};

export default nextConfig;
