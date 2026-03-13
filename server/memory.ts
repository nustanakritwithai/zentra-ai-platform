/**
 * ZENTRA AI — Agent Memory System
 * 
 * Three layers of memory:
 * 1. Short-term: Recent conversation turns (sliding window)
 * 2. Long-term: Extracted facts & preferences about each customer
 * 3. Episodic: Key interaction summaries for context continuity
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Use shared Gemini instance from gemini.ts (supports runtime key updates)
// NOTE: Cannot import from ./gemini here due to circular dependency
// Instead, use a lazy resolver that checks both shared and env
function getGenAI(): GoogleGenerativeAI | null {
  try {
    // Try to use shared instance (updated via Settings page)
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

export interface ConversationTurn {
  role: "user" | "model";
  content: string;
  timestamp: string;
  agentType: string;
}

export interface MemoryFact {
  id: number;
  fact: string;
  category: "preference" | "behavior" | "issue" | "personal" | "purchase";
  confidence: number;
  source: string; // which conversation extracted this
  createdAt: string;
  updatedAt: string;
}

export interface EpisodicMemory {
  id: number;
  summary: string;
  agentType: string;
  keyTopics: string[];
  sentiment: "positive" | "neutral" | "negative";
  createdAt: string;
}

export interface CustomerMemory {
  customerId: string; // "storeId-sessionId" or "storeId-customerEmail"
  shortTerm: ConversationTurn[]; // Last N turns per agent
  longTerm: MemoryFact[]; // Extracted facts
  episodic: EpisodicMemory[]; // Conversation summaries
}

// --- Memory Store ---

const MAX_SHORT_TERM = 20; // Keep last 20 turns per agent
const MAX_EPISODIC = 50; // Keep last 50 episode summaries
const memoryStore: Map<string, CustomerMemory> = new Map();
let factId = 1;
let episodeId = 1;

function getOrCreateMemory(customerId: string): CustomerMemory {
  if (!memoryStore.has(customerId)) {
    memoryStore.set(customerId, {
      customerId,
      shortTerm: [],
      longTerm: [],
      episodic: [],
    });
  }
  return memoryStore.get(customerId)!;
}

// --- Short-term Memory ---

export function addConversationTurn(customerId: string, turn: ConversationTurn): void {
  const memory = getOrCreateMemory(customerId);
  memory.shortTerm.push(turn);
  // Keep only last MAX_SHORT_TERM turns per agent type
  const agentTurns = memory.shortTerm.filter(t => t.agentType === turn.agentType);
  if (agentTurns.length > MAX_SHORT_TERM) {
    const oldestIdx = memory.shortTerm.findIndex(t => t.agentType === turn.agentType);
    memory.shortTerm.splice(oldestIdx, 1);
  }
}

export function getRecentConversation(customerId: string, agentType: string, limit: number = 10): ConversationTurn[] {
  const memory = getOrCreateMemory(customerId);
  return memory.shortTerm
    .filter(t => t.agentType === agentType)
    .slice(-limit);
}

// Get cross-agent context (what the customer discussed with other agents)
export function getCrossAgentContext(customerId: string, currentAgentType: string, limit: number = 5): ConversationTurn[] {
  const memory = getOrCreateMemory(customerId);
  return memory.shortTerm
    .filter(t => t.agentType !== currentAgentType)
    .slice(-limit);
}

// --- Long-term Memory (Fact Extraction) ---

export async function extractAndStoreFacts(
  customerId: string, 
  conversation: ConversationTurn[], 
  agentType: string
): Promise<MemoryFact[]> {
  if (conversation.length < 2) return [];

  const memory = getOrCreateMemory(customerId);
  
  try {
    const genAI = getGenAI();
    if (!genAI) return [];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const conversationText = conversation
      .map(t => `${t.role === "user" ? "ลูกค้า" : "Agent"}: ${t.content}`)
      .join("\n");
    
    const existingFacts = memory.longTerm.map(f => f.fact).join("; ");
    
    const prompt = `วิเคราะห์บทสนทนานี้และสกัดข้อเท็จจริงที่สำคัญเกี่ยวกับลูกค้า

บทสนทนา:
${conversationText}

ข้อเท็จจริงที่รู้แล้ว (อย่าซ้ำ):
${existingFacts || "ยังไม่มี"}

สกัดข้อเท็จจริงใหม่ในรูปแบบ JSON array:
[{"fact": "ข้อเท็จจริง", "category": "preference|behavior|issue|personal|purchase", "confidence": 0.0-1.0}]

กฎ:
- เฉพาะข้อเท็จจริงที่ชัดเจนจากบทสนทนา
- ไม่สกัดข้อเท็จจริงที่ซ้ำกับที่รู้แล้ว
- confidence 0.9+ สำหรับข้อเท็จจริงที่ชัดเจน, 0.7 สำหรับที่เป็นนัย
- ถ้าไม่มีข้อเท็จจริงใหม่ ให้ return []
- ตอบเฉพาะ JSON array เท่านั้น ไม่ต้องมีข้อความอื่น`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const facts: Array<{ fact: string; category: string; confidence: number }> = JSON.parse(jsonMatch[0]);
    
    const newFacts: MemoryFact[] = facts
      .filter(f => f.confidence >= 0.6)
      .map(f => ({
        id: factId++,
        fact: f.fact,
        category: f.category as MemoryFact["category"],
        confidence: f.confidence,
        source: agentType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    
    memory.longTerm.push(...newFacts);
    return newFacts;
  } catch (error) {
    console.error("Memory fact extraction error:", error);
    return [];
  }
}

export function getCustomerFacts(customerId: string): MemoryFact[] {
  const memory = getOrCreateMemory(customerId);
  return memory.longTerm;
}

// --- Episodic Memory (Conversation Summaries) ---

export async function createEpisodicMemory(
  customerId: string,
  conversation: ConversationTurn[],
  agentType: string
): Promise<EpisodicMemory | null> {
  if (conversation.length < 4) return null; // Need at least 2 exchanges

  const memory = getOrCreateMemory(customerId);
  
  try {
    const genAI = getGenAI();
    if (!genAI) return null;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const conversationText = conversation
      .map(t => `${t.role === "user" ? "ลูกค้า" : "Agent"}: ${t.content}`)
      .join("\n");
    
    const prompt = `สรุปบทสนทนานี้เป็น JSON:
{"summary": "สรุปสั้นๆ ของสิ่งที่คุยกัน", "keyTopics": ["หัวข้อ1", "หัวข้อ2"], "sentiment": "positive|neutral|negative"}

บทสนทนา:
${conversationText}

ตอบเฉพาะ JSON เท่านั้น`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const episode: EpisodicMemory = {
      id: episodeId++,
      summary: parsed.summary,
      agentType,
      keyTopics: parsed.keyTopics || [],
      sentiment: parsed.sentiment || "neutral",
      createdAt: new Date().toISOString(),
    };
    
    memory.episodic.push(episode);
    
    // Trim old episodes
    if (memory.episodic.length > MAX_EPISODIC) {
      memory.episodic = memory.episodic.slice(-MAX_EPISODIC);
    }
    
    return episode;
  } catch (error) {
    console.error("Episodic memory creation error:", error);
    return null;
  }
}

export function getEpisodicMemories(customerId: string, agentType?: string, limit: number = 10): EpisodicMemory[] {
  const memory = getOrCreateMemory(customerId);
  let episodes = memory.episodic;
  if (agentType) {
    episodes = episodes.filter(e => e.agentType === agentType);
  }
  return episodes.slice(-limit);
}

// --- Memory Context Builder (for Gemini prompt) ---

export function buildMemoryContext(customerId: string, agentType: string): string {
  const memory = getOrCreateMemory(customerId);
  const parts: string[] = [];
  
  // Long-term facts
  const facts = memory.longTerm;
  if (facts.length > 0) {
    parts.push("📋 ข้อมูลที่รู้เกี่ยวกับลูกค้าคนนี้:");
    facts.forEach(f => {
      parts.push(`  • [${f.category}] ${f.fact} (ความมั่นใจ: ${Math.round(f.confidence * 100)}%)`);
    });
  }
  
  // Episodic memories (last 5 interactions)
  const episodes = memory.episodic.slice(-5);
  if (episodes.length > 0) {
    parts.push("\n📝 ประวัติการสนทนาที่ผ่านมา:");
    episodes.forEach(e => {
      const agentLabel = e.agentType === agentType ? "คุณ" : e.agentType;
      parts.push(`  • [${agentLabel}] ${e.summary} (${e.sentiment})`);
    });
  }
  
  // Cross-agent context
  const crossAgent = getCrossAgentContext(customerId, agentType, 3);
  if (crossAgent.length > 0) {
    parts.push("\n🔄 สิ่งที่ลูกค้าคุยกับ Agent อื่น:");
    crossAgent.forEach(t => {
      if (t.role === "user") {
        parts.push(`  • [${t.agentType}] ลูกค้า: ${t.content.substring(0, 100)}...`);
      }
    });
  }
  
  return parts.join("\n");
}

// --- Full Memory for a Customer ---

export function getFullCustomerMemory(customerId: string): CustomerMemory {
  return getOrCreateMemory(customerId);
}

export function clearCustomerMemory(customerId: string, agentType?: string): void {
  if (!agentType) {
    memoryStore.delete(customerId);
    return;
  }
  const memory = getOrCreateMemory(customerId);
  memory.shortTerm = memory.shortTerm.filter(t => t.agentType !== agentType);
  memory.episodic = memory.episodic.filter(e => e.agentType !== agentType);
}

// --- Stats ---

export function getMemoryStats(): { totalCustomers: number; totalFacts: number; totalEpisodes: number } {
  let totalFacts = 0;
  let totalEpisodes = 0;
  memoryStore.forEach(m => {
    totalFacts += m.longTerm.length;
    totalEpisodes += m.episodic.length;
  });
  return {
    totalCustomers: memoryStore.size,
    totalFacts,
    totalEpisodes,
  };
}
