import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, AlertTriangle, RefreshCw, PlugZap, Server,
  Bot, Music2, Database, Video, Mic2, Webhook, ShieldCheck, Circle
} from 'lucide-react';
import { integrationService, IntegrationHealth, IntegrationStatus } from '../services/integrationService';

const categoryIcon: Record<string, any> = {
  ai: Bot,
  music_generation: Music2,
  data: Database,
  audio: Server,
  video: Video,
  voice: Mic2,
  automation: Webhook,
  wallet_data: Database,
  licensing: ShieldCheck
};

const modeLabel: Record<string, string> = {
  api: 'REAL API',
  browser_agent: 'BROWSER AGENT',
  adapter_needed: 'ADAPTER NEEDED',
  not_configured: 'NOT CONFIGURED',
  server_proxy_needed: 'MIGRATION NEEDED',
  retiring: 'RETIRING',
  retiring: 'RETIRING'
};

const statusClass = (provider: IntegrationStatus) => {
  if (provider.real) return 'border-emerald-500/30 bg-emerald-500/5';
  if (provider.mode === 'browser_agent') return 'border-violet-500/30 bg-violet-500/5';
  if (provider.mode === 'retiring') return 'border-rose-500/30 bg-rose-500/5';
  if (provider.configured) return 'border-amber-500/30 bg-amber-500/5';
  return 'border-slate-800 bg-slate-950';
};

export const IntegrationCenter: React.FC = () => {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setHealth(await integrationService.getStatus());
    } catch (e: any) {
      setError(e?.message || 'Could not inspect integrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const providers = health?.providers || [];
    return {
      real: providers.filter(p => p.real).length,
      browser: providers.filter(p => p.mode === 'browser_agent').length,
      needsWork: providers.filter(p => p.configured && !p.real && p.mode !== 'browser_agent' && p.mode !== 'retiring').length,
      missing: providers.filter(p => !p.configured && p.mode !== 'browser_agent' && p.mode !== 'retiring').length
    };
  }, [health]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.24em] mb-4">
              <PlugZap className="w-4 h-4" /> System Truth Layer
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Integration <span className="text-cyan-400">Center.</span></h1>
            <p className="text-slate-400 mt-4 max-w-3xl text-base md:text-lg leading-relaxed">
              One place to see what is actually connected, what is browser-agent only, what still needs credentials, and what old client-side integrations must be migrated before Sound Merge can call them production-ready.
            </p>
          </div>
          <button onClick={load} disabled={loading} className="px-5 py-3 rounded-xl bg-white text-slate-950 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recheck
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            ['Real APIs', summary.real, CheckCircle2, 'text-emerald-400'],
            ['Browser Agent', summary.browser, Bot, 'text-violet-400'],
            ['Needs Migration', summary.needsWork, AlertTriangle, 'text-amber-400'],
            ['Missing', summary.missing, Circle, 'text-slate-500']
          ].map(([label, value, Icon, color]: any) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <Icon className={`w-5 h-5 mb-3 ${color}`} />
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-[9px] uppercase tracking-widest font-black text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-red-300 text-sm">{error}</div>
      )}

      {loading && !health ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mr-3 text-cyan-400" /> Inspecting Sound Merge rails...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(health?.providers || []).map(provider => {
            const Icon = categoryIcon[provider.category] || Activity;
            return (
              <div key={provider.id} className={`rounded-[1.5rem] border p-5 ${statusClass(provider)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm">{provider.label}</h3>
                      <div className="text-[8px] uppercase tracking-widest text-slate-600 font-black mt-1">{provider.category.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-full border ${
                    provider.real ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' :
                    provider.mode === 'browser_agent' ? 'text-violet-300 border-violet-500/30 bg-violet-500/10' :
                    provider.mode === 'retiring' ? 'text-rose-300 border-rose-500/30 bg-rose-500/10' :
                    provider.configured ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' :
                    'text-slate-500 border-slate-700 bg-slate-900'
                  }`}>
                    {modeLabel[provider.mode] || provider.mode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-5">{provider.note}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 text-cyan-400 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white">Clean-sweep rule</div>
          <p className="text-sm text-slate-500 mt-1">
            A feature is only called “connected” when Sound Merge is receiving real provider data or executing through an authenticated provider/browser workflow. Fallback/demo data can still exist, but it must be labeled as preview data.
          </p>
        </div>
      </div>
    </div>
  );
};
