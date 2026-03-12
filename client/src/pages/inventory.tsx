import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle, TrendingDown, TrendingUp, ArrowUpDown, BarChart3, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Product, StockLog } from "@shared/schema";

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "logs" | "low">("stock");
  const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState("adjustment");
  const [adjustReason, setAdjustReason] = useState("");
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: logs = [] } = useQuery<StockLog[]>({ queryKey: ["/api/stock-logs"] });

  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5) && p.status === "active");

  const adjustMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/stock-logs", {
        productId: adjustProduct,
        type: adjustType,
        quantity: parseInt(adjustQty),
        reason: adjustReason || undefined,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-logs"] });
      setAdjustProduct(null);
      setAdjustQty("");
      setAdjustReason("");
      toast({ title: "ปรับสต็อกสำเร็จ" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">คลังสินค้า</h1>
            <p className="text-sm text-white/50">จัดการสต็อก ตรวจนับ และปรับปรุงสินค้า</p>
          </div>
          {lowStockProducts.length > 0 && (
            <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-400 border-red-500/20">
              <AlertTriangle className="w-3 h-3" /> {lowStockProducts.length} สินค้าใกล้หมด
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "stock" as const, label: "สต็อกทั้งหมด", icon: Package },
            { key: "low" as const, label: "ใกล้หมด", icon: AlertTriangle },
            { key: "logs" as const, label: "ประวัติ", icon: ClipboardList },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all", tab === t.key ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/[0.02] text-white/40 border border-white/[0.06] hover:bg-white/[0.04]")}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Stock Table */}
        {(tab === "stock" || tab === "low") && (
          <div className="space-y-2">
            {(tab === "low" ? lowStockProducts : products.filter(p => p.status === "active")).map(product => (
              <Card key={product.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-amber-500/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden">
                      {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{product.name}</p>
                      <p className="text-xs text-white/40">{product.sku || "-"} | {product.category || "-"}</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-lg font-bold", product.stock <= (product.lowStockThreshold || 5) ? "text-red-400" : "text-emerald-400")}>{product.stock}</p>
                      <p className="text-[10px] text-white/30">คงเหลือ</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/40">{product.lowStockThreshold || 5}</p>
                      <p className="text-[10px] text-white/30">ขั้นต่ำ</p>
                    </div>
                    {adjustProduct === product.id ? (
                      <div className="flex items-center gap-2">
                        <Input data-testid={`adjust-qty-${product.id}`} value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="จำนวน" type="number" className="w-20 h-8 bg-white/[0.03] border-white/[0.08] text-sm" />
                        <Select value={adjustType} onValueChange={setAdjustType}>
                          <SelectTrigger className="w-28 h-8 bg-white/[0.03] border-white/[0.08] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adjustment">ตั้งค่าใหม่</SelectItem>
                            <SelectItem value="add">เพิ่ม</SelectItem>
                            <SelectItem value="subtract">ลด</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button data-testid={`save-adjust-${product.id}`} onClick={() => adjustMut.mutate()} disabled={!adjustQty} className="h-8 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">บันทึก</Button>
                        <Button variant="ghost" onClick={() => setAdjustProduct(null)} className="h-8 text-xs text-white/40">ยกเลิก</Button>
                      </div>
                    ) : (
                      <Button data-testid={`adjust-btn-${product.id}`} onClick={() => setAdjustProduct(product.id)} variant="ghost" className="text-xs text-white/40 hover:text-amber-300">
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Logs */}
        {tab === "logs" && (
          <div className="space-y-2">
            {logs.length === 0 && (
              <div className="py-16 text-center">
                <ClipboardList className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">ยังไม่มีประวัติการปรับสต็อก</p>
              </div>
            )}
            {logs.map(log => (
              <Card key={log.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", log.quantity > 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                    {log.quantity > 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/70">สินค้า #{log.productId} — {log.type}</p>
                    {log.reason && <p className="text-xs text-white/40">{log.reason}</p>}
                  </div>
                  <span className={cn("text-sm font-bold", log.quantity > 0 ? "text-emerald-400" : "text-red-400")}>{log.quantity > 0 ? "+" : ""}{log.quantity}</span>
                  <span className="text-[10px] text-white/30">{log.createdAt ? new Date(log.createdAt).toLocaleString("th-TH") : ""}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
