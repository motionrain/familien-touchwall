// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import {
  Utensils, ShoppingCart, Sparkles, Globe, Clock,
  Wand2, ExternalLink, ChefHat, Check, Plus, Filter
} from 'lucide-react';
import { getFoodEmoji, isProductGlutenFree, getDaysUntil } from './PantrySection';

// Bereinigt Produktnamen von Supermarkt-Marken & Mengenangaben für präzises Rezept-Matching
function cleanProductCoreName(rawName) {
  return String(rawName || '')
    .toLowerCase()
    .replace(/\b(\d+\s*(g|kg|ml|l|stk|pcs|x)|k-classic|ja!|mysmile|die süsse susi|ernte krone|landfein|haltbare|schwarzwaldmilch|oro di parma|hengstenberg|altmeister|delikatess|das komplette|france|flow pack de|3,5%|1,5%)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// ERWEITERTE FAMILIEN- & GLUTENFREI-REZEPTDATENBANK (AUF VORRAT ABGESTIMMT)
// ============================================================================
const FAMILY_RECIPES_DB = [
  {
    id: 'fam_wraps',
    title: '🌮 Knusprige Schär-Wraps mit Frischkäse & Salat',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'Express & Glutenfrei',
    shortDesc: 'Schär Wraps warm aus der Pfanne mit Philadelphia Frischkäse, Käse, Gurke und Salat.',
    keywords: ['wraps', 'wrap', 'schär', 'frischkäse', 'philadelphia', 'scheibenkäse', 'käse', 'gurke', 'salat', 'eisbergsalat', 'mâche', 'burger sauce'],
    ingredients: ['Schär Wraps', 'Philadelphia Frischkäse / Käse', 'Gurke & Salat (z.B. Mâche)', 'Burger Sauce oder Tomatenmark']
  },
  {
    id: 'fam_chili_reis',
    title: '🍲 Schnelles Chili sin Carne mit Reis oder Kartoffelpüree',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'One-Pot & Glutenfrei',
    shortDesc: 'Wärmendes Gefro Chili sin Carne verfeinert mit Tomatenmark, Sahne/Frischkäse und Beilage.',
    keywords: ['chili', 'gefro', 'tomatenmark', 'oro di parma', 'reis', 'kartoffelpüree', 'schlagsahne', 'frischkäse', 'mais'],
    ingredients: ['Gefro Chili sin carne', 'Tomatenmark', 'Reis oder Kartoffelpüree', 'Klecks Schlagsahne / Frischkäse']
  },
  {
    id: 'fam_mac_cheese_gf',
    title: '🧀 Cremige Glutenfreie Käse-Sahne-Nudeln (Mac & Cheese)',
    prepMinutes: 20,
    kidFavorite: true,
    glutenFree: true,
    category: 'Kinder-Hit & Glutenfrei',
    shortDesc: 'Schnelle Käsesoße aus Milch, Schlagsahne, Frischkäse und Parmesan (mit Maisstärke gebunden).',
    keywords: ['parmesan', 'käse', 'scheibenkäse', 'frischkäse', 'philadelphia', 'schlagsahne', 'sahne', 'vollmilch', 'milch', 'nudeln', 'pasta'],
    ingredients: ['Glutenfreie Nudeln / Pasta', 'Vollmilch & Schlagsahne', 'Parmesan & Frischkäse', 'Prise Muskat / Maisstärke']
  },
  {
    id: 'fam_bratwurst_rotkohl',
    title: '🌭 Rostbratwurst mit Kartoffelpüree & Apfel-Rotkohl',
    prepMinutes: 20,
    kidFavorite: true,
    glutenFree: true,
    category: 'Familien-Klassiker',
    shortDesc: 'Deftiger Familien-Liebling mit Kartoffelpüree, warmem Apfel-Rotkohl und Kräuterbutter.',
    keywords: ['rostbratwurst', 'bratwurst', 'wurst', 'kartoffelpüree', 'kartoffel', 'rotkohl', 'apfel rotkohl', 'kräuterbutter', 'butter', 'senf'],
    ingredients: ['Rostbratwurst / Würstchen', 'Kartoffelpüree', 'Apfel-Rotkohl', 'Kräuterbutter / Senf']
  },
  {
    id: 'fam_spargel_pfanne',
    title: '🥦 Cremige Spargel-Kartoffel-Pfanne mit Sahnesoße',
    prepMinutes: 20,
    kidFavorite: false,
    glutenFree: true,
    category: 'Feine Familienküche',
    shortDesc: 'Stangenspargel in einer milden Frischkäse-Sahne-Parmesan-Soße zu Kartoffelpüree oder Reis.',
    keywords: ['spargel', 'stangenspargel', 'schlagsahne', 'sahne', 'frischkäse', 'philadelphia', 'parmesan', 'kartoffelpüree', 'kartoffel', 'butter'],
    ingredients: ['Stangenspargel', 'Kartoffelpüree oder Kartoffeln', 'Schlagsahne & Frischkäse', 'Parmesan Käse']
  },
  {
    id: 'fam_tomatensuppe',
    title: '🍅 Cremige Blitz-Tomatensuppe mit Sahnehaube & Parmesan',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'Express (15 Min.)',
    shortDesc: 'Aus Tomatenmark, Vollmilch, Schlagsahne und Frischkäse in 15 Minuten heiß auf dem Tisch.',
    keywords: ['tomatenmark', 'oro di parma', 'passierte', 'schlagsahne', 'sahne', 'vollmilch', 'milch', 'frischkäse', 'parmesan', 'reis'],
    ingredients: ['Tomatenmark (z.B. Oro di Parma)', 'Schlagsahne & Vollmilch', 'Frischkäse Schnittlauch', 'Parmesan oder Reis-Einlage']
  },
  {
    id: 'fam_salat_bowl',
    title: '🥗 Knackige Feldsalat-Gurken-Schüssel mit Haus-Dressing',
    prepMinutes: 10,
    kidFavorite: false,
    glutenFree: true,
    category: 'Frisch & Leicht',
    shortDesc: 'Frischer Mâche-Feldsalat und Gurke mit Honig-Essig-Sahne-Dressing und Käsewürfeln.',
    keywords: ['mâche', 'feldsalat', 'salat', 'eisbergsalat', 'gurke', 'essig', 'hengstenberg', 'schlagsahne', 'parmesan', 'käse', 'apfel', 'clementinen'],
    ingredients: ['Mâche / Feldsalat', 'Frische Gurke', 'Weinwürziger Essig & Öl/Sahne', 'Parmesan / Apfelstücke']
  },
  {
    id: 'fam_apfel_nachtisch',
    title: '🍎 Warmer Bratapfel-Traum mit Apfelmus, Sahne & Choco Balls',
    prepMinutes: 15,
    kidFavorite: true,
    glutenFree: true,
    category: 'Süßes & Kinder-Hit',
    shortDesc: 'Elstar-Äpfel aus der Pfanne mit Apfelmus, geschlagener Sahne und knusprigen Schär Choco Balls.',
    keywords: ['äpfel', 'apfel', 'elstar', 'apfelmus', 'schlagsahne', 'sahne', 'choco balls', 'schär', 'clementinen', 'butter'],
    ingredients: ['Äpfel (Elstar) & Apfelmus', 'Schlagsahne', 'Schär Choco Balls (Topping)', 'Clementinen']
  },
  {
    id: 'fam_bolo',
    title: '🍝 Schnelle Familien-Bolognese mit Parmesan',
    prepMinutes: 20,
    kidFavorite: true,
    glutenFree: true,
    category: 'One-Pot & Pasta',
    shortDesc: 'Klassiker für Kinder mit Tomatenmark, einem Schuss Sahne und frisch geriebenem Parmesan.',
    keywords: ['spaghetti', 'nudeln', 'pasta', 'hackfleisch', 'rinderhack', 'chili', 'tomaten', 'passierte', 'tomatenmark', 'oro di parma', 'parmesan', 'karotten'],
    ingredients: ['Nudeln (auch GF möglich)', 'Hackfleisch oder Chili sin carne', 'Tomatenmark / Passierte Tomaten', 'Parmesan Käse & Schuss Sahne']
  },
  {
    id: 'fam_kartoffel_gratin',
    title: '🥔 Überbackener Kartoffelpüree-Käse-Auflauf',
    prepMinutes: 25,
    kidFavorite: true,
    glutenFree: true,
    category: 'Ofen & Familie',
    shortDesc: 'Kartoffelpüree verfeinert mit Schlagsahne, Frischkäse und einer goldenen Parmesan-Kruste.',
    keywords: ['kartoffelpüree', 'kartoffel', 'schlagsahne', 'sahne', 'vollmilch', 'frischkäse', 'philadelphia', 'parmesan', 'käse', 'butter'],
    ingredients: ['Kartoffelpüree / Kartoffeln', 'Schlagsahne & Vollmilch', 'Philadelphia Frischkäse', 'Parmesan zum Überbacken']
  }
];

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
  { de: ['schwein', 'schinken', 'speck', 'bratwurst', 'wurst'], en: 'pork', label: 'Wurst / Schinken' },
  { de: ['lachs', 'fisch'], en: 'salmon', label: 'Lachs / Fisch' },
  { de: ['reis', 'spitzenreis', 'langkorn', 'basmatireis'], en: 'rice', label: 'Reis' },
  { de: ['ei', 'eier'], en: 'egg', label: 'Eier' },
  { de: ['spargel', 'stangenspargel'], en: 'asparagus', label: 'Spargel' }
];

const EN_TO_DE_DISH_WORDS = {
  'Chicken': 'Hähnchen', 'Beef': 'Rindfleisch', 'Pork': 'Bratwurst / Schwein',
  'Pasta': 'Nudel-Pfanne', 'Spaghetti': 'Spaghetti', 'Salmon': 'Lachs',
  'Potato': 'Kartoffel', 'Potatoes': 'Kartoffeln', 'Cheese': 'Käse',
  'Creamy': 'Cremige', 'Baked': 'Ofen-', 'Salad': 'Salat', 'Rice': 'Reis-Pfanne',
  'With': 'mit', 'And': '&', 'Egg': 'Ei', 'Eggs': 'Eier', 'Soup': 'Suppe',
  'Tomato': 'Tomaten', 'Apple': 'Apfel', 'Asparagus': 'Spargel'
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
  // 'all' | 'ready' | 'glutenfree' | 'express' | 'kids' | 'web'
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [targetMealDayId, setTargetMealDayId] = useState(1);
  const [includeSideAndDessert, setIncludeSideAndDessert] = useState(true);
  const [alsoSendMissingToShopping, setAlsoSendMissingToShopping] = useState(true);
  const [webRecipes, setWebRecipes] = useState([]);
  const [isLoadingWebRecipes, setIsLoadingWebRecipes] = useState(false);

  // Vorrats-Zutaten sortiert nach "läuft bald ab" für die interaktive Fokus-Auswahl
  const selectableStockPills = useMemo(() => {
    return [...safeStock]
      .sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')))
      .slice(0, 18);
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

  // =========================================================
  // OPTIMIERTES LIVE-WEB-REZEPT LADEN (NUTZT AUSGEWÄHLTE ODER BALD ABLAUFENDE VORRÄTE)
  // =========================================================
  const fetchWebRecipesFromStock = async () => {
    setIsLoadingWebRecipes(true);
    setRecipeFilter('web');

    try {
      const sourceItems = activeFocusItems.length > 0
        ? activeFocusItems
        : [...safeStock].sort((a, b) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999')));

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
        matchedQueries.push({ en: 'cheese', deLabel: 'Käse & Vorrat' }, { en: 'tomato', deLabel: 'Tomate & Vorrat' });
      }

      const fetchedCards = [];
      const seenMealIds = new Set();

      for (const q of matchedQueries.slice(0, 4)) {
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
          for (let i = 1; i <= 7; i++) {
            const ingName = String(fullMeal['strIngredient' + i] || '').trim();
            if (ingName) rawIngs.push(ingName);
          }

          const hasGlutenIng = rawIngs.some(ing =>
            /flour|wheat|bread|pasta|spaghetti|noodle|soy sauce|couscous|barley/i.test(ing)
          );

          fetchedCards.push({
            id: 'web_' + fullMeal.idMeal,
            title: '🌐 ' + translateWebMealTitle(fullMeal.strMeal),
            prepMinutes: 25,
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
      showToast('Web-Rezepte geladen!', fetchedCards.length + ' passende Rezepte zu deinem Bestand gefunden!', '🌐');
    } catch (err) {
      showToast('Web-Suche Hinweis', 'Nutze unsere integrierten 20-Minuten-Familienrezepte.', 'ℹ️');
    } finally {
      setIsLoadingWebRecipes(false);
    }
  };

  // =========================================================
  // INTELLIGENTER BESTANDS-ABGLEICH (INKL. FOKUS-ZUTATEN & MHD-DRINGLICHKEIT)
  // =========================================================
  const evaluatedRecipes = useMemo(() => {
    const combinedSource = [...webRecipes, ...FAMILY_RECIPES_DB];

    return combinedSource
      .map(rec => {
        const matchedStock = [];
        let urgentCount = 0;
        let matchesSelectedFocus = 0;

        // 1. Prüfe Keywords gegen den gesamten Vorrat
        (rec.keywords || []).forEach(kw => {
          const cleanKw = kw.toLowerCase().trim();
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

        // 2. Prüfe jede einzelne Rezept-Zutat gegen den Vorrat
        const ingredientStatus = (rec.ingredients || []).map(ingLabel => {
          const words = String(ingLabel)
            .toLowerCase()
            .split(/[\s/(),&-]+/)
            .filter(w => w.length >= 3 && !/mit|oder|und|aus|zum|für|klecks|prise/.test(w));

          const inPantry = safeStock.find(st => {
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
        if (recipeFilter === 'glutenfree') return Boolean(rec.glutenFree);
        if (recipeFilter === 'ready') return rec.matchPercent >= 65 || rec.missingCount <= 1;
        if (recipeFilter === 'express') return rec.prepMinutes <= 20;
        if (recipeFilter === 'kids') return Boolean(rec.kidFavorite);
        if (recipeFilter === 'web') return Boolean(rec.isWebRecipe);
        return true;
      })
      .sort((a, b) => {
        if (selectedStockIds.length > 0 && b.matchesSelectedFocus !== a.matchesSelectedFocus) {
          return b.matchesSelectedFocus - a.matchesSelectedFocus;
        }
        return (b.matchPercent * 2 + b.urgentCount * 25) - (a.matchPercent * 2 + a.urgentCount * 25);
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

    showToast('Wochenplan erstellt!', 'Alle 7 Tage wurden passend zu eurem Vorrat gefüllt!', '🪄');
  };

  // Dynamische Such-Links basierend auf ausgewählten oder bald ablaufenden Vorrats-Zutaten
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
  const glutenfreePortalUrl = 'https://www.chefkoch.de/rs/s0/' + encodeURIComponent(searchQueryWords + ' glutenfrei schnell') + '/Rezepte.html';

  return (
    <div className="space-y-3.5">
      {/* KOPF- & FILTER-COCKPIT */}
      <div className={'p-4 rounded-3xl border space-y-3 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              <span>Intelligenter Vorrats-Rezeptfinder & Tages-Menü Planer</span>
            </h3>
            <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
              Erkennt deine Vorräte automatisch (inkl. Glutenfrei-Status) • Klicke unten auf Zutaten, um gezielt dafür Rezepte zu kombinieren!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={fetchWebRecipesFromStock}
              disabled={isLoadingWebRecipes}
              className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className={'w-4 h-4 text-sky-300 ' + (isLoadingWebRecipes ? 'animate-spin' : '')} />
              <span>{isLoadingWebRecipes ? 'Lade Web-Rezepte...' : '🌐 Live Web-Rezepte zum Vorrat'}</span>
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

            <a
              href={glutenfreePortalUrl}
              target="_blank"
              rel="noreferrer"
              className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
              <span>🌾✓ Glutenfrei-Suche</span>
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

        {/* =========================================================
            INTERAKTIVE VORRATS-ZUTATEN-AUSWAHL (ZUTATEN ANKLICKEN!)
           ========================================================= */}
        <div className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase text-sky-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>🎯 Welche Vorräte möchtest du heute verwerten? (Anklicken zum Filtern):</span>
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
                  className={'px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ' +
                    (isSelected
                      ? 'tw-active-nav ring-2 ring-sky-300'
                      : daysLeft <= 5
                      ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                      : 'tw-nav-inactive')}
                >
                  <span>{getFoodEmoji(stItem.name, stItem.customEmoji)}</span>
                  <span className="truncate max-w-[140px]">{stItem.name}</span>
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
              { id: 'all',        label: '⭐ Beste Vorrats-Treffer' },
              { id: 'ready',      label: '🟢 Sofort kochbar (Fast alles da)' },
              { id: 'glutenfree', label: '🌾✓ 100% Glutenfrei' },
              { id: 'express',    label: '⚡ Express (max. 20 Min.)' },
              { id: 'kids',       label: '👨‍👩‍👧‍👦 Kinder-Lieblinge' },
              { id: 'web',        label: '🌐 Web-Rezepte (' + webRecipes.length + ')' }
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

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSideAndDessert}
                onChange={(e) => setIncludeSideAndDessert(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span>🥗+🍊 Salat/Obst aus Vorrat ergänzen</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoSendMissingToShopping}
                onChange={(e) => setAlsoSendMissingToShopping(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span>🛒 Fehlendes automatisch auf Einkaufsliste</span>
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
                className={'tw-pantry-tile p-4 rounded-3xl border flex flex-col justify-between gap-3.5 shadow-sm ' + themeStyles.card + (rec.matchPercent >= 75 ? ' border-emerald-400/60' : rec.urgentCount > 0 ? ' border-amber-400/70' : '')}
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
                        {rec.glutenFree && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                            🌾✓ Glutenfrei
                          </span>
                        )}
                        {rec.kidFavorite && (
                          <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-black">
                            👨‍👩‍👧‍👦 Kinder-Hit
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-base leading-snug">{rec.title}</h4>
                    </div>

                    <span className={'px-2.5 py-1 rounded-full text-xs font-black shrink-0 ' + (rec.matchPercent >= 75 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : rec.matchPercent >= 50 ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300')}>
                      {rec.haveCount}/{rec.ingredientStatus.length} da ({rec.matchPercent}%)
                    </span>
                  </div>

                  {rec.shortDesc && (
                    <p className={'text-xs font-semibold ' + themeStyles.textMuted}>{rec.shortDesc}</p>
                  )}

                  {rec.urgentCount > 0 && (
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold">
                      ⚡ Verwertet {rec.urgentCount} bald ablaufende(s) Produkt(e) aus eurem Bestand!
                    </div>
                  )}

                  {/* ZUTATEN-CHECKLISTE MIT DIREKTEM EINKAUFS-BUTTON PRO FEHLENDER ZUTAT */}
                  <div className="space-y-1">
                    {rec.ingredientStatus.map((ing, idx) => (
                      <div key={idx} className={'px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ' + themeStyles.subtle}>
                        <span className="truncate">{ing.name}</span>
                        {ing.inPantry ? (
                          <span className="text-emerald-400 font-extrabold shrink-0 truncate max-w-[160px]">
                            ✓ {ing.pantryItem?.name}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              addShoppingItem(ing.name);
                              showToast('Auf Einkaufsliste', ing.name + ' wurde zur Einkaufsliste hinzugefügt.', '🛒');
                            }}
                            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-400/40 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> 🛒 Einkauf
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNTERE AKTIONSLEISTE: DIREKTE WOCHENTAGS-WAHL (MO - SO) & EINKAUFS-TRANSFER */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-sky-400 shrink-0">
                      📅 Direkt einplanen:
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
                        title="Nur die fehlenden Zutaten auf die Einkaufsliste setzen"
                        onClick={() => {
                          missingIngredients.forEach(mi => addShoppingItem(mi.name));
                          showToast('Fehlendes auf Einkaufsliste', missingIngredients.length + ' Zutat(en) übertragen.', '🛒');
                        }}
                        className="tw-nav-inactive py-2.5 px-3 rounded-2xl text-amber-300 text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>+{missingIngredients.length}</span>
                      </button>
                    )}
                  </div>

                  {rec.sourceUrl && (
                    <a
                      href={rec.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="tw-nav-inactive w-full py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 no-underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Original-Kochanleitung öffnen
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
