import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
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

  const stateRef = useRef(state);
  const cloudBootstrappedUidRef = useRef(null);

  const checkedSet = useMemo(
    () => new Set(state.checkedTaskIds),
    [state.checkedTaskIds],
  );

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
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-brand-bg pb-28 text-brand-secondary">
      <header className="bg-brand-primary px-6 py-12 text-white shadow-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase text-brand-accent">
              {roadmap.commitment}
            </p>
            <img src={logo} alt="My Cloud Sprint Logo" className="mb-4 h-28 w-auto object-contain sm:h-36" />
            <p className="mt-4 max-w-2xl text-lg font-medium text-brand-bg opacity-90">
              {roadmap.subtitle}
            </p>
          </div>
          <div className="w-full max-w-sm border border-brand-accent/30 bg-brand-secondary/40 p-5 md:w-80 rounded-lg shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-brand-accent">
                  Progress
                </p>
                <p className="mt-1 text-4xl font-black">
                  {summary.percentage}%
                </p>
              </div>
              <Gauge className="h-10 w-10 text-emerald-300" aria-hidden />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded bg-brand-secondary">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${summary.percentage}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-brand-bg opacity-90">
              {summary.completedTaskCount} of {summary.totalTaskCount} tasks
              checked
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
              <p className="mt-2 text-sm leading-6 text-slate-600">
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
        />

        <section className="mt-10 space-y-7">
          {roadmap.phases.map((phase) => (
            <PhaseSection
              checkedSet={checkedSet}
              key={phase.id}
              onToggleTask={toggleTask}
              phase={phase}
            />
          ))}
        </section>
      </main>

      <ProgressFooter summary={summary} />
    </div>
  );
}

export default App;
