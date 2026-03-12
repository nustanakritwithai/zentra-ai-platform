import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { Sparkles, FileText, Image, Wand2, Copy, Loader2, RefreshCw, Zap, BookOpen, ShoppingBag, MessageSquare, PenTool, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const textTemplates = [
  { id: "product_desc", label: "คำอธิบายสินค้า", icon: ShoppingBag, color: "text-teal-400", prompt: "เขียนคำอธิบายสินค้าที่น่าสนใจสำหรับ: " },
  { id: "blog_post", label: "บทความบล็อก", icon: BookOpen, color: "text-violet-400", prompt: "เขียนบทความบล็อกเรื่อง: " },
  { id: "social_post", label: "โพสต์โซเชียล", icon: Megaphone, color: "text-pink-400", prompt: "เขียนโพสต์โซเชียลมีเดียสำหรับ: " },
  { id: "email_marketing", label: "อีเมลการตลาด", icon: MessageSquare, color: "text-amber-400", prompt: "เขียนอีเมลการตลาดเรื่อง: " },
  { id: "seo_content", label: "เนื้อหา SEO", icon: PenTool, color: "text-emerald-400", prompt: "เขียนเนื้อหาที่เหมาะกับ SEO เรื่อง: " },
  { id: "ad_copy", label: "ข้อความโฆษณา", icon: Zap, color: "text-sky-400", prompt: "เขียนข้อความโฆษณาสำหรับ: " },
];

const imageStyles = [
  { id: "product_photo", label: "ภาพสินค้า" },
  { id: "banner", label: "แบนเนอร์" },
  { id: "social_graphic", label: "กราฟิกโซเชียล" },
  { id: "logo", label: "โลโก้" },
  { id: "illustration", label: "ภาพประกอบ" },
];

export default function AiGeneratePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("text");
  
  // Text generation state
  const [selectedTemplate, setSelectedTemplate] = useState("product_desc");
  const [textPrompt, setTextPrompt] = useState("");
  const [textTone, setTextTone] = useState("professional");
  const [textLength, setTextLength] = useState("medium");
  const [generatedText, setGeneratedText] = useState("");
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("product_photo");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const textGenMut = useMutation({
    mutationFn: async () => {
      const template = textTemplates.find(t => t.id === selectedTemplate);
      const fullPrompt = `${template?.prompt || ""}${textPrompt}\n\nTone: ${textTone === "professional" ? "มืออาชีพ สุภาพ" : textTone === "casual" ? "สบายๆ เป็นกันเอง" : textTone === "persuasive" ? "โน้มน้าว กระตุ้นให้ซื้อ" : "สนุก ตื่นเต้น"}\nLength: ${textLength === "short" ? "สั้นกระชับ 2-3 ประโยค" : textLength === "medium" ? "ปานกลาง 1-2 ย่อหน้า" : "ยาว ละเอียด 3-5 ย่อหน้า"}\nLanguage: Thai`;
      const r = await apiRequest("POST", "/api/ai-generate/text", { prompt: fullPrompt });
      return r.json();
    },
    onSuccess: (data) => {
      setGeneratedText(data.text || data.reply || "ไม่สามารถสร้างเนื้อหาได้");
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const imageGenMut = useMutation({
    mutationFn: async () => {
      const style = imageStyles.find(s => s.id === imageStyle);
      const fullPrompt = `${style?.label}: ${imagePrompt}`;
      const r = await apiRequest("POST", "/api/ai-generate/image", { prompt: fullPrompt, style: imageStyle });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        toast({ title: "สร้างรูปภาพไม่สำเร็จ", description: data.error || "กรุณาลองใหม่", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const copyText = () => {
    navigator.clipboard.writeText(generatedText);
    toast({ title: "คัดลอกเนื้อหาแล้ว" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-400" />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">AI Content Generator</span>
          </h1>
          <p className="text-sm text-white/40">สร้างเนื้อหาและรูปภาพด้วย Gemini AI อัตโนมัติ</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/[0.04] border border-white/[0.06]">
            <TabsTrigger value="text" className="data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-400 gap-1.5">
              <FileText className="w-4 h-4" /> สร้างข้อความ
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-pink-500/15 data-[state=active]:text-pink-400 gap-1.5">
              <Image className="w-4 h-4" /> สร้างรูปภาพ
            </TabsTrigger>
          </TabsList>

          {/* Text Generation */}
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Panel */}
              <div className="space-y-4">
                {/* Template Selector */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white/70">เลือกประเภทเนื้อหา</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {textTemplates.map(t => (
                        <button
                          key={t.id}
                          data-testid={`template-${t.id}`}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                            selectedTemplate === t.id
                              ? "bg-violet-500/10 border-violet-500/20 text-white/90"
                              : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04]"
                          )}
                        >
                          <t.icon className={cn("w-4 h-4 shrink-0", t.color)} />
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Prompt Input */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4 space-y-3">
                    <Textarea
                      data-testid="text-prompt"
                      placeholder="บอกรายละเอียดที่ต้องการให้ AI สร้างเนื้อหา..."
                      value={textPrompt}
                      onChange={e => setTextPrompt(e.target.value)}
                      className="min-h-[120px] bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20"
                      rows={5}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={textTone} onValueChange={setTextTone}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white text-xs">
                          <SelectValue placeholder="โทนเสียง" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">มืออาชีพ</SelectItem>
                          <SelectItem value="casual">สบายๆ</SelectItem>
                          <SelectItem value="persuasive">โน้มน้าว</SelectItem>
                          <SelectItem value="exciting">สนุกตื่นเต้น</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={textLength} onValueChange={setTextLength}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white text-xs">
                          <SelectValue placeholder="ความยาว" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">สั้น</SelectItem>
                          <SelectItem value="medium">ปานกลาง</SelectItem>
                          <SelectItem value="long">ยาว</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-testid="generate-text"
                      className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white gap-2"
                      onClick={() => textGenMut.mutate()}
                      disabled={!textPrompt.trim() || textGenMut.isPending}
                    >
                      {textGenMut.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้าง...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> สร้างเนื้อหา</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Output Panel */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-white/70">ผลลัพธ์</CardTitle>
                    {generatedText && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyText} className="text-white/40 hover:text-white/70 gap-1 text-xs">
                          <Copy className="w-3.5 h-3.5" /> คัดลอก
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => textGenMut.mutate()} className="text-white/40 hover:text-white/70 gap-1 text-xs" disabled={textGenMut.isPending}>
                          <RefreshCw className="w-3.5 h-3.5" /> สร้างใหม่
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedText ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">{generatedText}</div>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" /> Gemini AI
                        </Badge>
                        <span className="text-[10px] text-white/30">{generatedText.length} ตัวอักษร</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16 text-center">
                      <div>
                        <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/30">เนื้อหาที่สร้างจะแสดงที่นี่</p>
                        <p className="text-xs text-white/20 mt-1">เลือกประเภท กรอกรายละเอียด แล้วกดสร้าง</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Image Generation */}
          <TabsContent value="image" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70">สร้างรูปภาพด้วย AI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                      <SelectValue placeholder="ประเภทรูปภาพ" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageStyles.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    data-testid="image-prompt"
                    placeholder="อธิบายรูปภาพที่ต้องการ เช่น: ภาพถ่ายสินค้าเสื้อผ้า พื้นหลังสีขาว สไตล์มินิมอล..."
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    className="min-h-[100px] bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20"
                    rows={4}
                  />
                  <Button
                    data-testid="generate-image"
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white gap-2"
                    onClick={() => imageGenMut.mutate()}
                    disabled={!imagePrompt.trim() || imageGenMut.isPending}
                  >
                    {imageGenMut.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างรูปภาพ...</>
                    ) : (
                      <><Image className="w-4 h-4" /> สร้างรูปภาพ</>
                    )}
                  </Button>
                  <p className="text-[10px] text-white/20 text-center">
                    ใช้ Gemini AI ในการสร้างคำอธิบายรูปภาพ ฟีเจอร์ Image Generation เต็มรูปแบบเร็วๆ นี้
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70">ตัวอย่างรูปภาพ</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedImage ? (
                    <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                      <img src={generatedImage} alt="AI Generated" className="w-full" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16 text-center rounded-xl border border-dashed border-white/[0.06]">
                      <div>
                        <Image className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/30">รูปภาพที่สร้างจะแสดงที่นี่</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
