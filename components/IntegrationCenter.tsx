import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, AlertTriangle, RefreshCw, PlugZap, Server,
  Bot, Music2, Database, Video, Mic2, Webhook, ShieldCheck, Circle, KeyRound, Trash2, Eye, EyeOff, Save
} from 'lucide-react';
import { integrationService, IntegrationHealth, IntegrationStatus } from '../services/integrationService';
import { byokService, ByokProvider, ByokCredentials } from '../services/byokService';

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


const byokProviders: Array<{
  id: ByokProvider;
  label: string;
  description: string;
  fields: Array<{ key: keyof ByokCredentials; label: string; placeholder: string; secret?: boolean }>;
}> = [
  {
    id: 'gemini',
    label: 'Gemini + Nano Banana',
    description: 'Prompt Architect, AI staff, voice-note understanding and Nano Banana artwork.',
    fields: [{ key: 'apiKey', label: 'Gemini API Key', placeholder: 'AIza…', secret: true }]
  },
  {
    id: 'mureka',
    label: 'Mureka',
    description: 'Generate songs and instrumentals using your own Mureka account and credits.',
    fields: [{ key: 'apiKey', label: 'Mureka API Key', placeholder: 'Your Mureka key', secret: true }]
  },
  {
    id: 'suno',
    label: 'Suno Platform',
    description: 'Use your own Suno Platform account. Endpoint fields are optional when Sound Merge already has the adapter URLs configured.',
    fields: [
      { key: 'apiKey', label: 'Suno API Key', placeholder: 'Your Suno Platform key', secret: true },
      { key: 'generateUrl', label: 'Generate Endpoint (optional)', placeholder: 'https://…suno.com/…' },
      { key: 'statusUrl', label: 'Status Endpoint (optional)', placeholder: 'https://…suno.com/…/{id}' }
    ]
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    description: 'Eleven Music v2.5 generation plus future audiobook, narration, dubbing and voice workflows through the same account.',
    fields: [{ key: 'apiKey', label: 'ElevenLabs API Key', placeholder: 'xi-api-key', secret: true }]
  },
  {
    id: 'higgsfield',
    label: 'Higgsfield API',
    description: 'Use your own Open Higgsfield API balance for embedded visual generation.',
    fields: [
      { key: 'keyId', label: 'Higgsfield Key ID', placeholder: 'Key ID', secret: true },
      { key: 'keySecret', label: 'Higgsfield Key Secret', placeholder: 'Key Secret', secret: true }
    ]
  }
];

const modeLabel: Record<string, string> = {
  api: 'REAL API',
  mcp: 'MCP',
  browser_agent: 'BROWSER AGENT',
  adapter_needed: 'ADAPTER NEEDED',
  not_configured: 'NOT CONFIGURED',
  server_proxy_needed: 'MIGRATION NEEDED',
  retiring: 'RETIRING'
};

const statusClass = (provider: IntegrationStatus) => {
  if (provider.real) return 'border-emerald-500/30 bg-emerald-500/5';
  if (provider.mode === 'mcp' || provider.mode === 'browser_agent') return 'border-violet-500/30 bg-violet-500/5';
  if (provider.mode === 'retiring') return 'border-rose-500/30 bg-rose-500/5';
  if (provider.configured) return 'border-amber-500/30 bg-amber-500/5';
  return 'border-slate-800 bg-slate-950';
};

export const IntegrationCenter: React.FC = () => {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [byokValues, setByokValues] = useState<Record<ByokProvider, ByokCredentials>>({
    gemini: {},
    mureka: {},
    suno: {},
    elevenlabs: {},
    higgsfield: {}
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [byokVersion, setByokVersion] = useState(0);

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

  useEffect(() => {
    load();
    const sync = () => {
      setByokValues({
        gemini: byokService.get('gemini') || {},
        mureka: byokService.get('mureka') || {},
        suno: byokService.get('suno') || {},
        elevenlabs: byokService.get('elevenlabs') || {},
        higgsfield: byokService.get('higgsfield') || {}
      });
      setByokVersion(v => v + 1);
    };
    sync();
    window.addEventListener('sm-byok-updated', sync);
    return () => window.removeEventListener('sm-byok-updated', sync);
  }, []);

  const saveByok = (provider: ByokProvider) => {
    byokService.save(provider, byokValues[provider]);
    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: {
        title: 'Personal API Key Ready',
        message: `${byokProviders.find(p => p.id === provider)?.label || provider} will now prefer your credentials for this browser session.`,
        type: 'success'
      }
    }));
  };

  const clearByok = (provider: ByokProvider) => {
    byokService.clear(provider);
    setByokValues(prev => ({ ...prev, [provider]: {} }));
  };

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

      <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-[9px] font-black uppercase tracking-[0.22em]">
              <KeyRound className="w-4 h-4" /> Bring Your Own Key
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">Use your provider accounts immediately.</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Personal credentials override Sound Merge credentials for that provider. They are kept in this browser session only, sent to Sound Merge over the authenticated request, used transiently server-side, and are not written into your catalog or Firestore profile.
            </p>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300 border border-cyan-500/20 bg-slate-950 px-3 py-2 rounded-xl">
            Session-scoped • Clear anytime
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-4 mt-6">
          {byokProviders.map(provider => {
            const active = byokService.has(provider.id);
            const values = byokValues[provider.id] || {};
            return (
              <div key={provider.id} className={`rounded-2xl border p-5 ${active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/80'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{provider.label}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{provider.description}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${active ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700'}`}>
                    {active ? `Using My Key • ${byokService.masked(provider.id)}` : 'Sound Merge / Not Set'}
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {provider.fields.map(field => {
                    const secretId = `${provider.id}:${String(field.key)}`;
                    const visible = showSecrets[secretId];
                    return (
                      <div key={String(field.key)}>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.secret && !visible ? 'password' : 'text'}
                            value={String(values[field.key] || '')}
                            onChange={e => setByokValues(prev => ({
                              ...prev,
                              [provider.id]: { ...prev[provider.id], [field.key]: e.target.value }
                            }))}
                            placeholder={field.placeholder}
                            autoComplete="off"
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 pr-10 text-xs text-white outline-none focus:border-cyan-500"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => setShowSecrets(prev => ({ ...prev, [secretId]: !visible }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                            >
                              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => saveByok(provider.id)} className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Save className="w-3.5 h-3.5" /> Use My Key
                  </button>
                  {active && (
                    <button onClick={() => clearByok(provider.id)} className="px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                    (provider.mode === 'browser_agent' || provider.mode === 'mcp') ? 'text-violet-300 border-violet-500/30 bg-violet-500/10' :
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
