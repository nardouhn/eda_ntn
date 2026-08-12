import type { NextConfig } from "next";

const productionBackend =
  "https://eda-backend-production-a8cf.up.railway.app";

const backendBaseUrl =
  process.env.BACKEND_API_URL ??
  (process.env.VERCEL
    ? productionBackend
    : "http://127.0.0.1:8000");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
