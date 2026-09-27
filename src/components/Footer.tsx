import React from 'react';
import { BookOpen, Video, ShieldCheck, Headphones, ExternalLink } from 'lucide-react';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-base">
                S
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Space<span className="text-emerald-400">Pay</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma moçambicana focada exclusivamente na venda, consumo e afiliação de{' '}
              <strong className="text-slate-300">eBooks</strong> e{' '}
              <strong className="text-slate-300">vídeos de dicas práticas</strong>.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Pagamentos Seguros Criptografados
              </span>
            </div>
          </div>

          {/* Col 2: Navegação */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Catálogo & Produtos
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/ebooks')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  eBooks Profissionais
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/videos')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-500" />
                  Vídeos de Dicas Rápidas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/afiliados')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Sistema de Afiliados (Ganhe Comissões)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/criar-produto')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-400"
                >
                  Venda seus Produtos (Taxa 10%)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Métodos de Pagamento */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Pagamentos Seguros em Moçambique
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Processamento instantâneo via gateway oficial e seguro:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] font-semibold text-rose-400">
                M-Pesa
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] font-semibold text-amber-400">
                mCash
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] font-semibold text-blue-400">
                Visa / Mastercard
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Liberação imediata dos eBooks e vídeos após a confirmação.
            </p>
          </div>

          {/* Col 4: Contato & Suporte */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Suporte & Atendimento
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/contactos')}
                  className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors text-slate-300 font-medium cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  Central de Atendimento
                </button>
              </li>
              <li className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => navigate('/termos')}
                  className="hover:text-slate-300 transition-colors cursor-pointer text-[11px]"
                >
                  Termos de Uso
                </button>
                <span>·</span>
                <button
                  onClick={() => navigate('/privacidade')}
                  className="hover:text-slate-300 transition-colors cursor-pointer text-[11px]"
                >
                  Privacidade
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SpacePay. Todos os direitos reservados. Moçambique.</p>
          <p className="flex items-center gap-2">
            <span>Aprenda. Compre. Venda. Ganhe.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
