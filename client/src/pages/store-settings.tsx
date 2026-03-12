import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Store, Globe, Palette, Save, ExternalLink, Copy, MessageCircle, CreditCard, Banknote, QrCode, Shield, CheckCircle2, AlertCircle } from "lucide-react";
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

  // General settings
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("modern-dark");
  const [currency, setCurrency] = useState("THB");
  const [isActive, setIsActive] = useState(true);

  // LINE OA
  const [lineChannelId, setLineChannelId] = useState("");
  const [lineChannelSecret, setLineChannelSecret] = useState("");
  const [lineAccessToken, setLineAccessToken] = useState("");

  // Payment
  const [enablePromptPay, setEnablePromptPay] = useState(true);
  const [enableBankTransfer, setEnableBankTransfer] = useState(true);
  const [enableStripe, setEnableStripe] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [stripeKey, setStripeKey] = useState("");

  const { data: lineStatus } = useQuery<any>({
    queryKey: ["/api/line/status"],
    retry: false,
  });

  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setSlug(store.slug || "");
      setDescription(store.description || "");
      setTheme(store.theme || "modern-dark");
      setCurrency(store.currency || "THB");
      setIsActive(store.status === "active");
      // Payment
      const pm = store.paymentMethods || {};
      setEnablePromptPay(pm.promptpay !== false);
      setEnableBankTransfer(pm.bankTransfer !== false);
      setEnableStripe(pm.stripe === true);
      const ba = store.bankAccount || {};
      setBankName(ba.bankName || "");
      setBankAccountNumber(ba.accountNumber || "");
      setBankAccountName(ba.accountName || "");
      setStripeKey(store.stripeKey || "");
    }
  }, [store]);

  const updateMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("PUT", `/api/stores/${store.id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stores"] }); toast({ title: "บันทึกสำเร็จ" }); },
    onError: (err: any) => { toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" }); },
  });

  const lineSetupMut = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/line/setup", {
        channelId: lineChannelId,
        channelSecret: lineChannelSecret,
        accessToken: lineAccessToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/line/status"] });
      toast({ title: "เชื่อมต่อ LINE OA สำเร็จ" });
    },
    onError: (err: any) => {
      toast({ title: "เชื่อมต่อไม่สำเร็จ", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveGeneral = () => {
    updateMut.mutate({ name, slug, description, theme, currency, status: isActive ? "active" : "paused" });
  };

  const handleSavePayment = () => {
    updateMut.mutate({
      paymentMethods: { promptpay: enablePromptPay, bankTransfer: enableBankTransfer, stripe: enableStripe },
      bankAccount: { bankName, accountNumber: bankAccountNumber, accountName: bankAccountName },
      stripeKey: stripeKey || null,
    });
  };

  if (!store) return <AppLayout><div className="flex items-center justify-center h-64 text-white/40">กำลังโหลด...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-white/90">ตั้งค่าร้านค้า</h1>
          <p className="text-sm text-white/40">จัดการข้อมูล รูปลักษณ์ ช่องทางชำระเงิน และการเชื่อมต่อ</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] mb-6 w-full sm:w-auto">
            <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white text-white/50">
              ข้อมูลร้าน
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white text-white/50">
              ชำระเงิน
            </TabsTrigger>
            <TabsTrigger value="line" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white text-white/50">
              LINE OA
            </TabsTrigger>
          </TabsList>

          {/* ============ GENERAL TAB ============ */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Store className="w-5 h-5 text-teal-400" /><CardTitle className="text-base text-white/80">ข้อมูลร้านค้า</CardTitle></div>
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
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">เปิดใช้งาน</Badge>
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
                <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-violet-400" /><CardTitle className="text-base text-white/80">ธีมร้านค้า</CardTitle></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themes.map(t => (
                    <button key={t.value} data-testid={`theme-${t.value}`} onClick={() => setTheme(t.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${theme === t.value ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500" : "border-white/[0.06] hover:border-teal-500/20"}`}>
                      <p className="font-medium text-sm text-white/80">{t.label}</p>
                      <p className="text-xs text-white/40 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-sky-400" /><CardTitle className="text-base text-white/80">ลิงก์ร้านค้า</CardTitle></div>
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
                    <Button variant="outline" size="sm" data-testid="btn-view-store" className="border-white/[0.06] text-white/60 hover:text-teal-400 hover:border-teal-500/20">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> ดูหน้าร้าน
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Button data-testid="btn-save-store" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20" onClick={handleSaveGeneral} disabled={updateMut.isPending}>
              <Save className="w-4 h-4 mr-1" />บันทึกการเปลี่ยนแปลง
            </Button>
          </TabsContent>

          {/* ============ PAYMENT TAB ============ */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-400" /><CardTitle className="text-base text-white/80">ช่องทางชำระเงิน</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PromptPay */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">PromptPay QR Code</p>
                      <p className="text-xs text-white/40">สแกนจ่ายผ่าน QR Code</p>
                    </div>
                  </div>
                  <Switch data-testid="toggle-promptpay" checked={enablePromptPay} onCheckedChange={setEnablePromptPay} />
                </div>

                {/* Bank Transfer */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">โอนเงินผ่านธนาคาร</p>
                      <p className="text-xs text-white/40">ลูกค้าโอนเงินแล้วแนบสลิป</p>
                    </div>
                  </div>
                  <Switch data-testid="toggle-bank" checked={enableBankTransfer} onCheckedChange={setEnableBankTransfer} />
                </div>

                {/* Stripe */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Stripe (บัตรเครดิต/เดบิต)</p>
                      <p className="text-xs text-white/40">รับชำระผ่านบัตรทั่วโลก</p>
                    </div>
                  </div>
                  <Switch data-testid="toggle-stripe" checked={enableStripe} onCheckedChange={setEnableStripe} />
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Details */}
            {enableBankTransfer && (
              <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-400" /><CardTitle className="text-base text-white/80">ข้อมูลบัญชีธนาคาร</CardTitle></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><label className="text-sm text-white/60 mb-1 block">ธนาคาร</label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger className="bg-white/[0.04] border-white/[0.06]" data-testid="select-bank">
                        <SelectValue placeholder="เลือกธนาคาร" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kbank">ธนาคารกสิกรไทย (KBank)</SelectItem>
                        <SelectItem value="scb">ธนาคารไทยพาณิชย์ (SCB)</SelectItem>
                        <SelectItem value="bbl">ธนาคารกรุงเทพ (BBL)</SelectItem>
                        <SelectItem value="ktb">ธนาคารกรุงไทย (KTB)</SelectItem>
                        <SelectItem value="tmb">ธนาคารทหารไทยธนชาต (TTB)</SelectItem>
                        <SelectItem value="bay">ธนาคารกรุงศรีอยุธยา (BAY)</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm text-white/60 mb-1 block">เลขบัญชี</label>
                    <Input data-testid="input-bank-number" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="xxx-x-xxxxx-x" className="bg-white/[0.04] border-white/[0.06] text-white font-mono" />
                  </div>
                  <div><label className="text-sm text-white/60 mb-1 block">ชื่อบัญชี</label>
                    <Input data-testid="input-bank-name" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="bg-white/[0.04] border-white/[0.06] text-white" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stripe Key */}
            {enableStripe && (
              <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-purple-400" /><CardTitle className="text-base text-white/80">Stripe API Key</CardTitle></div>
                </CardHeader>
                <CardContent>
                  <div><label className="text-sm text-white/60 mb-1 block">Stripe Publishable Key</label>
                    <Input data-testid="input-stripe-key" value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="pk_live_..." className="bg-white/[0.04] border-white/[0.06] text-white font-mono" type="password" />
                  </div>
                  <p className="text-xs text-white/30 mt-2">ได้จาก Stripe Dashboard → Developers → API Keys</p>
                </CardContent>
              </Card>
            )}

            <Button data-testid="btn-save-payment" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20" onClick={handleSavePayment} disabled={updateMut.isPending}>
              <Save className="w-4 h-4 mr-1" />บันทึกการตั้งค่าชำระเงิน
            </Button>
          </TabsContent>

          {/* ============ LINE OA TAB ============ */}
          <TabsContent value="line" className="space-y-6">
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-base text-white/80">LINE Official Account</CardTitle>
                  {lineStatus?.connected && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ml-auto">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> เชื่อมต่อแล้ว
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/50">
                  เชื่อมต่อ LINE OA เพื่อให้ AI ตอบแชทลูกค้าอัตโนมัติ และส่งข้อความแจ้งเตือนคำสั่งซื้อ
                </p>

                {lineStatus?.connected && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Channel ID: {lineStatus.channelId}</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">
                      Webhook URL: <code className="text-white/50">{window.location.origin}/api/line/webhook/{slug}</code>
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Channel ID</label>
                  <Input
                    data-testid="input-line-channel-id"
                    value={lineChannelId}
                    onChange={e => setLineChannelId(e.target.value)}
                    placeholder="เช่น 2009436459"
                    className="bg-white/[0.04] border-white/[0.06] text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Channel Secret</label>
                  <Input
                    data-testid="input-line-channel-secret"
                    value={lineChannelSecret}
                    onChange={e => setLineChannelSecret(e.target.value)}
                    placeholder="Channel Secret"
                    className="bg-white/[0.04] border-white/[0.06] text-white font-mono"
                    type="password"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Channel Access Token (Long-lived)</label>
                  <Input
                    data-testid="input-line-access-token"
                    value={lineAccessToken}
                    onChange={e => setLineAccessToken(e.target.value)}
                    placeholder="สำหรับส่งข้อความอัตโนมัติ"
                    className="bg-white/[0.04] border-white/[0.06] text-white font-mono"
                    type="password"
                  />
                </div>

                <Button
                  data-testid="btn-save-line"
                  onClick={() => lineSetupMut.mutate()}
                  disabled={!lineChannelId || !lineChannelSecret || lineSetupMut.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {lineSetupMut.isPending ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ LINE OA"}
                </Button>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-white/50">วิธีตั้งค่า:</p>
                  <ol className="text-xs text-white/30 space-y-1 list-decimal list-inside">
                    <li>ไปที่ LINE Developers Console</li>
                    <li>สร้าง Messaging API Channel (หรือใช้ที่มีอยู่)</li>
                    <li>คัดลอก Channel ID และ Channel Secret</li>
                    <li>ไปที่ Messaging API → สร้าง Channel Access Token</li>
                    <li>ตั้ง Webhook URL เป็น: <code className="text-teal-400/60">{window.location.origin}/api/line/webhook/{slug}</code></li>
                    <li>เปิด "Use webhook" ใน LINE Developers</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
