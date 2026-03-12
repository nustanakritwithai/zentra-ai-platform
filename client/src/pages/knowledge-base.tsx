import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, RefreshCw, Database, Brain, FileText, HelpCircle, BookMarked, Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

interface KBEntry {
  id: number;
  storeId: number;
  title: string;
  content: string;
  category: "faq" | "policy" | "guide" | "custom";
  indexed: boolean;
  createdAt: string;
}

interface AIStats {
  memory: { totalCustomers: number; totalFacts: number; totalEpisodes: number };
  rag: { totalDocuments: number; bySource: Record<string, number>; kbEntries: number };
}

const categoryConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  faq: { label: "คำถามที่พบบ่อย", icon: HelpCircle, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  policy: { label: "นโยบาย", icon: BookMarked, color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  guide: { label: "คู่มือ/โปรโมชั่น", icon: FileText, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  custom: { label: "กำหนดเอง", icon: Sparkles, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function KnowledgeBasePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("faq");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: entries = [], isLoading } = useQuery<KBEntry[]>({
    queryKey: ["/api/knowledge-base"],
  });

  const { data: stats } = useQuery<AIStats>({
    queryKey: ["/api/ai/stats"],
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/knowledge-base", { title, content, category });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/stats"] });
      setTitle("");
      setContent("");
      setCategory("faq");
      setDialogOpen(false);
      toast({ title: "เพิ่มข้อมูลสำเร็จ", description: "ข้อมูลถูกเพิ่มลง Knowledge Base แล้ว" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/stats"] });
      toast({ title: "ลบข้อมูลสำเร็จ" });
    },
  });

  const reindexMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/knowledge-base/reindex", {});
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/stats"] });
      toast({ title: "Re-index สำเร็จ", description: `ทำ index ${data.indexed} รายการ` });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const filtered = entries.filter(e => {
    const matchCat = filterCat === "all" || e.category === filterCat;
    const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              <span className="bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">Knowledge Base</span>
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              จัดการฐานความรู้ที่ AI Agent ใช้ตอบคำถาม — FAQs, นโยบาย, คู่มือ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="reindex-btn"
              variant="outline"
              size="sm"
              onClick={() => reindexMut.mutate()}
              disabled={reindexMut.isPending}
              className="gap-1.5 border-white/[0.06] text-white/50 hover:text-orange-400"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", reindexMut.isPending && "animate-spin")} />
              Re-index
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-kb-btn" size="sm" className="gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มข้อมูล
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-[hsl(240,15%,8%)] border-white/[0.06]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white/90">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    เพิ่มข้อมูลใหม่
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/70">หมวดหมู่</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="kb-category-select" className="bg-white/[0.04] border-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faq">คำถามที่พบบ่อย (FAQ)</SelectItem>
                        <SelectItem value="policy">นโยบาย (Policy)</SelectItem>
                        <SelectItem value="guide">คู่มือ/โปรโมชั่น (Guide)</SelectItem>
                        <SelectItem value="custom">กำหนดเอง (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/70">หัวข้อ</label>
                    <Input
                      data-testid="kb-title-input"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="เช่น นโยบายการคืนสินค้า"
                      className="bg-white/[0.04] border-white/[0.06]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/70">เนื้อหา</label>
                    <Textarea
                      data-testid="kb-content-input"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="รายละเอียดที่ AI จะใช้ตอบคำถามลูกค้า..."
                      rows={5}
                      className="resize-none bg-white/[0.04] border-white/[0.06]"
                    />
                  </div>
                  <Button
                    data-testid="kb-submit-btn"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    onClick={() => addMut.mutate()}
                    disabled={!title.trim() || !content.trim() || addMut.isPending}
                  >
                    {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    เพิ่มลง Knowledge Base
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{stats?.rag.totalDocuments ?? "—"}</p>
                  <p className="text-xs text-white/40">เอกสารใน Vector DB</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{stats?.memory.totalFacts ?? "—"}</p>
                  <p className="text-xs text-white/40">ข้อเท็จจริงที่จำได้</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{entries.length}</p>
                  <p className="text-xs text-white/40">รายการ Knowledge Base</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{stats?.memory.totalEpisodes ?? "—"}</p>
                  <p className="text-xs text-white/40">Episodic Memories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              data-testid="kb-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหา..."
              className="pl-9 bg-white/[0.04] border-white/[0.06]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "faq", label: "FAQ" },
              { key: "policy", label: "นโยบาย" },
              { key: "guide", label: "คู่มือ" },
              { key: "custom", label: "กำหนดเอง" },
            ].map(f => (
              <Button
                key={f.key}
                data-testid={`kb-filter-${f.key}`}
                variant={filterCat === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCat(f.key)}
                className={cn(
                  "text-xs",
                  filterCat === f.key
                    ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                    : "bg-white/[0.04] border-white/[0.06] text-white/50 hover:text-white/70"
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Entries Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/40 font-medium">ยังไม่มีข้อมูลใน Knowledge Base</p>
              <p className="text-sm text-white/20 mt-1">เพิ่ม FAQs, นโยบาย, คู่มือ เพื่อให้ AI ตอบคำถามได้ดีขึ้น</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(entry => {
              const config = categoryConfig[entry.category] || categoryConfig.custom;
              const Icon = config.icon;
              return (
                <Card key={entry.id} data-testid={`kb-entry-${entry.id}`} className="bg-white/[0.02] border-white/[0.06] rounded-2xl hover:border-orange-500/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border", config.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-white/90">{entry.title}</h3>
                            <Badge variant="outline" className={cn("text-[10px]", config.color)}>
                              {config.label}
                            </Badge>
                            {entry.indexed && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                Indexed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{entry.content}</p>
                          <p className="text-[10px] text-white/20 mt-2">
                            {new Date(entry.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Button
                        data-testid={`kb-delete-${entry.id}`}
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-white/30 hover:text-red-400"
                        onClick={() => deleteMut.mutate(entry.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* RAG Source Breakdown */}
        {stats?.rag.bySource && Object.keys(stats.rag.bySource).length > 0 && (
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white/90">
                <Database className="w-4 h-4 text-orange-400" />
                Vector Store Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(stats.rag.bySource).map(([source, count]) => {
                  const labels: Record<string, string> = {
                    product: "สินค้า",
                    order: "คำสั่งซื้อ",
                    customer: "ลูกค้า",
                    knowledge: "Knowledge Base",
                  };
                  return (
                    <div key={source} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      <span className="text-xs text-white/40">{labels[source] || source}</span>
                      <span className="text-xs font-bold ml-auto text-white/90">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
