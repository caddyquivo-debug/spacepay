import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ComposedChart,
} from 'recharts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { firestoreProducts } from '../lib/firestoreProducts.ts';
import {
  Product,
  Order,
  Withdrawal,
  Transaction,
  AffiliateStats,
} from '../types/index.ts';
import {
  Wallet,
  BookOpen,
  Video,
  Share2,
  PackageCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Smartphone,
  CreditCard,
  Building,
  Play,
  FileText,
  User as UserIcon,
  TrendingUp,
  BarChart3,
  Bot,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  Eye,
  Info,
  ShieldCheck,
  Pencil,
  Trash2,
} from 'lucide-react';
import { SpacePayAiAssistant } from '../components/SpacePayAiAssistant.tsx';
import { FileUploadDropzone } from '../components/FileUploadDropzone.tsx';

interface UserDashboardPageProps {
  initialTab?: string;
  navigate: (route: string) => void;
}

// Custom Recharts Tooltip for Seller Sales Performance
const CustomSellerSalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl text-xs space-y-2 min-w-[220px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {label}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">SpacePay Vendas</span>
        </div>
        <div className="space-y-1.5 pt-0.5">
          {payload.map((entry: any, index: number) => {
            const isCurrency =
              entry.dataKey === 'faturamento' ||
              entry.dataKey === 'liquido' ||
              entry.dataKey === 'taxas' ||
              entry.dataKey === 'comissoes';
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white tabular-nums">
                  {isCurrency
                    ? `${Number(entry.value).toLocaleString('pt-MZ')} MT`
                    : `${entry.value} vendas`}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
          <span>Gateway Moçambique (M-Pesa / mCash / Visa)</span>
          <span className="text-emerald-400">Taxa 10% Deduzida</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Recharts Tooltip for Affiliate Earnings
const CustomAffiliateChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl text-xs space-y-2 min-w-[230px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span className="truncate max-w-[150px]">{dataItem?.fullName || label}</span>
          <span className="text-[10px] text-amber-400 font-mono">{dataItem?.tipo || 'Afiliado'}</span>
        </div>
        <div className="space-y-1.5 pt-0.5">
          {payload.map((entry: any, index: number) => {
            const isCurrency =
              entry.dataKey === 'comissaoTotal' || entry.dataKey === 'comissaoUnitaria';
            return (
              <div key={`aff-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white tabular-nums">
                  {isCurrency ? `${Number(entry.value).toLocaleString('pt-MZ')} MT` : entry.value}
                </span>
              </div>
            );
          })}
          {dataItem?.taxaConversao !== undefined && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-emerald-400 font-semibold">
              <span>Taxa de Conversão:</span>
              <span className="font-mono">{dataItem.taxaConversao}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  initialTab = 'carteira',
  navigate,
}) => {
  const { user, refreshUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [library, setLibrary] = useState<{ ebooks: Product[]; videos: Product[] }>({ ebooks: [], videos: [] });
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<{
    sales: Order[];
    totalGross: number;
    totalPlatformFees: number;
    totalAffiliateCommissions: number;
    totalNetEarned: number;
  }>({
    sales: [],
    totalGross: 0,
    totalPlatformFees: 0,
    totalAffiliateCommissions: 0,
    totalNetEarned: 0,
  });
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats[]>([]);
  const [walletData, setWalletData] = useState<{ wallet: any; transactions: Transaction[] }>({
    wallet: null,
    transactions: [],
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Reader / Video viewer modals
  const [readingEbook, setReadingEbook] = useState<Product | null>(null);
  const [watchingVideo, setWatchingVideo] = useState<Product | null>(null);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'mcash' | 'bank_transfer'>('mpesa');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawBeneficiary, setWithdrawBeneficiary] = useState(user?.name || '');
  const [withdrawBankName, setWithdrawBankName] = useState('Millennium BIM');
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Copy indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Recharts interactive states for Sales Performance
  const [salesChartMetric, setSalesChartMetric] = useState<'all' | 'revenue' | 'volume'>('all');
  const [salesPeriod, setSalesPeriod] = useState<'6m' | '30d'>('6m');
  const [salesChartType, setSalesChartType] = useState<'area' | 'bar'>('area');

  // Recharts interactive states for Affiliate Performance
  const [affiliateChartFilter, setAffiliateChartFilter] = useState<'all' | 'ebook' | 'video'>('all');

  // AI Assistant Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Product Edit & Delete States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [editFileSize, setEditFileSize] = useState<number | undefined>(undefined);
  const [editFileSizeFormatted, setEditFileSizeFormatted] = useState('');
  const [editFileUrl, setEditFileUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- MEMOIZED DATA FOR SELLER SALES CHARTS (100% REAL) ---
  const sellerMonthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthMap = new Map<string, {
      month: string;
      faturamento: number;
      liquido: number;
      taxas: number;
      comissoes: number;
      vendas: number;
    }>();

    // Pre-fill continuous timeline for last 6 months with real zeros
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      monthMap.set(key, {
        month: label,
        faturamento: 0,
        liquido: 0,
        taxas: 0,
        comissoes: 0,
        vendas: 0,
      });
    }

    if (salesData.sales && salesData.sales.length > 0) {
      salesData.sales.forEach((order) => {
        const d = new Date(order.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthMap.get(key);
        const sellerLiquido = order.sellerShare !== undefined
          ? order.sellerShare
          : order.amount - order.platformFee - (order.affiliateCommission || 0);

        if (existing) {
          existing.faturamento += order.amount;
          existing.liquido += sellerLiquido;
          existing.taxas += order.platformFee;
          existing.comissoes += (order.affiliateCommission || 0);
          existing.vendas += 1;
        } else {
          const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
          monthMap.set(key, {
            month: label,
            faturamento: order.amount,
            liquido: sellerLiquido,
            taxas: order.platformFee,
            comissoes: (order.affiliateCommission || 0),
            vendas: 1,
          });
        }
      });
    }

    return Array.from(monthMap.values());
  }, [salesData.sales]);

  // Comparison of Sales by Product (100% Real)
  const sellerProductComparisonData = useMemo(() => {
    const prodMap = new Map<string, {
      name: string;
      tipo: string;
      faturamento: number;
      liquido: number;
      comissoes: number;
      vendas: number;
    }>();

    if (salesData.sales && salesData.sales.length > 0) {
      salesData.sales.forEach((order) => {
        const prodTitle = order.productTitle || 'Produto Digital';
        const key = order.productId || prodTitle;
        const existing = prodMap.get(key);
        const sellerLiquido = order.sellerShare !== undefined
          ? order.sellerShare
          : order.amount - order.platformFee - (order.affiliateCommission || 0);

        if (existing) {
          existing.faturamento += order.amount;
          existing.liquido += sellerLiquido;
          existing.comissoes += (order.affiliateCommission || 0);
          existing.vendas += 1;
        } else {
          prodMap.set(key, {
            name: prodTitle.length > 24 ? `${prodTitle.slice(0, 22)}...` : prodTitle,
            tipo: order.productType === 'ebook' ? 'eBook' : 'Vídeo',
            faturamento: order.amount,
            liquido: sellerLiquido,
            comissoes: (order.affiliateCommission || 0),
            vendas: 1,
          });
        }
      });
    }

    return Array.from(prodMap.values());
  }, [salesData.sales]);

  // --- MEMOIZED DATA FOR AFFILIATE COMMISSION CHARTS (100% REAL) ---
  const affiliateChartData = useMemo(() => {
    let items = affiliateStats;
    if (affiliateChartFilter !== 'all') {
      items = items.filter((i) => i.productType === affiliateChartFilter);
    }

    if (items && items.length > 0) {
      return items.map((item) => {
        const convRate = item.clicks > 0 ? Number(((item.sales / item.clicks) * 100).toFixed(1)) : 0;
        return {
          name: item.productTitle.length > 20 ? `${item.productTitle.slice(0, 18)}...` : item.productTitle,
          fullName: item.productTitle,
          tipo: item.productType === 'ebook' ? 'eBook' : 'Vídeo',
          comissaoTotal: item.totalEarned,
          comissaoUnitaria: item.commissionPerSale,
          vendas: item.sales,
          cliques: item.clicks,
          taxaConversao: convRate,
        };
      });
    }

    return [];
  }, [affiliateStats, affiliateChartFilter]);

  // Context passed to Gemini AI
  const sellerAiContext = useMemo(() => ({
    sellerName: user?.name,
    totalGross: salesData.totalGross,
    totalNetEarned: salesData.totalNetEarned,
    totalSalesCount: salesData.sales.length,
    totalProductsCount: myProducts.length,
    totalAffiliateEarnings: user?.wallet?.totalCommissions || 0,
    activeProducts: myProducts.map((p) => p.title),
  }), [user, salesData, myProducts]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      loadAllUserData();
    }
  }, [user]);

  const loadAllUserData = async () => {
    setLoading(true);
    try {
      const [libRes, prodRes, salesRes, affRes, wallRes, withRes] = await Promise.all([
        api.getLibrary().catch(() => ({ ebooks: [], videos: [] })),
        api.getMyProducts().catch(() => ({ products: [] })),
        api.getMySales().catch(() => ({
          sales: [],
          totalGross: 0,
          totalPlatformFees: 0,
          totalAffiliateCommissions: 0,
          totalNetEarned: 0,
        })),
        api.getAffiliateStats().catch(() => ({ stats: [] })),
        api.getWallet().catch(() => ({ wallet: user?.wallet, transactions: [] })),
        api.getWithdrawals().catch(() => ({ withdrawals: [] })),
      ]);

      setLibrary(libRes);
      setMyProducts(prodRes.products);
      setSalesData(salesRes);
      setAffiliateStats(affRes.stats);
      setWalletData(wallRes);
      setWithdrawals(withRes.withdrawals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setEditTitle(prod.title);
    setEditDescription(prod.description);
    setEditPrice(String(prod.price));
    setEditFileName(prod.fileName || '');
    setEditFileSize(prod.fileSize);
    setEditFileSizeFormatted(prod.fileSizeFormatted || '');
    setEditFileUrl(prod.fileUrl || prod.videoUrl || '');
    setEditError(null);
    setEditSuccessMsg(null);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editTitle.trim()) {
      setEditError('O título do produto é obrigatório.');
      return;
    }
    if (!editDescription.trim()) {
      setEditError('A descrição do produto é obrigatória.');
      return;
    }
    const numPrice = Number(editPrice);
    if (isNaN(numPrice) || numPrice < 50) {
      setEditError('O preço mínimo para comercialização é de 50 MT.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updates: Partial<Product> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: numPrice,
        fileName: editFileName || undefined,
        fileSize: editFileSize || undefined,
        fileSizeFormatted: editFileSizeFormatted || undefined,
      };

      if (editingProduct.type === 'ebook') {
        updates.fileUrl = editFileUrl || editingProduct.fileUrl;
      } else {
        updates.videoUrl = editFileUrl || editingProduct.videoUrl;
      }

      const res = await api.updateMyProduct(editingProduct.id, updates);

      // Sync update to Firestore
      try {
        await firestoreProducts.update(editingProduct.id, updates);
      } catch (firestoreErr) {
        console.warn('[Firestore Sync]: Could not update product in Firestore:', firestoreErr);
      }

      setMyProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? res.product : p))
      );

      setEditSuccessMsg('Produto atualizado com sucesso no Firestore e na plataforma!');
      setTimeout(() => {
        setEditingProduct(null);
        setEditSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || 'Erro ao salvar alterações no produto.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    try {
      await api.deleteMyProduct(deletingProduct.id);

      // Sync deletion to Firestore
      try {
        await firestoreProducts.delete(deletingProduct.id);
      } catch (firestoreErr) {
        console.warn('[Firestore Sync]: Could not delete product in Firestore:', firestoreErr);
      }

      setMyProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir o produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMessage(null);

    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) {
      setWithdrawMessage({ type: 'error', text: 'O valor mínimo para levantamento é de 100 MT.' });
      return;
    }

    if (!withdrawAccount.trim() || !withdrawBeneficiary.trim()) {
      setWithdrawMessage({ type: 'error', text: 'Preencha o número da conta/telemóvel e nome do titular.' });
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await api.requestWithdrawal({
        amount,
        method: withdrawMethod,
        phoneOrAccount: withdrawAccount.trim(),
        beneficiaryName: withdrawBeneficiary.trim(),
        bankName: withdrawMethod === 'bank_transfer' ? withdrawBankName : undefined,
      });

      if (res.realPayoutSuccess) {
        setWithdrawMessage({
          type: 'success',
          text: res.message || `Transferência REAL de ${amount.toLocaleString('pt-MZ')} MT liquidada com sucesso! Recibo Oficial: ${res.receipt || 'Confirmado'}.`,
        });
      } else if (res.warning) {
        setWithdrawMessage({
          type: 'error',
          text: res.warning,
        });
      } else {
        setWithdrawMessage({ type: 'success', text: res.message || 'Solicitação de levantamento registrada com sucesso!' });
      }

      setWithdrawAmount('');
      setWithdrawAccount('');
      await refreshUser();
      await loadAllUserData();
    } catch (err: any) {
      setWithdrawMessage({ type: 'error', text: err.message || 'Erro ao processar solicitação.' });
      await refreshUser();
      await loadAllUserData();
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-xs text-slate-500">
          Você precisa estar conectado à sua conta SpacePay para acessar este painel.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Fazer Login Agora
        </button>
      </div>
    );
  }

  const currentWallet = walletData.wallet || user.wallet;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {user.role === 'admin' ? 'Administrador' : 'Conta Padrão'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email} · Moçambique</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('assistente-ia')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Assistente IA de Afiliados
          </button>
          <button
            onClick={() => navigate('/criar-produto')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Vender Infoproduto (Taxa 10%)
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'meus-ebooks', label: `Meus eBooks (${library.ebooks.length})`, icon: BookOpen },
          { id: 'meus-videos', label: `Meus Vídeos (${library.videos.length})`, icon: Video },
          {
            id: 'afiliados',
            label: 'Área de Afiliado',
            icon: Share2,
            badge: 'Ganhar Comissões',
          },
          {
            id: 'minhas-vendas',
            label: `Minhas Vendas (${salesData.sales.length})`,
            icon: PackageCheck,
            badge: 'Taxa 10%',
          },
          { id: 'meus-produtos', label: `Meus Produtos (${myProducts.length})`, icon: PlusCircle },
          { id: 'carteira', label: 'Minha Carteira', icon: Wallet },
          { id: 'levantamentos', label: 'Levantamentos', icon: Wallet },
          {
            id: 'assistente-ia',
            label: 'Assistente IA Gemini',
            icon: Bot,
            highlight: true,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer relative ${
                isActive
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-emerald-600' : tab.highlight ? 'text-emerald-500' : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {tab.badge}
                </span>
              )}
              {tab.highlight && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute top-2 right-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. MINHA CARTEIRA */}
      {activeTab === 'carteira' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Saldo Disponível
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                {currentWallet.availableBalance.toLocaleString('pt-MZ')}{' '}
                <span className="text-xs text-slate-500 font-normal">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Pronto para levantamento no M-Pesa</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Saldo Pendente
              </span>
              <div className="text-2xl font-extrabold text-amber-600 tabular-nums">
                {currentWallet.pendingBalance.toLocaleString('pt-MZ')}{' '}
                <span className="text-xs text-slate-500 font-normal">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Em processamento de levantamento</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Total Ganho (Histórico)
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {currentWallet.totalEarned.toLocaleString('pt-MZ')}{' '}
                <span className="text-xs text-slate-500 font-normal">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Total bruto acumulado</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Total de Comissões
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                {currentWallet.totalCommissions.toLocaleString('pt-MZ')}{' '}
                <span className="text-xs text-slate-500 font-normal">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Ganhos como afiliado</p>
            </div>
          </div>

          {/* Quick Analytics & AI Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Gráficos de Vendas
                </span>
                <h4 className="text-sm font-bold text-slate-900">Evolução de Vendas e Faturamento</h4>
                <p className="text-xs text-slate-500">Acompanhe receitas brutas, comissões e rendimento líquido.</p>
              </div>
              <button
                onClick={() => setActiveTab('minhas-vendas')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-xs ml-3"
              >
                Ver Gráficos
              </button>
            </div>

            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border border-slate-800 rounded-3xl shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Assistente Gemini
                </span>
                <h4 className="text-sm font-bold text-white">Análise IA de Vendas & Afiliados</h4>
                <p className="text-xs text-slate-300">Dicas personalizadas para vender mais no WhatsApp.</p>
              </div>
              <button
                onClick={() => setActiveTab('assistente-ia')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-xs ml-3"
              >
                Abrir IA
              </button>
            </div>
          </div>

          {/* Action quick links */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="text-xs text-slate-700">
              <strong className="text-emerald-900">Deseja levantar o seu saldo disponível?</strong> Mínimo de 100 MT via M-Pesa, mCash ou Banco.
            </div>
            <button
              onClick={() => setActiveTab('levantamentos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap"
            >
              Solicitar Levantamento
            </button>
          </div>

          {/* Transactions Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Histórico de Movimentações
              </h3>
            </div>

            {walletData.transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma movimentação financeira registrada até o momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {walletData.transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="space-y-0.5 max-w-xl">
                      <p className="font-semibold text-slate-900">{tx.description}</p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('pt-MZ', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        tx.netAmount >= 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {tx.netAmount >= 0 ? `+${tx.netAmount.toLocaleString('pt-MZ')}` : `${tx.netAmount.toLocaleString('pt-MZ')}`} MT
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. MEUS EBOOKS COMPRADOS */}
      {activeTab === 'meus-ebooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Meus eBooks Adquiridos</h2>
              <p className="text-xs text-slate-500">Acesso ilimitado e download dos seus livros digitais.</p>
            </div>
          </div>

          {library.ebooks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Você ainda não possui eBooks</h3>
              <p className="text-xs text-slate-500">
                Explore nosso catálogo e adquira os melhores conteúdos práticos com M-Pesa.
              </p>
              <button
                onClick={() => navigate('/ebooks')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ver Catálogo de eBooks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.ebooks.map((ebook) => (
                <div key={ebook.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <img
                      src={ebook.coverUrl || '/src/assets/images/product_ebook_cv_1790278048991.jpg'}
                      alt={ebook.title}
                      className="w-full aspect-[4/3] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/product_ebook_cv_1790278048991.jpg';
                      }}
                    />
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">eBook Liberado</span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{ebook.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{ebook.description}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => setReadingEbook(ebook)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ler Agora
                    </button>
                    <a
                      href={api.getProductDownloadUrl(ebook.id)}
                      download={ebook.fileName || `${ebook.slug}.pdf`}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Baixar eBook em PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. MEUS VÍDEOS DE DICAS */}
      {activeTab === 'meus-videos' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Meus Vídeos de Dicas</h2>
            <p className="text-xs text-slate-500">Assista online às séries de dicas práticas ou baixe para o seu dispositivo.</p>
          </div>

          {library.videos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
              <Video className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Você ainda não comprou vídeos de dicas</h3>
              <p className="text-xs text-slate-500">
                Acesse séries práticas com dicas de alto valor aplicadas aos negócios e carreiras.
              </p>
              <button
                onClick={() => navigate('/videos')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ver Catálogo de Vídeos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.videos.map((vid) => (
                <div key={vid.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative group cursor-pointer" onClick={() => setWatchingVideo(vid)}>
                    <img
                      src={vid.coverUrl || '/src/assets/images/product_video_financas_1790278058234.jpg'}
                      alt={vid.title}
                      className="w-full aspect-[4/3] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/product_video_financas_1790278058234.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 ml-0.5 fill-white" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Vídeo de Dicas Liberado</span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{vid.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{vid.description}</p>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => setWatchingVideo(vid)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Assistir
                    </button>
                    <a
                      href={api.getProductDownloadUrl(vid.id)}
                      download={vid.fileName || `${vid.slug}.mp4`}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Baixar vídeo para o dispositivo"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar MP4
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. ÁREA DE AFILIADO */}
      {activeTab === 'afiliados' && (
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white p-6 rounded-3xl space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              Seu Painel de Afiliado SpacePay
            </div>
            <h2 className="text-xl font-bold">Divulgue seus links exclusivos e lucre</h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Toda compra realizada com seu link <code className="text-emerald-300">?ref={user.id}</code> credita a comissão diretamente na sua carteira. Os pagamentos são automáticos e auditados.
            </p>
          </div>

          {/* RECHARTS: AFFILIATE COMMISSION EARNINGS & CONVERSION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Desempenho de Afiliado: Comissões e Eficiência de Cliques
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Visualização em tempo real das comissões acumuladas em Meticais (MT) e da relação entre cliques recebidos e vendas confirmadas.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setAffiliateChartFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    affiliateChartFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setAffiliateChartFilter('ebook')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    affiliateChartFilter === 'ebook'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  eBooks
                </button>
                <button
                  onClick={() => setAffiliateChartFilter('video')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    affiliateChartFilter === 'video'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vídeos
                </button>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Total Ganho em Comissões</span>
                <span className="text-base sm:text-lg font-extrabold text-amber-700 tabular-nums">
                  {affiliateChartData.reduce((sum, i) => sum + i.comissaoTotal, 0).toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Vendas Concluídas</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-700 tabular-nums">
                  {affiliateChartData.reduce((sum, i) => sum + i.vendas, 0)} pedidos
                </span>
              </div>
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                <span className="text-[10px] text-indigo-800 font-bold uppercase block">Cliques Únicos no Link</span>
                <span className="text-base sm:text-lg font-extrabold text-indigo-700 tabular-nums">
                  {affiliateChartData.reduce((sum, i) => sum + i.cliques, 0)} cliques
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] text-slate-600 font-bold uppercase block">Taxa Média de Conversão</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 tabular-nums">
                  {(() => {
                    const totalCliques = affiliateChartData.reduce((sum, i) => sum + i.cliques, 0);
                    const totalVendas = affiliateChartData.reduce((sum, i) => sum + i.vendas, 0);
                    return totalCliques > 0 ? ((totalVendas / totalCliques) * 100).toFixed(1) : '0';
                  })()}%
                </span>
              </div>
            </div>

            {/* Recharts Composed/Bar Chart Container */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={affiliateChartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#d97706"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v} MT`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#4f46e5"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<CustomAffiliateChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="comissaoTotal"
                    name="Comissão Acumulada (MT)"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="vendas"
                    name="Vendas Concluídas (Qtd)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cliques"
                    name="Cliques no Link (Qtd)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Produtos Disponíveis para Promoção
              </h3>
            </div>

            {affiliateStats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum produto habilitado para afiliação no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {affiliateStats.map((item) => {
                  const fullLink = `${window.location.origin}${item.affiliateLink}`;
                  const isCopied = copiedId === item.productId;

                  return (
                    <div key={item.productId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            {item.productType === 'ebook' ? 'eBook' : 'Vídeo'}
                          </span>
                          <span className="font-bold text-slate-900">{item.productTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Comissão: <strong className="text-emerald-600">+{item.commissionPerSale} MT / venda</strong></span>
                          <span>·</span>
                          <span>Cliques: <strong>{item.clicks}</strong></span>
                          <span>·</span>
                          <span>Vendas: <strong>{item.sales}</strong></span>
                          <span>·</span>
                          <span>Total Ganho: <strong className="text-slate-900">{item.totalEarned} MT</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={fullLink}
                          className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600 select-all max-w-[240px]"
                        />
                        <button
                          onClick={() => copyToClipboard(fullLink, item.productId)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Confira: "${item.productTitle}" no SpacePay: ${fullLink}`
                            );
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. MINHAS VENDAS & TAXA DE 10% */}
      {activeTab === 'minhas-vendas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Relatório Financeiro de Vendas (Taxa SpacePay de 10%)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O SpacePay separa de forma transparente o valor bruto, a taxa da plataforma (10%), as comissões pagas aos afiliados e o seu rendimento líquido real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Faturamento Bruto</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {salesData.totalGross.toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Taxa SpacePay (10%)</span>
                <span className="text-lg font-extrabold text-slate-700 tabular-nums">
                  - {salesData.totalPlatformFees.toLocaleString('pt-MZ')} MT
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Creditada automaticamente à conta oficial</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Comissões Afiliados</span>
                <span className="text-lg font-extrabold text-amber-600 tabular-nums">
                  - {salesData.totalAffiliateCommissions.toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Líquido do Vendedor</span>
                <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
                  {salesData.totalNetEarned.toLocaleString('pt-MZ')} MT
                </span>
              </div>
            </div>
          </div>

          {/* RECHARTS: SALES PERFORMANCE & MONTHLY REVENUE */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Desempenho de Vendas: Faturamento, Líquido e Volume
                  </h3>
                  {salesData.sales.length === 0 ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Sem vendas no período
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      100% Vendas Reais
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Acompanhe a curva de evolução financeira das suas vendas digitais, com detalhamento das taxas operacionais (10% SpacePay) e do seu lucro líquido real.
                </p>
              </div>

              {/* Interactive Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setSalesChartMetric('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      salesChartMetric === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Completo
                  </button>
                  <button
                    onClick={() => setSalesChartMetric('revenue')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      salesChartMetric === 'revenue'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Faturamento vs Líquido
                  </button>
                  <button
                    onClick={() => setSalesChartMetric('volume')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      salesChartMetric === 'volume'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Volume (Qtd)
                  </button>
                </div>

                {/* AI advice trigger */}
                <button
                  onClick={() => setActiveTab('assistente-ia')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Pedir análise do gráfico ao Assistente IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Análise IA</span>
                </button>
              </div>
            </div>

            {/* Chart 1: Timeline Area Chart */}
            <div className="w-full h-72 sm:h-84">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sellerMonthlyData}
                  margin={{ top: 12, right: 18, left: 10, bottom: 6 }}
                >
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    stroke="#475569"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#059669"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k MT` : `${val} MT`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6366f1"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val} un`}
                  />
                  <Tooltip content={<CustomSellerSalesTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700 mx-1">{val}</span>}
                  />

                  {(salesChartMetric === 'all' || salesChartMetric === 'revenue') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="faturamento"
                      name="Faturamento Bruto (MT)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorFaturamento)"
                    />
                  )}

                  {(salesChartMetric === 'all' || salesChartMetric === 'revenue') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="liquido"
                      name="Líquido do Vendedor (MT)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorLiquido)"
                    />
                  )}

                  {(salesChartMetric === 'all' || salesChartMetric === 'volume') && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="vendas"
                      name="Volume de Vendas (Qtd)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Product Breakdown Bar Chart */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Performance Comparativa por Produto Digital
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Faturamento Bruto vs Lucro Líquido por título
                </span>
              </div>

              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sellerProductComparisonData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} MT`}
                    />
                    <Tooltip content={<CustomSellerSalesTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(val) => <span className="text-xs font-semibold text-slate-700">{val}</span>}
                    />
                    <Bar
                      dataKey="faturamento"
                      name="Faturamento Bruto (MT)"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="liquido"
                      name="Líquido do Vendedor (MT)"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="comissoes"
                      name="Comissões Afiliados (MT)"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Histórico de Vendas dos Seus Produtos
              </h3>
            </div>

            {salesData.sales.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma venda registrada até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Comprador</th>
                      <th className="p-3">Bruto</th>
                      <th className="p-3">Taxa 10%</th>
                      <th className="p-3">Afiliado</th>
                      <th className="p-3">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesData.sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString('pt-MZ')}</td>
                        <td className="p-3 font-semibold text-slate-900">{s.productTitle}</td>
                        <td className="p-3 text-slate-600">{s.buyerName}</td>
                        <td className="p-3 tabular-nums font-bold">{s.amount} MT</td>
                        <td className="p-3 tabular-nums text-slate-500">-{s.platformFee} MT</td>
                        <td className="p-3 tabular-nums text-amber-600">-{s.affiliateCommission} MT</td>
                        <td className="p-3 tabular-nums text-emerald-600 font-bold">+{s.sellerShare} MT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. MEUS PRODUTOS CRIADOS */}
      {activeTab === 'meus-produtos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Seus Produtos para Venda Direta</h2>
              <p className="text-xs text-slate-500">
                Compartilhe seus links de pagamento SpacePay no WhatsApp, redes sociais ou outros sites.
              </p>
            </div>
            <button
              onClick={() => navigate('/criar-produto')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" /> Cadastrar Novo Produto
            </button>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Regra de Cobrança SpacePay:</strong> Apenas <strong>10% de taxa da plataforma</strong> é cobrada automaticamente por venda concluída na sua conta. Você recebe 90% líquidos diretamente na carteira.
              </span>
            </div>
          </div>

          {myProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
              <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Você ainda não cadastrou produtos</h3>
              <p className="text-xs text-slate-500">
                Cadastre seu eBook (PDF) ou vídeo de dicas e gere links de pagamento M-Pesa/mCash instantâneos para vender onde quiser.
              </p>
              <button
                onClick={() => navigate('/criar-produto')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cadastrar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProducts.map((prod) => {
                const fee10 = Math.round(prod.price * 0.10);
                const net90 = Math.max(0, prod.price - fee10);
                const directCheckoutUrl = `${window.location.origin}/checkout?produto=${prod.id}`;
                const isCopied = copiedId === prod.id;

                return (
                  <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">
                          {prod.type === 'ebook' ? 'eBook (PDF)' : 'Vídeo de Dicas'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            prod.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prod.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {prod.status === 'approved' ? 'Pronto para Vender' : 'Em Análise'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{prod.title}</h4>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prod.listedOnStore ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Exibido na Loja do Site
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Venda Direta (Links / Redes)
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-500">
                          {prod.salesCount} {prod.salesCount === 1 ? 'venda' : 'vendas'}
                        </span>
                      </div>

                      {/* Financial breakdown pill */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Preço de Venda:</span>
                          <strong className="text-slate-900 tabular-nums">{prod.price} MT</strong>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Taxa SpacePay (10%):</span>
                          <span className="tabular-nums font-semibold text-slate-700">-{fee10} MT</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                          <span>Seu Lucro Líquido (90%):</span>
                          <span className="tabular-nums">+{net90} MT</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales Actions & Direct Payment Link */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(directCheckoutUrl);
                          setCopiedId(prod.id);
                          setTimeout(() => setCopiedId(null), 2500);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                          isCopied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Link de Pagamento Copiado!' : 'Copiar Link de Checkout Direto'}</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Olá! Acesse o meu material "${prod.title}" pelo link de pagamento seguro SpacePay: ${directCheckoutUrl}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-emerald-200 transition-colors"
                        >
                          <Share2 className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => navigate(`/checkout?produto=${prod.id}`)}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Testar Checkout</span>
                        </button>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(prod)}
                          className="flex-1 py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Editar Produto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingProduct(prod)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                          title="Excluir produto da conta"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Apagar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 7. LEVANTAMENTOS */}
      {activeTab === 'levantamentos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Request Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Solicitar Levantamento Real
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transferência direta da carteira comercial para a sua conta M-Pesa, mCash ou Banco. Saldo disponível:{' '}
                <strong className="text-emerald-600 font-bold tabular-nums">
                  {currentWallet.availableBalance.toLocaleString('pt-MZ')} MT
                </strong>
              </p>
            </div>

            {/* Live Gateway Info Note */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Transferências Diretas via M-Pesa & mCash</span>
              </div>
              <p className="leading-relaxed">
                Os levantamentos são processados diretamente para o seu telemóvel Vodacom M-Pesa ou mCash com recibo oficial emitido na hora. Os fundos são transferidos a partir do saldo disponível acumulado nas suas vendas e comissões.
              </p>
            </div>

            {withdrawMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  withdrawMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {withdrawMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{withdrawMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Valor a Levantar (MT) * (Mínimo: 100 MT)
                </label>
                <input
                  type="number"
                  min="100"
                  max={currentWallet.availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Ex: 1500"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Método de Levantamento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('mpesa')}
                    className={`py-2 px-3 border rounded-lg text-center cursor-pointer font-medium ${
                      withdrawMethod === 'mpesa' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('mcash')}
                    className={`py-2 px-3 border rounded-lg text-center cursor-pointer font-medium ${
                      withdrawMethod === 'mcash' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200'
                    }`}
                  >
                    mCash
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank_transfer')}
                    className={`py-2 px-3 border rounded-lg text-center cursor-pointer font-medium ${
                      withdrawMethod === 'bank_transfer' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200'
                    }`}
                  >
                    Conta Bancária
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {withdrawMethod === 'bank_transfer' ? 'Número da Conta / NIB *' : 'Número de Telemóvel (+258) *'}
                </label>
                <input
                  type="text"
                  required
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder={withdrawMethod === 'bank_transfer' ? 'NIB ou Conta bancária' : '+258 84... ou 85...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nome Completo do Titular *
                </label>
                <input
                  type="text"
                  required
                  value={withdrawBeneficiary}
                  onChange={(e) => setWithdrawBeneficiary(e.target.value)}
                  placeholder="Nome registrado no M-Pesa / mCash / Banco"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {withdrawMethod === 'bank_transfer' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nome do Banco *
                  </label>
                  <select
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="Millennium BIM">Millennium BIM</option>
                    <option value="BCI (Banco Comercial e de Investimentos)">BCI</option>
                    <option value="Standard Bank Moçambique">Standard Bank</option>
                    <option value="Moza Banco">Moza Banco</option>
                    <option value="Absa Moçambique">Absa</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingWithdrawal || currentWallet.availableBalance < 100}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                {isSubmittingWithdrawal ? 'Processando Transferência...' : 'Solicitar Levantamento Real'}
              </button>
            </form>
          </div>

          {/* Withdrawals History */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Histórico de Levantamentos
              </h3>
              <span className="text-[11px] text-slate-500">
                Total: <strong>{withdrawals.length}</strong>
              </span>
            </div>

            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum levantamento solicitado ainda.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {withdrawals.map((w) => (
                  <div key={w.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 tabular-nums text-sm">
                          {w.amount.toLocaleString('pt-MZ')} MT
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {w.method.toUpperCase()} · {w.accountDetails.phoneOrAccount} ({w.accountDetails.beneficiaryName})
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          w.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'under_review'
                            ? 'bg-blue-100 text-blue-800'
                            : w.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status === 'paid'
                          ? 'Transferido / Pago'
                          : w.status === 'under_review'
                          ? 'Em Processamento'
                          : w.status === 'rejected'
                          ? 'Rejeitado / Estornado'
                          : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Solicitado em: {new Date(w.createdAt).toLocaleString('pt-MZ')}</span>
                      {w.providerReceipt ? (
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Recibo: {w.providerReceipt}
                        </span>
                      ) : w.reference ? (
                        <span className="font-mono text-slate-600">Ref: {w.reference}</span>
                      ) : null}
                    </div>

                    {w.rejectionReason && (
                      <div className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-lg">
                        <strong>Motivo:</strong> {w.rejectionReason} (o saldo foi estornado para sua carteira).
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. ASSISTENTE IA DE VENDAS */}
      {activeTab === 'assistente-ia' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Inteligência Artificial Nativa SpacePay · Gemini
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Seu Consultor Estratégico de Infoprodutos e Afiliados
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              O Assistente IA tem acesso aos seus indicadores de vendas, volume de pedidos e produtos cadastrados para fornecer conselhos práticos sobre como vender mais por M-Pesa, recrutar afiliados e criar novos temas de sucesso.
            </p>
          </div>

          <SpacePayAiAssistant sellerContext={sellerAiContext} />
        </div>
      )}

      {/* --- MODAL: EBOOK READER --- */}
      {readingEbook && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold truncate max-w-md">{readingEbook.title}</h3>
              </div>
              <button
                onClick={() => setReadingEbook(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm leading-relaxed">
              <div className="text-center pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">{readingEbook.title}</h2>
                <p className="text-xs text-slate-500 mt-1">Por {readingEbook.sellerName} · Exclusivo SpacePay</p>
              </div>

              {readingEbook.tableOfContents && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Índice do Conteúdo</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {readingEbook.tableOfContents.map((t, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{t.title}</span>
                        <span className="text-slate-400 tabular-nums">{t.pagesOrDuration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Capítulo Inicial & Orientações Práticas</h3>
                <p className="text-slate-700 leading-relaxed">
                  {readingEbook.contentSample || readingEbook.description}
                </p>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
                  <div className="font-bold">Pontos Chave para Aplicação:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Aplique as estratégias passo a passo conforme detalhado no material.</li>
                    <li>Mantenha um caderno de anotações ou planilha de acompanhamento.</li>
                    <li>Compartilhe dúvidas técnicas através do suporte direto via WhatsApp no SpacePay.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <a
                href={api.getProductDownloadUrl(readingEbook.id)}
                download={readingEbook.fileName || `${readingEbook.slug}.pdf`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo PDF
              </a>
              <button
                onClick={() => setReadingEbook(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
              >
                Concluir Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: VIDEO PLAYER --- */}
      {watchingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold truncate max-w-xs sm:max-w-md">{watchingVideo.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={api.getProductDownloadUrl(watchingVideo.id)}
                  download={watchingVideo.fileName || `${watchingVideo.slug}.mp4`}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Baixar vídeo no dispositivo"
                >
                  <Download className="w-3 h-3" />
                  Baixar MP4
                </a>
                <button
                  onClick={() => setWatchingVideo(null)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative aspect-video bg-black">
              <video
                controls
                autoPlay
                className="w-full h-full"
                src={watchingVideo.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              >
                Seu navegador não suporta a tag de vídeo.
              </video>
            </div>

            <div className="p-5 space-y-3 bg-slate-900/90 text-xs">
              <h4 className="text-sm font-bold text-white">{watchingVideo.title}</h4>
              <p className="text-slate-400">{watchingVideo.description}</p>
              {watchingVideo.previewDicas && (
                <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Dicas abordadas no vídeo:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {watchingVideo.previewDicas.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRODUTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Editar Produto</h3>
                <p className="text-xs text-slate-500">Atualize título, preço ou substitua o arquivo digital.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição do Produto *</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Preço de Venda (Meticais - MT) *</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Preço de Venda:</span>
                    <strong className="text-slate-900 tabular-nums">{(Number(editPrice) || 0).toLocaleString('pt-MZ')} MT</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxa da Plataforma SpacePay (10%):</span>
                    <span className="tabular-nums font-semibold text-slate-700">-{Math.round((Number(editPrice) || 0) * 0.10)} MT</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-100">
                    <span>Seu Lucro Líquido Real (90%):</span>
                    <span className="tabular-nums">+{Math.max(0, (Number(editPrice) || 0) - Math.round((Number(editPrice) || 0) * 0.10))} MT</span>
                  </div>
                </div>
              </div>

              {/* Arquivo Digital Atual ou Novo Upload */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Arquivo Digital ({editingProduct.type === 'ebook' ? 'eBook PDF' : 'Vídeo MP4'})
                </label>
                <FileUploadDropzone
                  productType={editingProduct.type}
                  fileName={editFileName}
                  fileSizeFormatted={editFileSizeFormatted}
                  fileUrl={editFileUrl}
                  onFileUploaded={(res) => {
                    setEditFileName(res.fileName);
                    setEditFileSize(res.fileSize);
                    setEditFileSizeFormatted(res.fileSizeFormatted);
                    setEditFileUrl(res.fileUrl);
                  }}
                  onFileRemoved={() => {
                    setEditFileName('');
                    setEditFileSize(undefined);
                    setEditFileSizeFormatted('');
                    setEditFileUrl('');
                  }}
                  externalUrl={editFileUrl}
                  onExternalUrlChange={(url) => setEditFileUrl(url)}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE PRODUTO */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Excluir Produto?</h3>
              <p className="text-slate-500 leading-relaxed">
                Tem certeza que deseja apagar permanentemente o produto <strong>"{deletingProduct.title}"</strong> da sua conta?
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] text-left">
              O link de pagamento direto deste produto deixará de funcionar imediatamente.
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="flex-1 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Apagando...' : 'Sim, Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Consultant trigger and Drawer */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer font-bold text-xs ring-4 ring-emerald-500/20 active:scale-95"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Consultor IA SpacePay</span>
          <span className="sm:hidden">IA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      </div>

      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end sm:p-6 animate-in fade-in">
          <div className="w-full sm:max-w-md h-[90vh] sm:h-[640px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6 sm:slide-in-from-right-6 flex flex-col">
            <SpacePayAiAssistant
              sellerContext={sellerAiContext}
              onClose={() => setIsAiDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
