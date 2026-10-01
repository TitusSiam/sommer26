import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  experimental: {
    // Bild-Uploads (bereits clientseitig verkleinert) passen sicher darunter
    proxyClientMaxBodySize: "4mb",
  },
};

export default nextConfig;
