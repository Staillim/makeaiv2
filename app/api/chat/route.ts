import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Log para debugging
    console.log("🔵 Chat API called");
    console.log("🔑 API Key exists:", !!process.env.ANTHROPIC_API_KEY);
    console.log("🔑 API Key length:", process.env.ANTHROPIC_API_KEY?.length || 0);
    
    const { messages, system, maxTokens = 600 } = await req.json();
    
    console.log("📨 Request data:", {
      messagesCount: messages?.length,
      systemLength: system?.length,
      maxTokens,
    });

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY no está configurada");
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
    }

    console.log("🚀 Calling Anthropic API...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    });
    
    console.log("✅ Anthropic API response received");

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("❌ Chat API error:", err);
    console.error("❌ Error details:", {
      message: err?.message,
      status: err?.status,
      type: err?.type,
      name: err?.name,
    });
    return NextResponse.json(
      { 
        error: "Error interno", 
        details: err?.message || "Error desconocido",
        type: err?.type,
      }, 
      { status: 500 }
    );
  }
}
