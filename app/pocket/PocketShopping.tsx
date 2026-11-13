// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { BellRing, PackagePlus, ShoppingCart, Trash2, Check } from 'lucide-react';
import { getFoodEmoji } from '../foodUtils';

export default function PocketShopping({
  openShop,
  doneShop,
  cartItems,
  notifPermission,
  themeStyles,
  onRequestPushPermission,
  onAddShopItem,
  onToggleShopItem,
  onRemoveCartItem,
  onTransferSingleCartItemToStock,
  onTransferAllCartToStock,
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

  // Gescannte Einkaufswagen-Artikel: Zuletzt gescanntes Produkt immer ganz oben!
  const sortedCart = Array.isArray(cartItems)
    ? [...cartItems].sort((a, b) => Number(b.scannedAt || 0) - Number(a.scannedAt || 0))
    : [];

  // Abgehakte Einkaufslisten-Artikel: Zuletzt abgehaktes Produkt immer ganz oben!
  const sortedDoneShop = Array.isArray(doneShop)
    ? [...doneShop].sort((a, b) => Number(b.doneAt || 0) - Number(a.doneAt || 0))
    : [];

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

      {/* =========================================================
          BEREICH 1: EINKAUFSWAGEN (GESCANNTE PRODUKTE & BON-ARTIKEL)
          ZULETZT GESCANNTES PRODUKT STEHT IMMER GANZ OBEN!
         ========================================================= */}
      <div className={'rounded-3xl border-2 border-amber-400/40 p-4 space-y-2.5 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              <span>🛒 Einkaufswagen – Gescannte Produkte ({sortedCart.length})</span>
            </h3>
            <p className="text-[10px] opacity-75 font-semibold">
              Neuestes gescanntes Produkt steht immer ganz oben
            </p>
          </div>

          {sortedCart.length > 0 && (
            <button
              type="button"
              onClick={onTransferAllCartToStock}
              className="tw-active-nav px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg"
            >
              <PackagePlus className="w-4 h-4" />
              <span>📦 Alle in Bestand buchen</span>
            </button>
          )}
        </div>

        {sortedCart.length === 0 ? (
          <div className="py-3 text-center text-xs opacity-55 font-bold">
            Noch keine Produkte im Scanner-Einkaufswagen.
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedCart.map((cItem, idx) => (
              <div
                key={cItem.id}
                className={'px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ' +
                  (idx === 0 ? 'border-amber-400/70 bg-amber-500/10' : themeStyles.subtle)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xl shrink-0">{getFoodEmoji(cItem.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                          ZULETZT GESCANNT
                        </span>
                      )}
                      <span className="font-extrabold text-xs truncate">{cItem.name}</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-bold">
                      {cItem.quantity} • MHD: {cItem.expiryDate.slice(8, 10)}.{cItem.expiryDate.slice(5, 7)}.{cItem.expiryDate.slice(2, 4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onTransferSingleCartItemToStock(cItem)}
                    className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Bestand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCartItem(cItem.id)}
                    className="tw-nav-inactive p-1.5 rounded-xl text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          BEREICH 2: EINKAUFSLISTE & ABGEHAKTE ARTIKEL
         ========================================================= */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={quickShopText}
          onChange={(e) => setQuickShopText(e.target.value)}
          placeholder="Artikel auf die Einkaufsliste setzen..."
          className={'flex-1 min-h-[48px] px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
        />
        <button type="submit" className="tw-active-nav min-h-[48px] px-5 rounded-2xl font-black text-base">
          +
        </button>
      </form>

      <div className={'rounded-3xl border p-4 space-y-2 ' + themeStyles.card}>
        <div className="font-extrabold text-sm">📝 Offene Einkaufsliste ({openShop.length})</div>
        {openShop.length === 0 ? (
          <div className="py-5 text-center text-xs opacity-50 font-bold">🛒 Einkaufsliste ist leer!</div>
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

        {sortedDoneShop.length > 0 && (
          <div className="pt-3.5 mt-3.5 border-t border-white/10 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-emerald-400">
                🛍️ Abgehakt im Einkaufswagen ({sortedDoneShop.length}):
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold opacity-75">MHD:</span>
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

            {sortedDoneShop.map(item => (
              <div
                key={item.origIdx}
                className={'p-2.5 rounded-xl border flex items-center justify-between gap-2 ' + themeStyles.subtle}
              >
                <div
                  onClick={() => onToggleShopItem(item.origIdx)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 opacity-75 cursor-pointer"
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
                  <span>Bestand (+{quickMhdDays}T)</span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => onMoveAllBoughtToPantry(sortedDoneShop, quickMhdDays)}
              className="tw-active-nav w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg"
            >
              <PackagePlus className="w-4 h-4" />
              <span>📦 Alle {sortedDoneShop.length} abgehakten Artikel in Bestand übernehmen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
                      }
