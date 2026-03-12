import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Order } from "@shared/schema";

const statusColors: Record<string, string> = { pending: "bg-amber-500/10 text-amber-400 border-amber-500/20", confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20", shipped: "bg-violet-500/10 text-violet-400 border-violet-500/20", delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", cancelled: "bg-red-500/10 text-red-400 border-red-500/20" };
const statusLabels: Record<string, string> = { pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", shipped: "จัดส่งแล้ว", delivered: "สำเร็จ", cancelled: "ยกเลิก" };
const allStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => { const r = await apiRequest("PUT", `/api/orders/${id}`, { status }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); toast({ title: "อัปเดตสถานะสำเร็จ" }); },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">คำสั่งซื้อ</h1>
          <p className="text-sm text-white/50">{orders.length} รายการ</p>
        </div>

        <div className="space-y-3">
          {orders.map(order => {
            const expanded = expandedId === order.id;
            const items = (order.items as any[]) || [];
            return (
              <div key={order.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-teal-500/20 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : order.id)} data-testid={`order-row-${order.id}`}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-teal-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-teal-400">#{String(order.id).padStart(4, "0")}</span>
                        <span className="text-sm text-white/80">{order.customerName}</span>
                      </div>
                      <p className="text-xs text-white/40">{order.customerEmail} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString("th-TH") : ""}</p>
                    </div>
                    <span className="font-bold text-teal-400">฿{order.total.toLocaleString()}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <Select value={order.status} onValueChange={(v) => updateMut.mutate({ id: order.id, status: v })}>
                      <SelectTrigger data-testid={`order-status-${order.id}`} className="w-[130px] h-8 text-xs bg-white/[0.04] border-white/[0.06]" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-2">สินค้าในออเดอร์</p>
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="text-white/70">{item.name} × {item.qty}</span>
                            <span className="font-medium text-white/80">฿{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {order.shippingAddress && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <MapPin className="w-4 h-4 text-teal-400/60 mt-0.5 shrink-0" />
                          <p className="text-sm text-white/60">{order.shippingAddress}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
