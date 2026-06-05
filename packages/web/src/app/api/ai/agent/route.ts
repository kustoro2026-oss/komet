// API Route: AI Agent - handles conversational AI interactions
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 });
    }

    const systemPrompt = `You are Komet AI, an intelligent assistant for a social media scheduling platform.
You help users with:
- Generating and optimizing social media content
- Suggesting best posting times and strategies
- Analyzing content performance
- Providing platform-specific recommendations
- Answering questions about social media marketing

Keep responses concise, actionable, and friendly. Current context: ${context || "General assistance"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || "AI agent failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      reply,
      usage: data.usage,
    });
  } catch (error) {
    console.error("AI agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    model: "gpt-4o-mini",
    capabilities: [
      "content_generation",
      "content_optimization",
      "platform_strategy",
      "hashtag_suggestions",
      "post_analysis",
    ],
  });
}
