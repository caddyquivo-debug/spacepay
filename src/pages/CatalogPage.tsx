import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductType } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import {
  BookOpen,
  Video,
  Search,
  X,
  SlidersHorizontal,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

interface CatalogPageProps {
  initialType?: ProductType;
  navigate: (route: string) => void;
}

// Predefined thematic categories mapped to keywords
const CATEGORIES = [
  { id: 'all', label: 'Todas as Categorias', icon: Layers },
  { id: 'carreira', label: 'Carreira & CV', keywords: ['cv', 'currículo', 'carreira', 'entrevista', 'recrutador', 'emprego'] },
  { id: 'financas', label: 'Finanças Pessoais', keywords: ['finanças', 'dinheiro', 'm-pesa', 'poupança', 'economia', 'meticais', 'custos'] },
  { id: 'marketing', label: 'Marketing Digital', keywords: ['marketing', 'whatsapp', 'negócio', 'anúncio', 'redes sociais', 'clientes'] },
  { id: 'vendas', label: 'Vendas & Negociação', keywords: ['vendas', 'negociação', 'objeção', 'fechamento', 'contrato', 'persuasão'] },
];

export const CatalogPage: React.FC<CatalogPageProps> = ({ initialType, navigate }) => {
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>(initialType || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'title'>('popular');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  // Load all active products once, allowing instantaneous 0ms client-side filtering and real-time response
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setAllProducts(data.products || []);
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering by search query, product type, and category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);

    return allProducts
      .filter((product) => {
        // 1. Filter by Product Type (eBook vs Video)
        if (selectedType !== 'all' && product.type !== selectedType) {
          return false;
        }

        // 2. Filter by Category
        if (activeCat && activeCat.id !== 'all' && activeCat.keywords) {
          const productText = `${product.title} ${product.description} ${(product.previewDicas || []).join(' ')}`.toLowerCase();
          const matchesCategory = activeCat.keywords.some((kw) => productText.includes(kw));
          if (!matchesCategory) {
            return false;
          }
        }

        // 3. Filter by Search Query in Real-Time (title, description, table of contents, preview dicas)
        if (query) {
          const inTitle = product.title.toLowerCase().includes(query);
          const inDesc = product.description.toLowerCase().includes(query);
          const inTips = (product.previewDicas || []).some((dica) => dica.toLowerCase().includes(query));
          const inToc = (product.tableOfContents || []).some((item) => item.title.toLowerCase().includes(query));
          const inSeller = (product.sellerName || '').toLowerCase().includes(query);

          if (!inTitle && !inDesc && !inTips && !inToc && !inSeller) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        // default: popular (salesCount)
        return (b.salesCount || 0) - (a.salesCount || 0);
      });
  }, [allProducts, searchQuery, selectedType, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSortBy('popular');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'all' || selectedCategory !== 'all' || sortBy !== 'popular';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Catálogo Oficial SpacePay · Moçambique</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {selectedType === 'ebook'
              ? 'eBooks Profissionais'
              : selectedType === 'video'
              ? 'Vídeos de Dicas Rápidas'
              : 'Todos os eBooks & Vídeos de Dicas'}
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Aprenda habilidades práticas com liberação instantânea no seu telemóvel via M-Pesa, mCash e cartões. Todos os infoprodutos são de curadoria exclusiva da plataforma.
          </p>
        </div>

        {/* Live Counter Badge */}
        {!loading && (
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              Mostrando <strong className="text-emerald-700 font-bold">{filteredProducts.length}</strong> de {allProducts.length} produtos
            </span>
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Main Search Bar Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar em tempo real por título, dicas, tema ou conteúdo..."
              className="w-full pl-10 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons (Todos, eBooks, Vídeos) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shrink-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('ebook')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                selectedType === 'ebook'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>eBooks</span>
            </button>
            <button
              onClick={() => setSelectedType('video')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                selectedType === 'video'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vídeos</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold cursor-pointer"
              >
                <option value="popular">Mais Populares</option>
                <option value="price-asc">Menor Preço (MT)</option>
                <option value="price-desc">Maior Preço (MT)</option>
                <option value="title">Título (A-Z)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Real-time Category Chips */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Categorias:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Search & Category Status Summary */}
      {searchQuery && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Filtrando em tempo real por: <strong className="font-bold">"{searchQuery}"</strong>
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-emerald-800 font-bold hover:underline cursor-pointer"
          >
            Remover filtro de texto
          </button>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Carregando catálogo de infoprodutos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Nenhum infoproduto encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Não encontramos nenhum eBook ou vídeo correspondente aos filtros selecionados
              {searchQuery && ` para "${searchQuery}"`}.
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
          >
            Ver Todos os Produtos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(p) => navigate(`/produto/${p.slug}`)}
              onBuyNow={(p) => navigate(`/checkout/${p.slug}`)}
              onBecomeAffiliate={(p) => navigate(`/produto/${p.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
