import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Receipt, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Product, Category } from "@shared/schema";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export default function PosPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const filteredProducts = products.filter(p => {
    if (p.status !== "active") return false;
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, image: product.image || undefined }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.qty + delta;
      return newQty > 0 ? { ...i, qty: newQty } : i;
    }).filter(i => i.qty > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const checkoutMut = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const r = await apiRequest("POST", "/api/pos/order", {
        items: cart.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        customerName: "Walk-in Customer",
        paymentMethod,
      });
      return r.json();
    },
    onSuccess: (data) => {
      setLastOrder(data);
      setShowReceipt(true);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "สำเร็จ", description: "บันทึกการขายเรียบร้อย" });
    },
    onError: (err: any) => {
      toast({ title: "ผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">POS</h1>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input data-testid="pos-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาสินค้า..." className="pl-9 bg-white/[0.03] border-white/[0.08] text-sm h-9" />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <button data-testid="pos-cat-all" onClick={() => setSelectedCategory("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all", selectedCategory === "all" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]")}>
              ทั้งหมด
            </button>
            {categories.map(cat => (
              <button key={cat.id} data-testid={`pos-cat-${cat.slug}`} onClick={() => setSelectedCategory(cat.name)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all", selectedCategory === cat.name ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]")}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {filteredProducts.map(product => (
              <button key={product.id} data-testid={`pos-product-${product.id}`} onClick={() => addToCart(product)} className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-left hover:bg-white/[0.05] hover:border-teal-500/20 transition-all active:scale-95">
                {product.image ? (
                  <div className="w-full aspect-square rounded-lg bg-white/[0.04] mb-2 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-2 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-white/10" />
                  </div>
                )}
                <p className="text-xs font-medium text-white/80 truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-emerald-400">฿{product.price.toLocaleString()}</span>
                  <span className="text-[10px] text-white/30">คงเหลือ {product.stock}</span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-white/30 text-sm">ไม่พบสินค้า</div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full lg:w-[380px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm text-white/80">ตะกร้า</span>
            <Badge variant="outline" className="ml-auto text-xs bg-teal-500/10 text-teal-400 border-teal-500/20">{cart.length} รายการ</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(item => (
              <div key={item.productId} data-testid={`cart-item-${item.productId}`} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{item.name}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">฿{(item.price * item.qty).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button data-testid={`cart-minus-${item.productId}`} onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                    <Minus className="w-3 h-3 text-white/60" />
                  </button>
                  <span className="text-xs font-bold text-white/80 w-6 text-center">{item.qty}</span>
                  <button data-testid={`cart-plus-${item.productId}`} onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                    <Plus className="w-3 h-3 text-white/60" />
                  </button>
                  <button data-testid={`cart-remove-${item.productId}`} onClick={() => removeFromCart(item.productId)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors">
                    <Trash2 className="w-3 h-3 text-red-400/60" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-12 text-center text-white/20 text-xs">เพิ่มสินค้าลงตะกร้า</div>
            )}
          </div>

          {/* Total & Payment */}
          <div className="p-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">รวมทั้งหมด</span>
              <span className="text-lg font-bold text-emerald-400">฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button data-testid="pay-cash" onClick={() => checkoutMut.mutate("cash")} disabled={cart.length === 0 || checkoutMut.isPending} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 h-10">
                <Banknote className="w-4 h-4 mr-1" /> เงินสด
              </Button>
              <Button data-testid="pay-promptpay" onClick={() => checkoutMut.mutate("promptpay")} disabled={cart.length === 0 || checkoutMut.isPending} className="bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 h-10">
                <QrCode className="w-4 h-4 mr-1" /> QR
              </Button>
              <Button data-testid="pay-card" onClick={() => checkoutMut.mutate("card")} disabled={cart.length === 0 || checkoutMut.isPending} className="bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 h-10">
                <CreditCard className="w-4 h-4 mr-1" /> บัตร
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(240,15%,8%)] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white/90">สำเร็จ</span>
              </div>
              <button onClick={() => setShowReceipt(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>คำสั่งซื้อ #{lastOrder.id}</span>
                <span>{new Date().toLocaleString("th-TH")}</span>
              </div>
              {(lastOrder.items as any[])?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/70">{item.name} x{item.qty}</span>
                  <span className="text-white/80">฿{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-white/[0.06] pt-2 flex justify-between font-bold">
                <span className="text-white/80">รวม</span>
                <span className="text-emerald-400">฿{lastOrder.total?.toLocaleString()}</span>
              </div>
            </div>
            <Button onClick={() => setShowReceipt(false)} className="w-full bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30">
              <Receipt className="w-4 h-4 mr-2" /> ปิด
            </Button>
          </div>
        </div>
      )}
      <PerplexityAttribution />
    </AppLayout>
  );
}
