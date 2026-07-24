/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;