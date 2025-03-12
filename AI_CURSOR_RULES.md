# Diretrizes de Codificação para CincoCincoJam

## 🌍 Estrutura do Projeto

- Utilize Route Groups (ex: (dashboard), (auth)).
- Crie page.tsx como Server Component.
- Extraia interatividade para ComponentClient.tsx com 'use client'.

## 🛠️ Configuração Next.js

- Defina `output: 'standalone'` no next.config.js.
- Remova opções obsoletas.

## ⚡ Build & Deploy

- Execute `npm run vercel-build` antes do deploy.
- Limpe `.next` se houver erros.
- Use `vercel --prod` para produção.

## 🎨 Estilização & Estado

- Utilize Tailwind CSS.
- Zustand para estado global.
- React Query para buscas assíncronas.

## 🌓 Modo Escuro

- Adapte componentes com classes `dark:` do Tailwind.
- Teste sempre em ambos os modos.
- Persista preferência no localStorage.

## 🔍 Erros & Depuração

- Se erro no build, limpe `.next` e reinicie.
- Corrija erros de linting.

## 📌 Melhores Práticas

- Dependências atualizadas.
- Separe lógica cliente/servidor.

## 🔒 Git Hooks

- Utilize Husky para garantir qualidade.
- Não desative hooks, exceto casos excepcionais (`git commit --no-verify`).

## 🚀 Desenvolvimento Local

- Execute `npm run dev`.
- Configure variáveis em `.env.local`.
- Firebase para autenticação e dados.

## 🔥 Firebase & Autenticação

- Firebase Authentication para usuários e sessões.
- Firebase Realtime Database para dados.
- Utilize `useAuthContext()` para autenticação.
- Evite valores `undefined` no Firebase.

**Fluxo padrão:** `/ → /login → /profile`

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

## 🌓 Adaptação para Modo Escuro

- Todos os componentes devem ser adaptados para suportar o modo escuro usando as classes `dark:` do Tailwind CSS.
- Mantenha a consistência visual entre os modos claro e escuro, preservando o layout e a usabilidade.
- Utilize as seguintes classes para elementos comuns:

**Cores de fundo:**
```
bg-white → dark:bg-gray-800
bg-gray-50 → dark:bg-gray-700/50
bg-gray-100 → dark:bg-gray-800
```

**Cores de texto:**
```
text-gray-900 → dark:text-gray-100
text-gray-700 → dark:text-gray-200
text-gray-500 → dark:text-gray-400
```

**Bordas:**
```
border-gray-200 → dark:border-gray-700
border-gray-300 → dark:border-gray-600
```

**Exemplo de componente adaptado:**
```tsx
// ✅ Componente adaptado para modo escuro
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Título</h2>
  <p className="text-gray-500 dark:text-gray-400">Descrição</p>
</div>

// ❌ Componente sem adaptação para modo escuro
<div className="bg-white text-gray-900 border border-gray-200">
  <h2 className="text-lg font-medium text-gray-900">Título</h2>
  <p className="text-gray-500">Descrição</p>
</div>
```

**Observações importantes:**
- A tela de edição de cursos para professores tem um layout muito bom e deve ser mantida, apenas adaptando as cores para o modo escuro.
- A tela de adição de um novo curso deve seguir o mesmo padrão da tela de edição, permitindo adicionar vídeos e outros conteúdos.
- Ao implementar novas interfaces, sempre teste em ambos os modos (claro e escuro) para garantir boa legibilidade e contraste.
- Utilize o localStorage para persistir a preferência do usuário pelo modo escuro.

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

## 🚀 Desenvolvimento Local e Ambiente

- Sempre execute `npm run dev` para iniciar o servidor de desenvolvimento local.
- Verifique se todas as variáveis de ambiente em `.env.local` estão configuradas corretamente antes de iniciar o desenvolvimento.
- O projeto utiliza Firebase para autenticação e armazenamento de dados - certifique-se de que as credenciais estão configuradas.
- A página raiz (/) redireciona automaticamente para `/login` se o usuário não estiver autenticado ou para `/profile` se estiver.
- Para testar funcionalidades que exigem autenticação, crie uma conta de teste ou use as credenciais existentes.

**Fluxo de navegação padrão:**
```
/ → /login → /profile (após autenticação)
```

**Estrutura de diretórios importantes:**
```
src/
  ├── app/                # Rotas e páginas da aplicação
  │   ├── (auth)/         # Grupo de rotas de autenticação
  │   └── (dashboard)/    # Grupo de rotas do dashboard
  ├── components/         # Componentes reutilizáveis
  ├── contexts/           # Contextos React (AuthContext, etc.)
  ├── hooks/              # Hooks personalizados (useAuth, etc.)
  ├── services/           # Serviços de API e Firebase
  └── config/             # Configurações (Firebase, etc.)
```

**Resolução de problemas comuns:**
```bash
# Se o servidor de desenvolvimento não iniciar
rm -rf .next
npm run dev

# Se ocorrerem erros de autenticação
# Verifique se as variáveis de ambiente do Firebase estão corretas em .env.local
```

## 🔥 Integração com Firebase e Autenticação

- O projeto utiliza Firebase Authentication para gerenciar usuários e sessões.
- Os dados dos usuários são armazenados no Firebase Realtime Database.
- O contexto de autenticação (`AuthContext`) é o ponto central para gerenciar o estado de autenticação.
- Sempre use o hook `useAuthContext()` para acessar informações do usuário e funções de autenticação.
- A alteração de senha é feita através do componente `ChangePasswordModal` que utiliza a função `updatePassword` do Firebase Authentication.
- **Importante**: O Firebase Realtime Database não aceita valores `undefined`. Ao atualizar dados, certifique-se de remover campos com valores undefined ou substituí-los por valores válidos (como strings vazias, null, etc.).

**Fluxo de autenticação:**
```
1. Usuário acessa /login
2. Após login bem-sucedido, o usuário é redirecionado para /profile
3. O estado de autenticação é mantido via Firebase Auth e AuthContext
4. Rotas protegidas verificam o estado de autenticação via useAuthContext()
```

**Estrutura de dados do usuário:**
```typescript
interface User {
  uid: string;
  email: string;
  name?: string;
  role: 'admin' | 'professor' | 'aluno';
  // Outros campos opcionais
}
```

**Funções de autenticação disponíveis:**
```typescript
// Disponíveis via useAuthContext()
login(email: string, password: string): Promise<void>
signup(email: string, password: string, name?: string): Promise<void>
logout(): Promise<void>
resetPassword(email: string): Promise<void>
// Funções de autenticação adicionais
// updatePassword requer reautenticação prévia
```

**Dicas para testes:**
- Para testar funcionalidades que exigem diferentes níveis de acesso, crie contas com diferentes roles (aluno, professor, admin).
- Use o Firebase Console para gerenciar usuários e dados durante o desenvolvimento.

## 💰 Informações de Pagamento de Cursos

- Os cursos agora suportam diferentes tipos de pagamento: pagamento único (`one_time`) ou recorrente (`recurring`).
- Para pagamentos recorrentes, o intervalo de recorrência pode ser mensal (`monthly`), trimestral (`quarterly`), semestral (`biannual`) ou anual (`annual`).
- Para pagamentos únicos, é possível habilitar o parcelamento e definir o número máximo de parcelas.
- O componente `CourseCard` exibe as informações de pagamento de forma clara e intuitiva, adaptando-se ao tipo de pagamento configurado.

**Tipos de pagamento disponíveis:**
```typescript
export type PaymentType = 'one_time' | 'recurring';
export type RecurrenceInterval = 'monthly' | 'quarterly' | 'biannual' | 'annual';
```

**Estrutura de dados de pagamento:**
```typescript
interface Course {
  // ... outros campos
  fields: {
    // ... outros campos
    price: number;
    paymentType?: PaymentType;
    recurrenceInterval?: RecurrenceInterval;
    installments?: boolean;
    installmentCount?: number;
  }
}
```

**Exibição de informações de pagamento:**
- Para pagamentos recorrentes, o preço é exibido junto com o intervalo de recorrência (ex: "R$ 99,90 mensal").
- Para pagamentos únicos com parcelamento, o preço é exibido junto com a informação de parcelamento (ex: "R$ 599,90 em até 12x").
- Para pagamentos únicos sem parcelamento, apenas o preço é exibido (ex: "R$ 599,90").

**Dicas para implementação:**
- Ao criar ou editar um curso, sempre defina o tipo de pagamento.
- Para pagamentos recorrentes, sempre defina o intervalo de recorrência.
- Para pagamentos únicos com parcelamento, defina `installments` como `true` e `installmentCount` com o número máximo de parcelas.
- **Importante**: Ao enviar dados para o Firebase, certifique-se de incluir campos condicionalmente com base no tipo de pagamento. Não envie `recurrenceInterval` para pagamentos únicos, nem `installments`/`installmentCount` para pagamentos recorrentes. Use o operador spread com objetos condicionais: `...(condition ? { field: value } : {})`.

## 🧭 Estrutura de Rotas e Navegação

- O projeto utiliza o sistema de rotas do App Router do Next.js 15.
- Route Groups (entre parênteses) são usados para organizar rotas sem afetar a URL.
- Layouts compartilhados são definidos em arquivos `layout.tsx`.

**Principais grupos de rotas:**
```
(auth)/ - Rotas de autenticação
  ├── login/
  └── register/

(dashboard)/ - Rotas protegidas que exigem autenticação
  ├── profile/
  ├── courses/
  ├── payments/
  ├── professors/
  ├── admin/ (apenas para usuários admin)
  └── settings/
```

**Navegação programática:**
```typescript
// Navegação client-side
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/profile'); // Navegar para uma rota
router.back();           // Voltar para a página anterior
router.refresh();        // Atualizar a página atual
```

**Middleware de autenticação:**
- O arquivo `src/middleware.ts` contém a lógica para proteger rotas que exigem autenticação.
- Rotas protegidas redirecionam para `/login` se o usuário não estiver autenticado.
- Rotas administrativas verificam se o usuário tem a role adequada.

**Dicas para desenvolvimento de novas rotas:**
- Sempre crie novas páginas dentro do grupo de rotas apropriado.
- Mantenha a consistência com o padrão de nomenclatura existente.
- Utilize o layout compartilhado do grupo para manter a consistência visual.

## 📝 Documentação de Observações

Para manter este documento atualizado e útil para todos os desenvolvedores, é importante documentar observações relevantes durante o desenvolvimento. Quando solicitado para "lembrar" de algo, siga estas diretrizes:

- **Seja específico**: Documente exatamente o que deve ser lembrado, com detalhes suficientes para que qualquer desenvolvedor entenda.
- **Contextualize**: Explique o contexto em que a observação foi feita e por que é importante.
- **Categorize**: Adicione a observação na seção apropriada deste documento.
- **Exemplifique**: Quando possível, inclua exemplos de código ou casos de uso.

**Exemplo de observação bem documentada:**
```
Observação: A tela de edição de cursos para professores tem um layout muito bom e deve ser mantida, 
apenas adaptando as cores para o modo escuro quando necessário.

Contexto: Durante a adaptação para o modo escuro, foi identificado que o layout da tela de edição 
de cursos é eficiente e bem estruturado, devendo ser preservado em futuras modificações.
```

**Observações importantes sobre o perfil de usuário:**
```
Observação: Os campos de especialidades e redes sociais foram removidos do perfil do professor.

Contexto: Estes campos foram considerados desnecessários para o funcionamento atual da plataforma
e foram removidos para simplificar a interface e melhorar a experiência do usuário.
```

**Processo para adicionar observações:**
1. Identifique uma observação importante durante o desenvolvimento
2. Documente-a seguindo as diretrizes acima
3. Adicione-a na seção apropriada deste documento
4. Atualize o registro de alterações

Esta prática garante que o conhecimento adquirido durante o desenvolvimento seja preservado e compartilhado com toda a equipe, evitando a repetição de problemas e facilitando a manutenção do código.

## 📝 Registro de Alterações

### 16/03/2025

- fix: corrige erro ao editar cursos adicionando o ID do curso aos dados enviados para a função updateCourse
- fix: corrige tipo do campo price no EditCourseModal para corresponder ao esperado pela função updateCourse
- fix: corrige erro "update failed: values argument contains undefined" ao atualizar cursos no Firebase removendo campos com valores undefined
- fix: corrige erro ao criar cursos com opções de pagamento aplicando a mesma solução para remover campos undefined

### 15/03/2025

- feat: atualiza o componente CourseCard para exibir informações de pagamento (tipo de pagamento, intervalo de recorrência e parcelamento)
- feat: atualiza as páginas que utilizam o CourseCard para passar as novas informações de pagamento
- docs: adiciona documentação sobre as novas funcionalidades de pagamento

### 14/03/2025

- feat: adapta a tela de administração de usuários e o modal de adicionar usuário para o modo escuro
- feat: adiciona funcionalidade de alteração de senha na tela de perfil
- feat: cria componente ChangePasswordModal para gerenciar a alteração de senha
- docs: atualiza documentação sobre autenticação para incluir alteração de senha

### 13/03/2025

- feat: remove campos de especialidades e redes sociais do perfil do professor
- feat: adiciona seção sobre Documentação de Observações
- feat: adiciona seção sobre Adaptação para Modo Escuro
- feat: adiciona seção sobre Desenvolvimento Local e Ambiente
- feat: adiciona seção sobre Integração com Firebase e Autenticação
- feat: adiciona seção sobre Estrutura de Rotas e Navegação
- docs: atualiza estrutura de diretórios importantes
- docs: adiciona fluxo de navegação padrão e resolução de problemas comuns
- fix: adapta componente EditCourseModal para suportar modo escuro
- fix: adapta componente CourseContentManager para suportar modo escuro
- fix: atualiza componente CourseModal para ter as mesmas funcionalidades do EditCourseModal

## Changelog

### 2023-11-XX - Melhorias na página de detalhes do curso
- Adicionada exibição das condições de pagamento (tipo de pagamento, intervalo de recorrência e parcelamento)
- Removida informação do nível do curso para simplificar a interface
- Melhorada a formatação do preço para refletir as diferentes opções de pagamento

### 2023-11-XX - Correção de problema na exclusão de vídeos de cursos
- Corrigido problema onde vídeos excluídos continuavam aparecendo após salvar
- Implementada lógica para remover completamente os conteúdos quando todos os vídeos são excluídos
- Melhorada a mensagem de feedback ao remover todos os vídeos de um curso
- Adicionados logs adicionais para facilitar a depuração

### 2023-11-XX - Melhorias no gerenciamento de conteúdo do curso
- Adicionada notificação visual de sucesso/erro ao salvar conteúdos de vídeo
- Implementado indicador de alterações não salvas para evitar perda de dados
- Melhorada a visibilidade do botão de salvar quando há alterações pendentes
- Adicionada validação para garantir que todos os campos obrigatórios sejam preenchidos
- Adicionada mensagem informativa quando não há vídeos adicionados
- Implementado aviso de confirmação ao tentar sair da página com alterações não salvas

### 2023-11-XX - Correção de erro ao criar cursos com opções de pagamento
- Aplicada a mesma solução de remoção de campos indefinidos na função `createCourse`
- Corrigido o problema de envio de campos indefinidos para o Firebase durante a criação de cursos
- Garantido que apenas campos relevantes para o tipo de pagamento selecionado sejam enviados

---

🚀 Siga estas diretrizes para garantir um desenvolvimento eficiente no Next.js 15 e Vercel! 