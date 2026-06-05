import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiProxyUrl = process.env.API_PROXY_URL || "http://localhost:5001";

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl.replace(/\/$/, "")}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
