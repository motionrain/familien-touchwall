// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus, Users, CheckSquare, Send, Trash2,
  Pencil, Check, X, Calendar, Sparkles
} from 'lucide-react';
import * as Cfg from './touchwallConfig';

const { DEFAULT_SCHOOL, formatDateStr } = Cfg;

const DEFAULT_PERIODS_TEMPLATE = [
  '1. Std (07:45 - 08:30)',
  '2. Std (08:35 - 09:20)',
  '3. Std (09:40 - 10:25)',
  '4. Std (10:30 - 11:15)',
  '5. Std (11:30 - 12:15)',
  '6. Std (12:20 - 13:05)'
];

export default function SchoolSection({
  members,
  schoolData,
  setSchoolData,
  activeSchoolChild,
  setActiveSchoolChild,
  setSchoolModal,
  addNewTaskWithSettings,
  todayStr,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  showToast
}) {
  const [newSchoolNote, setNewSchoolNote] = useState('');
  const [noteDueDate, setNoteDueDate] = useState(todayStr || formatDateStr(new Date()));
  const [autoPushNoteToTodo, setAutoPushNoteToTodo] = useState(true);
  const [noteTargetMember, setNoteTargetMember] = useState('assigned'); // 'assigned' oder spezifische member.id

  // Modal / Leiste zum Erstellen & Bearbeiten von Stundenplänen + Personen-Zuweisung
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [manageMode, setManageMode] = useState('edit'); // 'create' | 'edit'
  const [planFormTitle, setPlanFormTitle] = useState('');
  const [planFormMembers, setPlanFormMembers] = useState([]);

  const safeMembers = useMemo(() => {
    return (Array.isArray(members) ? members : []).filter(m => m && m.id !== 'all');
  }, [members]);

  // Alle Stundenpläne aus schoolData normalisieren (inkl. Rückwärtskompatibilität für dean & valentina)
  const normalizedPlans = useMemo(() => {
    const raw = schoolData && typeof schoolData === 'object' ? schoolData : DEFAULT_SCHOOL;
    const keys = Object.keys(raw).length > 0 ? Object.keys(raw) : ['dean', 'valentina'];

    return keys.map((key, idx) => {
      const item = raw[key] || {};
      const defaultAssigned =
        Array.isArray(item.assignedMembers) && item.assignedMembers.length > 0
          ? item.assignedMembers
          : safeMembers.some(m => m.id === key)
          ? [key]
          : safeMembers[idx]
          ? [safeMembers[idx].id]
          : safeMembers[0]
          ? [safeMembers[0].id]
          : ['hans'];

      const assignedObjs = defaultAssigned
        .map(mid => safeMembers.find(m => m.id === mid))
        .filter(Boolean);

      const fallbackTitle =
        item.title ||
        (assignedObjs.length > 0
          ? assignedObjs.map(m => m.name.split(' ')[0]).join(' & ')
          : ('Stundenplan ' + (idx + 1)));

      const rawAnnouncements = Array.isArray(item.announcements) ? item.announcements : [];
      const normalizedAnnouncements = rawAnnouncements.map((ann, aIdx) => {
        if (typeof ann === 'string') {
          return {
            id: 'ann_' + key + '_' + aIdx,
            text: ann,
            dueDate: '',
            pushedToTodo: false
          };
        }
        return {
          id: ann?.id || ('ann_' + key + '_' + aIdx),
          text: ann?.text || '',
          dueDate: ann?.dueDate || '',
          pushedToTodo: Boolean(ann?.pushedToTodo)
        };
      });

      return {
        id: key,
        title: fallbackTitle,
        assignedMembers: defaultAssigned,
        assignedMemberObjs: assignedObjs,
        periods: Array.isArray(item.periods) && item.periods.length > 0 ? item.periods : DEFAULT_PERIODS_TEMPLATE,
        slots: item.slots && typeof item.slots === 'object' ? item.slots : {},
        announcements: normalizedAnnouncements
      };
    });
  }, [schoolData, safeMembers]);

  const activePlan = useMemo(() => {
    return normalizedPlans.find(p => p.id === activeSchoolChild) || normalizedPlans[0];
  }, [normalizedPlans, activeSchoolChild]);

  const primaryMemberForColor = useMemo(() => {
    return activePlan?.assignedMemberObjs?.[0] || safeMembers[0] || { id: 'dean', name: 'Schule', color: 'crimson_bold', badge: 'S' };
  }, [activePlan, safeMembers]);

  const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

  // Öffnet das Fenster zum Anlegen eines neuen Stundenplans
  const openCreateNewPlanModal = () => {
    setManageMode('create');
    setPlanFormTitle('');
    setPlanFormMembers(safeMembers[0] ? [safeMembers[0].id] : []);
    setShowManagePlanModal(true);
  };

  // Öffnet das Fenster zum Zuweisen mehrerer Personen & Umbenennen des aktuellen Plans
  const openEditCurrentPlanModal = () => {
    if (!activePlan) return;
    setManageMode('edit');
    setPlanFormTitle(activePlan.title);
    setPlanFormMembers(activePlan.assignedMembers);
    setShowManagePlanModal(true);
  };

  const toggleMemberInPlanForm = (memberId) => {
    setPlanFormMembers(prev =>
      prev.includes(memberId)
        ? (prev.length > 1 ? prev.filter(id => id !== memberId) : prev)
        : [...prev, memberId]
    );
  };

  const handleSavePlanModal = (e) => {
    e.preventDefault();
    const chosenMembers = planFormMembers.length > 0
      ? planFormMembers
      : (safeMembers[0] ? [safeMembers[0].id] : ['hans']);

    const memberNamesTitle = chosenMembers
      .map(id => safeMembers.find(m => m.id === id)?.name?.split(' ')[0])
      .filter(Boolean)
      .join(' & ');

    const finalTitle = planFormTitle.trim() || memberNamesTitle || 'Neuer Stundenplan';

    if (manageMode === 'create') {
      const newPlanId = 'plan_' + Date.now();
      setSchoolData(prev => ({
        ...(prev || {}),
        [newPlanId]: {
          title: finalTitle,
          assignedMembers: chosenMembers,
          periods: [...DEFAULT_PERIODS_TEMPLATE],
          slots: {},
          announcements: []
        }
      }));
      setActiveSchoolChild(newPlanId);
      showToast?.('Stundenplan erstellt!', '„' + finalTitle + '“ wurde angelegt.', '🎓');
    } else if (activePlan) {
      setSchoolData(prev => ({
        ...(prev || {}),
        [activePlan.id]: {
          ...(prev?.[activePlan.id] || {}),
          title: finalTitle,
          assignedMembers: chosenMembers,
          periods: activePlan.periods,
          slots: activePlan.slots,
          announcements: activePlan.announcements
        }
      }));
      showToast?.('Stundenplan aktualisiert', 'Zugewiesene Personen & Name wurden gespeichert.', '✅');
    }

    setShowManagePlanModal(false);
  };

  const handleDeleteCurrentPlan = () => {
    if (!activePlan || normalizedPlans.length <= 1) {
      showToast?.('Hinweis', 'Mindestens ein Stundenplan muss erhalten bleiben.', '⚠️');
      return;
    }
    const remainingPlans = normalizedPlans.filter(p => p.id !== activePlan.id);
    setSchoolData(prev => {
      const copy = { ...(prev || {}) };
      delete copy[activePlan.id];
      return copy;
    });
    setActiveSchoolChild(remainingPlans[0].id);
    setShowManagePlanModal(false);
    showToast?.('Stundenplan gelöscht', '„' + activePlan.title + '“ wurde entfernt.', '🗑️');
  };

  // ============================================================================
  // SENDET SCHUL-INFOS, HAUSAUFGABEN ODER PRÜFUNGEN DIREKT AUF DIE TODO-LISTE
  // ============================================================================
  const pushSchoolInfoToTodoList = async (textStr, dueDateStr = '', customTarget = 'assigned') => {
    const cleanText = String(textStr || '').trim();
    if (!cleanText || !activePlan) return;

    const targetIds =
      customTarget === 'assigned'
        ? activePlan.assignedMembers
        : [customTarget];

    const finalTargetIds = targetIds.length > 0 ? targetIds : [primaryMemberForColor.id];

    if (typeof addNewTaskWithSettings === 'function') {
      for (const memberId of finalTargetIds) {
        await addNewTaskWithSettings(
          '🎓 ' + activePlan.title + ': ' + cleanText,
          memberId,
          dueDateStr || todayStr || formatDateStr(new Date()),
          '17:00',
          '15m',
          false,
          3,
          'Aus dem Stundenplan (' + activePlan.title + ') übernommen'
        );
      }
      const targetNames = finalTargetIds
        .map(id => safeMembers.find(m => m.id === id)?.name?.split(' ')[0] || id)
        .join(', ');
      showToast?.('Auf Todo-Liste gesetzt! ✅', cleanText + ' → ' + targetNames, '📲');
    } else {
      showToast?.('Hinweis', 'Aufgaben-Modul wird geladen.', 'ℹ️');
    }
  };

  const handleAddAnnouncement = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const clean = newSchoolNote.trim();
    if (!clean || !activePlan) return;

    const newEntry = {
      id: 'ann_' + Date.now(),
      text: clean,
      dueDate: noteDueDate || '',
      pushedToTodo: Boolean(autoPushNoteToTodo)
    };

    setSchoolData(prev => ({
      ...(prev || {}),
      [activePlan.id]: {
        ...(prev?.[activePlan.id] || {}),
        title: activePlan.title,
        assignedMembers: activePlan.assignedMembers,
        periods: activePlan.periods,
        slots: activePlan.slots,
        announcements: [newEntry, ...(activePlan.announcements || [])]
      }
    }));

    setNewSchoolNote('');

    if (autoPushNoteToTodo) {
      await pushSchoolInfoToTodoList(clean, noteDueDate, noteTargetMember);
    } else {
      showToast?.('Schul-Info eingetragen', clean, '📌');
    }
  };

  const handleManualPushExistingAnnouncement = async (annObj, idx) => {
    if (!annObj || !activePlan) return;
    await pushSchoolInfoToTodoList(annObj.text, annObj.dueDate || todayStr, noteTargetMember);

    setSchoolData(prev => {
      const currentList = [...(activePlan.announcements || [])];
      currentList[idx] = { ...annObj, pushedToTodo: true };
      return {
        ...(prev || {}),
        [activePlan.id]: {
          ...(prev?.[activePlan.id] || {}),
          title: activePlan.title,
          assignedMembers: activePlan.assignedMembers,
          periods: activePlan.periods,
          slots: activePlan.slots,
          announcements: currentList
        }
      };
    });
  };

  if (!activePlan) return null;

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-4">
      {/* ============================================================================
          KOPFLEISTE: STUNDENPLAN-AUSWAHL, MULTI-PERSONEN-ZUWEISUNG & + NEUER PLAN
         ============================================================================ */}
      <div className={'p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Stapel-Avatare aller diesem Stundenplan zugewiesenen Personen */}
          <div className="flex items-center -space-x-2 shrink-0">
            {activePlan.assignedMemberObjs.length > 0 ? (
              activePlan.assignedMemberObjs.map(m => (
                <div key={m.id} className="ring-2 ring-slate-900 rounded-full">
                  {renderAvatar(m, 'w-12 h-12', 'text-lg')}
                </div>
              ))
            ) : (
              renderAvatar(primaryMemberForColor, 'w-12 h-12', 'text-lg')
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black truncate">
                {activePlan.title}
              </h2>
              <button
                type="button"
                onClick={openEditCurrentPlanModal}
                className="tw-nav-inactive px-2.5 py-1 rounded-xl text-xs font-extrabold text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Personen & Name ({activePlan.assignedMemberObjs.length})</span>
              </button>
            </div>
            <p className={'text-xs font-bold mt-0.5 ' + themeStyles.textMuted}>
              Zugewiesen an:{' '}
              <span className="text-sky-300">
                {activePlan.assignedMemberObjs.map(m => m.name).join(', ') || 'Alle'}
              </span>
              {' '}• Tippe auf ein Fach zum Bearbeiten
            </p>
          </div>
        </div>

        {/* STUNDENPLAN-TABS + NEUER STUNDENPLAN + WEITERE STUNDE */}
        <div className="flex items-center gap-2 flex-wrap">
          {normalizedPlans.map(plan => {
            const isAct = plan.id === activePlan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setActiveSchoolChild(plan.id)}
                className={'px-3.5 py-2 rounded-2xl font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all ' +
                  (isAct ? 'tw-active-nav scale-[1.02]' : 'tw-nav-inactive ' + themeStyles.subtle)}
              >
                <div className="flex items-center -space-x-1.5">
                  {plan.assignedMemberObjs.slice(0, 3).map(m => (
                    <div key={m.id} className="rounded-full ring-1 ring-black">
                      {renderAvatar(m, 'w-5 h-5', 'text-[9px]')}
                    </div>
                  ))}
                </div>
                <span>{plan.title}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={openCreateNewPlanModal}
            className="tw-glow-btn px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Neuer Stundenplan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSchoolData(prev => ({
                ...(prev || {}),
                [activePlan.id]: {
                  ...(prev?.[activePlan.id] || {}),
                  title: activePlan.title,
                  assignedMembers: activePlan.assignedMembers,
                  slots: activePlan.slots,
                  announcements: activePlan.announcements,
                  periods: [...activePlan.periods, (activePlan.periods.length + 1) + '. Std (Nachmittag)']
                }
              }));
            }}
            className="tw-nav-inactive px-3.5 py-2 rounded-2xl font-extrabold text-xs cursor-pointer"
          >
            + Schulstunde
          </button>
        </div>
      </div>

      {/* ============================================================================
          STUNDENPLAN-TABELLE (INKL. 1-KLICK TODO-ÜBERNAHME BEI PRÜFUNGEN / ÄNDERUNGEN)
         ============================================================================ */}
      <div className={'rounded-3xl border-2 shadow-sm overflow-x-auto ' + themeStyles.card + ' ' + themeStyles.divider}>
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className={'text-xs sm:text-sm uppercase font-black tracking-wider ' + themeStyles.banner}>
              <th className="p-3.5 text-left w-52 border-r border-slate-700">Stunde / Zeit</th>
              {schoolDays.map(d => (
                <th key={d} className="p-3.5 text-left border-r border-slate-700">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className={'divide-y-2 ' + themeStyles.divider}>
            {activePlan.periods.map((periodLabel, pIdx) => (
              <tr key={pIdx}>
                <td className={'p-3 border-r-2 font-bold text-sm ' + themeStyles.subtle + ' ' + themeStyles.divider}>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={periodLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchoolData(prev => {
                          const nextP = [...activePlan.periods];
                          nextP[pIdx] = val;
                          return {
                            ...(prev || {}),
                            [activePlan.id]: {
                              ...(prev?.[activePlan.id] || {}),
                              title: activePlan.title,
                              assignedMembers: activePlan.assignedMembers,
                              slots: activePlan.slots,
                              announcements: activePlan.announcements,
                              periods: nextP
                            }
                          };
                        });
                      }}
                      className="w-full bg-transparent font-extrabold focus:outline-none"
                    />
                    {activePlan.periods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSchoolData(prev => ({
                            ...(prev || {}),
                            [activePlan.id]: {
                              ...(prev?.[activePlan.id] || {}),
                              title: activePlan.title,
                              assignedMembers: activePlan.assignedMembers,
                              slots: activePlan.slots,
                              announcements: activePlan.announcements,
                              periods: activePlan.periods.filter((_, i) => i !== pIdx)
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

                {schoolDays.map((dayName, dIdx) => {
                  const key = dIdx + '-' + pIdx;
                  const slot = activePlan.slots?.[key] || { subject: '', room: '', status: 'normal' };
                  const childSt = getMemberStyles(primaryMemberForColor);
                  const statusClass =
                    slot.status === 'change'
                      ? 'bg-amber-500/25 border-2 border-amber-400 text-amber-200'
                      : slot.status === 'exam'
                      ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-100'
                      : slot.status === 'cancel'
                      ? 'bg-rose-500/25 border-2 border-rose-400 text-rose-200 line-through opacity-85'
                      : '';

                  return (
                    <td
                      key={dIdx}
                      onClick={() =>
                        setSchoolModal({
                          open: true,
                          dayIdx: dIdx,
                          periodIdx: pIdx,
                          subject: slot.subject || '',
                          room: slot.room || '',
                          status: slot.status || 'normal'
                        })
                      }
                      className={'p-2 border-r-2 align-top cursor-pointer hover:bg-sky-500/10 transition-colors ' + themeStyles.divider}
                    >
                      {slot.subject ? (
                        <div
                          style={slot.status === 'normal' ? childSt.cardStyle : undefined}
                          className={'p-3 rounded-2xl border min-h-[82px] flex flex-col justify-between shadow-sm ' + statusClass}
                        >
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className="font-black text-sm sm:text-base">{slot.subject}</span>
                            {slot.status === 'change' && (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                                ÄNDERUNG
                              </span>
                            )}
                            {slot.status === 'exam' && (
                              <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black">
                                ARBEIT/TEST
                              </span>
                            )}
                            {slot.status === 'cancel' && (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                                ENTFALL
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="text-xs font-bold opacity-90 truncate">
                              {slot.room || ''}
                            </span>

                            {/* 1-Klick Todo-Übernahme direkt aus dem Stundenplan für Prüfungen & Änderungen */}
                            {(slot.status === 'exam' || slot.status === 'change') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const label = slot.status === 'exam' ? '📝 Arbeit/Test: ' : '⚠️ Änderung: ';
                                  pushSchoolInfoToTodoList(
                                    label + slot.subject + ' (' + dayName + ', ' + periodLabel.split(' ')[0] + ')',
                                    todayStr,
                                    'assigned'
                                  );
                                }}
                                title="Direkt auf die Todo-Liste der zugewiesenen Person(en) setzen"
                                className="px-2 py-0.5 rounded-lg bg-black/45 hover:bg-black/70 border border-white/20 text-[10px] font-black text-sky-200 flex items-center gap-1 shrink-0"
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span>+Todo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={'min-h-[82px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold opacity-40 ' + themeStyles.divider}>
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

      {/* ============================================================================
          WICHTIGE SCHUL-INFOS, HAUSAUFGABEN & DIREKTE TODO-LISTEN-ÜBERNAHME
         ============================================================================ */}
      <div className={'rounded-3xl border p-5 shadow-sm space-y-4 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg sm:text-xl flex items-center gap-2">
              <span>📌 Wichtige Schul-Infos, Hausaufgaben & To-Do ({activePlan.title})</span>
            </h3>
            <p className="text-xs opacity-75 font-semibold">
              Wichtige Informationen landen auf Wunsch sofort in der persönlichen Todo-Liste (und auf dem Handy).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAutoPushNoteToTodo(prev => !prev)}
              className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border ' +
                (autoPushNoteToTodo
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'tw-nav-inactive opacity-75')}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{autoPushNoteToTodo ? '📲 Automatisch auf Todo-Liste: AN ✓' : 'Nur hier als Notiz speichern'}</span>
            </button>

            <select
              value={noteTargetMember}
              onChange={(e) => setNoteTargetMember(e.target.value)}
              className={'h-9 px-3 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
            >
              <option value="assigned" className="bg-slate-800 text-sky-300">
                👥 Zugewiesene ({activePlan.assignedMemberObjs.map(m => m.name.split(' ')[0]).join(', ')})
              </option>
              {safeMembers.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                  👤 Nur an {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleAddAnnouncement} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={newSchoolNote}
            onChange={(e) => setNewSchoolNote(e.target.value)}
            placeholder="z.B. Mathe-Arbeit lernen, 20€ Klassenkasse, Elternabend, Sportzeug mitbringen..."
            className={'md:col-span-7 px-4 py-3 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
          />
          <input
            type="date"
            value={noteDueDate}
            onChange={(e) => setNoteDueDate(e.target.value)}
            className={'md:col-span-2 px-3 py-3 rounded-2xl border text-xs font-black ' + themeStyles.input}
          />
          <button
            type="submit"
            className="md:col-span-3 tw-active-nav px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>{autoPushNoteToTodo ? 'Eintragen + auf Todo-Liste' : '+ Nur eintragen'}</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {activePlan.announcements.length === 0 ? (
            <div className="col-span-full py-5 text-center text-xs font-bold opacity-55">
              Noch keine Schul-Infos oder Hausaufgaben für „{activePlan.title}“ eingetragen.
            </div>
          ) : (
            activePlan.announcements.map((infoObj, idx) => (
              <div
                key={infoObj.id || idx}
                className="flex flex-col justify-between gap-2.5 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 text-sm font-bold"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                        📌 INFO
                      </span>
                      {infoObj.dueDate && (
                        <span className="text-[11px] font-black text-amber-300">
                          📅 Bis {infoObj.dueDate.slice(8, 10)}.{infoObj.dueDate.slice(5, 7)}.
                        </span>
                      )}
                      {infoObj.pushedToTodo && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[10px] font-black">
                          ✓ Auf Todo-Liste
                        </span>
                      )}
                    </div>
                    <div className="font-black text-base leading-snug break-words">
                      {infoObj.text}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSchoolData(prev => ({
                        ...(prev || {}),
                        [activePlan.id]: {
                          ...(prev?.[activePlan.id] || {}),
                          title: activePlan.title,
                          assignedMembers: activePlan.assignedMembers,
                          periods: activePlan.periods,
                          slots: activePlan.slots,
                          announcements: activePlan.announcements.filter((_, i) => i !== idx)
                        }
                      }));
                    }}
                    className="w-8 h-8 rounded-xl bg-black/30 hover:bg-rose-500/30 text-amber-300 hover:text-rose-300 font-black cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] opacity-75 font-bold truncate">
                    Für: {activePlan.assignedMemberObjs.map(m => m.name.split(' ')[0]).join(', ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleManualPushExistingAnnouncement(infoObj, idx)}
                    className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{infoObj.pushedToTodo ? 'Erneut an Todo senden' : '📲 Auf Todo-Liste'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================================
          MODAL: STUNDENPLAN ERSTELLEN ODER PERSONEN AUS DEN KONTEN ZUWEISEN
         ============================================================================ */}
      {showManagePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePlanModal}
            className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">
                {manageMode === 'create' ? '🎓 Neuen Stundenplan erstellen' : '👥 Stundenplan & Personen verwalten'}
              </h3>
              <button
                type="button"
                onClick={() => setShowManagePlanModal(false)}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-sky-400 mb-1.5">
                Name des Stundenplans
              </label>
              <input
                type="text"
                value={planFormTitle}
                onChange={(e) => setPlanFormTitle(e.target.value)}
                placeholder="z.B. Dean Klasse 9d, Valentina 3b, AG & Sport..."
                className={'w-full px-4 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-emerald-400">
                👥 Zugewiesene Personen aus den Konten (Mehrfachauswahl möglich):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {safeMembers.map(member => {
                  const isSel = planFormMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMemberInPlanForm(member.id)}
                      className={'p-2.5 rounded-2xl border flex items-center gap-2.5 text-left cursor-pointer transition-all ' +
                        (isSel ? 'tw-active-nav' : 'tw-nav-inactive opacity-80')}
                    >
                      {renderAvatar(member, 'w-8 h-8', 'text-xs')}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black truncate">{member.name}</div>
                        <div className="text-[10px] opacity-80">{isSel ? '✓ Zugewiesen' : 'Antippen'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
              {manageMode === 'edit' && normalizedPlans.length > 1 ? (
                <button
                  type="button"
                  onClick={handleDeleteCurrentPlan}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Plan löschen</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManagePlanModal(false)}
                  className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="tw-active-nav px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
