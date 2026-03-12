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
  new: { label: "ใหม่", class: "bg-blue-500/10 text-blue-500" },
  returning: { label: "ขาประจำ", class: "bg-primary/10 text-primary" },
  vip: { label: "VIP", class: "bg-secondary/10 text-secondary" },
  at_risk: { label: "เสี่ยงหาย", class: "bg-red-500/10 text-red-500" },
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
          <h1 className="text-xl font-bold">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground">{customers.length} คน</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input data-testid="search-customers" placeholder="ค้นหาลูกค้า..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {[{ key: "all", label: "ทั้งหมด" }, ...Object.entries(segmentStyles).map(([k, v]) => ({ key: k, label: v.label }))].map(s => (
              <button key={s.key} data-testid={`filter-seg-${s.key}`} onClick={() => setSegFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${segFilter === s.key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(customer => {
            const seg = segmentStyles[customer.segment || "new"];
            return (
              <Card key={customer.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{customer.name}</p>
                        <Badge className={`text-[10px] ${seg.class}`}>{seg.label}</Badge>
                      </div>
                      {customer.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{customer.email}</p>}
                      {customer.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">คำสั่งซื้อ</p>
                      <p className="font-bold">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ยอดซื้อรวม</p>
                      <p className="font-bold text-primary">฿{customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
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
