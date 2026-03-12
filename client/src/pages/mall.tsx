import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { SEOHead } from "@/components/seo-head";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Store, Star, ArrowLeft, Filter, Sparkles, ChevronRight, TrendingUp } from "lucide-react";

interface MallProduct {
  id: number;
  name: string;
  price: number;
  comparePrice?: number;
  image?: string;
  category?: string;
  storeId: number;
  description?: string;
  stock: number;
}

interface MallStore {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

interface MallCategory {
  name: string;
  count: number;
}

export default function MallPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

  const { data: productsRes } = useQuery<{ products: MallProduct[]; total: number }>({
    queryKey: ["/api/public/mall/products", selectedCat, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCat !== "all") params.set("category", selectedCat);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "48");
      const res = await fetch(`${API_BASE}/api/public/mall/products?${params}`);
      return res.json();
    },
  });

  const { data: stores = [] } = useQuery<MallStore[]>({
    queryKey: ["/api/public/mall/stores"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/public/mall/stores`);
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<MallCategory[]>({
    queryKey: ["/api/public/mall/categories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/public/mall/categories`);
      return res.json();
    },
  });

  const products = productsRes?.products || [];
  const storeMap = new Map(stores.map(s => [s.id, s]));

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ZENTRA AI Shopping Mall",
    "description": "ศูนย์รวมร้านค้าออนไลน์ AI ที่ทันสมัยที่สุด ค้นหาสินค้าจากหลายร้านในที่เดียว",
    "url": window.location.href,
    "creator": { "@type": "SoftwareApplication", "name": "Perplexity Computer", "url": "https://www.perplexity.ai/computer" },
    "numberOfItems": productsRes?.total || 0,
    "itemListElement": products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": p.name,
        "description": p.description || "",
        "image": p.image || "",
        "offers": {
          "@type": "Offer",
          "price": p.price,
          "priceCurrency": "THB",
          "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#08080f]">
      <SEOHead
        title="ZENTRA Mall — ช้อปปิ้งออนไลน์ AI Shopping"
        description="รวมร้านค้าออนไลน์ชั้นนำ สินค้าคุณภาพสูง แนะนำโดย AI ช้อปอย่างฉลาดกับ ZENTRA Mall"
        type="website"
        products={productsRes?.products?.map((p: any) => ({
          name: p.name, price: p.price, image: p.image, description: p.description, category: p.category, availability: p.stock > 0 ? "InStock" : "OutOfStock"
        }))}
      />
      {/* SEO Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.08] via-transparent to-red-500/[0.05]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/[0.04] rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <button className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
              </button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                ZENTRA Shopping Mall
              </h1>
              <p className="text-xs text-white/40">ศูนย์รวมร้านค้า AI ทั้งหมด</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              data-testid="mall-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="pl-10 bg-white/[0.04] border-white/[0.08] h-11 text-white placeholder:text-white/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">
                ล้าง
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              data-testid="mall-cat-all"
              onClick={() => setSelectedCat("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat === "all" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"}`}
            >
              ทั้งหมด ({productsRes?.total || 0})
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                data-testid={`mall-cat-${cat.name}`}
                onClick={() => setSelectedCat(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat === cat.name ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stores Banner */}
      {stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
            <Store className="w-4 h-4" /> ร้านค้าที่เข้าร่วม
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {stores.map(store => (
              <Link key={store.id} href={`/shop/${store.slug}`}>
                <div
                  data-testid={`mall-store-${store.slug}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer min-w-[200px] group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center shrink-0 text-orange-400 font-bold text-sm">
                    {store.logo ? <img src={store.logo} className="w-full h-full rounded-lg object-cover" /> : store.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{store.name}</p>
                    <p className="text-[10px] text-white/30 truncate">{store.description || "ร้านค้า ZENTRA AI"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/40">
            {products.length > 0 ? `${productsRes?.total || 0} สินค้า` : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg">ยังไม่มีสินค้าในตลาด</p>
            <p className="text-white/20 text-sm mt-1">รอร้านค้าเพิ่มสินค้า หรือลองค้นหาคำอื่น</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map(product => {
              const store = storeMap.get(product.storeId);
              const hasDiscount = product.comparePrice && product.comparePrice > product.price;
              const discountPct = hasDiscount ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;

              return (
                <Link key={product.id} href={store ? `/shop/${store.slug}` : "#"}>
                  <div
                    data-testid={`mall-product-${product.id}`}
                    className="group bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.04] hover:border-orange-500/20 transition-all cursor-pointer"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="w-8 h-8 text-white/10" />
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">
                          -{discountPct}%
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white/60 text-xs font-medium">สินค้าหมด</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs text-white/70 truncate font-medium">{product.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-orange-400">฿{product.price.toLocaleString()}</span>
                        {hasDiscount && (
                          <span className="text-[10px] text-white/30 line-through">฿{product.comparePrice!.toLocaleString()}</span>
                        )}
                      </div>
                      {store && (
                        <p className="text-[10px] text-white/25 mt-1 truncate">{store.name}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center">
        <p className="text-xs text-white/20 mb-2">ZENTRA AI Shopping Mall — ศูนย์รวมร้านค้า AI ที่ทันสมัยที่สุด</p>
        <PerplexityAttribution />
      </footer>
    </div>
  );
}
