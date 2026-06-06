// API Route: AI Content Generation
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, mode, tone = "professional", length = "medium", platform, systemPrompt } = body;

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

    // Image generation mode — use DALL-E 3
    if (mode === "image") {
      const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json",
        }),
      });

      if (!imageResponse.ok) {
        const err = await imageResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.error?.message || "Image generation failed" },
          { status: imageResponse.status }
        );
      }

      const imageData = await imageResponse.json();
      const b64Json = imageData.data?.[0]?.b64_json;
      const revisedPrompt = imageData.data?.[0]?.revised_prompt || "";

      if (!b64Json) {
        return NextResponse.json(
          { error: "No image data returned" },
          { status: 500 }
        );
      }

      const dataUri = `data:image/png;base64,${b64Json}`;

      return NextResponse.json({
        content: revisedPrompt || prompt,
        imageUrl: dataUri,
        type: "image",
        usage: imageData.usage,
      });
    }

    // Text generation mode — use GPT-4o-mini
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
      type: "text",
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
