import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, setSessionToken, getSessionToken } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface StoreInfo {
  id: number;
  name: string;
  slug: string;
  status: string;
  logo: string | null;
}

interface PlanInfo {
  name: string;
  maxStores: number;
  label: string;
  labelTh: string;
}

interface AuthData {
  user: User;
  storeId: number;
  stores: StoreInfo[];
  role: string;
  plan: PlanInfo;
}

export function useAuth() {
  const [activeStoreId, setActiveStoreId] = useState<number>(0);

  const { data, isLoading, refetch } = useQuery<AuthData | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = getSessionToken();
      if (!token) return null;
      try {
        const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
        const res = await fetch(
          `${API_BASE}/api/auth/me`,
          { headers: { "x-session-token": token } }
        );
        if (!res.ok) {
          if (res.status === 401) {
            setSessionToken(null);
          }
          return null;
        }
        const data = await res.json();
        if (data.storeId) setActiveStoreId(data.storeId);
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Re-check auth when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      const token = getSessionToken();
      if (token) {
        refetch();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", creds);
      const json = await res.json();
      if (json.token) setSessionToken(json.token);
      if (json.storeId) setActiveStoreId(json.storeId);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role?: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      const json = await res.json();
      if (json.token) setSessionToken(json.token);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch {}
      setSessionToken(null);
      setActiveStoreId(0);
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  // Switch active store
  const switchStore = useCallback(async (storeId: number) => {
    try {
      const res = await apiRequest("POST", "/api/stores/switch", { storeId });
      const json = await res.json();
      if (json.ok) {
        setActiveStoreId(storeId);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        // Invalidate all store-scoped queries
        await queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      }
      return json;
    } catch (err) {
      console.error("Failed to switch store:", err);
      return { ok: false };
    }
  }, []);

  const isAuthenticated = !!getSessionToken() && !!data?.user;

  return {
    user: data?.user || null,
    storeId: data?.storeId || activeStoreId,
    stores: data?.stores || [],
    plan: data?.plan || { name: "free", maxStores: 1, label: "Free", labelTh: "ฟรี" },
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    switchStore,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    setStoreId: setActiveStoreId,
  };
}
