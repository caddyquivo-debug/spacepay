import React from 'react';
import { ShieldCheck, Mail, Headphones, BookOpen, Video, Share2, ArrowRight } from 'lucide-react';

interface StaticPagesProps {
  page: 'sobre' | 'contactos' | 'termos' | 'privacidade';
  navigate: (route: string) => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({ page, navigate }) => {
  if (page === 'sobre') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
            Sobre a Plataforma
          </span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Conheça o SpacePay
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            A infraestrutura digital focada exclusivamente na democratização e venda de eBooks e vídeos de dicas práticas em Moçambique.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <h3 className="text-base font-bold text-slate-900">Nossa Missão: Simplicidade e Confiança</h3>
          <p>
            O SpacePay nasceu para resolver uma dor clara do mercado moçambicano: a dificuldade de adquirir e comercializar infoprodutos focados diretamente na prática, sem burocracias, com pagamento instantâneo via carteiras móveis nacionais como M-Pesa e mCash.
          </p>
          <p>
            Diferente de plataformas genéricas, o SpacePay tem escopo rigorosamente definido: trabalhamos apenas com <strong className="text-slate-900">eBooks</strong> e <strong className="text-slate-900">vídeos de dicas</strong>. Não hospedamos cursos longos ou módulos dispersos. Tudo o que você compra aqui é direto, aplicável e de alto valor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
              <h4 className="font-bold text-emerald-900 text-xs uppercase">Para Quem Compra</h4>
              <p className="text-xs text-slate-600">
                Acesso imediato no seu painel logo após a confirmação do pagamento (M-Pesa, mCash ou Visa). Sem espera, sem envio manual de comprovantes.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase">Para Afiliados & Criadores</h4>
              <p className="text-xs text-slate-600">
                Divulgue produtos aprovados com links exclusivos e receba comissões automáticas. Criadores pagam apenas 10% de taxa por venda concretizada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contactos') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
            Atendimento & Suporte
          </span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Contacte a Equipa SpacePay
          </h1>
          <p className="text-xs text-slate-500">
            Estamos sempre disponíveis para apoiar nas suas compras, vendas e afiliações.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-4 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-emerald-950 block">Canal Oficial de Atendimento</span>
                <p className="text-xs text-slate-600">Atendimento centralizado e resolução rápida de dúvidas sobre compras, downloads e afiliações.</p>
                <span className="inline-block mt-1 font-semibold text-emerald-700">Horário: Segunda a Sábado das 08h às 18h</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Correio Eletrónico de Apoio</span>
                <p className="text-xs text-slate-600">Questões operacionais, parcerias ou suporte geral ao cliente.</p>
                <span className="font-mono text-xs text-slate-700 font-semibold block mt-1">suporte@spacepay.co.mz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'termos') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Termos de Uso do SpacePay</h1>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>Última atualização: {new Date().getFullYear()}</p>
          <h3 className="font-bold text-slate-900 text-sm">1. Escopo da Plataforma</h3>
          <p>
            O SpacePay é uma plataforma de intermediação para compra, venda e divulgação como afiliado de produtos exclusivamente no formato de eBooks digitais e vídeos de dicas. Não são aceitos outros formatos de produtos.
          </p>
          <h3 className="font-bold text-slate-900 text-sm">2. Pagamentos e Cobranças</h3>
          <p>
            Todas as transações financeiras são processadas através de gateway oficial seguro (suportando M-Pesa, mCash e cartões bancários Visa). Os pagamentos são autenticados no servidor da SpacePay de forma criptografada.
          </p>
          <h3 className="font-bold text-slate-900 text-sm">3. Taxa da Plataforma (10%)</h3>
          <p>
            Para produtos cadastrados pelos usuários, o SpacePay retém uma taxa administrativa de 10% (dez por cento) sobre o valor bruto de cada venda concretizada. As comissões de afiliados eventualmente configuradas pelo vendedor são subtraídas do saldo do produto antes da liquidação final.
          </p>
          <h3 className="font-bold text-slate-900 text-sm">4. Levantamentos de Saldo</h3>
          <p>
            O saldo disponível na carteira do usuário pode ser levantado a qualquer momento, respeitando o valor mínimo de 100 MT, via M-Pesa, mCash ou transferência bancária local.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Política de Privacidade</h1>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          A sua privacidade é fundamental para nós. Esta política descreve como o SpacePay coleta, armazena e protege os seus dados pessoais.
        </p>
        <h3 className="font-bold text-slate-900 text-sm">1. Dados Coletados</h3>
        <p>
          Coletamos nome, endereço de email e número de telemóvel estritamente para identificação de acesso aos produtos comprados, emissão de recibos e processamento de pagamentos através do gateway financeiro oficial.
        </p>
        <h3 className="font-bold text-slate-900 text-sm">2. Segurança Financeira</h3>
        <p>
          O SpacePay não armazena dados confidenciais de cartões de crédito ou PINs do M-Pesa/mCash. Toda a validação de segurança ocorre diretamente nos canais criptografados dos operadores oficiais.
        </p>
      </div>
    </div>
  );
};
