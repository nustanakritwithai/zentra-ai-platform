import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye,
  ChevronDown, ChevronUp, Zap, Brain, RefreshCw, Loader2,
  Play, AlertTriangle, CheckCircle2, Clock, Activity, Bell,
  X, ChevronRight, Flame, Target, TrendingDown, Package
} from "lucide-react";
import { useState, useEffect } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { AiAgent } from "@shared/schema";

const iconMap: Record<string, any> = { ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye };
const statusDot: Record<string, string> = {
  active: "bg-emerald-400 shadow-lg shadow-emerald-400/50",
  processing: "bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50",
  paused: "bg-white/20",
  error: "bg-red-400 shadow-lg shadow-red-400/50",
};

const agentColors: Record<string, { bg: string; icon: string; bar: string; text: string; hover: string; glow: string }> = {
  ShoppingBag: { bg: "from-teal-500/10 to-cyan-500/10", icon: "text-teal-400", bar: "from-teal-500 to-cyan-600", text: "text-teal-400", hover: "hover:border-teal-500/20 hover:shadow-teal-500/5", glow: "shadow-teal-500/20" },
  Sparkles: { bg: "from-violet-500/10 to-fuchsia-500/10", icon: "text-violet-400", bar: "from-violet-500 to-fuchsia-500", text: "text-violet-400", hover: "hover:border-violet-500/20 hover:shadow-violet-500/5", glow: "shadow-violet-500/20" },
  TrendingUp: { bg: "from-amber-500/10 to-yellow-500/10", icon: "text-amber-400", bar: "from-amber-500 to-yellow-500", text: "text-amber-400", hover: "hover:border-amber-500/20 hover:shadow-amber-500/5", glow: "shadow-amber-500/20" },
  Headphones: { bg: "from-emerald-500/10 to-green-500/10", icon: "text-emerald-400", bar: "from-emerald-500 to-green-500", text: "text-emerald-400", hover: "hover:border-emerald-500/20 hover:shadow-emerald-500/5", glow: "shadow-emerald-500/20" },
  BarChart3: { bg: "from-sky-500/10 to-blue-500/10", icon: "text-sky-400", bar: "from-sky-500 to-blue-500", text: "text-sky-400", hover: "hover:border-sky-500/20 hover:shadow-sky-500/5", glow: "shadow-sky-500/20" },
  Eye: { bg: "from-pink-500/10 to-rose-500/10", icon: "text-pink-400", bar: "from-pink-500 to-rose-500", text: "text-pink-400", hover: "hover:border-pink-500/20 hover:shadow-pink-500/5", glow: "shadow-pink-500/20" },
};
const defaultColor = agentColors.ShoppingBag;

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  medium: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  low: "text-white/50 bg-white/[0.04] border-white/[0.08]",
};

const insightIcons: Record<string, any> = {
  alert: AlertTriangle,
  recommendation: Target,
  analysis: BarChart3,
  action: Flame,
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "ยังไม่เคย";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

export default function AiAgentsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: agents = [], isLoading } = useQuery<AiAgent[]>({ queryKey: ["/api/ai-agents"] });
  const { data: aiStats } = useQuery<any>({ queryKey: ["/api/ai/stats"] });
  const { data: autoStates = [] } = useQuery<any[]>({
    queryKey: ["/api/automation/states"],
    refetchInterval: 15000,
  });
  const { data: autoStats } = useQuery<any>({
    queryKey: ["/api/automation/stats"],
    refetchInterval: 15000,
  });
  const { data: insights = [] } = useQuery<any[]>({
    queryKey: ["/api/automation/insights"],
    refetchInterval: 20000,
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("PUT", `/api/ai-agents/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] }); },
  });

  const triggerMut = useMutation({
    mutationFn: async (agentType: string) => {
      const r = await apiRequest("POST", `/api/automation/trigger/${agentType}`);
      return r.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/states"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
      toast({ title: data.status === "completed" ? "Agent ทำงานสำเร็จ" : "Agent ทำงานเสร็จ (มีข้อผิดพลาด)" });
    },
    onError: () => { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); },
  });

  const triggerAllMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/automation/trigger-all");
      return r.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/states"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
      const success = data.results?.filter((r: any) => r.status === "completed").length || 0;
      toast({ title: `Agent ${success}/${data.results?.length || 0} ทำงานสำเร็จ` });
    },
    onError: () => { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); },
  });

  const markReadMut = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/automation/insights/${id}/read`);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/automation/insights"] }); },
  });

  const enabledCount = agents.filter(a => a.enabled).length;
  const totalCount = agents.length;
  const unreadInsights = insights.filter((i: any) => !i.read).length;

  // Build state map for quick lookup
  const stateMap: Record<string, any> = {};
  for (const s of autoStates) {
    stateMap[s.agentType] = s;
  }

  // Filter insights by selected agent
  const filteredInsights = selectedAgentType
    ? insights.filter((i: any) => i.agentType === selectedAgentType)
    : insights;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">AI Agent Automation</h1>
            <p className="text-sm text-white/50">ระบบ AI อัตโนมัติที่ทำงานอยู่เบื้องหลังตลอดเวลา</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`gap-1 text-xs ${aiStats?.gemini?.hasKey ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              <Brain className="w-3 h-3" />
              {aiStats?.gemini?.hasKey ? "Gemini เชื่อมต่อแล้ว" : "ยังไม่มี Gemini Key"}
            </Badge>
            <Badge variant="outline" className="gap-1 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-400 border-teal-500/20">
              <Zap className="w-3 h-3" />
              {enabledCount}/{totalCount} ทำงาน
            </Badge>
            {unreadInsights > 0 && (
              <button onClick={() => setShowInsights(!showInsights)}>
                <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors">
                  <Bell className="w-3 h-3" />
                  {unreadInsights} แจ้งเตือนใหม่
                </Badge>
              </button>
            )}
          </div>
        </div>

        {/* Automation Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <Activity className="w-4 h-4 text-teal-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white/90">{autoStats?.totalRuns || 0}</p>
              <p className="text-[10px] text-white/40">รอบทำงาน</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white/90">{autoStats?.successRuns || 0}</p>
              <p className="text-[10px] text-white/40">สำเร็จ</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <Brain className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white/90">{autoStats?.totalInsights || 0}</p>
              <p className="text-[10px] text-white/40">Insights</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <BarChart3 className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white/90">{aiStats?.rag?.totalDocuments || 0}</p>
              <p className="text-[10px] text-white/40">RAG Docs</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white/90">{timeAgo(autoStats?.lastRunAt)}</p>
              <p className="text-[10px] text-white/40">รอบล่าสุด</p>
            </CardContent>
          </Card>
        </div>

        {/* Run All Button */}
        <div className="flex items-center gap-3">
          <Button
            data-testid="trigger-all-agents"
            onClick={() => triggerAllMut.mutate()}
            disabled={triggerAllMut.isPending}
            className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/30 hover:from-teal-500/30 hover:to-cyan-500/30"
          >
            {triggerAllMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {triggerAllMut.isPending ? "กำลังรัน Agent ทั้งหมด..." : "รัน Agent ทั้งหมดเดี๋ยวนี้"}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setShowInsights(!showInsights); setSelectedAgentType(null); }}
            className="gap-1 text-xs border-white/10 text-white/60 hover:text-white/90"
          >
            <Bell className="w-3.5 h-3.5" />
            Insights ({insights.length})
          </Button>
        </div>

        {/* Insights Panel */}
        {showInsights && (
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h3 className="font-bold text-sm text-white/90 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  AI Insights & Alerts
                </h3>
                <button onClick={() => setShowInsights(false)} className="text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Agent filter tabs */}
              <div className="flex gap-1 p-3 pb-0 flex-wrap">
                <button
                  onClick={() => setSelectedAgentType(null)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${!selectedAgentType ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/[0.04] text-white/40 border border-transparent hover:text-white/60"}`}
                >
                  ทั้งหมด ({insights.length})
                </button>
                {agents.map(a => {
                  const count = insights.filter((i: any) => i.agentType === a.type).length;
                  if (count === 0) return null;
                  const color = agentColors[a.icon || ""] || defaultColor;
                  return (
                    <button
                      key={a.type}
                      onClick={() => setSelectedAgentType(a.type)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${selectedAgentType === a.type ? `bg-gradient-to-r ${color.bg} ${color.text} border border-white/10` : "bg-white/[0.04] text-white/40 border border-transparent hover:text-white/60"}`}
                    >
                      {a.name.split(" ")[0]} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {filteredInsights.length === 0 && (
                  <p className="text-center text-white/30 text-xs py-6">ยังไม่มี Insights — รัน Agent เพื่อเริ่มวิเคราะห์</p>
                )}
                {filteredInsights.map((insight: any) => {
                  const InsightIcon = insightIcons[insight.type] || Brain;
                  return (
                    <div
                      key={insight.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${insight.read ? "bg-white/[0.01] border-white/[0.04] opacity-60" : severityColors[insight.severity]}`}
                    >
                      <InsightIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold truncate">{insight.title}</h4>
                          <span className="text-[9px] text-white/30 shrink-0">{timeAgo(insight.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{insight.description}</p>
                      </div>
                      {!insight.read && (
                        <button
                          onClick={() => markReadMut.mutate(insight.id)}
                          className="text-white/20 hover:text-white/50 shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent not loaded message */}
        {!isLoading && agents.length === 0 && (
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl">
            <CardContent className="p-6 text-center">
              <BotIcon className="w-12 h-12 text-amber-400/40 mx-auto mb-3" />
              <h3 className="font-bold text-white/80 mb-1">ยังไม่มี AI Agent</h3>
              <p className="text-sm text-white/50 mb-4">AI Agent จะถูกสร้างอัตโนมัติเมื่อคุณสร้างร้านค้า กรุณาไปที่หน้า Onboarding เพื่อสร้างร้านค้าก่อน</p>
              <a href="/#/onboarding">
                <Button className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30">
                  <RefreshCw className="w-4 h-4 mr-1" /> ไปสร้างร้านค้า
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => {
            const Icon = iconMap[agent.icon || ""] || Sparkles;
            const expanded = expandedId === agent.id;
            const color = agentColors[agent.icon || ""] || defaultColor;
            const state = stateMap[agent.type];
            const isRunning = triggerMut.isPending && triggerMut.variables === agent.type;
            const lastResult = state?.lastResult;
            const taskHistory = state?.taskHistory || [];
            const recentTasks = taskHistory.slice(-3).reverse();

            return (
              <Card key={agent.id} className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl transition-all duration-300 ${agent.enabled ? `hover:shadow-lg ${color.hover}` : "opacity-50"}`}>
                <CardContent className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${agent.enabled ? `bg-gradient-to-r ${color.bg}` : "bg-white/[0.04]"}`}>
                      <Icon className={`w-6 h-6 ${agent.enabled ? color.icon : "text-white/30"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white/90">{agent.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" : statusDot[agent.status]}`} />
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{agent.description}</p>
                    </div>
                    <Switch
                      data-testid={`agent-toggle-${agent.id}`}
                      checked={agent.enabled}
                      onCheckedChange={(checked) => updateMut.mutate({ id: agent.id, enabled: checked, status: checked ? "active" : "paused" })}
                    />
                  </div>

                  {/* Automation stats row */}
                  {state && (
                    <div className="flex items-center gap-3 mt-3 text-[10px]">
                      <span className="text-white/30 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {state.totalRuns} รอบ
                      </span>
                      <span className="text-emerald-400/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {state.successRuns} สำเร็จ
                      </span>
                      <span className="text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(state.lastRunAt)}
                      </span>
                      {state.insights.length > 0 && (
                        <span className="text-amber-400/60 flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          {state.insights.filter((i: any) => !i.read).length} ใหม่
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      data-testid={`trigger-agent-${agent.type}`}
                      size="sm"
                      variant="outline"
                      disabled={isRunning || !agent.enabled}
                      onClick={() => triggerMut.mutate(agent.type)}
                      className={`text-xs h-7 px-3 border-white/10 ${color.text} hover:bg-white/[0.04]`}
                    >
                      {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                      {isRunning ? "กำลังทำงาน..." : "รันเดี๋ยวนี้"}
                    </Button>
                    <button
                      data-testid={`agent-expand-${agent.id}`}
                      onClick={() => setExpandedId(expanded ? null : agent.id)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors ml-auto"
                    >
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expanded ? "ซ่อน" : "รายละเอียด"}
                    </button>
                  </div>

                  {/* Expanded panel */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                      {/* Last result summary */}
                      {lastResult && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">ผลลัพธ์ล่าสุด</h4>
                          <LastResultDisplay agentType={agent.type} result={lastResult} color={color} />
                        </div>
                      )}

                      {/* Task history */}
                      {recentTasks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">ประวัติการทำงาน</h4>
                          {recentTasks.map((task: any) => (
                            <div key={task.id} className="flex items-center gap-2 text-[10px]">
                              {task.status === "completed" ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : task.status === "failed" ? (
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                              ) : (
                                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                              )}
                              <span className="text-white/50">{task.id}</span>
                              <span className={task.status === "completed" ? "text-emerald-400/60" : task.status === "failed" ? "text-red-400/60" : "text-amber-400/60"}>
                                {task.status === "completed" ? "สำเร็จ" : task.status === "failed" ? "ล้มเหลว" : "กำลังทำ"}
                              </span>
                              <span className="text-white/30 ml-auto">{timeAgo(task.completedAt || task.startedAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Agent insights */}
                      {state?.insights?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Insights ({state.insights.length})</h4>
                          {state.insights.slice(-3).reverse().map((ins: any) => {
                            const InsIcon = insightIcons[ins.type] || Brain;
                            return (
                              <div key={ins.id} className={`flex items-start gap-2 p-2 rounded-lg border text-[10px] ${ins.read ? "bg-white/[0.01] border-white/[0.04] opacity-50" : severityColors[ins.severity]}`}>
                                <InsIcon className="w-3 h-3 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold block truncate">{ins.title}</span>
                                  <span className="text-white/40 block truncate">{ins.description}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* AI Analysis text */}
                      {lastResult?.aiAnalysis && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-400" /> Gemini AI วิเคราะห์
                          </h4>
                          <div className="bg-violet-500/[0.04] border border-violet-500/10 rounded-xl p-3">
                            <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-line">{lastResult.aiAnalysis}</p>
                          </div>
                        </div>
                      )}

                      {/* No data yet */}
                      {!lastResult && !state && (
                        <p className="text-center text-white/30 text-xs py-4">ยังไม่มีข้อมูล — กดปุ่ม "รันเดี๋ยวนี้" เพื่อเริ่มวิเคราะห์</p>
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

/** Display last result per agent type */
function LastResultDisplay({ agentType, result, color }: { agentType: string; result: any; color: any }) {
  switch (agentType) {
    case "inventory_forecast":
      return (
        <div className="space-y-2">
          <div className="flex gap-2 text-[10px]">
            <span className="text-white/40">สินค้าทั้งหมด: <span className="text-white/70 font-bold">{result.totalProducts}</span></span>
            <span className="text-amber-400/70">แจ้งเตือน: <span className="font-bold">{result.alerts?.length || 0}</span></span>
          </div>
          {result.alerts?.slice(0, 3).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <Package className={`w-3 h-3 ${a.severity === "critical" ? "text-red-400" : "text-amber-400"}`} />
              <span className="text-white/50 truncate">{a.message}</span>
            </div>
          ))}
        </div>
      );
    case "dynamic_pricing":
      return (
        <div className="space-y-2">
          <div className="flex gap-3 text-[10px]">
            <span className="text-white/40">คำแนะนำ: <span className="text-white/70 font-bold">{result.suggestions?.length || 0}</span></span>
          </div>
          {result.suggestions?.filter((s: any) => s.action !== "maintain").slice(0, 3).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              {s.action === "increase" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-amber-400" />}
              <span className="text-white/50 truncate">{s.name}: ฿{s.currentPrice?.toLocaleString()} → ฿{s.suggestedPrice?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    case "recommendation":
      return (
        <div className="space-y-2">
          <div className="flex gap-3 text-[10px]">
            <span className="text-white/40">สินค้ายอดนิยม: <span className="text-white/70 font-bold">{result.topProducts?.length || 0}</span></span>
            <span className="text-white/40">คู่สินค้า: <span className="text-white/70 font-bold">{result.topPairs?.length || 0}</span></span>
          </div>
          {result.topProducts?.slice(0, 3).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-white/50 truncate">{p.name} — ขาย {p.sales} ชิ้น</span>
            </div>
          ))}
        </div>
      );
    case "customer_support":
      return (
        <div className="space-y-2">
          <div className="flex gap-3 text-[10px]">
            <span className="text-white/40">คำสั่งซื้อ: <span className="text-white/70 font-bold">{result.totalOrders || 0}</span></span>
            <span className="text-amber-400/70">รอนาน: <span className="font-bold">{result.longPendingOrders?.length || 0}</span></span>
          </div>
          {result.longPendingOrders?.slice(0, 3).map((o: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-white/50 truncate">#{String(o.orderId).padStart(4, "0")} {o.customer} — รอ {o.daysPending} วัน</span>
            </div>
          ))}
        </div>
      );
    case "shopping_assistant":
      return (
        <div className="space-y-2">
          <div className="flex gap-3 text-[10px]">
            <span className="text-white/40">Trending: <span className="text-white/70 font-bold">{result.trending?.length || 0}</span></span>
            <span className="text-amber-400/70">ต้องการคำอธิบาย: <span className="font-bold">{result.needsDescription || 0}</span></span>
            {result.ragReindexed && <span className="text-emerald-400/60">RAG อัปเดตแล้ว</span>}
          </div>
        </div>
      );
    case "visual_search":
      return (
        <div className="space-y-2">
          <div className="flex gap-3 text-[10px]">
            <span className="text-white/40">หมวดหมู่: <span className="text-white/70 font-bold">{result.categories?.length || 0}</span></span>
            <span className="text-amber-400/70">ไม่มีหมวดหมู่: <span className="font-bold">{result.uncategorized || 0}</span></span>
          </div>
        </div>
      );
    default:
      return <p className="text-[10px] text-white/30">ข้อมูลพร้อมแสดง</p>;
  }
}

function BotIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
}
