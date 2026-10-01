import React from 'react';
import { Product } from '../types/index.ts';
import { BookOpen, Video, Share2, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onBecomeAffiliate?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onBuyNow,
  onBecomeAffiliate,
}) => {
  const { user } = useAuth();

  const defaultCover = product.type === 'video'
    ? '/src/assets/images/product_video_financas_1790278058234.jpg'
    : '/src/assets/images/product_ebook_cv_1790278048991.jpg';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/40 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Visual Slot */}
        <div
          onClick={() => onSelect(product)}
          className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
        >
          <img
            src={product.coverUrl || defaultCover}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback styling if image fails
              const target = e.currentTarget;
              target.src = defaultCover;
            }}
          />
          {/* Fallback container */}
          <div
            style={{ display: 'none' }}
            className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 text-center text-slate-500"
          >
            {product.type === 'ebook' ? (
              <BookOpen className="w-8 h-8 text-emerald-600 mb-2" />
            ) : (
              <Video className="w-8 h-8 text-emerald-600 mb-2" />
            )}
            <span className="text-xs font-semibold">{product.title}</span>
          </div>

          {/* Clean Type Marker */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-sm flex items-center gap-1.5">
            {product.type === 'ebook' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>eBook</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vídeo de Dicas</span>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          {/* Unboxed metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{product.sellerName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.salesCount} vendas</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Pricing & Actions */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Preço</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {product.price.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-700 font-semibold">MT</span>
            </span>
          </div>

          {product.allowAffiliates && product.affiliateCommission > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Comissão Afiliado</span>
              <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                +{product.affiliateCommission.toLocaleString('pt-MZ')} MT / venda
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onBuyNow(product)}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer text-center shadow-sm whitespace-nowrap"
          >
            Comprar Agora
          </button>

          {product.allowAffiliates && (
            <button
              onClick={() => onBecomeAffiliate ? onBecomeAffiliate(product) : onSelect(product)}
              className="w-full py-2 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              Ser Afiliado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
