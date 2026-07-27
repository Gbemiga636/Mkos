import { NextResponse } from "next/server";
import { getCmsSnapshot } from "@/lib/cms/getCms";
import { getOpenAI, STOREFRONT_SYSTEM } from "@/lib/ai/openai";
import { formatPrice } from "@/lib/cms/types";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body.messages as ChatMessage[] | undefined) ?? [];
    const last = messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-12);

    if (!last.length) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const cms = await getCmsSnapshot();
    const catalog = cms.products
      .slice(0, 24)
      .map(
        (p) =>
          `- ${p.name} (${p.slug}) · ${p.collection} · ${formatPrice(p.price)} · ${p.tagline.slice(0, 80)}`
      )
      .join("\n");

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 450,
      messages: [
        { role: "system", content: STOREFRONT_SYSTEM },
        {
          role: "system",
          content: `Live catalogue:\n${catalog}\n\nPrimary collections: Ready-to-Wear, Bespoke, Bridal (women and men exist within these). Site routes: / /shop /shop?collection=ready-to-wear /shop?collection=bespoke /shop?collection=bridal /about /experience /style-brief /about#contact /account /checkout /product/{slug}. MKoS Experience at /experience. Client Style Brief at /style-brief.`,
        },
        ...last.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "I’m here — how can I help you style today?";

    let actions: { navigate?: string; products?: string[]; openCart?: boolean } = {};
    const actionMatch = reply.match(/```actions\s*([\s\S]*?)```/i);
    let clean = reply;
    if (actionMatch) {
      clean = reply.replace(actionMatch[0], "").trim();
      try {
        actions = JSON.parse(actionMatch[1].trim());
      } catch {
        actions = {};
      }
    }

    return NextResponse.json({ reply: clean, actions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant unavailable";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
