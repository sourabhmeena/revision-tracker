/** @type {import('next').NextConfig} */
const nextConfig = {
  // `allowedDevOrigins` is a top-level key in Next 16 (was experimental).
  allowedDevOrigins: ['http://localhost:3000', 'http://192.168.1.41:3000'],
  // Hide the floating dev-tools indicator (dev only; no effect in production).
  devIndicators: false,
};

module.exports = nextConfig;
