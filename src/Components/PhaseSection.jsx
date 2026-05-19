import { colorClasses } from './constants';
import ResourceLine from './ResourceLine';
import WeekPanel from './WeekPanel';

function PhaseSection({ checkedSet, onToggleTask, phase, notes }) {
  const colors = colorClasses[phase.color];

  return (
    <section className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl transition-colors duration-200">
      <div
        className={`${colors.header} flex flex-col gap-4 p-6 text-white md:flex-row md:items-center md:justify-between`}
      >
        <div>
          <p className={`text-sm sm:text-base font-bold italic tracking-wide ${colors.accentText}`}>
            {phase.label}
          </p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">{phase.title}</h2>
        </div>
        <span className="w-fit border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg shadow-inner">
          {phase.range}
        </span>
      </div>
      <div className="space-y-4 p-5 bg-white dark:bg-slate-900">
        {phase.resources && <ResourceLine resources={phase.resources} />}
        {phase.weeks.map((week) => (
          <WeekPanel
            checkedSet={checkedSet}
            colors={colors}
            key={week.id}
            onToggleTask={onToggleTask}
            week={week}
            notes={notes}
          />
        ))}
      </div>
    </section>
  );
}

export default PhaseSection;
