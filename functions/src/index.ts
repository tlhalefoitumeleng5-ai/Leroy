import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createHash } from "crypto";
import OpenAI from "openai";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

const openaiKey = defineSecret("OPENAI_API_KEY");
const falKey = defineSecret("FAL_KEY");
const stripeKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const payfastMerchantId = defineSecret("PAYFAST_MERCHANT_ID");
const payfastMerchantKey = defineSecret("PAYFAST_MERCHANT_KEY");
const payfastPassphrase = defineSecret("PAYFAST_PASSPHRASE");

const PLAN_LIMITS: Record<
  string,
  { chatPerDay: number; imagesPerDay: number; videosPerDay: number }
> = {
  free: { chatPerDay: 20, imagesPerDay: 3, videosPerDay: 1 },
  starter: { chatPerDay: 9999, imagesPerDay: 50, videosPerDay: 10 },
  pro: { chatPerDay: 9999, imagesPerDay: 200, videosPerDay: 50 },
  business: { chatPerDay: 9999, imagesPerDay: 9999, videosPerDay: 9999 },
};

const DEFAULT_PLANS = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    period: "/month",
    priceCents: 0,
    isPopular: false,
    sortOrder: 0,
    features: [
      "Limited AI chat",
      "3 images / day",
      "1 video / day",
      "Prompt library access",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$9",
    period: "/month",
    priceCents: 900,
    isPopular: false,
    sortOrder: 1,
    features: [
      "Unlimited chat",
      "50 images / day",
      "10 videos / day",
      "Priority responses",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$19",
    period: "/month",
    priceCents: 1900,
    isPopular: true,
    sortOrder: 2,
    features: [
      "Everything in Starter",
      "200 images / day",
      "50 videos / day",
      "Voice chat",
      "History sync",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceLabel: "$49",
    period: "/month",
    priceCents: 4900,
    isPopular: false,
    sortOrder: 3,
    features: [
      "Everything in Pro",
      "Team seats",
      "API access",
      "Dedicated support",
      "Custom templates",
    ],
  },
];

function requireAuth(uid?: string): string {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return uid;
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function assertQuota(
  uid: string,
  kind: "chat" | "image" | "video"
): Promise<void> {
  const userSnap = await db.collection("users").doc(uid).get();
  const plan = (userSnap.data()?.plan as string) || "free";
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const usageRef = db
    .collection("users")
    .doc(uid)
    .collection("usage")
    .doc(dayKey());
  const usageSnap = await usageRef.get();
  const usage = usageSnap.data() ?? {};
  const used =
    kind === "chat"
      ? Number(usage.chat ?? 0)
      : kind === "image"
        ? Number(usage.images ?? 0)
        : Number(usage.videos ?? 0);
  const limit =
    kind === "chat"
      ? limits.chatPerDay
      : kind === "image"
        ? limits.imagesPerDay
        : limits.videosPerDay;
  if (used >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      `Daily ${kind} limit reached for your ${plan} plan. Upgrade to continue.`
    );
  }
}

async function bumpUsage(
  uid: string,
  kind: "chat" | "image" | "video"
): Promise<void> {
  const field = kind === "chat" ? "chat" : kind === "image" ? "images" : "videos";
  await db
    .collection("users")
    .doc(uid)
    .collection("usage")
    .doc(dayKey())
    .set({ [field]: admin.firestore.FieldValue.increment(1) }, { merge: true });
}

function mapImageSize(ratio: string): "1024x1024" | "1536x1024" | "1024x1536" {
  switch (ratio) {
    case "16:9":
    case "4:3":
      return "1536x1024";
    case "9:16":
      return "1024x1536";
    default:
      return "1024x1024";
  }
}

async function setUserPlan(
  uid: string,
  planId: string,
  provider: string,
  externalId?: string
): Promise<void> {
  await db.collection("users").doc(uid).set({ plan: planId }, { merge: true });
  await db.collection("subscriptions").doc(uid).set(
    {
      planId,
      provider,
      status: "active",
      externalId: externalId ?? null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export const leroySeedCatalog = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const batch = db.batch();
  for (const plan of DEFAULT_PLANS) {
    batch.set(db.collection("plans").doc(plan.id), plan, { merge: true });
  }
  const prompts = [
    {
      id: "cinematic-portrait",
      title: "Cinematic Portrait",
      category: "Image",
      content:
        "Create a cinematic portrait with soft rim light, shallow depth of field, and rich teal accents.",
      tags: ["portrait", "cinematic"],
    },
    {
      id: "product-launch",
      title: "Product Launch Script",
      category: "Writing",
      content:
        "Write a concise product launch announcement highlighting the problem, solution, and call to action.",
      tags: ["marketing", "copy"],
    },
    {
      id: "travel-reel",
      title: "Travel Reel Brief",
      category: "Video",
      content:
        "Generate a 10-second travel reel: sunrise coastline, slow drone push-in, soft ambient music.",
      tags: ["travel", "reel"],
    },
    {
      id: "assistant-standup",
      title: "Daily Standup Coach",
      category: "Assistant",
      content:
        "Help me plan my day: prioritize top 3 tasks, estimate time, and suggest focus blocks.",
      tags: ["productivity"],
    },
  ];
  for (const prompt of prompts) {
    batch.set(db.collection("prompts").doc(prompt.id), prompt, { merge: true });
  }
  const templates = [
    {
      id: "brand-story",
      title: "Brand Story",
      description: "Craft a short brand narrative",
      content:
        "Tell the origin story of my brand in 120 words with a confident, modern tone.",
      category: "Brand",
    },
    {
      id: "ad-hook",
      title: "Ad Hook",
      description: "Scroll-stopping first line",
      content:
        "Write 5 ad hooks under 12 words for a premium AI creative app.",
      category: "Ads",
    },
  ];
  for (const template of templates) {
    batch.set(db.collection("templates").doc(template.id), template, {
      merge: true,
    });
  }
  await batch.commit();
  return { ok: true, plans: DEFAULT_PLANS.length, prompts: prompts.length };
});

export const leroyChat = onCall({ secrets: [openaiKey] }, async (request) => {
  const uid = requireAuth(request.auth?.uid);
  await assertQuota(uid, "chat");
  const history = Array.isArray(request.data?.history)
    ? request.data.history
    : [];
  const message = String(
    request.data?.message ??
      (history.length ? history[history.length - 1]?.content : "") ??
      ""
  ).trim();
  if (!message && history.length === 0) {
    throw new HttpsError("invalid-argument", "Message is required.");
  }
  const key = openaiKey.value();
  if (!key) {
    throw new HttpsError(
      "failed-precondition",
      "OPENAI_API_KEY secret is not configured."
    );
  }
  const client = new OpenAI({ apiKey: key });
  // History already includes the latest user message — do not append again.
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are Leroy AI, a premium creative assistant by Leroy AI Solutions.",
      },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: String(h.content ?? ""),
      })),
    ],
  });
  const reply = completion.choices[0]?.message?.content ?? "";
  if (!reply) {
    throw new HttpsError("internal", "Empty model response.");
  }
  await bumpUsage(uid, "chat");
  return { reply };
});

export const leroyGenerateImage = onCall(
  { secrets: [openaiKey] },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    await assertQuota(uid, "image");
    const prompt = String(request.data?.prompt ?? "").trim();
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt is required.");
    }
    const key = openaiKey.value();
    if (!key) {
      throw new HttpsError(
        "failed-precondition",
        "OPENAI_API_KEY secret is not configured."
      );
    }
    const style = String(request.data?.style ?? "cinematic");
    const size = mapImageSize(String(request.data?.size ?? "1:1"));
    const client = new OpenAI({ apiKey: key });
    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt: `${prompt}. Style: ${style}`,
      size,
    });
    const b64 = image.data?.[0]?.b64_json;
    const url = image.data?.[0]?.url;
    if (!b64 && !url) {
      throw new HttpsError("internal", "Image generation returned no data.");
    }
    await bumpUsage(uid, "image");
    return { imageBase64: b64, imageUrl: url, size };
  }
);

export const leroyGenerateVideo = onCall(
  { secrets: [falKey], timeoutSeconds: 300, memory: "1GiB" },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    await assertQuota(uid, "video");
    const prompt = String(request.data?.prompt ?? "").trim();
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt is required.");
    }
    const key = falKey.value();
    if (!key) {
      throw new HttpsError(
        "failed-precondition",
        "FAL_KEY secret is not configured for video generation."
      );
    }

    const durationSeconds = Number(request.data?.durationSeconds ?? 5);
    const quality = String(request.data?.quality ?? "hd");
    const voiceEnabled = Boolean(request.data?.voiceEnabled);
    const musicEnabled = Boolean(request.data?.musicEnabled);

    const enrichedPrompt = [
      prompt,
      voiceEnabled ? "Include natural voice narration." : null,
      musicEnabled ? "Include soft background music." : null,
      `Target duration about ${durationSeconds} seconds.`,
      quality === "4k"
        ? "Ultra high detail, 4K look."
        : quality === "hd"
          ? "High definition."
          : "Standard definition.",
    ]
      .filter(Boolean)
      .join(" ");

    const endpoint =
      "https://fal.run/fal-ai/minimax/video-01-live";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enrichedPrompt,
        prompt_optimizer: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new HttpsError(
        "internal",
        `Video provider error (${response.status}): ${body.slice(0, 300)}`
      );
    }

    const payload = (await response.json()) as {
      video?: { url?: string };
      video_url?: string;
    };
    const videoUrl = payload.video?.url ?? payload.video_url;
    if (!videoUrl) {
      throw new HttpsError("internal", "Video generation returned no URL.");
    }

    await bumpUsage(uid, "video");
    return {
      videoUrl,
      durationSeconds,
      quality,
      voiceEnabled,
      musicEnabled,
    };
  }
);

export const leroyCreateCheckout = onCall(
  { secrets: [stripeKey, payfastMerchantId, payfastMerchantKey] },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const planId = String(request.data?.planId ?? "");
    const provider = String(request.data?.provider ?? "stripe");
    const plan = DEFAULT_PLANS.find((p) => p.id === planId);
    if (!plan || plan.priceCents <= 0) {
      throw new HttpsError("invalid-argument", "Invalid paid plan.");
    }

    if (provider === "stripe") {
      const key = stripeKey.value();
      if (!key) {
        throw new HttpsError(
          "failed-precondition",
          "STRIPE_SECRET_KEY is not configured."
        );
      }
      const stripe = new Stripe(key);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: `Leroy AI ${plan.name}` },
              unit_amount: plan.priceCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: "https://leroyai.solutions/billing/success",
        cancel_url: "https://leroyai.solutions/billing/cancel",
        client_reference_id: uid,
        metadata: { planId, uid },
      });
      if (!session.url) {
        throw new HttpsError("internal", "Stripe session missing URL.");
      }
      return { checkoutUrl: session.url };
    }

    if (provider === "payfast") {
      const merchantId = payfastMerchantId.value();
      const merchantKey = payfastMerchantKey.value();
      if (!merchantId || !merchantKey) {
        throw new HttpsError(
          "failed-precondition",
          "PayFast secrets are not configured."
        );
      }
      const params = new URLSearchParams({
        merchant_id: merchantId,
        merchant_key: merchantKey,
        amount: (plan.priceCents / 100).toFixed(2),
        item_name: `Leroy AI ${plan.name}`,
        return_url: "https://leroyai.solutions/billing/success",
        cancel_url: "https://leroyai.solutions/billing/cancel",
        notify_url: "https://us-central1-leroy-ai.cloudfunctions.net/leroyPayfastItn",
        custom_str1: uid,
        custom_str2: planId,
      });
      return {
        checkoutUrl: `https://www.payfast.co.za/eng/process?${params.toString()}`,
      };
    }

    throw new HttpsError("invalid-argument", "Unknown payment provider.");
  }
);

export const leroyStripeWebhook = onRequest(
  { secrets: [stripeKey, stripeWebhookSecret] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    const key = stripeKey.value();
    const whSecret = stripeWebhookSecret.value();
    if (!key || !whSecret) {
      res.status(500).send("Stripe webhook not configured");
      return;
    }
    const stripe = new Stripe(key);
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing signature");
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        whSecret
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.updated"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid =
        session.client_reference_id ||
        (session.metadata?.uid as string | undefined);
      const planId = session.metadata?.planId;
      if (uid && planId) {
        await setUserPlan(uid, planId, "stripe", session.id);
      }
    }
    res.json({ received: true });
  }
);

export const leroyPayfastItn = onRequest(
  { secrets: [payfastMerchantId, payfastMerchantKey, payfastPassphrase] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    const body = req.body as Record<string, string>;
    const uid = body.custom_str1;
    const planId = body.custom_str2;
    const paymentStatus = body.payment_status;
    if (!uid || !planId) {
      res.status(400).send("Missing custom fields");
      return;
    }

    // Verify signature when passphrase is configured.
    const passphrase = payfastPassphrase.value();
    if (passphrase && body.signature) {
      const entries = Object.keys(body)
        .filter((k) => k !== "signature")
        .sort()
        .map((k) => `${k}=${encodeURIComponent(String(body[k]).trim()).replace(/%20/g, "+")}`);
      entries.push(
        `passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
      );
      const expected = createHash("md5").update(entries.join("&")).digest("hex");
      if (expected !== body.signature) {
        res.status(400).send("Invalid signature");
        return;
      }
    }

    if (paymentStatus === "COMPLETE") {
      await setUserPlan(uid, planId, "payfast", body.pf_payment_id);
    }
    res.status(200).send("OK");
  }
);
