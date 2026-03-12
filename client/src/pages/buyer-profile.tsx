import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Package, Heart, ShoppingBag, Star, MapPin, LogOut } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

export default function BuyerProfilePage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"orders" | "wishlist" | "points">("orders");

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(240,20%,4%)] flex items-center justify-center p-4">
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/50 text-sm">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์</p>
            <a href="/#/auth" className="mt-4 inline-block text-teal-400 text-sm hover:text-teal-300">เข้าสู่ระบบ</a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(240,20%,4%)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500/10 via-transparent to-violet-500/10 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-600/30 flex items-center justify-center text-2xl font-bold text-teal-300 ring-2 ring-teal-500/20">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white/90">{user.name}</h1>
              <p className="text-sm text-white/40">{user.email}</p>
              <Badge variant="outline" className="mt-1 bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">
                สมาชิก
              </Badge>
            </div>
            <Button onClick={() => { logout(); window.location.hash = "/"; }} className="bg-white/[0.04] text-white/40 border border-white/[0.08] hover:bg-white/[0.08]">
              <LogOut className="w-4 h-4 mr-1" /> ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: "orders" as const, label: "คำสั่งซื้อ", icon: Package },
            { key: "wishlist" as const, label: "รายการโปรด", icon: Heart },
            { key: "points" as const, label: "แต้มสะสม", icon: Star },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-white/[0.02] text-white/40 border border-white/[0.06] hover:bg-white/[0.04]"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="space-y-3">
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">ยังไม่มีคำสั่งซื้อ</p>
              <a href="/#/mall" className="mt-3 inline-block text-teal-400 text-sm hover:text-teal-300">
                <ShoppingBag className="w-4 h-4 inline mr-1" /> ไปช้อปปิ้ง
              </a>
            </div>
          </div>
        )}

        {tab === "wishlist" && (
          <div className="py-16 text-center">
            <Heart className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">ยังไม่มีรายการโปรด</p>
          </div>
        )}

        {tab === "points" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white/90">0</p>
                <p className="text-sm text-white/50 mt-1">แต้มสะสมทั้งหมด</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <PerplexityAttribution />
    </div>
  );
}
