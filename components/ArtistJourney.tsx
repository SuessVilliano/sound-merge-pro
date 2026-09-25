import React from 'react';
import {
  Wand2, Sliders, Video, Radio, Fingerprint, Megaphone, DollarSign,
  ArrowRight, Sparkles, Upload, Music2, CheckCircle2
} from 'lucide-react';
import { VIEWS } from '../constants';

interface ArtistJourneyProps {
  onNavigate: (view: string) => void;
}

const STEPS = [
  {
    number: '01',
    title: 'MAKE',
    subtitle: 'Write it. Record it. Build it.',
    description: 'Start from a note, voice memo, lyrics, instrumental idea, uploaded audio, or an AI-assisted prompt.',
    icon: Wand2,
    view: VIEWS.STUDIO,
    action: 'Create Music'
  },
  {
    number: '02',
    title: 'FINISH',
    subtitle: 'Stems. Mix. Master.',
    description: 'Separate or build parts, clean the production, and prepare a final master using connected audio providers.',
    icon: Sliders,
    view: VIEWS.MASTERING,
    action: 'Finish the Song'
  },
  {
    number: '03',
    title: 'VISUALIZE',
    subtitle: 'Cover. Video. Content.',
    description: 'Create the visual world around the release with Higgsfield-first video, artwork, character and campaign workflows.',
    icon: Video,
    view: VIEWS.VISUAL_STUDIO,
    action: 'Build Visuals'
  },
  {
    number: '04',
    title: 'RELEASE',
    subtitle: 'Metadata. Distribution. Stores.',
    description: 'Stage the release once, validate it, send it through the best distribution rail, and track delivery.',
    icon: Radio,
    view: VIEWS.RELEASE_RAILS,
    action: 'Prepare Release'
  },
  {
    number: '05',
    title: 'REGISTER',
    subtitle: 'Codes. Splits. Rights.',
    description: 'Keep ISRC, UPC/EAN, ISWC, IPI/CAE, writers, ownership, publishing and master identities connected.',
    icon: Fingerprint,
    view: VIEWS.CATALOG_IDENTITY,
    action: 'Protect the Catalog'
  },
  {
    number: '06',
    title: 'GROW',
    subtitle: 'Fans. Content. Shows.',
    description: 'Use AI agents, CRM, marketing, analytics, touring and audience data to keep the release moving after launch.',
    icon: Megaphone,
    view: VIEWS.CRM,
    action: 'Grow Audience'
  },
  {
    number: '07',
    title: 'COLLECT',
    subtitle: 'Royalties. Statements. Recovery.',
    description: 'Bring distributor, publishing, neighboring-rights and collection data back into one money map.',
    icon: DollarSign,
    view: VIEWS.REVENUE,
    action: 'Track the Money'
  }
];

export const ArtistJourney: React.FC<ArtistJourneyProps> = ({ onNavigate }) => {
  return (
    <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-[0.24em] mb-3">
            <Sparkles className="w-4 h-4" /> Your Artist Operating System
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            You make the music. Sound Merge carries the business.
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Start wherever you are. You do not need to understand distribution codes, royalty societies, APIs or AI models before you begin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate(VIEWS.STUDIO)} className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Music2 className="w-4 h-4" /> I Want to Make a Song
          </button>
          <button onClick={() => onNavigate(VIEWS.MY_MUSIC)} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Upload className="w-4 h-4" /> I Already Have Music
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-7 gap-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <button
              key={step.title}
              onClick={() => onNavigate(step.view)}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 hover:border-cyan-500/50 hover:-translate-y-0.5 transition-all relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-cyan-500" />
                </div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600">{step.number}</span>
              </div>
              <div className="mt-4 text-sm font-black text-slate-900 dark:text-white tracking-tight">{step.title}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mt-1">{step.subtitle}</div>
              <p className="text-[11px] leading-relaxed text-slate-500 mt-3 min-h-[66px]">{step.description}</p>
              <div className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-cyan-500 flex items-center gap-1">
                {step.action} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden xl:block absolute -right-2 top-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-slate-700" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex gap-3 items-start">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Sound Merge keeps one canonical record behind the scenes so the same artist, song, splits, identifiers, artwork, store links and money data can follow the release through the whole journey.
        </p>
      </div>
    </div>
  );
};
