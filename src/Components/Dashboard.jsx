import { createElement, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Gauge,
  LogIn,
  LogOut,
  NotebookPen,
  Save,
  Settings,
  Target,
  Trash2,
  User,
  Search,
  Copy,
  Download,
  ExternalLink,
  Link,
  FileText,
  Check,
} from 'lucide-react';
import { firebaseReady } from '../firebase';
import ActivityList from './ActivityList';
import Metric from './Metric';
import StatusPill from './StatusPill';
import InlineText from './InlineText';

function Dashboard({
  activeNoteDayId,
  allDays,
  authLoading,
  cloudStatus,
  lastSyncedAt,
  onGoalChange,
  onLocalOnlyChange,
  onNoteChange,
  onResetLocalProgress,
  onSelectNoteDay,
  onSignIn,
  onSignOut,
  state,
  summary,
  user,
  activeWeekLinks = [],
  onJumpToWeek,
  checkedTaskIds = [],
  onToggleTask,
  theme,
}) {
  const [activePanel, setActivePanel] = useState('overview');
  const activeNoteDay = allDays.find((day) => day.id === activeNoteDayId);
  const syncIcon = state.settings.localOnly || !firebaseReady ? CloudOff : Cloud;

  // Search & Filter local states
  const [notesSearch, setNotesSearch] = useState('');
  const [notesCopyStatus, setNotesCopyStatus] = useState(false);
  const [linksSearch, setLinksSearch] = useState('');
  const [linksFilter, setLinksFilter] = useState('all');
  const [tasksSearch, setTasksSearch] = useState('');

  // 1. Advanced Notes - Filtered List of Days with Notes
  const daysWithNotes = useMemo(() => {
    return allDays.filter(day => {
      const noteText = state.notes[day.id];
      return typeof noteText === 'string' && noteText.trim().length > 0;
    });
  }, [allDays, state.notes]);

  const filteredDays = useMemo(() => {
    return allDays.filter(day => {
      const matchesSearch = 
        day.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
        day.weekTitle.toLowerCase().includes(notesSearch.toLowerCase()) ||
        (state.notes[day.id] || '').toLowerCase().includes(notesSearch.toLowerCase());
      return matchesSearch;
    });
  }, [allDays, notesSearch, state.notes]);

  // Handle Note actions
  const handleCopyNote = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setNotesCopyStatus(true);
    setTimeout(() => setNotesCopyStatus(false), 2000);
  };

  const handleDownloadNote = (dayId, noteText) => {
    if (!noteText) return;
    const day = allDays.find(d => d.id === dayId);
    const title = day ? `${day.weekTitle} - ${day.title}` : 'Curriculum Note';
    const blob = new Blob([`# ${title}\n\n${noteText}`], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dayId}-notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Link Hub - Filtered Links for Active Week
  const filteredLinks = useMemo(() => {
    return activeWeekLinks.filter(link => {
      const matchesSearch = 
        link.label.toLowerCase().includes(linksSearch.toLowerCase()) ||
        link.href.toLowerCase().includes(linksSearch.toLowerCase()) ||
        link.source.toLowerCase().includes(linksSearch.toLowerCase());
      
      const matchesFilter = 
        linksFilter === 'all' || 
        link.type.toLowerCase().includes(linksFilter.toLowerCase());
        
      return matchesSearch && matchesFilter;
    });
  }, [activeWeekLinks, linksSearch, linksFilter]);

  // 3. Task Finder - Curriculum wide search
  const foundTasks = useMemo(() => {
    if (!tasksSearch.trim()) return [];
    
    const results = [];
    allDays.forEach(day => {
      day.tasks.forEach(task => {
        const matchesSearch = 
          task.text.toLowerCase().includes(tasksSearch.toLowerCase()) ||
          task.kind.toLowerCase().includes(tasksSearch.toLowerCase()) ||
          day.title.toLowerCase().includes(tasksSearch.toLowerCase()) ||
          day.weekTitle.toLowerCase().includes(tasksSearch.toLowerCase());
        
        if (matchesSearch) {
          results.push({
            ...task,
            dayId: day.id,
            dayTitle: day.title,
            weekTitle: day.weekTitle,
            phaseId: day.phaseId,
          });
        }
      });
    });
    return results;
  }, [allDays, tasksSearch]);

  // Custom Markdown renderer for premium Technical Runbook preview
  const renderMarkdown = (text) => {
    if (!text) {
      return (
        <p className="text-slate-400 dark:text-slate-500 italic text-xs sm:text-sm">
          No note content recorded yet. Type standard Markdown in the editor to format study summaries.
        </p>
      );
    }
    
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words font-medium">
        {lines.map((line, idx) => {
          const cleanLine = line.trim();
          
          if (cleanLine.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50 mt-4 mb-1">
                {cleanLine.substring(4)}
              </h4>
            );
          }
          if (cleanLine.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-sm sm:text-base font-extrabold text-slate-955 dark:text-white mt-5 mb-2">
                {cleanLine.substring(3)}
              </h3>
            );
          }
          if (cleanLine.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-base sm:text-lg font-black text-slate-950 dark:text-white mt-6 mb-3">
                {cleanLine.substring(2)}
              </h2>
            );
          }
          
          if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
            const content = cleanLine.substring(2);
            return (
              <ul key={idx} className="list-disc pl-5 my-1">
                <li>{parseInlineElements(content)}</li>
              </ul>
            );
          }
          
          if (cleanLine === '') {
            return <div key={idx} className="h-1.5" />;
          }
          
          return <p key={idx}>{parseInlineElements(line)}</p>;
        })}
      </div>
    );
  };

  const parseInlineElements = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...text.matchAll(linkRegex)];
    
    if (matches.length > 0) {
      let lastIdx = 0;
      const newParts = [];
      matches.forEach((match) => {
        const startIdx = match.index;
        const endIdx = startIdx + match[0].length;
        if (startIdx > lastIdx) {
          newParts.push(text.substring(lastIdx, startIdx));
        }
        newParts.push(
          <a 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-655 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
            key={startIdx}
          >
            {match[1]}
            <ExternalLink className="h-3 w-3 inline" />
          </a>
        );
        lastIdx = endIdx;
      });
      if (lastIdx < text.length) {
        newParts.push(text.substring(lastIdx));
      }
      return newParts.map((part, idx) => {
        if (typeof part === 'string') {
          return parseBoldAndCode(part);
        }
        return part;
      });
    }
    
    return parseBoldAndCode(text);
  };

  const parseBoldAndCode = (text) => {
    const boldParts = text.split('**');
    return boldParts.map((bp, bIdx) => {
      const isBold = bIdx % 2 === 1;
      const codeParts = bp.split('`');
      const renderedCode = codeParts.map((cp, cIdx) => {
        const isCode = cIdx % 2 === 1;
        if (isCode) {
          return (
            <code key={cIdx} className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded font-mono text-xs">
              {cp}
            </code>
          );
        }
        return cp;
      });
      
      if (isBold) {
        return <strong key={bIdx} className="font-extrabold text-slate-950 dark:text-white">{renderedCode}</strong>;
      }
      return <span key={bIdx}>{renderedCode}</span>;
    });
  };

  return (
    <section className="mt-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden transition-colors duration-200">
      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl">
            <User className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Cloud Dashboard</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {user ? user.email : 'Guest progress is saved locally'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill icon={syncIcon} label={cloudStatus} />
          {lastSyncedAt && (
            <StatusPill icon={Save} label={`Saved ${lastSyncedAt}`} />
          )}
          {user ? (
            <button className="button-secondary" onClick={onSignOut} type="button">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          ) : (
            <button
              className="button-primary"
              disabled={authLoading || !firebaseReady}
              onClick={onSignIn}
              type="button"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Google sign-in
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 px-5 py-3 bg-white dark:bg-slate-900">
        {[
          ['overview', 'Overview', Gauge],
          ['notes', 'Notes Journal', NotebookPen],
          ['links', 'Link Hub', Link],
          ['tasks', 'Task Finder', Search],
          ['settings', 'Settings', Settings],
        ].map(([panel, label, PanelIcon]) => (
          <button
            className={`tab-button ${activePanel === panel ? 'tab-button-active' : ''}`}
            key={panel}
            onClick={() => setActivePanel(panel)}
            type="button"
          >
            {createElement(PanelIcon, {
              className: 'h-4 w-4',
              'aria-hidden': true,
            })}
            {label}
          </button>
        ))}
      </div>

      {/* Pane 1: Overview */}
      {activePanel === 'overview' && (
        <div className="grid gap-5 p-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={CheckCircle2}
              label="Tasks"
              value={`${summary.completedTaskCount}/${summary.totalTaskCount}`}
            />
            <Metric
              icon={Target}
              label="Days"
              value={`${summary.completedDayCount}/${summary.totalDayCount}`}
            />
            <Metric
              icon={Gauge}
              label="Current Week"
              value={summary.currentTask?.weekTitle.replace('Week ', 'W') || 'Done'}
            />
            <Metric
              icon={Cloud}
              label="Target Role"
              value={state.goals.targetRole || 'Not set'}
            />
          </div>

          <ActivityList activity={state.activity} />
        </div>
      )}

      {/* Pane 2: Advanced Notes Journal */}
      {activePanel === 'notes' && (
        <div className="grid gap-6 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left panel: selection & directory */}
          <div className="flex flex-col gap-4 border-r border-slate-105 border-slate-200 dark:border-slate-800 pr-0 lg:pr-5">
            <div>
              <label className="form-label" htmlFor="note-search">
                Quick Finder
              </label>
              <div className="relative">
                <input
                  id="note-search"
                  type="text"
                  placeholder="Filter days or search note keywords..."
                  className="form-field pl-9"
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="form-label">Active Study Day</label>
              <select
                className="form-field"
                onChange={(event) => onSelectNoteDay(event.target.value)}
                value={activeNoteDayId}
              >
                {filteredDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.weekTitle} - {day.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Highlights Box */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-950 transition-all">
              <p className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                {activeNoteDay?.weekTitle}
              </p>
              <p className="mt-1 font-bold text-sm text-slate-900 dark:text-slate-100">
                {activeNoteDay?.title}
              </p>
            </div>

            {/* Existing Notes Journal Directory */}
            <div className="mt-2 flex-grow">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Days with Saved Notes ({daysWithNotes.length})
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {daysWithNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    No notes written yet. Notes you save will appear here in your journal directory.
                  </p>
                ) : (
                  daysWithNotes.map((day) => {
                    const isEditing = day.id === activeNoteDayId;
                    const previewText = state.notes[day.id] || '';
                    return (
                      <button
                        key={day.id}
                        onClick={() => onSelectNoteDay(day.id)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                          isEditing
                            ? 'border-indigo-600 bg-indigo-50/10 dark:border-indigo-500 dark:bg-indigo-950/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                        }`}
                        type="button"
                      >
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {day.weekTitle} - {day.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 line-clamp-1 italic">
                          {previewText}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right panel: rich text editing & markdown preview */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="form-label" htmlFor="day-note">
                  Markdown Editor
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyNote(state.notes[activeNoteDayId])}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    disabled={!state.notes[activeNoteDayId]}
                    type="button"
                    title="Copy Note"
                  >
                    {notesCopyStatus ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {notesCopyStatus ? 'Copied' : 'Copy'}
                  </button>
                  
                  <button
                    onClick={() => handleDownloadNote(activeNoteDayId, state.notes[activeNoteDayId])}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    disabled={!state.notes[activeNoteDayId]}
                    type="button"
                    title="Download Markdown file"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              </div>
              <textarea
                className="form-field min-h-48 resize-y font-mono text-xs sm:text-sm p-3 focus:ring-2 focus:ring-indigo-500/25 bg-slate-50/30 dark:bg-slate-950/20"
                id="day-note"
                placeholder="Write study summaries, code snippets, or configurations. E.g. # AWS VPC Config \n- Create public subnet \n- Deploy NAT Gateway in `us-east-1`"
                onChange={(event) =>
                  onNoteChange(activeNoteDayId, event.target.value)
                }
                value={state.notes[activeNoteDayId] || ''}
              />
            </div>

            {/* Markdown Live Preview Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/20 transition-all">
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Technical Runbook Live Preview
                </span>
              </div>
              <div className="p-4 min-h-32 max-h-64 overflow-y-auto bg-white dark:bg-slate-950">
                {renderMarkdown(state.notes[activeNoteDayId])}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pane 3: Unified Link Hub */}
      {activePanel === 'links' && (
        <div className="p-5 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Active Week Resources & Link Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All curated links aggregated for visual accessibility during study sessions.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                Filter:
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {[
                  ['all', 'All'],
                  ['resource', 'curated'],
                  ['link', 'In-Task'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setLinksFilter(val)}
                    className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold cursor-pointer transition-all ${
                      linksFilter === val
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/60'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search weekly aggregated external links..."
              className="form-field pl-9"
              value={linksSearch}
              onChange={(e) => setLinksSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Links Card Deck */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-1">
            {filteredLinks.length === 0 ? (
              <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Link className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 italic">
                  No links match your current filters for this week's plan.
                </p>
              </div>
            ) : (
              filteredLinks.map((link, idx) => (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col justify-between p-4 border border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900 transition-all rounded-xl cursor-pointer group shadow-sm hover:shadow"
                  key={idx}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase bg-indigo-50 border border-indigo-150 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/60 dark:text-indigo-400 px-2 py-0.5 rounded">
                        {link.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {link.source.replace('Day ', 'Day ')}
                      </span>
                    </div>
                    <p className="mt-3 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug">
                      {link.label}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    <span className="truncate max-w-xs">{link.href}</span>
                    <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pane 4: Curriculum Task Finder */}
      {activePanel === 'tasks' && (
        <div className="p-5 flex flex-col gap-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Curriculum Task Finder & Search Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search key terms (e.g. AWS, network, lab) to find any task, toggle progress, or jump visually.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search keyword across all 30 weeks of tasks..."
              className="form-field pl-9"
              value={tasksSearch}
              onChange={(e) => setTasksSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Task Results */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {!tasksSearch.trim() ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-955 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Search className="h-8 w-8 text-slate-400 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 italic">
                  Enter a keyword above to scan all weeks of the cloud architect curriculum.
                </p>
              </div>
            ) : foundTasks.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 italic">
                  No matching curriculum tasks found for "{tasksSearch}". Try checking your spelling or search terms.
                </p>
              </div>
            ) : (
              foundTasks.map((task) => {
                const isChecked = checkedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className="p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl flex items-start gap-3 justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900'
                        }`}
                        aria-label={`Toggle task completion`}
                        type="button"
                      >
                        {isChecked && <Check className="h-4 w-4" />}
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/60 rounded">
                            {task.kind}
                          </span>
                          {task.duration && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                              {task.duration}
                            </span>
                          )}
                        </div>
                        <p className={`mt-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-205 ${isChecked ? 'line-through opacity-55' : ''}`}>
                          <InlineText text={task.text} />
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <span>{task.weekTitle}</span>
                          <span>•</span>
                          <span>{task.dayTitle}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onJumpToWeek(task.weekId, task.phaseId)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
                      type="button"
                    >
                      Jump to Week
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pane 5: Settings */}
      {activePanel === 'settings' && (
        <div className="grid gap-6 p-5 lg:grid-cols-2 bg-white dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <label className="block">
              <span className="form-label">Target role</span>
              <input
                className="form-field"
                onChange={(event) =>
                  onGoalChange('targetRole', event.target.value)
                }
                type="text"
                value={state.goals.targetRole}
              />
            </label>
            <label className="block">
              <span className="form-label">Certification date</span>
              <input
                className="form-field"
                onChange={(event) =>
                  onGoalChange('certificationDate', event.target.value)
                }
                type="date"
                value={state.goals.certificationDate}
              />
            </label>
            <label className="block">
              <span className="form-label">Daily study minutes</span>
              <input
                className="form-field"
                min="15"
                onChange={(event) =>
                  onGoalChange('dailyStudyGoal', event.target.value)
                }
                step="5"
                type="number"
                value={state.goals.dailyStudyGoal}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl cursor-pointer">
            <input
              checked={state.settings.localOnly}
              className="h-5 w-5 accent-slate-900 dark:accent-indigo-500"
              onChange={(event) => onLocalOnlyChange(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Local only</span>
              <span className="block text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Keep this device out of cloud sync
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
            <button
              className="button-danger"
              onClick={onResetLocalProgress}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Reset local progress
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
