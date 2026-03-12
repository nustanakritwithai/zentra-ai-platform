import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Mail, Phone, Search } from "lucide-react";
import { useState } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Customer } from "@shared/schema";

const segmentStyles: Record<string, { label: string; class: string }> = {
  new: { label: "ใหม่", class: "bg-blue-500/10 text-blue-400" },
  returning: { label: "ขาประจำ", class: "bg-orange-500/10 text-orange-400" },
  vip: { label: "VIP", class: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20" },
  at_risk: { label: "เสี่ยงหาย", class: "bg-red-500/10 text-red-400" },
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (segFilter !== "all" && c.segment !== segFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">ลูกค้า</h1>
          <p className="text-sm text-white/50">{customers.length} คน</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input data-testid="search-customers" placeholder="ค้นหาลูกค้า..." className="pl-9 bg-white/[0.04] border-white/[0.06] focus:border-orange-500/40 text-white/80 placeholder:text-white/30" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {[{ key: "all", label: "ทั้งหมด" }, ...Object.entries(segmentStyles).map(([k, v]) => ({ key: k, label: v.label }))].map(s => (
              <button key={s.key} data-testid={`filter-seg-${s.key}`} onClick={() => setSegFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${segFilter === s.key ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(customer => {
            const seg = segmentStyles[customer.segment || "new"];
            return (
              <div key={customer.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-orange-500/20 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500/30 to-red-500/30 flex items-center justify-center text-orange-300 font-bold text-sm shrink-0 ring-1 ring-orange-500/20">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-white/90">{customer.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-transparent ${seg.class}`}>{seg.label}</span>
                      </div>
                      {customer.email && <p className="text-xs text-white/40 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{customer.email}</p>}
                      {customer.phone && <p className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                    <div>
                      <p className="text-xs text-white/40">คำสั่งซื้อ</p>
                      <p className="font-bold text-white/90">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">ยอดซื้อรวม</p>
                      <p className="font-bold text-orange-400">฿{customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
