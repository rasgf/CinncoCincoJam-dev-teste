/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com', // Para avatares do Google
      'dl.airtable.com', // Para imagens do Airtable
    ],
  },
}

module.exports = nextConfig 