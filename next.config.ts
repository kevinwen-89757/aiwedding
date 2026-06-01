import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
