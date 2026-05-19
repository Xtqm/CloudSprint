/** Maximum notes + activity events to write per batch (Firestore limit is 500). */
export const MAX_BATCH_NOTES = 200;
export const MAX_BATCH_ACTIVITY = 25;

export const LOCAL_STATE_KEY = 'career-tracker-state-v1';

export const DEFAULT_GOALS = {
  targetRole: 'Cloud Support Associate',
  certificationDate: '',
  dailyStudyGoal: '60',
};

export const DEFAULT_SETTINGS = {
  localOnly: false,
};

export const EMPTY_APP_STATE = {
  checkedTaskIds: [],
  notes: {},
  goals: DEFAULT_GOALS,
  settings: DEFAULT_SETTINGS,
  activity: [],
  updatedAt: null,
};

export const colorClasses = {
  indigo: {
    header: 'bg-slate-900',
    accentText: 'text-indigo-300',
    border: 'border-indigo-500 dark:border-indigo-600',
    pale: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    text: 'text-indigo-900 dark:text-indigo-200',
    link: 'text-indigo-750 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300',
    check: 'border-indigo-500 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-500',
  },
  emerald: {
    header: 'bg-emerald-950',
    accentText: 'text-emerald-300',
    border: 'border-emerald-500 dark:border-emerald-800',
    pale: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    text: 'text-emerald-900 dark:text-emerald-200',
    link: 'text-emerald-750 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300',
    check: 'border-emerald-500 bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-500',
  },
  orange: {
    header: 'bg-orange-950',
    accentText: 'text-orange-300',
    border: 'border-orange-500 dark:border-orange-800',
    pale: 'bg-orange-50/70 dark:bg-orange-950/20',
    text: 'text-orange-900 dark:text-orange-200',
    link: 'text-orange-705 hover:text-orange-900 dark:text-orange-400 dark:hover:text-indigo-300',
    check: 'border-orange-500 bg-orange-600 dark:border-orange-400 dark:bg-orange-500',
  },
  red: {
    header: 'bg-red-950',
    accentText: 'text-red-300',
    border: 'border-red-500 dark:border-red-800',
    pale: 'bg-red-50/70 dark:bg-red-950/20',
    text: 'text-red-900 dark:text-red-200',
    link: 'text-red-750 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300',
    check: 'border-red-500 bg-red-600 dark:border-red-400 dark:bg-red-500',
  },
  violet: {
    header: 'bg-violet-950',
    accentText: 'text-violet-300',
    border: 'border-violet-500 dark:border-violet-800',
    pale: 'bg-violet-50/70 dark:bg-violet-950/20',
    text: 'text-violet-900 dark:text-violet-200',
    link: 'text-violet-750 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300',
    check: 'border-violet-500 bg-violet-600 dark:border-violet-400 dark:bg-violet-500',
  },
  amber: {
    header: 'bg-amber-950',
    accentText: 'text-amber-300',
    border: 'border-amber-500 dark:border-amber-800',
    pale: 'bg-amber-50/70 dark:bg-amber-900/20',
    text: 'text-amber-900 dark:text-amber-200',
    link: 'text-amber-750 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300',
    check: 'border-amber-500 bg-amber-600 dark:border-amber-400 dark:bg-amber-500',
  },
  gold: {
    header: 'bg-yellow-950',
    accentText: 'text-yellow-300',
    border: 'border-yellow-500 dark:border-yellow-800',
    pale: 'bg-yellow-50/70 dark:bg-yellow-950/20',
    text: 'text-yellow-900 dark:text-yellow-200',
    link: 'text-yellow-750 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300',
    check: 'border-yellow-500 bg-yellow-600 dark:border-yellow-400 dark:bg-yellow-500',
  },
};

export const strategyColorClasses = {
  indigo: 'border-indigo-500 text-indigo-700 dark:border-indigo-600 dark:text-indigo-400',
  emerald: 'border-emerald-500 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400',
  orange: 'border-orange-500 text-orange-700 dark:border-orange-600 dark:text-orange-400',
  violet: 'border-violet-500 text-violet-700 dark:border-violet-600 dark:text-violet-400',
  amber: 'border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-400',
  gold: 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400',
};
