import { validateProductionEnvironment } from './src/lib/env/productionBaseline.mjs';

const commandLine = process.argv.join(' ').toLowerCase();
const isProductionMode = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const isLintCommand = commandLine.includes('next-lint') || commandLine.includes('next lint');

if (isProductionMode && !isLintCommand) {
  validateProductionEnvironment(process.env);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc'
      }
    ]
  }
};

export default nextConfig;
