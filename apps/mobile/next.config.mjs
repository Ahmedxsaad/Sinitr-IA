// Proxy /api/* to the gateway so the browser makes same-origin calls and no CORS
// setup is needed. The gateway URL is configurable for other environments.
const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The contracts package ships TypeScript source, so Next must transpile it.
  transpilePackages: ['@sinistria/contracts'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${GATEWAY_URL}/api/:path*` }];
  },
};

export default nextConfig;
