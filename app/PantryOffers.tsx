// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Tag, ShoppingCart, Search, ExternalLink, Sparkles,
  Store, TrendingDown, Check, Plus, Trash2, MapPin
} from 'lucide-react';
import { getFoodEmoji, isProductGlutenFree } from './PantrySection';

// ============================================================================
// SUPERMÄRKTE IN DER UMGEBUNG (BRING!-STYLE MARKT-KACHELN)
// ============================================================================
export const LOCAL_SUPERMARKETS = [
  { id: 'all',      name: 'Alle Märkte', short: '🏪 Alle',     color: 'bg-sky-600 text-white border-sky-400',         badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  { id: 'kaufland', name: 'Kaufland',    short: '🔴 Kaufland', color: 'bg-rose-600 text-white border-rose-300',       badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-400/50' },
  { id: 'lidl',     name: 'Lidl',        short: '🔵 Lidl',     color: 'bg-blue-600 text-amber-300 border-amber-300',  badgeBg: 'bg-blue-500/25 text-amber-300 border-blue-400/50' },
  { id: 'aldi',     name: 'ALDI SÜD',    short: '🟦 ALDI SÜD', color: 'bg-cyan-600 text-white border-cyan-300',       badgeBg: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50' },
  { id: 'edeka',    name: 'EDEKA',       short: '🟡 EDEKA',    color: 'bg-amber-400 text-blue-950 border-blue-700',   badgeBg: 'bg-amber-500/25 text-amber-300 border-amber-400/50' },
  { id: 'rewe',     name: 'REWE',        short: '🔴 REWE',     color: 'bg-red-700 text-white border-red-400',         badgeBg: 'bg-red-500/25 text-red-200 border-red-400/50' },
  { id: 'penny',    name: 'PENNY',       short: '🟠 PENNY',    color: 'bg-orange-600 text-white border-orange-300',   badgeBg: 'bg-orange-500/25 text-orange-200 border-orange-400/50' },
  { id: 'dm',       name: 'dm-drogerie', short: '🟣 dm',       color: 'bg-purple-600 text-white border-purple-300',   badgeBg: 'bg-purple-500/25 text-purple-200 border-purple-400/50' }
];

// ============================================================================
// KURATIERTER PREIS- & ANGEBOTS-KATALOG (MATCHT AUTOMATISCH MIT MÜLLEIMER & VORRAT)
// ============================================================================
const WEEKLY_SUPERMARKET_DEALS = [
  {
    id: 'deal_salami',
    title: 'K-Classic Delikatess Salami / Aufschnitt (200g)',
    keywords: ['salami', 'aufschnitt', 'wurst', 'schinken', 'lyoner'],
    storeId: 'kaufland',
    price: 1.19,
    oldPrice: 1.79,
    unit: '200g Packung',
    validUntil: 'Mi, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_pork_fillet',
    title: 'Frisches Deutsches Schweinefilet / Schweinestrang',
    keywords: ['schweinefilet', 'schweinestrang', 'filet', 'schwein', 'schnitzel', 'fleisch'],
    storeId: 'kaufland',
    price: 8.99,
    oldPrice: 12.90,
    unit: 'pro 1 kg (ca. 4,50€ / Pack)',
    validUntil: 'Mi, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_pommes',
    title: 'Knusper-Pommes Frites TK (1 kg Großpackung)',
    keywords: ['pommes', 'potatoe', 'kroketten', 'kartoffel', 'pfanni', 'kartoffelpüree'],
    storeId: 'lidl',
    price: 1.49,
    oldPrice: 2.29,
    unit: '1 kg Beutel',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_pasta_gf',
    title: 'Glutenfreie Pasta / Rigatoni / Fusilli (Seitz / Schär)',
    keywords: ['rigatoni', 'nudel', 'pasta', 'spaghetti', 'penne', 'seitz', 'schär'],
    storeId: 'rewe',
    price: 1.79,
    oldPrice: 2.49,
    unit: '500g Packung',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_wraps_gf',
    title: 'Schär Glutenfreie Wraps / Tortillas & Brot-Aktion',
    keywords: ['wrap', 'wraps', 'schär', 'baguette', 'landbrot', 'knusperbrot', 'brot', 'mehl'],
    storeId: 'dm',
    price: 2.45,
    oldPrice: 3.25,
    unit: 'Packung (Dauer-Vorteilspreis)',
    validUntil: 'Aktionswoche',
    glutenFree: true
  },
  {
    id: 'deal_catfood',
    title: 'Katzenfutter / Hundefutter Multipack (12 x 100g)',
    keywords: ['katzenfutter', 'hundefutter', 'tierfutter', 'futter', 'felix', 'whiskas', 'rinti'],
    storeId: 'kaufland',
    price: 3.49,
    oldPrice: 5.29,
    unit: '12er Großpackung',
    validUntil: 'Mi, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_coffee',
    title: 'Nescafé Classic / Caffè Crema & 3-in-1 Kaffeespezialitäten',
    keywords: ['nescafé', 'nescafe', 'coffee', 'caffeciao', 'kaffee', 'espresso', 'jacobs', 'dallmayr'],
    storeId: 'aldi',
    price: 3.99,
    oldPrice: 5.99,
    unit: '200g Glas / Packung',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_spices_maggi',
    title: 'Ostmann Gewürze (Curry, Paprika) & Maggi Würz-Aktion',
    keywords: ['gewürz', 'curry', 'ostmann', 'maggi', 'salz', 'pfeffer', 'brühe', 'gefro'],
    storeId: 'edeka',
    price: 1.29,
    oldPrice: 2.19,
    unit: 'Dose / Flasche',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_chips',
    title: 'Kartoffelchips / Knabber-Box (versch. Sorten)',
    keywords: ['chips', 'pfiff', 'flips', 'snack', 'nüsse', 'schokolade', 'milka', 'kuhflecken'],
    storeId: 'penny',
    price: 0.99,
    oldPrice: 1.69,
    unit: '175g – 200g Beutel',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_milk_butter',
    title: 'Schwarzwaldmilch / Frische Weidemilch & Markenbutter',
    keywords: ['vollmilch', 'milch', 'butter', 'kräuterbutter', 'meggle', 'sahne', 'schlagsahne'],
    storeId: 'lidl',
    price: 0.95,
    oldPrice: 1.35,
    unit: '1 Liter / 250g',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_cheese',
    title: 'Philadelphia Frischkäse & Reibekäse / Gouda',
    keywords: ['frischkäse', 'philadelphia', 'käse', 'gouda', 'mozzarella', 'parmesan', 'scheibenkäse'],
    storeId: 'kaufland',
    price: 0.99,
    oldPrice: 1.89,
    unit: '175g Becher / Pack',
    validUntil: 'Mi, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_rice',
    title: 'Langkorn-Spitzenreis & Basmatireis im Kochbeutel',
    keywords: ['reis', 'rize', 'langkorn', 'basmati', 'jasmin', 'onkelbenz', 'landfreund'],
    storeId: 'aldi',
    price: 1.19,
    oldPrice: 1.79,
    unit: '1 kg Packung',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_veggies',
    title: 'Frische Paprika Mix, Schlangengurke & Rispentomaten',
    keywords: ['paprika', 'gurke', 'tomate', 'salat', 'feldsalat', 'mâche', 'karotte', 'möhre', 'buttergemüse', 'apfel', 'äpfel'],
    storeId: 'lidl',
    price: 1.29,
    oldPrice: 1.99,
    unit: '500g Pack / Stück',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  },
  {
    id: 'deal_bacon_eggs',
    title: 'Frühstücks-Bacon Scheiben & 10er Freilandeier',
    keywords: ['bacon', 'speck', 'ei', 'eier'],
    storeId: 'rewe',
    price: 1.59,
    oldPrice: 2.29,
    unit: 'Packung',
    validUntil: 'Sa, diese Woche',
    glutenFree: true
  }
];

function formatEuro(num) {
  return Number(num || 0).toFixed(2).replace('.', ',') + ' €';
}

export default function PantryOffers({
  safeStock = [],
  safeTrash = [],
  addShoppingItem,
  initialSearchQuery = '',
  themeStyles,
  showToast
}) {
  const [selectedStore, setSelectedStore] = useState('all');
  const [offerFilterMode, setOfferFilterMode] = useState('matches'); // 'matches' (Mülleimer & Nachkauf) | 'all' | 'glutenfree'
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [postalCode, setPostalCode] = useState('79618 Rheinfelden');
  const [shoppingListItems, setShoppingListItems] = useState([]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setOfferFilterMode('all');
    }
  }, [initialSearchQuery]);

  // Liest zusätzlich die aktuelle Einkaufsliste aus dem lokalen Touchwall-Speicher
  useEffect(() => {
    try {
      const raw = localStorage.getItem('richter_touchwall_v6');
      if (raw) {
        const parsed = JSON.parse(raw);
        const items = parsed?.familyNotes?.[0]?.items || [];
        setShoppingListItems(
          items
            .filter(it => it && !it.done && String(it.text || '').trim())
            .map(it => String(it.text).trim())
        );
      }
    } catch (e) {}
  }, [safeTrash, safeStock]);

  // Kombiniert alle Produkte aus Mülleimer (verbraucht!), Einkaufsliste & Vorrat für das Bring!-Matching
  const userRestockCandidates = useMemo(() => {
    const map = new Map();

    // 1. Mülleimer-Artikel haben höchste Priorität (gerade verbraucht / abgelaufen -> Nachkauf!)
    (Array.isArray(safeTrash) ? safeTrash : []).forEach(t => {
      const clean = String(t?.name || '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), {
          name: clean,
          source: '🗑️ Aus Mülleimer (Verbraucht)',
          priority: 3
        });
      }
    });

    // 2. Offene Artikel auf der Einkaufsliste
    shoppingListItems.forEach(txt => {
      const clean = String(txt || '').replace(/\(.*\)$/, '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), {
          name: clean,
          source: '🛒 Auf deiner Einkaufsliste',
          priority: 2
        });
      }
    });

    // 3. Vorrats-Artikel (zum Preisvergleich für Nachkäufe)
    (Array.isArray(safeStock) ? safeStock : []).forEach(s => {
      const clean = String(s?.name || '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), {
          name: clean,
          source: '🥫 Im Bestand',
          priority: 1
        });
      }
    });

    return Array.from(map.values());
  }, [safeTrash, shoppingListItems, safeStock]);

  // Prüft für jedes Angebot, ob es zu einem Produkt im Mülleimer, auf der Einkaufsliste oder im Vorrat passt
  const evaluatedDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return WEEKLY_SUPERMARKET_DEALS.map(deal => {
      const storeObj = LOCAL_SUPERMARKETS.find(s => s.id === deal.storeId) || LOCAL_SUPERMARKETS[1];
      const discountPercent = Math.round(((deal.oldPrice - deal.price) / deal.oldPrice) * 100);
      const savingsEuro = deal.oldPrice - deal.price;

      // Suche das beste passende Produkt des Nutzers (Mülleimer bevorzugt!)
      let matchedUserItem = null;
      for (const cand of userRestockCandidates) {
        const cLower = cand.name.toLowerCase();
        const isHit = deal.keywords.some(kw => cLower.includes(kw.toLowerCase()));
        if (isHit) {
          if (!matchedUserItem || cand.priority > matchedUserItem.priority) {
            matchedUserItem = cand;
          }
        }
      }

      return {
        ...deal,
        storeObj,
        discountPercent,
        savingsEuro,
        matchedUserItem
      };
    })
      .filter(deal => selectedStore === 'all' || deal.storeId === selectedStore)
      .filter(deal => {
        if (offerFilterMode === 'glutenfree') return Boolean(deal.glutenFree);
        if (offerFilterMode === 'matches' && !q) return Boolean(deal.matchedUserItem);
        return true;
      })
      .filter(deal => {
        if (!q) return true;
        return (
          deal.title.toLowerCase().includes(q) ||
          deal.storeObj.name.toLowerCase().includes(q) ||
          deal.keywords.some(kw => kw.toLowerCase().includes(q)) ||
          (deal.matchedUserItem?.name || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const prioA = a.matchedUserItem?.priority || 0;
        const prioB = b.matchedUserItem?.priority || 0;
        if (prioA !== prioB) return prioB - prioA;
        return b.discountPercent - a.discountPercent;
      });
  }, [userRestockCandidates, selectedStore, offerFilterMode, searchQuery]);

  // Berechnet das gesamte Sparpotenzial für alle gefundenen Nachkauf-Treffer
  const totalSavingsPotential = useMemo(() => {
    return evaluatedDeals
      .filter(d => d.matchedUserItem)
      .reduce((acc, d) => acc + d.savingsEuro, 0);
  }, [evaluatedDeals]);

  const handleAddOfferToShoppingList = (deal) => {
    const productName = deal.matchedUserItem ? deal.matchedUserItem.name : deal.title.split('(')[0].trim();
    const formattedShopEntry =
      productName + ' (🏷️ ' + deal.storeObj.name + ' ' + formatEuro(deal.price) + ')';

    if (typeof addShoppingItem === 'function') {
      addShoppingItem(formattedShopEntry);
    }
    showToast?.(
      'Angebot auf Einkaufsliste! 🛒',
      formattedShopEntry + ' (Du sparst ' + formatEuro(deal.savingsEuro) + ')',
      '🏷️'
    );
  };

  const activeSearchTermForWeb = searchQuery.trim() || (safeTrash[0]?.name ? safeTrash[0].name.split('/')[0].trim() : 'Angebote');
  const marktguruUrl = 'https://www.marktguru.de/suche/' + encodeURIComponent(activeSearchTermForWeb);
  const kaufdaUrl = 'https://www.kaufda.de/Suche/' + encodeURIComponent(activeSearchTermForWeb);

  return (
    <div className="tw-pantry-no-scale space-y-3.5">
      {/* ============================================================================
          BRING!-STYLE KOPF- & REGIONEN-LEISTE INKL. SPARPOTENZIAL
         ============================================================================ */}
      <div className={'p-4 rounded-3xl border space-y-3 shadow-md ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black">
                  🏷️ Bring!-Angebots-Radar & Lokal-Preisvergleich
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                  💰 Sparpotenzial: {formatEuro(totalSavingsPotential)}
                </span>
              </div>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Gleicht deinen Mülleimer ({safeTrash.length}) & Vorrat ({safeStock.length}) automatisch mit Wochenangeboten in deiner Umgebung ab.
              </p>
            </div>
          </div>

          {/* REGION & DIREKTER PROSPEKT-VERGLEICH */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/35 border border-white/15 text-xs font-extrabold">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="bg-transparent w-36 focus:outline-none text-white font-black"
                title="Dein Ort / Postleitzahl für lokale Angebote"
              />
            </div>

            <a
              href={marktguruUrl}
              target="_blank"
              rel="noreferrer"
              className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 no-underline cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
              <span>🔍 Marktguru Live ({activeSearchTermForWeb})</span>
            </a>

            <a
              href={kaufdaUrl}
              target="_blank"
              rel="noreferrer"
              className="tw-nav-inactive px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 no-underline cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
              <span>📖 KaufDA Prospekte</span>
            </a>
          </div>
        </div>

        {/* SCHNELLWAHL: PRODUKTE AUS DEM MÜLLEIMER DIREKT AUF ANGEBOTE PRÜFEN */}
        {safeTrash.length > 0 && (
          <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ Zuletzt verbraucht im Mülleimer (Antippen für günstigsten Nachkauf-Preis):</span>
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-black text-rose-400 hover:underline cursor-pointer"
                >
                  ✕ Filter zurücksetzen
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {safeTrash.slice(0, 12).map(tItem => {
                const coreWord = String(tItem.name || '').split('/')[0].trim();
                const isSelected = searchQuery.toLowerCase() === coreWord.toLowerCase();
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(isSelected ? '' : coreWord);
                      setOfferFilterMode('all');
                    }}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' +
                      (isSelected ? 'tw-active-nav ring-2 ring-amber-300' : 'tw-nav-inactive')}
                  >
                    <span>{getFoodEmoji(tItem.name, tItem.customEmoji)}</span>
                    <span>{tItem.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUPERMARKT-LEISTE (WIE IN DER BRING! APP) + SUCHFELD */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {LOCAL_SUPERMARKETS.map(st => {
              const isAct = selectedStore === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStore(st.id)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-colors ' +
                    (isAct ? st.color + ' shadow-md' : 'tw-nav-inactive')}
                >
                  {st.short}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Produkt oder Markt suchen (z.B. Salami, Pommes)..."
                className={'w-full h-9 pl-9 pr-7 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setOfferFilterMode('matches')}
                className={'px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ' +
                  (offerFilterMode === 'matches' ? 'tw-active-nav' : 'opacity-70')}
              >
                🎯 Meine Treffer
              </button>
              <button
                type="button"
                onClick={() => setOfferFilterMode('all')}
                className={'px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ' +
                  (offerFilterMode === 'all' ? 'tw-active-nav' : 'opacity-70')}
              >
                Alle Angebote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================
          BRING!-STYLE ANGEBOTS-KACHELN MIT PREISVERGLEICH & 1-KLICK EINKAUFSLISTE
         ============================================================================ */}
      {evaluatedDeals.length === 0 ? (
        <div className={'p-8 rounded-3xl border text-center space-y-3 ' + themeStyles.card}>
          <div className="text-3xl">🏷️</div>
          <div className="font-black text-base">
            Keine direkten Wochenangebote für „{searchQuery || 'diese Auswahl'}“ im lokalen Katalog.
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setOfferFilterMode('all'); setSelectedStore('all'); }}
              className="tw-glow-btn px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
            >
              Alle lokalen Angebote zeigen
            </button>
            {searchQuery && (
              <a
                href={marktguruUrl}
                target="_blank"
                rel="noreferrer"
                className="tw-active-nav px-4 py-2 rounded-xl text-xs font-black no-underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>„{searchQuery}“ live auf Marktguru prüfen</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {evaluatedDeals.map(deal => {
            const isTrashMatch = deal.matchedUserItem?.priority === 3;
            const isShopMatch = deal.matchedUserItem?.priority === 2;

            return (
              <div
                key={deal.id}
                className={
                  'p-4 rounded-3xl border flex flex-col justify-between gap-3 shadow-md ' +
                  themeStyles.card + ' ' +
                  (isTrashMatch
                    ? 'border-2 border-amber-400 bg-amber-950/15'
                    : isShopMatch
                    ? 'border-2 border-emerald-400 bg-emerald-950/15'
                    : '')
                }
              >
                <div className="space-y-2.5">
                  {/* OBEN: MARKT-BADGE + RABATT-PROZENTE */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={'px-2.5 py-1 rounded-xl border text-xs font-black ' + deal.storeObj.badgeBg}>
                      {deal.storeObj.short}
                    </span>

                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center gap-1 shadow-xs">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{deal.discountPercent}%</span>
                    </span>
                  </div>

                  {/* TREFFER-HINWEIS AUS MÜLLEIMER ODER BESTAND */}
                  {deal.matchedUserItem && (
                    <div
                      className={
                        'px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1.5 ' +
                        (isTrashMatch
                          ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
                          : 'bg-sky-500/20 border-sky-400/40 text-sky-200')
                      }
                    >
                      <span>{deal.matchedUserItem.source}:</span>
                      <span className="truncate text-white">„{deal.matchedUserItem.name}“</span>
                    </div>
                  )}

                  {/* PRODUKT-ICON & TITEL */}
                  <div className="flex items-start gap-3 pt-0.5">
                    <span className="w-13 h-13 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-3xl shrink-0">
                      {getFoodEmoji(deal.title)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-base leading-snug break-words">
                        {deal.title}
                      </h4>
                      <div className="text-xs opacity-75 font-bold mt-0.5">
                        {deal.unit} • Gültig bis {deal.validUntil}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PREIS-BOX & 1-KLICK AUF EINKAUFSLISTE */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase opacity-70 block">
                        Angebotspreis
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400">
                          {formatEuro(deal.price)}
                        </span>
                        <span className="text-xs font-bold line-through opacity-55">
                          statt {formatEuro(deal.oldPrice)}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-black">
                      Spart {formatEuro(deal.savingsEuro)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddOfferToShoppingList(deal)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                    <span>Mit Markt & Preis auf Einkaufsliste</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
