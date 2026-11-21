// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

//
//
// ============================================================================
// PART 01: IMPORTS, KONSTANTEN & DATUMS-/ZEIT-HELFER
// ============================================================================
//
//

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, X,
  Clock, Bell, BellOff, Pencil, Check, Copy
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';

const { formatDateStr, addDays, COLOR_PALETTES } = Cfg;

const MONTH_NAMES_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];
const MONTH_SHORT_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WEEKDAYS_SHORT_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_LONG_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const NOTIFY_TIME_OPTIONS = [
  { id: 'none', label: 'Keine' },
  { id: '0m',   label: 'Pünktlich' },
  { id: '15m',  label: '15 Min vorher' },
  { id: '30m',  label: '30 Min vorher' },
  { id: '1h',   label: '1 Std vorher' },
  { id: '1d',   label: '1 Tag vorher' }
];

const NOTIFY_CHANNEL_OPTIONS = [
  { id: 'wall_push', label: '🖥️ + 📲 Wand & Push' },
  { id: 'wall',      label: '🖥️ Nur Touchwall' },
  { id: 'push',      label: '📲 Nur Handy-Push' },
  { id: 'none',      label: '🔕 Stumm' }
];

function parseDateSafe(dStr) {
  const parts = String(dStr || '').split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function getMondayOfWeek(dateObj) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0);
  const diff = (d.getDay() + 6) % 7; // Mo = 0
  d.setDate(d.getDate() - diff);
  return d;
}

function getIsoWeekNumber(dateObj) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function parseEventTime(timeStr) {
  const clean = String(timeStr || '').trim();
  if (!clean || /ganztägig/i.test(clean)) {
    return { allDay: true, startTime: '15:00', endTime: '16:00' };
  }
  const m = clean.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (m) {
    return {
      allDay: false,
      startTime: m[1].padStart(5, '0'),
      endTime: m[2].padStart(5, '0')
    };
  }
  const single = clean.match(/(\d{1,2}:\d{2})/);
  if (single) {
    const start = single[1].padStart(5, '0');
    const [hh, mm] = start.split(':').map(Number);
    const endH = String(Math.min(23, hh + 1)).padStart(2, '0');
    return { allDay: false, startTime: start, endTime: `${endH}:${String(mm).padStart(2, '0')}` };
  }
  return { allDay: false, startTime: '15:00', endTime: '16:00' };
}

function sortEventsByTime(list) {
  return [...list].sort((a, b) => {
    const aAll = !a.time || /ganztägig/i.test(a.time);
    const bAll = !b.time || /ganztägig/i.test(b.time);
    if (aAll !== bAll) return aAll ? -1 : 1;
    return String(a.time || '').localeCompare(String(b.time || ''));
  });
}

//
//
// ============================================================================
// PART 02: HAUPTKOMPONENTE, STATES, MEMOS & EVENT-HANDLER
// ============================================================================
//
//

export default function PocketAgenda({
  safeMembers,
  filteredEvents,
  selectedPerson,
  onSelectPerson,
  todayStr,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  onCreateEvent,
  onUpdateEvent,
  onDuplicateEvent,
  onDeleteEvent
}) {
  // '1w' | '2w' | '4w' (Monat) | 'list'
  const [viewMode, setViewMode] = useState('1w');
  const [anchorDate, setAnchorDate] = useState(() => parseDateSafe(todayStr));

  // Ausgewählter Tag für Tages-Detailleiste / Bottom-Sheet
  const [selectedDayStr, setSelectedDayStr] = useState(null);

  // Vollständiger Touchwall-Termin-Editor (Neu & Bearbeiten)
  const [eventModal, setEventModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    originalEvent: null,
    title: '',
    date: todayStr,
    allDay: false,
    startTime: '15:00',
    endTime: '16:00',
    member: 'all',
    notifyTime: '30m',
    notifyChannel: 'wall_push',
    notifyUsers: ['all']
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('richter_tw_pocket_cal_view');
      if (saved && ['1w', '2w', '4w', 'list'].includes(saved)) {
        setViewMode(saved);
      }
    } catch (e) {}
  }, []);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem('richter_tw_pocket_cal_view', mode); } catch (e) {}
  };

  // Events pro Datum gruppiert für schnellen Zugriff
  const eventsByDate = useMemo(() => {
    const map = {};
    (Array.isArray(filteredEvents) ? filteredEvents : []).forEach(ev => {
      if (!ev?.date) return;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    Object.keys(map).forEach(k => {
      map[k] = sortEventsByTime(map[k]);
    });
    return map;
  }, [filteredEvents]);

  // 1-Wochen-Tage (Mo – So)
  const oneWeekCells = useMemo(() => {
    const mon = getMondayOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(mon, i);
      const dStr = formatDateStr(d);
      return {
        dateObj: d,
        dateStr: dStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        weekdayShort: WEEKDAYS_SHORT_DE[i],
        weekdayLong: WEEKDAYS_LONG_DE[d.getDay()],
        isToday: dStr === todayStr,
        isWeekend: i >= 5,
        events: eventsByDate[dStr] || []
      };
    });
  }, [anchorDate, eventsByDate, todayStr]);

  // 2-Wochen-Tage (14 Tage ab Montag der aktuellen Woche)
  const twoWeekCells = useMemo(() => {
    const mon = getMondayOfWeek(anchorDate);
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(mon, i);
      const dStr = formatDateStr(d);
      return {
        dateObj: d,
        dateStr: dStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        weekdayShort: WEEKDAYS_SHORT_DE[i % 7],
        isToday: dStr === todayStr,
        isWeekend: (i % 7) >= 5,
        isWeekStart: i % 7 === 0,
        kw: getIsoWeekNumber(d),
        events: eventsByDate[dStr] || []
      };
    });
  }, [anchorDate, eventsByDate, todayStr]);

  // Monatsraster (4W / Monat)
  const monthGridCells = useMemo(() => {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();
    const firstDay = new Date(y, m, 1, 12, 0, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(y, m, 1 - startOffset, 12, 0, 0);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

    return Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i, 12, 0, 0);
      const dStr = formatDateStr(d);
      return {
        dateObj: d,
        dateStr: dStr,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === m,
        isToday: dStr === todayStr,
        isWeekend: (i % 7) >= 5,
        events: eventsByDate[dStr] || []
      };
    });
  }, [anchorDate, eventsByDate, todayStr]);

  // Gruppierte Terminliste ab Ankerdatum (standardmäßig ab heute)
  const groupedListDays = useMemo(() => {
    const startStr = formatDateStr(anchorDate);
    const dates = Object.keys(eventsByDate)
      .filter(d => d >= startStr)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30);

    return dates.map(dStr => {
      const d = parseDateSafe(dStr);
      const tomorrowStr = formatDateStr(addDays(parseDateSafe(todayStr), 1));
      let prefix = '';
      if (dStr === todayStr) prefix = 'Heute • ';
      else if (dStr === tomorrowStr) prefix = 'Morgen • ';
      return {
        dateStr: dStr,
        label: `${prefix}${WEEKDAYS_LONG_DE[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || []
      };
    });
  }, [eventsByDate, anchorDate, todayStr]);

  const headerRangeLabel = useMemo(() => {
    if (viewMode === '1w') {
      const first = oneWeekCells[0];
      const last = oneWeekCells[6];
      const kw = getIsoWeekNumber(first.dateObj);
      return `KW ${kw} • ${String(first.dayNum).padStart(2, '0')}.${String(first.monthNum).padStart(2, '0')}. – ${String(last.dayNum).padStart(2, '0')}.${String(last.monthNum).padStart(2, '0')}.`;
    }
    if (viewMode === '2w') {
      const first = twoWeekCells[0];
      const last = twoWeekCells[13];
      return `KW ${first.kw}–${last.kw} • ${String(first.dayNum).padStart(2, '0')}.${String(first.monthNum).padStart(2, '0')}. – ${String(last.dayNum).padStart(2, '0')}.${String(last.monthNum).padStart(2, '0')}.`;
    }
    return `${MONTH_NAMES_DE[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
  }, [viewMode, oneWeekCells, twoWeekCells, anchorDate]);

  const navigateStep = (dir) => {
    if (viewMode === '1w') setAnchorDate(prev => addDays(prev, dir * 7));
    else if (viewMode === '2w') setAnchorDate(prev => addDays(prev, dir * 14));
    else setAnchorDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1, 12, 0, 0));
  };

  const jumpToToday = () => {
    setAnchorDate(parseDateSafe(todayStr));
  };

  const openCreateModal = (dateStr = todayStr) => {
    const defaultMember = selectedPerson && selectedPerson !== 'all' ? selectedPerson : 'all';
    setEventModal({
      open: true,
      mode: 'create',
      originalEvent: null,
      title: '',
      date: dateStr || todayStr,
      allDay: false,
      startTime: '15:00',
      endTime: '16:00',
      member: defaultMember,
      notifyTime: '30m',
      notifyChannel: 'wall_push',
      notifyUsers: [defaultMember]
    });
  };

  const openEditModal = (ev) => {
    if (!ev) return;
    const parsedTime = parseEventTime(ev.time);
    const resolvedMember = safeMembers.some(m => m.id === ev.member) ? ev.member : 'all';
    const resolvedNotifyUsers = Array.isArray(ev.notifyUsers) && ev.notifyUsers.length > 0
      ? ev.notifyUsers
      : [resolvedMember];

    setEventModal({
      open: true,
      mode: 'edit',
      originalEvent: ev,
      title: ev.title || '',
      date: ev.date || todayStr,
      allDay: parsedTime.allDay,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      member: resolvedMember,
      notifyTime: ev.notifyTime || '30m',
      notifyChannel: ev.notifyChannel || 'wall_push',
      notifyUsers: resolvedNotifyUsers
    });
  };

  const toggleNotifyUser = (memberId) => {
    setEventModal(prev => {
      const current = Array.isArray(prev.notifyUsers) ? prev.notifyUsers : [];
      if (memberId === 'all') {
        return { ...prev, notifyUsers: ['all'] };
      }
      const withoutAll = current.filter(id => id !== 'all');
      const exists = withoutAll.includes(memberId);
      const next = exists ? withoutAll.filter(id => id !== memberId) : [...withoutAll, memberId];
      return { ...prev, notifyUsers: next.length > 0 ? next : [prev.member || 'all'] };
    });
  };

  const handleSaveEventModal = (e) => {
    e.preventDefault();
    if (!eventModal.title.trim() || !eventModal.date) return;

    const finalTime = eventModal.allDay
      ? 'Ganztägig'
      : `${eventModal.startTime || '15:00'} - ${eventModal.endTime || '16:00'}`;

    const payload = {
      title: eventModal.title.trim(),
      date: eventModal.date,
      time: finalTime,
      member: eventModal.member,
      notifyTime: eventModal.notifyTime,
      notifyChannel: eventModal.notifyChannel,
      notifyUsers: eventModal.notifyUsers
    };

    if (eventModal.mode === 'edit' && eventModal.originalEvent) {
      if (typeof onUpdateEvent === 'function') {
        onUpdateEvent(eventModal.originalEvent, payload);
      } else {
        onDeleteEvent?.(eventModal.originalEvent);
        onCreateEvent?.(payload);
      }
    } else {
      onCreateEvent?.(payload);
    }

    setEventModal(prev => ({ ...prev, open: false }));
  };

  const formatNiceGermanDate = (dStr) => {
    if (!dStr) return '';
    const d = parseDateSafe(dStr);
    return `${WEEKDAYS_LONG_DE[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const getMemberById = (memberId) => {
    return safeMembers.find(m => m.id === memberId) || safeMembers[0];
  };

  const selectedDayEvents = selectedDayStr ? (eventsByDate[selectedDayStr] || []) : [];

  //
  //
  // ============================================================================
  // PART 03: KOPFLEISTE & KALENDER-ANSICHTEN (1W, 2W, MONAT, LISTE)
  // ============================================================================
  //
  //

  return (
    <div className="h-full w-full flex flex-col overflow-hidden select-none">
      {/* ULTRA-SCHLANKE KOPFLEISTE */}
      <div className={'shrink-0 px-2.5 py-1.5 border-b flex flex-wrap items-center justify-between gap-1.5 ' + themeStyles.header}>
        {/* Links: Navigation + Zeitraum */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => navigateStep(-1)}
            className="tw-nav-inactive w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Zurück"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={jumpToToday}
            title="Zu Heute springen"
            className="px-2 py-1 rounded-xl text-left min-w-0 hover:bg-white/5"
          >
            <div className="font-black text-xs sm:text-sm md:text-base leading-none truncate">
              {headerRangeLabel}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateStep(1)}
            className="tw-nav-inactive w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Weiter"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={jumpToToday}
            className="tw-glow-btn px-2 py-1 rounded-xl text-[11px] font-black ml-0.5 shrink-0"
          >
            Heute
          </button>
        </div>

        {/* Rechts: Ansichten (1W | 2W | Monat | Liste), Personen-Filter & + */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <div className="flex items-center p-0.5 rounded-xl bg-black/35 border border-white/10">
            {[
              { id: '1w',   label: '1W' },
              { id: '2w',   label: '2W' },
              { id: '4w',   label: 'Monat' },
              { id: 'list', label: 'Liste' }
            ].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => changeViewMode(v.id)}
                className={
                  'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ' +
                  (viewMode === v.id ? 'tw-active-nav' : 'opacity-75 hover:opacity-100')
                }
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Auf Tablet: direkt antippbare Mini-Avatare; auf Handy: platzsparendes Dropdown */}
          {onSelectPerson && (
            <>
              <div className="hidden lg:flex items-center gap-1 pl-1">
                <button
                  type="button"
                  onClick={() => onSelectPerson('all')}
                  className={'px-2 py-1 rounded-xl text-[11px] font-black ' + (selectedPerson === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  Alle
                </button>
                {safeMembers.filter(m => m.id !== 'all').map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectPerson(selectedPerson === m.id ? 'all' : m.id)}
                    title={m.name}
                    className={'rounded-full p-0.5 transition-transform ' + (selectedPerson === m.id ? 'ring-2 ring-sky-400 scale-110' : 'opacity-65 hover:opacity-100')}
                  >
                    {renderAvatar(m, 'w-6 h-6', 'text-[10px]')}
                  </button>
                ))}
              </div>

              <select
                value={selectedPerson}
                onChange={(e) => onSelectPerson(e.target.value)}
                className={'lg:hidden h-8 px-1.5 rounded-xl border text-[11px] font-black max-w-[92px] ' + themeStyles.input}
              >
                <option value="all" className="bg-slate-800 text-white">👨‍👩‍👧‍👦 Alle</option>
                {safeMembers.filter(m => m.id !== 'all').map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                    {m.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onClick={() => openCreateModal(selectedDayStr || todayStr)}
            className="tw-active-nav w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-md shrink-0"
            title="Neuen Termin anlegen"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* HAUPTBEREICH (+ OPTIONALES TABLET-TAGES-SEITENPANEL RECHTS) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

          {/* MODUS 1: 1 WOCHE */}
          {viewMode === '1w' && (
            <>
              {/* HANDY (< md): Optimierte 7-Tage-Wochenübersicht */}
              <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-2">
                {oneWeekCells.map(cell => (
                  <div
                    key={cell.dateStr}
                    className={
                      'rounded-2xl border overflow-hidden transition-colors ' +
                      themeStyles.card + ' ' +
                      (cell.isToday ? 'border-sky-400 ring-1 ring-sky-400/50 bg-sky-500/10' : '')
                    }
                  >
                    <div
                      onClick={() => openCreateModal(cell.dateStr)}
                      className="px-3 py-2 flex items-center justify-between gap-2 bg-black/20 border-b border-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            'w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ' +
                            (cell.isToday
                              ? 'bg-sky-500 text-white shadow'
                              : cell.isWeekend
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-white/10 text-slate-200')
                          }
                        >
                          {cell.dayNum}
                        </span>
                        <div>
                          <span className={'font-black text-sm ' + (cell.isToday ? 'text-sky-300' : cell.isWeekend ? 'text-amber-300' : '')}>
                            {cell.weekdayLong}
                          </span>
                          <span className="text-xs font-bold opacity-60 ml-1.5">
                            {String(cell.dayNum).padStart(2, '0')}.{String(cell.monthNum).padStart(2, '0')}.
                          </span>
                          {cell.isToday && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-sky-500/30 text-sky-200 text-[10px] font-black">
                              HEUTE
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="tw-nav-inactive w-7 h-7 rounded-xl flex items-center justify-center text-sky-300">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {cell.events.length === 0 ? (
                      <div
                        onClick={() => openCreateModal(cell.dateStr)}
                        className="px-3 py-2 text-[11px] font-semibold opacity-40 cursor-pointer"
                      >
                        Keine Termine
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        {cell.events.map(ev => {
                          const mem = getMemberById(ev.member);
                          const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                          return (
                            <div
                              key={ev.id}
                              onClick={() => openEditModal(ev)}
                              style={{ borderLeft: '4px solid ' + hex, backgroundColor: hex + '1a' }}
                              className="px-2.5 py-2 rounded-r-xl flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {renderAvatar(mem, 'w-6 h-6', 'text-[9px]')}
                                <div className="min-w-0 flex-1">
                                  <div className="font-black text-sm leading-snug break-words">
                                    {ev.title}
                                  </div>
                                  <div className="text-[11px] font-bold opacity-80 flex items-center gap-1.5">
                                    <span className="text-amber-300">{ev.time || 'Ganztägig'}</span>
                                    <span>•</span>
                                    <span className="truncate">{mem?.name.split(' ')[0]}</span>
                                    {ev.notifyTime && ev.notifyTime !== 'none' && ev.notifyChannel !== 'none' && (
                                      <Bell className="w-3 h-3 text-sky-300 shrink-0" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Pencil className="w-3.5 h-3.5 opacity-45 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* TABLET & DESKTOP (md+): 7-Spalten-Wochenboard */}
              <div className="hidden md:grid md:grid-cols-7 flex-1 min-h-0 bg-black/20">
                {oneWeekCells.map(cell => (
                  <div
                    key={cell.dateStr}
                    className={
                      'border-r border-white/10 flex flex-col min-w-0 min-h-0 ' +
                      (cell.isToday ? 'bg-sky-500/10' : cell.isWeekend ? 'bg-black/20' : '')
                    }
                  >
                    <div
                      onClick={() => openCreateModal(cell.dateStr)}
                      className={'px-2 py-2 border-b border-white/10 flex items-center justify-between gap-1 shrink-0 cursor-pointer hover:bg-white/5 ' + (cell.isToday ? 'bg-sky-500/20' : 'bg-black/25')}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={'text-xs font-black uppercase ' + (cell.isWeekend ? 'text-amber-400' : 'opacity-75')}>
                          {cell.weekdayShort}
                        </span>
                        <span
                          className={
                            'w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ' +
                            (cell.isToday ? 'bg-sky-500 text-white shadow' : 'text-slate-100')
                          }
                        >
                          {cell.dayNum}
                        </span>
                      </div>
                      <Plus className="w-3.5 h-3.5 opacity-55 hover:opacity-100 shrink-0" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                      {cell.events.map(ev => {
                        const mem = getMemberById(ev.member);
                        const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                        return (
                          <div
                            key={ev.id}
                            onClick={() => openEditModal(ev)}
                            style={{ borderLeft: '3px solid ' + hex, backgroundColor: hex + '26' }}
                            className="p-2 rounded-r-xl cursor-pointer hover:brightness-110 transition-all space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-amber-300 truncate">
                                {ev.time || 'Ganztägig'}
                              </span>
                              {renderAvatar(mem, 'w-4 h-4', 'text-[8px]')}
                            </div>
                            <div className="text-xs font-black leading-tight break-words text-white">
                              {ev.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MODUS 2: 2 WOCHEN */}
          {viewMode === '2w' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className={'grid grid-cols-7 border-b shrink-0 ' + themeStyles.header}>
                {WEEKDAYS_SHORT_DE.map((wd, i) => (
                  <div
                    key={wd}
                    className={'py-1 text-center text-[11px] font-black uppercase tracking-wider ' + (i >= 5 ? 'text-amber-400' : 'opacity-75')}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 grid-rows-2 min-h-0 bg-black/20">
                {twoWeekCells.map(cell => {
                  const isSelected = selectedDayStr === cell.dateStr;
                  const maxVisible = 6;
                  const visibleEvents = cell.events.slice(0, maxVisible);
                  const extraCount = cell.events.length - visibleEvents.length;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDayStr(cell.dateStr)}
                      className={
                        'border-r border-b border-white/10 p-1 flex flex-col min-w-0 min-h-0 overflow-hidden cursor-pointer transition-colors ' +
                        (cell.isWeekend ? 'bg-black/20 ' : '') +
                        (cell.isToday ? 'bg-sky-500/15 ' : '') +
                        (isSelected ? 'ring-2 ring-inset ring-sky-400 bg-sky-500/20 ' : 'hover:bg-white/5 ')
                      }
                    >
                      <div className="flex items-center justify-between gap-0.5 mb-1 shrink-0">
                        {cell.isWeekStart ? (
                          <span className="text-[9px] font-black text-sky-400/80 hidden sm:inline">
                            KW {cell.kw}
                          </span>
                        ) : <span />}

                        <span
                          className={
                            'px-1.5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ' +
                            (cell.isToday ? 'bg-sky-500 text-white shadow' : 'text-slate-200')
                          }
                        >
                          {cell.dayNum}{cell.dayNum === 1 ? `.${MONTH_SHORT_DE[cell.monthNum - 1]}` : ''}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                        {visibleEvents.map(ev => {
                          const mem = getMemberById(ev.member);
                          const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                                  e.stopPropagation();
                                  openEditModal(ev);
                                }
                              }}
                              style={{ backgroundColor: hex + '36', borderLeft: '3px solid ' + hex }}
                              className="px-1 py-0.5 rounded-r text-[9px] sm:text-[11px] font-extrabold text-white leading-tight truncate"
                            >
                              <span className="hidden md:inline text-amber-200 mr-1 font-bold">
                                {ev.time && !/ganztägig/i.test(ev.time) ? ev.time.slice(0, 5) : ''}
                              </span>
                              {ev.title}
                            </div>
                          );
                        })}

                        {extraCount > 0 && (
                          <div className="text-[9px] font-black text-amber-300 text-center leading-none mt-auto">
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODUS 3: MONAT (4W Vollbild-Raster) */}
          {viewMode === '4w' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className={'grid grid-cols-7 border-b shrink-0 ' + themeStyles.header}>
                {WEEKDAYS_SHORT_DE.map((wd, i) => (
                  <div
                    key={wd}
                    className={'py-1 text-center text-[11px] font-black uppercase tracking-wider ' + (i >= 5 ? 'text-amber-400' : 'opacity-75')}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0 bg-black/20">
                {monthGridCells.map(cell => {
                  const isSelected = selectedDayStr === cell.dateStr;
                  const visibleEvents = cell.events.slice(0, 3);
                  const extraCount = cell.events.length - visibleEvents.length;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDayStr(cell.dateStr)}
                      className={
                        'border-r border-b border-white/10 p-0.5 sm:p-1 flex flex-col min-w-0 min-h-0 overflow-hidden cursor-pointer transition-colors ' +
                        (!cell.isCurrentMonth ? 'opacity-35 bg-black/30 ' : '') +
                        (cell.isToday ? 'bg-sky-500/15 ' : '') +
                        (isSelected ? 'ring-2 ring-inset ring-sky-400 bg-sky-500/20 ' : 'hover:bg-white/5 ')
                      }
                    >
                      <div className="flex items-center justify-center mb-0.5 shrink-0">
                        <span
                          className={
                            'w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ' +
                            (cell.isToday ? 'bg-sky-500 text-white shadow' : 'text-slate-200')
                          }
                        >
                          {cell.dayNum}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                        {visibleEvents.map(ev => {
                          const mem = getMemberById(ev.member);
                          const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                          return (
                            <div
                              key={ev.id}
                              style={{ backgroundColor: hex + '38', borderLeft: '3px solid ' + hex }}
                              className="px-1 py-0.5 rounded-r text-[9px] sm:text-[10px] font-extrabold text-white leading-tight truncate"
                            >
                              {ev.title}
                            </div>
                          );
                        })}

                        {extraCount > 0 && (
                          <div className="text-[9px] font-black text-amber-300 text-center leading-none mt-auto">
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODUS 4: GRUPPIERTE TERMINLISTE */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-4">
              <div className="max-w-5xl mx-auto space-y-3">
                {groupedListDays.length === 0 ? (
                  <div className={'p-8 rounded-3xl border text-center text-xs font-bold opacity-60 ' + themeStyles.card}>
                    📅 Keine kommenden Termine ab diesem Zeitraum.
                  </div>
                ) : (
                  groupedListDays.map(group => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className={'text-xs font-black uppercase tracking-wide ' + (group.isToday ? 'text-sky-400' : 'opacity-75')}>
                          {group.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => openCreateModal(group.dateStr)}
                          className="text-[11px] font-black text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Termin
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.events.map(ev => {
                          const mem = getMemberById(ev.member);
                          const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                          return (
                            <div
                              key={ev.id}
                              onClick={() => openEditModal(ev)}
                              style={{ borderLeft: '5px solid ' + hex }}
                              className={'p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer hover:brightness-105 ' + themeStyles.card}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                                <div className="min-w-0 flex-1">
                                  <div className="font-black text-sm sm:text-base break-words leading-snug">
                                    {ev.title}
                                  </div>
                                  <div className="text-xs font-bold opacity-80 flex items-center gap-1.5 mt-0.5">
                                    <span className="text-amber-300">{ev.time || 'Ganztägig'}</span>
                                    <span>•</span>
                                    <span className="truncate">{mem?.name}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEvent(ev);
                                }}
                                className="tw-nav-inactive p-2 rounded-xl text-rose-400 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/*
        //
        // ============================================================================
        // PART 04: TAGES-DETAIL-PANEL (TABLET SPLIT-PANEL & HANDY DRAWER)
        // ============================================================================
        //
        */}
        {selectedDayStr && (viewMode === '2w' || viewMode === '4w') && (
          <aside
            data-no-swipe="true"
            className={'hidden lg:flex lg:flex-col w-80 shrink-0 border-l p-3.5 space-y-3 overflow-hidden ' + themeStyles.header}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase text-sky-400">📅 Tagesdetails</div>
                <div className="font-black text-sm truncate">{formatNiceGermanDate(selectedDayStr)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDayStr)}
                  className="tw-active-nav px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Neu
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayStr(null)}
                  className="tw-nav-inactive w-7 h-7 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {selectedDayEvents.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold opacity-55">
                  Keine Termine an diesem Tag.
                </div>
              ) : (
                selectedDayEvents.map(ev => {
                  const mem = getMemberById(ev.member);
                  const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                  return (
                    <div
                      key={ev.id}
                      onClick={() => openEditModal(ev)}
                      style={{ borderLeft: '4px solid ' + hex }}
                      className={'p-2.5 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer ' + themeStyles.subtle}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm leading-snug break-words">{ev.title}</div>
                        <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{ev.time || 'Ganztägig'}</span>
                          <span>•</span>
                          <span className="text-sky-300 truncate">{mem?.name.split(' ')[0]}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev); }}
                        className="tw-nav-inactive p-1.5 rounded-xl text-rose-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* HANDY / SMALL-TABLET TAGES-DRAWER (unter lg:) */}
      {selectedDayStr && (viewMode === '2w' || viewMode === '4w') && (
        <div
          data-no-swipe="true"
          onClick={() => setSelectedDayStr(null)}
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center p-2.5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border-2 p-4 shadow-2xl space-y-3 max-h-[78dvh] flex flex-col ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 shrink-0">
              <div>
                <div className="text-[10px] font-black uppercase text-sky-400">📅 Tagesübersicht</div>
                <h3 className="text-base font-black">{formatNiceGermanDate(selectedDayStr)}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDayStr)}
                  className="tw-active-nav px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Termin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayStr(null)}
                  className="tw-nav-inactive w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedDayEvents.length === 0 ? (
                <div className="py-6 text-center text-xs font-bold opacity-60">
                  Keine Termine an diesem Tag. Tippe oben auf „+ Termin“.
                </div>
              ) : (
                selectedDayEvents.map(ev => {
                  const mem = getMemberById(ev.member);
                  const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                  return (
                    <div
                      key={ev.id}
                      onClick={() => openEditModal(ev)}
                      style={{ borderLeft: '5px solid ' + hex }}
                      className={'p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer ' + themeStyles.subtle}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-sm break-words leading-snug">{ev.title}</div>
                          <div className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{ev.time || 'Ganztägig'}</span>
                            <span>•</span>
                            <span className="text-sky-300">{mem?.name.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev); }}
                        className="tw-nav-inactive p-2 rounded-xl text-rose-400 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/*
      //
      // ============================================================================
      // PART 05: TERMIN-EDITOR-MODAL (ERSTELLEN, BEARBEITEN & KOPIEREN)
      // ============================================================================
      //
      */}
      {eventModal.open && (
        <div
          data-no-swipe="true"
          onClick={() => setEventModal(prev => ({ ...prev, open: false }))}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveEventModal}
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border-2 p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black">
                {eventModal.mode === 'edit' ? '✏️ Termin bearbeiten' : '📅 Neuer Termin'}
              </h3>
              <button
                type="button"
                onClick={() => setEventModal(prev => ({ ...prev, open: false }))}
                className="tw-nav-inactive w-8 h-8 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={eventModal.title}
              onChange={(e) => setEventModal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titel (z. B. Zahnarzt, Ponyhof, Kartbahn)..."
              className={'w-full px-3.5 py-2.5 rounded-2xl border text-base font-black ' + themeStyles.input}
            />

            {/* Datum & Ganztägig */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <input
                type="date"
                required
                value={eventModal.date}
                onChange={(e) => setEventModal(prev => ({ ...prev, date: e.target.value }))}
                className={'col-span-7 h-11 px-3 rounded-xl border text-sm font-black ' + themeStyles.input}
              />
              <button
                type="button"
                onClick={() => setEventModal(prev => ({ ...prev, allDay: !prev.allDay }))}
                className={'col-span-5 h-11 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 ' +
                  (eventModal.allDay ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ganztägig</span>
              </button>
            </div>

            {/* Start- & Endzeit */}
            {!eventModal.allDay && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-sky-400 mb-1">Start</label>
                  <input
                    type="time"
                    value={eventModal.startTime}
                    onChange={(e) => setEventModal(prev => ({ ...prev, startTime: e.target.value }))}
                    className={'w-full h-11 px-3 rounded-xl border text-sm font-black ' + themeStyles.input}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-sky-400 mb-1">Ende</label>
                  <input
                    type="time"
                    value={eventModal.endTime}
                    onChange={(e) => setEventModal(prev => ({ ...prev, endTime: e.target.value }))}
                    className={'w-full h-11 px-3 rounded-xl border text-sm font-black ' + themeStyles.input}
                  />
                </div>
              </div>
            )}

            {/* Kalender / Person */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-sky-400">👤 Kalender / Person</label>
              <div className="flex flex-wrap gap-1.5">
                {safeMembers.map(m => {
                  const active = eventModal.member === m.id;
                  const hex = COLOR_PALETTES[m.color]?.hex || '#0ea5e9';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEventModal(prev => ({
                        ...prev,
                        member: m.id,
                        notifyUsers: prev.mode === 'create' ? [m.id] : prev.notifyUsers
                      }))}
                      style={active ? { borderColor: hex, backgroundColor: hex + '35' } : undefined}
                      className={'px-2.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ' +
                        (active ? 'text-white shadow' : 'tw-nav-inactive opacity-80')}
                    >
                      {renderAvatar(m, 'w-5 h-5', 'text-[9px]')}
                      <span>{m.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Erinnerungen & Benachrichtigungs-Kanal */}
            <div className={'p-3 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-400 mb-1">🔔 Erinnerung</label>
                  <select
                    value={eventModal.notifyTime}
                    onChange={(e) => setEventModal(prev => ({ ...prev, notifyTime: e.target.value }))}
                    className={'w-full h-10 px-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  >
                    {NOTIFY_TIME_OPTIONS.map(o => (
                      <option key={o.id} value={o.id} className="bg-slate-800 text-white">{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">📡 Alarm-Kanal</label>
                  <select
                    value={eventModal.notifyChannel}
                    onChange={(e) => setEventModal(prev => ({ ...prev, notifyChannel: e.target.value }))}
                    className={'w-full h-10 px-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  >
                    {NOTIFY_CHANNEL_OPTIONS.map(o => (
                      <option key={o.id} value={o.id} className="bg-slate-800 text-white">{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {eventModal.notifyTime !== 'none' && eventModal.notifyChannel !== 'none' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase opacity-75">
                    Wer wird erinnert?
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {safeMembers.map(m => {
                      const isChecked = (eventModal.notifyUsers || []).includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleNotifyUser(m.id)}
                          className={'px-2.5 py-1 rounded-lg text-[11px] font-black border ' +
                            (isChecked
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                              : 'bg-black/25 border-white/10 opacity-65')}
                        >
                          {isChecked ? '✓ ' : ''}{m.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DIREKT IN ANDEREN KALENDER KOPIEREN (BEIM BEARBEITEN) */}
            {eventModal.mode === 'edit' && eventModal.originalEvent && typeof onDuplicateEvent === 'function' && (
              <div className="p-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 space-y-2">
                <div className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 Direkt in anderen Kalender kopieren:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {safeMembers.map(m => (
                    <button
                      key={'copy_' + m.id}
                      type="button"
                      onClick={() => {
                        const finalTime = eventModal.allDay
                          ? 'Ganztägig'
                          : `${eventModal.startTime || '15:00'} - ${eventModal.endTime || '16:00'}`;
                        onDuplicateEvent(
                          {
                            ...eventModal.originalEvent,
                            title: eventModal.title.trim() || eventModal.originalEvent.title,
                            time: finalTime,
                            notifyTime: eventModal.notifyTime,
                            notifyChannel: eventModal.notifyChannel
                          },
                          m.id,
                          eventModal.date
                        );
                        setEventModal(prev => ({ ...prev, open: false }));
                      }}
                      className="tw-nav-inactive px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 hover:border-amber-400/70 active:scale-95 transition-transform"
                    >
                      {renderAvatar(m, 'w-4 h-4', 'text-[8px]')}
                      <span>+ {m.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
              {eventModal.mode === 'edit' && eventModal.originalEvent ? (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEvent?.(eventModal.originalEvent);
                    setEventModal(prev => ({ ...prev, open: false }));
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Löschen</span>
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEventModal(prev => ({ ...prev, open: false }))}
                  className="tw-nav-inactive px-3.5 py-2.5 rounded-2xl text-xs font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="tw-active-nav px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>{eventModal.mode === 'edit' ? 'Aktualisieren' : 'Speichern'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
