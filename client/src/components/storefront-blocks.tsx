import { useState, useEffect, useCallback } from "react";
import {
  Star,
  ShoppingCart,
  Truck,
  Shield,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
  Facebook,
  Instagram,
  Youtube,
  Bot,
  TrendingUp,
  BarChart3,
  Eye,
  ShoppingBag,
  Zap,
  Clock,
  Award,
  Heart,
  MessageCircle,
} from "lucide-react";
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
      <span className="text-[10px] text-white/40 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ============= NAV BLOCK =============
export function NavBlock({ store, sectionProps }: BlockCommonProps) {
  const { showAiBadge = true } = sectionProps;

  return (
    <nav className="px-4 py-3 flex items-center justify-between" data-testid="nav-block">
      <div className="flex items-center gap-3">
        {store?.logo ? (
          <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-xl object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/20">
            {(store?.name || "S").charAt(0)}
          </div>
        )}
        <span className="font-bold text-sm text-white/90 tracking-wide">{store?.name || "Store"}</span>
        {showAiBadge && (
          <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-400 border-teal-500/20 hidden sm:inline-flex">
            <Sparkles className="w-2.5 h-2.5 mr-1" />AI Powered
          </Badge>
        )}
      </div>
    </nav>
  );
}

// ============= HERO BLOCK (Enhanced v2.0) =============
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
      <div className="relative h-64 sm:h-80 md:h-96">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-[#08080f] to-cyan-900/30" />
        {slide.imageUrl && (
          <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080f]/60 via-transparent to-[#08080f]/60" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs font-bold tracking-[0.25em] text-teal-400 uppercase mb-3 drop-shadow-lg">
            {title}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white max-w-xl leading-tight drop-shadow-lg">
            {subtitle}
          </h2>
          {slide.ctaText && (
            <a
              href={slide.ctaLink || "#"}
              data-testid="hero-cta"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105"
            >
              {slide.ctaText}
            </a>
          )}
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              data-testid="hero-prev"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-all border border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              data-testid="hero-next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-all border border-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 py-4">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-teal-400 w-8" : "bg-white/15 w-2 hover:bg-white/25"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============= AI STATUS BLOCK =============
const AI_AGENTS = [
  { name: "Shopping Agent", icon: ShoppingBag, color: "from-teal-400 to-emerald-500", dotColor: "bg-emerald-400" },
  { name: "Recommendation", icon: Sparkles, color: "from-violet-400 to-purple-500", dotColor: "bg-violet-400" },
  { name: "Dynamic Pricing", icon: TrendingUp, color: "from-amber-400 to-orange-500", dotColor: "bg-amber-400" },
  { name: "Customer Service", icon: Headphones, color: "from-sky-400 to-blue-500", dotColor: "bg-sky-400" },
  { name: "Inventory AI", icon: BarChart3, color: "from-indigo-400 to-violet-500", dotColor: "bg-indigo-400" },
  { name: "Visual Search", icon: Eye, color: "from-pink-400 to-rose-500", dotColor: "bg-pink-400" },
];

export function AiStatusBlock({ sectionProps }: BlockCommonProps) {
  const { title = "Multi-Agent AI Status" } = sectionProps;

  return (
    <section className="px-4 py-4" data-testid="ai-status-block">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">{title}</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Active</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {AI_AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] transition-all"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] text-white/50 text-center leading-tight font-medium">{agent.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${agent.dotColor}`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============= CATEGORY STRIP BLOCK (Enhanced) =============
export function CategoryStripBlock({ categories, sectionProps }: BlockCommonProps) {
  const { displayMode = "pills" } = sectionProps;
  const [active, setActive] = useState<string | null>(null);

  if (!categories.length) return null;

  return (
    <section className="px-4 py-4" data-testid="category-strip-block">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActive(null)}
          data-testid="cat-all"
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
            active === null
              ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
              : "bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
          } ${displayMode === "circles" ? "rounded-2xl px-3 py-3" : ""}`}
        >
          ทั้งหมด
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.slug)}
            data-testid={`cat-${cat.slug}`}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              active === cat.slug
                ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
                : "bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
            } ${displayMode === "circles" ? "rounded-2xl px-3 py-3" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}

// ============= PRODUCT GRID BLOCK (v2.0 Premium) =============
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white/80">{title}</h3>
          <span className="text-[10px] text-teal-400 font-medium">{filteredProducts.length} รายการ</span>
        </div>
      )}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
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
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/15" />
                    </div>
                  </div>
                )}
                {showBadge && idx === 0 && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] border-0 px-2 shadow-lg">
                    HOT
                  </Badge>
                )}
                {showBadge && idx === 1 && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] border-0 px-2 shadow-lg">
                    NEW
                  </Badge>
                )}
                {product.comparePrice && product.comparePrice > product.price && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] border-0 shadow-lg">
                    -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                  </Badge>
                )}
                {/* Quick add overlay */}
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-teal-500/80 disabled:opacity-30"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-xs sm:text-sm line-clamp-2 min-h-[2rem] text-white/80">
                  {product.name}
                </h4>
                {showRating && <RatingStars rating={parseFloat((4.3 + (idx % 5) * 0.15).toFixed(1))} />}
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
                  className={`w-full mt-2.5 text-xs py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    product.stock > 0
                      ? "border border-teal-500/40 text-teal-400 hover:bg-teal-500 hover:text-white hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20"
                      : "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.04]"
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

// ============= PROMO BANNER BLOCK =============
export function PromoBannerBlock({ sectionProps }: BlockCommonProps) {
  const {
    title = "โปรโมชั่นพิเศษ",
    subtitle = "รับส่วนลดสูงสุด 40% สำหรับสมาชิกใหม่",
    ctaText = "รับสิทธิ์เลย",
    gradient = "from-teal-600 via-cyan-600 to-blue-600",
  } = sectionProps;

  return (
    <section className="px-4 py-4" data-testid="promo-banner-block">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-6 sm:p-8`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">โปรพิเศษ</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/70 mb-4">{subtitle}</p>
          {ctaText && (
            <button
              data-testid="promo-cta"
              className="px-6 py-2.5 rounded-full bg-white text-teal-700 text-sm font-bold hover:bg-white/90 transition-all shadow-lg"
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============= BENEFIT BAR BLOCK (Enhanced) =============
const iconMap: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  headphones: Headphones,
  clock: Clock,
  award: Award,
  heart: Heart,
  zap: Zap,
  sparkles: Sparkles,
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
            <div
              key={i}
              className="text-center p-3 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/[0.10] transition-all"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center mb-2 border border-teal-500/10">
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-xs font-semibold text-white/70">{item.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============= TRUST REVIEWS BLOCK =============
export function TrustReviewsBlock({ sectionProps }: BlockCommonProps) {
  const {
    title = "รีวิวจากลูกค้า",
    reviews = [
      { name: "คุณสมชาย", rating: 5, text: "สินค้าดีมาก จัดส่งเร็ว!", avatar: "ส" },
      { name: "คุณวิภา", rating: 5, text: "AI แนะนำสินค้าตรงใจมาก", avatar: "ว" },
      { name: "คุณธนา", rating: 4, text: "ระบบใช้งานง่าย สะดวกมาก", avatar: "ธ" },
    ],
  } = sectionProps;

  return (
    <section className="px-4 py-4" data-testid="trust-reviews-block">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-teal-400" />
        <h3 className="text-base font-bold text-white/80">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {reviews.map((review: any, i: number) => (
          <div
            key={i}
            className="shrink-0 w-64 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.10] transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-teal-500/20">
                {review.avatar || review.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">{review.name}</p>
                <RatingStars rating={review.rating || 5} />
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============= FEATURED COLLECTION BLOCK =============
export function FeaturedCollectionBlock({ products, currency, addToCart, sectionProps }: BlockCommonProps) {
  const { title = "คอลเลกชั่นแนะนำ", source = "newest", maxItems = 6 } = sectionProps;

  let items = [...products];
  if (source === "newest") {
    items.sort((a, b) => (b.id || 0) - (a.id || 0));
  }
  items = items.slice(0, maxItems);

  if (!items.length) return null;

  return (
    <section className="px-4 py-4" data-testid="featured-collection-block">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <h3 className="text-base font-bold text-white/80">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((product: any) => (
          <div
            key={product.id}
            className="shrink-0 w-40 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden group hover:border-teal-500/20 transition-all duration-300"
          >
            <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-white/15" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge className="bg-violet-500/80 backdrop-blur-sm text-white text-[9px] border-0 px-1.5">
                  <Sparkles className="w-2 h-2 mr-0.5" />AI Pick
                </Badge>
              </div>
            </div>
            <div className="p-2.5">
              <h4 className="text-xs font-medium line-clamp-1 text-white/70">{product.name}</h4>
              <p className="text-xs font-bold text-teal-400 mt-1">{formatPrice(product.price, currency)}</p>
              <button
                data-testid={`featured-add-${product.id}`}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="w-full mt-2 text-[10px] py-2 rounded-lg border border-teal-500/30 text-teal-400 font-semibold hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-teal-400"
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

// ============= FOOTER BLOCK (Enhanced) =============
export function FooterBlock({ store, sectionProps }: BlockCommonProps) {
  const { showSocial = true, showLinks = true, links = [], socialLinks = {} } = sectionProps;

  return (
    <footer className="border-t border-white/[0.06] mt-4" data-testid="footer-block">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Store info */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-[10px]">
            {(store?.name || "S").charAt(0)}
          </div>
          <span className="text-sm font-bold text-white/70">{store?.name || "Store"}</span>
        </div>

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
          <div className="flex justify-center gap-2">
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition-all hover:border-white/[0.10]">
                <Facebook className="w-4 h-4 text-white/40" />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition-all hover:border-white/[0.10]">
                <Instagram className="w-4 h-4 text-white/40" />
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition-all hover:border-white/[0.10]">
                <Youtube className="w-4 h-4 text-white/40" />
              </a>
            )}
            {socialLinks.line && (
              <a href={socialLinks.line} className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition-all hover:border-white/[0.10]">
                <MessageCircle className="w-4 h-4 text-white/40" />
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30 pt-2 border-t border-white/[0.04]">
          <span>&copy; 2026 {store?.name || "Store"} — Powered by Agentra</span>
          <PerplexityAttribution />
        </div>
      </div>
    </footer>
  );
}
