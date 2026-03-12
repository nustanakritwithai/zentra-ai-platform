import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, Pencil, Trash2, Star } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Product } from "@shared/schema";

const categories = ["ทั้งหมด", "อุปกรณ์อิเล็กทรอนิกส์", "เสื้อผ้า", "รองเท้า", "กระเป๋า"];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ทั้งหมด");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const createMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/products", data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDialogOpen(false); toast({ title: "เพิ่มสินค้าสำเร็จ" }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("PUT", `/api/products/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDialogOpen(false); setEditProduct(null); toast({ title: "อัปเดตสำเร็จ" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "ลบสำเร็จ" }); },
  });

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "ทั้งหมด" && p.category !== catFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">สินค้า</h1>
            <p className="text-sm text-white/50">{products.length} <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-xs font-medium">รายการ</span></p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditProduct(null); }}>
            <DialogTrigger asChild>
              <Button data-testid="btn-add-product" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 border-0"><Plus className="w-4 h-4 mr-1" />เพิ่มสินค้า</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-[hsl(240,15%,8%)] border-white/[0.06]">
              <DialogHeader><DialogTitle>{editProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle></DialogHeader>
              <ProductForm
                initial={editProduct}
                onSubmit={(data) => editProduct ? updateMut.mutate({ id: editProduct.id, ...data }) : createMut.mutate(data)}
                isPending={createMut.isPending || updateMut.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input data-testid="search-products" placeholder="ค้นหาสินค้า..." className="pl-9 bg-white/[0.04] border-white/[0.06] focus:border-orange-500/40 text-white/80 placeholder:text-white/30" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger data-testid="filter-category" className="w-full sm:w-[200px] bg-white/[0.04] border-white/[0.06]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl group hover:border-orange-500/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 overflow-hidden">
              <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-white/10" /></div>
                )}
                {product.aiScore && (
                  <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30">AI {product.aiScore}%</span>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button data-testid={`edit-product-${product.id}`} onClick={() => { setEditProduct(product); setDialogOpen(true); }} className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/[0.06] hover:bg-orange-500/20 hover:text-orange-400 text-white/70 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid={`delete-product-${product.id}`} onClick={() => deleteMut.mutate(product.id)} className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/[0.06] hover:bg-red-500/20 hover:text-red-400 text-white/70 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-white/30">{product.category}</p>
                <p className="font-medium text-sm truncate mt-0.5 text-white/80">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-orange-400 font-bold">฿{product.price.toLocaleString()}</span>
                  {product.comparePrice && <span className="text-xs text-white/30 line-through">฿{product.comparePrice.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-white/40">สต็อก: {product.stock}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${product.status === "active" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-white/[0.06] text-white/40 border-white/[0.06]"}`}>
                    {product.status === "active" ? "ใช้งาน" : product.status === "draft" ? "แบบร่าง" : "เก็บถาวร"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}

function ProductForm({ initial, onSubmit, isPending }: { initial?: Product | null; onSubmit: (d: any) => void; isPending: boolean }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(String(initial?.price || ""));
  const [comparePrice, setComparePrice] = useState(String(initial?.comparePrice || ""));
  const [category, setCategory] = useState(initial?.category || "อุปกรณ์อิเล็กทรอนิกส์");
  const [stock, setStock] = useState(String(initial?.stock || "0"));
  const [image, setImage] = useState(initial?.image || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, price: parseFloat(price), comparePrice: comparePrice ? parseFloat(comparePrice) : null, category, stock: parseInt(stock), image: image || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-sm font-medium block mb-1 text-white/70">ชื่อสินค้า</label><Input data-testid="input-product-name" className="bg-white/[0.04] border-white/[0.06]" value={name} onChange={e => setName(e.target.value)} required /></div>
      <div><label className="text-sm font-medium block mb-1 text-white/70">รายละเอียด</label><Input data-testid="input-product-desc" className="bg-white/[0.04] border-white/[0.06]" value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium block mb-1 text-white/70">ราคา (฿)</label><Input data-testid="input-product-price" className="bg-white/[0.04] border-white/[0.06]" type="number" value={price} onChange={e => setPrice(e.target.value)} required /></div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">ราคาเปรียบเทียบ</label><Input className="bg-white/[0.04] border-white/[0.06]" type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1 text-white/70">หมวดหมู่</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.06]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">สต็อก</label><Input data-testid="input-product-stock" className="bg-white/[0.04] border-white/[0.06]" type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
      </div>
      <div><label className="text-sm font-medium block mb-1 text-white/70">URL รูปภาพ</label><Input className="bg-white/[0.04] border-white/[0.06]" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." /></div>
      <Button data-testid="btn-save-product" type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 border-0" disabled={isPending}>{initial ? "บันทึก" : "เพิ่มสินค้า"}</Button>
    </form>
  );
}
