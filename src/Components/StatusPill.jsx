import { createElement } from 'react';

function StatusPill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
      {createElement(icon, { className: 'h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400', 'aria-hidden': true })}
      {label}
    </span>
  );
}

export default StatusPill;
