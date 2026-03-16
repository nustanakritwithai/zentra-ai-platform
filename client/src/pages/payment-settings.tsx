import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  QrCode,
  Wallet,
  Building2,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  Zap,
  ArrowUpRight,
  Receipt,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function PaymentSettingsPage() {
  const { toast } = useToast();

  // Fetch current merchant payment account
  const { data: account, isLoading: accountLoading } = useQuery<any>({
    queryKey: ["/api/payment/merchant-account"],
  });

  // Fetch subscription
  const { data: subscription } = useQuery<any>({
    queryKey: ["/api/payment/subscription"],
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/payment/invoices"],
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/payment/transactions"],
  });

  // Form state
  const [opnPublicKey, setOpnPublicKey] = useState("");
  const [opnSecretKey, setOpnSecretKey] = useState("");
  const [promptpayEnabled, setPromptpayEnabled] = useState(false);
  const [promptpayId, setPromptpayId] = useState("");
  const [truemoneyEnabled, setTruemoneyEnabled] = useState(false);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  // Populate form from fetched account
  useEffect(() => {
    if (account) {
      setOpnPublicKey(account.opnPublicKey || "");
      setPromptpayEnabled(account.promptpayEnabled || false);
      setPromptpayId(account.promptpayId || "");
      setTruemoneyEnabled(account.truemoneyEnabled || false);
      setBankTransferEnabled(account.bankTransferEnabled || false);
      setBankName(account.bankName || "");
      setBankAccountNumber(account.bankAccountNumber || "");
      setBankAccountName(account.bankAccountName || "");
    }
  }, [account]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/payment/merchant-account", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment/merchant-account"] });
      toast({ title: "บันทึกสำเร็จ", description: "อัปเดตการตั้งค่าชำระเงินแล้ว" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("POST", "/api/payment/subscription", { plan });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment/subscription"] });
      toast({ title: "อัปเกรดสำเร็จ", description: "แพลนของคุณได้รับการอัปเดตแล้ว" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  function handleSave() {
    saveMutation.mutate({
      opnPublicKey,
      opnSecretKey: opnSecretKey || undefined,
      promptpayEnabled,
      promptpayId,
      truemoneyEnabled,
      bankTransferEnabled,
      bankName,
      bankAccountNumber,
      bankAccountName,
    });
  }

  const currentPlan = subscription?.plan || "free";

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#08080f] text-white p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-teal-400" />
              การตั้งค่าชำระเงิน
            </h1>
            <p className="text-white/50 text-sm mt-1">
              จัดการช่องทางรับชำระเงินและแพลนสมาชิก
            </p>
          </div>
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
            {currentPlan === "free" ? "ฟรี" : currentPlan === "pro" ? "โปร" : "องค์กร"}
          </Badge>
        </div>

        <Tabs defaultValue="payment-methods" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">
              ช่องทางชำระเงิน
            </TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">
              แพลนสมาชิก
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              ธุรกรรม
            </TabsTrigger>
          </TabsList>

          {/* ============= Payment Methods Tab ============= */}
          <TabsContent value="payment-methods" className="space-y-4">
            {/* OPN/Omise API Keys */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  OPN (Omise) API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Public Key</label>
                  <Input
                    value={opnPublicKey}
                    onChange={(e) => setOpnPublicKey(e.target.value)}
                    placeholder="pkey_test_..."
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-opn-public-key"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">
                    Secret Key {account?.hasSecretKey && (
                      <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">ตั้งค่าแล้ว</Badge>
                    )}
                  </label>
                  <Input
                    value={opnSecretKey}
                    onChange={(e) => setOpnSecretKey(e.target.value)}
                    placeholder={account?.hasSecretKey ? "••••••••" : "skey_test_..."}
                    type="password"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-opn-secret-key"
                  />
                  <p className="text-xs text-white/30 mt-1">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Secret key จะถูกเข้ารหัสก่อนจัดเก็บ ไม่เก็บเป็น plaintext
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PromptPay QR */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-400" />
                    PromptPay QR
                  </CardTitle>
                  <Switch
                    checked={promptpayEnabled}
                    onCheckedChange={setPromptpayEnabled}
                    data-testid="switch-promptpay"
                  />
                </div>
              </CardHeader>
              {promptpayEnabled && (
                <CardContent>
                  <label className="text-sm text-white/60 mb-1 block">PromptPay ID (เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน)</label>
                  <Input
                    value={promptpayId}
                    onChange={(e) => setPromptpayId(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-promptpay-id"
                  />
                </CardContent>
              )}
            </Card>

            {/* TrueMoney Wallet */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-400" />
                    TrueMoney Wallet
                  </CardTitle>
                  <Switch
                    checked={truemoneyEnabled}
                    onCheckedChange={setTruemoneyEnabled}
                    data-testid="switch-truemoney"
                  />
                </div>
              </CardHeader>
              {truemoneyEnabled && (
                <CardContent>
                  <p className="text-sm text-white/50">
                    ต้องใช้ OPN API Keys เพื่อเปิดใช้งาน TrueMoney Wallet
                    {!opnPublicKey && (
                      <span className="text-amber-400 block mt-1">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        กรุณาตั้งค่า OPN API Keys ก่อน
                      </span>
                    )}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Bank Transfer */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-400" />
                    โอนผ่านธนาคาร
                  </CardTitle>
                  <Switch
                    checked={bankTransferEnabled}
                    onCheckedChange={setBankTransferEnabled}
                    data-testid="switch-bank-transfer"
                  />
                </div>
              </CardHeader>
              {bankTransferEnabled && (
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">ธนาคาร</label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="เช่น กสิกรไทย, กรุงเทพ, ไทยพาณิชย์"
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-bank-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">เลขบัญชี</label>
                    <Input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="XXX-X-XXXXX-X"
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-bank-account-number"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">ชื่อบัญชี</label>
                    <Input
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล ตามบัญชี"
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-bank-account-name"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white"
              data-testid="btn-save-payment"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              บันทึกการตั้งค่า
            </Button>
          </TabsContent>

          {/* ============= Subscription Tab ============= */}
          <TabsContent value="subscription" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <Card className={`bg-white/5 border-white/10 ${currentPlan === "free" ? "ring-2 ring-teal-500" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-white text-lg">ฟรี</CardTitle>
                  <p className="text-3xl font-bold text-white">฿0<span className="text-sm font-normal text-white/50">/เดือน</span></p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1 text-sm text-white/70">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> 1 ร้านค้า</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> สินค้าไม่จำกัด</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> AI Agent พื้นฐาน</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> PromptPay QR</li>
                    <li className="flex items-center gap-2"><AlertCircle className="w-3 h-3 text-amber-400" /> ค่าธรรมเนียม 3.5%</li>
                  </ul>
                  {currentPlan === "free" ? (
                    <Badge className="w-full justify-center bg-teal-500/20 text-teal-400 mt-3">แพลนปัจจุบัน</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full mt-3 border-white/20 text-white hover:bg-white/10"
                      onClick={() => subscribeMutation.mutate("free")}
                      data-testid="btn-plan-free"
                    >
                      ดาวน์เกรด
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className={`bg-white/5 border-white/10 relative ${currentPlan === "pro" ? "ring-2 ring-teal-500" : ""}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />แนะนำ
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg">โปร</CardTitle>
                  <p className="text-3xl font-bold text-white">฿990<span className="text-sm font-normal text-white/50">/เดือน</span></p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1 text-sm text-white/70">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> 5 ร้านค้า</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> AI Agent ทั้งหมด</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> PromptPay + TrueMoney</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> LINE OA Integration</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> ค่าธรรมเนียม 2.5%</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> รายงานขั้นสูง</li>
                  </ul>
                  {currentPlan === "pro" ? (
                    <Badge className="w-full justify-center bg-teal-500/20 text-teal-400 mt-3">แพลนปัจจุบัน</Badge>
                  ) : (
                    <Button
                      className="w-full mt-3 bg-teal-600 hover:bg-teal-500 text-white"
                      onClick={() => subscribeMutation.mutate("pro")}
                      disabled={subscribeMutation.isPending}
                      data-testid="btn-plan-pro"
                    >
                      {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                      {currentPlan === "enterprise" ? "ดาวน์เกรด" : "อัปเกรด"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className={`bg-white/5 border-white/10 ${currentPlan === "enterprise" ? "ring-2 ring-teal-500" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-white text-lg">องค์กร</CardTitle>
                  <p className="text-3xl font-bold text-white">฿2,990<span className="text-sm font-normal text-white/50">/เดือน</span></p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1 text-sm text-white/70">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> ร้านค้าไม่จำกัด</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> AI Agent + Custom</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> ทุกช่องทางชำระเงิน</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> LINE + Meta Integration</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> ค่าธรรมเนียม 1.5%</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400" /> API Access + Priority Support</li>
                  </ul>
                  {currentPlan === "enterprise" ? (
                    <Badge className="w-full justify-center bg-teal-500/20 text-teal-400 mt-3">แพลนปัจจุบัน</Badge>
                  ) : (
                    <Button
                      className="w-full mt-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white"
                      onClick={() => subscribeMutation.mutate("enterprise")}
                      disabled={subscribeMutation.isPending}
                      data-testid="btn-plan-enterprise"
                    >
                      {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                      อัปเกรด
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoices */}
            {invoices.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-400" />
                    ประวัติใบแจ้งหนี้
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm text-white">{inv.periodStart?.slice(0, 10)} — {inv.periodEnd?.slice(0, 10)}</p>
                          <p className="text-xs text-white/40">#{inv.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white font-medium">฿{inv.amount?.toLocaleString()}</p>
                          <Badge className={inv.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>
                            {inv.status === "paid" ? "ชำระแล้ว" : "รอชำระ"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============= Transactions Tab ============= */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-400" />
                  ธุรกรรมล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">ยังไม่มีธุรกรรม</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 20).map((txn: any) => (
                      <div key={txn.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            txn.method === "promptpay" ? "bg-blue-500/20" :
                            txn.method === "truemoney" ? "bg-orange-500/20" :
                            "bg-green-500/20"
                          }`}>
                            {txn.method === "promptpay" ? <QrCode className="w-4 h-4 text-blue-400" /> :
                             txn.method === "truemoney" ? <Wallet className="w-4 h-4 text-orange-400" /> :
                             <Building2 className="w-4 h-4 text-green-400" />}
                          </div>
                          <div>
                            <p className="text-sm text-white">
                              {txn.method === "promptpay" ? "PromptPay QR" :
                               txn.method === "truemoney" ? "TrueMoney" : "โอนธนาคาร"}
                            </p>
                            <p className="text-xs text-white/40">
                              {txn.createdAt?.slice(0, 16).replace("T", " ")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white font-medium">฿{txn.amount?.toLocaleString()}</p>
                          <Badge className={
                            txn.status === "successful" ? "bg-green-500/20 text-green-400" :
                            txn.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                            txn.status === "failed" ? "bg-red-500/20 text-red-400" :
                            "bg-white/10 text-white/50"
                          }>
                            {txn.status === "successful" ? "สำเร็จ" :
                             txn.status === "pending" ? "รอชำระ" :
                             txn.status === "failed" ? "ล้มเหลว" :
                             txn.status === "expired" ? "หมดอายุ" : txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
