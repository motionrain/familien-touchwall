// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Trash2, Utensils, Plus, CheckCircle2,
  ShoppingCart, Sparkles, RotateCcw, Globe, Clock,
  Wand2, ExternalLink, ChefHat, Pencil, Check, X,
  Table as TableIcon, LayoutGrid
} from 'lucide-react';
import { formatDateStr, addDays } from './touchwallConfig';

const STORAGE_LOCATIONS = [
  { id: 'all',     label: '🏠 Alle Orte',       short: '🏠 Alle' },
  { id: 'fridge',  label: '🧊 Kühlschrank',     short: '🧊 Kühl.' },
  { id: 'freezer', label: '❄️ Gefrierschrank',  short: '❄️ TK' },
  { id: 'pantry',  label: '🗄️ Keller / Vorrat', short: '🗄️ Keller' },
  { id: 'kitchen', label: '🍎 Küche',           short: '🍎 Küche' }
];

// ============================================================================
// DIE 7 LEBENSMITTEL-KATEGORIEN INKL. ERNÄHRUNGS-BESCHREIBUNG
// ============================================================================
export const FOOD_CATEGORIES = [
  {
    id: 'drinks',
    icon: '🧃',
    title: 'Getränke',
    desc: 'Wasser, Kaffee, Tee und ungesüßte Säfte.'
  },
  {
    id: 'produce',
    icon: '🥦',
    title: 'Obst und Gemüse',
    desc: 'Frisches Obst, Gemüse, Salate und Hülsenfrüchte.'
  },
  {
    id: 'grains',
    icon: '🌾',
    title: 'Getreide, Getreideprodukte & Kartoffeln',
    desc: 'Brot, Nudeln, Reis, Flocken und Kartoffeln.'
  },
  {
    id: 'dairy',
    icon: '🧀',
    title: 'Milch und Milchprodukte',
    desc: 'Milch, Joghurt, Quark, Sahne und Käse.'
  },
  {
    id: 'meat_fish_eggs',
    icon: '🥩',
    title: 'Fleisch, Fisch, Wurst und Eier',
    desc: 'Eiweiß- und Nährstofflieferanten.'
  },
  {
    id: 'oils_fats',
    icon: '🧈',
    title: 'Öle und Fette (inkl. Würzmittel)',
    desc: 'Öle, Butter, Kräuterbutter, Essig, Senf und Soßen.'
  },
  {
    id: 'sweets_snacks',
    icon: '🍫',
    title: 'Süßwaren, Knabbereien & Sonstiges',
    desc: 'Chips, Schokolade, Zuckerwaren und Sonstiges.'
  }
];

const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🐶'
];

export function detectFoodCategory(nameStr, customCategory = '') {
  if (customCategory && FOOD_CATEGORIES.some(c => c.id === customCategory)) {
    return customCategory;
  }
  const n = String(nameStr || '').toLowerCase();

  // 1. Öle, Fette, Essig & Würzsoßen zuerst prüfen (damit "Weinwürziger Essig" nicht bei Getränken landet)
  if (/butter|kräuterbutter|meggle|margarine|öl|sonnenblumenöl|olivenöl|rapsöl|kokosöl|fett|schmalz|essig|hengstenberg|senf|thomy|ketchup|mayo|mayonnaise|dressing|burger sauce|heinz|soße|sauce|pesto/.test(n)) {
    return 'oils_fats';
  }
  // 2. Süßwaren & Schoko-Snacks prüfen
  if (/schokolade|choco|schoko|nutella|keks|cookie|gummibär|chips|flips|eis|bonbon|praline|zuckerware/.test(n)) {
    return 'sweets_snacks';
  }
  // 3. Getränke
  if (/wasser|mineralwasser|kaffee|espresso|tee|saft|apfelsaft|orangensaft|schorle|cola|limo|getränk|sirup|kakao|\bbier\b|\bwein\b/.test(n)) {
    return 'drinks';
  }
  // 4. Milch & Käse
  if (/milch|vollmilch|schwarzwaldmilch|landfein|joghurt|quark|käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta|schlagsahne|sahne|schmand|creme fraiche|mascarpone|ayran|kefir/.test(n)) {
    return 'dairy';
  }
  // 5. Fleisch, Fisch, Wurst & Eier
  if (/fleisch|hackfleisch|rinderhack|rind|schwein|hähnchen|huhn|pute|geflügel|schnitzel|steak|gulasch|wurst|bratwurst|rostbratwurst|leberwurst|würstchen|wiener|lyoner|salami|schinken|speck|aufschnitt|fisch|lachs|thunfisch|fischstäbchen|forelle|garnele|\bei\b|eier/.test(n)) {
    return 'meat_fish_eggs';
  }
  // 6. Getreide, Brot, Pasta, Reis & Kartoffeln
  if (/brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|nudel|spaghetti|pasta|penne|rigatoni|tortellini|ravioli|spätzle|reis|spitzenreis|langkorn|basmati|jasmin|milchreis|getreide|haferflocken|müsli|cornflakes|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|knödel/.test(n)) {
    return 'grains';
  }
  // 7. Obst, Gemüse & Salate
  if (/obst|apfel|äpfel|elstar|apfelmus|banane|clementine|mandarine|orange|susi|beere|erdbeer|himbeer|heidelbeer|traube|birne|zitrone|limette|kiwi|mango|ananas|melone|gemüse|salat|eisberg|mâche|mache|feldsalat|rucola|spinat|gurke|tomate|tomatenmark|passierte|oro di parma|paprika|karotte|möhre|zwiebel|knoblauch|brokkoli|blumenkohl|spargel|stangenspargel|rotkohl|kraut|pilz|champignon|avocado|mais|erbse|bohne|linse|kichererbse|chili sin carne|gefro/.test(n)) {
    return 'produce';
  }
  return 'sweets_snacks';
}

export function getFoodEmoji(nameStr, customEmoji = '') {
  if (customEmoji && String(customEmoji).trim() !== '') {
    return String(customEmoji).trim();
  }
  const n = String(nameStr || '').toLowerCase();
  if (/hunde|katzen|tierfutter|futter/.test(n)) return '🐶';
  if (/butter|kräuterbutter|meggle|margarine/.test(n)) return '🧈';
  if (/bratwurst|rostbratwurst|leberwurst|wurst|würstchen|wiener|lyoner|aufschnitt|schinken|salami|speck/.test(n)) return '🌭';
  if (/burger|cheeseburger/.test(n)) return '🍔';
  if (/clementine|mandarine|orange|apfelsine|susi/.test(n)) return '🍊';
  if (/apfel|äpfel|elstar|boskoop|pink lady|rotkohl|apfelmus/.test(n)) return '🍎';
  if (/banane/.test(n)) return '🍌';
  if (/erdbeer|himbeer|heidelbeer|blaubeer|beeren|kirsch/.test(n)) return '🍓';
  if (/zitrone|limette/.test(n)) return '🍋';
  if (/salat|eisberg|mâche|mache|feldsalat|kopfsalat|rucola|spinat|kräuter/.test(n)) return '🥬';
  if (/gurke/.test(n)) return '🥒';
  if (/tomate|passierte|tomatenmark|oro di parma/.test(n)) return '🍅';
  if (/paprika|chili/.test(n)) return '🫑';
  if (/karotte|möhre/.test(n)) return '🥕';
  if (/kartoffel|kartoffelpüree|pfanni|pommes|gnocchi|schupfnudel/.test(n)) return '🥔';
  if (/zwiebel|knoblauch/.test(n)) return '🧅';
  if (/brokkoli|blumenkohl|spargel/.test(n)) return '🥦';
  if (/mais/.test(n)) return '🌽';
  if (/pilz|champignon/.test(n)) return '🍄';
  if (/avocado/.test(n)) return '🥑';
  if (/käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta/.test(n)) return '🧀';
  if (/milch|vollmilch|schwarzwaldmilch|landfein|hafermilch|kakao/.test(n)) return '🥛';
  if (/schlagsahne|sahne|joghurt|quark|pudding|schmand|creme/.test(n)) return '🥣';
  if (/\bei\b|eier/.test(n)) return '🥚';
  if (/hähnchen|huhn|pute|geflügel|nuggets/.test(n)) return '🍗';
  if (/hackfleisch|rinderhack|rind|steak|fleisch|schnitzel|gulasch/.test(n)) return '🥩';
  if (/fisch|lachs|thunfisch|fischstäbchen|forelle/.test(n)) return '🐟';
  if (/nudel|spaghetti|pasta|penne|tortellini|ravioli|spätzle/.test(n)) return '🍝';
  if (/reis|spitzenreis|langkorn|onkelz|basmati|jasmin|milchreis/.test(n)) return '🍚';
  if (/brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant/.test(n)) return '🥖';
  if (/pizza|flammkuchen/.test(n)) return '🍕';
  if (/wrap|taco|tortilla|schär/.test(n)) return '🌮';
  if (/senf|thomy|heinz|ketchup|mayo|soße|sauce|dressing|pesto|öl|sonnenblumenöl|essig|hengstenberg/.test(n)) return '🥫';
  if (/mehl|zucker|salz|haferflocken|müsli|cornflakes/.test(n)) return '🌾';
  if (/schokolade|choco|schoko|nutella|keks|gummibär|chips|eis/.test(n)) return '🍫';
  if (/wasser|saft|cola|limo|bier|wein|kaffee|tee/.test(n)) return '🧃';
  return '🥫';
}

function decrementItemPieceCount(rawQtyStr) {
  const clean = String(rawQtyStr || '1x').trim();

  const multiMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*([x×])\s*(\d+(?:[.,]\d+)?)\s*(g|ml|kg|l|gr|stk|pcs)(.*)$/i);
  if (multiMatch) {
    const currentCount = Math.round(parseFloat(multiMatch[1].replace(',', '.')));
    const unitWeight = parseFloat(multiMatch[3].replace(',', '.'));
    const unit = multiMatch[4];
    const tail = multiMatch[5] || '';

    if (currentCount > 1) {
      const nextCount = currentCount - 1;
      const nextTotal = Math.round(nextCount * unitWeight * 100) / 100;
      if (tail.includes('=')) {
        return { remaining: nextCount, nextQtyStr: nextCount + ' x ' + unitWeight + ' ' + unit + ' = ' + nextTotal + ' ' + unit };
      }
      if (tail.includes('(')) {
        return { remaining: nextCount, nextQtyStr: nextCount + ' x ' + unitWeight + unit + ' (' + nextTotal + unit + ')' };
      }
      return { remaining: nextCount, nextQtyStr: nextCount + 'x ' + unitWeight + unit };
    }
    return { remaining: 0, nextQtyStr: '0' };
  }

  const pieceMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(x|pcs|pc|stk|stück|pkg|pack|pck|dosen|dose|flaschen|fl|gläser|glas|becher|rollen|rolle)?$/i);
  if (pieceMatch) {
    const val = parseFloat(pieceMatch[1].replace(',', '.'));
    const rawUnit = pieceMatch[2] || 'x';
    const hasSpace = /^\d+(?:[.,]\d+)?\s+/.test(clean);
    const hadDecimalZero = /\.0\b/.test(pieceMatch[1]);

    if (val > 1) {
      const nextVal = Math.max(1, Math.round(val - 1));
      const formattedNum = hadDecimalZero ? (nextVal + '.0') : String(nextVal);
      const sep = hasSpace ? ' ' : '';
      return {
        remaining: nextVal,
        nextQtyStr: formattedNum + sep + rawUnit
      };
    }
    return { remaining: 0, nextQtyStr: '0' };
  }

  return { remaining: 0, nextQtyStr: '0' };
}

const QUICK_FAMILY_RECIPES = [
  {
    id: 'fam_bolo',
    title: '🍝 Schnelle Familien-Bolognese',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'One-Pot & Pasta',
    shortDesc: 'Klassiker für Kinder – in 20 Min. fertig auf dem Tisch.',
    keywords: ['spaghetti', 'nudeln', 'pasta', 'hackfleisch', 'rinderhack', 'tomaten', 'passierte', 'tomatenmark', 'parmesan', 'möhren', 'karotten'],
    ingredients: ['Nudeln / Spaghetti', 'Hackfleisch', 'Tomatenmark / Passierte Tomaten', 'Parmesan Käse']
  },
  {
    id: 'fam_bratwurst',
    title: '🌭 Rostbratwurst mit Kartoffelpüree & Salat',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Familien-Klassiker',
    shortDesc: 'Schnelle Pfannen-Rostbratwurst mit Kräuterbutter, Kartoffelpüree und frischem Salat.',
    keywords: ['rostbratwurst', 'bratwurst', 'wurst', 'kräuterbutter', 'kartoffelpüree', 'salat', 'eisbergsalat', 'mâche', 'gurke', 'senf'],
    ingredients: ['Delikatess Rostbratwurst', 'Kartoffelpüree', 'Kräuterbutter / Senf', 'Eisbergsalat / Gurke']
  },
  {
    id: 'fam_wraps',
    title: '🌮 Knusprige Familien-Wraps mit Salat & Käse',
    prepMinutes: 15,
    kidFavorite: true,
    category: 'Express-Pfanne',
    shortDesc: 'Schär Wraps gefüllt mit Frischkäse, Scheibenkäse, Eisbergsalat, Gurke und Burger Sauce.',
    keywords: ['wraps', 'schär', 'scheibenkäse', 'frischkäse', 'philadelphia', 'eisbergsalat', 'gurke', 'burger sauce', 'chili'],
    ingredients: ['Wraps', 'Frischkäse / Scheibenkäse', 'Eisbergsalat & Gurke', 'Burger Sauce oder Chili sin carne']
  },
  {
    id: 'fam_omelett',
    title: '🍳 Schnelles Bauern-Rührei mit Landbrot & Gurkensalat',
    prepMinutes: 15,
    kidFavorite: true,
    category: 'Express-Pfanne',
    shortDesc: 'Frische Eier aus der Pfanne mit Kräuterbutter, Landbrot und knackigem Gurkensalat.',
    keywords: ['eier', 'ei', 'landbrot', 'kräuterbutter', 'butter', 'frischkäse', 'scheibenkäse', 'gurke', 'salat'],
    ingredients: ['Frische Eier', 'Landbrot Mehrkorn', 'Kräuterbutter / Frischkäse', 'Gurke / Salat']
  },
  {
    id: 'fam_pfannkuchen',
    title: '🥞 Goldene Familien-Pfannkuchen mit Apfelmus',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Süß & Herzhaft',
    shortDesc: 'Perfekt für Eier, Vollmilch, Äpfel und Apfelmus.',
    keywords: ['mehl', 'eier', 'ei', 'milch', 'vollmilch', 'apfelmus', 'apfel', 'äpfel', 'elstar'],
    ingredients: ['Frische Eier', 'Vollmilch', 'Mehl', 'Apfelmus / Äpfel Elstar']
  },
  {
    id: 'fam_wok',
    title: '🍚 Schnelle Familien-Reis-Pfanne mit Chili / Gemüse',
    prepMinutes: 20,
    kidFavorite: true,
    category: 'Pfanne & Wok',
    shortDesc: 'Langkorn-Reis mit Chili sin carne oder cremiger Frischkäse-Sahne-Soße.',
    keywords: ['reis', 'langkorn', 'chili', 'eier', 'gurke', 'salat', 'frischkäse', 'schlagsahne'],
    ingredients: ['Langkorn Reis', 'Chili sin carne oder Eier', 'Frischkäse / Schlagsahne', 'Beilagensalat']
  }
];

const DE_TO_EN_INGREDIENT_MAP = [
  { de: ['hähnchen', 'huhn', 'pute', 'geflügel'], en: 'chicken', label: 'Hähnchen' },
  { de: ['hackfleisch', 'rinderhack', 'rind'], en: 'beef', label: 'Rind / Hackfleisch' },
  { de: ['schwein', 'schinken', 'speck', 'bratwurst', 'wurst'], en: 'pork', label: 'Wurst / Schinken' },
  { de: ['lachs', 'fisch', 'fischstäbchen'], en: 'salmon', label: 'Lachs / Fisch' },
  { de: ['nudeln', 'spaghetti', 'pasta', 'tortellini'], en: 'pasta', label: 'Nudeln' },
  { de: ['reis', 'spitzenreis', 'langkorn', 'basmatireis'], en: 'rice', label: 'Reis' },
  { de: ['kartoffel', 'kartoffeln', 'kartoffelpüree'], en: 'potatoes', label: 'Kartoffeln' },
  { de: ['ei', 'eier'], en: 'egg', label: 'Eier' },
  { de: ['käse', 'frischkäse', 'scheibenkäse', 'parmesan', 'gouda', 'mozzarella'], en: 'cheese', label: 'Käse' },
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
  const [activeSubTab, setActiveSubTab] = useState('stock');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Formular: Neues Produkt
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('fridge');
  const [itemCategory, setItemCategory] = useState('auto');
  const [itemExpiry, setItemExpiry] = useState('');

  // Komfort-Bearbeitungs-Modal
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    name: '',
    quantity: '',
    location: 'fridge',
    category: 'produce',
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

    const finalCat = itemCategory === 'auto' ? detectFoodCategory(cleanName) : itemCategory;

    const newItem = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      quantity: itemQty.trim() || '1x',
      location: itemLocation,
      category: finalCat,
      expiryDate: itemExpiry,
      customEmoji: '',
      addedAt: todayStr,
      updatedAt: Date.now()
    };

    setPantryItems(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setItemName('');
    setItemQty('1x');
    setItemCategory('auto');
    setItemExpiry('');
    setShowAddForm(false);
    showToast('In Speisekammer gespeichert', cleanName + ' (MHD: ' + itemExpiry + ')', getFoodEmoji(cleanName));
  };

  const openEditProductModal = (item) => {
    setEditModal({
      open: true,
      id: item.id,
      name: item.name || '',
      quantity: item.quantity || '1x',
      location: item.location || 'fridge',
      category: detectFoodCategory(item.name, item.category),
      expiryDate: item.expiryDate || todayStr,
      customEmoji: item.customEmoji || getFoodEmoji(item.name)
    });
  };

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
            category: editModal.category,
            expiryDate: editModal.expiryDate,
            customEmoji: editModal.customEmoji,
            updatedAt: Date.now()
          }
        : it
    ));
    setEditModal({ ...editModal, open: false });
    showToast('Änderungen gespeichert!', editModal.name + ' wurde aktualisiert.', editModal.customEmoji || '✅');
  };

  const handleDeleteFromEditModal = () => {
    const target = safeStock.find(x => x.id === editModal.id);
    if (!target) {
      setEditModal({ ...editModal, open: false });
      return;
    }
    MoveItemToTrash(target, 'wasted');
    setEditModal({ ...editModal, open: false });
  };

  const handleConsumeClick = (item) => {
    const result = decrementItemPieceCount(item.quantity);

    if (result.remaining > 0) {
      setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
        it.id === item.id ? { ...it, quantity: result.nextQtyStr, updatedAt: Date.now() } : it
      ));
      showToast(
        '1 Stück verzehrt!',
        '„' + item.name + '“ → Restbestand: ' + result.nextQtyStr,
        getFoodEmoji(item.name, item.customEmoji)
      );
    } else {
      MoveItemToTrash(item, 'consumed');
    }
  };

  const MoveItemToTrash = (item, reasonType) => {
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== item.id));
    const trashEntry = {
      ...item,
      trashedAt: todayStr,
      reason: reasonType,
      reasonLabel:
        reasonType === 'consumed'
          ? '🍽️ Komplett verzehrt am ' + todayStr
          : '🗑️ Weggeworfen am ' + todayStr
    };
    setPantryTrash(prev => [trashEntry, ...(Array.isArray(prev) ? prev : [])]);

    if (reasonType === 'consumed') {
      showToast('Komplett verzehrt!', '„' + item.name + '“ ist aufgebraucht und liegt jetzt im Verlauf.', '🍽️');
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
        category: detectFoodCategory(trashItem.name, trashItem.category),
        expiryDate: newExp.trim(),
        customEmoji: trashItem.customEmoji || '',
        addedAt: todayStr,
        updatedAt: Date.now()
      },
      ...(Array.isArray(prev) ? prev : [])
    ]);
    showToast('Wiederhergestellt', trashItem.name + ' ist wieder im Bestand.', '↩️');
  };

  const filteredStock = useMemo(() => {
    return safeStock
      .map(it => ({
        ...it,
        resolvedCategory: detectFoodCategory(it.name, it.category)
      }))
      .filter(it => locationFilter === 'all' || it.location === locationFilter)
      .filter(it => categoryFilter === 'all' || it.resolvedCategory === categoryFilter)
      .sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));
  }, [safeStock, locationFilter, categoryFilter]);

  const groupedByCategory = useMemo(() => {
    return FOOD_CATEGORIES.map(cat => {
      const items = filteredStock.filter(it => it.resolvedCategory === cat.id);
      return {
        ...cat,
        items
      };
    }).filter(group => categoryFilter === 'all' ? group.items.length > 0 : group.id === categoryFilter);
  }, [filteredStock, categoryFilter]);

  // =========================================================
  // LÜCKENLOSE 2-SPALTEN-VERTEILUNG (KEINE LEEREN LÖCHER MEHR!)
  // =========================================================
  const balancedCategoryColumns = useMemo(() => {
    const leftCol = [];
    const rightCol = [];
    let leftWeight = 0;
    let rightWeight = 0;

    groupedByCategory.forEach(group => {
      const boxWeight = 2 + group.items.length;
      if (leftWeight <= rightWeight) {
        leftCol.push(group);
        leftWeight += boxWeight;
      } else {
        rightCol.push(group);
        rightWeight += boxWeight;
      }
    });

    return [leftCol, rightCol];
  }, [groupedByCategory]);

  const expiringSoonItems = useMemo(() => {
    return safeStock
      .filter(it => getDaysUntil(it.expiryDate, todayStr) <= 7)
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
            if (getDaysUntil(found.expiryDate, todayStr) <= 7) {
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

  // REINER GLOW-EFFEKT BEIM HOVER (KEIN ZOOM -> KEINE SCROLLBALKEN!)
  const pantryAnimationStyles = [
    '@keyframes twPulseOrangeMhd {',
    '  0%, 100% {',
    '    border-color: rgba(251, 146, 60, 0.85);',
    '    box-shadow: inset 0 0 8px rgba(245, 158, 11, 0.2), 0 0 8px rgba(245, 158, 11, 0.3);',
    '  }',
    '  50% {',
    '    border-color: #fbbf24;',
    '    box-shadow: inset 0 0 16px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.75);',
    '  }',
    '}',
    '@keyframes twPulseRedMhd {',
    '  0%, 100% {',
    '    border-color: rgba(244, 63, 94, 0.9);',
    '    box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.25), 0 0 10px rgba(244, 63, 94, 0.4);',
    '  }',
    '  50% {',
    '    border-color: #ff2a55;',
    '    box-shadow: inset 0 0 20px rgba(244, 63, 94, 0.5), 0 0 22px rgba(244, 63, 94, 0.9);',
    '  }',
    '}',
    '.tw-pantry-tile {',
    '  transition: box-shadow 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;',
    '}',
    '.tw-pantry-tile:hover {',
    '  border-color: var(--tw-btn-border, #38bdf8) !important;',
    '  box-shadow: 0 0 15px var(--tw-btn-glow, rgba(56, 189, 248, 0.65)), inset 0 0 10px rgba(56, 189, 248, 0.18) !important;',
    '}',
    '.tw-pantry-row {',
    '  transition: box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;',
    '}',
    '.tw-pantry-row:hover {',
    '  background-color: rgba(56, 189, 248, 0.12) !important;',
    '  border-color: var(--tw-btn-border, #38bdf8) !important;',
    '  box-shadow: 0 0 14px var(--tw-btn-glow, rgba(56, 189, 248, 0.55)), inset 0 0 10px rgba(56, 189, 248, 0.2) !important;',
    '}',
    '.tw-pantry-warn-orange {',
    '  animation: twPulseOrangeMhd 2.2s infinite ease-in-out;',
    '  border-color: rgba(251, 146, 60, 0.85) !important;',
    '}',
    '.tw-pantry-urgent-red {',
    '  animation: twPulseRedMhd 1.35s infinite ease-in-out;',
    '  border-color: rgba(244, 63, 94, 0.9) !important;',
    '}'
  ].join('\n');

  const renderCategoryGroupCard = (group) => (
    <div
      key={group.id}
      className={'rounded-2xl border overflow-hidden shadow-md flex flex-col ' + themeStyles.card + ' ' + themeStyles.divider}
    >
      {/* ULTRA-SCHLANKE KATEGORIE-KOPFZEILE (1 ZEILE) */}
      <div className={'px-3 py-2 border-b flex items-center justify-between gap-2 ' + themeStyles.banner + ' ' + themeStyles.divider}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-black/30 border border-white/15 flex items-center justify-center text-base shrink-0">
            {group.icon}
          </span>
          <h3 className="font-black text-xs sm:text-sm truncate">{group.title}</h3>
          <span className="px-2 py-0.2 rounded-full bg-sky-500/25 text-sky-300 border border-sky-400/30 text-[10px] font-black shrink-0">
            {group.items.length}
          </span>
          <span className={'text-[10px] font-semibold truncate hidden 2xl:inline ' + themeStyles.textMuted}>
            • {group.desc}
          </span>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="p-1.5 space-y-1">
          {/* Schlanker Spalten-Kopf */}
          <div className="grid grid-cols-12 items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-60">
            <div className="col-span-4">Produkt</div>
            <div className="col-span-2 text-center">Menge & Ort</div>
            <div className="col-span-4 text-center">MHD & Verfallstag</div>
            <div className="col-span-2 text-right">Aktion</div>
          </div>

          {group.items.map(item => {
            const daysLeft = getDaysUntil(item.expiryDate, todayStr);
            const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[3];
            const isUrgentRed = daysLeft <= 3;
            const isWarningOrange = daysLeft > 3 && daysLeft <= 7;
            const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
            const decPreview = decrementItemPieceCount(item.quantity);

            const rowGlowClass = isUrgentRed
              ? ' tw-pantry-urgent-red bg-rose-950/30'
              : isWarningOrange
              ? ' tw-pantry-warn-orange bg-amber-950/25'
              : themeStyles.subtle;

            const daysText = daysLeft <= 0
              ? '🔴 HEUTE!'
              : daysLeft === 1
              ? '🔴 1 Tag'
              : (daysLeft + ' T.');

            return (
              <div
                key={item.id}
                className={'tw-pantry-row grid grid-cols-12 items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ' + rowGlowClass}
              >
                {/* SPALTE 1 (4/12): EMOJI + PRODUKTNAME */}
                <div
                  onClick={() => openEditProductModal(item)}
                  className="col-span-4 flex items-center gap-2 min-w-0 cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-lg bg-black/35 border border-white/10 flex items-center justify-center text-base shrink-0">
                    {emojiIcon}
                  </span>
                  <span
                    title={item.name}
                    className="font-extrabold text-xs leading-tight truncate hover:text-sky-300"
                  >
                    {item.name}
                  </span>
                </div>

                {/* SPALTE 2 (2/12): MENGE & ORT NEBENEINANDER/KOMPAKT */}
                <div
                  onClick={() => openEditProductModal(item)}
                  className="col-span-2 flex items-center justify-center gap-1 cursor-pointer min-w-0"
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-amber-400/30 text-[10px] font-black text-amber-300 truncate">
                    {item.quantity}
                  </span>
                  <span className="text-[10px] font-bold opacity-75 hidden sm:inline truncate">
                    {locObj.short}
                  </span>
                </div>

                {/* SPALTE 3 (4/12): GRÖSSERES MHD-DATUM MIT VERFALLSTAG DAHINTER */}
                <div
                  onClick={() => openEditProductModal(item)}
                  className="col-span-4 flex items-center justify-center cursor-pointer"
                >
                  <div
                    className={'px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs sm:text-[13px] font-black whitespace-nowrap ' +
                      (isUrgentRed
                        ? 'bg-rose-500/30 border-rose-400 text-rose-100'
                        : isWarningOrange
                        ? 'bg-amber-500/30 border-amber-400 text-amber-100'
                        : 'bg-black/25 border-white/10')}
                  >
                    <span>{item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}</span>
                    <span className="opacity-50">•</span>
                    <span className={isUrgentRed ? 'text-rose-300' : isWarningOrange ? 'text-amber-300' : 'text-emerald-400'}>
                      {daysText}
                    </span>
                  </div>
                </div>

                {/* SPALTE 4 (2/12): KOMPAKTE TOUCH-BUTTONS */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleConsumeClick(item)}
                    title={decPreview.remaining > 0 ? ('1 Stück abziehen (Rest: ' + decPreview.nextQtyStr + ')') : 'Komplett verzehrt'}
                    className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditProductModal(item)}
                    title="Produkt bearbeiten"
                    className="tw-nav-inactive p-1.5 rounded-lg text-sky-300 cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    title="Auf die Einkaufsliste setzen"
                    onClick={() => {
                      addShoppingItem(item.name);
                      showToast('Auf Einkaufsliste', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                    }}
                    className="tw-nav-inactive p-1.5 rounded-lg text-amber-300 cursor-pointer shrink-0"
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ANSICHT B: KOMPAKT-KACHELN MIT VERFALLSTAG HINTER DEM MHD */
        <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {group.items.map(item => {
            const daysLeft = getDaysUntil(item.expiryDate, todayStr);
            const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[3];
            const isUrgentRed = daysLeft <= 3;
            const isWarningOrange = daysLeft > 3 && daysLeft <= 7;
            const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
            const decPreview = decrementItemPieceCount(item.quantity);

            const glowClass = isUrgentRed
              ? ' tw-pantry-urgent-red bg-rose-950/25'
              : isWarningOrange
              ? ' tw-pantry-warn-orange bg-amber-950/20'
              : themeStyles.subtle;

            return (
              <div
                key={item.id}
                className={'tw-pantry-tile p-2.5 rounded-2xl border flex flex-col justify-between gap-2 ' + glowClass}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => openEditProductModal(item)}
                    className="w-8 h-8 rounded-xl bg-black/35 border border-white/10 flex items-center justify-center text-base shrink-0 cursor-pointer"
                  >
                    {emojiIcon}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold opacity-75 truncate">{locObj.short}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-black text-amber-300 shrink-0">
                        {item.quantity}
                      </span>
                    </div>
                    <h4
                      onClick={() => openEditProductModal(item)}
                      title={item.name}
                      className="font-extrabold text-xs leading-tight truncate mt-0.5 cursor-pointer hover:text-sky-300"
                    >
                      {item.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
                  <span
                    onClick={() => openEditProductModal(item)}
                    className={'text-xs font-black cursor-pointer ' + (isUrgentRed ? 'text-rose-300' : isWarningOrange ? 'text-amber-300' : 'text-emerald-400')}
                  >
                    {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)} • {daysLeft}T
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleConsumeClick(item)}
                      className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer"
                    >
                      {decPreview.remaining > 0 ? '🍽️ -1' : '🍽️ Weg'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditProductModal(item)}
                      className="tw-nav-inactive p-1 rounded-lg text-sky-300 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-4 flex flex-col gap-2.5 overflow-x-hidden">
      <style>{pantryAnimationStyles}</style>

      {/* =========================================================
          ULTRA-SCHLANKER KOPFBEREICH (ALLES IN EINER FLACHEN LEISTE)
         ========================================================= */}
      <div className={'px-3.5 py-2.5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-2 ' + themeStyles.card}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base sm:text-lg font-black">🥫 Speisekammer</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold">
            🌱 Quote: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} abgelaufen)
          </span>

          {/* Lagerort-Schnellwahl direkt im Header */}
          <div className="flex items-center gap-1 ml-1">
            {STORAGE_LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => setLocationFilter(loc.id)}
                className={'px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ' + (locationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                {loc.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('stock');
              setShowAddForm(prev => !prev);
            }}
            className={'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer ' + (showAddForm ? 'tw-active-nav' : 'tw-glow-btn')}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Produkt einbuchen</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stock')}
            className={'px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ' + (activeSubTab === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Bestand ({safeStock.length})</span>
            {expiringSoonItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                {expiringSoonItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('recipes')}
            className={'px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ' + (activeSubTab === 'recipes' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>🍽️ Rezepte & Menü</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trash')}
            className={'px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ' + (activeSubTab === 'trash' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>🗑️ ({safeTrash.length})</span>
          </button>

          {activeSubTab === 'stock' && (
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/25 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Tabellen-Ansicht"
                className={'px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer ' + (viewMode === 'table' ? 'tw-active-nav' : 'opacity-70')}
              >
                <TableIcon className="w-3 h-3" />
                <span>Tabelle</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Kachel-Ansicht"
                className={'px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer ' + (viewMode === 'cards' ? 'tw-active-nav' : 'opacity-70')}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Kacheln</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SUB-TAB 1: SCHLANKER BESTAND OHNE LÜCKEN
         ========================================================= */}
      {activeSubTab === 'stock' && (
        <div className="space-y-2.5">
          {/* AUFKLAPPBARES SCHNELL-FORMULAR ZUM EINBUCHEN */}
          {showAddForm && (
            <form onSubmit={handleAddProduct} className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.card}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-4 flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-xl bg-black/25 border border-white/10 flex items-center justify-center text-base shrink-0">
                    {getFoodEmoji(itemName)}
                  </span>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Produktname (z.B. Vollmilch, Eier, Äpfel)..."
                    className={'w-full px-3 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  />
                </div>

                <input
                  type="text"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Menge (z.B. 6.0 pcs, 2x)"
                  className={'md:col-span-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold ' + themeStyles.input}
                />

                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className={'md:col-span-2 px-2.5 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-amber-300">
                    ✨ Auto ({FOOD_CATEGORIES.find(c => c.id === detectFoodCategory(itemName))?.title.split(',')[0]})
                  </option>
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>

                <select
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  className={'md:col-span-2 px-2.5 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">{loc.label}</option>
                  ))}
                </select>

                <div className="md:col-span-2 flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={itemExpiry}
                    onChange={(e) => setItemExpiry(e.target.value)}
                    className={'w-full px-2.5 py-1.5 rounded-xl border-2 text-xs font-black ' + (itemExpiry ? 'border-emerald-500/60 ' : 'border-amber-500/70 ') + themeStyles.input}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-black uppercase text-amber-400 mr-1">⏳ Schnell-MHD:</span>
                  {[
                    { label: '+3 T.',   days: 3 },
                    { label: '+5 T.',   days: 5 },
                    { label: '+1 Wo.',  days: 7 },
                    { label: '+2 Wo.',  days: 14 },
                    { label: '+1 Mon.', days: 30 },
                    { label: '+3 Mon.', days: 90 },
                    { label: '+1 Jahr', days: 365 }
                  ].map(b => (
                    <button
                      key={b.days}
                      type="button"
                      onClick={() => setQuickExpiryDays(b.days)}
                      className="tw-glow-btn px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="tw-nav-inactive px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Schließen
                  </button>
                  <button
                    type="submit"
                    disabled={!itemName.trim() || !itemExpiry}
                    className={'px-4 py-1 rounded-xl font-black text-xs flex items-center gap-1 ' + (!itemName.trim() || !itemExpiry ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-300' : 'tw-glow-btn cursor-pointer')}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Speichern</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* FLACHE KATEGORIEN-FILTERLEISTE */}
          <div className={'px-3 py-2 rounded-2xl border flex flex-wrap items-center gap-1.5 ' + themeStyles.card}>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={'px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer ' + (categoryFilter === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
            >
              🍱 Alle 7 Kategorien ({safeStock.length})
            </button>
            {FOOD_CATEGORIES.map(cat => {
              const count = safeStock.filter(it => detectFoodCategory(it.name, it.category) === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                  title={cat.desc}
                  className={'px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ' + (categoryFilter === cat.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.title.split(',')[0]}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/35 text-[9px] font-black text-amber-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* =========================================================
              2 AUSANCALIERTE SPALTEN OHNE LEERE LÜCKEN!
             ========================================================= */}
          {groupedByCategory.length === 0 ? (
            <div className={'p-8 rounded-3xl border text-center space-y-1 ' + themeStyles.card}>
              <div className="text-2xl">🥫</div>
              <div className="font-extrabold text-sm">Keine Lebensmittel in dieser Auswahl</div>
            </div>
          ) : categoryFilter !== 'all' ? (
            <div className="space-y-3">
              {groupedByCategory.map(group => renderCategoryGroupCard(group))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
              <div className="flex flex-col gap-3">
                {balancedCategoryColumns[0].map(group => renderCategoryGroupCard(group))}
              </div>
              <div className="flex flex-col gap-3">
                {balancedCategoryColumns[1].map(group => renderCategoryGroupCard(group))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          SUB-TAB 2: WEB-REZEPTE, SCHNELLE FAMILIENKÜCHE & TAGES-MENÜ
         ========================================================= */}
      {activeSubTab === 'recipes' && (
        <div className="space-y-4">
          <div className={'p-4 rounded-3xl border space-y-3.5 ' + themeStyles.card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-400" />
                  <span>Schnelle Familien-Rezepte & Tages-Menü Planer</span>
                </h3>
                <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                  Alle Vorschläge sind in 15–25 Minuten gekocht und verbrauchen bald ablaufende Vorräte zuerst!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchWebRecipesFromStock}
                  disabled={isLoadingWebRecipes}
                  className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className={'w-4 h-4 ' + (isLoadingWebRecipes ? 'animate-spin' : '')} />
                  <span>{isLoadingWebRecipes ? 'Suche...' : '🌐 Live-Rezepte laden'}</span>
                </button>

                <a
                  href={chefkochSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer no-underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>🔍 Chefkoch Reste-Suche</span>
                </a>

                <button
                  type="button"
                  onClick={autoPlanEntireWeekFromStock}
                  className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>🪄 Ganze Woche planen</span>
                </button>
              </div>
            </div>

            <div className={'p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ' + themeStyles.subtle}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase text-sky-400">🍽️ Ziel-Tag:</span>
                <select
                  value={targetMealDayId}
                  onChange={(e) => setTargetMealDayId(Number(e.target.value))}
                  className={'px-3 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                  <span>🥗+🍊 Mit Salat/Obst aus Vorrat zum Tages-Menü ergänzen</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoSendMissingToShopping}
                    onChange={(e) => setAlsoSendMissingToShopping(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>🛒 Fehlendes auf Einkaufsliste</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all',     label: '⭐ Beste Treffer' },
                { id: 'express', label: '⚡ Express (max. 20 Min.)' },
                { id: 'kids',    label: '👨‍👩‍👧‍👦 Kinder-Lieblinge' },
                { id: 'web',     label: '🌐 Web-Rezepte (' + webRecipes.length + ')' }
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
                  className={'px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ' + (recipeFilter === f.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluatedRecipes.map(rec => (
              <div
                key={rec.id}
                className={'tw-pantry-tile p-4 rounded-3xl border flex flex-col justify-between gap-3.5 shadow-sm ' + themeStyles.card + (rec.urgentCount > 0 ? ' border-amber-400/70' : '')}
              >
                <div className="space-y-2.5">
                  {rec.thumbUrl && (
                    <div className="w-full h-36 rounded-2xl overflow-hidden relative border border-white/10">
                      <img src={rec.thumbUrl} alt={rec.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 text-white text-[10px] font-black">
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
                      <h4 className="font-extrabold text-base leading-snug">{rec.title}</h4>
                    </div>
                    <span className={'px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ' + (rec.matchPercent >= 50 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300')}>
                      {rec.matchPercent}% da
                    </span>
                  </div>

                  {rec.shortDesc && (
                    <p className={'text-xs font-semibold ' + themeStyles.textMuted}>{rec.shortDesc}</p>
                  )}

                  <div className="space-y-1">
                    {rec.ingredientStatus.map((ing, idx) => (
                      <div key={idx} className={'px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs font-bold ' + themeStyles.subtle}>
                        <span>{ing.name}</span>
                        {ing.inPantry ? (
                          <span className="text-emerald-400 font-extrabold">✓ Da ({ing.pantryItem?.name})</span>
                        ) : (
                          <span className="text-amber-400 opacity-80">🛒 Fehlt</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => convertRecipeToDailyMenu(rec)}
                    className="tw-glow-btn w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>🍽️ Als Tages-Menü für {safeMeals.find(m => Number(m.id) === Number(targetMealDayId))?.dayLabel || 'Montag'}</span>
                  </button>
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
        <div className="space-y-3.5">
          <div className={'p-3.5 rounded-3xl border flex flex-wrap items-center justify-between gap-3 ' + themeStyles.card}>
            <div>
              <h3 className="text-base font-extrabold">🗑️ Mülleimer & Verbrauchs-Übersicht</h3>
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
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
              >
                🗑️ Mülleimer komplett leeren
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
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
                    className={'tw-pantry-tile p-3 rounded-2xl border flex flex-col justify-between gap-2 ' + themeStyles.card + (isWasted ? ' border-rose-500/50' : ' border-emerald-500/40')}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getFoodEmoji(tItem.name, tItem.customEmoji)}</span>
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
                        className="tw-glow-btn flex-1 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
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
          BEARBEITEN-FENSTER (MODAL) INKL. KATEGORIE-ZUWEISUNG
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
                    Name, Menge, Lebensmittel-Kategorie, Lagerort oder MHD anpassen
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
                  Menge / Stückzahl
                </label>
                <input
                  type="text"
                  value={editModal.quantity}
                  onChange={(e) => setEditModal({ ...editModal, quantity: e.target.value })}
                  placeholder="z.B. 6.0 pcs, 2x, 250g"
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-purple-300 mb-1">
                Lebensmittel-Kategorie
              </label>
              <select
                value={editModal.category}
                onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                className={'w-full px-3.5 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
              >
                {FOOD_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                    {cat.icon} {cat.title}
                  </option>
                ))}
              </select>
            </div>

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
                    className={'py-2.5 px-2.5 rounded-xl text-xs font-extrabold cursor-pointer ' +
                      (editModal.location === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    {loc.short}
                  </button>
                ))}
              </div>
            </div>

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
                    className={'w-9 h-9 rounded-xl border text-lg flex items-center justify-center cursor-pointer ' +
                      (editModal.customEmoji === em ? 'ring-2 ring-sky-400 bg-sky-500/25' : 'bg-black/25 border-white/10')}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

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
