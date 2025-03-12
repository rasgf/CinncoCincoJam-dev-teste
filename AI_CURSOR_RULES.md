# Diretrizes de Codificação para CincoCincoJam

> **Versão:** 1.0.0  
> **Última atualização:** 12/03/2025  
> **Status:** Ativo

## 🌍 Estrutura do Projeto

- Utilize Route Groups (ex: (dashboard), (auth)) em vez de rotas diretas.
- Sempre crie page.tsx como um Server Component.
- Se houver interatividade, extraia para ComponentClient.tsx com 'use client'.

**Exemplo:**
```tsx
// ✅ Estrutura recomendada
src/app/(auth)/login/page.tsx      // Server Component
src/app/(auth)/login/LoginClient.tsx  // 'use client'

// ❌ Evitar
src/app/login/page.tsx             // Rota direta sem grupo
```

## 🛠️ Configuração do Next.js

- Certifique-se de que output: 'standalone' está definido no next.config.js.
- Remova opções obsoletas como serverExternalPackages.
- Sempre verifique as configurações experimentais do Next.js antes de atualizar.

**Exemplo:**
```js
// ✅ Configuração recomendada
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@headlessui/react']
  },
  // Configurações atuais do Next.js 15
}
```

## ⚡ Build & Deploy (Vercel)

- Execute npm run vercel-build antes de fazer o deploy.
- Limpe a pasta .next se encontrar erros no build.
- Utilize vercel --prod para deploys de produção.
- Se ocorrer erro ENOENT: no such file, execute fix-router-groups.js.

**Comandos úteis:**
```bash
# Preparar para deploy
rm -rf .next && npm run vercel-build

# Deploy para produção
vercel --prod
```

## 🎨 Estilização & Gerenciamento de Estado

- Utilize Tailwind CSS (evite arquivos CSS externos).
- Use Zustand para estado global e React Query para buscas assíncronas.

**Exemplo de Zustand:**
```tsx
// ✅ Store com Zustand
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

## 🔍 Tratamento de Erros & Depuração

- Se ocorrer erro _buildManifest.js.tmp, exclua .next e reinicie o servidor.
- Desative o Turbopack se o build de desenvolvimento falhar.
- Erros de linting devem ser corrigidos, mas eslint.ignoreDuringBuilds = true pode ser usado temporariamente.

**Sequência para resolver problemas comuns:**
```bash
# Resolver problemas de build
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

## 📌 Melhores Práticas Gerais

- Mantenha dependências atualizadas (Next.js, React, Firebase).
- Separe a lógica cliente/servidor (page.tsx para server, Client.tsx para client).
- Sempre documente mudanças no arquivo AI_CURSOR_RULES.md.

## 🔒 Integração com Git Hooks

Este projeto utiliza Husky para garantir a qualidade do código:

- Pre-commit: Executa lint e testes para garantir que apenas código de qualidade seja commitado.
- Pre-push: Executa verificações adicionais antes de enviar código para o repositório.
- Post-commit: Atualiza automaticamente este arquivo de diretrizes com base em mensagens de commit relevantes.

**Não desative os hooks de git.** Se for necessário fazer um commit sem verificações (caso excepcional), use:

```bash
git commit --no-verify -m "mensagem de commit"
```

**Nota:** Se encontrar erros relacionados ao Husky durante o commit, verifique se o pacote está instalado corretamente com `npm install` e se os scripts referenciados nos hooks existem no package.json.

## 🔄 Autoincremento de Diretrizes

Para manter este documento atualizado com as melhores práticas e novas descobertas, o Cursor AI pode adicionar automaticamente novas orientações baseadas nos seguintes critérios:

- Se um erro recorrente for identificado em builds ou execução.
- Se uma nova versão do Next.js introduzir mudanças que afetem a estrutura do projeto.
- Se padrões mais eficientes forem encontrados para estilização, gerenciamento de estado ou otimização de build.

### Instruções para o Cursor AI ao autoincrementar:

- Seja conciso - Adicione apenas diretrizes objetivas e testadas.
- Evite duplicatas - Verifique se a orientação já está documentada antes de adicionar.
- Mantenha a estrutura - Utilize os títulos e categorias existentes para organizar novas diretrizes.
- Inclua apenas soluções comprovadas - Não adicione sugestões experimentais sem verificação.
- Atualize a versão e a data de última atualização.

## 📋 Processo de Revisão

Este documento deve ser revisado nas seguintes ocasiões:

1. A cada nova versão principal do Next.js
2. A cada dois meses em reuniões de equipe
3. Após a identificação de problemas recorrentes no desenvolvimento

Ao revisar, considere:
- A relevância das diretrizes existentes
- Problemas enfrentados desde a última revisão
- Novas práticas que poderiam ser adotadas

## 🔗 Recursos Adicionais

Este documento complementa o README.md principal do projeto. Consulte também:

- [README.md](./README.md) - Instruções de configuração e execução
- [docs/](./docs/) - Documentação detalhada do projeto

## 📝 Registro de Alterações

Este registro documenta as alterações feitas nas diretrizes ao longo do tempo.

### 12/03/2025

- Versão inicial das diretrizes de codificação
- Adicionadas seções sobre estrutura do projeto, configuração, build, estilização e tratamento de erros
- Implementado sistema de autoincremento de diretrizes

---

🚀 Siga estas diretrizes para garantir um desenvolvimento eficiente no Next.js 15 e Vercel! 