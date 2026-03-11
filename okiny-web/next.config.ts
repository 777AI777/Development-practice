import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [
      path.join(appRoot, "node_modules"),
      "node_modules",
      ...(config.resolve.modules ?? []),
    ];
    return config;
  },
};

export default nextConfig;
