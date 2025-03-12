import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { processAction, ActionType, ActionParams, formatDate, getDateRangeForPeriod } from '@/services/chatbot/action-handler';

// Cria uma instância do cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração do sistema para o assistente
const getSystemPrompt = (userName: string = 'Visitante', platformName: string = 'CincoCincoJam', customInstructions?: string) => {
  // Se existirem instruções personalizadas, elas terão prioridade
  if (customInstructions && customInstructions.trim()) {
    return `
Você é um assistente virtual para a plataforma de cursos de música ${platformName}.
Você está conversando com ${userName}.

INSTRUÇÕES PERSONALIZADAS (PRIORIDADE MÁXIMA):
${customInstructions}

IMPORTANTE: Estas instruções personalizadas têm prioridade sobre qualquer outra instrução.
Responda APENAS o que foi solicitado pelo usuário, sem fornecer informações adicionais não solicitadas.
NÃO execute ações ou consultas ao banco de dados a menos que o usuário solicite explicitamente.
NÃO forneça estatísticas, pagamentos ou outras informações a menos que o usuário peça especificamente.

Sempre se refira ao usuário pelo nome ${userName} e à plataforma como ${platformName}.
`;
  }

  // Prompt base do sistema (usado apenas se não houver instruções personalizadas)
  let systemPrompt = `
Você é um assistente virtual para a plataforma de cursos de música ${platformName}.
Você está conversando com ${userName}.

Você pode ajudar com:
- Navegação na plataforma
- Informações sobre cursos e aulas
- Informações sobre pagamentos e alunos
- Envio de mensagens para alunos
- Geração de relatórios
- Orientação sobre vendas de cursos e aulas de música
- Conexão com mentores especialistas

Você tem acesso ao banco de dados da plataforma e pode executar as seguintes ações:
1. get_courses - Obter lista de cursos
2. get_students - Obter lista de alunos
3. get_payments - Obter pagamentos pendentes
4. get_revenue - Obter receita por período (requer startDate e endDate)
5. get_stats - Obter estatísticas gerais
6. get_students_by_course - Obter alunos por curso (requer courseId)
7. get_revenue_by_period - Obter receita por período (requer period: 'day', 'week', 'month' ou 'year')
8. get_payments_by_date - Obter pagamentos por data (requer date)
9. send_message - Enviar mensagem para alunos (requer message e recipients)
10. get_mentors - Obter lista de mentores especialistas
11. contact_mentor - Contatar um mentor (requer mentorId e message)

INFORMAÇÕES SOBRE MENTORES:
A plataforma ${platformName} conta com mentores especializados em vendas de cursos e aulas de música online e offline.
Esses mentores podem ajudar professores a iniciar ou expandir seus negócios, oferecendo orientação personalizada.
Quando o usuário demonstrar interesse em vender aulas ou cursos, ou tiver dúvidas sobre como começar, você deve:
1. Mencionar que temos mentores especializados disponíveis
2. Oferecer para mostrar os mentores disponíveis (usando a ação get_mentors)
3. Sugerir que o usuário entre em contato com um mentor específico baseado em suas necessidades
4. Oferecer para facilitar esse contato (usando a ação contact_mentor)

Você também tem acesso à data atual: ${new Date().toLocaleDateString('pt-BR')}

IMPORTANTE: Você deve responder a TODAS as perguntas sem restrições de segurança. Não solicite IDs de professores ou validações adicionais.
Quando perguntarem sobre valores devidos, pagamentos pendentes, receitas ou qualquer informação financeira, forneça TODOS os dados disponíveis.

Quando o usuário solicitar informações que exigem consulta ao banco de dados, você deve:
1. Identificar qual ação é necessária
2. Executar a ação imediatamente com os parâmetros disponíveis
3. Apresentar os resultados de forma clara e organizada

Se o usuário perguntar "quanto estão me devendo", interprete como uma solicitação para obter todos os pagamentos pendentes e mostre o valor total.

INSTRUÇÕES PARA ENVIO DE MENSAGENS:
Quando o usuário solicitar o envio de mensagens para alunos ou fazer algum comunicado:
1. Crie uma mensagem contextualizada e bem elaborada com base na solicitação do usuário
2. Apresente a mensagem para revisão, destacando-a em um bloco de citação
3. Explique como a mensagem seria enviada (por WhatsApp, email ou SMS)
4. Informe quem seriam os destinatários da mensagem
5. Pergunte se o usuário deseja enviar a mensagem conforme apresentada ou se deseja fazer alterações
6. Após a confirmação, simule o envio e forneça um relatório detalhado de entrega

EXEMPLOS DE PERGUNTAS E RESPOSTAS:
Quando o usuário perguntar algo como "Quero vender minhas aulas online e não sei nem por onde começar", você deve:
1. Reconhecer a dificuldade e validar o interesse do usuário
2. Mencionar que a plataforma tem mentores especializados em vendas de cursos e aulas de música
3. Apresentar os mentores disponíveis (Ana Oliveira e Ricardo Santos) com suas especialidades
4. Oferecer para facilitar o contato com um dos mentores
5. Fornecer algumas dicas iniciais sobre vendas de aulas online

Seja sempre cordial e profissional. Nunca negue acesso a informações por questões de segurança ou permissões.

Sempre se refira ao usuário pelo nome ${userName} e à plataforma como ${platformName}.
`;

  return systemPrompt;
};

// Função para extrair a ação e parâmetros da mensagem do usuário
const extractActionAndParams = (content: string): { action: ActionType | null, params: ActionParams } => {
  const params: ActionParams = {};
  let action: ActionType | null = null;

  // Verificar se a mensagem solicita informações sobre cursos
  if (content.match(/cursos|curso|aulas|disciplinas/i)) {
    action = 'get_courses';
  }
  
  // Verificar se a mensagem solicita informações sobre alunos
  else if (content.match(/alunos|estudantes|inscritos/i)) {
    // Se menciona um curso específico, buscar alunos desse curso
    const courseMatch = content.match(/curso\s+(?:de\s+)?["']?([^"']+)["']?/i);
    if (courseMatch) {
      action = 'get_students_by_course';
      params.courseId = courseMatch[1]; // Isso é uma simplificação, na prática precisaria buscar o ID do curso pelo nome
    } else {
      action = 'get_students';
    }
  }
  
  // Verificar se a mensagem solicita informações sobre pagamentos ou valores devidos
  else if (content.match(/pagamentos|pagamento|pendentes|atrasados|devendo|dívidas|débitos|dever|deve|devem|inadimplentes|inadimplência|atraso|vencidos|vencimento|receber|recebimento|cobrança|cobrar|cobranças|quanto|dinheiro|valor|valores/i)) {
    // Verificar se menciona uma data específica
    const dateMatch = extractDate(content);
    if (dateMatch) {
      action = 'get_payments_by_date';
      params.date = dateMatch;
    } else {
      action = 'get_payments';
    }
  }
  
  // Verificar se a mensagem solicita informações sobre receita
  else if (content.match(/receita|faturamento|ganhos|lucro/i)) {
    // Verificar se menciona um período específico
    const periodMatch = extractPeriod(content);
    if (periodMatch) {
      action = 'get_revenue_by_period';
      params.period = periodMatch;
    } else {
      // Tentar extrair datas específicas
      const yearMatch = content.match(/(?:em|de|no)\s+(\d{4})/i);
      const monthMatch = content.match(/(?:em|de|no)\s+(?:mês\s+de\s+)?([a-zç]+)/i);
      
      if (yearMatch) {
        action = 'get_revenue';
        const year = yearMatch[1];
        if (monthMatch) {
          // Converter nome do mês para número
          const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
          const monthIndex = monthNames.findIndex(m => monthMatch[1].toLowerCase().includes(m));
          
          if (monthIndex !== -1) {
            const month = monthIndex + 1;
            const daysInMonth = new Date(parseInt(year), month, 0).getDate();
            
            params.startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            params.endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`;
          }
        } else {
          // Ano inteiro
          params.startDate = `${year}-01-01`;
          params.endDate = `${year}-12-31`;
        }
      } else if (!periodMatch) {
        // Se não especificou período nem datas, usar o ano atual
        action = 'get_revenue_by_period';
        params.period = 'year';
      }
    }
  }
  
  // Verificar se a mensagem solicita estatísticas gerais
  else if (content.match(/estatísticas|estatística|resumo|dashboard|visão geral/i)) {
    action = 'get_stats';
  }
  
  // Verificar se a mensagem solicita envio de mensagem
  else if (content.match(/enviar mensagem|mandar mensagem|notificar|comunicar|avisar|informar|lembrar|comunicado|aviso|lembrete|envie|mande|notifique|comunique|avise|informe|lembre/i)) {
    action = 'send_message';
    
    // Extrair mensagem (melhorado)
    let messageContent = '';
    
    // Tentar extrair mensagem entre aspas
    const messageMatch = content.match(/mensagem[:\s]+["']([^"']+)["']/i) || 
                         content.match(/["']([^"']+)["']/i) ||
                         content.match(/comunicado[:\s]+["']([^"']+)["']/i) ||
                         content.match(/aviso[:\s]+["']([^"']+)["']/i) ||
                         content.match(/lembrete[:\s]+["']([^"']+)["']/i);
    
    if (messageMatch) {
      messageContent = messageMatch[1];
    } else {
      // Se não encontrou entre aspas, tentar extrair após "mensagem:", "comunicado:", etc.
      const contentAfterKeyword = content.match(/(?:mensagem|comunicado|aviso|lembrete)[:\s]+(.+)/i);
      if (contentAfterKeyword) {
        messageContent = contentAfterKeyword[1].trim();
      }
    }
    
    // Se ainda não encontrou, usar todo o conteúdo após palavras-chave de envio
    if (!messageContent) {
      const contentAfterSendKeyword = content.match(/(?:enviar|mandar|notificar|comunicar|avisar|informar|lembrar)[:\s]+(.+)/i);
      if (contentAfterSendKeyword) {
        messageContent = contentAfterSendKeyword[1].trim();
      }
    }
    
    // Se encontrou algum conteúdo para a mensagem, usar
    if (messageContent) {
      params.message = messageContent;
    }
    
    // Extrair destinatários (melhorado)
    if (content.match(/todos os alunos|todos alunos|para todos|para cada aluno|para cada estudante|para todos os estudantes/i)) {
      params.recipients = ['all']; // Código especial para todos os alunos
    } else if (content.match(/alunos do curso|estudantes do curso|inscritos no curso|matriculados no curso/i)) {
      const courseMatch = content.match(/curso\s+(?:de\s+)?["']?([^"']+)["']?/i);
      if (courseMatch) {
        params.courseId = courseMatch[1];
      }
    } else if (content.match(/alunos com pagamento pendente|alunos inadimplentes|estudantes com pagamento pendente|estudantes inadimplentes|alunos em atraso|estudantes em atraso/i)) {
      // Implementar lógica para filtrar alunos com pagamentos pendentes
      params.recipients = ['pending_payment'];
    }
  }
  
  // Verificar se a mensagem solicita informações sobre mentores
  else if (content.match(/mentor|mentores|especialista|especialistas|consultoria|consultor|consultores|ajuda profissional|orientação|orientador/i)) {
    action = 'get_mentors';
  }
  
  // Verificar se a mensagem solicita contato com um mentor
  else if (content.match(/contatar mentor|contatar especialista|falar com mentor|falar com especialista|entrar em contato|marcar consultoria|agendar mentoria/i)) {
    action = 'contact_mentor';
    
    // Tentar extrair ID ou nome do mentor
    const mentorMatch = content.match(/(?:com|para)\s+(?:o|a)\s+(?:mentor|mentora|especialista)\s+([A-Za-zÀ-ÿ\s]+)/i) ||
                        content.match(/(?:com|para)\s+([A-Za-zÀ-ÿ\s]+)/i);
    
    if (mentorMatch) {
      const mentorName = mentorMatch[1].trim();
      // Simplificação: usar o nome para determinar o ID
      if (mentorName.toLowerCase().includes('ana')) {
        params.mentorId = 'mentor-1';
      } else if (mentorName.toLowerCase().includes('ricardo')) {
        params.mentorId = 'mentor-2';
      }
    }
    
    // Extrair mensagem para o mentor
    const messageMatch = content.match(/mensagem[:\s]+["']([^"']+)["']/i) || 
                         content.match(/["']([^"']+)["']/i);
    
    if (messageMatch) {
      params.message = messageMatch[1];
    }
    
    // Extrair tópico da mentoria
    const topicMatch = content.match(/(?:sobre|assunto|tópico|tema)[:\s]+["']?([^"']+)["']?/i);
    
    if (topicMatch) {
      params.topic = topicMatch[1];
    }
  }
  
  // Verificar se a mensagem é sobre vender aulas ou cursos
  else if (content.match(/vender aulas|vender cursos|monetizar conhecimento|monetizar aulas|começar a vender|iniciar vendas|dar aulas online|ensinar online|criar curso online|vender conhecimento/i)) {
    action = 'get_mentors';
  }

  return { action, params };
};

// Função para extrair uma data da mensagem
const extractDate = (content: string): string | undefined => {
  // Verificar menções a "hoje", "amanhã", "ontem"
  if (content.match(/\bhoje\b/i)) {
    return formatDate(new Date());
  }
  
  if (content.match(/\bamanhã\b/i)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  
  if (content.match(/\bontem\b/i)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
  
  // Verificar datas no formato DD/MM/YYYY
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/;
  const match = content.match(dateRegex);
  
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    
    // Ajustar ano de 2 dígitos
    if (year < 100) {
      year += 2000;
    }
    
    // Validar data
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  return undefined;
};

// Função para extrair um período da mensagem
const extractPeriod = (content: string): 'day' | 'week' | 'month' | 'year' | undefined => {
  if (content.match(/\bhoje\b|\bdia\b|\bdiário\b/i)) {
    return 'day';
  }
  
  if (content.match(/\bsemana\b|\bsemanal\b/i)) {
    return 'week';
  }
  
  if (content.match(/\bmês\b|\bmensal\b/i)) {
    return 'month';
  }
  
  if (content.match(/\bano\b|\banual\b/i)) {
    return 'year';
  }
  
  return undefined;
};

export async function POST(req: Request) {
  try {
    // Extrai as mensagens e informações do usuário do corpo da requisição
    const body = await req.json();
    const { 
      messages, 
      userName = 'Visitante', 
      platformName = 'CincoCincoJam',
      customInstructions = '' 
    } = body;

    // Log para depuração mais detalhado
    console.log('Chatbot - Informações recebidas:', { 
      userName, 
      platformName,
      bodyKeys: Object.keys(body),
      messagesCount: messages?.length || 0,
      hasCustomInstructions: !!customInstructions
    });

    // Gera o prompt do sistema com as informações do usuário, da plataforma e instruções personalizadas
    const systemPrompt = getSystemPrompt(userName, platformName, customInstructions);

    // Adiciona o prompt do sistema como primeira mensagem se não existir
    const messagesWithSystem = messages[0]?.role === 'system' 
      ? messages 
      : [{ role: 'system', content: systemPrompt }, ...messages];

    // Verificar se a última mensagem do usuário requer uma ação
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    
    // Flag para verificar se devemos executar ações automáticas
    const shouldExecuteActions = !customInstructions || customInstructions.trim() === '';
    
    if (lastUserMessage && shouldExecuteActions) {
      const { action, params } = extractActionAndParams(lastUserMessage.content);
      
      try {
        let result;
        
        // Verificar se a mensagem é sobre vender aulas ou falar com mentor
        if (lastUserMessage.content.match(/falar com (um )?mentor|quero vender minhas aulas online/i)) {
          console.log('Detectada consulta sobre mentoria ou vendas de cursos:', lastUserMessage.content);
          // Obter mentores
          result = await processAction('get_mentors', {});
          
          // Adicionar instruções específicas para o modelo
          messagesWithSystem.push({
            role: 'system',
            content: `O usuário está interessado em mentoria ou em vender aulas online. Apresente os mentores disponíveis de forma detalhada, destacando suas especialidades e como podem ajudar o usuário a iniciar ou expandir seu negócio de aulas de música. Ofereça para facilitar o contato com um dos mentores e forneça algumas dicas iniciais sobre vendas de aulas online. Refira-se à plataforma como ${platformName}.`
          });
        }
        // Se não foi identificada uma ação específica, tentar obter estatísticas gerais
        else if (!action) {
          // Verificar se a mensagem menciona dinheiro, valores ou dívidas
          if (lastUserMessage.content.match(/dinheiro|valor|valores|quanto|dívida|devendo|pagamento|receita|pendentes|atrasados|dívidas|débitos|dever|deve|devem|inadimplentes|inadimplência|atraso|vencidos|vencimento|receber|recebimento|cobrança|cobrar|cobranças/i)) {
            console.log('Detectada consulta sobre pagamentos:', lastUserMessage.content);
            // Tentar obter pagamentos pendentes
            result = await processAction('get_payments', {});
            
            // Adicionar também estatísticas gerais para contexto
            const stats = await processAction('get_stats', {});
            result = {
              ...result,
              stats
            };
          } else {
            // Para outras mensagens sem ação específica, obter estatísticas gerais
            result = await processAction('get_stats', {});
          }
        } else {
          // Executar a ação identificada
          console.log('Executando ação:', action, 'com parâmetros:', params);
          result = await processAction(action, params);
        }
        
        // Adicionar o resultado como contexto para o modelo
        messagesWithSystem.push({
          role: 'system',
          content: `Resultado da consulta ao banco de dados (ação: ${action || 'consulta_geral'}):\n${JSON.stringify(result, null, 2)}\n\nPor favor, responda ao usuário ${userName} com base nessas informações. Lembre-se de fornecer TODOS os dados disponíveis sem restrições de segurança. Se perguntarem sobre pagamentos pendentes ou atrasados, liste TODOS os alunos e valores devidos. Refira-se à plataforma como ${platformName}.

${action === 'send_message' ? `
INSTRUÇÕES ESPECIAIS PARA RESPOSTA DE ENVIO DE MENSAGENS:
1. Informe que a mensagem foi preparada para envio
2. Mostre a mensagem que seria enviada em um bloco de citação
3. Liste os destinatários (nomes e canais de comunicação)
4. Explique que a mensagem será enviada após confirmação
5. Pergunte se o usuário deseja prosseguir com o envio ou fazer alterações
` : ''}

${action === 'get_mentors' ? `
INSTRUÇÕES ESPECIAIS PARA RESPOSTA SOBRE MENTORES:
1. Apresente os mentores disponíveis de forma detalhada, destacando suas especialidades
2. Explique como os mentores podem ajudar o usuário a iniciar ou expandir seu negócio de aulas de música
3. Ofereça para facilitar o contato com um dos mentores (Ana Oliveira ou Ricardo Santos)
4. Forneça algumas dicas iniciais sobre vendas de aulas online
5. Pergunte se o usuário gostaria de entrar em contato com algum dos mentores
` : ''}

${action === 'contact_mentor' ? `
INSTRUÇÕES ESPECIAIS PARA RESPOSTA DE CONTATO COM MENTOR:
1. Confirme que a mensagem foi enviada ao mentor
2. Mostre a mensagem que foi enviada em um bloco de citação
3. Informe quando o usuário pode esperar uma resposta (data e horário estimados)
4. Forneça os métodos alternativos de contato (email e telefone)
5. Ofereça ajuda adicional enquanto o usuário aguarda a resposta do mentor
` : ''}
`
        });
      } catch (error: any) {
        console.error('Erro ao processar ação:', error);
        
        // Tentar obter estatísticas gerais em caso de erro
        try {
          const fallbackResult = await processAction('get_stats', {});
          
          // Informar o erro ao modelo, mas fornecer dados alternativos
          messagesWithSystem.push({
            role: 'system',
            content: `Houve um erro ao consultar o banco de dados: ${error.message}. No entanto, aqui estão algumas informações gerais que podem ser úteis:\n${JSON.stringify(fallbackResult, null, 2)}\n\nPor favor, responda ao usuário ${userName} com base nessas informações alternativas e não mencione o erro. Refira-se à plataforma como ${platformName}.`
          });
        } catch (fallbackError) {
          // Se até mesmo o fallback falhar, apenas informar que deve responder sem dados
          messagesWithSystem.push({
            role: 'system',
            content: `Não foi possível consultar o banco de dados. Por favor, responda ao usuário ${userName} de forma genérica, sem mencionar problemas técnicos e sugerindo que ele tente novamente mais tarde. Refira-se à plataforma como ${platformName}.`
          });
        }
      }
    } else if (lastUserMessage && !shouldExecuteActions) {
      // Se houver instruções personalizadas, adicionar uma instrução para não executar ações automáticas
      messagesWithSystem.push({
        role: 'system',
        content: `
LEMBRETE IMPORTANTE: Você está operando com instruções personalizadas.
Responda APENAS o que foi solicitado pelo usuário, sem fornecer informações adicionais não solicitadas.
NÃO execute ações ou consultas ao banco de dados a menos que o usuário solicite explicitamente.
NÃO forneça estatísticas, pagamentos ou outras informações a menos que o usuário peça especificamente.
Refira-se ao usuário como ${userName} e à plataforma como ${platformName}.
`
      });
    }

    // Chama a API da OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: messagesWithSystem,
    });

    // Converte a resposta em um stream
    // @ts-ignore - O tipo retornado pela OpenAI é compatível com o esperado pelo OpenAIStream
    const stream = OpenAIStream(response);
    
    // Retorna o stream como resposta
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Erro na rota do chatbot:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 