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

  if (
    target.protocol !== "https:" ||
    !ALLOWED_HOSTS.has(target.hostname) ||
    !target.pathname.toLowerCase().endsWith(".pdf")
  ) {
    return new Response("Only official NCERT PDF URLs are allowed", { status: 403 });
  }

  // Do not proxy the NCERT bytes through Vercel: NCERT can reject server-side
  // requests from cloud regions. Instead serve a same-origin HTML shell that
  // embeds Google's browser PDF viewer. This avoids mobile Chromium's blank
  // native PDF iframe while the actual document remains the official NCERT PDF.
  const viewer = new URL("https://docs.google.com/gview");
  viewer.searchParams.set("embedded", "1");
  viewer.searchParams.set("url", target.toString());
  const viewerUrl = viewer.toString();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<title>Lakshya NCERT PDF Viewer</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f1f1f5}iframe{display:block;width:100%;height:100%;border:0}</style>
</head>
<body>
<iframe title="Official NCERT PDF viewer" src="${viewerUrl.replace(/&/g, "&amp;")}" allow="fullscreen"></iframe>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Security-Policy": "default-src 'none'; frame-src https://docs.google.com; style-src 'unsafe-inline';",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
