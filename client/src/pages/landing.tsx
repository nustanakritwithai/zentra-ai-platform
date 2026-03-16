import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Store,
  Wallet,
  Box,
  Truck,
  Users,
  BarChart3,
  MessageSquare,
  Palette,
  Megaphone,
  Sparkles,
  QrCode,
  Activity,
  Bot,
  CreditCard,
  CheckCircle2,
  Check,
  ChevronDown,
  Rocket,
  Play,
  UserPlus,
  PackagePlus,
  ArrowRight,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";

// ─── Animated counter ────────────────────────────────
function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ─── Scroll reveal ────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add("reveal-visible"); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealDiv({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-item ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Logo Component (uses real brand image) ────────────────────────────────
function AgentraLogo({ className = "w-9 h-9" }: { className?: string }) {
  return <img src="/icon-192.png" alt="Agentra" className={className + " object-contain"} />;
}

// ─── FAQ Accordion item ────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl transition-colors ${open ? "border-[#18E3C8]/30 bg-[#18E3C8]/[0.03]" : "border-border/50 bg-card/30"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left font-medium text-sm md:text-base">
        <span>{q}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ml-3 ${open ? "rotate-180 text-[#18E3C8]" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll to section (works with hash router)
  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Metric counters
  const sales = useAnimatedCounter(138336);
  const orders = useAnimatedCounter(327);
  const newCust = useAnimatedCounter(583);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ GLOBAL STYLES (inline for landing only) ═══ */}
      <style>{`
        .reveal-item { opacity: 0; transform: translateY(20px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .agentra-gradient { background: linear-gradient(135deg, #18E3C8, #29B6FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ai-gradient { background: linear-gradient(135deg, #29B6FF, #8B5CFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-gradient { background: linear-gradient(135deg, #18E3C8, #29B6FF); }
        .glow-teal { box-shadow: 0 0 30px rgba(24,227,200,.15); }
        .glow-ai { box-shadow: 0 0 30px rgba(139,92,255,.15); }
        .hero-grid { background-image: linear-gradient(rgba(29,48,74,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(29,48,74,.12) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 70% 50% at 50% 40%, black 30%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 40%, black 30%, transparent 80%); }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float { animation: float 4s ease-in-out infinite; }
        .float-delay { animation: float 5s ease-in-out infinite; animation-delay: 1s; }
        @keyframes pulse-dot { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(24,227,200,.4); } 50% { opacity:.7; box-shadow: 0 0 0 8px rgba(24,227,200,0); } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <AgentraLogo />
            <span className="text-lg font-bold agentra-gradient" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>Agentra</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo("features")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">ฟีเจอร์</button>
            <button onClick={() => scrollTo("ai-agents")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Agents</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">วิธีเริ่มต้น</button>
            <button onClick={() => scrollTo("pricing")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">แพ็กเกจ</button>
            <button onClick={() => scrollTo("faq")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">เข้าสู่ระบบ</Link>
            <Link href="/auth" className="btn-gradient text-[#050816] text-xs font-semibold px-4 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(24,227,200,.3)] transition-shadow">เริ่มสร้างร้านฟรี</Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
          {[
            { label: "ฟีเจอร์", id: "features" },
            { label: "AI Agents", id: "ai-agents" },
            { label: "วิธีเริ่มต้น", id: "how-it-works" },
            { label: "แพ็กเกจ", id: "pricing" },
            { label: "FAQ", id: "faq" },
          ].map(i => (
            <button key={i.id} onClick={() => scrollTo(i.id)} className="text-xl text-muted-foreground hover:text-foreground transition-colors">{i.label}</button>
          ))}
          <div className="flex flex-col gap-3 w-full max-w-[280px] mt-4">
            <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-center text-sm text-muted-foreground border border-border/50 rounded-lg py-3">เข้าสู่ระบบ</Link>
            <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-center btn-gradient text-[#050816] font-semibold rounded-lg py-3">เริ่มสร้างร้านฟรี</Link>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 px-4 sm:px-6 overflow-hidden">
        <div className="hero-grid absolute inset-0" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#18E3C8]/10 blur-[120px] -top-24 -left-24 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#8B5CFF]/[.06] blur-[120px] -bottom-12 -right-12 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#18E3C8] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#18E3C8] pulse-dot" />
              Commerce Operating System
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] xl:text-[3.6rem] font-bold leading-[1.15] tracking-tight" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>
              เปิดร้าน ขายของ รับเงิน<br className="hidden sm:block" />
              และเติบโตในระบบเดียว
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              Agentra รวมหน้าร้านสวย ระบบหลังบ้านอัจฉริยะ AI workflows และ payment infrastructure ไว้ครบ เพื่อให้เจ้าของร้านเปิดขายได้เร็วและขยายธุรกิจได้จริง
            </p>

            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <Link href="/auth" className="btn-gradient text-[#050816] font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:shadow-[0_0_30px_rgba(24,227,200,.3)] transition-all">
                <Rocket className="w-4 h-4" /> เริ่มสร้างร้านฟรี
              </Link>
              <Link href="/auth" className="bg-card/50 border border-border/50 text-foreground font-medium px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:border-[#18E3C8]/40 hover:bg-[#18E3C8]/[.06] transition-all">
                <Play className="w-4 h-4" /> ดูเดโมระบบ
              </Link>
            </div>

            <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
              {[
                { icon: Sparkles, label: "AI-Powered" },
                { icon: QrCode, label: "PromptPay Ready" },
                { icon: Store, label: "Multi-Store" },
                { icon: Activity, label: "Real-Time" },
              ].map(b => (
                <span key={b.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#18E3C8] bg-[#18E3C8]/[.06] border border-[#18E3C8]/15">
                  <b.icon className="w-3.5 h-3.5" /> {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px]">
              {/* Dashboard card */}
              <div className="bg-card/60 border border-border/50 rounded-2xl overflow-hidden glow-teal backdrop-blur-sm">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Agentra Dashboard</span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "ยอดขายวันนี้", ref: sales.ref, val: `฿${sales.count.toLocaleString()}`, change: "+12.5%" },
                      { label: "ออเดอร์", ref: orders.ref, val: orders.count.toLocaleString(), change: "+8.2%" },
                      { label: "ลูกค้าใหม่", ref: newCust.ref, val: newCust.count.toLocaleString(), change: "+15.1%" },
                    ].map(m => (
                      <div key={m.label} ref={m.ref as any} className="bg-background/60 border border-border/40 rounded-lg p-2.5 sm:p-3">
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">{m.label}</div>
                        <div className="text-sm font-bold tabular-nums mt-0.5">{m.val}</div>
                        <div className="text-[10px] font-semibold text-green-500">{m.change}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart bars */}
                  <div className="h-20 flex items-end gap-1.5">
                    {[40, 65, 50, 80, 70, 90, 85].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t transition-opacity ${i === 6 ? "opacity-100" : "opacity-30"}`} style={{ height: `${h}%`, background: "linear-gradient(180deg, #18E3C8, #29B6FF)" }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI panel floating */}
              <div className="absolute -bottom-4 -right-2 sm:bottom-8 sm:-right-4 w-52 float hidden sm:block">
                <div className="bg-background/95 border border-[#8B5CFF]/30 rounded-xl overflow-hidden glow-ai backdrop-blur-sm">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#8B5CFF]/15 text-[11px] text-muted-foreground">
                    <Bot className="w-3.5 h-3.5 text-[#8B5CFF]" />
                    <span>AI Agent</span>
                    <span className="ml-auto text-[10px] text-green-500 font-semibold">Active</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-[11px] text-muted-foreground">กำลังวิเคราะห์พฤติกรรมลูกค้า...</div>
                    <div className="text-[11px] text-[#8B5CFF] bg-[#8B5CFF]/[.06] p-2 rounded-lg border-l-2 border-[#8B5CFF]">
                      แนะนำ: เพิ่มส่วนลด 10% สินค้ายอดนิยม
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment widget floating */}
              <div className="absolute -top-2 -right-2 sm:top-4 sm:-right-2 float-delay hidden sm:block">
                <div className="bg-background/95 border border-green-500/30 rounded-xl px-3 py-2.5 flex items-center gap-3 backdrop-blur-sm" style={{ boxShadow: "0 8px 24px rgba(34,197,94,.1)" }}>
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-green-500 font-medium">รับเงินสำเร็จ</div>
                    <div className="text-sm font-bold tabular-nums">฿2,450</div>
                  </div>
                  <span className="text-[9px] text-[#18E3C8] bg-[#18E3C8]/10 px-2 py-0.5 rounded-full border border-[#18E3C8]/20">PromptPay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="border-y border-border/40 bg-card/30 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-8 flex-wrap justify-center">
          <span className="text-xs text-muted-foreground whitespace-nowrap">ร้านค้ากว่า 500+ ร้านเลือกใช้ Agentra</span>
          <div className="flex gap-8 opacity-40">
            {["🏪 ร้าน A", "🛍️ ร้าน B", "📦 ร้าน C", "🎯 ร้าน D", "⭐ ร้าน E"].map(s => (
              <span key={s} className="text-sm text-muted-foreground whitespace-nowrap">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <RevealDiv className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">ฟีเจอร์หลัก</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>
              ทุกเครื่องมือที่ร้านค้าต้องการ<br />รวมไว้ในที่เดียว
            </h2>
            <p className="text-muted-foreground">ไม่ต้องต่อ 10 แอปเข้าด้วยกัน Agentra ออกแบบให้ทุกฟีเจอร์ทำงานร่วมกันตั้งแต่แรก</p>
          </RevealDiv>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Featured card */}
            <RevealDiv className="md:col-span-2 lg:col-span-3 bg-card/40 border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-start gap-6 hover:border-[#18E3C8]/30 hover:shadow-[0_0_30px_rgba(24,227,200,.1)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#18E3C8]/10 border border-[#18E3C8]/20 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6 text-[#18E3C8]" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>Dashboard อัจฉริยะ</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">เห็นยอดขาย ออเดอร์ และพฤติกรรมลูกค้าแบบ Real-Time ทุกตัวเลขอัปเดตอัตโนมัติ ไม่ต้องกด refresh</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-[#8B5CFF] bg-[#8B5CFF]/10 border border-[#8B5CFF]/20 uppercase">AI-Powered</span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-[#29B6FF] bg-[#29B6FF]/10 border border-[#29B6FF]/20 uppercase">Live Analytics</span>
                </div>
              </div>
            </RevealDiv>

            {[
              { icon: Store, title: "สร้างหน้าร้านสวย", desc: "เลือกธีม ลากวาง ปรับแต่ง เปิดร้านได้ภายใน 5 นาที รองรับ SEO และ Mobile-First" },
              { icon: Wallet, title: "รับเงินทุกช่องทาง", desc: "PromptPay, QR Payment, บัตรเครดิต ทุกธุรกรรมเข้าระบบอัตโนมัติ ตรวจสอบได้ทันที", tag: "PromptPay Ready" },
              { icon: Box, title: "จัดการสินค้า", desc: "เพิ่มสินค้า จัดหมวดหมู่ ตั้งราคา จัดสต็อก ทุกอย่างจากหน้าจอเดียว" },
              { icon: Truck, title: "ออเดอร์และจัดส่ง", desc: "ระบบจัดการออเดอร์อัตโนมัติ ติดตามสถานะ แจ้งเตือนลูกค้าทุกขั้นตอน" },
              { icon: Users, title: "ระบบสมาชิก", desc: "สร้างฐานลูกค้า จัดกลุ่ม วิเคราะห์พฤติกรรม เพื่อการตลาดแม่นยำ" },
            ].map((f, i) => (
              <RevealDiv key={f.title} delay={i * 80} className="bg-card/40 border border-border/50 rounded-2xl p-6 hover:border-[#18E3C8]/30 hover:shadow-[0_0_30px_rgba(24,227,200,.1)] transition-all flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#18E3C8]/10 border border-[#18E3C8]/20 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-[#18E3C8]" />
                </div>
                <h3 className="text-base font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                {f.tag && (
                  <span className="self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-[#18E3C8] bg-[#18E3C8]/10 border border-[#18E3C8]/20 uppercase">{f.tag}</span>
                )}
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI AGENTS ═══ */}
      <section id="ai-agents" className="py-20 md:py-28 px-4 sm:px-6 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <RevealDiv className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">AI Agents</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>
              AI ที่ทำงานให้คุณ<br />ไม่ใช่แค่แนะนำ
            </h2>
            <p className="text-muted-foreground">Agentra มี AI Agent หลายตัวที่ทำงานอัตโนมัติ ตั้งแต่วิเคราะห์ข้อมูลไปจนถึงช่วยขาย</p>
          </RevealDiv>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, name: "Analytics Agent", desc: "วิเคราะห์ยอดขาย พฤติกรรมลูกค้า และแนวโน้มตลาดแบบ Real-Time พร้อมสรุปรายงานให้ทุกเช้า", tags: ["วิเคราะห์ข้อมูล", "พยากรณ์ยอดขาย", "แนะนำกลยุทธ์"] },
              { icon: MessageSquare, name: "Customer Agent", desc: "ตอบคำถามลูกค้าอัตโนมัติ 24/7 เข้าใจภาษาไทย ช่วยปิดการขาย และส่งต่อให้คนเมื่อจำเป็น", tags: ["ตอบแชท 24/7", "แนะนำสินค้า", "ปิดการขาย"] },
              { icon: Palette, name: "Design Agent", desc: "ช่วยจัดหน้าร้าน ออกแบบแบนเนอร์ และปรับแต่ง visual ให้ดึงดูดลูกค้ามากขึ้น", tags: ["จัดหน้าร้าน", "สร้างแบนเนอร์", "A/B Testing"] },
              { icon: Megaphone, name: "Marketing Agent", desc: "วางแผนโปรโมชัน สร้างคอนเทนต์ จัดแคมเปญอัตโนมัติ และวัดผลให้ครบลูป", tags: ["วางแผนแคมเปญ", "สร้างคอนเทนต์", "วัดผล ROI"] },
            ].map((a, i) => (
              <RevealDiv key={a.name} delay={i * 100} className="relative bg-card/40 border border-border/50 rounded-2xl p-6 flex flex-col gap-3 overflow-hidden hover:border-[#8B5CFF]/30 hover:-translate-y-0.5 transition-all group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#29B6FF] to-[#8B5CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,.5)] pulse-dot" />
                <div className="w-11 h-11 rounded-xl bg-[#8B5CFF]/10 border border-[#8B5CFF]/20 flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-[#8B5CFF]" />
                </div>
                <h3 className="text-base font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>{a.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                <div className="flex gap-2 flex-wrap">
                  {a.tags.map(t => (
                    <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full text-[#8B5CFF] bg-[#8B5CFF]/[.06] border border-[#8B5CFF]/15">{t}</span>
                  ))}
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <RevealDiv className="text-center max-w-xl mx-auto mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">เริ่มต้นง่ายมาก</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>เปิดร้านใน 3 ขั้นตอน</h2>
            <p className="text-muted-foreground">จากศูนย์สู่ร้านค้าที่พร้อมรับเงินจริง ใช้เวลาไม่ถึง 10 นาที</p>
          </RevealDiv>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {[
              { num: "01", icon: UserPlus, title: "สมัครและสร้างร้าน", desc: "กรอกข้อมูลร้าน เลือกหมวดหมู่ ตั้งชื่อร้าน เลือกธีม — เสร็จภายใน 2 นาที" },
              { num: "02", icon: PackagePlus, title: "เพิ่มสินค้าและตั้งค่า", desc: "เพิ่มสินค้า ตั้งราคา เชื่อมต่อ PromptPay — AI ช่วยจัดหน้าร้านให้อัตโนมัติ" },
              { num: "03", icon: Rocket, title: "เปิดร้านและเริ่มขาย", desc: "เผยแพร่หน้าร้าน แชร์ลิงก์ รับออเดอร์และเงินเข้าระบบทันที" },
            ].map((s, i) => (
              <RevealDiv key={s.num} delay={i * 120} className="flex flex-col items-center gap-3">
                {i > 0 && <ArrowRight className="w-5 h-5 text-muted-foreground/30 hidden md:block rotate-0 md:absolute" style={{ display: 'none' }} />}
                <div className="bg-card/40 border border-border/50 rounded-2xl p-6 text-center max-w-[300px] w-full hover:border-[#18E3C8]/20 hover:shadow-[0_0_30px_rgba(24,227,200,.08)] transition-all">
                  <div className="text-3xl font-black agentra-gradient opacity-30 mb-3">{s.num}</div>
                  <div className="w-14 h-14 rounded-full bg-[#18E3C8]/10 border border-[#18E3C8]/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-[#18E3C8]" />
                  </div>
                  <h3 className="font-bold mb-2" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && <ChevronDown className="w-5 h-5 text-muted-foreground/30 md:hidden" />}
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STOREFRONT PREVIEW ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-card/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <RevealDiv className="space-y-5">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">หน้าร้านตัวอย่าง</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>
              หน้าร้านที่สวย<br />และขายได้จริง
            </h2>
            <p className="text-muted-foreground leading-relaxed">ทุกหน้าร้านบน Agentra ถูกออกแบบมาให้แสดงผลสวยบนทุกอุปกรณ์ โหลดเร็ว และรองรับ SEO ตั้งแต่วันแรก</p>
            <ul className="space-y-3 mt-2">
              {["รองรับ Mobile-First", "SEO Optimized", "โหลดเร็วไม่เกิน 2 วินาที", "เชื่อมต่อ Social Media อัตโนมัติ"].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-[#18E3C8] shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </RevealDiv>

          <RevealDiv delay={200} className="flex justify-center">
            <div className="w-[260px] bg-card/60 border-2 border-border/50 rounded-[32px] p-3 shadow-2xl">
              <div className="w-24 h-5 bg-card rounded-b-xl mx-auto -mt-3 mb-2" />
              <div className="bg-background rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs font-semibold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>My Store</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="h-24 bg-gradient-to-r from-[#18E3C8]/20 to-[#29B6FF]/20" />
                <div className="grid grid-cols-2 gap-2 p-2.5">
                  {[
                    { name: "เสื้อยืด Premium", price: "฿590", grad: "from-[#18E3C8] to-[#29B6FF]" },
                    { name: "กระเป๋า Canvas", price: "฿890", grad: "from-[#29B6FF] to-[#8B5CFF]" },
                  ].map(p => (
                    <div key={p.name} className="space-y-1">
                      <div className={`h-16 rounded-lg bg-gradient-to-br ${p.grad}`} />
                      <div className="text-[10px] text-muted-foreground px-0.5">{p.name}</div>
                      <div className="text-xs font-bold text-[#18E3C8] px-0.5">{p.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <RevealDiv className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">แพ็กเกจ</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>
              เลือกแพ็กเกจที่ใช่<br />สำหรับธุรกิจของคุณ
            </h2>
            <p className="text-muted-foreground">เริ่มต้นฟรี อัปเกรดเมื่อพร้อม ไม่มีค่าธรรมเนียมแอบแฝง</p>
          </RevealDiv>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto items-start">
            {[
              { name: "Starter", desc: "เริ่มต้นสำหรับร้านค้าใหม่", price: "฿0", features: ["1 ร้านค้า", "50 สินค้า", "Dashboard พื้นฐาน", "PromptPay รับเงิน", "หน้าร้านสำเร็จรูป"], cta: "เริ่มต้นฟรี", popular: false },
              { name: "Professional", desc: "สำหรับร้านค้าที่ต้องการเติบโต", price: "฿990", features: ["3 ร้านค้า", "สินค้าไม่จำกัด", "AI Analytics Agent", "ทุกช่องทางรับเงิน", "หน้าร้าน Custom", "ระบบสมาชิก CRM", "รายงานขั้นสูง"], cta: "เลือกแพ็กเกจนี้", popular: true },
              { name: "Enterprise", desc: "สำหรับธุรกิจขนาดใหญ่", price: "฿2,990", features: ["ร้านค้าไม่จำกัด", "สินค้าไม่จำกัด", "AI Agent ครบทุกตัว", "API Access", "White-Label หน้าร้าน", "Priority Support", "ที่ปรึกษาส่วนตัว"], cta: "ติดต่อฝ่ายขาย", popular: false },
            ].map((p, i) => (
              <RevealDiv key={p.name} delay={i * 100} className={`relative bg-card/40 border rounded-2xl p-6 md:p-8 flex flex-col gap-5 transition-all hover:-translate-y-1 ${p.popular ? "border-[#18E3C8]/40 bg-gradient-to-b from-[#18E3C8]/[.04] to-card/40 glow-teal md:scale-[1.02]" : "border-border/50"} ${p.popular ? "order-first md:order-none" : ""}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-gradient text-[#050816] text-xs font-bold px-4 py-1 rounded-full">แนะนำ</span>
                )}
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold agentra-gradient tabular-nums">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/เดือน</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-[#18E3C8] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className={`text-center py-3 rounded-xl font-semibold text-sm transition-all ${p.popular ? "btn-gradient text-[#050816] hover:shadow-[0_0_20px_rgba(24,227,200,.3)]" : "bg-card/50 border border-border/50 text-foreground hover:border-[#18E3C8]/40 hover:bg-[#18E3C8]/[.06]"}`}>
                  {p.cta}
                </Link>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <RevealDiv className="text-center max-w-xl mx-auto mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">เสียงจากผู้ใช้จริง</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>ร้านค้าที่เติบโตด้วย Agentra</h2>
          </RevealDiv>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { stars: "★★★★★", text: "เปิดร้านได้จริงภายใน 10 นาที ระบบรับเงินผ่าน PromptPay ทำงานลื่นมาก ไม่ต้องไปต่อแอปอื่นเลย", name: "สมชาย ดีมาก", role: "เจ้าของร้าน Street Food Online", initial: "ส" },
              { stars: "★★★★★", text: "AI Analytics ช่วยให้เราเห็นข้อมูลที่ไม่เคยเห็นมาก่อน ยอดขายเพิ่มขึ้น 40% ในเดือนแรกที่ใช้", name: "นภาพร วิไลศักดิ์", role: "CEO, Fashion Forward TH", initial: "น" },
              { stars: "★★★★★", text: "Dashboard แบบ Real-Time ทำให้จัดการ 5 ร้านพร้อมกันได้ง่าย ระบบมันคิดแทนเราหลายอย่าง", name: "พิชัย ศรีสวัสดิ์", role: "ผู้จัดการ Multi-Brand Store", initial: "พ" },
            ].map((t, i) => (
              <RevealDiv key={t.name} delay={i * 100} className="bg-card/40 border border-border/50 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#18E3C8]/20 transition-colors">
                <div className="text-amber-500 text-sm tracking-wider">{t.stars}</div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto pt-2">
                  <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-[#050816] font-bold text-sm shrink-0">{t.initial}</div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <RevealDiv className="text-center mb-14 space-y-4">
            <span className="text-xs font-semibold text-[#18E3C8] uppercase tracking-wider">คำถามที่พบบ่อย</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>FAQ</h2>
          </RevealDiv>

          <div className="space-y-3">
            <FaqItem q="Agentra คืออะไร?" a="Agentra คือ Commerce Operating System สำหรับเจ้าของร้านยุคใหม่ ที่รวม storefront, dashboard, AI agents และระบบรับเงินไว้ในแพลตฟอร์มเดียว ให้คุณเปิดร้าน ขายของ รับเงิน และเติบโตได้โดยไม่ต้องใช้หลายแอป" />
            <FaqItem q="เริ่มต้นใช้งานฟรีจริงหรือ?" a="ฟรีจริง แพ็กเกจ Starter ไม่มีค่าใช้จ่ายรายเดือน คุณสามารถสร้างร้าน เพิ่มสินค้า และรับเงินผ่าน PromptPay ได้ทันที อัปเกรดเมื่อธุรกิจคุณพร้อมเติบโต" />
            <FaqItem q="รองรับช่องทางรับเงินอะไรบ้าง?" a="รองรับ PromptPay, Thai QR Payment, บัตรเครดิต/เดบิต, โอนผ่านธนาคาร และช่องทางอื่นๆ ทุกธุรกรรมเข้าระบบอัตโนมัติและตรวจสอบได้ทันที" />
            <FaqItem q="AI Agent ทำงานอย่างไร?" a="AI Agent ของ Agentra ทำงานอัตโนมัติตลอด 24 ชั่วโมง ตั้งแต่วิเคราะห์ข้อมูลขาย แนะนำโปรโมชัน ตอบแชทลูกค้า ไปจนถึงช่วยจัดหน้าร้าน ทุกตัวเรียนรู้จากข้อมูลร้านของคุณเพื่อให้ผลลัพธ์ที่แม่นยำ" />
            <FaqItem q="สามารถเปิดหลายร้านได้ไหม?" a="ได้ครับ แพ็กเกจ Professional รองรับ 3 ร้าน และ Enterprise รองรับไม่จำกัด ทุกร้านจัดการจาก Dashboard เดียว" />
            <FaqItem q="ต้องมีความรู้เรื่องโค้ดไหม?" a="ไม่ต้องเลย Agentra ออกแบบมาให้ใช้งานง่ายโดยไม่ต้องเขียนโค้ด ทุกอย่างจัดการผ่านหน้า Dashboard ที่ใช้งานง่าย สำหรับผู้ที่ต้องการความยืดหยุ่นเพิ่มเติม แพ็กเกจ Enterprise มี API Access" />
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#18E3C8]/[.08] blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>พร้อมเริ่มขายแล้วหรือยัง?</h2>
          <p className="text-muted-foreground leading-relaxed">
            เปิดร้านกับ Agentra วันนี้ ฟรี ไม่มีค่าธรรมเนียมแอบแฝง<br />เริ่มขายได้ภายใน 10 นาที
          </p>
          <div className="flex gap-4 justify-center flex-wrap pt-2">
            <Link href="/auth" className="btn-gradient text-[#050816] font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 hover:shadow-[0_0_30px_rgba(24,227,200,.3)] transition-all text-base">
              <Rocket className="w-5 h-5" /> เริ่มสร้างร้านฟรี
            </Link>
            <Link href="/auth" className="text-muted-foreground hover:text-foreground transition-colors px-6 py-3.5 text-base">
              พูดคุยกับทีมงาน
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card/30 border-t border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8 mb-8">
            <div className="lg:col-span-1 space-y-3">
              <Link href="/" className="flex items-center gap-2">
                <AgentraLogo className="w-8 h-8" />
                <span className="text-lg font-bold agentra-gradient" style={{ fontFamily: "'Prompt', 'Inter', sans-serif" }}>Agentra</span>
              </Link>
              <p className="text-sm text-muted-foreground">Your Commerce Operating System</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">ผลิตภัณฑ์</h4>
              <button onClick={() => scrollTo("features")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">หน้าร้าน</button>
              <button onClick={() => scrollTo("features")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">Dashboard</button>
              <button onClick={() => scrollTo("ai-agents")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">AI Agents</button>
              <button onClick={() => scrollTo("pricing")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">Payment</button>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">ทรัพยากร</h4>
              <button onClick={() => scrollTo("how-it-works")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">คู่มือเริ่มต้น</button>
              <button onClick={() => scrollTo("faq")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">FAQ</button>
              <Link href="/auth" className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">บล็อก</Link>
              <Link href="/auth" className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">Changelog</Link>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">บริษัท</h4>
              <button onClick={() => scrollTo("faq")} className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">เกี่ยวกับเรา</button>
              <a href="mailto:support@agentra.app" className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">ติดต่อ</a>
              <Link href="/auth" className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <Link href="/auth" className="block text-sm text-muted-foreground hover:text-[#18E3C8] transition-colors">เงื่อนไขการใช้งาน</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/40 gap-3">
            <span className="text-xs text-muted-foreground">© 2026 Agentra. All rights reserved.</span>
            <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-muted-foreground/80 transition-colors">
              Created with Perplexity Computer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
