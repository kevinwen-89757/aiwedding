import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingExcludes: {
    "*": [
      "./public/demo/**",
      "./node_modules/@img/sharp-libvips*/**",
      "./.git/**",
      "./.next/cache/**",
      "./deno.lock",
    ],
  },
};

export default nextConfig;
