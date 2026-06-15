import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface AccountFollower {
  accountId: string;
  platform: string;
  followers: number;
  growth: number; // estimated growth (no historical data available)
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        profile: {
          workspace: {
            ownerId: user.id,
          },
        },
      },
      select: {
        id: true,
        platform: true,
        followers: true,
        isActive: true,
      },
    });

    const accounts: AccountFollower[] = socialAccounts
      .filter((a) => a.isActive)
      .map((a) => ({
        accountId: a.id,
        platform: a.platform,
        followers: a.followers,
        growth: Math.round(a.followers * 0.05), // estimated 5% growth rate
      }));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Follower stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
