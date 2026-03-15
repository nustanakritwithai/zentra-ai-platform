import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, ArrowRight, Trash2, ExternalLink, Package, ShoppingCart, Crown, Sparkles, AlertTriangle, Loader2, LogOut } from "lucide-react";
import type { Store as StoreType } from "@shared/schema";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

export default function StoresPage() {
  const { user, stores, plan, switchStore, logout, storeId } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreType | null>(null);

  // Fetch full store details
  const { data: fullStores = [], isLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/stores"],
  });

  const handleSelectStore = async (sid: number) => {
    const result = await switchStore(sid);
    if (result.ok) {
      toast({ title: "เปลี่ยนร้านค้าสำเร็จ" });
      navigate("/dashboard");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (sid: number) => {
      const res = await apiRequest("DELETE", `/api/stores/${sid}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "ลบร้านค้าสำเร็จ" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "ไม่สามารถลบร้านค้าได้", description: err?.message, variant: "destructive" });
    },
  });

  const canCreateMore = stores.length < plan.maxStores;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[hsl(240,20%,4%)] relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-violet-500/5" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                  <Store className="w-5 h-5" />
                </div>
                ร้านค้าของฉัน
              </h1>
              <p className="text-sm text-white/40 mt-1">
                สวัสดี <span className="text-teal-400">{user?.name}</span> — จัดการร้านค้าทั้งหมดของคุณ
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-teal-500/30 text-teal-400 bg-teal-500/5 px-3 py-1">
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                {plan.label} — {stores.length}/{plan.maxStores} ร้าน
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-red-400"
                onClick={() => { logout(); window.location.hash = "/"; }}
              >
                <LogOut className="w-4 h-4 mr-1.5" /> ออกจากระบบ
              </Button>
            </div>
          </div>

          {/* Store Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Existing Stores */}
              {fullStores.map((s) => (
                <Card
                  key={s.id}
                  data-testid={`store-card-${s.id}`}
                  className={`bg-white/[0.02] border-white/[0.06] hover:border-teal-500/30 transition-all cursor-pointer group relative overflow-hidden ${
                    storeId === s.id ? "ring-1 ring-teal-500/40 border-teal-500/30" : ""
                  }`}
                  onClick={() => handleSelectStore(s.id)}
                >
                  {storeId === s.id && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-[10px]">
                        กำลังใช้งาน
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 flex items-center justify-center text-teal-400 text-lg font-bold shrink-0 border border-teal-500/10 group-hover:from-teal-500/30 group-hover:to-cyan-600/30 transition-all">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base text-white/90 truncate">{s.name}</CardTitle>
                        <CardDescription className="text-xs text-teal-400/60">/{s.slug}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> สินค้า</span>
                        <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> ออเดอร์</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white/20 hover:text-red-400"
                          data-testid={`delete-store-${s.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(s);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Store Card */}
              <Card
                data-testid="create-new-store"
                className={`border-dashed bg-white/[0.01] transition-all ${
                  canCreateMore
                    ? "border-white/[0.08] hover:border-teal-500/30 cursor-pointer hover:bg-white/[0.03]"
                    : "border-white/[0.04] opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canCreateMore && navigate("/onboarding")}
              >
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-600/10 flex items-center justify-center mb-3 border border-teal-500/10">
                    <Plus className={`w-6 h-6 ${canCreateMore ? "text-teal-400" : "text-white/20"}`} />
                  </div>
                  <p className={`text-sm font-medium ${canCreateMore ? "text-white/70" : "text-white/30"}`}>
                    สร้างร้านค้าใหม่
                  </p>
                  {!canCreateMore && (
                    <p className="text-xs text-amber-400/70 mt-2 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> อัปเกรดเป็น Pro เพื่อเพิ่มร้าน
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && fullStores.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-600/10 flex items-center justify-center mb-4 border border-teal-500/10">
                <Sparkles className="w-10 h-10 text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-white/80 mb-2">ยังไม่มีร้านค้า</h2>
              <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
                สร้างร้านค้าแรกของคุณเพื่อเริ่มต้นขายสินค้าด้วย AI
              </p>
              <Button
                data-testid="btn-create-first-store"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20"
                onClick={() => navigate("/onboarding")}
              >
                <Sparkles className="w-4 h-4 mr-2" /> สร้างร้านค้าแรก
              </Button>
            </div>
          )}

          {/* Plan upgrade hint */}
          {!canCreateMore && fullStores.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white/70">คุณใช้ร้านค้าครบตามสิทธิ์แพ็กเกจ {plan.label} แล้ว</p>
                <p className="text-xs text-white/40 mt-0.5">อัปเกรดเป็น Pro เพื่อเปิดได้สูงสุด 5 ร้าน</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 shrink-0"
                onClick={() => navigate("/pricing")}
              >
                อัปเกรด
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="bg-[hsl(240,20%,8%)] border-white/[0.08]">
            <DialogHeader>
              <DialogTitle className="text-white/90 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> ยืนยันการลบร้านค้า
              </DialogTitle>
              <DialogDescription className="text-white/50">
                คุณต้องการลบร้านค้า <span className="text-white/80 font-medium">"{deleteTarget?.name}"</span> หรือไม่?
                สินค้า คำสั่งซื้อ และข้อมูลทั้งหมดจะถูกลบอย่างถาวร
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" className="text-white/50" onClick={() => setDeleteTarget(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                data-testid="confirm-delete-store"
                disabled={deleteMutation.isPending}
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                ลบร้านค้า
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
