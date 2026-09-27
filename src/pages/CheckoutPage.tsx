import React, { useState, useEffect } from 'react';
import { Product, Order, PaymentMethod } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BookOpen,
  Video,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Smartphone,
  CreditCard,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Download,
  FileCheck,
  RefreshCw,
  Radio,
} from 'lucide-react';

interface CheckoutPageProps {
  slug: string;
  navigate: (route: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ slug, navigate }) => {
  const { user, affiliateRef } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');

  // Checkout process state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [hostedPaymentUrl, setHostedPaymentUrl] = useState<string | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);

  // Trigger file download
  const handleDownload = () => {
    if (!product) return;
    const downloadUrl = api.getProductDownloadUrl(product.id, activeOrder?.id, activeOrder?.buyerName);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', product.fileName || `${product.slug}.${product.type === 'ebook' ? 'pdf' : 'mp4'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automatically initiate download when payment completes
  useEffect(() => {
    if (paymentCompleted && product && !autoDownloadTriggered) {
      setAutoDownloadTriggered(true);
      const timer = setTimeout(() => {
        handleDownload();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [paymentCompleted, product, autoDownloadTriggered, activeOrder]);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  // Keep buyer info in sync if user changes
  useEffect(() => {
    if (user) {
      if (!buyerName) setBuyerName(user.name);
      if (!buyerEmail) setBuyerEmail(user.email);
      if (!buyerPhone && user.phone) setBuyerPhone(user.phone);
    }
  }, [user]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await api.getProduct(slug, affiliateRef || undefined);
      setProduct(data.product);
    } catch (err: any) {
      setError(err.message || 'Produto não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      setError('Por favor preencha nome, email e telemóvel para emissão do comprovativo.');
      return;
    }

    // Validate phone for Mozambique (+258)
    const cleanPhone = buyerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError('Por favor informe um número de telemóvel válido (ex: 841234567).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.initiateCheckout({
        productId: product.id,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        paymentMethod,
        affiliateId: affiliateRef || undefined,
      });

      if (result.payment?.status === 'failed') {
        setError(result.payment.error || result.payment.instructions || 'Falha ao processar pelo gateway. Verifique o número informado.');
        return;
      }

      setActiveOrder(result.order);
      setPaymentInstructions(result.payment?.instructions || 'Transação iniciada no gateway oficial.');
      
      const hosted = result.payment?.hostedUrl || result.payment?.redirectUrl;
      if (hosted) {
        setHostedPaymentUrl(hosted);
      }

      if (result.order.status === 'completed' || result.payment?.status === 'completed') {
        setPaymentCompleted(true);
      } else {
        startStatusPolling(result.order.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar transação no gateway oficial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual status check triggered by user
  const handleManualCheck = async () => {
    if (!activeOrder) return;
    setManualChecking(true);
    setCheckFeedback(null);
    try {
      const verifyRes = await api.verifyOrderPayment(activeOrder.id);
      if (verifyRes.status === 'completed' || verifyRes.success) {
        setPaymentCompleted(true);
        setIsPollingStatus(false);
        if (verifyRes.order) setActiveOrder(verifyRes.order);
      } else {
        setCheckFeedback('Ainda aguardando confirmação no telemóvel. Verifique seu celular.');
      }
    } catch (e: any) {
      setCheckFeedback('Aguardando autorização da operadora...');
    } finally {
      setManualChecking(false);
    }
  };

  const startStatusPolling = (orderId: string) => {
    setIsPollingStatus(true);
    const interval = setInterval(async () => {
      try {
        const verifyRes = await api.verifyOrderPayment(orderId);
        if (verifyRes.status === 'completed' || verifyRes.success) {
          clearInterval(interval);
          setIsPollingStatus(false);
          setPaymentCompleted(true);
          if (verifyRes.order) setActiveOrder(verifyRes.order);
        }
      } catch {
        // Silent polling interval retry
      }
    }, 3500);

    setTimeout(() => {
      clearInterval(interval);
      setIsPollingStatus(false);
    }, 240000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-medium">Carregando ambiente seguro de pagamento...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900 mb-2">Erro ao carregar produto</h2>
        <p className="text-xs text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  // --- SUCCESS SCREEN (AUTOMATIC DOWNLOAD IN PROGRESS) ---
  if (paymentCompleted && activeOrder && product) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Pagamento Confirmado com Sucesso
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Parabéns! O seu material foi liberado.
            </h1>
            <p className="text-xs text-slate-600 mt-2">
              Identificação do pedido: <span className="font-mono font-bold text-slate-800">{activeOrder.id}</span> · Referência: <span className="font-mono font-bold text-emerald-700">{activeOrder.netShopReference || activeOrder.id}</span>
            </p>
          </div>

          {/* AUTOMATIC DOWNLOAD PROMINENT BANNER */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl text-left space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                  <Download className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Download Automático Iniciado!
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    O download do arquivo começou no seu dispositivo. Verifique a sua pasta "Downloads".
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 shrink-0">
                100% Automático
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-900 truncate">
                  {product.fileName || (product.type === 'ebook' ? `${product.slug}.pdf` : `${product.slug}.mp4`)}
                </span>
                {product.fileSizeFormatted && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({product.fileSizeFormatted})
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                {product.type === 'ebook' ? 'Formato PDF' : 'Formato MP4'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex items-center gap-4">
            <img
              src={product.coverUrl}
              alt={product.title}
              className="w-16 h-16 object-cover rounded-xl border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">
                {product.type === 'ebook' ? 'eBook Liberado' : 'Vídeo Liberado'}
              </span>
              <h4 className="text-sm font-bold text-slate-900 truncate">{product.title}</h4>
              <p className="text-xs text-slate-500 tabular-nums">
                Valor pago: {activeOrder.amount.toLocaleString('pt-MZ')} MT via {activeOrder.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            {/* Direct Re-download button */}
            <button
              onClick={handleDownload}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar {product.type === 'ebook' ? 'eBook (PDF)' : 'Vídeo de Dicas (MP4)'} Novamente</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {product.type === 'ebook' ? (
                <button
                  onClick={() => navigate('/meus-ebooks')}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Abrir Leitor Online
                </button>
              ) : (
                <button
                  onClick={() => navigate('/meus-videos')}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Assistir no Navegador
                </button>
              )}

              <button
                onClick={() => navigate('/conta')}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Minha Conta & Biblioteca
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Transação registrada com segurança e recibo emitido para {activeOrder.buyerEmail}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- AWAITING REAL PAYMENT ON PHONE / HOSTED CHECKOUT ---
  if (activeOrder && !paymentCompleted) {
    const isMobile = paymentMethod === 'mpesa' || paymentMethod === 'mcash';

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-200">
              <Smartphone className="w-7 h-7 animate-pulse text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
              {isMobile ? 'Cobrança Disparada no seu Telemóvel' : 'Pagamento via Cartão Bancário'}
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {isMobile ? 'Confirme a Transação no seu Celular' : 'Finalizar no Checkout Seguro'}
            </h2>
            <p className="text-xs text-slate-500">
              Referência Comercial: <span className="font-mono font-semibold text-slate-800">{activeOrder.netShopReference || activeOrder.id}</span>
            </p>
          </div>

          {/* REAL MOBILE MONEY WAITING SCREEN (NO PIN INPUT ON SITE!) */}
          {isMobile ? (
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold tracking-wider uppercase text-emerald-400">
                    {paymentMethod === 'mpesa' ? 'M-Pesa Moçambique' : 'mCash Moçambique'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Prompt USSD Ativo</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-200 block text-sm">
                      Mensagem enviada para {activeOrder.buyerPhone}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      "Por favor pegue no seu telemóvel e digite o seu PIN no prompt da operadora para autorizar o débito de <strong className="text-emerald-400">{activeOrder.amount.toLocaleString('pt-MZ')} MT</strong>."
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Monitorando autorização em tempo real:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Conectado ao Gateway
                  </span>
                </div>
              </div>

              {checkFeedback && (
                <div className="p-3 bg-slate-800 rounded-xl text-xs text-amber-300 border border-amber-500/30 text-center">
                  {checkFeedback}
                </div>
              )}

              {/* Status Verification Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={manualChecking}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${manualChecking ? 'animate-spin' : ''}`} />
                  <span>{manualChecking ? 'Verificando com o Gateway...' : 'Já digitei meu PIN no celular / Verificar Agora'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* HOSTED CHECKOUT SCREEN FOR CARD / VISA */
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-bold text-blue-400">Cartão Bancário (Visa / Mastercard)</span>
                <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-bold">
                  3D Secure Oficial
                </span>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Para pagamentos com cartão, clique no botão abaixo para concluir com proteção criptografada e autenticação do seu banco.
                </p>

                {hostedPaymentUrl && (
                  <a
                    href={hostedPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Ir para o Checkout do Cartão</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={handleManualCheck}
                disabled={manualChecking}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${manualChecking ? 'animate-spin' : ''}`} />
                <span>{manualChecking ? 'Verificando...' : 'Verificar Status do Pagamento'}</span>
              </button>
            </div>
          )}

          {/* Details summary */}
          <div className="divide-y divide-slate-100 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl">
            <div className="py-2 flex justify-between">
              <span>Produto:</span>
              <strong className="text-slate-900">{product?.title}</strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Valor Total:</span>
              <strong className="text-slate-900 tabular-nums">{activeOrder.amount.toLocaleString('pt-MZ')} MT</strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Telemóvel do Comprador:</span>
              <strong className="text-slate-900">{activeOrder.buyerPhone}</strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Destino dos Fundos:</span>
              <span className="text-emerald-700 font-semibold">Conta Comercial Oficial</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setActiveOrder(null)}
              className="w-full py-2 px-4 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Alterar Método de Pagamento ou Número
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- INITIAL CHECKOUT FORM ---
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(`/produto/${product!.slug}`)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Produto
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5" />
                <span>Checkout 100% Seguro · SpacePay</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Finalizar Compra
              </h1>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {affiliateRef && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link de indicação ativo (Ref: {affiliateRef})</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Comissão garantida</span>
              </div>
            )}

            <form onSubmit={handleInitiatePayment} className="space-y-5">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Dados do Comprador
                </h3>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ex: Manuel Langa"
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Email para envio do acesso e recibo *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Número de Telemóvel (+258 Moçambique) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Ex: 841234567 ou 821234567"
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    O prompt USSD de confirmação de PIN será enviado diretamente para este telemóvel pela operadora.
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Escolha o Método de Pagamento
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'mpesa'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={() => setPaymentMethod('mpesa')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">M-Pesa</span>
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Confirmação instantânea no seu celular Vodacom
                    </span>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'mcash'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mcash"
                      checked={paymentMethod === 'mcash'}
                      onChange={() => setPaymentMethod('mcash')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">mCash</span>
                      <Smartphone className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Confirmação no seu celular Tmcel
                    </span>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'visa'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="visa"
                      checked={paymentMethod === 'visa'}
                      onChange={() => setPaymentMethod('visa')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Cartão Bancário</span>
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Visa / Mastercard 3D Secure
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Disparando cobrança no gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pagar {product?.price.toLocaleString('pt-MZ')} MT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Resumo do Pedido
            </h3>

            {product && (
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <img
                  src={product.coverUrl}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    {product.type === 'ebook' ? 'eBook Digital' : 'Vídeo de Dicas'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Vendedor: {product.sellerName}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {product?.price.toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de processamento</span>
                <span className="text-emerald-700 font-semibold">Grátis</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Total a Pagar</span>
                <span className="font-extrabold text-slate-900 text-xl tabular-nums">
                  {product?.price.toLocaleString('pt-MZ')}{' '}
                  <span className="text-xs text-emerald-700 font-bold">MT</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantia de Entrega Imediata SpacePay</span>
              </div>
              <p>
                Assim que a transação for confirmada pelo seu telemóvel, o download começa automaticamente no seu dispositivo e o acesso vitalício fica liberado na sua biblioteca.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
