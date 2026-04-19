/**
 * Vercel Serverless Function — /api/instagram
 *
 * Hämtar de 9 senaste inläggen från @akesskor via Instagram Graph API.
 *
 * Miljövariabler att sätta i Vercel-dashboarden:
 *   IG_ACCESS_TOKEN   — Long-lived Page Access Token (giltig 60 dagar, förnyas automatiskt)
 *   IG_USER_ID        — Instagram Business Account ID (t.ex. "17841400000000000")
 */

// Enkel in-memory-cache för att undvika onödiga API-anrop
let cache = { data: null, ts: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minuter

export default async function handler(req, res) {
  // CORS-header så att index.html kan anropa funktionen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

  const { IG_ACCESS_TOKEN, IG_USER_ID } = process.env;

  // Om env-variabler saknas → returnera tom lista (sidan visar fallback-knapp)
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    return res.status(200).json({ posts: [], configured: false });
  }

  // Returnera cachad data om den är färsk
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return res.status(200).json({ posts: cache.data, configured: true });
  }

  try {
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,timestamp,caption';
    const url = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media?fields=${fields}&limit=9&access_token=${IG_ACCESS_TOKEN}`;

    const igRes = await fetch(url);
    const json = await igRes.json();

    if (json.error) {
      console.error('Instagram API error:', json.error);
      return res.status(200).json({ posts: [], configured: true, error: json.error.message });
    }

    // Filtrera bort VIDEO-only (CAROUSEL_ALBUM och IMAGE behålls)
    const posts = (json.data || []).map(p => ({
      id:       p.id,
      type:     p.media_type,
      image:    p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      url:      p.permalink,
      caption:  p.caption ? p.caption.slice(0, 120) : '',
      date:     p.timestamp,
    }));

    // Spara i cache
    cache = { data: posts, ts: Date.now() };

    return res.status(200).json({ posts, configured: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(200).json({ posts: [], configured: true, error: err.message });
  }
}
