# Firebase Storage e CORS

Este documento explica como lidamos com problemas de CORS (Cross-Origin Resource Sharing) ao acessar imagens armazenadas no Firebase Storage.

## O Problema

Quando tentamos acessar imagens diretamente do Firebase Storage, podemos encontrar erros CORS como este:

```
Access to image at 'https://firebasestorage.googleapis.com/v0/b/your-project.firebasestorage.app/o/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Isso acontece porque o Firebase Storage não permite por padrão que recursos sejam carregados diretamente por outros domínios.

## Nossas Soluções

Implementamos duas soluções para resolver este problema:

### 1. Proxy de Imagem

Criamos um proxy de imagem utilizando a API Routes do Next.js que busca a imagem do Firebase Storage no lado do servidor e a serve ao cliente:

- Endpoint: `/api/image-proxy?url=[url-da-imagem-firebase]`
- Arquivo: `src/app/api/image-proxy/route.ts`

Este proxy:
- Busca a imagem do Firebase Storage usando fetch no lado do servidor
- Adiciona cabeçalhos apropriados para cache
- Retorna a imagem como uma resposta Blob

### 2. Componente ProxyImage

Criamos um componente React para simplificar o uso de imagens com proxy:

- Arquivo: `src/components/common/ProxyImage.tsx`

Este componente:
- Detecta automaticamente se uma imagem é do Firebase Storage
- Usa o proxy apenas em ambiente de desenvolvimento
- Inclui fallback para casos de erro
- É compatível com a API do componente Next/Image

### 3. Helper getImageUrl

Adicionamos uma função utilitária para obter URLs seguras para imagens:

- Arquivo: `src/services/firebase-storage.ts`
- Função: `getImageUrl(imageUrl, width, height, alt)`

Esta função processa URLs de imagem e:
- Redireciona para o proxy quando necessário
- Retorna URLs de placeholder para imagens não disponíveis
- Funciona em ambientes de cliente e servidor

## Configuração CORS no Firebase Storage

Para ambientes de produção, recomendamos configurar diretamente as regras CORS no Firebase Storage:

1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Faça login: `firebase login`
3. Execute o script: `node src/scripts/setup-firebase-cors.js`

Este script configura automaticamente regras CORS para o seu bucket do Firebase Storage.

## Boas Práticas

- Em desenvolvimento: use o proxy de imagem para evitar erros CORS
- Em produção: configure as regras CORS no Firebase Storage permitindo apenas seus domínios específicos
- Use o componente `ProxyImage` para automatizar o tratamento de imagens
- Considere o desempenho: o proxy adiciona uma camada extra de requisições para seu servidor

## Troubleshooting

Se você encontrar erros de CORS:

1. Verifique se está usando o componente `ProxyImage` ou a função `getImageUrl`
2. Confirme que a URL da imagem é realmente do Firebase Storage
3. Verifique se as regras CORS estão configuradas corretamente no Firebase Storage
4. Teste a imagem diretamente no navegador para confirmar que ela existe
5. Verifique os logs do servidor para erros ao buscar a imagem 