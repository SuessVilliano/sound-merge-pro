import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { MusicWork, WorkSplit } from '../types';

const fmtToday = () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

const buildSheetText = (work: MusicWork): string => {
  const lines: string[] = ['SONGWRITER SPLIT SHEET', ''];
  lines.push(`Work: ${work.title || 'Untitled'}`);
  lines.push(`Performing Artist: ${work.artist || '—'}`);
  if (work.iswc) lines.push(`ISWC: ${work.iswc}`);
  if (work.isrc) lines.push(`ISRC: ${work.isrc}`);
  lines.push(`Date: ${fmtToday()}`);
  lines.push('', 'CONTRIBUTORS');
  if (work.splits.length === 0) {
    lines.push('  (none listed)');
  } else {
    work.splits.forEach(s => {
      const bits = [s.name || 'Unnamed', s.role];
      if (s.ipi) bits.push(`IPI ${s.ipi}`);
      if (s.proAffiliation) bits.push(s.proAffiliation);
      bits.push(`${s.share || 0}%`);
      bits.push(s.signed ? `Agreed${s.signedAt ? ` ${new Date(s.signedAt).toLocaleDateString()}` : ''}` : 'Pending agreement');
      lines.push(`  - ${bits.join('  |  ')}`);
    });
  }
  const total = work.splits.reduce((sum, s) => sum + (Number(s.share) || 0), 0);
  lines.push('', `TOTAL: ${total}%`, '');
  lines.push('This split sheet records the ownership shares agreed by the contributors above for this musical work.');
  return lines.join('\n');
};

interface SplitSheetModalProps {
  work: MusicWork;
  onUpdateSplits: (splits: WorkSplit[]) => void;
  onClose: () => void;
}

export const SplitSheetModal: React.FC<SplitSheetModalProps> = ({ work, onUpdateSplits, onClose }) => {
  const [copied, setCopied] = useState(false);
  const total = work.splits.reduce((s, x) => s + (Number(x.share) || 0), 0);
  const agreedCount = work.splits.filter(s => s.signed).length;

  const toggleSigned = (id: string) => {
    onUpdateSplits(work.splits.map(s => s.id === id
      ? { ...s, signed: !s.signed, signedAt: !s.signed ? new Date().toISOString() : undefined }
      : s));
  };

  const copySheet = async () => {
    try {
      await navigator.clipboard.writeText(buildSheetText(work));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* clipboard unavailable */ }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />Split Sheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{work.title || 'Untitled work'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Work</span><span className="font-bold text-slate-900 dark:text-white">{work.title || 'Untitled'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Performing Artist</span><span className="font-bold text-slate-900 dark:text-white">{work.artist || '—'}</span></div>
            {work.iswc && <div className="flex justify-between"><span className="text-slate-400">ISWC</span><span className="font-bold text-slate-900 dark:text-white">{work.iswc}</span></div>}
            {work.isrc && <div className="flex justify-between"><span className="text-slate-400">ISRC</span><span className="font-bold text-slate-900 dark:text-white">{work.isrc}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="font-bold text-slate-900 dark:text-white">{fmtToday()}</span></div>
          </div>

          {work.splits.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No contributors yet. Add splits to the work to build a sheet.</p>
          ) : (
            <div className="space-y-2">
              {work.splits.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{s.name || 'Unnamed contributor'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {s.role}{s.ipi ? ` · IPI ${s.ipi}` : ''}{s.proAffiliation ? ` · ${s.proAffiliation}` : ''} · {s.share || 0}%
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSigned(s.id)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${s.signed ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'}`}
                  >
                    <Check className="w-3.5 h-3.5" />{s.signed ? 'Agreed' : 'Mark agreed'}
                  </button>
                </div>
              ))}
              <div className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-black ${total === 100 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                <span>TOTAL</span><span>{total}%</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Marking a contributor as agreed records their acknowledgement of these shares inside Sound Merge.
            For a legally binding agreement, copy the sheet and have each contributor sign it.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-xs text-slate-400">{agreedCount} / {work.splits.length} agreed</span>
          <div className="flex gap-2">
            <button onClick={copySheet} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy Sheet'}
            </button>
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};
