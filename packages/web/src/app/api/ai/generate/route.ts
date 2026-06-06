// API Route: AI Content Generation
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, tone = "professional", length = "medium", platform, systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const lengthGuide = {
      short: "1-2 sentences, concise",
      medium: "3-5 sentences, informative",
      long: "6-10 sentences, detailed",
    }[length as string] || "3-5 sentences, informative";

    const platformGuide = platform
      ? `Optimize for ${platform} platform.`
      : "Make it suitable for social media (Twitter, LinkedIn, Instagram, Facebook).";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt || `You are a professional social media content creator. Generate engaging social media posts. 
Tone: ${tone}. Length: ${lengthGuide}. ${platformGuide}
Return only the post content, no explanations or quotes.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: length === "long" ? 500 : length === "short" ? 100 : 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || "AI generation failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedPost = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      content: generatedPost,
      usage: data.usage,
    });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
