import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye, Send, Trash2, Bot, User, Loader2, MessageSquare, Brain, Database, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { AiAgent } from "@shared/schema";

const iconMap: Record<string, any> = { ShoppingBag, Sparkles, TrendingUp, Headphones, BarChart3, Eye };

const agentColors: Record<string, string> = {
  shopping_assistant: "from-cyan-500 to-blue-500",
  recommendation: "from-violet-500 to-purple-500",
  dynamic_pricing: "from-emerald-500 to-teal-500",
  customer_support: "from-orange-500 to-amber-500",
  inventory_forecast: "from-blue-500 to-indigo-500",
  visual_search: "from-pink-500 to-rose-500",
};

interface RAGSource {
  title: string;
  source: string;
  score: number;
}

interface ChatMsg {
  id: number;
  agentType: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  memoryUsed?: boolean;
  ragSources?: RAGSource[];
  factsExtracted?: number;
}

export default function AiChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMsg[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const { data: agents = [] } = useQuery<AiAgent[]>({ queryKey: ["/api/ai-agents"] });

  // Load history when agent changes
  const { data: history = [] } = useQuery<ChatMsg[]>({
    queryKey: ["/api/ai-chat/history", selectedAgent],
    enabled: !!selectedAgent,
  });

  useEffect(() => {
    if (history.length > 0) {
      setLocalMessages(history);
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const sendMut = useMutation({
    mutationFn: async (message: string) => {
      const r = await apiRequest("POST", "/api/ai-chat", { agentType: selectedAgent, message });
      return r.json();
    },
    onSuccess: (data) => {
      setLocalMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          agentType: selectedAgent!,
          role: "model",
          content: data.reply,
          timestamp: new Date().toISOString(),
          memoryUsed: data.memoryUsed,
          ragSources: data.ragSources,
          factsExtracted: data.factsExtracted,
        }
      ]);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-chat/history", selectedAgent] });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
      setLocalMessages(prev => prev.slice(0, -1));
    },
  });

  const clearMut = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/ai-chat/history/${selectedAgent}`); },
    onSuccess: () => {
      setLocalMessages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-chat/history", selectedAgent] });
      toast({ title: "ล้างประวัติแชทสำเร็จ" });
    },
  });

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !selectedAgent || sendMut.isPending) return;
    setLocalMessages(prev => [
      ...prev,
      { id: Date.now(), agentType: selectedAgent, role: "user", content: msg, timestamp: new Date().toISOString() }
    ]);
    setInput("");
    sendMut.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectAgent = (agentType: string) => {
    setSelectedAgent(agentType);
    setLocalMessages([]);
  };

  const currentAgent = agents.find(a => a.type === selectedAgent);
  const enabledAgents = agents.filter(a => a.enabled);

  const sourceLabels: Record<string, string> = {
    product: "สินค้า",
    order: "คำสั่งซื้อ",
    customer: "ลูกค้า",
    knowledge: "Knowledge Base",
    policy: "นโยบาย",
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              AI Chat
            </h1>
            <p className="text-sm text-muted-foreground">สนทนากับ AI Agent — Memory + RAG ขับเคลื่อนด้วย Gemini AI</p>
          </div>
          {selectedAgent && (
            <Button
              data-testid="clear-chat"
              variant="outline"
              size="sm"
              onClick={() => clearMut.mutate()}
              className="gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ล้างแชท
            </Button>
          )}
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Agent Selector Sidebar */}
          <div className="w-[200px] shrink-0 space-y-2 overflow-y-auto hidden md:block">
            <p className="text-xs font-medium text-muted-foreground mb-3 px-1">เลือก AI Agent</p>
            {agents.map(agent => {
              const Icon = iconMap[agent.icon || ""] || Sparkles;
              const isSelected = selectedAgent === agent.type;
              const isDisabled = !agent.enabled;
              return (
                <button
                  key={agent.id}
                  data-testid={`chat-agent-${agent.type}`}
                  disabled={isDisabled}
                  onClick={() => handleSelectAgent(agent.type)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{agent.name}</p>
                    {isDisabled && <p className="text-[10px] text-muted-foreground">ปิดอยู่</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile Agent Selector */}
          <div className="md:hidden shrink-0 mb-2 w-full">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {agents.map(agent => {
                const Icon = iconMap[agent.icon || ""] || Sparkles;
                const isSelected = selectedAgent === agent.type;
                return (
                  <button
                    key={agent.id}
                    disabled={!agent.enabled}
                    onClick={() => handleSelectAgent(agent.type)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all",
                      isSelected ? "bg-primary/10 text-primary border border-primary/20" : !agent.enabled ? "opacity-40" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {agent.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {!selectedAgent ? (
              /* No Agent Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-2">เลือก AI Agent เพื่อเริ่มสนทนา</h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    AI Agent แต่ละตัวมีความเชี่ยวชาญเฉพาะทาง พร้อม Memory + RAG
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-violet-400" /> Memory</span>
                    <span className="flex items-center gap-1"><Database className="w-3 h-3 text-primary" /> RAG</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Fact Extraction</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {enabledAgents.slice(0, 4).map(agent => {
                      const Icon = iconMap[agent.icon || ""] || Sparkles;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => handleSelectAgent(agent.type)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                        >
                          <Icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{agent.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Agent Info Header */}
                {currentAgent && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/50 mb-3 shrink-0">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agentColors[currentAgent.type] || "from-primary to-violet-500"} flex items-center justify-center`}>
                      {(() => { const Icon = iconMap[currentAgent.icon || ""] || Sparkles; return <Icon className="w-5 h-5 text-white" />; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{currentAgent.name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                          Gemini AI
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">
                          Memory + RAG
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{currentAgent.description}</p>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-2">
                  {localMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">เริ่มสนทนากับ {currentAgent?.name}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">AI จะจำบริบทการสนทนาและค้นหาข้อมูลร้านค้าอัตโนมัติ</p>
                      </div>
                    </div>
                  )}
                  {localMessages.map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "model" && (
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agentColors[msg.agentType] || "from-primary to-violet-500"} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/50 rounded-bl-md"
                      )}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Memory/RAG indicators for model messages */}
                        {msg.role === "model" && (msg.memoryUsed || (msg.ragSources && msg.ragSources.length > 0) || (msg.factsExtracted && msg.factsExtracted > 0)) && (
                          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30 flex-wrap">
                            {msg.memoryUsed && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 cursor-default">
                                    <Brain className="w-3 h-3" />
                                    Memory
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  AI ใช้ข้อมูลที่จำได้เกี่ยวกับคุณ
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.ragSources && msg.ragSources.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary cursor-default">
                                    <Database className="w-3 h-3" />
                                    RAG ({msg.ragSources.length})
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[240px] text-xs">
                                  <p className="font-semibold mb-1">แหล่งข้อมูลอ้างอิง:</p>
                                  {msg.ragSources.map((s, si) => (
                                    <p key={si} className="text-muted-foreground">
                                      {s.title} ({sourceLabels[s.source] || s.source}) — {Math.round(s.score * 100)}%
                                    </p>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {msg.factsExtracted !== undefined && msg.factsExtracted > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 cursor-default">
                                    <Zap className="w-3 h-3" />
                                    +{msg.factsExtracted} Facts
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  AI เรียนรู้ข้อเท็จจริงใหม่จากบทสนทนานี้
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}

                        <p className={cn(
                          "text-[10px] mt-1.5",
                          msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        )}>
                          {new Date(msg.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sendMut.isPending && (
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agentColors[selectedAgent] || "from-primary to-violet-500"} flex items-center justify-center shrink-0`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังค้นหา Knowledge Base + คิด...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 pt-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <Textarea
                      ref={textareaRef}
                      data-testid="chat-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`พิมพ์ข้อความถึง ${currentAgent?.name || "AI Agent"}...`}
                      className="min-h-[44px] max-h-[120px] resize-none bg-card"
                      rows={1}
                    />
                    <Button
                      data-testid="chat-send"
                      onClick={handleSend}
                      disabled={!input.trim() || sendMut.isPending}
                      size="icon"
                      className="shrink-0 h-[44px] w-[44px]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                      <Brain className="w-3 h-3" /> Memory
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                      <Database className="w-3 h-3" /> RAG
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                      <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
