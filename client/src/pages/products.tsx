import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, Pencil, Trash2, ImageIcon, Upload, AlertTriangle } from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Product, Category } from "@shared/schema";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ทั้งหมด");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const createMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/products", data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDialogOpen(false); toast({ title: "เพิ่มสินค้าสำเร็จ" }); },
    onError: (err: any) => { toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("PUT", `/api/products/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDialogOpen(false); setEditProduct(null); toast({ title: "อัปเดตสำเร็จ" }); },
    onError: (err: any) => { toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "ลบสำเร็จ" }); },
  });

  const catNames = ["ทั้งหมด", ...categories.map(c => c.name)];

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "ทั้งหมด" && p.category !== catFilter) return false;
    return true;
  });

  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5) && p.stock > 0);

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
            <DialogContent className="max-w-lg bg-[hsl(240,15%,8%)] border-white/[0.06] max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-white">{editProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle></DialogHeader>
              <ProductForm
                initial={editProduct}
                categories={categories}
                onSubmit={(data) => editProduct ? updateMut.mutate({ id: editProduct.id, ...data }) : createMut.mutate(data)}
                isPending={createMut.isPending || updateMut.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm text-amber-400 font-medium">สต็อกต่ำ</p>
              <p className="text-xs text-white/40">{lowStockProducts.map(p => `${p.name} (${p.stock})`).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input data-testid="search-products" placeholder="ค้นหาสินค้า..." className="pl-9 bg-white/[0.04] border-white/[0.06] focus:border-orange-500/40 text-white/80 placeholder:text-white/30" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger data-testid="filter-category" className="w-full sm:w-[200px] bg-white/[0.04] border-white/[0.06]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0c0c14] border-white/10">
              {catNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-medium bg-black/50 px-3 py-1 rounded-full">สินค้าหมด</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button data-testid={`edit-product-${product.id}`} onClick={() => { setEditProduct(product); setDialogOpen(true); }} className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/[0.06] hover:bg-orange-500/20 hover:text-orange-400 text-white/70 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid={`delete-product-${product.id}`} onClick={() => { if (confirm("ลบสินค้านี้?")) deleteMut.mutate(product.id); }} className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/[0.06] hover:bg-red-500/20 hover:text-red-400 text-white/70 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-white/30">{product.category}{product.sku ? ` · ${product.sku}` : ""}</p>
                <p className="font-medium text-sm truncate mt-0.5 text-white/80">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-orange-400 font-bold">฿{product.price.toLocaleString()}</span>
                  {product.comparePrice && <span className="text-xs text-white/30 line-through">฿{product.comparePrice.toLocaleString()}</span>}
                  {product.cost && <span className="text-xs text-white/20 ml-auto">ทุน ฿{product.cost.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className={`${product.stock <= (product.lowStockThreshold || 5) ? "text-amber-400" : "text-white/40"}`}>สต็อก: {product.stock}</span>
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

function ProductForm({ initial, categories, onSubmit, isPending }: { initial?: Product | null; categories: Category[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(String(initial?.price || ""));
  const [comparePrice, setComparePrice] = useState(String(initial?.comparePrice || ""));
  const [cost, setCost] = useState(String(initial?.cost || ""));
  const [category, setCategory] = useState(initial?.category || (categories.length > 0 ? categories[0].name : "ทั่วไป"));
  const [stock, setStock] = useState(String(initial?.stock || "0"));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(initial?.lowStockThreshold || "5"));
  const [sku, setSku] = useState(initial?.sku || "");
  const [barcode, setBarcode] = useState(initial?.barcode || "");
  const [weight, setWeight] = useState(String(initial?.weight || ""));
  const [image, setImage] = useState(initial?.image || "");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ไฟล์ใหญ่เกินไป", description: "ขนาดสูงสุด 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const res = await apiRequest("POST", "/api/upload", {
          fileData: base64,
          fileName: file.name,
          contentType: file.type,
          folder: "products",
        });
        const data = await res.json();
        setImage(data.url);
        toast({ title: "อัปโหลดรูปสำเร็จ" });
      } catch (err: any) {
        toast({ title: "อัปโหลดไม่สำเร็จ", description: err.message, variant: "destructive" });
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name, description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      cost: cost ? parseFloat(cost) : null,
      category,
      stock: parseInt(stock),
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      sku: sku || null,
      barcode: barcode || null,
      weight: weight ? parseFloat(weight) : null,
      image: image || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <label className="text-sm font-medium block mb-1 text-white/70">รูปภาพสินค้า</label>
        <div className="flex items-center gap-3">
          {image ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
              <img src={image} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImage("")} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-red-400 text-xs">×</button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white/20" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <label className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors text-sm ${uploading ? "opacity-50 pointer-events-none" : "text-white/60"}`}>
              <Upload className="w-4 h-4" />
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <Input value={image} onChange={e => setImage(e.target.value)} placeholder="หรือวาง URL รูปภาพ" className="bg-white/[0.04] border-white/[0.06] text-xs h-8" />
          </div>
        </div>
      </div>

      <div><label className="text-sm font-medium block mb-1 text-white/70">ชื่อสินค้า *</label><Input data-testid="input-product-name" className="bg-white/[0.04] border-white/[0.06] text-white" value={name} onChange={e => setName(e.target.value)} required /></div>
      <div><label className="text-sm font-medium block mb-1 text-white/70">รายละเอียด</label><Textarea data-testid="input-product-desc" className="bg-white/[0.04] border-white/[0.06] text-white min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} /></div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-sm font-medium block mb-1 text-white/70">ราคาขาย (฿) *</label><Input data-testid="input-product-price" className="bg-white/[0.04] border-white/[0.06] text-white" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">ราคาเปรียบเทียบ</label><Input className="bg-white/[0.04] border-white/[0.06] text-white" type="number" step="0.01" value={comparePrice} onChange={e => setComparePrice(e.target.value)} /></div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">ต้นทุน (฿)</label><Input data-testid="input-product-cost" className="bg-white/[0.04] border-white/[0.06] text-white" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} /></div>
      </div>

      {/* Category & Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1 text-white/70">หมวดหมู่</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.06]" data-testid="select-product-cat"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0c0c14] border-white/10">
              {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              {categories.length === 0 && <SelectItem value="ทั่วไป">ทั่วไป</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-sm font-medium block mb-1 text-white/70">สต็อก</label><Input data-testid="input-product-stock" className="bg-white/[0.04] border-white/[0.06] text-white" type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
          <div><label className="text-sm font-medium block mb-1 text-white/70">แจ้งเตือน</label><Input className="bg-white/[0.04] border-white/[0.06] text-white" type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} title="แจ้งเตือนเมื่อสต็อกต่ำกว่า" /></div>
        </div>
      </div>

      {/* SKU / Barcode / Weight */}
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-sm font-medium block mb-1 text-white/70">SKU</label><Input data-testid="input-product-sku" className="bg-white/[0.04] border-white/[0.06] text-white font-mono text-xs" value={sku} onChange={e => setSku(e.target.value)} placeholder="ABC-001" /></div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">Barcode</label><Input className="bg-white/[0.04] border-white/[0.06] text-white font-mono text-xs" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="8851234567890" /></div>
        <div><label className="text-sm font-medium block mb-1 text-white/70">น้ำหนัก (kg)</label><Input className="bg-white/[0.04] border-white/[0.06] text-white" type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} /></div>
      </div>

      {/* Profit preview */}
      {price && cost && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-500/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">กำไรต่อชิ้น</span>
            <span className={`font-bold ${(parseFloat(price) - parseFloat(cost)) > 0 ? "text-emerald-400" : "text-red-400"}`}>
              ฿{(parseFloat(price) - parseFloat(cost)).toLocaleString()} ({price ? ((parseFloat(price) - parseFloat(cost)) / parseFloat(price) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      )}

      <Button data-testid="btn-save-product" type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 border-0" disabled={isPending || uploading}>
        {isPending ? "กำลังบันทึก..." : (initial ? "บันทึก" : "เพิ่มสินค้า")}
      </Button>
    </form>
  );
}
