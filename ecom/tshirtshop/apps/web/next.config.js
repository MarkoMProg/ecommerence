/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites() {
    // Use 127.0.0.1 to avoid Windows IPv6 localhost resolution issues (ECONNREFUSED)
    const apiUrl = process.env.API_URL || "http://127.0.0.1:3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
