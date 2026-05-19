import { Check, ExternalLink } from 'lucide-react';
import InlineText from './InlineText';

function TaskRow({ checked, colors, onToggle, task }) {
  return (
    <label
      className={`task-row ${
        checked
          ? 'border-emerald-250 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/15'
          : 'border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900'
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        onChange={onToggle}
        type="checkbox"
      />
      <span
        className={`task-check ${
          checked 
            ? colors.check 
            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}
        aria-hidden
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </span>
      <span className="min-w-0 flex-1 text-xs sm:text-sm leading-6 text-slate-750 dark:text-slate-300">
        <span className="font-black text-slate-900 dark:text-white">
          [{task.duration}] {task.kind}:{' '}
        </span>
        <span className={checked ? 'text-slate-450 dark:text-slate-500 line-through opacity-70' : ''}>
          <InlineText text={task.text} />
        </span>
      </span>
      {task.href && (
        <a
          className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold transition-all px-2 py-1 rounded-md bg-indigo-50/20 border border-indigo-100/50 dark:bg-slate-950 dark:border-slate-800 ${colors.link}`}
          href={task.href}
          onClick={(event) => event.stopPropagation()}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Open
        </a>
      )}
    </label>
  );
}

export default TaskRow;
