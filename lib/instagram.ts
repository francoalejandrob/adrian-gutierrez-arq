export type InstagramPost = {
  id: string;
  permalink: string;
  mediaUrl: string;
  caption?: string;
};

const GRAPH_VERSION = "v21.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

/**
 * Fetches recent posts from the Instagram Graph API (Instagram API with
 * Instagram Login). Requires a Business/Creator Instagram account and a
 * long-lived access token — see README for the setup steps.
 *
 * Returns an empty array (never throws) when IG_ACCESS_TOKEN is missing or
 * the request fails, so the caller can fall back to curated images.
 */
export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) return [];

  const userId = process.env.IG_USER_ID || "me";
  const url = `https://graph.instagram.com/${GRAPH_VERSION}/${userId}/media?fields=${FIELDS}&limit=${limit}&access_token=${token}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error("Instagram API error", response.status, await response.text());
      return [];
    }

    const body = (await response.json()) as {
      data?: {
        id: string;
        permalink: string;
        media_type: string;
        media_url: string;
        thumbnail_url?: string;
        caption?: string;
      }[];
    };

    return (body.data ?? [])
      .filter((item) => item.media_type !== "VIDEO" || item.thumbnail_url)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        permalink: item.permalink,
        mediaUrl: item.media_type === "VIDEO" ? item.thumbnail_url! : item.media_url,
        caption: item.caption,
      }));
  } catch (error) {
    console.error("Instagram fetch failed", error);
    return [];
  }
}
