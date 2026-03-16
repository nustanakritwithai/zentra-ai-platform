import { useState, useEffect, useCallback } from "react";
import { Star, ShoppingCart, Truck, Shield, Headphones, ChevronLeft, ChevronRight, Sparkles, Package, Facebook, Instagram, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

// Common props passed to all blocks
interface BlockCommonProps {
  store: any;
  currency: string;
  products: any[];
  categories: any[];
  addToCart: (product: any) => void;
  sectionProps: Record<string, any>;
}

function formatPrice(price: number, currency: string) {
  if (currency === "THB") return `฿${price.toLocaleString("th-TH")}`;
  if (currency === "USD") return `$${price.toLocaleString("en-US")}`;
  if (currency === "EUR") return `€${price.toLocaleString("en-US")}`;
  if (currency === "JPY") return `¥${price.toLocaleString("ja-JP")}`;
  return `${price}`;
}

function RatingStars({ rating = 4.8 }: { rating?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < full ? "fill-amber-400 text-amber-400" : i === full && hasHalf ? "fill-amber-400/50 text-amber-400" : "text-white/10"}`}
        />
      ))}
      <span className="text-[10px] text-white/40 ml-1">{rating}</span>
    </div>
  );
}

// ============= HERO BLOCK =============
export function HeroBlock({ store, sectionProps }: BlockCommonProps) {
  const { slides = [], autoPlay = true, interval = 5000 } = sectionProps;
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (slides.length || 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + (slides.length || 1)) % (slides.length || 1));
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length, next]);

  if (!slides.length) return null;

  const slide = slides[current];
  const title = (slide.title || "").replace("{storeName}", store?.name || "");
  const subtitle = (slide.subtitle || "").replace("{storeName}", store?.name || "");

  return (
    <section className="relative w-full overflow-hidden" data-testid="hero-block">
      <div className="relative h-52 sm:h-64 md:h-72">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-[#08080f] to-cyan-900/30" />
        {slide.imageUrl && (
          <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-teal-400 uppercase mb-2">{title}</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 max-w-lg">{subtitle}</h2>
          {slide.ctaText && (
            <a
              href={slide.ctaLink || "#"}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/20"
            >
              {slide.ctaText}
            </a>
          )}
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-teal-400 w-6" : "bg-white/15 hover:bg-white/25"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============= CATEGORY STRIP BLOCK =============
export function CategoryStripBlock({ categories, sectionProps }: BlockCommonProps) {
  const { displayMode = "pills" } = sectionProps;
  const [active, setActive] = useState<string | null>(null);

  if (!categories.length) return null;

  return (
    <section className="px-4 py-4" data-testid="category-strip-block">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActive(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
            active === null
              ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
              : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
          } ${displayMode === "circles" ? "rounded-2xl px-3 py-3" : ""}`}
        >
          ทั้งหมด
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.slug)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              active === cat.slug
                ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
                : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
            } ${displayMode === "circles" ? "rounded-2xl px-3 py-3" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}

// ============= PRODUCT GRID BLOCK =============
export function ProductGridBlock({ products, currency, addToCart, sectionProps }: BlockCommonProps) {
  const {
    title = "สินค้าแนะนำ",
    columns = 2,
    source = "all",
    maxItems = 8,
    showRating = true,
    showBadge = true,
  } = sectionProps;

  let filteredProducts = [...products];
  if (source === "newest") {
    filteredProducts.sort((a, b) => (b.id || 0) - (a.id || 0));
  } else if (source === "bestSelling") {
    filteredProducts.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }
  filteredProducts = filteredProducts.slice(0, maxItems);

  const colClass = columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2";

  return (
    <section className="px-4 py-4" data-testid="product-grid-block">
      {title && (
        <h3 className="text-base font-bold text-white/80 mb-4">{title}</h3>
      )}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-white/10 mx-auto mb-2" />
          <p className="text-sm text-white/30">ยังไม่มีสินค้า</p>
        </div>
      ) : (
        <div className={`grid ${colClass} gap-3`}>
          {filteredProducts.map((product: any, idx: number) => (
            <div
              key={product.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden group hover:border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300"
            >
              <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Package className="w-10 h-10" />
                  </div>
                )}
                {showBadge && idx === 0 && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] border-0 px-2">
                    HOT
                  </Badge>
                )}
                {showBadge && idx === 1 && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] border-0 px-2">
                    NEW
                  </Badge>
                )}
                {product.comparePrice && product.comparePrice > product.price && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] border-0">
                    -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                  </Badge>
                )}
                {/* + button overlay */}
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-teal-500/30 disabled:opacity-30"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-xs sm:text-sm line-clamp-2 min-h-[2rem] text-white/80">
                  {product.name}
                </h4>
                {showRating && <RatingStars rating={4.5 + Math.random() * 0.5} />}
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-bold text-sm text-teal-400">{formatPrice(product.price, currency)}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-[10px] text-white/30 line-through">
                      {formatPrice(product.comparePrice, currency)}
                    </span>
                  )}
                </div>
                <button
                  data-testid={`grid-add-${product.id}`}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`w-full mt-2 text-xs py-2 rounded-lg font-medium transition-all ${
                    product.stock > 0
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20"
                      : "bg-white/[0.06] text-white/30 cursor-not-allowed"
                  }`}
                >
                  {product.stock > 0 ? "เพิ่มในตะกร้า" : "สินค้าหมด"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============= BENEFIT BAR BLOCK =============
const iconMap: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  headphones: Headphones,
};

export function BenefitBarBlock({ sectionProps }: BlockCommonProps) {
  const { items = [] } = sectionProps;

  if (!items.length) return null;

  return (
    <section className="px-4 py-6" data-testid="benefit-bar-block">
      <div className="grid grid-cols-3 gap-3">
        {items.map((item: any, i: number) => {
          const Icon = iconMap[item.icon] || Shield;
          return (
            <div key={i} className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <div className="w-8 h-8 mx-auto rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-xs font-medium text-white/70">{item.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============= FOOTER BLOCK =============
export function FooterBlock({ store, sectionProps }: BlockCommonProps) {
  const { showSocial = true, showLinks = true, links = [], socialLinks = {} } = sectionProps;

  return (
    <footer className="border-t border-white/[0.06] mt-4" data-testid="footer-block">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {showLinks && links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {links.map((link: any, i: number) => (
              <a key={i} href={link.href || "#"} className="text-xs text-white/30 hover:text-teal-400 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        )}

        {showSocial && (
          <div className="flex justify-center gap-3">
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Facebook className="w-3.5 h-3.5 text-white/40" />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Instagram className="w-3.5 h-3.5 text-white/40" />
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Youtube className="w-3.5 h-3.5 text-white/40" />
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; 2026 {store?.name || "Store"} — Powered by ZENTRA AI</span>
          <PerplexityAttribution />
        </div>
      </div>
    </footer>
  );
}

// ============= AI RECOMMENDATION BLOCK =============
export function AiRecommendationBlock({ products, currency, addToCart, sectionProps }: BlockCommonProps) {
  const { title = "แนะนำสำหรับคุณ", source = "newest", maxItems = 6 } = sectionProps;

  let items = [...products];
  if (source === "newest") {
    items.sort((a, b) => (b.id || 0) - (a.id || 0));
  }
  items = items.slice(0, maxItems);

  if (!items.length) return null;

  return (
    <section className="px-4 py-4" data-testid="ai-recommendation-block">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <h3 className="text-base font-bold text-white/80">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((product: any) => (
          <div
            key={product.id}
            className="shrink-0 w-36 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden group hover:border-teal-500/20 transition-all"
          >
            <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-2">
              <h4 className="text-xs font-medium line-clamp-1 text-white/70">{product.name}</h4>
              <p className="text-xs font-bold text-teal-400 mt-1">{formatPrice(product.price, currency)}</p>
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="w-full mt-1.5 text-[10px] py-1.5 rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium disabled:opacity-30"
              >
                เพิ่มในตะกร้า
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
