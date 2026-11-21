// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

//
//
// ============================================================================
// PART 01: IMPORTS, KONSTANTEN & KOMPONENTEN-EINBINDUNG
// ============================================================================
//
//

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, CheckSquare, ShoppingCart, Package, Camera,
  RefreshCw, LogOut, Cloud, Trash2, Check, X,
  BellRing, Download, WifiOff, Menu, SlidersHorizontal,
  Search, RotateCcw, Wand2, AlertTriangle, Pencil, CheckCircle2,
  Utensils, ChefHat, Tag, FileText, GraduationCap, Swords, Palette
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';
import AuthScreen from '../AuthScreen';
import {
  getFoodEmoji,
  FOOD_CATEGORIES,
  detectFoodCategory
} from '../PantrySection';
// import { useTouchwallRealtime } from '../useTouchwallRealtime';
// import { openCookieSettingsModal } from '../CookieConsent';
import OtherSections from '../OtherSections';
import MealPlanSection from '../MealPlanSection';
import NotesSection from '../NotesSection';
import PantryRecipes from '../PantryRecipes';
import PantryOffers from '../PantryOffers';
import SchoolSection from '../SchoolSection';
import QuestSection from '../quest';
import SettingsSection from '../SettingsSection';
import PocketAgenda from './PocketAgenda';
import PocketTasks from './PocketTasks';
import PocketScanner from './PocketScanner';
import PocketShopping from './PocketShopping';

// >>> HINWEIS: Falls deine Datei vorher Imports für STORAGE_PILLS, ProductThumb,
// playMobileBeep, loadLocalSyncMeta, saveLocalSyncMeta, mergePantryChannelSafe etc.
// aus einer lokalen Helper-Datei hatte, diese 1-2 Import-Zeilen hier wieder einfügen! <<<

const SHOW_OAUTH_UI = process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true';

const {
  PUBLIC_CLOUD_BACKEND_URL,
  DEFAULT_MEMBERS,
  DEFAULT_MEALS,
  DEFAULT_NOTES,
  DEFAULT_SCHOOL,
  COLOR_PALETTES,
  formatDateStr,
  addDays,
  buildThemeStyles,
  buildMemberStyles,
  callCloudApi,
  discoverTodoistWorkspace,
  pullFromTodoistTwoWay,
  createTodoistTaskItem,
  closeOrReopenTodoistTask,
  deleteTodoistTask
} = Cfg;

//
//
// ============================================================================
// PART 02: PRODUKT-, MARKEN- & GLUTENFREI-HELFER
// ============================================================================
//
//

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

//
//
// ============================================================================
// PART 03: AUTH-, DATUMS- & SYNC-RECONCILIATION-HELFER
// ============================================================================
//
//

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

//
//
// ============================================================================
// PART 04: HAUPTKOMPONENTE, STATES, REFS & BERECHNETE LISTEN (MEMOS)
// ============================================================================
//
//

export default function TouchwallPocketApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authTab, setAuthTab] = useState('login');
  const [accountId, setAccountId] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [familyName, setFamilyName] = useState('Touchwall Pocket');

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [loginFamilyName, setLoginFamilyName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('scanner');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [todayStr, setTodayStr] = useState(() => formatDateStr(new Date()));

  const [quickCockpitOpen, setQuickCockpitOpen] = useState(false);

  // Fliegendes Kategorie-Karussell, Live-Drag-Wischen & 2-Sek.-Blink-Anzeige
  const [categoryTrayOpen, setCategoryTrayOpen] = useState(false);
  const [swipeDragX, setSwipeDragX] = useState(0);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);
  const [slideAnimClass, setSlideAnimClass] = useState('');
  const [categoryFlashInfo, setCategoryFlashInfo] = useState(null);
  const categoryFlashTimerRef = useRef(null);
  const slideAnimTimerRef = useRef(null);

  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [familyTasks, setFamilyTasks] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [pantryItems, setPantryItems] = useState([]);
  const [pantryTrash, setPantryTrash] = useState([]);
  const [skillBoardData, setSkillBoardData] = useState(null);
  const [todoistConfig, setTodoistConfig] = useState({
    apiToken: '',
    shoppingProjectId: '',
    tasksProjectId: '',
    projects: [],
    collaborators: []
  });

  // Schule: Aktiver Stundenplan & Fach-Editor-Modal
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [schoolModal, setSchoolModal] = useState({
    open: false,
    dayIdx: 0,
    periodIdx: 0,
    subject: '',
    room: '',
    status: 'normal'
  });

  // Konten- & Diagnose-States (wie Touchwall)
  const [appsScriptUrl, setAppsScriptUrl] = useState(PUBLIC_CLOUD_BACKEND_URL);
  const [diagResult, setDiagResult] = useState(null);
  const [isTestingDiag, setIsTestingDiag] = useState(false);

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
    barcode: '',
    name: '',
    quantity: '1x',
    location: 'fridge',
    category: 'produce',
    glutenFree: 'auto',
    expiryDate: '',
    customEmoji: '',
    imageUrl: ''
  });
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);

  const [notifPermission, setNotifPermission] = useState('default');
  const [showPermissionOnboarding, setShowPermissionOnboarding] = useState(false);
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
  const swipeRef = useRef({ x: 0, y: 0, blocked: false, axis: null });

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return () => {
      if (categoryFlashTimerRef.current) clearTimeout(categoryFlashTimerRef.current);
      if (slideAnimTimerRef.current) clearTimeout(slideAnimTimerRef.current);
    };
  }, []);

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

  //
  //
  // ============================================================================
  // PART 05: PWA, PUSH-BENACHRICHTIGUNGEN, MHD-WÄCHTER & UI-HELFER
  // ============================================================================
  //
  //

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

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const isStandalonePwa =
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        window.navigator?.standalone === true;
      const onboardingDone = localStorage.getItem('richter_tw_pocket_perms_done') === '1';

      if (Notification.permission === 'default' && (!onboardingDone || isStandalonePwa)) {
        setShowPermissionOnboarding(true);
      }
    } catch (e) {}
  }, [isAuthenticated]);

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
      const appIconUrl = window.location.origin + '/icon-512.png';
      const notifOptions = {
        body: bodyText,
        icon: appIconUrl,
        badge: appIconUrl,
        vibrate: vibrationPattern,
        renotify: true,
        tag: tagId || ('tw-push-' + Date.now()),
        data: { url: '/pocket' }
      };

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, notifOptions);
        } else {
          new Notification(title, notifOptions);
        }
      } catch (e) {}
    }
  };

  const handleGrantAllPermissions = async () => {
    playMobileBeep('shopping');
    try { navigator.vibrate?.([150, 80, 150]); } catch (e) {}

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('/sw.js'); } catch (e) {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          await sendPhonePushNotification(
            '✅ ' + familyName + ' ist bereit!',
            'Benachrichtigungen für Einkäufe, Termine und MHD-Warnungen sind aktiv.',
            'tw-onboarding-ok'
          );
          showToast('Alle Zugriffe aktiv!', 'Benachrichtigungen mit App-Logo sind eingeschaltet.', '🔔');
        } else {
          showToast('Hinweis', 'Bitte Benachrichtigungen in den Handy-Einstellungen zulassen.', '⚠️');
        }
      } catch (e) {}
    }

    try { localStorage.setItem('richter_tw_pocket_perms_done', '1'); } catch (e) {}
    setShowPermissionOnboarding(false);
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
    '}',
    '.tw-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }',
    '.tw-no-scrollbar::-webkit-scrollbar { display: none; }',
    '@keyframes twSlideFromRight { 0% { opacity: 0.35; transform: translate3d(42px, 0, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }',
    '@keyframes twSlideFromLeft { 0% { opacity: 0.35; transform: translate3d(-42px, 0, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }',
    '.tw-slide-in-right { animation: twSlideFromRight 280ms cubic-bezier(0.22, 1, 0.36, 1); }',
    '.tw-slide-in-left { animation: twSlideFromLeft 280ms cubic-bezier(0.22, 1, 0.36, 1); }',
    '@keyframes twTrayFloatUp { 0% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.95); } 100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }',
    '.tw-tray-float { animation: twTrayFloatUp 220ms cubic-bezier(0.22, 1, 0.36, 1); }',
    '@keyframes twCatBlink {',
    '  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.65); }',
    '  25%, 70% { box-shadow: 0 0 22px 2px rgba(56, 189, 248, 0.75); border-color: #7dd3fc; }',
    '  50% { box-shadow: 0 0 10px 0 rgba(245, 158, 11, 0.55); border-color: #fbbf24; }',
    '}',
    '.tw-cat-flash {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  animation: twCatBlink 1.0s ease-in-out 2;',
    '}'
  ].join('\n');

  //
  //
  // ============================================================================
  // PART 06: CLOUD-BACKEND, REALTIME-SYNC & INITIALISIERUNG
  // ============================================================================
  //
  //

  const clearInvalidSessionAndLock = (reasonMsg = '') => {
    try {
      localStorage.removeItem('richter_tw_auth_active');
      localStorage.removeItem('richter_tw_account_id');
      localStorage.removeItem('richter_tw_auth_key');
      localStorage.removeItem('richter_touchwall_events_cache');
      document.cookie = 'tw_auth_session=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'tw_account_id=; path=/; max-age=0; SameSite=Lax';
    } catch (e) {}
    setAccountId('');
    setAuthKey('');
    setIsAuthenticated(false);
    setShowPermissionOnboarding(false);
    if (reasonMsg) setLoginError(reasonMsg);
  };

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

        if (bundle?.ok === false) {
          const errMsg = String(bundle?.error || '');
          const isAuthFail =
            !activeKey ||
            /auth|passwort|pin|key|konto|ungültig|nicht gefunden|abgelaufen|unauthorized|forbidden/i.test(errMsg);
          if (isAuthFail) {
            clearInvalidSessionAndLock(errMsg || 'Sitzung abgelaufen. Bitte erneut anmelden.');
            return;
          }
        }

        if (!showFeedback && !isRealtimeTrigger && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 6000)) {
          return;
        }
        if (bundle?.ok) {
          const hasTodoistToken = Boolean(
            bundle?.state?.todoistConfig?.apiToken?.trim() || todoistConfig?.apiToken?.trim()
          );
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
      const oauthOk = params.get('oauth_ok');
      const oauthIntent = params.get('oauth_intent');
      const oauthErr = params.get('oauth_error');
      const qrAcc = params.get('account');
      const qrKey = params.get('key');
      const qrFamily = params.get('family');
      const savedPerson = localStorage.getItem('richter_tw_pocket_person');
      if (savedPerson) setSelectedPerson(savedPerson);

      if (oauthErr) {
        setLoginError(oauthErr);
        showToast('OAuth-Hinweis', oauthErr, '⚠️');
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (oauthOk && oauthIntent === 'login') {
        window.history.replaceState({}, '', window.location.pathname);
        fetch('/api/oauth/session', { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            const h = data?.handoff;
            if (h?.accountId && h?.authKey) {
              const title = h.familyName || ('Familie ' + h.accountId);
              setAccountId(h.accountId);
              setAuthKey(h.authKey);
              setFamilyName(title);
              writeAuthSession(h.accountId, h.authKey, title);
              setIsAuthenticated(true);
              showToast(
                'Mit ' + (h.provider === 'google' ? 'Google' : 'Outlook') + ' angemeldet!',
                title + ' geladen.',
                '🔓'
              );
              setTimeout(() => syncAllNowRef.current?.(false, h.accountId, h.authKey), 150);
            } else {
              setLoginError('OAuth-Sitzung abgelaufen. Bitte erneut anmelden.');
            }
          })
          .catch(() => setLoginError('OAuth-Sitzung konnte nicht geladen werden.'))
          .finally(() => setIsCheckingAuth(false));
        return;
      }

      if (oauthOk && oauthIntent === 'link') {
        window.history.replaceState({}, '', window.location.pathname);
        showToast(
          'OAuth verknüpft ✓',
          (oauthOk === 'google' ? 'Google' : 'Outlook / Microsoft') + ' wurde erfolgreich verbunden!',
          '🔗'
        );
      }

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

      const isCurrentlyOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

      if (isCurrentlyOnline) {
        localStorage.removeItem('richter_touchwall_events_cache');
        pendingCalendarOpsRef.current = {};
        if (syncMetaRef.current) {
          syncMetaRef.current.deletedEventIds = {};
          saveLocalSyncMeta(syncMetaRef.current);
        }
      } else {
        const savedEv = localStorage.getItem('richter_touchwall_events_cache');
        if (savedEv) {
          try {
            const parsedEv = JSON.parse(savedEv);
            if (Array.isArray(parsedEv)) setEvents(parsedEv);
          } catch (e) {}
        }
      }

      const hasValidSession = Boolean(
        session.active &&
        session.accountId &&
        (session.accountId === 'local' || session.authKey)
      );

      if (hasValidSession) {
        setAccountId(session.accountId);
        setAuthKey(session.authKey);
        setIsAuthenticated(true);
        if (session.accountId !== 'local') {
          setTimeout(() => syncAllNowRef.current?.(false, session.accountId, session.authKey), 150);
        }
      } else if (session.active) {
        clearInvalidSessionAndLock('');
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  useTouchwallRealtime(isAuthenticated && accountId && accountId !== 'local' ? accountId : '', (scope) => {
    syncAllNowRef.current?.(false, undefined, undefined, true, scope || 'all');
  });

  useEffect(() => {
    if (!isAuthenticated || !accountId || accountId === 'local') return;

    const onAppVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      if (isNetworkSavingRef.current) return;

      try {
        localStorage.removeItem('richter_touchwall_events_cache');
      } catch (e) {}
      pendingCalendarOpsRef.current = {};
      if (syncMetaRef.current) {
        syncMetaRef.current.deletedEventIds = {};
        saveLocalSyncMeta(syncMetaRef.current);
      }
      lastLocalEditRef.current = 0;
      syncAllNowRef.current?.(false);
    };

    document.addEventListener('visibilitychange', onAppVisible);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllNowRef.current?.(false);
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onAppVisible);
      clearInterval(interval);
    };
  }, [isAuthenticated, accountId, authKey]);

  const handleSelectPersonFilter = (personId) => {
    setSelectedPerson(personId);
    try { localStorage.setItem('richter_tw_pocket_person', personId); } catch (e) {}
  };

//
  //
  // ============================================================================
  // PART 07: EINKAUFSWAGEN-, VORRATS- & MÜLLEIMER-HANDLER
  // ============================================================================
  //
  //

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
      barcode: item.barcode || '',
      name: item.name || '',
      quantity: item.quantity || '1x',
      location: item.location || 'fridge',
      category: detectSmartCategory(item.name, item.category),
      glutenFree: initialGf,
      expiryDate: item.expiryDate || todayStr,
      customEmoji: item.customEmoji || getFoodEmoji(item.name),
      imageUrl: item.imageUrl || ''
    });
  };

  const handleEditStockPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isUploadingEditPhoto) return;
    setIsUploadingEditPhoto(true);
    showToast('Lade Produktfoto hoch...', 'Wird komprimiert & in Supabase gespeichert...', '📸');
    try {
      const publicUrl = await uploadProductPhotoToSupabase({
        source: file,
        accountId: accountId || 'local',
        barcode: editStockModal.barcode || ''
      });
      setEditStockModal(prev => ({ ...prev, imageUrl: publicUrl }));
      playMobileBeep('scan');
      showToast('Produktfoto gespeichert! ✅', 'Jetzt noch auf „Speichern“ tippen.', '🖼️');
    } catch (err) {
      showToast('Foto-Upload fehlgeschlagen', err?.message || 'Bitte erneut versuchen.', '⚠️');
    } finally {
      setIsUploadingEditPhoto(false);
    }
  };

  const handleSaveEditStockModal = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editStockModal.name.trim() || !editStockModal.expiryDate) {
      showToast('Pflichtfelder', 'Bitte Name und Ablaufdatum (MHD) ausfüllen.', '⚠️');
      return;
    }

    const now = Date.now();
    lastLocalEditRef.current = now;
    const cleanName = editStockModal.name.trim();
    const cleanQty = editStockModal.quantity.trim() || '1x';
    const nextImageUrl = editStockModal.imageUrl || '';

    const nextStock = safeStock.map(it =>
      it.id === editStockModal.id
        ? {
            ...it,
            name: cleanName,
            quantity: cleanQty,
            location: editStockModal.location,
            category: editStockModal.category,
            glutenFree: editStockModal.glutenFree,
            expiryDate: editStockModal.expiryDate,
            customEmoji: editStockModal.customEmoji,
            imageUrl: nextImageUrl,
            updatedAt: now,
            fromMobile: true
          }
        : it
    );
    setPantryItems(nextStock);
    setEditStockModal({ ...editStockModal, open: false });

    if (editStockModal.barcode && cleanName) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: editStockModal.barcode,
          name: cleanName,
          quantity: cleanQty,
          location: editStockModal.location,
          category: editStockModal.category,
          glutenFree: editStockModal.glutenFree,
          imageUrl: nextImageUrl
        })
      }).catch(() => {});
    }

    await saveStateToCloud({ pantryItems: nextStock });
    showToast('Gespeichert & synchronisiert!', cleanName, editStockModal.customEmoji || '✅');
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

  //
  //
  // ============================================================================
  // PART 08: KALENDER-, AUFGABEN-, EINKAUFS-, KONTEN- & AUTH-HANDLER
  // ============================================================================
  //
  //

  const handleCreateMobileEvent = async ({
    title,
    date,
    time,
    member,
    notifyTime = '30m',
    notifyChannel = 'wall_push',
    notifyUsers
  }) => {
    lastLocalEditRef.current = Date.now();
    const newEv = {
      id: String(Date.now()),
      title,
      date,
      time,
      member,
      notifyTime,
      notifyChannel,
      notifyUsers: Array.isArray(notifyUsers) && notifyUsers.length > 0 ? notifyUsers : [member],
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

  const handleUpdateMobileEvent = async (originalEv, updatedFields) => {
    if (!originalEv) return;
    lastLocalEditRef.current = Date.now();
    const updatedEv = {
      ...originalEv,
      ...updatedFields,
      title: String(updatedFields?.title || originalEv.title || '').trim(),
      fromGoogle: true,
      fromMobile: true
    };

    registerPendingCalendarOp(pendingCalendarOpsRef, 'update', updatedEv);
    setEvents(prev =>
      (Array.isArray(prev) ? prev : []).map(item =>
        String(item.id) === String(originalEv.id) ? updatedEv : item
      )
    );
    showToast('Termin aktualisiert', updatedEv.title, '✏️');

    if (accountId && accountId !== 'local') {
      try {
        const res = await callCloudBackend({
          action: 'updateEvent',
          event: updatedEv,
          oldMember: originalEv.member || updatedEv.member,
          oldTitle: originalEv.title || updatedEv.title,
          oldDate: originalEv.date || updatedEv.date
        });
        if (res?.ok && res?.result?.events) {
          setEvents(mergeCalendarEventsSafe(res.result.events, pendingCalendarOpsRef, syncMetaRef.current));
          return;
        }
        await callCloudBackend({
          action: 'deleteEvent',
          eventId: String(originalEv.id),
          member: originalEv.member,
          title: originalEv.title,
          date: originalEv.date
        });
        const createRes = await callCloudBackend({ action: 'createEvent', event: updatedEv });
        if (createRes?.result?.events) {
          setEvents(mergeCalendarEventsSafe(createRes.result.events, pendingCalendarOpsRef, syncMetaRef.current));
        }
      } catch (err) {}
    }
  };

  const handleDuplicateMobileEvent = async (sourceEv, targetMemberId, targetDateStr) => {
    if (!sourceEv) return;
    lastLocalEditRef.current = Date.now();
    const newDate = targetDateStr || sourceEv.date || todayStr;
    const newMember = targetMemberId || sourceEv.member || 'all';
    const targetM = safeMembers.find(m => m.id === newMember);

    const copiedNewEv = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      title: String(sourceEv.title || 'Termin').trim(),
      date: newDate,
      time: sourceEv.time || 'Ganztägig',
      member: newMember,
      notifyTime: sourceEv.notifyTime || '30m',
      notifyChannel: sourceEv.notifyChannel || 'wall_push',
      notifyUsers: newMember === 'all'
        ? safeMembers.filter(m => m.id !== 'all').map(m => m.id)
        : [newMember],
      fromGoogle: true,
      fromMobile: true
    };

    registerPendingCalendarOp(pendingCalendarOpsRef, 'create', copiedNewEv);
    setEvents(prev => [...(Array.isArray(prev) ? prev : []), copiedNewEv]);
    showToast(
      'Termin kopiert!',
      '„' + copiedNewEv.title + '“ → ' + (targetM ? targetM.name : newMember) + ' (' + newDate + ')',
      '📋'
    );

    if (accountId && accountId !== 'local') {
      try {
        const res = await callCloudBackend({ action: 'createEvent', event: copiedNewEv });
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
      imageUrl: '',
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
        imageUrl: '',
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
    lastLocalEditRef.current = now;
    await markShopItemsPermanentlyRemoved(doneList);

    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter(it => !it.done)
    } : n);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ familyNotes: nextNotes });
    showToast('Erledigte geleert!', doneList.length + ' erledigte Einkäufe entfernt.', '🗑️');
  };

  const createAndSelectTodoistProject = async (projectName) => {
    const token = (todoistConfig?.apiToken || '').trim();
    if (!token || !projectName?.trim()) return null;
    try {
      const createFn = Cfg.createNewTodoistProject || (async (tk, name) => Cfg.todoistFetch(tk, '/projects', { method: 'POST', rawBody: { name } }));
      const created = await createFn(token, projectName.trim());
      if (created?.id) {
        setTodoistConfig(prev => ({
          ...prev,
          projects: [...(Array.isArray(prev?.projects) ? prev.projects : []), created]
        }));
        showToast('Projekt erstellt', 'Todoist-Projekt „' + created.name + '“ wurde angelegt!', '📂');
        return created;
      }
    } catch (err) {
      showToast('Projekt-Fehler', err.message, '❌');
    }
    return null;
  };

  const connectAndDiscoverTodoist = async () => {
    if (!todoistConfig?.apiToken?.trim()) {
      showToast('Token fehlt', 'Bitte zuerst dein Todoist API-Token eintragen.', '⚠️');
      return;
    }
    setIsSyncing(true);
    try {
      const disc = await discoverTodoistWorkspace(todoistConfig.apiToken);
      const nextCfg = {
        ...todoistConfig,
        projects: Array.isArray(disc?.projects) ? disc.projects : [],
        shoppingProjectId: todoistConfig.shoppingProjectId || disc?.shoppingProjectId || '',
        tasksProjectId: todoistConfig.tasksProjectId || disc?.tasksProjectId || '',
        collaborators: Array.isArray(disc?.collaborators) ? disc.collaborators : []
      };
      setTodoistConfig(nextCfg);
      if (nextCfg.collaborators.length > 0) {
        setMembers(prev => (Array.isArray(prev) ? prev : DEFAULT_MEMBERS).map(m => {
          if (m.id === 'all' || m.todoistUserId) return m;
          const match = nextCfg.collaborators.find(c =>
            c.name?.toLowerCase().includes(m.name.toLowerCase()) ||
            c.email?.toLowerCase().includes(m.id.toLowerCase())
          );
          return match ? { ...m, todoistUserId: String(match.id) } : m;
        }));
      }
      showToast('Todoist verbunden!', nextCfg.projects.length + ' Projekte geladen.', '🎉');
      await syncAllNow(false);
    } catch (err) {
      showToast('Todoist-Fehler', err.message, '❌');
    } finally {
      setIsSyncing(false);
    }
  };

  const pushToCloudAndDrive = async (customMembersList, showFeedback = true) => {
    const listToSave = Array.isArray(customMembersList) ? customMembersList : safeMembers;
    const calMap = {};
    listToSave.forEach(m => { calMap[m.id] = (m.calendarId || '').trim(); });
    const payload = {
      isConfigured: true,
      familyName,
      members: listToSave,
      calendars: calMap,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData,
      familyTasks: safeTasks,
      pantryItems: safeStock,
      pantryTrash: safeTrash,
      skillBoardData: preservedWallStateRef.current.skillBoardData || null,
      syncMeta: syncMetaRef.current,
      currentTheme,
      customLogoUrl: preservedWallStateRef.current.customLogoUrl || '',
      todoistConfig
    };
    setIsSyncing(true);
    try {
      const res = await callCloudBackend({ action: 'saveDriveAndSync', payload, calendars: calMap });
      if (res?.result?.events) {
        setEvents(mergeCalendarEventsSafe(res.result.events, pendingCalendarOpsRef, syncMetaRef.current));
      }
      if (showFeedback) showToast('Gespeichert', 'Alle Konten & Daten wurden gesichert.', '✅');
    } catch (err) {
      if (showFeedback) showToast('Fehler', 'Speichern fehlgeschlagen.', '⚠️');
    } finally {
      setIsSyncing(false);
    }
  };

  const runAllPermissionsTest = async () => {
    setIsTestingDiag(true);
    try {
      const res = await callCloudBackend({ action: 'runDiagnostics' });
      if (res?.result) setDiagResult(res.result);
    } catch (e) {} finally {
      setIsTestingDiag(false);
    }
  };

  const addExtraCalendarAccount = () => {
    const name = prompt('Name für neuen Kalender / Person:');
    if (!name?.trim()) return;
    const calId = prompt('Google Kalender-ID (leer lassen für Cloud-Kalender):') || '';
    setMembers(prev => [
      ...(Array.isArray(prev) ? prev : DEFAULT_MEMBERS),
      {
        id: 'cal_' + Date.now(),
        name: name.trim(),
        role: 'Zusatz',
        badge: name.trim().charAt(0).toUpperCase(),
        color: 'teal_bold',
        avatarType: 'emoji',
        emoji: '📅',
        calendarId: calId.trim(),
        todoistProjectId: '',
        ok: true
      }
    ]);
  };

  const importBackupJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (Array.isArray(d.members)) setMembers(d.members);
        if (Array.isArray(d.mealPlan)) setMealPlan(d.mealPlan);
        if (Array.isArray(d.familyNotes)) setFamilyNotes(d.familyNotes);
        if (d.schoolData) setSchoolData(d.schoolData);
        if (Array.isArray(d.familyTasks)) setFamilyTasks(d.familyTasks);
        if (Array.isArray(d.pantryItems)) setPantryItems(d.pantryItems);
        if (Array.isArray(d.pantryTrash)) setPantryTrash(d.pantryTrash);
        showToast('Import erfolgreich', 'Backup wurde wiederhergestellt.', '🎉');
      } catch (err) {}
    };
    r.readAsText(f);
  };

  const exportBackupJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      familyName,
      members: safeMembers,
      events: safeEvents,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData,
      familyTasks: safeTasks,
      pantryItems: safeStock,
      pantryTrash: safeTrash,
      todoistConfig
    }, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'touchwall_backup_' + todayStr + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePocketLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError('Bitte Benutzername und Passwort eingeben.');
      return;
    }

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

  const handlePocketRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();
    const cleanEmail = formEmail.trim().toLowerCase();
    const chosenTitle = loginFamilyName.trim() || ('Familie ' + (cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1)));

    if (cleanUser.length < 3) {
      setLoginError('Bitte wähle einen Benutzernamen mit mindestens 3 Zeichen.');
      return;
    }
    if (cleanPass.length < 4) {
      setLoginError('Das Passwort / PIN muss mindestens 4 Zeichen lang sein.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await callCloudBackend({
        action: 'registerAccount',
        accountId: cleanUser,
        authKey: cleanPass,
        email: cleanEmail,
        payload: {
          isConfigured: true,
          familyName: chosenTitle,
          members: DEFAULT_MEMBERS,
          mealPlan: DEFAULT_MEALS,
          familyNotes: DEFAULT_NOTES,
          schoolData: DEFAULT_SCHOOL,
          familyTasks: [],
          pantryItems: [],
          pantryTrash: [],
          skillBoardData: null,
          currentTheme: 'metal',
          customLogoUrl: '',
          todoistConfig: { apiToken: '', shoppingProjectId: '', tasksProjectId: '', projects: [], collaborators: [] }
        }
      });

      if (!res || res.ok === false) {
        setLoginError(res?.error || 'Registrierung fehlgeschlagen.');
        setIsLoggingIn(false);
        return;
      }

      setAccountId(cleanUser);
      setAuthKey(cleanPass);
      setFamilyName(chosenTitle);
      setMembers(DEFAULT_MEMBERS);
      setEvents([]);
      setFamilyTasks([]);
      setPantryItems([]);
      setPantryTrash([]);
      writeAuthSession(cleanUser, cleanPass, chosenTitle);
      setIsAuthenticated(true);
      if (res.recoveryCode) {
        showToast('Konto erstellt! Notfall-Code:', res.recoveryCode, '🔑');
      } else {
        showToast('Konto erstellt!', chosenTitle + ' ist jetzt bereit.', '🎉');
      }
    } catch (err) {
      setLoginError('Verbindungsfehler bei der Registrierung.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const startPocketOAuthLink = (provider) => {
    if (!accountId || accountId === 'local' || typeof window === 'undefined') {
      showToast('Cloud-Konto nötig', 'Bitte zuerst mit einem Cloud-Konto anmelden.', '⚠️');
      return;
    }
    const targetMember = selectedPerson && selectedPerson !== 'all' ? selectedPerson : 'account';
    window.location.href =
      '/api/oauth/start?provider=' + encodeURIComponent(provider) +
      '&intent=link&accountId=' + encodeURIComponent(accountId) +
      '&memberId=' + encodeURIComponent(targetMember) +
      '&returnTo=/pocket';
  };

  // ============================================================================
  // HANDLER FÜR ESSENSPLAN, NOTIZEN, SCHULE, SKILL BOARD & DESIGN (POCKET)
  // ============================================================================

  const updateMealPlanAndSync = (updater) => {
    setMealPlan(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStateToCloud({ mealPlan: next });
      return next;
    });
  };

  const updateNotesAndSync = (updater) => {
    setFamilyNotes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStateToCloud({ familyNotes: next });
      return next;
    });
  };

  const updateSchoolDataAndSync = (updater) => {
    setSchoolData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveStateToCloud({}), 80);
      return next;
    });
  };

  const handleSkillBoardUpdate = (nextBundle) => {
    setSkillBoardData(nextBundle);
    preservedWallStateRef.current = {
      ...preservedWallStateRef.current,
      skillBoardData: nextBundle
    };
    saveStateToCloud({});
  };

  const handleAddShoppingItemsBatch = (itemsArray) => {
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return;
    itemsArray.forEach(txt => {
      if (String(txt || '').trim()) handleAddQuickShopItem(String(txt).trim());
    });
    showToast('Einkaufsliste ergänzt 🛒', itemsArray.length + ' Zutat(en) übertragen.', '🛒');
  };

  const handleAddItemToNoteTile = (noteId, text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    updateNotesAndSync(prev =>
      (Array.isArray(prev) ? prev : []).map(n =>
        n.id === noteId
          ? { ...n, items: [...(Array.isArray(n.items) ? n.items : []), { text: clean, done: false, updatedAt: Date.now(), fromMobile: true }] }
          : n
      )
    );
  };

  const handleToggleItemInNoteTile = (noteId, itemIdx) => {
    updateNotesAndSync(prev =>
      (Array.isArray(prev) ? prev : []).map(n =>
        n.id === noteId
          ? {
              ...n,
              items: (Array.isArray(n.items) ? n.items : []).map((it, idx) =>
                idx === itemIdx ? { ...it, done: !it.done, updatedAt: Date.now(), fromMobile: true } : it
              )
            }
          : n
      )
    );
  };

  const handleDeleteItemInNoteTile = (noteId, itemIdx) => {
    updateNotesAndSync(prev =>
      (Array.isArray(prev) ? prev : []).map(n =>
        n.id === noteId
          ? { ...n, items: (Array.isArray(n.items) ? n.items : []).filter((_, idx) => idx !== itemIdx) }
          : n
      )
    );
  };

  const handleAddNewTaskFromSchool = async (
    title,
    memberId,
    dueDate = todayStr,
    dueTime = '17:00',
    notifyTime = '15m',
    _alsoCalendar = false,
    priority = 3,
    description = ''
  ) => {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) return;
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: cleanTitle,
      description: description || '',
      member: memberId || 'hans',
      dueDate: dueDate || todayStr,
      dueTime: dueTime || '17:00',
      notifyTime: notifyTime || '15m',
      priority: Number(priority) || 3,
      done: false,
      updatedAt: Date.now(),
      fromMobile: true
    };
    const nextTasks = [newTask, ...safeTasks];
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
  };

  const handleSaveSchoolSlotModal = (e) => {
    e.preventDefault();
    const key = schoolModal.dayIdx + '-' + schoolModal.periodIdx;
    updateSchoolDataAndSync(prev => {
      const cur = prev?.[activeSchoolChild] || {};
      const nextSlots = { ...(cur.slots || {}) };
      if (!schoolModal.subject.trim()) {
        delete nextSlots[key];
      } else {
        nextSlots[key] = {
          subject: schoolModal.subject.trim(),
          room: schoolModal.room.trim(),
          status: schoolModal.status || 'normal'
        };
      }
      return {
        ...(prev || {}),
        [activeSchoolChild]: {
          ...cur,
          slots: nextSlots
        }
      };
    });
    setSchoolModal(prev => ({ ...prev, open: false }));
    showToast('Stundenplan gespeichert', 'Änderung wurde übernommen.', '🎓');
  };

  const handleLogoUploadPocket = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setCustomLogoUrl(dataUrl);
      preservedWallStateRef.current = { ...preservedWallStateRef.current, customLogoUrl: dataUrl };
      saveStateToCloud({});
      showToast('Logo aktualisiert', 'Neues Logo in der Cloud gespeichert.', '🎨');
    };
    reader.readAsDataURL(file);
  };

  const handleMemberPhotoUploadPocket = (memberId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setMembers(prev => {
        const next = (Array.isArray(prev) ? prev : []).map(m =>
          m.id === memberId ? { ...m, photoUrl: dataUrl, avatarType: 'photo' } : m
        );
        setTimeout(() => saveStateToCloud({}), 80);
        return next;
      });
      showToast('Profilfoto gespeichert', 'Avatar wurde aktualisiert.', '📸');
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreDesignDefaultsPocket = () => {
    setCurrentTheme('metal');
    setMembers(DEFAULT_MEMBERS);
    setTimeout(() => saveStateToCloud({}), 80);
    showToast('Standard-Design aktiv', 'Farben & Theme zurückgesetzt.', '🔄');
  };

  //
  //
  // ============================================================================
  // PART 09: AUTH-GUARD, FILTER-LISTEN & KATEGORIEN-WISCH-STEUERUNG
  // ============================================================================
  //
  //

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <AuthScreen
        isCheckingAuth={isCheckingAuth}
        themeStyles={themeStyles}
        authTab={authTab}
        setAuthTab={setAuthTab}
        loginError={loginError}
        setLoginError={setLoginError}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        loginFamilyName={loginFamilyName}
        setLoginFamilyName={setLoginFamilyName}
        isLoggingIn={isLoggingIn}
        handleAccountLoginSubmit={handlePocketLogin}
        handleRegisterSubmit={handlePocketRegister}
        returnTo="/pocket"
        isPocket={true}
      />
    );
  }

  const filteredEvents = safeEvents.filter(ev =>
    selectedPerson === 'all' || ev.member === selectedPerson || ev.member === 'all'
  );
  const filteredTasks = safeTasks.filter(t => selectedPerson === 'all' || t.member === selectedPerson);
  const openTasks = filteredTasks.filter(t => !t.done);
  const doneTasks = filteredTasks.filter(t => t.done);
  const shopItems = Array.isArray(safeNotes[0]?.items) ? safeNotes[0].items : [];
  const openShop = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => !it.done);
  const doneShop = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => it.done);

  const activePersonObj = safeMembers.find(m => m.id === selectedPerson);

  const POCKET_TABS = [
    { id: 'agenda',     label: 'Kalender',    icon: Calendar,      badge: filteredEvents.filter(e => e.date === todayStr).length },
    { id: 'tasks',      label: 'Aufgaben',    icon: CheckSquare,   badge: openTasks.length },
    { id: 'scanner',    label: 'Scanner',     icon: Camera,        badge: safeCart.length },
    { id: 'shopping',   label: 'Einkauf',     icon: ShoppingCart,  badge: openShop.length + safeCart.length },
    {
      id: 'stock',
      label: 'Bestand',
      icon: Package,
      badge: mhdAlertGroups.finalToday.length + mhdAlertGroups.warnTwoDays.length > 0
        ? (mhdAlertGroups.finalToday.length + mhdAlertGroups.warnTwoDays.length)
        : safeStock.length,
      urgent: mhdAlertGroups.finalToday.length > 0
    },
    { id: 'essen',      label: 'Essensplan',  icon: Utensils,      badge: 0 },
    { id: 'rezepte',    label: 'Rezepte',     icon: ChefHat,       badge: 0 },
    { id: 'angebote',   label: 'Angebote',    icon: Tag,           badge: 0 },
    { id: 'listen',     label: 'Notizen',     icon: FileText,      badge: 0 },
    { id: 'schule',     label: 'Schule',      icon: GraduationCap, badge: 0 },
    { id: 'skillboard', label: 'Skill Board', icon: Swords,        badge: 0 },
    { id: 'design',     label: 'Design',      icon: Palette,       badge: 0 },
    { id: 'accounts',   label: 'Konten',      icon: Cloud,         badge: 0 }
  ];

  const FLOATING_CATEGORY_TABS = POCKET_TABS.filter(t => t.id !== 'scanner');

  const switchCategorySmooth = (nextTabId, explicitDir = null, triggerBottomFlash = false) => {
    if (!nextTabId || nextTabId === activeTab) {
      setCategoryTrayOpen(false);
      return;
    }

    const oldIdx = POCKET_TABS.findIndex(t => t.id === activeTab);
    const newIdx = POCKET_TABS.findIndex(t => t.id === nextTabId);
    const dir = explicitDir || (newIdx >= oldIdx ? 'next' : 'prev');

    setActiveTab(nextTabId);
    setCategoryTrayOpen(false);

    if (slideAnimTimerRef.current) clearTimeout(slideAnimTimerRef.current);
    setSlideAnimClass('');
    requestAnimationFrame(() => {
      setSlideAnimClass(dir === 'next' ? 'tw-slide-in-right' : 'tw-slide-in-left');
      slideAnimTimerRef.current = setTimeout(() => setSlideAnimClass(''), 300);
    });

    if (triggerBottomFlash && nextTabId !== 'scanner') {
      const targetObj = POCKET_TABS.find(t => t.id === nextTabId);
      if (targetObj) {
        if (categoryFlashTimerRef.current) clearTimeout(categoryFlashTimerRef.current);
        setCategoryFlashInfo({ label: targetObj.label, icon: targetObj.icon });
        categoryFlashTimerRef.current = setTimeout(() => {
          setCategoryFlashInfo(null);
        }, 2000);
      }
    } else if (nextTabId === 'scanner') {
      if (categoryFlashTimerRef.current) clearTimeout(categoryFlashTimerRef.current);
      setCategoryFlashInfo(null);
    }
  };

  const handleMainTouchStart = (e) => {
    if (
      quickCockpitOpen ||
      editStockModal.open ||
      schoolModal.open ||
      restockPromptItem ||
      categoryTrayOpen ||
      e.touches.length !== 1
    ) {
      swipeRef.current = { x: 0, y: 0, blocked: true, axis: null };
      return;
    }
    const target = e.target;
    const isBlockedArea = Boolean(
      target?.closest?.('[data-no-swipe="true"], input, textarea, select, [class*="overflow-x-auto"]')
    );
    swipeRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      blocked: isBlockedArea,
      axis: null
    };
  };

  const handleMainTouchMove = (e) => {
    if (swipeRef.current.blocked || !e.touches?.[0]) return;
    const dx = e.touches[0].clientX - swipeRef.current.x;
    const dy = e.touches[0].clientY - swipeRef.current.y;

    if (!swipeRef.current.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.1) {
        swipeRef.current.axis = 'y';
        return;
      }
      swipeRef.current.axis = 'x';
      setIsSwipeDragging(true);
    }

    if (swipeRef.current.axis !== 'x') return;

    const currentIdx = POCKET_TABS.findIndex(t => t.id === activeTab);
    const atEdge = (dx > 0 && currentIdx <= 0) || (dx < 0 && currentIdx >= POCKET_TABS.length - 1);
    const damped = atEdge ? dx * 0.14 : dx * 0.42;
    setSwipeDragX(Math.max(-92, Math.min(92, damped)));
  };

  const handleMainTouchEnd = (e) => {
    const wasHorizontal = swipeRef.current.axis === 'x';
    const endX = e.changedTouches?.[0]?.clientX ?? swipeRef.current.x;
    const dx = endX - swipeRef.current.x;

    swipeRef.current.axis = null;
    setIsSwipeDragging(false);
    setSwipeDragX(0);

    if (swipeRef.current.blocked || !wasHorizontal) return;
    if (Math.abs(dx) < 56) return;

    const currentIdx = POCKET_TABS.findIndex(t => t.id === activeTab);
    if (currentIdx === -1) return;

    if (dx < 0 && currentIdx < POCKET_TABS.length - 1) {
      switchCategorySmooth(POCKET_TABS[currentIdx + 1].id, 'next', true);
    } else if (dx > 0 && currentIdx > 0) {
      switchCategorySmooth(POCKET_TABS[currentIdx - 1].id, 'prev', true);
    }
  };

  //
  //
  // ============================================================================
  // PART 10: HAUPT-LAYOUT & ALLE KATEGORIEN (OHNE VORRAT -> PART 11)
  // ============================================================================
  //
  //

  return (
    <div
      style={{
        '--tw-btn-from': themeStyles.btnFrom || '#0ea5e9',
        '--tw-btn-to': themeStyles.btnTo || '#4f46e5',
        '--tw-btn-border': themeStyles.btnBorder || '#38bdf8',
        '--tw-btn-glow': themeStyles.btnGlow || 'rgba(56, 189, 248, 0.5)',
        '--tw-btn-rest-base': themeStyles.dark ? '#1e222d' : '#e2e8f0',
        '--tw-btn-rest-text': themeStyles.dark ? '#e2e8f0' : '#1e293b'
      }}
      className={'h-[100dvh] w-screen overflow-hidden flex flex-col select-none relative ' + themeStyles.outer}
    >
      <style>{pocketStyles}</style>

      <main
        onTouchStart={handleMainTouchStart}
        onTouchMove={handleMainTouchMove}
        onTouchEnd={handleMainTouchEnd}
        className={
          'flex-1 min-w-0 overflow-x-hidden ' +
          (activeTab === 'agenda'
            ? 'overflow-hidden flex flex-col p-0 pb-[72px] '
            : 'overflow-y-auto px-2.5 sm:px-4 pt-2.5 sm:pt-4 pb-24 ') +
          themeStyles.viewport
        }
      >
        <div
          style={{
            transform: swipeDragX !== 0 ? `translate3d(${swipeDragX}px, 0, 0)` : undefined,
            opacity: swipeDragX !== 0 ? Math.max(0.72, 1 - Math.abs(swipeDragX) / 260) : 1,
            transition: isSwipeDragging ? 'none' : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease'
          }}
          className={
            (activeTab === 'agenda' ? 'flex-1 flex flex-col min-h-0 ' : '') +
            slideAnimClass
          }
        >
          {activeTab === 'agenda' ? (
            <PocketAgenda
              safeMembers={safeMembers}
              filteredEvents={filteredEvents}
              selectedPerson={selectedPerson}
              onSelectPerson={handleSelectPersonFilter}
              todayStr={todayStr}
              themeStyles={themeStyles}
              getMemberStyles={getMemberStyles}
              renderAvatar={renderAvatar}
              onCreateEvent={handleCreateMobileEvent}
              onUpdateEvent={handleUpdateMobileEvent}
              onDuplicateEvent={handleDuplicateMobileEvent}
              onDeleteEvent={handleDeleteMobileEvent}
            />
          ) : (
            <div className="max-w-6xl w-full mx-auto space-y-3">
              {activeTab === 'tasks' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => handleSelectPersonFilter('all')}
                    className={'px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 ' + (selectedPerson === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    👨‍👩‍👧‍👦 Alle
                  </button>
                  {safeMembers.filter(m => m.id !== 'all').map(m => {
                    const isSel = selectedPerson === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectPersonFilter(m.id)}
                        className={'pr-3.5 pl-2 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-black shrink-0 ' + (isSel ? 'tw-active-nav' : 'tw-nav-inactive')}
                      >
                        {renderAvatar(m, 'w-5 h-5', 'text-[10px]')}
                        <span>{m.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'tasks' && (
                <PocketTasks
                  safeMembers={safeMembers}
                  openTasks={openTasks}
                  doneTasks={doneTasks}
                  selectedPerson={selectedPerson}
                  todoistConfig={todoistConfig}
                  themeStyles={themeStyles}
                  onAddQuickTask={handleAddQuickTask}
                  onToggleTask={handleToggleMobileTask}
                  onDeleteTask={handleDeleteMobileTask}
                  onClearDoneTasks={handleClearDoneMobileTasks}
                  showToast={showToast}
                />
              )}

              {activeTab === 'scanner' && (
                <PocketScanner
                  cartItems={safeCart}
                  stockItems={safeStock}
                  accountId={accountId}
                  todayStr={todayStr}
                  isSyncing={isSyncing}
                  themeStyles={themeStyles}
                  onAddSingleToCart={handleAddSingleToCart}
                  onAddBatchToCart={handleAddBatchToCart}
                  onRemoveCartItem={handleRemoveCartItem}
                  onTransferSingleCartItemToStock={handleTransferSingleCartItemToStock}
                  onTransferAllCartToStock={handleTransferAllCartToStock}
                  onCheckoutStockItemByScan={handleCheckoutStockItemByScan}
                  onAddShopItem={handleAddQuickShopItem}
                  showToast={showToast}
                />
              )}

              {activeTab === 'shopping' && (
                <PocketShopping
                  openShop={openShop}
                  doneShop={doneShop}
                  cartItems={safeCart}
                  notifPermission={notifPermission}
                  themeStyles={themeStyles}
                  onRequestPushPermission={requestShoppingPushPermission}
                  onAddShopItem={handleAddQuickShopItem}
                  onToggleShopItem={handleToggleShopItem}
                  onRemoveCartItem={handleRemoveCartItem}
                  onTransferSingleCartItemToStock={handleTransferSingleCartItemToStock}
                  onTransferAllCartToStock={handleTransferAllCartToStock}
                  onMoveBoughtItemToPantry={handleMoveBoughtItemToPantry}
                  onMoveAllBoughtToPantry={handleMoveAllBoughtToPantry}
                  onClearDoneShopItems={handleClearDoneShopItems}
                />
              )}

              {activeTab === 'essen' && (
                <MealPlanSection
                  mealPlan={safeMeals}
                  setMealPlan={updateMealPlanAndSync}
                  pantryItems={safeStock}
                  setPantryItems={(updater) => {
                    setPantryItems(prev => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      saveStateToCloud({ pantryItems: next });
                      return next;
                    });
                  }}
                  setPantryTrash={(updater) => {
                    setPantryTrash(prev => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      saveStateToCloud({ pantryTrash: next });
                      return next;
                    });
                  }}
                  todayStr={todayStr}
                  addShoppingItemsBatch={handleAddShoppingItemsBatch}
                  themeStyles={themeStyles}
                  showToast={showToast}
                />
              )}

              {activeTab === 'rezepte' && (
                <PantryRecipes
                  safeStock={safeStock}
                  safeMeals={safeMeals}
                  setMealPlan={updateMealPlanAndSync}
                  addShoppingItem={handleAddQuickShopItem}
                  todayStr={todayStr}
                  themeStyles={themeStyles}
                  showToast={showToast}
                />
              )}

              {activeTab === 'angebote' && (
                <PantryOffers
                  safeStock={safeStock}
                  safeTrash={safeTrash}
                  addShoppingItem={handleAddQuickShopItem}
                  initialSearchQuery=""
                  themeStyles={themeStyles}
                  showToast={showToast}
                />
              )}

              {activeTab === 'listen' && (
                <NotesSection
                  members={safeMembers}
                  familyNotes={safeNotes}
                  setFamilyNotes={updateNotesAndSync}
                  addItemToNoteTile={handleAddItemToNoteTile}
                  toggleItemInNoteTile={handleToggleItemInNoteTile}
                  deleteItemInNoteTile={handleDeleteItemInNoteTile}
                  todoistConfig={todoistConfig}
                  createAndSelectTodoistProject={createAndSelectTodoistProject}
                  setQrModalOpen={() => setQuickCockpitOpen(true)}
                  themeStyles={themeStyles}
                />
              )}

              {activeTab === 'schule' && (
                <div data-no-swipe="true">
                  <SchoolSection
                    members={safeMembers}
                    schoolData={schoolData}
                    setSchoolData={updateSchoolDataAndSync}
                    activeSchoolChild={activeSchoolChild}
                    setActiveSchoolChild={setActiveSchoolChild}
                    setSchoolModal={setSchoolModal}
                    addNewTaskWithSettings={handleAddNewTaskFromSchool}
                    todayStr={todayStr}
                    themeStyles={themeStyles}
                    getMemberStyles={getMemberStyles}
                    renderAvatar={renderAvatar}
                    showToast={showToast}
                  />
                </div>
              )}

              {activeTab === 'skillboard' && (
                <QuestSection
                  isActive={true}
                  setActiveSection={(sec) => switchCategorySmooth(sec, null, false)}
                  skillBoardData={skillBoardData || preservedWallStateRef.current.skillBoardData}
                  setSkillBoardData={handleSkillBoardUpdate}
                  members={safeMembers}
                  events={safeEvents}
                  familyTasks={safeTasks}
                  toggleTaskDone={(taskId, isDone) => {
                    const next = safeTasks.map(t =>
                      t.id === taskId ? { ...t, done: isDone, updatedAt: Date.now(), fromMobile: true } : t
                    );
                    setFamilyTasks(next);
                    saveStateToCloud({ familyTasks: next });
                  }}
                  pantryItems={safeStock}
                  pantryTrash={safeTrash}
                  familyNotes={safeNotes}
                  themeStyles={themeStyles}
                  getMemberStyles={getMemberStyles}
                  renderAvatar={renderAvatar}
                  showToast={showToast}
                />
              )}

              {activeTab === 'design' && (
                <SettingsSection
                  activeSection="design"
                  accountId={accountId}
                  authKey={authKey}
                  members={safeMembers}
                  setMembers={(updater) => {
                    setMembers(prev => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      setTimeout(() => saveStateToCloud({}), 80);
                      return next;
                    });
                  }}
                  currentTheme={currentTheme}
                  setCurrentTheme={(t) => {
                    setCurrentTheme(t);
                    setTimeout(() => saveStateToCloud({}), 80);
                  }}
                  customLogoUrl={customLogoUrl || preservedWallStateRef.current.customLogoUrl || ''}
                  setCustomLogoUrl={(url) => {
                    setCustomLogoUrl(url);
                    preservedWallStateRef.current = { ...preservedWallStateRef.current, customLogoUrl: url };
                    setTimeout(() => saveStateToCloud({}), 80);
                  }}
                  handleLogoUpload={handleLogoUploadPocket}
                  handleMemberPhotoUpload={handleMemberPhotoUploadPocket}
                  restoreScreenshotDefaults={handleRestoreDesignDefaultsPocket}
                  themeStyles={themeStyles}
                  getMemberStyles={getMemberStyles}
                  renderAvatar={renderAvatar}
                  showToast={showToast}
                />
              )}

              {activeTab === 'accounts' && (
                <OtherSections
                  activeSection="google"
                  accountId={accountId}
                  authKey={authKey}
                  onAuthKeyUpdated={(nextKey) => {
                    setAuthKey(nextKey);
                    writeAuthSession(accountId, nextKey, familyName);
                  }}
                  members={safeMembers}
                  setMembers={setMembers}
                  schoolData={schoolData}
                  setSchoolData={setSchoolData}
                  mealPlan={safeMeals}
                  setMealPlan={setMealPlan}
                  pantryItems={safeStock}
                  setPantryItems={setPantryItems}
                  setPantryTrash={setPantryTrash}
                  todayStr={todayStr}
                  familyNotes={safeNotes}
                  setFamilyNotes={setFamilyNotes}
                  currentTheme={currentTheme}
                  setCurrentTheme={setCurrentTheme}
                  appsScriptUrl={appsScriptUrl}
                  setAppsScriptUrl={setAppsScriptUrl}
                  todoistConfig={todoistConfig}
                  setTodoistConfig={setTodoistConfig}
                  connectAndDiscoverTodoist={connectAndDiscoverTodoist}
                  createAndSelectTodoistProject={createAndSelectTodoistProject}
                  runAllPermissionsTest={runAllPermissionsTest}
                  isTestingDiag={isTestingDiag}
                  diagResult={diagResult}
                  pullFromCloud={() => syncAllNow(true)}
                  pushToCloudAndDrive={pushToCloudAndDrive}
                  addExtraCalendarAccount={addExtraCalendarAccount}
                  importBackupJson={importBackupJson}
                  exportBackupJson={exportBackupJson}
                  setQrModalOpen={() => setQuickCockpitOpen(true)}
                  themeStyles={themeStyles}
                  getMemberStyles={getMemberStyles}
                  renderAvatar={renderAvatar}
                  showToast={showToast}
                />
              )}

              {schoolModal.open && (
                <div
                  data-no-swipe="true"
                  onClick={() => setSchoolModal(prev => ({ ...prev, open: false }))}
                  className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <form
                    onSubmit={handleSaveSchoolSlotModal}
                    onClick={(e) => e.stopPropagation()}
                    className={'w-full max-w-md rounded-3xl border-2 p-5 shadow-2xl space-y-4 ' + themeStyles.modal}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black">🎓 Unterrichtsfach bearbeiten</h3>
                      <button
                        type="button"
                        onClick={() => setSchoolModal(prev => ({ ...prev, open: false }))}
                        className="tw-nav-inactive w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-sky-400 mb-1">Fach (leer = löschen)</label>
                        <input
                          type="text"
                          value={schoolModal.subject}
                          onChange={(e) => setSchoolModal(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="z.B. Mathe, Deutsch, Sport..."
                          className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-amber-400 mb-1">Raum / Hinweis</label>
                        <input
                          type="text"
                          value={schoolModal.room}
                          onChange={(e) => setSchoolModal(prev => ({ ...prev, room: e.target.value }))}
                          placeholder="z.B. R204, Sporthalle..."
                          className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-purple-300 mb-1">Status</label>
                        <select
                          value={schoolModal.status}
                          onChange={(e) => setSchoolModal(prev => ({ ...prev, status: e.target.value }))}
                          className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                        >
                          <option value="normal" className="bg-slate-800 text-white">Normaler Unterricht</option>
                          <option value="exam" className="bg-slate-800 text-purple-300">📝 Klassenarbeit / Test</option>
                          <option value="change" className="bg-slate-800 text-amber-300">⚠️ Vertretung / Änderung</option>
                          <option value="cancel" className="bg-slate-800 text-rose-300">❌ Entfall</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setSchoolModal(prev => ({ ...prev, open: false }))}
                        className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        className="tw-active-nav px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Speichern</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/*
              //
              // ============================================================================
              // PART 11: VORRATS- & MÜLLEIMER-ANSICHT (HANDY & TABLET GRID)
              // ============================================================================
              //
              */}
              {activeTab === 'stock' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/35 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStockSubView('stock')}
                      className={'py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ' +
                        (stockSubView === 'stock' ? 'tw-active-nav' : 'tw-nav-inactive')}
                    >
                      <Package className="w-4 h-4" />
                      <span>🥫 Vorrat ({safeStock.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStockSubView('trash')}
                      className={'py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ' +
                        (stockSubView === 'trash' ? 'tw-active-nav' : 'tw-nav-inactive')}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>🗑️ Mülleimer ({safeTrash.length})</span>
                    </button>
                  </div>

                  {stockSubView === 'stock' ? (
                    <>
                      {(mhdAlertGroups.finalToday.length > 0 || mhdAlertGroups.warnTwoDays.length > 0) && (
                        <div className="p-3.5 rounded-3xl border-2 border-rose-500/80 bg-rose-950/35 space-y-2.5 shadow-lg">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black uppercase text-rose-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>🔔 MHD-Ablauf-Warnung</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerMhdExpiryPushWarnings(true)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/30 border border-rose-400/50 text-rose-100 text-xs font-black flex items-center gap-1"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>Push senden</span>
                            </button>
                          </div>

                          {mhdAlertGroups.finalToday.length > 0 && (
                            <div className="p-3 rounded-2xl bg-rose-500/25 border border-rose-400/60 space-y-1.5">
                              <div className="text-xs font-black text-rose-200">
                                🚨 LETZTE WARNUNG – Läuft HEUTE ab (morgen im Mülleimer):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {mhdAlertGroups.finalToday.map(it => (
                                  <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => openEditStockItemModal(it)}
                                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-rose-300/40 text-sm font-black text-white flex items-center gap-2"
                                  >
                                    <ProductThumb
                                      item={it}
                                      sizeClass="w-7 h-7"
                                      emojiClass="text-base"
                                      roundedClass="rounded-lg"
                                    />
                                    <span>{it.name}</span>
                                    <span className="text-rose-300 font-black">({it.quantity})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {mhdAlertGroups.warnTwoDays.length > 0 && (
                            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 space-y-1.5">
                              <div className="text-xs font-black text-amber-200">
                                ⚠️ Vorwarnung – Läuft in 1–2 Tagen ab:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {mhdAlertGroups.warnTwoDays.map(it => (
                                  <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => openEditStockItemModal(it)}
                                    className="px-2.5 py-1.5 rounded-xl bg-black/45 border border-amber-300/40 text-sm font-black text-white flex items-center gap-2"
                                  >
                                    <ProductThumb
                                      item={it}
                                      sizeClass="w-7 h-7"
                                      emojiClass="text-base"
                                      roundedClass="rounded-lg"
                                    />
                                    <span>{it.name}</span>
                                    <span className="text-amber-300 font-black">
                                      ({it.daysLeft === 1 ? 'morgen' : 'in 2 T.'})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={'p-3.5 rounded-3xl border space-y-2.5 shadow-md ' + themeStyles.card}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h2 className="font-black text-lg flex items-center gap-1.5">
                              <span>🥫 Vorrat ({sortedStockForTab.length})</span>
                            </h2>
                            <p className="text-xs opacity-75 font-bold">
                              {stockSortMode === 'newest'
                                ? '🕒 Zuletzt gescannt oben'
                                : stockSortMode === 'expiry'
                                ? '📅 Nach Ablaufdatum (MHD)'
                                : stockSortMode === 'glutenfree'
                                ? '🌾✓ Glutenfrei zuerst'
                                : '🔤 Alphabetisch (A–Z)'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setStockOnlyGlutenFree(prev => !prev)}
                              className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 border ' +
                                (stockOnlyGlutenFree
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40')}
                            >
                              <span>🌾✓ GF ({totalGlutenFreeInStock})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowStockMenu(prev => !prev)}
                              className={'px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ' +
                                (showStockMenu ? 'tw-active-nav' : 'tw-glow-btn')}
                            >
                              {showStockMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                              <span>Filter</span>
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            placeholder="Produkt, Marke oder Kategorie suchen..."
                            className={'w-full h-12 pl-10 pr-9 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
                          />
                          {stockSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setStockSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-black"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {showStockMenu && (
                          <div className={'p-3 rounded-2xl border space-y-3 ' + themeStyles.subtle}>
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-black uppercase text-sky-400 block">
                                ↕️ Sortierung wählen:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {[
                                  { id: 'newest',     label: '🕒 Neueste oben' },
                                  { id: 'expiry',     label: '📅 Nach MHD' },
                                  { id: 'glutenfree', label: '🌾✓ Glutenfrei oben' },
                                  { id: 'az',         label: '🔤 Name (A–Z)' }
                                ].map(sOpt => (
                                  <button
                                    key={sOpt.id}
                                    type="button"
                                    onClick={() => setStockSortMode(sOpt.id)}
                                    className={'py-2.5 px-3 rounded-xl text-xs font-extrabold text-left ' +
                                      (stockSortMode === sOpt.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                                  >
                                    {sOpt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] font-black uppercase text-emerald-400 block mb-1">
                                  🏠 Lagerort:
                                </label>
                                <select
                                  value={stockLocationFilter}
                                  onChange={(e) => setStockLocationFilter(e.target.value)}
                                  className={'w-full h-11 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                                >
                                  <option value="all" className="bg-slate-800 text-white">🏠 Alle Orte ({safeStock.length})</option>
                                  {STORAGE_PILLS.map(loc => (
                                    <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">
                                      {loc.label} ({safeStock.filter(x => x.location === loc.id).length})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] font-black uppercase text-purple-300 block mb-1">
                                  🍱 Kategorie:
                                </label>
                                <select
                                  value={stockCategoryFilter}
                                  onChange={(e) => setStockCategoryFilter(e.target.value)}
                                  className={'w-full h-11 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                                >
                                  <option value="all" className="bg-slate-800 text-white">🍱 Alle Kategorien</option>
                                  {FOOD_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                                      {cat.icon} {cat.title.split(',')[0]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={handleSimplifyAllStockNames}
                                className="tw-glow-btn w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                              >
                                <Wand2 className="w-4 h-4 text-sky-300" />
                                <span>✨ Alle Namen kürzen</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerMhdExpiryPushWarnings(true)}
                                className="tw-glow-btn w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                              >
                                <BellRing className="w-4 h-4 text-amber-300" />
                                <span>🔔 MHD-Push jetzt prüfen</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
                          <button
                            type="button"
                            onClick={() => setStockLocationFilter('all')}
                            className={'px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 ' +
                              (stockLocationFilter === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
                          >
                            🏠 Alle ({safeStock.length})
                          </button>
                          {STORAGE_PILLS.map(loc => {
                            const count = safeStock.filter(x => x.location === loc.id).length;
                            return (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => setStockLocationFilter(loc.id)}
                                className={'px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 ' +
                                  (stockLocationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                              >
                                {loc.label} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {sortedStockForTab.length === 0 ? (
                        <div className={'p-8 rounded-3xl border text-center space-y-2 ' + themeStyles.card}>
                          <div className="text-3xl">🥫</div>
                          <div className="text-sm font-extrabold opacity-70">
                            Keine Produkte für diese Suche oder Filterung gefunden.
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {sortedStockForTab.map((item, idx) => {
                            const catObj = FOOD_CATEGORIES.find(c => c.id === item.resolvedCategory) || FOOD_CATEGORIES[1];
                            const locObj = STORAGE_PILLS.find(l => l.id === item.location) || STORAGE_PILLS[0];
                            const decPreview = decrementItemPieceCount(item.quantity);
                            const daysLeft = getDaysUntilMhd(item.expiryDate, todayStr);
                            const isFinalDayZero = daysLeft <= 0;
                            const isWarnTwoDays = daysLeft === 1 || daysLeft === 2;
                            const isWarnWeek = daysLeft > 2 && daysLeft <= 7;
                            const isNewestTop = stockSortMode === 'newest' && idx === 0 && !stockSearchQuery;
                            const isGf = Boolean(item.resolvedGlutenFree);

                            const daysLabel = daysLeft <= 0
                              ? '🚨 HEUTE!'
                              : daysLeft === 1
                              ? '⚠️ Morgen'
                              : daysLeft === 2
                              ? '⚠️ 2 Tage'
                              : (daysLeft + ' Tage');

                            return (
                              <div
                                key={item.id}
                                onClick={() => openEditStockItemModal(item)}
                                className={'p-4 rounded-3xl border flex flex-col justify-between gap-3.5 cursor-pointer shadow-md transition-all ' +
                                  themeStyles.card + ' ' +
                                  (isFinalDayZero
                                    ? 'border-rose-500 border-2 bg-rose-950/35'
                                    : isWarnTwoDays
                                    ? 'border-rose-400/80 bg-rose-950/20'
                                    : isWarnWeek
                                    ? 'border-amber-400/80 bg-amber-950/20'
                                    : isNewestTop
                                    ? 'border-sky-400/80 bg-sky-500/10'
                                    : '')}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                    <ProductThumb
                                      item={item}
                                      sizeClass="w-14 h-14"
                                      emojiClass="text-3xl"
                                      roundedClass="rounded-2xl"
                                    />

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        {isNewestTop && (
                                          <span className="px-2 py-0.5 rounded-md bg-sky-500 text-white text-[10px] font-black shrink-0">
                                            NEU
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => toggleStockItemGlutenFreeDirectly(e, item)}
                                          className={'px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ' +
                                            (isGf
                                              ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                                              : 'bg-white/5 border border-white/10 text-slate-400')}
                                        >
                                          {isGf ? '🌾✓ GF' : '🌾?'}
                                        </button>
                                        <span className="text-xs font-extrabold opacity-80 truncate">
                                          {catObj.icon} {catObj.title.split(',')[0]}
                                        </span>
                                      </div>

                                      <h3 className="font-black text-base sm:text-lg leading-snug break-words">
                                        {item.name}
                                      </h3>
                                    </div>
                                  </div>

                                  <div
                                    className={'px-3 py-2 rounded-2xl border text-right shrink-0 ' +
                                      (isFinalDayZero
                                        ? 'bg-rose-500/35 border-rose-300 text-rose-100'
                                        : isWarnTwoDays
                                        ? 'bg-rose-500/25 border-rose-400 text-rose-100'
                                        : isWarnWeek
                                        ? 'bg-amber-500/30 border-amber-400 text-amber-100'
                                        : 'bg-black/35 border-white/15')}
                                  >
                                    <div className="text-sm font-black">
                                      {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}
                                    </div>
                                    <div className={'text-xs font-black mt-0.5 ' + (isFinalDayZero || isWarnTwoDays ? 'text-rose-300' : isWarnWeek ? 'text-amber-300' : 'text-emerald-400')}>
                                      {daysLabel}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/10">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1.5 rounded-xl bg-black/45 border border-amber-400/40 text-sm font-black text-amber-300">
                                      📦 {item.quantity}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-xl bg-black/35 border border-white/10 text-xs sm:text-sm font-extrabold">
                                      {locObj.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => openEditStockItemModal(item)}
                                      title="Bearbeiten"
                                      className="tw-nav-inactive p-2.5 rounded-xl text-sky-300"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAddQuickShopItem(item.name)}
                                      title="Auf die Einkaufsliste setzen"
                                      className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300"
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleMoveStockItemToTrashFromPocket(item, 'wasted', true)}
                                      title="Direkt in den Mülleimer verschieben"
                                      className="tw-nav-inactive p-2.5 rounded-xl text-rose-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleConsumeFromPocket(item)}
                                      className="tw-glow-btn px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                      <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className={'p-4 rounded-3xl border space-y-2.5 shadow-md ' + themeStyles.card}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h2 className="font-black text-lg flex items-center gap-1.5">
                              <span>🗑️ Mülleimer ({safeTrash.length})</span>
                            </h2>
                            <p className="text-xs font-bold text-emerald-300">
                              🌱 Quote: {trashStats.score}% ({trashStats.consumed} verzehrt / {trashStats.wasted} weggeworfen)
                            </p>
                          </div>

                          {safeTrash.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllPocketTrash}
                              className="px-3.5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Alle leeren</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {safeTrash.length === 0 ? (
                        <div className={'p-8 rounded-3xl border text-center space-y-2 ' + themeStyles.card}>
                          <div className="text-3xl">🌱</div>
                          <div className="text-sm font-extrabold opacity-75">
                            Der Mülleimer ist leer!
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                          {safeTrash.map(tItem => {
                            const isWasted = tItem.reason === 'expired' || tItem.reason === 'wasted';
                            return (
                              <div
                                key={tItem.id}
                                className={'p-4 rounded-3xl border flex flex-col justify-between gap-3 shadow-sm ' +
                                  themeStyles.card + ' ' +
                                  (isWasted ? 'border-rose-500/60' : 'border-emerald-500/40')}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <ProductThumb
                                      item={tItem}
                                      sizeClass="w-13 h-13"
                                      emojiClass="text-3xl"
                                      roundedClass="rounded-2xl"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className={'inline-block px-2 py-0.5 rounded-md text-[10px] font-black mb-1 ' +
                                          (isWasted ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-300')}
                                      >
                                        {tItem.reasonLabel || '🍽️ Verbraucht'}
                                      </span>
                                      <h3 className="font-black text-base sm:text-lg leading-snug break-words">
                                        {tItem.name}
                                      </h3>
                                      <div className="text-xs opacity-75 font-bold mt-0.5">
                                        {tItem.quantity} • MHD war: {tItem.expiryDate}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSinglePocketTrash(tItem)}
                                    className="tw-nav-inactive w-8 h-8 rounded-xl text-rose-400 font-black flex items-center justify-center shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => handleAddQuickShopItem(tItem.name)}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md"
                                  >
                                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                                    <span>Zur Einkaufsliste</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRestoreFromPocketTrash(tItem)}
                                    title="Zurück in den Vorrats-Bestand legen"
                                    className="tw-nav-inactive px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
                                  >
                                    <RotateCcw className="w-4 h-4 text-sky-300" />
                                    <span>Zurück</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/*
      //
      // ============================================================================
      // PART 12: MODALS (RESTOCK, QUICK-COCKPIT, EDIT, ONBOARDING), DOCK & TOAST
      // ============================================================================
      //
      */}
      {restockPromptItem && typeof document !== 'undefined' && createPortal(
        <div
          data-no-swipe="true"
          onClick={() => setRestockPromptItem(null)}
          className="fixed inset-0 w-screen h-screen z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl space-y-5 text-center my-auto ' + themeStyles.modal}
          >
            <div className="flex justify-center">
              <ProductThumb
                item={restockPromptItem}
                sizeClass="w-20 h-20"
                emojiClass="text-4xl"
                roundedClass="rounded-3xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
                🗑️ Im Mülleimer abgelegt
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
                  showToast('Ausgebucht 🗑️', '„' + name + '“ liegt jetzt im Mülleimer.', '🗑️');
                }}
                className="tw-nav-inactive py-3.5 px-4 rounded-2xl text-sm font-black"
              >
                Nein
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = restockPromptItem.name;
                  handleAddQuickShopItem(name);
                  setRestockPromptItem(null);
                }}
                className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                <span>Ja, Einkaufsliste</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {quickCockpitOpen && (
        <div
          data-no-swipe="true"
          onClick={() => setQuickCockpitOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-3xl border-2 p-4 shadow-2xl space-y-4 mb-20 md:mb-0 max-h-[82dvh] overflow-y-auto ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-xl bg-sky-500 text-white text-xs font-black">HR POCKET</span>
                <div className="min-w-0">
                  <div className="font-black text-sm truncate">{familyName}</div>
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    {!isOnline ? (
                      <><WifiOff className="w-3 h-3 text-amber-400" /> Offline-Puffer</>
                    ) : (
                      <><Cloud className="w-3 h-3" /> Cloud: {accountId || 'lokal'}</>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickCockpitOpen(false)}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-sky-400 block">
                👤 Personen-Filter (für Kalender & Aufgaben):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { handleSelectPersonFilter('all'); setQuickCockpitOpen(false); }}
                  className={'py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 ' +
                    (selectedPerson === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  <span>👨‍👩‍👧‍👦 Alle</span>
                </button>
                {safeMembers.filter(m => m.id !== 'all').map(m => {
                  const isSel = selectedPerson === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { handleSelectPersonFilter(m.id); setQuickCockpitOpen(false); }}
                      className={'py-2 px-2.5 rounded-2xl flex items-center gap-2 text-xs font-black ' +
                        (isSel ? 'tw-active-nav' : 'tw-nav-inactive')}
                    >
                      {renderAvatar(m, 'w-6 h-6', 'text-[10px]')}
                      <span className="truncate">{m.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {SHOW_OAUTH_UI && accountId && accountId !== 'local' && (
              <div className="space-y-2 pt-1 border-t border-white/10">
                <span className="text-[11px] font-black uppercase text-emerald-400 block">
                  🔗 Google / Outlook OAuth verknüpfen ({selectedPerson && selectedPerson !== 'all' ? (activePersonObj?.name || selectedPerson) : 'Konto'}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startPocketOAuthLink('google')}
                    className="tw-nav-inactive py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
                    </svg>
                    <span>Google OAuth</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startPocketOAuthLink('microsoft')}
                    className="tw-nav-inactive py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <rect x="2" y="2" width="9.2" height="9.2" fill="#F25022" />
                      <rect x="12.8" y="2" width="9.2" height="9.2" fill="#7FBA00" />
                      <rect x="2" y="12.8" width="9.2" height="9.2" fill="#00A4EF" />
                      <rect x="12.8" y="12.8" width="9.2" height="9.2" fill="#FFB900" />
                    </svg>
                    <span>Outlook OAuth</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => { syncAllNow(true); setQuickCockpitOpen(false); }}
                className="tw-glow-btn py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
              >
                <RefreshCw className={'w-4 h-4 text-sky-300 ' + (isSyncing ? 'animate-spin' : '')} />
                <span>Jetzt synchronisieren</span>
              </button>

              <button
                type="button"
                onClick={() => { requestShoppingPushPermission(); setQuickCockpitOpen(false); }}
                className={'py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ' +
                  (notifPermission === 'granted'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                    : 'tw-glow-btn')}
              >
                <BellRing className="w-4 h-4" />
                <span>{notifPermission === 'granted' ? 'Push aktiv ✓' : 'Push aktivieren'}</span>
              </button>

              <a
                href="/"
                className="tw-nav-inactive py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 no-underline text-white"
              >
                <span>🖥️ Große Touchwall</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('richter_tw_auth_active');
                    localStorage.removeItem('richter_tw_account_id');
                    localStorage.removeItem('richter_tw_auth_key');
                    document.cookie = 'tw_auth_session=; path=/; max-age=0; SameSite=Lax';
                    document.cookie = 'tw_account_id=; path=/; max-age=0; SameSite=Lax';
                  } catch (e) {}
                  setAccountId('');
                  setAuthKey('');
                  setIsAuthenticated(false);
                  setQuickCockpitOpen(false);
                }}
                className="tw-nav-inactive py-3 px-3 rounded-2xl text-xs font-black text-rose-400 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    localStorage.removeItem('richter_touchwall_events_cache');
                    localStorage.setItem('richter_tw_pocket_person', 'all');
                  } catch (e) {}
                  pendingCalendarOpsRef.current = {};
                  if (syncMetaRef.current) {
                    syncMetaRef.current.deletedEventIds = {};
                    saveLocalSyncMeta(syncMetaRef.current);
                  }
                  lastLocalEditRef.current = 0;
                  setSelectedPerson('all');
                  setQuickCockpitOpen(false);
                  showToast('Kalender-Cache geleert', 'Lade alle Termine frisch aus der Cloud...', '🔄');
                  await syncAllNow(true);
                }}
                className="col-span-2 tw-nav-inactive py-2.5 px-3 rounded-2xl text-xs font-black text-amber-300 border border-amber-400/35 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kalender-Cache leeren &amp; frisch laden</span>
              </button>
            </div>

            {installPromptEvent && (
              <button
                type="button"
                onClick={handleInstallAndroidApp}
                className="tw-active-nav w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>📲 Als Android-App installieren</span>
              </button>
            )}

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
              <a href="/datenschutz" className="hover:text-sky-300">Datenschutz</a>
              <span className="opacity-30">•</span>
              <a href="/nutzungsbedingungen" className="hover:text-sky-300">Nutzungsbedingungen</a>
              <span className="opacity-30">•</span>
              <button
                type="button"
                onClick={() => { setQuickCockpitOpen(false); openCookieSettingsModal(); }}
                className="hover:text-sky-300 cursor-pointer"
              >
                🍪 Cookie-Einstellungen
              </button>
            </div>
          </div>
        </div>
      )}

      {editStockModal.open && (
        <div
          data-no-swipe="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveEditStockModal}
            className={'w-full max-w-md rounded-3xl border-2 p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <ProductThumb
                  item={editStockModal}
                  sizeClass="w-12 h-12"
                  emojiClass="text-3xl"
                  roundedClass="rounded-2xl"
                />
                <div>
                  <h3 className="text-base font-black">✏️ Produkt bearbeiten</h3>
                  <p className="text-[11px] opacity-75 font-semibold">
                    Synchronisiert sofort mit der großen Touchwall
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditStockModal({ ...editStockModal, open: false })}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={'p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ' + themeStyles.subtle}>
              <div className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1.5 min-w-0">
                <span>🖼️</span>
                <span className="truncate">
                  {isUploadingEditPhoto
                    ? 'Lade Bild nach Supabase...'
                    : editStockModal.imageUrl
                    ? (editStockModal.imageUrl.includes('supabase') ? 'Eigenes Foto (Supabase ✓)' : 'Produktbild aktiv ✓')
                    : 'Noch kein Produktfoto hinterlegt'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{editStockModal.imageUrl ? 'Ändern' : 'Foto aufnehmen'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={isUploadingEditPhoto}
                    className="hidden"
                    onChange={handleEditStockPhotoUpload}
                  />
                </label>

                {editStockModal.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setEditStockModal(prev => ({ ...prev, imageUrl: '' }))}
                    title="Produktbild entfernen"
                    className="px-2 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[11px] font-black flex items-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black uppercase text-sky-400">
                  Produktname
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const simplified = simplifyProductName(editStockModal.name);
                    setEditStockModal({
                      ...editStockModal,
                      name: simplified,
                      category: detectSmartCategory(simplified, editStockModal.category)
                    });
                  }}
                  className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-black flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>✨ Name auf „Produkt / Marke“ kürzen</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={editStockModal.name}
                onChange={(e) => setEditStockModal({ ...editStockModal, name: e.target.value })}
                className={'w-full px-3.5 py-2.5 rounded-xl border text-base font-extrabold ' + themeStyles.input}
              />
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-[10px] font-black uppercase text-amber-400 mb-1">
                  Menge / Stück
                </label>
                <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/10 h-11">
                  <button
                    type="button"
                    onClick={() => setEditStockModal({ ...editStockModal, quantity: stepMobileQty(editStockModal.quantity, -1) })}
                    className="tw-nav-inactive w-8 h-full rounded-lg font-black text-sm flex items-center justify-center shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={editStockModal.quantity}
                    onChange={(e) => setEditStockModal({ ...editStockModal, quantity: e.target.value })}
                    className="w-full bg-transparent text-center text-xs font-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEditStockModal({ ...editStockModal, quantity: stepMobileQty(editStockModal.quantity, 1) })}
                    className="tw-glow-btn w-8 h-full rounded-lg font-black text-sm flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="col-span-7">
                <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">
                  🌾 Glutenfrei-Status
                </label>
                <select
                  value={editStockModal.glutenFree}
                  onChange={(e) => setEditStockModal({ ...editStockModal, glutenFree: e.target.value })}
                  className={'w-full h-11 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="auto" className="bg-slate-800 text-sky-300">
                    ✨ Auto ({isProductGlutenFree(editStockModal.name, editStockModal.category, 'auto') ? 'Glutenfrei ✓' : 'Normal'})
                  </option>
                  <option value="yes" className="bg-slate-800 text-emerald-300">🌾✓ Ja, garantiert glutenfrei</option>
                  <option value="no" className="bg-slate-800 text-rose-300">🚫 Nein, enthält Gluten</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <label className="block text-[10px] font-black uppercase text-purple-300 mb-1">
                  Lebensmittel-Kategorie
                </label>
                <select
                  value={editStockModal.category}
                  onChange={(e) => setEditStockModal({ ...editStockModal, category: e.target.value })}
                  className={'w-full h-11 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-5">
                <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">
                  Lagerort
                </label>
                <select
                  value={editStockModal.location}
                  onChange={(e) => setEditStockModal({ ...editStockModal, location: e.target.value })}
                  className={'w-full h-11 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {STORAGE_PILLS.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-[11px] font-black uppercase text-amber-400">
                  📅 Ablaufdatum (MHD)
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { l: '+3T', d: 3 },
                    { l: '+1W', d: 7 },
                    { l: '+2W', d: 14 },
                    { l: '+1M', d: 30 },
                    { l: '+6M', d: 180 }
                  ].map(b => (
                    <button
                      key={b.d}
                      type="button"
                      onClick={() => setEditStockModal({ ...editStockModal, expiryDate: formatDateStr(addDays(new Date(), b.d)) })}
                      className="tw-glow-btn px-2 py-0.5 rounded-lg text-[10px] font-black"
                    >
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="date"
                required
                value={editStockModal.expiryDate}
                onChange={(e) => setEditStockModal({ ...editStockModal, expiryDate: e.target.value })}
                className={'w-full px-3 py-2 rounded-xl border text-xs font-black ' + themeStyles.input}
              />
            </div>

            <div className={'p-2.5 rounded-2xl border space-y-1.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase">🎨 Fallback-Emoji anpassen</span>
                <button
                  type="button"
                  onClick={() => setEditStockModal({ ...editStockModal, customEmoji: getFoodEmoji(editStockModal.name) })}
                  className="text-[10px] font-extrabold text-sky-400"
                >
                  🔄 Automatisch
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-0.5">
                {FOOD_EMOJI_PICKER.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEditStockModal({ ...editStockModal, customEmoji: em })}
                    className={'w-8 h-8 rounded-xl border text-base flex items-center justify-center ' +
                      (editStockModal.customEmoji === em ? 'ring-2 ring-sky-400 bg-sky-500/25' : 'bg-black/25 border-white/10')}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleDeleteFromEditStockModal}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>In Mülleimer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditStockModal({ ...editStockModal, open: false })}
                  className="tw-nav-inactive px-3.5 py-2.5 rounded-2xl text-xs font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isUploadingEditPhoto}
                  className="tw-active-nav px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {categoryTrayOpen && (
        <div
          data-no-swipe="true"
          onClick={() => setCategoryTrayOpen(false)}
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
        />
      )}

      {categoryTrayOpen && (
        <div
          data-no-swipe="true"
          className="fixed bottom-[78px] inset-x-0 z-40 px-3 flex justify-center pointer-events-none"
        >
          <div className="tw-tray-float pointer-events-auto max-w-full overflow-x-auto tw-no-scrollbar py-1.5 px-1">
            <div className="flex items-center gap-2.5 w-max mx-auto px-1">
              {FLOATING_CATEGORY_TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchCategorySmooth(tab.id, null, false)}
                    className={
                      'relative w-[84px] py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 ' +
                      'text-[11px] font-black shadow-2xl backdrop-blur-md active:scale-95 transition-transform shrink-0 ' +
                      (active
                        ? 'tw-active-nav'
                        : 'bg-[#1b202b]/95 text-slate-100 border border-white/15 hover:border-sky-400/60')
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="truncate max-w-full">{tab.label}</span>
                    {tab.badge > 0 && (
                      <span
                        className={
                          'absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ' +
                          'flex items-center justify-center shadow-md ' +
                          (tab.urgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950')
                        }
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setCategoryTrayOpen(false);
                  setQuickCockpitOpen(true);
                }}
                className="relative w-[84px] py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-[11px] font-black shadow-2xl backdrop-blur-md bg-[#1b202b]/95 text-slate-100 border border-white/15 hover:border-sky-400/60 active:scale-95 transition-transform shrink-0"
              >
                {activePersonObj && selectedPerson !== 'all' ? (
                  renderAvatar(activePersonObj, 'w-5 h-5', 'text-[9px]')
                ) : (
                  <SlidersHorizontal className={'w-5 h-5 text-sky-300 ' + (isSyncing ? 'animate-spin' : '')} />
                )}
                <span className="truncate max-w-full">
                  {activePersonObj && selectedPerson !== 'all' ? activePersonObj.name.split(' ')[0] : 'Menü'}
                </span>
                {!isOnline && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        data-no-swipe="true"
        className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex justify-center px-3"
      >
        <div
          className={
            'pointer-events-auto flex items-center gap-2 px-3 pt-2 pb-2.5 ' +
            'rounded-t-[28px] border-t border-x border-white/15 shadow-[0_-10px_30px_rgba(0,0,0,0.55)] ' +
            'backdrop-blur-md ' + themeStyles.header
          }
        >
          {(() => {
            const FlashIcon = categoryFlashInfo?.icon || (categoryTrayOpen ? X : Menu);
            const hasUrgentBehind =
              mhdAlertGroups.finalToday.length > 0 || !isOnline;
            return (
              <button
                type="button"
                onClick={() => setCategoryTrayOpen(prev => !prev)}
                className={
                  'relative min-w-[116px] sm:min-w-[132px] py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-0.5 ' +
                  'text-[11px] font-black transition-all active:scale-95 ' +
                  (categoryFlashInfo
                    ? 'tw-cat-flash'
                    : categoryTrayOpen
                    ? 'tw-active-nav'
                    : activeTab !== 'scanner'
                    ? 'tw-glow-btn ring-1 ring-sky-400/50'
                    : 'tw-nav-inactive opacity-90')
                }
              >
                <FlashIcon className="w-5 h-5" />
                <span className="truncate max-w-[104px]">
                  {categoryFlashInfo ? categoryFlashInfo.label : 'Kategorie'}
                </span>
                {hasUrgentBehind && !categoryTrayOpen && !categoryFlashInfo && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })()}

          <button
            type="button"
            onClick={() => switchCategorySmooth('scanner', null, false)}
            className={
              'relative min-w-[116px] sm:min-w-[132px] py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-0.5 ' +
              'text-[11px] font-black transition-all active:scale-95 ' +
              (activeTab === 'scanner' ? 'tw-active-nav' : 'tw-nav-inactive opacity-90')
            }
          >
            <Camera className="w-5 h-5" />
            <span>Scanner</span>
            {safeCart.length > 0 && (
              <span className="absolute top-1 right-2 px-1.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950">
                {safeCart.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {showPermissionOnboarding && (
        <div
          data-no-swipe="true"
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            className={'w-full max-w-md rounded-3xl border-2 border-sky-400/70 p-5 shadow-2xl space-y-4 text-center ' + themeStyles.modal}
          >
            <div className="flex justify-center">
              <img
                src="/icon-512.png"
                alt="App Logo"
                className="w-16 h-16 rounded-2xl shadow-lg border border-white/15"
              />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black">🔔 Benachrichtigungen &amp; Zugriffe</h3>
              <p className="text-xs sm:text-sm font-bold opacity-85 leading-relaxed">
                Damit alle Erinnerungen für <strong>Termine, Einkaufsliste &amp; ablaufendes MHD</strong> zuverlässig mit App-Logo ankommen, benötigen wir deine Zustimmung für Benachrichtigungen, Ton &amp; Vibration.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleGrantAllPermissions}
                className="tw-active-nav w-full py-3.5 px-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <BellRing className="w-5 h-5" />
                <span>Jetzt alle Berechtigungen erlauben</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try { localStorage.setItem('richter_tw_pocket_perms_done', '1'); } catch (e) {}
                  setShowPermissionOnboarding(false);
                }}
                className="tw-nav-inactive w-full py-2.5 px-4 rounded-2xl text-xs font-bold opacity-80"
              >
                Später im Menü aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-sky-400 text-white shadow-2xl flex items-center gap-3">
          <span className="text-2xl">{toast.icon}</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">{toast.title}</div>
            <div className="text-xs sm:text-sm font-bold">{toast.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
