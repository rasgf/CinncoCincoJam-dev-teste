/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Mantendo domains por compatibilidade com código existente
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'dl.airtable.com',
      'via.placeholder.com',
    ],
  },
}

module.exports = nextConfig 