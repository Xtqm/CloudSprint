import { CheckCircle2, RotateCcw } from 'lucide-react';

function ActivityList({ activity }) {
  return (
    <div className="border border-slate-250 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 p-5 rounded-2xl shadow-sm flex flex-col">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-550 mb-4">
        Recent Learning Activity
      </h3>
      <div className="space-y-4 flex-grow max-h-72 overflow-y-auto pr-1">
        {activity.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 italic p-3 bg-white dark:bg-slate-900/50 rounded-xl">
            No study progress logged on this session. Complete a task to see feed events!
          </p>
        ) : (
          activity.slice(0, 8).map((event) => (
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm" key={event.id}>
              <div className="mt-0.5 shrink-0">
                {event.completed ? (
                  <CheckCircle2
                    className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <RotateCcw className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-grow">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-205 leading-snug">
                  {event.taskTitle}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                  <span className="truncate max-w-xs">{event.dayTitle}</span>
                  <span className="shrink-0 text-slate-450 dark:text-slate-500">
                    {new Date(event.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityList;
