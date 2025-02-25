This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase Storage & CORS

Este projeto utiliza o Firebase Storage para armazenamento de imagens. Para resolver problemas de CORS ao acessar imagens diretamente do Firebase Storage, implementamos as seguintes soluções:

### Proxy de Imagem

Um proxy de imagem foi implementado em `/api/image-proxy` que busca as imagens do Firebase Storage no lado do servidor, evitando problemas de CORS no cliente.

### Componente ProxyImage

Um componente `ProxyImage` foi criado para simplificar o uso de imagens, detectando automaticamente URLs do Firebase Storage e utilizando o proxy quando necessário.

### Configuração CORS no Firebase Storage

Para ambientes de produção, fornecemos um script para configurar regras CORS no Firebase Storage:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Configurar CORS
node src/scripts/setup-firebase-cors.js
```

Para mais detalhes, consulte a documentação em [docs/firebase-storage-cors.md](docs/firebase-storage-cors.md)
