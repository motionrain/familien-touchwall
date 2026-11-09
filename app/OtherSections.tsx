// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, RefreshCw, Cloud, Upload, Download, Check } from 'lucide-react';
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

  // =========================================================
  // ANSICHT 4: SCHULE
  // =========================================================
  if (activeSection === 'schule') {
    const childMember = members.find(m => m.id === activeSchoolChild) || members[3];
    const sched = schoolData[activeSchoolChild];
    const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div className="flex items-center gap-4">
            {renderAvatar(childMember, 'w-14 h-14', 'text-2xl')}
            <div>
              <h2 className="text-2xl font-extrabold">Stundenplan & Schul-Änderungen ({childMember.name})</h2>
              <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Tippe auf eine Stunde zum Ändern.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setActiveSchoolChild('dean')}
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm cursor-pointer ${activeSchoolChild === 'dean' ? 'bg-indigo-600 text-white shadow-md' : themeStyles.subtle}`}
            >
              👦 {members.find(m => m.id === 'dean')?.name || 'Dean'}
            </button>
            <button
              onClick={() => setActiveSchoolChild('valentina')}
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm cursor-pointer ${activeSchoolChild === 'valentina' ? 'bg-indigo-600 text-white shadow-md' : themeStyles.subtle}`}
            >
              👧 {members.find(m => m.id === 'valentina')?.name || 'Valentina'}
            </button>
            <button
              onClick={() => {
                setSchoolData(prev => ({
                  ...prev,
                  [activeSchoolChild]: {
                    ...prev[activeSchoolChild],
                    periods: [...prev[activeSchoolChild].periods, `${prev[activeSchoolChild].periods.length + 1}. Std (Nachmittag)`]
                  }
                }));
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm cursor-pointer"
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
              {sched.periods.map((periodLabel, pIdx) => (
                <tr key={pIdx}>
                  <td className={`p-3.5 border-r-2 font-bold text-sm ${themeStyles.subtle} ${themeStyles.divider}`}>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={periodLabel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSchoolData(prev => {
                            const nextP = [...prev[activeSchoolChild].periods];
                            nextP[pIdx] = val;
                            return { ...prev, [activeSchoolChild]: { ...prev[activeSchoolChild], periods: nextP } };
                          });
                        }}
                        className="w-full bg-transparent font-extrabold focus:outline-none"
                      />
                      {sched.periods.length > 1 && (
                        <button
                          onClick={() => {
                            setSchoolData(prev => ({
                              ...prev,
                              [activeSchoolChild]: {
                                ...prev[activeSchoolChild],
                                periods: prev[activeSchoolChild].periods.filter((_, i) => i !== pIdx)
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
                    const slot = sched.slots[key] || { subject: '', room: '', status: 'normal' };
                    const childSt = getMemberStyles(childMember);

                    return (
                      <td
                        key={dIdx}
                        onClick={() => setSchoolModal({ open: true, dayIdx: dIdx, periodIdx: pIdx, subject: slot.subject || '', room: slot.room || '', status: slot.status || 'normal' })}
                        className={`p-2 border-r-2 align-top cursor-pointer hover:bg-indigo-500/10 ${themeStyles.divider}`}
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
            <h3 className="font-extrabold text-lg sm:text-xl">📌 Aktuelle Schul-Änderungen & Hausaufgaben ({childMember.name})</h3>
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
                        announcements: [newSchoolNote.trim(), ...prev[activeSchoolChild].announcements]
                      }
                    }));
                    setNewSchoolNote('');
                  }
                }}
                placeholder="z.B. Freitag 5. Stunde fällt aus..."
                className={`flex-1 md:w-96 px-4 py-3 rounded-xl border text-sm font-semibold ${themeStyles.input}`}
              />
              <button
                onClick={() => {
                  if (!newSchoolNote.trim()) return;
                  setSchoolData(prev => ({
                    ...prev,
                    [activeSchoolChild]: {
                      ...prev[activeSchoolChild],
                      announcements: [newSchoolNote.trim(), ...prev[activeSchoolChild].announcements]
                    }
                  }));
                  setNewSchoolNote('');
                }}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
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
                        announcements: prev[activeSchoolChild].announcements.filter((_, i) => i !== idx)
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

  // =========================================================
  // ANSICHT 6: ESSENSPLAN (DIREKT IN TODOIST-EINKAUFSLISTE)
  // =========================================================
  if (activeSection === 'essen') {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div>
            <h2 className="text-2xl font-extrabold">🍲 Familien-Essensplan & Todoist-Zutaten</h2>
            <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>
              Ein Klick auf „🛒 In Einkaufsliste“ überträgt alle fehlenden Zutaten sofort in eure Todoist-Einkaufsliste & Kachel!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={newMealDay}
              onChange={(e) => setNewMealDay(e.target.value)}
              placeholder="Tag / Name"
              className={`px-4 py-3 rounded-xl border text-sm font-bold w-48 ${themeStyles.input}`}
            />
            <input
              type="text"
              value={newMealDish}
              onChange={(e) => setNewMealDish(e.target.value)}
              placeholder="Gericht / Rezept..."
              className={`px-4 py-3 rounded-xl border text-sm font-bold w-56 ${themeStyles.input}`}
            />
            <button
              onClick={() => {
                setMealPlan(prev => [...prev, { id: Date.now(), dayLabel: newMealDay.trim() || 'Zusatz-Tag', dish: newMealDish.trim() || '🍲 Wunschgericht', ingredients: [] }]);
                setNewMealDay('');
                setNewMealDish('');
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
            >
              + Essens-Block
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mealPlan.map(meal => {
            const missing = meal.ingredients.filter(i => !i.done);
            return (
              <div key={meal.id} className={`rounded-3xl border-2 shadow-sm flex flex-col justify-between overflow-hidden min-h-[420px] ${themeStyles.card}`}>
                <div className="flex-1 flex flex-col">
                  <div className={`px-5 py-4 border-b flex items-center justify-between gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                    <input
                      type="text"
                      value={meal.dayLabel}
                      onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dayLabel: e.target.value } : m))}
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
                      onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dish: e.target.value } : m))}
                      className={`w-full px-4 py-3 rounded-2xl border font-extrabold text-base ${themeStyles.input}`}
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-extrabold uppercase ${themeStyles.textMuted}`}>Zutaten ({meal.ingredients.length})</span>
                      <button
                        onClick={() => {
                          if (missing.length === 0) {
                            showToast('Alles da', 'Alle Zutaten sind bereits vorhanden!', '✅');
                            return;
                          }
                          addShoppingItemsBatch(missing.map(i => `${i.name} (${meal.dayLabel})`));
                        }}
                        className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer shadow-xs"
                      >
                        🛒 In Todoist-Einkaufsliste
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {meal.ingredients.map((ing, iIdx) => (
                        <div key={iIdx} className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl border text-sm ${themeStyles.subtle}`}>
                          <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={ing.done}
                              onChange={() => {
                                setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                                  ...m,
                                  ingredients: m.ingredients.map((item, idx) => idx === iIdx ? { ...item, done: !item.done } : item)
                                } : m));
                              }}
                              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <span className={`font-bold break-words ${ing.done ? 'line-through opacity-50' : ''}`}>{ing.name}</span>
                          </label>
                          <button
                            onClick={() => {
                              setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                                ...m,
                                ingredients: m.ingredients.filter((_, idx) => idx !== iIdx)
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
                        setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
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
                      setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
                      setIngInputs({ ...ingInputs, [meal.id]: '' });
                    }}
                    className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
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
  // ANSICHT 7: NOTIZEN
  // =========================================================
  if (activeSection === 'listen') {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold">📝 Familien-Notizen & Listen</h2>
              <button
                onClick={() => setQrModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> Handy-App & QR-Code
              </button>
            </div>
            <p className={`text-sm font-semibold mt-1 ${themeStyles.textMuted}`}>
              Der erste Block ist live mit eurer Todoist-Einkaufsliste gekoppelt. Zudem kannst du jeden Punkt mit 1 Klick als Todoist-Aufgabe senden.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Titel (z.B. Baumarkt)"
              className={`px-4 py-3 rounded-xl border text-sm font-bold w-56 ${themeStyles.input}`}
            />
            <select
              value={newNoteAuthor}
              onChange={(e) => setNewNoteAuthor(e.target.value)}
              className={`px-4 py-3 rounded-xl border text-sm font-bold ${themeStyles.input}`}
            >
              {['Familie', ...members.filter(m => m.id !== 'all').map(m => m.name)].map(a => (
                <option key={a} value={a} className="bg-slate-800 text-white">👤 {a}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setFamilyNotes(prev => [...prev, { id: Date.now(), title: newNoteTitle.trim() || '📌 Neue Liste', author: newNoteAuthor, color: 'amber', items: [] }]);
                setNewNoteTitle('');
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
            >
              + Neuer Notizblock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {familyNotes.map((note, noteIdx) => (
            <div key={note.id} className={`rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between min-h-[450px] ${themeStyles.card}`}>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                    className="font-extrabold text-xl bg-transparent focus:outline-none flex-1 min-w-0"
                  />
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${themeStyles.subtle}`}>{note.author}</span>
                  {noteIdx > 0 && (
                    <button
                      onClick={() => setFamilyNotes(prev => prev.filter(n => n.id !== note.id))}
                      className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={`flex flex-wrap items-center gap-2 mb-3 pb-2.5 border-b ${themeStyles.divider}`}>
                  <button
                    onClick={() => {
                      const openTexts = (note.items || []).filter(i => !i.done).map(i => i.text);
                      if (openTexts.length === 0) return;
                      addShoppingItemsBatch(openTexts);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    📲 Offene Punkte an Todoist senden
                  </button>
                </div>

                <ul className="space-y-2 my-1 flex-1">
                  {note.items.map((item, idx) => (
                    <li key={idx} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-bold ${themeStyles.subtle}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          onChange={() => {
                            setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                              ...n,
                              items: n.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it)
                            } : n));
                          }}
                          className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className={`break-words ${item.done ? 'line-through opacity-50' : ''}`}>{item.text}</span>
                      </label>
                      <button
                        onClick={() => {
                          setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                            ...n,
                            items: n.items.filter((_, i) => i !== idx)
                          } : n));
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
                      if (noteIdx === 0) addShoppingItemsBatch([val]);
                      else setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
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
                    if (noteIdx === 0) addShoppingItemsBatch([val]);
                    else setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
                    setNoteInputs({ ...noteInputs, [note.id]: '' });
                  }}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 text-white text-xl font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================
  // ANSICHT 8: DESIGN
  // =========================================================
  if (activeSection === 'design') {
    const boldKeys = Object.keys(COLOR_PALETTES).filter(k => COLOR_PALETTES[k].bold);
    const softKeys = Object.keys(COLOR_PALETTES).filter(k => !COLOR_PALETTES[k].bold);

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${themeStyles.card}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">1. Seiten-Theme & Eigenes Touchwall-Logo</h2>
              <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Wähle dein Seiten-Design (gilt für alle Fenster & Popups) und dein eigenes Logo für oben links.</p>
            </div>

            <div className={`flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border ${themeStyles.subtle}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-xs">FR</span>}
              </div>
              <input
                type="url"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                placeholder="Logo Bild-URL..."
                className={`w-40 px-3 py-1.5 rounded-xl border text-xs font-semibold ${themeStyles.input}`}
              />
              <label className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-500">
                📁 Logo hochladen
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {customLogoUrl && (
                <button onClick={() => setCustomLogoUrl('')} className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-bold cursor-pointer">
                  ✕
                </button>
              )}
              <button
                onClick={restoreScreenshotDefaults}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 text-xs font-extrabold cursor-pointer"
              >
                🔄 Standard-Profil wiederherstellen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {PAGE_THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setCurrentTheme(t.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  currentTheme === t.id
                    ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-400'
                    : `${themeStyles.subtle} hover:border-indigo-400/50`
                }`}
              >
                <div className="font-extrabold text-sm">{t.name}</div>
                <div className={`text-xs mt-1.5 leading-snug ${themeStyles.textMuted}`}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${themeStyles.card}`}>
          <h2 className="text-2xl font-extrabold">2. Persönliche Farbe (Harmonisch gedämpft & Pastell) & Avatar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {members.map(m => {
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

                    <div className={`flex p-1 rounded-xl border text-xs font-bold ${themeStyles.card}`}>
                      {['emoji', 'photo', 'badge'].map(type => (
                        <button
                          key={type}
                          onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, avatarType: type } : item))}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer ${m.avatarType === type ? 'bg-indigo-600 text-white' : ''}`}
                        >
                          {type === 'emoji' ? 'Emoji' : type === 'photo' ? 'Foto' : `Kürzel (${m.badge})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase opacity-75">🔥 Vollton-Farben (im Kalender angenehm abgedämpft):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {boldKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.hex, color: '#fff' }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer ${m.color === cKey ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100'}`}
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
                            onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.light, color: pal.text, border: `2px solid ${pal.hex}` }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer ${m.color === cKey ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-85 hover:opacity-100'}`}
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
                            onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, emoji: em, avatarType: 'emoji' } : item))}
                            className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer ${themeStyles.card} ${m.emoji === em ? 'ring-2 ring-indigo-400' : ''}`}
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
                          onChange={(e) => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, photoUrl: e.target.value } : item))}
                          placeholder="https://... (Bild-URL)"
                          className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold ${themeStyles.input}`}
                        />
                        <label className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">
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

  // =========================================================
  // ANSICHT 9: KONTEN, TODOIST TEAM "FAMILIE RICHTER" & BENUTZERNAMEN
  // =========================================================
  return (
    <div className="p-6 flex flex-col gap-6">

      {/* 1. TODOIST TEAM "FAMILIE RICHTER" ZENTRALE */}
      <div className={`rounded-3xl p-6 shadow-xl border-2 border-rose-500/40 space-y-5 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-extrabold">
              📲 Todoist Team „Familie Richter“ (Echte Handy-Push-Zuweisung)
            </span>
            <h2 className="text-2xl font-extrabold mt-2">Todoist Team & Projekt-Verknüpfung</h2>
            <p className={`text-sm mt-1 ${themeStyles.textMuted}`}>
              Kopiere in Todoist unter <strong>Einstellungen → Integrationen → Entwickler</strong> dein API-Token hier hinein und klicke auf „Team & Projekte laden“.
            </p>
          </div>
          <button
            onClick={connectAndDiscoverTodoist}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" /> Team & Projekte automatisch verbinden
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-2xl border ${themeStyles.subtle}`}>
            <label className="block text-[10px] font-extrabold uppercase text-rose-400 mb-1">
              🔑 Todoist API-Token:
            </label>
            <input
              type="password"
              value={todoistConfig.apiToken || ''}
              onChange={(e) => setTodoistConfig(prev => ({ ...prev, apiToken: e.target.value }))}
              placeholder="Dein Todoist API-Token..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono ${themeStyles.input}`}
            />
          </div>

          <div className={`p-3.5 rounded-2xl border ${themeStyles.subtle}`}>
            <label className="block text-[10px] font-extrabold uppercase text-amber-400 mb-1">
              🛒 Todoist Projekt für Einkaufsliste:
            </label>
            <select
              value={todoistConfig.shoppingProjectId || ''}
              onChange={(e) => setTodoistConfig(prev => ({ ...prev, shoppingProjectId: e.target.value }))}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
            >
              <option value="" className="bg-slate-800 text-white">-- Automatisch / Nach Klick laden --</option>
              {(todoistConfig.projects || []).map(p => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}</option>
              ))}
            </select>
          </div>

          <div className={`p-3.5 rounded-2xl border ${themeStyles.subtle}`}>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-400 mb-1">
              ✅ Todoist Projekt für Familien-Aufgaben:
            </label>
            <select
              value={todoistConfig.tasksProjectId || ''}
              onChange={(e) => setTodoistConfig(prev => ({ ...prev, tasksProjectId: e.target.value }))}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
            >
              <option value="" className="bg-slate-800 text-white">-- Automatisch / Nach Klick laden --</option>
              {(todoistConfig.projects || []).map(p => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. BENUTZERNAMEN, ROLLEN, TODOIST-MITGLIED & GOOGLE KALENDER-ID */}
      <div className={`rounded-3xl border overflow-hidden divide-y ${themeStyles.card} ${themeStyles.divider}`}>
        {members.map(m => {
          const isCustom = !['all', 'hans', 'sarah', 'dean', 'valentina'].includes(m.id);
          const st = getMemberStyles(m);
          return (
            <div key={m.id} style={st.headerStyle} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-[260px] flex-1">
                {renderAvatar(m, 'w-12 h-12', 'text-xl')}
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex-1">
                    <label className={`block text-[10px] font-extrabold uppercase mb-0.5 ${themeStyles.textMuted}`}>
                      Benutzername
                    </label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const newBadge = m.id === 'all' ? 'FR' : (newName.trim().charAt(0).toUpperCase() || m.badge);
                        setMembers(prev => prev.map(item => item.id === m.id ? { ...item, name: newName, badge: newBadge } : item));
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
                        setMembers(prev => prev.map(item => item.id === m.id ? { ...item, role: newRole } : item));
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* TODOIST TEAM-MITGLIED ZUORDNUNG */}
              {m.id !== 'all' && (
                <div className="min-w-[200px]">
                  <label className="block text-[10px] font-extrabold uppercase mb-0.5 text-rose-400">
                    📲 Todoist Team-Account
                  </label>
                  <select
                    value={m.todoistUserId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMembers(prev => prev.map(item => item.id === m.id ? { ...item, todoistUserId: val } : item));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
                  >
                    <option value="" className="bg-slate-800 text-white">-- Nicht zugewiesen --</option>
                    {(todoistConfig.collaborators || []).map(col => (
                      <option key={col.id} value={col.id} className="bg-slate-800 text-white">
                        {col.name} ({col.email || 'Team'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* GOOGLE KALENDER ID */}
              <div className="flex-1 min-w-[230px]">
                <label className={`block text-[10px] font-extrabold uppercase mb-0.5 ${themeStyles.textMuted}`}>
                  Google Kalender-ID
                </label>
                <input
                  type="text"
                  value={m.calendarId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMembers(prev => prev.map(item => item.id === m.id ? { ...item, calendarId: val, ok: Boolean(val.trim()), statusMsg: val.trim() ? 'Bereit' : 'Leer' } : item));
                  }}
                  placeholder={m.id === 'all' ? 'primary' : 'name@gmail.com'}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold ${themeStyles.input}`}
                />
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-4">
                {isCustom && (
                  <button
                    onClick={() => {
                      const filtered = members.filter(item => item.id !== m.id);
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

      {/* 3. GOOGLE APPS SCRIPT BRÜCKE & SYSTEMTEST */}
      <div className={`rounded-3xl p-6 shadow-md border space-y-4 ${themeStyles.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold">☁️ Google Kalender & Cloud-Speicher Brücke</h3>
            <p className={`text-xs ${themeStyles.textMuted}`}>Speichert deine Einstellungen, Todoist-Zuordnungen und Google-Kalender-Termine.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={runAllPermissionsTest}
              disabled={isTestingDiag}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {isTestingDiag ? 'Prüfe...' : '🧪 Lese-/Schreibrechte testen'}
            </button>
            <button
              onClick={() => pullFromCloud(undefined, true)}
              className={`px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer ${themeStyles.subtle}`}
            >
              <RefreshCw className="w-4 h-4" /> Aus Google laden
            </button>
            <button
              onClick={() => pushToCloudAndDrive(members, true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4" /> Alles in Cloud sichern
            </button>
            <button
              onClick={addExtraCalendarAccount}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs cursor-pointer"
            >
              + Weiterer Kalender
            </button>
          </div>
        </div>

        {diagResult && (
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-extrabold ${themeStyles.subtle}`}>
            <div className={diagResult.calendarReadWrite ? 'text-emerald-400' : 'text-rose-400'}>
              {diagResult.calendarReadWrite ? '✅ Google Kalender: OK' : '❌ Kalender Fehler'}
            </div>
            <div className={todoistConfig.apiToken ? 'text-emerald-400' : 'text-amber-400'}>
              {todoistConfig.apiToken ? '✅ Todoist API: Aktiv' : 'ℹ️ Todoist Token noch leer'}
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
