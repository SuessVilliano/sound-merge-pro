import React, { useState } from 'react';
import { ExternalLink, Globe, ChevronDown } from 'lucide-react';
import { INDUSTRY_LINKS } from '../constants';

interface IndustryLinksProps {
  categories?: string[];
  title?: string;
  defaultOpen?: boolean;
}

export const IndustryLinks: React.FC<IndustryLinksProps> = ({
  categories,
  title = 'Industry Quick Links',
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const groups = INDUSTRY_LINKS.filter(g => !categories || categories.includes(g.category));

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10"><Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
          <div className="text-left">
            <h2 className="font-black text-sm text-slate-900 dark:text-white">{title}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Every platform you need, one click away.</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          {groups.map(group => (
            <div key={group.category}>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">{group.category}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">{group.blurb}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.links.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-cyan-500/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{link.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{link.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
