import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ─── Pesapal Config ──────────────────────────────────────────────────────────
const PESAPAL_ENV = process.env.PESAPAL_ENV || "sandbox";
const PESAPAL_BASE =
  PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || "";

// ─── Supabase Admin Config ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ─── Get Pesapal OAuth Token ─────────────────────────────────────────────────
async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Pesapal token parse error: ${text}`); }
  console.log("Pesapal token response:", JSON.stringify(data));
  if (!data.token) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data));
  return data.token;
}

// ─── Register IPN URL ────────────────────────────────────────────────────────
async function registerIPN(token: string, ipnUrl: string): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
  });
  const data = (await res.json()) as any;
  if (!data.ipn_id) throw new Error(data.error || "Failed to register IPN");
  return data.ipn_id;
}

// ─── Submit Order ─────────────────────────────────────────────────────────────
async function submitOrder(
  token: string,
  payload: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    callbackUrl: string;
    ipnId: string;
    email: string;
    firstName: string;
    lastName: string;
  }
): Promise<{ redirectUrl: string; orderTrackingId: string }> {
  const res = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: payload.id,
      currency: payload.currency,
      amount: payload.amount,
      description: payload.description,
      callback_url: payload.callbackUrl,
      notification_id: payload.ipnId,
      billing_address: {
        email_address: payload.email,
        phone_number: "",
        country_code: "KE",
        first_name: payload.firstName,
        last_name: payload.lastName,
        line_1: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: "",
      },
    }),
  });
  const data = (await res.json()) as any;
  if (!data.redirect_url) throw new Error(data.error || "Failed to submit order");
  return { redirectUrl: data.redirect_url, orderTrackingId: data.order_tracking_id };
}

// ─── Check Transaction Status ─────────────────────────────────────────────────
async function getTransactionStatus(
  token: string,
  orderTrackingId: string
): Promise<{ statusCode: number; paymentMethod: string; confirmationCode: string }> {
  const res = await fetch(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }
  );
  const data = (await res.json()) as any;
  return {
    statusCode: data.payment_status_code,
    paymentMethod: data.payment_method || "",
    confirmationCode: data.confirmation_code || "",
  };
}

// ─── Supabase admin helpers ───────────────────────────────────────────────────
async function supabaseAdmin(path: string, method: string, body?: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Activate plan: update user_payments + user_storage
async function activatePlan(
  userId: string,
  planId: string,
  merchantReference: string,
  orderTrackingId: string,
  paymentMethod: string,
  amountKes: number
) {
  const now = new Date();
  const next30 = new Date(now);
  next30.setDate(next30.getDate() + 30);

  // 1. Get the plan's storage_limit
  const plans = await supabaseAdmin(
    `payment_plans?id=eq.${planId}&select=storage_limit,name`,
    "GET"
  );
  const plan = Array.isArray(plans) ? plans[0] : null;
  if (!plan) throw new Error("Plan not found");

  // 2. Upsert user_payments record
  await supabaseAdmin("user_payments", "POST", {
    user_id: userId,
    plan_id: planId,
    amount_kes: amountKes,
    payment_status: "completed",
    payment_method: paymentMethod,
    payment_date: now.toISOString(),
    pesapal_merchant_reference: merchantReference,
    pesapal_tracking_id: orderTrackingId,
    subscription_start: now.toISOString(),
    subscription_end: next30.toISOString(),
    transaction_id: orderTrackingId,
  });

  // 3. Update user_storage
  const existing = await supabaseAdmin(
    `user_storage?user_id=eq.${userId}&select=id`,
    "GET"
  );
  if (Array.isArray(existing) && existing.length > 0) {
    await supabaseAdmin(`user_storage?user_id=eq.${userId}`, "PATCH", {
      storage_limit: plan.storage_limit,
    });
  } else {
    await supabaseAdmin("user_storage", "POST", {
      user_id: userId,
      storage_limit: plan.storage_limit,
      storage_used: 0,
    });
  }

  return { planName: plan.name, storageLimit: plan.storage_limit };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/pesapal/initiate
app.post("/api/pesapal/initiate", async (req, res) => {
  try {
    const { planId, planName, amountKes, userId, userEmail, userName } = req.body as {
      planId: string;
      planName: string;
      amountKes: number;
      userId: string;
      userEmail: string;
      userName: string;
    };

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return res.status(500).json({ error: "Pesapal credentials not configured. Please set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET." });
    }
    if (!SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured." });
    }

    const [firstName, ...rest] = (userName || "Kiko User").split(" ");
    const lastName = rest.join(" ") || "User";

    const merchantReference = `KIKO-${userId.slice(0, 8)}-${Date.now()}`;

    // Get the app's public URL for callbacks
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `http://localhost:5000`;
    const callbackUrl = `${host}/payment/callback?ref=${merchantReference}&planId=${planId}&userId=${userId}&amount=${amountKes}`;
    const ipnUrl = `${host}/api/pesapal/ipn`;

    const token = await getPesapalToken();
    const ipnId = await registerIPN(token, ipnUrl);
    const { redirectUrl, orderTrackingId } = await submitOrder(token, {
      id: merchantReference,
      amount: amountKes,
      currency: "KES",
      description: `Kiko ${planName} Plan`,
      callbackUrl,
      ipnId,
      email: userEmail,
      firstName,
      lastName,
    });

    // Store pending payment in Supabase so we can verify later
    await supabaseAdmin("user_payments", "POST", {
      user_id: userId,
      plan_id: planId,
      amount_kes: amountKes,
      payment_status: "pending",
      pesapal_merchant_reference: merchantReference,
      pesapal_tracking_id: orderTrackingId,
    });

    return res.json({ redirectUrl, merchantReference, orderTrackingId });
  } catch (err: any) {
    console.error("Pesapal initiate error:", err);
    return res.status(500).json({ error: err.message || "Payment initiation failed" });
  }
});

// POST /api/pesapal/verify
app.post("/api/pesapal/verify", async (req, res) => {
  try {
    const { orderTrackingId, merchantReference, userId, planId, amountKes } = req.body as {
      orderTrackingId: string;
      merchantReference: string;
      userId: string;
      planId: string;
      amountKes: number;
    };

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return res.status(500).json({ error: "Pesapal credentials not configured" });
    }

    const token = await getPesapalToken();
    const { statusCode, paymentMethod, confirmationCode } = await getTransactionStatus(
      token,
      orderTrackingId
    );

    // statusCode: 1 = COMPLETED, 0 = PENDING, 2 = FAILED
    if (statusCode === 1) {
      const result = await activatePlan(
        userId,
        planId,
        merchantReference,
        orderTrackingId,
        paymentMethod,
        amountKes
      );
      return res.json({ status: "completed", ...result });
    } else if (statusCode === 0) {
      return res.json({ status: "pending" });
    } else {
      return res.json({ status: "failed", statusCode });
    }
  } catch (err: any) {
    console.error("Pesapal verify error:", err);
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
});

// GET /api/pesapal/ipn  — Pesapal calls this after payment
app.get("/api/pesapal/ipn", async (req, res) => {
  try {
    const { orderTrackingId, orderMerchantReference, orderNotificationType } = req.query as {
      orderTrackingId: string;
      orderMerchantReference: string;
      orderNotificationType: string;
    };

    if (!orderTrackingId || !orderMerchantReference) {
      return res.json({ orderNotificationType: "IPNCHANGE", orderTrackingId, orderMerchantReference, status: "200" });
    }

    const token = await getPesapalToken();
    const { statusCode, paymentMethod } = await getTransactionStatus(token, orderTrackingId);

    if (statusCode === 1) {
      // Look up the pending payment in Supabase to get userId, planId, amount
      const payments = await supabaseAdmin(
        `user_payments?pesapal_merchant_reference=eq.${orderMerchantReference}&select=user_id,plan_id,amount_kes`,
        "GET"
      );
      if (Array.isArray(payments) && payments.length > 0) {
        const { user_id, plan_id, amount_kes } = payments[0];
        await activatePlan(user_id, plan_id, orderMerchantReference, orderTrackingId, paymentMethod, amount_kes);
      }
    }

    return res.json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId,
      orderMerchantReference,
      status: "200",
    });
  } catch (err: any) {
    console.error("IPN error:", err);
    return res.status(500).json({ status: "500" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
