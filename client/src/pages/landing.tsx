import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Bot,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Eye,
  BarChart3,
  Headphones,
  ArrowRight,
  Zap,
  Store,
  Globe,
  Shield,
  Activity,
  Flame,
  Star,
  Package,
  CreditCard,
  Truck,
  Palette,
  Lock,
  Box,
  Send,
  ScanLine,
  Brain,
  Database,
  CircleCheckBig,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { SEOHead } from "@/components/seo-head";

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

function AnimatedStat({ value, label, suffix = "", color = "from-teal-400 to-cyan-400" }: { value: number; label: string; suffix?: string; color?: string }) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div ref={ref} className="relative p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/40 transition-all duration-300 card-glow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
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

// Mock product cards for hero
const mockProducts = [
  { name: "หูฟังบลูทูธ Pro Max", price: "฿2,490", rating: 4.8, tag: "AI แนะนำ" },
  { name: "สมาร์ทวอทช์ Ultra", price: "฿5,990", rating: 4.9, tag: "ขายดี" },
  { name: "ลำโพง Portable 360°", price: "฿1,890", rating: 4.7, tag: "AI แนะนำ" },
];

// Typing animation for chat
function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

// AI Agents data
const aiAgents = [
  { icon: ShoppingBag, name: "Shopping Agent", desc: "เอเจนต์แนะนำสินค้าอัจฉริยะ ช่วยลูกค้าค้นหาสินค้าที่ต้องการอย่างแม่นยำ", gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
  { icon: Sparkles, name: "Recommendation Agent", desc: "การแนะนำเชิงลึก Cross-selling & Upselling เพิ่มมูลค่าตะกร้าสินค้า", gradient: "from-violet-500 to-purple-500", glow: "shadow-violet-500/20" },
  { icon: TrendingUp, name: "Dynamic Pricing Agent", desc: "ปรับราคาแบบไดนามิกแบบเรียลไทม์ตามอุปสงค์และคู่แข่ง", gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
  { icon: Headphones, name: "Customer Service Agent", desc: "บริการลูกค้า AI 24/7 ตอบคำถามและแก้ปัญหาอัตโนมัติ", gradient: "from-sky-500 to-blue-500", glow: "shadow-sky-500/20" },
  { icon: BarChart3, name: "Inventory Forecasting Agent", desc: "พยากรณ์สต็อกสินค้าล่วงหน้า ลดปัญหาสินค้าหมดหรือค้างสต็อก", gradient: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" },
  { icon: Eye, name: "Visual Search Agent", desc: "ค้นหาด้วยรูปภาพอัจฉริยะ ลูกค้าถ่ายรูปแล้วหาสินค้าที่คล้ายกันได้ทันที", gradient: "from-pink-500 to-rose-500", glow: "shadow-pink-500/20" },
];

// Platform features
const platformFeatures = [
  { icon: Store, name: "Custom Store Builder", desc: "สร้างหน้าร้านด้วย JSON Editor" },
  { icon: Package, name: "Inventory Management", desc: "จัดการสต็อกสินค้าอัจฉริยะ" },
  { icon: CreditCard, name: "Secure Payment Gateways", desc: "รองรับ PromptPay, Stripe, LINE Pay" },
  { icon: Globe, name: "Global Shipping", desc: "เชื่อมต่อระบบขนส่งชั้นนำ" },
  { icon: Palette, name: "Design Management", desc: "ออกแบบธีมร้านค้าตามแบรนด์" },
  { icon: Lock, name: "Advanced Security", desc: "SSL, 2FA, Encryption ครบถ้วน" },
  { icon: BarChart3, name: "Inventory Forecasting", desc: "พยากรณ์ยอดขายด้วย AI" },
  { icon: Truck, name: "Shipping Integration", desc: "คำนวณค่าจัดส่งอัตโนมัติ" },
];

// Testimonials
const testimonials = [
  { name: "Craft & Co.", quote: "Zentra ช่วยเพิ่มยอดขายของเราได้ 30% ในเดือนแรก! AI Agent ทำงานได้เหมือนมีพนักงานอีกคน", rating: 5, role: "เจ้าของร้านงานฝีมือ" },
  { name: "TechGear Solutions", quote: "ระบบ AI Agent ทำงานได้เยี่ยม ลูกค้าพอใจมากที่ได้รับคำแนะนำตรงจุด ยอดขายเพิ่ม 45%", rating: 5, role: "ร้านอุปกรณ์เทคโนโลยี" },
  { name: "Fashion Hub", quote: "Dynamic Pricing ช่วยให้เราปรับราคาได้เหมาะสม ลูกค้ากลับมาซื้อซ้ำมากขึ้นเยอะเลย", rating: 5, role: "ร้านเสื้อผ้าออนไลน์" },
];

// Product Intelligence steps
const processSteps = [
  { icon: ScanLine, label: "สแกน", desc: "สแกนรายละเอียดสินค้า" },
  { icon: Brain, label: "วิเคราะห์", desc: "AI วิเคราะห์ข้อมูลเชิงลึก" },
  { icon: Database, label: "จดจำ", desc: "จัดเก็บในหน่วยความจำ AI" },
  { icon: Zap, label: "ประยุกต์ใช้", desc: "ใช้ข้อมูลเพิ่มยอดขาย" },
];

export default function LandingPage() {
  const [chatStep, setChatStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setChatStep(1), 800),
      setTimeout(() => setChatStep(2), 2200),
      setTimeout(() => setChatStep(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <SEOHead
        title="ZENTRA AI — แพลตฟอร์ม E-Commerce อัจฉริยะ ขับเคลื่อนด้วย AI"
        description="สร้างร้านค้าออนไลน์ที่ทันสมัยที่สุด ขับเคลื่อนด้วย AI 6 ตัว รองรับ PromptPay, Stripe, LINE OA ครบทุกฟีเจอร์ พร้อมเปิดขายได้ทันที เริ่มต้นฟรี"
        type="website"
      />

      {/* ===== 1. Navbar ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-xl" data-testid="navbar">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 via-cyan-400 to-sky-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-teal-500/20 animate-gradient-shift">Z</div>
            <span className="font-black text-lg tracking-tight text-white">ZENTRA AI</span>
          </div>
          <div className="hidden sm:block"><LiveFeed /></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/mall">
              <Button variant="ghost" data-testid="nav-mall" className="text-sm text-white/70 hover:text-white hover:bg-white/5">Shopping Mall</Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" data-testid="nav-login" className="text-sm text-white/70 hover:text-white hover:bg-white/5">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/auth">
              <Button data-testid="nav-signup" className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/20">เปิดร้านฟรี</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== 2. Hero Section — AI Agent ===== */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.03] via-transparent to-violet-500/[0.03]" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-transparent via-teal-500/20 to-transparent" />
        <div className="absolute top-10 right-1/3 w-px h-60 bg-gradient-to-b from-transparent via-violet-500/15 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left — AI Agent Chat */}
            <div className="order-2 lg:order-1 animate-slide-up">
              {/* AI Agent Avatar + Glow */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-500 flex items-center justify-center shadow-xl shadow-teal-500/30 animate-glow-pulse">
                    <Bot className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0a0f1a] flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Zentra AI Agent</h2>
                  <p className="text-emerald-400 text-xs flex items-center gap-1">
                    <Activity className="w-3 h-3" /> ออนไลน์ — พร้อมให้บริการ
                  </p>
                </div>
              </div>

              {/* Chat Bubbles */}
              <div className="space-y-3 mb-6">
                {chatStep >= 1 && (
                  <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md px-5 py-4 max-w-md animate-slide-up" data-testid="hero-chat-bubble">
                    <p className="text-white/90 text-sm leading-relaxed">
                      สวัสดีครับ! ผม <span className="text-teal-400 font-semibold">Zentra AI</span> ผู้ช่วยขายอัจฉริยะ วันนี้ช่วยอะไรได้บ้าง?
                    </p>
                  </div>
                )}
                {chatStep >= 2 && (
                  <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md px-5 py-4 max-w-md animate-slide-up" data-testid="hero-chat-bubble-2">
                    <p className="text-white/90 text-sm leading-relaxed">
                      ผมช่วยคุณ <span className="text-cyan-400 font-semibold">สร้างร้านค้าออนไลน์ใน 2 นาที</span> มี AI Agent 6 ตัว เพิ่มยอดขายถึง <span className="text-amber-400 font-bold">40%</span>
                    </p>
                  </div>
                )}
                {chatStep < 2 && chatStep >= 1 && (
                  <div className="bg-white/[0.04] rounded-2xl rounded-tl-md px-5 py-3 max-w-[120px]">
                    <TypingDots />
                  </div>
                )}
                {chatStep >= 3 && (
                  <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl rounded-tl-md px-5 py-4 max-w-md animate-slide-up" data-testid="hero-chat-cta">
                    <p className="text-white/80 text-xs mb-3">พร้อมเริ่มต้นแล้วหรือยัง?</p>
                    <Link href="/auth">
                      <Button data-testid="hero-cta" className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300">
                        <MessageCircle className="w-4 h-4 mr-1.5" /> เริ่มพูดคุย <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 stagger-children">
                <AnimatedStat value={50000} suffix="+" label="ร้านค้า" color="from-teal-400 to-cyan-400" />
                <AnimatedStat value={2000000} suffix="+" label="คำสั่งซื้อ" color="from-violet-400 to-fuchsia-400" />
                <AnimatedStat value={99} suffix=".9%" label="Uptime" color="from-emerald-400 to-green-400" />
                <AnimatedStat value={4} suffix=".9/5" label="Rating" color="from-amber-400 to-yellow-400" />
              </div>
            </div>

            {/* Right — Product Showcase */}
            <div className="order-1 lg:order-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-teal-400 font-medium">แนะนำเฉพาะสำหรับคุณโดย AI</span>
                </div>

                {/* Product cards */}
                <div className="space-y-3">
                  {mockProducts.map((p, i) => (
                    <div
                      key={p.name}
                      className="group relative bg-white/[0.04] border border-white/[0.08] hover:border-teal-500/40 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${300 + i * 150}ms` }}
                      data-testid={`hero-product-${i}`}
                    >
                      {/* Product icon placeholder */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-all duration-300">
                        <ShoppingBag className="w-7 h-7 text-teal-400/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white text-sm font-medium truncate">{p.name}</h4>
                          <Badge className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 text-[10px] border-teal-500/30 shrink-0">{p.tag}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-400 font-bold text-sm">{p.price}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-3 h-3 ${j < Math.floor(p.rating) ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
                            ))}
                            <span className="text-white/40 text-xs ml-1">{p.rating}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Decorative glow behind cards */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. Supercharged AI Agents ===== */}
      <section className="relative py-20" data-testid="agents-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1.5 border-teal-500/30 bg-teal-500/5">
              <Bot className="w-3 h-3 mr-1.5 text-teal-400" />
              <span className="text-teal-400">Supercharged AI Agents</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              AI Agent <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">6 ตัว</span> ทำงานให้คุณ 24/7
            </h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm">
              ทุก Agent เรียนรู้และปรับตัวตามพฤติกรรมลูกค้าของคุณ เพื่อเพิ่มยอดขายอย่างต่อเนื่อง
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {aiAgents.map((agent, i) => (
              <Card
                key={agent.name}
                className="bg-white/[0.02] border-white/[0.06] group hover:border-teal-500/30 transition-all duration-300 overflow-hidden relative animate-slide-up"
                data-testid={`agent-card-${i}`}
              >
                <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${agent.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:${agent.glow} group-hover:shadow-lg transition-all duration-300`}>
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{agent.name}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. Product Intelligence ===== */}
      <section className="relative py-20" data-testid="intelligence-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1.5 border-violet-500/30 bg-violet-500/5">
              <Brain className="w-3 h-3 mr-1.5 text-violet-400" />
              <span className="text-violet-400">Product Intelligence</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto leading-tight">
              Zentra <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">จดจำทุกรายละเอียดสินค้า</span>ของคุณ เพื่อนำไปสู่การขายที่ดีขึ้น
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Process Flow */}
            <div className="lg:col-span-3">
              {/* Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {processSteps.map((step, i) => (
                  <div key={step.label} className="text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }} data-testid={`process-step-${i}`}>
                    <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center mb-2">
                      <step.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="text-white font-medium text-xs">{step.label}</div>
                    <div className="text-white/40 text-[10px] mt-0.5">{step.desc}</div>
                    {i < processSteps.length - 1 && (
                      <div className="hidden sm:block absolute" />
                    )}
                  </div>
                ))}
              </div>

              {/* Arrows between steps (desktop) */}
              <div className="hidden sm:flex items-center justify-center gap-1 mb-8 -mt-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center">
                    <div className="w-16 h-px bg-gradient-to-r from-violet-500/30 to-violet-500/10" />
                    <ArrowRight className="w-3 h-3 text-violet-400/50 -ml-1" />
                    <div className="w-16" />
                  </div>
                ))}
              </div>

              {/* Mock memorized product cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 animate-slide-up" data-testid="memorized-card-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-medium">กล้องมิร์เรอร์เลส Pro</h4>
                      <p className="text-white/40 text-[10px]">สินค้า #1024</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">F/2.8 lens speed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">24MP sensor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">4K video benefits</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 animate-slide-up" style={{ animationDelay: "100ms" }} data-testid="memorized-card-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-medium">หูฟัง Studio Monitor</h4>
                      <p className="text-white/40 text-[10px]">สินค้า #2048</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">40mm driver unit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">Active Noise Cancelling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">MEMORIZED</Badge>
                      <span className="text-white/60 text-[10px]">30hr battery life</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active AI Agent Status Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 animate-slide-up" data-testid="ai-status-panel">
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Active AI Agent Status
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Product Recognition", status: "active", color: "bg-emerald-500" },
                    { name: "Recommendation Engine", status: "active", color: "bg-emerald-500" },
                    { name: "Inventory Forecast", status: "active", color: "bg-emerald-500" },
                    { name: "Dynamic Pricing", status: "standby", color: "bg-amber-500" },
                    { name: "Visual Search", status: "standby", color: "bg-amber-500" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          {item.status === "active" && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.color} opacity-75`} />}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${item.color}`} />
                        </span>
                        <span className="text-white/70 text-xs">{item.name}</span>
                      </div>
                      <Badge className={`text-[10px] ${item.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Usage metrics */}
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="text-white/40 text-[10px] mb-2">AI Processing Power</div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full w-[72%] bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-1000" />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-white/30 text-[10px]">72% utilized</span>
                    <span className="text-teal-400 text-[10px]">5/6 agents active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. Platform Features Grid ===== */}
      <section className="relative py-20" data-testid="features-section">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1.5 border-teal-500/30 bg-teal-500/5">
              <Zap className="w-3 h-3 mr-1.5 text-teal-400" />
              <span className="text-teal-400">Platform Features</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ทุกสิ่งที่คุณต้องการ<span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">ในแพลตฟอร์มเดียว</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
            {platformFeatures.map((feat, i) => (
              <div
                key={feat.name}
                className="group bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/20 rounded-xl p-4 text-center transition-all duration-300 animate-slide-up"
                data-testid={`feature-${i}`}
              >
                <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <feat.icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-white font-medium text-xs mb-1">{feat.name}</h3>
                <p className="text-white/40 text-[10px] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. Testimonials ===== */}
      <section className="relative py-20" data-testid="testimonials-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1.5 border-amber-500/30 bg-amber-500/5">
              <Star className="w-3 h-3 mr-1.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400">รีวิวจากลูกค้า</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ผู้ประกอบการ<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">ไว้วางใจ</span>เรา
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {testimonials.map((t, i) => (
              <Card
                key={t.name}
                className="bg-white/[0.02] border-white/[0.06] group hover:border-amber-500/20 transition-all duration-300 animate-slide-up overflow-hidden relative"
                data-testid={`testimonial-${i}`}
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5">
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Store className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-xs">{t.name}</div>
                      <div className="text-white/40 text-[10px]">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 7. Pricing ===== */}
      <section className="relative py-20" data-testid="pricing-section">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-white">แผนราคาที่เหมาะกับทุกธุรกิจ</h2>
            <p className="text-white/50 mt-2 text-sm">เริ่มฟรี อัปเกรดเมื่อพร้อม</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
            {[
              { name: "Free", price: "฿0", period: "ตลอดไป", features: ["1 ร้านค้า", "50 สินค้า", "100 AI Credits/เดือน", "SSL", "หน้าร้านออนไลน์"], highlight: false },
              { name: "Pro", price: "฿990", period: "/เดือน", features: ["5 ร้านค้า", "ไม่จำกัดสินค้า", "5,000 AI Credits/เดือน", "AI Agent ครบ 6 ตัว", "Custom Domain", "Priority Support"], highlight: true },
              { name: "Enterprise", price: "฿4,990", period: "/เดือน", features: ["ไม่จำกัดทุกอย่าง", "White-label", "Dedicated AI Server", "99.9% SLA", "Dedicated Account Manager"], highlight: false },
            ].map(p => (
              <Card key={p.name} className={`bg-white/[0.02] border-white/[0.06] animate-slide-up overflow-hidden relative transition-all duration-300 ${p.highlight ? "ring-2 ring-teal-500/60 shadow-xl shadow-teal-500/10" : "hover:border-white/[0.12]"}`} data-testid={`pricing-${p.name.toLowerCase()}`}>
                {p.highlight && (
                  <>
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-500" />
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-cyan-600 text-xs border-0 shadow-lg">ยอดนิยม</Badge>
                  </>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-white">{p.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{p.price}</span>
                    <span className="text-sm text-white/50">{p.period}</span>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth">
                    <Button
                      data-testid={`pricing-cta-${p.name.toLowerCase()}`}
                      className={`w-full mt-6 ${p.highlight ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40" : "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"}`}
                      variant={p.highlight ? "default" : "outline"}
                    >
                      {p.name === "Free" ? "เปิดร้านฟรี" : "เริ่มต้นเลย"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. CTA Section ===== */}
      <section className="relative py-20" data-testid="cta-section">
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-violet-500/5 to-fuchsia-500/5 rounded-3xl" />
          <div className="relative py-12 px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white">พร้อมที่จะยกระดับธุรกิจของคุณแล้วหรือยัง?</h2>
            <p className="text-white/50 mt-3 text-sm">ร่วมเป็นส่วนหนึ่งของอนาคตอีคอมเมิร์ซวันนี้</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link href="/auth">
                <Button data-testid="cta-signup" size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300">
                  <Flame className="w-4 h-4 mr-1.5" /> เริ่มต้นใช้งานฟรี <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Button data-testid="cta-newsletter" variant="outline" size="lg" className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.2]">
                <Send className="w-4 h-4 mr-1.5" /> สมัครรับข่าวสาร
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9. Footer ===== */}
      <footer className="border-t border-white/[0.06] py-14" data-testid="footer">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Column 1: Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 via-cyan-400 to-sky-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-teal-500/20">Z</div>
                <span className="font-black text-sm text-white">ZENTRA AI</span>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                แพลตฟอร์ม E-Commerce อัจฉริยะ ขับเคลื่อนด้วย AI 6 ตัว เพื่อยกระดับธุรกิจออนไลน์ของคุณ
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="text-white font-medium text-xs mb-3">Navigation</h4>
              <ul className="space-y-2">
                {["AI Agent", "Product Recognition", "Zentra & Data"].map(item => (
                  <li key={item}>
                    <span className="text-white/40 text-xs hover:text-teal-400 cursor-pointer transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Site Map */}
            <div>
              <h4 className="text-white font-medium text-xs mb-3">Site Map</h4>
              <ul className="space-y-2">
                {["Site Map", "Contact Us", "Cookies", "Privacy Policy"].map(item => (
                  <li key={item}>
                    <span className="text-white/40 text-xs hover:text-teal-400 cursor-pointer transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Social */}
            <div>
              <h4 className="text-white font-medium text-xs mb-3">Follow Us</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Youtube, label: "YouTube" },
                  { icon: Instagram, label: "Instagram" },
                ].map(social => (
                  <div
                    key={social.label}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-teal-500/10 hover:border-teal-500/30 transition-all cursor-pointer"
                    data-testid={`footer-social-${social.label.toLowerCase()}`}
                  >
                    <social.icon className="w-3.5 h-3.5 text-white/50 hover:text-teal-400" />
                  </div>
                ))}
                {/* X (Twitter) — no lucide icon, use text */}
                <div
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-teal-500/10 hover:border-teal-500/30 transition-all cursor-pointer"
                  data-testid="footer-social-x"
                >
                  <span className="text-white/50 text-xs font-bold">X</span>
                </div>
                {/* TikTok — use text */}
                <div
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-teal-500/10 hover:border-teal-500/30 transition-all cursor-pointer"
                  data-testid="footer-social-tiktok"
                >
                  <span className="text-white/50 text-[10px] font-bold">TT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright + Attribution */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span>&copy; 2026 Zentra AI - All Rights Reserved</span>
            <PerplexityAttribution />
          </div>
        </div>
      </footer>
    </div>
  );
}
