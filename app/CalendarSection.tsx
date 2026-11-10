// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Palette, Copy } from 'lucide-react';
import {
  formatDateStr, addDays, getMonday, getISOWeek,
  WEEKDAYS_SHORT, MONTHS_NAMES, getBWHolidayName,
  getBWVacationName, getBWVacationInfo
} from './touchwallConfig';

export default function CalendarSection({
  currentView,
  currentBaseDate,
  todayStr,
  visibleMembers,
  members,
  events,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  renderNotifyBadgeOnCard,
  setActiveSection,
  openNewEventModal,
  openEditEventModal,
  handleCalendarCellClick,
  duplicateEventToTarget,
  transferEvent,
  copiedEvent,
  setCopiedEvent,
  setYearDayModal,
  showToast
}) {
  const [draggedEv, setDraggedEv] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);

  const safeVisibleMembers = Array.isArray(visibleMembers) ? visibleMembers : [];
  const safeAllMembers = Array.isArray(members) ? members : [];
  const safeEvents = Array.isArray(events) ? events : [];

  // Gemeinsamer Style-Block für den 3D-Hover-Zoom & den "Nach-innen-gedrückt"-Touch-Effekt
  const tileAnimationStyles = (
    <style>{`
      .tw-day-tile {
        position: relative;
        transition:
          transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
          filter 0.2s ease,
          border-radius 0.2s ease;
        will-change: transform, box-shadow;
      }
      .tw-day-tile:hover {
        transform: scale(1.028);
        z-index: 15;
        border-radius: 14px;
        filter: brightness(1.12);
        box-shadow:
          0 14px 28px -6px rgba(0, 0, 0, 0.55),
          0 0 22px rgba(56, 189, 248, 0.45),
          inset 0 1px 2px rgba(255, 255, 255, 0.28);
      }
      .tw-day-tile:active {
        transform: scale(0.962) translateY(1.5px) !important;
        z-index: 15;
        border-radius: 14px;
        filter: brightness(0.92);
        box-shadow:
          inset 0 7px 18px rgba(0, 0, 0, 0.72),
          inset 0 0 20px rgba(56, 189, 248, 0.55),
          0 0 10px rgba(56, 189, 248, 0.35) !important;
        transition:
          transform 0.07s ease-out,
          box-shadow 0.07s ease-out !important;
      }
      .tw-event-chip {
        transition:
          transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 0.18s ease,
          filter 0.18s ease;
      }
      .tw-event-chip:hover {
        transform: translateY(-2px) scale(1.02);
        filter: brightness(1.08);
        box-shadow:
          0 8px 18px -3px rgba(0, 0, 0, 0.5),
          0 0 14px rgba(255, 255, 255, 0.25);
      }
      .tw-event-chip:active {
        transform: scale(0.95) translateY(1px) !important;
        filter: brightness(0.9);
        box-shadow:
          inset 0 5px 12px rgba(0, 0, 0, 0.65),
          0 0 12px rgba(56, 189, 248, 0.5) !important;
      }
    `}</style>
  );

  // =========================================================
  // ANSICHT 1: 1-WOCHE & 2-WOCHEN
  // =========================================================
  if (currentView === '1w' || currentView === '2w') {
    const numDays = currentView === '1w' ? 7 : 14;
    const startMonday = getMonday(currentBaseDate);
    const days = Array.from({ length: numDays }, (_, i) => addDays(startMonday, i));
    const isTwoWeeks = numDays === 14;
    const kw1 = getISOWeek(startMonday);
    const kw2 = getISOWeek(addDays(startMonday, 7));
    const gridCols = `185px repeat(${numDays}, minmax(${isTwoWeeks ? '95px' : '125px'}, 1fr))`;

    return (
      <div className="min-w-full min-h-full flex flex-col">
        {tileAnimationStyles}
        <div className={`sticky top-0 z-20 shadow-sm ${themeStyles.card}`}>
          <div className={`grid text-xs font-extrabold uppercase tracking-wider border-b ${themeStyles.banner} ${themeStyles.divider}`} style={{ gridTemplateColumns: gridCols }}>
            <div className={`px-3 py-2 bg-black/25 flex items-center border-r-2 ${themeStyles.divider}`}>Zeitraum</div>
            <div className="px-3 py-2 flex items-center justify-between" style={{ gridColumn: 'span 7' }}>
              <span className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-500 text-white">KW {kw1}</span>
                <span>{days[0].getDate()}.{days[0].getMonth() + 1}. – {days[6].getDate()}.{days[6].getMonth() + 1}.</span>
              </span>
            </div>
            {isTwoWeeks && (
              <div className={`px-3 py-2 flex items-center justify-between bg-black/20 border-l-4 ${themeStyles.divider}`} style={{ gridColumn: 'span 7' }}>
                <span className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">KW {kw2}</span>
                  <span>{days[7].getDate()}.{days[7].getMonth() + 1}. – {days[13].getDate()}.{days[13].getMonth() + 1}.</span>
                </span>
              </div>
            )}
          </div>

          <div className={`grid border-b-2 ${themeStyles.divider}`} style={{ gridTemplateColumns: gridCols }}>
            <div className={`p-3 flex items-center justify-between border-r-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
              <span className="text-xs font-extrabold uppercase tracking-wider">Familie</span>
              <button onClick={() => setActiveSection('design')} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">
                🎨 Farben
              </button>
            </div>

            {days.map((d, idx) => {
              const dateStr = formatDateStr(d);
              const isToday = dateStr === todayStr;
              const holiday = getBWHolidayName(dateStr);
              const vacation = getBWVacationName(dateStr);

              return (
                <div
                  key={dateStr}
                  className={`px-2.5 py-2 border-r-2 flex flex-col justify-between ${themeStyles.divider} ${idx === 7 ? 'border-l-4' : ''} ${
                    holiday ? 'bg-rose-500/20' : vacation ? 'bg-emerald-500/15' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isToday ? 'text-orange-400' : themeStyles.textMuted}`}>
                        {WEEKDAYS_SHORT[d.getDay()]},
                      </span>
                      <span className={`w-7 h-7 text-sm rounded-full flex items-center justify-center font-extrabold ${
                        isToday ? 'bg-orange-500 text-white shadow-sm' : ''
                      }`}>
                        {d.getDate()}.
                      </span>
                    </div>
                    <button
                      onClick={() => openNewEventModal(dateStr, 'all')}
                      className="w-6 h-6 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {holiday && <div className="text-[10px] font-extrabold text-rose-400 truncate mt-0.5">🎌 {holiday}</div>}
                  {!holiday && vacation && <div className="text-[10px] font-extrabold text-emerald-400 truncate mt-0.5">🏖️ {vacation}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col divide-y-2 ${themeStyles.divider}`}>
          {safeVisibleMembers.map(member => {
            const st = getMemberStyles(member);
            return (
              <div key={member.id} className="grid flex-1 min-h-[128px] items-stretch" style={{ gridTemplateColumns: gridCols }}>
                <div style={st.headerStyle} className={`p-3 border-r-2 flex flex-col justify-center sticky left-0 z-20 ${themeStyles.divider}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderAvatar(member, 'w-11 h-11', 'text-lg')}
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm sm:text-base truncate">{member.name}</div>
                        <div className={`text-xs font-semibold truncate ${themeStyles.textMuted}`}>{member.role}</div>
                      </div>
                    </div>
                    <button onClick={() => setActiveSection('design')} className="p-1.5 rounded-lg hover:bg-black/20 opacity-70 hover:opacity-100 cursor-pointer">
                      <Palette className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {days.map((d, idx) => {
                  const dateStr = formatDateStr(d);
                  const cellKey = `${dateStr}_${member.id}`;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = dateStr === todayStr;
                  const isDragTarget = dragOverCell === cellKey;
                  const cellEvents = safeEvents.filter(e => e.date === dateStr && e.member === member.id);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleCalendarCellClick(dateStr, member.id)}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (draggedEv && dragOverCell !== cellKey) setDragOverCell(cellKey);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedEv && dragOverCell !== cellKey) setDragOverCell(cellKey);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          if (dragOverCell === cellKey) setDragOverCell(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCell(null);
                        if (draggedEv) {
                          if (e.ctrlKey || e.altKey) {
                            duplicateEventToTarget(draggedEv, member.id, dateStr);
                          } else {
                            transferEvent(draggedEv.id, member.id, dateStr);
                          }
                          setDraggedEv(null);
                        }
                      }}
                      style={st.cellStyle(isWeekend)}
                      className={`tw-day-tile p-2 border-r-2 flex flex-col gap-1.5 cursor-pointer ${themeStyles.divider} ${
                        idx === 7 ? 'border-l-4' : ''
                      } ${isToday ? 'ring-2 ring-inset ring-orange-400' : ''} ${
                        isDragTarget
                          ? 'ring-4 ring-inset ring-sky-400 !bg-sky-500/25 shadow-[0_0_28px_rgba(56,189,248,0.75)] scale-[1.03] animate-pulse z-20 rounded-xl'
                          : ''
                      }`}
                    >
                      {copiedEvent && (
                        <div className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-dashed border-amber-400/60 text-[10px] font-extrabold text-center opacity-75 pointer-events-none">
                          + 📋 Hier einfügen
                        </div>
                      )}

                      {cellEvents.map(ev => {
                        const isBeingDragged = draggedEv && String(draggedEv.id) === String(ev.id);
                        return (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={() => setDraggedEv(ev)}
                            onDragEnd={() => {
                              setDraggedEv(null);
                              setDragOverCell(null);
                            }}
                            onClick={(e) => openEditEventModal(e, ev)}
                            style={st.cardStyle}
                            className={`tw-event-chip group rounded-xl p-2 shadow-sm flex flex-col justify-between cursor-grab active:cursor-grabbing relative ${
                              isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-sky-400' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="font-extrabold text-xs sm:text-sm leading-snug break-words flex-1">{ev.title}</div>
                              <button
                                type="button"
                                title="Termin kopieren & bei jemand anderem einfügen"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCopiedEvent(ev);
                                  showToast('Termin kopiert', `„${ev.title}“ – klicke jetzt auf ein beliebiges Feld zum Einfügen!`, '📋');
                                }}
                                className="opacity-70 hover:opacity-100 p-1 rounded-lg bg-black/25 hover:bg-black/40 text-white shrink-0 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-1 flex-wrap">
                              <span className="text-[11px] opacity-95 font-bold">{ev.time}</span>
                              {renderNotifyBadgeOnCard(ev)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================
  // ANSICHT 2: 4-WOCHEN-ÜBERSICHT
  // =========================================================
  if (currentView === '4w') {
    const startMonday = getMonday(currentBaseDate);
    return (
      <div className="p-5 space-y-6">
        {tileAnimationStyles}
        {[0, 1, 2, 3].map(w => {
          const weekStart = addDays(startMonday, w * 7);
          const weekEnd = addDays(weekStart, 6);
          const kw = getISOWeek(weekStart);
          return (
            <div key={w} className={`rounded-3xl border-2 shadow-md overflow-hidden ${themeStyles.card}`}>
              <div className={`px-5 py-2.5 flex items-center justify-between ${themeStyles.banner}`}>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-0.5 rounded-lg bg-indigo-500 text-xs font-black">KW {kw}</span>
                  <span className="font-extrabold text-sm sm:text-base">
                    {weekStart.getDate()}. {MONTHS_NAMES[weekStart.getMonth()]} – {weekEnd.getDate()}. {MONTHS_NAMES[weekEnd.getMonth()]} {weekEnd.getFullYear()}
                  </span>
                </div>
                <span className="text-xs font-bold opacity-75">Woche {w + 1} von 4</span>
              </div>

              <div className={`grid border-b-2 ${themeStyles.divider}`} style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))' }}>
                <div className={`p-2.5 text-xs font-extrabold uppercase flex items-center justify-center border-r-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                  Person
                </div>
                {Array.from({ length: 7 }, (_, d) => {
                  const dayObj = addDays(weekStart, d);
                  const dateStr = formatDateStr(dayObj);
                  const isToday = dateStr === todayStr;
                  const hol = getBWHolidayName(dateStr);
                  const vac = getBWVacationName(dateStr);
                  return (
                    <div key={d} className={`px-3 py-2 border-r-2 flex items-center justify-between ${themeStyles.divider}`}>
                      <span className={`text-xs font-extrabold truncate ${isToday ? 'bg-orange-500 text-white px-2 py-0.5 rounded-full' : ''}`}>
                        {WEEKDAYS_SHORT[dayObj.getDay()]}, {dayObj.getDate()}. {hol ? '🎌' : vac ? '🏖️' : ''}
                      </span>
                      <button onClick={() => openNewEventModal(dateStr, 'all')} className="opacity-60 hover:opacity-100 font-bold text-sm cursor-pointer">+</button>
                    </div>
                  );
                })}
              </div>

              <div className={`divide-y ${themeStyles.divider}`}>
                {safeVisibleMembers.map(member => {
                  const st = getMemberStyles(member);
                  return (
                    <div key={member.id} className="grid items-stretch" style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))' }}>
                      <div style={st.headerStyle} className={`px-3 py-2 border-r-2 flex items-center gap-2 z-20 ${themeStyles.divider}`}>
                        {renderAvatar(member, 'w-7 h-7', 'text-xs')}
                        <span className="text-xs font-bold truncate">{member.name.split(' ')[0]}</span>
                      </div>
                      {Array.from({ length: 7 }, (_, d) => {
                        const dayObj = addDays(weekStart, d);
                        const dateStr = formatDateStr(dayObj);
                        const cellKey = `4w_${dateStr}_${member.id}`;
                        const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;
                        const isDragTarget = dragOverCell === cellKey;
                        const cellEvents = safeEvents.filter(e => e.date === dateStr && e.member === member.id);
                        return (
                          <div
                            key={d}
                            onClick={() => handleCalendarCellClick(dateStr, member.id)}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              if (draggedEv && dragOverCell !== cellKey) setDragOverCell(cellKey);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (draggedEv && dragOverCell !== cellKey) setDragOverCell(cellKey);
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                if (dragOverCell === cellKey) setDragOverCell(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverCell(null);
                              if (draggedEv) {
                                transferEvent(draggedEv.id, member.id, dateStr);
                                setDraggedEv(null);
                              }
                            }}
                            style={st.cellStyle(isWeekend)}
                            className={`tw-day-tile min-h-[58px] p-1.5 border-r-2 flex flex-col gap-1 cursor-pointer ${themeStyles.divider} ${
                              isDragTarget
                                ? 'ring-4 ring-inset ring-sky-400 !bg-sky-500/25 shadow-[0_0_25px_rgba(56,189,248,0.75)] scale-[1.03] animate-pulse z-20 rounded-xl'
                                : ''
                            }`}
                          >
                            {cellEvents.map(ev => (
                              <div
                                key={ev.id}
                                draggable
                                onDragStart={() => setDraggedEv(ev)}
                                onDragEnd={() => { setDraggedEv(null); setDragOverCell(null); }}
                                onClick={(e) => openEditEventModal(e, ev)}
                                style={st.cardStyle}
                                className="tw-event-chip px-2 py-1 rounded text-xs font-bold flex items-center justify-between gap-1 cursor-grab"
                              >
                                <span className="truncate">{ev.title}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCopiedEvent(ev);
                                    showToast('Termin kopiert', `„${ev.title}“ – klicke auf ein Feld zum Einfügen!`, '📋');
                                  }}
                                  className="opacity-70 hover:opacity-100 shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // =========================================================
  // ANSICHT 3: JAHRESWAND (BW)
  // =========================================================
  const year = currentBaseDate.getFullYear();
  return (
    <div className="p-3 w-full h-full flex flex-col gap-2 overflow-hidden">
      {tileAnimationStyles}
      <div className={`px-4 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shrink-0 ${themeStyles.card}`}>
        <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">📅 Jahreswand {year} (Baden-Württemberg)</span>
        <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40">🎌 Gesetzlicher Feiertag BW</span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-500">🏖️ Schulferien BW (Name am 1. Tag + grüner Rand)</span>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/40">🟠 Heute</span>
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden flex-1 grid grid-cols-12 divide-x min-h-0 ${themeStyles.card} ${themeStyles.divider}`}>
        {Array.from({ length: 12 }, (_, month) => (
          <div key={month} className="flex flex-col min-w-0 overflow-hidden h-full">
            <div className={`font-black text-xs uppercase py-2 px-1 text-center shrink-0 truncate tracking-wide ${themeStyles.banner}`}>
              {MONTHS_NAMES[month]}
            </div>
            <div className={`divide-y flex-1 flex flex-col min-h-0 ${themeStyles.divider}`}>
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const testDate = new Date(year, month, day);
                if (testDate.getMonth() !== month) {
                  return <div key={day} className="flex-1 min-h-[15px] bg-black/20" />;
                }
                const dateStr = formatDateStr(testDate);
                const dow = testDate.getDay();
                const isWeekend = dow === 0 || dow === 6;
                const isToday = dateStr === todayStr;
                const hol = getBWHolidayName(dateStr);
                const vacInfo = getBWVacationInfo(dateStr);
                const dayEvents = safeEvents.filter(e => e.date === dateStr);
                const firstEv = dayEvents[0];
                const firstMem = firstEv ? safeAllMembers.find(m => m.id === firstEv.member) || safeAllMembers[0] : null;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (copiedEvent) {
                        duplicateEventToTarget(copiedEvent, copiedEvent.member || 'all', dateStr);
                        return;
                      }
                      setYearDayModal({ open: true, dateStr, newTitle: '', newTime: 'Ganztägig', newMember: 'all' });
                    }}
                    title={
                      [
                        hol ? `🎌 ${hol}` : '',
                        vacInfo ? `🏖️ ${vacInfo.name}` : '',
                        ...dayEvents.map(e => `${e.title} (${e.time || 'Ganztägig'})`)
                      ].filter(Boolean).join(' • ')
                    }
                    style={
                      vacInfo && !hol
                        ? { borderLeft: '6px solid #10b981', backgroundColor: themeStyles.dark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.18)' }
                        : hol
                        ? { borderLeft: '6px solid #f43f5e', backgroundColor: themeStyles.dark ? 'rgba(244, 63, 94, 0.28)' : 'rgba(244, 63, 94, 0.18)' }
                        : undefined
                    }
                    className={`tw-day-tile flex-1 min-h-[16px] px-1.5 flex items-center gap-1 cursor-pointer overflow-hidden ${
                      !hol && !vacInfo && isWeekend ? 'bg-black/15' : ''
                    } ${isToday ? 'ring-2 ring-inset ring-orange-500' : ''}`}
                  >
                    <span className={`w-4 font-black text-[11px] sm:text-xs shrink-0 leading-none ${hol ? 'text-rose-400' : ''}`}>
                      {String(day).padStart(2, '0')}
                    </span>
                    <span className={`w-4 text-[10px] font-bold uppercase shrink-0 leading-none ${isWeekend ? 'opacity-90' : 'opacity-65'}`}>
                      {WEEKDAYS_SHORT[dow]}
                    </span>

                    <div className="flex-1 flex items-center gap-1 min-w-0 overflow-hidden">
                      {firstEv && firstMem ? (
                        <span style={getMemberStyles(firstMem).badgeStyle} className="px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-extrabold truncate flex-1 leading-tight shadow-2xs">
                          {firstEv.title}
                        </span>
                      ) : hol ? (
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-400 truncate flex-1 leading-tight">
                          🎌 {hol}
                        </span>
                      ) : vacInfo && vacInfo.isFirstDay ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black truncate flex-1 leading-tight shadow-2xs">
                          🏖️ {vacInfo.shortName}
                        </span>
                      ) : null}

                      {dayEvents.length > 1 && (
                        <span className="px-1 rounded bg-indigo-600 text-white text-[9px] font-black shrink-0">
                          +{dayEvents.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
