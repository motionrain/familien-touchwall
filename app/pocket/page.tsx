// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, Camera, Package,
  RefreshCw, Smartphone, LogOut, Cloud, BellRing, Download,
  WifiOff, Pencil, Check, Search, Menu, X,
  Trash2, Wand2, CheckCircle2, AlertTriangle
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
  callCloudApi
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
import PocketScanner, {
  FOOD_EMOJI_PICKER,
  simplifyProductName,
  detectSmartCategory,
  detectSmartLocation,
  isProductGlutenFree
} from './PocketScanner';
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

// ============================================================================
// 1. STABILER MERGE FÜR DIE EINKAUFSLISTE (CLOUD vs. TODOIST UNTERSCHEIDUNG)
// ============================================================================
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

  // Schritt 1: Eingehende Artikel (aus Cloud oder Todoist) übernehmen
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

  // Schritt 2: Lokale Artikel abgleichen (kein Verschlucken offener oder in Todoist geschlossener Punkte!)
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

    // Fall A: Artikel war bereits erledigt -> im Erledigt-Bereich behalten
    if (loc.done || doneTs) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    // Fall B: Quelle ist die Cloud -> Offene lokale Artikel niemals löschen!
    if (source === 'cloud') {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
      return;
    }

    // Fall C: Quelle ist Todoist ->
    // 1. Hat der Artikel KEINE todoistId (oder wurde gerade erst vor < 25 Sek. angelegt), bleibt er offen!
    const isVeryRecent = loc.addedAtTs && (now - Number(loc.addedAtTs) < 25000);
    if (!loc.todoistId || isVeryRecent) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
    } else {
      // 2. Artikel hatte eine todoistId und ist in Todoist nicht mehr offen -> wurde in Todoist abgehakt!
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

// ============================================================================
// 2. STABILER MERGE FÜR AUFGABEN / TASKS (CLOUD vs. TODOIST UNTERSCHEIDUNG)
// ============================================================================
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

  // Schritt 1: Eingehende Aufgaben (aus Cloud oder Todoist) abgleichen
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

    // Behalte die spezifische Personen-Zuordnung bei, falls Todoist nur 'all' liefert
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

  // Schritt 2: Nicht gematchte lokale Aufgaben prüfen
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

    // Fall A: Aufgabe war bereits erledigt -> behalten
    if (loc.done || doneTs) {
      mergedList.push({
        ...loc,
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    // Fall B: Quelle ist die Cloud -> Offene lokale Aufgaben niemals löschen!
    if (source === 'cloud') {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
      return;
    }

    // Fall C: Quelle ist Todoist ->
    // 1. Hat die Aufgabe KEINE todoistId (oder wurde vor < 25 Sek. angelegt), bleibt sie als offene Aufgabe erhalten!
    const createdMs = typeof loc.id === 'number' && loc.id > 1700000000000 ? loc.id : 0;
    const isVeryRecent = createdMs && (now - createdMs < 25000);
    if (!tdKey || isVeryRecent) {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
    } else {
      // 2. Aufgabe hatte eine todoistId und ist in Todoist nicht mehr offen -> wurde in Todoist erledigt!
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

  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [stockSortMode, setStockSortMode] = useState('newest');
  const [stockLocationFilter, setStockLocationFilter] = useState('all');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');
  const [stockOnlyGlutenFree, setStockOnlyGlutenFree] = useState(false);

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

  // Wenn deferTasksAndNotes = true ist (weil direkt danach Todoist abgefragt wird),
  // berechnen wir Tasks & Notes nur im Speicher und setzen den React-State erst am Ende EINMALIG!
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

      if (s.schoolData?.dean) setSchoolData(s.schoolData);

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
        const freshBundle = await callCloudBackend({ action: 'loadBundle' });
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

  // ============================================================================
  // EINZIGER, FLACKERFREIER SYNC-DURCHGANG (CLOUD + TODOIST IN EINEM SCHRITT)
  // ============================================================================
  const syncAllNow = async (showFeedback = false, accOverride = undefined, keyOverride = undefined) => {
    const activeAcc = accOverride !== undefined ? accOverride : accountId;
    const activeKey = keyOverride !== undefined ? keyOverride : authKey;
    if (isSyncRunningRef.current) return;
    if (!showFeedback && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 8000)) return;

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
          authKey: activeKey
        });
        if (!showFeedback && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 6000)) {
          return;
        }
        if (bundle?.ok) {
          const hasTodoistToken = Boolean(
            bundle?.state?.todoistConfig?.apiToken?.trim() || todoistConfig?.apiToken?.trim()
          );
          const applied = applyRemoteBundle(bundle, hasTodoistToken);
          workingNotes = applied.resolvedNotes;
          workingTasks = applied.resolvedTasks;
          workingTodoistCfg = applied.resolvedTodoistCfg;
        }
      }

      if (workingTodoistCfg?.apiToken?.trim()) {
        const pulled = await pullFromTodoistTwoWay(
          workingTodoistCfg.apiToken,
          workingTodoistCfg,
          workingTasks,
          workingNotes,
          safeMembers
        );
        if (pulled && (showFeedback || (!isNetworkSavingRef.current && Date.now() - lastLocalEditRef.current >= 6000))) {
          if (Array.isArray(pulled.tasks)) {
            workingTasks = reconcileFamilyTasks(workingTasks, pulled.tasks, syncMetaRef.current, 'todoist');
          }
          if (Array.isArray(pulled.familyNotes)) {
            workingNotes = reconcileShoppingNotes(workingNotes, pulled.familyNotes, syncMetaRef.current, 'todoist');
          }
        }
      }

      // Einmaliges, flackerfreies Setzen des zusammengeführten Endstandes!
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
        setTimeout(() => syncAllNow(true, qrAcc, qrKey), 200);
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
          if (parsed.schoolData?.dean) setSchoolData(parsed.schoolData);
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
          setTimeout(() => syncAllNow(false, session.accountId, session.authKey), 300);
        }
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accountId || accountId === 'local') return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllNow(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accountId, authKey]);

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
    if (!target) {
      setEditStockModal({ ...editStockModal, open: false });
      return;
    }
    const now = Date.now();
    lastLocalEditRef.current = now;
    syncMetaRef.current.deletedPantryIds[String(target.id)] = now;
    saveLocalSyncMeta(syncMetaRef.current);

    const nextStock = safeStock.filter(x => x.id !== target.id);
    const nextTrash = [
      {
        ...target,
        trashedAt: todayStr,
        trashedTimestamp: now,
        reason: 'wasted',
        reasonLabel: '🗑️ Gelöscht am ' + todayStr,
        updatedAt: now,
        fromMobile: true
      },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    setEditStockModal({ ...editStockModal, open: false });
    await saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
    showToast('Produkt gelöscht', target.name + ' wurde in den Mülleimer verschoben.', '🗑️');
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

    syncMetaRef.current.deletedPantryIds[String(item.id)] = now;
    saveLocalSyncMeta(syncMetaRef.current);

    const nextStock = safeStock.filter(x => x.id !== item.id);
    const nextTrash = [
      { ...item, trashedAt: todayStr, trashedTimestamp: now, reason: 'consumed', reasonLabel: '🍽️ Verzehrt am ' + todayStr, updatedAt: now, fromMobile: true },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    await saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
    showToast('Komplett verzehrt!', item.name + ' wurde ausgebucht.', '🍽️');
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

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-[#111418] text-white flex items-center justify-center p-6">
        <div className="text-sm font-extrabold opacity-75 animate-pulse">📱 Lade Touchwall Pocket...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#111418] text-slate-100 flex flex-col justify-center p-5 select-none">
        <div className="w-full max-w-md mx-auto rounded-3xl border border-slate-700/80 bg-[#1b2028] p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-extrabold">
                📱 Touchwall Pocket • Android App & Scanner
              </span>
              <h1 className="text-xl font-black mt-0.5">Handy-Anmeldung</h1>
            </div>
          </div>

          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handlePocketLogin} className="space-y-3.5">
            <input
              type="text"
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="Familien-Benutzername"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white"
            />
            <input
              type="password"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Passwort / PIN"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm shadow-lg"
            >
              {isLoggingIn ? 'Verbinde...' : '🔓 Auf dem Handy anmelden'}
            </button>
          </form>
        </div>
      </div>
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
      className={'h-[100dvh] w-screen overflow-hidden flex flex-col select-none ' + themeStyles.outer}
    >
      <style>{pocketStyles}</style>

      {activeTab !== 'scanner' && (
        <header className={'shrink-0 z-30 px-3.5 pt-2.5 pb-2 border-b shadow-md ' + themeStyles.header}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white text-[10px] font-black">POCKET</span>
              <h1 className="font-extrabold text-sm sm:text-base truncate">{familyName}</h1>
              {!isOnline ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-black flex items-center gap-1 shrink-0">
                  <WifiOff className="w-3 h-3" /> Offline-Puffer
                </span>
              ) : accountId && accountId !== 'local' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30 flex items-center gap-1 shrink-0">
                  <Cloud className="w-3 h-3" /> {accountId}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              {installPromptEvent && (
                <button
                  onClick={handleInstallAndroidApp}
                  className="tw-active-nav px-2.5 py-2 rounded-xl text-[10px] font-black flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> App
                </button>
              )}
              <button
                onClick={requestShoppingPushPermission}
                title="Einkaufs- & MHD-Push aktivieren"
                className={'p-2.5 rounded-xl ' + (notifPermission === 'granted' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : 'tw-glow-btn')}
              >
                <BellRing className="w-4 h-4" />
              </button>
              <button onClick={() => syncAllNow(true)} className="tw-glow-btn p-2.5 rounded-xl">
                <RefreshCw className={'w-4 h-4 ' + (isSyncing ? 'animate-spin text-sky-300' : '')} />
              </button>
              <a href="/" className="tw-glow-btn px-2.5 py-2 rounded-xl text-[11px] font-extrabold no-underline">
                🖥️ Wand
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('richter_tw_auth_active');
                  setIsAuthenticated(false);
                }}
                className="tw-nav-inactive p-2.5 rounded-xl text-rose-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeTab !== 'stock' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => {
                  setSelectedPerson('all');
                  try { localStorage.setItem('richter_tw_pocket_person', 'all'); } catch (e) {}
                }}
                className={'px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' + (selectedPerson === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                👨‍👩‍👧‍👦 Alle
              </button>

              {safeMembers.filter(m => m.id !== 'all').map(m => {
                const isSel = selectedPerson === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedPerson(m.id);
                      try { localStorage.setItem('richter_tw_pocket_person', m.id); } catch (e) {}
                    }}
                    className={'pr-3 pl-1.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-extrabold shrink-0 ' + (isSel ? 'tw-active-nav' : 'tw-nav-inactive')}
                  >
                    {renderAvatar(m, 'w-5 h-5', 'text-[10px]')}
                    <span>{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </header>
      )}

      <main className={'flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2.5 pb-6 ' + themeStyles.viewport}>
        <div className="max-w-lg w-full mx-auto space-y-3">
          {activeTab === 'agenda' && (
            <PocketAgenda
              safeMembers={safeMembers}
              filteredEvents={filteredEvents}
              selectedPerson={selectedPerson}
              todayStr={todayStr}
              themeStyles={themeStyles}
              getMemberStyles={getMemberStyles}
              renderAvatar={renderAvatar}
              onCreateEvent={handleCreateMobileEvent}
              onDeleteEvent={handleDeleteMobileEvent}
            />
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
              todayStr={todayStr}
              isSyncing={isSyncing}
              themeStyles={themeStyles}
              onAddSingleToCart={handleAddSingleToCart}
              onAddBatchToCart={handleAddBatchToCart}
              onRemoveCartItem={handleRemoveCartItem}
              onTransferSingleCartItemToStock={handleTransferSingleCartItemToStock}
              onTransferAllCartToStock={handleTransferAllCartToStock}
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

          {activeTab === 'stock' && (
            <div className="space-y-3">
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
                      className="px-2.5 py-1 rounded-xl bg-rose-500/30 border border-rose-400/50 text-rose-100 text-[10px] font-black flex items-center gap-1"
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Push erneut senden</span>
                    </button>
                  </div>

                  {mhdAlertGroups.finalToday.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-rose-500/25 border border-rose-400/60 space-y-1">
                      <div className="text-[11px] font-black text-rose-200">
                        🚨 LETZTE WARNUNG – Läuft HEUTE ab (wandert morgen in den Mülleimer):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mhdAlertGroups.finalToday.map(it => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => openEditStockItemModal(it)}
                            className="px-2.5 py-1 rounded-xl bg-black/45 border border-rose-300/40 text-xs font-extrabold text-white flex items-center gap-1.5"
                          >
                            <span>{getFoodEmoji(it.name, it.customEmoji)}</span>
                            <span>{it.name}</span>
                            <span className="text-rose-300 font-black">({it.quantity})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mhdAlertGroups.warnTwoDays.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 space-y-1">
                      <div className="text-[11px] font-black text-amber-200">
                        ⚠️ Vorwarnung – Läuft in den nächsten 1–2 Tagen ab:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mhdAlertGroups.warnTwoDays.map(it => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => openEditStockItemModal(it)}
                            className="px-2.5 py-1 rounded-xl bg-black/40 border border-amber-300/40 text-xs font-extrabold text-white flex items-center gap-1.5"
                          >
                            <span>{getFoodEmoji(it.name, it.customEmoji)}</span>
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
                    <h2 className="font-black text-base flex items-center gap-1.5">
                      <span>🥫 Bestand ({sortedStockForTab.length})</span>
                    </h2>
                    <p className="text-[10px] opacity-75 font-bold">
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
                      className={'px-2.5 py-2 rounded-xl text-[11px] font-black flex items-center gap-1 border ' +
                        (stockOnlyGlutenFree
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40')}
                    >
                      <span>🌾✓ GF ({totalGlutenFreeInStock})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStockMenu(prev => !prev)}
                      className={'px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ' +
                        (showStockMenu ? 'tw-active-nav' : 'tw-glow-btn')}
                    >
                      {showStockMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                      <span>Menü</span>
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
                    className={'w-full h-11 pl-10 pr-9 rounded-2xl border text-xs sm:text-sm font-extrabold ' + themeStyles.input}
                  />
                  {stockSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStockSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-black"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showStockMenu && (
                  <div className={'p-3 rounded-2xl border space-y-3 ' + themeStyles.subtle}>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-sky-400 block">
                        ↕️ Sortierung wählen:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
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
                            className={'py-2 px-2.5 rounded-xl text-xs font-extrabold text-left ' +
                              (stockSortMode === sOpt.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                          >
                            {sOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                          🏠 Lagerort:
                        </label>
                        <select
                          value={stockLocationFilter}
                          onChange={(e) => setStockLocationFilter(e.target.value)}
                          className={'w-full h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                        <label className="text-[10px] font-black uppercase text-purple-300 block mb-1">
                          🍱 Kategorie:
                        </label>
                        <select
                          value={stockCategoryFilter}
                          onChange={(e) => setStockCategoryFilter(e.target.value)}
                          className={'w-full h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                    className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' +
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
                        className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' +
                          (stockLocationFilter === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                      >
                        {loc.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                {sortedStockForTab.length === 0 ? (
                  <div className={'p-8 rounded-3xl border text-center space-y-2 ' + themeStyles.card}>
                    <div className="text-2xl">🥫</div>
                    <div className="text-xs font-extrabold opacity-70">
                      Keine Produkte für diese Suche oder Filterung gefunden.
                    </div>
                  </div>
                ) : (
                  sortedStockForTab.map((item, idx) => {
                    const catObj = FOOD_CATEGORIES.find(c => c.id === item.resolvedCategory) || FOOD_CATEGORIES[1];
                    const locObj = STORAGE_PILLS.find(l => l.id === item.location) || STORAGE_PILLS[0];
                    const decPreview = decrementItemPieceCount(item.quantity);
                    const daysLeft = getDaysUntilMhd(item.expiryDate, todayStr);
                    const isFinalDayZero = daysLeft <= 0;
                    const isWarnTwoDays = daysLeft === 1 || daysLeft === 2;
                    const isWarnWeek = daysLeft > 2 && daysLeft <= 7;
                    const isNewestTop = stockSortMode === 'newest' && idx === 0 && !stockSearchQuery;
                    const isGf = Boolean(item.resolvedGlutenFree);
                    const emojiIcon = getFoodEmoji(item.name, item.customEmoji);

                    const daysLabel = daysLeft <= 0
                      ? '🚨 HEUTE LETZTER TAG!'
                      : daysLeft === 1
                      ? '⚠️ Morgen (1 T.)'
                      : daysLeft === 2
                      ? '⚠️ Noch 2 Tage'
                      : (daysLeft + ' Tage');

                    return (
                      <div
                        key={item.id}
                        onClick={() => openEditStockItemModal(item)}
                        className={'p-3.5 rounded-3xl border flex flex-col gap-3 cursor-pointer shadow-sm transition-all ' +
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
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="w-12 h-12 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                              {emojiIcon}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                {isNewestTop && (
                                  <span className="px-1.5 py-0.2 rounded bg-sky-500 text-white text-[9px] font-black shrink-0">
                                    ZULETZT ERFASST
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => toggleStockItemGlutenFreeDirectly(e, item)}
                                  className={'px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 ' +
                                    (isGf
                                      ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                                      : 'bg-white/5 border border-white/10 text-slate-400')}
                                >
                                  {isGf ? '🌾✓ GF' : '🌾?'}
                                </button>
                                <span className="text-[10px] font-bold opacity-75 truncate">
                                  {catObj.icon} {catObj.title.split(',')[0]}
                                </span>
                              </div>

                              <h3 className="font-black text-sm sm:text-base leading-snug break-words">
                                {item.name}
                              </h3>
                            </div>
                          </div>

                          <div
                            className={'px-2.5 py-1.5 rounded-2xl border text-right shrink-0 ' +
                              (isFinalDayZero
                                ? 'bg-rose-500/35 border-rose-300 text-rose-100'
                                : isWarnTwoDays
                                ? 'bg-rose-500/25 border-rose-400 text-rose-100'
                                : isWarnWeek
                                ? 'bg-amber-500/30 border-amber-400 text-amber-100'
                                : 'bg-black/30 border-white/10')}
                          >
                            <div className="text-xs font-black">
                              {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}
                            </div>
                            <div className={'text-[10px] font-black ' + (isFinalDayZero || isWarnTwoDays ? 'text-rose-300' : isWarnWeek ? 'text-amber-300' : 'text-emerald-400')}>
                              {daysLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-amber-400/30 text-xs font-black text-amber-300">
                              📦 {item.quantity}
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-black/30 border border-white/10 text-xs font-extrabold">
                              {locObj.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openEditStockItemModal(item)}
                              className="tw-nav-inactive px-3 py-2 rounded-xl text-xs font-black text-sky-300 flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddQuickShopItem(item.name)}
                              title="Auf die Einkaufsliste setzen"
                              className="tw-nav-inactive p-2 rounded-xl text-amber-300"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConsumeFromPocket(item)}
                              className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>{decPreview.remaining > 0 ? '-1' : 'Weg'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {editStockModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <form
            onSubmit={handleSaveEditStockModal}
            className={'w-full max-w-md rounded-3xl border-2 p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-11 h-11 rounded-2xl bg-black/35 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                  {editStockModal.customEmoji || getFoodEmoji(editStockModal.name)}
                </span>
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
                className={'w-full px-3.5 py-2.5 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
              />
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-[10px] font-black uppercase text-amber-400 mb-1">
                  Menge / Stück
                </label>
                <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/10 h-10">
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
                  className={'w-full h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                  className={'w-full h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                  className={'w-full h-10 px-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
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
                <span className="text-[10px] font-black uppercase">🎨 Emoji anpassen</span>
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
                <span>Löschen</span>
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
                  className="tw-active-nav px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <nav className={'shrink-0 z-40 border-t px-2 py-2 flex items-center justify-around gap-1 shadow-2xl ' + themeStyles.header}>
        {[
          { id: 'agenda',   label: 'Kalender', icon: Calendar,     badge: filteredEvents.filter(e => e.date === todayStr).length },
          { id: 'tasks',    label: 'Aufgaben', icon: CheckSquare,  badge: openTasks.length },
          { id: 'scanner',  label: 'Scanner',  icon: Camera,       badge: safeCart.length },
          { id: 'shopping', label: 'Einkauf',  icon: ShoppingCart, badge: openShop.length + safeCart.length },
          {
            id: 'stock',
            label: 'Bestand',
            icon: Package,
            badge: mhdAlertGroups.finalToday.length + mhdAlertGroups.warnTwoDays.length > 0
              ? (mhdAlertGroups.finalToday.length + mhdAlertGroups.warnTwoDays.length)
              : safeStock.length,
            urgent: mhdAlertGroups.finalToday.length > 0
          }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'relative flex-1 py-2 rounded-2xl flex flex-col items-center gap-1 text-[10px] font-extrabold ' + (active ? 'tw-active-nav' : 'tw-nav-inactive opacity-80')}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={'absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black ' +
                  (tab.urgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950')}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-sky-400 text-white shadow-2xl flex items-center gap-3">
          <span className="text-xl">{toast.icon}</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">{toast.title}</div>
            <div className="text-xs font-bold">{toast.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
