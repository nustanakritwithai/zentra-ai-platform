import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  Store,
  X,
  Sparkles,
  ArrowRight,
  Package,
  Check,
} from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  qty: number;
}

function formatPrice(price: number, currency: string) {
  if (currency === "THB") return `฿${price.toLocaleString("th-TH")}`;
  if (currency === "USD") return `$${price.toLocaleString("en-US")}`;
  if (currency === "EUR") return `€${price.toLocaleString("en-US")}`;
  if (currency === "JPY") return `¥${price.toLocaleString("ja-JP")}`;
  return `${price}`;
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const { data: storeData, isLoading: storeLoading, error: storeError } = useQuery<{ store: any }>({
    queryKey: ["/api/public/store", slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/public/store/${slug}`);
      if (!res.ok) throw new Error("ไม่พบร้านค้า");
      return res.json();
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/public/store", slug, "products"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/public/store/${slug}/products`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!storeData,
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/public/store/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          shippingAddress,
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
        }),
      });
      if (!res.ok) throw new Error("ไม่สามารถสั่งซื้อได้");
      return res.json();
    },
    onSuccess: () => {
      setOrderSuccess(true);
      setCart([]);
      setCheckoutMode(false);
    },
  });

  const store = storeData?.store;
  const currency = store?.currency || "THB";

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }];
    });
    toast({ title: "เพิ่มในตะกร้าแล้ว", description: product.name });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="animate-pulse text-white/40">กำลังโหลดร้านค้า...</div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Card className="max-w-sm bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <Store className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white/80 mb-2">ไม่พบร้านค้า</h2>
            <p className="text-sm text-white/40">ร้านค้านี้อาจยังไม่ได้เปิดให้บริการ</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white/90 mb-2">สั่งซื้อสำเร็จ</h2>
            <p className="text-sm text-white/40 mb-4">
              ขอบคุณที่สั่งซื้อจาก {store.name} ทางร้านจะติดต่อกลับเร็วๆ นี้
            </p>
            <Button onClick={() => setOrderSuccess(false)} className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20">
              กลับหน้าร้าน
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Store Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[hsl(240,20%,4%)]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                {store.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-base text-white/90">{store.name}</span>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex bg-teal-500/10 text-teal-400 border-teal-500/20">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-teal-400" />Powered by ZENTRA AI
            </Badge>
          </div>
          <Button
            data-testid="cart-toggle"
            variant="outline"
            size="sm"
            onClick={() => setCartOpen(!cartOpen)}
            className="relative bg-white/[0.04] border-white/[0.06] text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            ตะกร้า
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-10 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white/90 relative">{store.name}</h1>
        {store.description && (
          <p className="text-white/40 mt-2 max-w-md mx-auto text-sm relative">{store.description}</p>
        )}
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/[0.06] p-4 h-72 bg-white/[0.04]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">ร้านค้ายังไม่มีสินค้า</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Card key={product.id} className="bg-white/[0.02] border-white/[0.06] rounded-2xl overflow-hidden group hover:border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300">
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
                  {product.comparePrice && product.comparePrice > product.price && (
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] border-0">
                      -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-white/80">{product.name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-bold text-teal-400">{formatPrice(product.price, currency)}</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-xs text-white/30 line-through">
                        {formatPrice(product.comparePrice, currency)}
                      </span>
                    )}
                  </div>
                  <Button
                    data-testid={`add-to-cart-${product.id}`}
                    className={`w-full mt-3 text-sm h-9 ${product.stock > 0 ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20" : "bg-white/[0.06] text-white/30"}`}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? (
                      <>
                        <ShoppingCart className="w-3 h-3 mr-1" /> เพิ่มในตะกร้า
                      </>
                    ) : (
                      "สินค้าหมด"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setCartOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-[hsl(240,15%,7%)] border-l border-white/[0.06] overflow-y-auto">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-bold text-base text-white/90">ตะกร้าสินค้า ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)}>
                <X className="w-5 h-5 text-white/30 hover:text-white/60 transition-colors" />
              </button>
            </div>

            {!checkoutMode ? (
              <>
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-white/30">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>ตะกร้าว่าง</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-white/[0.03] rounded-xl">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white/80">{item.name}</p>
                          <p className="text-sm text-teal-400 font-bold">{formatPrice(item.price, currency)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors"
                              onClick={() => updateQty(item.id, -1)}
                            >
                              <Minus className="w-3 h-3 text-white/70" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center text-white/70">{item.qty}</span>
                            <button
                              className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors"
                              onClick={() => updateQty(item.id, 1)}
                            >
                              <Plus className="w-3 h-3 text-white/70" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold shrink-0 text-white/80">{formatPrice(item.price * item.qty, currency)}</p>
                      </div>
                    ))}

                    <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                      <span className="font-bold text-white/80">รวมทั้งหมด</span>
                      <span className="text-lg font-bold text-teal-400">{formatPrice(cartTotal, currency)}</span>
                    </div>

                    <Button
                      data-testid="btn-checkout"
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20"
                      onClick={() => setCheckoutMode(true)}
                    >
                      ดำเนินการสั่งซื้อ <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 space-y-4">
                <h3 className="font-bold text-white/90">ข้อมูลการจัดส่ง</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block text-white/60">ชื่อผู้สั่งซื้อ</label>
                  <Input
                    data-testid="checkout-name"
                    placeholder="ชื่อ-นามสกุล"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-white/60">อีเมล</label>
                  <Input
                    data-testid="checkout-email"
                    type="email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-white/60">ที่อยู่จัดส่ง</label>
                  <Input
                    data-testid="checkout-address"
                    placeholder="ที่อยู่สำหรับจัดส่ง"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.06] text-white"
                  />
                </div>

                <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                  <span className="font-bold text-white/80">ยอดรวม</span>
                  <span className="text-lg font-bold text-teal-400">{formatPrice(cartTotal, currency)}</span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white/80" onClick={() => setCheckoutMode(false)}>
                    ย้อนกลับ
                  </Button>
                  <Button
                    data-testid="btn-place-order"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20"
                    disabled={!customerName || orderMutation.isPending}
                    onClick={() => orderMutation.mutate()}
                  >
                    {orderMutation.isPending ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© 2026 {store.name} — Powered by ZENTRA AI</span>
          <PerplexityAttribution />
        </div>
      </footer>

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && !cartOpen && (
        <button
          data-testid="floating-cart"
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-teal-500/30 sm:hidden"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-teal-600 text-[10px] flex items-center justify-center font-bold">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
}
