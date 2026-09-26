import React, { useEffect, useState } from 'react';
import { Search, Loader2, Disc3, Plus, CheckCircle2, Database, X } from 'lucide-react';
import { User, ReleaseRailRecord, ReleaseType } from '../types';
import { musicBrainzService } from '../services/musicBrainzService';
import { dataService } from '../services/dataService';

const now = () => new Date().toISOString();
const railStep = (state: any, note: string) => ({ state, updatedAt: now(), note });

interface CatalogDiscoveryProps {
  user: User;
  onClose: () => void;
}

const toType = (value?: string): ReleaseType => {
  const v = String(value || '').toLowerCase();
  if (v.includes('single')) return 'Single';
  if (v.includes('ep')) return 'EP';
  return 'Album';
};

export const CatalogDiscovery: React.FC<CatalogDiscoveryProps> = ({ user, onClose }) => {
  const [query, setQuery] = useState(user.displayName || '');
  const [results, setResults] = useState<any[]>([]);
  const [records, setRecords] = useState<ReleaseRailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => dataService.subscribeToReleaseRails(user.uid, setRecords), [user.uid]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await musicBrainzService.search('release', `artist:"${query.trim()}"`, 20);
      setResults(data?.releases || []);
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Catalog Discovery', message: e?.message || 'Could not search public release metadata.', type: 'info' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const imported = (id: string) => records.some(record => record.identifiers.musicBrainzReleaseId === id);

  const addShell = async (row: any) => {
    if (!row?.id || imported(row.id)) return;
    setSaving(row.id);
    try {
      const artistName =
        (row['artist-credit'] || []).map((a: any) => a?.name || a?.artist?.name).filter(Boolean).join(', ') ||
        query.trim() ||
        user.displayName;

      const primaryType = row['release-group']?.['primary-type'];
      const barcode = row.barcode && row.barcode !== '[none]' ? row.barcode : undefined;

      const record: ReleaseRailRecord = {
        id: `rail_${crypto.randomUUID()}`,
        userId: user.uid,
        releaseId: `discovered_${row.id}`,
        assetIds: [],
        title: row.title || 'Untitled Release',
        artistName,
        releaseType: toType(primaryType),
        releaseDate: row.date || '',
        recordLabel: 'Unknown / reconcile',
        primaryGenre: '',
        distributor: 'Other',
        createdAt: now(),
        updatedAt: now(),
        identifiers: {
          upc: barcode,
          isrcByAssetId: {},
          musicBrainzReleaseId: row.id
        },
        rights: {
          writers: [],
          splitsConfirmed: false,
          samplesCleared: false,
          voiceLikenessCleared: true,
          aiAssisted: false,
          humanAuthorshipNotes: 'Public metadata shell imported from MusicBrainz. Ownership/authorship not asserted by Sound Merge.'
        },
        links: {},
        rails: {
          created: railStep('complete', 'Public catalog metadata imported after artist confirmation.'),
          mastered: railStep('blocked', 'Attach the artist-owned master files before treating this release as fully synced.'),
          metadata: railStep('review', 'Review title, date, label, genre, identifiers and track list.'),
          rights: railStep('blocked', 'Add master owner, writers, splits, publishing and clearances.'),
          distribution: railStep('review', 'Connect existing distributor information and live store links.'),
          identifiers: railStep(barcode ? 'review' : 'pending', 'Reconcile UPC, track ISRCs, work ISWCs and creator IPI/CAE identifiers.'),
          pro: railStep('pending', 'PRO registration not confirmed.'),
          mlc: railStep('pending', 'Mechanical registration not confirmed.'),
          masterRights: railStep('pending', 'Neighboring/master-side registration not confirmed.'),
          live: railStep('pending', 'Add Spotify, Apple Music, YouTube Music and other live links.'),
          royalties: railStep('pending', 'Connect statements and money sources after catalog identity is reconciled.')
        }
      };

      await dataService.saveReleaseRail(record);
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Release Added', message: `${record.title} is ready for catalog reconciliation.`, type: 'success' }
      }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Catalog Import', message: e?.message || 'Could not add this release.', type: 'error' }
      }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-500 flex items-center gap-2"><Database className="w-4 h-4" /> Public Metadata Discovery</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Find Older Releases</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Search public MusicBrainz release metadata. You choose what belongs to you; Sound Merge never claims a public match as your catalog automatically.
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><X className="w-5 h-5" /></button>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Artist/stage name" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
        </div>
        <button onClick={search} disabled={loading} className="px-5 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search Catalog
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-5 grid md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {results.map(row => {
            const isImported = imported(row.id);
            const artist = (row['artist-credit'] || []).map((a:any)=>a?.name||a?.artist?.name).filter(Boolean).join(', ');
            return (
              <div key={row.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0"><Disc3 className="w-5 h-5 text-violet-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm truncate">{row.title}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate">{artist || query}</div>
                    <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{row.date || 'Date unknown'}</span>
                      {row.country && <span>{row.country}</span>}
                      {row.barcode && row.barcode !== '[none]' && <span className="font-mono">UPC {row.barcode}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={()=>addShell(row)} disabled={isImported || saving===row.id} className={`w-full mt-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${isImported ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'}`}>
                  {isImported ? <><CheckCircle2 className="w-3.5 h-3.5" /> Added to Sound Merge</> : saving===row.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</> : <><Plus className="w-3.5 h-3.5" /> Add Metadata Shell</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
