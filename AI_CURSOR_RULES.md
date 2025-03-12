Diretrizes de Codificação para CincoCincoJam

Execute instruções de forma faseada, para que evite estourar as 25 requisições limites. Solicitando validação e interação com o usuário (eu)

Sempre interrompa a execução de servers anteriores para evitar o acumulo de servers rodando em diferentes portas

🌍 Estrutura e Configuração

Utilize Route Groups para organizar rotas.

page.tsx deve ser Server Component; interatividade vai para ComponentClient.tsx.

Defina output: 'standalone' no next.config.js e mantenha opções atualizadas.

⚡ Build & Deploy

Execute npm run vercel-build antes do deploy.

Limpe .next se houver erros e use vercel --prod para produção.

Mantenha sempre um único arquivo de referencia para variaveis de ambiente, independente de estar em produção ou desenvolvimento

🎨 Estilização & Estado

Utilize Tailwind CSS e adapte para modo escuro (dark:).

Gerencie estado com Zustand e buscas assíncronas com React Query.

🔍 Erros & Depuração

Para erros no build, limpe .next e reinicie.

Corrija erros de linting e evite desativar Git Hooks (Husky).

🔄 Autoincremento de Diretrizes

O Cursor AI pode adicionar instruções se:

Erros recorrentes forem detectados.

Atualizações do Next.js impactarem o projeto.

Novas boas práticas forem identificadas.

Regras ao autoincrementar:

Seja conciso, apenas o essencial.

Evite duplicatas, use categorias existentes.

Adicione apenas soluções testadas e comprovadas.

Adicione caso seja solicitado a lembrar de algo

Reformule constantemente esse conteúdo para manter ele de forma pequena e otimizada porem com contexto

Mantenha sempre essas orientações ativas

🚀 Mantenha o desenvolvimento eficiente no Next.js 15 e Vercel!