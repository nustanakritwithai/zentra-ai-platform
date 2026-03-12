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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(187,94%,43%)] to-[hsl(263,70%,58%)] flex items-center justify-center text-white font-bold text-lg mb-3">
            Z
          </div>
          <CardTitle className="text-xl">{isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}</CardTitle>
          <CardDescription>{isLogin ? "เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ" : "เริ่มต้นสร้างร้านค้าออนไลน์ด้วย AI ฟรี"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">ชื่อ</label>
                <Input data-testid="input-name" placeholder="ชื่อของคุณ" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">อีเมล</label>
              <Input data-testid="input-email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">รหัสผ่าน</label>
              <Input data-testid="input-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button data-testid="btn-submit-auth" type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoginPending || isRegisterPending}>
              {isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีฟรี"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
            <button data-testid="toggle-auth-mode" className="text-primary hover:underline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "สร้างบัญชีใหม่ เปิดร้านฟรี" : "เข้าสู่ระบบ"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
