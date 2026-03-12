import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, setSessionToken, getSessionToken } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  storeId: number;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [storeId, setStoreId] = useState<number>(0);

  const { data, isLoading } = useQuery<{ user: User; storeId: number } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = getSessionToken();
      if (!token) return null;
      try {
        const res = await fetch(
          ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") + "/api/auth/me",
          { headers: { "x-session-token": token } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.storeId) setStoreId(data.storeId);
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
  });

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", creds);
      const json = await res.json();
      if (json.token) setSessionToken(json.token);
      if (json.storeId) setStoreId(json.storeId);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
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
      setStoreId(0);
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const isAuthenticated = !!getSessionToken() && !!data?.user;

  return {
    user: data?.user || null,
    storeId: data?.storeId || storeId,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    setStoreId,
  };
}
