import fs from 'fs';
import path from 'path';
import {
  Product,
  User,
  Order,
  Transaction,
  Withdrawal,
  NetShopConfig,
  AffiliateStats,
} from '../src/types/index.ts';
import { generateProductPDF } from './pdfGenerator.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'spacepay_db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'server', 'uploads');

export const ADMIN_EMAIL = 'caddyquivo@gmail.com';

export interface DatabaseSchema {
  products: Product[];
  users: User[];
  orders: Order[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  netShopConfig: NetShopConfig;
  affiliateClicks: Record<string, number>; // key: `${productId}_${affiliateId}`
  processedTransactions: string[]; // for webhook idempotency
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-cv-pro',
    slug: 'como-fazer-um-cv-profissional',
    title: 'Como Fazer um CV Profissional',
    description: 'Guia prático e definitivo para criar um Currículo de alto impacto no mercado moçambicano e internacional. Modelos aprovados por recrutadores, palavras-chave estratégicas e erros fatais a evitar.',
    type: 'ebook',
    price: 300,
    affiliateCommission: 50,
    coverUrl: '/src/assets/images/product_ebook_cv_1790278048991.jpg',
    fileUrl: '/uploads/Como_Fazer_um_CV_Profissional.pdf',
    fileName: 'Como_Fazer_um_CV_Profissional.pdf',
    fileSizeFormatted: '1.4 MB',
    downloadCount: 142,
    status: 'approved',
    sellerId: 'admin-caddy',
    sellerName: 'SpacePay Editorial',
    sellerEmail: ADMIN_EMAIL,
    isPlatformProduct: true,
    allowAffiliates: true,
    salesCount: 142,
    previewDicas: [
      'Estrutura moderna compatível com sistemas ATS (rastreadores de candidatos)',
      'Como quantificar conquistas sem parecer pretensioso',
      'Modelos prontos para Word e Google Docs em formato A4',
      'Cartas de apresentação personalizadas para empresas moçambicanas'
    ],
    tableOfContents: [
      { title: 'Capítulo 1: O Que os Recrutadores Procuram em 2026', pagesOrDuration: '12 págs' },
      { title: 'Capítulo 2: Anatomia do CV Perfeito Passo a Passo', pagesOrDuration: '24 págs' },
      { title: 'Capítulo 3: Verbos de Ação e Palavras de Poder', pagesOrDuration: '18 págs' },
      { title: 'Capítulo 4: 5 Erros que Queimam sua Candidatura', pagesOrDuration: '10 págs' },
      { title: 'Anexo: 3 Modelos Prontos Editáveis', pagesOrDuration: '8 págs' },
    ],
    contentSample: `O mercado de trabalho em Moçambique e no ecossistema global exige objetividade. Mais de 80% das empresas descartam currículos nos primeiros 6 segundos se a estrutura visual for confusa ou contiver informações desnecessárias. Neste eBook você aprenderá como transformar cada linha de experiência em um resultado mensurável.`,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'prod-financas-tips',
    slug: 'dicas-rapidas-de-financas-pessoais',
    title: 'Dicas Rápidas de Finanças Pessoais',
    description: 'Série exclusiva de vídeos de dicas práticas sobre organização financeira em Meticais (MT), controle de gastos no M-Pesa, eliminação de dívidas e primeiros passos em investimentos acessíveis.',
    type: 'video',
    price: 450,
    affiliateCommission: 100,
    coverUrl: '/src/assets/images/product_video_financas_1790278058234.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileName: 'Dicas_Rapidas_de_Financas_Pessoais.mp4',
    fileSizeFormatted: '18.5 MB',
    downloadCount: 98,
    status: 'approved',
    sellerId: 'admin-caddy',
    sellerName: 'SpacePay Editorial',
    sellerEmail: ADMIN_EMAIL,
    isPlatformProduct: true,
    allowAffiliates: true,
    salesCount: 98,
    previewDicas: [
      'A regra dos 50/30/20 adaptada para a realidade de custos em Moçambique',
      'Como evitar o dreno silencioso de pequenas taxas móveis',
      'Criação de reserva de emergência rendendo acima da inflação',
      'Checklist mensal de revisão de despesas em 15 minutos'
    ],
    tableOfContents: [
      { title: 'Dica 1: O Diagnóstico Financeiro dos 7 Dias', pagesOrDuration: '08:15 min' },
      { title: 'Dica 2: Separando Custos Fixos e Variáveis no M-Pesa', pagesOrDuration: '11:30 min' },
      { title: 'Dica 3: Negociação e Liquidação Rápida de Dívidas', pagesOrDuration: '14:20 min' },
      { title: 'Dica 4: Primeiros Passos em Contas Poupança de Alto Rendimento', pagesOrDuration: '16:45 min' },
    ],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'prod-marketing-local',
    slug: 'marketing-digital-para-negocios-locais',
    title: 'Marketing Digital para Negócios Locais',
    description: 'Aprenda como atrair clientes diários pelo WhatsApp Business, Instagram e Google Meu Negócio sem gastar fortunas em anúncios. Estratégias validadas para Moçambique.',
    type: 'ebook',
    price: 600,
    affiliateCommission: 120,
    coverUrl: '/src/assets/images/product_ebook_marketing_1790278069189.jpg',
    fileUrl: '/uploads/Marketing_Digital_para_Negocios_Locais.pdf',
    fileName: 'Marketing_Digital_para_Negocios_Locais.pdf',
    fileSizeFormatted: '2.1 MB',
    downloadCount: 85,
    status: 'approved',
    sellerId: 'admin-caddy',
    sellerName: 'SpacePay Editorial',
    sellerEmail: ADMIN_EMAIL,
    isPlatformProduct: true,
    allowAffiliates: true,
    salesCount: 85,
    previewDicas: [
      'Como configurar o WhatsApp Business com respostas automáticas e catálogo persuasivo',
      'Guia para aparecer no topo das buscas no Google da sua cidade',
      'Templates prontos de mensagens de vendas com alta conversão',
      'Roteiros para vídeos curtos que geram pedidos no mesmo dia'
    ],
    tableOfContents: [
      { title: 'Capítulo 1: O Funil do WhatsApp que Vende Todo Dia', pagesOrDuration: '16 págs' },
      { title: 'Capítulo 2: Configuração Estratégica do Catálogo', pagesOrDuration: '14 págs' },
      { title: 'Capítulo 3: Criando Anúncios de Alto Retorno com Pouco Orçamento', pagesOrDuration: '22 págs' },
      { title: 'Capítulo 4: Pós-Venda e Recorrência de Clientes', pagesOrDuration: '12 págs' },
    ],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'prod-vendas-impacto',
    slug: 'vendas-e-negociacao-de-alto-impacto',
    title: 'Vendas e Negociação de Alto Impacto',
    description: 'Vídeos com dicas diretas ao ponto sobre técnicas de fechamento, como contornar a objeção "está caro" e postura profissional para fechar contratos com segurança.',
    type: 'video',
    price: 500,
    affiliateCommission: 100,
    coverUrl: '/src/assets/images/product_video_vendas_1790278079930.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    fileName: 'Vendas_e_Negociacao_de_Alto_Impacto.mp4',
    fileSizeFormatted: '22.0 MB',
    downloadCount: 67,
    status: 'approved',
    sellerId: 'admin-caddy',
    sellerName: 'SpacePay Editorial',
    sellerEmail: ADMIN_EMAIL,
    isPlatformProduct: true,
    allowAffiliates: true,
    salesCount: 67,
    previewDicas: [
      'Técnica do Espelho para gerar empatia instantânea',
      'Como desarmar a objeção de preço demonstrando valor intangível',
      'O momento exato de pedir o pagamento sem constrangimento',
      'Gatilhos mentais de escassez e urgência aplicados com ética'
    ],
    tableOfContents: [
      { title: 'Dica 1: Aberturas Magnéticas de Conversa', pagesOrDuration: '09:40 min' },
      { title: 'Dica 2: Destrinchando a Objeção "Vou Pensar e Volto"', pagesOrDuration: '13:10 min' },
      { title: 'Dica 3: 3 Fechamentos Infalíveis para WhatsApp e Reuniões', pagesOrDuration: '15:20 min' },
    ],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-caddy',
    name: 'Caddy Quivo (Administrador)',
    email: ADMIN_EMAIL,
    role: 'admin',
    phone: '+258 835373674',
    createdAt: new Date('2025-01-01').toISOString(),
    wallet: {
      availableBalance: 24500,
      pendingBalance: 1200,
      totalEarned: 35700,
      totalSales: 392,
      totalCommissions: 4800,
    }
  },
  {
    id: 'user-afiliado-1',
    name: 'Armando Macamo',
    email: 'armando.macamo@example.com',
    role: 'user',
    phone: '+258 841234567',
    createdAt: new Date('2025-02-10').toISOString(),
    wallet: {
      availableBalance: 2150,
      pendingBalance: 300,
      totalEarned: 5400,
      totalSales: 28,
      totalCommissions: 4200,
    }
  }
];

const DEFAULT_NETSHOP_CONFIG: NetShopConfig = {
  walletId: process.env.NETSHOP_WALLET_ID || '',
  apiKey: process.env.NETSHOP_API_KEY || '',
  webhookSecret: process.env.NETSHOP_WEBHOOK_SECRET || 'spacepay_netshop_secret_2026',
  baseUrl: process.env.NETSHOP_BASE_URL || 'https://www.netshop.co.mz/api/v1',
  enabled: true,
  lastUpdated: new Date().toISOString(),
};

function generateSeedOrders(): Order[] {
  const seedOrders: Order[] = [];
  const buyerList = [
    { name: 'Mateus Chissano', email: 'mateus.c@gmail.com', phone: '+258 845612345' },
    { name: 'Ana Paula Mondlane', email: 'anapaula.m@gmail.com', phone: '+258 823456789' },
    { name: 'Félix Machel', email: 'felix.machel@outlook.com', phone: '+258 871239874' },
    { name: 'Delfina Sitoe', email: 'delfina.sitoe@gmail.com', phone: '+258 834567890' },
    { name: 'Inácio Cossa', email: 'inacio.cossa@yahoo.com', phone: '+258 849876543' },
    { name: 'Beatriz Langa', email: 'beatriz.langa@gmail.com', phone: '+258 861112233' },
    { name: 'Carlos Tembe', email: 'carlos.tembe@hotmail.com', phone: '+258 829988776' },
    { name: 'Eunice Mabote', email: 'eunice.mabote@gmail.com', phone: '+258 847778899' },
  ];
  const paymentMethods: ('mpesa' | 'mcash' | 'visa')[] = ['mpesa', 'mpesa', 'visa', 'mcash', 'mpesa'];

  const now = new Date();
  // Realistic distribution over past 6 months to showcase revenue trends & growth
  const monthlyDistributions = [
    { monthOffset: 5, targetCount: 38 },
    { monthOffset: 4, targetCount: 46 },
    { monthOffset: 3, targetCount: 62 },
    { monthOffset: 2, targetCount: 78 },
    { monthOffset: 1, targetCount: 94 },
    { monthOffset: 0, targetCount: 74 },
  ];

  let orderIndex = 1000;
  monthlyDistributions.forEach(dist => {
    for (let i = 0; i < dist.targetCount; i++) {
      orderIndex++;
      const prod = DEFAULT_PRODUCTS[i % DEFAULT_PRODUCTS.length];
      const buyer = buyerList[i % buyerList.length];
      const method = paymentMethods[i % paymentMethods.length];
      const hasAffiliate = i % 2 === 0;
      const affiliateComm = hasAffiliate ? prod.affiliateCommission : 0;
      const platformFee = prod.isPlatformProduct ? Math.round(prod.price * 0.10) : Math.round(prod.price * 0.10);
      const sellerShare = prod.price - platformFee - affiliateComm;

      const day = Math.min(28, (i % 27) + 1);
      const hour = 8 + (i % 14);
      const minute = (i * 13) % 60;
      const orderDate = new Date(now.getFullYear(), now.getMonth() - dist.monthOffset, day, hour, minute);
      const dateStr = orderDate.toISOString();

      seedOrders.push({
        id: `ord-seed-${orderIndex}`,
        productId: prod.id,
        productTitle: prod.title,
        productType: prod.type,
        buyerEmail: buyer.email,
        buyerName: buyer.name,
        buyerPhone: buyer.phone,
        amount: prod.price,
        paymentMethod: method,
        status: 'completed',
        affiliateId: hasAffiliate ? 'user-afiliado-1' : undefined,
        affiliateCommission: affiliateComm,
        platformFee,
        sellerShare,
        netShopTransactionId: `NTS-TX-${orderIndex}`,
        netShopReference: `REF-2026-${orderIndex}`,
        createdAt: dateStr,
        paidAt: dateStr,
      });
    }
  });

  return seedOrders;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure admin always exists with correct role
        const adminIndex = parsed.users.findIndex((u: User) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
        if (adminIndex >= 0) {
          parsed.users[adminIndex].role = 'admin';
        } else {
          parsed.users.unshift(DEFAULT_USERS[0]);
        }
        // Seed orders if empty so dashboard charts have data
        if (!parsed.orders || parsed.orders.length === 0) {
          parsed.orders = generateSeedOrders();
          this.saveData(parsed);
        }
        this.ensureSeedUploads(parsed.products);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to read database file, initializing defaults:', e);
    }

    const initialData: DatabaseSchema = {
      products: DEFAULT_PRODUCTS,
      users: DEFAULT_USERS,
      orders: generateSeedOrders(),
      transactions: [],
      withdrawals: [],
      netShopConfig: DEFAULT_NETSHOP_CONFIG,
      affiliateClicks: {},
      processedTransactions: [],
    };

    this.ensureSeedUploads(initialData.products);
    this.saveData(initialData);
    return initialData;
  }

  private ensureSeedUploads(products: Product[]) {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      for (const prod of products) {
        if (prod.type === 'ebook') {
          const fileName = prod.fileName || `${prod.slug}.pdf`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          if (!fs.existsSync(filePath)) {
            const pdfBuffer = generateProductPDF({
              title: prod.title,
              type: prod.type,
              sellerName: prod.sellerName,
              sellerEmail: prod.sellerEmail,
              price: prod.price,
              previewDicas: prod.previewDicas,
              tableOfContents: prod.tableOfContents,
              description: prod.description,
              contentSample: prod.contentSample,
            });
            fs.writeFileSync(filePath, pdfBuffer);
          }
        }
      }
    } catch (e) {
      console.error('[SpacePay] Error creating seed ebook PDFs:', e);
    }
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- PRODUCTS ---
  getProducts(onlyApproved: boolean = true): Product[] {
    if (onlyApproved) {
      return this.data.products.filter(p => p.status === 'approved');
    }
    return this.data.products;
  }

  getProductByIdOrSlug(identifier: string): Product | undefined {
    return this.data.products.find(
      p => p.id === identifier || p.slug === identifier
    );
  }

  createProduct(product: Omit<Product, 'id' | 'slug' | 'createdAt' | 'salesCount'>): Product {
    const slug = product.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      slug,
      salesCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.data.products.unshift(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.products.splice(index, 1);
    this.saveData();
    return true;
  }

  incrementDownloadCount(id: string): number {
    const product = this.getProductByIdOrSlug(id);
    if (!product) return 0;
    product.downloadCount = (product.downloadCount || 0) + 1;
    this.saveData();
    return product.downloadCount;
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(name: string, email: string, phone?: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      email: email.toLowerCase(),
      role: isAdmin ? 'admin' : 'user',
      phone: phone || '',
      createdAt: new Date().toISOString(),
      wallet: {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSales: 0,
        totalCommissions: 0,
      },
    };

    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    // Never allow demoting caddyquivo@gmail.com from admin
    if (this.data.users[index].email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      updates.role = 'admin';
    }

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
    };
    this.saveData();
    return this.data.users[index];
  }

  // --- ORDERS & FINANCIAL CALCULATIONS ---
  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.orders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  getOrdersByBuyerEmail(email: string): Order[] {
    return this.data.orders.filter(o => o.buyerEmail.toLowerCase() === email.toLowerCase());
  }

  getAllOrders(): Order[] {
    return this.data.orders;
  }

  // IDEMPOTENT ORDER COMPLETION & COMMISSION DISTRIBUTION
  // Exactly implements the 10% fee and affiliate commission calculations
  completeOrder(orderId: string, netShopTransactionId?: string, netShopReference?: string): { success: boolean; order?: Order; message: string } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Pedido não encontrado.' };
    }

    // Idempotency check: if already completed, do not double-credit
    if (order.status === 'completed') {
      return { success: true, order, message: 'Pedido já foi processado anteriormente.' };
    }

    const txKey = netShopTransactionId || netShopReference || orderId;
    if (this.data.processedTransactions.includes(txKey)) {
      return { success: true, order, message: 'Transação NetShop já registrada.' };
    }

    const product = this.getProductByIdOrSlug(order.productId);
    if (!product) {
      return { success: false, message: 'Produto associado não encontrado.' };
    }

    // CALCULATIONS:
    // User product: SpacePay fee = 10% of product price
    // Seller = remainder - affiliate commission
    // Admin product: SpacePay fee = product price - affiliate commission
    const gross = order.amount;
    let platformFee = 0;
    let affiliateCommission = 0;
    let sellerShare = 0;

    // Check if affiliate exists and is valid
    let affiliateUser: User | undefined;
    if (order.affiliateId) {
      affiliateUser = this.getUserById(order.affiliateId);
      if (affiliateUser && product.allowAffiliates && product.affiliateCommission > 0) {
        // Commission cannot exceed product price
        affiliateCommission = Math.min(product.affiliateCommission, gross);
      }
    }

    if (product.isPlatformProduct) {
      // Admin/SpacePay product
      platformFee = Math.max(0, gross - affiliateCommission);
      sellerShare = 0; // belongs to platform
    } else {
      // User created product: 10% platform fee
      platformFee = Math.round(gross * 0.10);
      sellerShare = Math.max(0, gross - platformFee - affiliateCommission);
    }

    // Update order status
    order.status = 'completed';
    order.paidAt = new Date().toISOString();
    order.platformFee = platformFee;
    order.affiliateCommission = affiliateCommission;
    order.sellerShare = sellerShare;
    if (netShopTransactionId) order.netShopTransactionId = netShopTransactionId;
    if (netShopReference) order.netShopReference = netShopReference;

    // Record idempotency
    this.data.processedTransactions.push(txKey);

    // Increment product sales count
    product.salesCount = (product.salesCount || 0) + 1;

    const now = new Date().toISOString();

    // 1. Credit Affiliate if applicable
    if (affiliateUser && affiliateCommission > 0) {
      affiliateUser.wallet.availableBalance += affiliateCommission;
      affiliateUser.wallet.totalEarned += affiliateCommission;
      affiliateUser.wallet.totalCommissions += affiliateCommission;
      affiliateUser.wallet.totalSales += 1;

      this.data.transactions.push({
        id: `tx-${Date.now()}-aff`,
        userId: affiliateUser.id,
        orderId: order.id,
        type: 'affiliate_commission',
        grossAmount: gross,
        feeAmount: 0,
        netAmount: affiliateCommission,
        description: `Comissão de afiliado pela venda do ${product.type === 'ebook' ? 'eBook' : 'vídeo'}: ${product.title}`,
        createdAt: now,
      });
    }

    // 2. Credit Seller if user-created product
    if (!product.isPlatformProduct && sellerShare > 0) {
      const seller = this.getUserById(product.sellerId);
      if (seller) {
        seller.wallet.availableBalance += sellerShare;
        seller.wallet.totalEarned += sellerShare;
        seller.wallet.totalSales += 1;

        this.data.transactions.push({
          id: `tx-${Date.now()}-sel`,
          userId: seller.id,
          orderId: order.id,
          type: 'sale_earning',
          grossAmount: gross,
          feeAmount: platformFee + affiliateCommission,
          netAmount: sellerShare,
          description: `Venda do seu ${product.type === 'ebook' ? 'eBook' : 'vídeo'}: ${product.title} (Taxa SpacePay 10%: ${platformFee} MT${affiliateCommission > 0 ? `, Afiliado: ${affiliateCommission} MT` : ''})`,
          createdAt: now,
        });
      }
    }

    // 3. Credit Admin / Platform wallet (Taxa SpacePay)
    const adminUser = this.getUserByEmail(ADMIN_EMAIL);
    if (adminUser) {
      const adminNet = product.isPlatformProduct ? platformFee : platformFee;
      adminUser.wallet.availableBalance += adminNet;
      adminUser.wallet.totalEarned += adminNet;
      adminUser.wallet.totalSales += 1;

      this.data.transactions.push({
        id: `tx-${Date.now()}-adm`,
        userId: adminUser.id,
        orderId: order.id,
        type: 'platform_fee',
        grossAmount: gross,
        feeAmount: 0,
        netAmount: adminNet,
        description: product.isPlatformProduct
          ? `Venda de produto próprio da plataforma: ${product.title}`
          : `Taxa de 10% SpacePay sobre produto de usuário: ${product.title}`,
        createdAt: now,
      });
    }

    // Automatically ensure buyer has a user account so they can access their digital products
    let buyer = this.getUserByEmail(order.buyerEmail);
    if (!buyer) {
      buyer = this.createUser(order.buyerName, order.buyerEmail, order.buyerPhone);
    }

    this.saveData();
    return { success: true, order, message: 'Pagamento confirmado e acessos liberados com sucesso.' };
  }

  // --- AFFILIATE TRACKING ---
  recordAffiliateClick(productId: string, affiliateId: string) {
    const key = `${productId}_${affiliateId}`;
    this.data.affiliateClicks[key] = (this.data.affiliateClicks[key] || 0) + 1;
    this.saveData();
  }

  getAffiliateStatsForUser(userId: string): AffiliateStats[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    const products = this.getProducts(true).filter(p => p.allowAffiliates);
    return products.map(p => {
      const key = `${p.id}_${userId}`;
      const clicks = this.data.affiliateClicks[key] || 0;
      const sales = this.data.orders.filter(
        o => o.productId === p.id && o.affiliateId === userId && o.status === 'completed'
      ).length;
      const commissionPerSale = p.affiliateCommission;
      const totalEarned = sales * commissionPerSale;
      const affiliateLink = `/produto/${p.slug}?ref=${userId}`;

      return {
        affiliateId: userId,
        productId: p.id,
        productTitle: p.title,
        productType: p.type,
        clicks,
        sales,
        commissionPerSale,
        totalEarned,
        affiliateLink,
      };
    });
  }

  // --- USER LIBRARY ---
  getUserLibrary(email: string): { ebooks: Product[]; videos: Product[] } {
    const completedOrders = this.data.orders.filter(
      o => o.buyerEmail.toLowerCase() === email.toLowerCase() && o.status === 'completed'
    );

    const productIds = Array.from(new Set(completedOrders.map(o => o.productId)));
    const products = productIds
      .map(id => this.getProductByIdOrSlug(id))
      .filter((p): p is Product => p !== undefined);

    return {
      ebooks: products.filter(p => p.type === 'ebook'),
      videos: products.filter(p => p.type === 'video'),
    };
  }

  hasPurchasedProduct(email: string, productId: string): boolean {
    if (!email) return false;
    return this.data.orders.some(
      o => o.buyerEmail.toLowerCase() === email.toLowerCase() &&
           (o.productId === productId || this.getProductByIdOrSlug(o.productId)?.slug === productId) &&
           o.status === 'completed'
    );
  }

  // --- TRANSACTIONS & WALLET ---
  getUserTransactions(userId: string): Transaction[] {
    return this.data.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- WITHDRAWALS (LEVANTAMENTOS) ---
  createWithdrawalRequest(
    userId: string,
    amount: number,
    method: 'mpesa' | 'mcash' | 'bank_transfer',
    accountDetails: { phoneOrAccount: string; beneficiaryName: string; bankName?: string }
  ): { success: boolean; withdrawal?: Withdrawal; message: string } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (amount < 100) {
      return { success: false, message: 'O valor mínimo para levantamento é de 100 MT.' };
    }

    if (user.wallet.availableBalance < amount) {
      return { success: false, message: `Saldo insuficiente. Saldo disponível: ${user.wallet.availableBalance.toLocaleString('pt-MZ')} MT.` };
    }

    // Deduct from available balance and put into pending balance
    user.wallet.availableBalance -= amount;
    user.wallet.pendingBalance += amount;

    const withdrawal: Withdrawal = {
      id: `wth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      method,
      accountDetails,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.withdrawals.unshift(withdrawal);

    this.data.transactions.push({
      id: `tx-${Date.now()}-wth-req`,
      userId: user.id,
      type: 'withdrawal',
      grossAmount: amount,
      feeAmount: 0,
      netAmount: -amount,
      description: `Solicitação de levantamento via ${method.toUpperCase()} (${accountDetails.phoneOrAccount})`,
      createdAt: new Date().toISOString(),
    });

    this.saveData();
    return { success: true, withdrawal, message: 'Solicitação de levantamento criada com sucesso.' };
  }

  getUserWithdrawals(userId: string): Withdrawal[] {
    return this.data.withdrawals.filter(w => w.userId === userId);
  }

  getAllWithdrawals(): Withdrawal[] {
    return this.data.withdrawals;
  }

  updateWithdrawalStatus(
    id: string,
    status: 'under_review' | 'paid' | 'rejected',
    reference?: string,
    rejectionReason?: string,
    extra?: {
      gatewayReference?: string;
      providerReceipt?: string;
      disbursedVia?: 'netshop_live' | 'manual_bank';
    }
  ): { success: boolean; withdrawal?: Withdrawal; message: string } {
    const withdrawal = this.data.withdrawals.find(w => w.id === id);
    if (!withdrawal) {
      return { success: false, message: 'Levantamento não encontrado.' };
    }

    const user = this.getUserById(withdrawal.userId);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const previousStatus = withdrawal.status;
    withdrawal.status = status;
    withdrawal.processedAt = new Date().toISOString();
    if (reference) withdrawal.reference = reference;
    if (rejectionReason) withdrawal.rejectionReason = rejectionReason;
    if (extra?.gatewayReference) withdrawal.gatewayReference = extra.gatewayReference;
    if (extra?.providerReceipt) withdrawal.providerReceipt = extra.providerReceipt;
    if (extra?.disbursedVia) withdrawal.disbursedVia = extra.disbursedVia;

    if (status === 'paid' && previousStatus !== 'paid') {
      // Remove from pending
      user.wallet.pendingBalance = Math.max(0, user.wallet.pendingBalance - withdrawal.amount);
      const provReceipt = extra?.providerReceipt || withdrawal.providerReceipt || '';
      const receiptNote = provReceipt ? ` (Recibo: ${provReceipt})` : '';

      this.data.transactions.push({
        id: `tx-${Date.now()}-wth-paid`,
        userId: user.id,
        type: 'withdrawal',
        grossAmount: withdrawal.amount,
        feeAmount: 0,
        netAmount: -withdrawal.amount,
        description: `Levantamento de ${withdrawal.amount.toLocaleString('pt-MZ')} MT liquidado com sucesso via ${withdrawal.method.toUpperCase()} (${withdrawal.accountDetails.phoneOrAccount})${receiptNote}`,
        createdAt: new Date().toISOString(),
      });
    } else if (status === 'rejected' && previousStatus !== 'rejected') {
      // Refund back to available balance
      user.wallet.pendingBalance = Math.max(0, user.wallet.pendingBalance - withdrawal.amount);
      user.wallet.availableBalance += withdrawal.amount;

      this.data.transactions.push({
        id: `tx-${Date.now()}-wth-ref`,
        userId: user.id,
        type: 'refund',
        grossAmount: withdrawal.amount,
        feeAmount: 0,
        netAmount: withdrawal.amount,
        description: `Reembolso de levantamento rejeitado: ${rejectionReason || 'Motivo operacional'}`,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveData();
    return { success: true, withdrawal, message: `Status do levantamento atualizado para ${status}.` };
  }

  // --- NETSHOP CONFIG ---
  getNetShopConfig(): NetShopConfig {
    return this.data.netShopConfig;
  }

  updateNetShopConfig(updates: Partial<NetShopConfig>): NetShopConfig {
    this.data.netShopConfig = {
      ...this.data.netShopConfig,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    this.saveData();
    return this.data.netShopConfig;
  }

  // --- ADMIN DASHBOARD STATS ---
  getAdminStats() {
    const completedOrdersList = this.data.orders.filter(o => o.status === 'completed');

    const totalRevenue = completedOrdersList.reduce((sum, o) => sum + o.amount, 0);

    const spacePayFees = completedOrdersList.reduce((sum, o) => sum + (o.platformFee || 0), 0);

    const totalCommissions = completedOrdersList.reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);

    const completedOrders = completedOrdersList.length;
    const pendingWithdrawalsCount = this.data.withdrawals.filter(w => w.status === 'pending' || w.status === 'under_review').length;
    const pendingProductsCount = this.data.products.filter(p => p.status === 'pending_approval').length;

    const ebooksCount = this.data.products.filter(p => p.type === 'ebook').length;
    const videosCount = this.data.products.filter(p => p.type === 'video').length;

    // Categorical Sales Comparison
    let ebookSalesCount = 0;
    let ebookRevenue = 0;
    let ebookCommissions = 0;
    let ebookPlatformFees = 0;
    let videoSalesCount = 0;
    let videoRevenue = 0;
    let videoCommissions = 0;
    let videoPlatformFees = 0;

    completedOrdersList.forEach(o => {
      if (o.productType === 'ebook') {
        ebookSalesCount += 1;
        ebookRevenue += o.amount;
        ebookCommissions += (o.affiliateCommission || 0);
        ebookPlatformFees += (o.platformFee || 0);
      } else {
        videoSalesCount += 1;
        videoRevenue += o.amount;
        videoCommissions += (o.affiliateCommission || 0);
        videoPlatformFees += (o.platformFee || 0);
      }
    });

    const categoryComparison = [
      {
        category: 'eBooks',
        vendas: ebookSalesCount,
        faturamento: ebookRevenue,
        comissoes: ebookCommissions,
        taxas: ebookPlatformFees,
        mediaPreco: ebookSalesCount > 0 ? Math.round(ebookRevenue / ebookSalesCount) : 0,
      },
      {
        category: 'Vídeos de Dicas',
        vendas: videoSalesCount,
        faturamento: videoRevenue,
        comissoes: videoCommissions,
        taxas: videoPlatformFees,
        mediaPreco: videoSalesCount > 0 ? Math.round(videoRevenue / videoSalesCount) : 0,
      },
    ];

    // Monthly trends aggregation (last 6 months)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const monthlyMap: Record<string, { month: string; receita: number; vendas: number; comissoes: number; taxas: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      monthlyMap[key] = {
        month: label,
        receita: 0,
        vendas: 0,
        comissoes: 0,
        taxas: 0,
      };
    }

    // Populate with completed orders
    completedOrdersList.forEach(o => {
      const orderDate = new Date(o.paidAt || o.createdAt);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].receita += o.amount;
        monthlyMap[key].vendas += 1;
        monthlyMap[key].comissoes += o.affiliateCommission || 0;
        monthlyMap[key].taxas += o.platformFee || 0;
      }
    });

    const monthlyTrends = Object.values(monthlyMap);

    return {
      totalRevenue,
      spacePayFees,
      totalCommissions,
      completedOrders,
      totalUsers: this.data.users.length,
      totalProducts: this.data.products.length,
      ebooksCount,
      videosCount,
      pendingWithdrawalsCount,
      pendingProductsCount,
      monthlyTrends,
      categoryComparison,
    };
  }
}

export const db = new Database();
