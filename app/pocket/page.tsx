// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, CheckSquare, ShoppingCart, Camera, Package,
  RefreshCw, Smartphone, LogOut, Cloud, BellRing, Download,
  WifiOff, Pencil, Check, Search, Menu, X,
  Trash2, Wand2, CheckCircle2, AlertTriangle, SlidersHorizontal, RotateCcw
} from 'lucide-react';

import * as Cfg from '../touchwallConfig';
import {
  PUBLIC_CLOUD_BACKEND_URL,
  hasJsonChanged,
  loadLocalSyncMeta,
  saveLocalSyncMeta,
  mergeSyncMetaMaps,
  mergePantryChannelSafe,
  registerPendingCalendarOp,
  mergeCalendarEventsSafe,
  mergeSkillBoardSafe,
  callCloudApi,
  useTouchwallRealtime
} from '../sync';
import {
  FOOD_CATEGORIES,
  STORAGE_PILLS,
  detectFoodCategory,
  getFoodEmoji,
  decrementItemPieceCount,
  stepMobileQty,
  playMobileBeep
} from '../foodUtils';

import PocketAgenda from './PocketAgenda';
import PocketTasks from './PocketTasks';
import PocketScanner from './PocketScanner';
import PocketShopping from './PocketShopping';

const {
  formatDateStr,
  addDays,
  COLOR_PALETTES,
  DEFAULT_MEMBERS,
  DEFAULT_MEALS,
  DEFAULT_NOTES,
  DEFAULT_SCHOOL,
  buildThemeStyles,
  buildMemberStyles,
  pullFromTodoistTwoWay,
  createTodoistTaskItem,
  closeOrReopenTodoistTask,
  deleteTodoistTask
} = Cfg;

// ============================================================================
// DIREKT INTEGRIERTE HILFSFUNKTIONEN (VERHINDERT JEGLICHEN IMPORT-FEHLER!)
// ============================================================================
const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🐶',
  '🐾', '🦴', '🐱', '🐴'
];

const KNOWN_BRAND_PREFIXES = [
  'Kaufland', 'K-Classic', 'K-Bio', 'K-Favourites', 'K-Purland', 'ja!', 'GUT&GÜNSTIG', 'Gut & Günstig',
  'EDEKA', 'REWE Beste Wahl', 'REWE Bio', 'REWE', 'Wilhelm Brandenburg', 'Mein Metzgergut', 'Landjunker',
  'Milbona', 'Milsani', 'Bellarom', 'Kania', 'Combino', 'Alnatura', 'dmBio', 'Schär', 'Dr. Schär', 'Seitz',
  'Gefro', 'Meggle', 'Philadelphia', 'Thomy', 'Heinz', 'Hengstenberg', 'Pfanni', 'Barilla', 'Dr. Oetker',
  'Iglo', 'Frosta', 'Landfein', 'Schwarzwaldmilch', 'Weihenstephan', 'Bärenmarke', 'Kerrygold',
  'Oro di Parma', 'Alnavit', 'Bauckhof', 'Müller', 'Ehrmann', 'Zott', 'Danone', 'Arla', 'Exquisa',
  'miree', 'Rama', 'Lätta', 'Bonduelle', 'Kühne', 'Knorr', 'Maggi', 'Löwensenf', 'Ernte Krone',
  'mysmile', 'Die süße Susi', 'Rinti', 'Wolfsblut', 'Josera', 'Belcando', 'Animonda', 'Pedigree'
];

function shortenBrandString(rawBrand) {
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

function simplifyProductName(rawInputName, explicitBrand = '') {
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
    .replace(/\b(delikatess|das komplette|flow pack de|unter schutzatmosphäre|servierfertig|küchenfertig|erntefrisch|feinste|klassische|fleischwaren|heiligenstadt)\b/gi, '')
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

function detectSmartCategory(nameStr, customCategory = '', offTags = []) {
  if (customCategory && customCategory !== 'auto' && FOOD_CATEGORIES.some(c => c.id === customCategory)) {
    return customCategory;
  }
  const n = String(nameStr || '').toLowerCase();
  const tags = Array.isArray(offTags) ? offTags.join(' ').toLowerCase() : '';

  if (/hundefutter|katzenfutter|tierfutter|pferdefutter|futter|leckerli|kauknochen|pansen|rinti|wolfsblut|josera|belcando|animonda|pedigree|whiskas|felix/.test(n)) {
    return 'sweets_snacks';
  }
  if (/pilz|pfifferling|steinpilz|champignon|kräuterseitling|waldfrüchte|beeren|erdbeer|himbeer|heidelbeer|blaubeer|apfel|äpfel|apfelmus|apfelmark|banane|orange|clementine|mandarine|zitrone|limette|melone|ananas|mango|kiwi|traube|birne|avocado|salat|eisberg|feldsalat|mâche|rucola|spinat|gurke|tomate|tomatenmark|oro di parma|paprika|karotte|möhre|zwiebel|knoblauch|brokkoli|blumenkohl|spargel|rotkohl|sauerkraut|mais|erbse|bohne|linse|kichererbse|chili sin carne|gefro/.test(n)) {
    return 'produce';
  }
  if (/butter|kräuterbutter|meggle|margarine|öl|sonnenblumenöl|olivenöl|rapsöl|kokosöl|fett|schmalz|essig|balsamico|hengstenberg|senf|thomy|ketchup|mayo|mayonnaise|remoulade|dressing|burger sauce|heinz|soße|sauce|pesto|brühe|fond/.test(n)) {
    return 'oils_fats';
  }
  if (/wasser|mineralwasser|kaffee|espresso|tee|saft|apfelsaft|orangensaft|schorle|cola|limo|getränk|sirup|kakao|\bbier\b|\bwein\b|energydrink|hafermilch|mandelmilch|oatly|alpro/.test(n)) {
    return 'drinks';
  }
  if (/milch|vollmilch|weidemilch|alpenmilch|schwarzwaldmilch|landfein|joghurt|quark|skyr|käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta|hirtenkäse|schlagsahne|kochsahne|sahne|schmand|creme fraiche|crème fraîche|mascarpone|ayran|kefir|pudding/.test(n)) {
    return 'dairy';
  }
  if (/fleisch|schweinefilet|rinderfilet|filet|lende|hackfleisch|rinderhack|rind|schwein|hähnchen|huhn|pute|geflügel|schnitzel|steak|gulasch|wurst|bratwurst|rostbratwurst|leberwurst|würstchen|wiener|lyoner|salami|schinken|speck|bacon|aufschnitt|fisch|lachs|kabeljau|seelachs|thunfisch|fischstäbchen|forelle|garnele|\bei\b|eier/.test(n)) {
    return 'meat_fish_eggs';
  }
  if (/brot|landbrot|mehrkorn|knusperbrot|brötchen|toast|baguette|croissant|knäckebrot|reiswaffel|nudel|spaghetti|pasta|penne|fusilli|rigatoni|tortellini|ravioli|spätzle|reis|rize|spitzenreis|langkorn|basmati|jasmin|milchreis|risotto|getreide|haferflocken|müsli|cornflakes|choco balls|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|seitz|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|kroketten|knödel/.test(n)) {
    return 'grains';
  }
  if (/schokolade|choco|schoko|nutella|haselnusscreme|konfitüre|marmelade|honig|keks|cookie|gummibär|haribo|chips|flips|eis|bonbon|praline|zuckerware|riegel/.test(n)) {
    return 'sweets_snacks';
  }

  if (/fruits|vegetables|mushrooms|plant-based-foods-and-beverages|salads|legumes/.test(tags)) return 'produce';
  if (/dairies|cheeses|milks|yogurts|creams/.test(tags)) return 'dairy';
  if (/meats|poultries|fishes|seafood|sausages|eggs/.test(tags)) return 'meat_fish_eggs';
  if (/cereals|breads|pastas|potatoes|flours|tortillas/.test(tags)) return 'grains';
  if (/fats|oils|sauces|condiments|vinegars|mustards/.test(tags)) return 'oils_fats';
  if (/beverages|waters|juices|coffees|teas/.test(tags)) return 'drinks';

  return detectFoodCategory(nameStr);
}

function detectSmartLocation(nameStr, categoryId = '', offTags = []) {
  const n = String(nameStr || '').toLowerCase();
  const tags = Array.isArray(offTags) ? offTags.join(' ').toLowerCase() : '';

  if (/hundefutter|katzenfutter|tierfutter|pferdefutter|futter|leckerli|kauknochen|pansen|trockenfutter|nassfutter|rinti|wolfsblut|josera|belcando|animonda|pedigree|whiskas|felix/.test(n)) {
    return 'petfood';
  }
  if (/\btk\b|tiefkühl|tiefgekühlt|tiefgefroren|gefrier|eiscreme|speiseeis|fischstäbchen|pommes|kroketten|rahmspinat/.test(n) || /frozen/.test(tags)) {
    return 'freezer';
  }
  if (/nudel|spaghetti|pasta|penne|fusilli|rigatoni|reis|rize|basmati|langkorn|mehl|zucker|salz|haferflocken|müsli|cornflakes|choco balls|wraps|wrap|schär|seitz|knusperbrot|knäckebrot|reiswaffel|backpulver|vanillezucker|kaffee|espresso|tee|kakao|schokolade|nutella|honig|konfitüre|keks|cookie|chips|haribo|nüsse|gefro|chili sin carne|kartoffelpüree|pfanni|tomatenmark|pesto|öl|olivenöl|sonnenblumenöl|rapsöl|essig|balsamico|senf|ketchup|mayo|burger sauce|brühe/.test(n)) {
    return 'cupboard';
  }
  if (/konserve|dose|im glas|apfelmus|apfelmark|rotkohl|sauerkraut|spargel|passierte|gehackte tomaten|mais|kichererbsen|bohnen|linsen|kartoffel|zwiebel|knoblauch|haltbare|mineralwasser|saft|schorle|cola|limo|\bbier\b|\bwein\b/.test(n)) {
    return 'pantry';
  }
  const resolvedCat = categoryId || detectSmartCategory(nameStr, '', offTags);
  if (resolvedCat === 'dairy' || resolvedCat === 'meat_fish_eggs') {
    return 'fridge';
  }
  if (/salat|feldsalat|mâche|eisberg|rucola|spinat|gurke|paprika|brokkoli|karotte|möhre|beere|erdbeer|himbeer|heidelbeer|pilz|pfifferling|champignon|butter|kräuterbutter|frisch/.test(n)) {
    return 'fridge';
  }
  return 'kitchen';
}

function isProductGlutenFree(itemOrName, customCategory = '', manualFlag = undefined, offAllergens = [], offLabels = []) {
  const isObj = itemOrName && typeof itemOrName === 'object';
  const nameStr = isObj ? String(itemOrName.name || '') : String(itemOrName || '');
  const catId = isObj
    ? detectSmartCategory(nameStr, itemOrName.category)
    : detectSmartCategory(nameStr, customCategory);
  const flag = isObj ? itemOrName.glutenFree : manualFlag;

  if (flag === true || flag === 'yes') return true;
  if (flag === false || flag === 'no') return false;

  const labelsStr = Array.isArray(offLabels) ? offLabels.join(' ').toLowerCase() : '';
  const allergensStr = Array.isArray(offAllergens) ? offAllergens.join(' ').toLowerCase() : '';

  if (/no-gluten|gluten-free|glutenfrei/.test(labelsStr)) return true;
  if (/en:gluten|de:gluten/.test(allergensStr)) return false;

  const n = nameStr.toLowerCase();
  if (!n.trim()) return false;

  if (/glutenfrei|gluten-free|ohne gluten|frei von|\bgf\b|schär|schaer|bauckhof|alnavit|hammermühle|seitz|schnitzer|reismehl|maismehl|buchweizen|quinoa|hirse|amarant|polenta|maisstärke|speisestärke|kartoffelmehl|reiswaffel|gefro/.test(n)) {
    return true;
  }
  if (/weizen|dinkel|roggen|gerste|grünkern|bulgur|couscous|seitan|paniermehl|paniert|fischstäbchen|nuggets|schnitzel|spätzle|tortellini|ravioli|lasagne|nudel|spaghetti|pasta|penne|fusilli|rigatoni|mehl|grieß|haferflocken|müsli|cornflakes|brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|knäckebrot|kuchen|waffel|keks|cookie|brezel|pizza|flammkuchen|\bbier\b|malz|gnocchi|schupfnudel/.test(n)) {
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

function writeAuthSession(accountId, authKey, familyName) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    if (typeof document !== 'undefined') {
      document.cookie = 'tw_auth_session=1; path=/; max-age=' + maxAge + '; SameSite=Lax';
      document.cookie = 'tw_account_id=' + encodeURIComponent(accountId || 'local') + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('richter_tw_auth_active', '1');
      localStorage.setItem('richter_tw_account_id', accountId || 'local');
      localStorage.setItem('richter_tw_auth_key', authKey || '');
      if (familyName) localStorage.setItem('richter_tw_family_name', familyName);
    }
  } catch (e) {}
}

function readAuthSession() {
  try {
    if (typeof localStorage === 'undefined') return { active: false, accountId: '', authKey: '' };
    const cookieActive = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('tw_auth_session=1'));
    const storageActive = localStorage.getItem('richter_tw_auth_active') === '1';
    return {
      active: Boolean(cookieActive || storageActive),
      accountId: localStorage.getItem('richter_tw_account_id') || '',
      authKey: localStorage.getItem('richter_tw_auth_key') || ''
    };
  } catch (e) {}
  return { active: false, accountId: '', authKey: '' };
}

function getItemAddedTimestamp(item) {
  if (!item) return 0;
  if (item.addedTimestamp && Number(item.addedTimestamp) > 0) return Number(item.addedTimestamp);
  const idMatch = String(item.id || '').match(/^p_(\d{10,15})/);
  if (idMatch) return Number(idMatch[1]);
  if (item.updatedAt && Number(item.updatedAt) > 0) return Number(item.updatedAt);
  return 0;
}

function getDaysUntilMhd(expiryDateStr, todayStr) {
  if (!expiryDateStr) return 999;
  const exp = new Date(expiryDateStr + 'T12:00:00');
  const tod = new Date(todayStr + 'T12:00:00');
  return Math.round((exp.getTime() - tod.getTime()) / 86400000);
}

function getShopNormKey(textStr) {
  return String(textStr || '').toLowerCase().trim();
}

function getTaskTitleKey(task) {
  if (!task) return '';
  return String(task.title || '').toLowerCase().trim();
}

function getTaskNormKey(task) {
  if (!task) return '';
  return String(task.member || 'all').toLowerCase() + '::' + getTaskTitleKey(task);
}

function reconcileShoppingNotes(localNotes, incomingNotes, syncMeta, source = 'cloud') {
  const baseNotes = Array.isArray(incomingNotes) && incomingNotes.length > 0
    ? incomingNotes
    : (Array.isArray(localNotes) && localNotes.length > 0 ? localNotes : DEFAULT_NOTES);

  const localFirstItems = Array.isArray(localNotes?.[0]?.items) ? localNotes[0].items : [];
  const incomingFirstItems = Array.isArray(baseNotes?.[0]?.items) ? baseNotes[0].items : [];

  if (!syncMeta.deletedTaskIds) syncMeta.deletedTaskIds = {};
  const delMap = syncMeta.deletedTaskIds;
  const now = Date.now();
  const TOMBSTONE_TTL = 1000 * 60 * 60 * 18;

  const isDeletedItem = (it) => {
    if (!it || !String(it.text || '').trim()) return true;
    if (it.todoistId && delMap[String(it.todoistId)]) return true;
    const norm = getShopNormKey(it.text);
    const delTs = delMap['shop_del_' + norm];
    if (delTs && (now - Number(delTs) < TOMBSTONE_TTL)) return true;
    return false;
  };

  const mergedMap = new Map();

  incomingFirstItems.forEach(rawIt => {
    const it = typeof rawIt === 'string' ? { text: rawIt, done: false } : { ...rawIt };
    if (isDeletedItem(it)) return;
    const norm = getShopNormKey(it.text);
    const doneTs = delMap['shop_done_' + norm];
    const localMatch = localFirstItems.find(loc =>
      (it.todoistId && loc?.todoistId && String(it.todoistId) === String(loc.todoistId)) ||
      getShopNormKey(loc?.text) === norm
    );

    const isDone = Boolean(it.done || doneTs || localMatch?.done);
    const resolvedDoneAt = Number(it.doneAt || localMatch?.doneAt || doneTs || (isDone ? now : 0));

    mergedMap.set(norm, {
      ...localMatch,
      ...it,
      text: String(it.text).trim(),
      done: isDone,
      doneAt: isDone ? resolvedDoneAt : 0,
      todoistId: it.todoistId || localMatch?.todoistId || null,
      addedAtTs: localMatch?.addedAtTs || it.addedAtTs || now
    });
  });

  localFirstItems.forEach(rawLoc => {
    const loc = typeof rawLoc === 'string' ? { text: rawLoc, done: false } : { ...rawLoc };
    if (isDeletedItem(loc)) return;
    const norm = getShopNormKey(loc.text);

    const matchedInIncoming = incomingFirstItems.some(inc => {
      const incObj = typeof inc === 'string' ? { text: inc } : inc;
      return (
        (loc.todoistId && incObj?.todoistId && String(loc.todoistId) === String(incObj.todoistId)) ||
        getShopNormKey(incObj?.text) === norm
      );
    });

    if (mergedMap.has(norm) || matchedInIncoming) return;

    const doneTs = delMap['shop_done_' + norm];

    if (loc.done || doneTs) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    if (source === 'cloud') {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
      return;
    }

    const isVeryRecent = loc.addedAtTs && (now - Number(loc.addedAtTs) < 25000);
    if (!loc.todoistId || isVeryRecent) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
    } else {
      delMap['shop_done_' + norm] = now;
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: true,
        doneAt: now
      });
    }
  });

  saveLocalSyncMeta(syncMeta);
  const finalFirstItems = Array.from(mergedMap.values());
  return baseNotes.map((n, idx) => idx === 0 ? { ...n, items: finalFirstItems } : n);
}

function reconcileFamilyTasks(localTasks, incomingTasks, syncMeta, source = 'cloud') {
  const localList = Array.isArray(localTasks) ? localTasks : [];
  const incomingList = Array.isArray(incomingTasks) ? incomingTasks : [];

  if (!syncMeta.deletedTaskIds) syncMeta.deletedTaskIds = {};
  const delMap = syncMeta.deletedTaskIds;
  const now = Date.now();
  const TOMBSTONE_TTL = 1000 * 60 * 60 * 18;

  const isDeletedTask = (t) => {
    if (!t || !String(t.title || '').trim()) return true;
    if (t.id && delMap[String(t.id)]) return true;
    if (t.todoistId && delMap[String(t.todoistId)]) return true;
    const norm = getTaskNormKey(t);
    const titleKey = getTaskTitleKey(t);
    const delTs = delMap['task_del_' + norm] || delMap['task_del_title_' + titleKey];
    if (delTs && (now - Number(delTs) < TOMBSTONE_TTL)) return true;
    return false;
  };

  const mergedList = [];
  const usedLocalIndices = new Set();

  incomingList.forEach(rawT => {
    if (isDeletedTask(rawT)) return;
    const idKey = String(rawT.id || '');
    const tdKey = rawT.todoistId ? String(rawT.todoistId) : '';
    const titleKey = getTaskTitleKey(rawT);

    const localIdx = localList.findIndex((loc, idx) => {
      if (usedLocalIndices.has(idx)) return false;
      if (tdKey && loc.todoistId && String(loc.todoistId) === tdKey) return true;
      if (idKey && loc.id && String(loc.id) === idKey) return true;
      return getTaskTitleKey(loc) === titleKey;
    });

    const localMatch = localIdx >= 0 ? localList[localIdx] : null;
    if (localIdx >= 0) usedLocalIndices.add(localIdx);

    const resolvedMember =
      (rawT.member && rawT.member !== 'all')
        ? rawT.member
        : (localMatch?.member || rawT.member || 'hans');

    const norm = String(resolvedMember).toLowerCase() + '::' + titleKey;
    const doneTs =
      delMap['task_done_' + norm] ||
      delMap['task_done_title_' + titleKey] ||
      (idKey && delMap['task_done_id_' + idKey]) ||
      (tdKey && delMap['task_done_td_' + tdKey]);

    const isDone = Boolean(rawT.done || doneTs || localMatch?.done);
    const resolvedDoneAt = Number(rawT.doneAt || localMatch?.doneAt || doneTs || (isDone ? now : 0));

    mergedList.push({
      ...localMatch,
      ...rawT,
      id: localMatch?.id || rawT.id || Date.now(),
      member: resolvedMember,
      done: isDone,
      doneAt: isDone ? resolvedDoneAt : 0,
      todoistId: rawT.todoistId || localMatch?.todoistId || null
    });
  });

  localList.forEach((loc, idx) => {
    if (usedLocalIndices.has(idx)) return;
    if (isDeletedTask(loc)) return;

    const idKey = String(loc.id || '');
    const tdKey = loc.todoistId ? String(loc.todoistId) : '';
    const norm = getTaskNormKey(loc);
    const titleKey = getTaskTitleKey(loc);

    const doneTs =
      delMap['task_done_' + norm] ||
      delMap['task_done_title_' + titleKey] ||
      (idKey && delMap['task_done_id_' + idKey]) ||
      (tdKey && delMap['task_done_td_' + tdKey]);

    if (loc.done || doneTs) {
      mergedList.push({
        ...loc,
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    if (source === 'cloud') {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
      return;
    }

    const createdMs = typeof loc.id === 'number' && loc.id > 1700000000000 ? loc.id : 0;
    const isVeryRecent = createdMs && (now - createdMs < 25000);
    if (!tdKey || isVeryRecent) {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
    } else {
      delMap['task_done_' + norm] = now;
      delMap['task_done_title_' + titleKey] = now;
      delMap['task_done_td_' + tdKey] = now;
      mergedList.push({
        ...loc,
        done: true,
        doneAt: now
      });
    }
  });

  saveLocalSyncMeta(syncMeta);
  return mergedList;
}

export default function TouchwallPocketApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accountId, setAccountId] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [familyName, setFamilyName] = useState('Touchwall Pocket');

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('scanner');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [todayStr, setTodayStr] = useState(() => formatDateStr(new Date()));

  const [quickCockpitOpen, setQuickCockpitOpen] = useState(false);

  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [familyTasks, setFamilyTasks] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [pantryItems, setPantryItems] = useState([]);
  const [pantryTrash, setPantryTrash] = useState([]);
  const [todoistConfig, setTodoistConfig] = useState({
    apiToken: '',
    shoppingProjectId: '',
    tasksProjectId: '',
    projects: [],
    collaborators: []
  });

  const [cartItems, setCartItems] = useState([]);

  // Bestands-Unteransicht: 'stock' (Vorrat) | 'trash' (Mülleimer)
  const [stockSubView, setStockSubView] = useState('stock');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [stockSortMode, setStockSortMode] = useState('newest');
  const [stockLocationFilter, setStockLocationFilter] = useState('all');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');
  const [stockOnlyGlutenFree, setStockOnlyGlutenFree] = useState(false);

  const [restockPromptItem, setRestockPromptItem] = useState(null);

  const [editStockModal, setEditStockModal] = useState({
    open: false,
    id: null,
    name: '',
    quantity: '1x',
    location: 'fridge',
    category: 'produce',
    glutenFree: 'auto',
    expiryDate: '',
    customEmoji: ''
  });

  const [notifPermission, setNotifPermission] = useState('default');
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const knownShoppingTextsRef = useRef(null);
  const mhdPushLogRef = useRef({});
  const pendingOfflineSaveRef = useRef(false);

  const preservedWallStateRef = useRef({});
  const syncMetaRef = useRef({ deletedPantryIds: {}, deletedTrashIds: {}, deletedTaskIds: {}, deletedEventIds: {} });
  const pendingCalendarOpsRef = useRef({});
  const isNetworkSavingRef = useRef(false);
  const isSyncRunningRef = useRef(false);
  const lastLocalEditRef = useRef(0);

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, msg, icon = '📲') => {
    setToast({ title, msg, icon });
    setTimeout(() => setToast(null), 4000);
  };

  const themeStyles = useMemo(() => buildThemeStyles(currentTheme), [currentTheme]);
  const getMemberStyles = (m) => buildMemberStyles(m, themeStyles.dark);

  const safeMembers = useMemo(() => {
    return (Array.isArray(members) && members.length > 0 ? members : DEFAULT_MEMBERS).map(m => ({
      ...m,
      name: m?.name || 'Mitglied',
      badge: m?.badge || 'M',
      color: m?.color || 'royal_bold'
    }));
  }, [members]);

  const safeEvents = useMemo(() => Array.isArray(events) ? events : [], [events]);
  const safeTasks = useMemo(() => Array.isArray(familyTasks) ? familyTasks : [], [familyTasks]);
  const safeMeals = useMemo(() => Array.isArray(mealPlan) && mealPlan.length > 0 ? mealPlan : DEFAULT_MEALS, [mealPlan]);
  const safeNotes = useMemo(() => Array.isArray(familyNotes) && familyNotes.length > 0 ? familyNotes : DEFAULT_NOTES, [familyNotes]);
  const safeStock = useMemo(() => Array.isArray(pantryItems) ? pantryItems : [], [pantryItems]);
  const safeTrash = useMemo(() => Array.isArray(pantryTrash) ? pantryTrash : [], [pantryTrash]);
  const safeCart = useMemo(() => Array.isArray(cartItems) ? cartItems : [], [cartItems]);

  const totalGlutenFreeInStock = useMemo(() => {
    return safeStock.filter(it => isProductGlutenFree(it)).length;
  }, [safeStock]);

  const mhdAlertGroups = useMemo(() => {
    const finalToday = [];
    const warnTwoDays = [];
    safeStock.forEach(item => {
      if (!item?.expiryDate) return;
      const d = getDaysUntilMhd(item.expiryDate, todayStr);
      if (d === 0) finalToday.push(item);
      else if (d === 1 || d === 2) warnTwoDays.push({ ...item, daysLeft: d });
    });
    return { finalToday, warnTwoDays };
  }, [safeStock, todayStr]);

  const sortedStockForTab = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    return safeStock
      .map(it => ({
        ...it,
        resolvedCategory: detectSmartCategory(it.name, it.category),
        resolvedGlutenFree: isProductGlutenFree(it),
        resolvedAddedTs: getItemAddedTimestamp(it)
      }))
      .filter(it => stockLocationFilter === 'all' || it.location === stockLocationFilter)
      .filter(it => stockCategoryFilter === 'all' || it.resolvedCategory === stockCategoryFilter)
      .filter(it => !stockOnlyGlutenFree || it.resolvedGlutenFree)
      .filter(it => {
        if (!q) return true;
        const catTitle = FOOD_CATEGORIES.find(c => c.id === it.resolvedCategory)?.title || '';
        return (
          String(it.name || '').toLowerCase().includes(q) ||
          String(it.quantity || '').toLowerCase().includes(q) ||
          catTitle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (stockSortMode === 'glutenfree') {
          if (a.resolvedGlutenFree !== b.resolvedGlutenFree) return a.resolvedGlutenFree ? -1 : 1;
          return b.resolvedAddedTs - a.resolvedAddedTs;
        }
        if (stockSortMode === 'az') {
          return String(a.name || '').localeCompare(String(b.name || ''), 'de');
        }
        if (stockSortMode === 'newest') {
          return b.resolvedAddedTs - a.resolvedAddedTs;
        }
        return String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'));
      });
  }, [safeStock, stockLocationFilter, stockCategoryFilter, stockOnlyGlutenFree, stockSearchQuery, stockSortMode]);

  const trashStats = useMemo(() => {
    const consumed = safeTrash.filter(x => x.reason === 'consumed').length;
    const wasted = safeTrash.filter(x => x.reason === 'expired' || x.reason === 'wasted').length;
    const total = consumed + wasted;
    const score = total > 0 ? Math.round((consumed / total) * 100) : 100;
    return { consumed, wasted, total, score };
  }, [safeTrash]);

  const updateCartAndPersist = (nextCart) => {
    const clean = Array.isArray(nextCart) ? nextCart : [];
    setCartItems(clean);
    try {
      localStorage.setItem('richter_tw_pocket_cart_v1', JSON.stringify(clean));
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedCart = localStorage.getItem('richter_tw_pocket_cart_v1');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) setCartItems(parsedCart);
      }
      const savedMhdLog = localStorage.getItem('richter_tw_mhd_push_log_v1');
      if (savedMhdLog) {
        mhdPushLogRef.current = JSON.parse(savedMhdLog) || {};
      }
    } catch (e) {}

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    const dayWatcher = setInterval(() => {
      const nowStr = formatDateStr(new Date());
      setTodayStr(prev => (prev !== nowStr ? nowStr : prev));
    }, 30000);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    const onNetOnline = () => {
      setIsOnline(true);
      if (pendingOfflineSaveRef.current) {
        pendingOfflineSaveRef.current = false;
        saveStateToCloud({});
        showToast('Wieder online!', 'Offline-Änderungen wurden synchronisiert.', '☁️');
      }
    };
    const onNetOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('online', onNetOnline);
    window.addEventListener('offline', onNetOffline);

    return () => {
      clearInterval(dayWatcher);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online', onNetOnline);
      window.removeEventListener('offline', onNetOffline);
    };
  }, []);

  const handleInstallAndroidApp = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  const sendPhonePushNotification = async (title, bodyText, tagId, vibrationPattern = [200, 100, 250]) => {
    playMobileBeep('shopping');
    try { navigator.vibrate?.(vibrationPattern); } catch (e) {}

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body: bodyText,
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            vibrate: vibrationPattern,
            tag: tagId || ('tw-push-' + Date.now())
          });
        } else {
          new Notification(title, {
            body: bodyText,
            icon: '/icon-512.png'
          });
        }
      } catch (e) {}
    }
  };

  const requestShoppingPushPermission = async () => {
    playMobileBeep('shopping');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Ton- & Vibrations-Alarm aktiv', 'Du wirst bei Einkäufen und ablaufendem MHD benachrichtigt.', '🔔');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        await sendPhonePushNotification(
          '🔔 Touchwall Push-Alarme aktiv!',
          'Du erhältst Push-Warnungen bei neuen Einkäufen sowie 2 Tage vor MHD-Ablauf & am Ablauftag.',
          'tw-push-test'
        );
        showToast('Push aktiviert!', 'Einkaufs- & MHD-Ablauf-Warnungen sind scharf.', '🔔');
      }
    } catch (e) {}
  };

  const triggerShoppingPhoneNotification = async (addedNamesList) => {
    if (!Array.isArray(addedNamesList) || addedNamesList.length === 0) return;
    const summaryText = addedNamesList.join(', ');
    showToast('🛒 Neu auf der Einkaufsliste!', summaryText, '🛒');
    await sendPhonePushNotification(
      '🛒 Neu auf der Einkaufsliste (' + addedNamesList.length + ')',
      summaryText,
      'tw-shopping-' + Date.now(),
      [200, 100, 250]
    );
  };

  const triggerMhdExpiryPushWarnings = async (forceManual = false) => {
    const log = mhdPushLogRef.current || {};
    const finalItemsToNotify = [];
    const warnItemsToNotify = [];

    safeStock.forEach(item => {
      if (!item?.expiryDate) return;
      const daysLeft = getDaysUntilMhd(item.expiryDate, todayStr);

      if (daysLeft === 0) {
        const key0 = 'final0d_' + item.id + '_' + todayStr;
        if (forceManual || !log[key0]) {
          finalItemsToNotify.push(item);
          log[key0] = Date.now();
        }
      } else if (daysLeft === 1 || daysLeft === 2) {
        const keyWarn = 'warn_' + daysLeft + 'd_' + item.id + '_' + todayStr;
        if (forceManual || !log[keyWarn]) {
          warnItemsToNotify.push({ ...item, daysLeft });
          log[keyWarn] = Date.now();
        }
      }
    });

    if (finalItemsToNotify.length === 0 && warnItemsToNotify.length === 0) {
      if (forceManual) {
        showToast('MHD-Check ✓', 'Aktuell laufen keine Produkte heute oder in den nächsten 2 Tagen ab.', '🌱');
      }
      return;
    }

    try {
      localStorage.setItem('richter_tw_mhd_push_log_v1', JSON.stringify(log));
    } catch (e) {}

    if (finalItemsToNotify.length > 0) {
      const names = finalItemsToNotify.map(it => getFoodEmoji(it.name, it.customEmoji) + ' ' + it.name + ' (' + (it.quantity || '1x') + ')').join(', ');
      const title = '🚨 LETZTE WARNUNG: Läuft HEUTE ab (' + finalItemsToNotify.length + ')!';
      const body = names + ' — Heute verbrauchen, sonst wandert es morgen automatisch in den Mülleimer!';
      showToast(title, body, '🚨');
      await sendPhonePushNotification(title, body, 'tw-mhd-final-' + todayStr, [320, 120, 320, 120, 450]);
    }

    if (warnItemsToNotify.length > 0) {
      const names = warnItemsToNotify
        .map(it => getFoodEmoji(it.name, it.customEmoji) + ' ' + it.name + ' (' + (it.daysLeft === 1 ? 'morgen' : 'in 2 Tagen') + ')')
        .join(', ');
      const title = '⚠️ MHD-Warnung: Läuft in 1–2 Tagen ab (' + warnItemsToNotify.length + ')';
      const body = names + ' — Bitte bald einplanen & verbrauchen!';
      if (finalItemsToNotify.length === 0) {
        showToast(title, body, '⚠️');
      }
      await sendPhonePushNotification(title, body, 'tw-mhd-warn-' + todayStr, [200, 100, 240]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || safeStock.length === 0) return;

    const expiredPast = safeStock.filter(it => it.expiryDate && it.expiryDate < todayStr);
    if (expiredPast.length > 0) {
      const now = Date.now();
      lastLocalEditRef.current = now;
      expiredPast.forEach(it => {
        syncMetaRef.current.deletedPantryIds[String(it.id)] = now;
      });
      saveLocalSyncMeta(syncMetaRef.current);

      const remainingStock = safeStock.filter(it => !it.expiryDate || it.expiryDate >= todayStr);
      const movedToTrash = expiredPast.map((it, idx) => ({
        ...it,
        trashedAt: todayStr,
        trashedTimestamp: now + idx,
        reason: 'expired',
        reasonLabel: '⚠️ Automatisch abgelaufen am ' + it.expiryDate,
        updatedAt: now,
        fromMobile: true
      }));

      const nextTrash = [...movedToTrash, ...safeTrash];
      setPantryItems(remainingStock);
      setPantryTrash(nextTrash);
      saveStateToCloud({ pantryItems: remainingStock, pantryTrash: nextTrash });

      const expiredNames = expiredPast.map(x => x.name).join(', ');
      showToast('🗑️ MHD überschritten!', expiredNames + ' wurde automatisch in den Mülleimer verschoben.', '🗑️');
      sendPhonePushNotification(
        '🗑️ MHD abgelaufen – In Mülleimer verschoben',
        expiredNames + ' ist abgelaufen und liegt jetzt im Mülleimer.',
        'tw-mhd-trashed-' + todayStr
      );
      return;
    }

    const timer = setTimeout(() => {
      triggerMhdExpiryPushWarnings(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, safeStock, todayStr]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentOpenTexts = (Array.isArray(safeNotes?.[0]?.items) ? safeNotes[0].items : [])
      .filter(it => it && !it.done && String(it.text || '').trim() !== '')
      .map(it => String(it.text).trim());

    if (knownShoppingTextsRef.current === null) {
      knownShoppingTextsRef.current = new Set(currentOpenTexts.map(t => t.toLowerCase()));
      return;
    }

    const newlyAdded = currentOpenTexts.filter(
      txt => !knownShoppingTextsRef.current.has(txt.toLowerCase())
    );

    if (newlyAdded.length > 0) {
      triggerShoppingPhoneNotification(newlyAdded);
    }

    knownShoppingTextsRef.current = new Set(currentOpenTexts.map(t => t.toLowerCase()));
  }, [isAuthenticated, safeNotes]);

  const renderAvatar = (member, size = 'w-8 h-8', textSize = 'text-xs') => {
    const st = getMemberStyles(member);
    if (member?.avatarType === 'photo' && member?.photoUrl) {
      return (
        <div
          style={{ borderColor: COLOR_PALETTES[member.color]?.hex || '#38bdf8' }}
          className={size + ' rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center'}
        >
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (member?.avatarType === 'emoji' && member?.emoji) {
      return (
        <div style={st.badgeStyle} className={size + ' rounded-full flex items-center justify-center ' + textSize + ' shrink-0 shadow-xs'}>
          {member.emoji}
        </div>
      );
    }
    return (
      <div style={st.badgeStyle} className={size + ' rounded-full font-black ' + textSize + ' flex items-center justify-center shrink-0 shadow-xs'}>
        {member?.badge || 'F'}
      </div>
    );
  };

  const pocketStyles = [
    '.tw-glow-card, .tw-glow-subtle { transition: background-color 0.2s ease, border-color 0.2s ease; }',
    '.tw-glow-btn {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 28%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 28%, var(--tw-btn-rest-base)) 100%) !important;',
    '  color: var(--tw-btn-rest-text) !important;',
    '  border: 1px solid color-mix(in srgb, var(--tw-btn-border) 38%, transparent) !important;',
    '  transition: box-shadow 0.16s ease, background 0.16s ease !important;',
    '}',
    '.tw-nav-inactive {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 12%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 12%, var(--tw-btn-rest-base)) 100%);',
    '  border: 1px solid rgba(255, 255, 255, 0.14);',
    '}',
    '.tw-active-nav {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  border: 1.5px solid var(--tw-btn-border) !important;',
    '  box-shadow: 0 6px 16px -3px var(--tw-btn-glow) !important;',
    '}'
  ].join('\n');
  const callCloudBackend = async (postBody) => {
    return callCloudApi(
      PUBLIC_CLOUD_BACKEND_URL,
      'POST',
      postBody,
      postBody.accountId !== undefined ? postBody.accountId : accountId,
      postBody.authKey !== undefined ? postBody.authKey : authKey
    );
  };

  const applyRemoteBundle = (bundle, deferTasksAndNotes = false) => {
    if (!bundle) return { resolvedNotes: safeNotes, resolvedTasks: safeTasks, resolvedTodoistCfg: todoistConfig };
    let nextNotes = safeNotes;
    let nextTasks = safeTasks;
    let nextTodoistCfg = todoistConfig;

    if (bundle.state) {
      const s = bundle.state;
      if (s.syncMeta) {
        syncMetaRef.current = mergeSyncMetaMaps(syncMetaRef.current, s.syncMeta);
        saveLocalSyncMeta(syncMetaRef.current);
      }

      preservedWallStateRef.current = {
        ...preservedWallStateRef.current,
        skillBoardData: mergeSkillBoardSafe(preservedWallStateRef.current.skillBoardData, s.skillBoardData),
        customLogoUrl: s.customLogoUrl || preservedWallStateRef.current.customLogoUrl || '',
        calendars: s.calendars || preservedWallStateRef.current.calendars || {}
      };

      if (s.familyName) setFamilyName(s.familyName);
      if (Array.isArray(s.members) && s.members.length >= 2 && hasJsonChanged(safeMembers, s.members)) setMembers(s.members);
      if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0 && hasJsonChanged(safeMeals, s.mealPlan)) setMealPlan(s.mealPlan);

      if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) {
        nextNotes = reconcileShoppingNotes(safeNotes, s.familyNotes, syncMetaRef.current, 'cloud');
        if (!deferTasksAndNotes && hasJsonChanged(safeNotes, nextNotes)) {
          setFamilyNotes(nextNotes);
        }
      }

      if (s.schoolData && typeof s.schoolData === 'object') setSchoolData(s.schoolData);

      if (Array.isArray(s.familyTasks)) {
        nextTasks = reconcileFamilyTasks(safeTasks, s.familyTasks, syncMetaRef.current, 'cloud');
        if (!deferTasksAndNotes && hasJsonChanged(safeTasks, nextTasks)) {
          setFamilyTasks(nextTasks);
        }
      }

      if (Array.isArray(s.pantryItems) || Array.isArray(s.pantryTrash)) {
        const { mergedStock, mergedTrash } = mergePantryChannelSafe(
          safeStock,
          s.pantryItems,
          safeTrash,
          s.pantryTrash,
          syncMetaRef.current
        );
        if (hasJsonChanged(safeStock, mergedStock)) setPantryItems(mergedStock);
        if (hasJsonChanged(safeTrash, mergedTrash)) setPantryTrash(mergedTrash);
      }

      if (s.currentTheme) setCurrentTheme(s.currentTheme);
      if (s.todoistConfig?.apiToken) {
        nextTodoistCfg = { ...todoistConfig, ...s.todoistConfig };
        setTodoistConfig(nextTodoistCfg);
      }
    }

    if (Array.isArray(bundle?.calendarData?.events)) {
      const guardedEvents = mergeCalendarEventsSafe(bundle.calendarData.events, pendingCalendarOpsRef, syncMetaRef.current);
      if (hasJsonChanged(safeEvents, guardedEvents)) {
        setEvents(guardedEvents);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(guardedEvents)); } catch (e) {}
      }
    }

    return { resolvedNotes: nextNotes, resolvedTasks: nextTasks, resolvedTodoistCfg: nextTodoistCfg };
  };

  const saveStateToCloud = async (overrides = {}) => {
    const localStockToSave = overrides.pantryItems !== undefined ? overrides.pantryItems : safeStock;
    const localTrashToSave = overrides.pantryTrash !== undefined ? overrides.pantryTrash : safeTrash;
    const localTasksToSave = overrides.familyTasks !== undefined ? overrides.familyTasks : safeTasks;
    const localNotesToSave = overrides.familyNotes !== undefined ? overrides.familyNotes : safeNotes;
    const localMealsToSave = overrides.mealPlan !== undefined ? overrides.mealPlan : safeMeals;

    const basePayload = {
      isConfigured: true,
      familyName,
      members: safeMembers,
      mealPlan: localMealsToSave,
      familyNotes: localNotesToSave,
      schoolData,
      familyTasks: localTasksToSave,
      pantryItems: localStockToSave,
      pantryTrash: localTrashToSave,
      skillBoardData: preservedWallStateRef.current.skillBoardData || null,
      syncMeta: syncMetaRef.current,
      customLogoUrl: preservedWallStateRef.current.customLogoUrl || '',
      currentTheme,
      todoistConfig
    };

    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(basePayload)); } catch (e) {}

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      pendingOfflineSaveRef.current = true;
      showToast('Offline gepuffert 📡', 'Wird automatisch gesendet, sobald wieder Empfang da ist.', '💾');
      return;
    }

    if (!accountId || accountId === 'local') return;

    isNetworkSavingRef.current = true;
    lastLocalEditRef.current = Date.now();
    setIsSyncing(true);

    try {
      let mergedStock = localStockToSave;
      let mergedTrash = localTrashToSave;
      let mergedNotes = localNotesToSave;
      let mergedTasks = localTasksToSave;
      let latestSkillBoard = preservedWallStateRef.current.skillBoardData || null;
      let latestLogo = preservedWallStateRef.current.customLogoUrl || '';

      try {
        // TURBO: Vor-Merge ohne Google-Kalender-Wartezeit (~60ms statt 2-3s)
        const freshBundle = await callCloudBackend({ action: 'loadBundle', skipCalendars: true });
        if (freshBundle?.ok && freshBundle.state) {
          const rs = freshBundle.state;
          syncMetaRef.current = mergeSyncMetaMaps(syncMetaRef.current, rs.syncMeta);
          saveLocalSyncMeta(syncMetaRef.current);

          if (rs.skillBoardData) latestSkillBoard = mergeSkillBoardSafe(latestSkillBoard, rs.skillBoardData);
          if (rs.customLogoUrl) latestLogo = rs.customLogoUrl;

          if (Array.isArray(rs.familyNotes)) {
            mergedNotes = reconcileShoppingNotes(localNotesToSave, rs.familyNotes, syncMetaRef.current, 'cloud');
            if (hasJsonChanged(safeNotes, mergedNotes)) setFamilyNotes(mergedNotes);
          }

          if (Array.isArray(rs.familyTasks)) {
            mergedTasks = reconcileFamilyTasks(localTasksToSave, rs.familyTasks, syncMetaRef.current, 'cloud');
            if (hasJsonChanged(safeTasks, mergedTasks)) setFamilyTasks(mergedTasks);
          }

          const pMerged = mergePantryChannelSafe(
            localStockToSave,
            rs.pantryItems,
            localTrashToSave,
            rs.pantryTrash,
            syncMetaRef.current
          );
          mergedStock = pMerged.mergedStock;
          mergedTrash = pMerged.mergedTrash;
          setPantryItems(mergedStock);
          setPantryTrash(mergedTrash);
        }
      } catch (e) {}

      await callCloudBackend({
        action: 'saveState',
        payload: {
          ...basePayload,
          familyNotes: mergedNotes,
          familyTasks: mergedTasks,
          pantryItems: mergedStock,
          pantryTrash: mergedTrash,
          skillBoardData: latestSkillBoard,
          syncMeta: syncMetaRef.current,
          customLogoUrl: latestLogo
        }
      });
    } catch (e) {
      pendingOfflineSaveRef.current = true;
    } finally {
      lastLocalEditRef.current = Date.now();
      isNetworkSavingRef.current = false;
      setIsSyncing(false);
    }
  };

  const syncAllNow = async (
    showFeedback = false,
    accOverride = undefined,
    keyOverride = undefined,
    isRealtimeTrigger = false,
    syncScope = 'all'
  ) => {
    const activeAcc = accOverride !== undefined ? accOverride : accountId;
    const activeKey = keyOverride !== undefined ? keyOverride : authKey;
    if (isSyncRunningRef.current) return;
    if (!showFeedback && !isRealtimeTrigger && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 8000)) return;
    if (isRealtimeTrigger && isNetworkSavingRef.current) return;

    const isStateOnlyRealtime = Boolean(isRealtimeTrigger && syncScope === 'state');

    isSyncRunningRef.current = true;
    if (showFeedback) setIsSyncing(true);

    try {
      let workingNotes = safeNotes;
      let workingTasks = safeTasks;
      let workingTodoistCfg = todoistConfig;

      if (activeAcc && activeAcc !== 'local') {
        const bundle = await callCloudBackend({
          action: 'loadBundle',
          accountId: activeAcc,
          authKey: activeKey,
          skipCalendars: isStateOnlyRealtime
        });
        if (!showFeedback && !isRealtimeTrigger && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 6000)) {
          return;
        }
        if (bundle?.ok) {
          const hasTodoistToken = Boolean(
            bundle?.state?.todoistConfig?.apiToken?.trim() || todoistConfig?.apiToken?.trim()
          );
          // Bei reinem Realtime-State-Signal direkt ohne Todoist-Verzögerung anwenden (< 1 Sek.)
          const applied = applyRemoteBundle(bundle, !isStateOnlyRealtime && hasTodoistToken);
          workingNotes = applied.resolvedNotes;
          workingTasks = applied.resolvedTasks;
          workingTodoistCfg = applied.resolvedTodoistCfg;
        }
      }

      if (!isStateOnlyRealtime && workingTodoistCfg?.apiToken?.trim()) {
        const pulled = await pullFromTodoistTwoWay(
          workingTodoistCfg.apiToken,
          workingTodoistCfg,
          workingTasks,
          workingNotes,
          safeMembers
        );
        if (pulled && (showFeedback || isRealtimeTrigger || (!isNetworkSavingRef.current && Date.now() - lastLocalEditRef.current >= 6000))) {
          if (Array.isArray(pulled.tasks)) {
            workingTasks = reconcileFamilyTasks(workingTasks, pulled.tasks, syncMetaRef.current, 'todoist');
          }
          if (Array.isArray(pulled.familyNotes)) {
            workingNotes = reconcileShoppingNotes(workingNotes, pulled.familyNotes, syncMetaRef.current, 'todoist');
          }
        }
      }

      if (hasJsonChanged(safeTasks, workingTasks)) {
        setFamilyTasks(workingTasks);
      }
      if (hasJsonChanged(safeNotes, workingNotes)) {
        setFamilyNotes(workingNotes);
      }

      if (showFeedback) showToast('Synchronisiert', 'Alle 4 Kanäle sauber abgeglichen.', '✅');
    } catch (e) {} finally {
      isSyncRunningRef.current = false;
      if (showFeedback) setIsSyncing(false);
    }
  };

  const syncAllNowRef = useRef(null);
  syncAllNowRef.current = syncAllNow;

  useEffect(() => {
    syncMetaRef.current = loadLocalSyncMeta();
    try {
      const params = new URLSearchParams(window.location.search);
      const qrAcc = params.get('account');
      const qrKey = params.get('key');
      const qrFamily = params.get('family');
      const savedPerson = localStorage.getItem('richter_tw_pocket_person');
      if (savedPerson) setSelectedPerson(savedPerson);

      if (qrAcc && qrKey) {
        const cleanTitle = qrFamily || 'Familien-Touchwall';
        setAccountId(qrAcc);
        setAuthKey(qrKey);
        setFamilyName(cleanTitle);
        writeAuthSession(qrAcc, qrKey, cleanTitle);
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => syncAllNowRef.current?.(true, qrAcc, qrKey), 200);
        return;
      }

      const session = readAuthSession();
      const rawState = localStorage.getItem('richter_touchwall_v6');
      if (rawState) {
        try {
          const parsed = JSON.parse(rawState);
          if (parsed.familyName) setFamilyName(parsed.familyName);
          if (Array.isArray(parsed.members) && parsed.members.length >= 2) setMembers(parsed.members);
          if (Array.isArray(parsed.mealPlan)) setMealPlan(parsed.mealPlan);
          if (Array.isArray(parsed.familyNotes)) setFamilyNotes(parsed.familyNotes);
          if (parsed.schoolData && typeof parsed.schoolData === 'object') setSchoolData(parsed.schoolData);
          if (Array.isArray(parsed.familyTasks)) setFamilyTasks(parsed.familyTasks);
          if (Array.isArray(parsed.pantryItems)) setPantryItems(parsed.pantryItems);
          if (Array.isArray(parsed.pantryTrash)) setPantryTrash(parsed.pantryTrash);
          if (parsed.skillBoardData) preservedWallStateRef.current.skillBoardData = parsed.skillBoardData;
          if (parsed.customLogoUrl) preservedWallStateRef.current.customLogoUrl = parsed.customLogoUrl;
          if (parsed.currentTheme) setCurrentTheme(parsed.currentTheme);
          if (parsed.todoistConfig) setTodoistConfig(prev => ({ ...prev, ...parsed.todoistConfig }));
        } catch (e) {}
      }

      const savedEv = localStorage.getItem('richter_touchwall_events_cache');
      if (savedEv) {
        try {
          const parsedEv = JSON.parse(savedEv);
          if (Array.isArray(parsedEv)) setEvents(parsedEv);
        } catch (e) {}
      }

      if (session.active && session.accountId) {
        setAccountId(session.accountId);
        setAuthKey(session.authKey);
        setIsAuthenticated(true);
        if (session.accountId !== 'local') {
          setTimeout(() => syncAllNowRef.current?.(false, session.accountId, session.authKey), 300);
        }
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  // SUPABASE REALTIME TURBO LIVE-SYNC: Überspringt Google Kalender & Todoist bei reinen State-Änderungen (< 1 Sek.)
  useTouchwallRealtime(isAuthenticated && accountId && accountId !== 'local' ? accountId : '', (scope) => {
    syncAllNowRef.current?.(false, undefined, undefined, true, scope || 'all');
  });

  // Fallback-Intervall (30s) für externe Änderungen direkt in Google Kalender oder Todoist
  useEffect(() => {
    if (!isAuthenticated || !accountId || accountId === 'local') return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllNowRef.current?.(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accountId, authKey]);

  const handleSelectPersonFilter = (personId) => {
    setSelectedPerson(personId);
    try { localStorage.setItem('richter_tw_pocket_person', personId); } catch (e) {}
  };

  const handleAddSingleToCart = (nameVal, barcodeVal, qtyVal, locVal, catVal, expVal, imgVal, gfVal = 'auto') => {
    const now = Date.now();
    const cleanName = simplifyProductName(nameVal);
    const resolvedCat = catVal || detectSmartCategory(cleanName);
    const resolvedLoc = locVal || detectSmartLocation(cleanName, resolvedCat);
    const newCartEntry = {
      id: 'cart_' + now + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      barcode: barcodeVal || '',
      quantity: qtyVal || '1x',
      location: resolvedLoc,
      category: resolvedCat,
      glutenFree: gfVal,
      expiryDate: expVal,
      imageUrl: imgVal || '',
      scannedAt: now
    };
    const nextCart = [newCartEntry, ...safeCart];
    updateCartAndPersist(nextCart);
    playMobileBeep('scan');
    showToast('Im Einkaufswagen 🛒', newCartEntry.name + ' (MHD: ' + expVal + ')', getFoodEmoji(newCartEntry.name));
  };

  const handleAddBatchToCart = (selectedList) => {
    const now = Date.now();
    const total = selectedList.length;
    const newCartEntries = selectedList.map((it, idx) => {
      const cleanName = simplifyProductName(it.name);
      const resolvedCat = detectSmartCategory(cleanName, it.category);
      return {
        id: 'cart_' + now + '_' + idx + '_' + Math.floor(Math.random() * 1000),
        name: cleanName,
        barcode: '',
        quantity: it.quantity || '1x',
        location: it.location || detectSmartLocation(cleanName, resolvedCat),
        category: resolvedCat,
        glutenFree: it.glutenFree || (isProductGlutenFree(cleanName, resolvedCat) ? 'yes' : 'auto'),
        expiryDate: it.expiryDate,
        imageUrl: '',
        scannedAt: now + (total - idx)
      };
    });
    const nextCart = [...newCartEntries, ...safeCart];
    updateCartAndPersist(nextCart);
    playMobileBeep('scan');
    showToast('Im Einkaufswagen 🛒', newCartEntries.length + ' Bon-Artikel abgelegt.', '🧾');
  };

  const handleRemoveCartItem = (cartId) => {
    const nextCart = safeCart.filter(it => it.id !== cartId);
    updateCartAndPersist(nextCart);
  };

  const handleTransferSingleCartItemToStock = async (cartItem) => {
    if (!cartItem) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    const cleanName = simplifyProductName(cartItem.name);
    const resolvedCat = cartItem.category || detectSmartCategory(cleanName);
    const newStockItem = {
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      barcode: cartItem.barcode || '',
      quantity: cartItem.quantity || '1x',
      location: cartItem.location || detectSmartLocation(cleanName, resolvedCat),
      category: resolvedCat,
      glutenFree: cartItem.glutenFree || 'auto',
      expiryDate: cartItem.expiryDate,
      imageUrl: cartItem.imageUrl || '',
      addedAt: todayStr,
      addedTimestamp: now,
      updatedAt: now,
      fromMobile: true
    };
    const nextStock = [newStockItem, ...safeStock];
    const nextCart = safeCart.filter(x => x.id !== cartItem.id);
    setPantryItems(nextStock);
    updateCartAndPersist(nextCart);
    await saveStateToCloud({ pantryItems: nextStock });
    showToast('In Bestand gebucht!', newStockItem.name, getFoodEmoji(newStockItem.name));
  };

  const handleTransferAllCartToStock = async () => {
    if (safeCart.length === 0) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    const sorted = [...safeCart].sort((a, b) => Number(b.scannedAt || 0) - Number(a.scannedAt || 0));
    const total = sorted.length;

    const newStockEntries = sorted.map((cItem, idx) => {
      const stamp = now + (total - idx);
      const cleanName = simplifyProductName(cItem.name);
      const resolvedCat = cItem.category || detectSmartCategory(cleanName);
      return {
        id: 'p_' + stamp + '_' + Math.floor(Math.random() * 1000),
        name: cleanName,
        barcode: cItem.barcode || '',
        quantity: cItem.quantity || '1x',
        location: cItem.location || detectSmartLocation(cleanName, resolvedCat),
        category: resolvedCat,
        glutenFree: cItem.glutenFree || 'auto',
        expiryDate: cItem.expiryDate,
        imageUrl: cItem.imageUrl || '',
        addedAt: todayStr,
        addedTimestamp: stamp,
        updatedAt: stamp,
        fromMobile: true
      };
    });

    const nextStock = [...newStockEntries, ...safeStock];
    setPantryItems(nextStock);
    updateCartAndPersist([]);
    await saveStateToCloud({ pantryItems: nextStock });
    showToast('Einkaufswagen eingelagert!', newStockEntries.length + ' Produkte sind jetzt im Bestand.', '🥫');
  };

  const handleCheckoutStockItemByScan = async (item, mode = 'trash') => {
    if (!item) return;
    const now = Date.now();
    lastLocalEditRef.current = now;

    if (mode === 'decrement') {
      const dec = decrementItemPieceCount(item.quantity);
      if (dec.remaining > 0) {
        const nextStock = safeStock.map(x =>
          x.id === item.id ? { ...x, quantity: dec.nextQtyStr, updatedAt: now, fromMobile: true } : x
        );
        setPantryItems(nextStock);
        await saveStateToCloud({ pantryItems: nextStock });
        showToast('1 Stück entnommen!', item.name + ' → Rest: ' + dec.nextQtyStr, getFoodEmoji(item.name, item.customEmoji));
        return;
      }
    }

    syncMetaRef.current.deletedPantryIds[String(item.id)] = now;
    saveLocalSyncMeta(syncMetaRef.current);

    const nextStock = safeStock.filter(x => x.id !== item.id);
    const nextTrash = [
      {
        ...item,
        trashedAt: todayStr,
        trashedTimestamp: now,
        reason: 'consumed',
        reasonLabel: '📷 Per Barcode ausgebucht am ' + todayStr,
        updatedAt: now,
        fromMobile: true
      },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    await saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
  };

  const handleMoveStockItemToTrashFromPocket = async (item, reasonType = 'wasted', askForShoppingList = true) => {
    if (!item) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    syncMetaRef.current.deletedPantryIds[String(item.id)] = now;
    saveLocalSyncMeta(syncMetaRef.current);

    const nextStock = safeStock.filter(x => x.id !== item.id);
    const nextTrash = [
      {
        ...item,
        trashedAt: todayStr,
        trashedTimestamp: now,
        reason: reasonType,
        reasonLabel: reasonType === 'consumed' ? ('🍽️ Verzehrt am ' + todayStr) : ('🗑️ In Mülleimer am ' + todayStr),
        updatedAt: now,
        fromMobile: true
      },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    await saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });

    if (askForShoppingList) {
      setRestockPromptItem(item);
    } else {
      showToast('In Mülleimer verschoben 🗑️', item.name, '🗑️');
    }
  };

  const handleRestoreFromPocketTrash = async (trashItem) => {
    if (!trashItem) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    const newExp = formatDateStr(addDays(new Date(), 7));

    if (syncMetaRef.current?.deletedTrashIds) {
      syncMetaRef.current.deletedTrashIds[String(trashItem.id)] = now;
      saveLocalSyncMeta(syncMetaRef.current);
    }

    const restoredStockItem = {
      ...trashItem,
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      expiryDate: newExp,
      addedAt: todayStr,
      addedTimestamp: now,
      updatedAt: now,
      fromMobile: true
    };

    const nextTrash = safeTrash.filter(x => x.id !== trashItem.id);
    const nextStock = [restoredStockItem, ...safeStock];
    setPantryTrash(nextTrash);
    setPantryItems(nextStock);
    await saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
    showToast('Wiederhergestellt ↩️', trashItem.name + ' ist wieder im Vorrat (MHD +7T).', getFoodEmoji(trashItem.name));
  };

  const handleDeleteSinglePocketTrash = async (trashItem) => {
    if (!trashItem) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    if (!syncMetaRef.current.deletedTrashIds) syncMetaRef.current.deletedTrashIds = {};
    syncMetaRef.current.deletedTrashIds[String(trashItem.id)] = now;
    saveLocalSyncMeta(syncMetaRef.current);

    const nextTrash = safeTrash.filter(x => x.id !== trashItem.id);
    setPantryTrash(nextTrash);
    await saveStateToCloud({ pantryTrash: nextTrash });
  };

  const handleClearAllPocketTrash = async () => {
    if (safeTrash.length === 0) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    if (!syncMetaRef.current.deletedTrashIds) syncMetaRef.current.deletedTrashIds = {};
    safeTrash.forEach(t => {
      syncMetaRef.current.deletedTrashIds[String(t.id)] = now;
    });
    saveLocalSyncMeta(syncMetaRef.current);

    setPantryTrash([]);
    await saveStateToCloud({ pantryTrash: [] });
    showToast('Mülleimer geleert 🗑️', 'Alle Einträge wurden dauerhaft entfernt.', '🗑️');
  };

  const openEditStockItemModal = (item) => {
    const initialGf =
      item.glutenFree === true || item.glutenFree === 'yes'
        ? 'yes'
        : item.glutenFree === false || item.glutenFree === 'no'
        ? 'no'
        : 'auto';

    setEditStockModal({
      open: true,
      id: item.id,
      name: item.name || '',
      quantity: item.quantity || '1x',
      location: item.location || 'fridge',
      category: detectSmartCategory(item.name, item.category),
      glutenFree: initialGf,
      expiryDate: item.expiryDate || todayStr,
      customEmoji: item.customEmoji || getFoodEmoji(item.name)
    });
  };

  const handleSaveEditStockModal = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editStockModal.name.trim() || !editStockModal.expiryDate) {
      showToast('Pflichtfelder', 'Bitte Name und Ablaufdatum (MHD) ausfüllen.', '⚠️');
      return;
    }

    const now = Date.now();
    lastLocalEditRef.current = now;
    const nextStock = safeStock.map(it =>
      it.id === editStockModal.id
        ? {
            ...it,
            name: editStockModal.name.trim(),
            quantity: editStockModal.quantity.trim() || '1x',
            location: editStockModal.location,
            category: editStockModal.category,
            glutenFree: editStockModal.glutenFree,
            expiryDate: editStockModal.expiryDate,
            customEmoji: editStockModal.customEmoji,
            updatedAt: now,
            fromMobile: true
          }
        : it
    );
    setPantryItems(nextStock);
    setEditStockModal({ ...editStockModal, open: false });
    await saveStateToCloud({ pantryItems: nextStock });
    showToast('Gespeichert & synchronisiert!', editStockModal.name, editStockModal.customEmoji || '✅');
  };

  const handleDeleteFromEditStockModal = async () => {
    const target = safeStock.find(x => x.id === editStockModal.id);
    setEditStockModal({ ...editStockModal, open: false });
    if (target) {
      await handleMoveStockItemToTrashFromPocket(target, 'wasted', true);
    }
  };

  const toggleStockItemGlutenFreeDirectly = async (e, item) => {
    e.stopPropagation();
    const now = Date.now();
    lastLocalEditRef.current = now;
    const currentlyGf = isProductGlutenFree(item);
    const nextGf = currentlyGf ? 'no' : 'yes';
    const nextStock = safeStock.map(it =>
      it.id === item.id ? { ...it, glutenFree: nextGf, updatedAt: now, fromMobile: true } : it
    );
    setPantryItems(nextStock);
    await saveStateToCloud({ pantryItems: nextStock });
    showToast(
      nextGf === 'yes' ? '🌾✓ Als Glutenfrei markiert' : '🚫 Als glutenhaltig markiert',
      item.name,
      nextGf === 'yes' ? '🌾' : '🥖'
    );
  };

  const handleSimplifyAllStockNames = async () => {
    if (safeStock.length === 0) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    let changedCount = 0;

    const nextStock = safeStock.map(it => {
      const simplified = simplifyProductName(it.name);
      const smartCat = detectSmartCategory(simplified, it.category);
      if (simplified !== it.name || smartCat !== it.category) {
        changedCount++;
        return {
          ...it,
          name: simplified,
          category: smartCat,
          updatedAt: now,
          fromMobile: true
        };
      }
      return it;
    });

    setPantryItems(nextStock);
    setShowStockMenu(false);
    await saveStateToCloud({ pantryItems: nextStock });
    showToast(
      'Namen optimiert ✨',
      changedCount > 0 ? (changedCount + ' Produktnamen vereinfacht & synchronisiert.') : 'Alle Produktnamen sind bereits optimal kurz.',
      '✨'
    );
  };

  const handleConsumeFromPocket = async (item) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const dec = decrementItemPieceCount(item.quantity);

    if (dec.remaining > 0) {
      const nextStock = safeStock.map(x =>
        x.id === item.id ? { ...x, quantity: dec.nextQtyStr, updatedAt: now, fromMobile: true } : x
      );
      setPantryItems(nextStock);
      await saveStateToCloud({ pantryItems: nextStock });
      showToast('1 Stück verzehrt!', item.name + ' → Rest: ' + dec.nextQtyStr, getFoodEmoji(item.name, item.customEmoji));
      return;
    }

    await handleMoveStockItemToTrashFromPocket(item, 'consumed', true);
  };

  const handleCreateMobileEvent = async ({ title, date, time, member }) => {
    lastLocalEditRef.current = Date.now();
    const newEv = {
      id: String(Date.now()),
      title,
      date,
      time,
      member,
      notifyTime: '30m',
      notifyChannel: 'wall_push',
      notifyUsers: [member],
      fromGoogle: true,
      fromMobile: true
    };
    registerPendingCalendarOp(pendingCalendarOpsRef, 'create', newEv);
    setEvents(prev => [...(Array.isArray(prev) ? prev : []), newEv]);
    showToast('Termin gespeichert', newEv.title, '📅');

    if (accountId && accountId !== 'local') {
      try {
        const res = await callCloudBackend({ action: 'createEvent', event: newEv });
        if (res?.result?.events) {
          setEvents(mergeCalendarEventsSafe(res.result.events, pendingCalendarOpsRef, syncMetaRef.current));
        }
      } catch (err) {}
    }
  };

  const handleDeleteMobileEvent = async (ev) => {
    lastLocalEditRef.current = Date.now();
    registerPendingCalendarOp(pendingCalendarOpsRef, 'delete', ev);
    syncMetaRef.current.deletedEventIds[String(ev.id)] = Date.now();
    saveLocalSyncMeta(syncMetaRef.current);

    setEvents(prev => (Array.isArray(prev) ? prev : []).filter(item => String(item.id) !== String(ev.id)));
    showToast('Termin gelöscht', ev.title, '🗑️');
    if (accountId && accountId !== 'local') {
      try {
        await callCloudBackend({
          action: 'deleteEvent',
          eventId: String(ev.id),
          member: ev.member,
          title: ev.title,
          date: ev.date
        });
      } catch (err) {}
    }
  };

  const handleAddQuickTask = async (cleanTitle, targetMemberId) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const norm = getTaskNormKey({ member: targetMemberId, title: cleanTitle });
    const titleKey = getTaskTitleKey({ title: cleanTitle });

    if (syncMetaRef.current?.deletedTaskIds) {
      delete syncMetaRef.current.deletedTaskIds['task_del_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_del_title_' + titleKey];
      delete syncMetaRef.current.deletedTaskIds['task_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey];
      saveLocalSyncMeta(syncMetaRef.current);
    }

    const memberObj = safeMembers.find(m => m.id === targetMemberId) || safeMembers[1];
    const projId = memberObj?.todoistProjectId || todoistConfig?.tasksProjectId || '';

    let todoistId = null;
    if (todoistConfig?.apiToken && projId) {
      try {
        const created = await createTodoistTaskItem(
          todoistConfig.apiToken,
          projId,
          cleanTitle,
          memberObj,
          todayStr,
          '18:00',
          3,
          '',
          '15m',
          todoistConfig.collaborators,
          true
        );
        if (created?.id) todoistId = String(created.id);
      } catch (err) {}
    }

    const newTask = {
      id: now,
      todoistId,
      projectId: projId,
      member: targetMemberId,
      title: cleanTitle,
      priority: 3,
      due: 'Heute bis 18:00 Uhr',
      dueDate: todayStr,
      dueTime: '18:00',
      notifyTime: '15m',
      done: false,
      doneAt: 0,
      fromMobile: true
    };
    const nextTasks = [newTask, ...safeTasks.filter(t => getTaskTitleKey(t) !== titleKey)];
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
    showToast('Aufgabe & Push gesendet!', cleanTitle + ' → ' + memberObj.name, '✅');
  };

  const handleToggleMobileTask = async (task) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const nextDone = !task.done;
    const norm = getTaskNormKey(task);
    const titleKey = getTaskTitleKey(task);
    const idKey = String(task.id || '');
    const tdKey = task.todoistId ? String(task.todoistId) : '';

    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
    if (nextDone) {
      syncMetaRef.current.deletedTaskIds['task_done_' + norm] = now;
      syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey] = now;
      if (idKey) syncMetaRef.current.deletedTaskIds['task_done_id_' + idKey] = now;
      if (tdKey) syncMetaRef.current.deletedTaskIds['task_done_td_' + tdKey] = now;
    } else {
      delete syncMetaRef.current.deletedTaskIds['task_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey];
      delete syncMetaRef.current.deletedTaskIds['task_del_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_del_title_' + titleKey];
      if (idKey) {
        delete syncMetaRef.current.deletedTaskIds['task_done_id_' + idKey];
        delete syncMetaRef.current.deletedTaskIds[idKey];
      }
      if (tdKey) {
        delete syncMetaRef.current.deletedTaskIds['task_done_td_' + tdKey];
        delete syncMetaRef.current.deletedTaskIds[tdKey];
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);

    const nextTasks = safeTasks.map(t =>
      t.id === task.id
        ? { ...t, done: nextDone, doneAt: nextDone ? now : 0, fromMobile: true }
        : t
    );
    setFamilyTasks(nextTasks);

    if (task.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, task.todoistId, nextDone); } catch (e) {}
    }
    await saveStateToCloud({ familyTasks: nextTasks });
  };

  const markTasksPermanentlyRemoved = async (taskList) => {
    const now = Date.now();
    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};

    for (const t of taskList) {
      const norm = getTaskNormKey(t);
      const titleKey = getTaskTitleKey(t);
      const idKey = String(t.id || '');
      const tdKey = t.todoistId ? String(t.todoistId) : '';

      syncMetaRef.current.deletedTaskIds['task_del_' + norm] = now;
      syncMetaRef.current.deletedTaskIds['task_del_title_' + titleKey] = now;
      delete syncMetaRef.current.deletedTaskIds['task_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey];
      if (idKey) {
        syncMetaRef.current.deletedTaskIds[idKey] = now;
        delete syncMetaRef.current.deletedTaskIds['task_done_id_' + idKey];
      }
      if (tdKey) {
        syncMetaRef.current.deletedTaskIds[tdKey] = now;
        delete syncMetaRef.current.deletedTaskIds['task_done_td_' + tdKey];
        if (todoistConfig?.apiToken) {
          try {
            if (typeof deleteTodoistTask === 'function') {
              await deleteTodoistTask(todoistConfig.apiToken, tdKey);
            } else {
              await closeOrReopenTodoistTask(todoistConfig.apiToken, tdKey, true);
            }
          } catch (e) {}
        }
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);
  };

  const handleDeleteMobileTask = async (task) => {
    if (!task) return;
    lastLocalEditRef.current = Date.now();
    await markTasksPermanentlyRemoved([task]);
    const nextTasks = safeTasks.filter(t => t.id !== task.id && getTaskTitleKey(t) !== getTaskTitleKey(task));
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
    showToast('Aufgabe gelöscht', task.title, '🗑️');
  };

  const handleClearDoneMobileTasks = async (doneList) => {
    if (!Array.isArray(doneList) || doneList.length === 0) return;
    lastLocalEditRef.current = Date.now();
    await markTasksPermanentlyRemoved(doneList);
    const doneIds = new Set(doneList.map(t => t.id));
    const nextTasks = safeTasks.filter(t => !doneIds.has(t.id));
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
    showToast('Erledigte Aufgaben geleert!', doneList.length + ' Aufgaben dauerhaft entfernt.', '🗑️');
  };

  const handleAddQuickShopItem = async (clean) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const norm = getShopNormKey(clean);
    if (syncMetaRef.current?.deletedTaskIds) {
      delete syncMetaRef.current.deletedTaskIds['shop_del_' + norm];
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      saveLocalSyncMeta(syncMetaRef.current);
    }

    const firstNote = safeNotes[0] || { id: 1, title: '🛒 Einkaufsliste', items: [] };
    const projId = firstNote.todoistProjectId || todoistConfig?.shoppingProjectId || '';

    if (knownShoppingTextsRef.current) {
      knownShoppingTextsRef.current.add(norm);
    }

    let todoistId = null;
    if (todoistConfig?.apiToken && projId) {
      try {
        const created = await createTodoistTaskItem(
          todoistConfig.apiToken,
          projId,
          clean,
          null,
          '',
          '',
          1,
          '',
          'none',
          todoistConfig.collaborators,
          true
        );
        if (created?.id) todoistId = String(created.id);
      } catch (err) {}
    }

    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: [
        { text: clean, done: false, doneAt: 0, addedAtTs: now, todoistId, fromMobile: true },
        ...(Array.isArray(n.items) ? n.items : []).filter(it => getShopNormKey(it.text) !== norm)
      ]
    } : n);
    setFamilyNotes(nextNotes);
    triggerShoppingPhoneNotification([clean]);
    await saveStateToCloud({ familyNotes: nextNotes });
  };

  const handleToggleShopItem = async (itemIdx) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const firstNote = safeNotes[0];
    const item = firstNote?.items?.[itemIdx];
    if (!item) return;

    const nextDone = !item.done;
    const norm = getShopNormKey(item.text);

    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
    if (nextDone) {
      syncMetaRef.current.deletedTaskIds['shop_done_' + norm] = now;
    } else {
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['shop_del_' + norm];
      if (item.todoistId) delete syncMetaRef.current.deletedTaskIds[String(item.todoistId)];
    }
    saveLocalSyncMeta(syncMetaRef.current);

    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).map((it, i) =>
        i === itemIdx ? { ...it, done: nextDone, doneAt: nextDone ? now : 0, fromMobile: true } : it
      )
    } : n);
    setFamilyNotes(nextNotes);

    if (item.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
    await saveStateToCloud({ familyNotes: nextNotes });
  };

  const markShopItemsPermanentlyRemoved = async (itemsList) => {
    const now = Date.now();
    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};

    for (const it of itemsList) {
      const norm = getShopNormKey(it.text);
      syncMetaRef.current.deletedTaskIds['shop_del_' + norm] = now;
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      if (it.todoistId) {
        syncMetaRef.current.deletedTaskIds[String(it.todoistId)] = now;
        if (todoistConfig?.apiToken) {
          try {
            if (typeof deleteTodoistTask === 'function') {
              await deleteTodoistTask(todoistConfig.apiToken, it.todoistId);
            } else {
              await closeOrReopenTodoistTask(todoistConfig.apiToken, it.todoistId, true);
            }
          } catch (e) {}
        }
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);
  };

  const handleMoveBoughtItemToPantry = async (shopItem, mhdDays = 7) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    await markShopItemsPermanentlyRemoved([shopItem]);

    const cleanName = simplifyProductName(shopItem.text);
    const resolvedCat = detectSmartCategory(cleanName);
    const resolvedLoc = detectSmartLocation(cleanName, resolvedCat);
    const expStr = formatDateStr(addDays(new Date(), resolvedLoc === 'freezer' ? 180 : mhdDays));

    const newItem = {
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      quantity: '1x',
      location: resolvedLoc,
      category: resolvedCat,
      glutenFree: isProductGlutenFree(cleanName, resolvedCat) ? 'yes' : 'auto',
      expiryDate: expStr,
      addedAt: todayStr,
      addedTimestamp: now,
      updatedAt: now,
      fromMobile: true
    };
    const nextStock = [newItem, ...safeStock];
    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter(it => getShopNormKey(it.text) !== getShopNormKey(shopItem.text))
    } : n);
    setPantryItems(nextStock);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ pantryItems: nextStock, familyNotes: nextNotes });
    showToast('In Bestand gebucht!', cleanName + ' (MHD: +' + mhdDays + 'T)', getFoodEmoji(cleanName));
  };

  const handleMoveAllBoughtToPantry = async (boughtList, mhdDays = 7) => {
    if (!Array.isArray(boughtList) || boughtList.length === 0) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    await markShopItemsPermanentlyRemoved(boughtList);

    const expStr = formatDateStr(addDays(new Date(), mhdDays));
    const total = boughtList.length;

    const newItems = boughtList.map((it, idx) => {
      const stamp = now + (total - idx);
      const cleanName = simplifyProductName(it.text);
      const resolvedCat = detectSmartCategory(cleanName);
      const resolvedLoc = detectSmartLocation(cleanName, resolvedCat);
      return {
        id: 'p_' + stamp + '_' + Math.floor(Math.random() * 1000),
        name: cleanName,
        quantity: '1x',
        location: resolvedLoc,
        category: resolvedCat,
        glutenFree: isProductGlutenFree(cleanName, resolvedCat) ? 'yes' : 'auto',
        expiryDate: expStr,
        addedAt: todayStr,
        addedTimestamp: stamp,
        updatedAt: stamp,
        fromMobile: true
      };
    });
    const nextStock = [...newItems, ...safeStock];
    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter(it => !it.done)
    } : n);
    setPantryItems(nextStock);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ pantryItems: nextStock, familyNotes: nextNotes });
    showToast('Einkauf eingelagert!', newItems.length + ' Artikel in Bestand übernommen.', '📦');
  };

  const handleClearDoneShopItems = async (doneList) => {
    if (!Array.isArray(doneList) || doneList.length === 0) return;
    lastLocalEditRef.current = Date.now();
    await markShopItemsPermanentlyRemoved(doneList);

    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter(it => !it.done)
    } : n);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ familyNotes: nextNotes });
    showToast('Erledigte geleert!', doneList.length + ' erledigte Einkäufe entfernt.', '🗑️');
  };

  const handlePocketLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();
    if (!cleanUser || !cleanPass) return;

    setIsLoggingIn(true);
    try {
      const res = await callCloudBackend({
        action: 'loginAccount',
        accountId: cleanUser,
        authKey: cleanPass
      });
      if (!res || res.ok === false) {
        setLoginError(res?.error || 'Login fehlgeschlagen.');
        setIsLoggingIn(false);
        return;
      }
      setAccountId(cleanUser);
      setAuthKey(cleanPass);
      applyRemoteBundle(res, false);
      const title = res?.state?.familyName || ('Familie ' + cleanUser);
      setFamilyName(title);
      writeAuthSession(cleanUser, cleanPass, title);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError('Verbindungsfehler.');
    } finally {
      setIsLoggingIn(false);
    }
  };
