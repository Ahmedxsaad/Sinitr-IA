// Proxy /api/* to the gateway so the browser makes same-origin calls and no CORS
// setup is needed. The gateway URL is configurable for other environments.
const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Both contracts and ui ship TypeScript source, so Next must transpile them.
  transpilePackages: ['@sinistria/contracts', '@sinistria/ui'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${GATEWAY_URL}/api/:path*` }];
  },
};

export default nextConfig;
