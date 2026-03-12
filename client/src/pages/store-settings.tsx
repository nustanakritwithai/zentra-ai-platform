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
import { Store, Globe, Palette, Save } from "lucide-react";
import { useState, useEffect } from "react";
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

  if (!store) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">กำลังโหลด...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold">ตั้งค่าร้านค้า</h1>
          <p className="text-sm text-muted-foreground">จัดการข้อมูลและรูปลักษณ์ร้านค้าของคุณ</p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" /><CardTitle className="text-base">ข้อมูลร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium block mb-1">ชื่อร้านค้า</label><Input data-testid="input-store-name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium block mb-1">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">zentra.ai/store/</span>
                <Input data-testid="input-store-slug" value={slug} onChange={e => setSlug(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div><label className="text-sm font-medium block mb-1">รายละเอียด</label><Input data-testid="input-store-desc" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">สกุลเงิน</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">฿ THB (บาท)</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">สถานะร้าน</label>
                <div className="flex items-center gap-3 mt-2">
                  <Switch data-testid="toggle-store-status" checked={isActive} onCheckedChange={setIsActive} />
                  <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "เปิดใช้งาน" : "ปิดชั่วคราว"}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-secondary" /><CardTitle className="text-base">ธีมร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map(t => (
                <button key={t.value} data-testid={`theme-${t.value}`} onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${theme === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /><CardTitle className="text-base">ลิงก์ร้านค้า</CardTitle></div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <code className="text-sm">https://zentra.ai/store/{slug}</code>
            </div>
          </CardContent>
        </Card>

        <Button data-testid="btn-save-store" className="bg-primary" onClick={handleSave} disabled={updateMut.isPending}>
          <Save className="w-4 h-4 mr-1" />บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
