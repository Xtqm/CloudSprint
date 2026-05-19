import { NotebookPen } from 'lucide-react';
import TaskRow from './TaskRow';

function DayBox({ checkedSet, colors, day, onToggleTask, notes }) {
  const completed = day.tasks.every((task) => checkedSet.has(task.id));
  const completedCount = day.tasks.filter((task) => checkedSet.has(task.id)).length;
  const activeNote = notes?.[day.id];

  return (
    <article
      className={`day-box rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all shadow-sm ${
        completed 
          ? `day-box-complete bg-emerald-50/20 dark:bg-emerald-950/10 border-l-emerald-500` 
          : 'bg-white dark:bg-slate-900 border-l-slate-300 dark:border-l-slate-700'
      } ${activeNote ? 'border-l-indigo-500 dark:border-l-indigo-500 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5' : ''}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm sm:text-base font-extrabold ${
                completed ? 'text-slate-450 line-through opacity-75' : colors.text
              }`}
            >
              {day.title}
            </h3>
            
            {/* Note indicator badge */}
            {activeNote && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-150 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/60 dark:text-indigo-400">
                <NotebookPen className="h-3 w-3" />
                <span>Study Note</span>
              </span>
            )}
          </div>
          
          {day.note && (
            <p className="mt-1.5 text-xs sm:text-sm italic text-slate-500 dark:text-slate-400">
              {day.note}
            </p>
          )}
        </div>
        
        <span
          className={`w-fit border px-2.5 py-1 text-xs font-black rounded-lg shrink-0 ${
            completed 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400' 
              : 'border-slate-200 bg-slate-50 text-slate-655 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
          }`}
        >
          {completedCount}/{day.tasks.length}
        </span>
      </div>

      {/* In-context Note Display */}
      {activeNote && (
        <div className="mt-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/15 dark:border-slate-800 dark:bg-slate-950/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs mb-1.5">
            <NotebookPen className="h-3.5 w-3.5" />
            <span>Study Note Summary</span>
          </div>
          <p className="italic leading-relaxed whitespace-pre-wrap font-semibold break-words bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-850">
            {activeNote}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {day.tasks.map((task) => (
          <TaskRow
            checked={checkedSet.has(task.id)}
            colors={colors}
            key={task.id}
            onToggle={() => onToggleTask(task.id)}
            task={task}
          />
        ))}
      </div>
    </article>
  );
}

export default DayBox;
