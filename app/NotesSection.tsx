// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { QrCode, FolderKanban } from 'lucide-react';

export default function NotesSection({
  members,
  familyNotes,
  setFamilyNotes,
  addItemToNoteTile,
  toggleItemInNoteTile,
  deleteItemInNoteTile,
  todoistConfig,
  createAndSelectTodoistProject,
  setQrModalOpen,
  themeStyles
}) {
  const [noteInputs, setNoteInputs] = useState({});
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Familie');
  const [newNoteProjectId, setNewNoteProjectId] = useState('');

  const projectsList = Array.isArray(todoistConfig?.projects) ? todoistConfig.projects : [];

  const handleCreateNoteTile = async () => {
    const cleanTitle = newNoteTitle.trim() || '📌 Neue Liste';
    let targetProjId = newNoteProjectId;
    if (newNoteProjectId === '__NEW__') {
      const created = await createAndSelectTodoistProject(cleanTitle);
      if (created?.id) targetProjId = String(created.id);
    }
    setFamilyNotes(prev => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: Date.now(),
        title: cleanTitle,
        author: newNoteAuthor,
        color: 'amber',
        todoistProjectId: targetProjId || '',
        items: []
      }
    ]);
    setNewNoteTitle('');
    setNewNoteProjectId('');
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={'p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold">📝 Familien-Notizen & Todoist-Projekt-Kacheln</h2>
            <button
              onClick={() => setQrModalOpen(true)}
              className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> Handy-Einladung & QR-Code
            </button>
          </div>
          <p className={'text-sm font-semibold mt-1 ' + themeStyles.textMuted}>
            Wähle direkt beim Anlegen einer neuen Kachel (oder oben auf jeder bestehenden Kachel) das gewünschte <strong>Todoist-Projekt</strong> aus!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNoteTile(); }}
            placeholder="Titel der neuen Kachel (z.B. Baumarkt)..."
            className={'px-4 py-2.5 rounded-xl border text-sm font-bold w-56 ' + themeStyles.input}
          />
          <select
            value={newNoteProjectId}
            onChange={(e) => setNewNoteProjectId(e.target.value)}
            className={'px-3.5 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
          >
            <option value="" className="bg-slate-800 text-white">📂 Nur lokal (Kein Todoist-Projekt)</option>
            {projectsList.map(p => (
              <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                📂 Todoist: {p.name}
              </option>
            ))}
            <option value="__NEW__" className="bg-slate-800 text-amber-300 font-black">
              ✨ Neues Projekt in Todoist erstellen
            </option>
          </select>
          <select
            value={newNoteAuthor}
            onChange={(e) => setNewNoteAuthor(e.target.value)}
            className={'px-3.5 py-2.5 rounded-xl border text-xs font-bold ' + themeStyles.input}
          >
            {['Familie', ...(Array.isArray(members) ? members : []).filter(m => m.id !== 'all').map(m => m.name)].map(a => (
              <option key={a} value={a} className="bg-slate-800 text-white">👤 {a}</option>
            ))}
          </select>
          <button
            onClick={handleCreateNoteTile}
            className="tw-glow-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            + Neue Kachel anlegen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(Array.isArray(familyNotes) ? familyNotes : []).map((note, noteIdx) => {
          const activeProjId = noteIdx === 0
            ? (note.todoistProjectId || todoistConfig?.shoppingProjectId || '')
            : (note.todoistProjectId || '');

          return (
            <div key={note.id} className={'rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between min-h-[450px] ' + themeStyles.card}>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                    className="font-extrabold text-xl bg-transparent focus:outline-none flex-1 min-w-0"
                  />
                  <span className={'px-3 py-1 rounded-full text-xs font-extrabold border ' + themeStyles.subtle}>{note.author}</span>
                  {noteIdx > 0 && (
                    <button
                      onClick={() => setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== note.id))}
                      className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={'flex items-center gap-2 mb-3 pb-3 border-b ' + themeStyles.divider}>
                  <FolderKanban className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-[11px] font-black uppercase opacity-75 shrink-0">Todoist-Projekt:</span>
                  <select
                    value={activeProjId}
                    onChange={async (e) => {
                      const val = e.target.value;
                      if (val === '__NEW__') {
                        const created = await createAndSelectTodoistProject(note.title);
                        if (created?.id) {
                          setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === note.id ? { ...n, todoistProjectId: String(created.id) } : n));
                        }
                      } else {
                        setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === note.id ? { ...n, todoistProjectId: val } : n));
                      }
                    }}
                    className={'flex-1 px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer ' + themeStyles.input}
                  >
                    <option value="" className="bg-slate-800 text-white">-- Lokal (Kein Todoist-Projekt) --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={String(p.id)} className="bg-slate-800 text-white">
                        📂 {p.name}
                      </option>
                    ))}
                    <option value="__NEW__" className="bg-slate-800 text-amber-300 font-black">
                      ✨ Neues Todoist-Projekt für diese Kachel anlegen
                    </option>
                  </select>
                </div>

                <ul className="space-y-2 my-1 flex-1">
                  {(Array.isArray(note.items) ? note.items : []).map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => toggleItemInNoteTile(note.id, idx)}
                      className={'flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-bold cursor-pointer ' + themeStyles.subtle}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          readOnly
                          className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className={'break-words ' + (item.done ? 'line-through opacity-50' : '')}>{item.text}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItemInNoteTile(note.id, idx);
                        }}
                        className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={'mt-4 pt-4 border-t flex gap-2 ' + themeStyles.divider}>
                <input
                  type="text"
                  value={noteInputs[note.id] || ''}
                  onChange={(e) => setNoteInputs({ ...noteInputs, [note.id]: e.target.value })}
                  onKeyDown={(e) => {
                    const val = (noteInputs[note.id] || '').trim();
                    if (e.key === 'Enter' && val) {
                      addItemToNoteTile(note.id, val);
                      setNoteInputs({ ...noteInputs, [note.id]: '' });
                    }
                  }}
                  placeholder="Neuen Punkt eintragen..."
                  className={'flex-1 px-4 py-3 rounded-2xl border text-sm font-semibold ' + themeStyles.input}
                />
                <button
                  onClick={() => {
                    const val = (noteInputs[note.id] || '').trim();
                    if (!val) return;
                    addItemToNoteTile(note.id, val);
                    setNoteInputs({ ...noteInputs, [note.id]: '' });
                  }}
                  className="tw-glow-btn w-12 h-12 rounded-2xl text-xl font-bold cursor-pointer"
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
