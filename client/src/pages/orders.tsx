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

const statusColors: Record<string, string> = { pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20", shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20", delivered: "bg-green-500/10 text-green-500 border-green-500/20", cancelled: "bg-red-500/10 text-red-500 border-red-500/20" };
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
          <h1 className="text-xl font-bold">คำสั่งซื้อ</h1>
          <p className="text-sm text-muted-foreground">{orders.length} รายการ</p>
        </div>

        <div className="space-y-3">
          {orders.map(order => {
            const expanded = expandedId === order.id;
            const items = (order.items as any[]) || [];
            return (
              <Card key={order.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : order.id)} data-testid={`order-row-${order.id}`}>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">#{String(order.id).padStart(4, "0")}</span>
                        <span className="text-sm">{order.customerName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.customerEmail} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString("th-TH") : ""}</p>
                    </div>
                    <span className="font-bold text-primary">฿{order.total.toLocaleString()}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <Select value={order.status} onValueChange={(v) => updateMut.mutate({ id: order.id, status: v })}>
                      <SelectTrigger data-testid={`order-status-${order.id}`} className="w-[130px] h-8 text-xs" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">สินค้าในออเดอร์</p>
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                            <span>{item.name} × {item.qty}</span>
                            <span className="font-medium">฿{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {order.shippingAddress && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm">{order.shippingAddress}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
