/**
 * ZENTRA AI — RAG (Retrieval-Augmented Generation) System
 * 
 * Uses Gemini Embedding API for vector similarity search.
 * In-memory vector store with cosine similarity.
 * 
 * Knowledge sources:
 * 1. Products catalog (auto-indexed)
 * 2. Order history (auto-indexed)
 * 3. Customer profiles (auto-indexed)
 * 4. Custom knowledge base (user-uploaded docs, FAQs, policies)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";

// Use shared Gemini instance from gemini.ts (supports runtime key updates)
// NOTE: Uses lazy require to avoid circular dependency (gemini.ts imports rag.ts)
function getGenAI(): GoogleGenerativeAI | null {
  try {
    const geminiModule = require("./gemini");
    if (geminiModule.getSharedGenAI) {
      const shared = geminiModule.getSharedGenAI();
      if (shared) return shared;
    }
  } catch {}
  // Fallback to env var
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) return null;
  return new GoogleGenerativeAI(key);
}

// --- Types ---

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: "product" | "order" | "customer" | "knowledge" | "policy";
    sourceId?: string;
    title?: string;
    category?: string;
    storeId: number;
  };
  createdAt: string;
}

export interface KnowledgeBaseEntry {
  id: number;
  storeId: number;
  title: string;
  content: string;
  category: "faq" | "policy" | "guide" | "custom";
  indexed: boolean;
  createdAt: string;
}

export interface RAGResult {
  document: VectorDocument;
  score: number;
}

// --- Vector Store ---

const vectorStore: VectorDocument[] = [];
const knowledgeBase: KnowledgeBaseEntry[] = [];
let kbId = 1;

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Embedding model priority
const EMBEDDING_MODELS = ["text-embedding-004", "embedding-001"];

// Get embedding from Gemini with model fallback
async function getEmbedding(text: string): Promise<number[]> {
  const genAI = getGenAI();
  if (!genAI) return [];

  for (const modelName of EMBEDDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      const msg = error?.message || String(error);
      // If key is leaked/invalid, stop immediately
      if (msg.includes("leaked") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID")) {
        console.error(`[RAG] API Key issue: ${msg.slice(0, 100)}`);
        return [];
      }
      console.error(`[RAG] Embedding ${modelName} error: ${msg.slice(0, 100)}`);
      continue;
    }
  }
  return [];
}

// --- Index Store Data ---

export async function indexStoreData(storeId: number): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  // Clear existing store data
  const existingIds = new Set(
    vectorStore
      .filter(v => v.metadata.storeId === storeId && v.metadata.source !== "knowledge")
      .map(v => v.id)
  );
  
  // Remove old entries
  for (let i = vectorStore.length - 1; i >= 0; i--) {
    if (existingIds.has(vectorStore[i].id)) {
      vectorStore.splice(i, 1);
    }
  }

  // Index products
  const products = await storage.getProductsByStore(storeId);
  for (const product of products) {
    const text = `สินค้า: ${product.name}
หมวดหมู่: ${product.category || "ไม่ระบุ"}
รายละเอียด: ${product.description || ""}
ราคา: ฿${product.price.toLocaleString()}${product.comparePrice ? ` (จาก ฿${product.comparePrice.toLocaleString()})` : ""}
สต็อก: ${product.stock} ชิ้น
สถานะ: ${product.status}
AI Score: ${product.aiScore}%`;

    try {
      const embedding = await getEmbedding(text);
      if (embedding.length > 0) {
        vectorStore.push({
          id: `product-${product.id}`,
          content: text,
          embedding,
          metadata: {
            source: "product",
            sourceId: String(product.id),
            title: product.name,
            category: product.category || undefined,
            storeId,
          },
          createdAt: new Date().toISOString(),
        });
        indexed++;
      }
    } catch { errors++; }
  }

  // Index orders
  const orders = await storage.getOrdersByStore(storeId);
  for (const order of orders) {
    const items = (order.items as any[]).map((i: any) => `${i.name} x${i.qty}`).join(", ");
    const text = `คำสั่งซื้อ #${String(order.id).padStart(4, "0")}
ลูกค้า: ${order.customerName} (${order.customerEmail || ""})
สินค้า: ${items}
ยอดรวม: ฿${order.total.toLocaleString()}
สถานะ: ${order.status}
ที่อยู่จัดส่ง: ${order.shippingAddress || "ไม่ระบุ"}
วันที่สั่ง: ${order.createdAt}`;

    try {
      const embedding = await getEmbedding(text);
      if (embedding.length > 0) {
        vectorStore.push({
          id: `order-${order.id}`,
          content: text,
          embedding,
          metadata: {
            source: "order",
            sourceId: String(order.id),
            title: `คำสั่งซื้อ #${String(order.id).padStart(4, "0")}`,
            storeId,
          },
          createdAt: new Date().toISOString(),
        });
        indexed++;
      }
    } catch { errors++; }
  }

  // Index customers
  const customers = await storage.getCustomersByStore(storeId);
  for (const customer of customers) {
    const segmentLabels: Record<string, string> = { vip: "VIP", returning: "ขาประจำ", new: "ใหม่", at_risk: "เสี่ยงหาย" };
    const text = `ลูกค้า: ${customer.name}
อีเมล: ${customer.email || "ไม่ระบุ"}
โทรศัพท์: ${customer.phone || "ไม่ระบุ"}
กลุ่ม: ${segmentLabels[customer.segment || "new"] || customer.segment}
จำนวนคำสั่งซื้อ: ${customer.totalOrders} ครั้ง
ยอดรวม: ฿${customer.totalSpent.toLocaleString()}`;

    try {
      const embedding = await getEmbedding(text);
      if (embedding.length > 0) {
        vectorStore.push({
          id: `customer-${customer.id}`,
          content: text,
          embedding,
          metadata: {
            source: "customer",
            sourceId: String(customer.id),
            title: customer.name,
            category: customer.segment || undefined,
            storeId,
          },
          createdAt: new Date().toISOString(),
        });
        indexed++;
      }
    } catch { errors++; }
  }

  // Index knowledge base entries
  const kbEntries = knowledgeBase.filter(k => k.storeId === storeId);
  for (const entry of kbEntries) {
    try {
      const embedding = await getEmbedding(`${entry.title}: ${entry.content}`);
      if (embedding.length > 0) {
        // Remove old version if exists
        const oldIdx = vectorStore.findIndex(v => v.id === `kb-${entry.id}`);
        if (oldIdx >= 0) vectorStore.splice(oldIdx, 1);
        
        vectorStore.push({
          id: `kb-${entry.id}`,
          content: `${entry.title}\n${entry.content}`,
          embedding,
          metadata: {
            source: "knowledge",
            sourceId: String(entry.id),
            title: entry.title,
            category: entry.category,
            storeId,
          },
          createdAt: new Date().toISOString(),
        });
        entry.indexed = true;
        indexed++;
      }
    } catch { errors++; }
  }

  console.log(`[RAG] Indexed ${indexed} documents for store ${storeId} (${errors} errors)`);
  return { indexed, errors };
}

// --- Semantic Search ---

export async function searchKnowledge(
  query: string,
  storeId: number,
  options: {
    sources?: Array<"product" | "order" | "customer" | "knowledge" | "policy">;
    limit?: number;
    minScore?: number;
  } = {}
): Promise<RAGResult[]> {
  const { sources, limit = 5, minScore = 0.3 } = options;
  
  const queryEmbedding = await getEmbedding(query);
  if (queryEmbedding.length === 0) return [];

  let candidates = vectorStore.filter(v => v.metadata.storeId === storeId);
  if (sources && sources.length > 0) {
    candidates = candidates.filter(v => sources.includes(v.metadata.source));
  }

  const scored: RAGResult[] = candidates.map(doc => ({
    document: doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  return scored
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- Build RAG Context for Gemini ---

export async function buildRAGContext(
  query: string,
  storeId: number,
  agentType: string
): Promise<{ context: string; sources: Array<{ title: string; source: string; score: number }> }> {
  // Choose which sources are most relevant per agent type
  const sourceMap: Record<string, Array<"product" | "order" | "customer" | "knowledge" | "policy">> = {
    shopping_assistant: ["product", "knowledge"],
    recommendation: ["product", "customer", "order"],
    dynamic_pricing: ["product", "order"],
    customer_support: ["order", "knowledge", "product", "customer"],
    inventory_forecast: ["product", "order"],
    visual_search: ["product"],
  };

  const agentSources = sourceMap[agentType] || ["product", "knowledge"];
  
  const results = await searchKnowledge(query, storeId, {
    sources: agentSources,
    limit: 6,
    minScore: 0.25,
  });

  if (results.length === 0) {
    return { context: "", sources: [] };
  }

  const contextParts: string[] = ["📚 ข้อมูลที่เกี่ยวข้องจาก Knowledge Base:"];
  const sources: Array<{ title: string; source: string; score: number }> = [];

  results.forEach((r, i) => {
    contextParts.push(`\n[${i + 1}] ${r.document.metadata.title || "ข้อมูล"} (${r.document.metadata.source}) — ความเกี่ยวข้อง: ${Math.round(r.score * 100)}%`);
    contextParts.push(r.document.content);
    sources.push({
      title: r.document.metadata.title || "ข้อมูล",
      source: r.document.metadata.source,
      score: r.score,
    });
  });

  return { context: contextParts.join("\n"), sources };
}

// --- Knowledge Base CRUD ---

export function addKnowledgeEntry(storeId: number, entry: { title: string; content: string; category: KnowledgeBaseEntry["category"] }): KnowledgeBaseEntry {
  const newEntry: KnowledgeBaseEntry = {
    id: kbId++,
    storeId,
    title: entry.title,
    content: entry.content,
    category: entry.category,
    indexed: false,
    createdAt: new Date().toISOString(),
  };
  knowledgeBase.push(newEntry);
  return newEntry;
}

export function getKnowledgeEntries(storeId: number): KnowledgeBaseEntry[] {
  return knowledgeBase.filter(k => k.storeId === storeId);
}

export function deleteKnowledgeEntry(id: number): boolean {
  const idx = knowledgeBase.findIndex(k => k.id === id);
  if (idx < 0) return false;
  knowledgeBase.splice(idx, 1);
  // Remove from vector store
  const vecIdx = vectorStore.findIndex(v => v.id === `kb-${id}`);
  if (vecIdx >= 0) vectorStore.splice(vecIdx, 1);
  return true;
}

// --- Stats ---

export function getRAGStats(storeId: number): { totalDocuments: number; bySource: Record<string, number>; kbEntries: number } {
  const storeDocs = vectorStore.filter(v => v.metadata.storeId === storeId);
  const bySource: Record<string, number> = {};
  storeDocs.forEach(d => {
    bySource[d.metadata.source] = (bySource[d.metadata.source] || 0) + 1;
  });
  return {
    totalDocuments: storeDocs.length,
    bySource,
    kbEntries: knowledgeBase.filter(k => k.storeId === storeId).length,
  };
}

// --- Auto-seed default knowledge base ---

export function seedDefaultKnowledge(storeId: number): void {
  const defaults = [
    {
      title: "นโยบายการคืนสินค้า",
      content: "ลูกค้าสามารถคืนสินค้าได้ภายใน 30 วันหลังจากได้รับสินค้า โดยสินค้าต้องอยู่ในสภาพสมบูรณ์ มีแท็กติดอยู่ และอยู่ในบรรจุภัณฑ์เดิม สินค้าลดราคาไม่สามารถคืนได้ ค่าจัดส่งคืนสินค้าเป็นความรับผิดชอบของลูกค้า ยกเว้นกรณีสินค้าชำรุดหรือผิดรุ่น ทางร้านจะคืนเงินภายใน 7-14 วันทำการ",
      category: "policy" as const,
    },
    {
      title: "นโยบายการจัดส่ง",
      content: "จัดส่งฟรีเมื่อมียอดสั่งซื้อ 1,000 บาทขึ้นไป ค่าจัดส่งปกติ 50-100 บาท ระยะเวลาจัดส่ง 1-3 วันทำการสำหรับกรุงเทพฯ และปริมณฑล, 3-5 วันทำการสำหรับต่างจังหวัด รองรับการจัดส่งผ่าน Kerry Express, Flash Express และ Thailand Post สามารถติดตามสถานะได้ทาง tracking number ที่จะส่งทางอีเมลและ SMS",
      category: "policy" as const,
    },
    {
      title: "วิธีการชำระเงิน",
      content: "รองรับการชำระเงินผ่าน บัตรเครดิต/เดบิต (Visa, Mastercard, JCB), โอนผ่านธนาคาร (กรุงเทพ, กสิกร, ไทยพาณิชย์, กรุงไทย), พร้อมเพย์ (PromptPay), TrueMoney Wallet, และเก็บเงินปลายทาง (COD) สำหรับยอดไม่เกิน 5,000 บาท",
      category: "faq" as const,
    },
    {
      title: "วิธีติดต่อเรา",
      content: "อีเมล: support@zentra.ai | LINE: @zentramart | โทร: 02-xxx-xxxx (จันทร์-ศุกร์ 9:00-18:00) | Live Chat: ผ่านเว็บไซต์ 24/7 (AI + พนักงาน) | เวลาตอบกลับ: อีเมลภายใน 24 ชม., LINE/Chat ภายใน 5 นาที",
      category: "faq" as const,
    },
    {
      title: "โปรโมชั่นประจำเดือน มีนาคม 2026",
      content: "1) ลด 20% สำหรับสินค้าอุปกรณ์อิเล็กทรอนิกส์เมื่อใช้โค้ด TECHMAR26 | 2) ซื้อ 2 ชิ้นขึ้นไปในหมวดเสื้อผ้าลด 15% | 3) สมาชิก VIP รับส่วนลดเพิ่ม 5% ทุกรายการ | 4) Free shipping ทุกออเดอร์ไม่มีขั้นต่ำ ถึง 15 มี.ค. นี้",
      category: "guide" as const,
    },
  ];

  defaults.forEach(d => {
    // Check if already seeded
    if (!knowledgeBase.some(k => k.storeId === storeId && k.title === d.title)) {
      addKnowledgeEntry(storeId, d);
    }
  });
}
