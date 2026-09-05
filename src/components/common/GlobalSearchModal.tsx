import React, { useState, useMemo } from 'react';
import { Search, X, Briefcase, User, Calendar, CheckSquare, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    matters,
    clients,
    tasks,
    documents,
    calendarEvents,
    proceedings,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const matchedMatters = matters.filter(
      (m) =>
        m.internalReference.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q)
    );

    const matchedClients = clients.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.idNumber.toLowerCase().includes(q)
    );

    const matchedProceedings = proceedings.filter(
      (p) =>
        p.caseNumber.toLowerCase().includes(q) ||
        p.courtName.toLowerCase().includes(q)
    );

    const matchedTasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    );

    const matchedDocs = documents.filter(
      (d) => d.title.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q)
    );

    const matchedEvents = calendarEvents.filter(
      (e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    );

    return {
      matters: matchedMatters,
      clients: matchedClients,
      proceedings: matchedProceedings,
      tasks: matchedTasks,
      documents: matchedDocs,
      events: matchedEvents,
      total:
        matchedMatters.length +
        matchedClients.length +
        matchedProceedings.length +
        matchedTasks.length +
        matchedDocs.length +
        matchedEvents.length,
    };
  }, [query, matters, clients, proceedings, tasks, documents, calendarEvents]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search by Matter Ref, Court Case No, Client Name, ID, Task, or Document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm sm:text-base outline-none focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 rounded text-xs text-slate-400 bg-slate-800 hover:text-slate-200 border border-slate-700 shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Search Results / Suggestions */}
        <div className="overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                Quick Lookups
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {matters.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMatterId(m.id);
                      setActiveWorkspace('matters');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="font-mono font-medium text-amber-400">{m.internalReference}</div>
                      <div className="text-slate-300 truncate text-[11px]">{m.title}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults && searchResults.total === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Check the reference code, phone number, or client name.</p>
            </div>
          ) : (
            searchResults && (
              <div className="space-y-5">
                {/* Matters */}
                {searchResults.matters.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <Briefcase className="w-3.5 h-3.5" /> Matters ({searchResults.matters.length})
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.matters.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMatterId(m.id);
                            setActiveWorkspace('matters');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left p-3 rounded-lg border border-slate-800/80 bg-slate-800/30 hover:bg-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400">{m.internalReference}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                Stage {m.currentStageId}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-200 mt-0.5">{m.title}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{m.summary}</div>
                          </div>
                          <CornerDownLeft className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Court Proceedings */}
                {searchResults.proceedings.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <Calendar className="w-3.5 h-3.5" /> Court Proceedings ({searchResults.proceedings.length})
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.proceedings.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedMatterId(p.matterId);
                            setActiveWorkspace('matters');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left p-3 rounded-lg border border-slate-800/80 bg-slate-800/30 hover:bg-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono text-xs font-bold text-blue-400">{p.caseNumber}</span>
                            <div className="text-sm font-medium text-slate-200">{p.courtName} ({p.division})</div>
                            <div className="text-xs text-slate-400">Judge: {p.judgeOrMagistrate} | Opposing: {p.opposingCounsel}</div>
                          </div>
                          <CornerDownLeft className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clients */}
                {searchResults.clients.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <User className="w-3.5 h-3.5" /> Clients ({searchResults.clients.length})
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.clients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveWorkspace('clients');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-800/80 bg-slate-800/30 hover:bg-slate-800 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-200">{c.displayName}</div>
                            <div className="text-xs text-slate-400">
                              ID: {c.idNumber} | Phone: {c.phone}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                            {c.clientType}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <CheckSquare className="w-3.5 h-3.5" /> Tasks ({searchResults.tasks.length})
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (t.matterId) setSelectedMatterId(t.matterId);
                            setActiveWorkspace('tasks');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-800/80 bg-slate-800/30 hover:bg-slate-800 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-200">{t.title}</div>
                            <div className="text-xs text-slate-400">
                              Due: {new Date(t.dueAt).toLocaleDateString()} | Priority: {t.priority}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {searchResults.documents.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <FileText className="w-3.5 h-3.5" /> Documents ({searchResults.documents.length})
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.documents.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setSelectedMatterId(d.matterId);
                            setActiveWorkspace('documents');
                            setIsSearchOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-800/80 bg-slate-800/30 hover:bg-slate-800 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-200">{d.title}</div>
                            <div className="text-xs text-slate-400">
                              Category: {d.category} | Type: {d.documentType} | {d.versions.length} versions
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
                            {d.documentType}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-500 flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">ESC</kbd> to close</span>
          <span>Search scope: All Matters, Clients, Courts & Documents</span>
        </div>
      </div>
    </div>
  );
};
