// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';

export default function MealPlanSection({
  mealPlan,
  setMealPlan,
  pantryItems,
  setPantryItems,
  setPantryTrash,
  todayStr,
  addShoppingItemsBatch,
  themeStyles,
  showToast
}) {
  const [ingInputs, setIngInputs] = useState({});
  const [newMealDay, setNewMealDay] = useState('');
  const [newMealDish, setNewMealDish] = useState('');

  const safePantry = Array.isArray(pantryItems) ? pantryItems : [];

  const handleCookMealAndDeductPantry = (meal) => {
    const ingList = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    const searchWords = [
      ...String(meal.dish || '').toLowerCase().split(/[\s,()/&-]+/),
      ...ingList.flatMap(i => String(i.name || '').toLowerCase().split(/[\s,()/&-]+/))
    ].filter(w => w.length >= 3 && !/mit|und|aus|vom|für|oder|vorrat|beilage|nachtisch/.test(w));

    const matchedInPantry = safePantry.filter(pItem => {
      const pLower = String(pItem.name || '').toLowerCase();
      return searchWords.some(w => pLower.includes(w));
    });

    if (matchedInPantry.length > 0 && typeof setPantryItems === 'function') {
      const matchedIds = new Set(matchedInPantry.map(x => x.id));
      setPantryItems(prev => (Array.isArray(prev) ? prev : []).filter(x => !matchedIds.has(x.id)));
      if (typeof setPantryTrash === 'function') {
        const trashEntries = matchedInPantry.map(x => ({
          ...x,
          trashedAt: todayStr || new Date().toISOString().slice(0, 10),
          reason: 'consumed',
          reasonLabel: '🍽️ Verzehrt beim Kochen (' + meal.dayLabel + ')'
        }));
        setPantryTrash(prev => [...trashEntries, ...(Array.isArray(prev) ? prev : [])]);
      }
    }

    setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m =>
      m.id === meal.id
        ? { ...m, ingredients: (Array.isArray(m.ingredients) ? m.ingredients : []).map(ing => ({ ...ing, done: true })) }
        : m
    ));

    showToast(
      'Gericht gekocht!',
      matchedInPantry.length > 0
        ? (matchedInPantry.length + ' Zutat(en) wurden als „Verzehrt“ aus der Speisekammer ausgebucht!')
        : ('„' + meal.dish + '“ wurde als gekocht markiert.'),
      '🍽️'
    );
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={'p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
        <div>
          <h2 className="text-2xl font-extrabold">🍲 Familien-Essensplan & Vorrats-Abbuchung</h2>
          <p className={'text-sm font-semibold ' + themeStyles.textMuted}>
            Mit „🛒 Fehlendes einkaufen“ überträgst du fehlende Zutaten – und mit „🍽️ Gekocht & Vorrat abbuchen“ werden verbrauchte Lebensmittel direkt aus der Speisekammer gebucht!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={newMealDay}
            onChange={(e) => setNewMealDay(e.target.value)}
            placeholder="Tag / Name"
            className={'px-4 py-2.5 rounded-xl border text-sm font-bold w-48 ' + themeStyles.input}
          />
          <input
            type="text"
            value={newMealDish}
            onChange={(e) => setNewMealDish(e.target.value)}
            placeholder="Gericht / Rezept..."
            className={'px-4 py-2.5 rounded-xl border text-sm font-bold w-56 ' + themeStyles.input}
          />
          <button
            onClick={() => {
              setMealPlan(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), dayLabel: newMealDay.trim() || 'Zusatz-Tag', dish: newMealDish.trim() || '🍲 Wunschgericht', ingredients: [] }]);
              setNewMealDay('');
              setNewMealDish('');
            }}
            className="tw-glow-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            + Essens-Block
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(Array.isArray(mealPlan) ? mealPlan : []).map(meal => {
          const ingList = Array.isArray(meal.ingredients) ? meal.ingredients : [];
          const missing = ingList.filter(i => !i.done);
          return (
            <div key={meal.id} className={'rounded-3xl border-2 shadow-sm flex flex-col justify-between overflow-hidden min-h-[430px] ' + themeStyles.card}>
              <div className="flex-1 flex flex-col">
                <div className={'px-5 py-3.5 border-b flex items-center justify-between gap-2 ' + themeStyles.subtle + ' ' + themeStyles.divider}>
                  <input
                    type="text"
                    value={meal.dayLabel}
                    onChange={(e) => setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, dayLabel: e.target.value } : m))}
                    className="bg-transparent font-extrabold text-base uppercase tracking-wider flex-1 min-w-0 focus:outline-none"
                  />
                  <span className={'px-3 py-1 rounded-full text-xs font-extrabold ' + (missing.length === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                    {missing.length === 0 ? 'Alle da ✓' : missing.length + ' fehlt'}
                  </span>
                </div>

                <div className={'p-4 border-b space-y-2.5 ' + themeStyles.divider}>
                  <input
                    type="text"
                    value={meal.dish}
                    onChange={(e) => setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, dish: e.target.value } : m))}
                    className={'w-full px-4 py-2.5 rounded-2xl border font-extrabold text-sm ' + themeStyles.input}
                  />
                  <button
                    type="button"
                    onClick={() => handleCookMealAndDeductPantry(meal)}
                    className="tw-glow-btn w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🍽️ Gekocht & Vorrat abbuchen</span>
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={'text-xs font-extrabold uppercase ' + themeStyles.textMuted}>Zutaten ({ingList.length})</span>
                    <button
                      onClick={() => {
                        if (missing.length === 0) {
                          showToast('Alles da', 'Alle Zutaten sind bereits vorhanden!', '✅');
                          return;
                        }
                        addShoppingItemsBatch(missing.map(i => i.name + ' (' + meal.dayLabel + ')'));
                      }}
                      className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer"
                    >
                      🛒 Fehlendes einkaufen
                    </button>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {ingList.map((ing, iIdx) => (
                      <div key={iIdx} className={'flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs ' + themeStyles.subtle}>
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(ing.done)}
                            onChange={() => {
                              setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? {
                                ...m,
                                ingredients: (Array.isArray(m.ingredients) ? m.ingredients : []).map((item, idx) => idx === iIdx ? { ...item, done: !item.done } : item)
                              } : m));
                            }}
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                          <span className={'font-bold break-words ' + (ing.done ? 'line-through opacity-50' : '')}>{ing.name}</span>
                        </label>
                        <button
                          onClick={() => {
                            setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? {
                              ...m,
                              ingredients: (Array.isArray(m.ingredients) ? m.ingredients : []).filter((_, idx) => idx !== iIdx)
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

              <div className={'p-3.5 border-t flex gap-2 ' + themeStyles.subtle + ' ' + themeStyles.divider}>
                <input
                  type="text"
                  value={ingInputs[meal.id] || ''}
                  onChange={(e) => setIngInputs({ ...ingInputs, [meal.id]: e.target.value })}
                  onKeyDown={(e) => {
                    const val = (ingInputs[meal.id] || '').trim();
                    if (e.key === 'Enter' && val) {
                      setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, ingredients: [...(Array.isArray(m.ingredients) ? m.ingredients : []), { name: val, done: false }] } : m));
                      setIngInputs({ ...ingInputs, [meal.id]: '' });
                    }
                  }}
                  placeholder="Zutat hinzufügen..."
                  className={'flex-1 px-3.5 py-2 rounded-xl border text-xs font-semibold ' + themeStyles.input}
                />
                <button
                  onClick={() => {
                    const val = (ingInputs[meal.id] || '').trim();
                    if (!val) return;
                    setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === meal.id ? { ...m, ingredients: [...(Array.isArray(m.ingredients) ? m.ingredients : []), { name: val, done: false }] } : m));
                    setIngInputs({ ...ingInputs, [meal.id]: '' });
                  }}
                  className="tw-glow-btn w-9 h-9 rounded-xl font-bold cursor-pointer"
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
