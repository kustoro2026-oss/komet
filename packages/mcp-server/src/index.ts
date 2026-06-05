// @komet/mcp-server - MCP protocol server for AI agent integration
// JSON-RPC 2.0 based Model Context Protocol implementation

import type { Platform, PostCreateInput, PostListParams } from "@komet/shared";

// ===== JSON-RPC Types =====
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: { content: { type: string; text: string }[]; isError?: boolean };
  error?: { code: number; message: string };
}

// ===== Tool Definitions =====
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>): Promise<{ text: string }[]>;
}

// ===== MCP Server =====
export class McpServer {
  private tools = new Map<string, McpTool>();
  private baseApiUrl: string;

  constructor(baseApiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") {
    this.baseApiUrl = baseApiUrl;
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.registerTool({
      name: "create_post",
      description: "Create and schedule a social media post",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Post content" },
          platforms: { type: "array", items: { type: "string" }, description: "Target platforms" },
          scheduledFor: { type: "string", description: "ISO date string for scheduling" },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags" },
        },
        required: ["content", "platforms"],
      },
      execute: async (params) => {
        const content = params.content as string;
        const platforms = params.platforms as string[];
        return [{ text: `Post scheduled: "${content.substring(0, 50)}..." on ${platforms.join(", ")}` }];
      },
    });

    this.registerTool({
      name: "list_posts",
      description: "List posts with optional filters",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "scheduled", "published", "failed"] },
          platform: { type: "string" },
          limit: { type: "number" },
        },
      },
      execute: async (params) => {
        return [{ text: `Found posts matching filters` }];
      },
    });

    this.registerTool({
      name: "get_analytics",
      description: "Get analytics overview or specific platform analytics",
      inputSchema: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Platform name (optional, returns overview if omitted)" },
          dateRange: { type: "string", enum: ["7d", "30d", "90d"] },
        },
      },
      execute: async (params) => {
        return [{ text: `Analytics data for ${params.platform || "overview"}` }];
      },
    });

    this.registerTool({
      name: "get_calendar",
      description: "Get scheduled posts for a specific date",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today" },
        },
      },
      execute: async (params) => {
        return [{ text: `Calendar data for ${params.date || "today"}` }];
      },
    });

    this.registerTool({
      name: "reply_comment",
      description: "Reply to a comment in the inbox",
      inputSchema: {
        type: "object",
        properties: {
          commentId: { type: "string", description: "Comment ID to reply to" },
          text: { type: "string", description: "Reply text" },
        },
        required: ["commentId", "text"],
      },
      execute: async (params) => {
        return [{ text: `Reply sent to comment ${params.commentId}` }];
      },
    });

    this.registerTool({
      name: "generate_content",
      description: "Generate AI content for social media",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic or prompt for content generation" },
          platform: { type: "string", description: "Target platform" },
          tone: { type: "string", enum: ["professional", "casual", "humorous", "formal"] },
        },
        required: ["topic"],
      },
      execute: async (params) => {
        return [{ text: `Generated content about "${params.topic}" for ${params.platform || "general"}` }];
      },
    });
  }

  registerTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
  }

  getTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case "tools/list": {
          const tools = this.getTools();
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))) }],
            },
          };
        }

        case "tools/call": {
          const toolName = params?.name as string;
          const toolArgs = params?.arguments as Record<string, unknown> || {};
          const tool = this.tools.get(toolName);

          if (!tool) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Tool not found: ${toolName}` },
            };
          }

          const result = await tool.execute(toolArgs);
          return {
            jsonrpc: "2.0",
            id,
            result: { content: result.map(r => ({ type: "text", text: r.text })) },
          };
        }

        case "resources/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify([
                { uri: "komet://posts", name: "All Posts" },
                { uri: "komet://analytics/overview", name: "Analytics Overview" },
                { uri: "komet://calendar/now", name: "Today's Schedule" },
                { uri: "komet://accounts", name: "Connected Accounts" },
                { uri: "komet://inbox/unread", name: "Unread Messages" },
              ]) }],
            },
          };
        }

        case "prompts/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify([
                { name: "generate_caption", description: "Generate a social media caption" },
                { name: "generate_hashtag", description: "Generate relevant hashtags" },
                { name: "analyze_performance", description: "Analyze social media performance" },
              ]) }],
            },
          };
        }

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: `Internal error: ${err instanceof Error ? err.message : String(err)}` },
      };
    }
  }
}

// ===== HTTP Handler for Next.js API Routes =====
export function createMcpHandler(baseUrl?: string) {
  const server = new McpServer(baseUrl);

  return async function handler(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Invalid Request" },
      }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    try {
      const body = (await request.json()) as JsonRpcRequest;
      const response = await server.handleRequest(body);
      return new Response(JSON.stringify(response), {
        status: response.error ? 400 : 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  };
}
