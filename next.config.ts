import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingExcludes: {
    "*": ["public/**/*.png"],
  },
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

export default nextConfig;
