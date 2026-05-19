import { ExternalLink } from 'lucide-react';

function ResourceLine({ resources }) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold text-slate-550 dark:text-slate-400">
      <span className="uppercase tracking-wider font-black text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
        Curated Study:
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {resources.map((resource) => (
          <a
            key={resource.href}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/40 border border-indigo-100/60 text-indigo-650 hover:text-indigo-950 dark:bg-slate-950 dark:border-slate-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-sm"
            href={resource.href}
            rel="noreferrer"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{resource.label}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default ResourceLine;
