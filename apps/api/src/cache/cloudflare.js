// Purges specific URLs from Cloudflare's edge cache — never the whole zone — so an edit
// to one post can't accidentally evict every other cached page/asset on the site.
// No-ops quietly if CLOUDFLARE_ZONE_ID/CLOUDFLARE_API_TOKEN aren't set (e.g. local dev).
export async function purgeUrls(urls) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const files = [...new Set(urls)].filter(Boolean);

  if (!zoneId || !apiToken || files.length === 0) return;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('[cloudflare] purge failed:', JSON.stringify(data.errors));
    }
  } catch (err) {
    console.warn('[cloudflare] purge request failed:', err.message);
  }
}
