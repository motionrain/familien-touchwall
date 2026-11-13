// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { BellRing, PackagePlus } from 'lucide-react';
import { getFoodEmoji } from '../foodUtils';

export default function PocketShopping({
  openShop,
  doneShop,
  notifPermission,
  themeStyles,
  onRequestPushPermission,
  onAddShopItem,
  onToggleShopItem,
  onMoveBoughtItemToPantry,
  onMoveAllBoughtToPantry
}) {
  const [quickShopText, setQuickShopText] = useState('');
  const [quickMhdDays, setQuickMhdDays] = useState(7);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quickShopText.trim()) return;
    onAddShopItem(quickShopText.trim());
    setQuickShopText('');
  };

  return (
    <div className="space-y-3.5">
      <div className={'p-3 rounded-2xl border flex items-center justify-between gap-2 ' + themeStyles.card}>
        <div className="text-xs font-extrabold">
          🔔 Android-Alarm bei neuen Einkäufen
        </div>
        <button
          type="button"
          onClick={onRequestPushPermission}
          className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ' +
            (notifPermission === 'granted' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : 'tw-active-nav')}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>{notifPermission === 'granted' ? 'Push-Alarm aktiv ✓' : 'Push aktivieren'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={quickShopText}
          onChange={(e) => setQuickShopText(e.target.value)}
          placeholder="Artikel zur Einkaufsliste..."
          className={'flex-1 min-h-[48px] px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
        />
        <button type="submit" className="tw-active-nav min-h-[48px] px-5 rounded-2xl font-black text-base">
          +
        </button>
      </form>

      <div className={'rounded-3xl border p-4 space-y-2 ' + themeStyles.card}>
        <div className="font-extrabold text-sm">🛒 Einkaufsliste ({openShop.length} offen)</div>
        {openShop.length === 0 ? (
          <div className="py-6 text-center text-xs opacity-50 font-bold">🛒 Einkaufsliste ist leer!</div>
        ) : (
          openShop.map(item => (
            <div
              key={item.origIdx}
              onClick={() => onToggleShopItem(item.origIdx)}
              className={'p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ' + themeStyles.subtle}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input type="checkbox" checked={false} readOnly className="w-5 h-5 accent-amber-500 rounded shrink-0" />
                <span className="text-lg shrink-0">{getFoodEmoji(item.text)}</span>
                <span className="font-bold text-sm break-words">{item.text}</span>
              </div>
            </div>
          ))
        )}

        {/* ABGEHAKTE EINKÄUFE DIREKT IN DIE SPEISEKAMMER ÜBERNEHMEN */}
        {doneShop.length > 0 && (
          <div className="pt-3.5 mt-3.5 border-t border-white/10 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-emerald-400">
                🛍️ Im Einkaufswagen ({doneShop.length}) → In Vorrat buchen:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold opacity-75">Standard-MHD:</span>
                {[
                  { l: '+5T', d: 5 },
                  { l: '+1W', d: 7 },
                  { l: '+2W', d: 14 },
                  { l: '+1M', d: 30 }
                ].map(b => (
                  <button
                    key={b.d}
                    type="button"
                    onClick={() => setQuickMhdDays(b.d)}
                    className={'px-2 py-0.5 rounded-lg text-[10px] font-black ' + (quickMhdDays === b.d ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    {b.l}
                  </button>
                ))}
              </div>
            </div>

            {doneShop.map(item => (
              <div
                key={item.origIdx}
                className={'p-2.5 rounded-xl border flex items-center justify-between gap-2 ' + themeStyles.subtle}
              >
                <div
                  onClick={() => onToggleShopItem(item.origIdx)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 opacity-65 cursor-pointer"
                >
                  <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-500 rounded shrink-0" />
                  <span className="text-xs font-bold line-through truncate">{item.text}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onMoveBoughtItemToPantry(item, quickMhdDays)}
                  className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>In Vorrat (+{quickMhdDays}T)</span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => onMoveAllBoughtToPantry(doneShop, quickMhdDays)}
              className="tw-active-nav w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg"
            >
              <PackagePlus className="w-4 h-4" />
              <span>📦 Alle {doneShop.length} gekauften Artikel in Speisekammer übernehmen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
