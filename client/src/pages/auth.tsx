import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ShoppingBag, Store, Loader2 } from "lucide-react";
import { setSessionToken } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"seller" | "buyer">("seller");
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { login, register, isLoginPending, isRegisterPending } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check for OAuth callback token in URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]oauth_token=([a-f0-9]+\.[a-f0-9]+)/);
    if (match) {
      const token = match[1];
      setSessionToken(token);
      // Clean up the URL
      const cleanHash = hash.replace(/[?&]oauth_token=[a-f0-9.]+/, "").replace(/[?&]$/, "");
      window.history.replaceState(null, "", cleanHash || "#/");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "เข้าสู่ระบบสำเร็จ", description: "ยินดีต้อนรับ!" });
      navigate("/dashboard");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const result = await login({ email, password });
        if (result.storeId && result.storeId > 0) {
          navigate("/dashboard");
        } else {
          navigate(role === "buyer" ? "/mall" : "/onboarding");
        }
      } else {
        await register({ name, email, password, role });
        navigate(role === "buyer" ? "/mall" : "/onboarding");
      }
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err?.message || "กรุณาลองใหม่", variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("Google");
    try {
      // Get Google OAuth URL from our server
      const res = await fetch(`${API_BASE}/api/auth/google/url`);
      const data = await res.json();
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        toast({
          title: "Google Login",
          description: data.error || "ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อ Google ได้",
        variant: "destructive",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "Google") {
      handleGoogleLogin();
      return;
    }
    toast({
      title: `เข้าสู่ระบบด้วย ${provider}`,
      description: "ฟีเจอร์นี้จะเปิดให้บริการเร็วๆ นี้",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(240,20%,4%)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-violet-500/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 bg-white/[0.02] border-white/[0.06] backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg mb-3">
            Z
          </div>
          <CardTitle className="text-xl text-white/90">{isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}</CardTitle>
          <CardDescription className="text-white/40">{isLogin ? "เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ" : "เริ่มต้นสร้างร้านค้าออนไลน์ด้วย AI ฟรี"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Selection - Only for Register */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">คุณต้องการเป็น</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  data-testid="role-seller"
                  type="button"
                  onClick={() => setRole("seller")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    role === "seller"
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                      : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                  )}
                >
                  <Store className="w-6 h-6" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">ผู้ขาย</p>
                    <p className="text-[10px] mt-0.5 opacity-70">เปิดร้านค้า จัดการสินค้า</p>
                  </div>
                </button>
                <button
                  data-testid="role-buyer"
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    role === "buyer"
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                      : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                  )}
                >
                  <ShoppingBag className="w-6 h-6" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">ผู้ซื้อ</p>
                    <p className="text-[10px] mt-0.5 opacity-70">ค้นหา เปรียบเทียบ ซื้อสินค้า</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              data-testid="btn-google-login"
              variant="outline"
              className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white/80 h-11"
              onClick={() => handleSocialLogin("Google")}
              disabled={socialLoading === "Google"}
            >
              {socialLoading === "Google" ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              )}
              Google
            </Button>
            <Button
              data-testid="btn-facebook-login"
              variant="outline"
              className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white/80 h-11"
              onClick={() => handleSocialLogin("Facebook")}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </Button>
            <Button
              data-testid="btn-line-login"
              variant="outline"
              className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white/80 h-11"
              onClick={() => handleSocialLogin("LINE")}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="#06C755"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              LINE
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-white/[0.06]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[hsl(240,20%,5%)] px-3 text-xs text-white/30">
              หรือ
            </span>
          </div>

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
            <Button data-testid="btn-submit-auth" type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20" disabled={isLoginPending || isRegisterPending}>
              {isLogin ? "เข้าสู่ระบบ" : role === "buyer" ? "สมัครเป็นผู้ซื้อ" : "เปิดร้านค้าฟรี"}
            </Button>
          </form>
          <div className="mt-2 text-center text-sm text-white/40">
            {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
            <button data-testid="toggle-auth-mode" className="text-teal-400 hover:text-teal-300" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "สร้างบัญชีใหม่ เปิดร้านฟรี" : "เข้าสู่ระบบ"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
