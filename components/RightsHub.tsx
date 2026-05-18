import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, FileCheck2, Radio, Scale, Stamp, Copy, Check, ExternalLink, Plus, X,
  Music2, ChevronDown, Trophy, Pencil, Trash2, AlertTriangle, Sparkles, ClipboardCheck,
  Lock, Info, ArrowRight, CircleDashed, Search, Sprout, Rocket, Library
} from 'lucide-react';
import { User, MusicWork, WorkSplit, RightsRegistryId, RegistrationStatus, RegistrationState, DiscoveredSong } from '../types';
import { RIGHTS_REGISTRIES, CAREER_STAGES } from '../constants';
import { dataService } from '../services/dataService';
import { FindSongsModal } from './FindSongsModal';
import { IndustryLinks } from './IndustryLinks';

const STATUS_FLOW: RegistrationStatus[] = ['not_started', 'data_ready', 'submitted', 'confirmed'];

const STATUS_META: Record<RegistrationStatus, { label: string; dot: string; chip: string }> = {
  not_started: { label: 'Not Started', dot: 'bg-slate-300 dark:bg-slate-700', chip: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
  data_ready:  { label: 'Data Ready',  dot: 'bg-amber-400',  chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  submitted:   { label: 'Submitted',   dot: 'bg-blue-500',   chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  confirmed:   { label: 'Confirmed',   dot: 'bg-green-500',  chip: 'bg-green-500/10 text-green-600 dark:text-green-400' },
};

const REGISTRY_ICONS: Record<string, any> = {
  copyright_us: Stamp,
  mlc: Scale,
  soundexchange: Radio,
  pro: FileCheck2,
};

const PRO_OPTIONS = ['', 'ASCAP', 'BMI', 'SESAC', 'SOCAN', 'PRS for Music', 'Other'];

const emptyRegistrations = (): Record<RightsRegistryId, RegistrationState> => ({
  copyright_us: { status: 'not_started' },
  mlc: { status: 'not_started' },
  soundexchange: { status: 'not_started' },
  pro: { status: 'not_started' },
});

const normalizeWork = (w: MusicWork): MusicWork => ({
  ...w,
  splits: Array.isArray(w.splits) ? w.splits : [],
  registrations: { ...emptyRegistrations(), ...(w.registrations || {}) },
});

const newWork = (userId: string, artist: string): MusicWork => ({
  id: `work_${Date.now()}`,
  userId,
  title: '',
  artist,
  splits: [],
  creationYear: String(new Date().getFullYear()),
  registrations: emptyRegistrations(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const totalShare = (w: MusicWork) => w.splits.reduce((sum, s) => sum + (Number(s.share) || 0), 0);
const writersOf = (w: MusicWork) => w.splits.filter(s => s.role === 'Writer/Composer');
const publishersOf = (w: MusicWork) => w.splits.filter(s => s.role === 'Publisher');

/** Returns the list of fields a work is still missing for a given registry. */
const missingFor = (work: MusicWork, registryId: RightsRegistryId): string[] => {
  const m: string[] = [];
  const hasWriters = writersOf(work).length > 0;
  const share = totalShare(work);
  switch (registryId) {
    case 'copyright_us':
      if (!work.title.trim()) m.push('Work title');
      if (work.splits.length === 0) m.push('At least one author / songwriter');
      if (!work.creationYear) m.push('Year of creation');
      if (!work.isInstrumental && !work.lyrics?.trim()) m.push('Lyrics (deposit copy)');
      break;
    case 'mlc':
      if (!work.title.trim()) m.push('Work title');
      if (!hasWriters) m.push('Songwriter split(s)');
      if (work.splits.length > 0 && share !== 100) m.push('Splits must total 100%');
      break;
    case 'soundexchange':
      if (!work.isrc?.trim()) m.push('ISRC code');
      if (!work.recordLabel?.trim() && !work.pLine?.trim()) m.push('Sound recording owner / label');
      if (!work.releaseDate) m.push('Release date');
      break;
    case 'pro':
      if (!hasWriters) m.push('Writer split(s)');
      if (work.splits.length > 0 && share !== 100) m.push('Splits must total 100%');
      break;
  }
  return m;
};

const fmtSplits = (rows: WorkSplit[]): string => {
  if (rows.length === 0) return '—';
  return rows.map(s => {
    const bits = [s.name || 'Unnamed', s.role];
    if (s.ipi) bits.push(`IPI ${s.ipi}`);
    if (s.proAffiliation) bits.push(s.proAffiliation);
    bits.push(`${s.share || 0}%`);
    return bits.join('  ·  ');
  }).join('\n');
};

/** Builds the copy-paste-ready data packet for a registry's portal. */
const buildPacket = (work: MusicWork, registryId: RightsRegistryId): { label: string; value: string }[] => {
  const writers = writersOf(work);
  const publishers = publishersOf(work);
  switch (registryId) {
    case 'copyright_us':
      return [
        { label: 'Work Title', value: work.title || '—' },
        { label: 'Alternate Title', value: work.alternateTitle || '—' },
        { label: 'Type of Work', value: work.isInstrumental ? 'Musical work (instrumental)' : 'Musical work with lyrics' },
        { label: 'Author(s) / Songwriter(s)', value: fmtSplits(writers.length ? writers : work.splits) },
        { label: 'Year of Completion', value: work.creationYear || '—' },
        { label: 'First Publication', value: work.isReleased ? `${work.releaseDate || '—'} · United States` : 'Unpublished' },
        { label: 'Copyright Claimant', value: work.cLine || work.artist || '—' },
        { label: 'Deposit Copy Checklist', value: 'Lyric sheet (PDF/TXT) + final audio master' },
      ];
    case 'mlc':
      return [
        { label: 'Work Title', value: work.title || '—' },
        { label: 'Also Known As', value: work.alternateTitle || '—' },
        { label: 'ISWC', value: work.iswc || 'Not yet assigned — request one during registration' },
        { label: 'Duration', value: work.duration || '—' },
        { label: 'Songwriter(s)', value: fmtSplits(writers) },
        { label: 'Publisher(s)', value: publishers.length ? fmtSplits(publishers) : 'Self-published' },
        { label: 'Total Writer Share', value: `${totalShare(work)}%` },
        { label: 'Matched Recording ISRC', value: work.isrc || '—' },
      ];
    case 'soundexchange':
      return [
        { label: 'Recording Title', value: work.title || '—' },
        { label: 'Featured Artist', value: work.artist || '—' },
        { label: 'ISRC', value: work.isrc || '—' },
        { label: 'Release Date', value: work.releaseDate || '—' },
        { label: 'Sound Recording Owner', value: work.recordLabel || work.pLine || work.artist || '—' },
        { label: '℗ Line', value: work.pLine || `℗ ${work.creationYear || ''} ${work.artist || ''}`.trim() },
      ];
    case 'pro':
      return [
        { label: 'Work Title (as registered)', value: work.alternateTitle || work.title || '—' },
        { label: 'Writer(s)', value: fmtSplits(writers) },
        { label: 'Publisher(s)', value: publishers.length ? fmtSplits(publishers) : 'Self-published' },
        { label: 'Total Performance Share', value: `${totalShare(work)}%` },
        { label: 'ISWC', value: work.iswc || 'Assign during registration' },
        { label: 'Duration', value: work.duration || '—' },
      ];
  }
};

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) { /* clipboard unavailable in this context */ }
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
};

const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 104 }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={9} fill="none" className="stroke-slate-200 dark:stroke-slate-800" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={9} strokeLinecap="round" fill="none"
        className="stroke-cyan-500 transition-all duration-700 ease-out"
        strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
      />
    </svg>
  );
};

interface RegistryCardProps {
  work: MusicWork;
  registry: typeof RIGHTS_REGISTRIES[number];
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<RegistrationState>) => void;
}

const RegistryCard: React.FC<RegistryCardProps> = ({ work, registry, isOpen, onToggle, onUpdate }) => {
  const registryId = registry.id as RightsRegistryId;
  const reg = work.registrations[registryId];
  const missing = missingFor(work, registryId);
  const isReady = missing.length === 0;
  const Icon = REGISTRY_ICONS[registryId] || ShieldCheck;
  const meta = STATUS_META[reg.status];
  const packet = buildPacket(work, registryId);
  const fullPacket = packet.map(f => `${f.label}: ${f.value}`).join('\n');
  const stepIndex = STATUS_FLOW.indexOf(reg.status);

  return (
    <div className={`rounded-2xl border transition-colors ${isOpen ? 'border-cyan-500/40 dark:border-cyan-500/30' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
          <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{registry.name}</h4>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.chip}`}>{meta.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{registry.tagline}</p>
        </div>
        {!isOpen && (isReady
          ? <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 shrink-0"><Check className="w-3.5 h-3.5" />Ready</span>
          : <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0"><AlertTriangle className="w-3.5 h-3.5" />{missing.length} to add</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{registry.purpose}</p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Registers: {registry.registers}</span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{registry.cost}</span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{registry.timeline}</span>
          </div>

          {!isReady && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />Add these to your work first
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                {missing.map(item => <li key={item} className="flex items-center gap-1.5"><CircleDashed className="w-3 h-3 text-amber-500 shrink-0" />{item}</li>)}
              </ul>
            </div>
          )}

          {/* Copy-paste data packet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-cyan-500" />Registration Packet
              </span>
              <CopyButton text={fullPacket} label="Copy all" />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {packet.map(field => (
                <div key={field.label} className="flex items-start gap-3 px-3 py-2 bg-slate-50/60 dark:bg-slate-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{field.label}</div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">{field.value}</div>
                  </div>
                  <CopyButton text={field.value} />
                </div>
              ))}
            </div>
          </div>

          {/* Portal links + steps */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">How to file</span>
            <ol className="mt-2 space-y-1.5">
              {registry.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 mt-3">
              {registry.portalLinks.map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5" />{link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Status tracker */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Filing Status</span>
            <div className="flex items-center gap-1 mt-2">
              {STATUS_FLOW.map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => onUpdate({ status: s })}
                    className={`flex-1 text-[9px] font-black uppercase tracking-wide py-1.5 rounded-lg transition-colors ${reg.status === s ? STATUS_META[s].chip : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    {STATUS_META[s].label}
                  </button>
                  {i < STATUS_FLOW.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            {stepIndex < STATUS_FLOW.length - 1 && (
              <button
                onClick={() => onUpdate({ status: STATUS_FLOW[stepIndex + 1] })}
                disabled={stepIndex === 0 && !isReady}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {stepIndex === 0 && !isReady
                  ? <><Lock className="w-3.5 h-3.5" />Complete the work details to unlock</>
                  : <><ArrowRight className="w-3.5 h-3.5" />Mark as {STATUS_META[STATUS_FLOW[stepIndex + 1]].label}</>}
              </button>
            )}
            {(reg.status === 'submitted' || reg.status === 'confirmed') && (
              <input
                value={reg.referenceId || ''}
                onChange={e => onUpdate({ referenceId: e.target.value })}
                placeholder="Confirmation / reference number from the portal"
                className="mt-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface WorkFormModalProps {
  user: User;
  editing: MusicWork | null;
  onSave: (work: MusicWork) => void;
  onClose: () => void;
}

const fieldClass = 'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500';
const labelClass = 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block';

const WorkFormModal: React.FC<WorkFormModalProps> = ({ user, editing, onSave, onClose }) => {
  const [form, setForm] = useState<MusicWork>(() =>
    editing ? normalizeWork(editing) : newWork(user.uid, user.displayName || '')
  );

  const set = (patch: Partial<MusicWork>) => setForm(prev => ({ ...prev, ...patch }));

  const addSplit = () => set({
    splits: [...form.splits, { id: `split_${Date.now()}`, name: '', role: 'Writer/Composer', share: 0 }],
  });
  const updateSplit = (id: string, patch: Partial<WorkSplit>) =>
    set({ splits: form.splits.map(s => s.id === id ? { ...s, ...patch } : s) });
  const removeSplit = (id: string) => set({ splits: form.splits.filter(s => s.id !== id) });

  const share = totalShare(form);
  const canSave = form.title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">{editing ? 'Edit Work' : 'Add a Work'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Capture every detail once — Sound Merge formats it for each registry.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Song Title *</label>
              <input value={form.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Midnight Signal" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Performing / PRO Title</label>
              <input value={form.alternateTitle || ''} onChange={e => set({ alternateTitle: e.target.value })} placeholder="If registered under another title" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Artist</label>
              <input value={form.artist} onChange={e => set({ artist: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>ISRC (recording)</label>
              <input value={form.isrc || ''} onChange={e => set({ isrc: e.target.value })} placeholder="US-XXX-YY-NNNNN" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>ISWC (composition)</label>
              <input value={form.iswc || ''} onChange={e => set({ iswc: e.target.value })} placeholder="T-XXX.XXX.XXX-C" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input value={form.duration || ''} onChange={e => set({ duration: e.target.value })} placeholder="3:45" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Year of Creation</label>
              <input value={form.creationYear || ''} onChange={e => set({ creationYear: e.target.value })} placeholder="2026" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Record Label / Owner</label>
              <input value={form.recordLabel || ''} onChange={e => set({ recordLabel: e.target.value })} placeholder="Independent" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Release Date</label>
              <input type="date" value={form.releaseDate || ''} onChange={e => set({ releaseDate: e.target.value, isReleased: !!e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>℗ Line (sound recording)</label>
              <input value={form.pLine || ''} onChange={e => set({ pLine: e.target.value })} placeholder="℗ 2026 Your Name" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>© Line (composition)</label>
              <input value={form.cLine || ''} onChange={e => set({ cLine: e.target.value })} placeholder="© 2026 Your Name" className={fieldClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={!!form.isInstrumental} onChange={e => set({ isInstrumental: e.target.checked })} className="rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-500" />
            This work is instrumental (no lyrics)
          </label>

          {!form.isInstrumental && (
            <div>
              <label className={labelClass}>Lyrics</label>
              <textarea value={form.lyrics || ''} onChange={e => set({ lyrics: e.target.value })} rows={6}
                placeholder="Write the full lyrics here — they travel with the work to every registry and distributor." className={`${fieldClass} resize-y`} />
            </div>
          )}

          {/* Splits editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelClass} mb-0`}>Writers, Producers & Publishers</label>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${share === 100 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                Splits: {share}%
              </span>
            </div>
            <div className="space-y-2">
              {form.splits.map(s => (
                <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                  <input value={s.name} onChange={e => updateSplit(s.id, { name: e.target.value })} placeholder="Full legal name" className={`${fieldClass} col-span-12 sm:col-span-4`} />
                  <select value={s.role} onChange={e => updateSplit(s.id, { role: e.target.value as WorkSplit['role'] })} className={`${fieldClass} col-span-5 sm:col-span-3`}>
                    <option value="Writer/Composer">Writer/Composer</option>
                    <option value="Producer">Producer</option>
                    <option value="Publisher">Publisher</option>
                  </select>
                  <select value={s.proAffiliation || ''} onChange={e => updateSplit(s.id, { proAffiliation: e.target.value })} className={`${fieldClass} col-span-7 sm:col-span-2`}>
                    {PRO_OPTIONS.map(p => <option key={p} value={p}>{p || 'PRO…'}</option>)}
                  </select>
                  <input value={s.ipi || ''} onChange={e => updateSplit(s.id, { ipi: e.target.value })} placeholder="IPI" className={`${fieldClass} col-span-6 sm:col-span-2`} />
                  <div className="col-span-6 sm:col-span-1 flex items-center gap-1">
                    <input type="number" value={s.share || 0} onChange={e => updateSplit(s.id, { share: Number(e.target.value) })} className={`${fieldClass} px-2`} />
                    <button onClick={() => removeSplit(s.id)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addSplit} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
              <Plus className="w-4 h-4" />Add contributor
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={save} disabled={!canSave}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            {editing ? 'Save Changes' : 'Add Work'}
          </button>
        </div>
      </div>
    </div>
  );
};

const STAGE_ICON: Record<string, any> = { Sprout, Rocket, Radio, Library };

const RoadmapCard: React.FC<{ user: User; onFindSongs: () => void; onAddWork: () => void }> = ({ user, onFindSongs, onAddWork }) => {
  const [stageId, setStageId] = useState<string | undefined>(
    () => user.careerStage || localStorage.getItem('sf_career_stage') || undefined
  );
  const [picking, setPicking] = useState(false);
  const stage = CAREER_STAGES.find(s => s.id === stageId);

  const choose = (id: string) => {
    setStageId(id);
    try { localStorage.setItem('sf_career_stage', id); } catch (e) { /* storage unavailable */ }
    setPicking(false);
  };

  if (!stage || picking) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-black text-lg text-slate-900 dark:text-white">Personalize your roadmap</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tell us where you are and we'll order your registration priorities.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CAREER_STAGES.map(s => {
            const Icon = STAGE_ICON[s.icon] || Sparkles;
            return (
              <button key={s.id} onClick={() => choose(s.id)}
                className={`text-left rounded-2xl border p-4 transition-colors ${stageId === s.id ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <Icon className="w-5 h-5 text-cyan-500 mb-2" />
                <div className="font-black text-sm text-slate-900 dark:text-white">{s.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = STAGE_ICON[stage.icon] || Sparkles;
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10"><Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
          <div>
            <h2 className="font-black text-base text-slate-900 dark:text-white">Your Roadmap · {stage.label}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stage.tagline}</p>
          </div>
        </div>
        <button onClick={() => setPicking(true)} className="text-[11px] font-bold text-slate-400 hover:text-cyan-500 shrink-0">Change</button>
      </div>
      <ol className="space-y-2.5">
        {stage.roadmap.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-500 text-white text-[11px] font-black flex items-center justify-center">{i + 1}</span>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onFindSongs} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90">
          <Search className="w-3.5 h-3.5" />Find My Songs
        </button>
        <button onClick={onAddWork} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Plus className="w-3.5 h-3.5" />Add a Work
        </button>
      </div>
    </div>
  );
};

export const RightsHub: React.FC<{ user: User }> = ({ user }) => {
  const [works, setWorks] = useState<MusicWork[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openRegistry, setOpenRegistry] = useState<RightsRegistryId | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<MusicWork | null>(null);
  const [findOpen, setFindOpen] = useState(false);

  useEffect(() => {
    const stored = dataService.getRightsWorks(user.uid).map(normalizeWork);
    setWorks(stored);
    if (stored.length > 0) setSelectedId(stored[0].id);
    setLoaded(true);
  }, [user.uid]);

  useEffect(() => {
    if (loaded) dataService.saveRightsWorks(user.uid, works);
  }, [works, loaded, user.uid]);

  const selected = works.find(w => w.id === selectedId) || null;

  const portfolio = useMemo(() => {
    const totalSlots = works.length * RIGHTS_REGISTRIES.length;
    let confirmed = 0;
    let inProgress = 0;
    let fullyDone = 0;
    works.forEach(w => {
      const regs = Object.values(w.registrations);
      const c = regs.filter(r => r.status === 'confirmed').length;
      confirmed += c;
      inProgress += regs.filter(r => r.status === 'submitted' || r.status === 'data_ready').length;
      if (c === RIGHTS_REGISTRIES.length) fullyDone += 1;
    });
    return {
      pct: totalSlots ? Math.round((confirmed / totalSlots) * 100) : 0,
      confirmed, inProgress, fullyDone, totalSlots,
    };
  }, [works]);

  const saveWork = (work: MusicWork) => {
    setWorks(prev => {
      const exists = prev.some(w => w.id === work.id);
      return exists ? prev.map(w => w.id === work.id ? work : w) : [work, ...prev];
    });
    setSelectedId(work.id);
    setFormOpen(false);
    setEditingWork(null);
  };

  const deleteWork = (id: string) => {
    if (!window.confirm('Remove this work from your Rights Hub? Registration progress for it will be lost.')) return;
    setWorks(prev => prev.filter(w => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateRegistration = (workId: string, registryId: RightsRegistryId, patch: Partial<RegistrationState>) => {
    setWorks(prev => prev.map(w => {
      if (w.id !== workId) return w;
      const current = w.registrations[registryId] || { status: 'not_started' };
      const next: RegistrationState = { ...current, ...patch };
      if (patch.status === 'submitted' && !next.submittedAt) next.submittedAt = new Date().toISOString();
      if (patch.status === 'confirmed' && !next.confirmedAt) next.confirmedAt = new Date().toISOString();
      return { ...w, registrations: { ...w.registrations, [registryId]: next }, updatedAt: new Date().toISOString() };
    }));
  };

  const importSongs = (songs: DiscoveredSong[]) => {
    if (songs.length === 0) return;
    const now = Date.now();
    const created: MusicWork[] = songs.map((song, i) => {
      const base = newWork(user.uid, song.artist || user.displayName || '');
      const durMs = song.durationMs || 0;
      const year = song.year || (song.releaseDate ? song.releaseDate.slice(0, 4) : base.creationYear);
      return {
        ...base,
        id: `work_${now}_${i}`,
        title: song.title,
        artist: song.artist || user.displayName || '',
        image: song.image,
        isrc: song.isrc,
        duration: durMs ? `${Math.floor(durMs / 60000)}:${String(Math.floor((durMs % 60000) / 1000)).padStart(2, '0')}` : undefined,
        releaseDate: song.releaseDate,
        isReleased: !!(song.releaseDate || song.year),
        creationYear: year,
      };
    });
    setWorks(prev => [...created, ...prev]);
    setSelectedId(created[0].id);
    setFindOpen(false);
  };

  const openAdd = () => { setEditingWork(null); setFormOpen(true); };
  const openEdit = (w: MusicWork) => { setEditingWork(w); setFormOpen(true); };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500"><ShieldCheck className="w-5 h-5 text-white" /></div>
              <h1 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">Rights & Registration Hub</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Register every song the right way. Capture your metadata once, and Sound Merge turns each
              registry into a guided quest with copy-paste-ready packets and direct portal links.
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="relative flex items-center justify-center">
              <ProgressRing pct={portfolio.pct} />
              <div className="absolute text-center">
                <div className="text-2xl font-black text-slate-900 dark:text-white">{portfolio.pct}%</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Registered</div>
              </div>
            </div>
            <div className="space-y-2">
              <div><div className="text-xl font-black text-slate-900 dark:text-white">{works.length}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Works</div></div>
              <div><div className="text-xl font-black text-green-600 dark:text-green-400">{portfolio.confirmed}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmed</div></div>
              <div><div className="text-xl font-black text-amber-600 dark:text-amber-400">{portfolio.fullyDone}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fully Filed</div></div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-3">
          <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            These registries don't accept third-party automated submissions, so Sound Merge does the next best thing:
            it prepares a perfectly-formatted packet and walks you to the right portal. The final click stays with you — your rights, your control.
          </p>
        </div>
      </div>

      <RoadmapCard user={user} onFindSongs={() => setFindOpen(true)} onAddWork={openAdd} />

      {works.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4"><Music2 className="w-8 h-8 text-cyan-500" /></div>
          <h3 className="font-black text-lg text-slate-900 dark:text-white">Add your first work</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Find songs already tied to your name across the platforms, or add one by hand. We'll show you
            exactly what each registry needs and track every filing for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setFindOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90">
              <Search className="w-4 h-4" />Find My Songs
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
              <Plus className="w-4 h-4" />Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Works list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Your Works</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setFindOpen(true)} className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                  <Search className="w-4 h-4" />Find
                </button>
                <button onClick={openAdd} className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                  <Plus className="w-4 h-4" />Add
                </button>
              </div>
            </div>
            {works.map(w => {
              const confirmed = Object.values(w.registrations).filter(r => r.status === 'confirmed').length;
              const isFull = confirmed === RIGHTS_REGISTRIES.length;
              return (
                <button key={w.id} onClick={() => setSelectedId(w.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${selectedId === w.id ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  <div className="flex items-center gap-3">
                    {w.image
                      ? <img src={w.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Music2 className="w-4 h-4 text-slate-400" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="flex-1 font-black text-sm text-slate-900 dark:text-white truncate">{w.title || 'Untitled work'}</h3>
                        {isFull && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{w.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {RIGHTS_REGISTRIES.map(r => {
                      const reg = w.registrations[r.id as RightsRegistryId];
                      return <div key={r.id} className={`flex-1 h-1.5 rounded-full ${STATUS_META[reg.status].dot}`} title={`${r.short}: ${STATUS_META[reg.status].label}`} />;
                    })}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1.5">{confirmed} / {RIGHTS_REGISTRIES.length} registries confirmed</div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-8">
            {selected ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selected.image
                        ? <img src={selected.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        : <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Music2 className="w-5 h-5 text-slate-400" /></div>}
                      <div className="min-w-0">
                        <h2 className="font-black text-xl text-slate-900 dark:text-white truncate">{selected.title || 'Untitled work'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selected.artist}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(selected)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteWork(selected.id)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      ['ISRC', selected.isrc],
                      ['ISWC', selected.iswc],
                      ['Duration', selected.duration],
                      ['Year', selected.creationYear],
                    ].map(([label, val]) => (
                      <span key={label} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${val ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}>
                        {label}: {val || 'missing'}
                      </span>
                    ))}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${totalShare(selected) === 100 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      Splits: {totalShare(selected)}%
                    </span>
                  </div>
                </div>

                {Object.values(selected.registrations).every(r => r.status === 'confirmed') && (
                  <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-cyan-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-black text-sm text-slate-900 dark:text-white">Fully Registered</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Every registry confirmed for this work. Your rights are locked in.</div>
                    </div>
                  </div>
                )}

                {RIGHTS_REGISTRIES.map(registry => (
                  <RegistryCard
                    key={registry.id}
                    work={selected}
                    registry={registry}
                    isOpen={openRegistry === registry.id}
                    onToggle={() => setOpenRegistry(prev => prev === registry.id ? null : registry.id as RightsRegistryId)}
                    onUpdate={patch => updateRegistration(selected.id, registry.id as RightsRegistryId, patch)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">Select a work to manage its registrations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <IndustryLinks />

      {formOpen && (
        <WorkFormModal
          user={user}
          editing={editingWork}
          onSave={saveWork}
          onClose={() => { setFormOpen(false); setEditingWork(null); }}
        />
      )}

      {findOpen && (
        <FindSongsModal
          user={user}
          existingWorks={works}
          onImport={importSongs}
          onClose={() => setFindOpen(false)}
        />
      )}
    </div>
  );
};
