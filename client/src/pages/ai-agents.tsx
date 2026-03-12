import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useState } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { AiAgent } from "@shared/schema";

const iconMap: Record<string, any> = { ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye };
const statusDot: Record<string, string> = { active: "bg-emerald-400 shadow-lg shadow-emerald-400/50", processing: "bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50", paused: "bg-white/20", error: "bg-red-400 shadow-lg shadow-red-400/50" };

// Dynamic View: each agent gets its own color identity
const agentColors: Record<string, { bg: string; icon: string; bar: string; text: string; hover: string }> = {
  ShoppingBag: { bg: "from-teal-500/10 to-cyan-500/10", icon: "text-teal-400", bar: "from-teal-500 to-cyan-600", text: "text-teal-400", hover: "hover:border-teal-500/20 hover:shadow-teal-500/5" },
  Sparkles: { bg: "from-violet-500/10 to-fuchsia-500/10", icon: "text-violet-400", bar: "from-violet-500 to-fuchsia-500", text: "text-violet-400", hover: "hover:border-violet-500/20 hover:shadow-violet-500/5" },
  TrendingUp: { bg: "from-amber-500/10 to-yellow-500/10", icon: "text-amber-400", bar: "from-amber-500 to-yellow-500", text: "text-amber-400", hover: "hover:border-amber-500/20 hover:shadow-amber-500/5" },
  Headphones: { bg: "from-emerald-500/10 to-green-500/10", icon: "text-emerald-400", bar: "from-emerald-500 to-green-500", text: "text-emerald-400", hover: "hover:border-emerald-500/20 hover:shadow-emerald-500/5" },
  BarChart3: { bg: "from-sky-500/10 to-blue-500/10", icon: "text-sky-400", bar: "from-sky-500 to-blue-500", text: "text-sky-400", hover: "hover:border-sky-500/20 hover:shadow-sky-500/5" },
  Eye: { bg: "from-pink-500/10 to-rose-500/10", icon: "text-pink-400", bar: "from-pink-500 to-rose-500", text: "text-pink-400", hover: "hover:border-pink-500/20 hover:shadow-pink-500/5" },
};
const defaultColor = agentColors.ShoppingBag;

export default function AiAgentsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();
  const { data: agents = [] } = useQuery<AiAgent[]>({ queryKey: ["/api/ai-agents"] });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("PUT", `/api/ai-agents/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] }); toast({ title: "อัปเดต AI Agent สำเร็จ" }); },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">AI Agent</h1>
            <p className="text-sm text-white/50">จัดการ AI ที่ทำงานให้ร้านค้าคุณอัตโนมัติ</p>
          </div>
          <Badge variant="outline" className="gap-1 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-400 border-teal-500/20"><Zap className="w-3 h-3 text-teal-400" />{agents.filter(a => a.enabled).length}/{agents.length} ทำงาน</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => {
            const Icon = iconMap[agent.icon || ""] || Sparkles;
            const expanded = expandedId === agent.id;
            const config = (agent.config as Record<string, any>) || {};
            const color = agentColors[agent.icon || ""] || defaultColor;

            return (
              <Card key={agent.id} className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl transition-all duration-300 ${agent.enabled ? `hover:shadow-lg ${color.hover}` : "opacity-50"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${agent.enabled ? `bg-gradient-to-r ${color.bg}` : "bg-white/[0.04]"}`}>
                      <Icon className={`w-6 h-6 ${agent.enabled ? color.icon : "text-white/30"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white/90">{agent.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${statusDot[agent.status]}`} />
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{agent.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all`} style={{ width: `${agent.performance || 0}%` }} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${color.text}`}>{agent.performance}%</span>
                      </div>
                    </div>
                    <Switch
                      data-testid={`agent-toggle-${agent.id}`}
                      checked={agent.enabled}
                      onCheckedChange={(checked) => updateMut.mutate({ id: agent.id, enabled: checked, status: checked ? "active" : "paused" })}
                    />
                  </div>

                  <button
                    data-testid={`agent-expand-${agent.id}`}
                    onClick={() => setExpandedId(expanded ? null : agent.id)}
                    className={`flex items-center gap-1 mt-3 text-xs text-white/40 hover:${color.text} transition-colors`}
                  >
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded ? "ซ่อนการตั้งค่า" : "ตั้งค่าขั้นสูง"}
                  </button>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                      {Object.entries(config).map(([key, val]) => {
                        if (typeof val === "number" && val <= 10) {
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium capitalize text-white/50">{key.replace(/([A-Z])/g, " $1")}</label>
                                <span className="text-xs font-mono text-teal-400">{val}</span>
                              </div>
                              <Slider
                                data-testid={`agent-slider-${agent.id}-${key}`}
                                value={[val as number]}
                                min={0} max={10} step={1}
                                onValueChange={([v]) => updateMut.mutate({ id: agent.id, config: { ...config, [key]: v } })}
                              />
                            </div>
                          );
                        }
                        if (typeof val === "number") {
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium capitalize text-white/50">{key.replace(/([A-Z])/g, " $1")}</label>
                                <span className="text-xs font-mono text-teal-400">{val}</span>
                              </div>
                              <Slider
                                value={[val as number]}
                                min={0} max={100} step={5}
                                onValueChange={([v]) => updateMut.mutate({ id: agent.id, config: { ...config, [key]: v } })}
                              />
                            </div>
                          );
                        }
                        if (typeof val === "boolean") {
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-xs font-medium capitalize text-white/50">{key.replace(/([A-Z])/g, " $1")}</label>
                              <Switch checked={val} onCheckedChange={(v) => updateMut.mutate({ id: agent.id, config: { ...config, [key]: v } })} />
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <label className="text-xs font-medium capitalize text-white/50">{key.replace(/([A-Z])/g, " $1")}</label>
                            <span className="text-xs text-white/40">{String(val)}</span>
                          </div>
                        );
                      })}
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
