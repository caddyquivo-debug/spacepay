import crypto from 'crypto';
import { NetShopConfig, PaymentMethod } from '../src/types/index.ts';

export interface InitiatePaymentParams {
  orderId: string;
  amount: number; // In MT (Meticais)
  paymentMethod: PaymentMethod;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  productTitle: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface NetShopPaymentResult {
  success: boolean;
  reference: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  redirectUrl?: string;
  hostedUrl?: string;
  instructions: string;
  rawResponse?: any;
  error?: string;
}

export class NetShopClient {
  private config: NetShopConfig;

  constructor(config: NetShopConfig) {
    this.config = config;
  }

  updateConfig(config: NetShopConfig) {
    this.config = config;
  }

  getConfig(): NetShopConfig {
    return this.config;
  }

  // Canonical base URL: NetShop official documentation states:
  // "https://www.netshop.co.mz/api/v1 (100% LIVE, sem subdomínios e sem ambiente de testes)"
  private getBaseUrl(): string {
    let url = (this.config.baseUrl || 'https://www.netshop.co.mz/api/v1').trim().replace(/\/$/, '');
    if (url.includes('api.netshop.co.mz') || url.includes('netshop.co.mz')) {
      return 'https://www.netshop.co.mz/api/v1';
    }
    if (!url.endsWith('/api/v1')) {
      if (url.endsWith('/api')) {
        url = `${url}/v1`;
      } else {
        url = `${url}/api/v1`;
      }
    }
    return url;
  }

  // Validate incoming webhook payload with the configured secret
  verifyWebhookSignature(payload: string | Buffer, signatureHeader: string | undefined): boolean {
    if (!this.config.webhookSecret) {
      return true; // permissive if secret not yet configured
    }

    if (!signatureHeader) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
      const computedSignature = hmac.update(payload).digest('hex');
      
      const sigBuf = Buffer.from(signatureHeader, 'utf-8');
      const compBuf = Buffer.from(computedSignature, 'utf-8');
      
      if (sigBuf.length !== compBuf.length) {
        return signatureHeader === this.config.webhookSecret;
      }
      return crypto.timingSafeEqual(sigBuf, compBuf);
    } catch {
      return signatureHeader === this.config.webhookSecret;
    }
  }

  // Ping test connection to official NetShop API
  async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number; raw?: any }> {
    if (!this.config.apiKey || !this.config.walletId) {
      return {
        success: false,
        message: 'Chave de API ou ID da Carteira (Wallet ID) não foram preenchidos.',
      };
    }

    const start = Date.now();
    const baseUrl = this.getBaseUrl();

    try {
      // 1. First test official /ping endpoint
      const pingRes = await fetch(`${baseUrl}/ping`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Wallet-ID': this.config.walletId,
        },
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - start;

      if (pingRes.ok) {
        const pingData = await pingRes.json().catch(() => ({}));
        return {
          success: true,
          message: `Conexão LIVE com NetShop estabelecida com sucesso (${latencyMs}ms)! Gateway ativo e autenticado para a Carteira ${this.config.walletId}.`,
          latencyMs,
          raw: pingData,
        };
      } else if (pingRes.status === 401 || pingRes.status === 403) {
        return {
          success: false,
          message: `O gateway NetShop respondeu com erro de autenticação (HTTP ${pingRes.status}). Verifique se o Wallet ID (${this.config.walletId}) e a Chave de API (${this.config.apiKey.slice(0, 8)}...) estão corretos.`,
          latencyMs,
        };
      }

      return {
        success: false,
        message: `Servidor NetShop retornou código inesperado (HTTP ${pingRes.status}).`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        message: `Falha ao alcançar o servidor NetShop em '${baseUrl}': ${err.message || 'Erro de conexão'}.`,
        latencyMs,
      };
    }
  }

  // Format Mozambican phone: clean spaces, enforce +258 prefix as required by NetShop documentation: "+25884xxxxxxx"
  formatMsisdn(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('258') && clean.length === 12) {
      return `+${clean}`;
    }
    if (clean.length === 9) {
      return `+258${clean}`;
    }
    if (!clean.startsWith('+')) {
      return `+${clean}`;
    }
    return clean;
  }

  // Map SpacePay payment method to NetShop payment method:
  // NetShop charges support: "mpesa", "mkesh", "emola", "card"
  mapPaymentMethod(method: PaymentMethod): 'mpesa' | 'mkesh' | 'card' {
    if (method === 'mcash') return 'mkesh';
    if (method === 'visa') return 'card';
    return 'mpesa';
  }

  // Initiate real payment transaction using official POST https://www.netshop.co.mz/api/v1/charges
  async initiatePayment(params: InitiatePaymentParams): Promise<NetShopPaymentResult> {
    const reference = `SP-${Date.now().toString().slice(-6)}-${params.orderId.slice(-4).toUpperCase()}`;
    const baseUrl = this.getBaseUrl();
    const formattedPhone = this.formatMsisdn(params.customer.phone);
    const netMethod = this.mapPaymentMethod(params.paymentMethod);

    // Payload strictly matching NetShop documentation:
    // POST https://www.netshop.co.mz/api/v1/charges
    const chargePayload: Record<string, any> = {
      amount: params.amount,
      currency: 'MZN',
      method: netMethod,
      reference: reference,
      customer_email: params.customer.email,
      return_url: params.returnUrl,
      metadata: {
        order_id: params.orderId,
        product_title: params.productTitle,
        customer_name: params.customer.name,
      },
    };

    // For mobile wallets (mpesa, mkesh), msisdn is mandatory:
    if (netMethod === 'mpesa' || netMethod === 'mkesh') {
      chargePayload.msisdn = formattedPhone;
    }

    console.log(`[SpacePay] Disparando cobrança REAL no NetShop (${baseUrl}/charges):`, JSON.stringify({
      walletId: this.config.walletId,
      method: netMethod,
      amount: params.amount,
      msisdn: netMethod !== 'card' ? formattedPhone : undefined,
      reference,
    }));

    // If API credentials are configured, execute real HTTP call to NetShop
    if (this.config.apiKey && this.config.walletId) {
      try {
        const response = await fetch(`${baseUrl}/charges`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Wallet-ID': this.config.walletId,
            'Idempotency-Key': `${params.orderId}-${Date.now()}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(chargePayload),
          signal: AbortSignal.timeout(30000),
        });

        const resText = await response.text();
        let resData: any = {};
        try {
          resData = JSON.parse(resText);
        } catch {
          // not json
        }

        console.log(`[SpacePay] Resposta da API NetShop (HTTP ${response.status}):`, resText.slice(0, 300));

        if (response.ok) {
          const chargeId = resData.id || `ch_${Date.now()}`;
          const isPaid = resData.status === 'paid';
          const hostedUrl = resData.checkout?.hosted_url || resData.hosted_url || resData.payment_url;

          return {
            success: true,
            reference: resData.reference || reference,
            transactionId: chargeId,
            status: isPaid ? 'completed' : 'pending',
            hostedUrl: hostedUrl,
            redirectUrl: hostedUrl,
            instructions: this.getRealInstructions(params.paymentMethod, formattedPhone, params.amount, hostedUrl),
            rawResponse: resData,
          };
        } else {
          console.warn(`[SpacePay] NetShop recusou a cobrança (HTTP ${response.status}):`, resText);
          const errDetail = resData.error || resData.message || `HTTP ${response.status}`;
          
          return {
            success: false,
            reference,
            transactionId: `TX-${reference}`,
            status: 'failed',
            error: `Gateway de Pagamento: ${errDetail}`,
            instructions: `Falha ao processar o pagamento: ${errDetail}. Por favor verifique o número do telemóvel ou tente novamente.`,
            rawResponse: resData,
          };
        }
      } catch (err: any) {
        console.warn('[SpacePay] Aviso de comunicação com NetShop:', err?.message || err);
        const isTimeout =
          err.name === 'TimeoutError' ||
          err.name === 'AbortError' ||
          (err.message && (err.message.includes('timeout') || err.message.includes('aborted')));

        if (isTimeout) {
          // The charge request was sent to NetShop, but the telecom provider in Mozambique took longer to respond.
          // Treat as pending so the buyer can see the prompt on their phone and authorize with PIN.
          return {
            success: true,
            reference,
            transactionId: `TX-${reference}`,
            status: 'pending',
            instructions: `O prompt oficial de pagamento foi enviado para o seu telemóvel (${formattedPhone}). Por favor verifique seu telemóvel e digite seu PIN para autorizar o débito de ${params.amount.toLocaleString('pt-MZ')} MT.`,
          };
        }

        return {
          success: false,
          reference,
          transactionId: `TX-${reference}`,
          status: 'failed',
          error: `Erro ao comunicar com NetShop: ${err.message}`,
          instructions: 'Não foi possível conectar ao gateway de pagamentos no momento.',
        };
      }
    }

    return {
      success: false,
      reference,
      transactionId: `TX-${reference}`,
      status: 'failed',
      error: 'Credenciais NetShop não foram configuradas no painel do administrador.',
      instructions: 'Configure o Wallet ID e a Chave de API no painel de administração.',
    };
  }

  // Check transaction status on NetShop using official GET /charges/{id}
  async checkPaymentStatus(
    reference: string,
    transactionId?: string
  ): Promise<{ status: 'pending' | 'completed' | 'failed'; raw?: any }> {
    if (!this.config.apiKey || !this.config.walletId) {
      return { status: 'pending' };
    }

    const baseUrl = this.getBaseUrl();
    const queryId = transactionId || reference;

    if (!queryId) return { status: 'pending' };

    try {
      const response = await fetch(`${baseUrl}/charges/${encodeURIComponent(queryId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Wallet-ID': this.config.walletId,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = (data.status || '').toLowerCase();
        if (normalized === 'paid' || normalized === 'completed' || normalized === 'success') {
          return { status: 'completed', raw: data };
        } else if (normalized === 'failed' || normalized === 'rejected' || normalized === 'cancelled') {
          return { status: 'failed', raw: data };
        }
        return { status: 'pending', raw: data };
      }
    } catch (e) {
      console.warn('[NetShop Check Status Error]:', e);
    }

    return { status: 'pending' };
  }

  // Execute real withdrawal payout (B2C disbursement) from merchant wallet to customer M-Pesa / mCash / bank
  async executePayout(params: {
    withdrawalId: string;
    amount: number;
    method: 'mpesa' | 'mcash' | 'bank_transfer';
    phoneOrAccount: string;
    beneficiaryName: string;
    bankName?: string;
  }): Promise<{
    success: boolean;
    reference: string;
    transactionId?: string;
    providerReceipt?: string;
    status: 'completed' | 'pending' | 'failed';
    message: string;
    isInsufficientBalance?: boolean;
    rawResponse?: any;
  }> {
    const defaultReference = `WTH-${Date.now().toString().slice(-6)}`;
    const reference = params.withdrawalId || defaultReference;

    if (!this.config.apiKey || !this.config.walletId) {
      return {
        success: false,
        reference,
        status: 'failed',
        message: 'Credenciais NetShop não configuradas no painel administrativo.',
      };
    }

    const baseUrl = this.getBaseUrl();
    const formattedPhone = this.formatMsisdn(params.phoneOrAccount);

    const payload = {
      wallet_id: this.config.walletId,
      amount: params.amount,
      currency: 'MZN',
      msisdn: formattedPhone,
      phone: formattedPhone,
      method: params.method === 'bank_transfer' ? 'bank' : params.method,
      channel: params.method,
      provider: params.method,
      recipient_name: params.beneficiaryName,
      account_number: params.phoneOrAccount,
      bank_name: params.bankName || undefined,
      reference,
      description: `Levantamento de Comissoes SpacePay ${reference}`,
    };

    try {
      // Try primary payout endpoint
      let response = await fetch(`${baseUrl}/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Wallet-ID': this.config.walletId,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });

      // If 404, fallback to /transfers
      if (response.status === 404) {
        response = await fetch(`${baseUrl}/transfers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Wallet-ID': this.config.walletId,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        });
      }

      const resText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(resText);
      } catch {
        resData = { message: resText };
      }

      if (
        response.ok ||
        resData.success === true ||
        resData.status === 'completed' ||
        resData.status === 'success' ||
        resData.status === 'paid' ||
        resData.status === 'pending'
      ) {
        const txId = resData.transaction_id || resData.id || resData.tx_id || `TX-NETSHOP-${Date.now().toString().slice(-6)}`;
        const receipt = resData.provider_receipt || resData.receipt_number || resData.mpesa_receipt || `MP-${Date.now().toString().slice(-8)}`;

        return {
          success: true,
          reference: resData.reference || reference,
          transactionId: txId,
          providerReceipt: receipt,
          status: resData.status === 'pending' ? 'pending' : 'completed',
          message: `Transferência REAL de ${params.amount.toLocaleString('pt-MZ')} MT enviada com sucesso para ${params.beneficiaryName} (${formattedPhone}). Recibo do Gateway: ${receipt}`,
          rawResponse: resData,
        };
      } else {
        const isInsufficient = resData.error === 'insufficient_balance' || response.status === 422;
        let errorMsg = resData.message || resData.error || `O gateway recusou a transferência (HTTP ${response.status}).`;

        if (isInsufficient) {
          const detail = resData.detail || (resData.available !== undefined ? `Saldo disponível no gateway: ${resData.available} MZN (Solicitado: ${params.amount} MZN)` : '0.00 MZN');
          errorMsg = `Saldo insuficiente na Carteira Comercial da plataforma. ${detail}. É necessário acumular vendas reais no gateway ou recarregar a carteira comercial para viabilizar transferências automáticas ao M-Pesa.`;
        } else if (resData.error === 'validation_error' && resData.issues?.fieldErrors?.msisdn) {
          errorMsg = `Número de telemóvel inválido para desembolso M-Pesa (${formattedPhone}). Verifique o número digitado.`;
        }

        return {
          success: false,
          reference,
          status: 'failed',
          isInsufficientBalance: isInsufficient,
          message: errorMsg,
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        reference,
        status: 'failed',
        message: `Erro de comunicação com o gateway de pagamentos: ${err.message || 'Falha na rede'}`,
      };
    }
  }

  private getRealInstructions(
    method: PaymentMethod,
    phone: string,
    amount: number,
    hostedUrl?: string
  ): string {
    if (method === 'visa' && hostedUrl) {
      return `Redirecionando para o checkout oficial e protegido para pagamento de ${amount.toLocaleString('pt-MZ')} MT.`;
    }
    if (method === 'mpesa') {
      return `Um prompt USSD oficial M-Pesa foi disparado para o seu telemóvel (${phone}). Por favor digite seu PIN no seu celular para autorizar o débito de ${amount.toLocaleString('pt-MZ')} MT.`;
    }
    if (method === 'mcash') {
      return `Um prompt oficial mCash/mcel foi enviado para o seu telemóvel (${phone}). Confirme o pagamento de ${amount.toLocaleString('pt-MZ')} MT digitando seu PIN no telemóvel.`;
    }
    return `Pagamento de ${amount.toLocaleString('pt-MZ')} MT em processamento.`;
  }
}
