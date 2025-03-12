/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desativar verificação de linting durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desativar verificação de TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Para avatares do Google
      },
      {
        protocol: 'https',
        hostname: 'dl.airtable.com', // Para imagens do Airtable
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Para imagens de placeholder
      },
    ],
  },
}

module.exports = nextConfig 