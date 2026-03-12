import { useState } from "react";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Store, Settings, RefreshCw, ArrowUpDown, Package, ShoppingCart, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

const marketplaces = [
  {
    id: "shopee",
    name: "Shopee",
    logo: "🟠",
    color: "from-orange-500 to-orange-600",
    description: "เชื่อมต่อร้านค้า Shopee เพื่อซิงค์สินค้าและคำสั่งซื้ออัตโนมัติ",
    features: ["ซิงค์สินค้าอัตโนมัติ", "อัพเดทสต็อก Real-time", "รับออเดอร์จาก Shopee", "อัพเดทสถานะจัดส่ง"],
    apiUrl: "https://partner.shopeemobile.com/api",
    docsUrl: "https://open.shopee.com/developer-guide/",
  },
  {
    id: "lazada",
    name: "Lazada",
    logo: "🔵",
    color: "from-blue-500 to-indigo-600",
    description: "เชื่อมต่อร้านค้า Lazada เพื่อจัดการสินค้าข้ามแพลตฟอร์ม",
    features: ["ซิงค์สินค้าอัตโนมัติ", "จัดการราคาข้ามแพลตฟอร์ม", "รับออเดอร์จาก Lazada", "อัพเดทสถานะจัดส่ง"],
    apiUrl: "https://api.lazada.co.th/rest",
    docsUrl: "https://open.lazada.com/doc/",
  },
  {
    id: "tiktok",
    name: "TikTok Shop",
    logo: "🎵",
    color: "from-pink-500 to-purple-600",
    description: "เชื่อมต่อ TikTok Shop เพื่อขายสินค้าผ่านไลฟ์และวิดีโอ",
    features: ["ซิงค์สินค้าอัตโนมัติ", "เชื่อมต่อ Live Shopping", "รับออเดอร์จาก TikTok", "Analytics Dashboard"],
    apiUrl: "https://open-api.tiktokglobalshop.com",
    docsUrl: "https://partner.tiktokshop.com/",
  },
  {
    id: "line",
    name: "LINE SHOPPING",
    logo: "💚",
    color: "from-green-500 to-green-600",
    description: "แสดงสินค้าบน LINE SHOPPING เพื่อเข้าถึงลูกค้า LINE",
    features: ["แสดงสินค้าบน LINE SHOPPING", "รับออเดอร์ผ่าน LINE", "LINE Pay Integration", "ส่งโปรโมชั่นผ่าน LINE OA"],
    apiUrl: "https://api.line.me/v2",
    docsUrl: "https://developers.line.biz/en/docs/",
  },
];

export default function MarketplacePage() {
  const { toast } = useToast();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, { appId: string; appSecret: string }>>({});
  const [syncEnabled, setSyncEnabled] = useState<Record<string, boolean>>({});

  const handleConnect = (platformId: string) => {
    if (!apiKeys[platformId]?.appId || !apiKeys[platformId]?.appSecret) {
      toast({ title: "กรุณากรอก API Key", description: "ต้องใส่ App ID และ App Secret ก่อนเชื่อมต่อ", variant: "destructive" });
      return;
    }
    setConnectedPlatforms(prev => ({ ...prev, [platformId]: true }));
    toast({ title: `เชื่อมต่อ ${platformId} สำเร็จ`, description: "ระบบจะเริ่มซิงค์สินค้าภายใน 5 นาที" });
  };

  const handleSync = (platformId: string) => {
    toast({ title: `กำลังซิงค์ ${platformId}...`, description: "สินค้าและออเดอร์กำลังอัพเดท" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white/90">Marketplace API</h1>
          <p className="text-sm text-white/40 mt-1">เชื่อมต่อร้านค้ากับแพลตฟอร์ม Marketplace ชั้นนำ</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "แพลตฟอร์มที่เชื่อมต่อ", value: Object.values(connectedPlatforms).filter(Boolean).length.toString(), icon: Store, color: "text-orange-400" },
            { label: "สินค้าที่ซิงค์", value: "0", icon: Package, color: "text-blue-400" },
            { label: "ออเดอร์จาก Marketplace", value: "0", icon: ShoppingCart, color: "text-green-400" },
            { label: "ซิงค์ล่าสุด", value: "ยังไม่เริ่ม", icon: RefreshCw, color: "text-purple-400" },
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

        {/* Marketplace Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {marketplaces.map((platform) => {
            const isConnected = connectedPlatforms[platform.id];
            const keys = apiKeys[platform.id] || { appId: "", appSecret: "" };
            
            return (
              <Card key={platform.id} className="bg-white/[0.02] border-white/[0.06]" data-testid={`marketplace-${platform.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center text-lg`}>
                        {platform.logo}
                      </div>
                      <div>
                        <CardTitle className="text-base text-white/90">{platform.name}</CardTitle>
                        <CardDescription className="text-white/40 text-xs">{platform.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={isConnected ? "border-green-500/30 text-green-400" : "border-white/10 text-white/30"}>
                      {isConnected ? <><CheckCircle2 className="w-3 h-3 mr-1" /> เชื่อมต่อแล้ว</> : <><AlertCircle className="w-3 h-3 mr-1" /> ยังไม่เชื่อมต่อ</>}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {platform.features.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-white/[0.06] text-white/50">
                        {f}
                      </Badge>
                    ))}
                  </div>

                  {/* API Keys */}
                  <div className="space-y-2">
                    <Input
                      placeholder="App ID / Partner ID"
                      value={keys.appId}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [platform.id]: { ...keys, appId: e.target.value } }))}
                      className="bg-white/[0.04] border-white/[0.06] text-white text-sm"
                      data-testid={`input-${platform.id}-appid`}
                    />
                    <Input
                      placeholder="App Secret / Partner Key"
                      type="password"
                      value={keys.appSecret}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [platform.id]: { ...keys, appSecret: e.target.value } }))}
                      className="bg-white/[0.04] border-white/[0.06] text-white text-sm"
                      data-testid={`input-${platform.id}-secret`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">ซิงค์อัตโนมัติ</span>
                            <Switch
                              checked={syncEnabled[platform.id] || false}
                              onCheckedChange={(v) => setSyncEnabled(prev => ({ ...prev, [platform.id]: v }))}
                            />
                          </div>
                          <Button variant="ghost" size="sm" className="text-white/40" onClick={() => handleSync(platform.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" /> ซิงค์
                          </Button>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-white/40" onClick={() => window.open(platform.docsUrl, "_blank")}>
                        <ExternalLink className="w-3 h-3 mr-1" /> Docs
                      </Button>
                      <Button
                        size="sm"
                        className={isConnected ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-gradient-to-r from-orange-500 to-red-500 text-white"}
                        onClick={() => isConnected
                          ? (setConnectedPlatforms(prev => ({ ...prev, [platform.id]: false })), toast({ title: `ยกเลิกการเชื่อมต่อ ${platform.name}` }))
                          : handleConnect(platform.id)
                        }
                        data-testid={`btn-connect-${platform.id}`}
                      >
                        {isConnected ? "ยกเลิก" : "เชื่อมต่อ"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sync Settings */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white/90 text-base flex items-center gap-2">
              <Settings className="w-4 h-4" /> ตั้งค่าการซิงค์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm text-white/80">ซิงค์สินค้าอัตโนมัติ</p>
                  <p className="text-xs text-white/40">อัพเดทสินค้าเมื่อมีการเปลี่ยนแปลง</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm text-white/80">ซิงค์สต็อกอัตโนมัติ</p>
                  <p className="text-xs text-white/40">อัพเดทจำนวนสต็อกข้ามแพลตฟอร์ม</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm text-white/80">ซิงค์ออเดอร์อัตโนมัติ</p>
                  <p className="text-xs text-white/40">ดึงออเดอร์ใหม่จาก Marketplace</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm text-white/80">อัพเดทราคาข้ามแพลตฟอร์ม</p>
                  <p className="text-xs text-white/40">ใช้ Dynamic Pricing ปรับราคาทุกที่</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
