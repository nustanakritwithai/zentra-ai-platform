/**
 * ZENTRA AI — Gemini Agent with Memory + RAG
 * 
 * API Key Priority:
 * 1. Supabase settings table (persisted via Settings page)
 * 2. GEMINI_API_KEY environment variable (Render env)
 * 3. No fallback — user MUST set their own key
 * 
 * Model Priority:
 * 1. gemini-2.0-flash (fast, reliable)
 * 2. gemini-1.5-flash (fallback)
 */

import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { storage } from "./storage";
import {
  addConversationTurn,
  getRecentConversation,
  buildMemoryContext,
  extractAndStoreFacts,
  createEpisodicMemory,
  type ConversationTurn,
} from "./memory";
import { buildRAGContext, indexStoreData, seedDefaultKnowledge } from "./rag";

// Shared key state — exported so rag.ts can access
let currentApiKey: string | null = null;
let genAI: GoogleGenerativeAI | null = null;
let apiKeyValid = false;

// Preferred model list (will try in order)
const MODEL_PRIORITY = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

function initializeWithKey(key: string): boolean {
  if (!key || key.length < 10) return false;
  try {
    genAI = new GoogleGenerativeAI(key);
    currentApiKey = key;
    apiKeyValid = true;
    return true;
  } catch {
    return false;
  }
}

// Initialize from env if available
const envKey = process.env.GEMINI_API_KEY;
if (envKey && envKey.length > 10) {
  initializeWithKey(envKey);
  console.log("[Gemini] API key loaded from environment ✓");
} else {
  console.log("[Gemini] ⚠ No GEMINI_API_KEY in environment. Will check database...");
}

// Try loading persisted key from Supabase on startup
async function loadPersistedGeminiKey(): Promise<void> {
  try {
    const { supabaseAdmin } = await import("./supabase");
    const { data, error } = await supabaseAdmin.from("settings").select("value").eq("key", "gemini_api_key").single();
    if (error) {
      console.log(`[Gemini] ⚠ Cannot load key from DB: ${error.message}`);
      return;
    }
    if (data?.value && data.value.length > 10) {
      initializeWithKey(data.value);
      console.log("[Gemini] API key loaded from database ✓");
    }
  } catch (e: any) {
    console.log(`[Gemini] ⚠ settings table may not exist: ${e?.message || e}`);
  }
}
loadPersistedGeminiKey();

// Export for rag.ts to access
export function getSharedApiKey(): string | null {
  return currentApiKey;
}

export function getSharedGenAI(): GoogleGenerativeAI | null {
  return genAI;
}

// Track which stores have been indexed
const indexedStores = new Set<number>();

// System prompts for each AI Agent type — Smart prompts with RAG + Memory awareness
const agentSystemPrompts: Record<string, (storeName: string) => string> = {
  shopping_assistant: (storeName) => `คุณคือ Shopping Assistant AI ของร้าน "${storeName}" — ผู้ช่วยช้อปปิ้งอัจฉริยะระดับ Premium

## บุคลิกและโทน
- พูดภาษาไทยเป็นธรรมชาติ เหมือนพนักงานขายมืออาชีพที่อบอุ่น
- ใช้ emoji 1-2 ตัวต่อข้อความ ไม่มากเกินไป
- กระชับ ตรงประเด็น ไม่พูดยืดยาว

## กฎสำคัญ (ห้ามละเมิด)
1. **ตอบจากข้อมูลจริงเท่านั้น** — ใช้เฉพาะข้อมูลสินค้าที่อยู่ใน KNOWLEDGE BASE ด้านล่าง ห้ามแต่งชื่อสินค้า ราคา หรือคุณสมบัติที่ไม่มีในข้อมูล
2. **ถ้าไม่มีข้อมูล ให้ถามกลับ** — "ขอโทษค่ะ ไม่พบข้อมูลสินค้าที่ตรง ลองบอกเพิ่มเติมได้ไหมคะว่าต้องการแบบไหน?"
3. **จำบริบทการคุย** — ถ้าลูกค้าบอกงบไม่เกิน 1,000 บาท ต้องจำและกรองสินค้าตามงบนั้น ไม่แนะนำของแพงเกินงบ
4. **อ้างอิงข้อมูลเสมอ** — เมื่อแนะนำสินค้า ต้องบอกชื่อสินค้า ราคา และสต็อกที่มีจริง

## วิธีแนะนำสินค้า
- ถามความต้องการก่อน: งบเท่าไหร่? ใช้ทำอะไร? ชอบสไตล์ไหน?
- จากข้อมูล KNOWLEDGE BASE ให้เลือกสินค้า 2-3 ตัวที่ตรงโจทย์ที่สุด
- เปรียบเทียบจุดเด่นของแต่ละตัว
- ถ้าลูกค้าสนใจ ให้แนะนำสินค้าเสริมที่เข้ากัน (cross-sell)

## ถ้าลูกค้าถาม Memory
- ตอบว่า "ใช่ค่ะ หนูจำได้ว่า..." แล้วอ้างอิงข้อมูลจาก MEMORY section
- ถ้าไม่มี memory ให้บอก "เรายังไม่เคยคุยกันก่อน แต่เดี๋ยวหนูจะจำความต้องการของคุณไว้เพื่อบริการครั้งหน้าที่ดีขึ้นค่ะ"`,

  recommendation: (storeName) => `คุณคือ Recommendation Engine AI ของร้าน "${storeName}" — ที่ปรึกษาด้านการแนะนำสินค้าอัจฉริยะ

## บุคลิกและโทน
- พูดเชิงวิเคราะห์แบบนักกลยุทธ์ ใช้ข้อมูลตัวเลขประกอบ
- ภาษาไทยกึ่งทางการ มืออาชีพ

## กฎสำคัญ
1. **วิเคราะห์จากข้อมูลจริง** — ใช้ KNOWLEDGE BASE เท่านั้น ห้ามแต่งตัวเลข
2. **ทุกคำแนะนำต้องมีเหตุผล** — บอกว่า "เพราะอะไร" เสมอ
3. **จำข้อมูลลูกค้า** — ใช้ MEMORY เพื่อแนะนำตรงกลุ่มเป้าหมาย
4. **ห้ามแนะนำสินค้าที่หมดสต็อก**

## วิธีแนะนำ
- เจ้าของร้านถามอะไร → วิเคราะห์จากข้อมูลสินค้า ยอดขาย สต็อก
- แนะนำ Bundle: จับคู่สินค้าที่ complement กัน พร้อมเหตุผล
- Cross-sell/Upsell: แนะนำสินค้าที่ลูกค้ากลุ่มเดียวกันมักซื้อเพิ่ม
- Trend: ดูจากข้อมูล order ว่าหมวดไหนขายดี
- **ทุกข้อแนะนำต้องอ้างอิงสินค้าจริงจาก KNOWLEDGE BASE**`,

  dynamic_pricing: (storeName) => `คุณคือ Dynamic Pricing AI ของร้าน "${storeName}" — ผู้เชี่ยวชาญกลยุทธ์ราคา

## บุคลิก
- วิเคราะห์เชิงลึก ใช้ตัวเลข % margin ประกอบ
- ภาษาไทยมืออาชีพ

## กฎสำคัญ
1. **วิเคราะห์จากข้อมูลจริงเท่านั้น** — ใช้ราคา ราคาเปรียบเทียบ สต็อก จาก KNOWLEDGE BASE
2. **ทุกคำแนะนำต้องคำนวณได้** — ถ้าแนะนำลดราคา ต้องบอก margin ที่เหลือ
3. **ห้ามแต่งตัวเลข** — ถ้าไม่มีข้อมูล cost ให้บอกตามตรง

## หลักการวิเคราะห์
- ราคาขาย vs ราคาเปรียบเทียบ → คำนวณ margin
- สต็อกสูง + ขายช้า → แนะนำลดราคา/โปรโมชั่น
- สต็อกต่ำ + ขายดี → scarcity pricing (ไม่ลดราคา)
- AI Score สูง → demand สูง สามารถปรับราคาขึ้นได้
- แนะนำ Bundle pricing สำหรับสินค้าที่ complement กัน`,

  customer_support: (storeName) => `คุณคือ Customer Support AI ของร้าน "${storeName}" — ฝ่ายบริการลูกค้า 24/7

## บุคลิกและโทน
- อบอุ่น ใจเย็น เข้าใจลูกค้า
- ภาษาไทยสุภาพ เป็นกันเอง
- ใช้ emoji เพื่อความเป็นมิตร

## กฎสำคัญ
1. **ตอบจากนโยบายจริง** — ใช้ KNOWLEDGE BASE (นโยบายคืนสินค้า, การจัดส่ง, วิธีชำระเงิน)
2. **จำข้อมูลลูกค้า** — ใช้ MEMORY เพื่อให้บริการต่อเนื่อง
3. **ถ้าไม่แน่ใจ ห้ามมั่ว** — ตอบว่า "ขอตรวจสอบเพิ่มเติมนะคะ แนะนำให้ติดต่อ support@zentra.ai"
4. **ถ้ามีข้อมูลคำสั่งซื้อ** — อ้างอิงเลขที่ สถานะ วันที่จริง

## วิธีจัดการ
- ข้อร้องเรียน → รับฟัง ขอโทษ เสนอทางออก อ้างอิงนโยบาย
- สถานะคำสั่งซื้อ → ค้นจาก KNOWLEDGE BASE แล้วบอกรายละเอียด
- คำถามทั่วไป → ตอบจากนโยบายร้านที่มี
- เรื่องซับซ้อน → แนะนำติดต่อ support@zentra.ai`,

  inventory_forecast: (storeName) => `คุณคือ Inventory Forecast AI ของร้าน "${storeName}" — ระบบพยากรณ์สต็อกอัจฉริยะ

## บุคลิก
- วิเคราะห์เชิงข้อมูล ใช้ตัวเลขจริง
- นำเสนอเป็นตารางหรือรายการให้อ่านง่าย

## กฎสำคัญ
1. **ใช้ข้อมูลสต็อกจริง** — จาก KNOWLEDGE BASE เท่านั้น
2. **คำนวณให้เห็น** — แสดงตัวเลข เช่น สต็อกเหลือ, อัตราขาย, วันที่คาดว่าหมด
3. **แยกความเร่งด่วน** — ⚠️ ด่วน (< 10 ชิ้น), ⚡ ควรสั่ง (< 30 ชิ้น), ✅ ปกติ

## วิธีวิเคราะห์
- ดูสต็อกแต่ละสินค้า → เรียงจากน้อยไปมาก
- สินค้าสต็อกต่ำ + ขายดี → แจ้งเตือนให้สั่งเพิ่ม
- สินค้าสต็อกสูง + ขายช้า → แนะนำทำโปรโมชั่น
- Safety Stock = 2x average weekly sales
- Reorder Point = Safety Stock + Lead Time Demand`,

  visual_search: (storeName) => `คุณคือ Visual Search AI ของร้าน "${storeName}" — ระบบค้นหาสินค้าจากคำอธิบาย

## บุคลิก
- ตอบรวดเร็ว ตรงประเด็น
- ภาษาไทยเป็นมิตร

## กฎสำคัญ
1. **ค้นจากสินค้าจริง** — ใช้ KNOWLEDGE BASE เท่านั้น
2. **จับคำสำคัญ** — สี, ประเภท, สไตล์, ช่วงราคา, ขนาด
3. **ถ้าไม่เจอ** → ถามเพิ่มเติม ไม่แต่งเรื่อง

## วิธีค้นหา
- ลูกค้าบอกลักษณะ → match กับสินค้าใน KNOWLEDGE BASE
- แนะนำ 2-3 ตัวที่ตรงที่สุด พร้อมชื่อ ราคา
- ถ้าตรงไม่ 100% → บอกว่า "ใกล้เคียงที่สุดคือ..." พร้อมเหตุผล
- แนะนำสินค้าที่ style เข้ากัน`,
};

// Built-in fallback responses when no API key
const fallbackResponses: Record<string, string[]> = {
  shopping_assistant: [
    "สวัสดีค่ะ 🛍️ ยินดีให้บริการค่ะ! วันนี้มีสินค้าแนะนำหลายรายการเลยค่ะ ต้องการหาสินค้าประเภทไหนเป็นพิเศษคะ?",
    "ขอบคุณที่สนใจค่ะ 😊 สินค้าตัวนี้เป็นสินค้ายอดนิยมของร้านเลยค่ะ คุณภาพดีมากๆ ลูกค้าหลายท่านให้ feedback ดีมากเลยค่ะ",
    "ลองดูสินค้าเหล่านี้นะคะ AI Score สูงมาก หมายความว่าลูกค้าส่วนใหญ่พอใจกับสินค้าเหล่านี้ค่ะ 🌟",
  ],
  recommendation: [
    "📊 จากการวิเคราะห์ข้อมูลการขาย สินค้ายอดนิยม 3 อันดับแรกของร้านคือ: อุปกรณ์อิเล็กทรอนิกส์ เสื้อผ้า และรองเท้า สินค้าในหมวดเหล่านี้มีอัตราการซื้อซ้ำสูง",
    "🔍 แนะนำให้จัด Bundle Pack ระหว่างสินค้าที่มักซื้อคู่กัน เช่น หูฟังกับเคสป้องกัน จะช่วยเพิ่มยอดขายต่อ order ได้",
    "📈 Trend Analysis: สินค้าอิเล็กทรอนิกส์มียอดเติบโต 15% ในช่วง 7 วันที่ผ่านมา แนะนำให้เพิ่มสต็อกสินค้าในหมวดนี้",
  ],
  dynamic_pricing: [
    "💰 จากการวิเคราะห์ Margin: สินค้าที่มี compare price สูงกว่าราคาขายมาก สามารถทำ flash sale เพื่อดึงลูกค้าใหม่ได้",
    "📊 แนะนำปรับราคาสินค้าที่มี AI Score > 90% ขึ้นเล็กน้อย (5-10%) เนื่องจาก demand สูง ลูกค้ายินดีจ่ายมากขึ้น",
    "🎯 สินค้าที่สต็อกเหลือน้อย (< 20 ชิ้น) ไม่ควรลดราคา เนื่องจากเป็น scarcity pricing จะช่วยเพิ่ม perceived value",
  ],
  customer_support: [
    "สวัสดีค่ะ 😊 ยินดีให้บริการค่ะ! มีอะไรให้ช่วยเหลือคะ? ไม่ว่าจะเรื่องสถานะคำสั่งซื้อ การจัดส่ง หรือข้อมูลสินค้า ถามได้เลยค่ะ",
    "ขอบคุณที่ติดต่อมาค่ะ 🙏 เรื่องการคืนสินค้า ร้านเรามีนโยบายคืนภายใน 7 วันนะคะ สินค้าต้องอยู่ในสภาพสมบูรณ์",
    "เรื่องการจัดส่ง ปกติใช้เวลา 1-3 วันทำการค่ะ ถ้าต้องการเช็คสถานะ กรุณาแจ้งหมายเลขคำสั่งซื้อมานะคะ 📦",
  ],
  inventory_forecast: [
    "📦 สรุปสถานะสต็อก:\n- สินค้าใกล้หมด (< 15 ชิ้น): ควรสั่งเพิ่มภายใน 3 วัน\n- สินค้าขายดี: อุปกรณ์อิเล็กทรอนิกส์ ควรเตรียมสต็อกสำรอง 20-30%\n- Dead Stock: สินค้าที่ยอดขาย = 0 ใน 30 วัน ควรทำโปรโมชั่น",
    "🔮 พยากรณ์ 30 วันข้างหน้า: สินค้าหมวดอิเล็กทรอนิกส์จะขายดีต่อเนื่อง แนะนำ Safety Stock = 2x average weekly sales",
    "⚠️ แจ้งเตือน: มีสินค้า 2 รายการที่สต็อกต่ำกว่า threshold ที่ตั้งไว้ ควรสั่งซื้อเพิ่มโดยเร็ว",
  ],
  visual_search: [
    "🔍 ช่วยค้นหาสินค้าจากคำอธิบายได้เลยค่ะ! ลองบอกลักษณะสินค้าที่ต้องการ เช่น สี ขนาด ประเภท หรือ style ที่ชอบนะคะ",
    "👀 จากคำอธิบายของคุณ เจอสินค้าที่ตรงกัน! ลองดูสินค้าในหมวดที่เกี่ยวข้องเพิ่มเติมได้ค่ะ",
    "🎨 สำหรับ Style Matching แนะนำสินค้าที่เข้ากัน: ดูสีและดีไซน์ที่ complement กันได้ค่ะ",
  ],
};

// Ensure store data is indexed for RAG
async function ensureStoreIndexed(storeId: number): Promise<void> {
  if (!indexedStores.has(storeId)) {
    seedDefaultKnowledge(storeId);
    await indexStoreData(storeId);
    indexedStores.add(storeId);
  }
}

// Try calling Gemini with model fallback
async function callGeminiWithFallback(
  systemPrompt: string,
  geminiHistory: Content[],
  userMessage: string
): Promise<string> {
  if (!genAI) throw new Error("No Gemini API key configured");

  let lastError: any = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();
      console.log(`[Gemini] ✓ Success with ${modelName}`);
      return text;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.error(`[Gemini] ✗ ${modelName} failed: ${msg}`);
      
      // If key is leaked/invalid, don't try other models — key is the problem
      if (msg.includes("leaked") || msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED")) {
        throw new Error(`API Key ถูกระงับโดย Google — กรุณาสร้าง API Key ใหม่ที่ https://aistudio.google.com/apikey แล้วอัพเดทในหน้าตั้งค่า`);
      }
      
      // 429 rate limit — don't try more models, just wait
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error(`Gemini API rate limit — กรุณารอสักครู่แล้วลองใหม่`);
      }
      
      // For other errors (503, 404, etc.), try next model
      continue;
    }
  }

  // All models failed
  throw lastError || new Error("All Gemini models failed");
}

// Main chat function with Memory + RAG
export async function chatWithAgent(
  agentType: string,
  userMessage: string,
  storeId: number = 1,
  customerId?: string
): Promise<{
  reply: string;
  agentName: string;
  memoryUsed: boolean;
  ragSources: Array<{ title: string; source: string; score: number }>;
  factsExtracted: number;
}> {
  // Ensure RAG index is ready
  await ensureStoreIndexed(storeId);

  // Get store and agent info
  const store = await storage.getStore(storeId);
  const agents = await storage.getAiAgentsByStore(storeId);
  const agent = agents.find(a => a.type === agentType);
  if (!agent) throw new Error(`Agent type "${agentType}" not found`);
  if (!agent.enabled) throw new Error(`Agent "${agent.name}" is currently disabled`);

  const storeName = store?.name || "ZentraMart";
  const sessionId = customerId || `session-${storeId}`;

  // 1. Get base system prompt
  const getSystemPrompt = agentSystemPrompts[agentType];
  if (!getSystemPrompt) throw new Error(`No system prompt for agent type "${agentType}"`);
  let systemPrompt = getSystemPrompt(storeName);

  // 2. Build Memory context
  const memoryContext = buildMemoryContext(sessionId, agentType);
  const memoryUsed = memoryContext.length > 0;
  if (memoryUsed) {
    systemPrompt += `\n\n=== MEMORY (ข้อมูลที่คุณจำได้เกี่ยวกับลูกค้าคนนี้) ===\n${memoryContext}\n\nใช้ข้อมูลเหล่านี้เพื่อให้บริการที่เป็นส่วนตัวมากขึ้น อ้างอิงสิ่งที่จำได้เมื่อเหมาะสม`;
  }

  // 3. Build RAG context (silently skip if embedding fails)
  let ragResult = { context: "", sources: [] as Array<{ title: string; source: string; score: number }> };
  try {
    ragResult = await buildRAGContext(userMessage, storeId, agentType);
  } catch (ragErr) {
    console.error("[Gemini] RAG context failed (skipping):", ragErr);
  }
  
  if (ragResult.context) {
    systemPrompt += `\n\n=== KNOWLEDGE BASE (ข้อมูลอ้างอิง) ===\n${ragResult.context}\n\nใช้ข้อมูลนี้ในการตอบคำถาม อ้างอิงข้อมูลเมื่อเกี่ยวข้อง`;
  }

  // 4. Get recent conversation history for this agent
  const recentTurns = getRecentConversation(sessionId, agentType, 10);

  // If no Gemini API key, use built-in responses
  if (!apiKeyValid || !genAI) {
    const responses = fallbackResponses[agentType] || fallbackResponses.customer_support;
    const reply = responses[Math.floor(Math.random() * responses.length)];
    
    // Still save to memory
    const userTurn: ConversationTurn = { role: "user", content: userMessage, timestamp: new Date().toISOString(), agentType };
    const modelTurn: ConversationTurn = { role: "model", content: reply, timestamp: new Date().toISOString(), agentType };
    addConversationTurn(sessionId, userTurn);
    addConversationTurn(sessionId, modelTurn);

    return {
      reply: reply + "\n\n_(AI ทำงานในโหมด Demo — กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าเพื่อใช้งาน AI เต็มรูปแบบ)_",
      agentName: agent.name,
      memoryUsed,
      ragSources: ragResult.sources,
      factsExtracted: 0,
    };
  }

  const geminiHistory: Content[] = recentTurns.map(t => ({
    role: t.role,
    parts: [{ text: t.content }],
  }));

  // 5. Call Gemini with model fallback
  try {
    const reply = await callGeminiWithFallback(systemPrompt, geminiHistory, userMessage);

    // 6. Save to short-term memory
    const userTurn: ConversationTurn = { role: "user", content: userMessage, timestamp: new Date().toISOString(), agentType };
    const modelTurn: ConversationTurn = { role: "model", content: reply, timestamp: new Date().toISOString(), agentType };
    addConversationTurn(sessionId, userTurn);
    addConversationTurn(sessionId, modelTurn);

    // 7. Background: extract facts and create episodic memory
    const allTurns = getRecentConversation(sessionId, agentType, 6);
    let factsExtracted = 0;

    if (allTurns.length >= 6 && allTurns.length % 6 === 0) {
      extractAndStoreFacts(sessionId, allTurns.slice(-6), agentType)
        .then(facts => { factsExtracted = facts.length; })
        .catch(console.error);
    }

    if (allTurns.length >= 8 && allTurns.length % 8 === 0) {
      createEpisodicMemory(sessionId, allTurns.slice(-8), agentType)
        .catch(console.error);
    }

    return {
      reply,
      agentName: agent.name,
      memoryUsed,
      ragSources: ragResult.sources,
      factsExtracted,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("[Gemini] Chat error:", errorMsg);
    
    // Provide specific error message based on the type of failure
    let userErrorMsg: string;
    if (errorMsg.includes("ถูกระงับ") || errorMsg.includes("leaked") || errorMsg.includes("PERMISSION_DENIED")) {
      userErrorMsg = "_(⚠️ API Key ถูกระงับ — กรุณาสร้าง API Key ใหม่ที่ aistudio.google.com/apikey แล้วอัพเดทในหน้าตั้งค่า)_";
    } else if (errorMsg.includes("rate limit") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      userErrorMsg = "_(⏳ API ถูกจำกัดการใช้งานชั่วคราว — กรุณารอสักครู่แล้วลองใหม่)_";
    } else {
      userErrorMsg = `_(❌ Gemini API error: ${errorMsg.slice(0, 300)})_`;
    }

    // Return fallback with clear error
    const responses = fallbackResponses[agentType] || fallbackResponses.customer_support;
    const reply = responses[Math.floor(Math.random() * responses.length)];
    return {
      reply: reply + "\n\n" + userErrorMsg,
      agentName: agent.name,
      memoryUsed,
      ragSources: ragResult.sources,
      factsExtracted: 0,
    };
  }
}

// Update API key at runtime and persist to Supabase
export function updateGeminiApiKey(key: string): boolean {
  if (!key || key.length < 10) return false;
  const success = initializeWithKey(key);
  if (success) {
    process.env.GEMINI_API_KEY = key;
    console.log("[Gemini] API key updated ✓");
    // Persist to database (fire and forget) — try settings table, if not exist just log
    (async () => {
      try {
        const { supabaseAdmin } = await import("./supabase");
        const { error } = await supabaseAdmin.from("settings").upsert({ key: "gemini_api_key", value: key }, { onConflict: "key" });
        if (error) {
          console.log(`[Gemini] Could not persist key to DB (settings table may not exist): ${error.message}`);
          console.log(`[Gemini] Key is active in memory and will persist until server restart`);
        } else {
          console.log("[Gemini] API key persisted to database");
        }
      } catch (e: any) {
        console.log(`[Gemini] Key persistence failed: ${e?.message || e}`);
        console.log(`[Gemini] Key is active in memory`);
      }
    })();
  }
  return success;
}

export function getGeminiStatus(): { hasKey: boolean; keyPrefix: string } {
  return {
    hasKey: apiKeyValid,
    keyPrefix: currentApiKey ? currentApiKey.slice(0, 10) + "..." : "",
  };
}

// --- Chat History (backed by short-term memory) ---

export function getChatHistory(agentType: string, storeId: number = 1) {
  const sessionId = `session-${storeId}`;
  const turns = getRecentConversation(sessionId, agentType, 50);
  return turns.map((t, i) => ({
    id: i + 1,
    agentType: t.agentType,
    role: t.role,
    content: t.content,
    timestamp: t.timestamp,
  }));
}

export function clearChatHistory(agentType: string, storeId: number = 1) {
  const sessionId = `session-${storeId}`;
  clearCustomerMemory(sessionId, agentType);
}

// Re-export for routes
export { getRecentConversation, getCustomerFacts, getEpisodicMemories, getFullCustomerMemory, clearCustomerMemory, getMemoryStats } from "./memory";
export { getKnowledgeEntries, addKnowledgeEntry, deleteKnowledgeEntry, getRAGStats, indexStoreData as reindexStore } from "./rag";
