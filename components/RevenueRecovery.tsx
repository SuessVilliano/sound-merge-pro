import React, { useMemo, useState } from 'react';
import {
  Search, DollarSign, AlertCircle, Clock, ExternalLink, ShieldCheck,
  Loader2, Database, CheckCircle2, FileSpreadsheet, Globe2, RefreshCw,
  BookOpen, Link2, ReceiptText
} from 'lucide-react';
import { PRO_PLATFORMS } from '../constants';
import { labelGridService } from '../services/labelGridService';

type ProviderState = {
  connected: boolean;
  royalties?: any;
  statements?: any;
  transactions?: any;
  analytics?: any;
  checkedAt?: string;
  error?: string;
};

const rowsFrom = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const keys = ['data', 'items', 'results', 'rows', 'royalties', 'statements', 'transactions'];
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
    if (Array.isArray(value[key]?.data)) return value[key].data;
  }
  return [];
};

const findMoney = (value: any): number => {
  const preferred = ['total', 'amount', 'net', 'net_amount', 'royalty', 'royalties', 'earnings', 'revenue', 'payable', 'balance'];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object') return 0;

  for (const key of preferred) {
    const candidate = value[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string' && candidate.trim() && !Number.isNaN(Number(candidate))) return Number(candidate);
  }

  const rows = rowsFrom(value);
  if (rows.length) return rows.reduce((sum, row) => sum + findMoney(row), 0);
  return 0;
};

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

export const RevenueRecovery: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [provider, setProvider] = useState<ProviderState>({ connected: false });

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const connection = await labelGridService.connection();
      if (!connection?.connected) {
        setProvider({
          connected: false,
          checkedAt: new Date().toISOString(),
          error: 'LabelGrid distribution/royalty rail is not connected yet.'
        });
        return;
      }

      const [royalties, statements, transactions, analytics] = await Promise.all([
        labelGridService.royalties().catch(() => null),
        labelGridService.statements().catch(() => null),
        labelGridService.get('transactions').catch(() => null),
        labelGridService.analyticsSummary().catch(() => null)
      ]);

      setProvider({
        connected: true,
        royalties,
        statements,
        transactions,
        analytics,
        checkedAt: new Date().toISOString()
      });
    } catch (e: any) {
      setProvider({
        connected: false,
        checkedAt: new Date().toISOString(),
        error: e?.message || 'Royalty source check failed.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const royaltyRows = useMemo(() => rowsFrom(provider.royalties), [provider.royalties]);
  const statementRows = useMemo(() => rowsFrom(provider.statements), [provider.statements]);
  const transactionRows = useMemo(() => rowsFrom(provider.transactions), [provider.transactions]);
  const verifiedAmount = useMemo(() => findMoney(provider.royalties), [provider.royalties]);

  const sourceCount = [
    provider.connected,
    Boolean(provider.royalties),
    Boolean(provider.statements),
    Boolean(provider.transactions),
    Boolean(provider.analytics)
  ].filter(Boolean).length;

  return (
    <div className="space-y-8 pb-20">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-[0.24em] mb-4">
              <DollarSign className="w-4 h-4" /> Money Map
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
              Collect <span className="text-emerald-400">Everything.</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg mt-4 max-w-3xl leading-relaxed">
              Bring distributor royalties, publishing registrations, neighboring-rights sources, statements and identifiers into one place. Sound Merge only displays money it can trace to a connected provider or confirmed import.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking Sources...</> : <><RefreshCw className="w-4 h-4" /> Refresh Money Sources</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Provider-Reported Royalties', value: fmtMoney(verifiedAmount), icon: DollarSign, tone: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Statements Found', value: String(statementRows.length), icon: FileSpreadsheet, tone: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Transactions Found', value: String(transactionRows.length), icon: ReceiptText, tone: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Money Data Rails', value: String(sourceCount), icon: Database, tone: 'text-amber-400', bg: 'bg-amber-500/10' }
        ].map(({ label, value, icon: Icon, tone, bg }) => (
          <div key={label} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className={`p-3 ${bg} rounded-xl`}><Icon className={`w-6 h-6 ${tone}`} /></div>
            <div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.1fr_.9fr] gap-6">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400">Connected Source</div>
              <h2 className="text-2xl font-black text-white mt-1">LabelGrid Distribution + Money</h2>
            </div>
            <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-black border ${
              provider.connected
                ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                : 'text-slate-500 border-slate-700 bg-slate-900'
            }`}>
              {provider.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {provider.error ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
              {provider.error}
            </div>
          ) : provider.connected ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Royalty Rows</div>
                  <div className="text-xl font-black text-white mt-2">{royaltyRows.length}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Statements</div>
                  <div className="text-xl font-black text-white mt-2">{statementRows.length}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Transactions</div>
                  <div className="text-xl font-black text-white mt-2">{transactionRows.length}</div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <p className="text-sm text-slate-300">
                  These counts and totals come from the connected distributor rail. Sound Merge should next reconcile each statement row back to the release, recording ISRC and store link in Catalog Identity.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <Database className="w-10 h-10 text-slate-700 mx-auto" />
              <div className="text-white font-black mt-4">Connect a real distributor money rail</div>
              <p className="text-sm text-slate-500 mt-2">
                Add LabelGrid credentials in Integration Center to pull distributor delivery, analytics, statements and royalty data into Sound Merge.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-400">Publishing Side</div>
          <h2 className="text-2xl font-black text-white mt-1">Composition Money Is Different.</h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Distributor/master income is only one side. Writers also need the composition registered correctly with their society/mechanical/publishing-admin stack so performance and mechanical royalties can find them.
          </p>

          <div className="mt-5 space-y-3">
            <a href="https://www.songtrust.com/en/songwriter-splits-and-royalties-crash-course" target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-500/40">
              <div className="flex items-center gap-2 text-white font-black text-sm"><FileSpreadsheet className="w-4 h-4 text-violet-400" /> Splits & Royalties Crash Course</div>
              <p className="text-xs text-slate-500 mt-2">Songtrust education on split agreements, ownership percentages and registration problems.</p>
            </a>
            <a href="https://www.songtrust.com/resource-center" target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-500/40">
              <div className="flex items-center gap-2 text-white font-black text-sm"><BookOpen className="w-4 h-4 text-violet-400" /> Songtrust Resource Center</div>
              <p className="text-xs text-slate-500 mt-2">Publishing, global royalty collection, split-sheet, royalty-statement and songwriter resources.</p>
            </a>
            <a href="https://www.songtrust.com/" target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-500/40">
              <div className="flex items-center gap-2 text-white font-black text-sm"><Globe2 className="w-4 h-4 text-violet-400" /> Publishing Administration Option</div>
              <p className="text-xs text-slate-500 mt-2">If an artist chooses a publishing administrator, keep that relationship separate from distributor/master income inside Sound Merge.</p>
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Rights & Collection Rails
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Each rail collects or administers a different slice of the music business. Sound Merge should track the relationship and confirmation IDs without pretending one registration replaces another.
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRO_PLATFORMS.map((pro, i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex flex-col h-full">
              <div className="flex justify-between items-start gap-3 mb-3">
                <span className="font-black text-white">{pro.name}</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase font-black tracking-widest">{pro.type}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 flex-1">Status remains unconfirmed until Sound Merge imports or receives a real provider confirmation.</p>
              <a href={pro.url} target="_blank" rel="noreferrer" className="w-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                Open Official Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
        <p className="text-sm text-slate-500">
          “Money found” should mean Sound Merge can trace a real royalty, statement, claim or unmatched-usage record to a provider. Until then, the app should show setup/readiness—not an estimated recovered-dollar number.
        </p>
      </div>
    </div>
  );
};
