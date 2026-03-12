import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link2, Plus, ExternalLink, TrendingUp, DollarSign, Package, Copy, Percent, Globe } from "lucide-react";

export default function AffiliatePage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("shopee");
  const [commission, setCommission] = useState("5");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const affiliateProducts = products.filter((p: any) => p.affiliateUrl);

  const addAffiliate = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/products", {
        name: productName,
        description: `สินค้า Affiliate จาก ${source}`,
        price: parseFloat(productPrice),
        category: "Affiliate",
        stock: 999,
        affiliateUrl: url,
        affiliateSource: source,
        affiliateCommission: parseFloat(commission),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "เพิ่มสินค้า Affiliate สำเร็จ" });
      setShowAdd(false);
      setUrl(""); setProductName(""); setProductPrice(""); setCommission("5");
    },
  });

  const totalCommission = affiliateProducts.reduce((sum: number, p: any) =>
    sum + (p.price * (p.affiliateCommission || 0) / 100), 0
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white/90">ระบบ Affiliate</h1>
            <p className="text-sm text-white/40 mt-1">จัดการสินค้า Affiliate จาก Shopee, Lazada และแหล่งอื่นๆ</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white" data-testid="btn-add-affiliate">
                <Plus className="w-4 h-4 mr-2" /> เพิ่มสินค้า Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white/90">เพิ่มสินค้า Affiliate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">แหล่งที่มา</label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="lazada">Lazada</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="tiktok">TikTok Shop</SelectItem>
                      <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">ชื่อสินค้า</label>
                  <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="ชื่อสินค้า" className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Affiliate URL</label>
                  <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://shopee.co.th/..." className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">ราคา (฿)</label>
                    <Input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="0" className="bg-white/[0.04] border-white/[0.06] text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">ค่าคอมมิชชัน (%)</label>
                    <Input type="number" value={commission} onChange={e => setCommission(e.target.value)} placeholder="5" className="bg-white/[0.04] border-white/[0.06] text-white" />
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white" onClick={() => addAffiliate.mutate()} disabled={!productName || !url || !productPrice} data-testid="btn-save-affiliate">
                  เพิ่มสินค้า Affiliate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "สินค้า Affiliate", value: affiliateProducts.length.toString(), icon: Package, color: "text-emerald-400" },
            { label: "ค่าคอมมิชชันรวม", value: `฿${totalCommission.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            { label: "คลิกทั้งหมด", value: "0", icon: TrendingUp, color: "text-blue-400" },
            { label: "Conversion Rate", value: "0%", icon: Percent, color: "text-purple-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">{stat.label}</p>
                    <p className="text-lg font-bold text-white/90">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Affiliate Products List */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white/90 text-base">สินค้า Affiliate ทั้งหมด</CardTitle>
            <CardDescription className="text-white/40">สินค้าที่เชื่อมต่อจากแพลตฟอร์มภายนอก</CardDescription>
          </CardHeader>
          <CardContent>
            {affiliateProducts.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="w-12 h-12 mx-auto text-white/20 mb-3" />
                <p className="text-white/40">ยังไม่มีสินค้า Affiliate</p>
                <p className="text-white/30 text-sm mt-1">กดปุ่ม "เพิ่มสินค้า Affiliate" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="space-y-3">
                {affiliateProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]" data-testid={`affiliate-product-${product.id}`}>
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] border-teal-500/30 text-emerald-400">
                          <Globe className="w-3 h-3 mr-1" />
                          {product.affiliateSource || "N/A"}
                        </Badge>
                        <span className="text-xs text-white/40">฿{product.price?.toLocaleString()}</span>
                        <span className="text-xs text-green-400">{product.affiliateCommission || 0}% คอมมิชชัน</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/80" onClick={() => {
                        navigator.clipboard.writeText(product.affiliateUrl || "");
                        toast({ title: "คัดลอก URL แล้ว" });
                      }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      {product.affiliateUrl && (
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/80" onClick={() => window.open(product.affiliateUrl, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
