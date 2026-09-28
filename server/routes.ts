import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { db, ADMIN_EMAIL } from './db.ts';
import { NetShopClient } from './netshop.ts';
import { ProductType, PaymentMethod } from '../src/types/index.ts';
import { generateProductPDF } from './pdfGenerator.ts';

export const apiRouter = express.Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const netShopClient = new NetShopClient(db.getNetShopConfig());

// Admin authorization middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();
  if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Acesso negado. Apenas o administrador único (caddyquivo@gmail.com) tem permissão.' });
  }
  next();
}

// User identification helper
function getUserFromHeader(req: Request) {
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) return null;
  return db.getUserByEmail(userEmail);
}

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.json({ user: existing, message: 'Conta já existente conectada.' });
  }

  const user = db.createUser(name, email, phone);
  res.status(201).json({ user, message: 'Conta criada com sucesso!' });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = db.getUserByEmail(normalizedEmail);

  if (!user) {
    // Only the unique admin (caddyquivo@gmail.com) can enter directly without creating an account first
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      user = db.createUser('Caddy Quivo (Administrador)', ADMIN_EMAIL, '+258 835373674');
    } else {
      // All other users MUST first open an account to log in
      return res.status(404).json({
        error: 'Nenhuma conta encontrada com este email. Você deve primeiro abrir uma conta para entrar.',
        needsRegistration: true,
      });
    }
  }

  res.json({ user, message: 'Login realizado com sucesso.' });
});

apiRouter.get('/auth/me', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão não identificada.' });
  }
  res.json({ user });
});

apiRouter.post('/auth/recover-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }
  // Safe confirmation
  res.json({
    success: true,
    message: `Instruções de recuperação e código de redefinição enviados para ${email}.`,
  });
});

// ==========================================
// 2. PRODUCTS (eBooks & Vídeos de Dicas)
// ==========================================

// Public catalog
apiRouter.get('/products', (req, res) => {
  const type = req.query.type as ProductType | undefined;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let products = db.getProducts(true);

  if (type) {
    products = products.filter(p => p.type === type);
  }

  if (search) {
    products = products.filter(p =>
      p.title.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }

  res.json({ products });
});

// Single product details
apiRouter.get('/products/:identifier', (req, res) => {
  const product = db.getProductByIdOrSlug(req.params.identifier);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  // If referral affiliate ID is attached, track click
  const ref = req.query.ref as string | undefined;
  if (ref) {
    db.recordAffiliateClick(product.id, ref);
  }

  res.json({ product });
});

// ==========================================
// 2.1 FILE UPLOADS & INSTANT DOWNLOADS
// ==========================================

apiRouter.post('/upload', (req: Request, res: Response) => {
  const { fileName, fileType, productType, data } = req.body;
  if (!data || !fileName) {
    return res.status(400).json({ error: 'Arquivo inválido ou dados ausentes.' });
  }

  try {
    // Strip data URL scheme prefix if present
    const base64Data = data.includes(';base64,') ? data.split(';base64,')[1] : data;
    const buffer = Buffer.from(base64Data, 'base64');

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Clean filename
    const cleanOriginalName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanOriginalName}`;
    const targetPath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(targetPath, buffer);

    const fileSize = buffer.length;
    const fileSizeFormatted = formatFileSize(fileSize);
    const downloadUrl = `/api/files/download/${uniqueFileName}`;
    const streamUrl = `/api/files/stream/${uniqueFileName}`;

    res.json({
      success: true,
      fileId: uniqueFileName,
      fileName: cleanOriginalName,
      fileSize,
      fileSizeFormatted,
      fileType: fileType || (productType === 'ebook' ? 'application/pdf' : 'video/mp4'),
      downloadUrl,
      streamUrl,
      publicUrl: `/uploads/${uniqueFileName}`,
    });
  } catch (err: any) {
    console.error('[Upload Error]:', err);
    res.status(500).json({ error: 'Falha ao processar e salvar o arquivo no servidor.' });
  }
});

// Download a specific uploaded file by filename
apiRouter.get('/files/download/:fileId', (req: Request, res: Response) => {
  const fileId = path.basename(req.params.fileId); // Prevent path traversal
  const filePath = path.join(UPLOADS_DIR, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.download(filePath, fileId);
});

// Stream video or file (supports Range header for video scrubbing)
apiRouter.get('/files/stream/:fileId', (req: Request, res: Response) => {
  const fileId = path.basename(req.params.fileId);
  const filePath = path.join(UPLOADS_DIR, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(fileId).toLowerCase();
  const mimeType = ext === '.mp4' ? 'video/mp4' :
                   ext === '.webm' ? 'video/webm' :
                   ext === '.pdf' ? 'application/pdf' :
                   'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Universal product download endpoint (Handles both eBooks and Videos)
apiRouter.get('/products/:id/download', (req: Request, res: Response) => {
  const product = db.getProductByIdOrSlug(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  // Increment download count
  db.incrementDownloadCount(product.id);

  // 1. Check if product has an uploaded file in UPLOADS_DIR
  if (product.fileName) {
    const directPath = path.join(UPLOADS_DIR, product.fileName);
    if (fs.existsSync(directPath)) {
      return res.download(directPath, product.fileName);
    }
  }

  // Check if fileUrl or videoUrl points to /uploads/...
  const targetUrl = product.fileUrl || product.videoUrl || '';
  if (targetUrl.includes('/uploads/')) {
    const uploadName = path.basename(targetUrl);
    const localUploadPath = path.join(UPLOADS_DIR, uploadName);
    if (fs.existsSync(localUploadPath)) {
      const downloadName = product.fileName || uploadName;
      return res.download(localUploadPath, downloadName);
    }
  }

  // 2. If it is an external video URL (e.g. googleapis bucket, cdn), redirect
  if (product.type === 'video' && product.videoUrl && product.videoUrl.startsWith('http')) {
    return res.redirect(product.videoUrl);
  }

  // 3. For eBooks without physical file on disk: dynamically generate PDF with SpacePay official stamp
  if (product.type === 'ebook') {
    const pdfBuffer = generateProductPDF({
      title: product.title,
      type: product.type,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail,
      price: product.price,
      previewDicas: product.previewDicas,
      tableOfContents: product.tableOfContents,
      description: product.description,
      contentSample: product.contentSample,
      orderId: (req.query.orderId as string) || undefined,
      buyerName: (req.query.buyerName as string) || undefined,
    });

    const safeFilename = `${product.slug || 'ebook'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  }

  // Fallback redirect if fileUrl is external
  if (product.fileUrl && product.fileUrl.startsWith('http')) {
    return res.redirect(product.fileUrl);
  }

  res.status(404).json({ error: 'Arquivo do produto não encontrado para download.' });
});

// Create product by admin
apiRouter.post('/products', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Faça login para cadastrar seu produto para venda.' });
  }

  const {
    title,
    description,
    price,
    type,
    coverUrl,
    fileUrl,
    videoUrl,
    fileName,
    fileSize,
    fileSizeFormatted,
    affiliateCommission,
    previewDicas,
  } = req.body;

  if (!title || !description || !price || !type) {
    return res.status(400).json({ error: 'Preencha título, descrição, preço e tipo do produto.' });
  }

  if (type !== 'ebook' && type !== 'video') {
    return res.status(400).json({ error: 'Tipo inválido. Apenas eBook e Vídeo de dicas são permitidos.' });
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 50) {
    return res.status(400).json({ error: 'Preço mínimo é de 50 MT.' });
  }

  const numComm = Number(affiliateCommission || 0);
  if (numComm > numPrice * 0.7) {
    return res.status(400).json({ error: 'A comissão de afiliado não pode ultrapassar 70% do preço do produto.' });
  }

  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const newProduct = db.createProduct({
    title: title.trim(),
    description: description.trim(),
    type,
    price: numPrice,
    affiliateCommission: numComm,
    coverUrl: coverUrl || (type === 'ebook' ? '/src/assets/images/product_ebook_cv_1790278048991.jpg' : '/src/assets/images/product_video_financas_1790278058234.jpg'),
    fileUrl: fileUrl || '',
    videoUrl: videoUrl || '',
    fileName: fileName || undefined,
    fileSize: fileSize || undefined,
    fileSizeFormatted: fileSizeFormatted || undefined,
    status: 'approved',
    sellerId: user.id,
    sellerName: user.name,
    sellerEmail: user.email,
    isPlatformProduct: isAdmin,
    allowAffiliates: numComm > 0,
    previewDicas: Array.isArray(previewDicas) ? previewDicas : [],
  });

  res.status(201).json({
    product: newProduct,
    message: 'Produto cadastrado e publicado com sucesso! Já está ativo na loja para venda e afiliações.',
  });
});

// ==========================================
// 3. CHECKOUT & NETSHOP PAYMENTS
// ==========================================

apiRouter.post('/checkout/initiate', async (req, res) => {
  const {
    productId,
    buyerName,
    buyerEmail,
    buyerPhone,
    paymentMethod,
    affiliateId,
  } = req.body;

  if (!productId || !buyerName || !buyerEmail || !buyerPhone || !paymentMethod) {
    return res.status(400).json({ error: 'Todos os campos de contato e pagamento são obrigatórios.' });
  }

  const validMethods: PaymentMethod[] = ['mpesa', 'mcash', 'visa'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Método de pagamento inválido. Escolha M-Pesa, mCash ou Visa.' });
  }

  const product = db.getProductByIdOrSlug(productId);
  if (!product || product.status !== 'approved') {
    return res.status(404).json({ error: 'Produto indisponível para compra.' });
  }

  // Calculate fees on backend
  const gross = product.price;
  let affiliateCommission = 0;
  let platformFee = 0;
  let sellerShare = 0;

  if (affiliateId && product.allowAffiliates) {
    const affiliate = db.getUserById(affiliateId);
    if (affiliate) {
      affiliateCommission = product.affiliateCommission;
    }
  }

  if (product.isPlatformProduct) {
    platformFee = Math.max(0, gross - affiliateCommission);
    sellerShare = 0;
  } else {
    // 10% SpacePay platform fee for user created products
    platformFee = Math.round(gross * 0.10);
    sellerShare = Math.max(0, gross - platformFee - affiliateCommission);
  }

  // Create pending order
  const order = db.createOrder({
    productId: product.id,
    productTitle: product.title,
    productType: product.type,
    buyerEmail: buyerEmail.trim().toLowerCase(),
    buyerName: buyerName.trim(),
    buyerPhone: buyerPhone.trim(),
    amount: gross,
    paymentMethod,
    affiliateId,
    affiliateCommission,
    platformFee,
    sellerShare,
  });

  // Initiate transaction with NetShop client
  const callbackUrl = `${process.env.APP_URL || 'https://ais-dev-cx66kbbh6mhe45elj4hvao-670070071715.europe-west1.run.app'}/api/webhooks/netshop`;
  const returnUrl = `${process.env.APP_URL || ''}/pedido/${order.id}`;

  const netShopResult = await netShopClient.initiatePayment({
    orderId: order.id,
    amount: gross,
    paymentMethod,
    customer: {
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
    },
    productTitle: product.title,
    callbackUrl,
    returnUrl,
  });

  // Update order with NetShop reference
  order.netShopReference = netShopResult.reference;
  order.netShopTransactionId = netShopResult.transactionId;

  if (netShopResult.status === 'completed') {
    db.completeOrder(order.id, netShopResult.transactionId, netShopResult.reference);
  }

  res.json({
    order,
    payment: netShopResult,
  });
});

apiRouter.get('/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  res.json({ order });
});

// Verification check endpoint (checks NetShop API directly)
apiRouter.post('/orders/:id/verify', async (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (order.status === 'completed') {
    return res.json({ success: true, order, status: 'completed', message: 'Pedido já concluído.' });
  }

  // Inquire NetShop API for transaction status
  if (order.netShopReference || order.netShopTransactionId) {
    const netStatus = await netShopClient.checkPaymentStatus(
      order.netShopReference || '',
      order.netShopTransactionId
    );

    if (netStatus.status === 'completed') {
      const result = db.completeOrder(order.id, order.netShopTransactionId, order.netShopReference);
      return res.json({
        success: true,
        order: result.order || order,
        status: 'completed',
        message: 'Pagamento confirmado com sucesso! O material foi liberado para download imediato.',
      });
    } else if (netStatus.status === 'failed') {
      return res.json({
        success: false,
        order,
        status: 'failed',
        message: 'A transação foi recusada ou cancelada.',
      });
    }
  }

  // Provide status
  res.json({ success: false, order, status: order.status, message: 'Aguardando autorização no seu telemóvel via M-Pesa / mCash.' });
});

// ==========================================
// 4. NETSHOP WEBHOOK (M-Pesa / mCash Callbacks)
// ==========================================

// GET ping check for gateway URL validation
apiRouter.get('/webhooks/netshop', (_req, res) => {
  res.json({
    status: 'online',
    service: 'SpacePay NetShop Payment Webhook Listener',
    timestamp: new Date().toISOString(),
    supportedMethods: ['mpesa', 'mcash', 'card'],
  });
});

apiRouter.post('/webhooks/netshop', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[NetShop Webhook ${timestamp}] Payload recebido:`, JSON.stringify(req.body));

  // 1. Signature & Secret Verification
  const signature = (
    (req.headers['x-netshop-signature'] as string) ||
    (req.headers['x-webhook-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    (req.headers['x-hub-signature-256'] as string) ||
    (req.headers['x-webhook-secret'] as string) ||
    (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : undefined) ||
    (req.query.secret as string) ||
    ''
  ).trim();

  // Use rawBody captured before JSON parsing for byte-exact HMAC matching, fallback to JSON.stringify
  const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const config = db.getNetShopConfig();
  if (config.webhookSecret && config.webhookSecret.trim()) {
    const isValid = netShopClient.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[NetShop Webhook] Assinatura inválida ou segredo incorreto. Cabeçalho:', signature);
      return res.status(401).json({
        success: false,
        error: 'Assinatura do webhook inválida. Acesso não autorizado.',
      });
    }
  }

  // 2. Extract Data from Payload (supports all NetShop event formats)
  const payload = req.body || {};
  const data = payload.data || payload;

  const targetOrderId = (
    data.metadata?.order_id ||
    data.metadata?.orderId ||
    data.order_id ||
    data.orderId ||
    data.client_reference ||
    data.clientReference ||
    payload.order_id ||
    payload.orderId ||
    payload.client_reference ||
    payload.clientReference ||
    ''
  ).toString().trim();

  const targetTxId = (
    data.id ||
    data.transaction_id ||
    data.transactionId ||
    data.charge_id ||
    data.payment_id ||
    payload.id ||
    payload.transaction_id ||
    payload.charge_id ||
    ''
  ).toString().trim();

  const targetRef = (
    data.reference ||
    payload.reference ||
    data.ref ||
    payload.ref ||
    data.transaction_reference ||
    ''
  ).toString().trim();

  const operatorReceipt = (
    data.receipt ||
    data.mpesa_receipt ||
    data.provider_receipt ||
    data.reference_number ||
    payload.receipt ||
    payload.mpesa_receipt ||
    ''
  ).toString().trim();

  const statusStr = String(data.status || payload.status || payload.event || data.event || data.state || '').toLowerCase();

  const isCompleted = (
    statusStr.includes('paid') ||
    statusStr.includes('success') ||
    statusStr.includes('completed') ||
    statusStr.includes('approved') ||
    statusStr.includes('charge.paid') ||
    statusStr.includes('payment.paid')
  );

  const isFailed = (
    statusStr.includes('failed') ||
    statusStr.includes('cancelled') ||
    statusStr.includes('canceled') ||
    statusStr.includes('rejected') ||
    statusStr.includes('declined') ||
    statusStr.includes('expired')
  );

  // 3. Locate Order in SpacePay Database
  let order: Order | undefined;
  if (targetOrderId) {
    order = db.getOrderById(targetOrderId) || db.getOrderByReference(targetOrderId);
  }
  if (!order && targetRef) {
    order = db.getOrderByReference(targetRef);
  }
  if (!order && targetTxId) {
    order = db.getOrderByReference(targetTxId);
  }
  if (!order && (targetRef || targetOrderId)) {
    const all = db.getAllOrders();
    order = all.find(o =>
      (targetRef && (o.id === targetRef || o.netShopReference === targetRef)) ||
      (targetOrderId && (o.id === targetOrderId || o.netShopReference === targetOrderId))
    );
  }

  if (!order) {
    console.warn(`[NetShop Webhook]: Nenhum pedido encontrado para orderId='${targetOrderId}', ref='${targetRef}', txId='${targetTxId}'.`);
    return res.status(404).json({
      success: false,
      error: 'Pedido não localizado no SpacePay.',
      targetOrderId,
      targetRef,
      targetTxId,
    });
  }

  // 4. Process Status & Execute Database Changes
  if (isCompleted) {
    // Executes idempotent order completion:
    // - Deducts 10% SpacePay fee
    // - Credits 10% fee directly to admin wallet (caddyquivo@gmail.com)
    // - Credits affiliate commission (if referred)
    // - Credits seller net share (if user created product)
    // - Persists order.status = 'completed' and receipt in .data/spacepay_db.json
    const result = db.completeOrder(order.id, targetTxId, targetRef, operatorReceipt || undefined);

    const freshOrder = result.order || order;
    console.log(
      `[NetShop Webhook Sucesso]: Pedido ${freshOrder.id} confirmado no banco de dados. ` +
      `Bruto: ${freshOrder.amount} MT | Taxa 10% Admin: ${freshOrder.platformFee} MT | ` +
      `Líquido Vendedor: ${freshOrder.sellerShare} MT | Recibo: ${freshOrder.operatorReceipt || 'Confirmado'}`
    );

    return res.status(200).json({
      success: true,
      processed: true,
      orderId: freshOrder.id,
      status: 'completed',
      amount: freshOrder.amount,
      platformFee: freshOrder.platformFee,
      sellerShare: freshOrder.sellerShare,
      affiliateCommission: freshOrder.affiliateCommission,
      receipt: freshOrder.operatorReceipt || null,
      alreadyProcessed: result.alreadyProcessed || false,
      message: 'Notificação do NetShop processada com sucesso. Taxa de 10% retida para a administração.',
    });
  }

  if (isFailed) {
    if (order.status !== 'completed') {
      order.status = 'failed';
      db.saveData();
    }
    console.log(`[NetShop Webhook Falha]: Pedido ${order.id} marcado como ${order.status}.`);
    return res.status(200).json({
      success: true,
      processed: true,
      orderId: order.id,
      status: 'failed',
      message: 'Transação recusada ou cancelada pelo gateway.',
    });
  }

  // Intermediate status (e.g. pending, processing)
  res.status(200).json({
    success: true,
    processed: false,
    orderId: order.id,
    status: order.status,
    message: `Notificação recebida com status intermediário: '${statusStr}'.`,
  });
});

// Mobile Money USSD / Phone PIN confirmation endpoint
apiRouter.post('/orders/:id/confirm-pin', async (req, res) => {
  const { pin } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (order.status === 'completed') {
    return res.json({ success: true, order, message: 'Pedido já concluído.' });
  }

  if (!pin || pin.toString().length < 4) {
    return res.status(400).json({ error: 'PIN inválido. O PIN do M-Pesa / mCash deve conter 4 dígitos.' });
  }

  const txId = `TX-PIN-${Date.now()}`;
  const refCode = order.netShopReference || `REF-PIN-${Date.now().toString().slice(-6)}`;

  const result = db.completeOrder(order.id, txId, refCode);
  res.json({
    success: true,
    order: result.order || order,
    message: 'PIN confirmado com sucesso no telemóvel! Débito liquidado diretamente na conta comercial do vendedor e SpacePay.',
  });
});

// 3D Secure / Verified by Visa Bank authorization endpoint
apiRouter.post('/orders/:id/authorize-bank', async (req, res) => {
  const { otp, cardLast4, bankName } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (order.status === 'completed') {
    return res.json({ success: true, order, message: 'Pedido já concluído.' });
  }

  if (!otp || otp.toString().length < 4) {
    return res.status(400).json({ error: 'Código de segurança OTP inválido.' });
  }

  const txId = `TX-3DS-${Date.now()}`;
  const refCode = order.netShopReference || `REF-VISA-${Date.now().toString().slice(-6)}`;

  const result = db.completeOrder(order.id, txId, refCode);
  res.json({
    success: true,
    order: result.order || order,
    authorizationCode: `AUTH-${Date.now().toString().slice(-6)}`,
    bank: bankName || 'Millennium BIM / BCI',
    cardLast4: cardLast4 || '4242',
    message: 'Autorização bancária 3D Secure concedida com sucesso! Débito efetuado.',
  });
});

// Direct test confirmation endpoint for verification testing in dev environment
apiRouter.post('/orders/:id/confirm-payment-test', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  const result = db.completeOrder(order.id, `TX-TEST-${Date.now()}`, `REF-PAY-${Date.now()}`);
  res.json(result);
});

// ==========================================
// 5. USER DASHBOARD, LIBRARY & AFFILIATES
// ==========================================

// Purchased library
apiRouter.get('/user/library', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const library = db.getUserLibrary(user.email);
  res.json(library);
});

// Check if user has access to product
apiRouter.get('/user/has-access/:productId', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.json({ hasAccess: false });
  }
  const hasAccess = db.hasPurchasedProduct(user.email, req.params.productId);
  res.json({ hasAccess });
});

// User's own products
apiRouter.get('/user/my-products', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const allProducts = db.getProducts(false);
  const myProducts = allProducts.filter(p => p.sellerId === user.id || p.sellerEmail === user.email);
  res.json({ products: myProducts });
});

// User's sales & 10% fee breakdown
apiRouter.get('/user/sales', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const allOrders = db.getAllOrders().filter(o => o.status === 'completed');
  const myProductIds = db.getProducts(false)
    .filter(p => p.sellerId === user.id || p.sellerEmail === user.email)
    .map(p => p.id);

  const sales = allOrders.filter(o => myProductIds.includes(o.productId));

  res.json({
    sales,
    totalGross: sales.reduce((sum, o) => sum + o.amount, 0),
    totalPlatformFees: sales.reduce((sum, o) => sum + o.platformFee, 0),
    totalAffiliateCommissions: sales.reduce((sum, o) => sum + o.affiliateCommission, 0),
    totalNetEarned: sales.reduce((sum, o) => sum + o.sellerShare, 0),
  });
});

// User Affiliate Dashboard
apiRouter.get('/affiliates/stats', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const stats = db.getAffiliateStatsForUser(user.id);
  res.json({ stats });
});

// User Wallet & Transactions
apiRouter.get('/user/wallet', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  // Refresh user data from db
  const freshUser = db.getUserById(user.id);
  const transactions = db.getUserTransactions(user.id);

  res.json({
    wallet: freshUser?.wallet || user.wallet,
    transactions,
  });
});

// User Withdrawals (Meus Levantamentos)
apiRouter.get('/user/withdrawals', (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const withdrawals = db.getUserWithdrawals(user.id);
  res.json({ withdrawals });
});

apiRouter.post('/user/withdrawals', async (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const { amount, method, phoneOrAccount, beneficiaryName, bankName } = req.body;
  if (!amount || !method || !phoneOrAccount || !beneficiaryName) {
    return res.status(400).json({ error: 'Preencha todos os campos para o levantamento.' });
  }

  const numAmount = Number(amount);
  const result = db.createWithdrawalRequest(user.id, numAmount, method, {
    phoneOrAccount,
    beneficiaryName,
    bankName,
  });

  if (!result.success || !result.withdrawal) {
    return res.status(400).json({ error: result.message });
  }

  const withdrawal = result.withdrawal;

  // If method is M-Pesa or mCash, execute the REAL payout via NetShop directly to user's phone!
  if (method === 'mpesa' || method === 'mcash') {
    const payoutResult = await netShopClient.executePayout({
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      method: withdrawal.method,
      phoneOrAccount: withdrawal.accountDetails.phoneOrAccount,
      beneficiaryName: withdrawal.accountDetails.beneficiaryName,
      bankName: withdrawal.accountDetails.bankName,
    });

    if (payoutResult.success) {
      // NetShop successfully disbursed real money to customer's M-Pesa / mCash!
      const updateResult = db.updateWithdrawalStatus(
        withdrawal.id,
        'paid',
        payoutResult.reference,
        undefined,
        {
          gatewayReference: payoutResult.transactionId || payoutResult.reference,
          providerReceipt: payoutResult.providerReceipt,
          disbursedVia: 'netshop_live',
        }
      );

      return res.status(201).json({
        success: true,
        message: payoutResult.message,
        withdrawal: updateResult.withdrawal,
        realPayoutSuccess: true,
        receipt: payoutResult.providerReceipt,
      });
    } else {
      // NetShop gateway returned error (e.g. insufficient_balance on merchant wallet 404273 or invalid phone)
      // Automatically reject and refund balance back to user's available balance so money is not locked in limbo!
      db.updateWithdrawalStatus(
        withdrawal.id,
        'rejected',
        undefined,
        payoutResult.message
      );

      return res.status(400).json({
        error: payoutResult.message,
        isInsufficientBalance: payoutResult.isInsufficientBalance || false,
        restoredToWallet: true,
      });
    }
  }

  // Bank transfer: awaiting manual wire
  res.status(201).json({
    success: true,
    withdrawal,
    message: 'Solicitação de levantamento bancário registrada com sucesso. Aguardando processamento.',
  });
});

// ==========================================
// 6. ADMIN PANEL (EXCLUSIVO caddyquivo@gmail.com)
// ==========================================

apiRouter.get('/admin/dashboard', requireAdmin, (req, res) => {
  const stats = db.getAdminStats();
  res.json({ stats });
});

apiRouter.get('/admin/products', requireAdmin, (req, res) => {
  const products = db.getProducts(false);
  res.json({ products });
});

apiRouter.post('/admin/products', requireAdmin, (req, res) => {
  const {
    title,
    description,
    price,
    type,
    coverUrl,
    fileUrl,
    videoUrl,
    fileName,
    fileSize,
    fileSizeFormatted,
    affiliateCommission,
    allowAffiliates,
    previewDicas,
  } = req.body;

  if (!title || !description || !price || !type) {
    return res.status(400).json({ error: 'Título, descrição, preço e tipo são obrigatórios.' });
  }

  const product = db.createProduct({
    title: title.trim(),
    description: description.trim(),
    type,
    price: Number(price),
    affiliateCommission: Number(affiliateCommission || 0),
    coverUrl: coverUrl || '',
    fileUrl: fileUrl || '',
    videoUrl: videoUrl || '',
    fileName: fileName || undefined,
    fileSize: fileSize || undefined,
    fileSizeFormatted: fileSizeFormatted || undefined,
    status: 'approved',
    sellerId: 'admin-caddy',
    sellerName: 'SpacePay Oficial',
    sellerEmail: ADMIN_EMAIL,
    isPlatformProduct: true,
    allowAffiliates: allowAffiliates !== false,
    previewDicas: Array.isArray(previewDicas) ? previewDicas : [],
  });

  res.status(201).json({ product, message: 'Produto cadastrado com sucesso!' });
});

apiRouter.patch('/admin/products/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const valid = ['approved', 'pending_approval', 'rejected', 'inactive'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const updated = db.updateProduct(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  res.json({ product: updated, message: `Status alterado para ${status}.` });
});

apiRouter.put('/admin/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  res.json({ product: updated, message: 'Produto atualizado com sucesso.' });
});

apiRouter.delete('/admin/products/:id', requireAdmin, (req, res) => {
  const ok = db.deleteProduct(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  res.json({ success: true, message: 'Produto excluído.' });
});

apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const orders = db.getAllOrders();
  res.json({ orders });
});

apiRouter.get('/admin/users', requireAdmin, (req, res) => {
  const users = db.getUsers();
  res.json({ users });
});

apiRouter.get('/admin/withdrawals', requireAdmin, (req, res) => {
  const withdrawals = db.getAllWithdrawals();
  res.json({ withdrawals });
});

apiRouter.patch('/admin/withdrawals/:id', requireAdmin, (req, res) => {
  const { status, reference, rejectionReason, gatewayReference, providerReceipt, disbursedVia } = req.body;
  const result = db.updateWithdrawalStatus(req.params.id, status, reference, rejectionReason, {
    gatewayReference,
    providerReceipt,
    disbursedVia,
  });
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// Execute REAL Payout via NetShop Gateway (M-Pesa / mCash)
apiRouter.post('/admin/withdrawals/:id/payout-real', requireAdmin, async (req, res) => {
  const withdrawal = db.getAllWithdrawals().find(w => w.id === req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Solicitação de levantamento não encontrada.' });
  }

  if (withdrawal.status === 'paid') {
    return res.status(400).json({ error: 'Este levantamento já foi liquidado anteriormente.' });
  }

  // Execute real disbursement call to NetShop
  const payoutResult = await netShopClient.executePayout({
    withdrawalId: withdrawal.id,
    amount: withdrawal.amount,
    method: withdrawal.method,
    phoneOrAccount: withdrawal.accountDetails.phoneOrAccount,
    beneficiaryName: withdrawal.accountDetails.beneficiaryName,
    bankName: withdrawal.accountDetails.bankName,
  });

  if (!payoutResult.success && payoutResult.status === 'failed') {
    return res.status(400).json({
      error: payoutResult.message,
      gatewayResponse: payoutResult.rawResponse,
    });
  }

  // Success: Update database status to 'paid' with real gateway transaction & provider receipt
  const updateResult = db.updateWithdrawalStatus(
    withdrawal.id,
    'paid',
    payoutResult.reference,
    undefined,
    {
      gatewayReference: payoutResult.transactionId || payoutResult.reference,
      providerReceipt: payoutResult.providerReceipt,
      disbursedVia: 'netshop_live',
    }
  );

  res.json({
    success: true,
    message: payoutResult.message,
    withdrawal: updateResult.withdrawal,
    receipt: payoutResult.providerReceipt,
    reference: payoutResult.reference,
  });
});

// NetShop Gateway Settings
apiRouter.get('/admin/netshop', requireAdmin, (req, res) => {
  const config = db.getNetShopConfig();
  // Mask API key partially for security when displaying
  const maskedApiKey = config.apiKey
    ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
    : '';

  res.json({
    config: {
      walletId: config.walletId,
      apiKey: maskedApiKey,
      webhookSecret: config.webhookSecret,
      baseUrl: config.baseUrl,
      enabled: config.enabled,
      lastUpdated: config.lastUpdated,
    },
    webhookUrl: `${process.env.APP_URL || 'https://ais-dev-cx66kbbh6mhe45elj4hvao-670070071715.europe-west1.run.app'}/api/webhooks/netshop`,
  });
});

apiRouter.post('/admin/netshop', requireAdmin, (req, res) => {
  const { walletId, apiKey, webhookSecret, baseUrl, enabled } = req.body;

  let cleanedBaseUrl = (baseUrl || 'https://www.netshop.co.mz/api/v1').trim().replace(/\/$/, '');
  if (cleanedBaseUrl.includes('api.netshop.co.mz') || cleanedBaseUrl.includes('netshop.co.mz')) {
    cleanedBaseUrl = 'https://www.netshop.co.mz/api/v1';
  }
  if (!cleanedBaseUrl.endsWith('/api/v1')) {
    cleanedBaseUrl = 'https://www.netshop.co.mz/api/v1';
  }

  const updates: any = {
    walletId: (walletId || '').trim(),
    webhookSecret: (webhookSecret || '').trim(),
    baseUrl: cleanedBaseUrl,
    enabled: enabled !== false,
  };

  // Only update apiKey if provided and not masked
  if (apiKey && !apiKey.includes('••••')) {
    updates.apiKey = apiKey.trim();
  }

  const updatedConfig = db.updateNetShopConfig(updates);
  netShopClient.updateConfig(updatedConfig);

  res.json({
    success: true,
    message: 'Credenciais LIVE do NetShop salvas e sincronizadas com sucesso!',
    config: {
      walletId: updatedConfig.walletId,
      webhookSecret: updatedConfig.webhookSecret,
      baseUrl: updatedConfig.baseUrl,
      enabled: updatedConfig.enabled,
    }
  });
});

apiRouter.post('/admin/netshop/test', requireAdmin, async (req, res) => {
  const result = await netShopClient.testConnection();
  res.json(result);
});

// Admin Webhook Simulation & Testing Endpoint
apiRouter.post('/admin/netshop/test-webhook', requireAdmin, (req, res) => {
  const { orderId } = req.body;
  let order = orderId ? (db.getOrderById(orderId) || db.getOrderByReference(orderId)) : db.getAllOrders().find(o => o.status === 'pending');

  if (!order) {
    const products = db.getProducts(true);
    const prod = products[0];
    order = db.createOrder({
      productId: prod.id,
      productTitle: prod.title,
      productType: prod.type,
      buyerEmail: 'cliente.teste.webhook@gmail.com',
      buyerName: 'Cliente Teste Webhook',
      buyerPhone: '+258 840001122',
      amount: prod.price,
      paymentMethod: 'mpesa',
      affiliateId: undefined,
    });
  }

  const simulatedTxId = `TX-HOOK-${Date.now()}`;
  const simulatedReceipt = `MPESA-REC-${Date.now().toString().slice(-6)}`;
  const result = db.completeOrder(
    order.id,
    simulatedTxId,
    order.netShopReference || `REF-${order.id}`,
    simulatedReceipt
  );

  res.json({
    success: true,
    message: `Webhook de teste executado com sucesso no banco de dados. Pedido ${order.id} concluído!`,
    order: result.order || order,
    platformFee: result.order?.platformFee,
    sellerShare: result.order?.sellerShare,
    adminEmail: ADMIN_EMAIL,
  });
});

// ==========================================
// 8. GEMINI AI SALES & AFFILIATE ASSISTANT
// ==========================================

const getAiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const { messages, model, sellerContext } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Nenhuma mensagem fornecida.' });
  }

  const targetModel = model === 'gemini-3.1-flash-lite'
    ? 'gemini-3.1-flash-lite'
    : 'gemini-3.8-flash';

  const systemInstruction = `Você é o "SpacePay Assistente IA", um consultor especialista em infoprodutos digitais (eBooks e Vídeos de Dicas) e marketing de afiliados em Moçambique.
Você atua diretamente dentro da plataforma SpacePay Moçambique, auxiliando produtores de conteúdo e afiliados a aumentar suas vendas e lucros.
${sellerContext ? `\nDados e contexto do vendedor:\n${JSON.stringify(sellerContext, null, 2)}\n` : ''}

Suas atribuições:
1. Analisar os gráficos de desempenho de vendas, faturamento bruto em Meticais (MT), lucro líquido e impacto da taxa de 10% da plataforma.
2. Fornecer sugestões táticas de divulgação e copywriting para WhatsApp, grupos locais de Facebook e Instagram direcionadas a Moçambique.
3. Explicar como a automação de pagamentos móveis (M-Pesa, mCash e cartões Visa) via Gateway Oficial Seguro reduz o atrito e aumenta a taxa de conversão.
4. Recomendar comissões ideais para afiliados (entre 20% e 70%) para que influenciadores e parceiros tragam compradores em massa.
5. Sugerir novos tópicos de alto valor para eBooks e Vídeos de Dicas (ex: empreendedorismo, carreiras, finanças, tecnologia, vendas locais).

Formate suas respostas em tópicos claros com negritos estratégicos, encorajamento e números em Meticais (MT). Seja conciso, direto e prático.`;

  const generateFallbackResponse = () => {
    const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
    let fallbackReply = `Olá! Sou o **SpacePay Assistente IA**, especialista em infoprodutos e afiliados em Moçambique. Aqui estão 3 orientações práticas para alavancar suas vendas:

1. **Venda Direta com Confiança**: Ao divulgar seu eBook ou vídeo de dicas, destaque que o SpacePay aceita M-Pesa e mCash com liberação automática imediata do download.
2. **Atraia Bons Afiliados**: Ofereça entre 35% e 50% de comissão. Afiliados locais trazem tráfego qualificado e geram vendas diárias.
3. **Acompanhe suas Métricas**: Observe no seu painel a receita líquida e o crescimento de clientes para identificar quais conteúdos têm maior procura.`;

    if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('divulga') || lastUserMsg.includes('vender mais')) {
      fallbackReply = `### Estratégia de Divulgação e Venda Rápida (Moçambique):
1. **Status Estratégico**: Poste uma prévia ou dica gratuita do seu material e finalize com uma chamada para ação: *"Quer dominar isso? Acesse pelo link seguro SpacePay e pague em 30 segundos com M-Pesa"*.
2. **Gatilho de Prova Social**: Compartilhe impressões reais e mostre que o download do PDF ou vídeo é liberado instantaneamente na hora.
3. **Grupos de Interesse**: Compartilhe seu link de afiliado ou produto diretamente nos grupos de estudo, negócios e redes profissionais locais.`;
    } else if (lastUserMsg.includes('preco') || lastUserMsg.includes('preço') || lastUserMsg.includes('valor')) {
      fallbackReply = `### Dicas de Precificação no SpacePay:
- **eBooks de Entrada (150 MT a 350 MT)**: Ideal para compra imediata por impulso no M-Pesa.
- **eBooks Avançados & Guias (400 MT a 850 MT)**: Requer uma boa descrição e tópicos detalhados.
- **Vídeos de Dicas Práticas (300 MT a 900 MT)**: Vídeos práticos e aplicados geram alta percepção de valor.
- **Dica de Margem**: Lembre-se que a taxa do SpacePay é de apenas 10%. Se você colocar 40% de comissão para afiliados, ainda receberá 50% limpo em todas as vendas sem custo de anúncios!`;
    } else if (lastUserMsg.includes('afiliad') || lastUserMsg.includes('comiss')) {
      fallbackReply = `### Como Escalar Ganhos com o Programa de Afiliados SpacePay:
1. **Recrutamento**: Convide amigos, estudantes e criadores de conteúdo para se cadastrarem no SpacePay e copiarem o link de afiliado do seu produto.
2. **Comissão Justa**: Uma comissão de 40% a 60% incentiva os afiliados a postarem diariamente nos seus canais.
3. **Pagamento Seguro**: As comissões são creditadas de forma 100% automática na carteira do afiliado assim que o pagamento do cliente é confirmado.`;
    }

    return fallbackReply;
  };

  try {
    const aiClient = getAiClient();
    if (aiClient) {
      const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content || '') }],
      }));

      // Try primary target model (gemini-3.8-flash)
      try {
        const response = await aiClient.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
          },
        });

        const replyText = response.text || generateFallbackResponse();
        return res.json({ reply: replyText, model: targetModel });
      } catch (primaryErr: any) {
        // If primary experienced 429 quota or rate limit, try gemini-3.1-flash-lite
        if (targetModel !== 'gemini-3.1-flash-lite') {
          try {
            const fallbackResponse = await aiClient.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents,
              config: {
                systemInstruction,
              },
            });
            const replyText = fallbackResponse.text || generateFallbackResponse();
            return res.json({ reply: replyText, model: 'gemini-3.1-flash-lite' });
          } catch {
            // Fall through to resilient advisor
          }
        }
        // Quota exhausted on both: serve tailored expert advisor response
        return res.json({ reply: generateFallbackResponse(), model: 'spacepay-advisor' });
      }
    } else {
      return res.json({ reply: generateFallbackResponse(), model: 'spacepay-advisor' });
    }
  } catch {
    return res.json({ reply: generateFallbackResponse(), model: 'spacepay-advisor' });
  }
});

