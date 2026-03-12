import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { Link2, Plus, ExternalLink, TrendingUp, DollarSign, Package, Copy, Percent, Globe, MousePointerClick, ShoppingCart, Eye, BarChart3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AffiliateMode = "resell" | "clickbait";

export default function AffiliatePage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<AffiliateMode>("resell");
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("shopee");
  const [commission, setCommission] = useState("5");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [clickbaitTitle, setClickbaitTitle] = useState("");
  const [clickbaitDesc, setClickbaitDesc] = useState("");

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const affiliateProducts = products.filter((p: any) => p.affiliateUrl);
  const resellProducts = affiliateProducts.filter((p: any) => !p.affiliateClickbait);
  const clickbaitProducts = affiliateProducts.filter((p: any) => p.affiliateClickbait);

  const addAffiliate = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/products", {
        name: productName || clickbaitTitle,
        description: mode === "clickbait" ? clickbaitDesc : `สินค้า Affiliate จาก ${source}`,
        price: parseFloat(productPrice) || 0,
        category: "Affiliate",
        stock: 999,
        affiliateUrl: url,
        affiliateSource: source,
        affiliateCommission: parseFloat(commission),
        affiliateClickbait: mode === "clickbait",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: mode === "resell" ? "เพิ่มสินค้า Resell สำเร็จ" : "เพิ่มลิงก์ Clickbait สำเร็จ" });
      setShowAdd(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setUrl(""); setProductName(""); setProductPrice(""); setCommission("5");
    setClickbaitTitle(""); setClickbaitDesc("");
  };

  const totalCommission = affiliateProducts.reduce((sum: number, p: any) =>
    sum + ((p.affiliateCommission || 0) * (p.price || 0) / 100), 0
  );

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "คัดลอกลิงก์แล้ว" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-400" />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Affiliate Center</span>
            </h1>
            <p className="text-sm text-white/40">จัดการระบบพันธมิตร 2 โหมด — Resell และ Clickbait</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button data-testid="add-affiliate" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-1.5">
                <Plus className="w-4 h-4" /> เพิ่ม {mode === "resell" ? "สินค้า Resell" : "ลิงก์ Clickbait"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0c0c14] border-white/[0.06]">
              <DialogHeader>
                <DialogTitle className="text-white/90">
                  {mode === "resell" ? "เพิ่มสินค้า Resell" : "เพิ่มลิงก์ Clickbait"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Mode toggle in dialog */}
                <div className="flex gap-2 p-1 rounded-lg bg-white/[0.04]">
                  <button onClick={() => setMode("resell")} className={cn("flex-1 py-2 rounded-md text-xs font-medium transition-all", mode === "resell" ? "bg-emerald-500/20 text-emerald-400" : "text-white/40")}>
                    <ShoppingCart className="w-3.5 h-3.5 inline mr-1" /> Resell
                  </button>
                  <button onClick={() => setMode("clickbait")} className={cn("flex-1 py-2 rounded-md text-xs font-medium transition-all", mode === "clickbait" ? "bg-amber-500/20 text-amber-400" : "text-white/40")}>
                    <MousePointerClick className="w-3.5 h-3.5 inline mr-1" /> Clickbait
                  </button>
                </div>

                {mode === "resell" ? (
                  <>
                    <Input placeholder="ชื่อสินค้า" value={productName} onChange={e => setProductName(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
                    <Input type="number" placeholder="ราคาขาย (บาท)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
                  </>
                ) : (
                  <>
                    <Input placeholder="หัวข้อดึงดูด (Clickbait Title)" value={clickbaitTitle} onChange={e => setClickbaitTitle(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
                    <Input placeholder="คำอธิบายสั้นๆ" value={clickbaitDesc} onChange={e => setClickbaitDesc(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
                  </>
                )}

                <Input placeholder="ลิงก์ Affiliate URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />

                <div className="grid grid-cols-2 gap-3">
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="lazada">Lazada</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="tiktok">TikTok Shop</SelectItem>
                      <SelectItem value="custom">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="ค่าคอมฯ %" value={commission} onChange={e => setCommission(e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>

                <Button data-testid="submit-affiliate" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={() => addAffiliate.mutate()} disabled={addAffiliate.isPending}>
                  {addAffiliate.isPending ? "กำลังเพิ่ม..." : "เพิ่ม"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">สินค้า Resell</p>
                  <p className="text-lg font-bold text-white/90">{resellProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">ลิงก์ Clickbait</p>
                  <p className="text-lg font-bold text-white/90">{clickbaitProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">ค่าคอมฯ คาดการณ์</p>
                  <p className="text-lg font-bold text-emerald-400">฿{totalCommission.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Conversion</p>
                  <p className="text-lg font-bold text-white/90">—</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for 2 modes */}
        <Tabs defaultValue="resell" onValueChange={(v) => setMode(v as AffiliateMode)}>
          <TabsList className="bg-white/[0.04] border border-white/[0.06]">
            <TabsTrigger value="resell" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 gap-1.5">
              <ShoppingCart className="w-4 h-4" /> Resell
            </TabsTrigger>
            <TabsTrigger value="clickbait" className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 gap-1.5">
              <MousePointerClick className="w-4 h-4" /> Clickbait
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resell" className="mt-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 mb-1">โหมด Resell</h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    นำสินค้าจากแพลตฟอร์มอื่นมาขายในร้านคุณ เมื่อลูกค้าสั่งซื้อ ระบบจะลิงก์ไปที่ต้นทาง คุณได้ค่าคอมมิชชั่นจากส่วนต่างราคา
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {resellProducts.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">ยังไม่มีสินค้า Resell</p>
                  <p className="text-xs mt-1">เพิ่มสินค้าจาก Shopee, Lazada หรือ Amazon เพื่อเริ่มขาย</p>
                </div>
              ) : (
                resellProducts.map((p: any) => (
                  <Card key={p.id} className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white/90 truncate">{p.name}</h3>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            {p.affiliateSource}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span>฿{Number(p.price).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{p.affiliateCommission}%</span>
                          <span className="text-emerald-400">คอมฯ ฿{(Number(p.price) * (p.affiliateCommission || 0) / 100).toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(p.affiliateUrl || "")} className="text-white/30 hover:text-white/60">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a href={p.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-white/30 hover:text-white/60">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="clickbait" className="mt-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <MousePointerClick className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-1">โหมด Clickbait</h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    สร้างคอนเทนต์ดึงดูดพร้อมลิงก์ Affiliate แสดงเป็นโฆษณาหรือบทความแนะนำในหน้าร้าน เมื่อผู้ใช้คลิก ระบบจะพาไปหน้าสินค้าจริง คุณได้ค่าคอมมิชชั่นจากคลิก/ยอดขาย
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {clickbaitProducts.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <MousePointerClick className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">ยังไม่มีลิงก์ Clickbait</p>
                  <p className="text-xs mt-1">สร้างคอนเทนต์ดึงดูดพร้อมลิงก์ Affiliate ที่ดึงดูดการคลิก</p>
                </div>
              ) : (
                clickbaitProducts.map((p: any) => (
                  <Card key={p.id} className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Eye className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white/90 truncate">{p.name}</h3>
                        <p className="text-xs text-white/40 truncate mt-0.5">{p.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{p.affiliateSource}</Badge>
                          <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{p.affiliateCommission}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(p.affiliateUrl || "")} className="text-white/30 hover:text-white/60">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a href={p.affiliateUrl || "#"} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-white/30 hover:text-white/60">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
