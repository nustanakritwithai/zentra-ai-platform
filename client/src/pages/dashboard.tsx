import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Bot } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

function formatTHB(n: number) {
  return "฿" + n.toLocaleString("th-TH");
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  shipped: "จัดส่งแล้ว",
  delivered: "สำเร็จ",
  cancelled: "ยกเลิก",
};

export default function DashboardPage() {
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: chart } = useQuery<any[]>({ queryKey: ["/api/dashboard/chart"] });
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/orders"] });
  const { data: agents } = useQuery<any[]>({ queryKey: ["/api/ai-agents"] });

  const kpis = [
    { label: "ยอดขายวันนี้", value: formatTHB(stats?.todayRevenue || 0), icon: DollarSign, change: "+12%", up: true },
    { label: "ยอดขายเดือนนี้", value: formatTHB(stats?.monthRevenue || 0), icon: TrendingUp, change: "+23%", up: true },
    { label: "คำสั่งซื้อใหม่", value: stats?.pendingOrders || 0, icon: ShoppingCart, change: `${stats?.totalOrders || 0} ทั้งหมด`, up: true },
    { label: "ลูกค้าทั้งหมด", value: stats?.totalCustomers || 0, icon: Users, change: `${stats?.newCustomers || 0} ใหม่`, up: true },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมร้านค้าของคุณ</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.up ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className="text-xs text-muted-foreground">{kpi.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + AI Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">รายได้ 7 วันล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart || []}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatTHB(v), "รายได้"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(187, 94%, 43%)" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI Agent Status</CardTitle>
                <Badge variant="outline" className="text-xs"><Bot className="w-3 h-3 mr-1" />6 Agents</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(agents || []).map((agent: any) => (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${agent.status === "active" ? "bg-green-500" : agent.status === "processing" ? "bg-yellow-500" : "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.performance}%</p>
                  </div>
                  <Badge variant={agent.enabled ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {agent.enabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">คำสั่งซื้อล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">ลูกค้า</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">ยอดรวม</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).slice(0, 5).map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50">
                      <td className="py-2.5 px-3 font-mono text-xs">#{String(order.id).padStart(4, "0")}</td>
                      <td className="py-2.5 px-3">{order.customerName}</td>
                      <td className="py-2.5 px-3 font-medium">{formatTHB(order.total)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
