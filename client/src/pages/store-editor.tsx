import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Trash2,
  Settings,
  Plus,
  Image,
  Grid3X3,
  Award,
  Sparkles,
  LayoutTemplate,
  Smartphone,
  Wand2,
  GripVertical,
  Truck,
  Shield,
  Headphones,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import { getDefaultTemplate, STOREFRONT_TEMPLATES } from "@/lib/storefront-templates";
import type { Store, StorefrontLayout, StorefrontSection } from "@shared/schema";

const SECTION_TYPES: { type: StorefrontSection["type"]; label: string; icon: any; desc: string }[] = [
  { type: "hero", label: "Hero แบนเนอร์", icon: Image, desc: "แบนเนอร์หลักพร้อมสไลด์" },
  { type: "categories", label: "หมวดหมู่", icon: Grid3X3, desc: "แถบหมวดหมู่สินค้า" },
  { type: "productGrid", label: "สินค้า Grid", icon: LayoutTemplate, desc: "ตารางแสดงสินค้า" },
  { type: "benefitBar", label: "จุดเด่นร้าน", icon: Award, desc: "จุดเด่น 3 ข้อ" },
  { type: "aiRecommendation", label: "AI แนะนำ", icon: Sparkles, desc: "สินค้าแนะนำจาก AI" },
  { type: "footer", label: "ส่วนท้าย", icon: LayoutTemplate, desc: "Footer ร้านค้า" },
];

function generateId() {
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getDefaultPropsForType(type: StorefrontSection["type"]): Record<string, any> {
  switch (type) {
    case "hero":
      return {
        slides: [
          { title: "NEW ARRIVALS:", subtitle: "คอลเล็กชันใหม่", imageUrl: "", ctaText: "ช้อปเลย", ctaLink: "#products" },
        ],
        autoPlay: true,
        interval: 5000,
      };
    case "categories":
      return { displayMode: "pills" };
    case "productGrid":
      return { title: "สินค้าทั้งหมด", columns: 2, source: "all", maxItems: 8, showRating: true, showBadge: true };
    case "benefitBar":
      return {
        items: [
          { icon: "truck", title: "จัดส่งฟรี", description: "สั่งขั้นต่ำ ฿1,000" },
          { icon: "shield", title: "รับประกัน 1 ปี", description: "คืนสินค้าได้ 30 วัน" },
          { icon: "headphones", title: "ซัพพอร์ต 24/7", description: "ช่วยเหลือตลอดเวลา" },
        ],
      };
    case "aiRecommendation":
      return { title: "แนะนำสำหรับคุณ", source: "newest", maxItems: 6 };
    case "footer":
      return {
        showSocial: true,
        showLinks: true,
        links: [
          { label: "ติดต่อเรา", href: "#" },
          { label: "นโยบาย", href: "#" },
        ],
        socialLinks: { facebook: "#", instagram: "#", youtube: "#" },
      };
    default:
      return {};
  }
}

// ======= PROP EDITOR =======
function PropEditor({
  section,
  onUpdate,
}: {
  section: StorefrontSection;
  onUpdate: (props: Record<string, any>) => void;
}) {
  const p = section.props;

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <label className="text-xs text-white/50">สไลด์</label>
          {(p.slides || []).map((slide: any, i: number) => (
            <div key={i} className="space-y-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-white/30">สไลด์ {i + 1}</p>
              <Input
                data-testid={`hero-title-${i}`}
                value={slide.title}
                onChange={(e) => {
                  const slides = [...p.slides];
                  slides[i] = { ...slides[i], title: e.target.value };
                  onUpdate({ ...p, slides });
                }}
                placeholder="หัวข้อ"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
              />
              <Input
                value={slide.subtitle}
                onChange={(e) => {
                  const slides = [...p.slides];
                  slides[i] = { ...slides[i], subtitle: e.target.value };
                  onUpdate({ ...p, slides });
                }}
                placeholder="คำบรรยาย"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
              />
              <Input
                value={slide.ctaText}
                onChange={(e) => {
                  const slides = [...p.slides];
                  slides[i] = { ...slides[i], ctaText: e.target.value };
                  onUpdate({ ...p, slides });
                }}
                placeholder="ปุ่ม CTA"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
              />
              {(p.slides || []).length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 text-xs h-7"
                  onClick={() => {
                    const slides = p.slides.filter((_: any, j: number) => j !== i);
                    onUpdate({ ...p, slides });
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> ลบสไลด์
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white/[0.02] border-white/[0.06] text-white/50 text-xs h-8"
            onClick={() => {
              const slides = [...(p.slides || []), { title: "", subtitle: "", imageUrl: "", ctaText: "ช้อปเลย", ctaLink: "#products" }];
              onUpdate({ ...p, slides });
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> เพิ่มสไลด์
          </Button>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">เล่นอัตโนมัติ</label>
            <button
              data-testid="hero-autoplay"
              onClick={() => onUpdate({ ...p, autoPlay: !p.autoPlay })}
              className={`w-9 h-5 rounded-full transition-colors ${p.autoPlay ? "bg-teal-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.autoPlay ? "translate-x-4.5 ml-[18px]" : "translate-x-0.5 ml-[2px]"}`} />
            </button>
          </div>
        </div>
      );

    case "productGrid":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">ชื่อหัวข้อ</label>
            <Input
              data-testid="grid-title"
              value={p.title || ""}
              onChange={(e) => onUpdate({ ...p, title: e.target.value })}
              className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">คอลัมน์</label>
            <Select value={String(p.columns || 2)} onValueChange={(v) => onUpdate({ ...p, columns: Number(v) })}>
              <SelectTrigger data-testid="grid-columns" className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 คอลัมน์</SelectItem>
                <SelectItem value="3">3 คอลัมน์</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">แหล่งข้อมูล</label>
            <Select value={p.source || "all"} onValueChange={(v) => onUpdate({ ...p, source: v })}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
                <SelectItem value="bestSelling">ขายดี</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">จำนวนสินค้าสูงสุด</label>
            <Input
              data-testid="grid-max"
              type="number"
              value={p.maxItems || 8}
              onChange={(e) => onUpdate({ ...p, maxItems: Number(e.target.value) })}
              className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">แสดง Rating</label>
            <button
              onClick={() => onUpdate({ ...p, showRating: !p.showRating })}
              className={`w-9 h-5 rounded-full transition-colors ${p.showRating ? "bg-teal-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.showRating ? "ml-[18px]" : "ml-[2px]"}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">แสดง Badge</label>
            <button
              onClick={() => onUpdate({ ...p, showBadge: !p.showBadge })}
              className={`w-9 h-5 rounded-full transition-colors ${p.showBadge ? "bg-teal-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.showBadge ? "ml-[18px]" : "ml-[2px]"}`} />
            </button>
          </div>
        </div>
      );

    case "categories":
      return (
        <div className="space-y-3">
          <label className="text-xs text-white/50 mb-1 block">รูปแบบ</label>
          <Select value={p.displayMode || "pills"} onValueChange={(v) => onUpdate({ ...p, displayMode: v })}>
            <SelectTrigger data-testid="cat-mode" className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pills">Pill (แท็บ)</SelectItem>
              <SelectItem value="circles">Circle (วงกลม)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case "benefitBar":
      return (
        <div className="space-y-3">
          <label className="text-xs text-white/50">จุดเด่นของร้าน</label>
          {(p.items || []).map((item: any, i: number) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] space-y-2">
              <div className="flex items-center gap-2">
                <Select
                  value={item.icon || "truck"}
                  onValueChange={(v) => {
                    const items = [...p.items];
                    items[i] = { ...items[i], icon: v };
                    onUpdate({ ...p, items });
                  }}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-7 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="headphones">Headphones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = [...p.items];
                  items[i] = { ...items[i], title: e.target.value };
                  onUpdate({ ...p, items });
                }}
                placeholder="ชื่อ"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-7"
              />
              <Input
                value={item.description}
                onChange={(e) => {
                  const items = [...p.items];
                  items[i] = { ...items[i], description: e.target.value };
                  onUpdate({ ...p, items });
                }}
                placeholder="คำอธิบาย"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-7"
              />
            </div>
          ))}
        </div>
      );

    case "aiRecommendation":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">ชื่อหัวข้อ</label>
            <Input
              data-testid="ai-title"
              value={p.title || ""}
              onChange={(e) => onUpdate({ ...p, title: e.target.value })}
              className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">แหล่งข้อมูล</label>
            <Select value={p.source || "newest"} onValueChange={(v) => onUpdate({ ...p, source: v })}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="bestSelling">ขายดี</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">จำนวนสูงสุด</label>
            <Input
              type="number"
              value={p.maxItems || 6}
              onChange={(e) => onUpdate({ ...p, maxItems: Number(e.target.value) })}
              className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-8"
            />
          </div>
        </div>
      );

    case "footer":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">แสดง Social</label>
            <button
              onClick={() => onUpdate({ ...p, showSocial: !p.showSocial })}
              className={`w-9 h-5 rounded-full transition-colors ${p.showSocial ? "bg-teal-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.showSocial ? "ml-[18px]" : "ml-[2px]"}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">แสดงลิงก์</label>
            <button
              onClick={() => onUpdate({ ...p, showLinks: !p.showLinks })}
              className={`w-9 h-5 rounded-full transition-colors ${p.showLinks ? "bg-teal-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.showLinks ? "ml-[18px]" : "ml-[2px]"}`} />
            </button>
          </div>
          <label className="text-xs text-white/50">ลิงก์</label>
          {(p.links || []).map((link: any, i: number) => (
            <div key={i} className="flex gap-2">
              <Input
                value={link.label}
                onChange={(e) => {
                  const links = [...(p.links || [])];
                  links[i] = { ...links[i], label: e.target.value };
                  onUpdate({ ...p, links });
                }}
                placeholder="ชื่อ"
                className="bg-white/[0.04] border-white/[0.06] text-white text-xs h-7 flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 h-7 px-2"
                onClick={() => {
                  const links = (p.links || []).filter((_: any, j: number) => j !== i);
                  onUpdate({ ...p, links });
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white/[0.02] border-white/[0.06] text-white/50 text-xs h-7"
            onClick={() => {
              const links = [...(p.links || []), { label: "ลิงก์ใหม่", href: "#" }];
              onUpdate({ ...p, links });
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> เพิ่มลิงก์
          </Button>
        </div>
      );

    default:
      return <p className="text-xs text-white/30">ไม่มีตัวเลือกสำหรับ component นี้</p>;
  }
}

// ======= MAIN EDITOR =======
export default function StoreEditorPage() {
  const { toast } = useToast();
  const { data: stores = [] } = useQuery<Store[]>({ queryKey: ["/api/stores"] });
  const store = stores[0];

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: !!store,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: !!store,
  });

  const [layout, setLayout] = useState<StorefrontLayout | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Initialize layout from store data or default
  useEffect(() => {
    if (store && !layout) {
      const saved = (store as any).storefrontLayout;
      if (saved && saved.sections) {
        setLayout(saved as StorefrontLayout);
      } else {
        setLayout(getDefaultTemplate());
      }
    }
  }, [store, layout]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!store || !layout) return;
      const r = await apiRequest("PUT", `/api/stores/${store.id}`, {
        storefrontLayout: layout,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "บันทึกหน้าร้านค้าสำเร็จ" });
    },
  });

  // Layout mutation helpers
  const addSection = (type: StorefrontSection["type"]) => {
    if (!layout) return;
    const newSection: StorefrontSection = {
      id: generateId(),
      type,
      visible: true,
      props: getDefaultPropsForType(type),
    };
    setLayout({ ...layout, sections: [...layout.sections, newSection] });
  };

  const removeSection = (id: string) => {
    if (!layout) return;
    setLayout({ ...layout, sections: layout.sections.filter((s) => s.id !== id) });
    if (selectedSection === id) setSelectedSection(null);
  };

  const toggleVisibility = (id: string) => {
    if (!layout) return;
    setLayout({
      ...layout,
      sections: layout.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    });
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    if (!layout) return;
    const idx = layout.sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= layout.sections.length) return;
    const sections = [...layout.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    setLayout({ ...layout, sections });
  };

  const updateSectionProps = (id: string, props: Record<string, any>) => {
    if (!layout) return;
    setLayout({
      ...layout,
      sections: layout.sections.map((s) => (s.id === id ? { ...s, props } : s)),
    });
  };

  const selectedSectionData = layout?.sections.find((s) => s.id === selectedSection);
  const sectionLabel = (type: string) => SECTION_TYPES.find((t) => t.type === type)?.label || type;

  if (!layout) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Storefront Builder
            </h1>
            <p className="text-sm text-white/40">สร้างหน้าร้านค้าด้วย Drag & Drop</p>
          </div>
          <div className="flex items-center gap-2">
            {store?.slug && (
              <a
                href={`#/shop/${store.slug}`}
                target="_blank"
                data-testid="preview-link"
                className="text-xs text-teal-400 hover:text-teal-300 underline"
              >
                ดูหน้าร้านจริง
              </a>
            )}
            <Button
              data-testid="save-editor"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20"
            >
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              บันทึก
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: Settings (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Add Components */}
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-400" /> เพิ่ม Component
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECTION_TYPES.map((st) => {
                    const Icon = st.icon;
                    return (
                      <button
                        key={st.type}
                        data-testid={`add-${st.type}`}
                        onClick={() => addSection(st.type)}
                        className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] hover:border-teal-500/20 transition-all text-left"
                      >
                        <Icon className="w-4 h-4 text-teal-400 mb-1" />
                        <p className="text-xs font-medium text-white/70">{st.label}</p>
                        <p className="text-[10px] text-white/30">{st.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Current Sections */}
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-cyan-400" /> เซ็กชันปัจจุบัน
                </h3>
                {layout.sections.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">ยังไม่มีเซ็กชัน — เพิ่มจากด้านบน</p>
                ) : (
                  <div className="space-y-1.5">
                    {layout.sections.map((section, idx) => {
                      const stInfo = SECTION_TYPES.find((t) => t.type === section.type);
                      const Icon = stInfo?.icon || LayoutTemplate;
                      return (
                        <div
                          key={section.id}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                            selectedSection === section.id
                              ? "border-teal-500/30 bg-teal-500/5"
                              : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]",
                            !section.visible && "opacity-40"
                          )}
                          onClick={() => setSelectedSection(section.id === selectedSection ? null : section.id)}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-white/15 shrink-0" />
                          <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="text-xs font-medium text-white/70 flex-1 truncate">{sectionLabel(section.type)}</span>
                          {!section.visible && (
                            <Badge variant="outline" className="text-[9px] bg-white/[0.04] text-white/30 border-white/[0.06] h-4 px-1.5">ซ่อน</Badge>
                          )}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveSection(section.id, -1); }}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded-md hover:bg-white/[0.06] flex items-center justify-center disabled:opacity-20"
                            >
                              <ChevronUp className="w-3 h-3 text-white/40" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveSection(section.id, 1); }}
                              disabled={idx === layout.sections.length - 1}
                              className="w-6 h-6 rounded-md hover:bg-white/[0.06] flex items-center justify-center disabled:opacity-20"
                            >
                              <ChevronDown className="w-3 h-3 text-white/40" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id); }}
                              className="w-6 h-6 rounded-md hover:bg-white/[0.06] flex items-center justify-center"
                            >
                              {section.visible ? <Eye className="w-3 h-3 text-white/40" /> : <EyeOff className="w-3 h-3 text-white/20" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                              className="w-6 h-6 rounded-md hover:bg-red-500/10 flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3 text-red-400/60" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prop Editor */}
            {selectedSectionData && (
              <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-400" /> ตั้งค่า: {sectionLabel(selectedSectionData.type)}
                  </h3>
                  <PropEditor
                    section={selectedSectionData}
                    onUpdate={(props) => updateSectionProps(selectedSectionData.id, props)}
                  />
                </CardContent>
              </Card>
            )}

            {/* AI Readiness */}
            <Card className="bg-white/[0.02] border-white/[0.06] rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-violet-400" /> AI Readiness
                </h3>
                <div className="relative">
                  <Input
                    data-testid="ai-style-input"
                    placeholder="อธิบายสไตล์ที่ต้องการ เช่น 'minimal ขาว-ดำ แบบ luxury'"
                    className="bg-white/[0.03] border-white/[0.06] text-white text-xs h-9 pr-28"
                    disabled
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <Button
                      size="sm"
                      disabled
                      className="bg-violet-500/20 text-violet-300 border border-violet-500/20 h-7 text-xs relative group"
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> ให้ AI ช่วยจัดแต่ง
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-white/20 mt-2">Coming Soon — AI จะช่วยจัดเรียงและปรับแต่งหน้าร้านให้อัตโนมัติ</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview (40%) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-white/30" />
                <span className="text-xs font-medium text-white/40">ตัวอย่างมือถือ</span>
              </div>
              {/* Phone mockup */}
              <div className="mx-auto max-w-[320px]">
                <div className="rounded-[2rem] border-2 border-white/[0.08] bg-[#08080f] overflow-hidden shadow-2xl shadow-black/50">
                  {/* Phone notch */}
                  <div className="h-6 bg-[#08080f] flex items-center justify-center">
                    <div className="w-20 h-3 rounded-full bg-white/[0.06]" />
                  </div>
                  {/* Phone screen */}
                  <div className="h-[520px] overflow-y-auto scrollbar-hide">
                    {/* Mini header */}
                    <div className="sticky top-0 z-10 bg-[#08080f]/90 backdrop-blur-sm border-b border-white/[0.06] px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-[8px] font-bold">
                          {store?.name?.charAt(0) || "Z"}
                        </div>
                        <span className="text-[10px] font-bold text-white/80 truncate max-w-[100px]">{store?.name || "Store"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center">
                          <Settings className="w-2.5 h-2.5 text-white/30" />
                        </div>
                        <div className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center">
                          <ShoppingCart className="w-2.5 h-2.5 text-white/30" />
                        </div>
                      </div>
                    </div>
                    {/* Rendered storefront */}
                    <StorefrontRenderer
                      layout={layout}
                      store={store || {}}
                      products={products}
                      categories={categories}
                      currency={store?.currency || "THB"}
                      addToCart={() => {}}
                    />
                  </div>
                  {/* Phone bottom bar */}
                  <div className="h-4 bg-[#08080f] flex items-center justify-center">
                    <div className="w-24 h-1 rounded-full bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
