import React, { useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BookOpen,
  Video,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Download,
  FileCheck,
} from 'lucide-react';

interface ProductDetailPageProps {
  identifier: string;
  navigate: (route: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  identifier,
  navigate,
}) => {
  const { user, affiliateRef } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      localStorage.setItem('spacepay_ref', refParam);
    }
    loadProduct();
  }, [identifier]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProduct(identifier, affiliateRef || undefined);
      setProduct(data.product);
    } catch (err: any) {
      setError(err.message || 'Produto não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateUrl = () => {
    if (!product) return '';
    const origin = window.location.origin;
    const refId = user?.id || 'SEU_ID';
    return `${origin}/produto/${product.slug}?ref=${refId}`;
  };

  const copyAffiliateLink = () => {
    navigator.clipboard.writeText(getAffiliateUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareViaWhatsApp = () => {
    if (!product) return;
    const link = getAffiliateUrl();
    const text = encodeURIComponent(
      `Confira este excelente ${product.type === 'ebook' ? 'eBook' : 'vídeo de dicas'}: "${product.title}" por apenas ${product.price} MT no SpacePay: ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-medium">Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Produto não encontrado</h2>
        <p className="text-xs text-slate-600 mb-6">{error || 'O produto solicitado pode ter sido desativado ou não existe.'}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1 as any)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Media & Previews */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              <img
                src={product.coverUrl || (product.type === 'video' ? '/src/assets/images/product_video_financas_1790278058234.jpg' : '/src/assets/images/product_ebook_cv_1790278048991.jpg')}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = product.type === 'video'
                    ? '/src/assets/images/product_video_financas_1790278058234.jpg'
                    : '/src/assets/images/product_ebook_cv_1790278048991.jpg';
                }}
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 shadow-sm flex items-center gap-2">
                {product.type === 'ebook' ? (
                  <>
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>eBook Digital</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Vídeo de Dicas</span>
                  </>
                )}
              </div>
            </div>

            {/* Description & Overview */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
                  Sobre este {product.type === 'ebook' ? 'eBook' : 'Vídeo'}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Sample excerpt or Dicas preview */}
              {product.previewDicas && product.previewDicas.length > 0 && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>O que você vai aprender & aplicar</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {product.previewDicas.map((dica, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{dica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Table of Contents / Dicas chapters */}
              {product.tableOfContents && product.tableOfContents.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    {product.type === 'ebook' ? 'Índice de Capítulos' : 'Roteiro de Dicas em Vídeo'}
                  </h3>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    {product.tableOfContents.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                        <span className="font-medium text-slate-800">{item.title}</span>
                        <span className="text-slate-400 text-[11px] tabular-nums">{item.pagesOrDuration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample reader extract */}
              {product.contentSample && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                    Prévia do Conteúdo
                  </h4>
                  <p className="text-xs text-slate-600 italic leading-relaxed border-l-2 border-emerald-500 pl-3">
                    "{product.contentSample}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Module & Affiliate Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-24 space-y-6">
            <div>
              {/* Unboxed metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>Vendedor: <strong className="text-slate-700 font-semibold">{product.sellerName}</strong></span>
                <span aria-hidden="true">·</span>
                <span>{product.salesCount} vendas</span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Pricing Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Preço Final</span>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {product.price.toLocaleString('pt-MZ')}{' '}
                  <span className="text-sm font-semibold text-emerald-700">MT</span>
                </div>
              </div>

              {product.allowAffiliates && product.affiliateCommission > 0 && (
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Comissão Afiliado</span>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">
                    +{product.affiliateCommission.toLocaleString('pt-MZ')} MT
                  </span>
                  <span className="text-[10px] text-slate-400 block">por indicação</span>
                </div>
              )}
            </div>

            {/* Primary Action Buttons (Requested in Prompt) */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/checkout/${product.slug}`)}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                Comprar Agora
              </button>

              {product.allowAffiliates && (
                <button
                  onClick={() => setShowAffiliateModal(true)}
                  className="w-full py-3 px-6 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Ser Afiliado deste Produto
                </button>
              )}
            </div>

            {/* Trust & Instant Delivery Info */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Download Automático Imediato</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Assim que o pagamento (M-Pesa, mCash ou Cartão Bancário) for confirmado, o arquivo {product.type === 'ebook' ? 'PDF' : 'vídeo'} é baixado automaticamente no seu dispositivo.
                </p>
                {product.fileName && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-600 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{product.fileName} {product.fileSizeFormatted ? `(${product.fileSizeFormatted})` : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Acesso vitalício guardado na sua biblioteca SpacePay</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pagamento oficial seguro: M-Pesa, mCash ou Cartão Bancário</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Download imediato e suporte garantido</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Modal / Drawer */}
      {showAffiliateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide block">
                  Programa de Afiliados SpacePay
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Divulgue e ganhe {product.affiliateCommission} MT por venda
                </h3>
              </div>
              <button
                onClick={() => setShowAffiliateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Toda vez que alguém comprar este {product.type === 'ebook' ? 'eBook' : 'vídeo'} através do seu link exclusivo, o sistema identifica sua indicação, calcula e credita automaticamente a comissão de{' '}
              <strong className="text-emerald-700">{product.affiliateCommission.toLocaleString('pt-MZ')} MT</strong> na sua carteira SpacePay.
            </p>

            {user ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-800 block">
                  Seu Link Exclusivo de Afiliado:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getAffiliateUrl()}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-700 select-all"
                  />
                  <button
                    onClick={copyAffiliateLink}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Compartilhar no WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setShowAffiliateModal(false);
                      navigate('/afiliados');
                    }}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Minha Área de Afiliado
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  Para gerar o seu ID único e rastrear seus ganhos no M-Pesa/mCash, entre ou crie sua conta gratuita:
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowAffiliateModal(false);
                      navigate('/login');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setShowAffiliateModal(false);
                      navigate('/criar-conta');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                  >
                    Criar Conta Grátis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
