import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getSessionToken } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requireStore = true }: { children: React.ReactNode; requireStore?: boolean }) {
  const [location, navigate] = useLocation();
  const token = getSessionToken();
  const { stores, isLoading, isAuthenticated } = useAuth();
  
  if (!token) {
    // No session — redirect to auth
    navigate("/auth");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">กำลังนำคุณไปหน้าเข้าสู่ระบบ...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  // If user has no stores and is trying to access store-dependent pages
  // Don't redirect if already on /stores or /onboarding or /pricing
  if (requireStore && isAuthenticated && stores.length === 0) {
    const allowedWithoutStore = ["/stores", "/onboarding", "/pricing", "/mall", "/marketplace", "/buyer-profile"];
    if (!allowedWithoutStore.includes(location)) {
      navigate("/stores");
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground text-sm">กรุณาสร้างร้านค้าก่อน...</div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
