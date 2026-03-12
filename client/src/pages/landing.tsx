import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Bot, Sparkles, TrendingUp, ShoppingBag, Eye, BarChart3, Headphones, ArrowRight, Zap, Rocket, Store, Globe, Shield, Activity, Flame } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const features = [
  { icon: Bot, title: "AI Agent ที่มีความจำ", desc: "AI ที่จำบริบทธุรกิจ วิเคราะห์ข้อมูล และเรียนรู้จากพฤติกรรมลูกค้าตลอดเวลา", color: "from-orange-500 to-red-500" },
  { icon: Sparkles, title: "Generative UI", desc: "สร้างหน้าร้าน ภาพสินค้า และคอนเทนต์อัตโนมัติด้วย AI", color: "from-red-500 to-pink-500" },
  { icon: TrendingUp, title: "Dynamic Pricing", desc: "ปรับราคาอัจฉริยะตามอุปสงค์และราคาคู่แข่งแบบ Real-time", color: "from-amber-500 to-orange-500" },
  { icon: ShoppingBag, title: "Shopping Assistant", desc: "ผู้ช่วยช้อปปิ้งส่วนตัวที่เข้าใจภาษาธรรมชาติ แนะนำสินค้าตรงใจ", color: "from-orange-400 to-red-400" },
  { icon: Eye, title: "Visual Search", desc: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง", color: "from-red-400 to-rose-500" },
  { icon: BarChart3, title: "AI Analytics", desc: "วิเคราะห์ยอดขาย พยากรณ์เทรนด์ และแนะนำกลยุทธ์ด้วย AI", color: "from-amber-400 to-orange-500" },
];

const howItWorks = [
  { step: "1", icon: Rocket, title: "สมัครฟรี", desc: "สร้างบัญชีใน 30 วินาที ไม่ต้องใช้บัตรเครดิต" },
  { step: "2", icon: Store, title: "ตั้งค่าร้านค้า", desc: "ตั้งชื่อร้าน เลือกประเภทธุรกิจ AI จะตั้งค่าให้อัตโนมัติ" },
  { step: "3", icon: Globe, title: "เปิดร้านออนไลน์", desc: "เพิ่มสินค้า แชร์ลิงก์ร้าน ลูกค้าสั่งซื้อได้ทันที" },
];

// Animated counter hook
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function AnimatedStat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div ref={ref} className="relative p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/40 transition-all duration-300 card-glow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent animate-count-up">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

// Live activity feed
function LiveFeed() {
  const activities = [
    "🛍️ ร้าน TechMall เพิ่มสินค้าใหม่",
    "📦 คำสั่งซื้อ #4521 จัดส่งแล้ว",
    "🤖 AI Agent ตอบลูกค้า 3 คน",
    "📈 ยอดขายวันนี้ +12%",
    "⭐ ร้าน FashionHub ได้รีวิว 5 ดาว",
    "🔥 โปรโมชั่นใหม่เปิดตัวแล้ว",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % activities.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden h-5">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span key={idx} className="animate-slide-up whitespace-nowrap">{activities[idx]}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/20 animate-gradient-shift">Z</div>
            <span className="font-black text-lg tracking-tight">ZENTRA AI</span>
          </div>
          <div className="hidden sm:block"><LiveFeed /></div>
          <div className="flex items-center gap-3">
            <Link href="/auth"><Button variant="ghost" data-testid="nav-login" className="text-sm">เข้าสู่ระบบ</Button></Link>
            <Link href="/auth"><Button data-testid="nav-signup" className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20">เปิดร้านฟรี</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated bg orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.03] via-transparent to-red-500/[0.03]" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '0.8s' }} />

        {/* Decorative lines */}
        <div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
        <div className="absolute top-10 right-1/3 w-px h-60 bg-gradient-to-b from-transparent via-red-500/15 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center relative z-10">
          <Badge variant="outline" className="mb-5 text-xs px-4 py-1.5 border-orange-500/30 bg-orange-500/5 animate-slide-up">
            <Activity className="w-3 h-3 mr-1.5 text-orange-500" />
            <span className="text-orange-400">LIVE</span>
            <span className="mx-1.5 text-border">|</span>
            AI-Powered E-Commerce Platform 2026
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight animate-slide-up" style={{ animationDelay: '100ms' }}>
            เปิดร้านค้าออนไลน์<br />
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent animate-gradient-shift">ด้วย AI ที่ชาญฉลาดที่สุด</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-sm sm:text-base animate-slide-up" style={{ animationDelay: '200ms' }}>
            สร้างร้านค้าออนไลน์ใน 2 นาที มี AI Agent 6 ตัวช่วยขาย วิเคราะห์ข้อมูล และทำการตลาดอัตโนมัติ — เพิ่มยอดขายได้ถึง 40%
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link href="/auth">
              <Button data-testid="hero-cta" size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300">
                <Flame className="w-4 h-4 mr-1" /> เปิดร้านฟรี <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/shop/zentramart">
              <Button variant="outline" size="lg" className="border-orange-500/30 hover:bg-orange-500/5 hover:border-orange-500/50">ดูตัวอย่างร้านค้า</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 stagger-children">
            <AnimatedStat value={50000} suffix="+" label="ร้านค้า" />
            <AnimatedStat value={2000000} suffix="+" label="คำสั่งซื้อ" />
            <AnimatedStat value={99} suffix=".9%" label="Uptime" />
            <AnimatedStat value={4} suffix=".9/5" label="Rating" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 border-orange-500/30 bg-orange-500/5">
            <Rocket className="w-3 h-3 mr-1 text-orange-500" />ง่ายมาก
          </Badge>
          <h2 className="text-2xl font-black">เปิดร้านใน 3 ขั้นตอน</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
          {howItWorks.map((item, i) => (
            <Card key={item.step} className="border-border/50 text-center group hover:border-primary/30 transition-all duration-300 card-glow animate-slide-up overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-orange-500" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold mb-2">{item.step}</div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 border-orange-500/30 bg-orange-500/5">
            <Zap className="w-3 h-3 mr-1 text-orange-500" />ฟีเจอร์ที่ทรงพลัง
          </Badge>
          <h2 className="text-2xl font-black">ทุกสิ่งที่คุณต้องการในแพลตฟอร์มเดียว</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {features.map((f, i) => (
            <Card key={f.title} className="border-border/50 group hover:border-primary/30 transition-all duration-300 card-glow animate-slide-up overflow-hidden relative">
              <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <CardContent className="p-5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} bg-opacity-10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`} style={{ background: `linear-gradient(135deg, hsl(15 90% 55% / 0.1), hsl(350 80% 52% / 0.1))` }}>
                  <f.icon className="w-5 h-5 text-orange-500" />
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
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black">แผนราคาที่เหมาะกับทุกธุรกิจ</h2>
          <p className="text-sm text-muted-foreground mt-2">เริ่มฟรี อัปเกรดเมื่อพร้อม</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {[
            { name: "Free", price: "฿0", period: "ตลอดไป", features: ["1 ร้านค้า", "50 สินค้า", "100 AI Credits/เดือน", "SSL", "หน้าร้านออนไลน์"], highlight: false },
            { name: "Pro", price: "฿990", period: "/เดือน", features: ["5 ร้านค้า", "ไม่จำกัดสินค้า", "5,000 AI Credits/เดือน", "AI Agent ครบ 6 ตัว", "Custom Domain", "Priority Support"], highlight: true },
            { name: "Enterprise", price: "฿4,990", period: "/เดือน", features: ["ไม่จำกัดทุกอย่าง", "White-label", "Dedicated AI Server", "99.9% SLA", "Dedicated Account Manager"], highlight: false },
          ].map(p => (
            <Card key={p.name} className={`border-border/50 animate-slide-up overflow-hidden relative transition-all duration-300 ${p.highlight ? "ring-2 ring-orange-500/60 shadow-xl shadow-orange-500/10" : "card-glow"}`}>
              {p.highlight && (
                <>
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500" />
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-xs border-0 shadow-lg">🔥 ยอดนิยม</Badge>
                </>
              )}
              <CardContent className="p-6">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button className={`w-full mt-6 ${p.highlight ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40" : "hover:border-orange-500/30"}`} variant={p.highlight ? "default" : "outline"}>
                    {p.name === "Free" ? "เปิดร้านฟรี" : "เริ่มต้นเลย"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl border border-border/50 bg-card/50 flex flex-col sm:flex-row items-center gap-6 card-glow">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-base mb-1">ปลอดภัย มั่นใจได้</h3>
            <p className="text-sm text-muted-foreground">ข้อมูลร้านค้าทั้งหมดถูกเข้ารหัสและจัดเก็บบน Cloud ระดับ Enterprise พร้อม Backup อัตโนมัติทุกวัน</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-amber-500/5 rounded-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black">พร้อมเริ่มต้นขายออนไลน์แล้วหรือยัง?</h2>
          <p className="text-muted-foreground mt-2">เข้าร่วมกับผู้ประกอบการกว่า 50,000 รายที่ใช้ ZENTRA AI</p>
          <Link href="/auth">
            <Button size="lg" className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300">
              <Flame className="w-4 h-4 mr-1" /> เปิดร้านฟรีวันนี้ <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-[10px]">Z</div>
            <span>&copy; 2026 ZENTRA AI</span>
          </div>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
