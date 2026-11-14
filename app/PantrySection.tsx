// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Trash2, Plus, CheckCircle2,
  ShoppingCart, RotateCcw, ChefHat, Pencil, Check, X,
  Table as TableIcon, LayoutGrid, ArrowUpDown, Wand2,
  AlertTriangle, BellRing, Search
} from 'lucide-react';
import * as Cfg from './touchwallConfig';
import PantryRecipes from './PantryRecipes';

const {
  formatDateStr,
  addDays,
  createTodoistTaskItem,
  playTouchwallAlarmSound
} = Cfg;

// ============================================================================
// ERWEITERTE LAGERORTE (INKL. VORRATSSCHRANK & TIERFUTTER)
// ============================================================================
export const STORAGE_LOCATIONS = [
  { id: 'all',      label: '🏠 Alle Orte',       short: '🏠 Alle' },
  { id: 'fridge',   label: '🧊 Kühlschrank',     short: '🧊 Kühl.' },
  { id: 'freezer',  label: '❄️ Gefrierschrank',  short: '❄️ TK' },
  { id: 'cupboard', label: '🚪 Vorratsschrank',  short: '🚪 Schrank' },
  { id: 'pantry',   label: '🗄️ Keller / Vorrat', short: '🗄️ Keller' },
  { id: 'kitchen',  label: '🍎 Küche',           short: '🍎 Küche' },
  { id: 'petfood',  label: '🐾 Tierfutter',      short: '🐾 Tierfutter' }
];

export const FOOD_CATEGORIES = [
  { id: 'drinks',         icon: '🧃', title: 'Getränke',                               desc: 'Wasser, Kaffee, Tee und ungesüßte Säfte.' },
  { id: 'produce',        icon: '🥦', title: 'Obst und Gemüse',                        desc: 'Frisches Obst, Gemüse, Salate, Pilze und Hülsenfrüchte.' },
  { id: 'grains',         icon: '🌾', title: 'Getreide, Getreideprodukte & Kartoffeln', desc: 'Brot, Nudeln, Reis, Flocken und Kartoffeln.' },
  { id: 'dairy',          icon: '🧀', title: 'Milch und Milchprodukte',                desc: 'Milch, Joghurt, Quark, Sahne und Käse.' },
  { id: 'meat_fish_eggs', icon: '🥩', title: 'Fleisch, Fisch, Wurst und Eier',         desc: 'Eiweiß- und Nährstofflieferanten.' },
  { id: 'oils_fats',      icon: '🧈', title: 'Öle und Fette (inkl. Würzmittel)',       desc: 'Öle, Butter, Kräuterbutter, Essig, Senf und Soßen.' },
  { id: 'sweets_snacks',  icon: '🍫', title: 'Süßwaren, Knabbereien & Tierfutter',     desc: 'Snacks, Schokolade, Tiernahrung und Sonstiges.' }
];

const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🐶',
  '🐾', '🦴', '🐱', '🐴'
];

const KNOWN_BRAND_PREFIXES = [
  'K-Classic', 'K-Bio', 'K-Favourites', 'ja!', 'GUT&GÜNSTIG', 'Gut & Günstig',
  'EDEKA', 'REWE Beste Wahl', 'REWE Bio', 'REWE', 'Milbona', 'Milsani', 'Bellarom',
  'Kania', 'Combino', 'Alnatura', 'dmBio', 'Schär', 'Dr. Schär', 'Gefro', 'Meggle',
  'Philadelphia', 'Thomy', 'Heinz', 'Hengstenberg', 'Pfanni', 'Barilla', 'Dr. Oetker',
  'Iglo', 'Frosta', 'Landfein', 'Schwarzwaldmilch', 'Weihenstephan', 'Bärenmarke',
  'Kerrygold', 'Oro di Parma', 'Alnavit', 'Bauckhof', 'Müller', 'Ehrmann', 'Zott',
  'Danone', 'Arla', 'Exquisa', 'miree', 'Rama', 'Lätta', 'Bonduelle', 'Kühne',
  'Knorr', 'Maggi', 'Löwensenf', 'Ernte Krone', 'mysmile', 'Die süße Susi',
  'Rinti', 'Wolfsblut', 'Josera', 'Belcando', 'Animonda', 'Premiere', 'Pedigree'
];

// ============================================================================
// INTELLIGENTE NAMENS-OPTIMIERUNG ("Pfifferlinge TK / Bayer.")
// ============================================================================
export function shortenBrandString(rawBrand) {
  if (!rawBrand) return '';
  let b = String(rawBrand).split(',')[0].trim();

  b = b
    .replace(/\b(GmbH\s*&\s*Co\.?\s*KG|GmbH\s*&\s*Co\.?\s*OHG|GmbH|AG|KG|OHG|SE|mbH|e\.?\s*G\.?|Inc\.?|Ltd\.?|S\.?p\.?A\.?|S\.?A\.?)\b/gi, '')
    .replace(/\b(Pilze\s*&\s*Waldfrüchte|Uwe\s+Niklas|Warenhandel|Nahrungsmittel|Lebensmittel|Molkerei|Privatmolkerei|Käserei|Fleischwerke|Feinkost|Vertriebs|Handels|Werke|Deutschland|International)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!b) return '';

  const multiBrandMatch = KNOWN_BRAND_PREFIXES.find(
    kb => b.toLowerCase() === kb.toLowerCase() || b.toLowerCase().startsWith(kb.toLowerCase() + ' ')
  );
  if (multiBrandMatch) return multiBrandMatch;

  const tokens = b.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';
  if (tokens[0].toLowerCase() === 'dr.' && tokens[1]) {
    return tokens[0] + ' ' + tokens[1];
  }
  return tokens[0].replace(/^[,;-]+|[,;-]+$/g, '');
}

export function simplifyProductName(rawInputName, explicitBrand = '') {
  let raw = String(rawInputName || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  let extractedBrand = explicitBrand ? shortenBrandString(explicitBrand) : '';
  let productPart = raw;

  if (productPart.includes(' / ')) {
    const parts = productPart.split(' / ');
    productPart = parts[0].trim();
    if (!extractedBrand && parts[1]) {
      extractedBrand = shortenBrandString(parts[1]);
    }
  }

  if (explicitBrand) {
    const cleanExp = String(explicitBrand).split(',')[0].trim();
    if (cleanExp && productPart.toLowerCase().startsWith(cleanExp.toLowerCase())) {
      productPart = productPart.slice(cleanExp.length).trim();
    }
  }

  const legalSplitRegex = /^(.*?)\b(?:GmbH\s*&\s*Co\.?\s*KG|GmbH\s*&\s*Co\.?\s*OHG|GmbH|AG|KG|OHG|SE|mbH|e\.?\s*G\.?)\.?\s+(.+)$/i;
  const legalMatch = productPart.match(legalSplitRegex);
  if (legalMatch) {
    const companyLeft = legalMatch[1].trim();
    const itemRight = legalMatch[2].trim();
    if (itemRight.length >= 2) {
      if (!extractedBrand) extractedBrand = shortenBrandString(companyLeft);
      productPart = itemRight;
    }
  }

  for (const kb of KNOWN_BRAND_PREFIXES) {
    const reg = new RegExp('^' + kb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b\\s*', 'i');
    if (reg.test(productPart)) {
      const rest = productPart.replace(reg, '').trim();
      if (rest.length >= 2) {
        if (!extractedBrand) extractedBrand = kb;
        productPart = rest;
        break;
      }
    }
  }

  productPart = productPart
    .replace(/\b(tiefgekühlt|tiefgefroren|tiefkühlkost|tiefkühl)\b/gi, 'TK')
    .replace(/\b(delikatess|das komplette|flow pack de|unter schutzatmosphäre|servierfertig|küchenfertig|erntefrisch|feinste|klassische)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,;.\-/]+|[,;.\-/]+$/g, '')
    .trim();

  if (!productPart) productPart = raw;
  productPart = productPart.charAt(0).toUpperCase() + productPart.slice(1);

  if (extractedBrand && !productPart.toLowerCase().includes(extractedBrand.toLowerCase())) {
    return productPart + ' / ' + extractedBrand;
  }
  return productPart;
}

// ============================================================================
// INTELLIGENTE KATEGORIE- & LAGERORT-ERKENNUNG (INKL. VORRATSSCHRANK & TIERFUTTER)
// ============================================================================
export function detectFoodCategory(nameStr, customCategory = '') {
  if (customCategory && customCategory !== 'auto' && FOOD_CATEGORIES.some(c => c.id === customCategory)) {
    return customCategory;
  }
  const n = String(nameStr || '').toLowerCase();
  if (/hundefutter|katzenfutter|tierfutter|pferdefutter|futter|leckerli|kauknochen|pansen|rinti|wolfsblut|josera|belcando|animonda|pedigree|whiskas|felix/.test(n)) return 'sweets_snacks';
  if (/pilz|pfifferling|steinpilz|champignon|kräuterseitling|waldfrüchte|obst|apfel|äpfel|elstar|apfelmus|banane|clementine|mandarine|orange|susi|beere|erdbeer|himbeer|heidelbeer|traube|birne|zitrone|limette|kiwi|mango|ananas|melone|gemüse|salat|eisberg|mâche|mache|feldsalat|rucola|spinat|gurke|tomate|tomatenmark|passierte|oro di parma|paprika|karotte|möhre|zwiebel|knoblauch|brokkoli|blumenkohl|spargel|stangenspargel|rotkohl|kraut|avocado|mais|erbse|bohne|linse|kichererbse|chili sin carne|gefro/.test(n)) return 'produce';
  if (/butter|kräuterbutter|meggle|margarine|öl|sonnenblumenöl|olivenöl|rapsöl|kokosöl|fett|schmalz|essig|hengstenberg|senf|thomy|ketchup|mayo|mayonnaise|dressing|burger sauce|heinz|soße|sauce|pesto/.test(n)) return 'oils_fats';
  if (/wasser|mineralwasser|kaffee|espresso|tee|saft|apfelsaft|orangensaft|schorle|cola|limo|getränk|sirup|kakao|\bbier\b|\bwein\b/.test(n)) return 'drinks';
  if (/milch|vollmilch|schwarzwaldmilch|landfein|joghurt|quark|käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta|schlagsahne|sahne|schmand|creme fraiche|mascarpone|ayran|kefir/.test(n)) return 'dairy';
  if (/fleisch|hackfleisch|rinderhack|rind|schwein|hähnchen|huhn|pute|geflügel|schnitzel|steak|gulasch|wurst|bratwurst|rostbratwurst|leberwurst|würstchen|wiener|lyoner|salami|schinken|speck|aufschnitt|fisch|lachs|thunfisch|fischstäbchen|forelle|garnele|\bei\b|eier/.test(n)) return 'meat_fish_eggs';
  if (/brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|nudel|spaghetti|pasta|penne|rigatoni|tortellini|ravioli|spätzle|reis|spitzenreis|langkorn|basmati|jasmin|milchreis|getreide|haferflocken|müsli|cornflakes|choco balls|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|knödel/.test(n)) return 'grains';
  if (/schokolade|choco|schoko|nutella|keks|cookie|gummibär|chips|flips|eis|bonbon|praline|zuckerware/.test(n)) return 'sweets_snacks';
  return 'sweets_snacks';
}

export function detectSmartLocation(nameStr, categoryId = '') {
  const n = String(nameStr || '').toLowerCase();
  if (/hundefutter|katzenfutter|tierfutter|pferdefutter|futter|leckerli|kauknochen|pansen|trockenfutter|nassfutter|rinti|wolfsblut|josera|belcando|animonda|pedigree|whiskas|felix/.test(n)) {
    return 'petfood';
  }
  if (/\btk\b|tiefkühl|tiefgekühlt|tiefgefroren|gefrier|eiscreme|speiseeis|fischstäbchen|pommes/.test(n)) {
    return 'freezer';
  }
  if (/nudel|spaghetti|pasta|penne|reis|basmati|langkorn|mehl|zucker|salz|haferflocken|müsli|cornflakes|choco balls|wraps|wrap|schär|backpulver|vanillezucker|kaffee|tee|kakao|schokolade|keks|cookie|chips|nüsse|gefro|chili sin carne|kartoffelpüree|pfanni|tomatenmark|pesto|öl|olivenöl|sonnenblumenöl|essig|senf|ketchup|mayo|burger sauce/.test(n)) {
    return 'cupboard';
  }
  if (/konserve|dose|im glas|apfelmus|rotkohl|spargel|stangenspargel|passierte|kartoffel|zwiebel|knoblauch|wasser|mineralwasser|saft|apfelsaft|orangensaft|schorle|cola|limo|\bbier\b|\bwein\b|vorrat|haltbare/.test(n)) {
    return 'pantry';
  }
  const resolvedCat = categoryId || detectFoodCategory(nameStr);
  if (resolvedCat === 'dairy' || resolvedCat === 'meat_fish_eggs') {
    return 'fridge';
  }
  if (/salat|feldsalat|mâche|eisberg|rucola|spinat|gurke|paprika|brokkoli|karotte|möhre|beere|erdbeer|himbeer|heidelbeer|pilz|pfifferling|champignon|butter|kräuterbutter/.test(n)) {
    return 'fridge';
  }
  return 'kitchen';
}

export function isProductGlutenFree(itemOrName, customCategory = '', manualFlag = undefined) {
  const isObj = itemOrName && typeof itemOrName === 'object';
  const nameStr = isObj ? String(itemOrName.name || '') : String(itemOrName || '');
  const catId = isObj ? detectFoodCategory(nameStr, itemOrName.category) : detectFoodCategory(nameStr, customCategory);
  const flag = isObj ? itemOrName.glutenFree : manualFlag;

  if (flag === true || flag === 'yes') return true;
  if (flag === false || flag === 'no') return false;

  const n = nameStr.toLowerCase();
  if (!n.trim()) return false;

  if (/glutenfrei|gluten-free|ohne gluten|\bgf\b|schär|schaer|bauckhof|alnavit|hammermühle|seitz|schnitzer|reismehl|maismehl|buchweizen|quinoa|hirse|amarant|polenta|maisstärke|speisestärke|kartoffelmehl|gefro/.test(n)) {
    return true;
  }

  if (/weizen|dinkel|roggen|gerste|grünkern|bulgur|couscous|seitan|paniermehl|paniert|fischstäbchen|nuggets|schnitzel|spätzle|tortellini|ravioli|lasagne|nudel|spaghetti|pasta|penne|rigatoni|mehl|grieß|haferflocken|müsli|cornflakes|brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|kuchen|waffel|keks|cookie|brezel|pizza|flammkuchen|\bbier\b|malz|gnocchi|schupfnudel/.test(n)) {
    return false;
  }

  if (catId === 'produce' || catId === 'dairy' || catId === 'oils_fats' || catId === 'drinks' || catId === 'meat_fish_eggs') {
    return true;
  }

  if (/reis|spitzenreis|langkorn|basmati|jasmin|milchreis|risotto|kartoffel|kartoffelpüree|pfanni|pommes|kroketten|mais|popcorn/.test(n)) {
    return true;
  }

  return false;
}

export function getFoodEmoji(nameStr, customEmoji = '') {
  if (customEmoji && String(customEmoji).trim() !== '') return String(customEmoji).trim();
  const n = String(nameStr || '').toLowerCase();
  if (/kauknochen|knochen/.test(n)) return '🦴';
  if (/katzenfutter|katze|whiskas|felix/.test(n)) return '🐱';
  if (/pferdefutter|pony|hafer|heu/.test(n)) return '🐴';
  if (/hunde|tierfutter|futter|leckerli|pansen|rinti|wolfsblut|josera|belcando|animonda|pedigree/.test(n)) return '🐶';
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
  if (/pilz|pfifferling|steinpilz|champignon/.test(n)) return '🍄';
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

function getItemAddedTimestamp(item) {
  if (!item) return 0;
  if (item.addedTimestamp && Number(item.addedTimestamp) > 0) return Number(item.addedTimestamp);
  const idMatch = String(item.id || '').match(/^p_(\d{10,15})/);
  if (idMatch) return Number(idMatch[1]);
  if (item.updatedAt && Number(item.updatedAt) > 0) return Number(item.updatedAt);
  return 0;
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
      if (tail.includes('=')) return { remaining: nextCount, nextQtyStr: nextCount + ' x ' + unitWeight + ' ' + unit + ' = ' + nextTotal + ' ' + unit };
      if (tail.includes('(')) return { remaining: nextCount, nextQtyStr: nextCount + ' x ' + unitWeight + unit + ' (' + nextTotal + unit + ')' };
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
      return { remaining: nextVal, nextQtyStr: formattedNum + (hasSpace ? ' ' : '') + rawUnit };
    }
    return { remaining: 0, nextQtyStr: '0' };
  }
  return { remaining: 0, nextQtyStr: '0' };
}

export function getDaysUntil(expiryDateStr, todayStr) {
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
  const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'expiry' | 'glutenfree'
  const [onlyGlutenFree, setOnlyGlutenFree] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Formular: Neues Produkt
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('fridge');
  const [itemCategory, setItemCategory] = useState('auto');
  const [itemGlutenFree, setItemGlutenFree] = useState('auto'); // 'auto' | 'yes' | 'no'
  const [itemExpiry, setItemExpiry] = useState('');

  // Komfort-Bearbeitungs-Modal
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    name: '',
    quantity: '',
    location: 'fridge',
    category: 'produce',
    glutenFree: 'auto',
    expiryDate: '',
    customEmoji: ''
  });

  const safeStock = useMemo(() => Array.isArray(pantryItems) ? pantryItems : [], [pantryItems]);
  const safeTrash = useMemo(() => Array.isArray(pantryTrash) ? pantryTrash : [], [pantryTrash]);
  const safeMeals = useMemo(() => Array.isArray(mealPlan) ? mealPlan : [], [mealPlan]);

  const totalGlutenFreeCount = useMemo(() => {
    return safeStock.filter(it => isProductGlutenFree(it)).length;
  }, [safeStock]);

  // Gruppierung für die 2-stufige MHD-Warnung (Stufe 2: 0 Tage = Heute letzte Warnung | Stufe 1: 1-2 Tage Vorwarnung)
  const mhdWarningGroups = useMemo(() => {
    const finalToday = [];
    const warnTwoDays = [];
    safeStock.forEach(item => {
      if (!item?.expiryDate) return;
      const d = getDaysUntil(item.expiryDate, todayStr);
      if (d === 0) finalToday.push(item);
      else if (d === 1 || d === 2) warnTwoDays.push({ ...item, daysLeft: d });
    });
    return { finalToday, warnTwoDays };
  }, [safeStock, todayStr]);

  // ============================================================================
  // 1. AUTOMATISCHER MÜLLEIMER FÜR BEREITS ABGELAUFENE PRODUKTE (< todayStr)
  // ============================================================================
  useEffect(() => {
    const expiredNow = safeStock.filter(item => item.expiryDate && item.expiryDate < todayStr);
    if (expiredNow.length > 0) {
      const remainingStock = safeStock.filter(item => !item.expiryDate || item.expiryDate >= todayStr);
      const now = Date.now();
      const movedToTrash = expiredNow.map((item, idx) => ({
        ...item,
        trashedAt: todayStr,
        trashedTimestamp: now + idx,
        reason: 'expired',
        reasonLabel: '⚠️ Automatisch abgelaufen am ' + item.expiryDate
      }));
      setPantryItems(remainingStock);
      setPantryTrash(prev => [...movedToTrash, ...(Array.isArray(prev) ? prev : [])]);
      showToast('MHD abgelaufen!', expiredNow.length + ' abgelaufene(s) Produkt(e) in den Mülleimer verschoben.', '🗑️');
    }
  }, [safeStock, todayStr, setPantryItems, setPantryTrash, showToast]);

  // ============================================================================
  // 2. ZWEISTUFIGER MHD-PUSH-ALARM + TODOIST-NOTFALLAUFGABE AM ABLAUFTAG (0 TAGE)
  // ============================================================================
  const triggerMhdWarningsAndTodoistPush = async (forceManual = false) => {
    if (!safeStock || safeStock.length === 0) return;

    let log = {};
    try {
      log = JSON.parse(localStorage.getItem('richter_tw_wall_mhd_push_v1') || '{}') || {};
    } catch (e) {}

    const finalTodayToNotify = [];
    const warnTwoDaysToNotify = [];

    safeStock.forEach(item => {
      if (!item?.expiryDate) return;
      const daysLeft = getDaysUntil(item.expiryDate, todayStr);

      if (daysLeft === 0) {
        const k0 = 'wall_final0d_' + item.id + '_' + todayStr;
        if (forceManual || !log[k0]) {
          finalTodayToNotify.push(item);
          log[k0] = Date.now();
        }
      } else if (daysLeft === 1 || daysLeft === 2) {
        const kw = 'wall_warn_' + daysLeft + 'd_' + item.id + '_' + todayStr;
        if (forceManual || !log[kw]) {
          warnTwoDaysToNotify.push({ ...item, daysLeft });
          log[kw] = Date.now();
        }
      }
    });

    if (finalTodayToNotify.length === 0 && warnTwoDaysToNotify.length === 0) {
      if (forceManual) {
        showToast('MHD-Check ✓', 'Aktuell laufen keine Produkte heute oder in den nächsten 2 Tagen ab.', '🌱');
      }
      return;
    }

    try {
      localStorage.setItem('richter_tw_wall_mhd_push_v1', JSON.stringify(log));
    } catch (e) {}

    // STUFE 2: Tag des Ablaufs (daysLeft === 0) -> Letzte Warnung + Automatische Todoist-Erinnerung aufs Handy!
    if (finalTodayToNotify.length > 0) {
      const names = finalTodayToNotify.map(x => getFoodEmoji(x.name, x.customEmoji) + ' ' + x.name).join(', ');
      try { playTouchwallAlarmSound?.(); } catch (e) {}
      showToast(
        '🚨 LETZTE WARNUNG (Läuft HEUTE ab!)',
        names + ' – heute verbrauchen, sonst wandert es morgen in den Mülleimer!',
        '🚨'
      );

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🚨 LETZTE WARNUNG – Läuft HEUTE ab!', {
            body: names + ' muss heute verbraucht werden (wandert morgen in den Mülleimer)!',
            icon: '/icon-512.png'
          });
        } catch (e) {}
      }

      // Automatische Todoist-Erinnerungsaufgabe erstellen, damit das Handy garantiert klingelt
      try {
        const rawSaved = typeof localStorage !== 'undefined' ? localStorage.getItem('richter_touchwall_v6') : null;
        const parsedSaved = rawSaved ? JSON.parse(rawSaved) : null;
        const tdCfg = parsedSaved?.todoistConfig;
        const firstMember = Array.isArray(parsedSaved?.members)
          ? parsedSaved.members.find(m => m.id !== 'all')
          : null;
        const projId = firstMember?.todoistProjectId || tdCfg?.tasksProjectId || tdCfg?.shoppingProjectId || '';

        if (tdCfg?.apiToken && projId && typeof createTodoistTaskItem === 'function') {
          for (const expItem of finalTodayToNotify) {
            const todoKey = 'todoist_mhd0_' + expItem.id + '_' + todayStr;
            if (!log[todoKey] || forceManual) {
              log[todoKey] = Date.now();
              await createTodoistTaskItem(
                tdCfg.apiToken,
                projId,
                '🚨 HEUTE MHD-Ablauf: ' + expItem.name + ' (' + (expItem.quantity || '1x') + ') verbrauchen!',
                firstMember,
                todayStr,
                '17:00',
                4,
                'Letzte Warnung der Speisekammer: Morgen wandert dieses Produkt automatisch in den Mülleimer.',
                '15m',
                tdCfg.collaborators || [],
                true
              );
            }
          }
          localStorage.setItem('richter_tw_wall_mhd_push_v1', JSON.stringify(log));
        }
      } catch (e) {}
    }

    // STUFE 1: Vorwarnung (1–2 Tage vor Ablauf)
    if (warnTwoDaysToNotify.length > 0) {
      const names = warnTwoDaysToNotify
        .map(x => getFoodEmoji(x.name, x.customEmoji) + ' ' + x.name + ' (' + (x.daysLeft === 1 ? 'morgen' : 'in 2 Tagen') + ')')
        .join(', ');
      if (finalTodayToNotify.length === 0) {
        showToast('⚠️ MHD-Vorwarnung (Noch 1–2 Tage)', names + ' läuft bald ab!', '⚠️');
      }
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('⚠️ MHD-Vorwarnung (Noch 1–2 Tage)', {
            body: names + ' — Bitte zeitnah einplanen & verbrauchen!',
            icon: '/icon-512.png'
          });
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    if (!safeStock || safeStock.length === 0) return;
    const timer = setTimeout(() => {
      triggerMhdWarningsAndTodoistPush(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [safeStock, todayStr]);

  const setQuickExpiryDays = (days) => {
    setItemExpiry(formatDateStr(addDays(new Date(), days)));
  };

  const handleNameInputWithSmartDefaults = (val) => {
    setItemName(val);
    if (val.trim().length >= 3) {
      const smartLoc = detectSmartLocation(val);
      setItemLocation(smartLoc);
      if (smartLoc === 'freezer' && !itemExpiry) {
        setQuickExpiryDays(180);
      }
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const rawName = itemName.trim();
    if (!rawName || !itemExpiry) {
      showToast('Pflichtfelder', 'Bitte Produktname und Ablaufdatum (MHD) eingeben.', '⚠️');
      return;
    }

    const cleanName = simplifyProductName(rawName);
    const now = Date.now();
    const finalCat = itemCategory === 'auto' ? detectFoodCategory(cleanName) : itemCategory;

    const newItem = {
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      quantity: itemQty.trim() || '1x',
      location: itemLocation,
      category: finalCat,
      glutenFree: itemGlutenFree,
      expiryDate: itemExpiry,
      customEmoji: '',
      addedAt: todayStr,
      addedTimestamp: now,
      updatedAt: now
    };

    setPantryItems(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setItemName('');
    setItemQty('1x');
    setItemCategory('auto');
    setItemGlutenFree('auto');
    setItemExpiry('');
    setShowAddForm(false);
    showToast('In Speisekammer gespeichert', cleanName + ' (MHD: ' + itemExpiry + ')', getFoodEmoji(cleanName));
  };

  // 1-Klick-Namensbereinigung für den gesamten vorhandenen Bestand
  const handleSimplifyAllStockNames = () => {
    if (safeStock.length === 0) return;
    const now = Date.now();
    let changedCount = 0;

    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it => {
      const simplified = simplifyProductName(it.name);
      const smartCat = detectFoodCategory(simplified, it.category);
      if (simplified !== it.name) {
        changedCount++;
        return { ...it, name: simplified, category: smartCat, updatedAt: now };
      }
      return it;
    }));

    showToast(
      'Namen optimiert ✨',
      changedCount > 0 ? (changedCount + ' Produktnamen auf „Produkt / Marke“ gekürzt.') : 'Alle Produktnamen sind bereits optimal kurz.',
      '✨'
    );
  };

  const toggleItemGlutenFreeDirectly = (e, item) => {
    e.stopPropagation();
    const currentlyGf = isProductGlutenFree(item);
    const nextGf = currentlyGf ? 'no' : 'yes';
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === item.id ? { ...it, glutenFree: nextGf, updatedAt: Date.now() } : it
    ));
    showToast(
      nextGf === 'yes' ? '🌾✓ Als Glutenfrei markiert' : '🚫 Als glutenhaltig markiert',
      item.name,
      nextGf === 'yes' ? '🌾' : '🥖'
    );
  };

  const openEditProductModal = (item) => {
    const initialGf =
      item.glutenFree === true || item.glutenFree === 'yes'
        ? 'yes'
        : item.glutenFree === false || item.glutenFree === 'no'
        ? 'no'
        : 'auto';

    setEditModal({
      open: true,
      id: item.id,
      name: item.name || '',
      quantity: item.quantity || '1x',
      location: item.location || 'fridge',
      category: detectFoodCategory(item.name, item.category),
      glutenFree: initialGf,
      expiryDate: item.expiryDate || todayStr,
      customEmoji: item.customEmoji || getFoodEmoji(item.name)
    });
  };

  const handleAcceptEditModal = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editModal.name.trim() || !editModal.expiryDate) return;

    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === editModal.id
        ? {
            ...it,
            name: editModal.name.trim(),
            quantity: editModal.quantity.trim() || '1x',
            location: editModal.location,
            category: editModal.category,
            glutenFree: editModal.glutenFree,
            expiryDate: editModal.expiryDate,
            customEmoji: editModal.customEmoji,
            updatedAt: Date.now()
          }
        : it
    ));
    setEditModal({ ...editModal, open: false });
    showToast('Änderungen gespeichert!', editModal.name + ' wurde aktualisiert.', editModal.customEmoji || '✅');
  };

  const MoveItemToTrash = (item, reasonType) => {
    const now = Date.now();
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== item.id));
    const trashEntry = {
      ...item,
      trashedAt: todayStr,
      trashedTimestamp: now,
      reason: reasonType,
      reasonLabel: reasonType === 'consumed' ? '🍽️ Komplett verzehrt am ' + todayStr : '🗑️ Weggeworfen am ' + todayStr
    };
    setPantryTrash(prev => [trashEntry, ...(Array.isArray(prev) ? prev : [])]);
    showToast(reasonType === 'consumed' ? 'Komplett verzehrt!' : 'Produkt gelöscht', item.name, reasonType === 'consumed' ? '🍽️' : '🗑️');
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
      showToast('1 Stück verzehrt!', '„' + item.name + '“ → Restbestand: ' + result.nextQtyStr, getFoodEmoji(item.name, item.customEmoji));
    } else {
      MoveItemToTrash(item, 'consumed');
    }
  };

  const restoreFromTrash = (trashItem) => {
    const newExp = prompt('Neues Ablaufdatum (JJJJ-MM-TT) für ' + trashItem.name + ':', formatDateStr(addDays(new Date(), 7)));
    if (!newExp || !/^\d{4}-\d{2}-\d{2}$/.test(newExp.trim())) return;

    const now = Date.now();
    setPantryTrash(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== trashItem.id));
    setPantryItems(prev => [
      {
        id: 'p_' + now,
        name: trashItem.name,
        quantity: trashItem.quantity || '1x',
        location: trashItem.location || 'pantry',
        category: detectFoodCategory(trashItem.name, trashItem.category),
        glutenFree: trashItem.glutenFree || 'auto',
        expiryDate: newExp.trim(),
        customEmoji: trashItem.customEmoji || '',
        addedAt: todayStr,
        addedTimestamp: now,
        updatedAt: now
      },
      ...(Array.isArray(prev) ? prev : [])
    ]);
    showToast('Wiederhergestellt', trashItem.name + ' ist wieder im Bestand (ganz oben).', '↩️');
  };

  const latestOverallItem = useMemo(() => {
    if (safeStock.length === 0) return null;
    let best = safeStock[0];
    let bestTs = getItemAddedTimestamp(best);
    safeStock.forEach(it => {
      const ts = getItemAddedTimestamp(it);
      if (ts > bestTs) { best = it; bestTs = ts; }
    });
    return best;
  }, [safeStock]);

  const filteredStock = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return safeStock
      .map(it => ({
        ...it,
        resolvedCategory: detectFoodCategory(it.name, it.category),
        resolvedAddedTs: getItemAddedTimestamp(it),
        resolvedGlutenFree: isProductGlutenFree(it)
      }))
      .filter(it => locationFilter === 'all' || it.location === locationFilter)
      .filter(it => categoryFilter === 'all' || it.resolvedCategory === categoryFilter)
      .filter(it => !onlyGlutenFree || it.resolvedGlutenFree)
      .filter(it => !q || String(it.name || '').toLowerCase().includes(q) || String(it.quantity || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortMode === 'glutenfree') {
          if (a.resolvedGlutenFree !== b.resolvedGlutenFree) return a.resolvedGlutenFree ? -1 : 1;
          return b.resolvedAddedTs - a.resolvedAddedTs;
        }
        if (sortMode === 'newest') return b.resolvedAddedTs - a.resolvedAddedTs;
        return String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'));
      });
  }, [safeStock, locationFilter, categoryFilter, onlyGlutenFree, searchQuery, sortMode]);

  const groupedByCategory = useMemo(() => {
    const groups = FOOD_CATEGORIES.map(cat => {
      const items = filteredStock.filter(it => it.resolvedCategory === cat.id);
      const newestCategoryTs = items.length > 0 ? Math.max(...items.map(i => i.resolvedAddedTs || 0)) : 0;
      const gfCount = items.filter(i => i.resolvedGlutenFree).length;
      return { ...cat, items, newestCategoryTs, gfCount };
    }).filter(group => categoryFilter === 'all' ? group.items.length > 0 : group.id === categoryFilter);

    if (sortMode === 'newest' && categoryFilter === 'all') {
      return [...groups].sort((a, b) => b.newestCategoryTs - a.newestCategoryTs);
    }
    return groups;
  }, [filteredStock, categoryFilter, sortMode]);

  const balancedCategoryColumns = useMemo(() => {
    const leftCol = [];
    const rightCol = [];
    let leftWeight = 0;
    let rightWeight = 0;
    groupedByCategory.forEach(group => {
      const boxWeight = 2 + group.items.length;
      if (leftWeight <= rightWeight) { leftCol.push(group); leftWeight += boxWeight; }
      else { rightCol.push(group); rightWeight += boxWeight; }
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

  const cycleSortMode = () => {
    setSortMode(prev => prev === 'newest' ? 'expiry' : prev === 'expiry' ? 'glutenfree' : 'newest');
  };

  const pantryAnimationStyles = [
    '@keyframes twPulseOrangeMhd { 0%, 100% { border-color: rgba(251, 146, 60, 0.85); box-shadow: inset 0 0 8px rgba(245, 158, 11, 0.2), 0 0 8px rgba(245, 158, 11, 0.3); } 50% { border-color: #fbbf24; box-shadow: inset 0 0 16px rgba(245, 158, 11, 0.4), 0 0 18px rgba(245, 158, 11, 0.75); } }',
    '@keyframes twPulseRedMhd { 0%, 100% { border-color: rgba(244, 63, 94, 0.9); box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.25), 0 0 10px rgba(244, 63, 94, 0.4); } 50% { border-color: #ff2a55; box-shadow: inset 0 0 20px rgba(244, 63, 94, 0.5), 0 0 22px rgba(244, 63, 94, 0.9); } }',
    '.tw-pantry-tile { transition: box-shadow 0.16s ease, border-color 0.16s ease, background-color 0.16s ease; }',
    '.tw-pantry-tile:hover { border-color: var(--tw-btn-border, #38bdf8) !important; box-shadow: 0 0 15px var(--tw-btn-glow, rgba(56, 189, 248, 0.65)), inset 0 0 10px rgba(56, 189, 248, 0.18) !important; }',
    '.tw-pantry-row { transition: box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease; }',
    '.tw-pantry-row:hover { background-color: rgba(56, 189, 248, 0.12) !important; border-color: var(--tw-btn-border, #38bdf8) !important; box-shadow: 0 0 14px var(--tw-btn-glow, rgba(56, 189, 248, 0.55)), inset 0 0 10px rgba(56, 189, 248, 0.2) !important; }',
    '.tw-pantry-warn-orange { animation: twPulseOrangeMhd 2.2s infinite ease-in-out; border-color: rgba(251, 146, 60, 0.85) !important; }',
    '.tw-pantry-urgent-red { animation: twPulseRedMhd 1.35s infinite ease-in-out; border-color: rgba(244, 63, 94, 0.9) !important; }'
  ].join('\n');

  const renderCategoryGroupCard = (group) => {
    const hasOverallNewest = latestOverallItem && group.items.some(it => it.id === latestOverallItem.id);

    return (
      <div
        key={group.id}
        className={'rounded-2xl border overflow-hidden shadow-md flex flex-col ' + themeStyles.card + ' ' +
          (hasOverallNewest && sortMode === 'newest' ? 'border-sky-400/70' : themeStyles.divider)}
      >
        <div className={'px-3 py-2 border-b flex items-center justify-between gap-2 ' + themeStyles.banner + ' ' + themeStyles.divider}>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="w-7 h-7 rounded-lg bg-black/30 border border-white/15 flex items-center justify-center text-base shrink-0">
              {group.icon}
            </span>
            <h3 className="font-black text-xs sm:text-sm truncate">{group.title}</h3>
            <span className="px-2 py-0.2 rounded-full bg-sky-500/25 text-sky-300 border border-sky-400/30 text-[10px] font-black shrink-0">
              {group.items.length}
            </span>
            {group.gfCount > 0 && (
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 text-[9px] font-black shrink-0">
                🌾✓ {group.gfCount} GF
              </span>
            )}
            {hasOverallNewest && sortMode === 'newest' && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-400/40 text-[9px] font-black shrink-0">
                📲 Zuletzt gescannt
              </span>
            )}
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="p-1.5 space-y-1">
            <div className="grid grid-cols-12 items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-60">
              <div className="col-span-5">Produkt & Glutenfrei-Status</div>
              <div className="col-span-2 text-center">Menge & Ort</div>
              <div className="col-span-3 text-center">MHD & Verfallstag</div>
              <div className="col-span-2 text-right">Aktion</div>
            </div>

            {group.items.map((item, idx) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isLatestOverall = latestOverallItem && item.id === latestOverallItem.id;
              const isTopInCategory = sortMode === 'newest' && idx === 0;
              const isGf = Boolean(item.resolvedGlutenFree);

              const rowGlowClass = isUrgentRed
                ? ' tw-pantry-urgent-red bg-rose-950/30'
                : isWarningOrange
                ? ' tw-pantry-warn-orange bg-amber-950/25'
                : isLatestOverall && sortMode === 'newest'
                ? ' border-sky-400/80 bg-sky-500/10'
                : themeStyles.subtle;

              const daysText = daysLeft <= 0 ? '🚨 HEUTE!' : daysLeft === 1 ? '⚠️ 1 Tag' : daysLeft === 2 ? '⚠️ 2 T.' : (daysLeft + ' T.');

              return (
                <div key={item.id} className={'tw-pantry-row grid grid-cols-12 items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ' + rowGlowClass}>
                  <div onClick={() => openEditProductModal(item)} className="col-span-5 flex items-center gap-2 min-w-0 cursor-pointer">
                    <span className="w-7 h-7 rounded-lg bg-black/35 border border-white/10 flex items-center justify-center text-base shrink-0">
                      {emojiIcon}
                    </span>
                    <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                      {isLatestOverall && sortMode === 'newest' ? (
                        <span className="px-1.5 py-0.2 rounded bg-sky-500 text-white text-[8px] font-black shrink-0">
                          {item.fromMobile ? '📲 ZULETZT ERFASST' : '🆕 NEU'}
                        </span>
                      ) : isTopInCategory ? (
                        <span className="px-1 py-0.2 rounded bg-white/10 text-sky-300 text-[8px] font-black shrink-0">
                          NEU
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => toggleItemGlutenFreeDirectly(e, item)}
                        title={isGf ? 'Glutenfrei (Antippen zum Umschalten)' : 'Enthält Gluten / Unbekannt (Antippen für Glutenfrei)'}
                        className={'px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 cursor-pointer ' +
                          (isGf
                            ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                            : 'bg-white/5 border border-white/10 text-slate-400 opacity-55 hover:opacity-100')}
                      >
                        {isGf ? '🌾✓ GF' : '🌾?'}
                      </button>

                      <span title={item.name} className="font-extrabold text-xs leading-tight truncate hover:text-sky-300">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  <div onClick={() => openEditProductModal(item)} className="col-span-2 flex items-center justify-center gap-1 cursor-pointer min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-amber-400/30 text-[10px] font-black text-amber-300 truncate">
                      {item.quantity}
                    </span>
                    <span className="text-[10px] font-bold opacity-75 hidden sm:inline truncate">
                      {locObj.short}
                    </span>
                  </div>

                  <div onClick={() => openEditProductModal(item)} className="col-span-3 flex items-center justify-center cursor-pointer">
                    <div
                      className={'px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs sm:text-[13px] font-black whitespace-nowrap ' +
                        (isUrgentRed ? 'bg-rose-500/30 border-rose-400 text-rose-100' : isWarningOrange ? 'bg-amber-500/30 border-amber-400 text-amber-100' : 'bg-black/25 border-white/10')}
                    >
                      <span>{item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}</span>
                      <span className="opacity-50">•</span>
                      <span className={isUrgentRed ? 'text-rose-300' : isWarningOrange ? 'text-amber-300' : 'text-emerald-400'}>
                        {daysText}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleConsumeClick(item)}
                      className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditProductModal(item)}
                      className="tw-nav-inactive p-1.5 rounded-lg text-sky-300 cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
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
          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {group.items.map((item, idx) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isLatestOverall = latestOverallItem && item.id === latestOverallItem.id;
              const isGf = Boolean(item.resolvedGlutenFree);

              const glowClass = isUrgentRed
                ? ' tw-pantry-urgent-red bg-rose-950/25'
                : isWarningOrange
                ? ' tw-pantry-warn-orange bg-amber-950/20'
                : isLatestOverall && sortMode === 'newest'
                ? ' border-sky-400/80 bg-sky-500/10'
                : themeStyles.subtle;

              return (
                <div key={item.id} className={'tw-pantry-tile p-2.5 rounded-2xl border flex flex-col justify-between gap-2 ' + glowClass}>
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
                        <span className="text-[9px] font-bold opacity-75 truncate">
                          {isLatestOverall && sortMode === 'newest' ? '📲 ZULETZT ERFASST' : idx === 0 && sortMode === 'newest' ? '🆕 NEU • ' + locObj.short : locObj.short}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleItemGlutenFreeDirectly(e, item)}
                            className={'px-1.5 py-0.2 rounded text-[9px] font-black cursor-pointer ' +
                              (isGf ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300' : 'bg-white/5 text-slate-400')}
                          >
                            {isGf ? '🌾✓ GF' : '🌾?'}
                          </button>
                          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-black text-amber-300">
                            {item.quantity}
                          </span>
                        </div>
                      </div>
                      <h4 onClick={() => openEditProductModal(item)} title={item.name} className="font-extrabold text-xs leading-tight truncate mt-0.5 cursor-pointer hover:text-sky-300">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
                    <span onClick={() => openEditProductModal(item)} className={'text-xs font-black cursor-pointer ' + (isUrgentRed ? 'text-rose-300' : isWarningOrange ? 'text-amber-300' : 'text-emerald-400')}>
                      {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)} • {daysLeft <= 0 ? '🚨 HEUTE!' : (daysLeft + 'T')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleConsumeClick(item)} className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer">
                        {decPreview.remaining > 0 ? '🍽️ -1' : '🍽️ Weg'}
                      </button>
                      <button type="button" onClick={() => openEditProductModal(item)} className="tw-nav-inactive p-1 rounded-lg text-sky-300 cursor-pointer">
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
  };

  return (
    <div className="p-3 sm:p-4 flex flex-col gap-2.5 overflow-x-hidden">
      <style>{pantryAnimationStyles}</style>

      {/* KOPFLEISTE MIT LAGERORTEN (INKL. VORRATSSCHRANK & TIERFUTTER), GLUTENFREI-FILTER & SORTIERUNG */}
      <div className={'px-3.5 py-2.5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-2 ' + themeStyles.card}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base sm:text-lg font-black">🥫 Speisekammer</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold">
            🌱 Quote: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} abgelaufen)
          </span>

          <button
            type="button"
            onClick={() => setOnlyGlutenFree(prev => !prev)}
            className={'px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ' +
              (onlyGlutenFree
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/25')}
          >
            <span>🌾✓ Nur Glutenfrei ({totalGlutenFreeCount})</span>
          </button>

          {latestOverallItem && (
            <button
              type="button"
              onClick={() => openEditProductModal(latestOverallItem)}
              className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <span>📲 Zuletzt: {getFoodEmoji(latestOverallItem.name, latestOverallItem.customEmoji)} {latestOverallItem.name}</span>
            </button>
          )}

          <div className="flex items-center gap-1 flex-wrap ml-1">
            {STORAGE_LOCATIONS.map(loc => {
              const locCount = loc.id === 'all' ? safeStock.length : safeStock.filter(x => x.location === loc.id).length;
              return (
                <button
                  key={loc.id}
                  onClick={() => setLocationFilter(loc.id)}
                  className={'px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer flex items-center gap-1 ' + (locationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  <span>{loc.short}</span>
                  {loc.id !== 'all' && locCount > 0 && (
                    <span className="opacity-75">({locCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {activeSubTab === 'stock' && (
            <>
              <button
                type="button"
                onClick={handleSimplifyAllStockNames}
                title="Alle vorhandenen Produktnamen auf 'Produkt / Marke' kürzen"
                className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-sky-300" />
                <span>✨ Namen kürzen</span>
              </button>

              <button
                type="button"
                onClick={cycleSortMode}
                className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-sky-300" />
                <span>
                  {sortMode === 'newest' ? '🕒 Neueste oben' : sortMode === 'expiry' ? '📅 Nach MHD' : '🌾✓ Glutenfrei oben'}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => { setActiveSubTab('stock'); setShowAddForm(prev => !prev); }}
            className={'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer ' + (showAddForm ? 'tw-active-nav' : 'tw-glow-btn')}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Einbuchen</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stock')}
            className={'px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ' + (activeSubTab === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Bestand ({safeStock.length})</span>
            {expiringSoonItems.length > 0 && (
              <span className={'px-1.5 py-0.2 rounded-full text-[9px] font-black ' + (mhdWarningGroups.finalToday.length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950')}>
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
                className={'px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer ' + (viewMode === 'table' ? 'tw-active-nav' : 'opacity-70')}
              >
                <TableIcon className="w-3 h-3" />
                <span>Tabelle</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={'px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer ' + (viewMode === 'cards' ? 'tw-active-nav' : 'opacity-70')}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Kacheln</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ZWEISTUFIGES MHD-WARN-BANNER (HEUTE LETZTE WARNUNG & 1-2 TAGE VORWARNUNG) */}
      {activeSubTab === 'stock' && (mhdWarningGroups.finalToday.length > 0 || mhdWarningGroups.warnTwoDays.length > 0) && (
        <div className="px-4 py-3 rounded-2xl border-2 border-rose-500/80 bg-rose-950/35 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1.5 flex-1 min-w-[260px]">
            {mhdWarningGroups.finalToday.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>🚨 LETZTE WARNUNG (Läuft HEUTE ab – morgen im Mülleimer!):</span>
                </span>
                {mhdWarningGroups.finalToday.map(it => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => openEditProductModal(it)}
                    className="px-2.5 py-0.5 rounded-lg bg-black/50 border border-rose-400/60 text-xs font-extrabold text-rose-100 hover:border-white cursor-pointer"
                  >
                    {getFoodEmoji(it.name, it.customEmoji)} {it.name} ({it.quantity})
                  </button>
                ))}
              </div>
            )}

            {mhdWarningGroups.warnTwoDays.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-black">
                  ⚠️ MHD-Vorwarnung (Noch 1–2 Tage haltbar):
                </span>
                {mhdWarningGroups.warnTwoDays.map(it => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => openEditProductModal(it)}
                    className="px-2.5 py-0.5 rounded-lg bg-black/40 border border-amber-400/40 text-xs font-extrabold text-amber-100 hover:border-white cursor-pointer"
                  >
                    {getFoodEmoji(it.name, it.customEmoji)} {it.name} ({it.daysLeft === 1 ? 'morgen' : 'in 2 T.'})
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => triggerMhdWarningsAndTodoistPush(true)}
            className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-300" />
            <span>📲 Push & Todoist-Warnung senden</span>
          </button>
        </div>
      )}

      {/* SUB-TAB 1: BESTAND */}
      {activeSubTab === 'stock' && (
        <div className="space-y-2.5">
          {showAddForm && (
            <form onSubmit={handleAddProduct} className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.card}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-3 flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-xl bg-black/25 border border-white/10 flex items-center justify-center text-base shrink-0">
                    {getFoodEmoji(itemName)}
                  </span>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => handleNameInputWithSmartDefaults(e.target.value)}
                    placeholder="Produktname (wird automatisch gekürzt)..."
                    className={'w-full px-3 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  />
                </div>

                <input
                  type="text"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Menge (z.B. 2x)"
                  className={'md:col-span-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ' + themeStyles.input}
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
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">{cat.icon} {cat.title}</option>
                  ))}
                </select>

                <select
                  value={itemGlutenFree}
                  onChange={(e) => setItemGlutenFree(e.target.value)}
                  className={'md:col-span-2 px-2.5 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-emerald-300">
                    🌾 Auto ({isProductGlutenFree(itemName, itemCategory) ? 'Glutenfrei ✓' : 'Normal'})
                  </option>
                  <option value="yes" className="bg-slate-800 text-emerald-300">🌾✓ Ja, glutenfrei</option>
                  <option value="no" className="bg-slate-800 text-rose-300">🚫 Enthält Gluten</option>
                </select>

                <select
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  className={'md:col-span-2 px-2 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                    { label: '+3 T.', days: 3 },
                    { label: '+5 T.', days: 5 },
                    { label: '+1 Wo.', days: 7 },
                    { label: '+2 Wo.', days: 14 },
                    { label: '+1 Mon.', days: 30 },
                    { label: '+6 Mon. (TK)', days: 180 },
                    { label: '+1 Jahr', days: 365 }
                  ].map(b => (
                    <button key={b.days} type="button" onClick={() => setQuickExpiryDays(b.days)} className="tw-glow-btn px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer">
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setItemName(simplifyProductName(itemName))}
                    className="tw-glow-btn px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3 text-sky-300" />
                    <span>✨ Name kürzen</span>
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="tw-nav-inactive px-3 py-1 rounded-xl text-xs font-bold cursor-pointer">
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

          {/* KATEGORIEN-LEISTE + DIREKT-SUCHFELD */}
          <div className={'px-3 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ' + themeStyles.card}>
            <div className="flex flex-wrap items-center gap-1.5">
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
                    <span className="px-1.5 py-0.2 rounded-full bg-black/35 text-[9px] font-black text-amber-300">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vorrat durchsuchen..."
                className={'w-full pl-8 pr-7 py-1 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black opacity-70 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

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

      {/* SUB-TAB 2: AUSGELAGERTER REZEPT- & TAGES-MENÜ-PLANER (app/PantryRecipes.tsx) */}
      {activeSubTab === 'recipes' && (
        <PantryRecipes
          safeStock={safeStock}
          safeMeals={safeMeals}
          setMealPlan={setMealPlan}
          addShoppingItem={addShoppingItem}
          todayStr={todayStr}
          themeStyles={themeStyles}
          showToast={showToast}
        />
      )}

      {/* SUB-TAB 3: MÜLLEIMER */}
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
                  showToast('Mülleimer geleert', 'Alle Einträge wurden dauerhaft entfernt.', '🗑️');
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
                  <div key={tItem.id} className={'tw-pantry-tile p-3 rounded-2xl border flex flex-col justify-between gap-2 ' + themeStyles.card + (isWasted ? ' border-rose-500/50' : ' border-emerald-500/40')}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getFoodEmoji(tItem.name, tItem.customEmoji)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={'inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black truncate ' + (isWasted ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-300')}>
                            {tItem.reasonLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPantryTrash(prev => (Array.isArray(prev) ? prev : []).filter(x => x.id !== tItem.id))}
                            className="text-rose-400 hover:text-rose-200 text-xs font-black px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
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

      {/* BEARBEITEN-MODAL INKL. NAMENS-KÜRZER, GLUTENFREI-SCHALTER & ALLEN 6 LAGERORTEN */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleAcceptEditModal} className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-black/35 border border-white/15 flex items-center justify-center text-3xl">
                  {editModal.customEmoji || getFoodEmoji(editModal.name)}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">✏️ Produkt bearbeiten</h3>
                  <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                    Name, Menge, Kategorie, Lagerort, Glutenfrei-Status oder MHD anpassen
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setEditModal({ ...editModal, open: false })} className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase text-sky-400">Produktname</label>
                  <button
                    type="button"
                    onClick={() => {
                      const simplified = simplifyProductName(editModal.name);
                      setEditModal({
                        ...editModal,
                        name: simplified,
                        category: detectFoodCategory(simplified, editModal.category)
                      });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>✨ Auf „Produkt / Marke“ kürzen</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-amber-400 mb-1">Menge / Stück</label>
                <input
                  type="text"
                  value={editModal.quantity}
                  onChange={(e) => setEditModal({ ...editModal, quantity: e.target.value })}
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-purple-300 mb-1">Lebensmittel-Kategorie</label>
                <select
                  value={editModal.category}
                  onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">{cat.icon} {cat.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-emerald-400 mb-1">🌾 Glutenfrei-Markierung</label>
                <select
                  value={editModal.glutenFree}
                  onChange={(e) => setEditModal({ ...editModal, glutenFree: e.target.value })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-sky-300">
                    ✨ Automatisch ({isProductGlutenFree(editModal.name, editModal.category, 'auto') ? 'Glutenfrei ✓' : 'Normal'})
                  </option>
                  <option value="yes" className="bg-slate-800 text-emerald-300">🌾✓ Ja, garantiert glutenfrei</option>
                  <option value="no" className="bg-slate-800 text-rose-300">🚫 Nein, enthält Gluten</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-emerald-400 mb-1.5">Lagerort</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setEditModal({ ...editModal, location: loc.id })}
                    className={'py-2 px-2.5 rounded-xl text-xs font-extrabold cursor-pointer ' + (editModal.location === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black uppercase text-amber-400">📅 Ablaufdatum (MHD)</label>
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
                className={'w-full px-3.5 py-2 rounded-xl border text-xs font-black ' + themeStyles.input}
              />
            </div>

            <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🎨 Emoji wählen</span>
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, customEmoji: getFoodEmoji(editModal.name) })}
                  className="text-[11px] font-extrabold text-sky-400 hover:underline cursor-pointer"
                >
                  🔄 Automatisch
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {FOOD_EMOJI_PICKER.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEditModal({ ...editModal, customEmoji: em })}
                    className={'w-8 h-8 rounded-xl border text-base flex items-center justify-center cursor-pointer ' +
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
                <span>🗑️ Löschen</span>
              </button>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditModal({ ...editModal, open: false })} className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer">
                  Abbrechen
                </button>
                <button type="submit" className="tw-glow-btn px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" />
                  <span>✅ Speichern</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}