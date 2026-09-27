import React, { useState } from 'react';
import { MessageCircle, X, ExternalLink, ChevronUp } from 'lucide-react';

export const WHATSAPP_NUMBER = '+258835373674';
export const CLEAN_WHATSAPP_NUMBER = '258835373674';

interface WhatsAppButtonProps {
  customMessage?: string;
  variant?: 'floating' | 'inline';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  customMessage,
  variant = 'floating',
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const defaultTemplates = [
    {
      title: 'Dúvidas Gerais',
      text: 'Olá! Estou no SpacePay e preciso de ajuda.',
    },
    {
      title: 'Suporte pós-compra',
      text: 'Olá! Fiz uma compra no SpacePay e preciso de ajuda com o meu produto.',
    },
    {
      title: 'Dúvidas sobre Afiliados',
      text: 'Olá! Gostaria de saber mais sobre o sistema de afiliados e pagamentos da SpacePay.',
    },
  ];

  const handleOpenWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${CLEAN_WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setPopoverOpen(false);
  };

  if (variant === 'inline') {
    return (
      <button
        onClick={() => handleOpenWhatsApp(customMessage || 'Olá! Estou no SpacePay e preciso de ajuda.')}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
      >
        <MessageCircle className="w-4 h-4 fill-white" />
        <span>Falar no WhatsApp</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {popoverOpen && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-emerald-600 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Suporte SpacePay</h4>
                <p className="text-[10px] text-emerald-100">+258 835373674 · Online</p>
              </div>
            </div>
            <button
              onClick={() => setPopoverOpen(false)}
              className="text-emerald-100 hover:text-white p-1"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 text-slate-700 text-xs space-y-2">
            <p className="text-[11px] text-slate-500 font-medium">
              Escolha uma mensagem para iniciar o atendimento:
            </p>

            {defaultTemplates.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenWhatsApp(item.text)}
                className="w-full text-left p-2.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  "{item.text}"
                </div>
              </button>
            ))}

            <div className="pt-2 text-center">
              <button
                onClick={() => handleOpenWhatsApp('Olá! Estou no SpacePay e preciso de ajuda.')}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Falar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setPopoverOpen(!popoverOpen)}
        className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer font-semibold text-xs group"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline">Falar no WhatsApp</span>
      </button>
    </div>
  );
};
