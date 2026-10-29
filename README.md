# MAISA SmartDesk

Projeto didático do TANDER Bootcamp para triagem de mensagens com IA e validação humana.

## Arquitetura corrigida

- Frontend: React + Vite
- Produção na Vercel: frontend estático + Vercel Function em `api/analyze.ts`
- Desenvolvimento local: `dev-server.ts` integra Express + Vite apenas localmente
- IA: Gemini via variável `GEMINI_API_KEY`
- Fallback: classificador local de demonstração, identificado explicitamente na interface

## Desenvolvimento local

1. Instale dependências:
   `npm install`
2. Copie `.env.example` para `.env`.
3. Preencha `GEMINI_API_KEY` em `.env`.
4. Rode:
   `npm run dev`
5. Abra `http://localhost:3000`.
6. Saúde da API local: `http://localhost:3000/api/health`.

## Deploy na Vercel

1. Envie o projeto ao GitHub.
2. Importe o repositório na Vercel.
3. Framework Preset: Vite (também fixado em `vercel.json`).
4. Em Settings > Environment Variables, crie `GEMINI_API_KEY` para Production e Preview.
5. Faça novo deployment.
6. Valide primeiro `/api/health` e depois a interface.

O endpoint `/api/analyze` é uma Vercel Function nativa; não depende de `server.ts`/Express no ambiente Vercel.

## Segurança

- `.env` é ignorado pelo Git.
- A chave Gemini permanece somente no servidor.
- O frontend chama `/api/analyze` no mesmo domínio.
- Use apenas mensagens fictícias no laboratório.
