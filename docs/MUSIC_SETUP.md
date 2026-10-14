# Lakshya Music Setup

The Music for Focus player supports one public HTTPS audio URL or a playlist. It does not ship with a fake/demo song URL.

## Configure a single song

In Vercel → Lakshya → Settings → Environment Variables, add:

- `NEXT_PUBLIC_LAKSHYA_MUSIC_URL`: direct public HTTPS URL to an audio file (for example, an MP3/OGG file on your Cloudflare R2 custom domain).
- `NEXT_PUBLIC_LAKSHYA_MUSIC_TITLE`: optional title shown in the player.

## Configure a playlist

Alternatively set `NEXT_PUBLIC_LAKSHYA_MUSIC_TRACKS` to a JSON array. Each item needs a title, URL and optional artist:

```json
[
  {
    "title": "Quiet Study",
    "artist": "Lakshya Focus",
    "url": "https://your-public-cloudflare-domain.example/music/quiet-study.mp3"
  },
  {
    "title": "Deep Work",
    "artist": "Lakshya Focus",
    "url": "https://your-public-cloudflare-domain.example/music/deep-work.mp3"
  }
]
```

Use direct file URLs, not a Cloudflare dashboard URL or a bucket root URL. The bucket/object must be publicly readable and configured to serve audio with a suitable content type. Then redeploy so Next.js receives the public environment variable.

## Current connection status

The Cloudflare account connection was checked during implementation, but Cloudflare's API reported that R2 must first be enabled in the Cloudflare Dashboard. No existing song URL or R2 bucket was discoverable from the connected account, so the player intentionally shows a setup message until a real URL is configured. No public bucket or paid storage was created automatically.
