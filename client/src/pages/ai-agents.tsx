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
const statusDot: Record<string, string> = { active: "bg-green-500", processing: "bg-yellow-500 animate-pulse", paused: "bg-gray-500", error: "bg-red-500" };

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
            <h1 className="text-xl font-bold">AI Agent</h1>
            <p className="text-sm text-muted-foreground">จัดการ AI ที่ทำงานให้ร้านค้าคุณอัตโนมัติ</p>
          </div>
          <Badge variant="outline" className="gap-1"><Zap className="w-3 h-3 text-primary" />{agents.filter(a => a.enabled).length}/{agents.length} ทำงาน</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => {
            const Icon = iconMap[agent.icon || ""] || Sparkles;
            const expanded = expandedId === agent.id;
            const config = (agent.config as Record<string, any>) || {};

            return (
              <Card key={agent.id} className={`border-border/50 transition-all ${agent.enabled ? "" : "opacity-60"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${agent.enabled ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-6 h-6 ${agent.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{agent.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${statusDot[agent.status]}`} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${agent.performance || 0}%` }} />
                        </div>
                        <span className="text-xs font-mono font-bold text-primary">{agent.performance}%</span>
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
                    className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded ? "ซ่อนการตั้งค่า" : "ตั้งค่าขั้นสูง"}
                  </button>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      {Object.entries(config).map(([key, val]) => {
                        if (typeof val === "number" && val <= 10) {
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                                <span className="text-xs font-mono text-primary">{val}</span>
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
                                <label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                                <span className="text-xs font-mono text-primary">{val}</span>
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
                              <label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                              <Switch checked={val} onCheckedChange={(v) => updateMut.mutate({ id: agent.id, config: { ...config, [key]: v } })} />
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                            <span className="text-xs text-muted-foreground">{String(val)}</span>
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
