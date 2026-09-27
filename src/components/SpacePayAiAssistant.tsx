import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  RefreshCw,
  Zap,
  TrendingUp,
  Share2,
  DollarSign,
  HelpCircle,
  X,
  ChevronDown,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface SpacePayAiAssistantProps {
  sellerContext?: {
    sellerName?: string;
    totalGross?: number;
    totalNetEarned?: number;
    totalSalesCount?: number;
    totalProductsCount?: number;
    totalAffiliateEarnings?: number;
    activeProducts?: string[];
  };
  onClose?: () => void;
  isCompact?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Alavancar Vendas no WhatsApp',
    prompt: 'Como criar uma estratégia prática de divulgação no WhatsApp para vender mais eBooks e vídeos de dicas em Moçambique?',
  },
  {
    icon: Share2,
    label: 'Atrair Melhores Afiliados',
    prompt: 'Qual porcentagem de comissão e quais materiais devo disponibilizar para incentivar afiliados a promoverem meus infoprodutos?',
  },
  {
    icon: DollarSign,
    label: 'Analisar Faturamento & Lucro',
    prompt: 'Com base no meu volume de vendas e na taxa de 10% da SpacePay, como posso otimizar meu faturamento líquido e reinvestir?',
  },
  {
    icon: Sparkles,
    label: 'Ideias de Infoprodutos em Alta',
    prompt: 'Quais temas de eBooks e Vídeos de Dicas têm maior demanda e conversão imediata no mercado moçambicano?',
  },
];

export const SpacePayAiAssistant: React.FC<SpacePayAiAssistantProps> = ({
  sellerContext,
  onClose,
  isCompact = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Olá${sellerContext?.sellerName ? `, ${sellerContext.sellerName}` : ''}! Sou o **SpacePay Assistente IA**, especialista em infoprodutos digitais e afiliados em Moçambique.

Estou pronto para analisar seus gráficos de desempenho, propor copys de alta conversão para o WhatsApp, calibrar suas comissões de afiliados e sugerir novos temas de eBooks ou vídeos práticos.

Como posso impulsionar suas vendas hoje?`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [showModelPicker, setShowModelPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send conversation history to backend Gemini API
      const apiPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendAiChat({
        messages: apiPayload,
        model: selectedModel,
        sellerContext,
      });

      const modelMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ Não foi possível obter uma resposta agora: ${err.message || 'Erro de conexão'}. Por favor, tente novamente.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: 'Histórico reiniciado. Em que posso te ajudar agora para acelerar suas vendas no SpacePay?',
        timestamp: new Date(),
      },
    ]);
  };

  const formatText = (text: string) => {
    // Basic Markdown styling helper (bold, lists, headings)
    return text.split('\n').map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 mt-2 mb-1 text-xs">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // List item
      if (line.match(/^(\d+\.|\*|-)\s/)) {
        const cleaned = line.replace(/^(\d+\.|\*|-)\s/, '');
        return (
          <li key={idx} className="ml-3 my-0.5 list-disc text-slate-700 text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: parseBold(cleaned) }} />
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed mb-1">
          <span dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
        </p>
      );
    });
  };

  const parseBold = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-emerald-800 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg ${isCompact ? 'h-[540px]' : 'h-[620px]'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-wide">SpacePay Assistente IA</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-emerald-200">Consultor Estratégico de Vendas & Afiliados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-white/10 text-emerald-100"
              title="Trocar modelo Gemini"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{selectedModel === 'gemini-3.8-flash' ? '3.8 Flash' : 'Flash Lite'}</span>
              <ChevronDown className="w-3 h-3 text-emerald-300" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 text-[11px] space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.8-flash');
                    setShowModelPicker(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                    selectedModel === 'gemini-3.8-flash' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Gemini 3.8 Flash</span>
                  <span className="text-[9px] opacity-80">Principal</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.1-flash-lite');
                    setShowModelPicker(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                    selectedModel === 'gemini-3.1-flash-lite' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Gemini Flash Lite</span>
                  <span className="text-[9px] opacity-80">Rápido</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Limpar conversa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed animate-in fade-in-50 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none space-y-1'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>{formatText(msg.content)}</div>
                )}
                <div
                  className={`text-[9px] mt-1.5 flex items-center justify-end ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('pt-MZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-xs animate-in fade-in">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-xs flex items-center gap-2 text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>O SpacePay IA está formulando sua análise estratégica...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none">
          {STARTER_PROMPTS.map((starter, idx) => {
            const Icon = starter.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(starter.prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                <Icon className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{starter.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre gráficos, estratégias no WhatsApp, comissões..."
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none max-h-24 leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-colors"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
          <span>Pressione Enter para enviar</span>
          <span>Modelo ativo: {selectedModel}</span>
        </div>
      </div>
    </div>
  );
};
