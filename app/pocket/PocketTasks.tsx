// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import * as Cfg from '../touchwallConfig';

const { pushTodoistTaskToPhoneNow } = Cfg;

export default function PocketTasks({
  safeMembers,
  openTasks,
  doneTasks,
  selectedPerson,
  todoistConfig,
  themeStyles,
  onAddQuickTask,
  onToggleTask,
  onDeleteTask,
  onClearDoneTasks,
  showToast
}) {
  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickTaskMember, setQuickTaskMember] = useState('hans');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quickTaskText.trim()) return;
    const targetMemberId = selectedPerson !== 'all' ? selectedPerson : quickTaskMember;
    onAddQuickTask(quickTaskText.trim(), targetMemberId);
    setQuickTaskText('');
  };

  // Zuletzt abgehakte Aufgaben stehen im Erledigt-Bereich immer ganz oben
  const sortedDoneTasks = Array.isArray(doneTasks)
    ? [...doneTasks].sort((a, b) => Number(b.doneAt || 0) - Number(a.doneAt || 0))
    : [];

  return (
    <div className="space-y-3.5">
      <form onSubmit={handleSubmit} className={'p-3.5 rounded-3xl border space-y-2.5 shadow-sm ' + themeStyles.card}>
        <div className="text-xs font-black uppercase text-sky-400">
          ⚡ Neue Aufgabe (mit Sofort-Push aufs Handy)
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickTaskText}
            onChange={(e) => setQuickTaskText(e.target.value)}
            placeholder="Aufgabe eingeben..."
            className={'flex-1 px-3.5 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
          />
          <button
            type="submit"
            className="tw-glow-btn px-5 rounded-2xl font-black text-xs flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" /> Push
          </button>
        </div>

        {selectedPerson === 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            <span className="text-[10px] font-bold opacity-70 shrink-0">Für:</span>
            {safeMembers.filter(m => m.id !== 'all').map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setQuickTaskMember(m.id)}
                className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' + (quickTaskMember === m.id ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className={'rounded-3xl border p-4 space-y-2.5 ' + themeStyles.card}>
        <div className="font-extrabold text-sm">✅ Offene Aufgaben ({openTasks.length})</div>

        {openTasks.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold opacity-50">
            🎉 Alles erledigt! Keine offenen Aufgaben.
          </div>
        ) : (
          openTasks.map(task => {
            const mem = safeMembers.find(m => m.id === task.member) || safeMembers[1];
            return (
              <div
                key={task.id}
                onClick={() => onToggleTask(task)}
                className={'p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer ' + themeStyles.subtle}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input type="checkbox" checked={false} readOnly className="w-5 h-5 accent-indigo-600 rounded shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm break-words">{task.title}</div>
                    <div className="text-[11px] font-semibold opacity-75">
                      👤 {mem.name.split(' ')[0]} • ⏳ {task.due || 'Offen'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.todoistId && todoistConfig?.apiToken) {
                        pushTodoistTaskToPhoneNow(todoistConfig.apiToken, task.todoistId, task.title, mem.todoistUserId, todoistConfig.collaborators);
                        showToast('Handy-Ping gesendet!', task.title, '📲');
                      } else {
                        showToast('Hinweis', 'Aufgabe ist lokal gespeichert.', 'ℹ️');
                      }
                    }}
                    className="tw-glow-btn px-2.5 py-2 rounded-xl text-xs font-black"
                  >
                    📲 Ping
                  </button>

                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task);
                      }}
                      className="tw-nav-inactive p-2 rounded-xl text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {sortedDoneTasks.length > 0 && (
          <div className="pt-3.5 mt-3.5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-emerald-400">
                ☑️ Erledigt ({sortedDoneTasks.length})
              </span>
              {onClearDoneTasks && (
                <button
                  type="button"
                  onClick={() => onClearDoneTasks(sortedDoneTasks)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-[11px] font-black flex items-center gap-1 shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Erledigte leeren</span>
                </button>
              )}
            </div>

            {sortedDoneTasks.map(task => {
              const mem = safeMembers.find(m => m.id === task.member) || safeMembers[1];
              return (
                <div
                  key={task.id}
                  className={'p-2.5 rounded-xl border flex items-center justify-between gap-2 ' + themeStyles.subtle}
                >
                  <div
                    onClick={() => onToggleTask(task)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 opacity-65 cursor-pointer"
                  >
                    <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-500 rounded shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold line-through truncate">{task.title}</div>
                      <div className="text-[10px] opacity-75">👤 {mem.name.split(' ')[0]}</div>
                    </div>
                  </div>

                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task)}
                      className="tw-nav-inactive p-1.5 rounded-xl text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
