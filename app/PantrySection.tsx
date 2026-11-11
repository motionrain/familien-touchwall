// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Trash2, Utensils, Plus, CheckCircle2,
  ShoppingCart, Sparkles, RotateCcw, Globe, Clock,
  Wand2, ExternalLink, ChefHat, Pencil, Check, X
} from 'lucide-react';
import { formatDateStr, addDays } from './touchwallConfig';

const STORAGE_LOCATIONS = [
  { id: 'all',     label: '🏠 Alle Lagerorte',         short: '🏠 Alle' },
  { id: 'fridge',  label: '🧊 Kühlschrank',            short: '🧊 Kühlschrank' },
  { id: 'freezer', label: '❄️ Gefrierschrank',         short: '❄️ Gefrierer' },
  { id: 'pantry',  label: '🗄️ Vorratslager / Keller',  short: '🗄️ Vorrat' },
  { id: 'kitchen', label: '🍎 Küche / Vorratsschrank', short: '🍎 Küche' }
];

const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🧊'
];

// Intelligente Emoji-Erkennung (inkl. aller Produkte aus deinem Vorrat)
export function getFoodEmoji(nameStr, customEmoji = '') {
  if (customEmoji && String(customEmoji).trim() !== '') {
    return String(customEmoji).trim();
  }
  const n = String(nameStr || '').toLowerCase();
  if (/butter|kräuterbutter|meggle|margarine/.test(n)) return '🧈';
  if (/bratwurst|rostbratwurst|leberwurst|wurst|würstchen|wiener|lyoner|aufschnitt|schinken|salami|speck/.test(n)) return '🌭';
  if (/burger|cheeseburger/.test(n)) return '🍔';
  if (/clementine|mandarine|orange|apfelsine|susi/.test(n)) return '🍊';
  if (/apfel|äpfel|elstar|boskoop|pink lady|rotkohl/.test(n)) return '🍎';
  if (/banane/.test(n)) return '🍌';
  if (/erdbeer|himbeer|heidelbeer|blaubeer|beeren|kirsch/.test(n)) return '🍓';
  if (/zitrone|limette/.test(n)) return '🍋';
  if (/salat|eisberg|mâche|mache|feldsalat|kopfsalat|rucola|spinat|kräuter/.test(n)) return '🥬';
  if (/gurke/.test(n)) return '🥒';
  if (/tomate|passierte/.test(n)) return '🍅';
  if (/paprika/.test(n)) return '🫑';
  if (/karotte|möhre/.test(n)) return '🥕';
  if (/kartoffel|pommes|gnocchi|schupfnudel/.test(n)) return '🥔';
  if (/zwiebel|knoblauch/.test(n)) return '🧅';
  if (/brokkoli|blumenkohl|spargel/.test(n)) return '🥦';
  if (/mais/.test(n)) return '🌽';
  if (/pilz|champignon/.test(n)) return '🍄';
  if (/avocado/.test(n)) return '🥑';
  if (/käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta/.test(n)) return '🧀';
  if (/milch|vollmilch|schwarzwaldmilch|hafermilch|kakao/.test(n)) return '🥛';
  if (/schlagsahne|sahne|joghurt|quark|pudding|schmand|creme/.test(n)) return '🥣';
  if (/ei|eier/.test(n)) return '🥚';
  if (/hähnchen|huhn|pute|geflügel|nuggets/.test(n)) return '🍗';
  if (/hackfleisch|rinderhack|rind|steak|fleisch|schnitzel|gulasch/.test(n)) return '🥩';
  if (/fisch|lachs|thunfisch|fischstäbchen|forelle/.test(n)) return '🐟';
  if (/nudel|spaghetti|pasta|penne|tortellini|ravioli|spätzle/.test(n)) return '🍝';
  if (/reis|spitzenreis|langkorn|basmati|jasmin|milchreis/.test(n)) return '🍚';
  if (/brot|brötchen|toast|baguette|croissant/.test(n)) return '🥖';
  if (/pizza|flammkuchen/.test(n)) return '🍕';
  if (/wrap|taco|tortilla/.test(n)) return '🌮';
  if (/senf|thomy|heinz|ketchup|mayo|soße|sauce|dressing|pesto|öl|essig/.test(n)) return '🥫';
  if (/mehl|zucker|salz|haferflocken|müsli|cornflakes/.test(n)) return '🌾';
  if (/schokolade|nutella|keks|gummibär|chips|eis/.test(n)) return '🍫';
  if (/wasser|saft|cola|limo|bier|wein|kaffee|tee/.test(n)) return '🧃';
  return '🥫';
}

const QUICK_FAMILY_RECIPES = [
  {
    id: 'fam_bolo',
    title: '🍝 Schnelle Familien-Bolognese',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'One-Pot & Pasta',
    shortDesc: 'Klassiker für Kinder – in 20 Min. fertig auf dem Tisch.',
    keywords: ['spaghetti', 'nudeln', 'pasta', 'hackfleisch', 'rinderhack', 'tomaten', 'passierte', 'parmesan', 'möhren', 'karotten'],
    ingredients: ['Nudeln / Spaghetti', 'Hackfleisch', 'Passierte Tomaten', 'Geriebener Käse / Parmesan']
  },
  {
    id: 'fam_bratwurst',
    title: '🌭 Rostbratwurst mit Kräuterbutter, Reis & Salat',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Familien-Klassiker',
    shortDesc: 'Schnelle Pfannen-Rostbratwurst mit Kräuterbutter, Reis/Kartoffeln und frischem Salat.',
    keywords: ['rostbratwurst', 'bratwurst', 'wurst', 'kräuterbutter', 'salat', 'mâche', 'gurke', 'reis', 'senf'],
    ingredients: ['Rostbratwurst', 'Kräuterbutter / Senf', 'Salat / Gurke', 'Reis oder Kartoffeln']
  },
  {
    id: 'fam_schupfnudeln',
    title: '🥘 15-Minuten Pfannengericht mit Frischkäse-Sahnesoße',
    prepMinutes: 15,
    kidFavorite: true,
    category: 'Express-Pfanne',
    shortDesc: 'Alles in einer Pfanne mit Schlagsahne & Frischkäse – kaum Abwasch.',
    keywords: ['schupfnudeln', 'gnocchi', 'nudeln', 'reis', 'schlagsahne', 'sahne', 'frischkäse', 'philadelphia', 'käse'],
    ingredients: ['Nudeln / Schupfnudeln / Reis', 'Frischkäse Schnittlauch', 'Schlagsahne', 'Gemüse / Salat']
  },
  {
    id: 'fam_omelett',
    title: '🍳 Schnelles Bauern-Rührei / Omelett mit Gurkensalat',
    prepMinutes: 15,
    kidFavorite: true,
    category: 'Express-Pfanne',
    shortDesc: 'Frische Eier aus der Pfanne mit Kräuterbutter, Käse und knackigem Gurkensalat.',
    keywords: ['eier', 'ei', 'kräuterbutter', 'butter', 'frischkäse', 'scheibenkäse', 'gurke', 'salat', 'mâche'],
    ingredients: ['Frische Eier', 'Kräuterbutter', 'Scheibenkäse / Frischkäse', 'Gurke / Salat']
  },
  {
    id: 'fam_pfannkuchen',
    title: '🥞 Goldene Familien-Pfannkuchen',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Süß & Herzhaft',
    shortDesc: 'Perfekt für Eier, Milch/Sahne, Obst oder herzhaft mit Käse.',
    keywords: ['mehl', 'eier', 'ei', 'milch', 'schlagsahne', 'sahne', 'apfel', 'clementinen', 'käse'],
    ingredients: ['Mehl', 'Frische Eier', 'Milch / Sahne', 'Obst oder Käse']
  },
  {
    id: 'fam_wok',
    title: '🍚 Schnelle Familien-Reis-Pfanne',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Pfanne & Wok',
    shortDesc: 'Langkorn-Spitzenreis mit Ei, Gemüse und cremiger Soße.',
    keywords: ['reis', 'spitzenreis', 'langkorn', 'eier', 'gurke', 'salat', 'frischkäse', 'sahne', 'hähnchen'],
    ingredients: ['Langkorn-Spitzenreis', 'Eier', 'Gemüse / Beilagensalat', 'Soße / Frischkäse']
  }
];

const DE_TO_EN_INGREDIENT_MAP = [
  { de: ['hähnchen', 'huhn', 'pute', 'geflügel'], en: 'chicken', label: 'Hähnchen' },
  { de: ['hackfleisch', 'rinderhack', 'rind'], en: 'beef', label: 'Rind / Hackfleisch' },
  { de: ['schwein', 'schinken', 'speck', 'bratwurst', 'wurst'], en: 'pork', label: 'Wurst / Schinken' },
  { de: ['lachs', 'fisch', 'fischstäbchen'], en: 'salmon', label: 'Lachs / Fisch' },
  { de: ['nudeln', 'spaghetti', 'pasta', 'tortellini'], en: 'pasta', label: 'Nudeln' },
  { de: ['reis', 'spitzenreis', 'langkorn', 'basmatireis'], en: 'rice', label: 'Reis' },
  { de: ['kartoffel', 'kartoffeln'], en: 'potatoes', label: 'Kartoffeln' },
  { de: ['ei', 'eier'], en: 'egg', label: 'Eier' },
  { de: ['käse', 'frischkäse', 'scheibenkäse', 'gouda', 'mozzarella'], en: 'cheese', label: 'Käse' },
  { de: ['gurke'], en: 'cucumber', label: 'Gurke' }
];

const EN_TO_DE_DISH_WORDS = {
  'Chicken': 'Hähnchen', 'Beef': 'Rindfleisch', 'Pork': 'Bratwurst / Schwein',
  'Pasta': 'Nudel-Pfanne', 'Spaghetti': 'Spaghetti', 'Salmon': 'Lachs',
  'Potato': 'Kartoffel', 'Potatoes': 'Kartoffeln', 'Cheese': 'Käse',
  'Creamy': 'Cremige', 'Baked': 'Ofen-', 'Salad': 'Salat', 'Rice': 'Reis-Pfanne',
  'With': 'mit', 'And': '&', 'Egg': 'Ei', 'Eggs': 'Eier'
};

function translateWebMealTitle(enTitle) {
  let out = String(enTitle || '');
  Object.keys(EN_TO_DE_DISH_WORDS).forEach(enWord => {
    const reg = new RegExp('\\b' + enWord + '\\b', 'gi');
    out = out.replace(reg, EN_TO_DE_DISH_WORDS[enWord]);
  });
  return out;
}

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
  const [recipeFilter, setRecipeFilter] = useState('all');

  // Formular: Neues Produkt
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('fridge');
  const [itemExpiry, setItemExpiry] = useState('');
  const [confirmConsumeId, setConfirmConsumeId] = useState(null);

  // Komfort-Bearbeitungs-Modal für ein einzelnes Produkt
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    name: '',
    quantity: '',
    location: 'fridge',
    expiryDate: '',
    customEmoji: ''
  });

  // Tages-Menü & Web-Suche State
  const [targetMealDayId, setTargetMealDayId] = useState(1);
  const [includeSideAndDessert, setIncludeSideAndDessert] = useState(true);
  const [alsoSendMissingToShopping, setAlsoSendMissingToShopping] = useState(true);
  const [webRecipes, setWebRecipes] = useState([]);
  const [isLoadingWebRecipes, setIsLoadingWebRecipes] = useState(false);

  const safeStock = useMemo(() => Array.isArray(pantryItems) ? pantryItems : [], [pantryItems]);
  const safeTrash = useMemo(() => Array.isArray(pantryTrash) ? pantryTrash : [], [pantryTrash]);
  const safeMeals = useMemo(() => Array.isArray(mealPlan) ? mealPlan : [], [mealPlan]);

  // Automatischer Mülleimer für abgelaufene Produkte
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
      customEmoji: '',
      addedAt: todayStr
    };

    setPantryItems(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setItemName('');
    setItemQty('1x');
    setItemExpiry('');
    showToast('In Speisekammer gespeichert', cleanName + ' (MHD: ' + itemExpiry + ')', getFoodEmoji(cleanName));
  };

  // Öffnet das Bearbeitungs-Fenster für ein Produkt
  const openEditProductModal = (item) => {
    setEditModal({
      open: true,
      id: item.id,
      name: item.name || '',
      quantity: item.quantity || '1x',
      location: item.location || 'fridge',
      expiryDate: item.expiryDate || todayStr,
      customEmoji: item.customEmoji || getFoodEmoji(item.name)
    });
  };

  // Speichert die Änderungen aus dem Bearbeitungs-Fenster
  const handleAcceptEditModal = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editModal.name.trim() || !editModal.expiryDate) {
      showToast('Pflichtfelder', 'Bitte Name und Ablaufdatum (MHD) ausfüllen.', '⚠️');
      return;
    }

    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === editModal.id
        ? {
            ...it,
            name: editModal.name.trim(),
            quantity: editModal.quantity.trim() || '1x',
            location: editModal.location,
            expiryDate: editModal.expiryDate,
            customEmoji: editModal.customEmoji
          }
        : it
    ));
    setEditModal({ ...editModal, open: false });
    showToast('Änderungen gespeichert!', editModal.name + ' wurde aktualisiert.', editModal.customEmoji || '✅');
  };

  // Löscht das Produkt direkt aus dem Bearbeitungs-Fenster (in den Mülleimer)
  const handleDeleteFromEditModal = () => {
    const target = safeStock.find(x => x.id === editModal.id);
    if (!target) {
      setEditModal({ ...editModal, open: false });
      return;
    }
    MoveItemToTrash(target, 'wasted');
    setEditModal({ ...editModal, open: false });
  };

  const MoveItemToTrash = (item, reasonType) => {
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== item.id));
    const trashEntry = {
      ...item,
      trashedAt: todayStr,
      reason: reasonType,
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
      showToast('Produkt gelöscht', '„' + item.name + '“ wurde in den Mülleimer verschoben.', '🗑️');
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
        customEmoji: trashItem.customEmoji || '',
        addedAt: todayStr
      },
      ...(Array.isArray(prev) ? prev : [])
    ]);
    showToast('Wiederhergestellt', trashItem.name + ' ist wieder im Bestand.', '↩️');
  };

  const filteredStock = useMemo(() => {
    return safeStock
      .filter(it => locationFilter === 'all' || it.location === locationFilter)
      .slice()
      .sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));
  }, [safeStock, locationFilter]);

  const expiringSoonItems = useMemo(() => {
    return safeStock
      .filter(it => getDaysUntil(it.expiryDate, todayStr) <= 5)
      .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)));
  }, [safeStock, todayStr]);

  const trashStats = useMemo(() => {
    const consumed = safeTrash.filter(x => x.reason === 'consumed').length;
    const wasted = safeTrash.filter(x => x.reason === 'expired' || x.reason === 'wasted').length;
    const total = consumed + wasted;
    const score = total > 0 ? Math.round((consumed / total) * 100) : 100;
    return { consumed, wasted, total, score };
  }, [safeTrash]);

  const fetchWebRecipesFromStock = async () => {
    setIsLoadingWebRecipes(true);
    setRecipeFilter('web');

    try {
      const sortedByExpiry = [...safeStock].sort((a, b) =>
        String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'))
      );

      const matchedQueries = [];
      sortedByExpiry.forEach(item => {
        const lower = String(item.name || '').toLowerCase();
        DE_TO_EN_INGREDIENT_MAP.forEach(entry => {
          if (entry.de.some(w => lower.includes(w)) && !matchedQueries.some(q => q.en === entry.en)) {
            matchedQueries.push({ en: entry.en, deLabel: item.name });
          }
        });
      });

      if (matchedQueries.length === 0) {
        matchedQueries.push({ en: 'pasta', deLabel: 'Pasta / Vorrat' }, { en: 'chicken', deLabel: 'Familien-Gericht' });
      }

      const fetchedCards = [];
      const seenMealIds = new Set();

      for (const q of matchedQueries.slice(0, 3)) {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?i=' + encodeURIComponent(q.en));
        const data = await res.json();
        const meals = Array.isArray(data?.meals) ? data.meals.slice(0, 3) : [];

        for (const m of meals) {
          if (seenMealIds.has(m.idMeal)) continue;
          seenMealIds.add(m.idMeal);

          const detailRes = await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i=' + encodeURIComponent(m.idMeal));
          const detailData = await detailRes.json();
          const fullMeal = detailData?.meals?.[0];
          if (!fullMeal) continue;

          const rawIngs = [];
          for (let i = 1; i <= 6; i++) {
            const ingName = String(fullMeal['strIngredient' + i] || '').trim();
            if (ingName) rawIngs.push(ingName);
          }

          fetchedCards.push({
            id: 'web_' + fullMeal.idMeal,
            title: '🌐 ' + translateWebMealTitle(fullMeal.strMeal),
            prepMinutes: 25,
            kidFavorite: true,
            isWebRecipe: true,
            thumbUrl: fullMeal.strMealThumb || '',
            sourceUrl: fullMeal.strSource || fullMeal.strYoutube || '',
            category: 'Web-Rezept passend zu ' + q.deLabel,
            shortDesc: 'Live aus dem Netz gefunden für deinen Vorrat: „' + q.deLabel + '“.',
            keywords: [q.deLabel.toLowerCase()],
            ingredients: rawIngs.length > 0 ? rawIngs : [q.deLabel, 'Beilage nach Wahl']
          });
        }
      }

      setWebRecipes(fetchedCards);
      showToast('Web-Rezepte geladen!', fetchedCards.length + ' Rezept-Ideen aus dem Netz gefunden!', '🌐');
    } catch (err) {
      showToast('Web-Suche Hinweis', 'Nutze unsere integrierten 20-Minuten-Familienrezepte.', 'ℹ️');
    } finally {
      setIsLoadingWebRecipes(false);
    }
  };

  const evaluatedRecipes = useMemo(() => {
    const combinedSource = [...webRecipes, ...QUICK_FAMILY_RECIPES];

    return combinedSource
      .map(rec => {
        const matchedStock = [];
        let urgentCount = 0;

        (rec.keywords || []).forEach(kw => {
          const found = safeStock.find(st => String(st.name || '').toLowerCase().includes(kw));
          if (found && !matchedStock.some(m => m.id === found.id)) {
            matchedStock.push(found);
            if (getDaysUntil(found.expiryDate, todayStr) <= 4) {
              urgentCount++;
            }
          }
        });

        const ingredientStatus = (rec.ingredients || []).map(ingLabel => {
          const words = String(ingLabel).toLowerCase().split(/[\s/(),&-]+/).filter(w => w.length >= 3);
          const inPantry = safeStock.find(st =>
            words.some(w => String(st.name || '').toLowerCase().includes(w)) ||
            (rec.keywords || []).some(kw => words.includes(kw) && String(st.name || '').toLowerCase().includes(kw))
          );
          return {
            name: ingLabel,
            inPantry: Boolean(inPantry),
            pantryItem: inPantry || null
          };
        });

        const haveCount = ingredientStatus.filter(i => i.inPantry).length;
        const totalCount = Math.max(1, ingredientStatus.length);
        const matchPercent = Math.round((haveCount / totalCount) * 100);

        return {
          ...rec,
          matchedStock,
          urgentCount,
          ingredientStatus,
          haveCount,
          matchPercent
        };
      })
      .filter(rec => {
        if (recipeFilter === 'express') return rec.prepMinutes <= 20;
        if (recipeFilter === 'kids') return Boolean(rec.kidFavorite);
        if (recipeFilter === 'web') return Boolean(rec.isWebRecipe);
        return true;
      })
      .sort((a, b) => {
        if (a.isWebRecipe !== b.isWebRecipe && recipeFilter === 'web') return a.isWebRecipe ? -1 : 1;
        return (b.urgentCount * 35 + b.matchPercent) - (a.urgentCount * 35 + a.matchPercent);
      });
  }, [safeStock, todayStr, webRecipes, recipeFilter]);

  const convertRecipeToDailyMenu = (rec, dayIdOverride = null) => {
    const targetId = dayIdOverride !== null ? dayIdOverride : targetMealDayId;
    const targetMeal = safeMeals.find(m => Number(m.id) === Number(targetId)) || safeMeals[0];
    if (!targetMeal) return;

    const fruitOrDessertInStock = safeStock.find(st =>
      /apfel|äpfel|clementine|mandarine|banane|obst|beeren|joghurt|quark|pudding|eis|apfelmus/i.test(st.name)
    );
    const saladOrVeggieInStock = safeStock.find(st =>
      /salat|eisberg|mâche|feldsalat|gurke|tomate|karotte|möhre|paprika/i.test(st.name)
    );

    let finalDishTitle = rec.title;
    const finalIngredients = rec.ingredientStatus.map(ing => ({
      name: ing.name,
      done: ing.inPantry
    }));

    if (includeSideAndDessert) {
      const extras = [];
      if (saladOrVeggieInStock) {
        extras.push('🥗 ' + saladOrVeggieInStock.name);
        if (!finalIngredients.some(i => i.name.toLowerCase().includes(saladOrVeggieInStock.name.toLowerCase()))) {
          finalIngredients.push({ name: 'Beilage: ' + saladOrVeggieInStock.name + ' (aus Vorrat)', done: true });
        }
      }
      if (fruitOrDessertInStock) {
        extras.push('🍊 ' + fruitOrDessertInStock.name);
        if (!finalIngredients.some(i => i.name.toLowerCase().includes(fruitOrDessertInStock.name.toLowerCase()))) {
          finalIngredients.push({ name: 'Nachtisch: ' + fruitOrDessertInStock.name + ' (aus Vorrat)', done: true });
        }
      }
      if (extras.length > 0) {
        finalDishTitle = rec.title + ' • Menü mit ' + extras.join(' & ');
      }
    }

    setMealPlan(prev => (Array.isArray(prev) ? prev : []).map(m =>
      Number(m.id) === Number(targetMeal.id)
        ? { ...m, dish: finalDishTitle, ingredients: finalIngredients }
        : m
    ));

    const missingItems = rec.ingredientStatus.filter(i => !i.inPantry);
    if (alsoSendMissingToShopping && missingItems.length > 0 && addShoppingItem) {
      missingItems.forEach(mi => {
        addShoppingItem(mi.name + ' (für ' + targetMeal.dayLabel + ')');
      });
    }

    showToast('Tages-Menü eingetragen!', targetMeal.dayLabel + ': ' + finalDishTitle, '🍽️');
  };

  const autoPlanEntireWeekFromStock = () => {
    const topRecipes = evaluatedRecipes.slice(0, 7);
    if (topRecipes.length === 0) return;

    setMealPlan(prev => (Array.isArray(prev) ? prev : []).map((dayMeal, idx) => {
      const picked = topRecipes[idx % topRecipes.length];
      if (!picked) return dayMeal;
      return {
        ...dayMeal,
        dish: picked.title + ' (' + picked.prepMinutes + ' Min.)',
        ingredients: picked.ingredientStatus.map(ing => ({
          name: ing.name,
          done: ing.inPantry
        }))
      };
    }));

    showToast(
      'Wochenplan erstellt!',
      'Alle 7 Tage wurden mit schnellen Familiengerichten passend zu eurem Vorrat gefüllt!',
      '🪄'
    );
  };

  const chefkochSearchUrl = useMemo(() => {
    const topNames = (expiringSoonItems.length > 0 ? expiringSoonItems : safeStock)
      .slice(0, 3)
      .map(it => String(it.name || '').split(' ')[0])
      .filter(Boolean)
      .join(' ');
    const query = (topNames ? topNames + ' schnell familien' : 'schnelle familienrezepte');
    return 'https://www.chefkoch.de/rs/s0/' + encodeURIComponent(query) + '/Rezepte.html';
  }, [expiringSoonItems, safeStock]);

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-4">
      {/* KOMPAKTER KOPFBEREICH */}
      <div className={'p-4 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-3 ' + themeStyles.card}>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold">🥫 Speisekammer, Web-Rezepte & Tages-Menü</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
              🌱 Nachhaltigkeit: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} abgelaufen)
            </span>
          </div>
          <p className={'text-xs font-semibold mt-0.5 ' + themeStyles.textMuted}>
            Kompakte Vorrats-Kacheln mit automatischem Emoji-Icon. Klicke auf „✏️ Bearbeiten“, um MHD, Emoji, Name oder Lagerort anzupassen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={'px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Package className="w-4 h-4" />
            <span>Bestand ({safeStock.length})</span>
            {expiringSoonItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {expiringSoonItems.length} läuft bald ab
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('recipes')}
            className={'px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'recipes' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <ChefHat className="w-4 h-4" />
            <span>🍽️ Schnelle Rezepte & Tages-Menü</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trash')}
            className={'px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'trash' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑️ Mülleimer ({safeTrash.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          SUB-TAB 1: BESTAND & SCHNELL-EINGABE
         ========================================================= */}
      {activeSubTab === 'stock' && (
        <div className="space-y-3.5">
          <form onSubmit={handleAddProduct} className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black uppercase text-sky-400">
                ➕ Lebensmittel in Speisekammer einbuchen (Ablaufdatum ist Pflicht!)
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('recipes')}
                className="text-xs font-extrabold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Passende 20-Minuten-Familienrezepte zum Bestand anzeigen →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-5 flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-black/25 border border-white/10 flex items-center justify-center text-lg shrink-0">
                  {getFoodEmoji(itemName)}
                </span>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Produktname (z.B. Vollmilch, Kräuterbutter, Eier)..."
                  className={'w-full px-3 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                />
              </div>

              <input
                type="text"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                placeholder="Menge (z.B. 250g, 1x)"
                className={'md:col-span-2 px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
              />

              <select
                value={itemLocation}
                onChange={(e) => setItemLocation(e.target.value)}
                className={'md:col-span-2 px-3 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                  className={'w-full px-3 py-2 rounded-xl border-2 text-xs font-black ' + (itemExpiry ? 'border-emerald-500/60 ' : 'border-amber-500/70 ') + themeStyles.input}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-black uppercase text-amber-400 mr-1">
                  ⏳ Schnell-MHD:
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
                    className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!itemName.trim() || !itemExpiry}
                className={'px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 ' + (!itemName.trim() || !itemExpiry ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-300' : 'tw-glow-btn cursor-pointer')}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{itemExpiry ? 'In Bestand speichern' : '⚠️ Erst Ablaufdatum wählen'}</span>
              </button>
            </div>
          </form>

          {/* LAGERORT-FILTER */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STORAGE_LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => setLocationFilter(loc.id)}
                className={'px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ' + (locationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* =========================================================
              ULTRA-KOMPAKTE PRODUKTKACHELN (6 BIS 7 PRO REIHE!)
             ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
            {filteredStock.length === 0 ? (
              <div className={'col-span-full p-8 rounded-3xl border text-center space-y-1.5 ' + themeStyles.card}>
                <div className="text-2xl">🥫</div>
                <div className="font-extrabold text-sm">Noch keine Lebensmittel in dieser Ansicht</div>
              </div>
            ) : (
              filteredStock.map(item => {
                const daysLeft = getDaysUntil(item.expiryDate, todayStr);
                const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[3];
                const isUrgent = daysLeft <= 3;
                const isWarning = daysLeft > 3 && daysLeft <= 7;
                const emojiIcon = getFoodEmoji(item.name, item.customEmoji);

                return (
                  <div
                    key={item.id}
                    className={'p-2.5 rounded-2xl border flex flex-col justify-between gap-2 shadow-xs transition-all ' +
                      themeStyles.card +
                      (isUrgent ? ' border-rose-500/85 ring-1 ring-rose-500/40' : isWarning ? ' border-amber-400/70' : '')}
                  >
                    {/* KOPF DER KOMPAKT-KACHEL: EMOJI + LAGERORT + MENGE + NAME */}
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(item)}
                          title="Klicken zum Bearbeiten (Emoji, MHD, Lagerort)"
                          className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner cursor-pointer hover:scale-105 transition-transform"
                        >
                          {emojiIcon}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-extrabold opacity-75 truncate">
                              {locObj.short}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-black/35 text-[10px] font-black text-amber-300 shrink-0">
                              {item.quantity}
                            </span>
                          </div>

                          <h3
                            onClick={() => openEditProductModal(item)}
                            title={item.name}
                            className="font-extrabold text-xs leading-tight line-clamp-2 break-words mt-0.5 cursor-pointer hover:text-sky-300"
                          >
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      {/* KOMPAKTE MHD-LEISTE */}
                      <div
                        onClick={() => openEditProductModal(item)}
                        className={'px-2 py-1 rounded-xl border flex items-center justify-between text-[10px] font-extrabold cursor-pointer ' +
                          (isUrgent
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                            : isWarning
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                            : themeStyles.subtle)}
                      >
                        <span>📅 {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}</span>
                        <span>
                          {daysLeft <= 0 ? '🔴 Heute!' : daysLeft === 1 ? '🟠 1 Tag' : ('🟢 ' + daysLeft + ' T.')}
                        </span>
                      </div>
                    </div>

                    {/* UNTERE BUTTON-LEISTE DER KACHEL */}
                    {confirmConsumeId === item.id ? (
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => MoveItemToTrash(item, 'consumed')}
                          className="tw-glow-btn py-1 rounded-xl text-[10px] font-black cursor-pointer"
                        >
                          ✓ Verzehrt
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmConsumeId(null)}
                          className="tw-nav-inactive py-1 rounded-xl text-[10px] font-bold cursor-pointer"
                        >
                          Abbruch
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirmConsumeId(item.id)}
                          title="Als verzehrt bestätigen"
                          className="tw-glow-btn flex-1 py-1 px-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Verzehrt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditProductModal(item)}
                          title="Produkt bearbeiten (MHD, Emoji, Name, Lagerort, Löschen)"
                          className="tw-glow-btn px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          title="Auf die Einkaufsliste setzen"
                          onClick={() => {
                            addShoppingItem(item.name);
                            showToast('Auf Einkaufsliste', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                          }}
                          className="tw-nav-inactive p-1 rounded-xl text-sky-400 cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
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
          SUB-TAB 2: WEB-REZEPTE, SCHNELLE FAMILIENKÜCHE & TAGES-MENÜ
         ========================================================= */}
      {activeSubTab === 'recipes' && (
        <div className="space-y-5">
          <div className={'p-5 rounded-3xl border space-y-4 ' + themeStyles.card}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-amber-400" />
                  <span>Schnelle Familien-Rezepte & Tages-Menü Planer</span>
                </h3>
                <p className={'text-xs font-semibold mt-0.5 ' + themeStyles.textMuted}>
                  Alle Vorschläge sind in 15–25 Minuten gekocht, familienfreundlich und verbrauchen deine bald ablaufenden Vorräte zuerst!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchWebRecipesFromStock}
                  disabled={isLoadingWebRecipes}
                  className="tw-glow-btn px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer"
                >
                  <Globe className={'w-4 h-4 ' + (isLoadingWebRecipes ? 'animate-spin' : '')} />
                  <span>{isLoadingWebRecipes ? 'Suche Rezepte im Netz...' : '🌐 Live-Rezepte aus dem Netz holen'}</span>
                </button>

                <a
                  href={chefkochSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tw-glow-btn px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer no-underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>🔍 Chefkoch Reste-Suche</span>
                </a>

                <button
                  type="button"
                  onClick={autoPlanEntireWeekFromStock}
                  className="tw-glow-btn px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>🪄 Ganze Woche (Mo–So) aus Vorrat planen</span>
                </button>
              </div>
            </div>

            <div className={'p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ' + themeStyles.subtle}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-black uppercase text-sky-400">🍽️ Tages-Menü Ziel-Tag:</span>
                <select
                  value={targetMealDayId}
                  onChange={(e) => setTargetMealDayId(Number(e.target.value))}
                  className={'px-3.5 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {safeMeals.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                      📅 {m.dayLabel} (aktuell: {m.dish})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSideAndDessert}
                    onChange={(e) => setIncludeSideAndDessert(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>🥗+🍊 Mit Salat/Obst aus Vorrat zum kompletten Tages-Menü ergänzen</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoSendMissingToShopping}
                    onChange={(e) => setAlsoSendMissingToShopping(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>🛒 Fehlende Zutaten automatisch auf Einkaufsliste</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all',     label: '⭐ Beste Treffer für deinen Vorrat' },
                { id: 'express', label: '⚡ Express-Küche (max. 20 Min.)' },
                { id: 'kids',    label: '👨‍👩‍👧‍👦 Kinder-Lieblinge' },
                { id: 'web',     label: '🌐 Aus dem Internet geladen (' + webRecipes.length + ')' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    if (f.id === 'web' && webRecipes.length === 0) {
                      fetchWebRecipesFromStock();
                    } else {
                      setRecipeFilter(f.id);
                    }
                  }}
                  className={'px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ' + (recipeFilter === f.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {evaluatedRecipes.map(rec => (
              <div
                key={rec.id}
                className={'p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 shadow-sm ' + themeStyles.card + (rec.urgentCount > 0 ? ' border-amber-400/70' : '')}
              >
                <div className="space-y-3">
                  {rec.thumbUrl && (
                    <div className="w-full h-40 rounded-2xl overflow-hidden relative border border-white/10">
                      <img src={rec.thumbUrl} alt={rec.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/75 text-white text-[10px] font-black">
                        🌐 Live Web-Rezept
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-black flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.prepMinutes} Min.
                        </span>
                        {rec.kidFavorite && (
                          <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-black">
                            👨‍👩‍👧‍👦 Familien-Hit
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-lg leading-snug">{rec.title}</h4>
                    </div>
                    <span className={'px-2.5 py-1 rounded-full text-xs font-black shrink-0 ' + (rec.matchPercent >= 50 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300')}>
                      {rec.matchPercent}% da
                    </span>
                  </div>

                  {rec.shortDesc && (
                    <p className={'text-xs font-semibold ' + themeStyles.textMuted}>{rec.shortDesc}</p>
                  )}

                  {rec.urgentCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                      ⚡ Verwertet {rec.urgentCount} bald ablaufende(s) Produkt(e) aus deinem Bestand!
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {rec.ingredientStatus.map((ing, idx) => (
                      <div key={idx} className={'px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-bold ' + themeStyles.subtle}>
                        <span>{ing.name}</span>
                        {ing.inPantry ? (
                          <span className="text-emerald-400 font-extrabold">✓ Auf Vorrat ({ing.pantryItem?.name})</span>
                        ) : (
                          <span className="text-amber-400 opacity-80">🛒 Fehlt</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => convertRecipeToDailyMenu(rec)}
                    className="tw-glow-btn w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>🍽️ Als Tages-Menü für {safeMeals.find(m => Number(m.id) === Number(targetMealDayId))?.dayLabel || 'Montag'} setzen</span>
                  </button>

                  {rec.sourceUrl && (
                    <a
                      href={rec.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="tw-nav-inactive w-full py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 no-underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Original-Kochanleitung öffnen
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 3: KOMPAKTER MÜLLEIMER & VERLAUF
         ========================================================= */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4">
          <div className={'p-4 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ' + themeStyles.card}>
            <div>
              <h3 className="text-lg font-extrabold">🗑️ Mülleimer & Verbrauchs-Übersicht</h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Übersicht über verzehrte und abgelaufene Lebensmittel für eine nachhaltige Einkaufsplanung.
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {safeTrash.length === 0 ? (
              <div className={'col-span-full p-8 rounded-3xl border text-center ' + themeStyles.card}>
                <div className="text-2xl mb-1">🌱</div>
                <div className="font-extrabold text-sm">Der Mülleimer ist leer!</div>
              </div>
            ) : (
              safeTrash.map(tItem => {
                const isWasted = tItem.reason === 'expired' || tItem.reason === 'wasted';
                return (
                  <div
                    key={tItem.id}
                    className={'p-3 rounded-2xl border flex flex-col justify-between gap-2.5 ' + themeStyles.card + (isWasted ? ' border-rose-500/50' : ' border-emerald-500/40')}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{getFoodEmoji(tItem.name, tItem.customEmoji)}</span>
                      <div className="min-w-0 flex-1">
                        <span className={'inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black ' + (isWasted ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-300')}>
                          {tItem.reasonLabel}
                        </span>
                        <h4 className="font-extrabold text-xs mt-1 truncate">{tItem.name}</h4>
                        <div className="text-[10px] opacity-65">{tItem.quantity} • MHD: {tItem.expiryDate}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          addShoppingItem(tItem.name);
                          showToast('Auf Einkaufsliste', tItem.name + ' wird nachgekauft.', '🛒');
                        }}
                        className="tw-glow-btn flex-1 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" /> Nachkaufen
                      </button>
                      <button
                        type="button"
                        title="Zurück in den Bestand legen"
                        onClick={() => restoreFromTrash(tItem)}
                        className="tw-nav-inactive px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          BEARBEITEN-FENSTER (MODAL) FÜR JEDES PRODUKT
          (Name, Menge, Emoji-Auswahl, Lagerort, MHD, Löschen & Speichern)
         ========================================================= */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleAcceptEditModal}
            className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-black/35 border border-white/15 flex items-center justify-center text-3xl">
                  {editModal.customEmoji || getFoodEmoji(editModal.name)}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">✏️ Produkt bearbeiten</h3>
                  <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                    Name, Menge, Emoji, Lagerort oder MHD anpassen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ ...editModal, open: false })}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. NAME & MENGE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black uppercase text-sky-400 mb-1">
                  Produktname
                </label>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-amber-400 mb-1">
                  Menge / Gewicht
                </label>
                <input
                  type="text"
                  value={editModal.quantity}
                  onChange={(e) => setEditModal({ ...editModal, quantity: e.target.value })}
                  placeholder="z.B. 250g, 2x"
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
                />
              </div>
            </div>

            {/* 2. LAGERORT ZUWEISEN */}
            <div>
              <label className="block text-[11px] font-black uppercase text-emerald-400 mb-1.5">
                Lagerort zuweisen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setEditModal({ ...editModal, location: loc.id })}
                    className={'py-2 px-2.5 rounded-xl text-xs font-extrabold cursor-pointer ' +
                      (editModal.location === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    {loc.short}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. ABLAUFDATUM (MHD) ÄNDERN */}
            <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black uppercase text-amber-400">
                  📅 Ablaufdatum (MHD)
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { l: '+3 T.', d: 3 },
                    { l: '+1 Wo.', d: 7 },
                    { l: '+2 Wo.', d: 14 },
                    { l: '+1 Mon.', d: 30 },
                    { l: '+6 Mon.', d: 180 }
                  ].map(b => (
                    <button
                      key={b.d}
                      type="button"
                      onClick={() => setEditModal({ ...editModal, expiryDate: formatDateStr(addDays(new Date(), b.d)) })}
                      className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer"
                    >
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="date"
                required
                value={editModal.expiryDate}
                onChange={(e) => setEditModal({ ...editModal, expiryDate: e.target.value })}
                className={'w-full px-3.5 py-2.5 rounded-xl border text-xs font-black ' + themeStyles.input}
              />
            </div>

            {/* 4. EMOJI AUSWÄHLEN */}
            <div className={'p-3.5 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🎨 Passendes Emoji wählen</span>
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, customEmoji: getFoodEmoji(editModal.name) })}
                  className="text-[11px] font-extrabold text-sky-400 hover:underline cursor-pointer"
                >
                  🔄 Automatisch erkennen
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {FOOD_EMOJI_PICKER.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEditModal({ ...editModal, customEmoji: em })}
                    className={'w-8 h-8 rounded-xl border text-base flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ' +
                      (editModal.customEmoji === em ? 'ring-2 ring-sky-400 bg-sky-500/25' : 'bg-black/25 border-white/10')}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. LÖSCHEN & ÄNDERUNGEN AKZEPTIEREN */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleDeleteFromEditModal}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ Produkt löschen</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, open: false })}
                  className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="tw-glow-btn px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ Änderungen akzeptieren</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
