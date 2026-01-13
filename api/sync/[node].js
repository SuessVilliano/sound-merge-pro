// Vercel Serverless Function for /api/sync/:node
// Proxies requests to RapidAPI services

export const config = {
  runtime: 'edge',
};

const RAPID_API_KEY = process.env.RAPID_API_KEY;

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const node = pathParts[pathParts.length - 1];

  const q = url.searchParams.get('q');
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  const isrc = url.searchParams.get('isrc');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let apiUrl = '';
  let host = '';

  switch (node) {
    case 'spotify-search':
      apiUrl = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(q)}&type=${type || 'multi'}&offset=0&limit=15`;
      host = 'spotify23.p.rapidapi.com';
      break;
    case 'spotify-streams':
      apiUrl = `https://spotify-track-streams-playback-count1.p.rapidapi.com/tracks/spotify_track_streams?spotify_track_id=${id}${isrc ? `&isrc=${isrc}` : ''}`;
      host = 'spotify-track-streams-playback-count1.p.rapidapi.com';
      break;
    case 'billboard':
      apiUrl = 'https://billboard-api2.p.rapidapi.com/hot-100?range=1-100';
      host = 'billboard-api2.p.rapidapi.com';
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid sync node' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }

  if (!RAPID_API_KEY) {
    return new Response(JSON.stringify({ error: 'RapidAPI key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': host,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[RapidProxy] Error fetching from ${host}:`, error.message);
    return new Response(JSON.stringify({ error: 'Failed to synchronize with industry node' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
