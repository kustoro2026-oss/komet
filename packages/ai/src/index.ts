// @komet/ai - AI service layer
import OpenAI from "openai";

// ===== Types =====
export type AiTone = "professional" | "casual" | "humorous" | "formal" | "enthusiastic";
export type ContentType = "caption" | "thread" | "hashtag" | "reply" | "image_prompt";

export interface AiGenerateParams {
  type: ContentType;
  prompt: string;
  platform?: string;
  tone?: AiTone;
  context?: string;
  brandVoice?: string;
}

export interface AiGenerateResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiProvider {
  generate(params: AiGenerateParams): Promise<AiGenerateResult>;
  generateStream?(params: AiGenerateParams): AsyncIterable<string>;
}

// ===== OpenAI Provider =====
export class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async generate(params: AiGenerateParams): Promise<AiGenerateResult> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildUserPrompt(params);

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  private buildSystemPrompt(params: AiGenerateParams): string {
    const toneGuide: Record<string, string> = {
      professional: "Use formal language, industry terminology, and maintain a business-appropriate tone.",
      casual: "Use conversational language, contractions, and a friendly tone.",
      humorous: "Include wit, puns, and light-hearted humor while staying on-brand.",
      formal: "Use very professional language, avoid contractions, maintain decorum.",
      enthusiastic: "Use energetic language, exclamation points, and excitement.",
    };

    return `You are Komet AI, a social media content assistant. 
${toneGuide[params.tone || "casual"] || toneGuide.casual}
Generate content that is engaging, platform-appropriate, and concise.
${
  params.brandVoice
    ? `Brand voice guide: ${params.brandVoice}`
    : ""
}`;
  }

  private buildUserPrompt(params: AiGenerateParams): string {
    const platformNote = params.platform
      ? ` for ${params.platform}`
      : "";
    const contextNote = params.context
      ? `\nContext: ${params.context}`
      : "";

    switch (params.type) {
      case "caption":
        return `Write a social media caption${platformNote} about: ${params.prompt}.${contextNote}`;
      case "thread":
        return `Create a social media thread${platformNote} about: ${params.prompt}. Format as numbered items (1., 2., etc.). Include a hook, body, and CTA.${contextNote}`;
      case "hashtag":
        return `Generate relevant hashtags for: ${params.prompt}${platformNote}. Group them as: high-frequency, medium, niche. Return comma-separated.${contextNote}`;
      case "reply":
        return `Write a reply to this comment: "${params.prompt}"${platformNote}.${contextNote}`;
      case "image_prompt":
        return `Create a DALL-E prompt for an image about: ${params.prompt}${contextNote}`;
      default:
        return `Generate content about: ${params.prompt}${contextNote}`;
    }
  }
}

// ===== Utility functions =====
export function generateCaption(params: Omit<AiGenerateParams, "type">): Promise<AiGenerateResult> {
  const provider = new OpenAiProvider();
  return provider.generate({ ...params, type: "caption" });
}

export function generateHashtags(params: Omit<AiGenerateParams, "type">): Promise<AiGenerateResult> {
  const provider = new OpenAiProvider();
  return provider.generate({ ...params, type: "hashtag" });
}

export function generateThread(params: Omit<AiGenerateParams, "type">): Promise<AiGenerateResult> {
  const provider = new OpenAiProvider();
  return provider.generate({ ...params, type: "thread" });
}

export function generateReply(params: Omit<AiGenerateParams, "type">): Promise<AiGenerateResult> {
  const provider = new OpenAiProvider();
  return provider.generate({ ...params, type: "reply" });
}
