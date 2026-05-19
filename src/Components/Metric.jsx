import { createElement } from 'react';

function Metric({ icon, label, value }) {
  return (
    <div className="border border-slate-250 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:scale-[1.02] flex flex-col justify-between">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650 dark:bg-indigo-950/30 dark:border-indigo-900/60 dark:text-indigo-400 mb-4 transition-transform group-hover:scale-110">
          {createElement(icon, {
            className: 'h-5 w-5',
            'aria-hidden': true,
          })}
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">
          {label}
        </p>
      </div>
      <p 
        className="mt-2 truncate text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white" 
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export default Metric;
