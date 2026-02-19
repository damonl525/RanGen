import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Crucial for Electron: ensures assets are loaded relative to the HTML file
  // so they work under file:// protocol
  assetPrefix: process.env.NODE_ENV === "production" ? "./" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
