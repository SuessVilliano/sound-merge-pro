import { auth } from './firebase';

export type MusicBrainzEntity = 'artist' | 'recording' | 'release' | 'work';

export const musicBrainzService = {
  async search(entity: MusicBrainzEntity, query: string, limit = 8): Promise<any> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sign in to search metadata.');
    const qs = new URLSearchParams({ entity, q: query, limit: String(limit) });
    const response = await fetch(`/api/metadata/musicbrainz?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'MusicBrainz search failed.');
    return data;
  }
};
