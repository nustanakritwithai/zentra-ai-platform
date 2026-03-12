import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getSessionToken } from "@/lib/queryClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const token = getSessionToken();
  
  if (!token) {
    // No session — redirect to auth
    navigate("/auth");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">กำลังนำคุณไปหน้าเข้าสู่ระบบ...</div>
      </div>
    );
  }

  return <>{children}</>;
}
