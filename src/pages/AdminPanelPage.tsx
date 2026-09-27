import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { FileUploadDropzone } from '../components/FileUploadDropzone.tsx';
import {
  ResponsiveContainer,
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
} from 'recharts';
import {
  Product,
  Order,
  User,
  Withdrawal,
  NetShopConfig,
  ProductType,
} from '../types/index.ts';
import {
  ShieldCheck,
  Package,
  DollarSign,
  Users,
  Settings,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit,
  PlusCircle,
  Copy,
  Check,
  BookOpen,
  Video,
  Activity,
  AlertCircle,
  ExternalLink,
  Wallet,
  Lock,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Download,
  FileCheck,
  Zap,
} from 'lucide-react';

interface AdminPanelPageProps {
  navigate: (route: string) => void;
}

const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[210px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-emerald-400 font-mono">Consolidado SpacePay</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => {
            const isCurrency = entry.dataKey === 'receita' || entry.dataKey === 'comissoes' || entry.dataKey === 'taxas';
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white tabular-nums">
                  {isCurrency ? `${entry.value.toLocaleString('pt-MZ')} MT` : `${entry.value} vendas`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomCategoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[200px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-emerald-400 font-mono">Formato</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => {
            const isCurrency = entry.dataKey === 'faturamento' || entry.dataKey === 'comissoes' || entry.dataKey === 'taxas';
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white tabular-nums">
                  {isCurrency ? `${entry.value.toLocaleString('pt-MZ')} MT` : `${entry.value} pedidos`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ navigate }) => {
  const { user, isAdmin, login } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'produtos' | 'vendas' | 'usuarios' | 'levantamentos' | 'netshop'>('dashboard');

  // Chart view filters
  const [lineChartMetric, setLineChartMetric] = useState<'all' | 'revenue' | 'sales' | 'commissions'>('all');
  const [barChartMetric, setBarChartMetric] = useState<'all' | 'faturamento' | 'vendas'>('all');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [netShopConfig, setNetShopConfig] = useState<NetShopConfig | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [executingPayoutId, setExecutingPayoutId] = useState<string | null>(null);

  // NetShop form state
  const [walletId, setWalletId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://www.netshop.co.mz/api/v1');
  const [netShopTesting, setNetShopTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);

  // Admin New Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdType, setNewProdType] = useState<ProductType>('ebook');
  const [newProdPrice, setNewProdPrice] = useState('350');
  const [newProdComm, setNewProdComm] = useState('60');
  const [newProdCover, setNewProdCover] = useState('/src/assets/images/product_ebook_cv_1790278048991.jpg');
  const [newProdFileName, setNewProdFileName] = useState('');
  const [newProdFileSize, setNewProdFileSize] = useState<number | undefined>(undefined);
  const [newProdFileSizeFormatted, setNewProdFileSizeFormatted] = useState('');
  const [newProdFileUrl, setNewProdFileUrl] = useState('');

  // Copied indicator
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    setAdminLoadError(null);
    try {
      if (activeTab === 'dashboard') {
        const res = await api.getAdminDashboard();
        setStats(res.stats);
      } else if (activeTab === 'produtos') {
        const res = await api.getAdminProducts();
        setProducts(res.products);
      } else if (activeTab === 'vendas') {
        const res = await api.getAdminOrders();
        setOrders(res.orders);
      } else if (activeTab === 'usuarios') {
        const res = await api.getAdminUsers();
        setUsersList(res.users);
      } else if (activeTab === 'levantamentos') {
        const res = await api.getAdminWithdrawals();
        setWithdrawals(res.withdrawals);
      } else if (activeTab === 'netshop') {
        const res = await api.getAdminNetShop();
        setNetShopConfig(res.config);
        setWebhookUrl(res.webhookUrl);
        setWalletId(res.config.walletId || '');
        setApiKey(res.config.apiKey || '');
        setWebhookSecret(res.config.webhookSecret || '');
        const initialUrl = 'https://www.netshop.co.mz/api/v1';
        setBaseUrl(initialUrl);
      }
    } catch (e: any) {
      console.warn('Notice loading admin data:', e);
      let errMsg = e.message || 'Falha ao carregar dados do painel.';
      if (errMsg.includes('Unexpected token') || errMsg.includes('<html') || errMsg.includes('JSON')) {
        errMsg = 'Sessão administrativa conectando ao servidor. Clique no botão "Tentar Novamente" abaixo.';
      }
      setAdminLoadError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProductStatus = async (id: string, status: string) => {
    try {
      await api.updateProductStatus(id, status);
      setActionFeedback({ type: 'success', message: `Status do produto alterado para ${status}.` });
      const res = await api.getAdminProducts();
      setProducts(res.products);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Erro ao alterar status.' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto permanentemente?')) return;
    try {
      await api.deleteProduct(id);
      setActionFeedback({ type: 'success', message: 'Produto excluído com sucesso.' });
      setProducts(products.filter(p => p.id !== id));
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message });
    }
  };

  const handleExecuteRealPayout = async (w: Withdrawal) => {
    const confirmText = `Confirma a transferência REAL de ${w.amount.toLocaleString('pt-MZ')} MT diretamente para ${w.accountDetails.beneficiaryName} (${w.accountDetails.phoneOrAccount}) via ${w.method.toUpperCase()}?`;
    if (!confirm(confirmText)) return;

    setExecutingPayoutId(w.id);
    setActionFeedback(null);

    try {
      const res = await api.executeRealWithdrawalPayout(w.id);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Transferência REAL executada com sucesso!',
      });
      const updatedRes = await api.getAdminWithdrawals();
      setWithdrawals(updatedRes.withdrawals);
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: e.message || 'Falha ao executar transferência instantânea.',
      });
    } finally {
      setExecutingPayoutId(null);
    }
  };

  const handleWithdrawalAction = async (id: string, status: 'paid' | 'rejected' | 'under_review') => {
    let reference = '';
    let reason = '';

    if (status === 'paid') {
      reference = prompt('Informe a referência do comprovativo de pagamento:') || `PAG-${Date.now().toString().slice(-6)}`;
    } else if (status === 'rejected') {
      reason = prompt('Informe o motivo da rejeição (o valor será estornado ao saldo disponível do usuário):') || 'Dados bancários ou telemóvel inválidos.';
    }

    try {
      await api.updateWithdrawalStatus(id, status, reference, reason);
      setActionFeedback({ type: 'success', message: `Levantamento marcado como ${status}.` });
      const res = await api.getAdminWithdrawals();
      setWithdrawals(res.withdrawals);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message });
    }
  };

  const handleSaveNetShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveAdminNetShop({
        walletId: walletId.trim(),
        apiKey: apiKey.trim(),
        webhookSecret: webhookSecret.trim(),
        baseUrl: 'https://www.netshop.co.mz/api/v1',
        enabled: true,
      });
      setActionFeedback({ type: 'success', message: res.message });
      // Reload netshop config to confirm
      const updated = await api.getAdminNetShop();
      setNetShopConfig(updated.config);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message });
    }
  };

  const handleTestNetShop = async () => {
    setNetShopTesting(true);
    setTestResult(null);
    try {
      const res = await api.testNetShopPing();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setNetShopTesting(false);
    }
  };

  const handleCreatePlatformProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminProduct({
        title: newProdTitle,
        description: newProdDesc,
        type: newProdType,
        price: Number(newProdPrice),
        affiliateCommission: Number(newProdComm),
        coverUrl: newProdCover,
        fileName: newProdFileName || undefined,
        fileSize: newProdFileSize || undefined,
        fileSizeFormatted: newProdFileSizeFormatted || undefined,
        fileUrl: newProdType === 'ebook' ? (newProdFileUrl || undefined) : undefined,
        videoUrl: newProdType === 'video' ? (newProdFileUrl || undefined) : undefined,
      });
      setShowAddProductModal(false);
      setNewProdTitle('');
      setNewProdDesc('');
      setNewProdFileName('');
      setNewProdFileSize(undefined);
      setNewProdFileSizeFormatted('');
      setNewProdFileUrl('');
      setActionFeedback({ type: 'success', message: 'Produto cadastrado diretamente no catálogo com sucesso!' });
      const res = await api.getAdminProducts();
      setProducts(res.products);
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message });
    }
  };

  // Restrict access
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-slate-500">
          Apenas a conta de administrador única (<strong className="text-slate-700">{ADMIN_EMAIL}</strong>) tem autorização para gerenciar a plataforma SpacePay.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button
            onClick={async () => {
              try {
                await login(ADMIN_EMAIL);
              } catch (e: any) {
                alert(e.message || 'Erro ao conectar como administrador.');
              }
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors"
          >
            Entrar como Administrador
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Trocar de Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
              Controle Geral do Administrador
            </span>
          </div>
          <h1 className="text-2xl font-bold">Painel Administrativo SpacePay</h1>
          <p className="text-xs text-slate-400">
            Logado como: <strong className="text-white">{ADMIN_EMAIL}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('netshop');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            Gateway de Pagamentos
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Admin Load Error Banner */}
      {adminLoadError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{adminLoadError}</span>
          </div>
          <button
            onClick={loadAdminData}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'dashboard', label: 'Dashboard & Métricas' },
          { id: 'produtos', label: 'Gestão de Produtos' },
          { id: 'vendas', label: 'Vendas & Transações' },
          { id: 'usuarios', label: 'Usuários & Afiliados' },
          { id: 'levantamentos', label: 'Levantamentos' },
          { id: 'netshop', label: 'Gateway de Pagamentos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Total</span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {stats.totalRevenue.toLocaleString('pt-MZ')} <span className="text-xs text-slate-400">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">{stats.completedOrders} vendas concluídas</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Taxas SpacePay (10%)</span>
              <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                {stats.spacePayFees.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-700">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Destinado à conta comercial admin</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Comissões Afiliados</span>
              <div className="text-2xl font-extrabold text-amber-600 tabular-nums">
                {stats.totalCommissions.toLocaleString('pt-MZ')} <span className="text-xs text-amber-700">MT</span>
              </div>
              <p className="text-[11px] text-slate-500">Distribuídas aos promotores</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Usuários Cadastrados</span>
              <div className="text-2xl font-extrabold text-blue-600 tabular-nums">
                {stats.totalUsers}
              </div>
              <p className="text-[11px] text-slate-500">Compradores e afiliados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Catálogo: eBooks</span>
                <div className="text-lg font-bold text-slate-900">{stats.ebooksCount}</div>
              </div>
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Catálogo: Vídeos de Dicas</span>
                <div className="text-lg font-bold text-slate-900">{stats.videosCount}</div>
              </div>
              <Video className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Produtos Em Análise</span>
                <div className="text-lg font-bold text-amber-600">{stats.pendingProductsCount}</div>
              </div>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          {/* RECHARTS INTEGRATION: TRENDS & CATEGORICAL SALES VISUALIZATIONS */}
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Análise Visual de Desempenho (Recharts)</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Visualização de faturamento mensal, volume total de vendas e repasses de comissões de afiliados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-full border border-emerald-200">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Últimos 6 Meses Consolidados
                </span>
              </div>
            </div>

            {/* CHART 1: LINE CHART (Monthly Revenue, Total Sales & Affiliate Commission Payouts) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900">Tendência Mensal: Faturamento, Vendas e Comissões</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Evolução da receita bruta (MT), total de pedidos liquidados e pagamentos de comissões a promotores.
                  </p>
                </div>

                {/* Metric toggle controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setLineChartMetric('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      lineChartMetric === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setLineChartMetric('revenue')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      lineChartMetric === 'revenue'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Receita (MT)
                  </button>
                  <button
                    onClick={() => setLineChartMetric('sales')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      lineChartMetric === 'sales'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vendas
                  </button>
                  <button
                    onClick={() => setLineChartMetric('commissions')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      lineChartMetric === 'commissions'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Comissões
                  </button>
                </div>
              </div>

              {/* Line Chart Container */}
              <div className="w-full h-80 sm:h-96 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.monthlyTrends || []}
                    margin={{ top: 12, right: 28, left: 10, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#059669"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} MT`}
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
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs font-semibold text-slate-700 mx-1">{value}</span>
                      )}
                    />

                    {(lineChartMetric === 'all' || lineChartMetric === 'revenue') && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="receita"
                        name="Faturamento Mensal (MT)"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, stroke: '#059669', strokeWidth: 2 }}
                      />
                    )}

                    {(lineChartMetric === 'all' || lineChartMetric === 'commissions') && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="comissoes"
                        name="Comissões Afiliados (MT)"
                        stroke="#d97706"
                        strokeWidth={2.5}
                        strokeDasharray="4 2"
                        dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, stroke: '#d97706', strokeWidth: 2 }}
                      />
                    )}

                    {(lineChartMetric === 'all' || lineChartMetric === 'sales') && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="vendas"
                        name="Total de Vendas (Qtd)"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Média Mensal Faturamento</span>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                    {Math.round(stats.totalRevenue / Math.max(1, (stats.monthlyTrends?.length || 6))).toLocaleString('pt-MZ')} MT
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Média Vendas / Mês</span>
                  <div className="text-base font-extrabold text-indigo-700 mt-0.5 tabular-nums">
                    {Math.round(stats.completedOrders / Math.max(1, (stats.monthlyTrends?.length || 6)))} pedidos
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Média Comissões / Mês</span>
                  <div className="text-base font-extrabold text-amber-700 mt-0.5 tabular-nums">
                    {Math.round(stats.totalCommissions / Math.max(1, (stats.monthlyTrends?.length || 6))).toLocaleString('pt-MZ')} MT
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Taxa Média de Repasse</span>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                    {stats.totalRevenue > 0 ? ((stats.totalCommissions / stats.totalRevenue) * 100).toFixed(1) : '0'}% da receita
                  </div>
                </div>
              </div>
            </div>

            {/* CHART 2: BAR CHART (Categorical Sales Comparisons) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Comparativo Categórico: eBooks vs Vídeos de Dicas</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Comparação detalhada de faturamento, comissões de afiliados e volume entre os formatos disponíveis.
                    </p>
                  </div>

                  {/* Mode selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setBarChartMetric('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        barChartMetric === 'all'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Completo
                    </button>
                    <button
                      onClick={() => setBarChartMetric('faturamento')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        barChartMetric === 'faturamento'
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Faturamento
                    </button>
                    <button
                      onClick={() => setBarChartMetric('vendas')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        barChartMetric === 'vendas'
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Vendas
                    </button>
                  </div>
                </div>

                {/* Bar Chart Container */}
                <div className="w-full h-72 sm:h-80 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.categoryComparison || []}
                      margin={{ top: 12, right: 20, left: 10, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="category"
                        stroke="#334155"
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                      />
                      <Tooltip content={<CustomCategoryTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => <span className="text-xs font-semibold text-slate-700 mx-1">{value}</span>}
                      />

                      {(barChartMetric === 'all' || barChartMetric === 'faturamento') && (
                        <Bar
                          dataKey="faturamento"
                          name="Faturamento Total (MT)"
                          fill="#059669"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={54}
                        />
                      )}

                      {barChartMetric === 'all' && (
                        <Bar
                          dataKey="comissoes"
                          name="Comissões Afiliados (MT)"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={54}
                        />
                      )}

                      {(barChartMetric === 'all' || barChartMetric === 'vendas') && (
                        <Bar
                          dataKey="vendas"
                          name="Vendas Concluídas (Qtd)"
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={54}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categorical Breakdown & Share Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Participação por Formato</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Divisão percentual e desempenho individual entre eBooks e Vídeos.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* eBooks Card */}
                  <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">eBooks</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {stats.totalRevenue > 0 && stats.categoryComparison?.[0]
                          ? `${Math.round((stats.categoryComparison[0].faturamento / stats.totalRevenue) * 100)}% da Receita`
                          : 'eBook'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500">Faturamento</span>
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {stats.categoryComparison?.[0]?.faturamento?.toLocaleString('pt-MZ') || 0} MT
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Vendas</span>
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {stats.categoryComparison?.[0]?.vendas || 0} pedidos
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Videos Card */}
                  <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">Vídeos de Dicas</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {stats.totalRevenue > 0 && stats.categoryComparison?.[1]
                          ? `${Math.round((stats.categoryComparison[1].faturamento / stats.totalRevenue) * 100)}% da Receita`
                          : 'Vídeo'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500">Faturamento</span>
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {stats.categoryComparison?.[1]?.faturamento?.toLocaleString('pt-MZ') || 0} MT
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Vendas</span>
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {stats.categoryComparison?.[1]?.vendas || 0} pedidos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Taxa SpacePay Aplicada:</span>
                    <strong className="text-emerald-700 font-bold">10% nas vendas de criadores</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Gateways de Pagamento:</span>
                    <span className="font-medium text-slate-900">M-Pesa · mCash · Visa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE PRODUTOS */}
      {activeTab === 'produtos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Catálogo e Aprovação de Produtos</h2>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Cadastrar Produto Próprio
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Arquivo Digital</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img src={p.coverUrl} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                          <div>
                            <span className="font-bold text-slate-900 block max-w-xs truncate">{p.title}</span>
                            <span className="text-[10px] text-slate-400">{p.salesCount} vendas · {p.downloadCount || 0} downloads</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 uppercase font-semibold text-[10px] text-slate-600">
                        {p.type === 'ebook' ? 'eBook' : 'Vídeo'}
                      </td>
                      <td className="p-3">
                        {p.fileName ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <FileCheck className="w-3 h-3 text-emerald-600" /> {p.type === 'ebook' ? 'PDF Anexado' : 'Vídeo Anexado'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]" title={p.fileName}>
                              {p.fileName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            PDF Gerado Auto
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold tabular-nums">{p.price} MT</td>
                      <td className="p-3 font-semibold text-emerald-600 tabular-nums">+{p.affiliateCommission} MT</td>
                      <td className="p-3 text-slate-600">
                        {p.isPlatformProduct ? (
                          <span className="text-emerald-700 font-bold text-[10px]">SpacePay Oficial</span>
                        ) : (
                          <span>{p.sellerName}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status === 'approved'
                            ? 'Aprovado'
                            : p.status === 'pending_approval'
                            ? 'Em Análise'
                            : p.status === 'rejected'
                            ? 'Rejeitado'
                            : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={api.getProductDownloadUrl(p.id)}
                            download={p.fileName || `${p.slug}.${p.type === 'ebook' ? 'pdf' : 'mp4'}`}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                            title="Testar Download do Arquivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => handleProductStatus(p.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                            >
                              Aprovar
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => handleProductStatus(p.id, 'rejected')}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 cursor-pointer"
                            >
                              Rejeitar
                            </button>
                          )}
                          <button
                            onClick={() => handleProductStatus(p.id, p.status === 'inactive' ? 'approved' : 'inactive')}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-[11px] hover:bg-slate-200 cursor-pointer"
                          >
                            {p.status === 'inactive' ? 'Ativar' : 'Desativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDAS & TRANSAÇÕES */}
      {activeTab === 'vendas' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Todas as Vendas Realizadas (Gateway Oficial)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Total: {orders.length} pedidos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Pedido / Ref</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Comprador</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Bruto</th>
                  <th className="p-3">Taxa 10%</th>
                  <th className="p-3">Afiliado</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">
                      <div>{o.id}</div>
                      <span className="text-[10px] text-slate-400">{o.netShopReference || '-'}</span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString('pt-MZ')}</td>
                    <td className="p-3 font-semibold text-slate-900">{o.productTitle}</td>
                    <td className="p-3 text-slate-700">
                      <div>{o.buyerName}</div>
                      <div className="text-[10px] text-slate-400">{o.buyerPhone}</div>
                    </td>
                    <td className="p-3 uppercase font-bold text-slate-600">{o.paymentMethod}</td>
                    <td className="p-3 font-bold tabular-nums">{o.amount} MT</td>
                    <td className="p-3 tabular-nums text-emerald-700 font-bold">{o.platformFee} MT</td>
                    <td className="p-3 tabular-nums text-amber-600 font-semibold">{o.affiliateCommission} MT</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status === 'completed' ? 'Concluído' : o.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USUÁRIOS & AFILIADOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Usuários e Afiliados SpacePay
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Função</th>
                  <th className="p-3">Saldo Disponível</th>
                  <th className="p-3">Total Ganho</th>
                  <th className="p-3">Comissões</th>
                  <th className="p-3">Vendas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600 tabular-nums">
                      {u.wallet?.availableBalance?.toLocaleString('pt-MZ') || 0} MT
                    </td>
                    <td className="p-3 tabular-nums text-slate-700">
                      {u.wallet?.totalEarned?.toLocaleString('pt-MZ') || 0} MT
                    </td>
                    <td className="p-3 tabular-nums text-amber-600">
                      {u.wallet?.totalCommissions?.toLocaleString('pt-MZ') || 0} MT
                    </td>
                    <td className="p-3 tabular-nums">{u.wallet?.totalSales || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LEVANTAMENTOS */}
      {activeTab === 'levantamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Solicitações de Levantamento
            </h3>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma solicitação de levantamento registrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Método</th>
                    <th className="p-3">Conta / Telemóvel</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{new Date(w.createdAt).toLocaleDateString('pt-MZ')}</td>
                      <td className="p-3 font-semibold text-slate-900">{w.userName}</td>
                      <td className="p-3 font-bold tabular-nums text-emerald-600">{w.amount.toLocaleString('pt-MZ')} MT</td>
                      <td className="p-3 uppercase font-bold text-[10px] text-slate-700">{w.method}</td>
                      <td className="p-3 text-slate-600">
                        <div>{w.accountDetails.phoneOrAccount}</div>
                        <div className="text-[10px] text-slate-400">{w.accountDetails.beneficiaryName}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'under_review'
                              ? 'bg-blue-100 text-blue-800'
                              : w.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {w.status === 'paid' ? 'Pago' : w.status === 'under_review' ? 'Em Análise' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {w.status !== 'paid' && w.status !== 'rejected' && (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {(w.method === 'mpesa' || w.method === 'mcash') && (
                              <button
                                onClick={() => handleExecuteRealPayout(w)}
                                disabled={executingPayoutId === w.id}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                title="Executar transferência REAL de fundos para o telemóvel do usuário"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                {executingPayoutId === w.id ? 'Transferindo...' : 'Transferir LIVE'}
                              </button>
                            )}
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'paid')}
                              disabled={executingPayoutId === w.id}
                              className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-700 cursor-pointer"
                              title="Marcar como pago com comprovativo bancário"
                            >
                              Manual
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'rejected')}
                              disabled={executingPayoutId === w.id}
                              className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-semibold hover:bg-rose-100 cursor-pointer"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}

                        {w.status === 'paid' && (
                          <div className="text-right space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {w.disbursedVia === 'netshop_live' ? 'Transferência LIVE' : 'Comprovado'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {w.providerReceipt ? `Recibo: ${w.providerReceipt}` : w.gatewayReference || w.reference || 'Ref OK'}
                            </div>
                          </div>
                        )}

                        {w.status === 'rejected' && (
                          <div className="text-right text-[10px] text-rose-600">
                            <span className="font-semibold">Estornado à carteira</span>
                            {w.rejectionReason && (
                              <div className="text-slate-400 italic text-[9px] max-w-[140px] truncate ml-auto">
                                {w.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CONFIGURAÇÕES DO GATEWAY */}
      {activeTab === 'netshop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                Configurações da Carteira Comercial & API
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Integração com Gateway de Pagamentos Oficial
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Insira as credenciais comerciais para liquidação de pagamentos reais via M-Pesa, mCash e cartões Visa. O valor das transações e as taxas de 10% entram diretamente na sua conta cadastrada. As credenciais são criptografadas no servidor backend.
              </p>
            </div>

            <form onSubmit={handleSaveNetShop} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  ID DA CARTEIRA COMERCIAL (WALLET ID) *
                </label>
                <input
                  type="text"
                  required
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  placeholder="Ex: WALLET-MZ-2026-SP"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identificador da sua carteira comercial principal. O valor integral das vendas e a taxa de 10% da SpacePay entram diretamente nesta conta.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  CHAVE SECRETA DE API (GATEWAY API KEY) *
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Chave secreta de autenticação do gateway de pagamentos"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nunca exposta ao frontend. Utilizada exclusivamente pelo servidor backend da SpacePay.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  CHAVE DE ASSINATURA WEBHOOK (WEBHOOK SECRET) *
                </label>
                <input
                  type="text"
                  required
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Segredo para validação de assinaturas SHA-256 de webhooks"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Utilizado para validar a autenticidade das confirmações de pagamento enviadas pelo gateway.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  URL BASE DO SERVIDOR DO GATEWAY *
                </label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://www.netshop.co.mz/api/v1"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Salvar Credenciais do Gateway
                </button>
                <button
                  type="button"
                  onClick={handleTestNetShop}
                  disabled={netShopTesting}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {netShopTesting ? 'Testando Conexão...' : 'Testar Conexão com Gateway'}
                </button>
              </div>
            </form>

            {testResult && (
              <div
                className={`p-4 rounded-xl text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                  <span>Resultado do Teste de Conexão:</span>
                </div>
                <p>{testResult.message}</p>
                {testResult.latencyMs && (
                  <p className="text-[11px] text-slate-500">Tempo de resposta: {testResult.latencyMs}ms</p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Webhook URL Endpoint Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase">Endpoint do Webhook</h4>
              <p className="text-slate-500">
                Cadastre este URL exato no painel do seu comerciante no gateway para receber notificações de pagamentos:
              </p>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] break-all text-slate-800 select-all">
                {webhookUrl || `${window.location.origin}/api/webhooks/netshop`}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl || `${window.location.origin}/api/webhooks/netshop`);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhook ? 'Copiado para a Área de Transferência' : 'Copiar URL do Webhook'}</span>
              </button>
            </div>

            {/* Security checklist */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3 text-xs text-slate-600">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantias de Segurança</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                <li>Idempotência ativada: transações idênticas nunca são processadas duas vezes.</li>
                <li>Validação de assinatura HMAC-SHA256 em cada webhook recebido.</li>
                <li>Taxa SpacePay de 10% calculada com precisão no servidor.</li>
                <li>Bloqueio de acessos públicos ou modificações externas de saldos.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar Produto Oficial da Plataforma */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Produto da Plataforma</h3>
                <p className="text-[11px] text-slate-500">Faça o upload do material em PDF ou vídeo para liberação automática.</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePlatformProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="Ex: Guia de Negócios 2026"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição *</label>
                <textarea
                  required
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo *</label>
                  <select
                    value={newProdType}
                    onChange={(e) => setNewProdType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="ebook">eBook (PDF)</option>
                    <option value="video">Vídeo de Dicas (MP4)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Preço (MT) *</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Comissão para Afiliados (MT) *</label>
                <input
                  type="number"
                  required
                  value={newProdComm}
                  onChange={(e) => setNewProdComm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-emerald-600 font-bold"
                />
              </div>

              {/* UPLOAD DO ARQUIVO DIGITAL */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <FileUploadDropzone
                  productType={newProdType}
                  fileName={newProdFileName}
                  fileSizeFormatted={newProdFileSizeFormatted}
                  fileUrl={newProdFileUrl}
                  onFileUploaded={(res) => {
                    setNewProdFileName(res.fileName);
                    setNewProdFileSize(res.fileSize);
                    setNewProdFileSizeFormatted(res.fileSizeFormatted);
                    setNewProdFileUrl(res.fileUrl);
                  }}
                  onFileRemoved={() => {
                    setNewProdFileName('');
                    setNewProdFileSize(undefined);
                    setNewProdFileSizeFormatted('');
                    setNewProdFileUrl('');
                  }}
                  externalUrl={newProdFileUrl}
                  onExternalUrlChange={(url) => setNewProdFileUrl(url)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Publicar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
