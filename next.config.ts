import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3"],
  outputFileTracingExcludes: {
    "*": ["public/demo/**/*", "public/carousel/**/*"],
  },
};;

export default nextConfig;
