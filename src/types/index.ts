export type ProductType = 'ebook' | 'video';

export type ProductStatus = 'approved' | 'pending_approval' | 'rejected' | 'inactive';

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ProductType;
  price: number; // in Meticais (MT)
  affiliateCommission: number; // in Meticais (MT)
  coverUrl: string;
  fileUrl?: string; // eBook link or readable file
  videoUrl?: string; // Tip video URL or stream
  fileName?: string; // Original uploaded file name (e.g. Guia_Profissional.pdf)
  fileSize?: number; // Size in bytes
  fileSizeFormatted?: string; // e.g. "3.5 MB"
  downloadCount?: number; // Total number of downloads
  status: ProductStatus;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  isPlatformProduct: boolean;
  allowAffiliates: boolean;
  salesCount: number;
  previewDicas?: string[]; // Highlights / Dicas
  tableOfContents?: { title: string; pagesOrDuration: string }[];
  contentSample?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  createdAt: string;
  avatar?: string;
  wallet: {
    availableBalance: number; // MT
    pendingBalance: number;   // MT
    totalEarned: number;       // MT
    totalSales: number;        // Total sales count
    totalCommissions: number;  // MT earned from affiliations
  };
}

export type PaymentMethod = 'mpesa' | 'mcash' | 'visa';

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  amount: number; // MT
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  affiliateId?: string;
  affiliateCommission: number;
  platformFee: number; // 10% on user products or platform full for admin
  sellerShare: number;
  netShopTransactionId?: string;
  netShopReference?: string;
  operatorReceipt?: string;
  createdAt: string;
  paidAt?: string;
}

export type TransactionType = 'sale_earning' | 'affiliate_commission' | 'platform_fee' | 'withdrawal' | 'refund';

export interface Transaction {
  id: string;
  userId: string;
  orderId?: string;
  type: TransactionType;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  description: string;
  createdAt: string;
}

export type WithdrawalStatus = 'pending' | 'under_review' | 'paid' | 'rejected';

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'mpesa' | 'mcash' | 'bank_transfer';
  accountDetails: {
    phoneOrAccount: string;
    beneficiaryName: string;
    bankName?: string;
  };
  status: WithdrawalStatus;
  reference?: string;
  gatewayReference?: string;
  providerReceipt?: string;
  disbursedVia?: 'netshop_live' | 'manual_bank';
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface NetShopConfig {
  walletId: string;
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  enabled: boolean;
  lastUpdated?: string;
}

export interface AffiliateStats {
  affiliateId: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  clicks: number;
  sales: number;
  commissionPerSale: number;
  totalEarned: number;
  affiliateLink: string;
}

export interface UserLibraryItem {
  orderId: string;
  purchaseDate: string;
  product: Product;
}
