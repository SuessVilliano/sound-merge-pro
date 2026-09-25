import { format, subDays } from 'date-fns';
import { auth } from './firebase';

export interface MetricStats {
  date: string;
  streams: number;
  listeners: number;
  followers: number;
}

export interface PlatformData {
  platform: 'Spotify' | 'Apple Music' | 'TikTok' | 'YouTube' | 'SoundCloud' | 'Instagram';
  followers: number;
  monthly_listeners?: number;
  popularity?: number;
  daily_views?: number;
  engagement_rate?: string;
  icon?: string;
}

export interface ChartmetricTrack {
  id: string;
  title: string;
  image: string;
  streams: number;
  releaseDate: string;
  chart_position?: number;
  playlists: number;
}

export interface Demographics {
  age: { range: string; percent: number }[];
  gender: { type: string; percent: number }[];
  locations: { country: string; percent: number }[];
}

export interface PlaylistInfo {
  id: string;
  name: string;
  platform: 'Spotify' | 'Apple Music' | 'Deezer';
  followers: number;
  type: 'Editorial' | 'Algorithmic' | 'User';
  image: string;
  addedAt: string;
}

export interface RevenueBreakdown {
  source: string;
  amount: number;
  color?: string;
}

export interface ChartmetricArtist {
  id: number;
  name: string;
  image_url: string;
  is_verified: boolean;
  code2?: string;
  rank?: number;
}

export interface ChartmetricTrackResult {
  id: number;
  name: string;
  artist_names: string[];
  image_url: string;
  code2?: string;
}

export interface ArtistAnalyticsResult {
  dailyStats: MetricStats[];
  platforms: PlatformData[];
  topTracks: ChartmetricTrack[];
  demographics: Demographics;
  playlists: PlaylistInfo[];
  revenue: RevenueBreakdown[];
  source: 'chartmetric' | 'none';
  artist?: any;
  message?: string;
}

const headers = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in to use Chartmetric.');
  return { Authorization: `Bearer ${token}` };
};

const api = async (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });

  const response = await fetch(`/api/chartmetric?${qs.toString()}`, {
    headers: await headers()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Chartmetric request failed.');
  return data;
};

const unwrapArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.stats)) return value.stats;
  return [];
};

const latestNumeric = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const rows = unwrapArray(value);
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const candidates = [row?.value, row?.followers, row?.listeners, row?.monthly_listeners, row?.count];
    const hit = candidates.find(v => typeof v === 'number' && Number.isFinite(v));
    if (typeof hit === 'number') return hit;
  }
  return undefined;
};

const getSeries = (spotify: any, key: 'listeners' | 'followers') => {
  const direct = spotify?.[key];
  if (Array.isArray(direct)) return direct;
  if (Array.isArray(direct?.data)) return direct.data;
  if (Array.isArray(spotify?.stats?.[key])) return spotify.stats[key];
  if (Array.isArray(spotify?.data?.[key])) return spotify.data[key];
  return [];
};

const dateOf = (row: any) => String(row?.date || row?.timestamp || row?.timestp || row?.day || '').slice(0, 10);
const valueOf = (row: any, key: string) => {
  const candidates = [row?.value, row?.[key], row?.count, row?.total];
  const hit = candidates.find(v => typeof v === 'number' && Number.isFinite(v));
  return typeof hit === 'number' ? hit : 0;
};

export const searchArtists = async (query: string): Promise<ChartmetricArtist[]> => {
  if (!query || query.length < 2) return [];
  try {
    const response = await api({ action: 'search', q: query, type: 'artists' });
    const artists = response?.obj?.artists || response?.artists || [];
    return artists.map((a: any) => ({
      id: Number(a.id),
      name: a.name,
      image_url: a.image_url || a.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || 'Artist')}`,
      is_verified: Boolean(a.is_verified),
      code2: a.code2,
      rank: a.rank
    })).filter((a: ChartmetricArtist) => Number.isFinite(a.id));
  } catch (error) {
    console.warn('[Chartmetric] Artist search unavailable:', error);
    return [];
  }
};

export const searchTracks = async (query: string): Promise<ChartmetricTrackResult[]> => {
  if (!query || query.length < 2) return [];
  try {
    const response = await api({ action: 'search', q: query, type: 'tracks' });
    const tracks = response?.obj?.tracks || response?.tracks || [];
    return tracks.map((t: any) => ({
      id: Number(t.id),
      name: t.name,
      artist_names: t.artist_names || t.artists || ['Unknown Artist'],
      image_url: t.image_url || t.image || '',
      code2: t.isrc || t.code2
    })).filter((t: ChartmetricTrackResult) => Number.isFinite(t.id));
  } catch (error) {
    console.warn('[Chartmetric] Track search unavailable:', error);
    return [];
  }
};

export const fetchArtistAnalytics = async (
  timeRange: string = '30d',
  specificArtistId?: number
): Promise<ArtistAnalyticsResult> => {
  if (!specificArtistId) {
    return {
      dailyStats: [],
      platforms: [],
      topTracks: [],
      demographics: { age: [], gender: [], locations: [] },
      playlists: [],
      revenue: [],
      source: 'none',
      message: 'Select an artist from search to load verified Chartmetric analytics.'
    };
  }

  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const until = format(new Date(), 'yyyy-MM-dd');

  const response = await api({
    action: 'artist-analytics',
    id: specificArtistId,
    since,
    until
  });

  const listeners = getSeries(response.spotify, 'listeners');
  const followers = getSeries(response.spotify, 'followers');
  const byDate = new Map<string, MetricStats>();

  listeners.forEach((row: any) => {
    const date = dateOf(row);
    if (!date) return;
    byDate.set(date, {
      date: format(new Date(date + 'T12:00:00'), 'MMM d'),
      streams: 0,
      listeners: valueOf(row, 'listeners'),
      followers: 0
    });
  });

  followers.forEach((row: any) => {
    const date = dateOf(row);
    if (!date) return;
    const existing = byDate.get(date) || {
      date: format(new Date(date + 'T12:00:00'), 'MMM d'),
      streams: 0,
      listeners: 0,
      followers: 0
    };
    existing.followers = valueOf(row, 'followers');
    byDate.set(date, existing);
  });

  const latest = response?.cmStats?.latest || response?.cmStats || {};
  const platformRows: PlatformData[] = [];

  const spotifyFollowers = latestNumeric(latest?.sp_followers ?? latest?.spotify_followers ?? followers);
  const spotifyListeners = latestNumeric(latest?.sp_monthly_listeners ?? latest?.spotify_monthly_listeners ?? listeners);
  if (spotifyFollowers !== undefined || spotifyListeners !== undefined) {
    platformRows.push({
      platform: 'Spotify',
      followers: spotifyFollowers || 0,
      monthly_listeners: spotifyListeners
    });
  }

  const tiktokFollowers = latestNumeric(latest?.tiktok_followers);
  if (tiktokFollowers !== undefined) platformRows.push({ platform: 'TikTok', followers: tiktokFollowers });

  const youtubeFollowers = latestNumeric(latest?.ycs_subscribers ?? latest?.youtube_subscribers);
  if (youtubeFollowers !== undefined) platformRows.push({ platform: 'YouTube', followers: youtubeFollowers });

  const instagramFollowers = latestNumeric(latest?.ins_followers ?? latest?.instagram_followers);
  if (instagramFollowers !== undefined) platformRows.push({ platform: 'Instagram', followers: instagramFollowers });

  return {
    dailyStats: Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value),
    platforms: platformRows,
    topTracks: [],
    demographics: { age: [], gender: [], locations: [] },
    playlists: [],
    revenue: [],
    source: 'chartmetric',
    artist: response.artist
  };
};
