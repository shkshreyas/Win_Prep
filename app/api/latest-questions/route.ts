import { NextRequest } from "next/server";

// Simple free fetchers without API keys using RSS/JSON endpoints
async function fetchReddit(role: string) {
  try {
    const q = encodeURIComponent(`${role} interview questions`);
    const url = `https://www.reddit.com/search.json?q=${q}&sort=new&t=month`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const json = await res.json();
    const posts = (json?.data?.children || []).map((c: any) => ({
      source: "reddit",
      title: c?.data?.title,
      url: `https://www.reddit.com${c?.data?.permalink}`,
      createdUtc: c?.data?.created_utc,
    }));
    return posts.slice(0, 10);
  } catch {
    return [];
  }
}

async function fetchStackOverflow(role: string) {
  try {
    const q = encodeURIComponent(`${role} interview questions`);
    const url = `https://stackprinter.appspot.com/questions?service=stackoverflow&language=en&question=1&width=640`;
    // SO search API needs key/filters; as a free workaround we skip and return empty
    return [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "software engineer";

  const [reddit, stackoverflow] = await Promise.all([
    fetchReddit(role),
    fetchStackOverflow(role),
  ]);

  const items = [...reddit, ...stackoverflow]
    .filter((p) => p?.title && p?.url)
    .slice(0, 15);

  return Response.json({ success: true, items });
}


