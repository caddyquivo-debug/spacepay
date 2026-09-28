import {
  Product,
  User,
  Order,
  Withdrawal,
  Transaction,
  NetShopConfig,
  AffiliateStats,
} from '../types/index.ts';

const getAuthHeaders = (): HeadersInit => {
  const storedUser = localStorage.getItem('spacepay_user');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.email) {
        headers['x-user-email'] = user.email.trim();
      }
    } catch (e) {
      // ignore
    }
  }
  return headers;
};

// Resilient fetch wrapper with automatic retry on network drops and friendly error translation
async function httpFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed') ||
      msg.includes('fetch failed')
    ) {
      // Retry once after 350ms in case the server had a momentary restart or network glitch
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return await fetch(input, init);
      } catch {
        throw new Error('Não foi possível conectar ao servidor. Por favor, tente novamente em instantes.');
      }
    }
    throw err;
  }
}

// Safe JSON parser helper to prevent "Unexpected token '<'" when receiving HTML error responses
async function parseJsonResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    throw new Error(fallbackError);
  }

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // If the body is HTML (e.g. 404, 502, or Vite index.html), provide an informative message
    if (text.trim().startsWith('<')) {
      if (res.status === 403) {
        throw new Error('Acesso restrito ao administrador (caddyquivo@gmail.com). Por favor faça login com a conta de administrador.');
      }
      throw new Error(`Servidor em sincronização (HTTP ${res.status}). Por favor recarregue ou tente novamente.`);
    }
    throw new Error(text.slice(0, 150) || fallbackError);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || fallbackError);
  }
  return data;
}

export const api = {
  // --- AUTH ---
  async login(email: string): Promise<{ user: User; message: string }> {
    const res = await httpFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await parseJsonResponse<{ user: User; message: string }>(res, 'Erro ao entrar.');
    localStorage.setItem('spacepay_user', JSON.stringify(data.user));
    return data;
  },

  async register(name: string, email: string, phone?: string): Promise<{ user: User; message: string }> {
    const res = await httpFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone?.trim() }),
    });
    const data = await parseJsonResponse<{ user: User; message: string }>(res, 'Erro ao registrar.');
    localStorage.setItem('spacepay_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await httpFetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse<{ user: User }>(res, 'Não autenticado.');
  },

  async recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await httpFetch('/api/auth/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    return parseJsonResponse<{ success: boolean; message: string }>(res, 'Erro ao recuperar senha.');
  },

  // --- PRODUCTS ---
  async getProducts(filters?: {
    type?: string;
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());

    const res = await httpFetch(`/api/products?${params.toString()}`);
    return parseJsonResponse(res, 'Erro ao carregar catálogo.');
  },

  async getProduct(idOrSlug: string, affiliateId?: string): Promise<{ product: Product; trackingRef?: string }> {
    const url = affiliateId
      ? `/api/products/${encodeURIComponent(idOrSlug)}?ref=${encodeURIComponent(affiliateId)}`
      : `/api/products/${encodeURIComponent(idOrSlug)}`;
    const res = await httpFetch(url);
    return parseJsonResponse(res, 'Produto não encontrado.');
  },

  async createProduct(productData: any): Promise<{ product: Product; message: string }> {
    const res = await httpFetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return parseJsonResponse(res, 'Erro ao criar infoproduto.');
  },

  async uploadFile(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileSizeFormatted: string;
    mimeType: string;
    publicUrl: string;
  }> {
    // If progress is needed, use XMLHttpRequest
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res);
            } catch (err) {
              reject(new Error('Resposta inválida do servidor de arquivos.'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Erro de upload: HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`Falha no upload do arquivo (HTTP ${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Erro de conexão durante o upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')));

        xhr.open('POST', '/api/upload');
        const user = localStorage.getItem('spacepay_user');
        if (user) {
          try {
            const parsed = JSON.parse(user);
            if (parsed.email) xhr.setRequestHeader('x-user-email', parsed.email);
          } catch {}
        }
        xhr.send(formData);
      });
    } else {
      const formData = new FormData();
      formData.append('file', file);
      const res = await httpFetch('/api/upload', {
        method: 'POST',
        headers: (() => {
          const h: Record<string, string> = {};
          const u = localStorage.getItem('spacepay_user');
          if (u) {
            try {
              const p = JSON.parse(u);
              if (p.email) h['x-user-email'] = p.email;
            } catch {}
          }
          return h;
        })(),
        body: formData,
      });
      return parseJsonResponse(res, 'Erro no upload.');
    }
  },

  getProductDownloadUrl(productId: string, orderId?: string, buyerName?: string): string {
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (buyerName) params.set('buyerName', buyerName);
    const query = params.toString() ? `?${params.toString()}` : '';
    return `/api/products/${productId}/download${query}`;
  },

  getProductStreamUrl(productId: string): string {
    return `/api/products/${productId}/download`;
  },

  // --- CHECKOUT & REAL NETSHOP TRANSACTIONS ---
  async initiateCheckout(payload: {
    productId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    paymentMethod: 'mpesa' | 'mcash' | 'visa';
    affiliateId?: string;
  }): Promise<{ order: Order; payment: any }> {
    const res = await httpFetch('/api/checkout/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res, 'Erro ao iniciar transação no gateway.');
  },

  async getOrder(orderId: string): Promise<{ order: Order }> {
    const res = await httpFetch(`/api/orders/${orderId}`);
    return parseJsonResponse(res, 'Pedido não encontrado.');
  },

  async verifyOrderPayment(orderId: string): Promise<{ success: boolean; order?: Order; status?: string; message: string }> {
    const res = await httpFetch(`/api/orders/${orderId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return parseJsonResponse(res, 'Erro ao verificar pagamento.');
  },

  async confirmTestPayment(orderId: string): Promise<{ success: boolean; order?: Order; message: string }> {
    const res = await httpFetch(`/api/orders/${orderId}/confirm-payment-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return parseJsonResponse(res, 'Erro ao confirmar teste.');
  },

  // --- USER DASHBOARD ---
  async getLibrary(): Promise<{ ebooks: Product[]; videos: Product[] }> {
    const res = await httpFetch('/api/user/library', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar sua biblioteca.');
  },

  async getMyProducts(): Promise<{ products: Product[] }> {
    const res = await httpFetch('/api/user/my-products', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar seus produtos.');
  },

  async getMySales(): Promise<{
    sales: Order[];
    totalGross: number;
    totalPlatformFees: number;
    totalAffiliateCommissions: number;
    totalNetEarned: number;
  }> {
    const res = await httpFetch('/api/user/sales', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar vendas.');
  },

  async getAffiliateStats(): Promise<{ stats: AffiliateStats[] }> {
    const res = await httpFetch('/api/affiliates/stats', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar estatísticas de afiliado.');
  },

  async getWallet(): Promise<{ wallet: any; transactions: Transaction[] }> {
    const res = await httpFetch('/api/user/wallet', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar carteira.');
  },

  async getWithdrawals(): Promise<{ withdrawals: Withdrawal[] }> {
    const res = await httpFetch('/api/user/withdrawals', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar levantamentos.');
  },

  async requestWithdrawal(payload: {
    amount: number;
    method: 'mpesa' | 'mcash' | 'bank_transfer';
    phoneOrAccount: string;
    beneficiaryName: string;
    bankName?: string;
  }): Promise<{
    success: boolean;
    withdrawal: Withdrawal;
    message: string;
    warning?: string;
    realPayoutSuccess?: boolean;
    receipt?: string;
  }> {
    const res = await httpFetch('/api/user/withdrawals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res, 'Erro ao solicitar levantamento.');
  },

  // --- ADMIN PANEL ---
  async getAdminDashboard(): Promise<{ stats: any }> {
    const res = await httpFetch('/api/admin/dashboard', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Acesso restrito ao administrador (caddyquivo@gmail.com).');
  },

  async getAdminProducts(): Promise<{ products: Product[] }> {
    const res = await httpFetch('/api/admin/products', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao listar produtos admin.');
  },

  async updateProductStatus(id: string, status: string): Promise<{ product: Product; message: string }> {
    const res = await httpFetch(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return parseJsonResponse(res, 'Erro ao atualizar status.');
  },

  async createAdminProduct(productData: any): Promise<{ product: Product; message: string }> {
    const res = await httpFetch('/api/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return parseJsonResponse(res, 'Erro ao criar produto.');
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const res = await httpFetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao excluir produto.');
  },

  async getAdminOrders(): Promise<{ orders: Order[] }> {
    const res = await httpFetch('/api/admin/orders', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao listar pedidos.');
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await httpFetch('/api/admin/users', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao listar usuários.');
  },

  async getAdminWithdrawals(): Promise<{ withdrawals: Withdrawal[] }> {
    const res = await httpFetch('/api/admin/withdrawals', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao listar levantamentos.');
  },

  async updateWithdrawalStatus(
    id: string,
    status: 'under_review' | 'paid' | 'rejected',
    reference?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; withdrawal: Withdrawal; message: string }> {
    const res = await httpFetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reference, rejectionReason }),
    });
    return parseJsonResponse(res, 'Erro ao atualizar levantamento.');
  },

  async executeRealWithdrawalPayout(id: string): Promise<{
    success: boolean;
    message: string;
    withdrawal: Withdrawal;
    receipt?: string;
    reference?: string;
  }> {
    const res = await httpFetch(`/api/admin/withdrawals/${id}/payout-real`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao executar transferência real pelo NetShop.');
  },

  async getAdminNetShop(): Promise<{ config: NetShopConfig; webhookUrl: string }> {
    const res = await httpFetch('/api/admin/netshop', {
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao carregar credenciais do Gateway NetShop.');
  },

  async saveAdminNetShop(config: Partial<NetShopConfig>): Promise<{ success: boolean; message: string }> {
    const res = await httpFetch('/api/admin/netshop', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    return parseJsonResponse(res, 'Erro ao salvar credenciais do Gateway.');
  },

  async testNetShopPing(): Promise<{ success: boolean; message: string; latencyMs?: number; raw?: any }> {
    const res = await httpFetch('/api/admin/netshop/test', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseJsonResponse(res, 'Erro ao testar conectividade com NetShop.');
  },

  async testAdminWebhook(orderId?: string): Promise<{ success: boolean; message: string; order?: Order }> {
    const res = await httpFetch('/api/admin/netshop/test-webhook', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return parseJsonResponse(res, 'Erro ao testar processamento do webhook.');
  },

  // --- GEMINI AI ASSISTANT ---
  async sendAiChat(payload: {
    messages: { role: 'user' | 'model'; content: string }[];
    model?: string;
    sellerContext?: any;
  }): Promise<{ reply: string; model: string }> {
    const res = await httpFetch('/api/ai/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res, 'Erro na comunicação com o assistente IA.');
  },
};
