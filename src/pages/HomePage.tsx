import React, { useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BookOpen,
  Video,
  Share2,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  DollarSign,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ebooks = products.filter(p => p.type === 'ebook');
  const videos = products.filter(p => p.type === 'video');
  const bestSellers = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
  const recentProducts = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              {/* Unboxed natural editorial title */}
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span>Plataforma Oficial de Conteúdo Digital</span>
                <span aria-hidden="true">·</span>
                <span>Moçambique</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Aprenda. Compre. <br />
                Venda. <span className="text-emerald-400">Ganhe.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                O SpacePay é a plataforma profissional focada exclusivamente em{' '}
                <strong className="text-white">eBooks de alto valor</strong> e{' '}
                <strong className="text-white">vídeos de dicas práticas</strong>. Compre com M-Pesa, mCash ou Visa, e lucre promovendo como afiliado.
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/ebooks')}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Explorar eBooks
                </button>
                <button
                  onClick={() => navigate('/videos')}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  Ver Vídeos de Dicas
                </button>
                <button
                  onClick={() => navigate('/afiliados')}
                  className="px-6 py-3.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Programa de Afiliados
                </button>
              </div>

              {/* Social Proof adjacency */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 max-w-lg text-xs">
                <div>
                  <span className="block font-bold text-xl text-white tabular-nums">100%</span>
                  <span className="text-slate-400 text-[11px]">Pagamentos Seguros</span>
                </div>
                <div>
                  <span className="block font-bold text-xl text-emerald-400 tabular-nums">M-Pesa · mCash</span>
                  <span className="text-slate-400 text-[11px]">Moçambique</span>
                </div>
                <div>
                  <span className="block font-bold text-xl text-white tabular-nums">10%</span>
                  <span className="text-slate-400 text-[11px]">Taxa justa de venda</span>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-800">
                <img
                  src="/src/assets/images/hero_spacepay_banner_1790278037451.jpg"
                  alt="SpacePay Plataforma Digital"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 p-3.5 rounded-2xl shadow-xl border border-slate-200 hidden sm:flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold block">Acesso Imediato</span>
                  <span className="text-[10px] text-slate-500">Liberação automática após confirmação do PIN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured eBooks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
              <BookOpen className="w-4 h-4" />
              <span>Conhecimento Escrito de Alto Impacto</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              eBooks em Destaque
            </h2>
          </div>
          <button
            onClick={() => navigate('/ebooks')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            Ver todos os eBooks <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks.slice(0, 3).map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(p) => navigate(`/produto/${p.slug}`)}
              onBuyNow={(p) => navigate(`/checkout/${p.slug}`)}
              onBecomeAffiliate={(p) => navigate(`/produto/${p.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* Featured Tip Videos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
              <Video className="w-4 h-4" />
              <span>Prático, Direto e Visual</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Vídeos de Dicas em Destaque
            </h2>
          </div>
          <button
            onClick={() => navigate('/videos')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            Ver todos os vídeos de dicas <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(p) => navigate(`/produto/${p.slug}`)}
              onBuyNow={(p) => navigate(`/checkout/${p.slug}`)}
              onBecomeAffiliate={(p) => navigate(`/produto/${p.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* Affiliate System Explanation Section */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
              Como Funciona o Sistema de Afiliados SpacePay
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Ganhe Dinheiro Indicando eBooks e Vídeos
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Você não precisa criar nenhum produto. Escolha qualquer eBook ou vídeo aprovado pelo administrador, gere seu link exclusivo em um clique e divulgue nas suas redes e WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-800/60 border border-emerald-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white">Escolha um Produto</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Navegue no catálogo de eBooks e vídeos de dicas. Veja o valor exato da comissão que você receberá em Meticais por cada venda.
              </p>
            </div>

            <div className="bg-emerald-800/60 border border-emerald-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white">Gere seu Link Único</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Clique no botão "Ser Afiliado". O sistema cria um link no formato <code className="text-emerald-300">/produto/nome?ref=SEU_ID</code> para você divulgar.
              </p>
            </div>

            <div className="bg-emerald-800/60 border border-emerald-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white">Receba Comissões no M-Pesa</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                O pagamento é confirmado imediatamente no backend e a comissão entra diretamente no seu saldo disponível para levantamento.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/afiliados')}
              className="py-3.5 px-8 bg-white hover:bg-emerald-50 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Acessar Painel de Afiliados
            </button>
          </div>
        </div>
      </section>

      {/* Sell Your Own Products (Taxa 10% SpacePay) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Crie e Venda Seu Próprio Conteúdo
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Você é especialista? Publique seu eBook ou Vídeo de Dicas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                O SpacePay cobra apenas <strong className="text-slate-900">10% de taxa sobre cada venda realizada</strong>. Você cadastra o material, define o preço e a comissão para afiliados, e nós cuidamos do checkout seguro e da entrega imediata.
              </p>

              {/* Example math requested in user prompt */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 max-w-md text-xs space-y-1.5 text-slate-700">
                <div className="font-semibold text-slate-900 pb-1 border-b border-slate-100">
                  Exemplo de Transação Transparente:
                </div>
                <div className="flex justify-between">
                  <span>Preço do Produto:</span>
                  <span className="font-semibold tabular-nums">1.000 MT</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxa SpacePay (10%):</span>
                  <span className="font-semibold tabular-nums text-slate-800">- 100 MT</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-100">
                  <span>Valor Líquido do Vendedor:</span>
                  <span className="tabular-nums">900 MT</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/criar-produto')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Cadastrar Meu Produto para Análise
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Processo de Aprovação</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cadastre com capa, preço e arquivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Status entra como "Em análise"</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Administrador revisa e ativa para vendas</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Receba pagamentos com 90% para você</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers & Recent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
                <TrendingUp className="w-4 h-4" />
                <span>Mais Populares</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Produtos Mais Vendidos
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={(p) => navigate(`/produto/${p.slug}`)}
                onBuyNow={(p) => navigate(`/checkout/${p.slug}`)}
                onBecomeAffiliate={(p) => navigate(`/produto/${p.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to action: Create Account */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Pronto para Começar no SpacePay?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
              Crie sua conta em segundos para comprar os melhores eBooks e vídeos de dicas com entrega automática, ou torne-se afiliado hoje mesmo.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate('/criar-conta')}
                className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Criar Conta Gratuita
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer"
              >
                Já Tenho Conta
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
