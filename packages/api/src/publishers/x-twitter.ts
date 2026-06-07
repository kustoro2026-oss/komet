// X/Twitter Publisher
// Posts tweets to Twitter API v2 using OAuth 2.0 Bearer token

interface TweetResponse {
  data?: { id: string; text: string };
  errors?: Array<{ message: string; code?: number }>;
}

export async function publishToTwitter(
  accessToken: string,
  text: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data: TweetResponse = await response.json();

    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    if (data.data?.id) {
      return { success: true, postId: data.data.id };
    }

    return { success: false, error: "No tweet ID returned" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Twitter API request failed",
    };
  }
}
