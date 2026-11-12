// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, Camera,
  Plus, RefreshCw, Smartphone, LogOut, Send, Trash2,
  X, ScanLine, FileText, ChevronLeft, ChevronRight, Pencil, Check, Cloud
} from 'lucide-react';

import * as Cfg from '../touchwallConfig';

function getFoodEmoji(nameStr) {
  const n = String(nameStr || '').toLowerCase();
  if (/bratwurst|wurst|würstchen|wiener|lyoner|aufschnitt|schinken|salami|speck/.test(n)) return '🌭';
  if (/clementine|mandarine|orange|apfelsine/.test(n)) return '🍊';
  if (/apfel|äpfel|elstar|boskoop|pink lady|rotkohl/.test(n)) return '🍎';
  if (/banane/.test(n)) return '🍌';
  if (/erdbeer|himbeer|heidelbeer|blaubeer|beeren|kirsch/.test(n)) return '🍓';
  if (/zitrone|limette/.test(n)) return '🍋';
  if (/salat|eisberg|kopfsalat|rucola|feldsalat|spinat|dressing|kräuter/.test(n)) return '🥬';
  if (/gurke/.test(n)) return '🥒';
  if (/tomate|passierte/.test(n)) return '🍅';
  if (/paprika/.test(n)) return '🫑';
  if (/karotte|möhre/.test(n)) return '🥕';
  if (/kartoffel|pommes|gnocchi|schupfnudel/.test(n)) return '🥔';
  if (/zwiebel|knoblauch/.test(n)) return '🧅';
  if (/brokkoli|blumenkohl|spargel/.test(n)) return '🥦';
  if (/mais/.test(n)) return '🌽';
  if (/pilz|champignon/.test(n)) return '🍄';
  if (/avocado/.test(n)) return '🥑';
  if (/käse|frischkäse|philadelphia|scheibenkäse|gouda|mozzarella|parmesan|emmentaler|camembert|feta/.test(n)) return '🧀';
  if (/milch|vollmilch|hafermilch|kakao/.test(n)) return '🥛';
  if (/butter|margarine/.test(n)) return '🧈';
  if (/joghurt|quark|pudding|schmand|sahne|creme/.test(n)) return '🥣';
  if (/ei|eier/.test(n)) return '🥚';
  if (/hähnchen|huhn|pute|geflügel|nuggets/.test(n)) return '🍗';
  if (/hackfleisch|rinderhack|rind|steak|fleisch|schnitzel|gulasch/.test(n)) return '🥩';
  if (/fisch|lachs|thunfisch|fischstäbchen|forelle/.test(n)) return '🐟';
  if (/nudel|spaghetti|pasta|penne|tortellini|ravioli|spätzle/.test(n)) return '🍝';
  if (/reis|basmati|jasmin|milchreis/.test(n)) return '🍚';
  if (/brot|brötchen|toast|baguette|croissant/.test(n)) return '🥖';
  if (/pizza|flammkuchen/.test(n)) return '🍕';
  if (/wrap|taco|tortilla/.test(n)) return '🌮';
  if (/senf|thomy|ketchup|mayo|soße|sauce|pesto|öl|essig/.test(n)) return '🥫';
  if (/mehl|zucker|salz|haferflocken|müsli|cornflakes/.test(n)) return '🌾';
  if (/schokolade|nutella|keks|gummibär|chips|eis/.test(n)) return '🍫';
  if (/wasser|saft|cola|limo|bier|wein|kaffee|tee/.test(n)) return '🧃';
  return '🥫';
}

const {
  formatDateStr,
  addDays,
  getMonday,
  getISOWeek,
  WEEKDAYS_SHORT,
  MONTHS_NAMES,
  getBWHolidayName,
  getBWVacationName,
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
  pushTodoistTaskToPhoneNow
} = Cfg;

const PUBLIC_CLOUD_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzBs3ewHvp78OCIgWQkOQ80vXyKcM6wR5hQSn-WfYPU4puS7Gu0lPCX0KMwkxzeDxoE4g/exec';

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

// Verlustfreies Zusammenführen von Vorratslisten (Handy + Touchwall)
function mergeByIdList(localList, remoteList, deletedIdsSet = new Set()) {
  const map = new Map();
  (Array.isArray(remoteList) ? remoteList : []).forEach(item => {
    if (item && item.id && !deletedIdsSet.has(String(item.id))) {
      map.set(String(item.id), item);
    }
  });
  (Array.isArray(localList) ? localList : []).forEach(item => {
    if (item && item.id && !deletedIdsSet.has(String(item.id))) {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
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

  // 4 Haupt-Kategorien (Ohne Skill Board - Mobile zählt nicht für Quests!)
  const [activeTab, setActiveTab] = useState('scanner'); // 'agenda' | 'tasks' | 'scanner' | 'shopping'
  const [calendarSubView, setCalendarSubView] = useState('week'); // 'week' | 'month' | 'list'
  const [calCursorDate, setCalCursorDate] = useState(() => new Date());
  const [selectedMonthDayStr, setSelectedMonthDayStr] = useState(() => formatDateStr(new Date()));

  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [todayStr] = useState(() => formatDateStr(new Date()));

  // Gemeinsame Familiendaten
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

  // Bewahrt Touchwall-Felder (wie skillBoardData & customLogoUrl) im Hintergrund auf,
  // damit das Handy sie beim Speichern niemals überschreibt!
  const preservedWallStateRef = useRef({});
  const deletedPantryIdsRef = useRef(new Set());

  // Scanner-State (Kamera-Barcode, MHD-OCR & Kassenbon)
  const [scannerMode, setScannerMode] = useState('barcode');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('kitchen');
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);

  const [detectedMhdCandidate, setDetectedMhdCandidate] = useState('');
  const [lastOcrRawHint, setLastOcrRawHint] = useState('');
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [autoMhdScanEnabled, setAutoMhdScanEnabled] = useState(true);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStockQty, setEditStockQty] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const mhdAutoLoopRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isReadingMhdRef = useRef(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState(() => formatDateStr(new Date()));
  const [newEvTime, setNewEvTime] = useState('15:00 - 16:00');
  const [newEvMember, setNewEvMember] = useState('all');

  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickTaskMember, setQuickTaskMember] = useState('hans');
  const [quickShopText, setQuickShopText] = useState('');

  const lastLocalEditRef = useRef(0);

  const showToast = (title, msg, icon = '📲') => {
    setToast({ title, msg, icon });
    setTimeout(() => setToast(null), 3200);
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
    '.tw-glow-card, .tw-glow-subtle {',
    '  transition: background-color 0.2s ease, border-color 0.2s ease;',
    '}',
    '.tw-glow-btn {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 28%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 28%, var(--tw-btn-rest-base)) 100%) !important;',
    '  color: var(--tw-btn-rest-text) !important;',
    '  border: 1px solid color-mix(in srgb, var(--tw-btn-border) 38%, transparent) !important;',
    '  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease !important;',
    '}',
    '.tw-nav-inactive {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 12%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 12%, var(--tw-btn-rest-base)) 100%);',
    '  border: 1px solid rgba(255, 255, 255, 0.14);',
    '  transition: transform 0.16s ease, background 0.16s ease;',
    '}',
    '.tw-active-nav {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  border: 1.5px solid var(--tw-btn-border) !important;',
    '  box-shadow: 0 6px 16px -3px var(--tw-btn-glow) !important;',
    '}',
    '.tw-glow-btn:hover, .tw-glow-btn:active, .tw-nav-inactive:active {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  border-color: var(--tw-btn-border) !important;',
    '  box-shadow: 0 6px 18px -2px var(--tw-btn-glow) !important;',
    '}',
    'button:active {',
    '  transform: scale(0.95);',
    '}'
  ].join('\n');

  const callCloudBackend = async (postBody) => {
    const payload = {
      ...postBody,
      accountId: postBody.accountId !== undefined ? postBody.accountId : accountId,
      authKey: postBody.authKey !== undefined ? postBody.authKey : authKey
    };

    try {
      const proxyRes = await fetch('/api/todoist?_t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gasProxy',
          gasUrl: PUBLIC_CLOUD_BACKEND_URL,
          gasMethod: 'POST',
          gasBody: payload
        }),
        cache: 'no-store'
      });
      if (proxyRes.ok) {
        const d = await proxyRes.json();
        if (d && !d.notSupported && !d.error) return d;
      }
    } catch (e) {}

    const res = await fetch(PUBLIC_CLOUD_BACKEND_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return res.json();
  };

  const applyRemoteBundle = (bundle) => {
    if (!bundle) return;
    if (bundle.state) {
      const s = bundle.state;
      preservedWallStateRef.current = {
        ...preservedWallStateRef.current,
        skillBoardData: s.skillBoardData || preservedWallStateRef.current.skillBoardData || null,
        customLogoUrl: s.customLogoUrl || preservedWallStateRef.current.customLogoUrl || '',
        calendars: s.calendars || preservedWallStateRef.current.calendars || {}
      };
      if (s.familyName) setFamilyName(s.familyName);
      if (Array.isArray(s.members) && s.members.length >= 2) setMembers(s.members);
      if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
      if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
      if (s.schoolData?.dean) setSchoolData(s.schoolData);
      if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
      if (Array.isArray(s.pantryItems)) {
        setPantryItems(prev => mergeByIdList(prev, s.pantryItems, deletedPantryIdsRef.current));
      }
      if (Array.isArray(s.pantryTrash)) {
        setPantryTrash(prev => mergeByIdList(prev, s.pantryTrash));
      }
      if (s.currentTheme) setCurrentTheme(s.currentTheme);
      if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
    }
    if (Array.isArray(bundle?.calendarData?.events)) {
      setEvents(bundle.calendarData.events);
      try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(bundle.calendarData.events)); } catch (e) {}
    }
  };

  // =========================================================
  // SMART-MERGE CLOUD-SPEICHERUNG (ÜBERSCHREIBT NIEMALS TOUCHWALL-DATEN!)
  // =========================================================
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
      customLogoUrl: preservedWallStateRef.current.customLogoUrl || '',
      currentTheme,
      todoistConfig
    };

    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(basePayload)); } catch (e) {}

    if (!accountId || accountId === 'local') {
      showToast('Nur lokal gespeichert!', 'Bitte mit Familien-Konto anmelden, damit es auf der Touchwall landet.', '⚠️');
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Kurz aktuellen Cloud-Stand holen, damit nichts von der Touchwall verloren geht
      let mergedStock = localStockToSave;
      let mergedTrash = localTrashToSave;
      let latestSkillBoard = preservedWallStateRef.current.skillBoardData || null;
      let latestLogo = preservedWallStateRef.current.customLogoUrl || '';

      try {
        const freshBundle = await callCloudBackend({ action: 'loadBundle' });
        if (freshBundle?.ok && freshBundle.state) {
          const rs = freshBundle.state;
          if (rs.skillBoardData) latestSkillBoard = rs.skillBoardData;
          if (rs.customLogoUrl) latestLogo = rs.customLogoUrl;
          mergedStock = mergeByIdList(localStockToSave, rs.pantryItems, deletedPantryIdsRef.current);
          mergedTrash = mergeByIdList(localTrashToSave, rs.pantryTrash);
          setPantryItems(mergedStock);
          setPantryTrash(mergedTrash);
        }
      } catch (e) {}

      // 2. Zusammengeführtes Paket in die Cloud schreiben
      const finalPayload = {
        ...basePayload,
        pantryItems: mergedStock,
        pantryTrash: mergedTrash,
        skillBoardData: latestSkillBoard,
        customLogoUrl: latestLogo
      };

      await callCloudBackend({ action: 'saveState', payload: finalPayload });
    } catch (e) {
      showToast('Sync-Warnung', 'Bitte Internetverbindung prüfen.', '⚠️');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllNow = async (showFeedback = false, accOverride = undefined, keyOverride = undefined) => {
    const activeAcc = accOverride !== undefined ? accOverride : accountId;
    const activeKey = keyOverride !== undefined ? keyOverride : authKey;
    if (!showFeedback && Date.now() - lastLocalEditRef.current < 4500) return;

    if (showFeedback) setIsSyncing(true);
    try {
      if (activeAcc && activeAcc !== 'local') {
        const bundle = await callCloudBackend({
          action: 'loadBundle',
          accountId: activeAcc,
          authKey: activeKey
        });
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
          if (Array.isArray(pulled.tasks)) setFamilyTasks(pulled.tasks);
          if (Array.isArray(pulled.familyNotes)) setFamilyNotes(pulled.familyNotes);
        }
      }
      if (showFeedback) showToast('Synchronisiert', 'Alle Daten mit der Touchwall abgeglichen.', '✅');
    } catch (e) {} finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  useEffect(() => {
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

  // Automatischer Hintergrund-Abgleich alle 8 Sekunden
  useEffect(() => {
    if (!isAuthenticated || !accountId || accountId === 'local') return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllNow(false);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accountId, authKey]);

  const stopCameraStream = () => {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const extractExpiryDateFromText = (rawText) => {
    const clean = String(rawText || '')
      .replace(/[|lI!]/g, '1')
      .replace(/O/g, '0')
      .replace(/S(?=\d)/g, '5')
      .replace(/B(?=\d)/g, '8');

    const dmyRegex = /(0?[1-9]|[12][0-9]|3[01])\s*[.,/\-\s:·•_]+\s*(0?[1-9]|1[0-2])\s*[.,/\-\s:·•_]+\s*(20[2-3][0-9]|[2-3][0-9])\b/g;
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

    const myRegex = /\b(0?[1-9]|1[0-2])\s*[.,/\-:]+\s*(20[2-3][0-9])\b/g;
    while ((match = myRegex.exec(clean)) !== null) {
      const month = String(match[1]).padStart(2, '0');
      const year = String(match[2]);
      return year + '-' + month + '-28';
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
    if (!silentMode) {
      showToast('Scanne MHD-Datum...', 'Lese Aufdruck im Zielrahmen...', '📅');
    }

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

      const vid = videoRef.current;
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 480;

      const cropX = Math.floor(vw * 0.08);
      const cropY = Math.floor(vh * 0.2);
      const cropW = Math.floor(vw * 0.84);
      const cropH = Math.floor(vh * 0.6);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(1.75) grayscale(1) brightness(1.08)';
      ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const result = await window.Tesseract.recognize(canvas
