/**
 * Generates a valid standard PDF (PDF-1.4) document for SpacePay eBooks and digital materials.
 * Works natively in Node.js without requiring third-party native binaries or heavy headless browsers.
 */

export interface PDFProductData {
  title: string;
  type: string;
  sellerName?: string;
  sellerEmail?: string;
  price?: number;
  previewDicas?: string[];
  tableOfContents?: { title: string; pagesOrDuration: string }[];
  description?: string;
  contentSample?: string;
  orderId?: string;
  buyerName?: string;
}

function escapePDFText(text: string): string {
  // Normalize and replace characters not in standard PDF WinAnsi / Latin1
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics for clean PDF text stream
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateProductPDF(data: PDFProductData): Buffer {
  const title = escapePDFText(data.title || 'Material Digital SpacePay');
  const seller = escapePDFText(data.sellerName || 'SpacePay Editorial');
  const typeLabel = data.type === 'video' ? 'GUIA DE DICAS & CONTEUDO EM VIDEO' : 'EBOOK DIGITAL OFICIAL';
  const desc = escapePDFText(data.description || '');
  const sample = escapePDFText(data.contentSample || 'Material liberado para download e consumo do usuario.');
  const buyer = data.buyerName ? escapePDFText(data.buyerName) : 'Cliente SpacePay';
  const orderRef = data.orderId ? escapePDFText(data.orderId) : `LIC-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('pt-MZ');

  // Build PDF text stream lines
  const lines: string[] = [];

  // Background decoration / header rectangle
  // SpacePay emerald green header [0.02, 0.59, 0.41]
  lines.push('q');
  lines.push('0.02 0.59 0.41 rg'); // fill color
  lines.push('0 750 595 92 re'); // x y w h
  lines.push('f');
  lines.push('Q');

  // Header Title
  lines.push('BT');
  lines.push('/F2 18 Tf'); // Helvetica-Bold 18
  lines.push('1 1 1 rg'); // white text
  lines.push('40 805 Td');
  lines.push('(SPACEPAY DIGITAL - MOCAMBIQUE) Tj');
  lines.push('ET');

  // Header Subtitle
  lines.push('BT');
  lines.push('/F1 10 Tf');
  lines.push('1 1 1 rg');
  lines.push('40 785 Td');
  lines.push(`(${escapePDFText('Plataforma Oficial de eBooks & Videos de Dicas')}) Tj`);
  lines.push('ET');

  // Product Type Tag
  lines.push('BT');
  lines.push('/F2 9 Tf');
  lines.push('0.02 0.59 0.41 rg');
  lines.push('40 715 Td');
  lines.push(`(${typeLabel}) Tj`);
  lines.push('ET');

  // Main Title
  lines.push('BT');
  lines.push('/F2 16 Tf');
  lines.push('0.1 0.1 0.1 rg');
  lines.push('40 688 Td');
  lines.push(`(${title.slice(0, 55)}) Tj`);
  if (title.length > 55) {
    lines.push('0 -22 Td');
    lines.push(`(${title.slice(55, 110)}) Tj`);
  }
  lines.push('ET');

  // License badge box
  lines.push('q');
  lines.push('0.95 0.96 0.98 rg');
  lines.push('40 600 515 55 re');
  lines.push('f');
  lines.push('0.85 0.88 0.92 RG');
  lines.push('1 w');
  lines.push('40 600 515 55 re');
  lines.push('S');
  lines.push('Q');

  lines.push('BT');
  lines.push('/F2 9 Tf');
  lines.push('0.2 0.25 0.35 rg');
  lines.push('52 638 Td');
  lines.push(`(LICENCIAMENTO DIGITAL: ${buyer} | PEDIDO: ${orderRef}) Tj`);
  lines.push('/F1 8 Tf');
  lines.push('0.4 0.45 0.55 rg');
  lines.push('0 -14 Td');
  lines.push(`(Autor/Criador: ${seller} | Emissao: ${dateStr} | Pagamento Confirmado via NetShop) Tj`);
  lines.push('ET');

  // Section: Descricao
  lines.push('BT');
  lines.push('/F2 12 Tf');
  lines.push('0.1 0.15 0.2 rg');
  lines.push('40 565 Td');
  lines.push('(1. VISAO GERAL DO CONTEUDO) Tj');
  lines.push('ET');

  lines.push('BT');
  lines.push('/F1 10 Tf');
  lines.push('0.25 0.3 0.35 rg');
  lines.push('40 545 Td');
  const shortDesc = desc.slice(0, 95);
  lines.push(`(${shortDesc}) Tj`);
  if (desc.length > 95) {
    lines.push('0 -15 Td');
    lines.push(`(${desc.slice(95, 190)}) Tj`);
  }
  lines.push('ET');

  // Section: Dicas & Destaques
  lines.push('BT');
  lines.push('/F2 12 Tf');
  lines.push('0.1 0.15 0.2 rg');
  lines.push('40 485 Td');
  lines.push('(2. TOPICOS E DICAS PRINCIPAIS DESTE MATERIAL) Tj');
  lines.push('ET');

  let currentY = 460;
  const dicas = (data.previewDicas && data.previewDicas.length > 0)
    ? data.previewDicas
    : [
        'Metodologia passo a passo validada para aplicacao imediata',
        'Modelos praticos e estruturas diretas para obter resultados',
        'Evitando os principais erros cometidos no mercado atual',
        'Checklist final de execucao e acompanhamento continuo'
      ];

  dicas.slice(0, 4).forEach((dica, idx) => {
    lines.push('BT');
    lines.push('/F2 9 Tf');
    lines.push('0.02 0.59 0.41 rg');
    lines.push(`40 ${currentY} Td`);
    lines.push(`([DICA ${idx + 1}]) Tj`);
    lines.push('/F1 9 Tf');
    lines.push('0.2 0.25 0.3 rg');
    lines.push('50 0 Td');
    lines.push(`(${escapePDFText(dica.slice(0, 80))}) Tj`);
    lines.push('ET');
    currentY -= 20;
  });

  // Section: Capitulos / Sumario
  if (data.tableOfContents && data.tableOfContents.length > 0) {
    currentY -= 10;
    lines.push('BT');
    lines.push('/F2 12 Tf');
    lines.push('0.1 0.15 0.2 rg');
    lines.push(`40 ${currentY} Td`);
    lines.push('(3. ESTRUTURA DO MATERIAL) Tj');
    lines.push('ET');
    currentY -= 20;

    data.tableOfContents.slice(0, 4).forEach((item) => {
      lines.push('BT');
      lines.push('/F1 9 Tf');
      lines.push('0.3 0.35 0.4 rg');
      lines.push(`40 ${currentY} Td`);
      lines.push(`(- ${escapePDFText(item.title.slice(0, 60))} [${escapePDFText(item.pagesOrDuration)}]) Tj`);
      lines.push('ET');
      currentY -= 16;
    });
  }

  // Section: Texto Principal / Guia
  currentY -= 10;
  lines.push('BT');
  lines.push('/F2 12 Tf');
  lines.push('0.1 0.15 0.2 rg');
  lines.push(`40 ${currentY} Td`);
  lines.push('(4. CONTEUDO E DIRETRIZES DE APLICACAO) Tj');
  lines.push('ET');
  currentY -= 20;

  lines.push('BT');
  lines.push('/F1 9 Tf');
  lines.push('0.25 0.3 0.35 rg');
  lines.push(`40 ${currentY} Td`);
  lines.push(`(${sample.slice(0, 95)}) Tj`);
  if (sample.length > 95) {
    lines.push('0 -14 Td');
    lines.push(`(${sample.slice(95, 190)}) Tj`);
  }
  if (sample.length > 190) {
    lines.push('0 -14 Td');
    lines.push(`(${sample.slice(190, 285)}) Tj`);
  }
  lines.push('ET');

  // Footer bar
  lines.push('q');
  lines.push('0.92 0.94 0.96 rg');
  lines.push('0 0 595 40 re');
  lines.push('f');
  lines.push('Q');

  lines.push('BT');
  lines.push('/F1 8 Tf');
  lines.push('0.45 0.5 0.55 rg');
  lines.push('40 18 Td');
  lines.push('(SpacePay Mocambique - Suporte WhatsApp: +258 83 537 3674 | Pagamentos M-Pesa, mCash e Visa) Tj');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  // Assemble PDF document objects
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // Object 3: Page
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj'
  );

  // Object 4: Font F1 (Helvetica)
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // Object 5: Font F2 (Helvetica-Bold)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  // Object 6: Contents stream
  objects.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);

  // Build the complete PDF string with xref table
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  objects.forEach(obj => {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += obj + '\n';
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf-8');
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  offsets.forEach(offset => {
    const pad = ('0000000000' + offset).slice(-10);
    pdf += `${pad} 00000 n \n`;
  });

  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  return Buffer.from(pdf, 'utf-8');
}
