import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plug, Brain, MessageSquare, Share2, CreditCard, Database, Smartphone, CheckCircle, AlertCircle, Key, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const iconMap: Record<string, any> = { Brain, MessageSquare, Share2, CreditCard, Database, Smartphone };

const integrationColors: Record<string, { bg: string; icon: string; border: string }> = {
  ai: { bg: "from-violet-500/10 to-fuchsia-500/10", icon: "text-violet-400", border: "border-violet-500/20" },
  messaging: { bg: "from-emerald-500/10 to-green-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
  marketing: { bg: "from-sky-500/10 to-blue-500/10", icon: "text-sky-400", border: "border-sky-500/20" },
  payment: { bg: "from-amber-500/10 to-yellow-500/10", icon: "text-amber-400", border: "border-amber-500/20" },
  database: { bg: "from-teal-500/10 to-cyan-500/10", icon: "text-teal-400", border: "border-teal-500/20" },
};

export default function IntegrationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form states
  const [geminiKey, setGeminiKey] = useState("");
  const [lineChannelId, setLineChannelId] = useState("");
  const [lineSecret, setLineSecret] = useState("");
  const [lineToken, setLineToken] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaCatalogId, setMetaCatalogId] = useState("");
  const [stripeKey, setStripeKey] = useState("");

  const { data: intStatus } = useQuery<{ integrations: any[] }>({ queryKey: ["/api/integrations/status"] });
  const integrations = intStatus?.integrations || [];

  const saveGeminiMut = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/ai/gemini-key", { apiKey: geminiKey }); return r.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
      if (data.ok) toast({ title: "เชื่อมต่อ Gemini AI สำเร็จ" });
      else toast({ title: "API Key ไม่ถูกต้อง", variant: "destructive" });
    },
  });

  const saveLineMut = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/line/setup", { channelId: lineChannelId, channelSecret: lineSecret, accessToken: lineToken }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] }); toast({ title: "เชื่อมต่อ LINE สำเร็จ" }); },
  });

  const saveMetaMut = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/meta/setup", { pixelId: metaPixelId, accessToken: metaToken, catalogId: metaCatalogId }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] }); toast({ title: "เชื่อมต่อ Meta สำเร็จ" }); },
  });

  const saveStripeMut = useMutation({
    mutationFn: async () => { const r = await apiRequest("PUT", "/api/stores/0", { stripeKey }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] }); toast({ title: "เชื่อมต่อ Stripe สำเร็จ" }); },
  });

  const renderForm = (name: string) => {
    switch (name) {
      case "Gemini AI":
        return (
          <div className="space-y-3 pt-3">
            <Input data-testid="gemini-key-input" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="Gemini API Key (AIzaSy...)" className="bg-white/[0.03] border-white/[0.08] text-sm font-mono" />
            <Button data-testid="save-gemini" onClick={() => saveGeminiMut.mutate()} disabled={!geminiKey || saveGeminiMut.isPending} className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm">
              {saveGeminiMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Key className="w-3 h-3 mr-1" />} บันทึก
            </Button>
          </div>
        );
      case "LINE Official Account":
        return (
          <div className="space-y-3 pt-3">
            <Input data-testid="line-channel" value={lineChannelId} onChange={e => setLineChannelId(e.target.value)} placeholder="Channel ID" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Input data-testid="line-secret" value={lineSecret} onChange={e => setLineSecret(e.target.value)} placeholder="Channel Secret" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Input data-testid="line-token" value={lineToken} onChange={e => setLineToken(e.target.value)} placeholder="Access Token" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Button data-testid="save-line" onClick={() => saveLineMut.mutate()} disabled={!lineChannelId || !lineSecret || saveLineMut.isPending} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm">
              {saveLineMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Key className="w-3 h-3 mr-1" />} บันทึก
            </Button>
          </div>
        );
      case "Meta / Facebook":
        return (
          <div className="space-y-3 pt-3">
            <Input data-testid="meta-pixel" value={metaPixelId} onChange={e => setMetaPixelId(e.target.value)} placeholder="Meta Pixel ID" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Input data-testid="meta-token" value={metaToken} onChange={e => setMetaToken(e.target.value)} placeholder="Access Token" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Input data-testid="meta-catalog" value={metaCatalogId} onChange={e => setMetaCatalogId(e.target.value)} placeholder="Catalog ID (สำหรับ Product Feed)" className="bg-white/[0.03] border-white/[0.08] text-sm" />
            <Button data-testid="save-meta" onClick={() => saveMetaMut.mutate()} disabled={!metaPixelId || saveMetaMut.isPending} className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-sm">
              {saveMetaMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Key className="w-3 h-3 mr-1" />} บันทึก
            </Button>
          </div>
        );
      case "Stripe":
        return (
          <div className="space-y-3 pt-3">
            <Input data-testid="stripe-key" value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="Stripe Secret Key (sk_...)" className="bg-white/[0.03] border-white/[0.08] text-sm font-mono" />
            <Button data-testid="save-stripe" onClick={() => saveStripeMut.mutate()} disabled={!stripeKey || saveStripeMut.isPending} className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm">
              {saveStripeMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Key className="w-3 h-3 mr-1" />} บันทึก
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">API & การเชื่อมต่อ</h1>
            <p className="text-sm text-white/50">เชื่อมต่อบริการภายนอกเพื่อเพิ่มประสิทธิภาพร้านค้า</p>
          </div>
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Plug className="w-3 h-3" /> {integrations.filter(i => i.connected).length}/{integrations.length} เชื่อมต่อ
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map(int => {
            const Icon = iconMap[int.icon] || Plug;
            const color = integrationColors[int.type] || integrationColors.database;
            const expanded = expandedId === int.name;
            const hasForm = ["Gemini AI", "LINE Official Account", "Meta / Facebook", "Stripe"].includes(int.name);

            return (
              <Card key={int.name} className={cn("bg-white/[0.02] border border-white/[0.06] rounded-2xl transition-all", expanded && `hover:${color.border}`)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", color.bg)}>
                      <Icon className={cn("w-6 h-6", color.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white/90">{int.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        {int.connected ? (
                          <><CheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400">เชื่อมต่อแล้ว</span></>
                        ) : (
                          <><AlertCircle className="w-3 h-3 text-white/30" /><span className="text-xs text-white/30">ยังไม่เชื่อมต่อ</span></>
                        )}
                      </div>
                    </div>
                    {hasForm && (
                      <button data-testid={`expand-${int.name}`} onClick={() => setExpandedId(expanded ? null : int.name)} className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                        {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                      </button>
                    )}
                  </div>
                  {expanded && renderForm(int.name)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
