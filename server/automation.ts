/**
 * ZENTRA AI — Agent Automation Engine
 * 
 * Each AI agent runs background automation tasks:
 * 1. Shopping Assistant → Auto product recommendations, trending analysis  
 * 2. Recommendation Engine → Customer segmentation, cross-sell suggestions
 * 3. Dynamic Pricing → Price optimization analysis, competitor tracking
 * 4. Customer Support → Auto FAQ answers, ticket routing
 * 5. Inventory Forecast → Stock alerts, reorder point calculation
 * 6. Visual Search → Product catalog tagging, similarity indexing
 * 
 * Tasks run on intervals and store results for dashboard display.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import { indexStoreData } from "./rag";
function getGenAI(): GoogleGenerativeAI | null {
  // Use shared instance from gemini.ts (supports runtime key updates)
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

// --- Task Result Types ---

export interface AutomationTask {
  id: string;
  agentType: string;
  storeId: number;
  taskType: string;
  status: "pending" | "running" | "completed" | "failed";
  result: any;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AgentAutomationState {
  agentType: string;
  storeId: number;
  lastRunAt: string | null;
  lastResult: any;
  taskHistory: AutomationTask[];
  isRunning: boolean;
  totalRuns: number;
  successRuns: number;
  insights: AgentInsight[];
}

export interface AgentInsight {
  id: string;
  agentType: string;
  type: "alert" | "recommendation" | "analysis" | "action";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  data?: any;
  createdAt: string;
  read: boolean;
}

// --- State Store ---

const automationStates: Map<string, AgentAutomationState> = new Map();
const globalInsights: AgentInsight[] = [];
let taskIdCounter = 1;
let insightIdCounter = 1;
const automationIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

function getStateKey(agentType: string, storeId: number): string {
  return `${storeId}-${agentType}`;
}

function getOrCreateState(agentType: string, storeId: number): AgentAutomationState {
  const key = getStateKey(agentType, storeId);
  if (!automationStates.has(key)) {
    automationStates.set(key, {
      agentType,
      storeId,
      lastRunAt: null,
      lastResult: null,
      taskHistory: [],
      isRunning: false,
      totalRuns: 0,
      successRuns: 0,
      insights: [],
    });
  }
  return automationStates.get(key)!;
}

function addInsight(agentType: string, storeId: number, insight: Omit<AgentInsight, "id" | "createdAt" | "read">): AgentInsight {
  const newInsight: AgentInsight = {
    ...insight,
    id: `insight-${insightIdCounter++}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const state = getOrCreateState(agentType, storeId);
  state.insights.push(newInsight);
  // Keep only last 50 insights per agent
  if (state.insights.length > 50) state.insights = state.insights.slice(-50);
  globalInsights.push(newInsight);
  if (globalInsights.length > 200) globalInsights.splice(0, globalInsights.length - 200);
  return newInsight;
}

// --- Core Automation Tasks ---

async function runAgentTask(agentType: string, storeId: number): Promise<AutomationTask> {
  const state = getOrCreateState(agentType, storeId);
  const task: AutomationTask = {
    id: `task-${taskIdCounter++}`,
    agentType,
    storeId,
    taskType: agentType,
    status: "running",
    result: null,
    startedAt: new Date().toISOString(),
  };

  state.isRunning = true;
  state.taskHistory.push(task);
  // Keep only last 20 tasks
  if (state.taskHistory.length > 20) state.taskHistory = state.taskHistory.slice(-20);

  try {
    switch (agentType) {
      case "inventory_forecast":
        task.result = await runInventoryForecast(storeId);
        break;
      case "dynamic_pricing":
        task.result = await runDynamicPricing(storeId);
        break;
      case "recommendation":
        task.result = await runRecommendationEngine(storeId);
        break;
      case "customer_support":
        task.result = await runCustomerSupportAnalysis(storeId);
        break;
      case "shopping_assistant":
        task.result = await runShoppingAssistant(storeId);
        break;
      case "visual_search":
        task.result = await runVisualSearchIndexing(storeId);
        break;
      default:
        task.result = { message: "Unknown agent type" };
    }
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    state.lastRunAt = task.completedAt;
    state.lastResult = task.result;
    state.totalRuns++;
    state.successRuns++;
  } catch (error: any) {
    task.status = "failed";
    task.error = error.message;
    task.completedAt = new Date().toISOString();
    state.totalRuns++;
    console.error(`[Automation] ${agentType} task failed:`, error.message);
  }

  state.isRunning = false;
  return task;
}

// --- Inventory Forecast Agent ---

async function runInventoryForecast(storeId: number): Promise<any> {
  const products = await storage.getProductsByStore(storeId);
  const orders = await storage.getOrdersByStore(storeId);
  
  if (products.length === 0) return { message: "ไม่มีสินค้าในระบบ", alerts: [] };

  const alerts: any[] = [];
  const analysis: any[] = [];

  for (const product of products) {
    const stock = product.stock || 0;
    
    // Count sales from orders
    let totalSold = 0;
    for (const order of orders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.productId === product.id || item.name === product.name) {
            totalSold += (item.qty || 1);
          }
        }
      }
    }
    
    // Calculate metrics
    const daysOfData = Math.max(1, Math.ceil((Date.now() - new Date(product.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const dailySales = totalSold / daysOfData;
    const daysUntilStockout = dailySales > 0 ? Math.floor(stock / dailySales) : 999;
    const reorderPoint = Math.ceil(dailySales * 7); // 7-day safety stock
    
    analysis.push({
      productId: product.id,
      name: product.name,
      currentStock: stock,
      totalSold,
      dailySales: Math.round(dailySales * 100) / 100,
      daysUntilStockout,
      reorderPoint,
      status: stock <= 0 ? "out_of_stock" : stock <= reorderPoint ? "low" : "ok",
    });

    // Generate alerts
    if (stock <= 0) {
      alerts.push({ productId: product.id, name: product.name, type: "out_of_stock", severity: "critical", message: `${product.name} หมดสต็อก!` });
      addInsight("inventory_forecast", storeId, {
        agentType: "inventory_forecast",
        type: "alert",
        title: `⚠️ ${product.name} หมดสต็อก`,
        description: `สินค้า "${product.name}" สต็อกเป็น 0 ควรสั่งเพิ่มทันที`,
        severity: "critical",
        data: { productId: product.id, stock: 0 },
      });
    } else if (stock <= reorderPoint && dailySales > 0) {
      alerts.push({ productId: product.id, name: product.name, type: "low_stock", severity: "high", message: `${product.name} สต็อกต่ำ (${stock} ชิ้น) เหลืออีก ~${daysUntilStockout} วัน` });
      addInsight("inventory_forecast", storeId, {
        agentType: "inventory_forecast",
        type: "alert",
        title: `📦 ${product.name} สต็อกต่ำ`,
        description: `เหลือ ${stock} ชิ้น คาดว่าจะหมดใน ${daysUntilStockout} วัน ควรสั่งเพิ่ม ${reorderPoint} ชิ้น`,
        severity: "high",
        data: { productId: product.id, stock, daysUntilStockout, reorderPoint },
      });
    }
    
    // Dead stock detection
    if (totalSold === 0 && daysOfData > 7) {
      alerts.push({ productId: product.id, name: product.name, type: "dead_stock", severity: "medium", message: `${product.name} ไม่มียอดขาย ${daysOfData} วัน — ควรทำโปรโมชั่น` });
      addInsight("inventory_forecast", storeId, {
        agentType: "inventory_forecast",
        type: "recommendation",
        title: `📊 ${product.name} เป็น Dead Stock`,
        description: `ไม่มียอดขาย ${daysOfData} วัน แนะนำทำโปรโมชั่นหรือ Bundle Deal`,
        severity: "medium",
        data: { productId: product.id, daysWithoutSale: daysOfData },
      });
    }
  }

  // Use Gemini for deeper analysis if available
  let aiAnalysis: string | null = null;
  const genAI = getGenAI();
  if (genAI && analysis.length > 0) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `คุณคือ Inventory Forecast AI วิเคราะห์ข้อมูลสต็อกนี้และให้คำแนะนำ 3-5 ข้อ:

${JSON.stringify(analysis.slice(0, 20), null, 2)}

ตอบเป็นภาษาไทย สั้นกระชับ เน้นข้อมูลตัวเลข ให้คำแนะนำที่ actionable`;
      const result = await model.generateContent(prompt);
      aiAnalysis = result.response.text();
    } catch (e) {
      console.error("[Automation] Gemini analysis failed:", e);
    }
  }

  return {
    totalProducts: products.length,
    alerts,
    analysis: analysis.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout),
    aiAnalysis,
    timestamp: new Date().toISOString(),
  };
}

// --- Dynamic Pricing Agent ---

async function runDynamicPricing(storeId: number): Promise<any> {
  const products = await storage.getProductsByStore(storeId);
  const orders = await storage.getOrdersByStore(storeId);
  
  if (products.length === 0) return { message: "ไม่มีสินค้า", suggestions: [] };

  const suggestions: any[] = [];

  for (const product of products) {
    const price = Number(product.price) || 0;
    const comparePrice = Number(product.comparePrice) || 0;
    const stock = product.stock || 0;
    
    // Count sales
    let totalSold = 0;
    let totalRevenue = 0;
    for (const order of orders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.productId === product.id || item.name === product.name) {
            totalSold += (item.qty || 1);
            totalRevenue += (item.price || price) * (item.qty || 1);
          }
        }
      }
    }

    const margin = comparePrice > 0 ? ((price - (comparePrice * 0.6)) / price * 100) : 40;
    const demandScore = totalSold > 10 ? "high" : totalSold > 3 ? "medium" : "low";
    
    let suggestion = "";
    let action = "";
    let newPrice = price;
    
    // Pricing logic
    if (demandScore === "high" && stock > 20) {
      // High demand + plenty of stock → maintain or slight increase
      suggestion = "ดีมานด์สูง สต็อกเพียงพอ — สามารถปรับราคาขึ้นเล็กน้อย 3-5%";
      action = "increase";
      newPrice = Math.round(price * 1.04);
    } else if (demandScore === "high" && stock < 10) {
      // High demand + low stock → increase price (scarcity)
      suggestion = "ดีมานด์สูง สต็อกน้อย — ปรับราคาขึ้น 5-10% (Scarcity Pricing)";
      action = "increase";
      newPrice = Math.round(price * 1.07);
    } else if (demandScore === "low" && stock > 30) {
      // Low demand + high stock → discount
      suggestion = "ดีมานด์ต่ำ สต็อกมาก — แนะนำลดราคา 10-15% หรือทำ Flash Sale";
      action = "decrease";
      newPrice = Math.round(price * 0.88);
    } else if (demandScore === "low" && margin > 50) {
      // Low demand + high margin → can afford to discount
      suggestion = "ดีมานด์ต่ำ Margin สูง — ลดราคา 10% เพื่อกระตุ้นยอดขาย";
      action = "decrease";
      newPrice = Math.round(price * 0.90);
    } else {
      suggestion = "ราคาเหมาะสม — รักษาระดับเดิม";
      action = "maintain";
    }

    suggestions.push({
      productId: product.id,
      name: product.name,
      currentPrice: price,
      suggestedPrice: newPrice,
      action,
      suggestion,
      demandScore,
      totalSold,
      stock,
      margin: Math.round(margin),
    });

    // Add insights for actionable items
    if (action !== "maintain") {
      addInsight("dynamic_pricing", storeId, {
        agentType: "dynamic_pricing",
        type: "recommendation",
        title: `💰 ${product.name}: ${action === "increase" ? "ปรับราคาขึ้น" : "ลดราคา"}`,
        description: `${suggestion} ราคาปัจจุบัน ฿${price.toLocaleString()} → แนะนำ ฿${newPrice.toLocaleString()}`,
        severity: action === "increase" ? "low" : "medium",
        data: { productId: product.id, currentPrice: price, suggestedPrice: newPrice },
      });
    }
  }

  // Gemini deeper analysis
  let aiAnalysis: string | null = null;
  const genAI = getGenAI();
  if (genAI && suggestions.length > 0) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `คุณคือ Dynamic Pricing AI วิเคราะห์ข้อมูลราคาสินค้าและให้กลยุทธ์ราคา:

${JSON.stringify(suggestions.slice(0, 15), null, 2)}

ให้คำแนะนำ 3-5 ข้อ เน้นกลยุทธ์ราคา Bundle Deal และโปรโมชั่น ตอบภาษาไทยสั้นๆ`;
      const result = await model.generateContent(prompt);
      aiAnalysis = result.response.text();
    } catch (e) {
      console.error("[Automation] Pricing analysis failed:", e);
    }
  }

  return { totalProducts: products.length, suggestions, aiAnalysis, timestamp: new Date().toISOString() };
}

// --- Recommendation Engine ---

async function runRecommendationEngine(storeId: number): Promise<any> {
  const products = await storage.getProductsByStore(storeId);
  const orders = await storage.getOrdersByStore(storeId);
  const customers = await storage.getCustomersByStore(storeId);

  // Find frequently bought together
  const pairCounts: Map<string, number> = new Map();
  for (const order of orders) {
    const items = (order.items as any[]) || [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pair = [items[i].name, items[j].name].sort().join(" + ");
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
  }
  const topPairs = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));

  // Category popularity
  const categoryStats: Map<string, { sales: number; revenue: number }> = new Map();
  for (const order of orders) {
    const items = (order.items as any[]) || [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId || p.name === item.name);
      if (product?.category) {
        const cat = categoryStats.get(product.category) || { sales: 0, revenue: 0 };
        cat.sales += (item.qty || 1);
        cat.revenue += (item.price || 0) * (item.qty || 1);
        categoryStats.set(product.category, cat);
      }
    }
  }

  // Customer segments
  const segments: Record<string, number> = {};
  for (const c of customers) {
    const seg = c.segment || "new";
    segments[seg] = (segments[seg] || 0) + 1;
  }

  // Top products by sales
  const productSales: Map<number, number> = new Map();
  for (const order of orders) {
    const items = (order.items as any[]) || [];
    for (const item of items) {
      if (item.productId) {
        productSales.set(item.productId, (productSales.get(item.productId) || 0) + (item.qty || 1));
      }
    }
  }
  const topProducts = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, sales]) => {
      const p = products.find(p => p.id === id);
      return { productId: id, name: p?.name || "Unknown", sales };
    });

  if (topPairs.length > 0) {
    addInsight("recommendation", storeId, {
      agentType: "recommendation",
      type: "recommendation",
      title: "🎯 Cross-sell Opportunities",
      description: `คู่สินค้ายอดนิยม: ${topPairs.slice(0, 3).map(p => p.pair).join(", ")} — แนะนำสร้าง Bundle Deal`,
      severity: "medium",
      data: { topPairs: topPairs.slice(0, 5) },
    });
  }

  // Gemini analysis
  let aiAnalysis: string | null = null;
  const genAI = getGenAI();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `คุณคือ Recommendation Engine AI วิเคราะห์ข้อมูล:

สินค้ายอดนิยม: ${JSON.stringify(topProducts.slice(0, 5))}
คู่สินค้ายอดนิยม: ${JSON.stringify(topPairs.slice(0, 5))}
หมวดหมู่: ${JSON.stringify([...categoryStats.entries()].slice(0, 5))}
กลุ่มลูกค้า: ${JSON.stringify(segments)}

ให้คำแนะนำ 3-5 ข้อสำหรับ cross-sell, upsell, และ marketing strategy ตอบภาษาไทยสั้นๆ`;
      const result = await model.generateContent(prompt);
      aiAnalysis = result.response.text();
    } catch (e) {
      console.error("[Automation] Recommendation analysis failed:", e);
    }
  }

  return {
    topProducts,
    topPairs,
    categoryStats: [...categoryStats.entries()].map(([cat, stats]) => ({ category: cat, ...stats })),
    customerSegments: segments,
    totalCustomers: customers.length,
    aiAnalysis,
    timestamp: new Date().toISOString(),
  };
}

// --- Customer Support Analysis ---

async function runCustomerSupportAnalysis(storeId: number): Promise<any> {
  const orders = await storage.getOrdersByStore(storeId);
  
  // Analyze order statuses
  const statusCounts: Record<string, number> = {};
  const pendingOrders: any[] = [];
  
  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    if (order.status === "pending") {
      const daysPending = Math.floor((Date.now() - new Date(order.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
      if (daysPending > 2) {
        pendingOrders.push({ orderId: order.id, customer: order.customerName, daysPending, total: order.total });
      }
    }
  }

  // Generate alerts for long-pending orders
  for (const po of pendingOrders) {
    addInsight("customer_support", storeId, {
      agentType: "customer_support",
      type: "alert",
      title: `🔔 คำสั่งซื้อ #${String(po.orderId).padStart(4, "0")} รอนาน ${po.daysPending} วัน`,
      description: `ลูกค้า ${po.customer} รอดำเนินการ ${po.daysPending} วัน ยอด ฿${po.total.toLocaleString()} — ควรติดต่อลูกค้า`,
      severity: po.daysPending > 5 ? "critical" : "high",
      data: po,
    });
  }

  return {
    orderStatusSummary: statusCounts,
    longPendingOrders: pendingOrders,
    totalOrders: orders.length,
    timestamp: new Date().toISOString(),
  };
}

// --- Shopping Assistant ---

async function runShoppingAssistant(storeId: number): Promise<any> {
  const products = await storage.getProductsByStore(storeId);
  
  // Find trending / high AI score products
  const trending = products
    .filter(p => (p.aiScore || 0) > 80 && p.status === "active")
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    .slice(0, 10);

  // Products that need better descriptions
  const needsDescription = products.filter(p => !p.description || p.description.length < 20);

  if (needsDescription.length > 0) {
    addInsight("shopping_assistant", storeId, {
      agentType: "shopping_assistant",
      type: "recommendation",
      title: `📝 ${needsDescription.length} สินค้าต้องการคำอธิบาย`,
      description: `สินค้า ${needsDescription.length} รายการยังไม่มีคำอธิบายหรือสั้นเกินไป ซึ่งอาจส่งผลต่อ SEO และการตัดสินใจซื้อ`,
      severity: "medium",
      data: { products: needsDescription.map(p => ({ id: p.id, name: p.name })) },
    });
  }

  // Auto-reindex RAG data
  await indexStoreData(storeId);

  return {
    totalProducts: products.length,
    trending: trending.map(p => ({ id: p.id, name: p.name, aiScore: p.aiScore, price: p.price })),
    needsDescription: needsDescription.length,
    ragReindexed: true,
    timestamp: new Date().toISOString(),
  };
}

// --- Visual Search Indexing ---

async function runVisualSearchIndexing(storeId: number): Promise<any> {
  const products = await storage.getProductsByStore(storeId);
  
  // Analyze product categories and tags
  const categories: Map<string, number> = new Map();
  const uncategorized: any[] = [];

  for (const product of products) {
    if (product.category) {
      categories.set(product.category, (categories.get(product.category) || 0) + 1);
    } else {
      uncategorized.push({ id: product.id, name: product.name });
    }
  }

  if (uncategorized.length > 0) {
    addInsight("visual_search", storeId, {
      agentType: "visual_search",
      type: "recommendation",
      title: `🏷️ ${uncategorized.length} สินค้ายังไม่มีหมวดหมู่`,
      description: `สินค้า ${uncategorized.length} รายการยังไม่จัดหมวดหมู่ ซึ่งทำให้ค้นหาได้ยาก`,
      severity: "low",
      data: { products: uncategorized },
    });
  }

  return {
    totalProducts: products.length,
    categories: [...categories.entries()].map(([name, count]) => ({ name, count })),
    uncategorized: uncategorized.length,
    timestamp: new Date().toISOString(),
  };
}

// --- Automation Scheduler ---

export function startAutomation(storeId: number): void {
  const intervalMinutes = 10; // Run every 10 minutes
  const key = `store-${storeId}`;

  // Don't start if already running
  if (automationIntervals.has(key)) return;

  console.log(`[Automation] Starting automation for store ${storeId} (every ${intervalMinutes} min)`);

  // Run all agents immediately
  runAllAgents(storeId);

  // Schedule recurring runs
  const interval = setInterval(() => {
    runAllAgents(storeId);
  }, intervalMinutes * 60 * 1000);

  automationIntervals.set(key, interval);
}

export function stopAutomation(storeId: number): void {
  const key = `store-${storeId}`;
  const interval = automationIntervals.get(key);
  if (interval) {
    clearInterval(interval);
    automationIntervals.delete(key);
    console.log(`[Automation] Stopped automation for store ${storeId}`);
  }
}

async function runAllAgents(storeId: number): Promise<void> {
  const agents = await storage.getAiAgentsByStore(storeId);
  
  for (const agent of agents) {
    if (agent.enabled) {
      try {
        await runAgentTask(agent.type, storeId);
        // Update agent status
        await storage.updateAiAgent(agent.id, { 
          status: "active",
          lastActive: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`[Automation] Agent ${agent.type} failed:`, error);
        await storage.updateAiAgent(agent.id, { status: "error" });
      }
    }
  }
}

// --- Public API ---

export async function triggerAgent(agentType: string, storeId: number): Promise<AutomationTask> {
  return runAgentTask(agentType, storeId);
}

export function getAutomationState(agentType: string, storeId: number): AgentAutomationState {
  return getOrCreateState(agentType, storeId);
}

export function getAllAutomationStates(storeId: number): AgentAutomationState[] {
  const states: AgentAutomationState[] = [];
  automationStates.forEach((state) => {
    if (state.storeId === storeId) states.push(state);
  });
  return states;
}

export function getInsights(storeId: number, agentType?: string, unreadOnly: boolean = false): AgentInsight[] {
  let insights = globalInsights.filter(i => {
    const state = automationStates.get(getStateKey(i.agentType, storeId));
    return state?.storeId === storeId;
  });
  // Also get from state
  automationStates.forEach((state) => {
    if (state.storeId === storeId) {
      insights = [...insights, ...state.insights];
    }
  });
  // Deduplicate by ID
  const seen = new Set<string>();
  insights = insights.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  if (agentType) insights = insights.filter(i => i.agentType === agentType);
  if (unreadOnly) insights = insights.filter(i => !i.read);
  return insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markInsightRead(insightId: string): void {
  for (const insight of globalInsights) {
    if (insight.id === insightId) insight.read = true;
  }
  automationStates.forEach(state => {
    for (const insight of state.insights) {
      if (insight.id === insightId) insight.read = true;
    }
  });
}

export function getAutomationStats(storeId: number): {
  totalRuns: number;
  successRuns: number;
  totalInsights: number;
  unreadInsights: number;
  activeAgents: number;
  lastRunAt: string | null;
} {
  let totalRuns = 0, successRuns = 0, totalInsights = 0, unreadInsights = 0;
  let activeAgents = 0;
  let lastRunAt: string | null = null;

  automationStates.forEach(state => {
    if (state.storeId === storeId) {
      totalRuns += state.totalRuns;
      successRuns += state.successRuns;
      totalInsights += state.insights.length;
      unreadInsights += state.insights.filter(i => !i.read).length;
      if (state.isRunning) activeAgents++;
      if (state.lastRunAt && (!lastRunAt || state.lastRunAt > lastRunAt)) {
        lastRunAt = state.lastRunAt;
      }
    }
  });

  return { totalRuns, successRuns, totalInsights, unreadInsights, activeAgents, lastRunAt };
}
