// API Route: Zernio API Proxy
// Forwards all requests to https://zernio.com/api/v1/[...path]
import { NextRequest, NextResponse } from "next/server";

async function proxyHandler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiKey = request.headers.get("x-api-key") || process.env.ZERNIO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required. Provide via x-api-key header or set ZERNIO_API_KEY env." },
      { status: 401 }
    );
  }

  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const urlPath = searchParams ? `/${path}?${searchParams}` : `/${path}`;

    let body: unknown;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.json().catch(() => undefined);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    };

    // Only set Content-Type when there's a body (POST/PUT/PATCH)
    // Sending Content-Type on GET requests can cause 400 errors
    const hasBody = body !== undefined && body !== null;
    if (hasBody && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`https://zernio.com/api/v1${urlPath}`, {
      method: request.method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    const responseData = response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : await response.text();

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("Zernio proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyHandler(request, { params });
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyHandler(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyHandler(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyHandler(request, { params });
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyHandler(request, { params });
}
