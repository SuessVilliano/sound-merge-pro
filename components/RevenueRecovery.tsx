import React, { useState } from 'react';
import { Search, DollarSign, AlertCircle, Clock, ExternalLink, ShieldCheck, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { PRO_PLATFORMS } from '../constants';

export const RevenueRecovery: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsScanning(false);
    setChecked(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Recovery</h1>
          <p className="text-slate-400 text-sm mt-1">
            Prepare royalty sources, registrations, and release metadata for recovery. Sound Merge will only display money when it comes from a connected source.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Verified Found', value: '$0.00', icon: DollarSign, tone: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Verified Pending', value: '$0.00', icon: Clock, tone: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Verified Claimed', value: '$0.00', icon: CheckCircle2, tone: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Connected Royalty Sources', value: '0', icon: Database, tone: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map(({ label, value, icon: Icon, tone, bg }) => (
          <div key={label} className="bg-slate-850 p-5 rounded-xl border border-slate-800 flex items-center gap-4">
            <div className={`p-3 ${bg} rounded-lg`}><Icon className={`w-6 h-6 ${tone}`} /></div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-850 rounded-xl border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Royalty Source Check</h3>
            <p className="text-xs text-slate-400">Verify whether royalty data sources are actually connected before running recovery analysis.</p>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : <><Search className="w-4 h-4" /> Check Connections</>}
          </button>
        </div>

        <div className={`border rounded-lg p-4 flex gap-3 ${checked ? 'bg-amber-900/10 border-amber-500/30' : 'bg-cyan-900/20 border-cyan-500/30'}`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${checked ? 'text-amber-400' : 'text-cyan-400'}`} />
          <div className={`text-sm ${checked ? 'text-amber-100' : 'text-cyan-100'}`}>
            <span className="font-bold">{checked ? 'No royalty feeds connected yet.' : 'Truth-first recovery.'}</span>{' '}
            {checked
              ? 'Connect PRO/CMO, mechanical, neighboring-rights, distributor, or publishing data before Sound Merge can report found, pending, or claimed royalties.'
              : 'The old demo scanner has been removed. Recovery totals remain zero until provider-backed records exist.'}
          </div>
        </div>
      </div>

      <div className="bg-slate-850 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" /> Rights & Registrations
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Use these official destinations to register or manage rights. Status remains “Not Connected” until Sound Merge has a verified integration or imported confirmation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRO_PLATFORMS.map((pro, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-all group flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-white text-lg">{pro.name}</span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold tracking-wide">{pro.type}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                  Status: <span className="text-slate-500 italic flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Not Connected</span>
                </p>
              </div>
              <a href={pro.url} target="_blank" rel="noreferrer" className="w-full bg-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-200 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                Open Official Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-850 rounded-xl border border-slate-800 p-6 min-h-[260px] flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">Verified Royalty History</h3>
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
          <DollarSign className="w-16 h-16 text-slate-700 mb-4" />
          <h4 className="text-xl font-bold text-slate-400">No verified royalty records yet</h4>
          <p className="text-slate-500 text-sm mt-2 text-center max-w-xl">
            When a connected provider or confirmed import supplies royalty records, they can appear here with source, date, work, amount, and claim status.
          </p>
        </div>
      </div>
    </div>
  );
};
