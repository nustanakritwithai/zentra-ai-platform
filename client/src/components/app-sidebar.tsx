import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Store, Package, ShoppingCart, Users, Bot, MessageSquare, BookOpen, CreditCard, Settings, LogOut, Sun, Moon, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/store", icon: Store, label: "ร้านค้า" },
  { href: "/products", icon: Package, label: "สินค้า" },
  { href: "/orders", icon: ShoppingCart, label: "คำสั่งซื้อ" },
  { href: "/customers", icon: Users, label: "ลูกค้า" },
  { href: "/ai-agents", icon: Bot, label: "AI Agent" },
  { href: "/ai-chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/knowledge-base", icon: BookOpen, label: "Knowledge Base" },
  { href: "/pricing", icon: CreditCard, label: "แผนราคา" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        data-testid="sidebar-mobile-toggle"
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
          collapsed ? "w-[68px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] flex items-center justify-center text-white font-bold text-sm">
            Z
          </div>
          {!collapsed && <span className="font-bold text-base tracking-tight">ZENTRA AI</span>}
          <button
            data-testid="sidebar-collapse"
            className="ml-auto p-1 rounded hover:bg-sidebar-accent hidden md:block"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.href.slice(1)}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}</span>}
          </button>

          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {user.name.charAt(0)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.plan.toUpperCase()}</p>
                </div>
              )}
              <button data-testid="logout-btn" onClick={() => logout()} className="p-1 rounded hover:bg-sidebar-accent">
                <LogOut className="w-4 h-4 text-muted-foreground" />
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
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-[240px] min-h-screen">
        <div className="pt-14 px-4 pb-4 md:pt-6 md:px-6 md:pb-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
