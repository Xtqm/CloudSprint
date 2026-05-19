import { ChevronDown } from 'lucide-react';
import DayBox from './DayBox';
import ResourceLine from './ResourceLine';

function WeekPanel({ checkedSet, colors, onToggleTask, week, notes }) {
  return (
    <details className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200" open={week.defaultOpen}>
      <summary
        className={`flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors ${
          week.featured 
            ? colors.pale + ' bg-indigo-50/20 dark:bg-indigo-950/10' 
            : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-900/60'
        }`}
      >
        <span className="font-extrabold text-sm sm:text-base text-slate-850 dark:text-slate-200">
          {week.title}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className={`grid gap-4 p-4 border-t border-slate-100 dark:border-slate-850 ${
        week.featured ? colors.pale + ' bg-indigo-50/10 dark:bg-indigo-950/5' : 'bg-white dark:bg-slate-900'
      }`}>
        {week.intro && (
          <p className="text-xs sm:text-sm font-semibold italic text-slate-550 dark:text-slate-400">
            {week.intro}
          </p>
        )}
        {week.resources && <ResourceLine resources={week.resources} />}
        {week.days.map((day) => (
          <DayBox
            checkedSet={checkedSet}
            colors={colors}
            day={day}
            key={day.id}
            onToggleTask={onToggleTask}
            notes={notes}
          />
        ))}
      </div>
    </details>
  );
}

export default WeekPanel;
