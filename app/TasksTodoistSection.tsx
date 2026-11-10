// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { RefreshCw, Clock, Cloud, Plus, Check } from 'lucide-react';
import { formatDateStr, addDays, safeArr } from './touchwallConfig';

const PRIORITY_BADGES = {
  4: { label: '🔥 P1 Dringend', classes: 'bg-rose-500/25 text-rose-300 border-rose-400/50' },
  3: { label: '🟠 P2 Wichtig',  classes: 'bg-amber-500/25 text-amber-300 border-amber-400/50' },
  2: { label: '🔵 P3 Mittel',   classes: 'bg-sky-500/25 text-sky-300 border-sky-400/50' },
  1: { label: '⚪ P4 Normal',   classes: 'bg-slate-500/20 text-slate-300 border-slate-400/30' }
};

export default function TasksTodoistSection({
  members,
  setMembers,
  familyTasks,
  shoppingNoteBlock,
  setShoppingTileProjectId,
  todoistConfig,
  createAndSelectTodoistProject,
  isSyncing,
  lastAutoSyncTime,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  syncWithTodoistNow,
  addNewTaskWithSettings,
  toggleTaskDone,
  deleteTaskItem,
  clearCompletedMemberTasks,
  openEditTaskModal,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCompletedShoppingItems,
  setActiveSection
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMember, setNewTaskMember] = useState('hans');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => formatDateStr(new Date()));
  const [newTaskDueTime, setNewTaskDueTime] = useState('17:00');
  const [newTaskNotify, setNewTaskNotify] = useState('15m');
  const [newTaskPriority, setNewTaskPriority] = useState(3);
  const [alsoPushToCalendar, setAlsoPushToCalendar] = useState(false);

  const [showNewTileBar, setShowNewTileBar] = useState(false);
  const [newTileName, setNewTileName] = useState('');
  const [newTileProjectId, setNewTileProjectId] = useState('');

  const [shoppingQuickInput, setShoppingQuickInput] = useState('');
  const [colTaskInputs, setColTaskInputs] = useState({});

  const safeMembers = safeArr(members);
  const safeTasks = safeArr(familyTasks);
  const shopItems = safeArr(shoppingNoteBlock?.items);
  const openShopItems = shopItems.map((it, idx) => ({ ...(it || {}), origIdx: idx })).filter(it => !it.done);
  const doneShopItems = shopItems.map((it, idx) => ({ ...(it || {}), origIdx: idx })).filter(it => it.done);
  const hasTodoistToken = Boolean(todoistConfig?.apiToken?.trim());
  const projectsList = safeArr(todoistConfig?.projects);

  const setQuickDeadline = (type) => {
    const now = new Date();
    if (type === 'today') {
      setNewTaskDueDate(formatDateStr(now));
      if (!newTaskDueTime) setNewTaskDueTime('18:00');
    } else if (type === 'tomorrow') {
      setNewTaskDueDate(formatDateStr(addDays(now, 1)));
      if (!newTaskDueTime) setNewTaskDueTime('17:00');
    } else if (type === 'dayafter') {
      setNewTaskDueDate(formatDateStr(addDays(now, 2)));
    } else if (type === 'weekend') {
      const day = now.getDay();
      const daysUntilSat = day === 6 ? 7 : (6 - day);
      setNewTaskDueDate(formatDateStr(addDays(now, daysUntilSat)));
      setNewTaskDueTime('11:00');
    } else if (type === 'nextweek') {
      setNewTaskDueDate(formatDateStr(addDays(now, 7)));
      setNewTaskDueTime('16:00');
    } else if (type === 'clear') {
      setNewTaskDueDate('');
      setNewTaskDueTime('');
    }
  };

  const handleCreateTaskSubmit = () => {
    if (!newTaskTitle.trim()) return;
    const memberObj = safeMembers.find(m => m.id === newTaskMember);
    const chosenProjId = newTaskProjectId || memberObj?.todoistProjectId || todoistConfig?.tasksProjectId;
    addNewTaskWithSettings(
      newTaskTitle,
      newTaskMember,
      newTaskDueDate,
      newTaskDueTime,
      newTaskNotify,
      alsoPushToCalendar,
      newTaskPriority,
      newTaskDesc,
      chosenProjId
    );
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleCreateNewTile = async () => {
    if (!newTileName.trim()) return;
    let finalProjId = newTileProjectId;
    if (newTileProjectId === '__NEW__') {
      const createdP = await createAndSelectTodoistProject(newTileName.trim());
      if (createdP?.id) finalProjId = String(createdP.id);
    }
    const newMemberTile = {
      id: 'tile_' + Date.now(),
      name: newTileName.trim(),
      role: 'Projekt-Kachel',
      badge: newTileName.trim().charAt(0).toUpperCase(),
      color: 'cyan_bold',
      avatarType: 'emoji',
      emoji: '📂',
      photoUrl: '',
      calendarId: '',
      todoistUserId: '',
      todoistProjectId: finalProjId || todoistConfig?.tasksProjectId || '',
      statusMsg: 'Todoist-Kachel',
      ok: true
    };
    setMembers(prev => [...safeArr(prev), newMemberTile]);
    setNewTileName('');
    setShowNewTileBar(false);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold">✅ Todoist Team „Familie Richter“ & Projekt-Kacheln</h2>
              {hasTodoistToken ? (
                <button
                  onClick={() => syncWithTodoistNow(true)}
                  className="tw-glow-btn px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  ⚡ 8s Auto-Sync aktiv {lastAutoSyncTime ? `(${lastAutoSyncTime})` : ''}
                </button>
              ) : (
                <button
                  onClick={() => setActiveSection('google')}
                  className="tw-glow-btn px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" /> Todoist API-Token unter „Konten“ eintragen
                </button>
              )}

              <button
                onClick={() => setShowNewTileBar(!showNewTileBar)}
                className="tw-glow-btn px-4 py-1.5 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 text-sky-300 border border-sky-400/50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Neue Kachel (mit Projekt-Auswahl)
              </button>
            </div>
            <p className={`text-sm font-semibold mt-1 ${themeStyles.textMuted}`}>
              Jede Kachel hat oben ihr eigenes <strong>Todoist-Projekt-Menü</strong>. Abgehakte Aufgaben vom Handy werden alle 8 Sekunden vollautomatisch abgeglichen!
            </p>
          </div>
        </div>

        {/* NEUE KACHEL ERSTELLEN MIT DIREKTER PROJEKT-AUSWAHL */}
        {showNewTileBar && (
          <div className="p-4 rounded-2xl border-2 border-sky-400/60 bg-sky-500/10 flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase text-sky-300 flex items-center gap-1.5">
              📂 Neue Kachel anlegen:
            </span>
            <input
              type="text"
              value={newTileName}
              onChange={(e) => setNewTileName(e.target.value)}
              placeholder="Name der Kachel (z.B. Haus & Garten, Arbeit, Urlaub)..."
              className={`flex-1 min-w-[220px] px-3.5 py-2 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
            />
            <select
              value={newTileProjectId}
              onChange={(e) => setNewTileProjectId(e.target.value)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
            >
              <option value="" className="bg-slate-800 text-white">
                📂 Standard-Projekt ({projectsList.find(p => String(p.id) === String(todoistConfig?.tasksProjectId))?.name || 'Familien-Aufgaben'})
              </option>
              {projectsList.map(p => (
                <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                  📂 Todoist-Projekt: {p.name}
                </option>
              ))}
              <option value="__NEW__" className="bg-slate-800 text-amber-300 font-black">
                ✨ Neues gleichnamiges Projekt in Todoist anlegen
              </option>
            </select>
            <button
              type="button"
              onClick={handleCreateNewTile}
              className="tw-glow-btn px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs cursor-pointer"
            >
              ✓ Kachel erstellen
            </button>
          </div>
        )}

        {/* AUFGABE ANLEGEN MIT PERSONEN-, PROJEKT-, FRIST- & ERINNERUNGS-WAHL */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-3.5 ${themeStyles.subtle}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTaskSubmit(); }}
              placeholder="Was muss erledigt werden? (z.B. 🎒 Sporttasche packen, Müll rausbringen...)"
              className={`lg:col-span-4 px-4 py-3 rounded-2xl border text-sm font-extrabold ${themeStyles.input}`}
            />
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTaskSubmit(); }}
              placeholder="Notiz / Details (optional)..."
              className={`lg:col-span-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${themeStyles.input}`}
            />
            <select
              value={newTaskMember}
              onChange={(e) => {
                const mid = e.target.value;
                setNewTaskMember(mid);
                const mObj = safeMembers.find(x => x.id === mid);
                if (mObj?.todoistProjectId) setNewTaskProjectId(mObj.todoistProjectId);
              }}
              className={`lg:col-span-2 px-3 py-3 rounded-2xl border text-xs font-extrabold ${themeStyles.input}`}
            >
              {safeMembers.filter(m => m.id !== 'all').map(m => (
                <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                  👤 Kachel: {m.name}
                </option>
              ))}
            </select>
            <select
              value={newTaskProjectId || safeMembers.find(m => m.id === newTaskMember)?.todoistProjectId || todoistConfig?.tasksProjectId || ''}
              onChange={(e) => setNewTaskProjectId(e.target.value)}
              title="Ziel-Projekt in Todoist wählen"
              className={`lg:col-span-3 px-3 py-3 rounded-2xl border text-xs font-extrabold ${themeStyles.input}`}
            >
              <option value="" className="bg-slate-800 text-white">📂 Projekt automatisch (nach Kachel)</option>
              {projectsList.map(p => (
                <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                  📂 Todoist: {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mr-1">
                ⏳ Bis wann erledigen?
              </span>
              {[
                { id: 'today',    label: 'Heute' },
                { id: 'tomorrow', label: 'Morgen' },
                { id: 'dayafter', label: 'Übermorgen' },
                { id: 'weekend',  label: 'Wochenende' },
                { id: 'nextweek', label: 'Nächste Woche' },
                { id: 'clear',    label: 'Ohne Frist' }
              ].map(btn => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setQuickDeadline(btn.id)}
                  className={`tw-glow-btn px-2.5 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${themeStyles.card}`}
                >
                  {btn.label}
                </button>
              ))}

              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${themeStyles.input}`}
              />
              <input
                type="time"
                value={newTaskDueTime}
                onChange={(e) => setNewTaskDueTime(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${themeStyles.input}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newTaskNotify}
                onChange={(e) => setNewTaskNotify(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
              >
                <option value="none" className="bg-slate-800 text-white">🔕 Keine Erinnerung</option>
                <option value="0m" className="bg-slate-800 text-white">🔔 Pünktlich zur Frist</option>
                <option value="5m" className="bg-slate-800 text-white">🔔 5 Min. vorher</option>
                <option value="15m" className="bg-slate-800 text-white">🔔 15 Min. vorher</option>
                <option value="30m" className="bg-slate-800 text-white">🔔 30 Min. vorher</option>
                <option value="1h" className="bg-slate-800 text-white">🔔 1 Std. vorher</option>
                <option value="1d" className="bg-slate-800 text-white">🔔 1 Tag vorher</option>
              </select>

              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                className={`px-3 py-2 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
              >
                <option value={4} className="bg-slate-800 text-white">🔥 P1 - Sehr dringend</option>
                <option value={3} className="bg-slate-800 text-white">🟠 P2 - Wichtig</option>
                <option value={2} className="bg-slate-800 text-white">🔵 P3 - Mittel</option>
                <option value={1} className="bg-slate-800 text-white">⚪ P4 - Normal</option>
              </select>

              <label
                className={`tw-glow-btn px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-extrabold cursor-pointer ${
                  alsoPushToCalendar ? 'bg-amber-400/25 border-amber-400 text-amber-300' : themeStyles.card
                }`}
              >
                <input
                  type="checkbox"
                  checked={alsoPushToCalendar}
                  onChange={(e) => setAlsoPushToCalendar(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <span>📅 + Kalender-Wecker</span>
              </label>

              <button
                type="button"
                onClick={handleCreateTaskSubmit}
                className="tw-glow-btn px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-xs cursor-pointer shadow-md"
              >
                + Aufgabe zuweisen & senden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KACHEL-GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">

        {/* KACHEL 0: 🛒 EINKAUFSLISTE */}
        <div className={`rounded-3xl border-2 border-amber-400/60 shadow-lg overflow-hidden flex flex-col justify-between min-h-[460px] ${themeStyles.card}`}>
          <div className="flex-1 flex flex-col">
            <div
              style={{
                background: themeStyles.dark
                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.12) 100%)'
                  : 'linear-gradient(90deg, rgba(254, 243, 199, 1) 0%, rgba(253, 230, 138, 0.5) 100%)',
                borderLeft: '6px solid #f59e0b'
              }}
              className={`p-4 border-b space-y-2.5 ${themeStyles.divider}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                    🛒
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-base truncate">Einkaufsliste</div>
                    <div className={`text-[11px] font-bold truncate ${themeStyles.textMuted}`}>
                      Essensplan & Todoist
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shrink-0">
                  {openShopItems.length} offen
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase opacity-75 shrink-0">📂 Projekt:</span>
                <select
                  value={shoppingNoteBlock?.todoistProjectId || todoistConfig?.shoppingProjectId || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (val === '__NEW__') {
                      const name = prompt('Name für das neue Todoist-Projekt:');
                      if (name?.trim()) {
                        const created = await createAndSelectTodoistProject(name.trim());
                        if (created?.id) setShoppingTileProjectId(String(created.id));
                      }
                    } else {
                      setShoppingTileProjectId(val);
                    }
                  }}
                  className="flex-1 px-2.5 py-1 rounded-xl bg-black/25 text-white border border-white/15 text-[11px] font-extrabold cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-white">-- Projekt wählen --</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                      {p.name}
                    </option>
                  ))}
                  <option value="__NEW__" className="bg-slate-800 text-amber-300 font-black">
                    + Neues Todoist-Projekt...
                  </option>
                </select>
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1">
              {openShopItems.length === 0 && (
                <div className="py-6 text-center text-xs font-bold opacity-55">
                  🛒 Einkaufsliste ist leer!
                </div>
              )}
              {openShopItems.map(item => (
                <div
                  key={item.origIdx}
                  onClick={() => toggleShoppingItem(item.origIdx)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer ${themeStyles.subtle}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input type="checkbox" checked={false} readOnly className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                    <span className="text-sm font-bold break-words">{item.text}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteShoppingItem(item.origIdx);
                    }}
                    className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {doneShopItems.length > 0 && (
                <div className={`pt-3 mt-3 border-t space-y-1.5 ${themeStyles.divider}`}>
                  <div className="flex items-center justify-between text-xs font-extrabold opacity-75">
                    <span>☑️ Erledigt ({doneShopItems.length})</span>
                    <button
                      onClick={clearCompletedShoppingItems}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      🗑️ Leeren
                    </button>
                  </div>
                  {doneShopItems.map(item => (
                    <div
                      key={item.origIdx}
                      onClick={() => toggleShoppingItem(item.origIdx)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer opacity-55 ${themeStyles.subtle}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
                        <span className="text-xs font-bold line-through break-words">{item.text}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteShoppingItem(item.origIdx);
                        }}
                        className="text-xs opacity-60 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`p-3.5 border-t flex gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
            <input
              type="text"
              value={shoppingQuickInput}
              onChange={(e) => setShoppingQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && shoppingQuickInput.trim()) {
                  addShoppingItem(shoppingQuickInput);
                  setShoppingQuickInput('');
                }
              }}
              placeholder="Artikel zur Einkaufsliste..."
              className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
            />
            <button
              onClick={() => {
                if (!shoppingQuickInput.trim()) return;
                addShoppingItem(shoppingQuickInput);
                setShoppingQuickInput('');
              }}
              className="tw-glow-btn w-10 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* KACHELN 1..N: MITGLIEDER- & PROJEKT-KACHELN */}
        {safeMembers.filter(m => m.id !== 'all').map(member => {
          const mTasks = safeTasks.filter(t => t.member === member.id);
          const openTasks = mTasks.filter(t => !t.done);
          const doneTasks = mTasks.filter(t => t.done);
          const st = getMemberStyles(member);
          const activeTileProjId = member.todoistProjectId || todoistConfig?.tasksProjectId || '';

          return (
            <div key={member.id} className={`rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col justify-between min-h-[460px] ${themeStyles.card}`}>
              <div className="flex-1 flex flex-col">
                <div style={st.headerStyle} className={`p-4 border-b space-y-2.5 ${themeStyles.divider}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAvatar(member, 'w-11 h-11', 'text-lg')}
                      <div className="min-w-0">
                        <div className="font-extrabold text-base truncate">{member.name}</div>
                        <div className={`text-xs font-semibold truncate ${themeStyles.textMuted}`}>
                          {member.todoistUserId ? '📲 Todoist Push aktiv' : member.role}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-black/25 text-xs font-extrabold shrink-0">{openTasks.length} offen</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase opacity-75 shrink-0">📂 Projekt:</span>
                    <select
                      value={activeTileProjId}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (val === '__NEW__') {
                          const name = prompt(`Neues Todoist-Projekt für ${member.name}:`);
                          if (name?.trim()) {
                            const created = await createAndSelectTodoistProject(name.trim());
                            if (created?.id) {
                              setMembers(prev => safeArr(prev).map(m => m.id === member.id ? { ...m, todoistProjectId: String(created.id) } : m));
                            }
                          }
                        } else {
                          setMembers(prev => safeArr(prev).map(m => m.id === member.id ? { ...m, todoistProjectId: val } : m));
                        }
                      }}
                      className="flex-1 px-2.5 py-1 rounded-xl bg-black/25 text-white border border-white/15 text-[11px] font-extrabold cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-white">-- Projekt wählen --</option>
                      {projectsList.map(p => (
                        <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                          {p.name}
                        </option>
                      ))}
                      <option value="__NEW__" className="bg-slate-800 text-amber-300 font-black">
                        + Neues Todoist-Projekt...
                      </option>
                    </select>
                  </div>
                </div>

                <div className="p-4 space-y-2.5 flex-1">
                  {openTasks.length === 0 && (
                    <div className="py-6 text-center text-xs font-bold opacity-50">
                      🎉 Keine offenen Aufgaben!
                    </div>
                  )}
                  {openTasks.map(task => {
                    const prioObj = PRIORITY_BADGES[task.priority || 1];
                    const isOverdue = task.dueDate && task.dueDate < formatDateStr(new Date());

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskDone(task.id, true)}
                        className={`p-3 rounded-2xl border flex flex-col gap-1.5 cursor-pointer ${themeStyles.subtle} ${
                          isOverdue ? 'border-rose-500/70 ring-1 ring-rose-500/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input type="checkbox" checked={false} readOnly className="w-5 h-5 mt-0.5 accent-indigo-600 rounded cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-bold break-words leading-snug">{task.title}</div>
                              {task.description && (
                                <div className={`text-xs mt-0.5 break-words ${themeStyles.textMuted}`}>
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Frist, Erinnerung & Priorität bearbeiten"
                              onClick={(e) => openEditTaskModal(e, task)}
                              className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTaskItem(task.id);
                              }}
                              className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pl-7 flex-wrap">
                          {(task.due || task.dueDate || task.dueTime) && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              isOverdue
                                ? 'bg-rose-500/25 text-rose-300 border-rose-400/50'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                            }`}>
                              ⏳ {task.dueDate
                                ? `Bis ${task.dueDate.slice(8, 10)}.${task.dueDate.slice(5, 7)}.${task.dueTime ? ' ' + task.dueTime + ' Uhr' : ''}`
                                : task.due}
                            </span>
                          )}
                          {task.notifyTime && task.notifyTime !== 'none' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold">
                              🔔 {task.notifyTime === '0m' ? 'Pünktlich' : `${task.notifyTime} vorher`}
                            </span>
                          )}
                          {task.priority && task.priority > 1 && prioObj && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${prioObj.classes}`}>
                              {prioObj.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {doneTasks.length > 0 && (
                    <div className={`pt-3 mt-3 border-t space-y-1.5 ${themeStyles.divider}`}>
                      <div className="flex items-center justify-between text-xs font-extrabold opacity-75">
                        <span>☑️ Erledigt ({doneTasks.length})</span>
                        <button
                          onClick={() => clearCompletedMemberTasks(member.id)}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          🗑️ Leeren
                        </button>
                      </div>
                      {doneTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskDone(task.id, false)}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer opacity-55 ${themeStyles.subtle}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
                            <span className="text-xs font-bold line-through break-words">{task.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTaskItem(task.id);
                            }}
                            className="text-xs opacity-60 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-3.5 border-t flex gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                <input
                  type="text"
                  value={colTaskInputs[member.id] || ''}
                  onChange={(e) => setColTaskInputs({ ...colTaskInputs, [member.id]: e.target.value })}
                  onKeyDown={(e) => {
                    const val = (colTaskInputs[member.id] || '').trim();
                    if (e.key === 'Enter' && val) {
                      addNewTaskWithSettings(val, member.id, formatDateStr(new Date()), '18:00', '15m', false, 2, '', activeTileProjId);
                      setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
                    }
                  }}
                  placeholder={`Schnell-Aufgabe an ${member.name}...`}
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                />
                <button
                  onClick={() => {
                    const val = (colTaskInputs[member.id] || '').trim();
                    if (!val) return;
                    addNewTaskWithSettings(val, member.id, formatDateStr(new Date()), '18:00', '15m', false, 2, '', activeTileProjId);
                    setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
                  }}
                  className="tw-glow-btn w-10 h-9 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
