import React, { useEffect, useMemo, useState } from 'react';
import {
  Fingerprint, Music2, Barcode, FileText, UserRound, Database, Search,
  CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, ShieldCheck, Link2
} from 'lucide-react';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { musicBrainzService } from '../services/musicBrainzService';
import { ReleaseRailRecord } from '../types';

const IDENTITY_GUIDE = [
  {
    key: 'isrc',
    label: 'ISRC',
    icon: Music2,
    what: 'Identifies the specific sound recording or music video recording.',
    why: 'Used across DSP reporting, licensing, catalog matching and royalty administration.',
    owner: 'Recording / master side'
  },
  {
    key: 'upc',
    label: 'UPC / EAN',
    icon: Barcode,
    what: 'Identifies the release/product that contains one or more recordings.',
    why: 'Used by distributors/stores to distinguish products and release configurations.',
    owner: 'Release / product'
  },
  {
    key: 'iswc',
    label: 'ISWC',
    icon: FileText,
    what: 'Identifies the musical work/composition behind a recording.',
    why: 'Helps societies and publishers match usage to the correct composition.',
    owner: 'Song / composition side'
  },
  {
    key: 'ipi',
    label: 'IPI / CAE',
    icon: UserRound,
    what: 'Identifies a writer, composer or publisher party in rights systems.',
    why: 'Connects the human/legal party to the works and ownership shares.',
    owner: 'Creator / publisher identity'
  }
];

const linkButton = (label: string, url: string) => (
  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-black text-cyan-300 hover:text-white">
    {label} <ExternalLink className="w-3 h-3" />
  </a>
);

export const CatalogIdentity: React.FC = () => {
  const user = authService.getCurrentUser();
  const [records, setRecords] = useState<ReleaseRailRecord[]>([]);
  const [searching, setSearching] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!user) return;
    return dataService.subscribeToReleaseRails(user.uid, setRecords);
  }, [user?.uid]);

  const totals = useMemo(() => {
    let recordings = 0;
    let withIsrc = 0;
    let withIswc = 0;
    let writers = 0;
    let withIpi = 0;

    records.forEach(record => {
      recordings += record.assetIds.length;
      withIsrc += record.assetIds.filter(id => Boolean(record.identifiers.isrcByAssetId[id])).length;
      withIswc += record.assetIds.filter(id => Boolean(record.identifiers.iswcByAssetId?.[id])).length;
      writers += record.rights.writers.length;
      withIpi += record.rights.writers.filter(w => Boolean(w.ipiCae)).length;
    });

    return { recordings, withIsrc, withIswc, writers, withIpi };
  }, [records]);

  const patchRecord = async (record: ReleaseRailRecord, patch: Partial<ReleaseRailRecord>) => {
    if (!user) return;
    await dataService.updateReleaseRail(record.id, patch, user.uid);
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r));
  };

  const captureTrackIdentity = async (record: ReleaseRailRecord, assetId: string) => {
    const currentIsrc = record.identifiers.isrcByAssetId[assetId] || '';
    const currentIswc = record.identifiers.iswcByAssetId?.[assetId] || '';

    const isrc = window.prompt(`ISRC for recording ${assetId}:`, currentIsrc)?.trim();
    const iswc = window.prompt(`ISWC for the composition behind ${assetId} (leave blank if not assigned yet):`, currentIswc)?.trim();

    const identifiers = {
      ...record.identifiers,
      isrcByAssetId: {
        ...record.identifiers.isrcByAssetId,
        ...(isrc ? { [assetId]: isrc } : {})
      },
      iswcByAssetId: {
        ...(record.identifiers.iswcByAssetId || {}),
        ...(iswc ? { [assetId]: iswc } : {})
      }
    };

    await patchRecord(record, { identifiers });
  };

  const captureWriterIdentity = async (record: ReleaseRailRecord, writerId: string) => {
    const writers = record.rights.writers.map(writer => {
      if (writer.id !== writerId) return writer;
      const ipiCae = window.prompt(`IPI / CAE for ${writer.legalName}:`, writer.ipiCae || '')?.trim() || writer.ipiCae;
      const pro = window.prompt(`PRO / society for ${writer.legalName}:`, writer.pro || '')?.trim() || writer.pro;
      return { ...writer, ipiCae: ipiCae || undefined, pro: pro as any };
    });
    await patchRecord(record, { rights: { ...record.rights, writers } });
  };

  const searchMetadata = async (record: ReleaseRailRecord) => {
    const key = record.id;
    setSearching(key);
    try {
      const query = `recording:"${record.title}" AND artist:"${record.artistName}"`;
      const data = await musicBrainzService.search('recording', query, 8);
      const rows = data?.recordings || [];
      setResults(prev => ({ ...prev, [key]: rows }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Metadata Search', message: e?.message || 'MusicBrainz search unavailable.', type: 'info' }
      }));
    } finally {
      setSearching(null);
    }
  };

  const linkMusicBrainz = async (record: ReleaseRailRecord, row: any) => {
    const assetId = record.assetIds[0];
    if (!assetId) return;

    const identifiers = {
      ...record.identifiers,
      musicBrainzRecordingIdByAssetId: {
        ...(record.identifiers.musicBrainzRecordingIdByAssetId || {}),
        [assetId]: row.id
      },
      isrcByAssetId: {
        ...record.identifiers.isrcByAssetId,
        ...(Array.isArray(row.isrcs) && row.isrcs[0] ? { [assetId]: row.isrcs[0] } : {})
      }
    };

    await patchRecord(record, { identifiers });
    setResults(prev => ({ ...prev, [record.id]: [] }));
    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: { title: 'Metadata Linked', message: 'MusicBrainz recording identity attached to the Sound Merge release record.', type: 'success' }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-black uppercase tracking-[0.24em] mb-4">
            <Fingerprint className="w-4 h-4" /> Music Business Identity Layer
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
            Catalog <span className="text-cyan-400">Identity.</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-3xl text-base md:text-lg leading-relaxed">
            Sound Merge keeps the recording, release, composition and creator identities together so distribution, registrations, usage reports and royalty sources can be reconciled back to the right music and the right people.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            {[
              ['Recordings', totals.recordings],
              ['ISRC Linked', totals.withIsrc],
              ['ISWC Linked', totals.withIswc],
              ['Writers', totals.writers],
              ['IPI Linked', totals.withIpi]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {IDENTITY_GUIDE.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
              <Icon className="w-6 h-6 text-cyan-400" />
              <div className="text-xl font-black text-white mt-4">{item.label}</div>
              <div className="text-[9px] uppercase tracking-widest font-black text-violet-300 mt-1">{item.owner}</div>
              <p className="text-xs text-slate-400 leading-relaxed mt-3">{item.what}</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.why}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          <div>
            <div className="text-[9px] font-black text-violet-400 uppercase tracking-[0.22em]">Canonical Catalog</div>
            <h2 className="text-2xl font-black text-white mt-1">Track every code without living in spreadsheets.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {linkButton('IFPI ISRC', 'https://isrc.ifpi.org/')}
            {linkButton('CISAC Identifiers', 'https://www.cisac.org/services/information-services/international-identifiers')}
            {linkButton('MusicBrainz', 'https://musicbrainz.org/')}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
            <Database className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-white font-black mt-4">No release records yet</h3>
            <p className="text-sm text-slate-500 mt-2">Stage a release in Distribution/Release Rails and Sound Merge will begin building its identity map.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <div key={record.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-white">{record.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{record.artistName} • {record.releaseType} • {record.distributor}</div>
                  </div>
                  <button onClick={() => searchMetadata(record)} disabled={searching === record.id} className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    {searching === record.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Match Metadata
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Release / Recording IDs</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-slate-500">UPC / EAN</span>
                        <span className={record.identifiers.upc ? 'text-emerald-300 font-mono' : 'text-amber-300'}>{record.identifiers.upc || 'Pending assignment'}</span>
                      </div>
                      {record.assetIds.map((assetId, index) => (
                        <button key={assetId} onClick={() => captureTrackIdentity(record, assetId)} className="w-full text-left rounded-xl bg-slate-900 p-3 hover:border-cyan-500/30 border border-transparent">
                          <div className="text-[9px] uppercase tracking-widest font-black text-slate-600">Track {index + 1}</div>
                          <div className="grid sm:grid-cols-2 gap-2 mt-2 text-xs">
                            <div><span className="text-slate-600">ISRC </span><span className={record.identifiers.isrcByAssetId[assetId] ? 'text-white font-mono' : 'text-amber-300'}>{record.identifiers.isrcByAssetId[assetId] || 'Pending'}</span></div>
                            <div><span className="text-slate-600">ISWC </span><span className={record.identifiers.iswcByAssetId?.[assetId] ? 'text-white font-mono' : 'text-amber-300'}>{record.identifiers.iswcByAssetId?.[assetId] || 'Pending'}</span></div>
                          </div>
                          {record.identifiers.musicBrainzRecordingIdByAssetId?.[assetId] && (
                            <div className="text-[10px] text-cyan-400 mt-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> MusicBrainz {record.identifiers.musicBrainzRecordingIdByAssetId[assetId]}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Writers / Rights Parties</div>
                    <div className="space-y-3">
                      {record.rights.writers.length ? record.rights.writers.map(writer => (
                        <button key={writer.id} onClick={() => captureWriterIdentity(record, writer.id)} className="w-full rounded-xl bg-slate-900 p-3 text-left border border-transparent hover:border-violet-500/30">
                          <div className="flex justify-between gap-3">
                            <div className="text-sm font-black text-white">{writer.legalName}</div>
                            <div className="text-xs text-slate-500">{writer.share}%</div>
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            IPI/CAE: <span className={writer.ipiCae ? 'text-violet-300 font-mono' : 'text-amber-300'}>{writer.ipiCae || 'Pending'}</span>
                            <span className="mx-2">•</span>
                            Society: <span className="text-slate-300">{writer.pro || 'Pending'}</span>
                          </div>
                        </button>
                      )) : (
                        <div className="text-sm text-amber-300">No writers attached yet. Complete Rights Review in Release Rails.</div>
                      )}
                    </div>
                  </div>
                </div>

                {(results[record.id] || []).length > 0 && (
                  <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300 mb-3">MusicBrainz Matches</div>
                    <div className="space-y-2">
                      {results[record.id].map((row: any) => (
                        <button key={row.id} onClick={() => linkMusicBrainz(record, row)} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-cyan-500/40">
                          <div className="text-sm text-white font-black">{row.title}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {(row['artist-credit'] || []).map((a: any) => a?.name || a?.artist?.name).filter(Boolean).join(', ')}
                            {Array.isArray(row.isrcs) && row.isrcs.length ? ` • ISRC ${row.isrcs[0]}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-cyan-400 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white">Identity before collection</div>
          <p className="text-sm text-slate-500 mt-1">
            Sound Merge should reconcile identifiers before it tries to “recover” money. A missing or mismatched recording/work/party identity is one of the fastest ways for usage to become difficult to match to the correct catalog owner.
          </p>
        </div>
      </div>
    </div>
  );
};
