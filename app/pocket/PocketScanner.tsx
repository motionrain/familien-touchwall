// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, ScanLine, FileText, Trash2,
  Check, Zap, ZoomIn, Sparkles, Apple, ShoppingCart,
  PackagePlus, ChevronDown, ChevronUp, Wand2
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';
import {
  FOOD_CATEGORIES,
  STORAGE_PILLS,
  detectFoodCategory,
  getFoodEmoji,
  stepMobileQty,
  playMobileBeep
} from '../foodUtils';

const { formatDateStr, addDays } = Cfg;

export const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🐶'
];

export const FRESH_PRODUCE_MHD_DB = [
  { id: 'cucumber',  name: 'Gurke (Schlangengurke)',             emoji: '🥒', days: 7,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 7 Tage knackig',      keywords: ['gurke', 'schlangengurke', 'minigurke', 'landgurke'], aiLabels: ['cucumber', 'cuke', 'zucchini', 'courgette'] },
  { id: 'apple',     name: 'Frische Äpfel',                      emoji: '🍎', days: 21, location: 'kitchen', category: 'produce', hint: 'Kühl gelagert ca. 3 Wochen haltbar',     keywords: ['apfel', 'äpfel', 'elstar', 'boskoop', 'pink lady', 'gala', 'braeburn'], aiLabels: ['granny smith', 'apple', 'pomegranate', 'fig'] },
  { id: 'orange',    name: 'Orangen / Clementinen',              emoji: '🍊', days: 14, location: 'kitchen', category: 'produce', hint: 'Zitrusfrüchte halten ca. 14 Tage',       keywords: ['orange', 'orangen', 'clementine', 'clementinen', 'mandarine', 'mandarinen', 'apfelsine'], aiLabels: ['orange', 'tangerine', 'clementine', 'mandarin'] },
  { id: 'melon',     name: 'Melone (Wasser-/Honigmelone)',       emoji: '🍈', days: 10, location: 'kitchen', category: 'produce', hint: 'Ungeschnitten ca. 10 Tage haltbar',      keywords: ['melone', 'wassermelone', 'honigmelone', 'galiamelone', 'cantaloupe'], aiLabels: ['watermelon', 'melon', 'cantaloupe', 'honeydew', 'jackfruit', 'spaghetti squash', 'butternut squash'] },
  { id: 'salad',     name: 'Frischer Salat (Eisberg / Feldsalat)', emoji: '🥬', days: 4, location: 'fridge', category: 'produce', hint: 'Im Gemüsefach ca. 4 Tage frisch',        keywords: ['salat', 'eisbergsalat', 'kopfsalat', 'feldsalat', 'mâche', 'rucola', 'blattsalat', 'spinat'], aiLabels: ['head cabbage', 'cabbage', 'lettuce', 'artichoke', 'cardoon', 'bok choy'] },
  { id: 'banana',    name: 'Bananen',                            emoji: '🍌', days: 5,  location: 'kitchen', category: 'produce', hint: 'Bei Raumtemperatur ca. 5 Tage',          keywords: ['banane', 'bananen'], aiLabels: ['banana', 'plantain'] },
  { id: 'tomato',    name: 'Frische Tomaten',                    emoji: '🍅', days: 7,  location: 'kitchen', category: 'produce', hint: 'Bei Zimmertemperatur ca. 7 Tage',        keywords: ['tomate', 'tomaten', 'rispentomaten', 'cherrytomaten', 'strauchtomaten'], aiLabels: ['tomato', 'hip'] },
  { id: 'pepper',    name: 'Paprika',                            emoji: '🫑', days: 8,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 8 Tage knackig',      keywords: ['paprika', 'spitzpaprika', 'paprikaschote'], aiLabels: ['bell pepper', 'pepper', 'chilli', 'jalapeno'] },
  { id: 'broccoli',  name: 'Brokkoli / Blumenkohl',              emoji: '🥦', days: 5,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 5 Tage frisch',       keywords: ['brokkoli', 'blumenkohl', 'kohlrabi', 'rosenkohl'], aiLabels: ['broccoli', 'cauliflower'] },
  { id: 'carrot',    name: 'Karotten / Möhren',                  emoji: '🥕', days: 14, location: 'fridge',  category: 'produce', hint: 'Im Gemüsefach bis zu 14 Tage haltbar',   keywords: ['karotte', 'karotten', 'möhre', 'möhren', 'wurzel'], aiLabels: ['carrot', 'parsnip'] },
  { id: 'berries',   name: 'Frische Beeren (Erd-/Heidelbeeren)', emoji: '🍓', days: 3,  location: 'fridge',  category: 'produce', hint: 'Empfindlich – im Kühlschrank ca. 3 Tage', keywords: ['erdbeeren', 'erdbeere', 'himbeeren', 'heidelbeeren', 'blaubeeren', 'brombeeren', 'beeren'], aiLabels: ['strawberry', 'raspberry', 'blackberry', 'blueberry'] },
  { id: 'lemon',     name: 'Zitrone / Limette',                  emoji: '🍋', days: 14, location: 'kitchen', category: 'produce', hint: 'Hält ca. 14 Tage frisch',                keywords: ['zitrone', 'zitronen', 'limette', 'limetten'], aiLabels: ['lemon', 'lime'] },
  { id: 'avocado',   name: 'Avocado',                            emoji: '🥑', days: 5,  location: 'kitchen', category: 'produce', hint: 'Reift in ca. 5 Tagen nach',              keywords: ['avocado', 'avocados'], aiLabels: ['avocado', 'guacamole', 'custard apple'] },
  { id: 'mushrooms', name: 'Frische Champignons / Pilze',        emoji: '🍄', days: 4,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 4 Tage haltbar',      keywords: ['pilze', 'champignons', 'steinpilze', 'pfifferlinge', 'kräuterseitlinge'], aiLabels: ['mushroom', 'agaric', 'bolete', 'gyromitra'] },
  { id: 'potato',    name: 'Kartoffeln',                         emoji: '🥔', days: 30, location: 'pantry',  category: 'grains',  hint: 'Dunkel & kühl ca. 30 Tage lagerfähig',   keywords: ['kartoffel', 'kartoffeln', 'speisekartoffeln', 'drillinge'], aiLabels: ['potato', 'mashed potato', 'sweet potato'] },
  { id: 'onion',     name: 'Zwiebeln / Knoblauch',               emoji: '🧅', days: 30, location: 'pantry',  category: 'produce', hint: 'Trocken gelagert ca. 30 Tage haltbar',   keywords: ['zwiebel', 'zwiebeln', 'knoblauch', 'schalotten'], aiLabels: ['onion', 'garlic', 'shallot'] }
];

const KNOWN_BRAND_PREFIXES = [
  'K-Classic', 'K-Bio', 'K-Favourites', 'ja!', 'GUT&GÜNSTIG', 'Gut & Günstig',
  'EDEKA', 'REWE Beste Wahl', 'REWE Bio', 'REWE', 'Milbona', 'Milsani', 'Bellarom',
  'Kania', 'Combino', 'Alnatura', 'dmBio', 'Schär', 'Dr. Schär', 'Gefro', 'Meggle',
  'Philadelphia', 'Thomy', 'Heinz', 'Hengstenberg', 'Pfanni', 'Barilla', 'Dr. Oetker',
  'Iglo', 'Frosta', 'Landfein', 'Schwarzwaldmilch', 'Weihenstephan', 'Bärenmarke',
  'Kerrygold', 'Oro di Parma', 'Alnavit', 'Bauckhof', 'Müller', 'Ehrmann', 'Zott',
  'Danone', 'Arla', 'Exquisa', 'miree', 'Rama', 'Lätta', 'Bonduelle', 'Kühne',
  'Knorr', 'Maggi', 'Löwensenf', 'Bautz\'ner', 'Ernte Krone', 'mysmile', 'Die süße Susi'
];

// ============================================================================
// PUNKT 3: INTELLIGENTE NAMENS-OPTIMIERUNG (FOKUS AUF PRODUKT + "/ KURZMARKE")
// Beispiel: "Bayer. Pilze & Waldfrüchte Uwe Niklas GmbH Pfifferlinge TK" -> "Pfifferlinge TK / Bayer."
// ============================================================================
export function shortenBrandString(rawBrand) {
  if (!rawBrand) return '';
  let b = String(rawBrand).split(',')[0].trim();

  // Entferne Rechtsformen & Firmenzusätze
  b = b
    .replace(/\b(GmbH\s*&\s*Co\.?\s*KG|GmbH\s*&\s*Co\.?\s*OHG|GmbH|AG|KG|OHG|SE|mbH|e\.?\s*G\.?|Inc\.?|Ltd\.?|S\.?p\.?A\.?|S\.?A\.?)\b/gi, '')
    .replace(/\b(Pilze\s*&\s*Waldfrüchte|Uwe\s+Niklas|Warenhandel|Nahrungsmittel|Lebensmittel|Molkerei|Privatmolkerei|Käserei|Fleischwerke|Feinkost|Vertriebs|Handels|Werke|Deutschland|International)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!b) return '';

  // Behalte bekannte mehrteilige Kurzmarken zusammen
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

  // Falls bereits ein " / " vorhanden ist (z.B. "Pfifferlinge TK / Bayer."), sauber trennen
  if (productPart.includes(' / ')) {
    const parts = productPart.split(' / ');
    productPart = parts[0].trim();
    if (!extractedBrand && parts[1]) {
      extractedBrand = shortenBrandString(parts[1]);
    }
  }

  // 1. Falls explizite Marke am Anfang des Produktnamens klebt, ablösen
  if (explicitBrand) {
    const cleanExp = String(explicitBrand).split(',')[0].trim();
    if (cleanExp && productPart.toLowerCase().startsWith(cleanExp.toLowerCase())) {
      productPart = productPart.slice(cleanExp.length).trim();
    }
  }

  // 2. Erkennt Firmennamen mit GmbH / AG / KG mitten im String:
  // z.B. "Bayer. Pilze & Waldfrüchte Uwe Niklas GmbH Pfifferlinge TK"
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

  // 3. Falls noch eine bekannte Marke am Anfang steht (z.B. "K-Classic Delikatess Rostbratwurst")
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

  // 4. Bereinige Produktkern (Tiefkühl -> TK, entferne Werbefloskeln & Gewichtsangaben am Ende)
  productPart = productPart
    .replace(/\b(tiefgekühlt|tiefgefroren|tiefkühlkost|tiefkühl)\b/gi, 'TK')
    .replace(/\b(delikatess|das komplette|flow pack de|unter schutzatmosphäre|servierfertig|küchenfertig|erntefrisch|feinste|klassische)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,;.\-/]+|[,;.\-/]+$/g, '')
    .trim();

  if (!productPart) productPart = raw;

  // Großbuchstabe am Anfang sicherstellen
  productPart = productPart.charAt(0).toUpperCase() + productPart.slice(1);

  if (extractedBrand && !productPart.toLowerCase().includes(extractedBrand.toLowerCase())) {
    return productPart + ' / ' + extractedBrand;
  }
  return productPart;
}

// ============================================================================
// PUNKT 2: VERBESSERTE KATEGORIE-, LAGERORT- & GLUTENFREI-ERKENNUNG
// ============================================================================
export function detectSmartCategory(nameStr, customCategory = '', offTags = []) {
  if (customCategory && customCategory !== 'auto' && FOOD_CATEGORIES.some(c => c.id === customCategory)) {
    return customCategory;
  }
  const n = String(nameStr || '').toLowerCase();
  const tags = Array.isArray(offTags) ? offTags.join(' ').toLowerCase() : '';

  // 1. Eindeutige Schlüsselwörter im Produktnamen
  if (/pilz|pfifferling|steinpilz|champignon|kräuterseitling|waldfrüchte|beeren|erdbeer|himbeer|heidelbeer|blaubeer|apfel|äpfel|apfelmus|banane|orange|clementine|mandarine|zitrone|limette|melone|ananas|mango|kiwi|traube|birne|avocado|salat|eisberg|feldsalat|mâche|rucola|spinat|gurke|tomate|tomatenmark|oro di parma|paprika|karotte|möhre|zwiebel|knoblauch|brokkoli|blumenkohl|spargel|rotkohl|sauerkraut|mais|erbse|bohne|linse|kichererbse|chili sin carne|gefro/.test(n)) {
    return 'produce';
  }
  if (/butter|kräuterbutter|meggle|margarine|öl|sonnenblumenöl|olivenöl|rapsöl|kokosöl|fett|schmalz|essig|hengstenberg|senf|thomy|ketchup|mayo|mayonnaise|dressing|burger sauce|heinz|soße|sauce|pesto|brühe|fond/.test(n)) {
    return 'oils_fats';
  }
  if (/wasser|mineralwasser|kaffee|espresso|tee|saft|apfelsaft|orangensaft|schorle|cola|limo|getränk|sirup|kakao|\bbier\b|\bwein\b|energydrink/.test(n)) {
    return 'drinks';
  }
  if (/milch|vollmilch|schwarzwaldmilch|landfein|joghurt|quark|skyr|käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta|hirtenkäse|schlagsahne|sahne|schmand|creme fraiche|mascarpone|ayran|kefir|pudding/.test(n)) {
    return 'dairy';
  }
  if (/fleisch|hackfleisch|rinderhack|rind|schwein|hähnchen|huhn|pute|geflügel|schnitzel|steak|gulasch|wurst|bratwurst|rostbratwurst|leberwurst|würstchen|wiener|lyoner|salami|schinken|speck|aufschnitt|fisch|lachs|thunfisch|fischstäbchen|forelle|garnele|\bei\b|eier/.test(n)) {
    return 'meat_fish_eggs';
  }
  if (/brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|nudel|spaghetti|pasta|penne|rigatoni|tortellini|ravioli|spätzle|reis|spitzenreis|langkorn|basmati|jasmin|milchreis|getreide|haferflocken|müsli|cornflakes|choco balls|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|knödel/.test(n)) {
    return 'grains';
  }
  if (/schokolade|choco|schoko|nutella|keks|cookie|gummibär|chips|flips|eis|bonbon|praline|zuckerware|riegel/.test(n)) {
    return 'sweets_snacks';
  }

  // 2. Fallback über OpenFoodFacts-Kategorien
  if (/fruits|vegetables|mushrooms|plant-based-foods-and-beverages|salads|legumes/.test(tags)) return 'produce';
  if (/dairies|cheeses|milks|yogurts|creams/.test(tags)) return 'dairy';
  if (/meats|poultries|fishes|seafood|sausages|eggs/.test(tags)) return 'meat_fish_eggs';
  if (/cereals|breads|pastas|potatoes|flours|tortillas/.test(tags)) return 'grains';
  if (/fats|oils|sauces|condiments|vinegars|mustards/.test(tags)) return 'oils_fats';
  if (/beverages|waters|juices|coffees|teas/.test(tags)) return 'drinks';

  return detectFoodCategory(nameStr);
}

export function detectSmartLocation(nameStr, categoryId = '', offTags = []) {
  const n = String(nameStr || '').toLowerCase();
  const tags = Array.isArray(offTags) ? offTags.join(' ').toLowerCase() : '';

  // 1. Tiefkühl-Erkennung (z.B. "Pfifferlinge TK", "tiefgekühlt", "en:frozen-foods")
  if (/\btk\b|tiefkühl|tiefgekühlt|tiefgefroren|gefrier|eiscreme|speiseeis|fischstäbchen|pommes/.test(n) || /frozen/.test(tags)) {
    return 'freezer';
  }
  // 2. Konserven & Trockenvorrat -> Keller / Vorrat
  if (/konserve|dose|im glas|apfelmus|rotkohl|spargel|tomatenmark|passierte|nudel|spaghetti|pasta|reis|mehl|zucker|haferflocken|müsli|choco balls|öl|essig|senf|ketchup|gefro|chili sin carne|kartoffelpüree|kartoffel|zwiebel|knoblauch|haltbare/.test(n)) {
    return 'pantry';
  }
  // 3. Kühlpflichtige Kategorien & Frischeprodukte -> Kühlschrank
  const resolvedCat = categoryId || detectSmartCategory(nameStr, '', offTags);
  if (resolvedCat === 'dairy' || resolvedCat === 'meat_fish_eggs') {
    return 'fridge';
  }
  if (/salat|feldsalat|mâche|eisberg|rucola|spinat|gurke|paprika|brokkoli|karotte|möhre|beere|erdbeer|himbeer|heidelbeer|pilz|pfifferling|champignon|butter|kräuterbutter|frisch/.test(n)) {
    return 'fridge';
  }
  return 'kitchen';
}

export function isProductGlutenFree(itemOrName, customCategory = '', manualFlag = undefined, offAllergens = [], offLabels = []) {
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

function estimateProduceByName(inputName) {
  const lower = String(inputName || '').toLowerCase().trim();
  if (!lower) return null;
  for (const item of FRESH_PRODUCE_MHD_DB) {
    if (item.keywords.some(kw => lower === kw || lower.includes(kw))) {
      return item;
    }
  }
  return null;
}

export default function PocketScanner({
  cartItems,
  todayStr,
  isSyncing,
  themeStyles,
  onAddSingleToCart,
  onAddBatchToCart,
  onRemoveCartItem,
  onTransferSingleCartItemToStock,
  onTransferAllCartToStock,
  showToast
}) {
  const [scannerMode, setScannerMode] = useState('barcode'); // 'barcode' | 'object_ai' | 'receipt'
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [showProduceDrawer, setShowProduceDrawer] = useState(false);

  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('fridge');
  const [scanCategory, setScanCategory] = useState('auto');
  const [scanGlutenFree, setScanGlutenFree] = useState('auto'); // 'auto' | 'yes' | 'no'
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [estimatedMhdHint, setEstimatedMhdHint] = useState('');

  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);
  const [detectedMhdCandidate, setDetectedMhdCandidate] = useState('');
  const [lastOcrRawHint, setLastOcrRawHint] = useState('');
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [isDetectingObject, setIsDetectingObject] = useState(false);
  const [autoMhdScanEnabled] = useState(true);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const mhdAutoLoopRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const mobileNetModelRef = useRef(null);
  const wakeLockRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isReadingMhdRef = useRef(false);

  const requestScreenWakeLock = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  };

  const releaseScreenWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) {}
  };

  const stopCameraStream = () => {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    releaseScreenWakeLock();
    setCameraActive(false);
    setTorchOn(false);
    setZoomActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate?.().catch(() => {});
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  const toggleCameraTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      showToast('Kameralicht', 'Taschenlampe wird auf diesem Gerät nicht unterstützt.', '🔦');
    }
  };

  const toggleCameraZoom = async () => {
    const next = !zoomActive;
    setZoomActive(next);
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (track) {
        await track.applyConstraints({ advanced: [{ zoom: next ? 2.0 : 1.0 }] });
      }
    } catch (e) {}
  };

  const applyFreshProduceSelection = (produceItem, showFeedbackToast = true) => {
    if (!produceItem) return;
    const estDate = formatDateStr(addDays(new Date(), produceItem.days));
    setScanName(produceItem.name);
    setScanLocation(produceItem.location);
    setScanCategory(produceItem.category);
    setScanGlutenFree('yes');
    setScanExpiry(estDate);
    setDetectedMhdCandidate(estDate);
    setEstimatedMhdHint(
      produceItem.emoji + ' ' + produceItem.name + ' → MHD +' + produceItem.days + ' Tage (' + produceItem.hint + ')'
    );
    setShowProduceDrawer(false);
    playMobileBeep('scan');
    try { navigator.vibrate?.(65); } catch (e) {}
    if (showFeedbackToast) {
      showToast(
        produceItem.name + ' gewählt!',
        'Lagerort & MHD (+' + produceItem.days + ' Tage) automatisch gesetzt.',
        produceItem.emoji
      );
    }
  };

  const loadMobileNetModel = async () => {
    if (mobileNetModelRef.current) return mobileNetModelRef.current;
    if (typeof window === 'undefined') return null;

    if (!window.tf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    if (!window.mobilenet) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const model = await window.mobilenet.load({ version: 2, alpha: 0.5 });
    mobileNetModelRef.current = model;
    return model;
  };

  const detectProduceByCenterColor = (canvas) => {
    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const data = ctx.getImageData(Math.floor(w * 0.25), Math.floor(h * 0.25), Math.floor(w * 0.5), Math.floor(h * 0.5)).data;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
      const r = rSum / count;
      const g = gSum / count;
      const b = bSum / count;

      if (g > r * 1.18 && g > b * 1.25) {
        return g < 110
          ? FRESH_PRODUCE_MHD_DB.find(x => x.id === 'cucumber')
          : FRESH_PRODUCE_MHD_DB.find(x => x.id === 'salad');
      }
      if (r > 165 && g > 95 && g < 165 && b < 80) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'orange');
      }
      if (r > 170 && g > 160 && b < 95) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'banana');
      }
      if (r > g * 1.35 && r > b * 1.35) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'apple');
      }
    } catch (e) {}
    return null;
  };

  const recognizeProduceFromCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      showToast('Kamera starten', 'Bitte schalte oben rechts zuerst die Kamera ein.', '📷');
      return;
    }
    if (isDetectingObject) return;
    setIsDetectingObject(true);
    showToast('KI-Objekterkennung läuft...', 'Erkenne Obst/Gemüse & schätze Haltbarkeit...', '🍎');

    try {
      const vid = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

      let matchedProduce = null;
      try {
        const model = await loadMobileNetModel();
        if (model) {
          const predictions = await model.classify(canvas, 5);
          if (Array.isArray(predictions)) {
            for (const pred of predictions) {
              const cls = String(pred.className || '').toLowerCase();
              const found = FRESH_PRODUCE_MHD_DB.find(item =>
                item.aiLabels.some(lbl => cls.includes(lbl))
              );
              if (found) {
                matchedProduce = found;
                break;
              }
            }
          }
        }
      } catch (e) {}

      if (!matchedProduce) {
        matchedProduce = detectProduceByCenterColor(canvas);
      }

      if (matchedProduce) {
        applyFreshProduceSelection(matchedProduce, true);
      } else {
        setShowProduceDrawer(true);
        showToast('Bitte näher heranhalten', 'Oder wähle das Obst/Gemüse direkt im aufgeklappten Menü!', '🔍');
      }
    } catch (err) {
      setShowProduceDrawer(true);
    } finally {
      setIsDetectingObject(false);
    }
  };

  const extractExpiryDateFromText = (rawText) => {
    const clean = String(rawText || '')
      .replace(/[|lI!]/g, '1')
      .replace(/[OQ]/g, '0')
      .replace(/S(?=\d)/g, '5')
      .replace(/B(?=\d)/g, '8')
      .replace(/Z(?=\d)/g, '2');

    const dmyRegex = /(0?[1-9]|[12][0-9]|3[01])\s*[.,/\-\s:·•_]+\s*(0?[1-9]|1[0-2])\s*[.,/\-\s:·•_]+\s*(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    let match;
    while ((match = dmyRegex.exec(clean)) !== null) {
      const day = String(match[1]).padStart(2, '0');
      const month = String(match[2]).padStart(2, '0');
      let year = String(match[3]);
      if (year.length === 2) year = '20' + year;
      const numYear = Number(year);
      if (numYear >= 2025 && numYear <= 2036) {
        return year + '-' + month + '-' + day;
      }
    }

    const compactRegex = /\b(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    while ((match = compactRegex.exec(clean)) !== null) {
      const day = match[1];
      const month = match[2];
      let year = match[3];
      if (year.length === 2) year = '20' + year;
      return year + '-' + month + '-' + day;
    }

    const myRegex = /\b(0?[1-9]|1[0-2])\s*[.,/\-:]+\s*(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    while ((match = myRegex.exec(clean)) !== null) {
      const month = String(match[1]).padStart(2, '0');
      let year = String(match[2]);
      if (year.length === 2) year = '20' + year;
      return year + '-' + month + '-28';
    }

    return null;
  };

  const getFastMhdOcrWorker = async () => {
    if (ocrWorkerRef.current) return ocrWorkerRef.current;

    if (typeof window !== 'undefined' && !window.Tesseract) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    if (window.Tesseract?.createWorker) {
      const worker = await window.Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,/-:MHDmhd '
      });
      ocrWorkerRef.current = worker;
      return worker;
    }
    return null;
  };

  const captureMhdFromLiveCamera = async (silentMode = false) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentMode) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return;
    }
    if (isReadingMhdRef.current) return;

    isReadingMhdRef.current = true;
    setIsReadingMhd(true);

    try {
      const vid = videoRef.current;
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 480;

      const cropX = Math.floor(vw * 0.10);
      const cropY = Math.floor(vh * 0.28);
      const cropW = Math.floor(vw * 0.80);
      const cropH = Math.floor(vh * 0.44);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(2.1) grayscale(1) brightness(1.12)';
      ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const worker = await getFastMhdOcrWorker();
      const result = worker
        ? await worker.recognize(canvas)
        : await window.Tesseract.recognize(canvas, 'eng');

      const detectedText = String(result?.data?.text || '').trim();
      const singleLineHint = detectedText.replace(/\s+/g, ' ').slice(0, 42);
      if (singleLineHint) setLastOcrRawHint(singleLineHint);

      const parsedDate = extractExpiryDateFromText(detectedText);

      if (parsedDate) {
        setDetectedMhdCandidate(parsedDate);
        setScanExpiry(parsedDate);
        playMobileBeep('scan');
        try { navigator.vibrate?.(70); } catch (e) {}
        const niceDate = parsedDate.slice(8, 10) + '.' + parsedDate.slice(5, 7) + '.' + parsedDate.slice(0, 4);
        showToast('MHD erkannt: ' + niceDate, 'Tippe auf „🛒 In den Einkaufswagen“!', '🎉');
      } else if (!silentMode) {
        showToast('Datum noch unscharf', 'Tipp: Nutze oben im Bild „🔍 2x“ oder „🔦 Licht“.', '🔍');
      }
    } catch (err) {
      if (!silentMode) showToast('MHD-Scan Hinweis', 'Bitte noch einmal antippen.', '⚠️');
    } finally {
      isReadingMhdRef.current = false;
      setIsReadingMhd(false);
    }
  };

  useEffect(() => {
    if (!cameraActive || !autoMhdScanEnabled || scannerMode === 'object_ai') {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
      return;
    }
    mhdAutoLoopRef.current = setInterval(() => {
      if (!isReadingMhdRef.current && !detectedMhdCandidate) {
        captureMhdFromLiveCamera(true);
      }
    }, 1250);

    return () => {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    };
  }, [cameraActive, autoMhdScanEnabled, detectedMhdCandidate, scannerMode]);

  // ============================================================================
  // VERBESSERTER BARCODE-LOOKUP INKL. AUTO-NAMENSKÜRZUNG, KATEGORIE, ORT & GF
  // ============================================================================
  const lookupBarcodeOnOpenFoodFacts = async (code) => {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) return;
    setScannedBarcode(cleanCode);
    setIsLookingUpProduct(true);
    try {
      const res = await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(cleanCode) + '.json');
      const data = await res.json();
      if (data && data.product) {
        const p = data.product;
        const rawProdName = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || '';
        const rawBrand = p.brands ? p.brands.split(',')[0].trim() : '';
        const offCats = Array.isArray(p.categories_tags) ? p.categories_tags : [];
        const offAllergens = Array.isArray(p.allergens_tags) ? p.allergens_tags : [];
        const offLabels = Array.isArray(p.labels_tags) ? p.labels_tags : [];

        // Falls in Kategorien "frozen" vorkommt und im Namen noch kein TK steht, "TK" ergänzen
        let nameWithTk = rawProdName;
        if (offCats.some(t => /frozen/.test(t)) && !/\btk\b|tiefkühl|tiefgekühlt/i.test(nameWithTk)) {
          nameWithTk = (nameWithTk + ' TK').trim();
        }

        // Punkt 3: Automatische Namens-Vereinfachung ("Pfifferlinge TK / Bayer.")
        const smartName = simplifyProductName(nameWithTk || rawBrand, rawBrand);
        const qty = p.quantity ? String(p.quantity).trim() : '1x';
        const img = p.image_front_small_url || p.image_thumb_url || '';

        if (img) setScanImageUrl(img);
        if (smartName) {
          const detectedCat = detectSmartCategory(smartName, 'auto', offCats);
          const detectedLoc = detectSmartLocation(smartName, detectedCat, offCats);
          const isGf = isProductGlutenFree(smartName, detectedCat, 'auto', offAllergens, offLabels);

          setScanName(smartName);
          setScanQty(qty);
          setScanCategory(detectedCat);
          setScanLocation(detectedLoc);
          setScanGlutenFree(isGf ? 'yes' : 'auto');

          // Automatischer MHD-Vorschlag bei Tiefkühlkost oder Frischeprodukt
          const freshMatch = estimateProduceByName(smartName);
          if (detectedLoc === 'freezer' && !scanExpiry) {
            const tkDate = formatDateStr(addDays(new Date(), 180));
            setScanExpiry(tkDate);
            setDetectedMhdCandidate(tkDate);
            setEstimatedMhdHint('❄️ Tiefkühl-Produkt erkannt → Lagerort „❄️ TK“ & MHD +6 Monate vorgeschlagen.');
          } else if (freshMatch && !scanExpiry) {
            const estDate = formatDateStr(addDays(new Date(), freshMatch.days));
            setScanExpiry(estDate);
            setDetectedMhdCandidate(estDate);
            setEstimatedMhdHint(freshMatch.emoji + ' Frischeprodukt → MHD +' + freshMatch.days + ' Tage (' + freshMatch.hint + ')');
          }

          playMobileBeep('scan');
          try { navigator.vibrate?.(50); } catch (e) {}
          showToast(
            'Erkannt & optimiert!',
            smartName + (isGf ? ' (🌾✓ Glutenfrei)' : ''),
            getFoodEmoji(smartName)
          );
          return;
        }
      }
      showToast('Barcode gescannt', 'Code ' + cleanCode + ' – bitte Namen kurz eingeben.', '📷');
    } catch (e) {
      showToast('Barcode erfasst', 'Code: ' + cleanCode, '📷');
    } finally {
      setIsLookingUpProduct(false);
    }
  };

  const startLiveBarcodeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      const track = stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }

      streamRef.current = stream;
      setCameraActive(true);
      requestScreenWakeLock();
      getFastMhdOcrWorker().catch(() => {});

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);

      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'qr_code', 'upc_a', 'code_128']
        });
        scanLoopRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawVal = String(barcodes[0].rawValue || '').trim();
              const now = Date.now();
              if (rawVal && (rawVal !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 6000)) {
                lastScannedCodeRef.current = rawVal;
                lastScanTimeRef.current = now;
                lookupBarcodeOnOpenFoodFacts(rawVal);
              }
            }
          } catch (err) {}
        }, 380);
      }
    } catch (err) {
      showToast('Kamera-Zugriff', 'Bitte erlaube den Kamera-Zugriff im Browser.', '⚠️');
    }
  };

  const handleReceiptPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningReceipt(true);
    showToast('Analysiere Kassenbon...', 'Texterkennung liest & optimiert deine Einkäufe...', '🧾');

    try {
      if (typeof window !== 'undefined' && !window.Tesseract) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const result = await window.Tesseract.recognize(file, 'deu');
      const lines = String(result?.data?.text || '')
        .split(/\r?\n/)
        .map(l => l.replace(/[0-9]+[,.][0-9]{2}\s*[AB]?$/g, '').trim())
        .filter(l =>
          l.length >= 3 &&
          !/summe|gesamt|kartenzahlung|steuer|mwst|datum|uhrzeit|vielen dank|filiale|bon|eur|bar|rückgeld/i.test(l)
        );

      const extracted = lines.slice(0, 15).map((txt, idx) => {
        const cleanName = simplifyProductName(txt);
        const freshEst = estimateProduceByName(cleanName);
        const cat = freshEst ? freshEst.category : detectSmartCategory(cleanName);
        const loc = freshEst ? freshEst.location : detectSmartLocation(cleanName, cat);
        const estDays = loc === 'freezer' ? 180 : freshEst ? freshEst.days : 7;
        return {
          id: 'rec_' + Date.now() + '_' + idx,
          name: cleanName,
          quantity: '1x',
          location: loc,
          category: cat,
          glutenFree: isProductGlutenFree(cleanName, cat) ? 'yes' : 'auto',
          expiryDate: formatDateStr(addDays(new Date(), estDays)),
          selected: true
        };
      });

      setReceiptItems(extracted);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt & Namen vereinfacht.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleNameInputChange = (val) => {
    setScanName(val);
    const cat = detectSmartCategory(val, scanCategory);
    const loc = detectSmartLocation(val, cat);
    setScanLocation(loc);

    const matched = estimateProduceByName(val);
    if (matched) {
      const estDate = formatDateStr(addDays(new Date(), matched.days));
      setScanCategory(matched.category);
      if (!scanExpiry) {
        setScanExpiry(estDate);
        setDetectedMhdCandidate(estDate);
      }
      setEstimatedMhdHint(
        matched.emoji + ' ' + matched.name + ': Empfohlenes MHD +' + matched.days + ' Tage (' + matched.hint + ')'
      );
    } else if (loc === 'freezer' && !scanExpiry) {
      const tkDate = formatDateStr(addDays(new Date(), 180));
      setScanExpiry(tkDate);
      setDetectedMhdCandidate(tkDate);
      setEstimatedMhdHint('❄️ TK erkannt → Gefrierschrank & +6 Monate MHD vorgeschlagen.');
    } else {
      setEstimatedMhdHint('');
    }
  };

  const handleSimplifyCurrentNameClick = () => {
    if (!scanName.trim()) return;
    const simplified = simplifyProductName(scanName);
    setScanName(simplified);
    const cat = detectSmartCategory(simplified);
    const loc = detectSmartLocation(simplified, cat);
    setScanCategory(cat);
    setScanLocation(loc);
    showToast('Name vereinfacht ✨', simplified, getFoodEmoji(simplified));
  };

  const triggerAddCurrentScanToCart = (overrideExpiry = '') => {
    const finalExp = overrideExpiry || scanExpiry || detectedMhdCandidate;
    const rawName = scanName.trim();
    if (!rawName || !finalExp) {
      showToast('Pflichtfelder', 'Bitte Produktname und Ablaufdatum (MHD) wählen.', '⚠️');
      return;
    }
    const finalName = simplifyProductName(rawName);
    const resolvedCategory = scanCategory === 'auto' ? detectSmartCategory(finalName) : scanCategory;
    const resolvedGf = scanGlutenFree === 'auto'
      ? (isProductGlutenFree(finalName, resolvedCategory) ? 'yes' : 'no')
      : scanGlutenFree;

    onAddSingleToCart(
      finalName,
      scannedBarcode,
      scanQty.trim(),
      scanLocation,
      resolvedCategory,
      finalExp,
      scanImageUrl,
      resolvedGf
    );

    setScanName('');
    setScannedBarcode('');
    setScanCategory('auto');
    setScanGlutenFree('auto');
    setScanExpiry('');
    setScanImageUrl('');
    setDetectedMhdCandidate('');
    setEstimatedMhdHint('');
    setLastOcrRawHint('');
    lastScannedCodeRef.current = '';
  };

  const detectedScanCatObj = FOOD_CATEGORIES.find(
    c => c.id === (scanCategory === 'auto' ? detectSmartCategory(scanName) : scanCategory)
  ) || FOOD_CATEGORIES[1];

  const isCurrentScanGf = isProductGlutenFree(scanName, detectedScanCatObj.id, scanGlutenFree);

  const sortedCart = Array.isArray(cartItems)
    ? [...cartItems].sort((a, b) => Number(b.scannedAt || 0) - Number(a.scannedAt || 0))
    : [];

  return (
    <div className="space-y-3">
      {/* 1. KOMPAKTE MODUS-LEISTE + KAMERA-SCHALTER */}
      <div className="flex items-center gap-1.5">
        <div className="grid grid-cols-3 gap-1 flex-1 p-1 rounded-2xl bg-black/35 border border-white/10">
          <button
            type="button"
            onClick={() => { setScannerMode('barcode'); setShowProduceDrawer(false); }}
            className={'py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'barcode' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => { setScannerMode('object_ai'); setShowProduceDrawer(true); }}
            className={'py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'object_ai' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>🍎 Obst-KI</span>
          </button>
          <button
            type="button"
            onClick={() => { stopCameraStream(); setScannerMode('receipt'); }}
            className={'py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'receipt' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>🧾 Bon</span>
          </button>
        </div>

        {scannerMode !== 'receipt' && (
          !cameraActive ? (
            <button
              type="button"
              onClick={startLiveBarcodeCamera}
              className="tw-active-nav px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shrink-0 shadow-lg"
            >
              <Camera className="w-4 h-4" /> Kamera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCameraStream}
              className="px-3 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black shrink-0 shadow-lg"
            >
              ✕ Aus
            </button>
          )
        )}
      </div>

      {scannerMode !== 'receipt' ? (
        <div className={'p-3.5 rounded-3xl border space-y-3 shadow-lg ' + themeStyles.card}>
          {/* LIVE-KAMERA-SUCHER (NUR WENN AKTIV) */}
          {cameraActive && (
            <div className="space-y-2">
              <div
                onClick={() => scannerMode === 'object_ai' ? recognizeProduceFromCamera() : captureMhdFromLiveCamera(false)}
                className="relative rounded-2xl overflow-hidden border-2 border-sky-400 bg-black aspect-[16/10] cursor-pointer"
              >
                <video
                  ref={videoRef}
                  style={zoomActive ? { transform: 'scale(1.85)', transformOrigin: 'center center' } : undefined}
                  className="w-full h-full object-cover transition-transform duration-200"
                  playsInline
                  muted
                />

                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-10">
                  <span className="text-[10px] font-black bg-black/75 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/40">
                    {isLookingUpProduct
                      ? '⏳ Suche Produkt & kürze Namen...'
                      : scannerMode === 'object_ai'
                      ? '🍎 Obst/Gemüse zeigen & antippen'
                      : '🎯 Barcode oder MHD-Datum in Rahmen halten'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCameraZoom(); }}
                      className={'px-2 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border ' +
                        (zoomActive ? 'bg-sky-500 text-white border-white' : 'bg-black/75 text-white border-white/20')}
                    >
                      <ZoomIn className="w-3 h-3" /> 2x
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCameraTorch(); }}
                      className={'px-2 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border ' +
                        (torchOn ? 'bg-amber-400 text-slate-950 border-white' : 'bg-black/75 text-white border-white/20')}
                    >
                      <Zap className="w-3 h-3" /> Licht
                    </button>
                  </div>
                </div>

                <div className="absolute inset-x-6 top-[26%] bottom-[26%] border-2 border-amber-400 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex flex-col justify-center">
                  <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_10px_#10b981] animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => captureMhdFromLiveCamera(false)}
                  disabled={isReadingMhd}
                  className="tw-active-nav py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                >
                  <ScanLine className={'w-3.5 h-3.5 shrink-0 ' + (isReadingMhd ? 'animate-spin' : '')} />
                  <span>{isReadingMhd ? '⏳ Lese MHD...' : '📸 MHD ablesen'}</span>
                </button>

                <button
                  type="button"
                  onClick={recognizeProduceFromCamera}
                  disabled={isDetectingObject}
                  className="py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Sparkles className={'w-3.5 h-3.5 shrink-0 ' + (isDetectingObject ? 'animate-spin' : '')} />
                  <span>{isDetectingObject ? '⏳ Erkenne...' : '🍎 Obst/Gemüse KI'}</span>
                </button>
              </div>
            </div>
          )}

          {/* EINKLAPPBARES FRISCHE-DROPDOWN STATT DAUERHAFT OFFENER LEISTE */}
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowProduceDrawer(prev => !prev)}
              className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-black text-emerald-300"
            >
              <span>🥒🍎 Schnellwahl: Frisches Obst & Gemüse (inkl. Auto-MHD)</span>
              {showProduceDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showProduceDrawer && (
              <div className="px-2.5 pb-2.5 pt-1 border-t border-emerald-400/20 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {FRESH_PRODUCE_MHD_DB.map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => applyFreshProduceSelection(prod, true)}
                      className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-400 flex items-center gap-2 text-left"
                    >
                      <span className="text-lg shrink-0">{prod.emoji}</span>
                      <div className="min-w-0 leading-tight">
                        <div className="text-[11px] font-extrabold text-white truncate">{prod.name.split(' ')[0]}</div>
                        <div className="text-[9px] font-black text-emerald-400">+{prod.days} Tage</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {estimatedMhdHint && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-extrabold text-emerald-200">
              {estimatedMhdHint}
            </div>
          )}

          {/* =========================================================
              AUFGERÄUMTES EINGABE-FORMULAR MIT DROPDOWNS & NAMENS-OPTIMIERER
             ========================================================= */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerAddCurrentScanToCart();
            }}
            className="space-y-2.5"
          >
            {/* ZEILE 1: EMOJI + PRODUKTNAME + "✨ KÜRZEN"-BUTTON + GLUTENFREI-BADGE */}
            <div className="flex items-center gap-1.5">
              <span className="w-11 h-11 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {getFoodEmoji(scanName)}
              </span>

              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  required
                  value={scanName}
                  onChange={(e) => handleNameInputChange(e.target.value)}
                  placeholder="Produktname (z.B. Pfifferlinge TK / Bayer.)..."
                  className={'w-full h-11 pl-3 pr-16 rounded-2xl border text-xs sm:text-sm font-extrabold ' + themeStyles.input}
                />
                {scanName.trim().length > 3 && (
                  <button
                    type="button"
                    onClick={handleSimplifyCurrentNameClick}
                    title="Langen Herstellernamen automatisch auf 'Produkt / Kurzmarke' kürzen"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-2 rounded-xl bg-sky-500/25 border border-sky-400/40 text-sky-200 text-[10px] font-black flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Kürzen</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setScanGlutenFree(prev => (isCurrentScanGf ? 'no' : 'yes'))}
                title="Glutenfrei-Status umschalten"
                className={'h-11 px-2.5 rounded-2xl text-[10px] font-black shrink-0 border flex flex-col items-center justify-center leading-tight ' +
                  (isCurrentScanGf
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300'
                    : 'bg-black/25 border-white/10 text-slate-400')}
              >
                <span>🌾✓</span>
                <span>{isCurrentScanGf ? 'GF' : 'Normal'}</span>
              </button>
            </div>

            {/* ZEILE 2: MENGE + LAGERORT-DROPDOWN + KATEGORIE-DROPDOWN */}
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <div className="col-span-4 flex items-center bg-black/25 p-1 rounded-2xl border border-white/10 h-11">
                <button
                  type="button"
                  onClick={() => setScanQty(stepMobileQty(scanQty, -1))}
                  className="tw-nav-inactive w-8 h-full rounded-xl font-black text-sm flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="text"
                  value={scanQty}
                  onChange={(e) => setScanQty(e.target.value)}
                  className="w-full bg-transparent text-center text-xs font-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setScanQty(stepMobileQty(scanQty, 1))}
                  className="tw-glow-btn w-8 h-full rounded-xl font-black text-sm flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>

              {/* LAGERORT ALS ÜBERSICHTLICHES DROPDOWN */}
              <select
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
                className={'col-span-4 h-11 px-2.5 rounded-2xl border text-xs font-extrabold ' + themeStyles.input}
              >
                {STORAGE_PILLS.map(loc => (
                  <option key={loc.id} value={loc.id} className="bg-slate-800 text-white">
                    {loc.label}
                  </option>
                ))}
              </select>

              {/* KATEGORIE ALS ÜBERSICHTLICHES DROPDOWN */}
              <select
                value={scanCategory}
                onChange={(e) => setScanCategory(e.target.value)}
                className={'col-span-4 h-11 px-2.5 rounded-2xl border text-xs font-extrabold ' + themeStyles.input}
              >
                <option value="auto" className="bg-slate-800 text-amber-300">
                  ✨ {detectedScanCatObj.icon} {detectedScanCatObj.title.split(',')[0]}
                </option>
                {FOOD_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                    {cat.icon} {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {/* ZEILE 3: KOMPAKTE MHD-LEISTE MIT SCHNELLWAHL-DROPDOWN & DATUMSFELD */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase text-amber-300">
                  📅 Ablaufdatum (MHD)
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { l: '+5T', d: 5 },
                    { l: '+1W', d: 7 },
                    { l: '+2W', d: 14 },
                    { l: '+6M (TK)', d: 180 }
                  ].map(b => (
                    <button
                      key={b.d}
                      type="button"
                      onClick={() => {
                        const d = formatDateStr(addDays(new Date(), b.d));
                        setScanExpiry(d);
                        setDetectedMhdCandidate(d);
                      }}
                      className="tw-glow-btn px-2 py-0.5 rounded-lg text-[10px] font-black"
                    >
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    if (!days) return;
                    const d = formatDateStr(addDays(new Date(), days));
                    setScanExpiry(d);
                    setDetectedMhdCandidate(d);
                  }}
                  className={'col-span-5 h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value="" className="bg-slate-800 text-amber-300">⏳ MHD-Zeitraum...</option>
                  <option value="3" className="bg-slate-800 text-white">+3 Tage (Frisch)</option>
                  <option value="5" className="bg-slate-800 text-white">+5 Tage</option>
                  <option value="7" className="bg-slate-800 text-white">+1 Woche</option>
                  <option value="10" className="bg-slate-800 text-white">+10 Tage</option>
                  <option value="14" className="bg-slate-800 text-white">+2 Wochen</option>
                  <option value="30" className="bg-slate-800 text-white">+1 Monat</option>
                  <option value="90" className="bg-slate-800 text-white">+3 Monate</option>
                  <option value="180" className="bg-slate-800 text-white">+6 Monate (TK)</option>
                  <option value="365" className="bg-slate-800 text-white">+1 Jahr (Vorrat)</option>
                </select>

                <input
                  type="date"
                  required
                  min={todayStr}
                  value={scanExpiry}
                  onChange={(e) => {
                    setScanExpiry(e.target.value);
                    setDetectedMhdCandidate(e.target.value);
                  }}
                  className={'col-span-7 h-10 px-3 rounded-xl border text-xs font-black ' + themeStyles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!scanName.trim() || (!scanExpiry && !detectedMhdCandidate)}
              className={'w-full min-h-[50px] py-3 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 ' +
                (!scanName.trim() || (!scanExpiry && !detectedMhdCandidate) ? 'bg-slate-700 text-slate-400 opacity-50' : 'tw-active-nav')}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {(scanExpiry || detectedMhdCandidate)
                  ? ('🛒 In Einkaufswagen (' + (scanExpiry || detectedMhdCandidate).slice(8, 10) + '.' + (scanExpiry || detectedMhdCandidate).slice(5, 7) + '.)')
                  : '⚠️ Erst Ablaufdatum (MHD) wählen'}
              </span>
            </button>
          </form>
        </div>
      ) : (
        /* KASSENBON-SCANNER INKL. AUTOMATISCHER NAMENS-VEREINFACHUNG */
        <div className={'p-4 rounded-3xl border space-y-3.5 shadow-md ' + themeStyles.card}>
          <h2 className="font-black text-base">🧾 Kassenbon abfotografieren</h2>
          <label className="tw-active-nav w-full min-h-[50px] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg">
            <Camera className="w-5 h-5" />
            <span>{isScanningReceipt ? '⏳ Lese & vereinfache Bon...' : '📸 Kassenbon jetzt fotografieren'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptPhotoUpload}
            />
          </label>

          {receiptItems.length > 0 && (
            <div className="space-y-2 pt-1">
              {receiptItems.map((rit, idx) => (
                <div key={rit.id} className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rit.selected}
                      onChange={() => {
                        const next = [...receiptItems];
                        next[idx].selected = !next[idx].selected;
                        setReceiptItems(next);
                      }}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <input
                      type="text"
                      value={rit.name}
                      onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx].name = e.target.value;
                        setReceiptItems(next);
                      }}
                      className="flex-1 bg-transparent text-xs font-extrabold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...receiptItems];
                        next[idx].name = simplifyProductName(next[idx].name);
                        setReceiptItems(next);
                      }}
                      className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-[10px] font-black"
                    >
                      ✨ Kürzen
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pl-7">
                    <select
                      value={rit.location}
                      onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx].location = e.target.value;
                        setReceiptItems(next);
                      }}
                      className={'px-2 py-1 rounded-lg border text-[10px] font-bold ' + themeStyles.input}
                    >
                      {STORAGE_PILLS.map(l => (
                        <option key={l.id} value={l.id} className="bg-slate-800 text-white">{l.label}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      required
                      value={rit.expiryDate}
                      onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx].expiryDate = e.target.value;
                        setReceiptItems(next);
                      }}
                      className={'px-2.5 py-1 rounded-lg border text-xs font-bold ' + themeStyles.input}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const selected = receiptItems.filter(it => it.selected && it.name.trim() && it.expiryDate);
                  if (selected.length === 0) return;
                  onAddBatchToCart(selected);
                  setReceiptItems([]);
                }}
                className="tw-active-nav w-full min-h-[48px] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>🛒 Markierte Bon-Artikel in den Einkaufswagen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* EINKAUFSWAGEN UNTER DEM SCANNER */}
      <div className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-xs uppercase text-amber-400 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              <span>🛒 Einkaufswagen ({sortedCart.length})</span>
            </span>
            <p className="text-[10px] opacity-70 font-semibold">
              Zuletzt gescanntes Produkt steht ganz oben
            </p>
          </div>

          {sortedCart.length > 0 && (
            <button
              type="button"
              disabled={isSyncing}
              onClick={onTransferAllCartToStock}
              className="tw-active-nav px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Alle in Bestand ({sortedCart.length})</span>
            </button>
          )}
        </div>

        {sortedCart.length === 0 ? (
          <div className="py-4 text-center text-xs opacity-50 font-bold">
            🛒 Dein Einkaufswagen ist noch leer.
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedCart.map((cItem, idx) => {
              const locObj = STORAGE_PILLS.find(l => l.id === cItem.location) || STORAGE_PILLS[0];
              const isGf = isProductGlutenFree(cItem);
              return (
                <div
                  key={cItem.id}
                  className={'px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ' +
                    (idx === 0 ? 'border-amber-400/70 bg-amber-500/10' : themeStyles.subtle)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xl shrink-0">{getFoodEmoji(cItem.name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                            NEU
                          </span>
                        )}
                        {isGf && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[9px] font-black shrink-0">
                            🌾✓ GF
                          </span>
                        )}
                        <span className="font-extrabold text-xs truncate">{cItem.name}</span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-bold">
                        {cItem.quantity} • {locObj.label} • MHD: {cItem.expiryDate.slice(8, 10)}.{cItem.expiryDate.slice(5, 7)}.{cItem.expiryDate.slice(2, 4)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTransferSingleCartItemToStock(cItem)}
                      className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Bestand</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCartItem(cItem.id)}
                      className="tw-nav-inactive p-1.5 rounded-xl text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}