import { NextRequest, NextResponse } from "next/server";

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

  if (
    target.protocol !== "https:" ||
    !ALLOWED_HOSTS.has(target.hostname) ||
    !target.pathname.toLowerCase().endsWith(".pdf")
  ) {
    return new Response("Only official NCERT PDF URLs are allowed", { status: 403 });
  }

  // NCERT blocks server-side PDF fetching from some Vercel regions. Instead of
  // returning a blank/502 iframe, hand the official NCERT URL to Google's
  // browser PDF viewer. The PDF itself still comes directly from NCERT.
  const viewer = new URL("https://docs.google.com/gview");
  viewer.searchParams.set("embedded", "1");
  viewer.searchParams.set("url", target.toString());

  return NextResponse.redirect(viewer, 307);
}
