// Vercel Serverless Function: YouTube RSS proxy (no API key)
// - Accepts one of: channelId, user, handle
// - Fetches the official YouTube RSS feed and returns it as XML
// - Optional: format=json to convert RSS to JSON (simple, lossy)
// - Optional: cacheSeconds to set Cache-Control max-age

const { XMLParser } = require('fast-xml-parser');

/**
 * Resolve a YouTube handle (e.g. "@vercel") or user name to a canonical channelId without using the API.
 * Strategy: fetch the channel page HTML and extract the channelId (UC...).
 * Handles both handle and user paths.
 */
async function resolveToChannelId({ handle, user }) {
  const target = handle ? `https://www.youtube.com/${handle.startsWith('@') ? handle : `@${handle}`}` : `https://www.youtube.com/user/${encodeURIComponent(user)}`;

  const response = await fetch(target, {
    headers: {
      'accept-language': 'en',
      'user-agent': 'Mozilla/5.0 (compatible; YouTubeRSS/1.0; +https://vercel.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile page (${response.status})`);
  }

  const html = await response.text();

  // Look for patterns like: "channelId":"UC..."
  const idMatch = html.match(/"channelId"\s*:\s*"(UC[0-9A-Za-z_-]{20,})"/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Fallback: sometimes appears as externalId
  const externalIdMatch = html.match(/"externalId"\s*:\s*"(UC[0-9A-Za-z_-]{20,})"/);
  if (externalIdMatch && externalIdMatch[1]) {
    return externalIdMatch[1];
  }

  throw new Error('Unable to resolve channelId from page');
}

function buildFeedUrl(channelId) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

function toJsonFromRssXml(xmlString, max) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const data = parser.parse(xmlString);
  const feed = data && data.feed ? data.feed : {};
  const entries = Array.isArray(feed.entry) ? feed.entry : (feed.entry ? [feed.entry] : []);
  const limited = entries.slice(0, Number(max) || entries.length);

  const mapped = limited.map((e) => {
    const id = e && e['yt:videoId'];
    const hrefObj = e && e.link && (Array.isArray(e.link) ? e.link[0] : e.link);
    const link = hrefObj && hrefObj['@_href'] ? hrefObj['@_href'] : (id ? `https://www.youtube.com/watch?v=${id}` : null);
    const thumbnail = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    return {
      id: id || null,
      title: (e && e.title) || null,
      published: (e && e.published) || null,
      updated: (e && e.updated) || null,
      link,
      thumbnail
    };
  });

  return {
    channel: (feed && feed.title) || null,
    updated: (feed && feed.updated) || null,
    entries: mapped
  };
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { channelId, user, handle, format, cacheSeconds, max } = req.query;

  try {
    let id = channelId;

    if (!id) {
      if (handle) {
        id = await resolveToChannelId({ handle: String(handle) });
      } else if (user) {
        id = await resolveToChannelId({ user: String(user) });
      } else {
        return res.status(400).json({
          error: 'Missing parameter: provide one of channelId, handle, or user'
        });
      }
    }

    const feedUrl = buildFeedUrl(String(id));
    const upstream = await fetch(feedUrl, {
      headers: {
        'accept': 'application/atom+xml, application/xml;q=0.9, */*;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; YouTubeRSS/1.0; +https://vercel.com)'
      }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Failed to fetch RSS feed' });
    }

    const xml = await upstream.text();

    const maxAge = Math.max(0, Math.min(86400, Number(cacheSeconds) || 900));
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, max-age=${maxAge}`);

    if (String(format).toLowerCase() === 'json') {
      const json = toJsonFromRssXml(xml, max);
      return res.status(200).json({ channelId: id, feedUrl, ...json });
    }

    res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
    return res.status(200).send(xml);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};



