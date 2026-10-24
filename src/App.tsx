/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  DollarSign,
  LifeBuoy,
  Briefcase,
  FileText,
  HelpCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Shuffle,
  Send,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  History,
  Info
} from 'lucide-react';

export type Category = 'FINANCEIRO' | 'SUPORTE' | 'VENDAS' | 'ADMINISTRATIVO' | 'OUTROS';
export type Priority = 'ALTA' | 'MÉDIA' | 'BAIXA';

export interface AnalysisResult {
  categoria: Category;
  prioridade: Priority;
  resumo: string;
  proxima_acao: string;
  motivo_prioridade?: string;
  sugestao_resposta?: string;
  originalMessage: string;
  timestamp: string;
}

interface DemoSample {
  id: string;
  label: string;
  category: Category;
  icon: string;
  text: string;
}

const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'financeiro',
    label: 'Cobrança Duplicada',
    category: 'FINANCEIRO',
    icon: '💰',
    text: 'Olá, identificamos uma cobrança em duplicidade referente à fatura de Outubro no valor de R$ 1.450,00 no cartão corporativo da nossa empresa. Precisamos do estorno ou abatimento na próxima fatura com urgência para fechamento contábil.',
  },
  {
    id: 'suporte',
    label: 'Erro 502 no Sistema',
    category: 'SUPORTE',
    icon: '🛠️',
    text: 'Boa tarde! Desde as 9h nossa equipe não consegue exportar os relatórios mensais em PDF. Está aparecendo "Erro interno 502 - Bad Gateway" para todos os 15 usuários do departamento. Isso está paralisando nosso fechamento!',
  },
  {
    id: 'vendas',
    label: 'Upgrade de Plano',
    category: 'VENDAS',
    icon: '🚀',
    text: 'Olá time! Estamos expandindo nossa equipe para 60 colaboradores e queremos migrar para o plano Enterprise com SSO e suporte dedicado. Poderiam enviar uma proposta comercial e agendar uma demonstração ainda esta semana?',
  },
  {
    id: 'administrativo',
    label: 'Contrato e NDA',
    category: 'ADMINISTRATIVO',
    icon: '📋',
    text: 'Prezados, favor enviar a via digital assinada do Acordo de Confidencialidade (NDA) e a certidão negativa de débitos atualizada para renovação cadastral do nosso contrato corporativo anual.',
  },
  {
    id: 'outros',
    label: 'Elogio e Feedback',
    category: 'OUTROS',
    icon: '⭐',
    text: 'Gostaria de registrar meus parabéns a toda a equipe pelo workshop presencial de ontem! O conteúdo foi muito esclarecedor e a organização impecável. Onde podemos acessar os slides da apresentação?',
  },
];

export default function App() {
  const [message, setMessage] = useState<string>(DEMO_SAMPLES[0].text);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  
  // Attendant human adjustments
  const [overrideCategory, setOverrideCategory] = useState<Category | null>(null);
  const [overridePriority, setOverridePriority] = useState<Priority | null>(null);
  const [actionDone, setActionDone] = useState<boolean>(false);

  // Initial analyze on mount with sample 0
  useEffect(() => {
    handleAnalyze(DEMO_SAMPLES[0].text, true);
  }, []);

  const handleAnalyze = async (textToAnalyze?: string, isInitial = false) => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : message).trim();
    if (!text) {
      setError('Por favor, digite ou cole uma mensagem para classificação.');
      return;
    }

    setLoading(true);
    setError(null);
    setOverrideCategory(null);
    setOverridePriority(null);
    setActionDone(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro do servidor (${res.status})`);
      }

      const data = await res.json();
      const newResult: AnalysisResult = {
        categoria: data.categoria as Category,
        prioridade: data.prioridade as Priority,
        resumo: data.resumo,
        proxima_acao: data.proxima_acao,
        motivo_prioridade: data.motivo_prioridade,
        sugestao_resposta: data.sugestao_resposta,
        originalMessage: text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setResult(newResult);
      if (!isInitial) {
        setHistory((prev) => [newResult, ...prev.slice(0, 9)]);
      }
    } catch (err: any) {
      console.error('Erro na requisição:', err);
      setError(err.message || 'Falha ao classificar a mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleSelectDemo = (sample: DemoSample) => {
    setMessage(sample.text);
    handleAnalyze(sample.text);
  };

  const handleRandomSample = () => {
    const random = DEMO_SAMPLES[Math.floor(Math.random() * DEMO_SAMPLES.length)];
    setMessage(random.text);
    handleAnalyze(random.text);
  };

  // Category visual styles
  const getCategoryTheme = (cat: Category) => {
    switch (cat) {
      case 'FINANCEIRO':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          cardBorder: 'border-emerald-200 hover:border-emerald-300',
          icon: DollarSign,
          iconColor: 'text-emerald-600',
          lightBg: 'bg-emerald-500/10',
          description: 'Faturas, pagamentos, estornos, notas fiscais e dados bancários',
        };
      case 'SUPORTE':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          badge: 'bg-blue-600 text-white',
          cardBorder: 'border-blue-200 hover:border-blue-300',
          icon: LifeBuoy,
          iconColor: 'text-blue-600',
          lightBg: 'bg-blue-500/10',
          description: 'Erros técnicos, bugs, indisponibilidade e dúvidas operacionais',
        };
      case 'VENDAS':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          badge: 'bg-purple-600 text-white',
          cardBorder: 'border-purple-200 hover:border-purple-300',
          icon: Briefcase,
          iconColor: 'text-purple-600',
          lightBg: 'bg-purple-500/10',
          description: 'Novas contratações, upgrade de licenças e propostas comerciais',
        };
      case 'ADMINISTRATIVO':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          badge: 'bg-amber-600 text-white',
          cardBorder: 'border-amber-200 hover:border-amber-300',
          icon: FileText,
          iconColor: 'text-amber-600',
          lightBg: 'bg-amber-500/10',
          description: 'Contratos, termos legais, NDAs e atualizações cadastrais',
        };
      case 'OUTROS':
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          badge: 'bg-slate-700 text-white',
          cardBorder: 'border-slate-200 hover:border-slate-300',
          icon: HelpCircle,
          iconColor: 'text-slate-600',
          lightBg: 'bg-slate-500/10',
          description: 'Elogios, dúvidas institucionais ou assuntos não categorizados',
        };
    }
  };

  // Priority visual styles
  const getPriorityTheme = (prio: Priority) => {
    switch (prio) {
      case 'ALTA':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          badge: 'bg-rose-600 text-white',
          cardBorder: 'border-rose-200 hover:border-rose-300',
          dot: 'bg-rose-500 animate-pulse',
          badgeText: 'ALTA PRIORIDADE',
          sla: 'Tempo de resposta recomendado: até 1 hora',
        };
      case 'MÉDIA':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          badge: 'bg-amber-600 text-white',
          cardBorder: 'border-amber-200 hover:border-amber-300',
          dot: 'bg-amber-500',
          badgeText: 'MÉDIA PRIORIDADE',
          sla: 'Tempo de resposta recomendado: até 4 horas',
        };
      case 'BAIXA':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          cardBorder: 'border-emerald-200 hover:border-emerald-300',
          dot: 'bg-emerald-500',
          badgeText: 'BAIXA PRIORIDADE',
          sla: 'Tempo de resposta recomendado: até 24 horas',
        };
    }
  };

  const activeCategory = overrideCategory || result?.categoria || 'OUTROS';
  const activePriority = overridePriority || result?.prioridade || 'MÉDIA';

  const categoryTheme = getCategoryTheme(activeCategory);
  const priorityTheme = getPriorityTheme(activePriority);
  const CategoryIcon = categoryTheme.icon;

  const fullDispatchSummary = result
    ? `📋 [MAISA SmartDesk - Triagem]\n` +
      `• Categoria: ${activeCategory} ${overrideCategory ? '(Ajustado pelo atendente)' : ''}\n` +
      `• Prioridade: ${activePriority} ${overridePriority ? '(Ajustado pelo atendente)' : ''}\n` +
      `• Resumo: ${result.resumo}\n` +
      `• Próxima Ação: ${result.proxima_acao}\n` +
      `\n⚠️ "A IA recomenda; a decisão final é humana."`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  MAISA <span className="text-indigo-600">PENTEADO</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Triagem Inteligente de Atendimento com Gemini IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Modo Operacional Ativo
            </span>
            <button
              onClick={handleRandomSample}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              title="Carregar um exemplo de demonstração aleatório"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exemplo Aleatório</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner with Mandatory Notice */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-lg shadow-indigo-950/10">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-200 text-xs font-semibold uppercase tracking-wider border border-indigo-400/20">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Diretriz de Governança
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                “A IA recomenda; a decisão final é humana.”
              </h1>
              <p className="text-sm text-indigo-200/90 max-w-2xl">
                O assistente classifica o ticket, quantifica a urgência e prepara o despacho. O atendente mantém o controle total para revisar e validar cada ação.
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-end text-xs text-indigo-300/80 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="font-semibold text-white">Segurança Operacional</span>
              <span>Sem banco de dados persistente</span>
              <span>Privacidade em dados de teste</span>
            </div>
          </div>
        </div>

        {/* Demo Samples Quick Buttons */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Mensagens Rápidas de Demonstração
            </span>
            <span className="text-xs text-slate-400">Clique para testar um cenário</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMO_SAMPLES.map((sample) => {
              const isSelected = message === sample.text;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectDemo(sample)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{sample.icon}</span>
                  <span className="font-semibold">{sample.category}:</span>
                  <span className="text-slate-600">{sample.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Box Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="customer-message" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Mensagem do Cliente (Fictícia / Simulação)
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {message.length} caracteres
              </span>
              {message && (
                <button
                  onClick={() => setMessage('')}
                  className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                  title="Limpar texto"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="customer-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cole aqui a mensagem fictícia do cliente (e-mail, WhatsApp, formulário ou ticket de suporte)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition resize-y"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-center">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Dica: Use <strong>Ctrl + Enter</strong> para classificar instantaneamente.</span>
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !message.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processando com Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Analisar e Classificar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Cards Results View */}
        {result && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Resultado da Triagem MAISA</span>
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Processado às {result.timestamp}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Os 4 pilares de análise operacional gerados pelo modelo com validação humana.
                </p>
              </div>

              {/* Copy Full Triage Button */}
              <button
                onClick={() => handleCopy(fullDispatchSummary, 'full')}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              >
                {copiedKey === 'full' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Parecer Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Parecer Completo</span>
                  </>
                )}
              </button>
            </div>

            {/* The 4 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: CLASSIFICAÇÃO / CATEGORIA */}
              <div
                className={`bg-white rounded-2xl border p-5 shadow-xs transition duration-200 flex flex-col justify-between ${categoryTheme.cardBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CategoryIcon className={`w-4 h-4 ${categoryTheme.iconColor}`} />
                      Card 1 • Classificação
                    </span>
                    {overrideCategory && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Alterado por atendente
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-base sm:text-lg font-black tracking-wide ${categoryTheme.badge}`}
                      >
                        <CategoryIcon className="w-5 h-5" />
                        {activeCategory}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {categoryTheme.description}
                    </p>
                  </div>
                </div>

                {/* Human Override Controls */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-2xs text-slate-400 mb-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" /> Decisão Humana (Ajustar Categoria)
                    </span>
                    {overrideCategory && (
                      <button
                        onClick={() => setOverrideCategory(null)}
                        className="text-indigo-600 hover:underline cursor-pointer"
                      >
                        Restaurar IA
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(['FINANCEIRO', 'SUPORTE', 'VENDAS', 'ADMINISTRATIVO', 'OUTROS'] as Category[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setOverrideCategory(cat)}
                        className={`px-2 py-1 rounded text-2xs font-semibold transition cursor-pointer ${
                          activeCategory === cat
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 2: PRIORIDADE */}
              <div
                className={`bg-white rounded-2xl border p-5 shadow-xs transition duration-200 flex flex-col justify-between ${priorityTheme.cardBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-600" />
                      Card 2 • Prioridade Operacional
                    </span>
                    {overridePriority && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Alterado por atendente
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-base sm:text-lg font-black tracking-wide ${priorityTheme.badge}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityTheme.dot}`}></span>
                        {activePriority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {result.motivo_prioridade || priorityTheme.sla}
                    </p>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-2xs font-medium border border-slate-200">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{priorityTheme.sla}</span>
                    </div>
                  </div>
                </div>

                {/* Human Override Controls */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-2xs text-slate-400 mb-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" /> Decisão Humana (Ajustar Prioridade)
                    </span>
                    {overridePriority && (
                      <button
                        onClick={() => setOverridePriority(null)}
                        className="text-indigo-600 hover:underline cursor-pointer"
                      >
                        Restaurar IA
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {(['ALTA', 'MÉDIA', 'BAIXA'] as Priority[]).map((prio) => (
                      <button
                        key={prio}
                        onClick={() => setOverridePriority(prio)}
                        className={`flex-1 py-1 rounded text-2xs font-semibold transition cursor-pointer text-center ${
                          activePriority === prio
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 3: RESUMO DE UMA LINHA */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Card 3 • Resumo de Uma Linha
                    </span>
                    <button
                      onClick={() => handleCopy(result.resumo, 'resumo')}
                      className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      title="Copiar resumo"
                    >
                      {copiedKey === 'resumo' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
                    <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      "{result.resumo}"
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    Síntese concisa orientada para rápida leitura da fila de atendimento.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
                  <span>Validação de síntese: 1 linha</span>
                  <span>Formato padrão MAISA</span>
                </div>
              </div>

              {/* CARD 4: PRÓXIMA AÇÃO SUGERIDA */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                      Card 4 • Próxima Ação Sugerida
                    </span>
                    <button
                      onClick={() => handleCopy(result.proxima_acao, 'acao')}
                      className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      title="Copiar ação"
                    >
                      {copiedKey === 'acao' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => setActionDone(!actionDone)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          actionDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-emerald-400 bg-white hover:border-emerald-600'
                        }`}
                        title="Marcar como concluída pelo atendente"
                      >
                        {actionDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <p
                        className={`text-sm sm:text-base font-semibold text-slate-900 leading-snug ${
                          actionDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {result.proxima_acao}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    {actionDone
                      ? '✓ Marcado como executado pelo atendente responsável.'
                      : 'Diretiva operacional recomendada para o despacho imediato deste chamado.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Fluxo de Despacho
                  </span>
                  <span>Ação sugerida pela IA</span>
                </div>
              </div>
            </div>

            {/* Quick Attendant Reply Assistant */}
            {result.sugestao_resposta && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Minuta Sugerida de Resposta Rápida
                      </h3>
                      <p className="text-xs text-slate-500">
                        Texto de acolhimento para o atendente personalizar e enviar ao cliente.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(result.sugestao_resposta!, 'resposta')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {copiedKey === 'resposta' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Resposta</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans">
                  {result.sugestao_resposta}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session History (In-Memory / Client-Side) */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Histórico de Triagens desta Sessão ({history.length})
              </span>
              <span className="text-2xs text-slate-400">Dados voláteis de demonstração</span>
            </div>

            <div className="divide-y divide-slate-100">
              {history.map((item, idx) => {
                const itemTheme = getCategoryTheme(item.categoria);
                const itemPrioTheme = getPriorityTheme(item.prioridade);
                return (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 rounded-lg px-2 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold ${itemTheme.badge}`}>
                        {item.categoria}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold ${itemPrioTheme.badge}`}>
                        {item.prioridade}
                      </span>
                      <span className="text-slate-700 truncate font-medium max-w-md">
                        {item.resumo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 text-2xs">{item.timestamp}</span>
                      <button
                        onClick={() => {
                          setMessage(item.originalMessage);
                          setResult(item);
                          setOverrideCategory(null);
                          setOverridePriority(null);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5 cursor-pointer text-2xs"
                      >
                        Reabrir <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Disclaimer & Identity */}
        <footer className="pt-6 pb-8 border-t border-slate-200/80 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            “A IA recomenda; a decisão final é humana.”
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            MAISA SmartDesk • Sistema de apoio operacional à triagem de chamados. Classificações orientativas para otimização de tempo de resposta em atendimento corporativo.
          </p>
        </footer>
      </main>
    </div>
  );
}
