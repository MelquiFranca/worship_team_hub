import { validateProductionEnvironment } from './src/lib/env/productionBaseline.mjs';

const commandLine = process.argv.join(' ').toLowerCase();
const isProductionMode = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const isLintCommand = commandLine.includes('next-lint') || commandLine.includes('next lint');
const isStartCommand = commandLine.includes('next-start') || commandLine.includes('next start');
const isNetlifyEnvironment = String(process.env.NETLIFY || '').toLowerCase() === 'true';

if (isProductionMode && isNetlifyEnvironment && isStartCommand) {
  throw new Error(
    [
      'Configuracao de deploy invalida no Netlify: build command nao pode ser `npm start`/`next start`.',
      'Use `npm run build` como build command e configure os segredos obrigatorios de producao:',
      '- MONGODB_URI',
      '- AUTH_JWT_SECRET ou JWT_SECRET'
    ].join('\n')
  );
}

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
