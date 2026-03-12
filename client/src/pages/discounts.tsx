import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Tag, Copy, Check, Percent, DollarSign, Edit2, TicketPercent } from "lucide-react";
import type { Discount } from "@shared/schema";

function DiscountForm({ discount, onClose }: { discount?: Discount; onClose: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState(discount?.code || "");
  const [type, setType] = useState(discount?.type || "percentage");
  const [value, setValue] = useState(discount?.value || 10);
  const [minPurchase, setMinPurchase] = useState(discount?.minPurchase || 0);
  const [maxUses, setMaxUses] = useState(discount?.maxUses || 0);
  const [active, setActive] = useState(discount?.active !== false);
  const [expiresAt, setExpiresAt] = useState(discount?.expiresAt || "");

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "ZENTRA";
    for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { code: code.toUpperCase(), type, value, minPurchase: minPurchase || null, maxUses: maxUses || null, active, expiresAt: expiresAt || null };
      if (discount) {
        await apiRequest("PUT", `/api/discounts/${discount.id}`, payload);
      } else {
        await apiRequest("POST", "/api/discounts", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({ title: discount ? "อัปเดตโค้ดส่วนลดแล้ว" : "สร้างโค้ดส่วนลดแล้ว" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-1 block">โค้ดส่วนลด *</label>
        <div className="flex gap-2">
          <Input
            data-testid="input-discount-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SAVE20"
            className="bg-white/[0.04] border-white/[0.08] font-mono tracking-wider"
          />
          <Button variant="outline" onClick={generateCode} className="shrink-0 border-white/10 text-white/60 hover:text-white">
            สุ่มโค้ด
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-white/60 mb-1 block">ประเภท</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08]" data-testid="select-discount-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c14] border-white/10">
              <SelectItem value="percentage">เปอร์เซ็นต์ (%)</SelectItem>
              <SelectItem value="fixed">จำนวนเงินคงที่ (฿)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-white/60 mb-1 block">มูลค่าส่วนลด *</label>
          <div className="relative">
            <Input
              data-testid="input-discount-value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="bg-white/[0.04] border-white/[0.08] pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              {type === "percentage" ? "%" : "฿"}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-white/60 mb-1 block">ยอดขั้นต่ำ (฿)</label>
          <Input
            data-testid="input-discount-min"
            type="number"
            value={minPurchase}
            onChange={(e) => setMinPurchase(Number(e.target.value))}
            placeholder="0 = ไม่มีขั้นต่ำ"
            className="bg-white/[0.04] border-white/[0.08]"
          />
        </div>
        <div>
          <label className="text-sm text-white/60 mb-1 block">จำนวนครั้งที่ใช้ได้</label>
          <Input
            data-testid="input-discount-max-uses"
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(Number(e.target.value))}
            placeholder="0 = ไม่จำกัด"
            className="bg-white/[0.04] border-white/[0.08]"
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-white/60 mb-1 block">วันหมดอายุ</label>
        <Input
          data-testid="input-discount-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="bg-white/[0.04] border-white/[0.08]"
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={active} onCheckedChange={setActive} data-testid="switch-discount-active" />
        <label className="text-sm text-white/60">เปิดใช้งาน</label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-white/60">ยกเลิก</Button>
        <Button
          data-testid="btn-save-discount"
          onClick={() => mutation.mutate()}
          disabled={!code || !value || mutation.isPending}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
        >
          {mutation.isPending ? "กำลังบันทึก..." : (discount ? "อัปเดต" : "สร้างโค้ด")}
        </Button>
      </div>
    </div>
  );
}

export default function DiscountsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: discounts = [], isLoading } = useQuery<Discount[]>({ queryKey: ["/api/discounts"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({ title: "ลบโค้ดส่วนลดแล้ว" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await apiRequest("PUT", `/api/discounts/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
    },
  });

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TicketPercent className="w-6 h-6 text-teal-400" />
              โค้ดส่วนลด
            </h1>
            <p className="text-sm text-white/40 mt-1">จัดการโค้ดคูปอง / ส่วนลดสำหรับร้านของคุณ</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="btn-add-discount"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> สร้างโค้ดส่วนลด
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0c0c14] border-white/[0.08] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">สร้างโค้ดส่วนลดใหม่</DialogTitle>
              </DialogHeader>
              <DiscountForm onClose={() => setShowAdd(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">โค้ดทั้งหมด</p>
            <p className="text-2xl font-bold text-white mt-1">{discounts.length}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">กำลังใช้งาน</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{discounts.filter(d => d.active).length}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40">ใช้แล้ว (ครั้ง)</p>
            <p className="text-2xl font-bold text-teal-400 mt-1">{discounts.reduce((s, d) => s + (d.usedCount || 0), 0)}</p>
          </div>
        </div>

        {/* Discounts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <Tag className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">ยังไม่มีโค้ดส่วนลด</p>
            <p className="text-white/20 text-sm mt-1">สร้างโค้ดเพื่อกระตุ้นยอดขาย</p>
          </div>
        ) : (
          <div className="space-y-2">
            {discounts.map(d => (
              <div
                key={d.id}
                data-testid={`discount-item-${d.id}`}
                className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${d.active ? "bg-gradient-to-br from-teal-500/20 to-cyan-500/20" : "bg-white/[0.04]"}`}>
                  {d.type === "percentage" ? <Percent className={`w-5 h-5 ${d.active ? "text-teal-400" : "text-white/30"}`} /> : <DollarSign className={`w-5 h-5 ${d.active ? "text-teal-400" : "text-white/30"}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white/90 tracking-wider">{d.code}</span>
                    <button onClick={() => copyCode(d.id, d.code)} className="text-white/30 hover:text-white/60">
                      {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {!d.active && <Badge variant="outline" className="text-white/30 border-white/10 text-[10px]">ปิดใช้งาน</Badge>}
                    {d.expiresAt && new Date(d.expiresAt) < new Date() && (
                      <Badge variant="outline" className="text-red-400/60 border-red-400/20 text-[10px]">หมดอายุ</Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    ลด {d.type === "percentage" ? `${d.value}%` : `฿${d.value.toLocaleString()}`}
                    {d.minPurchase ? ` • ขั้นต่ำ ฿${d.minPurchase.toLocaleString()}` : ""}
                    {d.maxUses ? ` • ใช้ได้ ${d.maxUses} ครั้ง` : ""}
                    {d.usedCount ? ` • ใช้แล้ว ${d.usedCount} ครั้ง` : ""}
                  </p>
                </div>
                <Switch
                  checked={d.active ?? false}
                  onCheckedChange={(active) => toggleMutation.mutate({ id: d.id, active })}
                  data-testid={`toggle-discount-${d.id}`}
                />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditDiscount(d)}
                        className="h-8 w-8 p-0 text-white/40 hover:text-white"
                        data-testid={`btn-edit-discount-${d.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0c0c14] border-white/[0.08] text-white max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">แก้ไขโค้ดส่วนลด</DialogTitle>
                      </DialogHeader>
                      {editDiscount && editDiscount.id === d.id && (
                        <DiscountForm discount={editDiscount} onClose={() => setEditDiscount(null)} />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm("ลบโค้ดนี้?")) deleteMutation.mutate(d.id); }}
                    className="h-8 w-8 p-0 text-white/40 hover:text-red-400"
                    data-testid={`btn-del-discount-${d.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
