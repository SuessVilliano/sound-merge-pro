import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, Circle, AlertTriangle, ShieldCheck, Radio, Fingerprint,
  FileCheck2, Music2, DollarSign, Globe2, RefreshCw, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { releaseRailsService } from '../services/releaseRailsService';
import { releaseAutomationService, ReleaseAutomationProvider } from '../services/releaseAutomationService';
import { ReleaseAutomationJob, ReleaseRailRecord, ReleaseRailState } from '../types';

const STEP_META: Array<{ key: keyof ReleaseRailRecord['rails']; label: string }> = [
  { key: 'created', label: 'Created' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'rights', label: 'Rights' },
  { key: 'distribution', label: 'Distributor' },
  { key: 'identifiers', label: 'ISRC / UPC' },
  { key: 'pro', label: 'PRO' },
  { key: 'mlc', label: 'MLC' },
  { key: 'masterRights', label: 'Master Rights' },
  { key: 'live', label: 'Live' },
  { key: 'royalties', label: 'Royalties' }
];

const stateClasses: Record<ReleaseRailState, string> = {
  complete: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  ready: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
  submitted: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
  review: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  blocked: 'bg-red-500/15 border-red-500/40 text-red-300',
  pending: 'bg-slate-800 border-slate-700 text-slate-400',
  not_applicable: 'bg-slate-900 border-slate-800 text-slate-600'
};

const StateIcon = ({ state }: { state: ReleaseRailState }) => {
  if (state === 'complete') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (state === 'blocked' || state === 'review') return <AlertTriangle className="w-3.5 h-3.5" />;
  return <Circle className="w-3.5 h-3.5" />;
};

export const ReleaseRails: React.FC = () => {
  const user = authService.getCurrentUser();
  const [records, setRecords] = useState<ReleaseRailRecord[]>([]);
  const [jobs, setJobs] = useState<ReleaseAutomationJob[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return dataService.subscribeToReleaseRails(user.uid, setRecords);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return dataService.subscribeToReleaseAutomationJobs(user.uid, setJobs);
  }, [user?.uid]);

  const totals = useMemo(() => {
    const active = records.length;
    const ready = records.filter(r => releaseRailsService.validate(r).ok).length;
    const live = records.filter(r => r.rails.live.state === 'complete').length;
    const blocked = records.filter(r => Object.values(r.rails).some(s => s.state === 'blocked')).length;
    return { active, ready, live, blocked };
  }, [records]);

  const patchRecord = async (record: ReleaseRailRecord, patch: Partial<ReleaseRailRecord>) => {
    if (!user) return;
    await dataService.updateReleaseRail(record.id, patch, user.uid);
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r));
  };

  const setStep = async (
    record: ReleaseRailRecord,
    key: keyof ReleaseRailRecord['rails'],
    state: ReleaseRailState,
    note?: string,
    confirmationId?: string
  ) => {
    const rails = {
      ...record.rails,
      [key]: { state, updatedAt: new Date().toISOString(), ...(note ? { note } : {}), ...(confirmationId ? { confirmationId } : {}) }
    };
    await patchRecord(record, { rails });
  };

  const captureIdentifiers = async (record: ReleaseRailRecord) => {
    const upc = window.prompt('Enter distributor-assigned UPC (leave blank to keep current):', record.identifiers.upc || '') || record.identifiers.upc || '';
    const isrcByAssetId = { ...record.identifiers.isrcByAssetId };
    for (const assetId of record.assetIds) {
      const current = isrcByAssetId[assetId] || '';
      const value = window.prompt(`ISRC for ${assetId} (leave blank if not assigned):`, current);
      if (value) isrcByAssetId[assetId] = value.trim();
    }
    const complete = Boolean(upc && record.assetIds.every(id => isrcByAssetId[id]));
    const identifiers = { ...record.identifiers, upc: upc || undefined, isrcByAssetId };
    const rails = {
      ...record.rails,
      identifiers: {
        state: complete ? 'complete' as const : 'review' as const,
        updatedAt: new Date().toISOString(),
        note: complete ? 'Distributor identifiers captured.' : 'Some distributor identifiers are still missing.'
      }
    };
    await patchRecord(record, { identifiers, rails });
  };

  const reviewRights = async (record: ReleaseRailRecord) => {
    const masterOwner = window.prompt('Master / ℗ owner:', record.rights.masterOwner || '')?.trim() || record.rights.masterOwner;
    const publishingAdmin = window.prompt('Publishing admin / © owner:', record.rights.publishingAdmin || '')?.trim() || record.rights.publishingAdmin;

    let writers = [...record.rights.writers];
    if (!writers.length) {
      const legalName = window.prompt('Primary songwriter legal name:')?.trim();
      if (legalName) {
        writers = [{ id: `writer_${crypto.randomUUID()}`, legalName, role: 'Songwriter', share: 100 }];
      }
    }

    writers = writers.map(writer => {
      const shareRaw = window.prompt(`Writer share % for ${writer.legalName}:`, String(writer.share || 0));
      const share = shareRaw === null ? writer.share : Number(shareRaw);
      const ipiCae = window.prompt(`IPI/CAE for ${writer.legalName} (optional):`, writer.ipiCae || '') || writer.ipiCae;
      const proRaw = window.prompt(`PRO for ${writer.legalName} (BMI, ASCAP, SESAC, SOCAN, PRS, GEMA, SACEM, Other, None):`, writer.pro || '') || writer.pro;
      return { ...writer, share: Number.isFinite(share) ? share : writer.share, ipiCae: ipiCae || undefined, pro: proRaw as any };
    });

    const splitsConfirmed = writers.length > 0 && writers.every(w => w.share > 0) && Math.abs(writers.reduce((sum, w) => sum + w.share, 0) - 100) < 0.01;
    const samplesCleared = window.confirm('Confirm that the release contains no uncleared samples/covers.');
    const voiceLikenessCleared = window.confirm('Confirm that all voice/likeness use is authorized.');
    const humanAuthorshipNotes = record.rights.aiAssisted
      ? (window.prompt('For AI-assisted music, briefly record the human-authored contribution (lyrics, composition, arrangement, edits, performance, etc.):', record.rights.humanAuthorshipNotes || '') || record.rights.humanAuthorshipNotes)
      : record.rights.humanAuthorshipNotes;

    const rights = {
      ...record.rights,
      masterOwner,
      publishingAdmin,
      writers,
      splitsConfirmed,
      samplesCleared,
      voiceLikenessCleared,
      humanAuthorshipNotes
    };

    const complete = Boolean(masterOwner && publishingAdmin && splitsConfirmed && samplesCleared && voiceLikenessCleared);
    const rails = {
      ...record.rails,
      rights: {
        state: complete ? 'complete' as const : 'review' as const,
        updatedAt: new Date().toISOString(),
        note: complete ? 'Rights and split review confirmed by user.' : 'Rights review still has unresolved items.'
      }
    };

    await patchRecord(record, { rights, rails });
  };

  const markRegistration = async (record: ReleaseRailRecord, key: 'pro' | 'mlc' | 'masterRights', label: string) => {
    const confirmationId = window.prompt(`${label} confirmation/work ID (optional):`) || undefined;
    await setStep(record, key, 'complete', `${label} registration confirmed by user.`, confirmationId);
  };

  const exportPacket = (record: ReleaseRailRecord, provider: ReleaseAutomationProvider) => {
    const packet = releaseAutomationService.download(record, provider);
    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: {
        title: packet.ready ? 'Agent Packet Ready' : 'Packet Exported With Blockers',
        message: packet.ready
          ? `${provider.toUpperCase()} submission packet exported from the canonical release record.`
          : packet.blockers.join(' '),
        type: packet.ready ? 'success' : 'info'
      }
    }));
  };

  const queueAgent = async (record: ReleaseRailRecord, provider: ReleaseAutomationProvider) => {
    const packet = releaseAutomationService.build(record, provider);
    if (!packet.ready) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: {
          title: 'Agent Job Blocked',
          message: packet.blockers.join(' '),
          type: 'info'
        }
      }));
      return;
    }

    const job = releaseAutomationService.createJob(record, provider);
    await dataService.saveReleaseAutomationJob(job);
    setJobs(prev => [job, ...prev.filter(j => j.id !== job.id)]);

    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: {
        title: 'Agent Job Queued',
        message: `${provider.toUpperCase()} job is ready for the connected browser agent. Final irreversible submission remains approval-gated.`,
        type: 'success'
      }
    }));
  };

  const markLive = async (record: ReleaseRailRecord) => {
    const spotify = window.prompt('Spotify URL (optional):', record.links.spotify || '') || record.links.spotify;
    const appleMusic = window.prompt('Apple Music URL (optional):', record.links.appleMusic || '') || record.links.appleMusic;
    const youtubeMusic = window.prompt('YouTube Music URL (optional):', record.links.youtubeMusic || '') || record.links.youtubeMusic;
    const links = { ...record.links, spotify, appleMusic, youtubeMusic };
    const rails = {
      ...record.rails,
      live: { state: 'complete' as const, updatedAt: new Date().toISOString(), note: 'Release confirmed live.' },
      royalties: { state: 'ready' as const, updatedAt: new Date().toISOString(), note: 'Ready for post-release royalty monitoring.' }
    };
    await patchRecord(record, { links, rails });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
            <Radio className="w-4 h-4" /> Canonical Release Operating System
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Release <span className="text-cyan-400">Rails.</span></h1>
          <p className="mt-4 max-w-3xl text-slate-400 text-base md:text-lg leading-relaxed">
            One source of truth from finished master to distribution, registrations, live links and royalty monitoring. Sound Merge records what actually happened; it never marks an external filing complete without confirmation.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              ['Active Releases', totals.active, Music2],
              ['Rights Ready', totals.ready, ShieldCheck],
              ['Live', totals.live, Globe2],
              ['Blocked', totals.blocked, AlertTriangle]
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-950/50 p-12 text-center">
          <Fingerprint className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase">No release records yet</h2>
          <p className="text-slate-500 mt-2">Stage a release from Distribution and Sound Merge will create its canonical Release Rail automatically.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {records.map(record => {
            const progress = releaseRailsService.progress(record);
            const validation = releaseRailsService.validate(record);
            const isOpen = expanded === record.id;
            return (
              <div key={record.id} className="rounded-[2rem] border border-slate-800 bg-slate-950 overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : record.id)} className="w-full text-left p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl md:text-2xl font-black text-white truncate">{record.title}</h2>
                        <span className="text-[9px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 font-black uppercase tracking-widest">{record.releaseType}</span>
                        {!validation.ok && <span className="text-[9px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-black uppercase tracking-widest">Needs Review</span>}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{record.artistName} • {record.distributor} • {record.releaseDate}</p>
                    </div>
                    <div className="w-full md:w-56">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        <span>Completion</span><span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${progress}%` }} /></div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </div>

                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-11 gap-2">
                    {STEP_META.map(step => {
                      const state = record.rails[step.key].state;
                      return (
                        <div key={step.key} className={`rounded-xl border px-2.5 py-2 ${stateClasses[state]}`}>
                          <div className="flex items-center gap-1.5"><StateIcon state={state} /><span className="text-[8px] font-black uppercase tracking-wider truncate">{step.label}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 p-6 md:p-8 bg-slate-900/30 space-y-7">
                    {!validation.ok && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-widest mb-2"><AlertTriangle className="w-4 h-4" /> Release QA</div>
                        <ul className="text-sm text-amber-100/70 space-y-1">{validation.issues.map(issue => <li key={issue}>• {issue}</li>)}</ul>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                        <FileCheck2 className="w-5 h-5 text-cyan-400 mb-3" />
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Identifiers</div>
                        <div className="text-xs text-white mt-2 font-mono">UPC: {record.identifiers.upc || 'Pending'}</div>
                        <div className="text-xs text-slate-400 mt-1">{Object.keys(record.identifiers.isrcByAssetId).length}/{record.assetIds.length} ISRCs captured</div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                        <ShieldCheck className="w-5 h-5 text-cyan-400 mb-3" />
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rights</div>
                        <div className="text-xs text-white mt-2">{record.rights.masterOwner || 'Master owner missing'}</div>
                        <div className="text-xs text-slate-400 mt-1">{record.rights.writers.length} writer(s) • {record.rights.splitsConfirmed ? 'splits confirmed' : 'splits need review'}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                        <DollarSign className="w-5 h-5 text-cyan-400 mb-3" />
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Money Connections</div>
                        <div className="text-xs text-white mt-2">PRO: {record.rails.pro.state}</div>
                        <div className="text-xs text-slate-400 mt-1">MLC: {record.rails.mlc.state} • Master: {record.rails.masterRights.state}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {record.rails.mastered.state !== 'complete' && (
                        <button onClick={() => setStep(record, 'mastered', 'complete', 'Final master confirmed by user.')} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Confirm Master</button>
                      )}
                      {record.rails.metadata.state !== 'complete' && (
                        <button onClick={() => setStep(record, 'metadata', 'complete', 'Release metadata confirmed by user.')} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Confirm Metadata</button>
                      )}
                      <button onClick={() => reviewRights(record)} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">Review Rights + Splits</button>
                      {record.rails.distribution.state !== 'submitted' && record.rails.distribution.state !== 'complete' && (
                        <button onClick={() => setStep(record, 'distribution', 'submitted', 'Distributor submission confirmed by user.')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-wider">Mark Distributor Submitted</button>
                      )}
                      <button onClick={() => captureIdentifiers(record)} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider">Capture ISRC / UPC</button>
                      <button onClick={() => markRegistration(record, 'pro', 'PRO')} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Confirm PRO</button>
                      <button onClick={() => markRegistration(record, 'mlc', 'MLC')} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Confirm MLC</button>
                      <button onClick={() => markRegistration(record, 'masterRights', 'Master-rights')} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Confirm Master Rights</button>
                      <button onClick={() => markLive(record)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">Mark Live + Add Links</button>
                    </div>

                    <div className="pt-5 border-t border-slate-800">
                      <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500 mb-3">Agent / Export Packets</div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => exportPacket(record, 'distrokid')} className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase tracking-wider">DistroKid Packet</button>
                        <button onClick={() => exportPacket(record, 'pro')} className="px-4 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] font-black uppercase tracking-wider">PRO Packet</button>
                        <button onClick={() => exportPacket(record, 'mlc')} className="px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-wider">MLC Packet</button>
                        <button onClick={() => exportPacket(record, 'master_rights')} className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-wider">Master Rights Packet</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => queueAgent(record, 'distrokid')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider">Queue DistroKid Agent</button>
                        <button onClick={() => queueAgent(record, 'pro')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-wider">Queue PRO Agent</button>
                        <button onClick={() => queueAgent(record, 'mlc')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider">Queue MLC Agent</button>
                        <button onClick={() => queueAgent(record, 'master_rights')} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">Queue Master Rights Agent</button>
                      </div>
                    </div>

                    {(record.links.spotify || record.links.appleMusic || record.links.youtubeMusic) && (
                      <div className="flex flex-wrap gap-3 text-xs">
                        {record.links.spotify && <a href={record.links.spotify} target="_blank" rel="noreferrer" className="text-emerald-300 flex items-center gap-1">Spotify <ExternalLink className="w-3 h-3" /></a>}
                        {record.links.appleMusic && <a href={record.links.appleMusic} target="_blank" rel="noreferrer" className="text-pink-300 flex items-center gap-1">Apple Music <ExternalLink className="w-3 h-3" /></a>}
                        {record.links.youtubeMusic && <a href={record.links.youtubeMusic} target="_blank" rel="noreferrer" className="text-red-300 flex items-center gap-1">YouTube Music <ExternalLink className="w-3 h-3" /></a>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 text-slate-500 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white">Automation boundary</div>
          <p className="text-sm text-slate-500 mt-1">Release Rails can prepare, validate and reconcile data automatically. External legal attestations and final submissions stay confirmation-gated until a supported authenticated partner connection is active.</p>
        </div>
      </div>
    </div>
  );
};
