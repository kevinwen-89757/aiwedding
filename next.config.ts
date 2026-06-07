import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingExcludes: {
    "*": ["public/demo/**/*", "public/carousel/**/*"],
  },
};;

export default nextConfig;
