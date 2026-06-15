import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "sharp",
    "@img/sharp-linux-x64",
    "@img/sharp-linuxmusl-x64",
    "@img/sharp-libvips-linux-x64",
    "@img/sharp-libvips-linuxmusl-x64",
  ],
  outputFileTracingExcludes: {
    "*": ["public/demo/**/*", "public/carousel/**/*", ".next/cache/**/*"],
  },
};

export default nextConfig;
