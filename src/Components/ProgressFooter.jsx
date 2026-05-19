import { roadmap } from '../data/roadmap';

function ProgressFooter({ summary }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-6 transition-all duration-300">
      <div className="border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl text-slate-800 dark:text-white transition-colors duration-200">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Certification: {roadmap.target}
          </span>
          <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-emerald-400">
            {summary.percentage}%
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 dark:bg-emerald-450 transition-all duration-500 rounded-full"
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressFooter;
