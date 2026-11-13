// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, Camera, Package,
  RefreshCw, Smartphone, LogOut, Cloud, BellRing, Download,
  WifiOff, Pencil, Check, ArrowUpDown
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
  closeOrReopenTodoistTask
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
  } catch (e) {
    return { active: false, accountId: '', authKey: '' };
  }
}

// Liest den exakten Hinzufüge-Zeitstempel eines Produkts aus (für Sortierung "Zuletzt gescannt oben")
function getItemAddedTimestamp(item) {
  if (!item) return 0;
  if (item.addedTimestamp && Number(item.addedTimestamp) > 0) {
    return Number(item.addedTimestamp);
  }
  const idMatch = String(item.id || '').match(/^p_(\d{10,15})/);
  if (idMatch) {
    return Number(idMatch[1]);
  }
  if (item.updatedAt && Number(item.updatedAt) > 0) {
    return Number(item.updatedAt);
  }
  return 0;
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

  // 5 Haupt-Tabs: 'agenda' | 'tasks' | 'scanner' | 'shopping' | 'stock'
  const [activeTab, setActiveTab] = useState('scanner');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [todayStr] = useState(() => formatDateStr(new Date()));

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

  // Einkaufswagen-State (für alle gescannten Produkte & Kassenbons vor dem Einbuchen in den Bestand)
  const [cartItems, setCartItems] = useState([]);

  // Filter & Sortierung für den eigenen Tab "🥫 Bestand"
  const [stockSortMode, setStockSortMode] = useState('newest'); // 'newest' (Zuletzt gescannt oben) | 'expiry' (MHD)
  const [stockLocationFilter, setStockLocationFilter] = useState('all');
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStockQty, setEditStockQty] = useState('');

  // Android PWA / APK State & Supermarkt-Offline-Schutz
  const [notifPermission, setNotifPermission] = useState('default');
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const knownShoppingTextsRef = useRef(null);
  const pendingOfflineSaveRef = useRef(false);

  // Sync-Refs
  const preservedWallStateRef = useRef({});
  const syncMetaRef = useRef({ deletedPantryIds: {}, deletedTrashIds: {}, deletedTaskIds: {}, deletedEventIds: {} });
  const pendingCalendarOpsRef = useRef({});
  const isNetworkSavingRef = useRef(false);
  const lastLocalEditRef = useRef(0);

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, msg, icon = '📲') => {
    setToast({ title, msg, icon });
    setTimeout(() => setToast(null), 3500);
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

  // Sortierter Bestand für den Tab "🥫 Bestand" (Standard: Zuletzt gescanntes Produkt ganz oben!)
  const sortedStockForTab = useMemo(() => {
    return safeStock
      .filter(it => stockLocationFilter === 'all' || it.location === stockLocationFilter)
      .sort((a, b) => {
        if (stockSortMode === 'newest') {
          return getItemAddedTimestamp(b) - getItemAddedTimestamp(a);
        }
        return String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'));
      });
  }, [safeStock, stockLocationFilter, stockSortMode]);

  // Einkaufswagen lokal auf dem Smartphone zwischenspeichern
  const updateCartAndPersist = (nextCart) => {
    const clean = Array.isArray(nextCart) ? nextCart : [];
    setCartItems(clean);
    try {
      localStorage.setItem('richter_tw_pocket_cart_v1', JSON.stringify(clean));
    } catch (e) {}
  };

  // =========================================================
  // ANDROID PWA / APK INITIALISIERUNG
  // =========================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedCart = localStorage.getItem('richter_tw_pocket_cart_v1');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) setCartItems(parsedCart);
      }
    } catch (e) {}

    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#111418';
      document.head.appendChild(meta);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

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

  const requestShoppingPushPermission = async () => {
    playMobileBeep('shopping');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Ton- & Vibrations-Alarm aktiv', 'Du wirst bei neuen Einkäufen sofort benachrichtigt.', '🔔');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('🛒 Einkaufslisten-Push aktiv!', {
            body: 'Du erhältst sofort eine Nachricht in der Statusleiste, sobald etwas auf der Einkaufsliste landet.',
            vibrate: [180, 90, 220],
            tag: 'tw-shopping-test'
          });
        } else {
          new Notification('🛒 Einkaufslisten-Push aktiv!', {
            body: 'Du erhältst sofort eine Nachricht, sobald etwas auf der Einkaufsliste landet.'
          });
        }
        showToast('Push aktiviert!', 'Android-Benachrichtigungen für die Einkaufsliste sind scharf.', '🔔');
      }
    } catch (e) {}
  };

  const triggerShoppingPhoneNotification = async (addedNamesList) => {
    if (!Array.isArray(addedNamesList) || addedNamesList.length === 0) return;
    const summaryText = addedNamesList.join(', ');
    playMobileBeep('shopping');
    try { navigator.vibrate?.([180, 90, 220]); } catch (e) {}
    showToast('🛒 Neu auf der Einkaufsliste!', summaryText, '🛒');

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('🛒 Neu auf der Einkaufsliste (' + addedNamesList.length + ')', {
            body: summaryText,
            vibrate: [200, 100, 250],
            tag: 'tw-shopping-' + Date.now()
          });
        } else {
          new Notification('🛒 Neu auf der Einkaufsliste (' + addedNamesList.length + ')', {
            body: summaryText
          });
        }
      } catch (e) {}
    }
  };

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

  const applyRemoteBundle = (bundle) => {
    if (!bundle) return;
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
      if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0 && hasJsonChanged(safeNotes, s.familyNotes)) setFamilyNotes(s.familyNotes);
      if (s.schoolData?.dean) setSchoolData(s.schoolData);
      if (Array.isArray(s.familyTasks) && hasJsonChanged(safeTasks, s.familyTasks)) setFamilyTasks(s.familyTasks);

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
      if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
    }

    if (Array.isArray(bundle?.calendarData?.events)) {
      const guardedEvents = mergeCalendarEventsSafe(bundle.calendarData.events, pendingCalendarOpsRef, syncMetaRef.current);
      if (hasJsonChanged(safeEvents, guardedEvents)) {
        setEvents(guardedEvents);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(guardedEvents)); } catch (e) {}
      }
    }
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

  const syncAllNow = async (showFeedback = false, accOverride = undefined, keyOverride = undefined) => {
    const activeAcc = accOverride !== undefined ? accOverride : accountId;
    const activeKey = keyOverride !== undefined ? keyOverride : authKey;
    if (!showFeedback && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 7000)) return;

    if (showFeedback) setIsSyncing(true);
    try {
      if (activeAcc && activeAcc !== 'local') {
        const bundle = await callCloudBackend({
          action: 'loadBundle',
          accountId: activeAcc,
          authKey: activeKey
        });
        if (!showFeedback && (isNetworkSavingRef.current || Date.now() - lastLocalEditRef.current < 5000)) return;
        if (bundle?.ok) applyRemoteBundle(bundle);
      }
      if (todoistConfig?.apiToken?.trim()) {
        const pulled = await pullFromTodoistTwoWay(
          todoistConfig.apiToken,
          todoistConfig,
          safeTasks,
          safeNotes,
          safeMembers
        );
        if (pulled) {
          if (Array.isArray(pulled.tasks) && hasJsonChanged(safeTasks, pulled.tasks)) setFamilyTasks(pulled.tasks);
          if (Array.isArray(pulled.familyNotes) && hasJsonChanged(safeNotes, pulled.familyNotes)) setFamilyNotes(pulled.familyNotes);
        }
      }
      if (showFeedback) showToast('Synchronisiert', 'Alle 4 Kanäle mit der Touchwall abgeglichen.', '✅');
    } catch (e) {} finally {
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
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accountId, authKey]);

  // =========================================================
  // NEUE EINKAUFSWAGEN-LOGIK (SCANS LANDEN ZUERST IM EINKAUFSWAGEN!)
  // =========================================================
  const handleAddSingleToCart = (nameVal, barcodeVal, qtyVal, locVal, catVal, expVal, imgVal) => {
    const now = Date.now();
    const newCartEntry = {
      id: 'cart_' + now + '_' + Math.floor(Math.random() * 1000),
      name: nameVal,
      barcode: barcodeVal || '',
      quantity: qtyVal || '1x',
      location: locVal || 'kitchen',
      category: catVal || detectFoodCategory(nameVal),
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
    const newCartEntries = selectedList.map((it, idx) => ({
      id: 'cart_' + now + '_' + idx + '_' + Math.floor(Math.random() * 1000),
      name: it.name.trim(),
      barcode: '',
      quantity: it.quantity || '1x',
      location: it.location || 'fridge',
      category: detectFoodCategory(it.name, it.category),
      expiryDate: it.expiryDate,
      imageUrl: '',
      // Höchster Zeitstempel für den ersten Eintrag, damit die Reihenfolge oben im Einkaufswagen stimmt
      scannedAt: now + (total - idx)
    }));
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
    const newStockItem = {
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      name: cartItem.name,
      barcode: cartItem.barcode || '',
      quantity: cartItem.quantity || '1x',
      location: cartItem.location || 'kitchen',
      category: cartItem.category || detectFoodCategory(cartItem.name),
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
    // Sortiere Einkaufswagen (neuestes oben) und vergib absteigende addedTimestamps, damit das neueste auch im Bestand ganz oben bleibt!
    const sorted = [...safeCart].sort((a, b) => Number(b.scannedAt || 0) - Number(a.scannedAt || 0));
    const total = sorted.length;

    const newStockEntries = sorted.map((cItem, idx) => {
      const stamp = now + (total - idx);
      return {
        id: 'p_' + stamp + '_' + Math.floor(Math.random() * 1000),
        name: cItem.name,
        barcode: cItem.barcode || '',
        quantity: cItem.quantity || '1x',
        location: cItem.location || 'kitchen',
        category: cItem.category || detectFoodCategory(cItem.name),
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

  // =========================================================
  // BESTANDS-, TERMIN-, AUFGABEN- & EINKAUFSLISTEN-HANDLER
  // =========================================================
  const handleUpdateStockQty = async (itemId, newQtyStr) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const nextStock = safeStock.map(x =>
      x.id === itemId ? { ...x, quantity: newQtyStr, updatedAt: now, fromMobile: true } : x
    );
    setPantryItems(nextStock);
    await saveStateToCloud({ pantryItems: nextStock });
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
      showToast('1 Stück verzehrt!', item.name + ' → Rest: ' + dec.nextQtyStr, getFoodEmoji(item.name));
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
    lastLocalEditRef.current = Date.now();
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
      id: Date.now(),
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
      fromMobile: true
    };
    const nextTasks = [newTask, ...safeTasks];
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
    showToast('Aufgabe & Push gesendet!', cleanTitle + ' → ' + memberObj.name, '✅');
  };

  const handleToggleMobileTask = async (task) => {
    lastLocalEditRef.current = Date.now();
    const nextDone = !task.done;
    const nextTasks = safeTasks.map(t => t.id === task.id ? { ...t, done: nextDone, fromMobile: true } : t);
    setFamilyTasks(nextTasks);
    await saveStateToCloud({ familyTasks: nextTasks });
    if (task.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, task.todoistId, nextDone); } catch (e) {}
    }
  };

  const handleAddQuickShopItem = async (clean) => {
    lastLocalEditRef.current = Date.now();
    const firstNote = safeNotes[0] || { id: 1, title: '🛒 Einkaufsliste', items: [] };
    const projId = firstNote.todoistProjectId || todoistConfig?.shoppingProjectId || '';

    if (knownShoppingTextsRef.current) {
      knownShoppingTextsRef.current.add(clean.toLowerCase());
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
      items: [{ text: clean, done: false, todoistId, fromMobile: true }, ...(Array.isArray(n.items) ? n.items : [])]
    } : n);
    setFamilyNotes(nextNotes);
    triggerShoppingPhoneNotification([clean]);
    await saveStateToCloud({ familyNotes: nextNotes });
  };

  // Speichert beim Abhaken den Zeitstempel doneAt, damit das zuletzt abgehakte Produkt im Einkaufswagen ganz oben steht!
  const handleToggleShopItem = async (itemIdx) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const firstNote = safeNotes[0];
    const item = firstNote?.items?.[itemIdx];
    if (!item) return;
    const nextDone = !item.done;
    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).map((it, i) =>
        i === itemIdx ? { ...it, done: nextDone, doneAt: nextDone ? now : 0, fromMobile: true } : it
      )
    } : n);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ familyNotes: nextNotes });
    if (item.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
  };

  const handleMoveBoughtItemToPantry = async (shopItem, mhdDays = 7) => {
    const now = Date.now();
    lastLocalEditRef.current = now;
    const expStr = formatDateStr(addDays(new Date(), mhdDays));
    const newItem = {
      id: 'p_' + now + '_' + Math.floor(Math.random() * 1000),
      name: shopItem.text,
      quantity: '1x',
      location: 'fridge',
      category: detectFoodCategory(shopItem.text),
      expiryDate: expStr,
      addedAt: todayStr,
      addedTimestamp: now,
      updatedAt: now,
      fromMobile: true
    };
    const nextStock = [newItem, ...safeStock];
    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter((_, i) => i !== shopItem.origIdx)
    } : n);
    setPantryItems(nextStock);
    setFamilyNotes(nextNotes);
    await saveStateToCloud({ pantryItems: nextStock, familyNotes: nextNotes });
    showToast('In Bestand gebucht!', shopItem.text + ' (MHD: +' + mhdDays + 'T)', getFoodEmoji(shopItem.text));
  };

  const handleMoveAllBoughtToPantry = async (boughtList, mhdDays = 7) => {
    if (!Array.isArray(boughtList) || boughtList.length === 0) return;
    const now = Date.now();
    lastLocalEditRef.current = now;
    const expStr = formatDateStr(addDays(new Date(), mhdDays));
    const total = boughtList.length;

    const newItems = boughtList.map((it, idx) => {
      const stamp = now + (total - idx);
      return {
        id: 'p_' + stamp + '_' + Math.floor(Math.random() * 1000),
        name: it.text,
        quantity: '1x',
        location: 'fridge',
        category: detectFoodCategory(it.text),
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
      applyRemoteBundle(res);
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

      {/* OBERER HEADER (IM SCANNER-TAB KOMPLETT AUSGEBLENDET FÜR MAXIMALEN FOKUS) */}
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
                title="Einkaufslisten-Push aktivieren"
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

      {/* HAUPT-CONTENT MIT DEN 5 TABS */}
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
            />
          )}

          {/* =========================================================
              NEUER 5. TAB: EIGENE KATEGORIE "🥫 BESTAND"
              SORTIERT NACH ZULETZT GESCANNTEM / HINZUGEFÜGTEM PRODUKT GANZ OBEN!
             ========================================================= */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              <div className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-black text-base flex items-center gap-1.5">
                      <span>🥫 Speisekammer-Bestand ({sortedStockForTab.length})</span>
                    </h2>
                    <p className="text-[11px] opacity-75 font-semibold">
                      {stockSortMode === 'newest'
                        ? '🕒 Sortiert: Zuletzt gescanntes Produkt steht ganz oben'
                        : '📅 Sortiert: Bald ablaufende Produkte (MHD) zuerst'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStockSortMode(prev => prev === 'newest' ? 'expiry' : 'newest')}
                    className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{stockSortMode === 'newest' ? '🕒 Neueste oben' : '📅 Nach MHD'}</span>
                  </button>
                </div>

                {/* LAGERORT-FILTER */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
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

              <div className={'p-3 rounded-3xl border space-y-1.5 ' + themeStyles.card}>
                {sortedStockForTab.length === 0 ? (
                  <div className="py-8 text-center text-xs opacity-50 font-bold">
                    🥫 Noch keine Produkte in dieser Auswahl.
                  </div>
                ) : (
                  sortedStockForTab.map((item, idx) => {
                    const catObj = FOOD_CATEGORIES.find(c => c.id === detectFoodCategory(item.name, item.category)) || FOOD_CATEGORIES[1];
                    const locObj = STORAGE_PILLS.find(l => l.id === item.location) || STORAGE_PILLS[0];
                    const decPreview = decrementItemPieceCount(item.quantity);
                    const isNewestTop = stockSortMode === 'newest' && idx === 0;

                    return (
                      <div
                        key={item.id}
                        className={'px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ' +
                          (isNewestTop ? 'border-sky-400/70 bg-sky-500/10' : themeStyles.subtle)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xl shrink-0">{getFoodEmoji(item.name)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isNewestTop && (
                                <span className="px-1.5 py-0.2 rounded bg-sky-500 text-white text-[9px] font-black shrink-0">
                                  ZULETZT HINZUGEFÜGT
                                </span>
                              )}
                              <span className="font-extrabold text-xs truncate">{item.name}</span>
                            </div>
                            <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span>{item.quantity}</span>
                              <span>•</span>
                              <span>{locObj.label}</span>
                              <span>•</span>
                              <span>MHD: {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.{item.expiryDate.slice(2, 4)}</span>
                              <span className="text-sky-300 opacity-85 truncate">• {catObj.icon}</span>
                            </div>
                          </div>
                        </div>

                        {editingStockId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editStockQty}
                              onChange={(e) => setEditStockQty(e.target.value)}
                              className={'w-16 px-2 py-1.5 rounded-lg border text-xs font-bold ' + themeStyles.input}
                            />
                            <button
                              onClick={() => {
                                handleUpdateStockQty(item.id, editStockQty || '1x');
                                setEditingStockId(null);
                              }}
                              className="tw-glow-btn p-2 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingStockId(item.id);
                                setEditStockQty(item.quantity);
                              }}
                              className="tw-nav-inactive p-2 rounded-xl text-sky-300"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleConsumeFromPocket(item)}
                              className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black"
                            >
                              {decPreview.remaining > 0 ? '🍽️ -1' : '🍽️ Weg'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* UNTERE 5ER-DAUMEN-NAVIGATION MIT EIGENER KATEGORIE "BESTAND" */}
      <nav className={'shrink-0 z-40 border-t px-2 py-2 flex items-center justify-around gap-1 shadow-2xl ' + themeStyles.header}>
        {[
          { id: 'agenda',   label: 'Kalender', icon: Calendar,     badge: filteredEvents.filter(e => e.date === todayStr).length },
          { id: 'tasks',    label: 'Aufgaben', icon: CheckSquare,  badge: openTasks.length },
          { id: 'scanner',  label: 'Scanner',  icon: Camera,       badge: safeCart.length },
          { id: 'shopping', label: 'Einkauf',  icon: ShoppingCart, badge: openShop.length + safeCart.length },
          { id: 'stock',    label: 'Bestand',  icon: Package,      badge: safeStock.length }
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
                <span className="absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
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
