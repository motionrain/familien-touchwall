// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Trash2, Utensils, Plus, AlertTriangle, CheckCircle2,
  ShoppingCart, Sparkles, RotateCcw, Calendar, Archive, Check
} from 'lucide-react';
import { formatDateStr, addDays } from './touchwallConfig';

const STORAGE_LOCATIONS = [
  { id: 'all',     label: '🏠 Alle Lagerorte' },
  { id: 'fridge',  label: '🧊 Kühlschrank' },
  { id: 'freezer', label: '❄️ Gefrierschrank' },
  { id: 'pantry',  label: '🗄️ Vorratslager / Keller' },
  { id: 'kitchen', label: '🍎 Küche / Vorratsschrank' }
];

// Intelligente Rezept-Datenbank für automatische Bestands- & Reste-Vorschläge
const SMART_RECIPES = [
  {
    id: 'rec_bolo',
    title: '🍝 Spaghetti Bolognese',
    keywords: ['spaghetti', 'nudeln', 'pasta', 'hackfleisch', 'rinderhack', 'tomaten', 'passierte', 'parmesan'],
    ingredients: ['Spaghetti / Nudeln', 'Hackfleisch', 'Passierte Tomaten', 'Parmesan']
  },
  {
    id: 'rec_pfannkuchen',
    title: '🥞 Pfannkuchen mit Apfelmus',
    keywords: ['mehl', 'eier', 'ei', 'milch', 'apfelmus', 'äpfel', 'apfel'],
    ingredients: ['Mehl', 'Eier', 'Milch', 'Apfelmus']
  },
  {
    id: 'rec_wok',
    title: '🥦 Gemüse-Pfanne mit Reis',
    keywords: ['reis', 'basmatireis', 'brokkoli', 'paprika', 'gemüse', 'hähnchen', 'tofu', 'sojasoße', 'karotten'],
    ingredients: ['Reis', 'Gemüse (Brokkoli/Paprika)', 'Hähnchen / Tofu', 'Sojasoße']
  },
  {
    id: 'rec_auflauf',
    title: '🧀 Kartoffel-Gemüse-Gratin',
    keywords: ['kartoffeln', 'käse', 'gouda', 'mozzarella', 'sahne', 'milch', 'gemüse', 'schinken'],
    ingredients: ['Kartoffeln', 'Geriebener Käse', 'Sahne / Milch', 'Gemüse']
  },
  {
    id: 'rec_pizza',
    title: '🍕 Hausgemachte Familien-Pizza',
    keywords: ['pizzateig', 'hefe', 'mehl', 'mozzarella', 'käse', 'salami', 'champignons', 'pilze', 'tomaten'],
    ingredients: ['Pizzateig', 'Mozzarella / Käse', 'Passierte Tomaten', 'Salami / Champignons']
  },
  {
    id: 'rec_omelett',
    title: '🍳 Bauern-Omelett mit Bratkartoffeln',
    keywords: ['eier', 'ei', 'kartoffeln', 'speck', 'schinken', 'zwiebeln', 'käse', 'schnittlauch'],
    ingredients: ['Eier', 'Kartoffeln', 'Schinken / Speck', 'Käse']
  },
  {
    id: 'rec_tacos',
    title: '🌮 Familien-Tacos / Wraps',
    keywords: ['tacos', 'wraps', 'tortilla', 'hackfleisch', 'mais', 'bohnen', 'avocado', 'salat', 'käse', 'salsa'],
    ingredients: ['Tacos / Wraps', 'Hackfleisch', 'Mais & Salat', 'Salsa / Käse']
  }
];

function getDaysUntil(expiryDateStr, todayStr) {
  if (!expiryDateStr) return 999;
  const exp = new Date(expiryDateStr + 'T12:00:00');
  const tod = new Date(todayStr + 'T12:00:00');
  return Math.round((exp.getTime() - tod.getTime()) / 86400000);
}

export default function PantrySection({
  pantryItems,
  setPantryItems,
  pantryTrash,
  setPantryTrash,
  mealPlan,
  setMealPlan,
  addShoppingItem,
  todayStr,
  themeStyles,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'recipes' | 'trash'
  const [locationFilter, setLocationFilter] = useState('all');

  // Formular: Neues Produkt (Ablaufdatum ist Pflicht!)
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('pantry');
  const [itemExpiry, setItemExpiry] = useState('');
  const [confirmConsumeId, setConfirmConsumeId] = useState(null);
  const [targetMealDayId, setTargetMealDayId] = useState(1);

  const safeStock = useMemo(() => Array.isArray(pantryItems) ? pantryItems : [], [pantryItems]);
  const safeTrash = useMemo(() => Array.isArray(pantryTrash) ? pantryTrash : [], [pantryTrash]);
  const safeMeals = useMemo(() => Array.isArray(mealPlan) ? mealPlan : [], [mealPlan]);

  // =========================================================
  // AUTOMATISCHER MÜLLEIMER FÜR ABGELAUFENE PRODUKTE
  // =========================================================
  useEffect(() => {
    const expiredNow = safeStock.filter(item => item.expiryDate && item.expiryDate < todayStr);
    if (expiredNow.length > 0) {
      const remainingStock = safeStock.filter(item => !item.expiryDate || item.expiryDate >= todayStr);
      const movedToTrash = expiredNow.map(item => ({
        ...item,
        trashedAt: todayStr,
        reason: 'expired',
        reasonLabel: '⚠️ Automatisch abgelaufen am ' + item.expiryDate
      }));
      setPantryItems(remainingStock);
      setPantryTrash(prev => [...movedToTrash, ...(Array.isArray(prev) ? prev : [])]);
      showToast(
        'MHD abgelaufen!',
        expiredNow.length + ' abgelaufene(s) Produkt(e) automatisch in den Mülleimer verschoben.',
        '🗑️'
      );
    }
  }, [safeStock, todayStr, setPantryItems, setPantryTrash, showToast]);

  const setQuickExpiryDays = (days) => {
    setItemExpiry(formatDateStr(addDays(new Date(), days)));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const cleanName = itemName.trim();
    if (!cleanName) {
      showToast('Name fehlt', 'Bitte gib einen Produktnamen ein.', '⚠️');
      return;
    }
    if (!itemExpiry) {
      showToast('Ablaufdatum ist Pflicht!', 'Ein Produkt kann nur mit Ablaufdatum (MHD) gespeichert werden.', '⚠️');
      return;
    }

    const newItem = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      quantity: itemQty.trim() || '1x',
      location: itemLocation,
      expiryDate: itemExpiry,
      addedAt: todayStr
    };

    setPantryItems(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setItemName('');
    setItemQty('1x');
    setItemExpiry('');
    showToast('In Speisekammer gespeichert', cleanName + ' (MHD: ' + itemExpiry + ')', '🥫');
  };

  // Produkt wurde verzehrt (mit Bestätigung) oder weggeworfen -> in Mülleimer ablegen
  const MoveItemToTrash = (item, reasonType) => {
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== item.id));
    const trashEntry = {
      ...item,
      trashedAt: todayStr,
      reason: reasonType, // 'consumed' | 'wasted' | 'expired'
      reasonLabel:
        reasonType === 'consumed'
          ? '🍽️ Rechtzeitig verzehrt am ' + todayStr
          : '🗑️ Weggeworfen am ' + todayStr
    };
    setPantryTrash(prev => [trashEntry, ...(Array.isArray(prev) ? prev : [])]);
    setConfirmConsumeId(null);

    if (reasonType === 'consumed') {
      showToast('Produkt verzehrt!', '„' + item.name + '“ wurde bestätigt und im Verlauf abgelegt.', '🍽️');
    } else {
      showToast('Im Mülleimer abgelegt', '„' + item.name + '“ wurde als weggeworfen erfasst.', '🗑️');
    }
  };

  const restoreFromTrash = (trashItem) => {
    const newExp = prompt('Neues Ablaufdatum (JJJJ-MM-TT) für ' + trashItem.name + ':', formatDateStr(addDays(new Date(), 7)));
    if (!newExp || !/^\d{4}-\d{2}-\d{2}$/.test(newExp.trim())) return;

    setPantryTrash(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== trashItem.id));
    setPantryItems(prev => [
      {
        id: 'p_' + Date.now(),
        name: trashItem.name,
        quantity: trashItem.quantity || '1x',
        location: trashItem.location || 'pantry',
        expiryDate: newExp.trim(),
        addedAt: todayStr
      },
      ...(Array.isArray(prev) ? prev : [])
    ]);
    showToast('Wiederhergestellt', trashItem.name + ' ist wieder im Bestand.', '↩️');
  };

  // Sortierter Bestand: Bald ablaufende Produkte stehen ganz oben!
  const filteredStock = useMemo(() => {
    return safeStock
      .filter(it => locationFilter === 'all' || it.location === locationFilter)
      .slice()
      .sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));
  }, [safeStock, locationFilter]);

  const expiringSoonCount = useMemo(() => {
    return safeStock.filter(it => getDaysUntil(it.expiryDate, todayStr) <= 4).length;
  }, [safeStock, todayStr]);

  // Nachhaltigkeits-Statistik aus dem Mülleimer
  const trashStats = useMemo(() => {
    const consumed = safeTrash.filter(x => x.reason === 'consumed').length;
    const wasted = safeTrash.filter(x => x.reason === 'expired' || x.reason === 'wasted').length;
    const total = consumed + wasted;
    const score = total > 0 ? Math.round((consumed / total) * 100) : 100;
    return { consumed, wasted, total, score };
  }, [safeTrash]);

  // =========================================================
  // SMARTE REZEPT-ENGINE (PRÜFT BESTAND & BALD ABLAUFENDE PRODUKTE)
  // =========================================================
  const recipeSuggestions = useMemo(() => {
    return SMART_RECIPES.map(rec => {
      const matchedStock = [];
      let urgentCount = 0;

      rec.keywords.forEach(kw => {
        const found = safeStock.find(st => String(st.name || '').toLowerCase().includes(kw));
        if (found && !matchedStock.some(m => m.id === found.id)) {
          matchedStock.push(found);
          if (getDaysUntil(found.expiryDate, todayStr) <= 4) {
            urgentCount++;
          }
        }
      });

      const ingredientStatus = rec.ingredients.map(ingLabel => {
        const words = ingLabel.toLowerCase().split(/[\s/(),]+/).filter(w => w.length >= 3);
        const inPantry = safeStock.find(st =>
          words.some(w => String(st.name || '').toLowerCase().includes(w))
        );
        return {
          name: ingLabel,
          inPantry: Boolean(inPantry),
          pantryItem: inPantry || null
        };
      });

      const haveCount = ingredientStatus.filter(i => i.inPantry).length;
      const matchPercent = Math.round((haveCount / rec.ingredients.length) * 100);

      return {
        ...rec,
        matchedStock,
        urgentCount,
        ingredientStatus,
        haveCount,
        matchPercent
      };
    }).sort((a, b) => (b.urgentCount * 30 + b.matchPercent) - (a.urgentCount * 30 + a.matchPercent));
  }, [safeStock, todayStr]);

  const applyRecipeToMealPlan = (rec) => {
    const targetMeal = safeMeals.find(m => Number(m.id) === Number(targetMealDayId)) || safeMeals[0];
    if (!targetMeal) return;

    const newIngredients = rec.ingredientStatus.map(ing => ({
      name: ing.name,
      done: ing.inPantry
    }));

    setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m =>
      Number(m.id) === Number(targetMeal.id)
        ? { ...m, dish: rec.title, ingredients: newIngredients }
        : m
    ));

    showToast(
      'In Essensplan übernommen!',
      rec.title + ' → ' + targetMeal.dayLabel + ' (' + rec.haveCount + ' Zutaten schon auf Lager!)',
      '🍲'
    );
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* KOPFBEREICH MIT NACHHALTIGKEITS-BILANZ & REITER-WAHL */}
      <div className={'p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold">🥫 Speisekammer, Vorratslager & Nachhaltigkeit</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
              🌱 Nachhaltigkeits-Quote: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} abgelaufen)
            </span>
          </div>
          <p className={'text-sm font-semibold mt-1 ' + themeStyles.textMuted}>
            Jedes Produkt wird mit Pflicht-Ablaufdatum erfasst. Abgelaufene Lebensmittel wandern automatisch in den Mülleimer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={'px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Package className="w-4 h-4" />
            <span>Bestand ({safeStock.length})</span>
            {expiringSoonCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {expiringSoonCount} läuft bald ab
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('recipes')}
            className={'px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'recipes' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Sparkles className="w-4 h-4" />
            <span>Rezept-Vorschläge aus Bestand</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trash')}
            className={'px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'trash' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑️ Mülleimer & Verlauf ({safeTrash.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          SUB-TAB 1: BESTAND & NEUES PRODUKT MIT PFLICHT-MHD ERFASSEN
         ========================================================= */}
      {activeSubTab === 'stock' && (
        <div className="space-y-6">
          <form onSubmit={handleAddProduct} className={'p-5 rounded-3xl border space-y-4 ' + themeStyles.card}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase text-sky-400">
                ➕ Lebensmittel in Speisekammer einbuchen (Ablaufdatum ist Pflicht!)
              </span>
              <span className="text-xs font-bold opacity-75">
                📱 Tipp: Unterwegs auf dem Handy unter „/pocket“ einfach per Kamera-Barcode oder Kassenbon-Foto scannen!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Produktname (z.B. Frische Vollmilch, Rinderhackfleisch, Basmatireis)..."
                className={'md:col-span-4 px-4 py-3 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
              />

              <input
                type="text"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                placeholder="Menge (z.B. 2 Pack., 500g)"
                className={'md:col-span-2 px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
              />

              <select
                value={itemLocation}
                onChange={(e) => setItemLocation(e.target.value)}
                className={'md:col-span-3 px-3.5 py-3 rounded-2xl border text-xs font-extrabold ' + themeStyles.input}
              >
                {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                  <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">{loc.label}</option>
                ))}
              </select>

              <div className="md:col-span-3 flex items-center gap-2">
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={itemExpiry}
                  onChange={(e) => setItemExpiry(e.target.value)}
                  className={'w-full px-3.5 py-3 rounded-2xl border-2 text-xs font-black ' + (itemExpiry ? 'border-emerald-500/60 ' : 'border-amber-500/70 ') + themeStyles.input}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase text-amber-400 mr-1">
                  ⏳ Schnell-Ablaufdatum (MHD):
                </span>
                {[
                  { label: '+3 Tage',   days: 3 },
                  { label: '+5 Tage',   days: 5 },
                  { label: '+1 Woche',  days: 7 },
                  { label: '+2 Wochen', days: 14 },
                  { label: '+1 Monat',  days: 30 },
                  { label: '+3 Monate', days: 90 },
                  { label: '+1 Jahr',   days: 365 }
                ].map(b => (
                  <button
                    key={b.days}
                    type="button"
                    onClick={() => setQuickExpiryDays(b.days)}
                    className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!itemName.trim() || !itemExpiry}
                className={'px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 ' + (!itemName.trim() || !itemExpiry ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-300' : 'tw-glow-btn cursor-pointer')}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{itemExpiry ? 'In Bestand speichern' : '⚠️ Erst Ablaufdatum wählen'}</span>
              </button>
            </div>
          </form>

          {/* LAGERORT-FILTER */}
          <div className="flex flex-wrap items-center gap-2">
            {STORAGE_LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => setLocationFilter(loc.id)}
                className={'px-4 py-2 rounded-2xl text-xs font-extrabold cursor-pointer ' + (locationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* BESTANDS-KACHELN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStock.length === 0 ? (
              <div className={'col-span-full p-10 rounded-3xl border text-center space-y-2 ' + themeStyles.card}>
                <div className="text-3xl">🥫</div>
                <div className="font-extrabold text-base">Keine Lebensmittel in dieser Ansicht</div>
                <p className={'text-xs ' + themeStyles.textMuted}>
                  Trage oben Produkte mit ihrem Ablaufdatum ein oder scanne deinen Einkauf mit der Smartphone-App!
                </p>
              </div>
            ) : (
              filteredStock.map(item => {
                const daysLeft = getDaysUntil(item.expiryDate, todayStr);
                const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[3];
                const isUrgent = daysLeft <= 3;
                const isWarning = daysLeft > 3 && daysLeft <= 7;

                return (
                  <div
                    key={item.id}
                    className={'p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 shadow-sm ' + themeStyles.card + (isUrgent ? ' border-rose-500/80 ring-2 ring-rose-500/30' : isWarning ? ' border-amber-400/70' : '')}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={'px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ' + themeStyles.subtle}>
                            {locObj.label}
                          </span>
                          <h3 className="font-extrabold text-lg mt-1.5 leading-snug break-words">{item.name}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-black/30 text-xs font-black shrink-0">
                          {item.quantity}
                        </span>
                      </div>

                      <div className={'p-3 rounded-2xl border flex items-center justify-between text-xs font-extrabold ' + (isUrgent ? 'bg-rose-500/20 border-rose-400/50 text-rose-200' : isWarning ? 'bg-amber-500/20 border-amber-400/50 text-amber-200' : themeStyles.subtle)}>
                        <span>📅 MHD: {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(0, 4)}</span>
                        <span>
                          {daysLeft === 0 ? '🔴 Läuft HEUTE ab!' : daysLeft === 1 ? '🟠 Morgen fällig' : ('🟢 Noch ' + daysLeft + ' Tage')}
                        </span>
                      </div>
                    </div>

                    {confirmConsumeId === item.id ? (
                      <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 space-y-2">
                        <div className="text-xs font-black text-center text-emerald-200">
                          Wurde „{item.name}“ verzehrt?
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => MoveItemToTrash(item, 'consumed')}
                            className="tw-glow-btn py-2 rounded-xl text-xs font-black cursor-pointer"
                          >
                            ✓ Ja, bestätigen
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmConsumeId(null)}
                            className="tw-nav-inactive py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmConsumeId(item.id)}
                          className="tw-glow-btn flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>🍽️ Verzehrt</span>
                        </button>

                        <button
                          type="button"
                          title="Auf die Einkaufsliste setzen"
                          onClick={() => {
                            addShoppingItem(item.name);
                            showToast('Auf Einkaufsliste', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                          }}
                          className="tw-nav-inactive p-2.5 rounded-2xl text-sky-400 cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="Produkt wegwerfen (in Mülleimer verschieben)"
                          onClick={() => MoveItemToTrash(item, 'wasted')}
                          className="tw-nav-inactive p-2.5 rounded-2xl text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 2: SMARTE REZEPT-VORSCHLÄGE FÜR DEN ESSENSPLAN
         ========================================================= */}
      {activeSubTab === 'recipes' && (
        <div className="space-y-5">
          <div className={'p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Rezept-Vorschläge passend zu eurer Speisekammer</span>
              </h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Gerichte mit bald ablaufenden Zutaten aus eurem Bestand werden automatisch ganz oben vorgeschlagen!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold">Ziel-Tag im Essensplan:</span>
              <select
                value={targetMealDayId}
                onChange={(e) => setTargetMealDayId(Number(e.target.value))}
                className={'px-3.5 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
              >
                {safeMeals.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-800 text-white">{m.dayLabel}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipeSuggestions.map(rec => (
              <div key={rec.id} className={'p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 ' + themeStyles.card + (rec.urgentCount > 0 ? ' border-amber-400/70' : '')}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-lg">{rec.title}</h4>
                    <span className={'px-2.5 py-1 rounded-full text-xs font-black shrink-0 ' + (rec.matchPercent >= 50 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300')}>
                      {rec.matchPercent}% im Haus
                    </span>
                  </div>

                  {rec.urgentCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                      ⚡ Rettet {rec.urgentCount} bald ablaufende(s) Produkt(e)!
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {rec.ingredientStatus.map((ing, idx) => (
                      <div key={idx} className={'px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-bold ' + themeStyles.subtle}>
                        <span>{ing.name}</span>
                        {ing.inPantry ? (
                          <span className="text-emerald-400 font-extrabold">✓ Im Bestand ({ing.pantryItem?.name})</span>
                        ) : (
                          <span className="text-amber-400 opacity-80">🛒 Fehlt noch</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applyRecipeToMealPlan(rec)}
                  className="tw-glow-btn w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>In Essensplan eintragen ({safeMeals.find(m => Number(m.id) === Number(targetMealDayId))?.dayLabel || 'Montag'})</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 3: MÜLLEIMER (ABGELAUFEN, WEGGEWORFEN & VERZEHRT)
         ========================================================= */}
      {activeSubTab === 'trash' && (
        <div className="space-y-5">
          <div className={'p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
            <div>
              <h3 className="text-lg font-extrabold">🗑️ Mülleimer & Verbrauchs-Übersicht</h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Hier siehst du alle abgelaufenen, weggeworfenen und verzehrten Lebensmittel, um deinen Einkauf nachhaltig zu planen.
              </p>
            </div>
            {safeTrash.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPantryTrash([]);
                  showToast('Mülleimer geleert', 'Alle Einträge wurden entfernt.', '🗑️');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
              >
                🗑️ Mülleimer komplett leeren
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeTrash.length === 0 ? (
              <div className={'col-span-full p-10 rounded-3xl border text-center ' + themeStyles.card}>
                <div className="text-2xl mb-1">🌱</div>
                <div className="font-extrabold text-sm">Der Mülleimer ist leer!</div>
              </div>
            ) : (
              safeTrash.map(tItem => {
                const isWasted = tItem.reason === 'expired' || tItem.reason === 'wasted';
                return (
                  <div
                    key={tItem.id}
                    className={'p-4 rounded-3xl border-2 flex flex-col justify-between gap-3 ' + themeStyles.card + (isWasted ? ' border-rose-500/50' : ' border-emerald-500/40')}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-black ' + (isWasted ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-300')}>
                          {tItem.reasonLabel}
                        </span>
                        <span className="text-xs font-bold opacity-70">{tItem.quantity}</span>
                      </div>
                      <h4 className="font-extrabold text-base mt-2">{tItem.name}</h4>
                      <div className="text-[11px] opacity-65 mt-0.5">Ursprüngliches MHD: {tItem.expiryDate}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          addShoppingItem(tItem.name);
                          showToast('Auf Einkaufsliste', tItem.name + ' wird nachgekauft.', '🛒');
                        }}
                        className="tw-glow-btn flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Nachkaufen
                      </button>
                      <button
                        type="button"
                        title="Zurück in den Bestand legen"
                        onClick={() => restoreFromTrash(tItem)}
                        className="tw-nav-inactive px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
