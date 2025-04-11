/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Appliquer le header à toutes les routes
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            // Autoriser picture-in-picture pour le domaine self (votre site) et youtube.com
            value: 'picture-in-picture=(self "https://www.youtube.com")',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
