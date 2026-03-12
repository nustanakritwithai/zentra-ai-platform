import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Session token management
// Persist via URL hash fragment param (?t=...) since localStorage is blocked in sandboxed iframe
let _sessionToken: string | null = null;

function readTokenFromHash(): string | null {
  try {
    const hash = window.location.hash;
    // Hash format: #/path?t=TOKEN or just check for _zt param
    const match = hash.match(/[?&]_zt=([a-f0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function writeTokenToHash(token: string | null) {
  try {
    let hash = window.location.hash || "#/";
    // Remove existing _zt param
    hash = hash.replace(/[?&]_zt=[a-f0-9]+/, "");
    if (token) {
      // Append token
      const separator = hash.includes("?") ? "&" : "?";
      hash = hash + separator + "_zt=" + token;
    }
    // Clean up trailing ? or &
    hash = hash.replace(/[?&]$/, "");
    window.history.replaceState(null, "", hash);
  } catch {
    // Silent fail
  }
}

// Initialize from hash on load
_sessionToken = readTokenFromHash();

export function setSessionToken(token: string | null) {
  _sessionToken = token;
  writeTokenToHash(token);
}

export function getSessionToken(): string | null {
  // Also check hash in case it was updated externally
  if (!_sessionToken) {
    _sessionToken = readTokenFromHash();
  }
  return _sessionToken;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getSessionToken();
  if (token) {
    headers["x-session-token"] = token;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
