// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Utensils, ShoppingCart, Globe, Clock,
  Wand2, ExternalLink, ChefHat, Plus, Filter, Sparkles, Check
} from 'lucide-react';
import { getFoodEmoji, isProductGlutenFree, getDaysUntil } from './PantrySection';

// Bereinigt Produktnamen von Supermarkt-Marken & Mengenangaben für präzises Rezept-Matching
function cleanProductCoreName(rawName) {
  return String(rawName || '')
    .toLowerCase()
    .replace(/\/.*$/, ' ')
    .replace(/\b(\d+\s*(g|kg|ml|l|stk|pcs|x|pkg)|k-classic|kaufland|ja!|rewe|edeka|schär|seitz|pfanni|gefro|meggle|landfein|haltbare|schwarzwaldmilch|oro di parma|hengstenberg|delikatess|bio|classic|glutenfrei|frei von|tk)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// ERWEITERTE SCHNELL-REZEPT-DATENBANK (10 BIS 25 MINUTEN • FAMILIEN & GLUTENFREI)
// ============================================================================
const FAMILY_RECIPES_DB = [
  {
    id: 'fam_rigatoni_creme',
    title: '🍝 Schnelle Rigatoni / Pasta in cremiger Käse-Sahne-Soße',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'Express-Pasta (15 Min.)',
    shortDesc: 'Rigatoni oder Lieblingsnudeln in einer schnellen 5-Minuten-Soße aus Sahne, Frischkäse und Käse.',
    keywords: ['rigatoni', 'nudel', 'spaghetti', 'pasta', 'penne', 'frischkäse', 'philadelphia', 'schlagsahne', 'sahne', 'käse', 'parmesan', 'vollmilch', 'milch'],
    ingredients: ['Rigatoni / Glutenfreie Nudeln', 'Schlagsahne oder Vollmilch', 'Frischkäse / Reibekäse', 'Tomatenmark oder Kräuter']
  },
  {
    id: 'fam_wraps',
    title: '🌮 Knusprige Schär-Wraps aus der Pfanne',
    prepMinutes: 12,
    kidFavorite: true,
    glutenFree: true,
    category: 'Express & Glutenfrei',
    shortDesc: 'Gefüllte Wraps warm in der Pfanne angeröstet mit Frischkäse, Käse, Salat oder Gurke.',
    keywords: ['wraps', 'wrap', 'schär', 'tortilla', 'frischkäse', 'philadelphia', 'scheibenkäse', 'käse', 'gurke', 'salat', 'eisbergsalat', 'mâche', 'burger sauce'],
    ingredients: ['Wraps (z.B. Schär)', 'Frischkäse oder Scheibenkäse', 'Salat / Gurke / Tomate', 'Sauce oder Kräuterbutter']
  },
  {
    id: 'fam_reis_pfanne',
    title: '🍚 Schnelle Gemüse- & Pilz-Reispfanne',
    prepMinutes: 18,
    kidFavorite: true,
    glutenFree: true,
    category: 'One-Pot & Glutenfrei',
    shortDesc: 'Langkorn-Reis aus einer Pfanne mit Pilzen, Gemüse und einem cremigen Schuss Sahne oder Frischkäse.',
    keywords: ['reis', 'rize', 'langkorn', 'basmati', 'spitzenreis', 'pilz', 'pfifferling', 'champignon', 'paprika', 'mais', 'erbsen', 'schlagsahne', 'frischkäse'],
    ingredients: ['Langkorn-Reis / Basmatireis', 'Pilze (z.B. Pfifferlinge) oder Gemüse', 'Schlagsahne / Frischkäse', 'Zwiebel & Brühe/Gewürze']
  },
  {
    id: 'fam_filet_rahm',
    title: '🥩 Zartes Filet / Geschnetzeltes in Pfifferling-Rahm mit Püree',
    prepMinutes: 20,
    kidFavorite: true,
    glutenFree: true,
    category: 'Familien-Highlight',
    shortDesc: 'Kurzgebratenes Schweine- oder Hähnchenfilet mit Pilzen in Rahmsoße zu schnellem Kartoffelpüree.',
    keywords: ['schweinefilet', 'filet', 'hähnchen', 'pute', 'schnitzel', 'fleisch', 'pfifferling', 'pilz', 'champignon', 'kartoffelpüree', 'pfanni', 'reis', 'schlagsahne', 'sahne'],
    ingredients: ['Schweinefilet / Hähnchenfilet', 'Pfifferlinge / Pilze', 'Kartoffelpüree oder Reis', 'Schlagsahne / Cremefine']
  },
  {
    id: 'fam_baguette_ofen',
    title: '🥖 Überbackenes Ofen-Baguette / Knusperbrot „Pizzastyle“',
    prepMinutes: 12,
    kidFavorite: true,
    glutenFree: true,
    category: 'Blitz-Abendessen (12 Min.)',
    shortDesc: 'Halbiertes Baguette oder Landbrot bestrichen mit Tomatenmark/Frischkäse und mit Käse goldbraun überbacken.',
    keywords: ['baguette', 'landbrot', 'brot', 'brötchen', 'knusperbrot', 'tomatenmark', 'passierte', 'käse', 'mozzarella', 'gouda', 'frischkäse', 'salami', 'schinken', 'kräuterbutter'],
    ingredients: ['Baguette / Landbrot', 'Tomatenmark oder Kräuterbutter', 'Käse / Mozzarella zum Überbacken', 'Schinken / Salami / Paprika (optional)']
  },
  {
    id: 'fam_pfannkuchen_gf',
    title: '🥞 Schnelle Goldgelbe Familien-Pfannkuchen / Kaiserschmarrn',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'Süß & Schnell',
    shortDesc: 'Fluffige Pfannkuchen aus der Eisenpfanne mit Mehl, Milch und Eiern – perfekt mit Apfelmus oder Obst.',
    keywords: ['mehl', 'schär', 'vollmilch', 'milch', 'ei', 'eier', 'apfelmus', 'apfel', 'butter', 'zucker', 'beeren'],
    ingredients: ['Mehl (z.B. Schär glutenfrei)', 'Vollmilch', 'Frische Eier', 'Apfelmus / Obst / Zimt & Zucker']
  },
  {
    id: 'fam_chili_reis',
    title: '🍲 Schnelles Chili sin Carne mit Reis oder Kartoffelpüree',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'One-Pot & Glutenfrei',
    shortDesc: 'Wärmendes Chili verfeinert mit Tomatenmark, Mais und Reis oder Kartoffelpüree als Beilage.',
    keywords: ['chili', 'gefro', 'tomatenmark', 'oro di parma', 'reis', 'rize', 'kartoffelpüree', 'schlagsahne', 'frischkäse', 'mais', 'bohne'],
    ingredients: ['Chili sin carne / Bohnen & Mais', 'Tomatenmark', 'Reis oder Kartoffelpüree', 'Klecks Schmand / Frischkäse']
  },
  {
    id: 'fam_bratwurst_rotkohl',
    title: '🌭 Bratwurst mit schnellem Kartoffelpüree & Rotkohl',
    prepMinutes: 18,
    kidFavorite: true,
    glutenFree: true,
    category: 'Familien-Klassiker',
    shortDesc: 'Deftiger Familien-Liebling aus der Pfanne mit cremigem Kartoffelpüree und Gemüsebeilage.',
    keywords: ['rostbratwurst', 'bratwurst', 'wurst', 'würstchen', 'kartoffelpüree', 'pfanni', 'kartoffel', 'rotkohl', 'sauerkraut', 'kräuterbutter', 'butter', 'senf'],
    ingredients: ['Bratwurst / Würstchen', 'Kartoffelpüree', 'Apfel-Rotkohl oder Salat', 'Kräuterbutter / Senf']
  },
  {
    id: 'fam_kartoffel_gratin',
    title: '🥔 Schneller Kartoffelpüree-Auflauf aus dem Ofen',
    prepMinutes: 20,
    kidFavorite: true,
    glutenFree: true,
    category: 'Ofen & Familie',
    shortDesc: 'Kartoffelpüree mit Sahne, Frischkäse und Gemüse oder Schinkenwürfeln im Ofen überbacken.',
    keywords: ['kartoffelpüree', 'pfanni', 'kartoffel', 'schlagsahne', 'sahne', 'vollmilch', 'frischkäse', 'philadelphia', 'parmesan', 'käse', 'butter'],
    ingredients: ['Kartoffelpüree / Kartoffeln', 'Schlagsahne & Milch', 'Frischkäse', 'Reibekäse / Parmesan']
  }
];

// ============================================================================
// PUNKT 4: DYNAMISCHER ECHTZEIT-REZEPTGENERATOR AUS DEM AKTUELLEN BESTAND
// Erstellt automatisch neue 15-Minuten-Rezepte, sobald neue Produkte im Vorrat landen!
// ============================================================================
function generateDynamicRecipesFromStock(safeStock, todayStr) {
  if (!Array.isArray(safeStock) || safeStock.length === 0) return [];

  const findInStock = (regex) => safeStock.find(it => regex.test(String(it.name || '').toLowerCase()));
  const findAllInStock = (regex) => safeStock.filter(it => regex.test(String(it.name || '').toLowerCase()));

  const pastaItem = findInStock(/nudel|rigatoni|spaghetti|pasta|penne|fusilli|spätzle|gnocchi/);
  const riceItem = findInStock(/reis|rize|basmati|langkorn|jasmin|risotto/);
  const potatoItem = findInStock(/kartoffelpüree|pfanni|kartoffel|pommes|kroketten/);
  const breadItem = findInStock(/baguette|landbrot|brot|toast|brötchen|knusperbrot/);
  const wrapItem = findInStock(/wrap|tortilla|taco/);
  const flourItem = findInStock(/mehl|backmischung/);

  const meatFishList = findAllInStock(/filet|schwein|rind|hackfleisch|hähnchen|pute|schnitzel|steak|wurst|bratwurst|schinken|salami|speck|lachs|fisch|thunfisch|ei\b|eier/);
  const veggieMushroomList = findAllInStock(/pilz|pfifferling|champignon|salat|gurke|tomate|paprika|karotte|möhre|brokkoli|blumenkohl|spinat|spargel|rotkohl|mais|erbse|bohne|avocado|zwiebel/);
  const dairySauceList = findAllInStock(/käse|frischkäse|philadelphia|mozzarella|gouda|parmesan|sahne|schlagsahne|schmand|milch|vollmilch|butter|kräuterbutter|pesto|tomatenmark|passierte|sauce|soße|ketchup/);

  const dynamicRecipes = [];

  // 1. SPOTLIGHT-REZEPT FÜR DAS ZULETZT HINZUGEFÜGTE PRODUKT (hält die Liste bei jedem Scan sofort aktuell!)
  const newestItem = safeStock[0];
  if (newestItem && newestItem.name) {
    const nLower = newestItem.name.toLowerCase();
    const isSweetOrDrink = /wasser|cola|limo|bier|wein|kaffee|tee|futter|tierfutter|kauknochen/.test(nLower);

    if (!isSweetOrDrink) {
      const partnerBase =
        pastaItem && pastaItem.id !== newestItem.id ? pastaItem.name :
        riceItem && riceItem.id !== newestItem.id ? riceItem.name :
        potatoItem && potatoItem.id !== newestItem.id ? potatoItem.name :
        breadItem && breadItem.id !== newestItem.id ? breadItem.name :
        'Nudeln / Reis / Kartoffeln';

      const partnerSauce =
        dairySauceList.find(d => d.id !== newestItem.id)?.name || 'Sahne / Frischkäse / Butter';

      const partnerExtra =
        veggieMushroomList.find(v => v.id !== newestItem.id)?.name ||
        meatFishList.find(m => m.id !== newestItem.id)?.name ||
        'Frische Kräuter / Gemüse nach Wahl';

      dynamicRecipes.push({
        id: 'dyn_newest_' + newestItem.id,
        title: '✨ Neu-im-Vorrat Express-Gericht mit ' + newestItem.name,
        prepMinutes: 15,
        kidFavorite: true,
        glutenFree: isProductGlutenFree(newestItem),
        isDynamic: true,
        isNewestSpotlight: true,
        category: '🆕 Direkt aus deinem neuesten Scan',
        shortDesc: 'Automatisch für dein zuletzt eingebuchtes Produkt „' + newestItem.name + '“ zusammengestellt.',
        keywords: [cleanProductCoreName(newestItem.name)],
        ingredients: [
          newestItem.name,
          partnerBase,
          partnerSauce,
          partnerExtra
        ]
      });
    }
  }

  // 2. DYNAMISCHE PASTA-KOMBINATION AUS DEM AKTUELLEN VORRAT
  if (pastaItem) {
    const sauce1 = dairySauceList[0]?.name || 'Schlagsahne / Passierte Tomaten';
    const extra1 = veggieMushroomList[0]?.name || meatFishList[0]?.name || 'Parmesan / Frisches Gemüse';
    dynamicRecipes.push({
      id: 'dyn_pasta_' + pastaItem.id,
      title: '🍝 15-Minuten Pfannen-Pasta mit ' + pastaItem.name,
      prepMinutes: 15,
      kidFavorite: true,
      glutenFree: isProductGlutenFree(pastaItem),
      isDynamic: true,
      category: '⚡ Aus deinem Vorrat kombiniert',
      shortDesc: 'Schnelles Hauptgericht rund um deinen Vorrat „' + pastaItem.name + '“.',
      keywords: [cleanProductCoreName(pastaItem.name)],
      ingredients: [
        pastaItem.name,
        sauce1,
        extra1,
        dairySauceList[1]?.name || 'Reibekäse / Gewürze'
      ]
    });
  }

  // 3. DYNAMISCHE REIS-BOWL / REISPFANNE AUS DEM AKTUELLEN VORRAT
  if (riceItem) {
    const mainAdd = meatFishList[0]?.name || veggieMushroomList[0]?.name || 'Hähnchen / Gemüse / Pilze';
    const sauceAdd = dairySauceList[0]?.name || 'Frischkäse / Sahne / Sojasauce';
    dynamicRecipes.push({
      id: 'dyn_rice_' + riceItem.id,
      title: '🍚 Schnelle Familien-Reispfanne mit ' + riceItem.name,
      prepMinutes: 18,
      kidFavorite: true,
      glutenFree: true,
      isDynamic: true,
      category: '⚡ Aus deinem Vorrat kombiniert',
      shortDesc: 'In einer Pfanne zubereitet mit „' + riceItem.name + '“ und passenden Vorrats-Zutaten.',
      keywords: [cleanProductCoreName(riceItem.name)],
      ingredients: [
        riceItem.name,
        mainAdd,
        sauceAdd,
        veggieMushroomList[1]?.name || 'Frühlingszwiebeln / Paprika'
      ]
    });
  }

  // 4. DYNAMISCHES BAGUETTE / ÜBERBACKENES BROT-GERICHT
  if (breadItem) {
    const spread = dairySauceList[0]?.name || 'Kräuterbutter / Frischkäse';
    const topping = veggieMushroomList[0]?.name || meatFishList[0]?.name || 'Tomaten & Mozzarella';
    dynamicRecipes.push({
      id: 'dyn_bread_' + breadItem.id,
      title: '🥖 Knuspriges Ofen-' + breadItem.name + ' (10 Min.)',
      prepMinutes: 10,
      kidFavorite: true,
      glutenFree: isProductGlutenFree(breadItem),
      isDynamic: true,
      category: '⚡ Blitz-Küche aus deinem Vorrat',
      shortDesc: 'Im Ofen oder in der Pfanne knusprig geröstet mit Zutaten aus deinem Bestand.',
      keywords: [cleanProductCoreName(breadItem.name)],
      ingredients: [
        breadItem.name,
        spread,
        topping,
        'Reibekäse zum Überbacken'
      ]
    });
  }

  // 5. DYNAMISCHES MEHL-PFANNENGERICHT (WENN MEHL IM VORRAT IST)
  if (flourItem && !wrapItem) {
    dynamicRecipes.push({
      id: 'dyn_flour_' + flourItem.id,
      title: '🥞 Schnelle Pfannkuchen / Flammkuchen aus ' + flourItem.name,
      prepMinutes: 15,
      kidFavorite: true,
      glutenFree: isProductGlutenFree(flourItem),
      isDynamic: true,
      category: '⚡ Aus deinem Vorrat kombiniert',
      shortDesc: 'Mit deinem vorrätigen „' + flourItem.name + '“ süß oder herzhaft in 15 Minuten fertig.',
      keywords: [cleanProductCoreName(flourItem.name)],
      ingredients: [
        flourItem.name,
        findInStock(/milch|vollmilch/)?.name || 'Vollmilch',
        findInStock(/\bei\b|eier/)?.name || 'Frische Eier',
        findInStock(/apfel|beere|käse|schinken/)?.name || 'Apfelmus oder Käse & Schinken'
      ]
    });
  }

  return dynamicRecipes;
}

const DE_TO_EN_INGREDIENT_MAP = [
  { de: ['tomatenmark', 'tomate', 'passierte'], en: 'tomato', label: 'Tomaten' },
  { de: ['käse', 'frischkäse', 'scheibenkäse', 'parmesan', 'gouda', 'mozzarella'], en: 'cheese', label: 'Käse' },
  { de: ['schlagsahne', 'sahne'], en: 'cream', label: 'Sahne' },
  { de: ['milch', 'vollmilch'], en: 'milk', label: 'Milch' },
  { de: ['kartoffel', 'kartoffeln', 'kartoffelpüree'], en: 'potatoes', label: 'Kartoffeln' },
  { de: ['apfel', 'äpfel', 'elstar', 'apfelmus'], en: 'apple', label: 'Äpfel' },
  { de: ['gurke'], en: 'cucumber', label: 'Gurke' },
  { de: ['salat', 'mâche', 'feldsalat', 'eisberg'], en: 'lettuce', label: 'Salat' },
  { de: ['hähnchen', 'huhn', 'pute', 'geflügel'], en: 'chicken', label: 'Hähnchen' },
  { de: ['hackfleisch', 'rinderhack', 'rind'], en: 'beef', label: 'Rind / Hackfleisch' },
  { de: ['schwein', 'schweinefilet', 'schinken', 'speck', 'bratwurst', 'wurst'], en: 'pork', label: 'Schwein / Filet' },
  { de: ['lachs', 'fisch'], en: 'salmon', label: 'Lachs / Fisch' },
  { de: ['reis', 'rize', 'spitzenreis', 'langkorn', 'basmatireis'], en: 'rice', label: 'Reis' },
  { de: ['nudel', 'rigatoni', 'spaghetti', 'pasta'], en: 'pasta', label: 'Pasta / Nudeln' },
  { de: ['pilz', 'pfifferling', 'champignon'], en: 'mushrooms', label: 'Pilze' },
  { de: ['ei', 'eier'], en: 'egg', label: 'Eier' }
];

const EN_TO_DE_DISH_WORDS = {
  'Chicken': 'Hähnchen', 'Beef': 'Rindfleisch', 'Pork': 'Schweinefilet / Schwein',
  'Pasta': 'Nudel-Pfanne', 'Spaghetti': 'Spaghetti', 'Salmon': 'Lachs',
  'Potato': 'Kartoffel', 'Potatoes': 'Kartoffeln', 'Cheese': 'Käse',
  'Creamy': 'Cremige', 'Baked': 'Ofen-', 'Salad': 'Salat', 'Rice': 'Reis-Pfanne',
  'With': 'mit', 'And': '&', 'Egg': 'Ei', 'Eggs': 'Eier', 'Soup': 'Suppe',
  'Tomato': 'Tomaten', 'Apple': 'Apfel', 'Mushroom': 'Pilz', 'Mushrooms': 'Pilzen'
};

function translateWebMealTitle(enTitle) {
  let out = String(enTitle || '');
  Object.keys(EN_TO_DE_DISH_WORDS).forEach(enWord => {
    const reg = new RegExp('\\b' + enWord + '\\b', 'gi');
    out = out.replace(reg, EN_TO_DE_DISH_WORDS[enWord]);
  });
  return out;
}

const WEEKDAY_SHORT_BTNS = [
  { id: 1, short: 'Mo', full: 'Montag' },
  { id: 2, short: 'Di', full: 'Dienstag' },
  { id: 3, short: 'Mi', full: 'Mittwoch' },
  { id: 4, short: 'Do', full: 'Donnerstag' },
  { id: 5, short: 'Fr', full: 'Freitag' },
  { id: 6, short: 'Sa', full: 'Samstag' },
  { id: 7, short: 'So', full: 'Sonntag' }
];

export default function PantryRecipes({
  safeStock,
  safeMeals,
  setMealPlan,
  addShoppingItem,
  todayStr,
  themeStyles,
  showToast
}) {
  // 'all' | 'ready' | 'buy_few' | 'glutenfree' | 'express' | 'web'
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [targetMealDayId, setTargetMealDayId] = useState(1);
  const [includeSideAndDessert, setIncludeSideAndDessert] = useState(true);
  const [alsoSendMissingToShopping, setAlsoSendMissingToShopping] = useState(true);
  const [webRecipes, setWebRecipes] = useState([]);
  const [isLoadingWebRecipes, setIsLoadingWebRecipes] = useState(false);

  // Signatur des aktuellen Vorrats: Sobald neue Produkte hinzukommen, aktualisiert sich die Rezeptliste sofort
  const stockSignature = useMemo(() => {
    return (Array.isArray(safeStock) ? safeStock : []).map(it => it.id + ':' + it.name).join('|');
  }, [safeStock]);

  // Vorrats-Zutaten für die interaktive Schnell-Auswahl (neueste & bald ablaufende zuerst)
  const selectableStockPills = useMemo(() => {
    return [...safeStock]
      .sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')))
      .slice(0, 20);
  }, [safeStock]);

  const toggleSelectStockPill = (itemId) => {
    setSelectedStockIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const activeFocusItems = useMemo(() => {
    if (selectedStockIds.length === 0) return [];
    return safeStock.filter(it => selectedStockIds.includes(it.id));
  }, [safeStock, selectedStockIds]);

  const fetchWebRecipesFromStock = async (silent = false) => {
    if (safeStock.length === 0) return;
    setIsLoadingWebRecipes(true);
    if (!silent) setRecipeFilter('web');

    try {
      const sourceItems = activeFocusItems.length > 0
        ? activeFocusItems
        : [...safeStock];

      const matchedQueries = [];
      sourceItems.forEach(item => {
        const lower = String(item.name || '').toLowerCase();
        DE_TO_EN_INGREDIENT_MAP.forEach(entry => {
          if (entry.de.some(w => lower.includes(w)) && !matchedQueries.some(q => q.en === entry.en)) {
            matchedQueries.push({ en: entry.en, deLabel: item.name });
          }
        });
      });

      if (matchedQueries.length === 0) {
        matchedQueries.push({ en: 'pasta', deLabel: 'Pasta & Vorrat' }, { en: 'rice', deLabel: 'Reis & Vorrat' });
      }

      const fetchedCards = [];
      const seenMealIds = new Set();

      for (const q of matchedQueries.slice(0, 3)) {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?i=' + encodeURIComponent(q.en));
        const data = await res.json();
        const meals = Array.isArray(data?.meals) ? data.meals.slice(0, 2) : [];

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

          const hasGlutenIng = rawIngs.some(ing =>
            /flour|wheat|bread|soy sauce|couscous|barley/i.test(ing)
          );

          fetchedCards.push({
            id: 'web_' + fullMeal.idMeal,
            title: '🌐 ' + translateWebMealTitle(fullMeal.strMeal),
            prepMinutes: 20,
            kidFavorite: true,
            glutenFree: !hasGlutenIng,
            isWebRecipe: true,
            thumbUrl: fullMeal.strMealThumb || '',
            sourceUrl: fullMeal.strSource || fullMeal.strYoutube || '',
            category: 'Web-Rezept zu ' + q.deLabel,
            shortDesc: 'Passend zu deinem Vorrat: „' + q.deLabel + '“.',
            keywords: [cleanProductCoreName(q.deLabel), q.en],
            ingredients: rawIngs.length > 0 ? rawIngs : [q.deLabel, 'Beilage nach Wahl']
          });
        }
      }

      setWebRecipes(fetchedCards);
      if (!silent) {
        showToast('Web-Rezepte aktualisiert!', fetchedCards.length + ' passende Rezepte zum Bestand geladen.', '🌐');
      }
    } catch (err) {
      if (!silent) showToast('Hinweis', 'Nutze unsere integrierten Vorrats-Schnellrezepte.', 'ℹ️');
    } finally {
      setIsLoadingWebRecipes(false);
    }
  };

  // Lädt beim Ändern des Lebensmittelbestands automatisch passende Web-Ergänzungen im Hintergrund nach
  useEffect(() => {
    if (safeStock.length > 0) {
      fetchWebRecipesFromStock(true);
    }
  }, [stockSignature]);

  // =========================================================
  // KOMBINIERTE AUSWERTUNG: DYNAMISCHE VORRATS-REZEPTE + KLASSIKER + WEB
  // =========================================================
  const evaluatedRecipes = useMemo(() => {
    const dynamicStockRecipes = generateDynamicRecipesFromStock(safeStock, todayStr);
    const combinedSource = [...dynamicStockRecipes, ...FAMILY_RECIPES_DB, ...webRecipes];

    return combinedSource
      .map(rec => {
        const matchedStock = [];
        let urgentCount = 0;
        let matchesSelectedFocus = 0;

        (rec.keywords || []).forEach(kw => {
          const cleanKw = String(kw || '').toLowerCase().trim();
          if (!cleanKw) return;
          const found = safeStock.find(st => {
            const rawLower = String(st.name || '').toLowerCase();
            const coreLower = cleanProductCoreName(st.name);
            return rawLower.includes(cleanKw) || coreLower.includes(cleanKw);
          });
          if (found && !matchedStock.some(m => m.id === found.id)) {
            matchedStock.push(found);
            if (getDaysUntil(found.expiryDate, todayStr) <= 7) {
              urgentCount++;
            }
            if (selectedStockIds.includes(found.id)) {
              matchesSelectedFocus++;
            }
          }
        });

        const ingredientStatus = (rec.ingredients || []).map(ingLabel => {
          // Direkter Treffer, falls die Zutat exakt einem Vorrats-Produktnamen entspricht
          const exactMatch = safeStock.find(
            st => String(st.name || '').toLowerCase() === String(ingLabel || '').toLowerCase()
          );

          const words = String(ingLabel)
            .toLowerCase()
            .split(/[\s/(),&-]+/)
            .filter(w => w.length >= 3 && !/mit|oder|und|aus|zum|für|klecks|prise|optional|wahl/.test(w));

          const inPantry = exactMatch || safeStock.find(st => {
            const stLower = String(st.name || '').toLowerCase();
            const stCore = cleanProductCoreName(st.name);
            const coreWords = stCore.split(' ').filter(w => w.length >= 3);
            return (
              words.some(w => stLower.includes(w)) ||
              coreWords.some(cw => String(ingLabel).toLowerCase().includes(cw))
            );
          });

          if (inPantry && selectedStockIds.includes(inPantry.id)) {
            matchesSelectedFocus++;
          }

          return {
            name: ingLabel,
            inPantry: Boolean(inPantry),
            pantryItem: inPantry || null
          };
        });

        const haveCount = ingredientStatus.filter(i => i.inPantry).length;
        const missingCount = ingredientStatus.length - haveCount;
        const totalCount = Math.max(1, ingredientStatus.length);
        const matchPercent = Math.round((haveCount / totalCount) * 100);

        return {
          ...rec,
          matchedStock,
          urgentCount,
          matchesSelectedFocus,
          ingredientStatus,
          haveCount,
          missingCount,
          matchPercent
        };
      })
      .filter(rec => {
        if (selectedStockIds.length > 0 && rec.matchesSelectedFocus === 0) return false;
        if (recipeFilter === 'ready') return rec.missingCount === 0 || rec.matchPercent >= 75;
        if (recipeFilter === 'buy_few') return rec.haveCount >= 1 && rec.missingCount >= 1 && rec.missingCount <= 3;
        if (recipeFilter === 'glutenfree') return Boolean(rec.glutenFree);
        if (recipeFilter === 'express') return rec.prepMinutes <= 18;
        if (recipeFilter === 'web') return Boolean(rec.isWebRecipe);
        return true;
      })
      .sort((a, b) => {
        if (a.isNewestSpotlight !== b.isNewestSpotlight) return a.isNewestSpotlight ? -1 : 1;
        if (selectedStockIds.length > 0 && b.matchesSelectedFocus !== a.matchesSelectedFocus) {
          return b.matchesSelectedFocus - a.matchesSelectedFocus;
        }
        return (b.matchPercent * 2 + b.urgentCount * 20) - (a.matchPercent * 2 + a.urgentCount * 20);
      });
  }, [safeStock, todayStr, webRecipes, recipeFilter, selectedStockIds]);

  const convertRecipeToDailyMenu = (rec, dayIdOverride = null) => {
    const targetId = dayIdOverride !== null ? dayIdOverride : targetMealDayId;
    const targetMeal = safeMeals.find(m => Number(m.id) === Number(targetId)) || safeMeals[0];
    if (!targetMeal) return;

    const fruitOrDessertInStock = safeStock.find(st =>
      /apfel|äpfel|clementine|mandarine|banane|obst|beeren|joghurt|quark|pudding|eis|apfelmus|choco balls/i.test(st.name)
    );
    const saladOrVeggieInStock = safeStock.find(st =>
      /salat|eisberg|mâche|feldsalat|gurke|tomate|karotte|möhre|paprika|rotkohl|spargel/i.test(st.name)
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

    showToast('Wochenplan erstellt!', 'Alle 7 Tage wurden passend zu eurem aktuellen Vorrat gefüllt!', '🪄');
  };

  const searchQueryWords = useMemo(() => {
    const source = activeFocusItems.length > 0 ? activeFocusItems : safeStock.slice(0, 3);
    const words = source
      .map(it => cleanProductCoreName(it.name).split(' ')[0])
      .filter(w => w && w.length >= 3)
      .slice(0, 3)
      .join(' ');
    return words || 'schnelle familienrezepte';
  }, [activeFocusItems, safeStock]);

  const chefkochSearchUrl = 'https://www.chefkoch.de/rs/s0/' + encodeURIComponent(searchQueryWords + (recipeFilter === 'glutenfree' ? ' glutenfrei' : '')) + '/Rezepte.html';

  return (
    <div className="tw-pantry-no-scale space-y-3.5">
      {/* KOPF- & FILTER-COCKPIT */}
      <div className={'p-4 rounded-3xl border space-y-3 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              <span>Dynamischer Vorrats-Rezeptfinder ({evaluatedRecipes.length} Vorschläge)</span>
            </h3>
            <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
              Aktualisiert sich sofort bei jedem neuen Produkt im Bestand • Zeigt Gerichte aus 100% Vorrat oder mit 1–2 Zukauf-Zutaten.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchWebRecipesFromStock(false)}
              disabled={isLoadingWebRecipes}
              className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className={'w-4 h-4 text-sky-300 ' + (isLoadingWebRecipes ? 'animate-spin' : '')} />
              <span>{isLoadingWebRecipes ? 'Lade Web-Rezepte...' : '🌐 Mehr Web-Rezepte laden'}</span>
            </button>

            <a
              href={chefkochSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>🔍 Chefkoch ({searchQueryWords})</span>
            </a>

            <button
              type="button"
              onClick={autoPlanEntireWeekFromStock}
              className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>🪄 Ganze Woche planen</span>
            </button>
          </div>
        </div>

        {/* INTERAKTIVE VORRATS-ZUTATEN-AUSWAHL */}
        <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase text-sky-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>🎯 Vorräte im Bestand (Antippen, um gezielt Rezepte für bestimmte Produkte zu filtern):</span>
            </span>
            {selectedStockIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStockIds([])}
                className="text-[11px] font-black text-rose-400 hover:underline cursor-pointer"
              >
                ✕ Auswahl zurücksetzen ({selectedStockIds.length} gewählt)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectableStockPills.map(stItem => {
              const isSelected = selectedStockIds.includes(stItem.id);
              const daysLeft = getDaysUntil(stItem.expiryDate, todayStr);
              const isGf = isProductGlutenFree(stItem);
              return (
                <button
                  key={stItem.id}
                  type="button"
                  onClick={() => toggleSelectStockPill(stItem.id)}
                  className={'px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'tw-active-nav ring-2 ring-sky-300'
                      : daysLeft <= 5
                      ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                      : 'tw-nav-inactive')}
                >
                  <span>{getFoodEmoji(stItem.name, stItem.customEmoji)}</span>
                  <span className="truncate max-w-[160px]">{stItem.name}</span>
                  {isGf && <span className="text-[9px] text-emerald-300 font-black">🌾✓</span>}
                  {daysLeft <= 7 && (
                    <span className="px-1 py-0.2 rounded bg-black/40 text-[9px] font-black text-amber-300">
                      {daysLeft}T
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FILTER-KATEGORIEN & MENÜ-OPTIONEN */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all',        label: '⭐ Alle Empfehlungen' },
              { id: 'ready',      label: '🟢 Sofort kochbar (Fast alles da)' },
              { id: 'buy_few',    label: '🛒 Mit 1–2 Zukauf-Zutaten' },
              { id: 'express',    label: '⚡ Express (10–18 Min.)' },
              { id: 'glutenfree', label: '🌾✓ 100% Glutenfrei' },
              { id: 'web',        label: '🌐 Web-Rezepte (' + webRecipes.length + ')' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  if (f.id === 'web' && webRecipes.length === 0) {
                    fetchWebRecipesFromStock(false);
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

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSideAndDessert}
                onChange={(e) => setIncludeSideAndDessert(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span>🥗+🍊 Beilage/Nachtisch ergänzen</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoSendMissingToShopping}
                onChange={(e) => setAlsoSendMissingToShopping(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span>🛒 Fehlendes beim Einplanen auf Einkaufsliste</span>
            </label>
          </div>
        </div>
      </div>

      {/* REZEPT-KACHELN */}
      {evaluatedRecipes.length === 0 ? (
        <div className={'p-8 rounded-3xl border text-center space-y-2 ' + themeStyles.card}>
          <div className="text-2xl">🍳</div>
          <div className="font-extrabold text-sm">Keine Rezepte für diesen speziellen Filter gefunden</div>
          <button
            type="button"
            onClick={() => { setSelectedStockIds([]); setRecipeFilter('all'); }}
            className="tw-glow-btn px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            Alle Vorrats-Rezepte anzeigen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluatedRecipes.map(rec => {
            const missingIngredients = rec.ingredientStatus.filter(i => !i.inPantry);

            return (
              <div
                key={rec.id}
                className={'p-4 rounded-3xl border flex flex-col justify-between gap-3.5 shadow-sm ' +
                  themeStyles.card + ' ' +
                  (rec.isNewestSpotlight
                    ? 'border-2 border-sky-400 bg-sky-950/15'
                    : rec.matchPercent >= 75
                    ? 'border-2 border-emerald-500/60'
                    : rec.urgentCount > 0
                    ? 'border-2 border-amber-500/70'
                    : '')}
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
                        {rec.isNewestSpotlight && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500 text-white text-[10px] font-black">
                            🆕 PASSEND ZUM NEUESTEN PRODUKT
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-black flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.prepMinutes} Min.
                        </span>
                        {rec.glutenFree && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                            🌾✓ Glutenfrei
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-base sm:text-lg leading-snug">{rec.title}</h4>
                    </div>

                    <span className={'px-2.5 py-1 rounded-full text-xs font-black shrink-0 ' +
                      (rec.matchPercent >= 75
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                        : rec.matchPercent >= 50
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-amber-500/20 text-amber-300')}
                    >
                      {rec.haveCount}/{rec.ingredientStatus.length} da
                    </span>
                  </div>

                  {rec.shortDesc && (
                    <p className={'text-xs font-semibold ' + themeStyles.textMuted}>{rec.shortDesc}</p>
                  )}

                  {/* ZUTATEN-CHECKLISTE MIT GELBEM EINKAUFSWAGEN-BUTTON FÜR FEHLENDE ZUTATEN */}
                  <div className="space-y-1.5">
                    {rec.ingredientStatus.map((ing, idx) => (
                      <div
                        key={idx}
                        className={'px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs sm:text-sm font-bold ' + themeStyles.subtle}
                      >
                        <span className="truncate">{ing.name}</span>
                        {ing.inPantry ? (
                          <span className="text-emerald-400 font-black shrink-0 truncate max-w-[170px] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ing.pantryItem?.name}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              addShoppingItem(ing.name);
                              showToast('Auf Einkaufsliste 🛒', ing.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3 stroke-[2.5]" />
                            <span>+ Dazukaufen</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNTERE AKTIONSLEISTE: WOCHENTAGS-WAHL (MO - SO) & ALLE FEHLENDEN KAUFEN */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-sky-400 shrink-0">
                      📅 Einplanen:
                    </span>
                    <div className="flex items-center gap-1">
                      {WEEKDAY_SHORT_BTNS.map(dayBtn => (
                        <button
                          key={dayBtn.id}
                          type="button"
                          title={'Als Tages-Menü für ' + dayBtn.full + ' eintragen'}
                          onClick={() => {
                            setTargetMealDayId(dayBtn.id);
                            convertRecipeToDailyMenu(rec, dayBtn.id);
                          }}
                          className={'w-7 h-7 rounded-lg text-[10px] font-black cursor-pointer ' +
                            (Number(targetMealDayId) === dayBtn.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                        >
                          {dayBtn.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => convertRecipeToDailyMenu(rec)}
                      className="tw-glow-btn flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 shrink-0" />
                      <span>🍽️ Menü für {safeMeals.find(m => Number(m.id) === Number(targetMealDayId))?.dayLabel || 'Montag'}</span>
                    </button>

                    {missingIngredients.length > 0 && (
                      <button
                        type="button"
                        title="Alle fehlenden Zutaten für dieses Rezept auf die Einkaufsliste setzen"
                        onClick={() => {
                          missingIngredients.forEach(mi => addShoppingItem(mi.name));
                          showToast('Auf Einkaufsliste 🛒', missingIngredients.length + ' fehlende Zutat(en) übertragen.', '🛒');
                        }}
                        className="py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 shadow-md"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>+{missingIngredients.length} Einkauf</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
