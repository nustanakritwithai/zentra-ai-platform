import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Bot, Sparkles, TrendingUp, ShoppingBag, Eye, BarChart3, Headphones, ArrowRight, Zap } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const features = [
  { icon: Bot, title: "AI Agent ที่มีความจำ", desc: "AI ที่จำบริบทธุรกิจ วิเคราะห์ข้อมูล และเรียนรู้จากพฤติกรรมลูกค้าตลอดเวลา" },
  { icon: Sparkles, title: "Generative UI", desc: "สร้างหน้าร้าน ภาพสินค้า และคอนเทนต์อัตโนมัติด้วย AI" },
  { icon: TrendingUp, title: "Dynamic Pricing", desc: "ปรับราคาอัจฉริยะตามอุปสงค์และราคาคู่แข่งแบบ Real-time" },
  { icon: ShoppingBag, title: "Shopping Assistant", desc: "ผู้ช่วยช้อปปิ้งส่วนตัวที่เข้าใจภาษาธรรมชาติ แนะนำสินค้าตรงใจ" },
  { icon: Eye, title: "Visual Search", desc: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง" },
  { icon: BarChart3, title: "AI Analytics", desc: "วิเคราะห์ยอดขาย พยากรณ์เทรนด์ และแนะนำกลยุทธ์ด้วย AI" },
];

const stats = [
  { value: "50K+", label: "ร้านค้า" },
  { value: "2M+", label: "คำสั่งซื้อ" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "Rating" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] flex items-center justify-center text-white font-bold text-sm">Z</div>
            <span className="font-bold text-lg tracking-tight">ZENTRA AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth"><Button variant="ghost" data-testid="nav-login" className="text-sm">เข้าสู่ระบบ</Button></Link>
            <Link href="/auth"><Button data-testid="nav-signup" className="bg-primary text-sm">เริ่มต้นฟรี</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-20 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs px-3 py-1"><Sparkles className="w-3 h-3 mr-1" />AI-Powered E-Commerce Platform รุ่นใหม่ 2026</Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            สร้างร้านค้าออนไลน์<br />
            <span className="bg-gradient-to-r from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] bg-clip-text text-transparent">ด้วย AI ที่ชาญฉลาด</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm sm:text-base">
            แพลตฟอร์มสร้างเว็บไซต์ E-Commerce ที่มี AI Agent 6 ตัว ช่วยออกแบบ จัดการสินค้า วิเคราะห์ยอดขาย และทำการตลาดอัตโนมัติ — เพิ่มยอดขายได้ถึง 40%
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/auth">
              <Button data-testid="hero-cta" size="lg" className="bg-gradient-to-r from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] text-white px-8">
                เริ่มสร้างร้านค้าฟรี <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">ดูตัวอย่าง Dashboard</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            {stats.map(s => (
              <div key={s.label} className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3"><Zap className="w-3 h-3 mr-1" />ฟีเจอร์ที่ทรงพลัง</Badge>
          <h2 className="text-2xl font-bold">ทุกสิ่งที่คุณต้องการในแพลตฟอร์มเดียว</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <Card key={f.title} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">แผนราคาที่เหมาะกับทุกธุรกิจ</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Free", price: "฿0", period: "ตลอดไป", features: ["1 ร้านค้า", "50 สินค้า", "100 AI Credits", "SSL"], highlight: false },
            { name: "Pro", price: "฿990", period: "/เดือน", features: ["5 ร้านค้า", "ไม่จำกัดสินค้า", "5,000 AI Credits", "AI Agent ครบ 6 ตัว", "Custom Domain"], highlight: true },
            { name: "Enterprise", price: "฿4,990", period: "/เดือน", features: ["ไม่จำกัดทุกอย่าง", "White-label", "Dedicated AI", "99.9% SLA"], highlight: false },
          ].map(p => (
            <Card key={p.name} className={`border-border/50 ${p.highlight ? "ring-2 ring-primary relative" : ""}`}>
              {p.highlight && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-xs">ยอดนิยม</Badge>}
              <CardContent className="p-6">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="mt-2"><span className="text-3xl font-bold">{p.price}</span><span className="text-sm text-muted-foreground">{p.period}</span></div>
                <ul className="mt-4 space-y-2">
                  {p.features.map(f => (<li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" />{f}</li>))}
                </ul>
                <Link href="/auth">
                  <Button className={`w-full mt-6 ${p.highlight ? "bg-primary" : ""}`} variant={p.highlight ? "default" : "outline"}>เริ่มต้นเลย</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
        <p className="text-muted-foreground mt-2">เข้าร่วมกับผู้ประกอบการกว่า 50,000 รายที่ใช้ ZENTRA AI</p>
        <Link href="/auth">
          <Button size="lg" className="mt-6 bg-gradient-to-r from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] text-white px-8">
            เริ่มสร้างร้านค้าฟรีวันนี้ <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] flex items-center justify-center text-white font-bold text-[10px]">Z</div>
            <span>© 2026 ZENTRA AI</span>
          </div>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
