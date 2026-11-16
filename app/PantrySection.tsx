// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Package, Trash2, Plus, CheckCircle2,
  ShoppingCart, RotateCcw, ChefHat, Pencil, Check, X,
  Table as TableIcon, LayoutGrid, Wand2,
  AlertTriangle, BellRing, Search, SlidersHorizontal,
  ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, FolderKanban
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
  { id: 'drinks',         icon: '🧃', title: 'Getränke',                               short: 'Getränke',          desc: 'Wasser, Kaffee, Tee und ungesüßte Säfte.' },
  { id: 'produce',        icon: '🥦', title: 'Obst und Gemüse',                        short: 'Obst & Gemüse',     desc: 'Frisches Obst, Gemüse, Salate, Pilze und Hülsenfrüchte.' },
  { id: 'grains',         icon: '🌾', title: 'Getreide, Getreideprodukte & Kartoffeln', short: 'Getreide & Nudeln', desc: 'Brot, Nudeln, Reis, Flocken und Kartoffeln.' },
  { id: 'dairy',          icon: '🧀', title: 'Milch und Milchprodukte',                short: 'Milch & Käse',      desc: 'Milch, Joghurt, Quark, Sahne und Käse.' },
  { id: 'meat_fish_eggs', icon: '🥩', title: 'Fleisch, Fisch, Wurst und Eier',         short: 'Fleisch & Fisch',   desc: 'Eiweiß- und Nährstofflieferanten.' },
  { id: 'oils_fats',      icon: '🧈', title: 'Öle und Fette (inkl. Würzmittel)',       short: 'Öle & Soßen',       desc: 'Öle, Butter, Kräuterbutter, Essig, Senf und Soßen.' },
  { id: 'sweets_snacks',  icon: '🍫', title: 'Süßwaren, Knabbereien & Tierfutter',     short: 'Snacks & Sonst.',   desc: 'Snacks, Schokolade, Tiernahrung und Sonstiges.' }
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

function incrementItemPieceCount(rawQtyStr) {
  const clean = String(rawQtyStr || '1x').trim();
  const multiMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*([x×])\s*(\d+(?:[.,]\d+)?)\s*(g|ml|kg|l|gr|stk|pcs)(.*)$/i);
  if (multiMatch) {
    const currentCount = Math.round(parseFloat(multiMatch[1].replace(',', '.')));
    const unitWeight = parseFloat(multiMatch[3].replace(',', '.'));
    const unit = multiMatch[4];
    const tail = multiMatch[5] || '';
    const nextCount = currentCount + 1;
    const nextTotal = Math.round(nextCount * unitWeight * 100) / 100;
    if (tail.includes('=')) return nextCount + ' x ' + unitWeight + ' ' + unit + ' = ' + nextTotal + ' ' + unit;
    if (tail.includes('(')) return nextCount + ' x ' + unitWeight + unit + ' (' + nextTotal + unit + ')';
    return nextCount + 'x ' + unitWeight + unit;
  }

  const pieceMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(x|pcs|pc|stk|stück|pkg|pack|pck|dosen|dose|flaschen|fl|gläser|glas|becher|rollen|rolle)?$/i);
  if (pieceMatch) {
    const val = parseFloat(pieceMatch[1].replace(',', '.'));
    const rawUnit = pieceMatch[2] || 'x';
    const hasSpace = /^\d+(?:[.,]\d+)?\s+/.test(clean);
    const nextVal = Math.round(val + 1);
    return String(nextVal) + (hasSpace ? ' ' : '') + rawUnit;
  }
  return '2x (' + clean + ')';
}

export function getDaysUntil(expiryDateStr, todayStr) {
  if (!expiryDateStr) return 999;
  const exp = new Date(expiryDateStr + 'T12:00:00');
  const tod = new Date(todayStr + 'T12:00:00');
  return Math.round((exp.getTime() - tod.getTime()) / 86400000);
}

const PANTRY_NO_SCALE_STYLES = [
  '.tw-pantry-no-scale, .tw-pantry-no-scale *, .tw-pantry-no-scale *:hover, .tw-pantry-no-scale *:active {',
  '  transform: none !important;',
  '  scale: none !important;',
  '}'
].join('\n');

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

  // PUNKT 1: LISTENANSICHT (EXCEL-TABELLE) ALS HAUPTANSICHT!
  // 'table' = Excel-Gesamttabelle | 'grouped' = Kategorien-Listen | 'cards' = Große Kacheln
  const [viewMode, setViewMode] = useState('table');

  // Excel-Spalten-Sortierung (Klick auf Spaltenkopf sortiert auf-/absteigend)
  const [sortField, setSortField] = useState('newest'); // 'newest' | 'name' | 'category' | 'location' | 'glutenfree' | 'quantity' | 'expiry'
  const [sortDir, setSortDir] = useState('asc');

  const [onlyGlutenFree, setOnlyGlutenFree] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showControlMenu, setShowControlMenu] = useState(false);
  const [showMhdAlertPopover, setShowMhdAlertPopover] = useState(false);
  const [showAddFormModal, setShowAddFormModal] = useState(false);

  const [restockPromptItem, setRestockPromptItem] = useState(null);

  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1x');
  const [itemLocation, setItemLocation] = useState('fridge');
  const [itemCategory, setItemCategory] = useState('auto');
  const [itemGlutenFree, setItemGlutenFree] = useState('auto');
  const [itemExpiry, setItemExpiry] = useState('');

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

  // Sortier-Handler beim Klick auf einen Excel-Spaltenkopf
  const handleExcelHeaderSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'newest' || field === 'glutenfree' ? 'desc' : 'asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-35 shrink-0" />;
    }
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  };

  // Rendert Modals per Portal immer exakt mittig auf dem Bildschirm
  const renderCenteredScreenModal = (modalContent) => {
    const wrapper = (
      <div
        style={{
          '--tw-btn-from': themeStyles?.btnFrom || '#0ea5e9',
          '--tw-btn-to': themeStyles?.btnTo || '#4f46e5',
          '--tw-btn-border': themeStyles?.btnBorder || '#38bdf8',
          '--tw-btn-glow': themeStyles?.btnGlow || 'rgba(56, 189, 248, 0.5)',
          '--tw-btn-rest-base': themeStyles?.dark ? '#1e222d' : '#e2e8f0',
          '--tw-btn-rest-text': themeStyles?.dark ? '#e2e8f0' : '#1e293b'
        }}
        className="fixed inset-0 w-screen h-screen z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto select-none"
      >
        {modalContent}
      </div>
    );

    if (typeof document !== 'undefined' && document.body) {
      return createPortal(wrapper, document.body);
    }
    return wrapper;
  };

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

  // Inline-Änderung für Glutenfrei direkt in der Excel-Zelle
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

  // Inline-Änderung für Lagerort direkt in der Excel-Zelle
  const handleInlineLocationChange = (item, newLocationId) => {
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === item.id ? { ...it, location: newLocationId, updatedAt: Date.now() } : it
    ));
    const locObj = STORAGE_LOCATIONS.find(l => l.id === newLocationId);
    showToast('Lagerort geändert', item.name + ' → ' + (locObj?.label || newLocationId), '🏠');
  };

  // Inline-Änderung für Kategorie direkt in der Excel-Zelle
  const handleInlineCategoryChange = (item, newCategoryId) => {
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === item.id ? { ...it, category: newCategoryId, updatedAt: Date.now() } : it
    ));
    const catObj = FOOD_CATEGORIES.find(c => c.id === newCategoryId);
    showToast('Kategorie geändert', item.name + ' → ' + (catObj?.short || newCategoryId), catObj?.icon || '🍱');
  };

  // Inline +1 Mengenerhöhung direkt in der Excel-Zelle
  const handleIncrementClick = (item) => {
    const nextQty = incrementItemPieceCount(item.quantity);
    setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
      it.id === item.id ? { ...it, quantity: nextQty, updatedAt: Date.now() } : it
    ));
    showToast('Bestand erhöht (+1)', item.name + ' → ' + nextQty, getFoodEmoji(item.name, item.customEmoji));
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

  const MoveItemToTrash = (item, reasonType, askForShoppingList = false) => {
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

    if (askForShoppingList) {
      setRestockPromptItem(item);
    } else {
      showToast(
        reasonType === 'consumed' ? 'Komplett verzehrt!' : 'Produkt gelöscht',
        item.name,
        reasonType === 'consumed' ? '🍽️' : '🗑️'
      );
    }
  };

  const handleDeleteFromEditModal = () => {
    const target = safeStock.find(x => x.id === editModal.id);
    if (!target) {
      setEditModal({ ...editModal, open: false });
      return;
    }
    setEditModal({ ...editModal, open: false });
    MoveItemToTrash(target, 'wasted', true);
  };

  const handleConsumeClick = (item) => {
    const result = decrementItemPieceCount(item.quantity);
    if (result.remaining > 0) {
      setPantryItems(prev => (Array.isArray(prev) ? prev : []).map(it =>
        it.id === item.id ? { ...it, quantity: result.nextQtyStr, updatedAt: Date.now() } : it
      ));
      showToast('1 Stück verzehrt!', '„' + item.name + '“ → Restbestand: ' + result.nextQtyStr, getFoodEmoji(item.name, item.customEmoji));
    } else {
      MoveItemToTrash(item, 'consumed', true);
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

  // ============================================================================
  // EXCEL-SORTIER- & FILTER-ENGINE (UNTERSTÜTZT ALLE SPALTEN AUF- & ABSTEIGEND)
  // ============================================================================
  const filteredStock = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dirMultiplier = sortDir === 'asc' ? 1 : -1;

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
        if (sortField === 'name') {
          return String(a.name || '').localeCompare(String(b.name || ''), 'de') * dirMultiplier;
        }
        if (sortField === 'category') {
          const cmp = String(a.resolvedCategory || '').localeCompare(String(b.resolvedCategory || ''), 'de');
          if (cmp !== 0) return cmp * dirMultiplier;
          return String(a.name || '').localeCompare(String(b.name || ''), 'de');
        }
        if (sortField === 'location') {
          const cmp = String(a.location || '').localeCompare(String(b.location || ''), 'de');
          if (cmp !== 0) return cmp * dirMultiplier;
          return String(a.name || '').localeCompare(String(b.name || ''), 'de');
        }
        if (sortField === 'glutenfree') {
          if (a.resolvedGlutenFree !== b.resolvedGlutenFree) {
            return (a.resolvedGlutenFree ? -1 : 1) * (sortDir === 'desc' ? 1 : -1);
          }
          return b.resolvedAddedTs - a.resolvedAddedTs;
        }
        if (sortField === 'quantity') {
          const numA = parseFloat(String(a.quantity || '1').replace(',', '.')) || 1;
          const numB = parseFloat(String(b.quantity || '1').replace(',', '.')) || 1;
          return (numA - numB) * dirMultiplier;
        }
        if (sortField === 'expiry') {
          const cmp = String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'));
          return cmp * dirMultiplier;
        }
        // Standard 'newest' (Zuletzt erfasst)
        return (a.resolvedAddedTs - b.resolvedAddedTs) * (sortDir === 'asc' ? -1 : 1);
      });
  }, [safeStock, locationFilter, categoryFilter, onlyGlutenFree, searchQuery, sortField, sortDir]);

  const groupedByCategory = useMemo(() => {
    const groups = FOOD_CATEGORIES.map(cat => {
      const items = filteredStock.filter(it => it.resolvedCategory === cat.id);
      const newestCategoryTs = items.length > 0 ? Math.max(...items.map(i => i.resolvedAddedTs || 0)) : 0;
      const gfCount = items.filter(i => i.resolvedGlutenFree).length;
      return { ...cat, items, newestCategoryTs, gfCount };
    }).filter(group => categoryFilter === 'all' ? group.items.length > 0 : group.id === categoryFilter);

    if (sortField === 'newest' && categoryFilter === 'all') {
      return [...groups].sort((a, b) => b.newestCategoryTs - a.newestCategoryTs);
    }
    return groups;
  }, [filteredStock, categoryFilter, sortField]);

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
  // HAUPTANSICHT 1: ÜBERSICHTLICHE EXCEL-GESAMTTABELLE MIT SORTIERBAREN SPALTEN
  // ============================================================================
  const renderExcelMasterTable = () => {
    return (
      <div className={'rounded-3xl border-2 overflow-hidden shadow-lg ' + themeStyles.card + ' ' + themeStyles.divider}>
        {/* EXCEL-KOPFZEILE MIT STATUS & SCHNELL-SORTIERUNG */}
        <div className={'px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ' + themeStyles.banner + ' ' + themeStyles.divider}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" />
              <span>📊 Vorrats-Tabelle ({filteredStock.length} Einträge)</span>
            </span>
            <span className="text-xs font-bold opacity-75 hidden sm:inline">
              💡 Tipp: Klicke auf eine Spaltenüberschrift zum Sortieren oder ändere Menge, Ort & Kategorie direkt in der Zeile!
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setSortField('newest'); setSortDir('asc'); }}
              className={'px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ' +
                (sortField === 'newest' ? 'tw-active-nav' : 'tw-nav-inactive')}
            >
              🕒 Zuletzt gescannt oben
            </button>
            <button
              type="button"
              onClick={() => { setSortField('expiry'); setSortDir('asc'); }}
              className={'px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ' +
                (sortField === 'expiry' ? 'tw-active-nav' : 'tw-nav-inactive')}
            >
              📅 Bald ablaufend oben
            </button>
          </div>
        </div>

        {/* EXCEL-DATENTABELLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[980px] text-left">
            <thead>
              <tr className={'border-b-2 text-[11px] font-black uppercase tracking-wider select-none ' + themeStyles.banner + ' ' + themeStyles.divider}>
                <th className="py-3 px-2.5 w-12 text-center border-r border-white/10 opacity-60">#</th>

                <th
                  onClick={() => handleExcelHeaderSort('name')}
                  className="py-3 px-3.5 border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Produkt / Bezeichnung</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                <th
                  onClick={() => handleExcelHeaderSort('category')}
                  className="py-3 px-3 w-48 border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>🍱 Kategorie</span>
                    {renderSortIndicator('category')}
                  </div>
                </th>

                <th
                  onClick={() => handleExcelHeaderSort('location')}
                  className="py-3 px-3 w-40 border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>🏠 Lagerort</span>
                    {renderSortIndicator('location')}
                  </div>
                </th>

                <th
                  onClick={() => handleExcelHeaderSort('glutenfree')}
                  className="py-3 px-2.5 w-24 text-center border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>🌾 GF</span>
                    {renderSortIndicator('glutenfree')}
                  </div>
                </th>

                <th
                  onClick={() => handleExcelHeaderSort('quantity')}
                  className="py-3 px-3 w-44 text-center border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>📦 Menge / Bestand</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>

                <th
                  onClick={() => handleExcelHeaderSort('expiry')}
                  className="py-3 px-3.5 w-52 text-center border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>📅 MHD & Haltbarkeit</span>
                    {renderSortIndicator('expiry')}
                  </div>
                </th>

                <th className="py-3 px-3.5 w-44 text-right">
                  Aktionen
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {filteredStock.map((item, idx) => {
                const daysLeft = getDaysUntil(item.expiryDate, todayStr);
                const isUrgentRed = daysLeft <= 2;
                const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
                const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
                const decPreview = decrementItemPieceCount(item.quantity);
                const isLatestOverall = latestOverallItem && item.id === latestOverallItem.id;
                const isGf = Boolean(item.resolvedGlutenFree);

                // Klare Excel-Zeilenfärbung (Rot bei <= 2 Tagen, Orange bei 3-7 Tagen, sonst dezentes Zebra-Muster)
                const rowBgClass = isUrgentRed
                  ? 'bg-rose-500/25 hover:bg-rose-500/35 text-rose-50'
                  : isWarningOrange
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-50'
                  : isLatestOverall && sortField === 'newest'
                  ? 'bg-sky-500/15 hover:bg-sky-500/25'
                  : (idx % 2 === 0 ? 'bg-black/10 hover:bg-white/[0.06]' : 'bg-white/[0.02] hover:bg-white/[0.06]');

                const daysText =
                  daysLeft <= 0
                    ? '🚨 HEUTE!'
                    : daysLeft === 1
                    ? '⚠️ 1 Tag'
                    : (daysLeft + ' Tage');

                return (
                  <tr
                    key={item.id}
                    onClick={() => openEditProductModal(item)}
                    className={'transition-colors cursor-pointer ' + rowBgClass}
                  >
                    {/* SPALTE 1: EXCEL-ZEILENNUMMER */}
                    <td className="py-2.5 px-2 text-center font-mono text-xs font-bold opacity-55 border-r border-white/10">
                      {idx + 1}
                    </td>

                    {/* SPALTE 2: PRODUKT-ICON + GROSSER PRODUKTNAME */}
                    <td className="py-2 px-3 border-r border-white/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                          {emojiIcon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isLatestOverall && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500 text-white text-[9px] font-black shrink-0">
                                ZULETZT ERFASST
                              </span>
                            )}
                            <span title={item.name} className="font-black text-sm sm:text-base leading-snug truncate">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SPALTE 3: KATEGORIE (DIREKT IN DER ZELLE ÄNDERBAR) */}
                    <td className="py-2 px-2.5 border-r border-white/10" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.resolvedCategory}
                        onChange={(e) => handleInlineCategoryChange(item, e.target.value)}
                        className="w-full h-9 px-2 rounded-xl bg-black/35 border border-white/15 text-xs font-extrabold text-white cursor-pointer focus:outline-none focus:border-sky-400"
                      >
                        {FOOD_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                            {cat.icon} {cat.short}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* SPALTE 4: LAGERORT (DIREKT IN DER ZELLE ÄNDERBAR) */}
                    <td className="py-2 px-2.5 border-r border-white/10" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.location || 'fridge'}
                        onChange={(e) => handleInlineLocationChange(item, e.target.value)}
                        className="w-full h-9 px-2 rounded-xl bg-black/35 border border-white/15 text-xs font-extrabold text-white cursor-pointer focus:outline-none focus:border-sky-400"
                      >
                        {STORAGE_LOCATIONS.filter(l => l.id !== 'all').map(loc => (
                          <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">
                            {loc.short}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* SPALTE 5: GLUTENFREI-STATUS (1-KLICK UMSCHALTBAR) */}
                    <td className="py-2 px-2 text-center border-r border-white/10" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => toggleItemGlutenFreeDirectly(e, item)}
                        className={'px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ' +
                          (isGf
                            ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-300'
                            : 'bg-white/5 border border-white/10 text-slate-400 opacity-65 hover:opacity-100')}
                      >
                        {isGf ? '🌾✓ GF' : 'Normal'}
                      </button>
                    </td>

                    {/* SPALTE 6: MENGE MIT DIREKTEN - / + BUTTONS IN DER ZELLE */}
                    <td className="py-2 px-2.5 text-center border-r border-white/10" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-between gap-1 bg-black/45 border border-amber-400/35 rounded-xl p-0.5 w-full max-w-[155px]">
                        <button
                          type="button"
                          onClick={() => handleConsumeClick(item)}
                          title="1 Stück abziehen / verbrauchen"
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/40 text-white font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
                        >
                          -
                        </button>
                        <span
                          onClick={() => openEditProductModal(item)}
                          className="px-1.5 text-xs sm:text-sm font-black text-amber-300 truncate cursor-pointer"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementClick(item)}
                          title="Bestand um 1 erhöhen"
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-emerald-500/40 text-white font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* SPALTE 7: MHD-DATUM & RESTTAGE-AMPEL */}
                    <td className="py-2 px-3 text-center border-r border-white/10">
                      <div
                        className={'inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-black whitespace-nowrap ' +
                          (isUrgentRed
                            ? 'bg-rose-600 text-white border-rose-300'
                            : isWarningOrange
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-black/35 border-white/15 text-emerald-400')}
                      >
                        <span className="font-mono">
                          {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(0, 4)}
                        </span>
                        <span className="opacity-60">•</span>
                        <span>{daysText}</span>
                      </div>
                    </td>

                    {/* SPALTE 8: SCHNELL-AKTIONEN */}
                    <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConsumeClick(item)}
                          className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditProductModal(item)}
                          title="Produktdetails bearbeiten"
                          className="tw-nav-inactive p-2 rounded-xl text-sky-300 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            addShoppingItem(item.name);
                            showToast('Auf Einkaufsliste 🛒', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                          }}
                          title="Auf die Einkaufsliste setzen"
                          className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-300 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // ZUSATZANSICHTEN: NACH KATEGORIEN GRUPPIERT ODER GROSSE KACHELN
  // ============================================================================
  const renderCategoryGroupCard = (group) => {
    const hasOverallNewest = latestOverallItem && group.items.some(it => it.id === latestOverallItem.id);

    return (
      <div
        key={group.id}
        className={'rounded-3xl border overflow-hidden shadow-md flex flex-col ' + themeStyles.card + ' ' +
          (hasOverallNewest && sortField === 'newest' ? 'border-sky-400/70' : themeStyles.divider)}
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
          </div>
        </div>

        {viewMode === 'grouped' ? (
          <div className="p-2 space-y-1.5">
            {group.items.map((item) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isGf = Boolean(item.resolvedGlutenFree);

              const rowColorClass = isUrgentRed
                ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-50'
                : isWarningOrange
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-50'
                : 'border ' + themeStyles.subtle;

              return (
                <div
                  key={item.id}
                  onClick={() => openEditProductModal(item)}
                  className={'flex items-center justify-between gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors hover:bg-white/5 ' + rowColorClass}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-10 h-10 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                      {emojiIcon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isGf && <span className="text-[10px] font-black text-emerald-300">🌾✓ GF</span>}
                        <span className="text-xs font-bold opacity-75">{locObj.short}</span>
                      </div>
                      <div className="font-black text-sm sm:text-base truncate">{item.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-black/45 border border-amber-400/40 text-xs font-black text-amber-300">
                      {item.quantity}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-black/35 border border-white/15 text-xs font-black">
                      {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)} ({daysLeft}T)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleConsumeClick(item); }}
                      className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-xs font-black cursor-pointer"
                    >
                      {decPreview.remaining > 0 ? '-1' : 'Weg'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {group.items.map((item) => {
              const daysLeft = getDaysUntil(item.expiryDate, todayStr);
              const locObj = STORAGE_LOCATIONS.find(l => l.id === item.location) || STORAGE_LOCATIONS[4];
              const isUrgentRed = daysLeft <= 2;
              const isWarningOrange = daysLeft > 2 && daysLeft <= 7;
              const emojiIcon = getFoodEmoji(item.name, item.customEmoji);
              const decPreview = decrementItemPieceCount(item.quantity);
              const isGf = Boolean(item.resolvedGlutenFree);

              const cardColorClass = isUrgentRed
                ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-50'
                : isWarningOrange
                ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-50'
                : 'border ' + themeStyles.subtle;

              return (
                <div
                  key={item.id}
                  onClick={() => openEditProductModal(item)}
                  className={'p-3.5 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-colors hover:bg-white/5 ' + cardColorClass}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-13 h-13 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {emojiIcon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-extrabold opacity-80 truncate">
                          {locObj.short}
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
                      <button
                        type="button"
                        onClick={() => {
                          addShoppingItem(item.name);
                          showToast('Auf Einkaufsliste', item.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                        }}
                        className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-300 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
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
    <div className="tw-pantry-no-scale p-3 sm:p-4 min-h-[calc(100vh-130px)] flex flex-col gap-3">
      <style>{PANTRY_NO_SCALE_STYLES}</style>

      {/* HAUPTLEISTE MIT DIREKT-ANSICHTSUMSCHALTER (EXCEL-LISTE / KATEGORIEN / KACHELN) */}
      <div className={'relative z-40 px-3.5 py-2.5 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-2 ' + themeStyles.card}>
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

          {mhdWarningGroups.totalAlerts > 0 && (
            <div
              className="relative"
              onMouseLeave={() => setShowMhdAlertPopover(false)}
            >
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
                <div className="absolute left-0 top-full pt-2 w-80 sm:w-96 z-50">
                  <div className={'rounded-3xl border-2 border-rose-500 p-4 shadow-2xl space-y-3 ' + themeStyles.modal}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-rose-400">
                        🔔 Kritische MHD-Produkte
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMhdAlertPopover(false)}
                        className="text-xs font-black opacity-70 hover:opacity-100 cursor-pointer"
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
                              className="px-2.5 py-1 rounded-xl bg-black/50 border border-rose-400/50 text-xs font-black text-white cursor-pointer"
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
                              className="px-2.5 py-1 rounded-xl bg-black/45 border border-amber-400/50 text-xs font-black text-white cursor-pointer"
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
                placeholder="Vorrat in Tabelle suchen..."
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
                  {cat.icon} {cat.short} ({safeStock.filter(it => detectFoodCategory(it.name, it.category) === cat.id).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* RECHTS: DIREKT-ANSICHTSWAHL + FILTER-MENÜ + EINBUCHEN */}
        <div className="flex items-center gap-1.5">
          {activeSubTab === 'stock' && (
            <>
              {/* SCHNELL-UMSCHALTER: EXCEL-LISTE (STANDARD) vs. KATEGORIEN vs. KACHELN */}
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={'px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer ' +
                    (viewMode === 'table' ? 'tw-active-nav' : 'opacity-70 hover:opacity-100')}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Excel-Liste</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={'px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer ' +
                    (viewMode === 'grouped' ? 'tw-active-nav' : 'opacity-70 hover:opacity-100')}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Gruppen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={'px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer ' +
                    (viewMode === 'cards' ? 'tw-active-nav' : 'opacity-70 hover:opacity-100')}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kacheln</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOnlyGlutenFree(prev => !prev)}
                className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors ' +
                  (onlyGlutenFree
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40')}
              >
                <span>🌾✓ GF ({totalGlutenFreeCount})</span>
              </button>

              <div
                className="relative"
                onMouseLeave={() => setShowControlMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowControlMenu(prev => !prev);
                    setShowMhdAlertPopover(false);
                  }}
                  className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ' +
                    (showControlMenu ? 'tw-active-nav' : 'tw-glow-btn')}
                >
                  <SlidersHorizontal className="w-4 h-4 text-sky-300" />
                  <span>Menü</span>
                </button>

                {showControlMenu && (
                  <div className="absolute right-0 top-full pt-2 w-80 sm:w-96 z-50">
                    <div className={'rounded-3xl border-2 p-4 shadow-2xl space-y-3.5 ' + themeStyles.modal}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-black uppercase text-sky-400">
                          ⚙️ Speisekammer-Steuerung
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowControlMenu(false)}
                          className="text-xs font-black opacity-75 hover:opacity-100 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase opacity-75 block">
                          🖼️ Darstellung wählen:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={'py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer ' +
                              (viewMode === 'table' ? 'tw-active-nav' : 'tw-nav-inactive')}
                          >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>Excel-Liste</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('grouped')}
                            className={'py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer ' +
                              (viewMode === 'grouped' ? 'tw-active-nav' : 'tw-nav-inactive')}
                          >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Kategorien</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={'py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer ' +
                              (viewMode === 'cards' ? 'tw-active-nav' : 'tw-nav-inactive')}
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Kacheln</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase opacity-75 block">
                          ↕️ Sortierung:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'newest',     label: '🕒 Zuletzt erfasst' },
                            { id: 'expiry',     label: '📅 Nach MHD' },
                            { id: 'name',       label: '🔤 Name (A–Z)' },
                            { id: 'category',   label: '🍱 Nach Kategorie' },
                            { id: 'location',   label: '🏠 Nach Lagerort' },
                            { id: 'glutenfree', label: '🌾✓ Glutenfrei oben' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleExcelHeaderSort(opt.id)}
                              className={'py-2 px-2.5 rounded-xl text-xs font-extrabold text-left cursor-pointer ' +
                                (sortField === opt.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

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
                  </div>
                )}
              </div>
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
        </div>
      </div>

      {/* SUB-TAB 1: BESTAND (STANDARD = EXCEL-GESAMTTABELLE) */}
      {activeSubTab === 'stock' && (
        <div className="space-y-3">
          {filteredStock.length === 0 ? (
            <div className={'p-8 rounded-3xl border text-center space-y-1 ' + themeStyles.card}>
              <div className="text-3xl">🥫</div>
              <div className="font-extrabold text-sm">Keine Lebensmittel in dieser Auswahl</div>
            </div>
          ) : viewMode === 'table' ? (
            renderExcelMasterTable()
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

      {/* SUB-TAB 3: MÜLLEIMER INKL. GELBEM EINKAUFSWAGEN-BUTTON */}
      {activeSubTab === 'trash' && (
        <div className="space-y-3.5">
          <div className={'p-3.5 rounded-3xl border flex flex-wrap items-center justify-between gap-3 ' + themeStyles.card}>
            <div>
              <h3 className="text-base font-extrabold">🗑️ Mülleimer & Verbrauchs-Übersicht</h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Klicke auf den gelben Einkaufswagen 🛒, um ein verbrauchtes Produkt direkt wieder auf die Einkaufsliste zu setzen.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                    className={'p-3.5 rounded-2xl border flex flex-col justify-between gap-3 ' + themeStyles.card + (isWasted ? ' border-rose-500/60' : ' border-emerald-500/40')}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                        {getFoodEmoji(tItem.name, tItem.customEmoji)}
                      </span>
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
                        <h4 className="font-black text-base mt-1 leading-snug break-words">{tItem.name}</h4>
                        <div className="text-xs opacity-70 mt-0.5">{tItem.quantity} • MHD: {tItem.expiryDate}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          addShoppingItem(tItem.name);
                          showToast('Auf Einkaufsliste 🛒', '„' + tItem.name + '“ wurde wieder zur Einkaufsliste hinzugefügt!', '🛒');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                        <span>Zur Einkaufsliste</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => restoreFromTrash(tItem)}
                        title="Zurück in den Vorrats-Bestand legen"
                        className="tw-nav-inactive p-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PORTAL-MODAL 1: NACHFRAGE BEIM VERBRAUCHEN (IMMER EXAKT MITTIG AUF DEM SCREEN!) */}
      {restockPromptItem && renderCenteredScreenModal(
        <div
          onClick={(e) => e.stopPropagation()}
          className={'w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl space-y-5 text-center my-auto ' + themeStyles.modal}
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-4xl mx-auto shadow-inner">
            {getFoodEmoji(restockPromptItem.name, restockPromptItem.customEmoji)}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
              🍽️ Produkt verbraucht
            </div>
            <h3 className="text-xl font-black leading-snug">
              {restockPromptItem.name}
            </h3>
            <p className="text-sm font-bold opacity-85 pt-1">
              Soll dieses Produkt wieder auf die Einkaufsliste aufgenommen werden?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const name = restockPromptItem.name;
                setRestockPromptItem(null);
                showToast('Verbraucht', '„' + name + '“ liegt jetzt im Mülleimer.', '🍽️');
              }}
              className="tw-nav-inactive py-3.5 px-4 rounded-2xl text-sm font-black cursor-pointer"
            >
              Nein
            </button>

            <button
              type="button"
              onClick={() => {
                const name = restockPromptItem.name;
                addShoppingItem(name);
                setRestockPromptItem(null);
                showToast('Auf Einkaufsliste! 🛒', '„' + name + '“ wurde zur Einkaufsliste hinzugefügt.', '🛒');
              }}
              className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              <span>Ja, Einkaufsliste</span>
            </button>
          </div>
        </div>
      )}

      {/* PORTAL-MODAL 2: NEUES PRODUKT EINBUCHEN */}
      {showAddFormModal && renderCenteredScreenModal(
        <form
          onSubmit={handleAddProduct}
          onClick={(e) => e.stopPropagation()}
          className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}
        >
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
      )}

      {/* PORTAL-MODAL 3: PRODUKT BEARBEITEN */}
      {editModal.open && renderCenteredScreenModal(
        <form
          onSubmit={handleAcceptEditModal}
          onClick={(e) => e.stopPropagation()}
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
      )}
    </div>
  );
}
