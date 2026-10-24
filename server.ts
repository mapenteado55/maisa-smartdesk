import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Demo fallback classifier in case API key is not configured or offline
function getDemoFallbackAnalysis(message: string) {
  const lower = message.toLowerCase();
  
  if (lower.includes('cobrança') || lower.includes('fatura') || lower.includes('pagamento') || lower.includes('estorno') || lower.includes('reembolso') || lower.includes('boleto') || lower.includes('preço') || lower.includes('r$') || lower.includes('valor')) {
    return {
      categoria: 'FINANCEIRO',
      prioridade: lower.includes('urgente') || lower.includes('duplicidade') || lower.includes('bloqueio') ? 'ALTA' : 'MÉDIA',
      resumo: 'Solicitação de verificação e regularização de cobrança ou fatura pelo cliente.',
      proxima_acao: 'Verificar extrato no gateway de pagamentos e responder com comprovante ou previsão de estorno.',
      motivo_prioridade: 'Impacto direto em faturamento e percepção financeira do cliente.',
      sugestao_resposta: 'Olá! Recebemos sua mensagem sobre os valores faturados. Nossa equipe financeira já está checando as transações para regularização imediata.',
    };
  }

  if (lower.includes('erro') || lower.includes('bug') || lower.includes('falha') || lower.includes('trava') || lower.includes('não funciona') || lower.includes('502') || lower.includes('lentidão') || lower.includes('login') || lower.includes('acesso')) {
    return {
      categoria: 'SUPORTE',
      prioridade: lower.includes('fechamento') || lower.includes('produção') || lower.includes('urgente') || lower.includes('parou') ? 'ALTA' : 'MÉDIA',
      resumo: 'Relato de incidente técnico que impede a utilização correta da plataforma.',
      proxima_acao: 'Reproduzir o erro em ambiente de homologação, verificar logs de servidor e abrir ticket prioritário para a engenharia.',
      motivo_prioridade: 'Interrupção potencial das operações do usuário na ferramenta.',
      sugestao_resposta: 'Olá! Lamentamos o transtorno técnico ocorrido. Nosso time de engenharia já está investigando os logs desse incidente para restabelecimento rápido.',
    };
  }

  if (lower.includes('plano') || lower.includes('contratar') || lower.includes('orçamento') || lower.includes('demonstração') || lower.includes('preço') || lower.includes('comercial') || lower.includes('enterprise') || lower.includes('licença')) {
    return {
      categoria: 'VENDAS',
      prioridade: 'ALTA',
      resumo: 'Interesse comercial em contratação de plano corporativo e solicitação de demonstração.',
      proxima_acao: 'Qualificar perfil da empresa e agendar reunião de demonstração com o executivo de contas em até 2 horas.',
      motivo_prioridade: 'Oportunidade de aquisição ou expansão com alta intenção de compra.',
      sugestao_resposta: 'Olá! Ficamos muito felizes pelo seu interesse. Será um prazer apresentar a plataforma em uma demonstração rápida nesta semana.',
    };
  }

  if (lower.includes('contrato') || lower.includes('nda') || lower.includes('termo') || lower.includes('endereço') || lower.includes('cadastro') || lower.includes('documento') || lower.includes('cnpj') || lower.includes('razão social')) {
    return {
      categoria: 'ADMINISTRATIVO',
      prioridade: 'MÉDIA',
      resumo: 'Solicitação de trâmite documental e atualização de dados cadastrais da empresa.',
      proxima_acao: 'Atualizar registro cadastral no sistema interno e despachar via canal seguro a via assinada do documento solicitado.',
      motivo_prioridade: 'Conformidade documental e governança contratual periódica.',
      sugestao_resposta: 'Olá! Confirmamos o recebimento da solicitação documental. Nossos dados contratuais já foram encaminhados para atualização cadastral.',
    };
  }

  return {
    categoria: 'OUTROS',
    prioridade: 'BAIXA',
    resumo: 'Mensagem geral de feedback, agradecimento ou dúvida institucional.',
    proxima_acao: 'Responder cordialmente agradecendo a interação e arquivar ou encaminhar para a equipe responsável se necessário.',
    motivo_prioridade: 'Mensagem informativa que não bloqueia fluxos operacionais críticos.',
    sugestao_resposta: 'Olá! Agradecemos muito a sua mensagem e contato com nossa equipe. Estamos sempre à disposição!',
  };
}

// API endpoint to analyze message
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem de cliente vazia ou inválida.' });
    }

    const cleanMessage = message.trim();

    // Check if Gemini API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY não encontrada no ambiente. Utilizando análise inteligente de demonstração.');
      const fallback = getDemoFallbackAnalysis(cleanMessage);
      return res.json(fallback);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analise cuidadosamente a seguinte mensagem fictícia enviada por um cliente para triagem pelo MAISA SmartDesk:
"""
${cleanMessage}
"""

Instruções rigorosas de classificação:
1. categoria: Atribua EXATAMENTE uma das seguintes categorias:
   - "FINANCEIRO": questões de fatura, pagamento, cobrança, reembolso, estorno, dados bancários, duplicidade de boletos.
   - "SUPORTE": problemas técnicos, erros, bugs, indisponibilidade do sistema, dúvidas operacionais de uso, lentidão.
   - "VENDAS": interesse em contratação, upgrade de plano, solicitação de demonstração, orçamentos, cotações.
   - "ADMINISTRATIVO": contratos, notas fiscais, termos legais, atualização cadastral, CNPJ, certidões, NDAs.
   - "OUTROS": elogios, feedbacks gerais, saudações desconexas ou temas não enquadrados acima.

2. prioridade: Atribua EXATAMENTE uma das prioridades:
   - "ALTA": bloqueios operacionais críticos, clientes impossibilitados de trabalhar, erros financeiros graves, prazos vencendo hoje, leads quentes de alto valor.
   - "MÉDIA": dúvidas normais de uso, solicitações rotineiras de documentação, pequenas divergências que não paralisam a operação.
   - "BAIXA": sugestões, elogios, dúvidas gerais sem urgência, felicitações.

3. resumo: Escreva um resumo em português conciso de exatamente UMA linha (máximo 15 a 20 palavras), destacando o cerne do pedido.

4. proxima_acao: Descreva a próxima ação operacional recomendada para o operador humano atender a esse chamado de forma eficiente.

5. motivo_prioridade: Explique brevemente o porquê da prioridade atribuída.

6. sugestao_resposta: Elabore uma mensagem inicial empática, profissional e ágil que o atendente pode enviar ao cliente.`,
        config: {
          systemInstruction: 'Você é o motor de IA do MAISA SmartDesk, especialista em triagem ágil, classificação e atendimento ao cliente empresarial em língua portuguesa.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categoria: {
                type: Type.STRING,
                description: 'Uma entre: FINANCEIRO, SUPORTE, VENDAS, ADMINISTRATIVO, OUTROS',
              },
              prioridade: {
                type: Type.STRING,
                description: 'Uma entre: ALTA, MÉDIA, BAIXA',
              },
              resumo: {
                type: Type.STRING,
                description: 'Resumo conciso da demanda em exatamente uma linha',
              },
              proxima_acao: {
                type: Type.STRING,
                description: 'Próxima ação recomendada para a equipe de atendimento',
              },
              motivo_prioridade: {
                type: Type.STRING,
                description: 'Justificativa para a prioridade selecionada',
              },
              sugestao_resposta: {
                type: Type.STRING,
                description: 'Minuta de resposta recomendada ao cliente',
              },
            },
            required: ['categoria', 'prioridade', 'resumo', 'proxima_acao'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('O modelo não retornou conteúdo de texto.');
      }

      const parsed = JSON.parse(responseText);

      // Validate enums
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
      if (!allowedPriorities.includes(prioridade)) {
        prioridade = 'MÉDIA';
      }

      return res.json({
        categoria,
        prioridade,
        resumo: parsed.resumo || 'Resumo gerado pela triagem automática.',
        proxima_acao: parsed.proxima_acao || 'Verificar solicitação e prosseguir com atendimento.',
        motivo_prioridade: parsed.motivo_prioridade || 'Classificado conforme o impacto e urgência da demanda.',
        sugestao_resposta: parsed.sugestao_resposta || 'Olá! Recebemos sua mensagem e estamos verificando o seu pedido.',
      });
    } catch (genAiError: any) {
      console.error('Falha na chamada Gemini API:', genAiError);
      // Fallback gracefully so user always gets an effective result
      const fallback = getDemoFallbackAnalysis(cleanMessage);
      return res.json(fallback);
    }
  } catch (error: any) {
    console.error('Erro no servidor MAISA SmartDesk:', error);
    return res.status(500).json({
      error: error.message || 'Erro inesperado ao processar mensagem.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAISA SmartDesk ativo e ouvindo na porta ${PORT}`);
  });
}

startServer();
