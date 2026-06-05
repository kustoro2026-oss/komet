"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Zap,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_ACTIONS = [
  { icon: FileText, label: "Write a Twitter thread", prompt: "Write an engaging Twitter thread about social media marketing tips" },
  { icon: Zap, label: "Generate hashtags", prompt: "Generate 10 hashtags for a post about productivity tools" },
  { icon: BarChart3, label: "Analyze engagement", prompt: "How can I improve my social media engagement rate?" },
  { icon: Calendar, label: "Plan content", prompt: "Help me plan a week of content for Instagram" },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your Komet AI assistant. I can help you create content, generate ideas, analyze performance, and manage your social media. What would you like to do?",
  timestamp: new Date(),
};

export default function AiAgentPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text || input;
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: generateResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
              AI Agent
            </h1>
            <p className="text-body-sm text-[var(--color-on-dark-soft)]">
              Your intelligent social media assistant
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-caption text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
                      : "bg-[var(--color-surface-dark)]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-[var(--color-on-dark)]" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)]"
                  }`}
                >
                  <p className="text-body-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-1 text-micro opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-xl bg-[var(--color-surface-dark)] px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[var(--color-on-dark-muted)] animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-[var(--color-on-dark-muted)] animate-bounce [animation-delay:0.1s]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--color-on-dark-muted)] animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-ink-muted)] p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your content..."
                rows={1}
                className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Actions Sidebar */}
        <div className="hidden lg:flex flex-col w-72 shrink-0">
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
              <h3 className="font-display text-heading-xs font-semibold text-[var(--color-on-dark)]">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-2">
              {SUGGESTED_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-3 w-full rounded-lg border border-[var(--color-ink-muted)] p-3 text-left transition-all hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-surface-dark)] disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-dark)]">
                    <action.icon className="h-4 w-4 text-[var(--color-primary-light)]" />
                  </div>
                  <span className="text-caption font-medium text-[var(--color-on-dark)]">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("hashtag") || lower.includes("hashtags")) {
    return "Here are some relevant hashtags:\n\n#SocialMediaMarketing #ContentStrategy #DigitalMarketing #GrowthHacking #ContentCreation\n\n**High-frequency:** #Marketing #SocialMedia\n**Niche:** #SMMStrategy #ContentCalendar\n\nWould you like me to generate more specific ones for your content?";
  }
  if (lower.includes("thread") || lower.includes("twitter thread")) {
    return "Here's a Twitter thread outline:\n\n1/ 🧵 **The ultimate guide to social media scheduling**\n\n2/ Most people think posting randomly works. It doesn't. \n\n3/ Consistency is key. Here's why scheduling matters...\n\n4/ Tools like Komet make it easy to plan, schedule, and publish across all platforms.\n\n5/ What's your biggest scheduling challenge? Let me know! 👇";
  }
  if (lower.includes("engagement") || lower.includes("analytics")) {
    return "**Tips to improve engagement:**\n\n1. **Post consistently** - Aim for 4-5x per week\n2. **Use visuals** - Posts with images get 2.3x more engagement\n3. **Ask questions** - Encourage comments and discussion\n4. **Post at optimal times** - Check your analytics for peak hours\n5. **Respond to comments** - Build community through interaction\n\nWould you like me to analyze your current performance?";
  }
  if (lower.includes("content") || lower.includes("plan")) {
    return "**Weekly Content Plan for Instagram:**\n\n**Monday:** Motivational quote + branded graphic\n**Tuesday:** Behind-the-scenes photo\n**Wednesday:** Educational carousel post\n**Thursday:** User-generated content feature\n**Friday:** Product showcase + CTA\n**Saturday:** Lifestyle/culture post\n**Sunday:** Engaging question for audience\n\nWant me to write the captions for any of these?";
  }
  return "That's a great question! I can help you with:\n\n✨ **Content Creation** - Write posts, captions, and threads\n🏷️ **Hashtag Generation** - Find the best hashtags\n📊 **Analytics** - Understand your performance\n📅 **Content Planning** - Build your content calendar\n\nWhat specific area would you like to explore?";
}
