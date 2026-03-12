import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, FolderOpen, GripVertical, ImageIcon } from "lucide-react";
import type { Category } from "@shared/schema";

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [image, setImage] = useState(category?.image || "");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { name, slug: slug || name.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-"), description, image, sortOrder };
      if (category) {
        await apiRequest("PUT", `/api/categories/${category.id}`, payload);
      } else {
        await apiRequest("POST", "/api/categories", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: category ? "อัปเดตหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const res = await apiRequest("POST", "/api/upload", {
          fileData: base64,
          fileName: file.name,
          contentType: file.type,
          folder: "categories",
        });
        const data = await res.json();
        setImage(data.url);
        toast({ title: "อัปโหลดรูปแล้ว" });
      } catch (err: any) {
        toast({ title: "อัปโหลดไม่สำเร็จ", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-1 block">ชื่อหมวดหมู่ *</label>
        <Input
          data-testid="input-category-name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (!category) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-")); }}
          placeholder="เช่น เสื้อผ้าผู้หญิง"
          className="bg-white/[0.04] border-white/[0.08]"
        />
      </div>
      <div>
        <label className="text-sm text-white/60 mb-1 block">Slug (URL)</label>
        <Input
          data-testid="input-category-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto-generated"
          className="bg-white/[0.04] border-white/[0.08]"
        />
      </div>
      <div>
        <label className="text-sm text-white/60 mb-1 block">คำอธิบาย</label>
        <Textarea
          data-testid="input-category-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="รายละเอียดหมวดหมู่ (ไม่บังคับ)"
          className="bg-white/[0.04] border-white/[0.08] min-h-[80px]"
        />
      </div>
      <div>
        <label className="text-sm text-white/60 mb-1 block">รูปภาพหมวดหมู่</label>
        <div className="flex items-center gap-3">
          {image && (
            <img src={image} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
          )}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors text-sm text-white/60">
            <ImageIcon className="w-4 h-4" />
            {image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
          </label>
        </div>
      </div>
      <div>
        <label className="text-sm text-white/60 mb-1 block">ลำดับการเรียง</label>
        <Input
          data-testid="input-category-order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="bg-white/[0.04] border-white/[0.08] w-24"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-white/60">ยกเลิก</Button>
        <Button
          data-testid="btn-save-category"
          onClick={() => mutation.mutate()}
          disabled={!name || mutation.isPending}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
        >
          {mutation.isPending ? "กำลังบันทึก..." : (category ? "อัปเดต" : "เพิ่มหมวดหมู่")}
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "ลบหมวดหมู่แล้ว" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-orange-400" />
              หมวดหมู่สินค้า
            </h1>
            <p className="text-sm text-white/40 mt-1">จัดการหมวดหมู่สินค้าของร้านคุณ</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="btn-add-category"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> เพิ่มหมวดหมู่
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0c0c14] border-white/[0.08] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">เพิ่มหมวดหมู่ใหม่</DialogTitle>
              </DialogHeader>
              <CategoryForm onClose={() => setShowAdd(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">ยังไม่มีหมวดหมู่</p>
            <p className="text-white/20 text-sm mt-1">เพิ่มหมวดหมู่เพื่อจัดระเบียบสินค้าของคุณ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map(cat => (
                <div
                  key={cat.id}
                  data-testid={`category-item-${cat.id}`}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
                >
                  <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-orange-400/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{cat.name}</p>
                    <p className="text-xs text-white/30 truncate">/{cat.slug}{cat.description ? ` — ${cat.description}` : ""}</p>
                  </div>
                  <span className="text-xs text-white/20 tabular-nums">#{cat.sortOrder || 0}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditCat(cat)}
                          className="h-8 w-8 p-0 text-white/40 hover:text-white"
                          data-testid={`btn-edit-cat-${cat.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0c0c14] border-white/[0.08] text-white max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-white">แก้ไขหมวดหมู่</DialogTitle>
                        </DialogHeader>
                        {editCat && editCat.id === cat.id && (
                          <CategoryForm category={editCat} onClose={() => setEditCat(null)} />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm("ลบหมวดหมู่นี้?")) deleteMutation.mutate(cat.id); }}
                      className="h-8 w-8 p-0 text-white/40 hover:text-red-400"
                      data-testid={`btn-del-cat-${cat.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-500/10 rounded-xl p-4">
          <p className="text-sm text-white/50">
            💡 หมวดหมู่ช่วยให้ลูกค้าค้นหาสินค้าได้ง่ายขึ้น ลากเพื่อจัดลำดับ หรือกำหนดตัวเลขลำดับได้
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
