import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker copia solo lo indispensable al runtime.
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
