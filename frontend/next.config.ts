import type { NextConfig } from "next";

// The browser only ever talks to this Next.js server. Every /api/* and
// /health request is transparently proxied to the backend container over
// the internal Docker network, so the web UI never needs CORS and the
// session cookie is issued for whatever address the user is actually
// browsing from (localhost, LAN IP, or a Tailscale hostname).
const backendUrl = process.env.INTERNAL_API_BASE_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
    ];
  },
};

export default nextConfig;
