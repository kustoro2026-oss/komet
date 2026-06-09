// API Route: Media Upload via Supabase Storage
// POST: accepts multipart form with a file, uploads directly to Supabase Storage
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user via session cookie
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@komet/db");

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

    const supabase = getSupabaseAdmin();

    // Auto-create media bucket if it doesn't exist
    const bucketName = process.env.MEDIA_BUCKET || "media";
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucketName);
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
          "video/mp4", "video/quicktime", "video/webm",
          "audio/mpeg", "audio/wav", "audio/ogg",
          "application/pdf",
        ],
      });
      if (createBucketError) {
        console.error(`Failed to create '${bucketName}' bucket:`, createBucketError);
        return NextResponse.json(
          { error: `Storage not configured. Please create a '${bucketName}' bucket in Supabase.` },
          { status: 500 }
        );
      }
      console.log(`✅ Created '${bucketName}' storage bucket`);
    }

    const fileExt = file.name.split(".").pop() || "bin";
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = `temp/${user.id}/${fileName}`;

    // Upload file to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Determine media type category
    const category = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : "document";

    // Save media record to database
    const mediaRecord = await prisma.media.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: publicUrlData.publicUrl,
        type: category,
      },
    });

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return NextResponse.json({
      success: true,
      media: {
        id: mediaRecord.id,
        name: file.name,
        type: category,
        mimeType: file.type,
        size: formatSize(file.size),
        sizeBytes: file.size,
        publicUrl: publicUrlData.publicUrl,
        key: filePath,
        createdAt: mediaRecord.createdAt.toISOString(),
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
