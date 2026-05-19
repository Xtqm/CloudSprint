import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Sun, Moon } from 'lucide-react';
import { firebaseReady, loadFirebase, getFirebaseSync } from './firebase';
import {
  ROADMAP_ID,
  flattenDays,
  flattenTasks,
  roadmap,
  strategyCards,
} from './data/roadmap';
import { strategyColorClasses } from './Components/constants';
import {
  loadLocalState,
  saveLocalState,
  loadCloudState,
  saveCloudState,
  mergeAppState,
  makeActivityEvent,
  normalizeState,
} from './Components/stateUtils';
import Dashboard from './Components/Dashboard';
import PhaseSection from './Components/PhaseSection';
import ProgressFooter from './Components/ProgressFooter';
import logo from './assets/logo.png';

function App() {
  const allTasks = useMemo(() => flattenTasks(roadmap), []);
  const allDays = useMemo(() => flattenDays(roadmap), []);
  const taskById = useMemo(
    () => new Map(allTasks.map((task) => [task.id, task])),
    [allTasks],
  );

  const [state, setState] = useState(loadLocalState);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(
    firebaseReady ? 'Ready' : 'Firebase config needed',
  );
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [activeNoteDayId, setActiveNoteDayId] = useState(allDays[0]?.id || '');
  
  // Theme and UI layout states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Visual focused navigation
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const hasBootstrappedNavigationRef = useRef(false);

  const stateRef = useRef(state);
  const cloudBootstrappedUidRef = useRef(null);

  const checkedSet = useMemo(
    () => new Set(state.checkedTaskIds),
    [state.checkedTaskIds],
  );

  // Auto-resume trigger
  useEffect(() => {
    if (!hasBootstrappedNavigationRef.current && roadmap && roadmap.phases && checkedSet.size >= 0) {
      let foundWeek = null;
      let foundPhase = null;
      
      for (const phase of roadmap.phases) {
        for (const week of phase.weeks) {
          const hasIncomplete = week.days.some(day => 
            day.tasks.some(task => !checkedSet.has(task.id))
          );
          if (hasIncomplete) {
            foundWeek = week;
            foundPhase = phase;
            break;
          }
        }
        if (foundWeek) break;
      }
      
      const activePhase = foundPhase || roadmap.phases[0];
      const activeWeek = foundWeek || activePhase?.weeks[0];
      
      if (activePhase) setSelectedPhaseId(activePhase.id);
      if (activeWeek) setSelectedWeekId(activeWeek.id);
      
      hasBootstrappedNavigationRef.current = true;
    }
  }, [roadmap, checkedSet]);

  const selectedPhase = useMemo(() => {
    return roadmap.phases.find(p => p.id === selectedPhaseId) || roadmap.phases[0];
  }, [roadmap.phases, selectedPhaseId]);

  const selectedWeek = useMemo(() => {
    if (!selectedPhase) return null;
    return selectedPhase.weeks.find(w => w.id === selectedWeekId) || selectedPhase.weeks[0];
  }, [selectedPhase, selectedWeekId]);

  const activeWeekLinks = useMemo(() => {
    if (!selectedWeek) return [];
    const links = [];
    
    if (selectedWeek.resources) {
      selectedWeek.resources.forEach(r => {
        links.push({
          label: r.label,
          href: r.href,
          source: 'Week Resources',
          type: 'Resource'
        });
      });
    }
    
    selectedWeek.days.forEach(day => {
      if (day.note) {
        const matches = day.note.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of matches) {
          links.push({
            label: match[1],
            href: match[2],
            source: day.title,
            type: 'Note Link'
          });
        }
      }
      
      day.tasks.forEach(task => {
        if (task.href) {
          links.push({
            label: `[${task.kind}] ${task.text.substring(0, 40)}...`,
            href: task.href,
            source: day.title,
            type: task.kind
          });
        }
        
        const matches = task.text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of matches) {
          links.push({
            label: match[1],
            href: match[2],
            source: day.title,
            type: 'Task Link'
          });
        }
      });
    });
    
    const seen = new Set();
    return links.filter(link => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });
  }, [selectedWeek]);

  const summary = useMemo(() => {
    const completedTaskCount = allTasks.filter((task) =>
      checkedSet.has(task.id),
    ).length;
    const completedDays = allDays.filter((day) =>
      day.tasks.every((task) => checkedSet.has(task.id)),
    );
    const currentTask = allTasks.find((task) => !checkedSet.has(task.id));
    const percentage =
      allTasks.length === 0
        ? 0
        : Math.round((completedTaskCount / allTasks.length) * 100);

    return {
      completedTaskCount,
      completedDayCount: completedDays.length,
      totalTaskCount: allTasks.length,
      totalDayCount: allDays.length,
      percentage,
      currentTask,
    };
  }, [allDays, allTasks, checkedSet]);

  // --- Cloud bootstrap ---

  const bootstrapCloud = useCallback(
    async (signedInUser, localSnapshot) => {
      if (!signedInUser || !firebaseReady) {
        return;
      }

      if (localSnapshot.settings.localOnly) {
        setCloudReady(false);
        setCloudStatus('Local only');
        return;
      }

      if (cloudBootstrappedUidRef.current === signedInUser.uid) {
        return;
      }

      cloudBootstrappedUidRef.current = signedInUser.uid;
      setCloudStatus('Loading cloud progress');

      try {
        const { db } = getFirebaseSync();
        const cloudState = await loadCloudState(signedInUser, db);
        const mergedState = mergeAppState(localSnapshot, cloudState);
        setState(mergedState);
        setCloudReady(true);
        setCloudStatus('Synced');
      } catch (error) {
        cloudBootstrappedUidRef.current = null;
        setCloudReady(false);
        setCloudStatus(error.message || 'Cloud sync failed');
      }
    },
    [],
  );

  // --- Effects ---

  useEffect(() => {
    stateRef.current = state;
    saveLocalState(state);
  }, [state]);

  // Lazily load Firebase and listen for auth state.
  useEffect(() => {
    if (!firebaseReady) {
      setAuthLoading(false);
      return;
    }

    let unsubscribe = null;

    loadFirebase().then(({ auth: fbAuth }) => {
      if (!fbAuth) {
        setAuthLoading(false);
        return;
      }

      // Dynamic import for auth helpers.
      import('firebase/auth').then(
        ({ onAuthStateChanged, getRedirectResult }) => {
          // Detect sign-in from a redirect flow (Bug #1 fix).
          getRedirectResult(fbAuth).catch(() => {});

          unsubscribe = onAuthStateChanged(fbAuth, async (nextUser) => {
            setUser(nextUser);
            setAuthLoading(false);

            if (!nextUser) {
              cloudBootstrappedUidRef.current = null;
              setCloudReady(false);
              setCloudStatus('Signed out');
              return;
            }

            await bootstrapCloud(nextUser, stateRef.current);
          });
        },
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [bootstrapCloud]);

  useEffect(() => {
    if (user && !state.settings.localOnly && !cloudReady) {
      bootstrapCloud(user, stateRef.current);
    }

    if (state.settings.localOnly) {
      setCloudReady(false);
      setCloudStatus('Local only');
    }
  }, [bootstrapCloud, cloudReady, state.settings.localOnly, user]);

  useEffect(() => {
    if (!user || !firebaseReady || !cloudReady || state.settings.localOnly) {
      return;
    }

    setCloudStatus('Saving');
    const timeoutId = window.setTimeout(async () => {
      try {
        const { db } = getFirebaseSync();
        await saveCloudState(user, state, summary, db);
        setLastSyncedAt(new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }));
        setCloudStatus('Synced');
      } catch (error) {
        setCloudStatus(error.message || 'Cloud sync failed');
      }
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [cloudReady, state, summary, user]);

  // --- Handlers ---

  const handleGoogleSignIn = async () => {
    if (!firebaseReady) {
      setCloudStatus('Firebase config needed');
      return;
    }

    try {
      setCloudStatus('Loading…');
      const { auth: fbAuth, googleProvider: provider } = await loadFirebase();

      if (!fbAuth || !provider) {
        setCloudStatus('Firebase config needed');
        return;
      }

      const { signInWithPopup } = await import(
        'firebase/auth'
      );

      setCloudStatus('Opening Google');
      await signInWithPopup(fbAuth, provider);
    } catch (error) {
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        const { auth: fbAuth, googleProvider: provider } = getFirebaseSync();
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(fbAuth, provider);
        return;
      }

      setCloudStatus(error.message || 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    const { auth: fbAuth } = getFirebaseSync();
    if (!fbAuth) {
      return;
    }

    try {
      const { signOut } = await import('firebase/auth');
      await signOut(fbAuth);
    } catch (error) {
      setCloudStatus(error.message || 'Sign out failed');
    }
  };

  const toggleTask = (taskId) => {
    const task = taskById.get(taskId);

    setState((current) => {
      const currentSet = new Set(current.checkedTaskIds);
      const completed = !currentSet.has(taskId);

      if (completed) {
        currentSet.add(taskId);
      } else {
        currentSet.delete(taskId);
      }

      const event = task ? makeActivityEvent(task, completed) : null;

      return normalizeState({
        ...current,
        checkedTaskIds: [...currentSet],
        activity: event
          ? [event, ...current.activity].slice(0, 50)
          : current.activity,
      });
    });
  };

  const updateNote = (dayId, text) => {
    setState((current) =>
      normalizeState({
        ...current,
        notes: {
          ...current.notes,
          [dayId]: text,
        },
      }),
    );
  };

  const updateGoal = (key, value) => {
    setState((current) =>
      normalizeState({
        ...current,
        goals: {
          ...current.goals,
          [key]: value,
        },
      }),
    );
  };

  const updateLocalOnly = (localOnly) => {
    if (!localOnly) {
      cloudBootstrappedUidRef.current = null;
    }

    setState((current) =>
      normalizeState({
        ...current,
        settings: {
          ...current.settings,
          localOnly,
        },
      }),
    );
  };

  const resetLocalProgress = () => {
    const confirmed = window.confirm(
      'Reset checked tasks, notes, and activity for this device?',
    );

    if (!confirmed) {
      return;
    }

    setState((current) =>
      normalizeState({
        ...current,
        checkedTaskIds: [],
        notes: {},
        activity: [],
      }),
    );
  };  // --- Render ---

  const singleWeekPhase = useMemo(() => {
    if (!selectedPhase || !selectedWeek) return null;
    return {
      ...selectedPhase,
      weeks: [selectedWeek]
    };
  }, [selectedPhase, selectedWeek]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Utility Nav */}
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-6 py-2.5 transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-500 dark:text-slate-455 uppercase">
            Cloud Architect Career Portal
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-805 dark:hover:bg-slate-750 transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </div>

      <header className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 px-6 py-12 text-white shadow-xl transition-colors">
        {/* Glow decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white/5 p-4 shadow-xl border border-white/10 dark:bg-slate-900/60 dark:border-slate-800/80 h-28 w-28 sm:h-36 sm:w-36">
              <img 
                src={logo} 
                alt="My Cloud Sprint Logo" 
                className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]" 
              />
            </div>
            <div>
              <p className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-400">
                {roadmap.commitment}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Cloud Architecture Sprint
              </h1>
              <p className="mt-3 max-w-xl text-sm sm:text-base font-medium text-slate-300 opacity-90 leading-relaxed">
                {roadmap.subtitle}
              </p>
            </div>
          </div>
          
          <div className="w-full max-w-sm border border-slate-700/50 bg-slate-800/40 p-5 md:w-80 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Global Progress
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight">
                  {summary.percentage}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Gauge className="h-6 w-6" aria-hidden />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${summary.percentage}%` }}
              />
            </div>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 font-bold">
              {summary.completedTaskCount} of {summary.totalTaskCount} Tasks Checked
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="-mt-7 grid gap-4 md:grid-cols-3">
          {strategyCards.map((card) => (
            <article
              className={`glass border-t-4 p-5 shadow-lg ${strategyColorClasses[card.accent]}`}
              key={card.id}
            >
              <h2 className="text-base font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-650 dark:text-slate-300">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        <Dashboard
          activeNoteDayId={activeNoteDayId}
          allDays={allDays}
          authLoading={authLoading}
          cloudStatus={cloudStatus}
          firebaseReady={firebaseReady}
          lastSyncedAt={lastSyncedAt}
          onGoalChange={updateGoal}
          onLocalOnlyChange={updateLocalOnly}
          onNoteChange={updateNote}
          onResetLocalProgress={resetLocalProgress}
          onSelectNoteDay={setActiveNoteDayId}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          state={state}
          summary={summary}
          user={user}
          activeWeekLinks={activeWeekLinks}
          onJumpToWeek={(weekId, phaseId) => {
            setSelectedWeekId(weekId);
            setSelectedPhaseId(phaseId);
            setShowAllWeeks(false);
          }}
          checkedTaskIds={state.checkedTaskIds}
          onToggleTask={toggleTask}
          theme={theme}
        />

        {/* Focused Learning Board Section */}
        <section className="mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Curriculum Learning Board
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Phase-by-phase dynamic curriculum path optimized for cloud learning.
              </p>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={() => setShowAllWeeks(!showAllWeeks)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  showAllWeeks
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                    : 'bg-white border-slate-205 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                type="button"
              >
                {showAllWeeks ? "Focused Active View" : "Browse All 30 Weeks"}
              </button>
            </div>
          </div>

          {/* Phase Cards */}
          <div className="mb-6">
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Curriculum Phase Selection
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {roadmap.phases.map((phase) => {
                const isSelected = selectedPhaseId === phase.id;
                const phaseTasks = phase.weeks.flatMap(w => w.days.flatMap(d => d.tasks));
                const phaseCompletedCount = phaseTasks.filter(t => checkedSet.has(t.id)).length;
                const phasePercentage = phaseTasks.length === 0 ? 0 : Math.round((phaseCompletedCount / phaseTasks.length) * 100);
                
                return (
                  <button
                    key={phase.id}
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      setSelectedWeekId(phase.weeks[0]?.id || '');
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                    type="button"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {phase.label}
                    </span>
                    <span className="mt-1 font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {phase.title}
                    </span>
                    <span className="mt-1 text-[11px] font-bold text-slate-450 dark:text-slate-400">
                      {phase.range}
                    </span>
                    
                    {/* Miniature progress bar */}
                    <div className="mt-3 w-full">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">
                        <span>COMPLETED</span>
                        <span>{phasePercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${phasePercentage}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week Selector Deck (shown only in Focused mode) */}
          {!showAllWeeks && selectedPhase && (
            <div className="mb-6 border-t border-slate-100 dark:border-slate-800 pt-6 transition-all duration-200">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Select Curriculum Week
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedPhase.weeks.map((week) => {
                  const isSelected = selectedWeekId === week.id;
                  const weekTasks = week.days.flatMap(d => d.tasks);
                  const weekCompletedCount = weekTasks.filter(t => checkedSet.has(t.id)).length;
                  const isWeekCompleted = weekTasks.length > 0 && weekCompletedCount === weekTasks.length;
                  
                  return (
                    <button
                      key={week.id}
                      onClick={() => setSelectedWeekId(week.id)}
                      className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                        isSelected
                          ? 'bg-slate-950 text-white border-slate-950 dark:bg-indigo-600 dark:text-white dark:border-indigo-600 shadow-md'
                          : isWeekCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/60'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                      type="button"
                    >
                      <span>{week.title.split(':')[0]}</span>
                      <span className="text-[10px] opacity-75 font-bold">
                        ({weekCompletedCount}/{weekTasks.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Weeks Render */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 transition-all">
            {showAllWeeks ? (
              <div className="space-y-10">
                {roadmap.phases.map((phase) => (
                  <PhaseSection
                    checkedSet={checkedSet}
                    key={phase.id}
                    onToggleTask={toggleTask}
                    phase={phase}
                    notes={state.notes}
                  />
                ))}
              </div>
            ) : (
              singleWeekPhase && (
                <PhaseSection
                  checkedSet={checkedSet}
                  key={singleWeekPhase.id}
                  onToggleTask={toggleTask}
                  phase={singleWeekPhase}
                  notes={state.notes}
                />
              )
            )}
          </div>
        </section>
      </main>

      <ProgressFooter summary={summary} />
    </div>
  );
}

export default App;
