// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Trash2, Plus, CheckCircle2,
  ShoppingCart, RotateCcw, ChefHat, Pencil, Check, X,
  Table as TableIcon, LayoutGrid, ArrowUpDown, Wand2,
  AlertTriangle, BellRing, Search, SlidersHorizontal, ChevronDown
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
  'Kaufland', 'K-Classic', 'K-Bio', 'K-Favourites', 'K-Purland', 'ja!', 'GUT&GÜNSTIG', 'Gut & Günstig',
  'EDEKA', 'REWE Beste Wahl', 'REWE Bio', 'REWE', 'Milbona', 'Milsani', 'Bellarom',
  'Kania', 'Combino', 'Alnatura', 'dmBio', 'Schär', 'Dr. Schär', 'Seitz', 'Gefro', 'Meggle',
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
    .replace(/\b(Pilze\s*&\s*Waldfrüchte|Uwe\s+Niklas|Fleischwaren|Heiligenstadt|Warenhandel|Nahrungsmittel|Lebensmittel|Molkerei|Privatmolkerei|Käserei|Fleischwerke|Feinkost|Vertriebs|Handels|Werke|Deutschland|International)\b/gi, '')
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
  if (/fleisch|schweinefilet|rinderfilet|filet|lende|hackfleisch|rinderhack|rind|schwein|hähnchen|huhn|pute|geflügel|schnitzel|steak|gulasch|wurst|bratwurst|rostbratwurst|leberwurst|würstchen|wiener|lyoner|salami|schinken|speck|aufschnitt|fisch|lachs|thunfisch|fischstäbchen|forelle|garnele|\bei\b|eier/.test(n)) return 'meat_fish_eggs';
  if (/brot|landbrot|mehrkorn|knusperbrot|brötchen|toast|baguette|croissant|nudel|spaghetti|pasta|penne|rigatoni|tortellini|ravioli|spätzle|reis|rize|spitzenreis|langkorn|basmati|jasmin|milchreis|getreide|haferflocken|müsli|cornflakes|choco balls|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|seitz|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|knödel/.test(n)) return 'grains';
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
  if (/nudel|spaghetti|pasta|penne|rigatoni|reis|rize|basmati|langkorn|mehl|zucker|salz|haferflocken|müsli|cornflakes|choco balls|wraps|wrap|schär|seitz|knusperbrot|backpulver|vanillezucker|kaffee|tee|kakao|schokolade|keks|cookie|chips|nüsse|gefro|chili sin carne|kartoffelpüree|pfanni|tomatenmark|pesto|öl|olivenöl|sonnenblumenöl|essig|senf|ketchup|mayo|burger sauce/.test(n)) {
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

  if (/glutenfrei|gluten-free|ohne gluten|frei von|\bgf\b|schär|schaer|bauckhof|alnavit|hammermühle|seitz|schnitzer|reismehl|maismehl|buchweizen|quinoa|hirse|amarant|polenta|maisstärke|speisestärke|kartoffelmehl|gefro/.test(n)) {
    return true;
  }

  if (/weizen|dinkel|roggen|gerste|grünkern|bulgur|couscous|seitan|paniermehl|paniert|fischstäbchen|nuggets|schnitzel|spätzle|tortellini|ravioli|lasagne|nudel|spaghetti|pasta|penne|rigatoni|mehl|grieß|haferflocken|müsli|cornflakes|brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|kuchen|waffel|keks|cookie|brezel|pizza|flammkuchen|\bbier\b|malz|gnocchi|schupfnudel/.test(n)) {
    return false;
  }

  if (catId === 'produce' || catId === 'dairy' || catId === 'oils_fats' || catId === 'drinks' || catId === 'meat_fish_eggs') {
    return true;
  }

  if (/reis|rize|spitzenreis|langkorn|basmati|jasmin|milchreis|risotto|kartoffel|kartoffelpüree|pfanni|pommes|kroketten|mais|popcorn/.test(n)) {
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
  if (/mais|knusperbrot/.test(n)) return '🌽';
  if (/pilz|pfifferling|steinpilz|champignon/.test(n)) return '🍄';
  if (/avocado/.test(n)) return '🥑';
  if (/käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta/.test(n)) return '🧀';
  if (/milch|vollmilch|schwarzwaldmilch|landfein|hafermilch|kakao/.test(n)) return '🥛';
  if (/schlagsahne|sahne|joghurt|quark|pudding|schmand|creme/.test(n)) return '🥣';
  if (/\bei\b|eier/.test(n)) return '🥚';
  if (/hähnchen|huhn|pute|geflügel|nuggets/.test(n)) return '🍗';
  if (/hackfleisch|rinderhack|rind|schwein|filet|steak|fleisch|schnitzel|gulasch/.test(n)) return '🥩';
  if (/fisch|lachs|thunfisch|fischstäbchen|forelle/.test(n)) return '🐟';
  if (/nudel|spaghetti|pasta|penne|rigatoni|tortellini|ravioli|spätzle/.test(n)) return '🍝';
  if (/reis|rize|spitzenreis|langkorn|onkelz|basmati|jasmin|milchreis/.test(n)) return '🍚';
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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'expiry' | 'glutenfree' | 'az'
  const [onlyGlutenFree, setOnlyGlutenFree] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Intelligente Popover-Menüs statt mehrerer Leisten
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [showMhdAlertPopover, setShowMhdAlertPopover] = useState(false);
  const [showAddFormModal, setShowAddFormModal] = useState(false);

  // Formular: Neues Produkt
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('fridge');
  const [itemCategory, setItemCategory] = useState('auto');
  const [itemGlutenFree, setItemGlutenFree] = useState('auto');
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

  const mhdWarningGroups = useMemo(() => {
    const finalToday = [];
    const warnTwoDays = [];
    safeStock.forEach(item => {
      if (!item?.expiryDate) return;
      const d = getDaysUntil(item.expiryDate, todayStr);
      if (d === 0) finalToday.push(item);
      else if (d === 1 || d === 2) warnTwoDays.push({ ...item, daysLeft: d });
    });
    return {
      finalToday,
      warnTwoDays,
      totalAlerts: finalToday.length + warnTwoDays.length
    };
  }, [safeStock, todayStr]);

  // 1. Automatischer Mülleimer für abgelaufene Produkte (< todayStr)
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

  // 2. Zweistufiger MHD-Push-Alarm + Todoist-Notfallaufgabe am Ablauftag
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
    setShowAddFormModal(false);
    showToast('In Speisekammer gespeichert', cleanName + ' (MHD: ' + itemExpiry + ')', getFoodEmoji(cleanName));
  };

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

    setShowControlMenu(false);
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
        if (sortMode === 'az') {
          return String(a.name || '').localeCompare(String(b.name || ''), 'de');
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

  const trashStats = useMemo(() => {
    const consumed = safeTrash.filter(x => x.reason === 'consumed').length;
    const wasted = safeTrash.filter(x => x.reason === 'expired' || x.reason === 'wasted').length;
    const total = consumed + wasted;
    const score = total > 0 ? Math.round((consumed / total) * 100) : 100;
    return { consumed, wasted, total, score };
  }, [safeTrash]);

  // ============================================================================
  // PUNKT 2: GROSSE PRODUKTTEXTE & GROSSE ICONS OHNE GLOW-EFFEKT (NUR ORANGE/ROT)
  // ============================================================================
  const renderCategoryGroupCard = (group) => {
    const hasOverallNewest = latestOverallItem && group.items.some(it => it.id === latestOverallItem.id);

    return (
      <div
        key={group.id}
        className={'rounded-3xl border overflow-hidden shadow-md flex flex-col ' + themeStyles.card + ' ' +
          (hasOverallNewest && sortMode === 'newest' ? 'border-sky-400/70' : themeStyles.divider)}
      >
        <div className={'px-4 py-2.5 border-b flex items-center justify-between gap-2 ' + themeStyles.banner + ' ' + themeStyles.divider}>
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span className="w-8 h-8 rounded-xl bg-black/35 border border-white/15 flex items-center justify-center text-lg shrink-0">
              {group.icon}
            </span>
            <h3 className="font-black text-sm sm:text-base truncate">{group.title}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-300 border border-sky-400/30 text-xs font-black shrink-0">
              {group.items.length}
            </span>
            {group.gfCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 text-[11px] font-black shrink-0">
                🌾✓ {group.gfCount} GF
              </span>
            )}
            {hasOverallNewest && sortMode === 'newest' && (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-400/40 text-[10px] font-black shrink-0">
                📲 Zuletzt gescannt
              </span>
            )}
          </div>
        </div>

        {viewMode === 'table' ? (
          /* KOMPAKTE LISTENANSICHT MIT GROSSEN ICONS & GROSSER SCHRIFT (OHNE GLOW) */
          <div className="p-2 space-y-1.5">
            {group.items.map((item, idx) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isLatestOverall = latestOverallItem && item.id === latestOverallItem.id;
              const isGf = Boolean(item.resolvedGlutenFree);

              // Ruhige, klare Einfärbung in Rot oder Orange OHNE Glow-Effekt!
              const rowColorClass = isUrgentRed
                ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-50'
                : isWarningOrange
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-50'
                : isLatestOverall && sortMode === 'newest'
                ? 'border-2 border-sky-400/80 bg-sky-500/10'
                : 'border ' + themeStyles.subtle;

              const daysText = daysLeft <= 0 ? '🚨 HEUTE!' : daysLeft === 1 ? '1 Tag' : (daysLeft + ' T.');

              return (
                <div
                  key={item.id}
                  onClick={() => openEditProductModal(item)}
                  className={'flex items-center justify-between gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors hover:bg-white/5 ' + rowColorClass}
                >
                  {/* LINKS: GROSSES PRODUKT-ICON + GROSSER PRODUKTNAME */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                      {emojiIcon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isLatestOverall && sortMode === 'newest' && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500 text-white text-[9px] font-black shrink-0">
                            NEU
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleItemGlutenFreeDirectly(e, item)}
                          className={'px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 cursor-pointer ' +
                            (isGf
                              ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                              : 'bg-white/5 border border-white/10 text-slate-400 opacity-60 hover:opacity-100')}
                        >
                          {isGf ? '🌾✓ GF' : '🌾?'}
                        </button>
                        <span className="text-xs font-bold opacity-75 truncate">
                          {locObj.short}
                        </span>
                      </div>

                      <div title={item.name} className="font-black text-sm sm:text-base leading-snug truncate mt-0.5">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  {/* MITTE: MENGE & MHD-DATUM */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-black/45 border border-amber-400/40 text-xs sm:text-sm font-black text-amber-300">
                      {item.quantity}
                    </span>

                    <div
                      className={'px-3 py-1 rounded-xl border text-xs sm:text-sm font-black whitespace-nowrap ' +
                        (isUrgentRed
                          ? 'bg-rose-600 text-white border-rose-300'
                          : isWarningOrange
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-black/35 border-white/15 text-emerald-400')}
                    >
                      <span>{item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}</span>
                      <span className="mx-1 opacity-60">•</span>
                      <span>{daysText}</span>
                    </div>
                  </div>

                  {/* RECHTS: AKTIONEN */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleConsumeClick(item)}
                      className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditProductModal(item)}
                      className="tw-nav-inactive p-2 rounded-xl text-sky-300 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        addShoppingItem(item.name);
                        showToast('Auf Einkaufsliste', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                      }}
                      className="tw-nav-inactive p-2 rounded-xl text-amber-300 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* KACHEL-ANSICHT MIT DEUTLICH GRÖSSEREN ICONS & GRÖSSEREM PRODUKTTEXT (OHNE GLOW) */
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {group.items.map((item) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isLatestOverall = latestOverallItem && item.id === latestOverallItem.id;
              const isGf = Boolean(item.resolvedGlutenFree);

              // Klare Einfärbung Orange / Rot OHNE Glow-Effekt
              const cardColorClass = isUrgentRed
                ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-50'
                : isWarningOrange
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-50'
                : isLatestOverall && sortMode === 'newest'
                ? 'border-2 border-sky-400/80 bg-sky-500/10'
                : 'border ' + themeStyles.subtle;

              return (
                <div
                  key={item.id}
                  onClick={() => openEditProductModal(item)}
                  className={'p-3.5 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-colors hover:bg-white/5 ' + cardColorClass}
                >
                  <div className="flex items-start gap-3">
                    {/* GROSSES PRODUKT-ICON (w-13 h-13 text-3xl) */}
                    <span className="w-13 h-13 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {emojiIcon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-extrabold opacity-80 truncate">
                          {isLatestOverall && sortMode === 'newest' ? '📲 ZULETZT ERFASST' : locObj.short}
                        </span>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => toggleItemGlutenFreeDirectly(e, item)}
                            className={'px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer ' +
                              (isGf ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300' : 'bg-white/5 text-slate-400')}
                          >
                            {isGf ? '🌾✓ GF' : '🌾?'}
                          </button>
                          <span className="px-2 py-0.5 rounded-md bg-black/50 border border-amber-400/35 text-xs font-black text-amber-300">
                            {item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* GROSSER PRODUKTNAME (text-base font-black) */}
                      <h4 title={item.name} className="font-black text-base leading-snug line-clamp-2 break-words">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <span
                      className={'px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black ' +
                        (isUrgentRed
                          ? 'bg-rose-600 text-white'
                          : isWarningOrange
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-emerald-400')}
                    >
                      {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)} • {daysLeft <= 0 ? '🚨 HEUTE!' : (daysLeft + 'T')}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleConsumeClick(item)}
                        className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer"
                      >
                        {decPreview.remaining > 0 ? '🍽️ -1' : '🍽️ Weg'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditProductModal(item)}
                        className="tw-nav-inactive p-2 rounded-xl text-sky-300 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
    <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-x-hidden">
      {/* ============================================================================
          PUNKT 1: EINE EINZIGE INTELLIGENTE HAUPTLEISTE MIT DIREKT-SUCHE & MENÜS
         ============================================================================ */}
      <div className={'relative z-30 px-3.5 py-2.5 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-2 ' + themeStyles.card}>
        {/* LINKS: SUB-TABS (BESTAND / REZEPTE / MÜLLEIMER) + KOMPAKTES MHD-WARN-POPOVER */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('stock')}
            className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Package className="w-4 h-4" />
            <span>🥫 Bestand ({safeStock.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recipes')}
            className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'recipes' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <ChefHat className="w-4 h-4" />
            <span>🍽️ Rezepte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('trash')}
            className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' + (activeSubTab === 'trash' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑️ ({safeTrash.length})</span>
          </button>

          {/* KOMPAKTES MHD-WARN-BADGE IN DER LEISTE STATT EIGENER RIESIGER ZEILE */}
          {mhdWarningGroups.totalAlerts > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowMhdAlertPopover(prev => !prev);
                  setShowControlMenu(false);
                }}
                className={
                  'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border ' +
                  (mhdWarningGroups.finalToday.length > 0
                    ? 'bg-rose-600 text-white border-rose-300'
                    : 'bg-amber-500 text-slate-950 border-amber-300')
                }
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {mhdWarningGroups.finalToday.length > 0
                    ? ('🚨 ' + mhdWarningGroups.finalToday.length + ' läuft HEUTE ab!')
                    : ('⚠️ ' + mhdWarningGroups.warnTwoDays.length + ' MHD-Warnung')}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMhdAlertPopover && (
                <div className={'absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border-2 border-rose-500 p-4 shadow-2xl space-y-3 z-50 ' + themeStyles.modal}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-rose-400">
                      🔔 Kritische MHD-Produkte
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMhdAlertPopover(false)}
                      className="text-xs font-black opacity-70 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>

                  {mhdWarningGroups.finalToday.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-rose-500/25 border border-rose-500 space-y-1.5">
                      <div className="text-[11px] font-black text-rose-200">
                        🚨 Läuft HEUTE ab (morgen im Mülleimer):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mhdWarningGroups.finalToday.map(it => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => {
                              setShowMhdAlertPopover(false);
                              openEditProductModal(it);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-black/50 border border-rose-400/50 text-xs font-black text-white"
                          >
                            {getFoodEmoji(it.name, it.customEmoji)} {it.name} ({it.quantity})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mhdWarningGroups.warnTwoDays.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500 space-y-1.5">
                      <div className="text-[11px] font-black text-amber-200">
                        ⚠️ Noch 1–2 Tage haltbar:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mhdWarningGroups.warnTwoDays.map(it => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => {
                              setShowMhdAlertPopover(false);
                              openEditProductModal(it);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-black/45 border border-amber-400/50 text-xs font-black text-white"
                          >
                            {getFoodEmoji(it.name, it.customEmoji)} {it.name} ({it.daysLeft === 1 ? 'morgen' : 'in 2 T.'})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerMhdWarningsAndTodoistPush(true);
                      setShowMhdAlertPopover(false);
                    }}
                    className="tw-glow-btn w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BellRing className="w-4 h-4 text-amber-300" />
                    <span>📲 Push & Todoist-Warnung jetzt senden</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MITTE: DIREKT-SUCHFELD + LAGERORT-DROPDOWN + KATEGORIE-DROPDOWN */}
        {activeSubTab === 'stock' && (
          <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-2xl">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vorrat durchsuchen..."
                className={'w-full h-9 pl-9 pr-7 rounded-xl border text-xs sm:text-sm font-extrabold ' + themeStyles.input}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black opacity-75 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={'h-9 px-2.5 rounded-xl border text-xs font-extrabold cursor-pointer ' + themeStyles.input}
            >
              <option value="all" className="bg-slate-800 text-white">🏠 Alle Orte ({safeStock.length})</option>
              {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">
                  {loc.label} ({safeStock.filter(x => x.location === loc.id).length})
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={'h-9 px-2.5 rounded-xl border text-xs font-extrabold cursor-pointer hidden md:block ' + themeStyles.input}
            >
              <option value="all" className="bg-slate-800 text-white">🍱 Alle 7 Kategorien</option>
              {FOOD_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                  {cat.icon} {cat.title.split(',')[0]} ({safeStock.filter(it => detectFoodCategory(it.name, it.category) === cat.id).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* RECHTS: INTELLIGENTES FILTER-/ANSICHTS-MENÜ + "+ EINBUCHEN"-BUTTON */}
        <div className="flex items-center gap-1.5 relative">
          {activeSubTab === 'stock' && (
            <>
              <button
                type="button"
                onClick={() => setOnlyGlutenFree(prev => !prev)}
                className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all ' +
                  (onlyGlutenFree
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40')}
              >
                <span>🌾✓ GF ({totalGlutenFreeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowControlMenu(prev => !prev);
                  setShowMhdAlertPopover(false);
                }}
                className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' +
                  (showControlMenu ? 'tw-active-nav' : 'tw-glow-btn')}
              >
                <SlidersHorizontal className="w-4 h-4 text-sky-300" />
                <span>Ansicht & Menü</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowAddFormModal(true)}
            className="tw-active-nav px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Einbuchen</span>
          </button>

          {/* AUFKLAPPBARES INTELLIGENTES FILTER-, ANSICHTS- & WERKZEUG-MENÜ */}
          {showControlMenu && (
            <div className={'absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border-2 p-4 shadow-2xl space-y-3.5 z-50 ' + themeStyles.modal}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase text-sky-400">
                  ⚙️ Speisekammer-Steuerung
                </span>
                <button
                  type="button"
                  onClick={() => setShowControlMenu(false)}
                  className="text-xs font-black opacity-75 hover:opacity-100"
                >
                  ✕
                </button>
              </div>

              {/* 1. ANSICHTSMODUS: GROSSE KACHELN ODER KOMPAKTE LISTE */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase opacity-75 block">
                  🖼️ Darstellung wählen:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={'py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ' +
                      (viewMode === 'cards' ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Große Kacheln</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={'py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ' +
                      (viewMode === 'table' ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    <TableIcon className="w-4 h-4" />
                    <span>Kompakte Liste</span>
                  </button>
                </div>
              </div>

              {/* 2. SORTIERUNG */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase opacity-75 block">
                  ↕️ Sortierung:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'newest',     label: '🕒 Neueste oben' },
                    { id: 'expiry',     label: '📅 Nach MHD' },
                    { id: 'glutenfree', label: '🌾✓ Glutenfrei oben' },
                    { id: 'az',         label: '🔤 Name (A–Z)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortMode(opt.id)}
                      className={'py-2 px-2.5 rounded-xl text-xs font-extrabold text-left cursor-pointer ' +
                        (sortMode === opt.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. KATEGORIE-WAHL FÜR KLEINERE BILDSCHIRME */}
              <div>
                <label className="text-[10px] font-black uppercase opacity-75 block mb-1">
                  🍱 Lebensmittel-Kategorie:
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={'w-full h-10 px-3 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="all" className="bg-slate-800 text-white">🍱 Alle 7 Kategorien ({safeStock.length})</option>
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                      {cat.icon} {cat.title} ({safeStock.filter(it => detectFoodCategory(it.name, it.category) === cat.id).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. WERKZEUGE (NAMEN KÜRZEN & PUSH-WARNUNG) */}
              <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSimplifyAllStockNames}
                  className="tw-glow-btn w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-sky-300" />
                  <span>✨ Alle Produktnamen automatisch kürzen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerMhdWarningsAndTodoistPush(true);
                    setShowControlMenu(false);
                  }}
                  className="tw-glow-btn w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BellRing className="w-4 h-4 text-amber-300" />
                  <span>📲 MHD-Push & Todoist-Warnung prüfen</span>
                </button>
              </div>

              {/* 5. QUOTE & ZULETZT ERFASST INFO */}
              <div className={'p-2.5 rounded-2xl border text-[11px] font-bold space-y-1 ' + themeStyles.subtle}>
                <div className="text-emerald-300">
                  🌱 Nachhaltigkeits-Quote: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} abgelaufen)
                </div>
                {latestOverallItem && (
                  <div
                    onClick={() => {
                      setShowControlMenu(false);
                      openEditProductModal(latestOverallItem);
                    }}
                    className="text-sky-300 truncate cursor-pointer hover:underline"
                  >
                    📲 Zuletzt erfasst: {getFoodEmoji(latestOverallItem.name, latestOverallItem.customEmoji)} {latestOverallItem.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: BESTAND */}
      {activeSubTab === 'stock' && (
        <div className="space-y-3">
          {groupedByCategory.length === 0 ? (
            <div className={'p-8 rounded-3xl border text-center space-y-1 ' + themeStyles.card}>
              <div className="text-3xl">🥫</div>
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

      {/* SUB-TAB 2: REZEPT- & MENÜ-PLANER */}
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
                  <div key={tItem.id} className={'p-3 rounded-2xl border flex flex-col justify-between gap-2 ' + themeStyles.card + (isWasted ? ' border-rose-500/60' : ' border-emerald-500/40')}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl">{getFoodEmoji(tItem.name, tItem.customEmoji)}</span>
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
                        <h4 className="font-black text-sm mt-1 truncate">{tItem.name}</h4>
                        <div className="text-xs opacity-70">{tItem.quantity} • MHD: {tItem.expiryDate}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          addShoppingItem(tItem.name);
                          showToast('Auf Einkaufsliste', tItem.name + ' wird nachgekauft.', '🛒');
                        }}
                        className="tw-glow-btn flex-1 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Nachkaufen
                      </button>
                      <button
                        type="button"
                        onClick={() => restoreFromTrash(tItem)}
                        className="tw-nav-inactive px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
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

      {/* MODAL: NEUES PRODUKT EINBUCHEN */}
      {showAddFormModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleAddProduct} className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-black/35 border border-white/15 flex items-center justify-center text-3xl">
                  {getFoodEmoji(itemName)}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">➕ Produkt in Speisekammer einbuchen</h3>
                  <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                    Namen werden automatisch gekürzt & kategorisiert
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFormModal(false)}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase text-sky-400">Produktname</label>
                  <button
                    type="button"
                    onClick={() => setItemName(simplifyProductName(itemName))}
                    className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>✨ Kürzen</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => handleNameInputWithSmartDefaults(e.target.value)}
                  placeholder="z.B. Wraps / Schär..."
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-amber-400 mb-1">Menge</label>
                <input
                  type="text"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="z.B. 2x / 500g"
                  className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-emerald-400 mb-1">Lagerort</label>
                <select
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">{loc.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-purple-300 mb-1">Kategorie</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-amber-300">
                    ✨ Auto ({FOOD_CATEGORIES.find(c => c.id === detectFoodCategory(itemName))?.title.split(',')[0]})
                  </option>
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">{cat.icon} {cat.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-emerald-400 mb-1">🌾 Glutenfrei</label>
                <select
                  value={itemGlutenFree}
                  onChange={(e) => setItemGlutenFree(e.target.value)}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-emerald-300">
                    🌾 Auto ({isProductGlutenFree(itemName, itemCategory) ? 'GF ✓' : 'Normal'})
                  </option>
                  <option value="yes" className="bg-slate-800 text-emerald-300">🌾✓ Ja, glutenfrei</option>
                  <option value="no" className="bg-slate-800 text-rose-300">🚫 Enthält Gluten</option>
                </select>
              </div>
            </div>

            <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black uppercase text-amber-400">📅 Ablaufdatum (MHD)</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '+3 T.', days: 3 },
                    { label: '+1 Wo.', days: 7 },
                    { label: '+2 Wo.', days: 14 },
                    { label: '+1 Mon.', days: 30 },
                    { label: '+6 Mon. (TK)', days: 180 },
                    { label: '+1 Jahr', days: 365 }
                  ].map(b => (
                    <button
                      key={b.days}
                      type="button"
                      onClick={() => setQuickExpiryDays(b.days)}
                      className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="date"
                required
                min={todayStr}
                value={itemExpiry}
                onChange={(e) => setItemExpiry(e.target.value)}
                className={'w-full px-3.5 py-2 rounded-xl border text-xs font-black ' + themeStyles.input}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddFormModal(false)}
                className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!itemName.trim() || !itemExpiry}
                className="tw-active-nav px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>In Bestand speichern</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BEARBEITEN-MODAL */}
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
