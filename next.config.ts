import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingExcludes: {
    "*": ["public/**/*.png"],
  },
};

export default nextConfig;
