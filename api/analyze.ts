import { analyzeMessage } from '../shared/analysis';

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Método não permitido. Use POST.' },
        { status: 405, headers: { Allow: 'POST' } },
      );
    }

    try {
      const body = await request.json();
      const result = await analyzeMessage(body?.message);
      return Response.json(result, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao processar mensagem.';
      const status = message.includes('vazia') || message.includes('limite') ? 400 : 500;
      return Response.json({ error: message }, { status });
    }
  },
};
