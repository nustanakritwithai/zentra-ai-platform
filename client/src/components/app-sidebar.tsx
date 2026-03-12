import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { AuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Store, Package, ShoppingCart, Users, Bot, MessageSquare, BookOpen, CreditCard, LogOut, Sun, Moon, ChevronLeft, Menu, ExternalLink, Copy, Check, Zap, FolderOpen, TicketPercent, ShoppingBag, Link2, Globe, Plug, Warehouse, UserCheck, FileText, Monitor, PenTool, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Store as StoreType } from "@shared/schema";

const navItems = [
  // จัดการร้าน
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", group: "main" },
  { href: "/products", icon: Package, label: "สินค้า", group: "main" },
  { href: "/categories", icon: FolderOpen, label: "หมวดหมู่", group: "main" },
  { href: "/orders", icon: ShoppingCart, label: "คำสั่งซื้อ", group: "main" },
  { href: "/customers", icon: Users, label: "ลูกค้า", group: "main" },
  { href: "/discounts", icon: TicketPercent, label: "ส่วนลด", group: "main" },
  { href: "/inventory", icon: Warehouse, label: "คลังสินค้า", group: "main" },
  { href: "/employees", icon: UserCheck, label: "พนักงาน", group: "main" },
  // AI Tools
  { href: "/ai-agents", icon: Bot, label: "AI Agent", group: "ai" },
  { href: "/ai-chat", icon: MessageSquare, label: "AI Chat", group: "ai" },
  { href: "/knowledge-base", icon: BookOpen, label: "Knowledge Base", group: "ai" },
  { href: "/ai-generate", icon: Wand2, label: "AI Generate", group: "ai" },
  // ร้านค้า & การตลาด
  { href: "/store", icon: Store, label: "ตั้งค่าร้านค้า", group: "store" },
  { href: "/store-editor", icon: PenTool, label: "ตกแต่งร้าน", group: "store" },
  { href: "/pos", icon: Monitor, label: "POS ขายหน้าร้าน", group: "store" },
  { href: "/blog", icon: FileText, label: "Blog", group: "store" },
  { href: "/affiliate", icon: Link2, label: "Affiliate", group: "store" },
  // Marketplace & API
  { href: "/integrations", icon: Plug, label: "API เชื่อมต่อ", group: "marketplace" },
  { href: "/marketplace", icon: Globe, label: "Marketplace", group: "marketplace" },
  { href: "/mall", icon: ShoppingBag, label: "Shopping Mall", group: "marketplace" },
  { href: "/pricing", icon: CreditCard, label: "แผนราคา", group: "other" },
];

const groupLabels: Record<string, { label: string; icon?: any }> = {
  main: { label: "จัดการร้าน" },
  ai: { label: "AI Tools", icon: Zap },
  store: { label: "ร้านค้า & การตลาด", icon: Store },
  marketplace: { label: "Marketplace & API", icon: Globe },
  other: { label: "อื่นๆ" },
};

function AnimatedIcon({ icon: Icon, active, className }: { icon: any; active: boolean; className?: string }) {
  return (
    <div className={cn("relative", active && "animate-icon-active")}>
      <Icon className={cn("w-5 h-5 shrink-0 transition-all duration-300", active && "scale-110", className)} />
      {active && (
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-cyan-600/20 rounded-full blur-sm animate-pulse" />
      )}
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setMounted(true); }, []);

  const { data: stores = [] } = useQuery<StoreType[]>({ queryKey: ["/api/stores"] });
  const store = stores.length > 0 ? stores[0] : null;
  const storeUrl = store ? `${window.location.origin}/#/shop/${store.slug}` : null;

  const copyStoreLink = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl).catch(() => {});
      setCopied(true);
      toast({ title: "คัดลอกลิงก์แล้ว" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const groups = ["main", "ai", "store", "marketplace", "other"];

  return (
    <>
      <button
        data-testid="sidebar-mobile-toggle"
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-600/10 border border-teal-500/20 backdrop-blur-sm md:hidden hover:from-teal-500/20 hover:to-cyan-600/20 transition-all duration-300"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5 text-teal-400" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-out",
          "bg-gradient-to-b from-[hsl(240,20%,6%)] via-[hsl(240,15%,7%)] to-[hsl(240,20%,6%)]",
          "border-r border-white/[0.06]",
          collapsed ? "w-[68px]" : "w-[250px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-teal-500/0 via-teal-500/20 to-teal-500/0" />

        {/* Logo + Store Name */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/[0.03] to-transparent" />
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-teal-500/20 transition-transform duration-300 group-hover:scale-105">
              {store ? store.name.charAt(0).toUpperCase() : "Z"}
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
          </div>
          {!collapsed && (
            <div className={cn("flex-1 min-w-0 transition-opacity duration-300", mounted ? "opacity-100" : "opacity-0")}>
              <span className="font-bold text-sm tracking-tight truncate block bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                {store ? store.name : "ZENTRA AI"}
              </span>
              {store && (
                <span className="text-[10px] text-teal-400/50 truncate block">/{store.slug}</span>
              )}
            </div>
          )}
          <button data-testid="sidebar-collapse" className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.06] hidden md:flex items-center justify-center shrink-0 transition-colors" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft className={cn("w-4 h-4 text-white/40 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Store Link */}
        {store && !collapsed && (
          <div className="px-3 py-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Link href={`/shop/${store.slug}`}>
                <button data-testid="view-storefront" className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> ดูหน้าร้าน
                </button>
              </Link>
              <button data-testid="copy-store-link" onClick={copyStoreLink} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 ml-auto transition-colors">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
              </button>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto custom-scrollbar">
          {groups.map(groupKey => {
            const items = navItems.filter(i => i.group === groupKey);
            if (items.length === 0) return null;
            const groupInfo = groupLabels[groupKey];

            return (
              <div key={groupKey} className="mb-2">
                {!collapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20 flex items-center gap-1.5">
                    {groupInfo.icon && <groupInfo.icon className="w-3 h-3 text-teal-500/40" />}
                    {groupInfo.label}
                  </div>
                )}
                {collapsed && groupKey !== "main" && (
                  <div className="h-px mx-2 my-2 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          data-testid={`nav-${item.href.slice(1)}`}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                            active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {active && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/15 to-cyan-600/10 border border-teal-500/20" />
                          )}
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/50" />
                          )}
                          <div className="relative z-10 flex items-center gap-3">
                            <AnimatedIcon icon={item.icon} active={active} className={active ? "text-teal-400" : ""} />
                            {!collapsed && <span className="relative text-[13px]">{item.label}</span>}
                          </div>
                          {active && groupKey === "ai" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50 animate-pulse z-10" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] p-3 space-y-1 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/10 to-transparent" />
          <button data-testid="theme-toggle" onClick={toggle} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400/60" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}</span>}
          </button>
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02]">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-600/30 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0 ring-1 ring-teal-500/20">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[hsl(240,20%,6%)]" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white/80">{user.name}</p>
                  <p className="text-[10px] text-teal-400/50 truncate font-medium tracking-wider">{user.plan.toUpperCase()}</p>
                </div>
              )}
              <button data-testid="logout-btn" onClick={() => { logout(); window.location.hash = "/"; }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group">
                <LogOut className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="md:ml-[250px] min-h-screen">
          <div className="pt-14 px-4 pb-4 md:pt-6 md:px-6 md:pb-6 lg:p-8 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
