import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSessionToken } from "@/lib/queryClient";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, isLoginPending, isRegisterPending } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const result = await login({ email, password });
        // If user has a store, go to dashboard; otherwise onboarding
        if (result.storeId && result.storeId > 0) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } else {
        await register({ name, email, password });
        // New users always go to onboarding
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err?.message || "กรุณาลองใหม่", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(240,20%,4%)] p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 bg-white/[0.02] border-white/[0.06] backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg mb-3">
            Z
          </div>
          <CardTitle className="text-xl text-white/90">{isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}</CardTitle>
          <CardDescription className="text-white/40">{isLogin ? "เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ" : "เริ่มต้นสร้างร้านค้าออนไลน์ด้วย AI ฟรี"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-white/60">ชื่อ</label>
                <Input data-testid="input-name" placeholder="ชื่อของคุณ" value={name} onChange={e => setName(e.target.value)} required className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block text-white/60">อีเมล</label>
              <Input data-testid="input-email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-white/60">รหัสผ่าน</label>
              <Input data-testid="input-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20" />
            </div>
            <Button data-testid="btn-submit-auth" type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20" disabled={isLoginPending || isRegisterPending}>
              {isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีฟรี"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-white/40">
            {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
            <button data-testid="toggle-auth-mode" className="text-orange-400 hover:text-orange-300" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "สร้างบัญชีใหม่ เปิดร้านฟรี" : "เข้าสู่ระบบ"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
