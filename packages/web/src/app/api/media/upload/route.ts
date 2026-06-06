// API Route: Media Upload via Zernio
// POST: accepts multipart form with a file, uploads via Zernio presigned URL
import { NextRequest, NextResponse } from "next/server";
import { ZernioClient } from "@komet/zernio-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Zernio API key not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      );
    }

    // Validate type
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "video/mp4", "video/quicktime", "video/webm",
      "audio/mpeg", "audio/wav", "audio/ogg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported` },
        { status: 400 }
      );
    }

    const client = new ZernioClient(apiKey);

    // Get presigned upload URL from Zernio
    const presigned = await client.getPresignedUrl(file.name, file.type);

    // Upload file to presigned URL
    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: `Upload failed with status ${uploadResponse.status}` },
        { status: 502 }
      );
    }

    // Determine media type category
    const category = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : "document";

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return NextResponse.json({
      success: true,
      media: {
        id: presigned.key || crypto.randomUUID(),
        name: file.name,
        type: category,
        mimeType: file.type,
        size: formatSize(file.size),
        sizeBytes: file.size,
        publicUrl: presigned.publicUrl,
        key: presigned.key,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
