// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';

export default function SchoolSection({
  members,
  schoolData,
  setSchoolData,
  activeSchoolChild,
  setActiveSchoolChild,
  setSchoolModal,
  themeStyles,
  getMemberStyles,
  renderAvatar
}) {
  const [newSchoolNote, setNewSchoolNote] = useState('');

  const childMember = (Array.isArray(members) ? members : []).find(m => m.id === activeSchoolChild) || members?.[3] || members?.[0];
  const sched = schoolData?.[activeSchoolChild] || { periods: [], slots: {}, announcements: [] };
  const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={'p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
        <div className="flex items-center gap-4">
          {renderAvatar(childMember, 'w-14 h-14', 'text-2xl')}
          <div>
            <h2 className="text-2xl font-extrabold">Stundenplan & Schul-Änderungen ({childMember?.name || 'Kind'})</h2>
            <p className={'text-sm font-semibold ' + themeStyles.textMuted}>Tippe auf eine Stunde zum Ändern.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveSchoolChild('dean')}
            className={'px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer ' + (activeSchoolChild === 'dean' ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.subtle)}
          >
            👦 {(Array.isArray(members) ? members : []).find(m => m.id === 'dean')?.name || 'Kind 1'}
          </button>
          <button
            onClick={() => setActiveSchoolChild('valentina')}
            className={'px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer ' + (activeSchoolChild === 'valentina' ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.subtle)}
          >
            👧 {(Array.isArray(members) ? members : []).find(m => m.id === 'valentina')?.name || 'Kind 2'}
          </button>
          <button
            onClick={() => {
              setSchoolData(prev => ({
                ...prev,
                [activeSchoolChild]: {
                  ...prev[activeSchoolChild],
                  periods: [...(prev[activeSchoolChild]?.periods || []), ((prev[activeSchoolChild]?.periods || []).length + 1) + '. Std (Nachmittag)']
                }
              }));
            }}
            className="tw-glow-btn px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer"
          >
            + Weitere Schulstunde
          </button>
        </div>
      </div>

      <div className={'rounded-3xl border-2 shadow-sm overflow-x-auto ' + themeStyles.card + ' ' + themeStyles.divider}>
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className={'text-sm uppercase font-extrabold tracking-wider ' + themeStyles.banner}>
              <th className="p-4 text-left w-52 border-r border-slate-700">Stunde / Zeit</th>
              {schoolDays.map(d => <th key={d} className="p-4 text-left border-r border-slate-700">{d}</th>)}
            </tr>
          </thead>
          <tbody className={'divide-y-2 ' + themeStyles.divider}>
            {(sched.periods || []).map((periodLabel, pIdx) => (
              <tr key={pIdx}>
                <td className={'p-3.5 border-r-2 font-bold text-sm ' + themeStyles.subtle + ' ' + themeStyles.divider}>
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
                  const key = dIdx + '-' + pIdx;
                  const slot = sched.slots?.[key] || { subject: '', room: '', status: 'normal' };
                  const childSt = getMemberStyles(childMember);
                  const statusClass =
                    slot.status === 'change'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-400'
                      : slot.status === 'exam'
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-2 ring-purple-400'
                      : slot.status === 'cancel'
                      ? 'bg-rose-500/25 border-rose-400 text-rose-300 line-through opacity-80'
                      : '';

                  return (
                    <td
                      key={dIdx}
                      onClick={() => setSchoolModal({ open: true, dayIdx: dIdx, periodIdx: pIdx, subject: slot.subject || '', room: slot.room || '', status: slot.status || 'normal' })}
                      className={'p-2 border-r-2 align-top cursor-pointer hover:bg-sky-500/15 transition-colors ' + themeStyles.divider}
                    >
                      {slot.subject ? (
                        <div
                          style={slot.status === 'normal' ? childSt.cardStyle : undefined}
                          className={'p-3.5 rounded-2xl border min-h-[82px] flex flex-col justify-between shadow-sm ' + statusClass}
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

      <div className={'rounded-3xl border p-6 shadow-sm space-y-4 ' + themeStyles.card}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-extrabold text-lg sm:text-xl">📌 Aktuelle Schul-Änderungen & Hausaufgaben ({childMember?.name || 'Kind'})</h3>
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
              className={'flex-1 md:w-96 px-4 py-2.5 rounded-xl border text-sm font-semibold ' + themeStyles.input}
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
