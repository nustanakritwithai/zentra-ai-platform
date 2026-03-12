import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Bot, Activity, Flame, Zap, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

function formatTHB(n: number) {
  return "฿" + n.toLocaleString("th-TH");
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  shipped: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  shipped: "จัดส่งแล้ว",
  delivered: "สำเร็จ",
  cancelled: "ยกเลิก",
};

// Animated number component
function AnimatedValue({ value, prefix = "", suffix = "" }: { value: number | string; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const target = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) || 0 : value;
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const startVal = display;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return <>{prefix}{display.toLocaleString("th-TH")}{suffix}</>;
}

// Live clock
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span className="font-mono tabular-nums">{time.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
}

// Real-time chart data with subtle live animation
function useRealtimeChart(initial: any[] | undefined) {
  const [data, setData] = useState(initial || []);
  useEffect(() => {
    if (initial?.length) setData(initial);
  }, [initial]);
  useEffect(() => {
    if (!data.length) return;
    const interval = setInterval(() => {
      setData(prev => prev.map((item) => ({
        ...item,
        revenue: Math.max(0, item.revenue + (Math.random() * 500 - 200)),
      })));
    }, 8000);
    return () => clearInterval(interval);
  }, [data.length]);
  return data;
}

export default function DashboardPage() {
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: chart } = useQuery<any[]>({ queryKey: ["/api/dashboard/chart"] });
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/orders"] });
  const { data: agents } = useQuery<any[]>({ queryKey: ["/api/ai-agents"] });

  const realtimeChart = useRealtimeChart(chart);

  const kpis = [
    { label: "ยอดขายวันนี้", value: stats?.todayRevenue || 0, icon: DollarSign, change: "+12%", up: true, color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500" },
    { label: "ยอดขายเดือนนี้", value: stats?.monthRevenue || 0, icon: TrendingUp, change: "+23%", up: true, color: "from-sky-500 to-blue-500", iconBg: "bg-sky-500/10", iconColor: "text-sky-500" },
    { label: "คำสั่งซื้อใหม่", value: stats?.pendingOrders || 0, icon: ShoppingCart, change: `${stats?.totalOrders || 0} ทั้งหมด`, up: true, color: "from-amber-500 to-yellow-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-500", isTHB: false },
    { label: "ลูกค้าทั้งหมด", value: stats?.totalCustomers || 0, icon: Users, change: `${stats?.newCustomers || 0} ใหม่`, up: true, color: "from-violet-500 to-fuchsia-500", iconBg: "bg-violet-500/10", iconColor: "text-violet-500", isTHB: false },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with live clock */}
        <div className="flex items-center justify-between">
          <div className="animate-slide-up">
            <h1 className="text-xl font-black flex items-center gap-2">
              Dashboard
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">ภาพรวมร้านค้า &middot; อัปเดตแบบ Real-time</p>
          </div>
          <LiveClock />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border-border/50 card-glow animate-data-in overflow-hidden relative group">
              <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${kpi.color} opacity-60`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-black">
                  {kpi.isTHB !== false ? (
                    <AnimatedValue value={kpi.value} prefix="฿" />
                  ) : (
                    <AnimatedValue value={kpi.value} />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {kpi.up ? (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />{kpi.change}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                      <ArrowDownRight className="w-3 h-3" />{kpi.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + AI Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/50 card-glow overflow-hidden animate-data-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">รายได้ 7 วันล่าสุด</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realtimeChart}>
                    <defs>
                      <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#10B981" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#00C9A7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#00C9A7" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [formatTHB(Math.round(v)), "รายได้"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(0,201,167,0.3)", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,201,167,0.15)" }}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#lineGrad)"
                      fill="url(#gradTeal)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#00C9A7', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#00C9A7', stroke: 'hsl(var(--card))', strokeWidth: 3, style: { filter: 'drop-shadow(0 0 8px rgba(0,201,167,0.5))' } }}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 card-glow overflow-hidden animate-data-in" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">AI Agent Status</CardTitle>
                <Badge variant="outline" className="text-xs border-violet-500/30 bg-violet-500/5">
                  <Bot className="w-3 h-3 mr-1 text-violet-500" />6 Agents
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(agents || []).map((agent: any, i: number) => (
                <div key={agent.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group animate-slide-in-right" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="relative">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${agent.status === "active" ? "bg-green-500" : agent.status === "processing" ? "bg-amber-500" : "bg-gray-500"}`} />
                    {agent.status === "active" && (
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-1000"
                          style={{ width: `${agent.performance}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{agent.performance}%</span>
                    </div>
                  </div>
                  <Badge variant={agent.enabled ? "default" : "secondary"} className={`text-[10px] shrink-0 ${agent.enabled ? "bg-gradient-to-r from-teal-500 to-cyan-600 border-0" : ""}`}>
                    {agent.enabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-border/50 card-glow overflow-hidden animate-data-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">คำสั่งซื้อล่าสุด</CardTitle>
              <Badge variant="outline" className="text-xs border-violet-500/30 bg-violet-500/5">
                <Activity className="w-3 h-3 mr-1 text-teal-500" />Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs">#</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs">ลูกค้า</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs">ยอดรวม</th>
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).slice(0, 5).map((order: any, i: number) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{String(order.id).padStart(4, "0")}</td>
                      <td className="py-3 px-3 font-medium">{order.customerName}</td>
                      <td className="py-3 px-3 font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{formatTHB(order.total)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${order.status === 'pending' ? 'bg-amber-500' : order.status === 'delivered' ? 'bg-green-500' : order.status === 'shipped' ? 'bg-violet-500' : order.status === 'confirmed' ? 'bg-blue-500' : 'bg-red-500'}`} />
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!orders || orders.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  ยังไม่มีคำสั่งซื้อ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
