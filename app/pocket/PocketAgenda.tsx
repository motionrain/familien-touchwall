// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import * as Cfg from '../touchwallConfig';

const {
  formatDateStr,
  addDays,
  getMonday,
  getISOWeek,
  WEEKDAYS_SHORT,
  MONTHS_NAMES,
  getBWHolidayName,
  getBWVacationName,
  COLOR_PALETTES
} = Cfg;

export default function PocketAgenda({
  safeMembers,
  filteredEvents,
  selectedPerson,
  todayStr,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  onCreateEvent,
  onDeleteEvent
}) {
  const [calendarSubView, setCalendarSubView] = useState('week');
  const [calCursorDate, setCalCursorDate] = useState(() => new Date());
  const [selectedMonthDayStr, setSelectedMonthDayStr] = useState(() => todayStr);

  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState(() => todayStr);
  const [newEvTime, setNewEvTime] = useState('15:00 - 16:00');
  const [newEvMember, setNewEvMember] = useState('all');

  const navigateCalendarCursor = (dir) => {
    if (calendarSubView === 'month') {
      const next = new Date(calCursorDate.getFullYear(), calCursorDate.getMonth() + dir, 1);
      setCalCursorDate(next);
      setSelectedMonthDayStr(formatDateStr(next));
    } else {
      setCalCursorDate(addDays(calCursorDate, dir * 7));
    }
  };

  const weekMonday = useMemo(() => getMonday(calCursorDate), [calCursorDate]);
  const weekDaysList = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i)), [weekMonday]);

  const monthGridCells = useMemo(() => {
    const year = calCursorDate.getFullYear();
    const month = calCursorDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calCursorDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEvTitle.trim()) return;
    onCreateEvent({
      title: newEvTitle.trim(),
      date: newEvDate || todayStr,
      time: newEvTime.trim() || 'Ganztägig',
      member: newEvMember || (selectedPerson === 'all' ? 'all' : selectedPerson)
    });
    setNewEvTitle('');
    setNewEventModalOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className={'p-2.5 rounded-2xl border space-y-2.5 ' + themeStyles.card}>
        <div className="flex items-center justify-between gap-2">
          <div className="grid grid-cols-3 gap-1 flex-1 p-1 rounded-xl bg-black/25">
            {[
              { id: 'week',  label: '📆 Woche' },
              { id: 'month', label: '🗓️ Monat' },
              { id: 'list',  label: '📋 Übersicht' }
            ].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setCalendarSubView(v.id)}
                className={'py-2 rounded-lg text-xs font-extrabold ' + (calendarSubView === v.id ? 'tw-active-nav' : 'opacity-75')}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setNewEvDate(selectedMonthDayStr || todayStr);
              setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
              setNewEventModalOpen(true);
            }}
            className="tw-glow-btn px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Termin
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigateCalendarCursor(-1)} className="tw-glow-btn w-8 h-8 rounded-xl flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCalCursorDate(now);
                setSelectedMonthDayStr(formatDateStr(now));
              }}
              className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold"
            >
              Heute
            </button>
            <button onClick={() => navigateCalendarCursor(1)} className="tw-glow-btn w-8 h-8 rounded-xl flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-black">
            {calendarSubView === 'month'
              ? (MONTHS_NAMES[calCursorDate.getMonth()] + ' ' + calCursorDate.getFullYear())
              : ('KW ' + getISOWeek(weekMonday) + ' • ' + weekDaysList[0].getDate() + '.' + (weekDaysList[0].getMonth() + 1) + '. – ' + weekDaysList[6].getDate() + '.' + (weekDaysList[6].getMonth() + 1) + '.')}
          </span>
        </div>
      </div>

      {calendarSubView === 'week' && (
        <div className="space-y-2">
          {weekDaysList.map(dayObj => {
            const dStr = formatDateStr(dayObj);
            const isToday = dStr === todayStr;
            const hol = getBWHolidayName(dStr);
            const vac = getBWVacationName(dStr);
            const dayEvs = filteredEvents.filter(e => e.date === dStr);

            return (
              <div key={dStr} className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.card + (isToday ? ' ring-2 ring-orange-400' : '')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={'w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center ' + (isToday ? 'bg-orange-500 text-white' : 'bg-black/30')}>
                      {WEEKDAYS_SHORT[dayObj.getDay()]}
                    </span>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm">
                        {dayObj.getDate()}. {MONTHS_NAMES[dayObj.getMonth()]}
                      </div>
                      {(hol || vac) && (
                        <div className="text-[10px] font-extrabold text-emerald-400">
                          {hol ? ('🎌 ' + hol) : ('🏖️ ' + vac)}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewEvDate(dStr);
                      setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                      setNewEventModalOpen(true);
                    }}
                    className="tw-glow-btn w-8 h-8 rounded-xl font-black text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {dayEvs.length === 0 ? (
                  <div className="text-[11px] opacity-45 pl-10">Keine Termine</div>
                ) : (
                  <div className="space-y-1.5 pl-1">
                    {dayEvs.map(ev => {
                      const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                      const st = getMemberStyles(mem);
                      return (
                        <div key={ev.id} style={st.cardStyle} className="px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs leading-snug break-words">{ev.title}</div>
                            <div className="text-[10px] font-bold opacity-90">
                              ⏰ {ev.time || 'Ganztägig'} • {mem.name.split(' ')[0]}
                            </div>
                          </div>
                          <button onClick={() => onDeleteEvent(ev)} className="p-2 rounded-lg bg-black/25 text-white/80 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {calendarSubView === 'month' && (
        <div className="space-y-3">
          <div className={'p-3 rounded-3xl border ' + themeStyles.card}>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase opacity-70 mb-1.5">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => <div key={w}>{w}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthGridCells.map((cellDate, idx) => {
                if (!cellDate) return <div key={'empty_' + idx} className="h-12 rounded-xl bg-black/10" />;
                const dStr = formatDateStr(cellDate);
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedMonthDayStr;
                const hol = getBWHolidayName(dStr);
                const vac = getBWVacationName(dStr);
                const dayEvs = filteredEvents.filter(e => e.date === dStr);

                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedMonthDayStr(dStr)}
                    className={'h-13 p-1 rounded-xl border flex flex-col items-center justify-between ' +
                      (isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 border-sky-400' : isToday ? 'border-orange-400 bg-orange-500/15' : themeStyles.subtle)}
                  >
                    <span className={'text-xs font-black ' + (isToday ? 'text-orange-400' : hol ? 'text-rose-400' : vac ? 'text-emerald-400' : '')}>
                      {cellDate.getDate()}
                    </span>

                    <div className="w-full flex flex-col gap-0.5 overflow-hidden">
                      {dayEvs.slice(0, 2).map(ev => {
                        const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                        const hex = COLOR_PALETTES[mem.color]?.hex || '#0ea5e9';
                        return (
                          <span key={ev.id} style={{ backgroundColor: hex }} className="w-full px-1 rounded text-[8px] font-black text-white truncate leading-tight">
                            {ev.title}
                          </span>
                        );
                      })}
                      {dayEvs.length > 2 && <span className="text-[8px] font-black text-sky-300">+{dayEvs.length - 2}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={'p-3.5 rounded-3xl border space-y-2 ' + themeStyles.card}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-sky-400">
                📅 Termine am {selectedMonthDayStr.slice(8, 10)}.{selectedMonthDayStr.slice(5, 7)}.{selectedMonthDayStr.slice(0, 4)}
              </span>
              <button
                onClick={() => {
                  setNewEvDate(selectedMonthDayStr);
                  setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                  setNewEventModalOpen(true);
                }}
                className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-black"
              >
                + Termin hier
              </button>
            </div>

            {filteredEvents.filter(e => e.date === selectedMonthDayStr).length === 0 ? (
              <div className="text-xs opacity-50 py-2">Keine Termine an diesem Tag.</div>
            ) : (
              filteredEvents.filter(e => e.date === selectedMonthDayStr).map(ev => {
                const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                const st = getMemberStyles(mem);
                return (
                  <div key={ev.id} style={st.cardStyle} className="p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-sm">{ev.title}</div>
                      <div className="text-xs opacity-90">⏰ {ev.time} • {mem.name}</div>
                    </div>
                    <button onClick={() => onDeleteEvent(ev)} className="p-2 rounded-xl bg-black/25">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {calendarSubView === 'list' && (
        <div className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
          <h3 className="font-extrabold text-sm">📋 Alle kommenden Termine</h3>
          {filteredEvents
            .filter(e => e.date >= todayStr)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .slice(0, 25)
            .map(ev => {
              const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
              const st = getMemberStyles(mem);
              return (
                <div key={ev.id} style={st.cardStyle} className="p-3 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs sm:text-sm truncate">{ev.title}</div>
                      <div className="text-[11px] font-bold opacity-90">
                        📅 {ev.date.slice(8, 10)}.{ev.date.slice(5, 7)}. • ⏰ {ev.time} • {mem.name.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onDeleteEvent(ev)} className="p-2 rounded-xl bg-black/25 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={handleSubmit} className={'w-full max-w-md rounded-3xl border-2 p-5 space-y-3.5 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">📅 Neuer Termin</h3>
              <button type="button" onClick={() => setNewEventModalOpen(false)} className="tw-nav-inactive p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={newEvTitle}
              onChange={(e) => setNewEvTitle(e.target.value)}
              placeholder="Was steht an? (z.B. Training, Zahnarzt)"
              className={'w-full px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input type="date" value={newEvDate} onChange={(e) => setNewEvDate(e.target.value)} className={'px-3 py-2.5 rounded-2xl border text-xs font-bold ' + themeStyles.input} />
              <input type="text" value={newEvTime} onChange={(e) => setNewEvTime(e.target.value)} placeholder="15:00 - 16:00" className={'px-3 py-2.5 rounded-2xl border text-xs font-bold ' + themeStyles.input} />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {safeMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setNewEvMember(m.id)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' + (newEvMember === m.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  {m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <button type="submit" className="tw-glow-btn w-full py-3 rounded-2xl font-black text-sm">
              💾 Termin speichern
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
