import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Loader2, Music2, Check, Info, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { User, MusicWork, DiscoveredSong } from '../types';
import { RapidApiAgent } from '../services/rapidApiService';

const SOURCE_BADGE: Record<DiscoveredSong['source'], string> = {
  'Spotify': 'bg-green-500/10 text-green-600 dark:text-green-400',
  'Apple Music': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'YouTube': 'bg-red-500/10 text-red-600 dark:text-red-400',
  'Deezer': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const normalizeTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const fmtDuration = (ms?: number) => {
  if (!ms) return '';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

interface FindSongsModalProps {
  user: User;
  existingWorks: MusicWork[];
  onImport: (songs: DiscoveredSong[]) => void;
  onClose: () => void;
}

export const FindSongsModal: React.FC<FindSongsModalProps> = ({ user, existingWorks, onImport, onClose }) => {
  const [artistName, setArtistName] = useState(user.displayName || '');
  const [results, setResults] = useState<DiscoveredSong[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    existingWorks.forEach(w => {
      if (w.title) keys.add(normalizeTitle(w.title));
      if (w.isrc) keys.add(w.isrc.toLowerCase());
    });
    return keys;
  }, [existingWorks]);

  const isInHub = (song: DiscoveredSong) =>
    existingKeys.has(normalizeTitle(song.title)) || (!!song.isrc && existingKeys.has(song.isrc.toLowerCase()));

  const runSearch = async () => {
    if (artistName.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setSelected(new Set());
    try {
      const found = await RapidApiAgent.searchTracksByArtist(artistName.trim());
      setResults(found);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.displayName && user.displayName.trim().length >= 2) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importable = results.filter(s => !isInHub(s));
  const showSampleNotice = results.some(s => s.isSample);

  const toggle = (song: DiscoveredSong) => {
    if (isInHub(song)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(song.id) ? next.delete(song.id) : next.add(song.id);
      return next;
    });
  };

  const allSelected = importable.length > 0 && importable.every(s => selected.has(s.id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(importable.map(s => s.id)));
  };

  const doImport = () => {
    const chosen = results.filter(s => selected.has(s.id) && !isInHub(s));
    if (chosen.length > 0) onImport(chosen);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-500" />Find My Songs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search the music platforms for your releases, then import them as works.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex gap-2">
            <input
              value={artistName}
              onChange={e => setArtistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Your artist name"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={runSearch}
              disabled={loading || artistName.trim().length < 2}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-cyan-500" />
              <p className="text-sm font-bold">Scanning music platforms…</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
              <Music2 className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm font-bold">No songs found for that name.</p>
              <p className="text-xs mt-1">Try the exact spelling used on your releases.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {showSampleNotice && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Showing sample results — live platform search activates once the music-data API keys are configured
                    in the deployment. You can still import these to try the flow end to end.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {results.length} found · {selected.size} selected
                </span>
                {importable.length > 0 && (
                  <button onClick={toggleAll} className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                    {allSelected ? 'Clear all' : 'Select all'}
                  </button>
                )}
              </div>

              {results.map(song => {
                const inHub = isInHub(song);
                const isChecked = selected.has(song.id);
                return (
                  <button
                    key={song.id}
                    onClick={() => toggle(song)}
                    disabled={inHub}
                    className={`w-full flex items-center gap-3 text-left rounded-2xl border p-3 transition-colors ${
                      inHub
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 cursor-default'
                        : isChecked
                          ? 'border-cyan-500 bg-cyan-500/5'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      inHub ? 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-700'
                        : isChecked ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {(isChecked || inHub) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    {song.image
                      ? <img src={song.image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                      : <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Music2 className="w-5 h-5 text-slate-400" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{song.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {song.artist}{song.album ? ` · ${song.album}` : ''}{song.year ? ` · ${song.year}` : ''}{song.durationMs ? ` · ${fmtDuration(song.durationMs)}` : ''}
                      </div>
                    </div>
                    {song.externalUrl && (
                      <a href={song.externalUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="text-slate-400 hover:text-cyan-500 shrink-0"><ExternalLink className="w-4 h-4" /></a>
                    )}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${SOURCE_BADGE[song.source]}`}>
                      {song.source}
                    </span>
                    {inHub && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />In Hub
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
              <Sparkles className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm font-bold">Search your artist name to discover your catalog.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-xs text-slate-400">{selected.size} song{selected.size === 1 ? '' : 's'} ready to import</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
            <button
              onClick={doImport}
              disabled={selected.size === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {selected.size > 0 ? selected.size : ''} as Work{selected.size === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
