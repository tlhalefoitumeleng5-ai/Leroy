import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";
import Stripe from "stripe";

admin.initializeApp();

const openaiKey = defineSecret("OPENAI_API_KEY");
const stripeKey = defineSecret("STRIPE_SECRET_KEY");
const payfastMerchantId = defineSecret("PAYFAST_MERCHANT_ID");
const payfastMerchantKey = defineSecret("PAYFAST_MERCHANT_KEY");

function requireAuth(uid?: string) {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
}

export const leroyChat = onCall({ secrets: [openaiKey] }, async (request) => {
  requireAuth(request.auth?.uid);
  const message = String(request.data?.message ?? "").trim();
  if (!message) {
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
  const history = Array.isArray(request.data?.history)
    ? request.data.history
    : [];
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
        content: h.content,
      })),
      { role: "user", content: message },
    ],
  });
  const reply = completion.choices[0]?.message?.content ?? "";
  if (!reply) {
    throw new HttpsError("internal", "Empty model response.");
  }
  return { reply };
});

export const leroyGenerateImage = onCall(
  { secrets: [openaiKey] },
  async (request) => {
    requireAuth(request.auth?.uid);
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
    const client = new OpenAI({ apiKey: key });
    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt: `${prompt}. Style: ${style}`,
      size: "1024x1024",
    });
    const b64 = image.data?.[0]?.b64_json;
    const url = image.data?.[0]?.url;
    if (!b64 && !url) {
      throw new HttpsError("internal", "Image generation returned no data.");
    }
    return { imageBase64: b64, imageUrl: url };
  }
);

export const leroyGenerateVideo = onCall(
  { secrets: [openaiKey] },
  async () => {
    throw new HttpsError(
      "failed-precondition",
      "Configure your video provider in leroyGenerateVideo (e.g. Runway/Sora) and redeploy."
    );
  }
);

export const leroyCreateCheckout = onCall(
  { secrets: [stripeKey, payfastMerchantId, payfastMerchantKey] },
  async (request) => {
    requireAuth(request.auth?.uid);
    const planId = String(request.data?.planId ?? "");
    const provider = String(request.data?.provider ?? "stripe");
    const prices: Record<string, number> = {
      starter: 900,
      pro: 1900,
      business: 4900,
    };
    const amount = prices[planId];
    if (!amount) {
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
              product_data: { name: `Leroy AI ${planId}` },
              unit_amount: amount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: "https://leroyai.solutions/billing/success",
        cancel_url: "https://leroyai.solutions/billing/cancel",
        client_reference_id: request.auth!.uid,
        metadata: { planId },
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
        amount: (amount / 100).toFixed(2),
        item_name: `Leroy AI ${planId}`,
        return_url: "https://leroyai.solutions/billing/success",
        cancel_url: "https://leroyai.solutions/billing/cancel",
        custom_str1: request.auth!.uid,
        custom_str2: planId,
      });
      return {
        checkoutUrl: `https://www.payfast.co.za/eng/process?${params.toString()}`,
      };
    }

    throw new HttpsError("invalid-argument", "Unknown payment provider.");
  }
);
