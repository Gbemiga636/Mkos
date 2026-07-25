import { NextResponse } from "next/server";
import { getOpenAI, ADMIN_COPY_SYSTEM } from "@/lib/ai/openai";

/**
 * Admin copy helper.
 * Body: { name, category?, collection?, notes?, material?, field?: 'tagline'|'description'|'story'|'all' }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Product name required" }, { status: 400 });
    }

    const field = String(body.field ?? "all");
    const fieldHint =
      field === "tagline"
        ? "Focus ONLY on tagline: a short elegant line (max ~8 words). Return empty strings for description and story."
        : field === "description"
          ? "Focus ONLY on description: 2–3 refined sentences for the product page. Return empty strings for tagline and story."
          : field === "story"
            ? "Focus ONLY on story: 2–4 sentences in MKOS brand voice. Return empty strings for tagline and description."
            : "Generate tagline, description, story, and functionality.";

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ADMIN_COPY_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            name,
            category: body.category ?? "",
            collection: body.collection ?? "",
            material: body.material ?? "",
            notes: body.notes ?? "",
            existingTagline: body.existingTagline ?? "",
            existingDescription: body.existingDescription ?? "",
            existingStory: body.existingStory ?? "",
            functionalityHints: body.functionality ?? [],
            instruction: fieldHint,
            focusField: field,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      tagline: String(parsed.tagline ?? ""),
      description: String(parsed.description ?? ""),
      story: String(parsed.story ?? ""),
      functionality: Array.isArray(parsed.functionality) ? parsed.functionality.map(String) : [],
      field,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generate failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
