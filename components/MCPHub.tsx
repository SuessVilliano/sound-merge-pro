import React, { useMemo } from 'react';
import {
  Bot, PlugZap, Copy, CheckCircle2, Workflow, ExternalLink, Music2,
  Video, BarChart3, ShieldCheck, Globe2, Wand2, Database, MousePointerClick
} from 'lucide-react';

const PROVIDER_ROUTES = [
  { provider: 'Higgsfield', best: 'MCP + API + Web', use: 'Music videos, characters, lip sync, motion, promo visuals', icon: Video, links: [
    { label: 'MCP Setup', url: 'https://higgsfield.ai/mcp' },
    { label: 'Web Studio', url: 'https://higgsfield.ai' },
    { label: 'API Console', url: 'https://open.higgsfield.ai' }
  ]},
  { provider: 'Chartmetric', best: 'MCP + REST', use: 'Artist research, playlist intelligence, audience and market data', icon: BarChart3, links: [
    { label: 'Chartmetric MCP', url: 'https://chartmetric.com/products/mcp' }
  ]},
  { provider: 'Suno', best: 'API', use: 'Song generation from prompts, lyrics and concepts', icon: Music2, links: [
    { label: 'Suno Platform', url: 'https://platform.suno.com' }
  ]},
  { provider: 'Music.AI', best: 'API', use: 'Stems, audio intelligence, transcription, classification and workflow processing', icon: Workflow, links: [
    { label: 'Music.AI Platform', url: 'https://music.ai/platform/' }
  ]},
  { provider: 'LANDR', best: 'API', use: 'Commercial mastering rail', icon: Wand2, links: [
    { label: 'LANDR Mastering API', url: 'https://www.landr.com/pro-audio-mastering-api' }
  ]},
  { provider: 'DistroKid / PRO / MLC', best: 'Approval-gated browser agent', use: 'Authenticated portals where Sound Merge should prepare everything, then let the user approve final submission', icon: MousePointerClick, links: [] },
  { provider: 'MusicBrainz', best: 'REST', use: 'Metadata, ISRC/ISWC and release reconciliation', icon: Database, links: [
    { label: 'MusicBrainz', url: 'https://musicbrainz.org/' }
  ]}
];

const TOOLS = [
  ['sound_merge_status', 'Inspect provider routes and MCP status.'],
  ['route_capability', 'Ask Sound Merge which provider/mode should handle a task.'],
  ['build_prompt_pack', 'Turn a rough idea into a production-ready song prompt + lyrics pack.'],
  ['create_music_job', 'Start Suno/Mureka generation through configured server rails.'],
  ['musicbrainz_search', 'Resolve artist, recording, release and work metadata.'],
  ['higgsfield_video_route', 'Choose Higgsfield Web, MCP or API for a visual task.'],
  ['release_readiness', 'Check masters, artwork, splits, clearance and AI-authorship notes before release.']
];

export const MCPHub: React.FC = () => {
  const endpoint = useMemo(() => typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp', []);
  const config = JSON.stringify({
    mcpServers: {
      'sound-merge': {
        url: endpoint,
        headers: {
          Authorization: 'Bearer YOUR_SOUND_MERGE_MCP_KEY'
        }
      }
    }
  }, null, 2);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: { title: 'Copied', message: 'MCP configuration copied to clipboard.', type: 'success' }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        <div className="relative z-10 grid lg:grid-cols-[1.3fr_.7fr] gap-10 items-end">
          <div>
            <div className="flex items-center gap-2 text-violet-300 text-[10px] font-black uppercase tracking-[0.24em] mb-4">
              <Bot className="w-4 h-4" /> Agent Operating Layer
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
              Sound Merge <span className="text-violet-400">MCP.</span>
            </h1>
            <p className="text-slate-400 mt-4 max-w-3xl text-base md:text-lg leading-relaxed">
              Connect ChatGPT, Grokbot, Cursor, Claude, or any MCP-capable agent to one artist operating system. The agent talks to Sound Merge; Sound Merge routes the task to the best API, MCP server, or authenticated browser workflow underneath.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-black uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" /> MCP Endpoint Built
            </div>
            <div className="font-mono text-xs text-slate-300 mt-3 break-all">{endpoint}</div>
            <p className="text-xs text-slate-500 mt-3">Set <code className="text-slate-300">SOUND_MERGE_MCP_KEY</code> server-side, then use it as the bearer credential in your agent.</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.22em]">Connect an Agent</div>
              <h2 className="text-2xl font-black text-white mt-1">Remote MCP Config</h2>
            </div>
            <button onClick={() => copy(config)} className="p-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-cyan-500/50 text-slate-300">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-[11px] leading-relaxed overflow-auto rounded-2xl bg-black/40 border border-slate-800 p-4 text-slate-300">{config}</pre>
          <p className="text-xs text-slate-500 mt-4">
            Final legal attestations, distribution submissions, registrations and irreversible actions remain approval-gated even when an agent is connected.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="text-[9px] font-black text-violet-400 uppercase tracking-[0.22em]">Current Tool Surface</div>
          <div className="mt-4 space-y-2">
            {TOOLS.map(([name, desc]) => (
              <div key={name} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="font-mono text-xs text-white">{name}</div>
                <div className="text-xs text-slate-500 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <PlugZap className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Provider Routing</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROVIDER_ROUTES.map(route => {
            const Icon = route.icon;
            return (
              <div key={route.provider} className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300">{route.best}</span>
                </div>
                <h3 className="text-white font-black mt-4">{route.provider}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{route.use}</p>
                {route.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {route.links.map(link => (
                      <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1 hover:text-white">
                        {link.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white">Routing rule</div>
          <p className="text-sm text-slate-500 mt-1">
            API when Sound Merge needs deterministic in-product behavior. MCP when an AI agent can do the work against the artist's connected account. Browser automation when the provider exposes a human portal but no verified API/MCP rail for the required action.
          </p>
        </div>
      </div>
    </div>
  );
};
