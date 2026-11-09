// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { RefreshCw, Clock, Cloud } from 'lucide-react';

export default function TasksTodoistSection({
  members,
  familyTasks,
  shoppingNoteBlock,
  todoistConfig,
  isSyncing,
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
  const [newTaskMember, setNewTaskMember] = useState('hans');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskNotify, setNewTaskNotify] = useState('15m');
  const [shoppingQuickInput, setShoppingQuickInput] = useState('');
  const [colTaskInputs, setColTaskInputs] = useState({});

  const shopItems = shoppingNoteBlock.items || [];
  const openShopItems = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => !it.done);
  const doneShopItems = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => it.done);
  const hasTodoistToken = Boolean(todoistConfig?.apiToken?.trim());

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold">✅ Todoist Team „Familie Richter“ & 🛒 Einkaufsliste</h2>
              {hasTodoistToken ? (
                <button
                  onClick={() => syncWithTodoistNow(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Todoist Live-Sync
                </button>
              ) : (
                <button
                  onClick={() => setActiveSection('google')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" /> Todoist API-Token unter „Konten“ verbinden
                </button>
              )}
            </div>
            <p className={`text-sm font-semibold mt-1 ${themeStyles.textMuted}`}>
              Jede Aufgabe wird in Todoist direkt der gewählten Person zugewiesen – deren Smartphone erhält sofort die Push-Benachrichtigung & Frist-Erinnerung!
            </p>
          </div>
        </div>

        {/* LEISTE ZUM ANLEGEN MIT TEAM-ZUWEISUNG, FRIST & UHRZEIT */}
        <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-2.5 ${themeStyles.subtle}`}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTaskTitle.trim()) {
                addNewTaskWithSettings(newTaskTitle, newTaskMember, newTaskDueDate, newTaskDueTime, newTaskNotify, false);
                setNewTaskTitle('');
              }
            }}
            placeholder="Neue Aufgabe für Todoist & Touchwall eintragen..."
            className={`flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.input}`}
          />
          <select
            value={newTaskMember}
            onChange={(e) => setNewTaskMember(e.target.value)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
          >
            {members.filter(m => m.id !== 'all').map(m => (
              <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                👤 Zuweisen an: {m.name} {m.todoistUserId ? '✓' : ''}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            title="Fälligkeitsdatum"
            className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
          />
          <input
            type="time"
            value={newTaskDueTime}
            onChange={(e) => setNewTaskDueTime(e.target.value)}
            title="Uhrzeit für Handy-Push"
            className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
          />
          <select
            value={newTaskNotify}
            onChange={(e) => setNewTaskNotify(e.target.value)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
          >
            <option value="none" className="bg-slate-800 text-white">🔕 Kein Wand-Alarm</option>
            <option value="0m" className="bg-slate-800 text-white">🔔 Pünktlich</option>
            <option value="15m" className="bg-slate-800 text-white">🔔 15m vorher</option>
            <option value="30m" className="bg-slate-800 text-white">🔔 30m vorher</option>
            <option value="1h" className="bg-slate-800 text-white">🔔 1h vorher</option>
          </select>
          <button
            onClick={() => {
              if (!newTaskTitle.trim()) return;
              addNewTaskWithSettings(newTaskTitle, newTaskMember, newTaskDueDate, newTaskDueTime, newTaskNotify, false);
              setNewTaskTitle('');
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-sm"
          >
            + Zuweisen & Senden
          </button>
        </div>
      </div>

      {/* KACHEL-GRID: 1. KACHEL = EINKAUFSLISTE (TODOIST), DANACH ALLE MITGLIEDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">

        {/* KACHEL 0: 🛒 EINKAUFSLISTE (TODOIST PROJEKT) */}
        <div className={`rounded-3xl border-2 border-amber-400/60 shadow-lg overflow-hidden flex flex-col justify-between min-h-[450px] ${themeStyles.card}`}>
          <div className="flex-1 flex flex-col">
            <div
              style={{
                background: themeStyles.dark
                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.12) 100%)'
                  : 'linear-gradient(90deg, rgba(254, 243, 199, 1) 0%, rgba(253, 230, 138, 0.5) 100%)',
                borderLeft: '6px solid #f59e0b'
              }}
              className={`p-4 border-b flex items-center justify-between ${themeStyles.divider}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                  🛒
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-base truncate">Einkaufsliste</div>
                  <div className={`text-[11px] font-bold truncate ${themeStyles.textMuted}`}>
                    Todoist & Essensplan
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shrink-0">
                {openShopItems.length} offen
              </span>
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
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer hover:border-amber-400/60 ${themeStyles.subtle}`}
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
              className="w-10 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* KACHELN 1..N: MITGLIEDER-AUFGABEN MIT TODOIST-ZUWEISUNG */}
        {members.filter(m => m.id !== 'all').map(member => {
          const mTasks = familyTasks.filter(t => t.member === member.id);
          const openTasks = mTasks.filter(t => !t.done);
          const doneTasks = mTasks.filter(t => t.done);
          const st = getMemberStyles(member);

          return (
            <div key={member.id} className={`rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col justify-between min-h-[450px] ${themeStyles.card}`}>
              <div className="flex-1 flex flex-col">
                <div style={st.headerStyle} className={`p-4 border-b flex items-center justify-between ${themeStyles.divider}`}>
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

                <div className="p-4 space-y-2.5 flex-1">
                  {openTasks.length === 0 && (
                    <div className="py-6 text-center text-xs font-bold opacity-50">
                      🎉 Keine offenen Aufgaben!
                    </div>
                  )}
                  {openTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskDone(task.id, true)}
                      className={`p-3 rounded-2xl border flex flex-col gap-1.5 cursor-pointer hover:border-indigo-400/60 ${themeStyles.subtle}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input type="checkbox" checked={false} readOnly className="w-5 h-5 mt-0.5 accent-indigo-600 rounded cursor-pointer shrink-0" />
                          <span className="text-sm font-bold break-words leading-snug">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Frist, Uhrzeit & Erinnerung einstellen"
                            onClick={(e) => openEditTaskModal(e, task)}
                            className="p-1 rounded-lg hover:bg-indigo-500/20 text-indigo-400 cursor-pointer"
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

                      {(task.due || task.dueTime || (task.notifyTime && task.notifyTime !== 'none')) && (
                        <div className="flex items-center gap-1.5 pl-7 flex-wrap">
                          {task.due && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold">
                              📅 {task.due}
                            </span>
                          )}
                          {task.notifyTime && task.notifyTime !== 'none' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
                              🔔 {task.notifyTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

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
                      addNewTaskWithSettings(val, member.id, '', '', 'none', false);
                      setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
                    }
                  }}
                  placeholder={`Aufgabe an ${member.name}...`}
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                />
                <button
                  onClick={() => {
                    const val = (colTaskInputs[member.id] || '').trim();
                    if (!val) return;
                    addNewTaskWithSettings(val, member.id, '', '', 'none', false);
                    setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
                  }}
                  className="w-10 h-9 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
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
