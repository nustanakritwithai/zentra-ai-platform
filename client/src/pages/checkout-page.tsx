import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Wallet,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShoppingCart,
  Shield,
} from "lucide-react";

type PaymentMethod = "promptpay" | "truemoney" | "bank_transfer";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  // Cart from sessionStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("promptpay");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("idle"); // idle, pending, polling, successful, failed, expired
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [authorizeUri, setAuthorizeUri] = useState<string | null>(null);

  // Load cart
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`cart_${slug}`);
      if (stored) setCartItems(JSON.parse(stored));
    } catch {}
  }, [slug]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch merchant payment account to know which methods are available
  const { data: merchantAccount } = useQuery<any>({
    queryKey: [`/api/public/merchant-info/${slug}`],
    enabled: false, // We don't have this public endpoint — rely on method selection
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public/checkout/${slug}`, {
        method: selectedMethod,
        amount: total,
        phone: selectedMethod === "truemoney" ? phone : undefined,
        returnUrl: window.location.href,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTransactionId(data.transactionId);
      setQrCodeUrl(data.qrCodeUrl);
      setAuthorizeUri(data.authorizeUri);
      setPaymentStatus("pending");
    },
    onError: (err: any) => {
      setPaymentStatus("failed");
    },
  });

  // Poll payment status
  const pollStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const res = await fetch(`/api/public/payment-status/${transactionId}`);
      const data = await res.json();
      if (data.status === "successful") {
        setPaymentStatus("successful");
      } else if (data.status === "failed") {
        setPaymentStatus("failed");
      } else if (data.status === "expired") {
        setPaymentStatus("expired");
      }
    } catch {}
  }, [transactionId]);

  useEffect(() => {
    if (paymentStatus !== "pending") return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [paymentStatus, pollStatus]);

  function handlePay() {
    if (!customerName || !customerPhone) return;
    if (selectedMethod === "truemoney" && !phone) return;
    setPaymentStatus("polling");
    createPayment.mutate();
  }

  // Success state
  if (paymentStatus === "successful") {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">ชำระเงินสำเร็จ!</h2>
            <p className="text-white/60 text-sm">
              ขอบคุณสำหรับคำสั่งซื้อ ระบบจะส่งการยืนยันให้คุณทางข้อความ
            </p>
            <p className="text-2xl font-bold text-teal-400">฿{total.toLocaleString()}</p>
            <Button
              onClick={() => window.location.hash = `/shop/${slug}`}
              className="bg-teal-600 hover:bg-teal-500 text-white"
              data-testid="btn-back-to-shop"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าร้าน
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed / Expired state
  if (paymentStatus === "failed" || paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {paymentStatus === "expired" ? "การชำระเงินหมดอายุ" : "การชำระเงินล้มเหลว"}
            </h2>
            <p className="text-white/60 text-sm">
              กรุณาลองใหม่อีกครั้ง หรือเลือกช่องทางชำระเงินอื่น
            </p>
            <Button
              onClick={() => {
                setPaymentStatus("idle");
                setTransactionId(null);
                setQrCodeUrl(null);
                setAuthorizeUri(null);
              }}
              className="bg-teal-600 hover:bg-teal-500 text-white"
              data-testid="btn-retry"
            >
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => window.location.hash = `/shop/${slug}`}
            className="text-white/60 hover:text-white"
            data-testid="btn-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-400" />
            ชำระเงิน
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Order Summary */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">สรุปคำสั่งซื้อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cartItems.length === 0 ? (
              <p className="text-white/40 text-sm">ไม่มีสินค้าในตะกร้า</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {item.image && (
                      <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <span className="text-sm text-white/80">{item.name} x{item.quantity}</span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="font-semibold text-white">รวมทั้งหมด</span>
              <span className="font-bold text-teal-400 text-lg">฿{total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        {paymentStatus === "idle" && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">ชื่อ-นามสกุล *</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">เบอร์โทรศัพท์ *</label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-customer-phone"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">ที่อยู่จัดส่ง</label>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-shipping-address"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Selection */}
        {paymentStatus === "idle" && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">เลือกช่องทางชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setSelectedMethod("promptpay")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMethod === "promptpay"
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
                data-testid="method-promptpay"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">PromptPay QR</p>
                  <p className="text-xs text-white/40">สแกน QR Code ชำระผ่านแอปธนาคาร</p>
                </div>
                {selectedMethod === "promptpay" && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setSelectedMethod("truemoney")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMethod === "truemoney"
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
                data-testid="method-truemoney"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">TrueMoney Wallet</p>
                  <p className="text-xs text-white/40">ชำระผ่าน TrueMoney Wallet</p>
                </div>
                {selectedMethod === "truemoney" && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setSelectedMethod("bank_transfer")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMethod === "bank_transfer"
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
                data-testid="method-bank-transfer"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">โอนผ่านธนาคาร</p>
                  <p className="text-xs text-white/40">โอนเงินเข้าบัญชีธนาคารร้านค้า</p>
                </div>
                {selectedMethod === "bank_transfer" && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 ml-auto" />
                )}
              </button>

              {/* TrueMoney phone input */}
              {selectedMethod === "truemoney" && (
                <div className="mt-2">
                  <label className="text-xs text-white/50 mb-1 block">เบอร์ TrueMoney Wallet *</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-truemoney-phone"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Payment — QR / Waiting */}
        {paymentStatus === "pending" && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center space-y-4">
              {selectedMethod === "promptpay" && qrCodeUrl ? (
                <>
                  <div className="bg-white rounded-2xl p-4 inline-block mx-auto">
                    <img src={qrCodeUrl} alt="PromptPay QR" className="w-48 h-48" />
                  </div>
                  <p className="text-white/60 text-sm">สแกน QR Code ด้วยแอปธนาคารของคุณ</p>
                </>
              ) : selectedMethod === "truemoney" && authorizeUri ? (
                <>
                  <Wallet className="w-12 h-12 text-orange-400 mx-auto" />
                  <p className="text-white/60 text-sm">กรุณายืนยันการชำระเงินในแอป TrueMoney</p>
                  <Button
                    onClick={() => window.open(authorizeUri!, "_blank")}
                    className="bg-orange-600 hover:bg-orange-500 text-white"
                    data-testid="btn-open-truemoney"
                  >
                    เปิด TrueMoney Wallet
                  </Button>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                  <p className="text-white/60 text-sm">กรุณาโอนเงินตามข้อมูลด้านล่าง แล้วรอระบบตรวจสอบ</p>
                </>
              )}

              <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                กำลังรอการชำระเงิน...
              </div>

              <div className="flex items-center justify-center gap-1 text-white/30 text-xs">
                <Shield className="w-3 h-3" />
                ระบบชำระเงินปลอดภัยด้วย OPN (Omise)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Button */}
        {paymentStatus === "idle" && (
          <Button
            onClick={handlePay}
            disabled={createPayment.isPending || !customerName || !customerPhone || total === 0}
            className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-lg font-semibold rounded-xl"
            data-testid="btn-pay"
          >
            {createPayment.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Shield className="w-5 h-5 mr-2" />
            )}
            ชำระเงิน ฿{total.toLocaleString()}
          </Button>
        )}
      </div>
    </div>
  );
}
