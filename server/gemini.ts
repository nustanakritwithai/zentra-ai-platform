/**
 * ZENTRA AI — Gemini Agent with Memory + RAG
 * 
 * API Key Priority:
 * 1. Supabase settings table (persisted via Settings page)
 * 2. GEMINI_API_KEY environment variable (Render env)
 * 3. No fallback — user MUST set their own key
 * 
 * Model Priority:
 * 1. gemini-2.5-flash (latest, fastest)
 * 2. gemini-2.0-flash (fallback)
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
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
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

// ============================================================
// กฎเหล็ก (STRICT DATA-ONLY RULE) — ใช้ร่วมกับทุก Agent
// ============================================================
const STRICT_DATA_RULE = `
## ⛔ กฎเหล็ก — ห้ามละเมิดเด็ดขาด
1. **ตอบจากข้อมูลใน KNOWLEDGE BASE เท่านั้น** — ห้ามแต่งชื่อสินค้า ราคา จำนวนสต็อก เปอร์เซ็นต์ หรือสถิติใดๆ ที่ไม่มีอยู่ใน KNOWLEDGE BASE
2. **ห้ามยกตัวอย่างสินค้าเอง** — ห้ามพูดถึง BrightDesk, SoundWave, ThermoMug หรือชื่อสินค้าใดๆ ที่ไม่มีใน KNOWLEDGE BASE
3. **ห้ามแต่งตัวเลข** — ห้ามพูดว่า "เติบโต 15%", "ยอดขาย 23 ชิ้น", "margin 30%" ถ้าตัวเลขนั้นไม่มีอยู่ใน KNOWLEDGE BASE
4. **ถ้าไม่พบข้อมูลใน KNOWLEDGE BASE** → ต้องตอบว่า: "ขออภัยค่ะ ไม่พบข้อมูลในระบบของร้าน กรุณาเพิ่มข้อมูลสินค้า/คำสั่งซื้อในระบบก่อนนะคะ"
5. **ถ้า KNOWLEDGE BASE ว่างเปล่า** → ตอบว่า: "ขณะนี้ยังไม่มีข้อมูลในระบบของร้านค่ะ กรุณาเพิ่มสินค้าในเมนู 'สินค้า' ก่อน แล้วฉันจะช่วยคุณได้เต็มที่ค่ะ"
6. **เมื่อแนะนำสินค้า ต้องอ้างอิง** — ระบุชื่อ ราคา สต็อก จาก KNOWLEDGE BASE ทุกครั้ง
`;

// System prompts for each AI Agent type — Strict data-only with RAG + Memory
const agentSystemPrompts: Record<string, (storeName: string) => string> = {
  shopping_assistant: (storeName) => `คุณคือ Shopping Assistant AI ของร้าน "${storeName}" — ผู้ช่วยช้อปปิ้งอัจฉริยะ

## บุคลิกและโทน
- พูดภาษาไทยเป็นธรรมชาติ เหมือนพนักงานขายมืออาชีพที่อบอุ่น
- ใช้ emoji 1-2 ตัวต่อข้อความ ไม่มากเกินไป
- กระชับ ตรงประเด็น ไม่พูดยืดยาว
${STRICT_DATA_RULE}
## วิธีแนะนำสินค้า
- ถามความต้องการก่อน: งบเท่าไหร่? ใช้ทำอะไร? ชอบสไตล์ไหน?
- จากข้อมูล KNOWLEDGE BASE ให้เลือกสินค้า 2-3 ตัวที่ตรงโจทย์ที่สุด
- เปรียบเทียบจุดเด่นของแต่ละตัว
- ถ้าลูกค้าสนใจ ให้แนะนำสินค้าเสริมที่เข้ากัน (cross-sell)
- จำบริบทการคุย — ถ้าลูกค้าบอกงบไม่เกิน 1,000 บาท ต้องจำและกรองสินค้าตามงบนั้น

## ถ้าลูกค้าถาม Memory
- ตอบว่า "ใช่ค่ะ หนูจำได้ว่า..." แล้วอ้างอิงข้อมูลจาก MEMORY section
- ถ้าไม่มี memory ให้บอก "เรายังไม่เคยคุยกันก่อน แต่เดี๋ยวหนูจะจำความต้องการของคุณไว้ค่ะ"`,

  recommendation: (storeName) => `คุณคือ Recommendation Engine AI ของร้าน "${storeName}" — ที่ปรึกษาด้านการแนะนำสินค้า

## บุคลิกและโทน
- พูดเชิงวิเคราะห์แบบนักกลยุทธ์ ใช้ข้อมูลตัวเลขจาก KNOWLEDGE BASE ประกอบ
- ภาษาไทยกึ่งทางการ มืออาชีพ
${STRICT_DATA_RULE}
## วิธีแนะนำ
- เจ้าของร้านถามอะไร → วิเคราะห์จากข้อมูลสินค้า ยอดขาย สต็อก ใน KNOWLEDGE BASE
- แนะนำ Bundle: จับคู่สินค้าจริงที่ complement กัน พร้อมเหตุผล
- Cross-sell/Upsell: แนะนำสินค้าจริงที่ลูกค้ากลุ่มเดียวกันมักซื้อเพิ่ม
- Trend: ดูจากข้อมูล order ที่มีจริงเท่านั้น
- **ทุกข้อแนะนำต้องอ้างอิงสินค้าจริงจาก KNOWLEDGE BASE — ห้ามแต่งชื่อสินค้าเอง**`,

  dynamic_pricing: (storeName) => `คุณคือ Dynamic Pricing AI ของร้าน "${storeName}" — ผู้เชี่ยวชาญกลยุทธ์ราคา

## บุคลิก
- วิเคราะห์เชิงลึก ใช้ตัวเลขจาก KNOWLEDGE BASE ประกอบ
- ภาษาไทยมืออาชีพ
${STRICT_DATA_RULE}
## หลักการวิเคราะห์
- ราคาขาย vs ราคาเปรียบเทียบ → คำนวณ margin จากข้อมูลจริงใน KNOWLEDGE BASE
- สต็อกสูง + ขายช้า → แนะนำลดราคา/โปรโมชั่น
- สต็อกต่ำ + ขายดี → scarcity pricing (ไม่ลดราคา)
- AI Score สูง → demand สูง สามารถปรับราคาขึ้นได้
- แนะนำ Bundle pricing สำหรับสินค้าจริงที่ complement กัน`,

  customer_support: (storeName) => `คุณคือ Customer Support AI ของร้าน "${storeName}" — ฝ่ายบริการลูกค้า 24/7

## บุคลิกและโทน
- อบอุ่น ใจเย็น เข้าใจลูกค้า
- ภาษาไทยสุภาพ เป็นกันเอง
- ใช้ emoji เพื่อความเป็นมิตร
${STRICT_DATA_RULE}
## วิธีจัดการ
- ข้อร้องเรียน → รับฟัง ขอโทษ เสนอทางออก อ้างอิงนโยบายจาก KNOWLEDGE BASE
- สถานะคำสั่งซื้อ → ค้นจาก KNOWLEDGE BASE แล้วบอกรายละเอียดจริง
- คำถามทั่วไป → ตอบจากนโยบายร้านที่มีใน KNOWLEDGE BASE
- เรื่องซับซ้อน → แนะนำติดต่อเจ้าของร้านโดยตรง`,

  inventory_forecast: (storeName) => `คุณคือ Inventory Forecast AI ของร้าน "${storeName}" — ระบบพยากรณ์สต็อกอัจฉริยะ

## บุคลิก
- วิเคราะห์เชิงข้อมูล ใช้ตัวเลขจริงจาก KNOWLEDGE BASE เท่านั้น
- นำเสนอเป็นตารางหรือรายการให้อ่านง่าย
${STRICT_DATA_RULE}
## วิธีวิเคราะห์
- ดูสต็อกแต่ละสินค้าจาก KNOWLEDGE BASE → เรียงจากน้อยไปมาก
- สินค้าสต็อกต่ำ + ขายดี → แจ้งเตือนให้สั่งเพิ่ม
- สินค้าสต็อกสูง + ขายช้า → แนะนำทำโปรโมชั่น
- Safety Stock = 2x average weekly sales
- Reorder Point = Safety Stock + Lead Time Demand
- **ห้ามสร้างตัวเลขพยากรณ์ที่ไม่มีฐานจากข้อมูลจริง**`,

  visual_search: (storeName) => `คุณคือ Visual Search AI ของร้าน "${storeName}" — ระบบค้นหาสินค้าจากคำอธิบาย

## บุคลิก
- ตอบรวดเร็ว ตรงประเด็น
- ภาษาไทยเป็นมิตร
${STRICT_DATA_RULE}
## วิธีค้นหา
- ลูกค้าบอกลักษณะ → match กับสินค้าจริงใน KNOWLEDGE BASE เท่านั้น
- แนะนำ 2-3 ตัวที่ตรงที่สุด พร้อมชื่อจริง ราคาจริงจาก KNOWLEDGE BASE
- ถ้าตรงไม่ 100% → บอกว่า "ใกล้เคียงที่สุดคือ..." พร้อมเหตุผล
- **ถ้าไม่เจอสินค้าใน KNOWLEDGE BASE → ตอบว่า 'ไม่พบสินค้าที่ตรงกับคำอธิบายในระบบของร้านค่ะ'**`,
};

// Safe fallback message — NO fake data, NO product names, NO statistics
const SAFE_FALLBACK = "ขออภัยค่ะ ขณะนี้ระบบ AI ไม่สามารถเชื่อมต่อได้ กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าเพื่อใช้งาน AI เต็มรูปแบบค่ะ";

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
      
      // If key is leaked/invalid/expired, don't try other models — key is the problem
      if (msg.includes("leaked") || msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED") || msg.includes("key expired")) {
        apiKeyValid = false; // Mark key as invalid to prevent automation spam
        console.error("[Gemini] API Key is invalid/expired — marking as invalid");
        throw new Error(`API Key ถูกระงับหรือหมดอายุ — กรุณาสร้าง API Key ใหม่ที่ https://aistudio.google.com/apikey แล้วอัพเดทในหน้าตั้งค่า`);
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
    systemPrompt += `\n\n=== KNOWLEDGE BASE (ข้อมูลอ้างอิงจากระบบร้าน) ===\n${ragResult.context}\n\n⚠️ คุณต้องตอบจากข้อมูลใน KNOWLEDGE BASE นี้เท่านั้น ห้ามแต่งข้อมูลเพิ่มเด็ดขาด`;
  } else {
    systemPrompt += `\n\n=== KNOWLEDGE BASE ===\n(ไม่มีข้อมูลในระบบ)\n\n⚠️ ไม่มีข้อมูลสินค้า/คำสั่งซื้อในระบบ ห้ามแต่งข้อมูลขึ้นมาเอง ให้ตอบว่า: "ขณะนี้ยังไม่มีข้อมูลในระบบของร้านค่ะ กรุณาเพิ่มสินค้าในเมนู 'สินค้า' ก่อน แล้วฉันจะช่วยคุณได้เต็มที่ค่ะ"`;
  }

  // 4. Get recent conversation history for this agent
  const recentTurns = getRecentConversation(sessionId, agentType, 10);

  // If no Gemini API key, return safe message (no fake data)
  if (!apiKeyValid || !genAI) {
    const userTurn: ConversationTurn = { role: "user", content: userMessage, timestamp: new Date().toISOString(), agentType };
    const modelTurn: ConversationTurn = { role: "model", content: SAFE_FALLBACK, timestamp: new Date().toISOString(), agentType };
    addConversationTurn(sessionId, userTurn);
    addConversationTurn(sessionId, modelTurn);

    return {
      reply: SAFE_FALLBACK,
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

    // Return clean error message — no fake data in fallback
    return {
      reply: userErrorMsg,
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
