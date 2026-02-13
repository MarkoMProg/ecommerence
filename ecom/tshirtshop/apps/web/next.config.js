/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:3000";
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
