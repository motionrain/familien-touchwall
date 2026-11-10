// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, RefreshCw, Cloud, Check, FolderKanban } from 'lucide-react';
import { COLOR_PALETTES, PAGE_THEMES, AVATAR_EMOJIS } from './touchwallConfig';

export default function OtherSections({
  activeSection,
  members,
  setMembers,
  schoolData,
  setSchoolData,
  activeSchoolChild,
  setActiveSchoolChild,
  setSchoolModal,
  mealPlan,
  setMealPlan,
  familyNotes,
  setFamilyNotes,
  addItemToNoteTile,
  toggleItemInNoteTile,
  deleteItemInNoteTile,
  currentTheme,
  setCurrentTheme,
  customLogoUrl,
  setCustomLogoUrl,
  handleLogoUpload,
  handleMemberPhotoUpload,
  restoreScreenshotDefaults,
  appsScriptUrl,
  setAppsScriptUrl,
  todoistConfig,
  setTodoistConfig,
  connectAndDiscoverTodoist,
  createAndSelectTodoistProject,
  addShoppingItemsBatch,
  runAllPermissionsTest,
  isTestingDiag,
  diagResult,
  pullFromCloud,
  pushToCloudAndDrive,
  addExtraCalendarAccount,
  importBackupJson,
  exportBackupJson,
  setQrModalOpen,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  showToast
}) {
  const [newSchoolNote, setNewSchoolNote] = useState('');
  const [ingInputs, setIngInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [newMealDay, setNewMealDay] = useState('');
  const [newMealDish, setNewMealDish] = useState('');

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Familie');
  const [newNoteProjectId, setNewNoteProjectId] = useState('');

  const projectsList = Array.isArray(todoistConfig?.projects) ? todoistConfig.projects : [];

  if (activeSection === 'schule') {
    const childMember = (Array.isArray(members) ? members : []).find(m => m.id === activeSchoolChild) || members[3] || members[0];
    const sched = schoolData?.[activeSchoolChild] || { periods: [], slots: {}, announcements: [] };
    const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div className="flex items-center gap-4">
            {renderAvatar(childMember, 'w-14 h-14', 'text-2xl')}
            <div>
              <h2 className="text-2xl font-extrabold">Stundenplan & Schul-Änderungen ({childMember?.name})</h2>
              <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Tippe auf eine Stunde zum Ändern.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveSchoolChild('dean')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer ${activeSchoolChild === 'dean' ? 'tw-active-nav' : `tw-nav-inactive ${themeStyles.subtle}`}`}
            >
              👦 {(Array.isArray(members) ? members : []).find(m => m.id === 'dean')?.name || 'Dean'}
            </button>
            <button
              onClick={() => setActiveSchoolChild('valentina')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer ${activeSchoolChild === 'valentina' ? 'tw-active-nav' : `tw-nav-inactive ${themeStyles.subtle}`}`}
            >
              👧 {(Array.isArray(members) ? members : []).find(m => m.id === 'valentina')?.name || 'Valentina'}
            </button>
            <button
              onClick={() => {
                setSchoolData(prev => ({
                  ...prev,
                  [activeSchoolChild]: {
                    ...prev[activeSchoolChild],
                    periods: [...(prev[activeSchoolChild]?.periods || []), `${(prev[activeSchoolChild]?.periods || []).length + 1}. Std (Nachmittag)`]
                  }
                }));
              }}
              className="tw-glow-btn px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer"
            >
              + Weitere Schulstunde
            </button>
          </div>
        </div>

        <div className={`rounded-3xl border-2 shadow-sm overflow-x-auto ${themeStyles.card} ${themeStyles.divider}`}>
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className={`text-sm uppercase font-extrabold tracking-wider ${themeStyles.banner}`}>
                <th className="p-4 text-left w-52 border-r border-slate-700">Stunde / Zeit</th>
                {schoolDays.map(d => <th key={d} className="p-4 text-left border-r border-slate-700">{d}</th>)}
              </tr>
            </thead>
            <tbody className={`divide-y-2 ${themeStyles.divider}`}>
              {(sched.periods || []).map((periodLabel, pIdx) => (
                <tr key={pIdx}>
                  <td className={`p-3.5 border-r-2 font-bold text-sm ${themeStyles.subtle} ${themeStyles.divider}`}>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={periodLabel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSchoolData(prev => {
                            const nextP = [...(prev[activeSchoolChild]?.periods || [])];
                            nextP[pIdx] = val;
                            return { ...prev, [activeSchoolChild]: { ...prev[activeSchoolChild], periods: nextP } };
                          });
                        }}
                        className="w-full bg-transparent font-extrabold focus:outline-none"
                      />
                      {(sched.periods || []).length > 1 && (
                        <button
                          onClick={() => {
                            setSchoolData(prev => ({
                              ...prev,
                              [activeSchoolChild]: {
                                ...prev[activeSchoolChild],
                                periods: (prev[activeSchoolChild]?.periods || []).filter((_, i) => i !== pIdx)
                              }
                            }));
                          }}
                          className="opacity-50 hover:opacity-100 hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  {schoolDays.map((_, dIdx) => {
                    const key = `${dIdx}-${pIdx}`;
                    const slot = sched.slots?.[key] || { subject: '', room: '', status: 'normal' };
                    const childSt = getMemberStyles(childMember);

                    return (
                      <td
                        key={dIdx}
                        onClick={() => setSchoolModal({ open: true, dayIdx: dIdx, periodIdx: pIdx, subject: slot.subject || '', room: slot.room || '', status: slot.status || 'normal' })}
                        className={`p-2 border-r-2 align-top cursor-pointer hover:bg-sky-500/15 transition-colors ${themeStyles.divider}`}
                      >
                        {slot.subject ? (
                          <div
                            style={slot.status === 'normal' ? childSt.cardStyle : undefined}
                            className={`p-3.5 rounded-2xl border min-h-[82px] flex flex-col justify-between shadow-sm ${
                              slot.status === 'change'
                                ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-400'
                                : slot.status === 'exam'
                                ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-2 ring-purple-400'
                                : slot.status === 'cancel'
                                ? 'bg-rose-500/25 border-rose-400 text-rose-300 line-through opacity-80'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-extrabold text-sm sm:text-base">{slot.subject}</span>
                              {slot.status === 'change' && <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">ÄNDERUNG</span>}
                              {slot.status === 'exam' && <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black">ARBEIT/TEST</span>}
                              {slot.status === 'cancel' && <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">ENTFALL</span>}
                            </div>
                            {slot.room && <div className="text-xs font-semibold opacity-90 mt-1">{slot.room}</div>}
                          </div>
                        ) : (
                          <div className={`min-h-[82px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold opacity-40 ${themeStyles.divider}`}>
                            + Fach
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm space-y-4 ${themeStyles.card}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-extrabold text-lg sm:text-xl">📌 Aktuelle Schul-Änderungen & Hausaufgaben ({childMember?.name})</h3>
            <div className="flex gap-2.5 w-full md:w-auto">
              <input
                type="text"
                value={newSchoolNote}
                onChange={(e) => setNewSchoolNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSchoolNote.trim()) {
                    setSchoolData(prev => ({
                      ...prev,
                      [activeSchoolChild]: {
                        ...prev[activeSchoolChild],
                        announcements: [newSchoolNote.trim(), ...(prev[activeSchoolChild]?.announcements || [])]
                      }
                    }));
                    setNewSchoolNote('');
                  }
                }}
                placeholder="z.B. Freitag 5. Stunde fällt aus..."
                className={`flex-1 md:w-96 px-4 py-2.5 rounded-xl border text-sm font-semibold ${themeStyles.input}`}
              />
              <button
                onClick={() => {
                  if (!newSchoolNote.trim()) return;
                  setSchoolData(prev => ({
                    ...prev,
                    [activeSchoolChild]: {
                      ...prev[activeSchoolChild],
                      announcements: [newSchoolNote.trim(), ...(prev[activeSchoolChild]?.announcements || [])]
                    }
                  }));
                  setNewSchoolNote('');
                }}
                className="tw-glow-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                + Eintragen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(sched.announcements || []).map((info, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 text-sm font-bold">
                <span>🔔 {info}</span>
                <button
                  onClick={() => {
                    setSchoolData(prev => ({
                      ...prev,
                      [activeSchoolChild]: {
                        ...prev[activeSchoolChild],
                        announcements: (prev[activeSchoolChild]?.announcements || []).filter((_, i) => i !== idx)
                      }
                    }));
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-rose-500/20 text-amber-400 hover:text-rose-400 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'essen') {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div>
            <h2 className="text-2xl font-extrabold">🍲 Familien-Essensplan & Todoist-Zutaten</h2>
            <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>
              Ein Klick auf „🛒 In Todoist-Einkaufsliste“ überträgt alle fehlenden Zutaten sofort in eure Einkaufslisten-Kachel!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={newMealDay}
              onChange={(e) => setNewMealDay(e.target.value)}
              placeholder="Tag / Name"
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold w-48 ${themeStyles.input}`}
            />
            <input
              type="text"
              value={newMealDish}
              onChange={(e) => setNewMealDish(e.target.value)}
              placeholder="Gericht / Rezept..."
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold w-56 ${themeStyles.input}`}
            />
            <button
              onClick={() => {
                setMealPlan(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), dayLabel: newMealDay.trim() || 'Zusatz-Tag', dish: newMealDish.trim() || '🍲 Wunschgericht', ingredients: [] }]);
                setNewMealDay('');
                setNewMealDish('');
              }}
              className="tw-glow-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              + Essens-Block
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(Array.isArray(mealPlan) ? mealPlan : []).map(meal => {
            const ingList = Array.isArray(meal.ingredients) ? meal.ingredients : [];
            const missing = ingList.filter(i => !i.done);
            return (
              <div key={meal.id} className={`rounded-3xl border-2 shadow-sm flex flex-col justify-between overflow-hidden min-h-[420px] ${themeStyles.card}`}>
                <div className="flex-1 flex flex-col">
                  <div className={`px-5 py-4 border-b flex items-center justify-between gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                    <input
                      type="text"
                      value={meal.dayLabel}
                      onChange={(e) => setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, dayLabel: e.target.value } : m))}
                      className="bg-transparent font-extrabold text-base uppercase tracking-wider flex-1 min-w-0 focus:outline-none"
                    />
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${missing.length === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {missing.length === 0 ? 'Alle da ✓' : `${missing.length} fehlt`}
                    </span>
                  </div>

                  <div className={`p-5 border-b ${themeStyles.divider}`}>
                    <input
                      type="text"
                      value={meal.dish}
                      onChange={(e) => setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, dish: e.target.value } : m))}
                      className={`w-full px-4 py-3 rounded-2xl border font-extrabold text-base ${themeStyles.input}`}
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-extrabold uppercase ${themeStyles.textMuted}`}>Zutaten ({ingList.length})</span>
                      <button
                        onClick={() => {
                          if (missing.length === 0) {
                            showToast('Alles da', 'Alle Zutaten sind bereits vorhanden!', '✅');
                            return;
                          }
                          addShoppingItemsBatch(missing.map(i => `${i.name} (${meal.dayLabel})`));
                        }}
                        className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                      >
                        🛒 In Todoist-Einkaufsliste
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {ingList.map((ing, iIdx) => (
                        <div key={iIdx} className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl border text-sm ${themeStyles.subtle}`}>
                          <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={Boolean(ing.done)}
                              onChange={() => {
                                setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? {
                                  ...m,
                                  ingredients: (Array.isArray(m.ingredients) ? m.ingredients : []).map((item, idx) => idx === iIdx ? { ...item, done: !item.done } : item)
                                } : m));
                              }}
                              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <span className={`font-bold break-words ${ing.done ? 'line-through opacity-50' : ''}`}>{ing.name}</span>
                          </label>
                          <button
                            onClick={() => {
                              setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? {
                                ...m,
                                ingredients: (Array.isArray(m.ingredients) ? m.ingredients : []).filter((_, idx) => idx !== iIdx)
                              } : m));
                            }}
                            className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`p-4 border-t flex gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                  <input
                    type="text"
                    value={ingInputs[meal.id] || ''}
                    onChange={(e) => setIngInputs({ ...ingInputs, [meal.id]: e.target.value })}
                    onKeyDown={(e) => {
                      const val = (ingInputs[meal.id] || '').trim();
                      if (e.key === 'Enter' && val) {
                        setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, ingredients: [...(Array.isArray(m.ingredients) ? m.ingredients : []), { name: val, done: false }] } : m));
                        setIngInputs({ ...ingInputs, [meal.id]: '' });
                      }
                    }}
                    placeholder="Zutat hinzufügen..."
                    className={`flex-1 px-4 py-2 rounded-xl border text-sm font-semibold ${themeStyles.input}`}
                  />
                  <button
                    onClick={() => {
                      const val = (ingInputs[meal.id] || '').trim();
                      if (!val) return;
                      setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, ingredients: [...(Array.isArray(m.ingredients) ? m.ingredients : []), { name: val, done: false }] } : m));
                      setIngInputs({ ...ingInputs, [meal.id]: '' });
                    }}
                    className="tw-glow-btn w-10 h-10 rounded-xl font-bold cursor-pointer"
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

  if (activeSection === 'listen') {
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
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold">📝 Familien-Notizen & Todoist-Projekt-Kacheln</h2>
              <button
                onClick={() => setQrModalOpen(true)}
                className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> Handy-App & QR-Code
              </button>
            </div>
            <p className={`text-sm font-semibold mt-1 ${themeStyles.textMuted}`}>
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
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold w-56 ${themeStyles.input}`}
            />
            <select
              value={newNoteProjectId}
              onChange={(e) => setNewNoteProjectId(e.target.value)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
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
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold ${themeStyles.input}`}
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
              <div key={note.id} className={`rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between min-h-[450px] ${themeStyles.card}`}>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                      className="font-extrabold text-xl bg-transparent focus:outline-none flex-1 min-w-0"
                    />
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${themeStyles.subtle}`}>{note.author}</span>
                    {noteIdx > 0 && (
                      <button
                        onClick={() => setFamilyNotes(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== note.id))}
                        className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${themeStyles.divider}`}>
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
                      className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer ${themeStyles.input}`}
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
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-bold cursor-pointer ${themeStyles.subtle}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(item.done)}
                            readOnly
                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                          />
                          <span className={`break-words ${item.done ? 'line-through opacity-50' : ''}`}>{item.text}</span>
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

                <div className={`mt-4 pt-4 border-t flex gap-2 ${themeStyles.divider}`}>
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
                    className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-semibold ${themeStyles.input}`}
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

  // =========================================================
  // ANSICHT 8: DESIGN (KOMPAKTE THEME-BUTTONS WIE IM HEADER!)
  // =========================================================
  if (activeSection === 'design') {
    const boldKeys = Object.keys(COLOR_PALETTES).filter(k => COLOR_PALETTES[k].bold);
    const softKeys = Object.keys(COLOR_PALETTES).filter(k => !COLOR_PALETTES[k].bold);

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${themeStyles.card}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">1. Seiten-Theme & Eigenes Logo</h2>
              <p className={`text-xs font-semibold ${themeStyles.textMuted}`}>
                Wähle dein Theme – alle Buttons leuchten erst beim Darüberfahren mit der Maus voll auf.
              </p>
            </div>

            <div className={`flex flex-wrap items-center gap-2 p-2 rounded-2xl border ${themeStyles.subtle}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-xs">FR</span>}
              </div>
              <input
                type="url"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                placeholder="Logo Bild-URL..."
                className={`w-36 px-3 py-1.5 rounded-xl border text-xs font-semibold ${themeStyles.input}`}
              />
              <label className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer">
                📁 Logo hochladen
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {customLogoUrl && (
                <button onClick={() => setCustomLogoUrl('')} className="tw-nav-inactive px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                  ✕
                </button>
              )}
              <button
                onClick={restoreScreenshotDefaults}
                className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                🔄 Standard-Profil wiederherstellen
              </button>
            </div>
          </div>

          {/* KOMPAKTE THEME-AUSWAHL-BUTTONS (GENAU SO GROSS WIE IM HEADER) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {PAGE_THEMES.map(t => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCurrentTheme(t.id)}
                  title={t.desc}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 ${
                    isSelected ? 'tw-active-nav' : 'tw-glow-btn'
                  }`}
                >
                  <span>{t.name}</span>
                  {isSelected && <span className="text-[10px] opacity-90">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${themeStyles.card}`}>
          <h2 className="text-xl font-extrabold">2. Persönliche Farbe & Avatar pro Kachel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(Array.isArray(members) ? members : []).map(m => {
              const st = getMemberStyles(m);
              return (
                <div key={m.id} style={st.headerStyle} className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 ${themeStyles.divider}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {renderAvatar(m, 'w-14 h-14', 'text-2xl')}
                      <div>
                        <div className="font-extrabold text-lg">{m.name}</div>
                        <div className={`text-xs font-semibold ${themeStyles.textMuted}`}>{m.role}</div>
                      </div>
                    </div>

                    <div className={`flex gap-1 p-1 rounded-xl border text-xs font-bold ${themeStyles.card}`}>
                      {['emoji', 'photo', 'badge'].map(type => (
                        <button
                          key={type}
                          onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, avatarType: type } : item))}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer ${m.avatarType === type ? 'tw-active-nav' : 'tw-nav-inactive'}`}
                        >
                          {type === 'emoji' ? 'Emoji' : type === 'photo' ? 'Foto' : `Kürzel (${m.badge})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase opacity-75">🔥 Vollton-Farben (harmonisch abgedämpft):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {boldKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.hex, color: '#fff' }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 ${m.color === cKey ? 'ring-2 ring-white scale-105' : 'opacity-75 hover:opacity-100'}`}
                          >
                            {pal.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] font-extrabold uppercase opacity-75 pt-1">🎨 Sanfte Pastell-Farben:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {softKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.light, color: pal.text, border: `2px solid ${pal.hex}` }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 ${m.color === cKey ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-75 hover:opacity-100'}`}
                          >
                            {pal.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`pt-3 border-t ${themeStyles.divider}`}>
                    {m.avatarType === 'emoji' && (
                      <div className="flex flex-wrap gap-1.5">
                        {AVATAR_EMOJIS.map(em => (
                          <button
                            key={em}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, emoji: em, avatarType: 'emoji' } : item))}
                            className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${themeStyles.card} ${m.emoji === em ? 'ring-2 ring-sky-400' : ''}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.avatarType === 'photo' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={m.photoUrl || ''}
                          onChange={(e) => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, photoUrl: e.target.value } : item))}
                          placeholder="https://... (Bild-URL)"
                          className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold ${themeStyles.input}`}
                        />
                        <label className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                          📁 Foto wählen
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMemberPhotoUpload(m.id, e)} />
                        </label>
                      </div>
                    )}
                    {m.avatarType === 'badge' && (
                      <div className="text-xs font-bold opacity-80">Initialen-Kürzel ({m.badge}) aktiv.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={`rounded-3xl p-6 shadow-xl border-2 border-sky-500/40 space-y-4 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold">
              ⚡ 8-Sekunden-Echtzeit-Sync • Todoist Team „Familie Richter“
            </span>
            <h2 className="text-2xl font-extrabold mt-2">Todoist Team-Verbindung</h2>
            <p className={`text-sm mt-1 ${themeStyles.textMuted}`}>
              Hier hinterlegst du nur einmalig dein API-Token. Welches Projekt eine Kachel nutzt, wählst du direkt oben auf der jeweiligen Kachel unter „Todoist“ oder „Notizen“!
            </p>
          </div>
          <button
            onClick={connectAndDiscoverTodoist}
            className="tw-glow-btn px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Team & Projekte aktualisieren
          </button>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-4 ${themeStyles.subtle}`}>
          <span className="text-xs font-extrabold uppercase text-sky-400 shrink-0">🔑 Todoist API-Token:</span>
          <input
            type="password"
            value={todoistConfig?.apiToken || ''}
            onChange={(e) => setTodoistConfig(prev => ({ ...prev, apiToken: e.target.value }))}
            placeholder="Dein Todoist API-Token..."
            className={`flex-1 min-w-[260px] px-4 py-2.5 rounded-xl border text-xs font-mono ${themeStyles.input}`}
          />
          <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
            📂 {projectsList.length} Projekte & 👥 {(Array.isArray(todoistConfig?.collaborators) ? todoistConfig.collaborators : []).length} Team-Mitglieder aktiv
          </span>
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden divide-y ${themeStyles.card} ${themeStyles.divider}`}>
        {(Array.isArray(members) ? members : []).map(m => {
          const isCustom = !['all', 'hans', 'sarah', 'dean', 'valentina'].includes(m.id);
          const st = getMemberStyles(m);
          return (
            <div key={m.id} style={st.headerStyle} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-[260px] flex-1">
                {renderAvatar(m, 'w-12 h-12', 'text-xl')}
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex-1">
                    <label className={`block text-[10px] font-extrabold uppercase mb-0.5 ${themeStyles.textMuted}`}>
                      Benutzername / Kachelname
                    </label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const newBadge = m.id === 'all' ? 'FR' : (newName.trim().charAt(0).toUpperCase() || m.badge);
                        setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, name: newName, badge: newBadge } : item));
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-sm font-extrabold ${themeStyles.input}`}
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className={`block text-[10px] font-extrabold uppercase mb-0.5 ${themeStyles.textMuted}`}>
                      Rolle
                    </label>
                    <input
                      type="text"
                      value={m.role || ''}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, role: newRole } : item));
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                    />
                  </div>
                </div>
              </div>

              {m.id !== 'all' && (
                <div className="min-w-[200px]">
                  <label className="block text-[10px] font-extrabold uppercase mb-0.5 text-sky-400">
                    📲 Todoist Team-Account
                  </label>
                  <select
                    value={m.todoistUserId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, todoistUserId: val } : item));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                  >
                    <option value="" className="bg-slate-800 text-white">-- Nicht zugewiesen --</option>
                    {(Array.isArray(todoistConfig?.collaborators) ? todoistConfig.collaborators : []).map(col => (
                      <option key={col.id} value={col.id} className="bg-slate-800 text-white">
                        {col.name} ({col.email || 'Team'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 min-w-[230px]">
                <label className={`block text-[10px] font-extrabold uppercase mb-0.5 ${themeStyles.textMuted}`}>
                  Google Kalender-ID
                </label>
                <input
                  type="text"
                  value={m.calendarId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, calendarId: val, ok: Boolean(val.trim()), statusMsg: val.trim() ? 'Bereit' : 'Leer' } : item));
                  }}
                  placeholder={m.id === 'all' ? 'primary' : 'name@gmail.com'}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold ${themeStyles.input}`}
                />
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-4">
                {isCustom && (
                  <button
                    onClick={() => {
                      const filtered = (Array.isArray(members) ? members : []).filter(item => item.id !== m.id);
                      setMembers(filtered);
                      pushToCloudAndDrive(filtered, true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-extrabold cursor-pointer"
                  >
                    🗑️
                  </button>
                )}
                <span className={`px-3 py-2 rounded-xl text-xs font-extrabold ${m.calendarId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {m.statusMsg || (m.calendarId ? 'Verbunden ✓' : 'Bereit')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-3xl p-6 shadow-md border space-y-4 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold">☁️ Google Kalender & Cloud-Speicher Brücke</h3>
            <p className={`text-xs ${themeStyles.textMuted}`}>Speichert deine Einstellungen, Kachel-Projekte und Google-Kalender-Termine.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={runAllPermissionsTest}
              disabled={isTestingDiag}
              className="tw-glow-btn px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {isTestingDiag ? 'Prüfe...' : '🧪 Lese-/Schreibrechte testen'}
            </button>
            <button
              onClick={() => pullFromCloud(undefined, true)}
              className="tw-glow-btn px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Aus Google laden
            </button>
            <button
              onClick={() => pushToCloudAndDrive(members, true)}
              className="tw-glow-btn px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4" /> Alles in Cloud sichern
            </button>
            <button
              onClick={addExtraCalendarAccount}
              className="tw-glow-btn px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer"
            >
              + Weiterer Kalender / Person
            </button>
          </div>
        </div>

        {diagResult && (
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-extrabold ${themeStyles.subtle}`}>
            <div className={diagResult.calendarReadWrite ? 'text-emerald-400' : 'text-rose-400'}>
              {diagResult.calendarReadWrite ? '✅ Google Kalender: OK' : '❌ Kalender Fehler'}
            </div>
            <div className={todoistConfig?.apiToken ? 'text-emerald-400' : 'text-amber-400'}>
              {todoistConfig?.apiToken ? '✅ Todoist API: Aktiv' : 'ℹ️ Todoist Token noch leer'}
            </div>
            <div className={diagResult.propertiesReadWrite ? 'text-emerald-400' : 'text-rose-400'}>
              {diagResult.propertiesReadWrite ? '✅ Cloud-Properties: OK' : '❌ Properties Fehler'}
            </div>
            <div className="flex gap-2 justify-end">
              <label className="text-indigo-400 underline cursor-pointer">
                JSON Import <input type="file" accept=".json" className="hidden" onChange={importBackupJson} />
              </label>
              <button onClick={exportBackupJson} className="text-emerald-400 underline cursor-pointer">JSON Export</button>
            </div>
          </div>
        )}

        <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center gap-3 ${themeStyles.subtle}`}>
          <span className="text-xs font-extrabold uppercase text-amber-400 shrink-0">🔗 Apps-Script URL:</span>
          <input
            type="url"
            value={appsScriptUrl}
            onChange={(e) => {
              setAppsScriptUrl(e.target.value);
              try { localStorage.setItem('richter_tw_gas_url', e.target.value); } catch (err) {}
            }}
            className={`flex-1 min-w-[260px] px-3.5 py-2 rounded-xl border text-xs font-mono ${themeStyles.input}`}
          />
        </div>
      </div>
    </div>
  );
}
