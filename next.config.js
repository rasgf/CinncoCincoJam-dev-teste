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
  // Configuração essencial para rodar no Vercel com router groups
  output: 'standalone',
  // Configuração experimental simplificada
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@headlessui/react']
  },
  // Lista de pacotes externos para o servidor
  serverExternalPackages: [],
  // Configuração para debug de revalidação e geração de estáticos
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  staticPageGenerationTimeout: 120,
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