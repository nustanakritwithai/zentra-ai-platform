import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Session token management
// Use in-memory variable as primary, with a hidden iframe postMessage fallback
let _sessionToken: string | null = null;

// Try to read token from URL hash (legacy migration)
function readTokenFromHash(): string | null {
  try {
    const hash = window.location.hash;
    const match = hash.match(/[?&]_zt=([a-f0-9]+\.[a-f0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Clean legacy token from hash
function cleanTokenFromHash() {
  try {
    let hash = window.location.hash || "#/";
    hash = hash.replace(/[?&]_zt=[a-f0-9.]+/, "");
    hash = hash.replace(/[?&]$/, "");
    if (hash !== window.location.hash) {
      window.history.replaceState(null, "", hash);
    }
  } catch {}
}

// Cookie-based persistence (works in most iframe contexts, unlike localStorage)
function writeTokenToCookie(token: string | null) {
  try {
    if (token) {
      // Set cookie with SameSite=None; Secure for iframe context
      const isSecure = window.location.protocol === "https:";
      const cookieStr = `_zt=${token}; path=/; max-age=${86400 * 7}${isSecure ? "; SameSite=None; Secure" : "; SameSite=Lax"}`;
      document.cookie = cookieStr;
    } else {
      document.cookie = "_zt=; path=/; max-age=0";
    }
  } catch {}
}

function readTokenFromCookie(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_zt=([a-f0-9]+\.[a-f0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Initialize: try cookie first, then hash (for migration), then clean up hash
_sessionToken = readTokenFromCookie();
if (!_sessionToken) {
  _sessionToken = readTokenFromHash();
  if (_sessionToken) {
    // Migrate from hash to cookie
    writeTokenToCookie(_sessionToken);
    cleanTokenFromHash();
  }
}

export function setSessionToken(token: string | null) {
  _sessionToken = token;
  writeTokenToCookie(token);
  cleanTokenFromHash();
}

export function getSessionToken(): string | null {
  if (!_sessionToken) {
    _sessionToken = readTokenFromCookie();
  }
  if (!_sessionToken) {
    // Final fallback: check hash
    _sessionToken = readTokenFromHash();
    if (_sessionToken) {
      writeTokenToCookie(_sessionToken);
      cleanTokenFromHash();
    }
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
    if (res.status === 401) {
      // Session expired or invalid — clear token and redirect to auth
      setSessionToken(null);
      if (!window.location.hash.includes("/auth")) {
        window.location.hash = "#/auth";
      }
    }
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
