// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
  X, Copy, ClipboardPaste, Volume2, Clock, Share2
} from 'lucide-react';
import * as Cfg from './touchwallConfig';
import { registerPendingCalendarOp } from './sync';

const {
  formatDateStr,
  addDays,
  playTouchwallAlarmSound,
  DEFAULT_SCHOOL,
  updateTodoistTaskItem
} = Cfg;

export default function TouchwallModals({
  eventModal,
  setEventModal,
  saveEventModal,
  deleteEventById,
  duplicateEventToTarget,
  setCopiedEvent,
  taskModal,
  setTaskModal,
  setFamilyTasks,
  setEvents,
  pendingCalendarOpsRef,
  sendCalendarApiAction,
  lastLocalEditTimeRef,
  safeTodoistConfig,
  yearDayModal,
  setYearDayModal,
  safeEvents,
  schoolModal,
  setSchoolModal,
  setSchoolData,
  activeSchoolChild,
  qrModalOpen,
  setQrModalOpen,
  qrShareUrl,
  activeAlarmBanner,
  setActiveAlarmBanner,
  toast,
  safeMembers,
  todayStr,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  triggerEventAlarmNow,
  showToast
}) {
  const handleTaskModalSubmit = async (e) => {
    e.preventDefault();
    if (lastLocalEditTimeRef) lastLocalEditTimeRef.current = Date.now();
    const dueLabel = taskModal.dueDate
      ? 'Bis ' + taskModal.dueDate.slice(8, 10) + '.' + taskModal.dueDate.slice(5, 7) + '.' + (taskModal.dueTime ? ' ' + taskModal.dueTime + ' Uhr' : '')
      : (taskModal.dueTime ? 'Heute bis ' + taskModal.dueTime + ' Uhr' : 'Offen');

    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === taskModal.id ? {
      ...t,
      title: taskModal.title,
      description: taskModal.description,
      member: taskModal.member,
      priority: Number(taskModal.priority || 1),
      due: dueLabel,
      dueDate: taskModal.dueDate,
      dueTime: taskModal.dueTime,
      notifyTime: taskModal.notifyTime
    } : t));

    const targetMemberObj = safeMembers.find(m => m.id === taskModal.member);
    if (taskModal.todoistId && safeTodoistConfig?.apiToken) {
      try {
        await updateTodoistTaskItem(safeTodoistConfig.apiToken, taskModal.todoistId, {
          title: taskModal.title,
          description: taskModal.description,
          priority: taskModal.priority,
          assigneeId: targetMemberObj?.todoistUserId,
          dueDate: taskModal.dueDate,
          dueTime: taskModal.dueTime,
          notifyTime: taskModal.notifyTime
        });
      } catch (err) {}
    }

    if (taskModal.syncToCalendar) {
      const calEv = {
        id: String(Date.now()),
        title: '✅ Aufgabe: ' + taskModal.title,
        date: taskModal.dueDate || todayStr,
        time: taskModal.dueTime ? taskModal.dueTime + ' - ' + taskModal.dueTime : 'Ganztägig',
        member: taskModal.member,
        notifyTime: taskModal.notifyTime === 'none' ? '15m' : taskModal.notifyTime,
        notifyChannel: 'push',
        notifyUsers: [taskModal.member],
        fromGoogle: true
      };
      registerPendingCalendarOp(pendingCalendarOpsRef, 'create', calEv);
      setEvents(prev => [...(Array.isArray(prev) ? prev : []), calEv]);
      await sendCalendarApiAction({ action: 'createEvent', event: calEv });
    }

    setTaskModal({ ...taskModal, open: false });
    showToast('Frist & Erinnerung gespeichert', taskModal.title + ' (' + dueLabel + ')', '⏰');
  };

  const handleSchoolModalSubmit = (e) => {
    e.preventDefault();
    const key = schoolModal.dayIdx + '-' + schoolModal.periodIdx;
    setSchoolData(prev => {
      const base = prev && typeof prev === 'object' ? prev : DEFAULT_SCHOOL;
      const childObj = base[activeSchoolChild] || DEFAULT_SCHOOL[activeSchoolChild];
      const nextSlots = { ...(childObj.slots || {}) };
      if (!schoolModal.subject.trim()) delete nextSlots[key];
      else nextSlots[key] = { subject: schoolModal.subject.trim(), room: schoolModal.room.trim(), status: schoolModal.status };
      return { ...base, [activeSchoolChild]: { ...childObj, slots: nextSlots } };
    });
    setSchoolModal({ ...schoolModal, open: false });
  };

  return (
    <>
      {/* MODAL 1: TERMIN ERSTELLEN / BEARBEITEN / KOPIEREN */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={saveEventModal} className={'w-full max-w-xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold">{eventModal.id ? 'Termin bearbeiten & kopieren' : 'Neuer Familientermin'}</h3>
              <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text"
              required
              value={eventModal.title}
              onChange={(e) => setEventModal({ ...eventModal, title: e.target.value })}
              placeholder="z.B. ⚽ Fußballtraining oder 🦷 Zahnarzt"
              className={'w-full px-4 py-3 rounded-2xl border font-bold text-base ' + themeStyles.input}
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {safeMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEventModal({ ...eventModal, member: m.id, notifyUsers: m.id === 'all' ? safeMembers.filter(x => x.id !== 'all').map(x => x.id) : [m.id] })}
                  className={'p-2.5 rounded-2xl flex flex-col items-center gap-1 cursor-pointer ' + (eventModal.member === m.id ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.subtle)}
                >
                  {renderAvatar(m, 'w-8 h-8', 'text-xs')}
                  <span className="text-xs font-extrabold truncate max-w-full">{m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {eventModal.title.trim() && (
              <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase flex items-center gap-1.5 text-amber-400">
                    <Copy className="w-4 h-4" /> Termin sofort kopieren für:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedEvent(eventModal);
                      setEventModal({ ...eventModal, open: false });
                      showToast('Kopier-Modus aktiv!', 'Tippe jetzt im Kalender auf beliebige Tage zum Einfügen!', '📋');
                    }}
                    className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" /> Im Kalender frei einfügen...
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {safeMembers.map(tm => (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => duplicateEventToTarget(eventModal, tm.id, eventModal.date)}
                      className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> + {tm.id === 'all' ? 'Familie' : tm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={eventModal.date} onChange={(e) => setEventModal({ ...eventModal, date: e.target.value })} className={'px-4 py-2.5 rounded-2xl border font-bold text-sm ' + themeStyles.input} />
              <input type="text" value={eventModal.time} onChange={(e) => setEventModal({ ...eventModal, time: e.target.value })} className={'px-4 py-2.5 rounded-2xl border font-bold text-sm ' + themeStyles.input} />
            </div>
            <div className={'p-4 rounded-2xl border space-y-3 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Erinnerung</span>
                <button type="button" onClick={() => triggerEventAlarmNow(eventModal, true)} className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={eventModal.notifyTime} onChange={(e) => setEventModal({ ...eventModal, notifyTime: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}>
                  <option value="none" className="bg-slate-800 text-white">Keine</option>
                  <option value="0m" className="bg-slate-800 text-white">Pünktlich</option>
                  <option value="15m" className="bg-slate-800 text-white">15 Min. vorher</option>
                  <option value="30m" className="bg-slate-800 text-white">30 Min. vorher</option>
                  <option value="1h" className="bg-slate-800 text-white">1 Std. vorher</option>
                  <option value="1d" className="bg-slate-800 text-white">1 Tag vorher</option>
                </select>
                <select value={eventModal.notifyChannel} onChange={(e) => setEventModal({ ...eventModal, notifyChannel: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}>
                  <option value="wall_push" className="bg-slate-800 text-white">Touchwall + Handy Push</option>
                  <option value="wall" className="bg-slate-800 text-white">Nur Touchwall</option>
                  <option value="mail" className="bg-slate-800 text-white">E-Mail & Push</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              {eventModal.id ? <button type="button" onClick={() => deleteEventById(eventModal.id)} className="px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer">🗑️ Löschen</button> : <div />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className="tw-nav-inactive px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer">Abbrechen</button>
                <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer">Speichern</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1B: AUFGABEN-FRIST BEARBEITEN */}
      {taskModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleTaskModalSubmit} className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Aufgabe: Bis wann erledigen & Erinnerung
              </h3>
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                value={taskModal.title}
                onChange={(e) => setTaskModal({ ...taskModal, title: e.target.value })}
                className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
              />
              <input
                type="text"
                value={taskModal.description}
                onChange={(e) => setTaskModal({ ...taskModal, description: e.target.value })}
                placeholder="Notiz / Beschreibung zur Aufgabe..."
                className={'w-full px-4 py-2 rounded-xl border text-xs font-semibold ' + themeStyles.input}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={'block text-[11px] font-extrabold uppercase mb-1 ' + themeStyles.textMuted}>Zuständig</label>
                <select
                  value={taskModal.member}
                  onChange={(e) => setTaskModal({ ...taskModal, member: e.target.value })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {safeMembers.filter(m => m.id !== 'all').map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-white">👤 {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={'block text-[11px] font-extrabold uppercase mb-1 ' + themeStyles.textMuted}>Priorität</label>
                <select
                  value={taskModal.priority}
                  onChange={(e) => setTaskModal({ ...taskModal, priority: Number(e.target.value) })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value={4} className="bg-slate-800 text-white">🔥 P1 - Sehr dringend</option>
                  <option value={3} className="bg-slate-800 text-white">🟠 P2 - Wichtig</option>
                  <option value={2} className="bg-slate-800 text-white">🔵 P3 - Mittel</option>
                  <option value={1} className="bg-slate-800 text-white">⚪ P4 - Normal</option>
                </select>
              </div>
            </div>

            <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400">⏳ Bis wann muss es erledigt sein?</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: todayStr, dueTime: '18:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">Heute</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 1)), dueTime: '17:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">Morgen</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 7)), dueTime: '17:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">+1 Woche</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={taskModal.dueDate} onChange={(e) => setTaskModal({ ...taskModal, dueDate: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input} />
                <input type="time" value={taskModal.dueTime} onChange={(e) => setTaskModal({ ...taskModal, dueTime: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input} />
              </div>
            </div>

            <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Wann erinnern?</span>
                <button
                  type="button"
                  onClick={() => triggerEventAlarmNow({
                    title: '✅ Aufgabe: ' + taskModal.title,
                    time: 'Bis ' + (taskModal.dueTime || '17:00') + ' Uhr',
                    date: taskModal.dueDate || todayStr,
                    notifyTime: taskModal.notifyTime,
                    notifyUsers: [taskModal.member]
                  }, true)}
                  className="tw-glow-btn px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <select
                value={taskModal.notifyTime}
                onChange={(e) => setTaskModal({ ...taskModal, notifyTime: e.target.value })}
                className={'w-full px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
              >
                <option value="none" className="bg-slate-800 text-white">🔕 Keine Erinnerung</option>
                <option value="0m" className="bg-slate-800 text-white">🔔 Pünktlich zur Frist</option>
                <option value="5m" className="bg-slate-800 text-white">🔔 5 Min. vorher</option>
                <option value="15m" className="bg-slate-800 text-white">🔔 15 Min. vorher</option>
                <option value="30m" className="bg-slate-800 text-white">🔔 30 Min. vorher</option>
                <option value="1h" className="bg-slate-800 text-white">🔔 1 Std. vorher</option>
                <option value="1d" className="bg-slate-800 text-white">🔔 1 Tag vorher</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })} className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer">💾 Speichern & Synchronisieren</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: JAHRESWAND TAGES-DETAILS */}
      {yearDayModal.open && (() => {
        const dayEvents = safeEvents.filter(e => e.date === yearDayModal.dateStr);
        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={'w-full max-w-xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">📅 Tagesübersicht: {yearDayModal.dateStr}</h3>
                <button onClick={() => setYearDayModal({ ...yearDayModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div className={'p-6 text-center rounded-2xl border border-dashed text-xs font-bold opacity-60 ' + themeStyles.divider}>
                    Keine Termine an diesem Tag.
                  </div>
                ) : (
                  dayEvents.map(ev => {
                    const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                    return (
                      <div key={ev.id} style={getMemberStyles(mem).headerStyle} className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-sm">{ev.title} ({mem.name})</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCopiedEvent(ev);
                              setYearDayModal({ ...yearDayModal, open: false });
                              showToast('Termin kopiert!', 'Tippe jetzt auf einen beliebigen Tag zum Einfügen!', '📋');
                            }}
                            className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" /> Kopieren
                          </button>
                          <button onClick={() => deleteEventById(ev.id)} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: SCHULSTUNDE */}
      {schoolModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSchoolModalSubmit} className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}>
            <h3 className="text-lg font-extrabold">Schulstunde anpassen</h3>
            <input type="text" value={schoolModal.subject} onChange={(e) => setSchoolModal({ ...schoolModal, subject: e.target.value })} placeholder="Fach..." className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input} />
            <input type="text" value={schoolModal.room} onChange={(e) => setSchoolModal({ ...schoolModal, room: e.target.value })} placeholder="Raum / Lehrer..." className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input} />
            <select value={schoolModal.status} onChange={(e) => setSchoolModal({ ...schoolModal, status: e.target.value })} className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}>
              <option value="normal" className="bg-slate-800 text-white">Regulär</option>
              <option value="change" className="bg-slate-800 text-white">Vertretung / Änderung</option>
              <option value="exam" className="bg-slate-800 text-white">Arbeit / Test</option>
              <option value="cancel" className="bg-slate-800 text-white">Entfall</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSchoolModal({ ...schoolModal, open: false })} className="tw-nav-inactive px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer">Speichern</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: QR CODE & 1-KLICK EINLADUNGS-LINK FÜR FAMILIEN-SMARTPHONES */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl text-center space-y-4 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">📱 Smartphone Direkt-Einladung</h3>
              <button onClick={() => setQrModalOpen(false)} className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
              Scanne diesen QR-Code oder teile den Einladungs-Link – die Touchwall meldet sich auf dem Smartphone sofort automatisch in eurem Familien-Konto an!
            </p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-md">
              <img src={'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(qrShareUrl)} alt="QR" className="w-48 h-48" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(qrShareUrl);
                  showToast('Link kopiert!', 'Einladungs-Link befindet sich in der Zwischenablage.', '📋');
                }}
                className="tw-glow-btn py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Link kopieren
              </button>
              <a
                href={'https://wa.me/?text=' + encodeURIComponent('📲 Hier ist unser direkter Familien-Touchwall Login-Link: ' + qrShareUrl)}
                target="_blank"
                rel="noreferrer"
                className="tw-glow-btn py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer no-underline"
              >
                <Share2 className="w-4 h-4" /> Per WhatsApp teilen
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ALARM BANNER */}
      {activeAlarmBanner && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={'w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl space-y-4 text-center ' + themeStyles.modal}>
            <h3 className="text-2xl font-extrabold">🔔 {activeAlarmBanner.title}</h3>
            <p className="text-sm font-bold">{activeAlarmBanner.time} ({activeAlarmBanner.date})</p>
            <p className="text-xs font-extrabold text-sky-400">👤 Für: {activeAlarmBanner.who}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => playTouchwallAlarmSound()} className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer">🔊 Ton testen</button>
              <button onClick={() => setActiveAlarmBanner(null)} className="tw-glow-btn px-6 py-2.5 rounded-2xl text-sm font-black cursor-pointer">✅ Verstanden</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MELDUNG */}
      {toast && (
        <div className={'fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-3 ' + themeStyles.modal} style={{ borderColor: themeStyles.btnBorder }}>
          <span className="text-2xl">{toast.icon}</span>
          <div>
            <div className="font-extrabold text-xs text-amber-400 uppercase">{toast.title}</div>
            <div className="font-semibold text-sm">{toast.message}</div>
          </div>
        </div>
      )}
    </>
  );
}
