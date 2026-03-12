import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Store, Globe, Palette, Save, ExternalLink, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const themes = [
  { value: "modern-dark", label: "Modern Dark", desc: "ธีมมืดทันสมัย โทนสีเทาเข้ม" },
  { value: "classic-light", label: "Classic Light", desc: "ธีมสว่างคลาสสิก สะอาดตา" },
  { value: "minimal", label: "Minimal", desc: "ธีมมินิมอล เรียบง่าย" },
];

export default function StoreSettingsPage() {
  const { toast } = useToast();
  const { data: stores = [] } = useQuery<any[]>({ queryKey: ["/api/stores"] });
  const store = stores[0];

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("modern-dark");
  const [currency, setCurrency] = useState("THB");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setSlug(store.slug || "");
      setDescription(store.description || "");
      setTheme(store.theme || "modern-dark");
      setCurrency(store.currency || "THB");
      setIsActive(store.status === "active");
    }
  }, [store]);

  const updateMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("PUT", `/api/stores/${store.id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stores"] }); toast({ title: "บันทึกสำเร็จ" }); },
  });

  const handleSave = () => {
    updateMut.mutate({ name, slug, description, theme, currency, status: isActive ? "active" : "paused" });
  };

  if (!store) return <AppLayout><div className="flex items-center justify-center h-64 text-white/40">กำลังโหลด...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-white/90">ตั้งค่าร้านค้า</h1>
          <p className="text-sm text-white/40">จัดการข้อมูลและรูปลักษณ์ร้านค้าของคุณ</p>
        </div>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Store className="w-5 h-5 text-orange-400" /><CardTitle className="text-base text-white/80">ข้อมูลร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium block mb-1 text-white/60">ชื่อร้านค้า</label><Input data-testid="input-store-name" value={name} onChange={e => setName(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" /></div>
            <div><label className="text-sm font-medium block mb-1 text-white/60">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/30">zentra.ai/store/</span>
                <Input data-testid="input-store-slug" value={slug} onChange={e => setSlug(e.target.value)} className="flex-1 bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
            </div>
            <div><label className="text-sm font-medium block mb-1 text-white/60">รายละเอียด</label><Input data-testid="input-store-desc" value={description} onChange={e => setDescription(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1 text-white/60">สกุลเงิน</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">฿ THB (บาท)</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1 text-white/60">สถานะร้าน</label>
                <div className="flex items-center gap-3 mt-2">
                  <Switch data-testid="toggle-store-status" checked={isActive} onCheckedChange={setIsActive} />
                  {isActive ? (
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30">เปิดใช้งาน</Badge>
                  ) : (
                    <Badge className="bg-white/[0.06] text-white/40 border-white/[0.06]">ปิดชั่วคราว</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-red-400" /><CardTitle className="text-base text-white/80">ธีมร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map(t => (
                <button key={t.value} data-testid={`theme-${t.value}`} onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${theme === t.value ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500" : "border-white/[0.06] hover:border-orange-500/20"}`}>
                  <p className="font-medium text-sm text-white/80">{t.label}</p>
                  <p className="text-xs text-white/40 mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-orange-400" /><CardTitle className="text-base text-white/80">ลิงก์ร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-white/[0.04] flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/30 shrink-0" />
              <code className="text-sm flex-1 truncate text-white/60 font-mono">{window.location.origin}/#/shop/{slug}</code>
              <button
                data-testid="copy-store-url"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/#/shop/${slug}`).catch(() => {});
                  toast({ title: "คัดลอกลิงก์แล้ว" });
                }}
                className="p-1.5 rounded-md hover:bg-white/[0.06] shrink-0"
              >
                <Copy className="w-4 h-4 text-white/40" />
              </button>
            </div>
            <div className="flex gap-3">
              <Link href={`/shop/${slug}`}>
                <Button variant="outline" size="sm" data-testid="btn-view-store" className="border-white/[0.06] text-white/60 hover:text-orange-400 hover:border-orange-500/20">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> ดูหน้าร้าน
                </Button>
              </Link>
              <p className="text-xs text-white/40 self-center">แชร์ลิงก์นี้ให้ลูกค้าเพื่อเข้าดูร้านค้าและสั่งซื้อสินค้า</p>
            </div>
          </CardContent>
        </Card>

        <Button data-testid="btn-save-store" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20" onClick={handleSave} disabled={updateMut.isPending}>
          <Save className="w-4 h-4 mr-1" />บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
