import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlParts = req.url?.split('?') || [];
    const queryString = urlParts.length > 1 ? urlParts[1] : '';

    const targetUrl = `https://serpapi.com/search.json?${queryString}`;
    console.log('Proxying to:', targetUrl);

    const response = await fetch(targetUrl);
    const data = await response.json();

    if (!response.ok) {
      // Pass through the REAL SerpApi error body so we can diagnose it
      console.error('SerpApi error:', response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: 'SerpApi request failed',
        status: response.status,
        serpapi_error: data?.error || data?.message || JSON.stringify(data),
      });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', detail: error?.message });
  }
}
