import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set(["ncert.nic.in", "www.ncert.nic.in"]);

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing PDF URL", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid PDF URL", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname) || !target.pathname.endsWith(".pdf")) {
    return new Response("Only official NCERT PDF URLs are allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "application/pdf" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new Response(`NCERT PDF unavailable (${upstream.status})`, { status: 502 });
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Source": "NCERT official",
      },
    });
  } catch {
    return new Response("Could not load the official NCERT PDF", { status: 502 });
  }
}
