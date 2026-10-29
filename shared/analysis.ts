import { GoogleGenAI, Type } from '@google/genai';

export type AnalysisEngine = 'GEMINI' | 'FALLBACK_DEMO';

export interface AnalysisPayload {
  categoria: 'FINANCEIRO' | 'SUPORTE' | 'VENDAS' | 'ADMINISTRATIVO' | 'OUTROS';
  prioridade: 'ALTA' | 'MÉDIA' | 'BAIXA';
  resumo: string;
  proxima_acao: string;
  motivo_prioridade: string;
  sugestao_resposta: string;
  engine: AnalysisEngine;
  warning?: string;
}

const MAX_MESSAGE_LENGTH = 5000;

function getDemoFallbackAnalysis(message: string): Omit<AnalysisPayload, 'engine' | 'warning'> {
  const lower = message.toLowerCase();

  // VENDAS vem antes de FINANCEIRO para evitar que "preço do plano" seja
  // classificado como cobrança/faturamento apenas por conter a palavra "preço".
  if (
    lower.includes('plano') ||
    lower.includes('contratar') ||
    lower.includes('orçamento') ||
    lower.includes('demonstração') ||
    lower.includes('preço') ||
    lower.includes('comercial') ||
    lower.includes('enterprise') ||
    lower.includes('licença')
  ) {
    return {
      categoria: 'VENDAS',
      prioridade: 'ALTA',
      resumo: 'Interesse comercial em contratação de plano corporativo e solicitação de demonstração.',
      proxima_acao: 'Qualificar o perfil da empresa e agendar uma demonstração com o executivo de contas.',
      motivo_prioridade: 'Oportunidade de aquisição ou expansão com intenção explícita de compra.',
      sugestao_resposta: 'Olá! Obrigado pelo interesse. Podemos apresentar a solução e entender o cenário da sua empresa em uma demonstração rápida.',
    };
  }

  if (
    lower.includes('cobrança') ||
    lower.includes('fatura') ||
    lower.includes('pagamento') ||
    lower.includes('estorno') ||
    lower.includes('reembolso') ||
    lower.includes('boleto') ||
    lower.includes('r$') ||
    lower.includes('valor')
  ) {
    return {
      categoria: 'FINANCEIRO',
      prioridade:
        lower.includes('urgente') || lower.includes('duplicidade') || lower.includes('bloqueio')
          ? 'ALTA'
          : 'MÉDIA',
      resumo: 'Solicitação de verificação e regularização de cobrança ou fatura pelo cliente.',
      proxima_acao: 'Verificar o extrato no gateway de pagamentos e responder com comprovante ou previsão de regularização.',
      motivo_prioridade: 'Impacto direto no faturamento e na percepção financeira do cliente.',
      sugestao_resposta: 'Olá! Recebemos sua mensagem sobre os valores faturados. Nossa equipe financeira está verificando as transações para orientar a regularização.',
    };
  }

  if (
    lower.includes('erro') ||
    lower.includes('bug') ||
    lower.includes('falha') ||
    lower.includes('trava') ||
    lower.includes('não funciona') ||
    lower.includes('502') ||
    lower.includes('lentidão') ||
    lower.includes('login') ||
    lower.includes('acesso')
  ) {
    return {
      categoria: 'SUPORTE',
      prioridade:
        lower.includes('fechamento') || lower.includes('produção') || lower.includes('urgente') || lower.includes('parou')
          ? 'ALTA'
          : 'MÉDIA',
      resumo: 'Relato de incidente técnico que impede ou degrada a utilização correta da plataforma.',
      proxima_acao: 'Reproduzir o erro, verificar logs e abrir atendimento prioritário para a equipe técnica.',
      motivo_prioridade: 'Há risco de interrupção ou degradação da operação do usuário.',
      sugestao_resposta: 'Olá! Recebemos o relato técnico e já iniciamos a análise. Vamos verificar os registros do incidente e retornar com a próxima ação.',
    };
  }

  if (
    lower.includes('contrato') ||
    lower.includes('nda') ||
    lower.includes('termo') ||
    lower.includes('endereço') ||
    lower.includes('cadastro') ||
    lower.includes('documento') ||
    lower.includes('cnpj') ||
    lower.includes('razão social') ||
    lower.includes('nota fiscal') ||
    lower.includes('certidão')
  ) {
    return {
      categoria: 'ADMINISTRATIVO',
      prioridade: 'MÉDIA',
      resumo: 'Solicitação de trâmite documental ou atualização de dados cadastrais da empresa.',
      proxima_acao: 'Validar a documentação solicitada e encaminhar o item correto pelo canal corporativo definido.',
      motivo_prioridade: 'Demanda ligada a conformidade documental e continuidade administrativa.',
      sugestao_resposta: 'Olá! Confirmamos o recebimento da solicitação documental. Vamos validar os dados e retornar pelo canal corporativo adequado.',
    };
  }

  return {
    categoria: 'OUTROS',
    prioridade: 'BAIXA',
    resumo: 'Mensagem geral de feedback, agradecimento ou dúvida institucional.',
    proxima_acao: 'Responder cordialmente e encaminhar para a equipe responsável se houver necessidade de ação.',
    motivo_prioridade: 'Mensagem informativa sem indício de bloqueio operacional crítico.',
    sugestao_resposta: 'Olá! Agradecemos muito sua mensagem. Registramos o contato e permanecemos à disposição.',
  };
}

function validateMessage(message: unknown): string {
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Mensagem de cliente vazia ou inválida.');
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres.`);
  }

  return cleanMessage;
}

export async function analyzeMessage(message: unknown): Promise<AnalysisPayload> {
  const cleanMessage = validateMessage(message);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return {
      ...getDemoFallbackAnalysis(cleanMessage),
      engine: 'FALLBACK_DEMO',
      warning: 'GEMINI_API_KEY não configurada. Resultado gerado pelo classificador local de demonstração.',
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'maisa-smartdesk',
      },
    },
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analise cuidadosamente a seguinte mensagem fictícia enviada por um cliente para triagem pelo MAISA SmartDesk:\n"""\n${cleanMessage}\n"""\n\nInstruções rigorosas de classificação:\n1. categoria: use EXATAMENTE FINANCEIRO, SUPORTE, VENDAS, ADMINISTRATIVO ou OUTROS.\n2. prioridade: use EXATAMENTE ALTA, MÉDIA ou BAIXA.\n3. resumo: uma linha, entre 15 e 20 palavras.\n4. proxima_acao: próxima ação operacional recomendada ao atendente humano.\n5. motivo_prioridade: justificativa curta da prioridade.\n6. sugestao_resposta: minuta profissional, empática e objetiva para o atendente revisar antes do envio.`,
      config: {
        systemInstruction:
          'Você é o motor de IA do MAISA SmartDesk, especializado em triagem de atendimento empresarial em português. A IA recomenda; a decisão final permanece humana.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria: { type: Type.STRING },
            prioridade: { type: Type.STRING },
            resumo: { type: Type.STRING },
            proxima_acao: { type: Type.STRING },
            motivo_prioridade: { type: Type.STRING },
            sugestao_resposta: { type: Type.STRING },
          },
          required: [
            'categoria',
            'prioridade',
            'resumo',
            'proxima_acao',
            'motivo_prioridade',
            'sugestao_resposta',
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('O modelo não retornou conteúdo de texto.');
    }

    const parsed = JSON.parse(responseText);
    const allowedCategories = ['FINANCEIRO', 'SUPORTE', 'VENDAS', 'ADMINISTRATIVO', 'OUTROS'];
    const allowedPriorities = ['ALTA', 'MÉDIA', 'BAIXA'];

    let categoria = String(parsed.categoria || 'OUTROS').toUpperCase().trim();
    if (!allowedCategories.includes(categoria)) {
      if (categoria.includes('FINAN')) categoria = 'FINANCEIRO';
      else if (categoria.includes('SUPORT')) categoria = 'SUPORTE';
      else if (categoria.includes('VENDA')) categoria = 'VENDAS';
      else if (categoria.includes('ADMIN')) categoria = 'ADMINISTRATIVO';
      else categoria = 'OUTROS';
    }

    let prioridade = String(parsed.prioridade || 'MÉDIA').toUpperCase().trim();
    if (prioridade === 'MEDIA') prioridade = 'MÉDIA';
    if (!allowedPriorities.includes(prioridade)) prioridade = 'MÉDIA';

    return {
      categoria: categoria as AnalysisPayload['categoria'],
      prioridade: prioridade as AnalysisPayload['prioridade'],
      resumo: String(parsed.resumo || 'Resumo gerado pela triagem automática.'),
      proxima_acao: String(parsed.proxima_acao || 'Verificar solicitação e prosseguir com atendimento.'),
      motivo_prioridade: String(parsed.motivo_prioridade || 'Classificação baseada no impacto e urgência da demanda.'),
      sugestao_resposta: String(parsed.sugestao_resposta || 'Olá! Recebemos sua mensagem e estamos verificando o pedido.'),
      engine: 'GEMINI',
    };
  } catch (error) {
    console.error('Falha na chamada Gemini API:', error);
    return {
      ...getDemoFallbackAnalysis(cleanMessage),
      engine: 'FALLBACK_DEMO',
      warning: 'A chamada ao Gemini falhou. O resultado exibido veio do classificador local de demonstração.',
    };
  }
}
