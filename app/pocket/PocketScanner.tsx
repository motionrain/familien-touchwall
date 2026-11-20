// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

//
//
// ============================================================================
// PART 01: IMPORTS, KONSTANTEN, FRISCHE-DB, MARKEN & ETIKETTEN-KEYWORDS
// ============================================================================
//
//

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, ScanLine, FileText, Trash2,
  Check, Zap, ZoomIn, Sparkles, Apple, ShoppingCart,
  PackagePlus, ChevronDown, ChevronUp, Wand2, Tag, X
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';
import ProductThumb from '../ProductThumb';
import {
  extractOpenFoodFactsImage,
  uploadProductPhotoToSupabase
} from '../productImageUtils';
import {
  FOOD_CATEGORIES,
  STORAGE_PILLS,
  detectFoodCategory,
  getFoodEmoji,
  decrementItemPieceCount,
  stepMobileQty,
  playMobileBeep
} from '../foodUtils';

const { formatDateStr, addDays } = Cfg;

// 2 Stunden Spielraum (in Millisekunden), bevor ein erneuter Barcode-Scan das Ausbuchen anbietet
const TWO_HOURS_GRACE_MS = 2 * 60 * 60 * 1000;

// Alle 1D- & 2D-Barcode- und QR-Code-Formate
const ALL_DESIRED_BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'itf',
  'qr_code',
  'data_matrix',
  'pdf417',
  'aztec'
];

export const FOOD_EMOJI_PICKER = [
  '🌭', '🥩', '🍗', '🥓', '🍔', '🐟', '🥚', '🧀', '🧈', '🥛',
  '🥣', '🥬', '🥒', '🍅', '🫑', '🥕', '🥔', '🧅', '🥦', '🌽',
  '🍄', '🥑', '🍊', '🍎', '🍌', '🍓', '🍋', '🍇', '🍝', '🍚',
  '🥖', '🥐', '🍕', '🌮', '🥫', '🌾', '🍫', '🍪', '🧃', '🐶',
  '🐾', '🦴', '🐱', '🐴'
];

export const FRESH_PRODUCE_MHD_DB = [
  { id: 'cucumber',    name: 'Gurke (Schlangengurke)',             emoji: '🥒', days: 7,  location: 'fridge',  category: 'produce',        hint: 'Im Kühlschrank ca. 7 Tage knackig',        keywords: ['gurke', 'schlangengurke', 'minigurke', 'landgurke'], aiLabels: ['cucumber', 'cuke', 'zucchini', 'courgette'] },
  { id: 'apple',       name: 'Frische Äpfel',                      emoji: '🍎', days: 21, location: 'kitchen', category: 'produce',        hint: 'Kühl gelagert ca. 3 Wochen haltbar',       keywords: ['apfel', 'äpfel', 'elstar', 'boskoop', 'pink lady', 'gala', 'braeburn'], aiLabels: ['granny smith', 'apple', 'pomegranate', 'fig'] },
  { id: 'orange',      name: 'Orangen / Clementinen',              emoji: '🍊', days: 14, location: 'kitchen', category: 'produce',        hint: 'Zitrusfrüchte halten ca. 14 Tage',         keywords: ['orange', 'orangen', 'clementine', 'clementinen', 'mandarine', 'mandarinen', 'apfelsine'], aiLabels: ['orange', 'tangerine', 'clementine', 'mandarin'] },
  { id: 'melon',       name: 'Melone (Wasser-/Honigmelone)',       emoji: '🍈', days: 10, location: 'kitchen', category: 'produce',        hint: 'Ungeschnitten ca. 10 Tage haltbar',        keywords: ['melone', 'wassermelone', 'honigmelone', 'galiamelone', 'cantaloupe'], aiLabels: ['watermelon', 'melon', 'cantaloupe', 'honeydew', 'jackfruit', 'spaghetti squash', 'butternut squash'] },
  { id: 'salad',       name: 'Frischer Salat (Eisberg / Feldsalat)', emoji: '🥬', days: 4, location: 'fridge', category: 'produce',        hint: 'Im Gemüsefach ca. 4 Tage frisch',          keywords: ['salat', 'eisbergsalat', 'kopfsalat', 'feldsalat', 'mâche', 'rucola', 'blattsalat', 'spinat'], aiLabels: ['head cabbage', 'cabbage', 'lettuce', 'artichoke', 'cardoon', 'bok choy'] },
  { id: 'banana',      name: 'Bananen',                            emoji: '🍌', days: 5,  location: 'kitchen', category: 'produce',        hint: 'Bei Raumtemperatur ca. 5 Tage',            keywords: ['banane', 'bananen'], aiLabels: ['banana', 'plantain'] },
  { id: 'tomato',      name: 'Frische Tomaten',                    emoji: '🍅', days: 7,  location: 'kitchen', category: 'produce',        hint: 'Bei Zimmertemperatur ca. 7 Tage',          keywords: ['tomate', 'tomaten', 'rispentomaten', 'cherrytomaten', 'strauchtomaten'], aiLabels: ['tomato', 'hip'] },
  { id: 'pepper',      name: 'Paprika',                            emoji: '🫑', days: 8,  location: 'fridge',  category: 'produce',        hint: 'Im Kühlschrank ca. 8 Tage knackig',        keywords: ['paprika', 'spitzpaprika', 'paprikaschote'], aiLabels: ['bell pepper', 'pepper', 'chilli', 'jalapeno'] },
  { id: 'broccoli',    name: 'Brokkoli / Blumenkohl',              emoji: '🥦', days: 5,  location: 'fridge',  category: 'produce',        hint: 'Im Kühlschrank ca. 5 Tage frisch',         keywords: ['brokkoli', 'blumenkohl', 'kohlrabi', 'rosenkohl'], aiLabels: ['broccoli', 'cauliflower'] },
  { id: 'carrot',      name: 'Karotten / Möhren',                  emoji: '🥕', days: 14, location: 'fridge',  category: 'produce',        hint: 'Im Gemüsefach bis zu 14 Tage haltbar',     keywords: ['karotte', 'karotten', 'möhre', 'möhren', 'wurzel'], aiLabels: ['carrot', 'parsnip'] },
  { id: 'berries',     name: 'Frische Beeren (Erd-/Heidelbeeren)', emoji: '🍓', days: 3,  location: 'fridge',  category: 'produce',        hint: 'Empfindlich – im Kühlschrank ca. 3 Tage',  keywords: ['erdbeeren', 'erdbeere', 'himbeeren', 'heidelbeeren', 'blaubeeren', 'brombeeren', 'beeren'], aiLabels: ['strawberry', 'raspberry', 'blackberry', 'blueberry'] },
  { id: 'lemon',       name: 'Zitrone / Limette',                  emoji: '🍋', days: 14, location: 'kitchen', category: 'produce',        hint: 'Hält ca. 14 Tage frisch',                  keywords: ['zitrone', 'zitronen', 'limette', 'limetten'], aiLabels: ['lemon', 'lime'] },
  { id: 'avocado',     name: 'Avocado',                            emoji: '🥑', days: 5,  location: 'kitchen', category: 'produce',        hint: 'Reift in ca. 5 Tagen nach',                keywords: ['avocado', 'avocados'], aiLabels: ['avocado', 'guacamole', 'custard apple'] },
  { id: 'mushrooms',   name: 'Frische Champignons / Pilze',        emoji: '🍄', days: 4,  location: 'fridge',  category: 'produce',        hint: 'Im Kühlschrank ca. 4 Tage haltbar',        keywords: ['pilze', 'champignons', 'steinpilze', 'pfifferlinge', 'kräuterseitlinge'], aiLabels: ['mushroom', 'agaric', 'bolete', 'gyromitra'] },
  { id: 'potato',      name: 'Kartoffeln',                         emoji: '🥔', days: 30, location: 'pantry',  category: 'grains',         hint: 'Dunkel & kühl ca. 30 Tage lagerfähig',     keywords: ['kartoffel', 'kartoffeln', 'speisekartoffeln', 'drillinge'], aiLabels: ['potato', 'mashed potato', 'sweet potato'] },
  { id: 'onion',       name: 'Zwiebeln / Knoblauch',               emoji: '🧅', days: 30, location: 'pantry',  category: 'produce',        hint: 'Trocken gelagert ca. 30 Tage haltbar',     keywords: ['zwiebel', 'zwiebeln', 'knoblauch', 'schalotten'], aiLabels: ['onion', 'garlic', 'shallot'] },
  { id: 'pork_fillet', name: 'Schweinefilet / Frischfleisch',      emoji: '🥩', days: 4,  location: 'fridge',  category: 'meat_fish_eggs', hint: 'Frischfleisch im Kühlschrank ca. 3–4 Tage', keywords: ['schweinefilet', 'schweinelende', 'filet vom schwein', 'schnitzel', 'rumpsteak'], aiLabels: [] },
  { id: 'minced_meat', name: 'Hackfleisch (Rind / Gemischt)',      emoji: '🥩', days: 2,  location: 'fridge',  category: 'meat_fish_eggs', hint: 'Hackfleisch sehr kühl lagern (1–2 Tage)',   keywords: ['hackfleisch', 'rinderhack', 'mett'], aiLabels: [] },
  { id: 'poultry',     name: 'Hähnchen- / Putenbrustfilet',        emoji: '🍗', days: 3,  location: 'fridge',  category: 'meat_fish_eggs', hint: 'Geflügel im Kühlschrank ca. 2–3 Tage',      keywords: ['hähnchenbrust', 'putenbrust', 'hähnchenfilet', 'hähnchen', 'putenschnitzel'], aiLabels: [] }
];

const KNOWN_BRAND_PREFIXES = [
  'Kaufland', 'K-Classic', 'K-Bio', 'K-Favourites', 'K-Purland', 'ja!', 'GUT&GÜNSTIG', 'Gut & Günstig',
  'EDEKA', 'REWE Beste Wahl', 'REWE Bio', 'REWE', 'Wilhelm Brandenburg', 'Mein Metzgergut', 'Landjunker',
  'Milbona', 'Milsani', 'Bellarom', 'Kania', 'Combino', 'Alnatura', 'dmBio', 'Schär', 'Dr. Schär', 'Seitz',
  'Gefro', 'Meggle', 'Philadelphia', 'Thomy', 'Heinz', 'Hengstenberg', 'Pfanni', 'Barilla', 'Dr. Oetker',
  'Iglo', 'Frosta', 'Landfein', 'Schwarzwaldmilch', 'Weihenstephan', 'Bärenmarke', 'Kerrygold',
  'Oro di Parma', 'Alnavit', 'Bauckhof', 'Müller', 'Ehrmann', 'Zott', 'Danone', 'Arla', 'Exquisa',
  'miree', 'Rama', 'Lätta', 'Bonduelle', 'Kühne', 'Knorr', 'Maggi', 'Löwensenf', 'Ernte Krone',
  'mysmile', 'Die süße Susi', 'Rinti', 'Wolfsblut', 'Josera', 'Belcando', 'Animonda', 'Pedigree',
  'Haribo', 'Ritter Sport', 'Milka', 'Lindt', 'Nutella', 'Ferrero', 'Kinder', 'Lorenz', 'Funny-frisch',
  'Chio', 'DeBeukelaer', 'Bahlsen', 'Leibniz', 'Kölln', 'Seitenbacher', 'Ben\'s Original', 'Uncle Ben\'s',
  'Kikkoman', 'Develey', 'Bautz\'ner', 'Homann', 'Miracel Whip', 'Zentis', 'Schwartau', 'Bonne Maman',
  'Teekanne', 'Meßmer', 'Jacobs', 'Tchibo', 'Dallmayr', 'Lavazza', 'Melitta', 'Nescafé', 'Oatly', 'Alpro'
];

const LABEL_FOOD_KEYWORDS = [
  'Alpenmilch', 'Weidemilch', 'Haltbare Vollmilch', 'Frische Vollmilch', 'Vollmilch', 'Fettarme Milch', 'Hafermilch', 'Mandelmilch',
  'Schlagsahne', 'Kochsahne', 'Saure Sahne', 'Schmand', 'Crème fraîche', 'Mascarpone', 'Speisequark', 'Magerquark', 'Kräuterquark',
  'Naturjoghurt', 'Fruchtjoghurt', 'Griechischer Joghurt', 'Skyr', 'Kefir', 'Buttermilch', 'Ayran',
  'Frischkäse', 'Kräuterbutter', 'Markenbutter', 'Süßrahmbutter', 'Mildgesäuerte Butter', 'Butter', 'Margarine',
  'Gouda', 'Emmentaler', 'Maasdamer', 'Tilsiter', 'Bergkäse', 'Mozzarella', 'Parmesan', 'Grana Padano', 'Feta', 'Hirtenkäse',
  'Camembert', 'Brie', 'Reibekäse', 'Scheibenkäse', 'Schmelzkäse',
  'Glutenfreie Wraps', 'Wraps', 'Tortilla Wraps', 'Landbrot', 'Mehrkornbrot', 'Vollkornbrot', 'Toastbrot', 'Buttertoast',
  'Sonntagsbrötchen', 'Aufbackbrötchen', 'Brötchen', 'Baguette', 'Croissants', 'Knäckebrot', 'Reiswaffeln',
  'Spaghetti', 'Penne Rigate', 'Fusilli', 'Rigatoni', 'Tagliatelle', 'Makkaroni', 'Tortellini', 'Ravioli', 'Gnocchi',
  'Eierspätzle', 'Spätzle', 'Schupfnudeln', 'Lasagneplatten',
  'Basmatireis', 'Jasminreis', 'Langkornreis', 'Spitzenreis', 'Milchreis', 'Risottoreis', 'Parboiled Reis',
  'Kartoffelpüree', 'Speisekartoffeln', 'Kartoffeln', 'Pommes Frites', 'Kroketten', 'Reibekuchen', 'Knödel',
  'Haferflocken', 'Schmelzflocken', 'Knuspermüsli', 'Früchtemüsli', 'Cornflakes', 'Choco Balls',
  'Weizenmehl', 'Dinkelmehl', 'Reismehl', 'Buchweizenmehl', 'Speisestärke', 'Maisstärke', 'Backpulver', 'Trockenhefe',
  'Apfelmus', 'Apfelmark', 'Apfel-Rotkohl', 'Rotkohl', 'Sauerkraut', 'Stangenspargel', 'Spargel', 'Gewürzgurken', 'Cornichons',
  'Passierte Tomaten', 'Gehackte Tomaten', 'Tomatenmark', 'Sonnenmais', 'Kichererbsen', 'Kidneybohnen', 'Grüne Bohnen',
  'Erbsen und Möhren', 'Junge Erbsen', 'Linsen', 'Chili sin Carne', 'Chili con Carne',
  'Pfifferlinge', 'Champignons', 'Steinpilze', 'Waldfrüchte', 'Beerenmischung', 'Himbeeren', 'Heidelbeeren', 'Erdbeeren',
  'Eisbergsalat', 'Feldsalat', 'Rucola', 'Blattspinat', 'Rahmspinat', 'Brokkoli', 'Blumenkohl', 'Rosenkohl',
  'Schlangengurke', 'Rispentomaten', 'Cherrytomaten', 'Spitzpaprika', 'Paprika', 'Karotten', 'Speisemöhren', 'Avocado',
  'Schweinefilet', 'Schweinelende', 'Schweineschnitzel', 'Schweinebraten', 'Schweinegulasch', 'Schweinehackfleisch',
  'Rinderfilet', 'Rumpsteak', 'Rindergulasch', 'Rinderhackfleisch', 'Rinderrouladen', 'Rinderbraten',
  'Hackfleisch gemischt', 'Hackfleisch', 'Hähnchenbrustfilet', 'Hähnchenfilet', 'Hähnchenschenkel', 'Hähnchengeschnetzeltes',
  'Putenbrustfilet', 'Putenschnitzel', 'Putenhackfleisch', 'Minutensteaks',
  'Rostbratwurst', 'Bratwurst', 'Wiener Würstchen', 'Bockwurst', 'Fleischwurst', 'Lyoner', 'Leberwurst',
  'Salami', 'Kochschinken', 'Schwarzwälder Schinken', 'Lachsschinken', 'Bacon', 'Speckwürfel',
  'Lachsfilet', 'Wildlachs', 'Kabeljaufilet', 'Seelachsfilet', 'Fischstäbchen', 'Thunfisch', 'Forellenfilet', 'Garnelen',
  'Freilandeier', 'Bio-Eier', 'Frische Eier',
  'Olivenöl', 'Sonnenblumenöl', 'Rapsöl', 'Kokosöl', 'Balsamico', 'Apfelessig', 'Kräuteressig', 'Weinessig',
  'Tomatenketchup', 'Ketchup', 'Mayonnaise', 'Remoulade', 'Mittelscharfer Senf', 'Delikatess Senf', 'Burger Sauce',
  'Pesto Verde', 'Pesto Rosso', 'Sojasauce', 'Gemüsebrühe', 'Hühnerbrühe', 'Rinderbrühe',
  'Erdnussbutter', 'Haselnusscreme', 'Fruchtaufstrich', 'Konfitüre', 'Blütenhonig', 'Honig',
  'Mineralwasser', 'Apfelsaft', 'Orangensaft', 'Multivitaminsaft', 'Apfelschorle', 'Rhabarberschorle',
  'Filterkaffee', 'Caffè Crema', 'Espresso', 'Kräutertee', 'Früchtetee', 'Grüner Tee', 'Schwarzer Tee',
  'Hundefutter', 'Katzenfutter', 'Nassfutter', 'Trockenfutter', 'Kauknochen', 'Hundesnack', 'Pferdefutter'
];

//
//
// ============================================================================
// PART 02: PRODUKT-HELFER & LOKALES/CLOUD BARCODE-GEDÄCHTNIS
// ============================================================================
//
//

function getItemAddedTimestamp(item) {
  if (!item) return 0;
  if (item.addedTimestamp && Number(item.addedTimestamp) > 0) return Number(item.addedTimestamp);
  const idMatch = String(item.id || '').match(/^p_(\d{10,15})/);
  if (idMatch) return Number(idMatch[1]);
  if (item.updatedAt && Number(item.updatedAt) > 0) return Number(item.updatedAt);
  return 0;
}

function formatAgeDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return 'seit ' + Math.max(2, hours) + ' Stunden';
  const days = Math.floor(hours / 24);
  return days === 1 ? 'seit 1 Tag' : ('seit ' + days + ' Tagen');
}

export function saveLearnedProductToMemory(barcodeKey, productData, syncToCloud = true) {
  const cleanKey = String(barcodeKey || '').trim();
  if (!cleanKey || cleanKey.length < 4 || !productData?.name) return;

  try {
    const rawMap = localStorage.getItem('richter_tw_barcode_memory_v1');
    const map = rawMap ? JSON.parse(rawMap) : {};

    const entry = {
      name: productData.name,
      quantity: productData.quantity || '1x',
      location: productData.location || 'fridge',
      category: productData.category || 'produce',
      glutenFree: productData.glutenFree || 'auto',
      imageUrl: productData.imageUrl || '',
      updatedAt: Date.now()
    };

    map[cleanKey] = entry;

    const digits = cleanKey.replace(/\D/g, '');
    if (digits.length === 13 && /^2[0-9]/.test(digits)) {
      map[digits.slice(0, 7)] = entry;
    }

    localStorage.setItem('richter_tw_barcode_memory_v1', JSON.stringify(map));
  } catch (e) {}

  // Synchronisiert das gelernte Produkt zusätzlich in die zentrale Supabase-Datenbank (/api/products)
  if (syncToCloud && typeof fetch === 'function') {
    try {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: cleanKey,
          name: productData.name,
          quantity: productData.quantity || '1x',
          location: productData.location || 'fridge',
          category: productData.category || 'produce',
          glutenFree: productData.glutenFree || 'auto',
          imageUrl: productData.imageUrl || ''
        })
      }).catch(() => {});
    } catch (e) {}
  }
}

export function getLearnedProductFromMemory(barcodeKey) {
  try {
    const cleanKey = String(barcodeKey || '').trim();
    if (!cleanKey) return null;
    const rawMap = localStorage.getItem('richter_tw_barcode_memory_v1');
    if (!rawMap) return null;
    const map = JSON.parse(rawMap);
    if (map[cleanKey]?.name) return map[cleanKey];

    const digits = cleanKey.replace(/\D/g, '');
    if (digits.length === 13 && /^2[0-9]/.test(digits)) {
      const prefix7 = digits.slice(0, 7);
      if (map[prefix7]?.name) return map[prefix7];
    }
  } catch (e) {}
  return null;
}

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

export function detectSmartCategory(nameStr, customCategory = '', offTags = []) {
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
  if (/brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|knäckebrot|reiswaffel|nudel|spaghetti|pasta|penne|fusilli|rigatoni|tortellini|ravioli|spätzle|reis|spitzenreis|langkorn|basmati|jasmin|milchreis|risotto|getreide|haferflocken|müsli|cornflakes|choco balls|mehl|grieß|stärke|wraps|wrap|tortilla|taco|schär|kartoffel|kartoffelpüree|pfanni|gnocchi|schupfnudel|pommes|kroketten|knödel/.test(n)) {
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

export function detectSmartLocation(nameStr, categoryId = '', offTags = []) {
  const n = String(nameStr || '').toLowerCase();
  const tags = Array.isArray(offTags) ? offTags.join(' ').toLowerCase() : '';

  if (/hundefutter|katzenfutter|tierfutter|pferdefutter|futter|leckerli|kauknochen|pansen|trockenfutter|nassfutter|rinti|wolfsblut|josera|belcando|animonda|pedigree|whiskas|felix/.test(n)) {
    return 'petfood';
  }
  if (/\btk\b|tiefkühl|tiefgekühlt|tiefgefroren|gefrier|eiscreme|speiseeis|fischstäbchen|pommes|kroketten|rahmspinat/.test(n) || /frozen/.test(tags)) {
    return 'freezer';
  }
  if (/nudel|spaghetti|pasta|penne|fusilli|reis|basmati|langkorn|mehl|zucker|salz|haferflocken|müsli|cornflakes|choco balls|wraps|wrap|schär|knäckebrot|reiswaffel|backpulver|vanillezucker|kaffee|espresso|tee|kakao|schokolade|nutella|honig|konfitüre|keks|cookie|chips|haribo|nüsse|gefro|chili sin carne|kartoffelpüree|pfanni|tomatenmark|pesto|öl|olivenöl|sonnenblumenöl|rapsöl|essig|balsamico|senf|ketchup|mayo|burger sauce|brühe/.test(n)) {
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

  if (/glutenfrei|gluten-free|ohne gluten|\bgf\b|schär|schaer|bauckhof|alnavit|hammermühle|seitz|schnitzer|reismehl|maismehl|buchweizen|quinoa|hirse|amarant|polenta|maisstärke|speisestärke|kartoffelmehl|reiswaffel|gefro/.test(n)) {
    return true;
  }
  if (/weizen|dinkel|roggen|gerste|grünkern|bulgur|couscous|seitan|paniermehl|paniert|fischstäbchen|nuggets|schnitzel|spätzle|tortellini|ravioli|lasagne|nudel|spaghetti|pasta|penne|fusilli|rigatoni|mehl|grieß|haferflocken|müsli|cornflakes|brot|landbrot|mehrkorn|brötchen|toast|baguette|croissant|knäckebrot|kuchen|waffel|keks|cookie|brezel|pizza|flammkuchen|\bbier\b|malz|gnocchi|schupfnudel/.test(n)) {
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

//
//
// ============================================================================
// PART 03: BILDVORVERARBEITUNG, MHD-DATUMSEXTRAKTION & BARCODE-PARSER
// ============================================================================
//
//

function buildMhdCanvasVariant(sourceCanvas, mode = 'contrast') {
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  if (mode === 'raw') return out;

  try {
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;

    // 5./95.-Perzentil statt harter Min/Max-Werte (ignoriert einzelne Glanzreflexe!)
    const hist = new Uint32Array(256);
    const totalPx = out.width * out.height;
    for (let i = 0; i < d.length; i += 4) {
      const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      d[i] = lum;
      hist[lum]++;
    }

    let lowCut = 0, highCut = 255, acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= totalPx * 0.04) { lowCut = v; break; }
    }
    acc = 0;
    for (let v = 255; v >= 0; v--) {
      acc += hist[v];
      if (acc >= totalPx * 0.04) { highCut = v; break; }
    }

    const range = Math.max(20, highCut - lowCut);
    for (let i = 0; i < d.length; i += 4) {
      let norm = ((d[i] - lowCut) / range) * 255;
      norm = Math.max(0, Math.min(255, norm));

      if (mode === 'invert') {
        norm = 255 - norm;
      }

      // Sanfte S-Kurve statt hartem Abschneiden (erhält feine Dot-Matrix-Punkte)
      const stretched = norm < 128 ? norm * 0.78 : Math.min(255, norm * 1.18 + 12);
      const v = Math.round(stretched);
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {}

  return out;
}

export function extractExpiryDateFromText(rawText) {
  const rawUpper = String(rawText || '').toUpperCase();
  if (!rawUpper.trim()) return null;

  const withNumericMonths = rawUpper
    .replace(/\b(JANUAR|JAN|JANUARY)\b\.?/g, '.01.')
    .replace(/\b(FEBRUAR|FEB|FEBRUARY)\b\.?/g, '.02.')
    .replace(/\b(MÄRZ|MAERZ|MRZ|MÄR|MAR|MARCH)\b\.?/g, '.03.')
    .replace(/\b(APRIL|APR)\b\.?/g, '.04.')
    .replace(/\b(MAI|MAY)\b\.?/g, '.05.')
    .replace(/\b(JUNI|JUN|JUNE)\b\.?/g, '.06.')
    .replace(/\b(JULI|JUL|JULY)\b\.?/g, '.07.')
    .replace(/\b(AUGUST|AUG)\b\.?/g, '.08.')
    .replace(/\b(SEPTEMBER|SEPT|SEP)\b\.?/g, '.09.')
    .replace(/\b(OKTOBER|OKT|OCT|OCTOBER)\b\.?/g, '.10.')
    .replace(/\b(NOVEMBER|NOV)\b\.?/g, '.11.')
    .replace(/\b(DEZEMBER|DEZ|DEC|DECEMBER)\b\.?/g, '.12.');

  const clean = withNumericMonths
    .replace(/[|lI!]/g, '1')
    .replace(/[OQ]/g, '0')
    .replace(/(?<=\d)[D](?=\d|[.,/\-\s])/g, '0')
    .replace(/S(?=\d)/g, '5')
    .replace(/(?<=\d)S/g, '5')
    .replace(/B(?=\d)/g, '8')
    .replace(/(?<=\d)B/g, '8')
    .replace(/Z(?=\d)/g, '2')
    .replace(/G(?=\d)/g, '6');

  const todayIso = formatDateStr(new Date());
  const candidates = [];

  const pushCandidate = (yearNum, monthNum, dayNum, specificity) => {
    if (yearNum < 2025 || yearNum > 2036) return;
    if (monthNum < 1 || monthNum > 12) return;
    const maxDay = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > maxDay) return;

    const iso =
      String(yearNum) + '-' +
      String(monthNum).padStart(2, '0') + '-' +
      String(dayNum).padStart(2, '0');

    const isFuture = iso >= todayIso ? 100 : 0;
    candidates.push({ iso, score: isFuture + specificity });
  };

  let match;

  // 1. ISO: YYYY-MM-DD / YYYY.MM.DD
  const isoRegex = /(?:^|[^\d])(202[5-9]|203[0-6])\s*[-./]\s*(0?[1-9]|1[0-2])\s*[-./]\s*(0?[1-9]|[12][0-9]|3[01])(?:$|[^\d])/g;
  while ((match = isoRegex.exec(clean)) !== null) {
    pushCandidate(Number(match[1]), Number(match[2]), Number(match[3]), 30);
  }

  // 2. Klassisch Deutsch/EU: DD.MM.YYYY oder DD.MM.YY
  const dmyRegex = /(?:^|[^\d])(0?[1-9]|[12][0-9]|3[01])\s*[.,/\-\s:·•_]{1,4}\s*(0?[1-9]|1[0-2])\s*[.,/\-\s:·•_]{1,4}\s*(202[5-9]|203[0-6]|2[5-9]|3[0-6])(?:$|[^\d])/g;
  while ((match = dmyRegex.exec(clean)) !== null) {
    const yStr = String(match[3]);
    const yNum = yStr.length === 2 ? Number('20' + yStr) : Number(yStr);
    pushCandidate(yNum, Number(match[2]), Number(match[1]), yStr.length === 4 ? 35 : 28);
  }

  // 3. Kompakt ohne Trennzeichen: DDMMYYYY oder DDMMYY
  const compactRegex = /(?:^|[^\d])(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])(202[5-9]|203[0-6]|2[5-9]|3[0-6])(?:$|[^\d])/g;
  while ((match = compactRegex.exec(clean)) !== null) {
    const yStr = String(match[3]);
    const yNum = yStr.length === 2 ? Number('20' + yStr) : Number(yStr);
    pushCandidate(yNum, Number(match[2]), Number(match[1]), 22);
  }

  // 4. Monat/Jahr: MM.YYYY oder MM/YY
  const myRegex = /(?:^|[^\d])(0?[1-9]|1[0-2])\s*[./\-:]\s*(202[5-9]|203[0-6]|2[5-9]|3[0-6])(?:$|[^\d])/g;
  while ((match = myRegex.exec(clean)) !== null) {
    const mNum = Number(match[1]);
    const yStr = String(match[2]);
    const yNum = yStr.length === 2 ? Number('20' + yStr) : Number(yStr);
    const lastDay = new Date(yNum, mNum, 0).getDate();
    pushCandidate(yNum, mNum, lastDay, yStr.length === 4 ? 15 : 10);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.iso.localeCompare(a.iso);
  });

  return candidates[0].iso;
}

function parseUniversalBarcodePayload(rawVal) {
  const clean = String(rawVal || '').replace(/[\x00-\x1F]+/g, ' ').trim();
  const result = {
    raw: clean,
    lookupCodes: [],
    extractedName: null,
    extractedBrand: null,
    extractedExpiry: null,
    extractedWeightQty: null,
    extractedLocation: null,
    extractedBatch: null,
    extractedImageUrl: null,
    isPureMarketingUrl: false
  };

  if (!clean) return result;

  const learnedDirect = getLearnedProductFromMemory(clean);
  if (learnedDirect) {
    result.extractedName = learnedDirect.name;
    result.extractedWeightQty = learnedDirect.quantity;
    result.extractedLocation = learnedDirect.location;
    if (learnedDirect.imageUrl) result.extractedImageUrl = learnedDirect.imageUrl;
  }

  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const obj = JSON.parse(clean);
      if (obj.name || obj.n || obj.product) result.extractedName = String(obj.name || obj.n || obj.product).trim();
      if (obj.qty || obj.q || obj.weight) result.extractedWeightQty = String(obj.qty || obj.q || obj.weight).trim();
      if (obj.exp || obj.e || obj.mhd) result.extractedExpiry = String(obj.exp || obj.e || obj.mhd).trim();
      if (obj.loc || obj.l) result.extractedLocation = String(obj.loc || obj.l).trim();
      if (obj.img || obj.imageUrl) result.extractedImageUrl = String(obj.img || obj.imageUrl).trim();
      if (obj.ean || obj.gtin) result.lookupCodes.push(String(obj.ean || obj.gtin).trim());
      return result;
    } catch (e) {}
  }

  if (clean.includes('|') || /^tw:/i.test(clean)) {
    const parts = clean.replace(/^tw:/i, '').split('|').map(s => s.trim());
    if (parts[0] && !/^\d+$/.test(parts[0])) result.extractedName = parts[0];
    parts.forEach(p => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) result.extractedExpiry = p;
      const dmy = p.match(/^(\d{2})\.(\d{2})\.(20\d{2})$/);
      if (dmy) result.extractedExpiry = dmy[3] + '-' + dmy[2] + '-' + dmy[1];
      if (/^\d+(?:[.,]\d+)?\s*(g|kg|ml|l|x|stk|pcs|pack|port)$/i.test(p)) result.extractedWeightQty = p;
    });
  }

  if (/^https?:\/\//i.test(clean)) {
    const urlGtin = clean.match(/\/01\/(\d{8,14})/);
    if (urlGtin) {
      const g = urlGtin[1];
      const ean13 = g.length === 14 && g.startsWith('0') ? g.slice(1) : g;
      result.lookupCodes.push(ean13, g);
    }
    const urlExp = clean.match(/\/1[57]\/(\d{2})(0[1-9]|1[0-2])(0[0-9]|[12][0-9]|3[01])/);
    if (urlExp) {
      const dd = urlExp[3] === '00' ? '28' : urlExp[3];
      result.extractedExpiry = '20' + urlExp[1] + '-' + urlExp[2] + '-' + dd;
    }
    const urlWeight = clean.match(/\/310(\d)\/(\d{6})/);
    if (urlWeight) {
      const dec = Number(urlWeight[1]);
      const val = parseInt(urlWeight[2], 10);
      const grams = dec === 3 ? val : Math.round((val / Math.pow(10, dec)) * 1000);
      if (grams >= 10 && grams <= 25000) {
        result.extractedWeightQty = grams >= 1000 ? ((grams / 1000).toFixed(2).replace('.', ',') + ' kg') : (grams + 'g');
      }
    }

    try {
      const u = new URL(clean);
      const qEan = u.searchParams.get('ean') || u.searchParams.get('gtin') || u.searchParams.get('barcode');
      if (qEan && /^\d{8,14}$/.test(qEan.trim())) {
        result.lookupCodes.push(qEan.trim());
      }
      const qName = u.searchParams.get('name') || u.searchParams.get('product') || u.searchParams.get('title');
      if (qName) result.extractedName = qName.trim();
      const qMhd = u.searchParams.get('mhd') || u.searchParams.get('exp');
      if (qMhd && /^\d{4}-\d{2}-\d{2}$/.test(qMhd)) result.extractedExpiry = qMhd;

      const hostParts = u.hostname.replace(/^(www|qr|m|shop|info|scan)\./i, '').split('.');
      if (hostParts[0] && !/^(gs1|bit|tinyurl|goo|qr-code|qrco)$/i.test(hostParts[0])) {
        const domainBrand = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
        result.extractedBrand = shortenBrandString(domainBrand);
      }

      const pathSegments = u.pathname
        .split('/')
        .map(s => decodeURIComponent(s).replace(/\.(html|php|aspx|htm)$/i, '').trim())
        .filter(s =>
          s.length >= 4 &&
          !/^(de|en|at|ch|p|pr|prod|product|products|produkt|produkte|artikel|item|qr|scan|info|sortiment|rezepte|nachhaltigkeit|campaign|gewinnspiel)$/i.test(s) &&
          !/^\d+$/.test(s)
        );

      if (!result.extractedName && pathSegments.length > 0) {
        const lastSlug = pathSegments[pathSegments.length - 1]
          .replace(/[-_]+/g, ' ')
          .replace(/\b\d{5,}\b/g, '')
          .trim();
        if (lastSlug.length >= 4 && /[a-zA-ZäöüÄÖÜß]/.test(lastSlug)) {
          result.extractedName = simplifyProductName(lastSlug, result.extractedBrand || '');
        }
      }

      if (result.lookupCodes.length === 0 && !result.extractedName && !result.extractedExpiry) {
        result.isPureMarketingUrl = true;
      }
    } catch (e) {}
  }

  const gtinMatch = clean.match(/(?:\(01\)|\b01)(\d{14})/);
  if (gtinMatch) {
    const gtin14 = gtinMatch[1];
    const ean13 = gtin14.startsWith('0') ? gtin14.slice(1) : gtin14;
    if (!result.lookupCodes.includes(ean13)) result.lookupCodes.push(ean13, gtin14);
  }

  if (!result.extractedExpiry) {
    const expMatch = clean.match(/(?:\(1[57]\)|(?:^|\s)1[57])(\d{2})(0[1-9]|1[0-2])(0[0-9]|[12][0-9]|3[01])/);
    if (expMatch) {
      const yy = Number(expMatch[1]);
      const mm = expMatch[2];
      const dd = expMatch[3] === '00' ? '28' : expMatch[3];
      if (yy >= 25 && yy <= 35) {
        result.extractedExpiry = '20' + String(yy).padStart(2, '0') + '-' + mm + '-' + dd;
      }
    }
  }

  if (!result.extractedWeightQty) {
    const weightGs1Match = clean.match(/(?:\(3103\)|\b3103)(\d{6})/);
    if (weightGs1Match) {
      const grams = parseInt(weightGs1Match[1], 10);
      if (grams >= 20 && grams <= 25000) {
        result.extractedWeightQty = grams >= 1000 ? ((grams / 1000).toFixed(2).replace('.', ',') + ' kg') : (grams + 'g');
      }
    }
  }

  const batchMatch = clean.match(/(?:\(10\)|Ch\.?:?\s*)([A-Za-z0-9\-]{4,14})/i);
  if (batchMatch) {
    result.extractedBatch = batchMatch[1];
  }

  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length === 13 && /^2[0-9]/.test(digitsOnly)) {
    const prefix7 = digitsOnly.slice(0, 7);
    const weightOrPricePart = parseInt(digitsOnly.slice(7, 12), 10);
    if (!result.extractedWeightQty && weightOrPricePart >= 25 && weightOrPricePart <= 5000) {
      result.extractedWeightQty = weightOrPricePart + 'g';
    }
    const learnedPlu = getLearnedProductFromMemory(digitsOnly);
    if (learnedPlu?.name && !result.extractedName) {
      result.extractedName = learnedPlu.name;
      result.extractedLocation = learnedPlu.location;
      if (learnedPlu.imageUrl) result.extractedImageUrl = learnedPlu.imageUrl;
    }
    result.lookupCodes.push(digitsOnly, prefix7 + '000000');
  }

  if (!/^https?:\/\//i.test(clean)) {
    const allNumberBlocks = clean.match(/\b\d{8,14}\b/g) || [];
    allNumberBlocks.forEach(num => {
      if (num.length === 14 && num.startsWith('0')) {
        const stripped13 = num.slice(1);
        if (!result.lookupCodes.includes(stripped13)) result.lookupCodes.push(stripped13);
      }
      if (!result.lookupCodes.includes(num)) {
        result.lookupCodes.push(num);
      }
      if (num.length === 12 && !result.lookupCodes.includes('0' + num)) {
        result.lookupCodes.push('0' + num);
      }
      if (num.length === 13 && num.startsWith('0') && !result.lookupCodes.includes(num.slice(1))) {
        result.lookupCodes.push(num.slice(1));
      }
    });

    if (result.lookupCodes.length === 0 && digitsOnly.length >= 8 && digitsOnly.length <= 14) {
      result.lookupCodes.push(digitsOnly);
    }
  }

  return result;
}

function mergeMultipleBarcodesFromFrame(detectedList) {
  if (!Array.isArray(detectedList) || detectedList.length === 0) return null;

  const parsedItems = detectedList
    .map(b => ({
      raw: String(b.rawValue || '').trim(),
      format: String(b.format || 'barcode').toLowerCase(),
      parsed: parseUniversalBarcodePayload(String(b.rawValue || '').trim())
    }))
    .filter(x => x.raw.length > 0);

  if (parsedItems.length === 0) return null;

  parsedItems.sort((a, b) => {
    const score = (item) => {
      if (item.parsed.isPureMarketingUrl) return -10;
      let s = 0;
      if (/ean_13|ean_8|upc_a|upc_e/.test(item.format)) s += 50;
      if (item.parsed.lookupCodes.length > 0) s += 30;
      if (item.parsed.extractedExpiry) s += 25;
      if (item.parsed.extractedWeightQty) s += 15;
      if (item.parsed.extractedName) s += 20;
      return s;
    };
    return score(b) - score(a);
  });

  const combined = {
    primaryRaw: parsedItems[0].raw,
    formats: Array.from(new Set(parsedItems.map(x => x.format.toUpperCase()))).join(' + '),
    lookupCodes: [],
    extractedName: null,
    extractedBrand: null,
    extractedExpiry: null,
    extractedWeightQty: null,
    extractedLocation: null,
    extractedBatch: null,
    extractedImageUrl: null,
    allPureMarketingUrls: parsedItems.every(x => x.parsed.isPureMarketingUrl)
  };

  parsedItems.forEach(({ parsed }) => {
    parsed.lookupCodes.forEach(c => {
      if (!combined.lookupCodes.includes(c)) combined.lookupCodes.push(c);
    });
    if (!combined.extractedName && parsed.extractedName) combined.extractedName = parsed.extractedName;
    if (!combined.extractedBrand && parsed.extractedBrand) combined.extractedBrand = parsed.extractedBrand;
    if (!combined.extractedExpiry && parsed.extractedExpiry) combined.extractedExpiry = parsed.extractedExpiry;
    if (!combined.extractedWeightQty && parsed.extractedWeightQty) combined.extractedWeightQty = parsed.extractedWeightQty;
    if (!combined.extractedLocation && parsed.extractedLocation) combined.extractedLocation = parsed.extractedLocation;
    if (!combined.extractedBatch && parsed.extractedBatch) combined.extractedBatch = parsed.extractedBatch;
    if (!combined.extractedImageUrl && parsed.extractedImageUrl) combined.extractedImageUrl = parsed.extractedImageUrl;
  });

  return combined;
}

//
//
// ============================================================================
// PART 04: STATES, PHASEN-SPERR-REFS & RESET-HELFER
// ============================================================================
//
//

export default function PocketScanner({
  cartItems,
  stockItems = [],
  accountId = '',
  todayStr,
  isSyncing,
  themeStyles,
  onAddSingleToCart,
  onAddBatchToCart,
  onRemoveCartItem,
  onTransferSingleCartItemToStock,
  onTransferAllCartToStock,
  onCheckoutStockItemByScan,
  onAddShopItem,
  showToast
}) {
  const [scannerMode, setScannerMode] = useState('barcode'); // 'barcode' | 'object_ai' | 'receipt'
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [showProduceDrawer, setShowProduceDrawer] = useState(false);
  const [activeFormatCount, setActiveFormatCount] = useState(13);
  const [lastDetectedFormat, setLastDetectedFormat] = useState('');

  // 2-PHASEN-SCANNER-STATUS ('barcode' | 'hunting_mhd' | 'mhd_locked')
  const [scanPhase, setScanPhase] = useState('barcode');
  const [autoAddWhenBothScanned, setAutoAddWhenBothScanned] = useState(false);

  // 2-STUNDEN BARCODE-AUSBUCHUNGS-MODAL
  const [scanCheckoutModal, setScanCheckoutModal] = useState({
    open: false,
    step: 'confirm_remove',
    stockItem: null,
    ageLabel: '',
    pendingMergedScan: null
  });

  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('fridge');
  const [scanCategory, setScanCategory] = useState('auto');
  const [scanGlutenFree, setScanGlutenFree] = useState('auto');
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);
  const [estimatedMhdHint, setEstimatedMhdHint] = useState('');

  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);
  const [detectedMhdCandidate, setDetectedMhdCandidate] = useState('');
  const [isMhdLockedByOcr, setIsMhdLockedByOcr] = useState(false);
  const [lastOcrRawHint, setLastOcrRawHint] = useState('');
  const [mhdSourceBadge, setMhdSourceBadge] = useState(''); // 'KI' | 'OCR' | 'Code'
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [isReadingFullLabel, setIsReadingFullLabel] = useState(false);
  const [isDetectingObject, setIsDetectingObject] = useState(false);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const mhdAutoLoopRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const mobileNetModelRef = useRef(null);
  const wakeLockRef = useRef(null);
  const hardwareZoomSupportedRef = useRef(false);
  const aiEndpointAvailableRef = useRef(true);
  const lastAiMhdCallRef = useRef(0);
  const localOcrMissCountRef = useRef(0);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isReadingMhdRef = useRef(false);
  const scanCheckoutOpenRef = useRef(false);
  scanCheckoutOpenRef.current = Boolean(scanCheckoutModal.open);

  // SYNCHRONE PHASEN-SPERR-REFS (VERHINDERT BARCODE-SCANS IM MHD-MODUS)
  const scanPhaseRef = useRef('barcode');
  scanPhaseRef.current = scanPhase;
  const scannerModeRef = useRef('barcode');
  scannerModeRef.current = scannerMode;
  const scanNameRef = useRef('');
  scanNameRef.current = scanName;
  const isLookingUpRef = useRef(false);
  isLookingUpRef.current = isLookingUpProduct;
  const pendingZxingCandidateRef = useRef({ code: '', hits: 0, ts: 0 });

  const stockItemsRef = useRef(stockItems);
  stockItemsRef.current = Array.isArray(stockItems) ? stockItems : [];

  const effectiveAccountId =
    accountId || (typeof localStorage !== 'undefined' ? localStorage.getItem('richter_tw_account_id') || 'local' : 'local');

  const resetScannerToBarcodePhase = () => {
    setScanName('');
    scanNameRef.current = '';
    setScannedBarcode('');
    setLastDetectedFormat('');
    setScanImageUrl('');
    setDetectedMhdCandidate('');
    setScanExpiry('');
    setMhdSourceBadge('');
    setIsMhdLockedByOcr(false);
    setEstimatedMhdHint('');
    setLastOcrRawHint('');
    localOcrMissCountRef.current = 0;
    lastScannedCodeRef.current = '';
    pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
    scanPhaseRef.current = 'barcode';
    setScanPhase('barcode');
  };

  //
  //
  // ============================================================================
  // PART 05: KAMERA-STEUERUNG, SUPABASE-FOTO & 2-STUNDEN-AUSBUCHUNGS-CHECK
  // ============================================================================
  //
  //

  const triggerVibration = (pattern) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

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
    hardwareZoomSupportedRef.current = false;
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      const caps = track?.getCapabilities?.();
      if (track && caps && caps.zoom) {
        const targetZoom = next ? Math.min(2.2, caps.zoom.max || 2.0) : Math.max(1.0, caps.zoom.min || 1.0);
        await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
        hardwareZoomSupportedRef.current = true;
      }
    } catch (e) {
      hardwareZoomSupportedRef.current = false;
    }
  };

  // Produktfoto komprimieren & in Supabase Storage hochladen
  const runSupabaseProductPhotoUpload = async (source) => {
    if (!source || isUploadingProductPhoto) return;
    setIsUploadingProductPhoto(true);
    showToast('Lade Produktfoto hoch...', 'Wird komprimiert & in Supabase gespeichert...', '📸');
    try {
      const publicUrl = await uploadProductPhotoToSupabase({
        source,
        accountId: effectiveAccountId,
        barcode: scannedBarcode
      });
      setScanImageUrl(publicUrl);

      if (scannedBarcode && scanName.trim()) {
        const resolvedCat = scanCategory === 'auto' ? detectSmartCategory(scanName) : scanCategory;
        saveLearnedProductToMemory(scannedBarcode, {
          name: simplifyProductName(scanName),
          quantity: scanQty.trim() || '1x',
          location: scanLocation,
          category: resolvedCat,
          glutenFree: scanGlutenFree,
          imageUrl: publicUrl
        }, true);
      }

      playMobileBeep('scan');
      triggerVibration([80, 40, 100]);
      showToast('Produktfoto gespeichert! ✅', 'Erscheint direkt auf deiner Touchwall.', '🖼️');
    } catch (err) {
      showToast('Foto-Upload fehlgeschlagen', err?.message || 'Bitte erneut versuchen.', '⚠️');
    } finally {
      setIsUploadingProductPhoto(false);
    }
  };

  const handleProductPhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await runSupabaseProductPhotoUpload(file);
  };

  const handleSnapProductPhotoFromLiveCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      showToast('Kamera nicht aktiv', 'Starte erst die Kamera oder nutze „📸 Foto wählen“.', '📷');
      return;
    }
    await runSupabaseProductPhotoUpload(videoRef.current);
  };

  // Schneidet exakt den sichtbaren Fokus-Rahmen aus (inkl. echtem Digital-Zoom, falls 2x aktiv)
  const grabFocusedFrameCanvas = (tightForMhd = true) => {
    const vid = videoRef.current;
    if (!vid || vid.readyState < 2) return null;

    const vw = vid.videoWidth || 1280;
    const vh = vid.videoHeight || 720;

    const digitalZoomFactor = zoomActive && !hardwareZoomSupportedRef.current ? 1.85 : 1.0;

    const baseW = tightForMhd ? 0.78 : 0.90;
    const baseH = tightForMhd ? 0.36 : 0.78;

    const cropW = Math.max(240, Math.floor((vw * baseW) / digitalZoomFactor));
    const cropH = Math.max(120, Math.floor((vh * baseH) / digitalZoomFactor));
    const cropX = Math.max(0, Math.floor((vw - cropW) / 2));
    const cropY = Math.max(0, Math.floor((vh - cropH) / 2));

    const maxOutW = tightForMhd ? 960 : 1024;
    const scale = cropW > maxOutW ? maxOutW / cropW : (cropW < 540 ? 540 / cropW : 1);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  // Prüft, ob der gescannte Barcode bereits seit >= 2 Stunden im Bestand liegt
  const findExistingStockItemEligibleForCheckout = (mergedScan, candidateName = '') => {
    const currentStock = stockItemsRef.current || [];
    if (currentStock.length === 0) return null;

    const now = Date.now();
    const codesToCheck = new Set(
      [...(mergedScan?.lookupCodes || []), mergedScan?.primaryRaw]
        .map(c => String(c || '').trim())
        .filter(Boolean)
    );

    const learnedHit =
      getLearnedProductFromMemory(mergedScan?.lookupCodes?.[0]) ||
      getLearnedProductFromMemory(mergedScan?.primaryRaw);
    const targetNameLower = String(candidateName || learnedHit?.name || mergedScan?.extractedName || '')
      .toLowerCase()
      .trim();

    const matches = currentStock.filter(st => {
      if (!st) return false;
      const stCode = String(st.barcode || '').trim();
      if (stCode && codesToCheck.has(stCode)) return true;

      const stDigits = stCode.replace(/\D/g, '');
      if (stDigits.length === 13 && /^2[0-9]/.test(stDigits)) {
        const prefix7 = stDigits.slice(0, 7);
        for (const c of codesToCheck) {
          const cDigits = c.replace(/\D/g, '');
          if (cDigits.length === 13 && cDigits.startsWith(prefix7)) return true;
        }
      }

      if (targetNameLower && String(st.name || '').toLowerCase().trim() === targetNameLower) {
        return true;
      }
      return false;
    });

    if (matches.length === 0) return null;

    matches.sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));

    const eligibleMatch = matches.find(st => {
      const addedTs = getItemAddedTimestamp(st);
      if (!addedTs) return true;
      return (now - addedTs) >= TWO_HOURS_GRACE_MS;
    });

    return eligibleMatch || null;
  };

  const applyFreshProduceSelection = (produceItem, showFeedbackToast = true) => {
    if (!produceItem) return;
    const estDate = formatDateStr(addDays(new Date(), produceItem.days));
    setScanName(produceItem.name);
    scanNameRef.current = produceItem.name;
    setScanLocation(produceItem.location);
    setScanCategory(produceItem.category);
    setScanGlutenFree('yes');
    setScanImageUrl('');
    setScanExpiry(estDate);
    setDetectedMhdCandidate(estDate);
    setMhdSourceBadge('Frische-KI');
    setIsMhdLockedByOcr(true);
    scanPhaseRef.current = 'mhd_locked';
    setScanPhase('mhd_locked');
    setEstimatedMhdHint(
      produceItem.emoji + ' ' + produceItem.name + ' → MHD +' + produceItem.days + ' Tage (' + produceItem.hint + ')'
    );
    setShowProduceDrawer(false);
    playMobileBeep('scan');
    triggerVibration([90, 40, 120]);
    if (showFeedbackToast) {
      showToast(
        produceItem.name + ' gewählt!',
        'Lagerort & MHD (+' + produceItem.days + ' Tage) automatisch gesetzt.',
        produceItem.emoji
      );
    }
  };

  //
  //
  // ============================================================================
  // PART 06: ZXING, FRISCHE-KI, GEMINI VISION-KI & MHD-OCR (NUR IN PHASE 2)
  // ============================================================================
  //
  //

  const getZXingMultiFormatReader = async () => {
    if (zxingReaderRef.current) return zxingReaderRef.current;
    if (typeof window === 'undefined') return null;

    try {
      if (!window.ZXing) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.2/umd/index.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (window.ZXing?.BrowserMultiFormatReader) {
        const hints = new Map();
        if (window.ZXing.DecodeHintType && window.ZXing.BarcodeFormat) {
          const formats = [
            window.ZXing.BarcodeFormat.EAN_13,
            window.ZXing.BarcodeFormat.EAN_8,
            window.ZXing.BarcodeFormat.UPC_A,
            window.ZXing.BarcodeFormat.UPC_E,
            window.ZXing.BarcodeFormat.CODE_128,
            window.ZXing.BarcodeFormat.CODE_39,
            window.ZXing.BarcodeFormat.CODE_93,
            window.ZXing.BarcodeFormat.ITF,
            window.ZXing.BarcodeFormat.CODABAR,
            window.ZXing.BarcodeFormat.QR_CODE,
            window.ZXing.BarcodeFormat.DATA_MATRIX,
            window.ZXing.BarcodeFormat.PDF_417,
            window.ZXing.BarcodeFormat.AZTEC,
            window.ZXing.BarcodeFormat.RSS_14,
            window.ZXing.BarcodeFormat.RSS_EXPANDED
          ].filter(Boolean);
          hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
          hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
        }
        const reader = new window.ZXing.BrowserMultiFormatReader(hints);
        zxingReaderRef.current = reader;
        return reader;
      }
    } catch (e) {}
    return null;
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
        showToast('Bitte näher heranhalten', 'Oder wähle das Frischeprodukt direkt im aufgeklappten Menü!', '🔍');
      }
    } catch (err) {
      setShowProduceDrawer(true);
    } finally {
      setIsDetectingObject(false);
    }
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
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789.,/-:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '
      });
      ocrWorkerRef.current = worker;
      return worker;
    }
    return null;
  };

  // KI-Vision Aufruf (/api/mhd-ai via Gemini 2.5 Flash)
  const callVisionAiScanner = async (canvas, mode = 'mhd') => {
    if (!aiEndpointAvailableRef.current || !canvas) return null;
    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.86);
      const res = await fetch('/api/mhd-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mode, todayStr }),
        cache: 'no-store'
      });
      const json = await res.json();
      if (json?.fallbackToLocal && String(json?.error || '').includes('GEMINI_API_KEY fehlt')) {
        aiEndpointAvailableRef.current = false;
        return null;
      }
      if (json?.ok) return json;
    } catch (e) {}
    return null;
  };

  const lockDetectedMhdDate = (parsedDate, sourceLabel = 'KI', rawHint = '') => {
    if (!parsedDate) return;
    localOcrMissCountRef.current = 0;
    setDetectedMhdCandidate(parsedDate);
    setScanExpiry(parsedDate);
    setMhdSourceBadge(sourceLabel);
    if (rawHint) setLastOcrRawHint(rawHint);
    setIsMhdLockedByOcr(true);
    scanPhaseRef.current = 'mhd_locked';
    setScanPhase('mhd_locked');

    playMobileBeep('scan');
    triggerVibration([180, 70, 260]);

    const niceDate = parsedDate.slice(8, 10) + '.' + parsedDate.slice(5, 7) + '.' + parsedDate.slice(0, 4);
    const activeName = scanNameRef.current.trim();
    if (autoAddWhenBothScanned && activeName) {
      triggerAddCurrentScanToCart(parsedDate);
      showToast('⚡ Automatisch im Wagen!', activeName + ' (MHD: ' + niceDate + ')', getFoodEmoji(activeName));
    } else {
      showToast('📅 MHD erkannt (' + sourceLabel + '): ' + niceDate, 'Tippe auf „🛒 In Einkaufswagen“!', '🎉');
    }
  };

  const captureProductLabelFromLiveCamera = async (silentFallback = false) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentFallback) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return false;
    }
    if (isReadingFullLabel) return false;
    setIsReadingFullLabel(true);
    if (!silentFallback) {
      showToast('KI liest Verpackung...', 'Erkenne Produktname, Marke, Menge & MHD...', '🏷️');
    }

    try {
      const baseCanvas = grabFocusedFrameCanvas(false);
      if (!baseCanvas) return false;

      // 1. Zuerst KI-Vision probieren (liest Name + Marke + Menge + MHD auf einen Schlag)
      const aiRes = await callVisionAiScanner(baseCanvas, 'label');
      if (aiRes && (aiRes.productName || aiRes.expiryDate)) {
        if (aiRes.productName) {
          const finalName = simplifyProductName(aiRes.productName, aiRes.brand || '');
          const cat = detectSmartCategory(finalName);
          const loc = detectSmartLocation(finalName, cat);
          setScanName(finalName);
          scanNameRef.current = finalName;
          setScanCategory(cat);
          setScanLocation(loc);
          setScanGlutenFree(isProductGlutenFree(finalName, cat) ? 'yes' : 'auto');
          if (aiRes.quantity) setScanQty(String(aiRes.quantity).trim());
        }
        if (aiRes.expiryDate) {
          lockDetectedMhdDate(aiRes.expiryDate, 'KI-Etikett', aiRes.rawText || aiRes.expiryDate);
        } else if (aiRes.productName) {
          setIsMhdLockedByOcr(false);
          scanPhaseRef.current = 'hunting_mhd';
          setScanPhase('hunting_mhd');
          playMobileBeep('scan');
          triggerVibration([90, 45, 90]);
          showToast('KI-Etikett erkannt! 🏷️', aiRes.productName + ' – halte jetzt das MHD in den Rahmen!', getFoodEmoji(aiRes.productName));
        }
        return true;
      }

      // 2. Fallback: Lokales Tesseract-OCR (Deutsch)
      if (typeof window !== 'undefined' && !window.Tesseract) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const enhanced = buildMhdCanvasVariant(baseCanvas, 'contrast');
      const res = await window.Tesseract.recognize(enhanced, 'deu');
      const fullText = String(res?.data?.text || '');
      if (!fullText.trim()) return false;

      let foundFoodTitle = '';
      for (const kw of LABEL_FOOD_KEYWORDS) {
        const reg = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (reg.test(fullText)) {
          foundFoodTitle = kw;
          break;
        }
      }

      let foundBrand = '';
      for (const kb of KNOWN_BRAND_PREFIXES) {
        const reg = new RegExp('\\b' + kb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (reg.test(fullText)) {
          foundBrand = kb;
          break;
        }
      }

      if (!foundFoodTitle) {
        const cleanLines = fullText
          .split(/\r?\n/)
          .map(l => l.replace(/[^a-zA-ZäöüÄÖÜß0-9\s\-,.]/g, '').trim())
          .filter(l =>
            l.length >= 4 &&
            l.length <= 36 &&
            !/aufgezogen|geschlachtet|geboren|deutschland|verzehr|durcherhitzen|tropfsaft|lagerung|packung|mikrowellen|ch\.|g-nr|mindestens|haltbar|zutaten|nährwerte|brennwert|kühl|trocken/i.test(l)
          );
        if (cleanLines.length > 0) {
          foundFoodTitle = cleanLines[0];
        }
      }

      const weightMatch = fullText.match(/\b(\d{2,4})\s*(g|gr|kg|ml|l)\b/i);
      const parsedExp = extractExpiryDateFromText(fullText);

      if (foundFoodTitle) {
        const finalName = simplifyProductName(foundFoodTitle, foundBrand);
        const cat = detectSmartCategory(finalName);
        const loc = detectSmartLocation(finalName, cat);

        setScanName(finalName);
        scanNameRef.current = finalName;
        setScanCategory(cat);
        setScanLocation(loc);
        setScanGlutenFree(isProductGlutenFree(finalName, cat) ? 'yes' : 'auto');
        if (weightMatch) {
          setScanQty(weightMatch[1] + weightMatch[2].toLowerCase());
        }

        if (parsedExp) {
          lockDetectedMhdDate(parsedExp, 'Etikett', foundFoodTitle);
        } else {
          setIsMhdLockedByOcr(false);
          scanPhaseRef.current = 'hunting_mhd';
          setScanPhase('hunting_mhd');
          playMobileBeep('scan');
          triggerVibration([90, 45, 90]);
          showToast('Etikett gelesen! 🏷️', finalName + ' – halte jetzt das MHD in den Rahmen!', getFoodEmoji(finalName));
        }
        return true;
      } else if (parsedExp) {
        lockDetectedMhdDate(parsedExp, 'OCR', parsedExp);
        return true;
      }
    } catch (e) {} finally {
      setIsReadingFullLabel(false);
    }
    return false;
  };

  // Turbo MHD-Scanner: Gemini Flash Vision-KI + Multi-Pass Lokales OCR
  const captureMhdFromLiveCamera = async (silentMode = false, preferVisionAi = false) => {
    if (scanCheckoutOpenRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentMode) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return;
    }
    if (isReadingMhdRef.current) return;

    isReadingMhdRef.current = true;
    setIsReadingMhd(true);

    try {
      const baseCanvas = grabFocusedFrameCanvas(true);
      if (!baseCanvas) return;

      const now = Date.now();
      const shouldTryAiNow =
        aiEndpointAvailableRef.current &&
        (
          preferVisionAi ||
          !silentMode ||
          (scanPhaseRef.current === 'hunting_mhd' && localOcrMissCountRef.current >= 1 && now - lastAiMhdCallRef.current >= 2400)
        );

      // 1. Direkt-Schuss an Gemini Vision-KI
      if (shouldTryAiNow) {
        lastAiMhdCallRef.current = now;
        const aiRes = await callVisionAiScanner(baseCanvas, 'mhd');
        if (aiRes?.rawText) {
          setLastOcrRawHint('🤖 ' + String(aiRes.rawText).slice(0, 38));
        }
        if (aiRes?.expiryDate) {
          lockDetectedMhdDate(aiRes.expiryDate, 'KI-Vision', aiRes.rawText || aiRes.expiryDate);
          return;
        }
      }

      // 2. Verbessertes lokales Multi-Pass OCR
      const worker = await getFastMhdOcrWorker();
      const passes = silentMode ? ['contrast', 'invert'] : ['contrast', 'invert', 'raw'];
      let combinedRawSnippet = '';

      for (const passMode of passes) {
        const variantCanvas = buildMhdCanvasVariant(baseCanvas, passMode);
        const result = worker
          ? await worker.recognize(variantCanvas)
          : await window.Tesseract.recognize(variantCanvas, 'eng');

        const detectedText = String(result?.data?.text || '').trim();
        if (detectedText && !combinedRawSnippet) {
          combinedRawSnippet = detectedText.replace(/\s+/g, ' ').slice(0, 38);
        }

        const parsedDate = extractExpiryDateFromText(detectedText);
        if (parsedDate) {
          lockDetectedMhdDate(parsedDate, passMode === 'invert' ? 'OCR-Invert' : 'OCR', combinedRawSnippet);
          return;
        }
      }

      localOcrMissCountRef.current += 1;
      if (combinedRawSnippet) {
        setLastOcrRawHint('👁️ ' + combinedRawSnippet);
      }

      if (!silentMode) {
        triggerVibration(40);
        showToast(
          'Datum noch nicht klar erkannt',
          aiEndpointAvailableRef.current
            ? 'Kurz ruhig in den gelben Streifen halten & erneut tippen (oder 🔦 Licht / 🔍 2x).'
            : 'Tipp: Mit GEMINI_API_KEY in Vercel liest KI auch Punktschrift sofort – sonst 🔍 2x / 🔦 Licht nutzen.',
          '🔍'
        );
      }
    } catch (err) {
      if (!silentMode) showToast('MHD-Scan Hinweis', 'Bitte noch einmal antippen.', '⚠️');
    } finally {
      isReadingMhdRef.current = false;
      setIsReadingMhd(false);
    }
  };

  // MHD-Auto-Loop läuft AUSSCHLIESSLICH in Phase 2 ('hunting_mhd'), damit beide Scanner nie gegeneinander kämpfen
  useEffect(() => {
    if (!cameraActive || scannerMode !== 'barcode' || scanPhase !== 'hunting_mhd' || isMhdLockedByOcr) {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
      return;
    }

    mhdAutoLoopRef.current = setInterval(() => {
      if (!isReadingMhdRef.current && !isMhdLockedByOcr && !scanCheckoutOpenRef.current) {
        captureMhdFromLiveCamera(true, false);
      }
    }, 1000);

    return () => {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    };
  }, [cameraActive, isMhdLockedByOcr, scanPhase, scannerMode, scanName, autoAddWhenBothScanned]);

  //
  //
  // ============================================================================
  // PART 07: SCAN-VERARBEITUNG, LIVE-BARCODE-LOOP (MIT SPERRE) & BON-OCR
  // ============================================================================
  //
  //

  const fetchProductFromAllOpenDatabases = async (candidateCode) => {
    const fields =
      '?fields=product_name,product_name_de,generic_name,generic_name_de,brands,quantity,categories_tags,allergens_tags,labels_tags,image_front_small_url,image_front_thumb_url,image_small_url,image_url';
    const endpoints = [
      'https://de.openfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openpetfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openproductsfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.product && (data.product.product_name_de || data.product.product_name || data.product.generic_name_de || data.product.brands)) {
          return data.product;
        }
      } catch (e) {}
    }
    return null;
  };

  // Haupt-Scan-Verarbeitung inkl. 2-Stunden-Ausbuchungs-Check, Supabase-Katalog & Phasen-Wechsel
  const processMergedScanResult = async (mergedScan, skipCheckoutCheck = false) => {
    if (!mergedScan || mergedScan.allPureMarketingUrls) return;
    if (scanCheckoutOpenRef.current && !skipCheckoutCheck) return;

    const primaryCodeKey = mergedScan.lookupCodes[0] || mergedScan.primaryRaw.slice(0, 28);

    // 1. Prüfe direkt anhand des Barcodes oder gelernten Namens, ob das Produkt seit >= 2 Stunden im Bestand ist
    if (!skipCheckoutCheck) {
      const existingInStock = findExistingStockItemEligibleForCheckout(mergedScan);
      if (existingInStock) {
        const addedTs = getItemAddedTimestamp(existingInStock);
        const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
        playMobileBeep('shopping');
        triggerVibration([140, 60, 220]);
        setScanCheckoutModal({
          open: true,
          step: 'confirm_remove',
          stockItem: existingInStock,
          ageLabel: formatAgeDuration(ageMs),
          pendingMergedScan: mergedScan
        });
        return;
      }
    }

    // Sofort synchron in Phase 2 wechseln, damit der Barcode-Loop ab dieser Millisekunde pausiert
    const nextPhase = mergedScan.extractedExpiry ? 'mhd_locked' : 'hunting_mhd';
    scanPhaseRef.current = nextPhase;
    setScanPhase(nextPhase);

    setScannedBarcode(primaryCodeKey);
    setScanImageUrl(mergedScan.extractedImageUrl || '');
    if (mergedScan.formats) setLastDetectedFormat(mergedScan.formats);
    localOcrMissCountRef.current = 0;

    playMobileBeep('scan');
    triggerVibration([90, 45, 90]);

    if (mergedScan.extractedWeightQty) {
      setScanQty(mergedScan.extractedWeightQty);
    }

    if (mergedScan.extractedExpiry) {
      setScanExpiry(mergedScan.extractedExpiry);
      setDetectedMhdCandidate(mergedScan.extractedExpiry);
      setMhdSourceBadge('Code');
      setIsMhdLockedByOcr(true);
      triggerVibration([180, 70, 260]);
    } else {
      setIsMhdLockedByOcr(false);
      setDetectedMhdCandidate('');
      setMhdSourceBadge('');
      setLastOcrRawHint('');
    }

    if (mergedScan.extractedLocation) {
      setScanLocation(mergedScan.extractedLocation);
    }

    // 2. Sofort-Treffer aus dem lokalen Barcode-Gedächtnis
    const learnedHit = getLearnedProductFromMemory(primaryCodeKey) || getLearnedProductFromMemory(mergedScan.primaryRaw);
    if (learnedHit?.name) {
      const cat = detectSmartCategory(learnedHit.name, learnedHit.category);
      const loc = mergedScan.extractedLocation || learnedHit.location || detectSmartLocation(learnedHit.name, cat);
      setScanName(learnedHit.name);
      scanNameRef.current = learnedHit.name;
      if (!mergedScan.extractedWeightQty && learnedHit.quantity) setScanQty(learnedHit.quantity);
      if (learnedHit.imageUrl) setScanImageUrl(learnedHit.imageUrl);
      setScanCategory(cat);
      setScanLocation(loc);
      setScanGlutenFree(learnedHit.glutenFree || (isProductGlutenFree(learnedHit.name, cat) ? 'yes' : 'auto'));
      showToast(
        '✅ Barcode erkannt: ' + learnedHit.name,
        mergedScan.extractedExpiry ? 'MHD aus Code übernommen!' : '👉 Barcode gesperrt – jetzt ruhig das MHD scannen!',
        getFoodEmoji(learnedHit.name)
      );
      return;
    }

    if (mergedScan.extractedName && mergedScan.lookupCodes.length === 0) {
      const cleanQrName = simplifyProductName(mergedScan.extractedName, mergedScan.extractedBrand || '');
      const cat = detectSmartCategory(cleanQrName);
      const loc = mergedScan.extractedLocation || detectSmartLocation(cleanQrName, cat);
      setScanName(cleanQrName);
      scanNameRef.current = cleanQrName;
      setScanCategory(cat);
      setScanLocation(loc);
      setScanGlutenFree(isProductGlutenFree(cleanQrName, cat) ? 'yes' : 'auto');
      showToast('QR-Produkt erkannt! 🎯', cleanQrName + ' – suche jetzt nach MHD...', getFoodEmoji(cleanQrName));
      return;
    }

    // 3. Online-Abfrage: Erst zentrale Supabase-Produktdatenbank (/api/products), dann OpenFoodFacts
    isLookingUpRef.current = true;
    setIsLookingUpProduct(true);
    try {
      const candidatesToTry = mergedScan.lookupCodes.length > 0 ? mergedScan.lookupCodes : [mergedScan.primaryRaw];

      // 3a. Zentrale Supabase-Produktdatenbank abfragen
      for (const candidateCode of candidatesToTry.slice(0, 2)) {
        try {
          const catRes = await fetch('/api/products?barcode=' + encodeURIComponent(candidateCode), {
            cache: 'no-store'
          });
          if (catRes.ok) {
            const catJson = await catRes.json();
            if (catJson?.found && catJson.product?.name) {
              const dbProd = catJson.product;

              if (!skipCheckoutCheck) {
                const matchByDbName = findExistingStockItemEligibleForCheckout(mergedScan, dbProd.name);
                if (matchByDbName) {
                  const addedTs = getItemAddedTimestamp(matchByDbName);
                  const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
                  scanPhaseRef.current = 'barcode';
                  setScanPhase('barcode');
                  triggerVibration([140, 60, 220]);
                  setScanCheckoutModal({
                    open: true,
                    step: 'confirm_remove',
                    stockItem: matchByDbName,
                    ageLabel: formatAgeDuration(ageMs),
                    pendingMergedScan: mergedScan
                  });
                  return;
                }
              }

              const cat = detectSmartCategory(dbProd.name, dbProd.category);
              const loc = mergedScan.extractedLocation || dbProd.location || detectSmartLocation(dbProd.name, cat);
              setScanName(dbProd.name);
              scanNameRef.current = dbProd.name;
              if (!mergedScan.extractedWeightQty && dbProd.quantity) setScanQty(dbProd.quantity);
              setScanImageUrl(dbProd.imageUrl || '');
              setScanCategory(cat);
              setScanLocation(loc);
              setScanGlutenFree(dbProd.glutenFree || (isProductGlutenFree(dbProd.name, cat) ? 'yes' : 'auto'));

              saveLearnedProductToMemory(candidateCode, dbProd, false);

              setEstimatedMhdHint('⚡ Aus Cloud-Katalog geladen! Barcode pausiert – halte jetzt das MHD in den gelben Streifen.');
              showToast(
                '⚡ Cloud-Datenbank: ' + dbProd.name,
                mergedScan.extractedExpiry ? 'MHD aus Code übernommen!' : '👉 Barcode gesperrt – jetzt ruhig das MHD scannen!',
                getFoodEmoji(dbProd.name)
              );
              return;
            }
          }
        } catch (e) {}
      }

      // 3b. OpenFoodFacts / PetFood / Products abfragen (inkl. Produktbild)
      for (const candidateCode of candidatesToTry.slice(0, 3)) {
        const p = await fetchProductFromAllOpenDatabases(candidateCode);
        if (p) {
          const rawProdName = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || '';
          const rawBrand = p.brands ? p.brands.split(',')[0].trim() : (mergedScan.extractedBrand || '');
          const offCats = Array.isArray(p.categories_tags) ? p.categories_tags : [];
          const offAllergens = Array.isArray(p.allergens_tags) ? p.allergens_tags : [];
          const offLabels = Array.isArray(p.labels_tags) ? p.labels_tags : [];

          let nameWithTk = rawProdName;
          if (offCats.some(t => /frozen/.test(t)) && !/\btk\b|tiefkühl|tiefgekühlt/i.test(nameWithTk)) {
            nameWithTk = (nameWithTk + ' TK').trim();
          }

          const smartName = simplifyProductName(nameWithTk || rawBrand, rawBrand);
          const qty = mergedScan.extractedWeightQty || (p.quantity ? String(p.quantity).trim() : '1x');
          const img = extractOpenFoodFactsImage(p);

          if (!skipCheckoutCheck && smartName) {
            const matchByResolvedName = findExistingStockItemEligibleForCheckout(mergedScan, smartName);
            if (matchByResolvedName) {
              const addedTs = getItemAddedTimestamp(matchByResolvedName);
              const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
              scanPhaseRef.current = 'barcode';
              setScanPhase('barcode');
              triggerVibration([140, 60, 220]);
              setScanCheckoutModal({
                open: true,
                step: 'confirm_remove',
                stockItem: matchByResolvedName,
                ageLabel: formatAgeDuration(ageMs),
                pendingMergedScan: mergedScan
              });
              return;
            }
          }

          setScanImageUrl(img || '');
          if (smartName) {
            const detectedCat = detectSmartCategory(smartName, 'auto', offCats);
            const detectedLoc = mergedScan.extractedLocation || detectSmartLocation(smartName, detectedCat, offCats);
            const isGf = isProductGlutenFree(smartName, detectedCat, 'auto', offAllergens, offLabels);

            setScanName(smartName);
            scanNameRef.current = smartName;
            setScanQty(qty);
            setScanCategory(detectedCat);
            setScanLocation(detectedLoc);
            setScanGlutenFree(isGf ? 'yes' : 'auto');

            saveLearnedProductToMemory(candidateCode, {
              name: smartName,
              quantity: qty,
              location: detectedLoc,
              category: detectedCat,
              glutenFree: isGf ? 'yes' : 'auto',
              imageUrl: img
            }, true);

            const freshMatch = estimateProduceByName(smartName);
            if (detectedLoc === 'freezer' && !mergedScan.extractedExpiry) {
              setEstimatedMhdHint('❄️ TK erkannt – Barcode pausiert, Kamera sucht jetzt nach dem MHD (oder tippe +6M).');
            } else if (freshMatch && !mergedScan.extractedExpiry) {
              setEstimatedMhdHint(freshMatch.emoji + ' Barcode pausiert – Kamera sucht jetzt das MHD (Empfehlung: +' + freshMatch.days + 'T).');
            } else {
              setEstimatedMhdHint('🎯 Produkt gesperrt! Halte jetzt das MHD in den gelben Streifen (oder tippe kurz aufs Bild).');
            }

            triggerVibration([100, 50, 100]);
            showToast(
              '✅ ' + smartName,
              img ? 'Produktbild geladen! Jetzt ruhig das MHD scannen.' : 'Barcode pausiert – jetzt ruhig das MHD scannen!',
              getFoodEmoji(smartName)
            );
            return;
          }
        }
      }

      if (mergedScan.extractedName) {
        const cleanQrName = simplifyProductName(mergedScan.extractedName, mergedScan.extractedBrand || '');
        const cat = detectSmartCategory(cleanQrName);
        const loc = detectSmartLocation(cleanQrName, cat);
        setScanName(cleanQrName);
        scanNameRef.current = cleanQrName;
        setScanCategory(cat);
        setScanLocation(loc);
        showToast('Aus QR-Code erkannt!', cleanQrName + ' – suche jetzt MHD...', getFoodEmoji(cleanQrName));
        return;
      }

      // Etiketten-Fallback nur auslösen, wenn noch kein Produktname gesetzt ist
      if (!scanNameRef.current.trim()) {
        const labelSuccess = await captureProductLabelFromLiveCamera(true);
        if (!labelSuccess) {
          showToast(
            (mergedScan.formats || 'Barcode') + ' gescannt!',
            'Name bitte kurz eingeben – Kamera sucht jetzt das MHD-Datum.',
            '🏷️'
          );
        }
      }
    } catch (e) {
      if (!scanNameRef.current.trim()) {
        await captureProductLabelFromLiveCamera(true);
      }
    } finally {
      isLookingUpRef.current = false;
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
      hardwareZoomSupportedRef.current = false;
      localOcrMissCountRef.current = 0;
      pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
      setCameraActive(true);
      const initialPhase = scanNameRef.current.trim() ? 'hunting_mhd' : 'barcode';
      scanPhaseRef.current = initialPhase;
      setScanPhase(initialPhase);
      requestScreenWakeLock();
      getFastMhdOcrWorker().catch(() => {});
      getZXingMultiFormatReader().catch(() => {});

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);

      let nativeDetector = null;
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          let formatsToUse = ALL_DESIRED_BARCODE_FORMATS;
          if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
            const supported = await window.BarcodeDetector.getSupportedFormats();
            if (Array.isArray(supported) && supported.length > 0) {
              formatsToUse = supported;
              setActiveFormatCount(supported.length);
            }
          }
          nativeDetector = new window.BarcodeDetector({ formats: formatsToUse });
        } catch (e) {
          try { nativeDetector = new window.BarcodeDetector(); } catch (err2) {}
        }
      }

      let frameTick = 0;
      scanLoopRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (scanCheckoutOpenRef.current) return;

        // HARTE PHASEN-SPERRE: Im MHD-Modus, in Frische-KI oder während der Abfrage keine Barcodes scannen!
        if (
          scannerModeRef.current !== 'barcode' ||
          scanPhaseRef.current !== 'barcode' ||
          isLookingUpRef.current
        ) {
          return;
        }

        frameTick++;

        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const merged = mergeMultipleBarcodesFromFrame(barcodes);
              if (merged && !merged.allPureMarketingUrls) {
                const signature = merged.lookupCodes.join('_') || merged.primaryRaw;
                const now = Date.now();
                if (signature && (signature !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 7000)) {
                  lastScannedCodeRef.current = signature;
                  lastScanTimeRef.current = now;
                  pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
                  processMergedScanResult(merged, false);
                  return;
                }
              }
            }
          } catch (err) {}
        }

        // ZXing-Fallback nur für echte Codes: erfordert gültigen Payload + 2 identische Treffer in Folge
        if (frameTick % 2 === 0 && zxingReaderRef.current) {
          try {
            const vid = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

            const luminanceSource = new window.ZXing.HTMLCanvasElementLuminanceSource(canvas);
            const binaryBitmap = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(luminanceSource));
            const zxingResult = zxingReaderRef.current.decodeBitmap(binaryBitmap);
            if (zxingResult && zxingResult.getText()) {
              const rawVal = String(zxingResult.getText()).trim();
              const merged = mergeMultipleBarcodesFromFrame([{ rawValue: rawVal, format: '2D/Multi' }]);
              const now = Date.now();

              if (merged && !merged.allPureMarketingUrls) {
                const hasValidPayload =
                  merged.lookupCodes.length > 0 ||
                  Boolean(merged.extractedName) ||
                  Boolean(merged.extractedExpiry);
                if (!hasValidPayload) return;

                const prev = pendingZxingCandidateRef.current;
                const hits = (prev.code === rawVal && now - prev.ts < 1800) ? prev.hits + 1 : 1;
                pendingZxingCandidateRef.current = { code: rawVal, hits, ts: now };
                if (hits < 2) return;

                if (rawVal !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 7000) {
                  lastScannedCodeRef.current = rawVal;
                  lastScanTimeRef.current = now;
                  pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
                  processMergedScanResult(merged, false);
                }
              }
            }
          } catch (zErr) {}
        }
      }, 360);
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
      triggerVibration([100, 50, 140]);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt & Namen vereinfacht.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };
  //
//
// ============================================================================
// PART 04: STATES, PHASEN-SPERR-REFS & RESET-HELFER
// ============================================================================
//
//

export default function PocketScanner({
  cartItems,
  stockItems = [],
  accountId = '',
  todayStr,
  isSyncing,
  themeStyles,
  onAddSingleToCart,
  onAddBatchToCart,
  onRemoveCartItem,
  onTransferSingleCartItemToStock,
  onTransferAllCartToStock,
  onCheckoutStockItemByScan,
  onAddShopItem,
  showToast
}) {
  const [scannerMode, setScannerMode] = useState('barcode'); // 'barcode' | 'object_ai' | 'receipt'
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [showProduceDrawer, setShowProduceDrawer] = useState(false);
  const [activeFormatCount, setActiveFormatCount] = useState(13);
  const [lastDetectedFormat, setLastDetectedFormat] = useState('');

  // 2-PHASEN-SCANNER-STATUS ('barcode' | 'hunting_mhd' | 'mhd_locked')
  const [scanPhase, setScanPhase] = useState('barcode');
  const [autoAddWhenBothScanned, setAutoAddWhenBothScanned] = useState(false);

  // 2-STUNDEN BARCODE-AUSBUCHUNGS-MODAL
  const [scanCheckoutModal, setScanCheckoutModal] = useState({
    open: false,
    step: 'confirm_remove',
    stockItem: null,
    ageLabel: '',
    pendingMergedScan: null
  });

  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('fridge');
  const [scanCategory, setScanCategory] = useState('auto');
  const [scanGlutenFree, setScanGlutenFree] = useState('auto');
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);
  const [estimatedMhdHint, setEstimatedMhdHint] = useState('');

  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);
  const [detectedMhdCandidate, setDetectedMhdCandidate] = useState('');
  const [isMhdLockedByOcr, setIsMhdLockedByOcr] = useState(false);
  const [lastOcrRawHint, setLastOcrRawHint] = useState('');
  const [mhdSourceBadge, setMhdSourceBadge] = useState(''); // 'KI' | 'OCR' | 'Code'
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [isReadingFullLabel, setIsReadingFullLabel] = useState(false);
  const [isDetectingObject, setIsDetectingObject] = useState(false);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const mhdAutoLoopRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const mobileNetModelRef = useRef(null);
  const wakeLockRef = useRef(null);
  const hardwareZoomSupportedRef = useRef(false);
  const aiEndpointAvailableRef = useRef(true);
  const lastAiMhdCallRef = useRef(0);
  const localOcrMissCountRef = useRef(0);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isReadingMhdRef = useRef(false);
  const scanCheckoutOpenRef = useRef(false);
  scanCheckoutOpenRef.current = Boolean(scanCheckoutModal.open);

  // SYNCHRONE PHASEN-SPERR-REFS (VERHINDERT BARCODE-SCANS IM MHD-MODUS)
  const scanPhaseRef = useRef('barcode');
  scanPhaseRef.current = scanPhase;
  const scannerModeRef = useRef('barcode');
  scannerModeRef.current = scannerMode;
  const scanNameRef = useRef('');
  scanNameRef.current = scanName;
  const isLookingUpRef = useRef(false);
  isLookingUpRef.current = isLookingUpProduct;
  const pendingZxingCandidateRef = useRef({ code: '', hits: 0, ts: 0 });

  const stockItemsRef = useRef(stockItems);
  stockItemsRef.current = Array.isArray(stockItems) ? stockItems : [];

  const effectiveAccountId =
    accountId || (typeof localStorage !== 'undefined' ? localStorage.getItem('richter_tw_account_id') || 'local' : 'local');

  const resetScannerToBarcodePhase = () => {
    setScanName('');
    scanNameRef.current = '';
    setScannedBarcode('');
    setLastDetectedFormat('');
    setScanImageUrl('');
    setDetectedMhdCandidate('');
    setScanExpiry('');
    setMhdSourceBadge('');
    setIsMhdLockedByOcr(false);
    setEstimatedMhdHint('');
    setLastOcrRawHint('');
    localOcrMissCountRef.current = 0;
    lastScannedCodeRef.current = '';
    pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
    scanPhaseRef.current = 'barcode';
    setScanPhase('barcode');
  };

  //
  //
  // ============================================================================
  // PART 05: KAMERA-STEUERUNG, SUPABASE-FOTO & 2-STUNDEN-AUSBUCHUNGS-CHECK
  // ============================================================================
  //
  //

  const triggerVibration = (pattern) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

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
    hardwareZoomSupportedRef.current = false;
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      const caps = track?.getCapabilities?.();
      if (track && caps && caps.zoom) {
        const targetZoom = next ? Math.min(2.2, caps.zoom.max || 2.0) : Math.max(1.0, caps.zoom.min || 1.0);
        await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
        hardwareZoomSupportedRef.current = true;
      }
    } catch (e) {
      hardwareZoomSupportedRef.current = false;
    }
  };

  // Produktfoto komprimieren & in Supabase Storage hochladen
  const runSupabaseProductPhotoUpload = async (source) => {
    if (!source || isUploadingProductPhoto) return;
    setIsUploadingProductPhoto(true);
    showToast('Lade Produktfoto hoch...', 'Wird komprimiert & in Supabase gespeichert...', '📸');
    try {
      const publicUrl = await uploadProductPhotoToSupabase({
        source,
        accountId: effectiveAccountId,
        barcode: scannedBarcode
      });
      setScanImageUrl(publicUrl);

      if (scannedBarcode && scanName.trim()) {
        const resolvedCat = scanCategory === 'auto' ? detectSmartCategory(scanName) : scanCategory;
        saveLearnedProductToMemory(scannedBarcode, {
          name: simplifyProductName(scanName),
          quantity: scanQty.trim() || '1x',
          location: scanLocation,
          category: resolvedCat,
          glutenFree: scanGlutenFree,
          imageUrl: publicUrl
        }, true);
      }

      playMobileBeep('scan');
      triggerVibration([80, 40, 100]);
      showToast('Produktfoto gespeichert! ✅', 'Erscheint direkt auf deiner Touchwall.', '🖼️');
    } catch (err) {
      showToast('Foto-Upload fehlgeschlagen', err?.message || 'Bitte erneut versuchen.', '⚠️');
    } finally {
      setIsUploadingProductPhoto(false);
    }
  };

  const handleProductPhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await runSupabaseProductPhotoUpload(file);
  };

  const handleSnapProductPhotoFromLiveCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      showToast('Kamera nicht aktiv', 'Starte erst die Kamera oder nutze „📸 Foto wählen“.', '📷');
      return;
    }
    await runSupabaseProductPhotoUpload(videoRef.current);
  };

  // Schneidet exakt den sichtbaren Fokus-Rahmen aus (inkl. echtem Digital-Zoom, falls 2x aktiv)
  const grabFocusedFrameCanvas = (tightForMhd = true) => {
    const vid = videoRef.current;
    if (!vid || vid.readyState < 2) return null;

    const vw = vid.videoWidth || 1280;
    const vh = vid.videoHeight || 720;

    const digitalZoomFactor = zoomActive && !hardwareZoomSupportedRef.current ? 1.85 : 1.0;

    const baseW = tightForMhd ? 0.78 : 0.90;
    const baseH = tightForMhd ? 0.36 : 0.78;

    const cropW = Math.max(240, Math.floor((vw * baseW) / digitalZoomFactor));
    const cropH = Math.max(120, Math.floor((vh * baseH) / digitalZoomFactor));
    const cropX = Math.max(0, Math.floor((vw - cropW) / 2));
    const cropY = Math.max(0, Math.floor((vh - cropH) / 2));

    const maxOutW = tightForMhd ? 960 : 1024;
    const scale = cropW > maxOutW ? maxOutW / cropW : (cropW < 540 ? 540 / cropW : 1);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  // Prüft, ob der gescannte Barcode bereits seit >= 2 Stunden im Bestand liegt
  const findExistingStockItemEligibleForCheckout = (mergedScan, candidateName = '') => {
    const currentStock = stockItemsRef.current || [];
    if (currentStock.length === 0) return null;

    const now = Date.now();
    const codesToCheck = new Set(
      [...(mergedScan?.lookupCodes || []), mergedScan?.primaryRaw]
        .map(c => String(c || '').trim())
        .filter(Boolean)
    );

    const learnedHit =
      getLearnedProductFromMemory(mergedScan?.lookupCodes?.[0]) ||
      getLearnedProductFromMemory(mergedScan?.primaryRaw);
    const targetNameLower = String(candidateName || learnedHit?.name || mergedScan?.extractedName || '')
      .toLowerCase()
      .trim();

    const matches = currentStock.filter(st => {
      if (!st) return false;
      const stCode = String(st.barcode || '').trim();
      if (stCode && codesToCheck.has(stCode)) return true;

      const stDigits = stCode.replace(/\D/g, '');
      if (stDigits.length === 13 && /^2[0-9]/.test(stDigits)) {
        const prefix7 = stDigits.slice(0, 7);
        for (const c of codesToCheck) {
          const cDigits = c.replace(/\D/g, '');
          if (cDigits.length === 13 && cDigits.startsWith(prefix7)) return true;
        }
      }

      if (targetNameLower && String(st.name || '').toLowerCase().trim() === targetNameLower) {
        return true;
      }
      return false;
    });

    if (matches.length === 0) return null;

    matches.sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));

    const eligibleMatch = matches.find(st => {
      const addedTs = getItemAddedTimestamp(st);
      if (!addedTs) return true;
      return (now - addedTs) >= TWO_HOURS_GRACE_MS;
    });

    return eligibleMatch || null;
  };

  const applyFreshProduceSelection = (produceItem, showFeedbackToast = true) => {
    if (!produceItem) return;
    const estDate = formatDateStr(addDays(new Date(), produceItem.days));
    setScanName(produceItem.name);
    scanNameRef.current = produceItem.name;
    setScanLocation(produceItem.location);
    setScanCategory(produceItem.category);
    setScanGlutenFree('yes');
    setScanImageUrl('');
    setScanExpiry(estDate);
    setDetectedMhdCandidate(estDate);
    setMhdSourceBadge('Frische-KI');
    setIsMhdLockedByOcr(true);
    scanPhaseRef.current = 'mhd_locked';
    setScanPhase('mhd_locked');
    setEstimatedMhdHint(
      produceItem.emoji + ' ' + produceItem.name + ' → MHD +' + produceItem.days + ' Tage (' + produceItem.hint + ')'
    );
    setShowProduceDrawer(false);
    playMobileBeep('scan');
    triggerVibration([90, 40, 120]);
    if (showFeedbackToast) {
      showToast(
        produceItem.name + ' gewählt!',
        'Lagerort & MHD (+' + produceItem.days + ' Tage) automatisch gesetzt.',
        produceItem.emoji
      );
    }
  };

  //
  //
  // ============================================================================
  // PART 06: ZXING, FRISCHE-KI, GEMINI VISION-KI & MHD-OCR (NUR IN PHASE 2)
  // ============================================================================
  //
  //

  const getZXingMultiFormatReader = async () => {
    if (zxingReaderRef.current) return zxingReaderRef.current;
    if (typeof window === 'undefined') return null;

    try {
      if (!window.ZXing) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.2/umd/index.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (window.ZXing?.BrowserMultiFormatReader) {
        const hints = new Map();
        if (window.ZXing.DecodeHintType && window.ZXing.BarcodeFormat) {
          const formats = [
            window.ZXing.BarcodeFormat.EAN_13,
            window.ZXing.BarcodeFormat.EAN_8,
            window.ZXing.BarcodeFormat.UPC_A,
            window.ZXing.BarcodeFormat.UPC_E,
            window.ZXing.BarcodeFormat.CODE_128,
            window.ZXing.BarcodeFormat.CODE_39,
            window.ZXing.BarcodeFormat.CODE_93,
            window.ZXing.BarcodeFormat.ITF,
            window.ZXing.BarcodeFormat.CODABAR,
            window.ZXing.BarcodeFormat.QR_CODE,
            window.ZXing.BarcodeFormat.DATA_MATRIX,
            window.ZXing.BarcodeFormat.PDF_417,
            window.ZXing.BarcodeFormat.AZTEC,
            window.ZXing.BarcodeFormat.RSS_14,
            window.ZXing.BarcodeFormat.RSS_EXPANDED
          ].filter(Boolean);
          hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
          hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
        }
        const reader = new window.ZXing.BrowserMultiFormatReader(hints);
        zxingReaderRef.current = reader;
        return reader;
      }
    } catch (e) {}
    return null;
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
        showToast('Bitte näher heranhalten', 'Oder wähle das Frischeprodukt direkt im aufgeklappten Menü!', '🔍');
      }
    } catch (err) {
      setShowProduceDrawer(true);
    } finally {
      setIsDetectingObject(false);
    }
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
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789.,/-:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '
      });
      ocrWorkerRef.current = worker;
      return worker;
    }
    return null;
  };

  // KI-Vision Aufruf (/api/mhd-ai via Gemini 2.5 Flash)
  const callVisionAiScanner = async (canvas, mode = 'mhd') => {
    if (!aiEndpointAvailableRef.current || !canvas) return null;
    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.86);
      const res = await fetch('/api/mhd-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mode, todayStr }),
        cache: 'no-store'
      });
      const json = await res.json();
      if (json?.fallbackToLocal && String(json?.error || '').includes('GEMINI_API_KEY fehlt')) {
        aiEndpointAvailableRef.current = false;
        return null;
      }
      if (json?.ok) return json;
    } catch (e) {}
    return null;
  };

  const lockDetectedMhdDate = (parsedDate, sourceLabel = 'KI', rawHint = '') => {
    if (!parsedDate) return;
    localOcrMissCountRef.current = 0;
    setDetectedMhdCandidate(parsedDate);
    setScanExpiry(parsedDate);
    setMhdSourceBadge(sourceLabel);
    if (rawHint) setLastOcrRawHint(rawHint);
    setIsMhdLockedByOcr(true);
    scanPhaseRef.current = 'mhd_locked';
    setScanPhase('mhd_locked');

    playMobileBeep('scan');
    triggerVibration([180, 70, 260]);

    const niceDate = parsedDate.slice(8, 10) + '.' + parsedDate.slice(5, 7) + '.' + parsedDate.slice(0, 4);
    const activeName = scanNameRef.current.trim();
    if (autoAddWhenBothScanned && activeName) {
      triggerAddCurrentScanToCart(parsedDate);
      showToast('⚡ Automatisch im Wagen!', activeName + ' (MHD: ' + niceDate + ')', getFoodEmoji(activeName));
    } else {
      showToast('📅 MHD erkannt (' + sourceLabel + '): ' + niceDate, 'Tippe auf „🛒 In Einkaufswagen“!', '🎉');
    }
  };

  const captureProductLabelFromLiveCamera = async (silentFallback = false) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentFallback) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return false;
    }
    if (isReadingFullLabel) return false;
    setIsReadingFullLabel(true);
    if (!silentFallback) {
      showToast('KI liest Verpackung...', 'Erkenne Produktname, Marke, Menge & MHD...', '🏷️');
    }

    try {
      const baseCanvas = grabFocusedFrameCanvas(false);
      if (!baseCanvas) return false;

      // 1. Zuerst KI-Vision probieren (liest Name + Marke + Menge + MHD auf einen Schlag)
      const aiRes = await callVisionAiScanner(baseCanvas, 'label');
      if (aiRes && (aiRes.productName || aiRes.expiryDate)) {
        if (aiRes.productName) {
          const finalName = simplifyProductName(aiRes.productName, aiRes.brand || '');
          const cat = detectSmartCategory(finalName);
          const loc = detectSmartLocation(finalName, cat);
          setScanName(finalName);
          scanNameRef.current = finalName;
          setScanCategory(cat);
          setScanLocation(loc);
          setScanGlutenFree(isProductGlutenFree(finalName, cat) ? 'yes' : 'auto');
          if (aiRes.quantity) setScanQty(String(aiRes.quantity).trim());
        }
        if (aiRes.expiryDate) {
          lockDetectedMhdDate(aiRes.expiryDate, 'KI-Etikett', aiRes.rawText || aiRes.expiryDate);
        } else if (aiRes.productName) {
          setIsMhdLockedByOcr(false);
          scanPhaseRef.current = 'hunting_mhd';
          setScanPhase('hunting_mhd');
          playMobileBeep('scan');
          triggerVibration([90, 45, 90]);
          showToast('KI-Etikett erkannt! 🏷️', aiRes.productName + ' – halte jetzt das MHD in den Rahmen!', getFoodEmoji(aiRes.productName));
        }
        return true;
      }

      // 2. Fallback: Lokales Tesseract-OCR (Deutsch)
      if (typeof window !== 'undefined' && !window.Tesseract) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const enhanced = buildMhdCanvasVariant(baseCanvas, 'contrast');
      const res = await window.Tesseract.recognize(enhanced, 'deu');
      const fullText = String(res?.data?.text || '');
      if (!fullText.trim()) return false;

      let foundFoodTitle = '';
      for (const kw of LABEL_FOOD_KEYWORDS) {
        const reg = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (reg.test(fullText)) {
          foundFoodTitle = kw;
          break;
        }
      }

      let foundBrand = '';
      for (const kb of KNOWN_BRAND_PREFIXES) {
        const reg = new RegExp('\\b' + kb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (reg.test(fullText)) {
          foundBrand = kb;
          break;
        }
      }

      if (!foundFoodTitle) {
        const cleanLines = fullText
          .split(/\r?\n/)
          .map(l => l.replace(/[^a-zA-ZäöüÄÖÜß0-9\s\-,.]/g, '').trim())
          .filter(l =>
            l.length >= 4 &&
            l.length <= 36 &&
            !/aufgezogen|geschlachtet|geboren|deutschland|verzehr|durcherhitzen|tropfsaft|lagerung|packung|mikrowellen|ch\.|g-nr|mindestens|haltbar|zutaten|nährwerte|brennwert|kühl|trocken/i.test(l)
          );
        if (cleanLines.length > 0) {
          foundFoodTitle = cleanLines[0];
        }
      }

      const weightMatch = fullText.match(/\b(\d{2,4})\s*(g|gr|kg|ml|l)\b/i);
      const parsedExp = extractExpiryDateFromText(fullText);

      if (foundFoodTitle) {
        const finalName = simplifyProductName(foundFoodTitle, foundBrand);
        const cat = detectSmartCategory(finalName);
        const loc = detectSmartLocation(finalName, cat);

        setScanName(finalName);
        scanNameRef.current = finalName;
        setScanCategory(cat);
        setScanLocation(loc);
        setScanGlutenFree(isProductGlutenFree(finalName, cat) ? 'yes' : 'auto');
        if (weightMatch) {
          setScanQty(weightMatch[1] + weightMatch[2].toLowerCase());
        }

        if (parsedExp) {
          lockDetectedMhdDate(parsedExp, 'Etikett', foundFoodTitle);
        } else {
          setIsMhdLockedByOcr(false);
          scanPhaseRef.current = 'hunting_mhd';
          setScanPhase('hunting_mhd');
          playMobileBeep('scan');
          triggerVibration([90, 45, 90]);
          showToast('Etikett gelesen! 🏷️', finalName + ' – halte jetzt das MHD in den Rahmen!', getFoodEmoji(finalName));
        }
        return true;
      } else if (parsedExp) {
        lockDetectedMhdDate(parsedExp, 'OCR', parsedExp);
        return true;
      }
    } catch (e) {} finally {
      setIsReadingFullLabel(false);
    }
    return false;
  };

  // Turbo MHD-Scanner: Gemini Flash Vision-KI + Multi-Pass Lokales OCR
  const captureMhdFromLiveCamera = async (silentMode = false, preferVisionAi = false) => {
    if (scanCheckoutOpenRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentMode) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return;
    }
    if (isReadingMhdRef.current) return;

    isReadingMhdRef.current = true;
    setIsReadingMhd(true);

    try {
      const baseCanvas = grabFocusedFrameCanvas(true);
      if (!baseCanvas) return;

      const now = Date.now();
      const shouldTryAiNow =
        aiEndpointAvailableRef.current &&
        (
          preferVisionAi ||
          !silentMode ||
          (scanPhaseRef.current === 'hunting_mhd' && localOcrMissCountRef.current >= 1 && now - lastAiMhdCallRef.current >= 2400)
        );

      // 1. Direkt-Schuss an Gemini Vision-KI
      if (shouldTryAiNow) {
        lastAiMhdCallRef.current = now;
        const aiRes = await callVisionAiScanner(baseCanvas, 'mhd');
        if (aiRes?.rawText) {
          setLastOcrRawHint('🤖 ' + String(aiRes.rawText).slice(0, 38));
        }
        if (aiRes?.expiryDate) {
          lockDetectedMhdDate(aiRes.expiryDate, 'KI-Vision', aiRes.rawText || aiRes.expiryDate);
          return;
        }
      }

      // 2. Verbessertes lokales Multi-Pass OCR
      const worker = await getFastMhdOcrWorker();
      const passes = silentMode ? ['contrast', 'invert'] : ['contrast', 'invert', 'raw'];
      let combinedRawSnippet = '';

      for (const passMode of passes) {
        const variantCanvas = buildMhdCanvasVariant(baseCanvas, passMode);
        const result = worker
          ? await worker.recognize(variantCanvas)
          : await window.Tesseract.recognize(variantCanvas, 'eng');

        const detectedText = String(result?.data?.text || '').trim();
        if (detectedText && !combinedRawSnippet) {
          combinedRawSnippet = detectedText.replace(/\s+/g, ' ').slice(0, 38);
        }

        const parsedDate = extractExpiryDateFromText(detectedText);
        if (parsedDate) {
          lockDetectedMhdDate(parsedDate, passMode === 'invert' ? 'OCR-Invert' : 'OCR', combinedRawSnippet);
          return;
        }
      }

      localOcrMissCountRef.current += 1;
      if (combinedRawSnippet) {
        setLastOcrRawHint('👁️ ' + combinedRawSnippet);
      }

      if (!silentMode) {
        triggerVibration(40);
        showToast(
          'Datum noch nicht klar erkannt',
          aiEndpointAvailableRef.current
            ? 'Kurz ruhig in den gelben Streifen halten & erneut tippen (oder 🔦 Licht / 🔍 2x).'
            : 'Tipp: Mit GEMINI_API_KEY in Vercel liest KI auch Punktschrift sofort – sonst 🔍 2x / 🔦 Licht nutzen.',
          '🔍'
        );
      }
    } catch (err) {
      if (!silentMode) showToast('MHD-Scan Hinweis', 'Bitte noch einmal antippen.', '⚠️');
    } finally {
      isReadingMhdRef.current = false;
      setIsReadingMhd(false);
    }
  };

  // MHD-Auto-Loop läuft AUSSCHLIESSLICH in Phase 2 ('hunting_mhd'), damit beide Scanner nie gegeneinander kämpfen
  useEffect(() => {
    if (!cameraActive || scannerMode !== 'barcode' || scanPhase !== 'hunting_mhd' || isMhdLockedByOcr) {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
      return;
    }

    mhdAutoLoopRef.current = setInterval(() => {
      if (!isReadingMhdRef.current && !isMhdLockedByOcr && !scanCheckoutOpenRef.current) {
        captureMhdFromLiveCamera(true, false);
      }
    }, 1000);

    return () => {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    };
  }, [cameraActive, isMhdLockedByOcr, scanPhase, scannerMode, scanName, autoAddWhenBothScanned]);

  //
  //
  // ============================================================================
  // PART 07: SCAN-VERARBEITUNG, LIVE-BARCODE-LOOP (MIT SPERRE) & BON-OCR
  // ============================================================================
  //
  //

  const fetchProductFromAllOpenDatabases = async (candidateCode) => {
    const fields =
      '?fields=product_name,product_name_de,generic_name,generic_name_de,brands,quantity,categories_tags,allergens_tags,labels_tags,image_front_small_url,image_front_thumb_url,image_small_url,image_url';
    const endpoints = [
      'https://de.openfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openpetfoodfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields,
      'https://world.openproductsfacts.org/api/v2/product/' + encodeURIComponent(candidateCode) + '.json' + fields
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.product && (data.product.product_name_de || data.product.product_name || data.product.generic_name_de || data.product.brands)) {
          return data.product;
        }
      } catch (e) {}
    }
    return null;
  };

  // Haupt-Scan-Verarbeitung inkl. 2-Stunden-Ausbuchungs-Check, Supabase-Katalog & Phasen-Wechsel
  const processMergedScanResult = async (mergedScan, skipCheckoutCheck = false) => {
    if (!mergedScan || mergedScan.allPureMarketingUrls) return;
    if (scanCheckoutOpenRef.current && !skipCheckoutCheck) return;

    const primaryCodeKey = mergedScan.lookupCodes[0] || mergedScan.primaryRaw.slice(0, 28);

    // 1. Prüfe direkt anhand des Barcodes oder gelernten Namens, ob das Produkt seit >= 2 Stunden im Bestand ist
    if (!skipCheckoutCheck) {
      const existingInStock = findExistingStockItemEligibleForCheckout(mergedScan);
      if (existingInStock) {
        const addedTs = getItemAddedTimestamp(existingInStock);
        const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
        playMobileBeep('shopping');
        triggerVibration([140, 60, 220]);
        setScanCheckoutModal({
          open: true,
          step: 'confirm_remove',
          stockItem: existingInStock,
          ageLabel: formatAgeDuration(ageMs),
          pendingMergedScan: mergedScan
        });
        return;
      }
    }

    // Sofort synchron in Phase 2 wechseln, damit der Barcode-Loop ab dieser Millisekunde pausiert
    const nextPhase = mergedScan.extractedExpiry ? 'mhd_locked' : 'hunting_mhd';
    scanPhaseRef.current = nextPhase;
    setScanPhase(nextPhase);

    setScannedBarcode(primaryCodeKey);
    setScanImageUrl(mergedScan.extractedImageUrl || '');
    if (mergedScan.formats) setLastDetectedFormat(mergedScan.formats);
    localOcrMissCountRef.current = 0;

    playMobileBeep('scan');
    triggerVibration([90, 45, 90]);

    if (mergedScan.extractedWeightQty) {
      setScanQty(mergedScan.extractedWeightQty);
    }

    if (mergedScan.extractedExpiry) {
      setScanExpiry(mergedScan.extractedExpiry);
      setDetectedMhdCandidate(mergedScan.extractedExpiry);
      setMhdSourceBadge('Code');
      setIsMhdLockedByOcr(true);
      triggerVibration([180, 70, 260]);
    } else {
      setIsMhdLockedByOcr(false);
      setDetectedMhdCandidate('');
      setMhdSourceBadge('');
      setLastOcrRawHint('');
    }

    if (mergedScan.extractedLocation) {
      setScanLocation(mergedScan.extractedLocation);
    }

    // 2. Sofort-Treffer aus dem lokalen Barcode-Gedächtnis
    const learnedHit = getLearnedProductFromMemory(primaryCodeKey) || getLearnedProductFromMemory(mergedScan.primaryRaw);
    if (learnedHit?.name) {
      const cat = detectSmartCategory(learnedHit.name, learnedHit.category);
      const loc = mergedScan.extractedLocation || learnedHit.location || detectSmartLocation(learnedHit.name, cat);
      setScanName(learnedHit.name);
      scanNameRef.current = learnedHit.name;
      if (!mergedScan.extractedWeightQty && learnedHit.quantity) setScanQty(learnedHit.quantity);
      if (learnedHit.imageUrl) setScanImageUrl(learnedHit.imageUrl);
      setScanCategory(cat);
      setScanLocation(loc);
      setScanGlutenFree(learnedHit.glutenFree || (isProductGlutenFree(learnedHit.name, cat) ? 'yes' : 'auto'));
      showToast(
        '✅ Barcode erkannt: ' + learnedHit.name,
        mergedScan.extractedExpiry ? 'MHD aus Code übernommen!' : '👉 Barcode gesperrt – jetzt ruhig das MHD scannen!',
        getFoodEmoji(learnedHit.name)
      );
      return;
    }

    if (mergedScan.extractedName && mergedScan.lookupCodes.length === 0) {
      const cleanQrName = simplifyProductName(mergedScan.extractedName, mergedScan.extractedBrand || '');
      const cat = detectSmartCategory(cleanQrName);
      const loc = mergedScan.extractedLocation || detectSmartLocation(cleanQrName, cat);
      setScanName(cleanQrName);
      scanNameRef.current = cleanQrName;
      setScanCategory(cat);
      setScanLocation(loc);
      setScanGlutenFree(isProductGlutenFree(cleanQrName, cat) ? 'yes' : 'auto');
      showToast('QR-Produkt erkannt! 🎯', cleanQrName + ' – suche jetzt nach MHD...', getFoodEmoji(cleanQrName));
      return;
    }

    // 3. Online-Abfrage: Erst zentrale Supabase-Produktdatenbank (/api/products), dann OpenFoodFacts
    isLookingUpRef.current = true;
    setIsLookingUpProduct(true);
    try {
      const candidatesToTry = mergedScan.lookupCodes.length > 0 ? mergedScan.lookupCodes : [mergedScan.primaryRaw];

      // 3a. Zentrale Supabase-Produktdatenbank abfragen
      for (const candidateCode of candidatesToTry.slice(0, 2)) {
        try {
          const catRes = await fetch('/api/products?barcode=' + encodeURIComponent(candidateCode), {
            cache: 'no-store'
          });
          if (catRes.ok) {
            const catJson = await catRes.json();
            if (catJson?.found && catJson.product?.name) {
              const dbProd = catJson.product;

              if (!skipCheckoutCheck) {
                const matchByDbName = findExistingStockItemEligibleForCheckout(mergedScan, dbProd.name);
                if (matchByDbName) {
                  const addedTs = getItemAddedTimestamp(matchByDbName);
                  const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
                  scanPhaseRef.current = 'barcode';
                  setScanPhase('barcode');
                  triggerVibration([140, 60, 220]);
                  setScanCheckoutModal({
                    open: true,
                    step: 'confirm_remove',
                    stockItem: matchByDbName,
                    ageLabel: formatAgeDuration(ageMs),
                    pendingMergedScan: mergedScan
                  });
                  return;
                }
              }

              const cat = detectSmartCategory(dbProd.name, dbProd.category);
              const loc = mergedScan.extractedLocation || dbProd.location || detectSmartLocation(dbProd.name, cat);
              setScanName(dbProd.name);
              scanNameRef.current = dbProd.name;
              if (!mergedScan.extractedWeightQty && dbProd.quantity) setScanQty(dbProd.quantity);
              setScanImageUrl(dbProd.imageUrl || '');
              setScanCategory(cat);
              setScanLocation(loc);
              setScanGlutenFree(dbProd.glutenFree || (isProductGlutenFree(dbProd.name, cat) ? 'yes' : 'auto'));

              saveLearnedProductToMemory(candidateCode, dbProd, false);

              setEstimatedMhdHint('⚡ Aus Cloud-Katalog geladen! Barcode pausiert – halte jetzt das MHD in den gelben Streifen.');
              showToast(
                '⚡ Cloud-Datenbank: ' + dbProd.name,
                mergedScan.extractedExpiry ? 'MHD aus Code übernommen!' : '👉 Barcode gesperrt – jetzt ruhig das MHD scannen!',
                getFoodEmoji(dbProd.name)
              );
              return;
            }
          }
        } catch (e) {}
      }

      // 3b. OpenFoodFacts / PetFood / Products abfragen (inkl. Produktbild)
      for (const candidateCode of candidatesToTry.slice(0, 3)) {
        const p = await fetchProductFromAllOpenDatabases(candidateCode);
        if (p) {
          const rawProdName = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || '';
          const rawBrand = p.brands ? p.brands.split(',')[0].trim() : (mergedScan.extractedBrand || '');
          const offCats = Array.isArray(p.categories_tags) ? p.categories_tags : [];
          const offAllergens = Array.isArray(p.allergens_tags) ? p.allergens_tags : [];
          const offLabels = Array.isArray(p.labels_tags) ? p.labels_tags : [];

          let nameWithTk = rawProdName;
          if (offCats.some(t => /frozen/.test(t)) && !/\btk\b|tiefkühl|tiefgekühlt/i.test(nameWithTk)) {
            nameWithTk = (nameWithTk + ' TK').trim();
          }

          const smartName = simplifyProductName(nameWithTk || rawBrand, rawBrand);
          const qty = mergedScan.extractedWeightQty || (p.quantity ? String(p.quantity).trim() : '1x');
          const img = extractOpenFoodFactsImage(p);

          if (!skipCheckoutCheck && smartName) {
            const matchByResolvedName = findExistingStockItemEligibleForCheckout(mergedScan, smartName);
            if (matchByResolvedName) {
              const addedTs = getItemAddedTimestamp(matchByResolvedName);
              const ageMs = addedTs ? (Date.now() - addedTs) : (3 * 60 * 60 * 1000);
              scanPhaseRef.current = 'barcode';
              setScanPhase('barcode');
              triggerVibration([140, 60, 220]);
              setScanCheckoutModal({
                open: true,
                step: 'confirm_remove',
                stockItem: matchByResolvedName,
                ageLabel: formatAgeDuration(ageMs),
                pendingMergedScan: mergedScan
              });
              return;
            }
          }

          setScanImageUrl(img || '');
          if (smartName) {
            const detectedCat = detectSmartCategory(smartName, 'auto', offCats);
            const detectedLoc = mergedScan.extractedLocation || detectSmartLocation(smartName, detectedCat, offCats);
            const isGf = isProductGlutenFree(smartName, detectedCat, 'auto', offAllergens, offLabels);

            setScanName(smartName);
            scanNameRef.current = smartName;
            setScanQty(qty);
            setScanCategory(detectedCat);
            setScanLocation(detectedLoc);
            setScanGlutenFree(isGf ? 'yes' : 'auto');

            saveLearnedProductToMemory(candidateCode, {
              name: smartName,
              quantity: qty,
              location: detectedLoc,
              category: detectedCat,
              glutenFree: isGf ? 'yes' : 'auto',
              imageUrl: img
            }, true);

            const freshMatch = estimateProduceByName(smartName);
            if (detectedLoc === 'freezer' && !mergedScan.extractedExpiry) {
              setEstimatedMhdHint('❄️ TK erkannt – Barcode pausiert, Kamera sucht jetzt nach dem MHD (oder tippe +6M).');
            } else if (freshMatch && !mergedScan.extractedExpiry) {
              setEstimatedMhdHint(freshMatch.emoji + ' Barcode pausiert – Kamera sucht jetzt das MHD (Empfehlung: +' + freshMatch.days + 'T).');
            } else {
              setEstimatedMhdHint('🎯 Produkt gesperrt! Halte jetzt das MHD in den gelben Streifen (oder tippe kurz aufs Bild).');
            }

            triggerVibration([100, 50, 100]);
            showToast(
              '✅ ' + smartName,
              img ? 'Produktbild geladen! Jetzt ruhig das MHD scannen.' : 'Barcode pausiert – jetzt ruhig das MHD scannen!',
              getFoodEmoji(smartName)
            );
            return;
          }
        }
      }

      if (mergedScan.extractedName) {
        const cleanQrName = simplifyProductName(mergedScan.extractedName, mergedScan.extractedBrand || '');
        const cat = detectSmartCategory(cleanQrName);
        const loc = detectSmartLocation(cleanQrName, cat);
        setScanName(cleanQrName);
        scanNameRef.current = cleanQrName;
        setScanCategory(cat);
        setScanLocation(loc);
        showToast('Aus QR-Code erkannt!', cleanQrName + ' – suche jetzt MHD...', getFoodEmoji(cleanQrName));
        return;
      }

      // Etiketten-Fallback nur auslösen, wenn noch kein Produktname gesetzt ist
      if (!scanNameRef.current.trim()) {
        const labelSuccess = await captureProductLabelFromLiveCamera(true);
        if (!labelSuccess) {
          showToast(
            (mergedScan.formats || 'Barcode') + ' gescannt!',
            'Name bitte kurz eingeben – Kamera sucht jetzt das MHD-Datum.',
            '🏷️'
          );
        }
      }
    } catch (e) {
      if (!scanNameRef.current.trim()) {
        await captureProductLabelFromLiveCamera(true);
      }
    } finally {
      isLookingUpRef.current = false;
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
      hardwareZoomSupportedRef.current = false;
      localOcrMissCountRef.current = 0;
      pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
      setCameraActive(true);
      const initialPhase = scanNameRef.current.trim() ? 'hunting_mhd' : 'barcode';
      scanPhaseRef.current = initialPhase;
      setScanPhase(initialPhase);
      requestScreenWakeLock();
      getFastMhdOcrWorker().catch(() => {});
      getZXingMultiFormatReader().catch(() => {});

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);

      let nativeDetector = null;
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          let formatsToUse = ALL_DESIRED_BARCODE_FORMATS;
          if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
            const supported = await window.BarcodeDetector.getSupportedFormats();
            if (Array.isArray(supported) && supported.length > 0) {
              formatsToUse = supported;
              setActiveFormatCount(supported.length);
            }
          }
          nativeDetector = new window.BarcodeDetector({ formats: formatsToUse });
        } catch (e) {
          try { nativeDetector = new window.BarcodeDetector(); } catch (err2) {}
        }
      }

      let frameTick = 0;
      scanLoopRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (scanCheckoutOpenRef.current) return;

        // HARTE PHASEN-SPERRE: Im MHD-Modus, in Frische-KI oder während der Abfrage keine Barcodes scannen!
        if (
          scannerModeRef.current !== 'barcode' ||
          scanPhaseRef.current !== 'barcode' ||
          isLookingUpRef.current
        ) {
          return;
        }

        frameTick++;

        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const merged = mergeMultipleBarcodesFromFrame(barcodes);
              if (merged && !merged.allPureMarketingUrls) {
                const signature = merged.lookupCodes.join('_') || merged.primaryRaw;
                const now = Date.now();
                if (signature && (signature !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 7000)) {
                  lastScannedCodeRef.current = signature;
                  lastScanTimeRef.current = now;
                  pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
                  processMergedScanResult(merged, false);
                  return;
                }
              }
            }
          } catch (err) {}
        }

        // ZXing-Fallback nur für echte Codes: erfordert gültigen Payload + 2 identische Treffer in Folge
        if (frameTick % 2 === 0 && zxingReaderRef.current) {
          try {
            const vid = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

            const luminanceSource = new window.ZXing.HTMLCanvasElementLuminanceSource(canvas);
            const binaryBitmap = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(luminanceSource));
            const zxingResult = zxingReaderRef.current.decodeBitmap(binaryBitmap);
            if (zxingResult && zxingResult.getText()) {
              const rawVal = String(zxingResult.getText()).trim();
              const merged = mergeMultipleBarcodesFromFrame([{ rawValue: rawVal, format: '2D/Multi' }]);
              const now = Date.now();

              if (merged && !merged.allPureMarketingUrls) {
                const hasValidPayload =
                  merged.lookupCodes.length > 0 ||
                  Boolean(merged.extractedName) ||
                  Boolean(merged.extractedExpiry);
                if (!hasValidPayload) return;

                const prev = pendingZxingCandidateRef.current;
                const hits = (prev.code === rawVal && now - prev.ts < 1800) ? prev.hits + 1 : 1;
                pendingZxingCandidateRef.current = { code: rawVal, hits, ts: now };
                if (hits < 2) return;

                if (rawVal !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 7000) {
                  lastScannedCodeRef.current = rawVal;
                  lastScanTimeRef.current = now;
                  pendingZxingCandidateRef.current = { code: '', hits: 0, ts: 0 };
                  processMergedScanResult(merged, false);
                }
              }
            }
          } catch (zErr) {}
        }
      }, 360);
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
      triggerVibration([100, 50, 140]);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt & Namen vereinfacht.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };
