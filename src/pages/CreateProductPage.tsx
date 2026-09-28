import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ProductType } from '../types/index.ts';
import { FileUploadDropzone } from '../components/FileUploadDropzone.tsx';
import {
  BookOpen,
  Video,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

interface CreateProductPageProps {
  navigate: (route: string) => void;
}

export const CreateProductPage: React.FC<CreateProductPageProps> = ({ navigate }) => {
  const { user, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProductType>('ebook');
  const [price, setPrice] = useState('300');
  const [affiliateCommission, setAffiliateCommission] = useState('50');
  const [coverUrl, setCoverUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [fileSizeFormatted, setFileSizeFormatted] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [dicasList, setDicasList] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available curated cover presets
  const presets = [
    { label: 'Capa Carreira & CV', url: '/src/assets/images/product_ebook_cv_1790278048991.jpg', forType: 'ebook' },
    { label: 'Capa Negócios & Marketing', url: '/src/assets/images/product_ebook_marketing_1790278069189.jpg', forType: 'ebook' },
    { label: 'Capa Finanças & Dinheiro', url: '/src/assets/images/product_video_financas_1790278058234.jpg', forType: 'video' },
    { label: 'Capa Vendas & Negociação', url: '/src/assets/images/product_video_vendas_1790278079930.jpg', forType: 'video' },
  ];

  const numPrice = Number(price) || 0;
  const numComm = Number(affiliateCommission) || 0;
  const spacePayFee = Math.round(numPrice * 0.10);
  const sellerShare = Math.max(0, numPrice - spacePayFee - numComm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!title.trim() || !description.trim() || !price) {
      setError('Preencha os campos obrigatórios do produto.');
      return;
    }

    if (numPrice < 50) {
      setError('O preço mínimo para comercialização é de 50 MT.');
      return;
    }

    if (numComm > numPrice * 0.7) {
      setError('A comissão de afiliado não pode exceder 70% do valor do produto.');
      return;
    }

    if (!fileName && !fileUrl && !videoUrl && !uploadedFileUrl) {
      setError(
        type === 'ebook'
          ? 'Por favor, faça o upload do arquivo PDF do seu eBook para permitir que o cliente baixe automaticamente após pagar.'
          : 'Por favor, faça o upload do arquivo de vídeo ou informe o link para permitir o download e acesso do cliente.'
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedDicas = dicasList
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    try {
      const selectedCover = coverUrl || (type === 'ebook' ? presets[0].url : presets[2].url);

      const res = await api.createProduct({
        title: title.trim(),
        description: description.trim(),
        type,
        price: numPrice,
        affiliateCommission: numComm,
        coverUrl: selectedCover,
        fileUrl: type === 'ebook' ? (uploadedFileUrl || fileUrl.trim() || undefined) : undefined,
        videoUrl: type === 'video' ? (uploadedFileUrl || videoUrl.trim() || undefined) : undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        fileSizeFormatted: fileSizeFormatted || undefined,
        previewDicas: parsedDicas,
      });

      setSuccess(res.message);
      setTimeout(() => {
        navigate('/meus-produtos');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Venda seus Infoprodutos no SpacePay</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Cadastre seu eBook (PDF) ou Vídeo de Dicas Práticas e comece a vender em todo Moçambique com pagamentos M-Pesa e mCash.
        </p>
        <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 p-3 rounded-xl leading-relaxed">
          Taxa transparente da plataforma: 10% cobrada automaticamente sobre o valor de cada venda confirmada.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            Entrar na Minha Conta
          </button>
          <button
            onClick={() => navigate('/criar-conta')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Criar Nova Conta Grátis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        onClick={() => navigate('/conta')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
            Publicação de Infoproduto
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Cadastrar eBook ou Vídeo de Dicas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Preencha os detalhes do seu material. A taxa de 10% do SpacePay é cobrada automaticamente para a administração em cada venda confirmada.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Produto (EXCLUSIVAMENTE eBook ou Vídeo de Dicas) */}
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-2">
              1. Tipo de Produto *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  type === 'ebook'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="ebook"
                  checked={type === 'ebook'}
                  onChange={() => setType('ebook')}
                  className="sr-only"
                />
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">eBook Digital</span>
                  <span className="text-[11px] text-slate-500">Livro em PDF para leitura ou download</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  type === 'video'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="video"
                  checked={type === 'video'}
                  onChange={() => setType('video')}
                  className="sr-only"
                />
                <Video className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Vídeo de Dicas</span>
                  <span className="text-[11px] text-slate-500">Vídeo prático para assistir na plataforma</span>
                </div>
              </label>
            </div>
          </div>

          {/* Título & Descrição */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Título do Produto *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como Conquistar Clientes no WhatsApp em Moçambique"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Descrição Completa *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o conteúdo, para quem é indicado e quais problemas este material resolve..."
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Valores, Comissão e Divisão da Taxa de 10% */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              2. Preço, Comissão e Divisão de Valores
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Preço de Venda (Meticais - MT) *
                </label>
                <input
                  type="number"
                  min="50"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Comissão para Afiliados (MT)
                </label>
                <input
                  type="number"
                  min="0"
                  max={numPrice * 0.7}
                  value={affiliateCommission}
                  onChange={(e) => setAffiliateCommission(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums text-emerald-600"
                />
              </div>
            </div>

            {/* Live Financial Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Cálculo Transparente SpacePay por Venda:</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Preço Bruto:</span>
                <span className="tabular-nums font-semibold text-slate-900">{numPrice.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Taxa SpacePay (10% sobre o produto):</span>
                <span className="tabular-nums font-semibold text-slate-800">- {spacePayFee.toLocaleString('pt-MZ')} MT</span>
              </div>
              {numComm > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Comissão do Afiliado:</span>
                  <span className="tabular-nums font-semibold">- {numComm.toLocaleString('pt-MZ')} MT</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-700 font-bold pt-2 border-t border-slate-100">
                <span>Seu Rendimento Líquido:</span>
                <span className="tabular-nums text-sm font-extrabold">{sellerShare.toLocaleString('pt-MZ')} MT</span>
              </div>
            </div>
          </div>

          {/* Capa e Arquivo Digital */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                3. Arquivo Digital & Capa do Produto
              </h4>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Download Automático Pós-Pagamento
              </span>
            </div>

            {/* DIRECT FILE UPLOAD (PDF for eBook, MP4 for Video) */}
            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
              <FileUploadDropzone
                productType={type}
                fileName={fileName}
                fileSizeFormatted={fileSizeFormatted}
                fileUrl={uploadedFileUrl || (type === 'ebook' ? fileUrl : videoUrl)}
                onFileUploaded={(result) => {
                  setFileName(result.fileName);
                  setFileSize(result.fileSize);
                  setFileSizeFormatted(result.fileSizeFormatted);
                  setUploadedFileUrl(result.fileUrl);
                  if (type === 'ebook') {
                    setFileUrl(result.fileUrl);
                  } else {
                    setVideoUrl(result.fileUrl);
                  }
                }}
                onFileRemoved={() => {
                  setFileName('');
                  setFileSize(undefined);
                  setFileSizeFormatted('');
                  setUploadedFileUrl('');
                  if (type === 'ebook') setFileUrl('');
                  else setVideoUrl('');
                }}
                externalUrl={type === 'ebook' ? fileUrl : videoUrl}
                onExternalUrlChange={(url) => {
                  if (type === 'ebook') setFileUrl(url);
                  else setVideoUrl(url);
                }}
              />
            </div>

            {/* SELEÇÃO OU UPLOAD DA CAPA */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-2">
                Escolha uma Capa Profissional ou insira URL da Capa:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverUrl(preset.url)}
                    className={`p-2 border rounded-xl text-left cursor-pointer transition-all ${
                      coverUrl === preset.url ? 'border-emerald-600 ring-2 ring-emerald-500' : 'border-slate-200'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full aspect-[4/3] object-cover rounded-lg mb-1.5" />
                    <span className="text-[10px] font-semibold text-slate-700 block truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Ou cole a URL direta de uma imagem personalizada..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Dicas Principais Abordadas (Uma por linha)
              </label>
              <textarea
                rows={3}
                value={dicasList}
                onChange={(e) => setDicasList(e.target.value)}
                placeholder="Exemplo:&#10;Dica 1: Como formatar o título para atrair cliques&#10;Dica 2: Estratégia de fechamento no WhatsApp&#10;Dica 3: Economizando taxas móveis"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              O produto entrará como <strong className="text-slate-700">"Em análise"</strong> e será avaliado pelo administrador.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {submitting ? 'Enviando Produto...' : 'Enviar Produto para Análise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
