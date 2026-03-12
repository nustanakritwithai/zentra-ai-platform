import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Eye, Edit, Trash2, Globe, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { BlogPost } from "@shared/schema";

export default function BlogPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const { toast } = useToast();

  const { data: posts = [] } = useQuery<BlogPost[]>({ queryKey: ["/api/blog"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/blog", { title, content, excerpt, category, status, seoTitle, seoDescription: seoDesc });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      resetForm();
      toast({ title: "สร้างบทความสำเร็จ" });
    },
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editingPost) return;
      const r = await apiRequest("PUT", `/api/blog/${editingPost.id}`, { title, content, excerpt, category, status, seoTitle, seoDescription: seoDesc });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      resetForm();
      toast({ title: "อัปเดตบทความสำเร็จ" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/blog/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/blog"] }); toast({ title: "ลบบทความสำเร็จ" }); },
  });

  const aiGenMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/ai/generate-text", { prompt: `เขียนบทความเกี่ยวกับ: ${title}`, type: "blog" });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.text) setContent(data.text);
      toast({ title: "AI สร้างเนื้อหาสำเร็จ" });
    },
    onError: () => {
      toast({ title: "AI ไม่สามารถสร้างเนื้อหาได้", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowEditor(false);
    setEditingPost(null);
    setTitle("");
    setContent("");
    setExcerpt("");
    setCategory("general");
    setStatus("draft");
    setSeoTitle("");
    setSeoDesc("");
  };

  const startEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt || "");
    setCategory(post.category || "general");
    setStatus(post.status);
    setSeoTitle(post.seoTitle || "");
    setSeoDesc(post.seoDescription || "");
    setShowEditor(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">Blog & บทความ</h1>
            <p className="text-sm text-white/50">จัดการบทความร้านค้า เพิ่ม SEO และดึงดูดลูกค้า</p>
          </div>
          <Button data-testid="new-post" onClick={() => { resetForm(); setShowEditor(true); }} className="bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30">
            <Plus className="w-4 h-4 mr-1" /> เขียนบทความ
          </Button>
        </div>

        {/* Posts List */}
        {!showEditor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => (
              <Card key={post.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-pink-500/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white/90 truncate">{post.title}</h3>
                      <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{post.excerpt || post.content.slice(0, 100)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn("text-[10px]", post.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>
                          {post.status === "published" ? "เผยแพร่แล้ว" : "แบบร่าง"}
                        </Badge>
                        <span className="text-[10px] text-white/30">{post.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button data-testid={`edit-post-${post.id}`} onClick={() => startEdit(post)} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                        <Edit className="w-4 h-4 text-white/40" />
                      </button>
                      <button data-testid={`delete-post-${post.id}`} onClick={() => deleteMut.mutate(post.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400/40" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">ยังไม่มีบทความ</p>
                <p className="text-xs text-white/20 mt-1">เริ่มเขียนบทความเพื่อเพิ่ม SEO ให้ร้านค้า</p>
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        {showEditor && (
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white/80">{editingPost ? "แก้ไขบทความ" : "เขียนบทความใหม่"}</h2>
                <Button variant="ghost" onClick={resetForm} className="text-white/40 hover:text-white/60"><X className="w-4 h-4" /></Button>
              </div>

              <Input data-testid="post-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="หัวข้อบทความ" className="bg-white/[0.03] border-white/[0.08] text-white/80" />
              
              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40 bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">ทั่วไป</SelectItem>
                    <SelectItem value="tips">เคล็ดลับ</SelectItem>
                    <SelectItem value="news">ข่าวสาร</SelectItem>
                    <SelectItem value="promotion">โปรโมชั่น</SelectItem>
                    <SelectItem value="tutorial">สอนการใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40 bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">แบบร่าง</SelectItem>
                    <SelectItem value="published">เผยแพร่</SelectItem>
                  </SelectContent>
                </Select>
                {title && (
                  <Button data-testid="ai-generate" onClick={() => aiGenMut.mutate()} disabled={aiGenMut.isPending} className="bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 ml-auto">
                    {aiGenMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    AI เขียน
                  </Button>
                )}
              </div>

              <Textarea data-testid="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="เนื้อหาบทความ..." className="bg-white/[0.03] border-white/[0.08] text-white/80 min-h-[200px]" />
              <Input data-testid="post-excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="คำอธิบายย่อ (สำหรับ SEO)" className="bg-white/[0.03] border-white/[0.08] text-white/80" />
              
              {/* SEO Fields */}
              <div className="bg-white/[0.02] rounded-xl p-4 space-y-3 border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Globe className="w-3 h-3" /> SEO
                </div>
                <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO Title" className="bg-white/[0.03] border-white/[0.08] text-white/80 text-sm" />
                <Input value={seoDesc} onChange={e => setSeoDesc(e.target.value)} placeholder="SEO Description" className="bg-white/[0.03] border-white/[0.08] text-white/80 text-sm" />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={resetForm} className="text-white/40">ยกเลิก</Button>
                <Button data-testid="save-post" onClick={() => editingPost ? updateMut.mutate() : createMut.mutate()} disabled={!title || !content || createMut.isPending || updateMut.isPending} className="bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30">
                  {editingPost ? "อัปเดต" : "บันทึก"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}

function X({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>;
}
