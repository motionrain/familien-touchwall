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
          const rs = freshBundl
