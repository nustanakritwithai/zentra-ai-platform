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
          <h1 className="text-xl font-bold">แผนราคา</h1>
          <p className="text-sm text-muted-foreground mt-1">เลือกแผนที่เหมาะกับธุรกิจของคุณ ไม่มีค่าใช้จ่ายแอบแฝง ยกเลิกได้ทุกเมื่อ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map(plan => {
            const isCurrent = plan.name.toLowerCase() === currentPlan;
            return (
              <Card key={plan.name} className={`border-border/50 relative ${plan.highlight ? "ring-2 ring-primary" : ""}`}>
                {plan.badge && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-xs">{plan.badge}</Badge>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <plan.icon className={`w-5 h-5 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-bold">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">฿{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    data-testid={`btn-plan-${plan.name.toLowerCase()}`}
                    className={`w-full ${isCurrent ? "bg-muted text-muted-foreground" : plan.highlight ? "bg-primary" : "bg-secondary"}`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "แผนปัจจุบัน" : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-border/50 max-w-4xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3">ประวัติการชำระเงิน</h3>
            <div className="space-y-2">
              {[
                { date: "12 มี.ค. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
                { date: "12 ก.พ. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
                { date: "12 ม.ค. 2026", desc: "Pro Plan — รายเดือน", amount: "฿990" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm">{item.desc}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className="font-medium text-sm">{item.amount}</span>
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
