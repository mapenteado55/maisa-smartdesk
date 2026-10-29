import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeMessage } from './shared/analysis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'maisa-smartdesk-api-local',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const result = await analyzeMessage(req.body?.message);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao processar mensagem.';
    const status = message.includes('vazia') || message.includes('limite') ? 400 : 500;
    return res.status(status).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
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
    console.log(`MAISA SmartDesk local ativo em http://localhost:${PORT}`);
  });
}

startServer();
