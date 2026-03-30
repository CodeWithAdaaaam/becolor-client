import createNextIntlPlugin from 'next-intl/plugin';

// CORRECTION ICI : On pointe vers le fichier dans SRC
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://becolor-server-production.up.railway.app/api',
  },
};

export default withNextIntl(nextConfig);