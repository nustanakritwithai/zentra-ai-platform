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
import { useToast } from "@/hooks/use-toast";
import { PenTool, Palette, Layout, Type, Image, Eye, Save, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Store } from "@shared/schema";

const themes = [
  { id: "modern-dark", name: "Modern Dark", colors: ["#08080f", "#00C9A7", "#8B5CF6"], desc: "ธีมมืดสไตล์โมเดิร์น" },
  { id: "minimal-light", name: "Minimal Light", colors: ["#FAFAFA", "#0EA5E9", "#6366F1"], desc: "สะอาดตา มินิมอล" },
  { id: "warm-earth", name: "Warm Earth", colors: ["#1A1614", "#D97706", "#92400E"], desc: "โทนอุ่น ธรรมชาติ" },
  { id: "neon-cyber", name: "Neon Cyber", colors: ["#0A0A1A", "#F43F5E", "#06B6D4"], desc: "นีออน ไซเบอร์พังค์" },
  { id: "luxury-gold", name: "Luxury Gold", colors: ["#0C0A09", "#D4A850", "#78716C"], desc: "หรูหรา ทองคำ" },
  { id: "fresh-green", name: "Fresh Green", colors: ["#0F1A0F", "#22C55E", "#84CC16"], desc: "สดใส ธรรมชาติ" },
];

const layouts = [
  { id: "grid", name: "Grid", desc: "แสดงสินค้าเป็นกริด" },
  { id: "list", name: "List", desc: "แสดงสินค้าเป็นรายการ" },
  { id: "masonry", name: "Masonry", desc: "แสดงแบบ Pinterest" },
];

export default function StoreEditorPage() {
  const { toast } = useToast();
  const { data: stores = [] } = useQuery<Store[]>({ queryKey: ["/api/stores"] });
  const store = stores[0];

  const [selectedTheme, setSelectedTheme] = useState(store?.theme || "modern-dark");
  const [selectedLayout, setSelectedLayout] = useState("grid");
  const [bannerUrl, setBannerUrl] = useState((store as any)?.customBanner || "");
  const [customCss, setCustomCss] = useState((store as any)?.customCss || "");
  const [seoTitle, setSeoTitle] = useState((store as any)?.seoTitle || "");
  const [seoDesc, setSeoDesc] = useState((store as any)?.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState((store as any)?.seoKeywords || "");

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!store) return;
      const r = await apiRequest("PUT", `/api/stores/${store.id}`, {
        theme: selectedTheme,
        customBanner: bannerUrl,
        customCss,
        seoTitle,
        seoDescription: seoDesc,
        seoKeywords,
        storeThemeConfig: { layout: selectedLayout, theme: selectedTheme },
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "บันทึกการตกแต่งร้านค้าสำเร็จ" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">ตกแต่งร้านค้า</h1>
            <p className="text-sm text-white/50">ปรับแต่งหน้าร้านค้าตามสไตล์ของคุณ</p>
          </div>
          <Button data-testid="save-editor" onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} บันทึก
          </Button>
        </div>

        {/* Theme Selection */}
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-400" />
              <h2 className="font-bold text-sm text-white/80">เลือกธีม</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themes.map(theme => (
                <button key={theme.id} data-testid={`theme-${theme.id}`} onClick={() => setSelectedTheme(theme.id)} className={cn("p-4 rounded-xl border text-left transition-all", selectedTheme === theme.id ? "border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/5" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]")}>
                  <div className="flex gap-1.5 mb-2">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-white/80">{theme.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{theme.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Layout */}
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-sky-400" />
              <h2 className="font-bold text-sm text-white/80">เลือกเลย์เอาต์</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {layouts.map(layout => (
                <button key={layout.id} data-testid={`layout-${layout.id}`} onClick={() => setSelectedLayout(layout.id)} className={cn("p-4 rounded-xl border text-center transition-all", selectedLayout === layout.id ? "border-sky-500/40 bg-sky-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]")}>
                  <p className="text-sm font-medium text-white/80">{layout.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{layout.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Banner */}
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              <h2 className="font-bold text-sm text-white/80">แบนเนอร์</h2>
            </div>
            <Input data-testid="banner-url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="URL รูปแบนเนอร์" className="bg-white/[0.03] border-white/[0.08]" />
            {bannerUrl && (
              <div className="rounded-xl overflow-hidden border border-white/[0.06] h-32">
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO (#13) */}
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-white/80">SEO & การถูกค้นเจอ</h2>
            </div>
            <Input data-testid="seo-title" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO Title (ชื่อที่จะแสดงในผลค้นหา)" className="bg-white/[0.03] border-white/[0.08]" />
            <Textarea data-testid="seo-desc" value={seoDesc} onChange={e => setSeoDesc(e.target.value)} placeholder="SEO Description (คำอธิบายสำหรับ Google)" className="bg-white/[0.03] border-white/[0.08] min-h-[80px]" />
            <Input data-testid="seo-keywords" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="Keywords (คั่นด้วยจุลภาค)" className="bg-white/[0.03] border-white/[0.08]" />
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-xs text-white/30 mb-2">ตัวอย่างผลค้นหา</p>
              <p className="text-sm text-sky-400">{seoTitle || store?.name || "ชื่อร้านค้า"}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">zentra-ai.com/shop/{store?.slug || "my-store"}</p>
              <p className="text-xs text-white/40 mt-1 line-clamp-2">{seoDesc || store?.description || "คำอธิบายร้านค้า..."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-sm text-white/80">CSS กำหนดเอง</h2>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">ขั้นสูง</Badge>
            </div>
            <Textarea data-testid="custom-css" value={customCss} onChange={e => setCustomCss(e.target.value)} placeholder="/* Custom CSS สำหรับหน้าร้าน */" className="bg-white/[0.03] border-white/[0.08] font-mono text-xs min-h-[120px]" />
          </CardContent>
        </Card>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
