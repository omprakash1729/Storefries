import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers so the browser allows the request
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
    
    if (!response.ok) {
      console.error('SerpApi error:', response.status, await response.text());
      return res.status(response.status).json({ error: 'SerpApi request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
