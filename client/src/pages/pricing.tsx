import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Check, Crown, Zap, Rocket } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const plans = [
  {
    name: "Free",
    price: 0,
    period: "ตลอดไป",
    icon: Zap,
    features: ["1 ร้านค้า", "50 สินค้า", "100 AI Credits/เดือน", "5 Template พื้นฐาน", "รายงานพื้นฐาน", "SSL"],
    cta: "แผนปัจจุบัน",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: 990,
    period: "/เดือน",
    icon: Crown,
    features: ["5 ร้านค้า", "ไม่จำกัดสินค้า", "5,000 AI Credits", "50+ Template", "AI Agent ครบ 6 ตัว", "Analytics ขั้นสูง", "Custom Domain", "Priority Support"],
    cta: "อัปเกรดเป็น Pro",
    highlight: true,
    badge: "ยอดนิยม",
  },
  {
    name: "Enterprise",
    price: 4990,
    period: "/เดือน",
    icon: Rocket,
    features: ["ไม่จำกัดทุกอย่าง", "White-label", "Full API", "Dedicated AI Model", "99.9% SLA", "24/7 Dedicated Support", "Custom Integration", "On-premise Option"],
    cta: "ติดต่อทีมขาย",
    highlight: false,
    badge: "สุดคุ้ม",
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const currentPlan = user?.plan || "free";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">แผนราคา</h1>
          <p className="text-sm text-white/40 mt-1">เลือกแผนที่เหมาะกับธุรกิจของคุณ ไม่มีค่าใช้จ่ายแอบแฝง ยกเลิกได้ทุกเมื่อ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map(plan => {
            const isCurrent = plan.name.toLowerCase() === currentPlan;
            return (
              <Card key={plan.name} className={`bg-white/[0.02] border-white/[0.06] rounded-2xl relative ${plan.highlight ? "ring-2 ring-orange-500 shadow-lg shadow-orange-500/10" : ""}`}>
                {plan.badge && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs border-0">{plan.badge}</Badge>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <plan.icon className={`w-5 h-5 ${plan.name === "Free" ? "text-white/40" : plan.name === "Pro" ? "text-orange-400" : "text-red-400"}`} />
                    <h3 className="font-bold text-white/90">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white/90">฿{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-white/30 ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-white/60">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    data-testid={`btn-plan-${plan.name.toLowerCase()}`}
                    className={`w-full ${isCurrent ? "bg-white/[0.06] text-white/30" : plan.highlight ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-red-600" : "bg-white/[0.04] border border-white/[0.06] text-white/70 hover:border-orange-500/20"}`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "แผนปัจจุบัน" : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-white/[0.02] border-white/[0.06] max-w-4xl mx-auto rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3 text-white/80">ประวัติการชำระเงิน</h3>
            <div className="space-y-2">
              {[
                { date: "12 มี.ค. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
                { date: "12 ก.พ. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
                { date: "12 ม.ค. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-white/60">{item.desc}</p>
                    <p className="text-xs text-white/30">{item.date}</p>
                  </div>
                  <span className="font-medium text-sm text-white/80">{item.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
