// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, X,
  Calendar as CalendarIcon, List, Clock
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';

const { formatDateStr, COLOR_PALETTES } = Cfg;

const MONTH_NAMES_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const WEEKDAYS_SHORT_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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
  onDeleteEvent
}) {
  // 'month' = Google Kalender Vollbild-Monatsraster | 'list' = Terminliste
  const [viewMode, setViewMode] = useState('month');

  const [viewDate, setViewDate] = useState(() => {
    const parts = String(todayStr || '').split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  // Ausgewählter Tag für das untere Tages-Detailfenster (Google-Kalender-Sheet)
  const [selectedDayStr, setSelectedDayStr] = useState(null);
  const [showAddFormInSheet, setShowAddFormInSheet] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('15:00 - 16:00');
  const [newMember, setNewMember] = useState(selectedPerson !== 'all' ? selectedPerson : 'all');

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Berechnet das 6-Wochen-Vollbild-Monatsraster (Mo - So)
  const monthGridCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Montag = 0
    const gridStartDate = new Date(currentYear, currentMonth, 1 - startOffset);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStartDate.getFullYear(), gridStartDate.getMonth(), gridStartDate.getDate() + i);
      const dStr = formatDateStr(d);
      const isCurrentMonth = d.getMonth() === currentMonth;
      const isToday = dStr === todayStr;
      const dayEvents = (Array.isArray(filteredEvents) ? filteredEvents : []).filter(ev => ev.date === dStr);

      cells.push({
        dateObj: d,
        dateStr: dStr,
        dayNum: d.getDate(),
        isCurrentMonth,
        isToday,
        events: dayEvents
      });
    }
    return cells;
  }, [currentYear, currentMonth, filteredEvents, todayStr]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDayStr) return [];
    return (Array.isArray(filteredEvents) ? filteredEvents : []).filter(ev => ev.date === selectedDayStr);
  }, [selectedDayStr, filteredEvents]);

  const upcomingListEvents = useMemo(() => {
    return [...(Array.isArray(filteredEvents) ? filteredEvents : [])]
      .filter(ev => ev.date >= todayStr)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')))
      .slice(0, 40);
  }, [filteredEvents, todayStr]);

  const navigateMonth = (dir) => {
    setViewDate(new Date(currentYear, currentMonth + dir, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDayStr(todayStr);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDayStr) return;
    onCreateEvent({
      title: newTitle.trim(),
      date: selectedDayStr,
      time: newTime.trim() || 'Ganztägig',
      member: newMember
    });
    setNewTitle('');
    setShowAddFormInSheet(false);
  };

  const formatNiceGermanDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const wd = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][d.getDay()];
    return wd + ', ' + parts[2] + '.' + parts[1] + '.' + parts[0];
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden select-none">
      {/* ============================================================================
          SCHLANKE GOOGLE-KALENDER KOPFLEISTE (MONATSWECHSEL, PERSONEN-PILL & + TERMIN)
         ============================================================================ */}
      <div className={'shrink-0 px-2.5 py-2 border-b flex items-center justify-between gap-1.5 ' + themeStyles.header}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="tw-nav-inactive w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={jumpToToday}
            className="px-2 py-1 rounded-xl text-left min-w-0"
          >
            <div className="font-black text-sm sm:text-base leading-none truncate">
              {MONTH_NAMES_DE[currentMonth]} {currentYear}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="tw-nav-inactive w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={jumpToToday}
            className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[11px] font-black"
          >
            Heute
          </button>

          {/* Kompaktes Personen-Dropdown direkt in der Kalenderleiste */}
          {onSelectPerson && (
            <select
              value={selectedPerson}
              onChange={(e) => onSelectPerson(e.target.value)}
              className={'h-8 px-2 rounded-xl border text-[11px] font-black ' + themeStyles.input}
            >
              <option value="all" className="bg-slate-800 text-white">👨‍👩‍👧‍👦 Alle</option>
              {safeMembers.filter(m => m.id !== 'all').map(m => (
                <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                  👤 {m.name.split(' ')[0]}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setViewMode(prev => prev === 'month' ? 'list' : 'month')}
            className="tw-nav-inactive p-2 rounded-xl"
            title="Zwischen Vollbild-Monat und Terminliste wechseln"
          >
            {viewMode === 'month' ? <List className="w-4 h-4 text-sky-300" /> : <CalendarIcon className="w-4 h-4 text-sky-300" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedDayStr(todayStr);
              setShowAddFormInSheet(true);
            }}
            className="tw-active-nav w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* ============================================================================
          ANSICHT 1: VOLLBILD-MONATSANSICHT WIE IM GOOGLE KALENDER (ÜBER DEN GANZEN SCREEN!)
         ============================================================================ */}
      {viewMode === 'month' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* WOCHENTAGS-KOPFZEILE (MO - SO) */}
          <div className={'grid grid-cols-7 border-b shrink-0 ' + themeStyles.header}>
            {WEEKDAYS_SHORT_DE.map((wd, i) => (
              <div
                key={wd}
                className={'py-1.5 text-center text-[11px] font-black uppercase tracking-wider ' +
                  (i >= 5 ? 'text-amber-400' : 'opacity-75')}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* VOLLBILD-TAGESRASTER (auto-rows-fr STRECKT DIE TAGE AUF 100% BILDSCHIRMHÖHE) */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0 bg-black/20">
            {monthGridCells.map(cell => {
              const isSelected = selectedDayStr === cell.dateStr;
              const visibleEvents = cell.events.slice(0, 3);
              const extraCount = cell.events.length - visibleEvents.length;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDayStr(cell.dateStr);
                    setShowAddFormInSheet(false);
                  }}
                  className={
                    'border-r border-b border-white/10 p-0.5 sm:p-1 flex flex-col min-w-0 min-h-0 overflow-hidden cursor-pointer transition-colors ' +
                    (!cell.isCurrentMonth ? 'opacity-35 bg-black/30 ' : '') +
                    (cell.isToday ? 'bg-sky-500/15 ' : '') +
                    (isSelected ? 'ring-2 ring-inset ring-sky-400 bg-sky-500/20 ' : 'hover:bg-white/5 ')
                  }
                >
                  {/* TAGESZAHL OBEN IM FELD */}
                  <div className="flex items-center justify-center mb-0.5 shrink-0">
                    <span
                      className={
                        'w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ' +
                        (cell.isToday
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'text-slate-200')
                      }
                    >
                      {cell.dayNum}
                    </span>
                  </div>

                  {/* FARBIGE TERMIN-BALKEN DIREKT IM TAGESFELD (WIE IM GOOGLE KALENDER) */}
                  <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                    {visibleEvents.map(ev => {
                      const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                      const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                      return (
                        <div
                          key={ev.id}
                          style={{
                            backgroundColor: hex + '38',
                            borderLeft: '3px solid ' + hex
                          }}
                          className="px-1 py-0.5 rounded-r text-[9px] sm:text-[10px] font-extrabold text-white leading-tight truncate"
                        >
                          {ev.title}
                        </div>
                      );
                    })}

                    {extraCount > 0 && (
                      <div className="text-[9px] font-black text-amber-300 text-center leading-none mt-auto">
                        +{extraCount} mehr
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ANSICHT 2: KOMPAKTE TERMINLISTE */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {upcomingListEvents.length === 0 ? (
            <div className={'p-8 rounded-3xl border text-center text-xs font-bold opacity-60 ' + themeStyles.card}>
              📅 Keine kommenden Termine in dieser Auswahl.
            </div>
          ) : (
            upcomingListEvents.map(ev => {
              const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
              const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedDayStr(ev.date)}
                  style={{ borderLeft: '5px solid ' + hex }}
                  className={'p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ' + themeStyles.card}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black text-sky-400">
                      {ev.date.slice(8, 10)}.{ev.date.slice(5, 7)}.{ev.date.slice(0, 4)} • {ev.time || 'Ganztägig'}
                    </div>
                    <div className="font-black text-sm sm:text-base break-words mt-0.5">
                      {ev.title}
                    </div>
                    <div className="text-xs font-bold opacity-75 mt-0.5">
                      👤 {mem?.name}
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
            })
          )}
        </div>
      )}

      {/* ============================================================================
          GOOGLE-KALENDER TAGES-DRAWER (ÖFFNET SICH BEIM TIPP AUF EINEN TAG)
         ============================================================================ */}
      {selectedDayStr && (
        <div
          onClick={() => setSelectedDayStr(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center p-2.5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border-2 p-4 shadow-2xl space-y-3.5 max-h-[82dvh] flex flex-col ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 shrink-0">
              <div>
                <div className="text-[10px] font-black uppercase text-sky-400">
                  📅 Tagesübersicht
                </div>
                <h3 className="text-base font-black">
                  {formatNiceGermanDate(selectedDayStr)}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddFormInSheet(prev => !prev)}
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

            {showAddFormInSheet && (
              <form onSubmit={handleCreateSubmit} className={'p-3 rounded-2xl border space-y-2.5 shrink-0 ' + themeStyles.subtle}>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Termin-Titel eingeben..."
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Uhrzeit (z.B. 15:00 - 16:00)"
                    className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
                  />
                  <select
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className={'px-3 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  >
                    {safeMembers.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="tw-active-nav w-full py-2.5 rounded-xl text-xs font-black shadow-md"
                >
                  ✅ Termin speichern
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {selectedDayEvents.length === 0 ? (
                <div className="py-6 text-center text-xs font-bold opacity-60">
                  Keine Termine an diesem Tag. Tippe oben rechts auf „+ Termin“.
                </div>
              ) : (
                selectedDayEvents.map(ev => {
                  const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                  const hex = COLOR_PALETTES[mem?.color]?.hex || '#0ea5e9';
                  return (
                    <div
                      key={ev.id}
                      style={{ borderLeft: '5px solid ' + hex }}
                      className={'p-3 rounded-2xl border flex items-center justify-between gap-2.5 ' + themeStyles.subtle}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-sm sm:text-base break-words leading-snug">
                            {ev.title}
                          </div>
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
                        onClick={() => onDeleteEvent(ev)}
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
    </div>
  );
}
