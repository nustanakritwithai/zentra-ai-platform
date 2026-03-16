import crypto from "crypto";

// ============= Configuration =============

const OPN_API_BASE = "https://api.omise.co";
const OPN_VAULT_BASE = "https://vault.omise.co";

// ============= Key Hashing =============

export function hashSecretKey(secretKey: string): string {
  return crypto.createHash("sha256").update(secretKey).digest("hex");
}

export function verifySecretKey(secretKey: string, hash: string): boolean {
  return hashSecretKey(secretKey) === hash;
}

// ============= OPN/Omise API Helpers =============

async function opnRequest(
  method: string,
  path: string,
  secretKey: string,
  body?: Record<string, any>
): Promise<any> {
  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const options: RequestInit = { method, headers };

  if (body && (method === "POST" || method === "PATCH")) {
    options.body = flattenToFormData(body);
  }

  const response = await fetch(`${OPN_API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new OpnApiError(
      data?.message || "OPN API error",
      data?.code || "unknown",
      response.status
    );
  }

  return data;
}

function flattenToFormData(
  obj: Record<string, any>,
  prefix = ""
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && value !== undefined) {
      if (typeof value === "object" && !Array.isArray(value)) {
        const nested = flattenToFormData(value, fullKey);
        nested.forEach((v, k) => params.append(k, v));
      } else {
        params.append(fullKey, String(value));
      }
    }
  }
  return params;
}

export class OpnApiError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "OpnApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============= PromptPay QR Payment =============

export async function createPromptPayCharge(
  secretKey: string,
  amountSatang: number,
  orderId: string,
  metadata?: Record<string, string>
): Promise<{
  chargeId: string;
  qrCodeUrl: string;
  expiresAt: string;
  status: string;
}> {
  const charge = await opnRequest("POST", "/charges", secretKey, {
    amount: amountSatang,
    currency: "THB",
    source: { type: "promptpay" },
    metadata: { order_id: orderId, ...metadata },
  });

  return {
    chargeId: charge.id,
    qrCodeUrl: charge.source?.scannable_code?.image?.download_uri || "",
    expiresAt: charge.expires_at || "",
    status: charge.status,
  };
}

// ============= TrueMoney Wallet Payment =============

export async function createTrueMoneyCharge(
  secretKey: string,
  amountSatang: number,
  phoneNumber: string,
  orderId: string,
  returnUri: string,
  metadata?: Record<string, string>
): Promise<{
  chargeId: string;
  authorizeUri: string;
  status: string;
}> {
  const charge = await opnRequest("POST", "/charges", secretKey, {
    amount: amountSatang,
    currency: "THB",
    source: {
      type: "truemoney",
      phone_number: phoneNumber,
    },
    return_uri: returnUri,
    metadata: { order_id: orderId, ...metadata },
  });

  return {
    chargeId: charge.id,
    authorizeUri: charge.authorize_uri || "",
    status: charge.status,
  };
}

// ============= Retrieve Charge Status =============

export async function getChargeStatus(
  secretKey: string,
  chargeId: string
): Promise<{
  chargeId: string;
  status: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
}> {
  const charge = await opnRequest("GET", `/charges/${chargeId}`, secretKey);

  return {
    chargeId: charge.id,
    status: charge.status,
    amount: charge.amount,
    currency: charge.currency,
    paidAt: charge.paid_at || null,
    failureCode: charge.failure_code || null,
    failureMessage: charge.failure_message || null,
  };
}

// ============= Refund =============

export async function createRefund(
  secretKey: string,
  chargeId: string,
  amountSatang?: number
): Promise<{
  refundId: string;
  status: string;
  amount: number;
}> {
  const body: Record<string, any> = {};
  if (amountSatang) body.amount = amountSatang;

  const refund = await opnRequest(
    "POST",
    `/charges/${chargeId}/refunds`,
    secretKey,
    body
  );

  return {
    refundId: refund.id,
    status: refund.status,
    amount: refund.amount,
  };
}

// ============= Webhook Verification =============

export function verifyOmiseWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

export function parseOmiseWebhookEvent(payload: string): {
  eventType: string;
  eventId: string;
  chargeId: string | null;
  chargeStatus: string | null;
  data: any;
} {
  const event = JSON.parse(payload);
  const chargeData = event.data;

  return {
    eventType: event.key || "",
    eventId: event.id || "",
    chargeId: chargeData?.id || null,
    chargeStatus: chargeData?.status || null,
    data: chargeData,
  };
}

// ============= Stripe Helpers (B2B Subscriptions) =============

export async function createStripeCheckoutSession(
  stripeSecretKey: string,
  priceId: string,
  customerId: string | null,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const body: Record<string, any> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: successUrl,
    cancel_url: cancelUrl,
  };
  if (customerId) {
    body.customer = customerId;
  }

  const params = new URLSearchParams(body);
  const response = await fetch(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe API error");
  }

  return {
    sessionId: data.id,
    url: data.url,
  };
}

export function verifyStripeWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  // Stripe uses a specific header format: t=timestamp,v1=signature
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.replace("t=", "");
  const sig = sigPart.replace("v1=", "");

  const signedPayload = `${timestamp}.${payload}`;
  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig));
}

// ============= Amount Conversion =============

export function thbToSatang(thb: number): number {
  return Math.round(thb * 100);
}

export function satangToThb(satang: number): number {
  return satang / 100;
}

// ============= Platform Fee Calculation =============

export function calculatePlatformFee(
  amount: number,
  feePercentage: number,
  minFee?: number | null,
  maxFee?: number | null
): { fee: number; netAmount: number } {
  let fee = Math.round((amount * feePercentage) / 100 * 100) / 100;
  if (minFee && fee < minFee) fee = minFee;
  if (maxFee && fee > maxFee) fee = maxFee;
  return { fee, netAmount: Math.round((amount - fee) * 100) / 100 };
}
