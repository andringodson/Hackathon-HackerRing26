import type { NextRequest } from "next/server";

/**
 * Same-origin proxy to the backend: /backend/api/events -> ${API_URL}/api/events. Build with
 * NEXT_PUBLIC_API_URL=/backend to use it. API_URL is read per request, not at build time, so one
 * image can point at any backend, and the browser needs neither CORS nor the API's address.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return Response.json({ detail: "API_URL is not set" }, { status: 503 });

  const { path } = await params;
  const target = `${apiUrl.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: request.signal,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
