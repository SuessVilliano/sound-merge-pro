import React, { useMemo, useState } from 'react';
import {
  Video, ExternalLink, Bot, Code2, Sparkles, Copy, Film, Mic2, Users,
  Zap, CheckCircle2, Workflow, Wand2
} from 'lucide-react';

const MODES = [
  {
    id: 'web',
    title: 'Higgsfield Web',
    badge: 'BEST FOR PLAN VALUE',
    description: 'Use the native Higgsfield studio when the artist wants the full visual interface, existing subscription features, and plan/unlimited allowances.',
    cta: 'Open Higgsfield',
    url: 'https://higgsfield.ai',
    icon: Film
  },
  {
    id: 'mcp',
    title: 'Higgsfield MCP',
    badge: 'BEST FOR AGENTS',
    description: 'Let ChatGPT, Grokbot, Cursor or another MCP agent create images, videos, recurring characters and audio against the artist’s connected Higgsfield account.',
    cta: 'Connect Higgsfield MCP',
    url: 'https://higgsfield.ai/mcp',
    icon: Bot
  },
  {
    id: 'api',
    title: 'Higgsfield API',
    badge: 'BEST FOR IN-APP',
    description: 'Embed generation directly inside Sound Merge using a separate Higgsfield API account and dollar balance. Sound Merge can submit jobs, poll results and store finished assets.',
    cta: 'Open API Console',
    url: 'https://open.higgsfield.ai',
    icon: Code2
  }
];

const CURRENT_WORKFLOWS = [
  {
    title: 'Consistent Artist / Avatar',
    description: 'Build a reusable artist character once, then reuse that identity across covers, shorts, scenes and music videos.',
    icon: Users
  },
  {
    title: 'Music Video Scenes',
    description: 'Generate short cinematic scenes from text, image, video and audio references, then assemble a full video around the song.',
    icon: Video
  },
  {
    title: 'Lip Sync + Performance',
    description: 'Use audio reference and performance-oriented video models for mouth timing, body motion, dancing and character consistency.',
    icon: Mic2
  },
  {
    title: 'Motion Transfer',
    description: 'Use Genjutsu-style motion transfer to map real movement/performance references onto an AI character.',
    icon: Workflow
  }
];

export const VisualStudio: React.FC = () => {
  const [goal, setGoal] = useState('');
  const agentBrief = useMemo(() => {
    const subject = goal.trim() || 'Create a polished music video for my current release.';
    return [
      'SOUND MERGE → HIGGSFIELD VIDEO BRIEF',
      '',
      subject,
      '',
      'Priorities:',
      '- consistent artist identity across scenes',
      '- use the finished song/audio as timing reference where supported',
      '- natural body motion and performance',
      '- clean cinematic continuity; no repeated/sloppy filler shots',
      '- 5–10 second shots unless a longer story beat requires more',
      '- preserve wardrobe/character traits across cuts',
      '- render final clips for assembly inside Sound Merge',
      '',
      'Choose the strongest current Higgsfield model for this exact task rather than hardcoding an old model.'
    ].join('\n');
  }, [goal]);

  const copyBrief = async () => {
    await navigator.clipboard.writeText(agentBrief);
    window.dispatchEvent(new CustomEvent('sf-notification', {
      detail: { title: 'Higgsfield Brief Copied', message: 'Paste it into the Higgsfield MCP agent or Grokbot workflow.', type: 'success' }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-fuchsia-300 text-[10px] font-black uppercase tracking-[0.24em] mb-4">
            <Sparkles className="w-4 h-4" /> Official Visual Partner Rail
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
            Visual <span className="text-fuchsia-400">Studio.</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-3xl text-base md:text-lg leading-relaxed">
            Higgsfield is the default Sound Merge visual engine. Use Web when the artist wants the native studio, MCP when an agent is directing the work, and the API when Sound Merge needs generation embedded directly inside the product.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {MODES.map(mode => {
          const Icon = mode.icon;
          return (
            <div key={mode.id} className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-fuchsia-300" />
                </div>
                <span className="text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">{mode.badge}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-5">{mode.title}</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed flex-1">{mode.description}</p>
              <a href={mode.url} target="_blank" rel="noreferrer" className="mt-6 w-full py-3 rounded-xl bg-white text-slate-950 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-cyan-300 transition-colors">
                {mode.cta} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-6">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400">What Sound Merge should use it for</div>
          <div className="mt-5 space-y-3">
            {CURRENT_WORKFLOWS.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{item.title}</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
          <div className="flex items-center gap-2 text-violet-300 text-[9px] font-black uppercase tracking-[0.22em]">
            <Bot className="w-4 h-4" /> Agent Director
          </div>
          <h2 className="text-2xl font-black text-white mt-2">Build the visual brief here. Execute in Higgsfield.</h2>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="Example: I want a 60-second Invisible Hands video with my consistent AI avatar, Tesla scenes, lip sync, dancing and visible AI hands doing tasks around me..."
            className="mt-5 w-full min-h-[150px] rounded-2xl border border-slate-800 bg-slate-900 text-white p-4 text-sm outline-none focus:border-fuchsia-500/50"
          />
          <div className="mt-4 rounded-2xl border border-slate-800 bg-black/30 p-4">
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-400">{agentBrief}</pre>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={copyBrief} className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Copy className="w-4 h-4" /> Copy Agent Brief
            </button>
            <a href="https://higgsfield.ai/mcp" target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Bot className="w-4 h-4" /> MCP Setup
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white">Cost-aware routing</div>
          <p className="text-sm text-slate-500 mt-1">
            Use Higgsfield Web when an artist already has useful plan/unlimited access; MCP when an agent should drive the artist’s existing account; API when Sound Merge itself needs to generate and persist media programmatically.
          </p>
        </div>
      </div>
    </div>
  );
};
