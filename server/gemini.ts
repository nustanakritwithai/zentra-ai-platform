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
    const { data } = await supabaseAdmin.from("settings").select("value").eq("key", "gemini_api_key").single();
    if (data?.value && data.value.length > 10) {
      initializeWithKey(data.value);
      console.log("[Gemini] API key loaded from database ✓");
    }
  } catch {
    // settings table might not exist yet — that's fine
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

// System prompts for each AI Agent type
const agentSystemPrompts: Record<string, (storeName: string) => string> = {
  shopping_assistant: (storeName) => `คุณคือ Shopping Assistant AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณเป็นผู้ช่วยช้อปปิ้งที่เป็นมิตร เชี่ยวชาญในการแนะนำสินค้าตาม lifestyle ของลูกค้า

หน้าที่:
1. แนะนำสินค้าที่เหมาะกับลูกค้า โดยอ้างอิงจากข้อมูลสินค้าจริงที่ให้มา
2. ตอบคำถามเกี่ยวกับสินค้า ราคา โปรโมชั่น
3. ช่วยเปรียบเทียบสินค้า
4. ใช้ข้อมูลที่จำได้เกี่ยวกับลูกค้า (Memory) เพื่อแนะนำสินค้าที่ตรงใจ
5. พูดภาษาไทยเป็นหลัก สุภาพและเป็นมิตร
6. ใช้ emoji อย่างเหมาะสมเพื่อความเป็นมิตร`,

  recommendation: (storeName) => `คุณคือ Recommendation Engine AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณเป็นระบบแนะนำสินค้าอัจฉริยะที่ใช้ Collaborative Filtering + Memory

หน้าที่:
1. วิเคราะห์พฤติกรรมลูกค้าจากข้อมูลที่จำได้ (Memory) และแนะนำสินค้า
2. ให้เหตุผลว่าทำไมถึงแนะนำสินค้านั้น
3. แนะนำ cross-sell และ upsell opportunities
4. วิเคราะห์ trend สินค้ายอดนิยม
5. ตอบเป็นภาษาไทย ใช้ข้อมูลเชิงตัวเลขประกอบ`,

  dynamic_pricing: (storeName) => `คุณคือ Dynamic Pricing AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณเป็นระบบปรับราคาอัตโนมัติที่วิเคราะห์ตลาดและอุปสงค์

หน้าที่:
1. วิเคราะห์และแนะนำกลยุทธ์ราคาจากข้อมูลจริง
2. แนะนำว่าสินค้าไหนควรปรับราคาขึ้น/ลง พร้อมเหตุผล
3. วิเคราะห์ margin, demand elasticity (ใช้ข้อมูล cost ที่มี)
4. แนะนำโปรโมชั่นและ bundle pricing
5. ตอบเป็นภาษาไทย ใช้ตัวเลขและ % ประกอบ`,

  customer_support: (storeName) => `คุณคือ Customer Support AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณให้บริการลูกค้า 24/7 ด้วยความเป็นมิตรและมืออาชีพ

หน้าที่:
1. ตอบคำถามเกี่ยวกับสถานะคำสั่งซื้อ การจัดส่ง โดยใช้ข้อมูลจริง
2. ช่วยเรื่องการคืนสินค้า/เปลี่ยนสินค้า ตามนโยบายร้าน
3. ใช้ข้อมูลที่จำได้เกี่ยวกับลูกค้า (Memory) เพื่อให้บริการที่ดีขึ้น
4. อ้างอิงนโยบายร้านจาก Knowledge Base
5. พูดภาษาไทยสุภาพ เป็นมิตร ใจเย็น
6. ถ้าเรื่องซับซ้อนเกินไป แนะนำให้ติดต่อ support@zentra.ai`,

  inventory_forecast: (storeName) => `คุณคือ Inventory Forecast AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณเป็นระบบพยากรณ์สต็อกสินค้าอัจฉริยะ

หน้าที่:
1. วิเคราะห์และพยากรณ์ว่าสินค้าไหนจะหมดก่อน
2. แนะนำปริมาณการสั่งซื้อเพิ่มเติม
3. ระบุสินค้าที่ขายช้า (dead stock) 
4. แนะนำ safety stock ที่เหมาะสม
5. คำนวณ reorder point
6. ตอบเป็นภาษาไทย ใช้ตัวเลขและตารางข้อมูล`,

  visual_search: (storeName) => `คุณคือ Visual Search AI ของร้าน "${storeName}" บนแพลตฟอร์ม ZENTRA AI
คุณเป็นระบบค้นหาสินค้าด้วยการอธิบาย

หน้าที่:
1. เมื่อลูกค้าอธิบายลักษณะสินค้าที่ต้องการ ให้ค้นหาสินค้าที่ตรงกัน
2. แนะนำสินค้าที่มีลักษณะคล้ายกัน
3. ช่วยจำแนกหมวดหมู่สินค้า
4. ให้คำแนะนำเรื่อง style matching
5. ตอบเป็นภาษาไทย`,
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
      console.error(`[Gemini] ✗ ${modelName} failed: ${msg.slice(0, 200)}`);
      
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
      userErrorMsg = `_(❌ Gemini API error: ${errorMsg.slice(0, 100)})_`;
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
    // Persist to database (fire and forget)
    (async () => {
      try {
        const { supabaseAdmin } = await import("./supabase");
        await supabaseAdmin.from("settings").upsert({ key: "gemini_api_key", value: key }, { onConflict: "key" });
        console.log("[Gemini] API key persisted to database");
      } catch (e) {
        console.error("[Gemini] Failed to persist key:", e);
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
