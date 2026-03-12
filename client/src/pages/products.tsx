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
            <h1 className="text-xl font-bold">สินค้า</h1>
            <p className="text-sm text-muted-foreground">{products.length} รายการ</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditProduct(null); }}>
            <DialogTrigger asChild>
              <Button data-testid="btn-add-product" className="bg-primary"><Plus className="w-4 h-4 mr-1" />เพิ่มสินค้า</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input data-testid="search-products" placeholder="ค้นหาสินค้า..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger data-testid="filter-category" className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className="border-border/50 overflow-hidden group">
              <div className="aspect-square bg-muted/30 relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/30" /></div>
                )}
                {product.aiScore && (
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-xs">AI {product.aiScore}%</Badge>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button data-testid={`edit-product-${product.id}`} onClick={() => { setEditProduct(product); setDialogOpen(true); }} className="p-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-card">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid={`delete-product-${product.id}`} onClick={() => deleteMut.mutate(product.id)} className="p-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <p className="font-medium text-sm truncate mt-0.5">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary font-bold">฿{product.price.toLocaleString()}</span>
                  {product.comparePrice && <span className="text-xs text-muted-foreground line-through">฿{product.comparePrice.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>สต็อก: {product.stock}</span>
                  <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {product.status === "active" ? "ใช้งาน" : product.status === "draft" ? "แบบร่าง" : "เก็บถาวร"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
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
      <div><label className="text-sm font-medium block mb-1">ชื่อสินค้า</label><Input data-testid="input-product-name" value={name} onChange={e => setName(e.target.value)} required /></div>
      <div><label className="text-sm font-medium block mb-1">รายละเอียด</label><Input data-testid="input-product-desc" value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium block mb-1">ราคา (฿)</label><Input data-testid="input-product-price" type="number" value={price} onChange={e => setPrice(e.target.value)} required /></div>
        <div><label className="text-sm font-medium block mb-1">ราคาเปรียบเทียบ</label><Input type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">หมวดหมู่</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><label className="text-sm font-medium block mb-1">สต็อก</label><Input data-testid="input-product-stock" type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
      </div>
      <div><label className="text-sm font-medium block mb-1">URL รูปภาพ</label><Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." /></div>
      <Button data-testid="btn-save-product" type="submit" className="w-full bg-primary" disabled={isPending}>{initial ? "บันทึก" : "เพิ่มสินค้า"}</Button>
    </form>
  );
}
