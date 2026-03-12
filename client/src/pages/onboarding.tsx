import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowRight, ArrowLeft, Check, Sparkles, Globe, Palette, ShoppingBag, Zap } from "lucide-react";

const categories = [
  { value: "fashion", label: "แฟชั่น / เสื้อผ้า", icon: "👗" },
  { value: "electronics", label: "อิเล็กทรอนิกส์", icon: "📱" },
  { value: "food", label: "อาหาร / เครื่องดื่ม", icon: "🍜" },
  { value: "beauty", label: "ความงาม / สุขภาพ", icon: "💄" },
  { value: "home", label: "บ้าน / เฟอร์นิเจอร์", icon: "🏠" },
  { value: "sports", label: "กีฬา / กลางแจ้ง", icon: "⚽" },
  { value: "books", label: "หนังสือ / สื่อ", icon: "📚" },
  { value: "other", label: "อื่นๆ", icon: "🛍️" },
];

const currencies = [
  { value: "THB", label: "บาท (฿)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "JPY", label: "เยน (¥)" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { user, setStoreId } = useAuth();
  const { toast } = useToast();

  // Auto-generate slug from store name
  useEffect(() => {
    if (storeName && step === 1) {
      const generated = storeName
        .toLowerCase()
        .replace(/[^a-z0-9ก-์\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[ก-์]+/g, (match) => {
          // Transliterate Thai to simple latin
          return match.length > 0 ? "store" : "";
        })
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      const finalSlug = generated || `store-${Date.now().toString(36).slice(-4)}`;
      setSlug(finalSlug);
    }
  }, [storeName, step]);

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") +
            `/api/onboarding/check-slug/${slug}`
        );
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleCreateStore = async () => {
    if (!storeName || !slug) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/onboarding/create-store", {
        name: storeName,
        slug,
        description,
        category,
        currency,
      });
      const data = await res.json();
      if (data.storeId) {
        setStoreId(data.storeId);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setStep(4); // Success step
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err?.message || "กรุณาลองใหม่", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? "w-10 bg-primary" : s < step ? "w-10 bg-primary/50" : "w-10 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Store Name & URL */}
        {step === 1 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">ตั้งชื่อร้านค้า</h2>
                  <p className="text-sm text-muted-foreground">สวัสดี {user?.name || ""}. มาสร้างร้านค้ากัน</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">ชื่อร้านค้า</label>
                  <Input
                    data-testid="input-store-name"
                    placeholder="เช่น Fashion Hub, TechMall, ร้านค้าของฉัน"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">URL ร้านค้า</label>
                  <div className="flex items-center gap-0">
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 border-border">
                      zentraai.onrender.com/#/shop/
                    </span>
                    <Input
                      data-testid="input-store-slug"
                      placeholder="my-store"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="rounded-l-none"
                    />
                  </div>
                  {slug && slugAvailable === true && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> URL นี้ว่างอยู่
                    </p>
                  )}
                  {slug && slugAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">URL นี้ถูกใช้แล้ว กรุณาเลือกอื่น</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">คำอธิบายร้านค้า (ไม่จำเป็น)</label>
                  <Input
                    data-testid="input-store-desc"
                    placeholder="บอกเล่าเกี่ยวกับร้านค้าของคุณ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <Button
                data-testid="btn-next-step1"
                className="w-full mt-6 bg-primary"
                onClick={() => setStep(2)}
                disabled={!storeName || !slug || slugAvailable === false}
              >
                ถัดไป <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">เลือกประเภทธุรกิจ</h2>
                  <p className="text-sm text-muted-foreground">AI จะปรับการทำงานตามประเภทธุรกิจของคุณ</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    data-testid={`cat-${cat.value}`}
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      category === cat.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/50 hover:border-primary/30 bg-card/50"
                    }`}
                  >
                    <span className="text-xl mb-1 block">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                </Button>
                <Button
                  data-testid="btn-next-step2"
                  className="flex-1 bg-primary"
                  onClick={() => setStep(3)}
                  disabled={!category}
                >
                  ถัดไป <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Currency + Confirm */}
        {step === 3 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">ตั้งค่าสกุลเงิน</h2>
                  <p className="text-sm text-muted-foreground">เลือกสกุลเงินสำหรับร้านค้าของคุณ</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {currencies.map((cur) => (
                  <button
                    key={cur.value}
                    data-testid={`cur-${cur.value}`}
                    onClick={() => setCurrency(cur.value)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      currency === cur.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/50 hover:border-primary/30 bg-card/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{cur.label}</span>
                    {currency === cur.value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl border border-border/50 bg-muted/30 mb-6 space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> สรุปข้อมูลร้านค้า
                </h3>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">ชื่อร้าน:</span>
                  <span className="font-medium">{storeName}</span>
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-medium text-primary">/{slug}</span>
                  <span className="text-muted-foreground">ประเภท:</span>
                  <span className="font-medium">{categories.find((c) => c.value === category)?.label}</span>
                  <span className="text-muted-foreground">สกุลเงิน:</span>
                  <span className="font-medium">{currencies.find((c) => c.value === currency)?.label}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                </Button>
                <Button
                  data-testid="btn-create-store"
                  className="flex-1 bg-gradient-to-r from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] text-white"
                  onClick={handleCreateStore}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-pulse" /> กำลังสร้าง...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> สร้างร้านค้า
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">สร้างร้านค้าสำเร็จ</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {storeName} พร้อมใช้งานแล้ว กำลังนำคุณไปที่ Dashboard...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "100ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
