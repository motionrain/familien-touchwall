// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, Camera,
  Plus, RefreshCw, Smartphone, LogOut, Send, Trash2, Utensils,
  X, ScanLine, FileText, ChevronLeft, ChevronRight, Pencil, Check
} from 'lucide-react';

import * as Cfg from '../touchwallConfig';
import { getFoodEmoji } from '../PantrySection';

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

  // 4 Haupt-Kategorien (Ohne Schule!)
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'tasks' | 'scanner' | 'shopping'
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

  // Scanner-State (Kamera-Barcode, Kassenbon-OCR & Pflicht-MHD)
  const [scannerMode, setScannerMode] = useState('barcode');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('fridge');
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStockQty, setEditStockQty] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

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

  // Originales Touchwall-Button- & Card-Styling
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
      if (s.familyName) setFamilyName(s.familyName);
      if (Array.isArray(s.members) && s.members.length >= 2) setMembers(s.members);
      if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
      if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
      if (s.schoolData?.dean) setSchoolData(s.schoolData);
      if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
      if (Array.isArray(s.pantryItems)) setPantryItems(s.pantryItems);
      if (Array.isArray(s.pantryTrash)) setPantryTrash(s.pantryTrash);
      if (s.currentTheme) setCurrentTheme(s.currentTheme);
      if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
    }
    if (Array.isArray(bundle?.calendarData?.events)) {
      setEvents(bundle.calendarData.events);
      try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(bundle.calendarData.events)); } catch (e) {}
    }
  };

  const saveStateToCloud = async (overrides = {}) => {
    const payload = {
      isConfigured: true,
      familyName,
      members: safeMembers,
      mealPlan: overrides.mealPlan || safeMeals,
      familyNotes: overrides.familyNotes || safeNotes,
      schoolData,
      familyTasks: overrides.familyTasks || safeTasks,
      pantryItems: overrides.pantryItems || safeStock,
      pantryTrash: overrides.pantryTrash || safeTrash,
      currentTheme,
      todoistConfig
    };
    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload)); } catch (e) {}
    if (!accountId || accountId === 'local') return;
    try {
      await callCloudBackend({ action: 'saveState', payload });
    } catch (e) {}
  };

  const syncAllNow = async (showFeedback = false, accOverride = undefined, keyOverride = undefined) => {
    const activeAcc = accOverride !== undefined ? accOverride : accountId;
    const activeKey = keyOverride !== undefined ? keyOverride : authKey;
    if (!showFeedback && Date.now() - lastLocalEditRef.current < 4000) return;

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
      if (showFeedback) showToast('Synchronisiert', 'Kalender, Aufgaben & Vorrat sind aktuell.', '✅');
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

  // Zusatz-States für Endlos-Scanner & Live-MHD-Texterkennung
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [autoSaveWhenComplete, setAutoSaveWhenComplete] = useState(false);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  const stopCameraStream = () => {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  // Hilfsfunktion: Erkennt deutsche & internationale Datumsformate auf Verpackungen
  const extractExpiryDateFromText = (rawText) => {
    const clean = String(rawText || '').replace(/[|lI]/g, '1').replace(/O/g, '0');

    // 1. Format: TT.MM.JJJJ oder TT.MM.JJ (auch mit / - oder Leerzeichen)
    const dmyRegex = /\b(0?[1-9]|[12][0-9]|3[01])\s*[.,/\-\s]\s*(0?[1-9]|1[0-2])\s*[.,/\-\s]\s*(20[2-3][0-9]|[2-3][0-9])\b/g;
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

    // 2. Format: MM.JJJJ oder MM/JJJJ (z.B. "Mindestens haltbar bis Ende: 08.2027")
    const myRegex = /\b(0?[1-9]|1[0-2])\s*[.,/\-]\s*(20[2-3][0-9])\b/g;
    while ((match = myRegex.exec(clean)) !== null) {
      const month = String(match[1]).padStart(2, '0');
      const year = String(match[2]);
      return year + '-' + month + '-28';
    }

    return null;
  };

  // Liest das aufgedruckte MHD direkt aus dem laufenden Kamerabild
  const captureMhdFromLiveCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      showToast('Kamera nicht bereit', 'Bitte zuerst oben die Kamera einschalten.', '⚠️');
      return;
    }

    setIsReadingMhd(true);
    showToast('Lese Datum...', 'Halte das MHD ruhig in die Mitte des Kamerabilds...', '📅');

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

      // Mittleren Zielbereich ausschneiden (dort wo man das Datum hinhält)
      const cropX = Math.floor(vw * 0.1);
      const cropY = Math.floor(vh * 0.25);
      const cropW = Math.floor(vw * 0.8);
      const cropH = Math.floor(vh * 0.5);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(1.45) grayscale(1)';
      ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const result = await window.Tesseract.recognize(canvas, 'eng');
      const detectedText = result?.data?.text || '';
      const parsedDate = extractExpiryDateFromText(detectedText);

      if (parsedDate) {
        setScanExpiry(parsedDate);
        const niceDate = parsedDate.slice(8, 10) + '.' + parsedDate.slice(5, 7) + '.' + parsedDate.slice(0, 4);
        showToast('MHD erkannt!', 'Ablaufdatum ' + niceDate + ' wurde übernommen!', '✅');

        // Falls Auto-Speichern aktiv ist und Produktname schon da ist -> sofort einbuchen!
        if (autoSaveWhenComplete && scanName.trim()) {
          saveProductDirectly(scanName.trim(), scannedBarcode, scanQty, scanLocation, parsedDate, scanImageUrl);
        }
      } else {
        showToast('Datum nicht klar erkennbar', 'Bitte etwas näher herangehen oder Schnell-Tasten (+1 Woche) nutzen.', '🔍');
      }
    } catch (err) {
      showToast('MHD-Scan Hinweis', 'Bitte Datum kurz näher vor die Kamera halten.', '⚠️');
    } finally {
      setIsReadingMhd(false);
    }
  };

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
        const foundName = p.product_name_de || p.product_name || p.generic_name_de || '';
        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const qty = p.quantity || '1x';
        const img = p.image_front_small_url || p.image_thumb_url || '';
        const fullTitle = [brand, foundName].filter(Boolean).join(' ').trim();
        if (img) setScanImageUrl(img);
        if (fullTitle) {
          setScanName(fullTitle);
          setScanQty(qty);
          showToast('Produkt erkannt!', fullTitle + ' – Kamera bleibt an für MHD-Scan!', getFoodEmoji(fullTitle));
          return;
        }
      }
      showToast('Barcode gescannt', 'Code ' + cleanCode + ' – bitte Namen & MHD ergänzen.', '📷');
    } catch (e) {
      showToast('Barcode erfasst', 'Code: ' + cleanCode, '📷');
    } finally {
      setIsLookingUpProduct(false);
    }
  };

  // ENDLOS-KAMERA: Schließt sich NICHT mehr nach dem Scannen!
  const startLiveBarcodeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Kontinuierlichen Autofokus aktivieren (wichtig für kleines MHD-Datum)
      const track = stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }

      streamRef.current = stream;
      setCameraActive(true);
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
              // Verhindert Dauer-Schleife beim selben Barcode, lässt Kamera aber offen!
              if (rawVal && (rawVal !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 6000)) {
                lastScannedCodeRef.current = rawVal;
                lastScanTimeRef.current = now;
                lookupBarcodeOnOpenFoodFacts(rawVal);
              }
            }
          } catch (err) {}
        }, 450);
      }
    } catch (err) {
      showToast('Kamera-Zugriff', 'Bitte erlaube den Kamera-Zugriff im Browser.', '⚠️');
    }
  };

  const handleReceiptPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningReceipt(true);
    showToast('Analysiere Kassenbon...', 'Texterkennung liest deine Einkäufe aus...', '🧾');

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

      const defaultExp = formatDateStr(addDays(new Date(), 7));
      const extracted = lines.slice(0, 15).map((txt, idx) => ({
        id: 'rec_' + Date.now() + '_' + idx,
        name: txt,
        quantity: '1x',
        location: 'fridge',
        expiryDate: defaultExp,
        selected: true
      }));

      setReceiptItems(extracted);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt – bitte MHD prüfen.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen oder direkt eingeben.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const saveProductDirectly = (nameVal, barcodeVal, qtyVal, locVal, expVal, imgVal) => {
    lastLocalEditRef.current = Date.now();
    const newItem = {
      id: 'p_' + Date.now(),
      name: nameVal,
      barcode: barcodeVal || '',
      quantity: qtyVal || '1x',
      location: locVal || 'fridge',
      expiryDate: expVal,
      imageUrl: imgVal || '',
      addedAt: todayStr
    };

    const nextStock = [newItem, ...safeStock];
    setPantryItems(nextStock);
    saveStateToCloud({ pantryItems: nextStock });

    // Felder leeren für den nächsten Scan (Kamera läuft einfach weiter!)
    setScanName('');
    setScannedBarcode('');
    setScanExpiry('');
    setScanImageUrl('');
    lastScannedCodeRef.current = '';
    showToast('Gespeichert! Nächstes Produkt...', newItem.name + ' (MHD: ' + expVal + ')', getFoodEmoji(newItem.name));
  };

  const handleSaveScannedProduct = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!scanName.trim() || !scanExpiry) {
      showToast('Pflichtfelder', 'Bitte Name und Ablaufdatum (MHD) eingeben.', '⚠️');
      return;
    }
    saveProductDirectly(scanName.trim(), scannedBarcode, scanQty.trim(), scanLocation, scanExpiry, scanImageUrl);
  };

  const handleSaveAllReceiptItems = () => {
    const selected = receiptItems.filter(it => it.selected && it.name.trim() && it.expiryDate);
    if (selected.length === 0) return;
    lastLocalEditRef.current = Date.now();
    const newEntries = selected.map(it => ({
      id: 'p_' + Date.now() + '_' + Math.random(),
      name: it.name.trim(),
      quantity: it.quantity || '1x',
      location: it.location || 'fridge',
      expiryDate: it.expiryDate,
      imageUrl: '',
      addedAt: todayStr
    }));

    const nextStock = [...newEntries, ...safeStock];
    setPantryItems(nextStock);
    saveStateToCloud({ pantryItems: nextStock });
    setReceiptItems([]);
    showToast('Kassenbon übernommen!', newEntries.length + ' Produkte gespeichert.', '🎉');
  };

  const handleConsumeFromPocket = (item) => {
    lastLocalEditRef.current = Date.now();
    const nextStock = safeStock.filter(x => x.id !== item.id);
    const nextTrash = [
      { ...item, trashedAt: todayStr, reason: 'consumed', reasonLabel: '🍽️ Verzehrt am ' + todayStr },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
    showToast('Verzehrt!', item.name + ' wurde ausgebucht.', '🍽️');
  };

  const handleCreateMobileEvent = async (e) => {
    e.preventDefault();
    if (!newEvTitle.trim()) return;
    lastLocalEditRef.current = Date.now();
    const targetMem = newEvMember || (selectedPerson === 'all' ? 'all' : selectedPerson);
    const newEv = {
      id: String(Date.now()),
      title: newEvTitle.trim(),
      date: newEvDate || todayStr,
      time: newEvTime.trim() || 'Ganztägig',
      member: targetMem,
      notifyTime: '30m',
      notifyChannel: 'wall_push',
      notifyUsers: [targetMem],
      fromGoogle: true
    };
    setEvents(prev => [...(Array.isArray(prev) ? prev : []), newEv]);
    setNewEvTitle('');
    setNewEventModalOpen(false);
    showToast('Termin gespeichert', newEv.title, '📅');

    if (accountId && accountId !== 'local') {
      try {
        const res = await callCloudBackend({ action: 'createEvent', event: newEv });
        if (res?.result?.events) setEvents(res.result.events);
      } catch (err) {}
    }
  };

  const handleDeleteMobileEvent = async (ev) => {
    lastLocalEditRef.current = Date.now();
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

  const handleAddQuickTask = async (e) => {
    e.preventDefault();
    const clean = quickTaskText.trim();
    if (!clean) return;
    lastLocalEditRef.current = Date.now();
    const targetMemberId = selectedPerson !== 'all' ? selectedPerson : quickTaskMember;
    const memberObj = safeMembers.find(m => m.id === targetMemberId) || safeMembers[1];
    const projId = memberObj?.todoistProjectId || todoistConfig?.tasksProjectId || '';

    let todoistId = null;
    if (todoistConfig?.apiToken && projId) {
      try {
        const created = await createTodoistTaskItem(
          todoistConfig.apiToken,
          projId,
          clean,
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
      title: clean,
      priority: 3,
      due: 'Heute bis 18:00 Uhr',
      dueDate: todayStr,
      dueTime: '18:00',
      notifyTime: '15m',
      done: false
    };
    const nextTasks = [newTask, ...safeTasks];
    setFamilyTasks(nextTasks);
    setQuickTaskText('');
    saveStateToCloud({ familyTasks: nextTasks });
    showToast('Aufgabe & Push gesendet!', clean + ' → ' + memberObj.name, '✅');
  };

  const handleToggleMobileTask = async (task) => {
    lastLocalEditRef.current = Date.now();
    const nextDone = !task.done;
    const nextTasks = safeTasks.map(t => t.id === task.id ? { ...t, done: nextDone } : t);
    setFamilyTasks(nextTasks);
    saveStateToCloud({ familyTasks: nextTasks });
    if (task.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, task.todoistId, nextDone); } catch (e) {}
    }
  };

  const handleAddQuickShopItem = async (e) => {
    e.preventDefault();
    const clean = quickShopText.trim();
    if (!clean) return;
    lastLocalEditRef.current = Date.now();
    const firstNote = safeNotes[0] || { id: 1, title: '🛒 Einkaufsliste', items: [] };
    const projId = firstNote.todoistProjectId || todoistConfig?.shoppingProjectId || '';

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
          false
        );
        if (created?.id) todoistId = String(created.id);
      } catch (err) {}
    }

    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: [{ text: clean, done: false, todoistId }, ...(Array.isArray(n.items) ? n.items : [])]
    } : n);
    setFamilyNotes(nextNotes);
    setQuickShopText('');
    saveStateToCloud({ familyNotes: nextNotes });
  };

  const handleToggleShopItem = async (itemIdx) => {
    lastLocalEditRef.current = Date.now();
    const firstNote = safeNotes[0];
    const item = firstNote?.items?.[itemIdx];
    if (!item) return;
    const nextDone = !item.done;
    const nextNotes = safeNotes.map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).map((it, i) => i === itemIdx ? { ...it, done: nextDone } : it)
    } : n);
    setFamilyNotes(nextNotes);
    saveStateToCloud({ familyNotes: nextNotes });
    if (item.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
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

  // Kalender-Navigation für Woche & Monat
  const navigateCalendarCursor = (dir) => {
    if (calendarSubView === 'month') {
      const next = new Date(calCursorDate.getFullYear(), calCursorDate.getMonth() + dir, 1);
      setCalCursorDate(next);
      setSelectedMonthDayStr(formatDateStr(next));
    } else {
      setCalCursorDate(addDays(calCursorDate, dir * 7));
    }
  };

  const weekMonday = useMemo(() => getMonday(calCursorDate), [calCursorDate]);
  const weekDaysList = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i)), [weekMonday]);

  // Monats-Raster (Mo-So) berechnen
  const monthGridCells = useMemo(() => {
    const year = calCursorDate.getFullYear();
    const month = calCursorDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Montag = 0
    const totalDays = lastDayOfMonth.getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [calCursorDate]);

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
                📱 Touchwall Pocket • Scanner & Familien-App
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

      {/* =========================================================
          FESTER OBERER HEADER (SHRINK-0 -> NICHTS RUTSCHT DARUNTER!)
         ========================================================= */}
      <header className={'shrink-0 z-30 px-3.5 pt-2.5 pb-2 border-b shadow-md ' + themeStyles.header}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white text-[10px] font-black">POCKET</span>
            <h1 className="font-extrabold text-sm sm:text-base truncate">{familyName}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => syncAllNow(true)} className="tw-glow-btn p-2 rounded-xl">
              <RefreshCw className={'w-3.5 h-3.5 ' + (isSyncing ? 'animate-spin' : '')} />
            </button>
            <a href="/" className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold no-underline">
              🖥️ Wand
            </a>
            <button
              onClick={() => {
                localStorage.removeItem('richter_tw_auth_active');
                setIsAuthenticated(false);
              }}
              className="tw-nav-inactive p-2 rounded-xl text-rose-400"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PERSONEN-FILTERLEISTE */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => {
              setSelectedPerson('all');
              try { localStorage.setItem('richter_tw_pocket_person', 'all'); } catch (e) {}
            }}
            className={'px-3 py-1 rounded-xl text-xs font-extrabold shrink-0 ' + (selectedPerson === 'all' ? 'tw-active-nav' : 'tw-nav-inactive')}
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
                  setQuickTaskMember(m.id);
                  try { localStorage.setItem('richter_tw_pocket_person', m.id); } catch (e) {}
                }}
                className={'pr-2.5 pl-1 py-0.5 rounded-xl flex items-center gap-1.5 text-xs font-extrabold shrink-0 ' + (isSel ? 'tw-active-nav' : 'tw-nav-inactive')}
              >
                {renderAvatar(m, 'w-5 h-5', 'text-[10px]')}
                <span>{m.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* =========================================================
          SEPARATER SCROLL-VIEWPORT (KEINE ÜBERLAPPUNG MIT DEM HEADER!)
         ========================================================= */}
      <main className={'flex-1 overflow-y-auto px-3.5 pt-3.5 pb-6 ' + themeStyles.viewport}>
        <div className="max-w-lg w-full mx-auto space-y-3.5">

          {/* =====================================================
              TAB 1: KALENDER (WOCHE / MONAT / TERMIN-ÜBERSICHT)
             ===================================================== */}
          {activeTab === 'agenda' && (
            <div className="space-y-3">
              {/* UMSCHALTER: WOCHE | MONAT | ÜBERSICHT + NEUER TERMIN */}
              <div className={'p-2.5 rounded-2xl border space-y-2.5 ' + themeStyles.card}>
                <div className="flex items-center justify-between gap-2">
                  <div className="grid grid-cols-3 gap-1 flex-1 p-1 rounded-xl bg-black/25">
                    {[
                      { id: 'week',  label: '📆 Woche' },
                      { id: 'month', label: '🗓️ Monat' },
                      { id: 'list',  label: '📋 Übersicht' }
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCalendarSubView(v.id)}
                        className={'py-1.5 rounded-lg text-xs font-extrabold ' + (calendarSubView === v.id ? 'tw-active-nav' : 'opacity-75')}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEvDate(selectedMonthDayStr || todayStr);
                      setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                      setNewEventModalOpen(true);
                    }}
                    className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Termin
                  </button>
                </div>

                {/* ZEITRAUM-NAVIGATION */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navigateCalendarCursor(-1)} className="tw-glow-btn w-7 h-7 rounded-xl flex items-center justify-center">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCalCursorDate(now);
                        setSelectedMonthDayStr(formatDateStr(now));
                      }}
                      className="tw-glow-btn px-2.5 py-1 rounded-xl text-xs font-extrabold"
                    >
                      Heute
                    </button>
                    <button onClick={() => navigateCalendarCursor(1)} className="tw-glow-btn w-7 h-7 rounded-xl flex items-center justify-center">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs font-black">
                    {calendarSubView === 'month'
                      ? (MONTHS_NAMES[calCursorDate.getMonth()] + ' ' + calCursorDate.getFullYear())
                      : ('KW ' + getISOWeek(weekMonday) + ' • ' + weekDaysList[0].getDate() + '.' + (weekDaysList[0].getMonth() + 1) + '. – ' + weekDaysList[6].getDate() + '.' + (weekDaysList[6].getMonth() + 1) + '.')}
                  </span>
                </div>
              </div>

              {/* ANSICHT A: WOCHENANSICHT (ALLE 7 TAGE DER WOCHE OPTIMAL LESBAR) */}
              {calendarSubView === 'week' && (
                <div className="space-y-2">
                  {weekDaysList.map(dayObj => {
                    const dStr = formatDateStr(dayObj);
                    const isToday = dStr === todayStr;
                    const hol = getBWHolidayName(dStr);
                    const vac = getBWVacationName(dStr);
                    const dayEvs = filteredEvents.filter(e => e.date === dStr);

                    return (
                      <div
                        key={dStr}
                        className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.card + (isToday ? ' ring-2 ring-orange-400' : '')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={'w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ' + (isToday ? 'bg-orange-500 text-white' : 'bg-black/30')}>
                              {WEEKDAYS_SHORT[dayObj.getDay()]}
                            </span>
                            <div>
                              <div className="font-extrabold text-xs sm:text-sm">
                                {dayObj.getDate()}. {MONTHS_NAMES[dayObj.getMonth()]}
                              </div>
                              {(hol || vac) && (
                                <div className="text-[10px] font-extrabold text-emerald-400">
                                  {hol ? ('🎌 ' + hol) : ('🏖️ ' + vac)}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setNewEvDate(dStr);
                              setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                              setNewEventModalOpen(true);
                            }}
                            className="tw-glow-btn w-7 h-7 rounded-xl font-black text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        {dayEvs.length === 0 ? (
                          <div className="text-[11px] opacity-45 pl-9">Keine Termine</div>
                        ) : (
                          <div className="space-y-1.5 pl-1">
                            {dayEvs.map(ev => {
                              const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                              const st = getMemberStyles(mem);
                              return (
                                <div
                                  key={ev.id}
                                  style={st.cardStyle}
                                  className="px-3 py-2 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                                >
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-xs leading-snug break-words">{ev.title}</div>
                                    <div className="text-[10px] font-bold opacity-90">
                                      ⏰ {ev.time || 'Ganztägig'} • {mem.name.split(' ')[0]}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteMobileEvent(ev)}
                                    className="p-1.5 rounded-lg bg-black/25 text-white/80 shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ANSICHT B: MONATSANSICHT (KOMPAKTES 7-SPALTEN RASTER + TAGES-DETAILS) */}
              {calendarSubView === 'month' && (
                <div className="space-y-3">
                  <div className={'p-3 rounded-3xl border ' + themeStyles.card}>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase opacity-70 mb-1.5">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => (
                        <div key={w}>{w}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {monthGridCells.map((cellDate, idx) => {
                        if (!cellDate) {
                          return <div key={'empty_' + idx} className="h-12 rounded-xl bg-black/10" />;
                        }
                        const dStr = formatDateStr(cellDate);
                        const isToday = dStr === todayStr;
                        const isSelected = dStr === selectedMonthDayStr;
                        const hol = getBWHolidayName(dStr);
                        const vac = getBWVacationName(dStr);
                        const dayEvs = filteredEvents.filter(e => e.date === dStr);

                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setSelectedMonthDayStr(dStr)}
                            className={'h-13 p-1 rounded-xl border flex flex-col items-center justify-between transition-all ' +
                              (isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 border-sky-400' : isToday ? 'border-orange-400 bg-orange-500/15' : themeStyles.subtle)}
                          >
                            <span className={'text-xs font-black ' + (isToday ? 'text-orange-400' : hol ? 'text-rose-400' : vac ? 'text-emerald-400' : '')}>
                              {cellDate.getDate()}
                            </span>

                            <div className="w-full flex flex-col gap-0.5 overflow-hidden">
                              {dayEvs.slice(0, 2).map(ev => {
                                const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                                const hex = COLOR_PALETTES[mem.color]?.hex || '#0ea5e9';
                                return (
                                  <span
                                    key={ev.id}
                                    style={{ backgroundColor: hex }}
                                    className="w-full px-1 rounded text-[8px] font-black text-white truncate leading-tight"
                                  >
                                    {ev.title}
                                  </span>
                                );
                              })}
                              {dayEvs.length > 2 && (
                                <span className="text-[8px] font-black text-sky-300">+{dayEvs.length - 2}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TAGES-DETAILS UNTER DEM MONATSRASTER */}
                  <div className={'p-3.5 rounded-3xl border space-y-2 ' + themeStyles.card}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-sky-400">
                        📅 Termine am {selectedMonthDayStr.slice(8, 10)}.{selectedMonthDayStr.slice(5, 7)}.{selectedMonthDayStr.slice(0, 4)}
                      </span>
                      <button
                        onClick={() => {
                          setNewEvDate(selectedMonthDayStr);
                          setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                          setNewEventModalOpen(true);
                        }}
                        className="tw-glow-btn px-3 py-1 rounded-xl text-xs font-black"
                      >
                        + Termin hier
                      </button>
                    </div>

                    {filteredEvents.filter(e => e.date === selectedMonthDayStr).length === 0 ? (
                      <div className="text-xs opacity-50 py-2">Keine Termine an diesem Tag.</div>
                    ) : (
                      filteredEvents
                        .filter(e => e.date === selectedMonthDayStr)
                        .map(ev => {
                          const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                          const st = getMemberStyles(mem);
                          return (
                            <div
                              key={ev.id}
                              style={st.cardStyle}
                              className="p-3 rounded-2xl flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-extrabold text-sm">{ev.title}</div>
                                <div className="text-xs opacity-90">⏰ {ev.time} • {mem.name}</div>
                              </div>
                              <button onClick={() => handleDeleteMobileEvent(ev)} className="p-1.5 rounded-xl bg-black/25">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* ANSICHT C: KOMPAKTE TERMIN-ÜBERSICHT (CHRONOLOGISCHE LISTE) */}
              {calendarSubView === 'list' && (
                <div className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
                  <h3 className="font-extrabold text-sm">📋 Alle kommenden Termine</h3>
                  {filteredEvents
                    .filter(e => e.date >= todayStr)
                    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
                    .slice(0, 25)
                    .map(ev => {
                      const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                      const st = getMemberStyles(mem);
                      return (
                        <div
                          key={ev.id}
                          style={st.cardStyle}
                          className="p-3 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs sm:text-sm truncate">{ev.title}</div>
                              <div className="text-[11px] font-bold opacity-90">
                                📅 {ev.date.slice(8, 10)}.{ev.date.slice(5, 7)}. • ⏰ {ev.time} • {mem.name.split(' ')[0]}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteMobileEvent(ev)} className="p-1.5 rounded-xl bg-black/25 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              TAB 2: AUFGABEN & TODOIST (SAUBER IM SCROLL-BEREICH)
             ===================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-3.5">
              <form onSubmit={handleAddQuickTask} className={'p-3.5 rounded-3xl border space-y-2.5 shadow-sm ' + themeStyles.card}>
                <div className="text-xs font-black uppercase text-sky-400">
                  ⚡ Neue Aufgabe (mit Sofort-Push aufs Handy)
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickTaskText}
                    onChange={(e) => setQuickTaskText(e.target.value)}
                    placeholder="Aufgabe eingeben..."
                    className={'flex-1 px-3.5 py-2.5 rounded-2xl border text-sm font-bold ' + themeStyles.input}
                  />
                  <button
                    type="submit"
                    className="tw-glow-btn px-4 rounded-2xl font-black text-xs flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-4 h-4" /> Push
                  </button>
                </div>

                {selectedPerson === 'all' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                    <span className="text-[10px] font-bold opacity-70 shrink-0">Für:</span>
                    {safeMembers.filter(m => m.id !== 'all').map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setQuickTaskMember(m.id)}
                        className={'px-2.5 py-1 rounded-xl text-[11px] font-extrabold shrink-0 ' + (quickTaskMember === m.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                      >
                        {m.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </form>

              <div className={'rounded-3xl border p-4 space-y-2.5 ' + themeStyles.card}>
                <div className="font-extrabold text-sm">✅ Offene Aufgaben ({openTasks.length})</div>

                {openTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs font-bold opacity-50">
                    🎉 Alles erledigt! Keine offenen Aufgaben.
                  </div>
                ) : (
                  openTasks.map(task => {
                    const mem = safeMembers.find(m => m.id === task.member) || safeMembers[1];
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleMobileTask(task)}
                        className={'p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ' + themeStyles.subtle}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input type="checkbox" checked={false} readOnly className="w-5 h-5 accent-indigo-600 rounded shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-sm break-words">{task.title}</div>
                            <div className="text-[11px] font-semibold opacity-75">
                              👤 {mem.name.split(' ')[0]} • ⏳ {task.due || 'Offen'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.todoistId && todoistConfig?.apiToken) {
                              pushTodoistTaskToPhoneNow(todoistConfig.apiToken, task.todoistId, task.title, mem.todoistUserId, todoistConfig.collaborators);
                              showToast('Handy-Ping gesendet!', task.title, '📲');
                            }
                          }}
                          className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black shrink-0"
                        >
                          📲 Ping
                        </button>
                      </div>
                    );
                  })
                )}

                {doneTasks.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5">
                    <div className="text-xs font-extrabold opacity-60">☑️ Erledigt ({doneTasks.length})</div>
                    {doneTasks.slice(0, 5).map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleMobileTask(task)}
                        className={'p-2 rounded-xl border flex items-center gap-2.5 opacity-55 ' + themeStyles.subtle}
                      >
                        <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-500 rounded" />
                        <span className="text-xs font-bold line-through truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =====================================================
              TAB 3: KAMERA-SCANNER (BARCODE & KASSENBON)
             ===================================================== */}
          {activeTab === 'scanner' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/30 border border-white/10">
                <button
                  type="button"
                  onClick={() => setScannerMode('barcode')}
                  className={'py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ' + (scannerMode === 'barcode' ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Barcode / Produkt</span>
                </button>
                <button
                  type="button"
                  onClick={() => { stopCameraStream(); setScannerMode('receipt'); }}
                  className={'py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ' + (scannerMode === 'receipt' ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  <FileText className="w-4 h-4" />
                  <span>🧾 Kassenbon-Foto</span>
                </button>
              </div>

              {scannerMode === 'barcode' ? (
                <div className={'p-4 rounded-3xl border space-y-3.5 shadow-md ' + themeStyles.card}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-base">📷 Produkt & MHD Scanner</h2>
                      <p className="text-[11px] opacity-75">Barcode scannen + Pflicht-Ablaufdatum wählen</p>
                    </div>
                    {!cameraActive ? (
                      <button
                        type="button"
                        onClick={startLiveBarcodeCamera}
                        className="tw-glow-btn px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Kamera an
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3.5 py-2 rounded-2xl bg-rose-600 text-white text-xs font-black"
                      >
                        ✕ Kamera aus
                      </button>
                    )}
                  </div>

                  {cameraActive && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-sky-400 bg-black aspect-video">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <div className="absolute inset-x-8 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      placeholder="EAN-Barcode (oder oben Kamera starten)"
                      className={'flex-1 px-3 py-2 rounded-xl border text-xs font-mono ' + themeStyles.input}
                    />
                    <button
                      type="button"
                      onClick={() => lookupBarcodeOnOpenFoodFacts(scannedBarcode)}
                      className="tw-glow-btn px-3 py-2 rounded-xl text-xs font-extrabold"
                    >
                      {isLookingUpProduct ? '...' : '🔍 Suchen'}
                    </button>
                  </div>

                  <form onSubmit={handleSaveScannedProduct} className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center text-xl shrink-0">
                        {getFoodEmoji(scanName)}
                      </span>
                      <input
                        type="text"
                        required
                        value={scanName}
                        onChange={(e) => setScanName(e.target.value)}
                        placeholder="Produktname (z.B. Vollmilch, Bratwurst)..."
                        className={'w-full px-3.5 py-2.5 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={scanQty}
                        onChange={(e) => setScanQty(e.target.value)}
                        placeholder="Menge (z.B. 500g)"
                        className={'w-full px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
                      />
                      <select
                        value={scanLocation}
                        onChange={(e) => setScanLocation(e.target.value)}
                        className={'w-full px-3 py-2 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                      >
                        <option value="fridge" className="bg-slate-800 text-white">🧊 Kühlschrank</option>
                        <option value="freezer" className="bg-slate-800 text-white">❄️ Gefrierschrank</option>
                        <option value="pantry" className="bg-slate-800 text-white">🗄️ Vorratslager</option>
                        <option value="kitchen" className="bg-slate-800 text-white">🍎 Küche</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 space-y-2">
                      <label className="block text-[11px] font-black uppercase text-amber-300">
                        Pflichtfeld: Ablaufdatum (MHD)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { l: '+3 Tage', d: 3 },
                          { l: '+1 Woche', d: 7 },
                          { l: '+2 Wochen', d: 14 },
                          { l: '+1 Monat', d: 30 }
                        ].map(b => (
                          <button
                            key={b.d}
                            type="button"
                            onClick={() => setScanExpiry(formatDateStr(addDays(new Date(), b.d)))}
                            className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-black"
                          >
                            {b.l}
                          </button>
                        ))}
                      </div>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={scanExpiry}
                        onChange={(e) => setScanExpiry(e.target.value)}
                        className={'w-full px-3.5 py-2.5 rounded-xl border text-xs font-black ' + themeStyles.input}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!scanName.trim() || !scanExpiry}
                      className={'w-full py-3 rounded-2xl font-black text-xs ' + (!scanName.trim() || !scanExpiry ? 'bg-slate-700 text-slate-400 opacity-50' : 'tw-glow-btn')}
                    >
                      {scanExpiry ? '🥫 In Speisekammer speichern' : '⚠️ Erst Ablaufdatum (MHD) wählen'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className={'p-4 rounded-3xl border space-y-3.5 shadow-md ' + themeStyles.card}>
                  <h2 className="font-black text-base">🧾 Kassenbon abfotografieren</h2>
                  <label className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <span>{isScanningReceipt ? '⏳ Lese Kassenbon aus...' : '📸 Kassenbon jetzt fotografieren'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleReceiptPhotoUpload}
                    />
                  </label>

                  {receiptItems.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {receiptItems.map((rit, idx) => (
                        <div key={rit.id} className={'p-2.5 rounded-2xl border space-y-1.5 ' + themeStyles.subtle}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rit.selected}
                              onChange={() => {
                                const next = [...receiptItems];
                                next[idx].selected = !next[idx].selected;
                                setReceiptItems(next);
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded"
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
                          </div>
                          <div className="flex items-center justify-between gap-2 pl-6">
                            <span className="text-[10px] font-bold text-amber-400">Pflicht-MHD:</span>
                            <input
                              type="date"
                              required
                              value={rit.expiryDate}
                              onChange={(e) => {
                                const next = [...receiptItems];
                                next[idx].expiryDate = e.target.value;
                                setReceiptItems(next);
                              }}
                              className={'px-2 py-1 rounded-lg border text-xs font-bold ' + themeStyles.input}
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleSaveAllReceiptItems}
                        className="tw-glow-btn w-full py-3 rounded-2xl font-black text-xs"
                      >
                        ✓ Markierte Produkte speichern
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* KOMPAKTE BESTANDS-LISTE MIT MENGEN-UPDATE DIREKT IM SCANNER */}
              <div className={'p-3.5 rounded-3xl border space-y-2 ' + themeStyles.card}>
                <div className="font-extrabold text-xs uppercase text-sky-400">
                  🥫 Aktueller Vorrat ({safeStock.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {safeStock.slice(0, 12).map(item => (
                    <div key={item.id} className={'p-2.5 rounded-2xl border flex items-center justify-between gap-2 ' + themeStyles.subtle}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xl shrink-0">{getFoodEmoji(item.name)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-xs truncate">{item.name}</div>
                          <div className="text-[10px] text-amber-400 font-bold">
                            {item.quantity} • MHD: {item.expiryDate.slice(8, 10)}.{item.expiryDate.slice(5, 7)}.
                          </div>
                        </div>
                      </div>

                      {editingStockId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editStockQty}
                            onChange={(e) => setEditStockQty(e.target.value)}
                            className={'w-16 px-2 py-1 rounded-lg border text-xs font-bold ' + themeStyles.input}
                          />
                          <button
                            onClick={() => {
                              const nextStock = safeStock.map(x => x.id === item.id ? { ...x, quantity: editStockQty || '1x' } : x);
                              setPantryItems(nextStock);
                              saveStateToCloud({ pantryItems: nextStock });
                              setEditingStockId(null);
                            }}
                            className="tw-glow-btn p-1.5 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingStockId(item.id);
                              setEditStockQty(item.quantity);
                            }}
                            className="tw-nav-inactive p-1.5 rounded-xl text-sky-300"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleConsumeFromPocket(item)}
                            className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black"
                          >
                            🍽️ Weg
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              TAB 4: EINKAUFSLISTE & HEUTIGES ESSEN
             ===================================================== */}
          {activeTab === 'shopping' && (
            <div className="space-y-3.5">
              <form onSubmit={handleAddQuickShopItem} className="flex gap-2">
                <input
                  type="text"
                  value={quickShopText}
                  onChange={(e) => setQuickShopText(e.target.value)}
                  placeholder="Artikel zur Einkaufsliste..."
                  className={'flex-1 px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
                />
                <button type="submit" className="tw-glow-btn px-5 rounded-2xl font-black text-sm">
                  +
                </button>
              </form>

              <div className={'rounded-3xl border p-4 space-y-2 ' + themeStyles.card}>
                <div className="font-extrabold text-sm">🛒 Einkaufsliste ({openShop.length} offen)</div>
                {openShop.length === 0 ? (
                  <div className="py-6 text-center text-xs opacity-50 font-bold">🛒 Einkaufsliste ist leer!</div>
                ) : (
                  openShop.map(item => (
                    <div
                      key={item.origIdx}
                      onClick={() => handleToggleShopItem(item.origIdx)}
                      className={'p-3 rounded-2xl border flex items-center gap-3 cursor-pointer ' + themeStyles.subtle}
                    >
                      <input type="checkbox" checked={false} readOnly className="w-5 h-5 accent-amber-500 rounded shrink-0" />
                      <span className="font-bold text-sm break-words">{item.text}</span>
                    </div>
                  ))
                )}

                {doneShop.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5">
                    <div className="text-xs font-extrabold opacity-60">Im Einkaufswagen ({doneShop.length})</div>
                    {doneShop.map(item => (
                      <div
                        key={item.origIdx}
                        onClick={() => handleToggleShopItem(item.origIdx)}
                        className={'p-2 rounded-xl border flex items-center gap-2.5 opacity-50 ' + themeStyles.subtle}
                      >
                        <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-emerald-500 rounded" />
                        <span className="text-xs font-bold line-through">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: NEUER TERMIN AUF DEM HANDY */}
      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={handleCreateMobileEvent} className={'w-full max-w-md rounded-3xl border-2 p-5 space-y-3.5 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">📅 Neuer Termin</h3>
              <button type="button" onClick={() => setNewEventModalOpen(false)} className="tw-nav-inactive p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newEvTitle}
              onChange={(e) => setNewEvTitle(e.target.value)}
              placeholder="Was steht an? (z.B. Training, Zahnarzt)"
              className={'w-full px-4 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                value={newEvDate}
                onChange={(e) => setNewEvDate(e.target.value)}
                className={'px-3 py-2.5 rounded-2xl border text-xs font-bold ' + themeStyles.input}
              />
              <input
                type="text"
                value={newEvTime}
                onChange={(e) => setNewEvTime(e.target.value)}
                placeholder="15:00 - 16:00"
                className={'px-3 py-2.5 rounded-2xl border text-xs font-bold ' + themeStyles.input}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {safeMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setNewEvMember(m.id)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' + (newEvMember === m.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  {m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <button type="submit" className="tw-glow-btn w-full py-3 rounded-2xl font-black text-sm">
              💾 Termin speichern
            </button>
          </form>
        </div>
      )}

      {/* =========================================================
          FESTE UNTERE NAVIGATION (4 REITER OHNE SCHULE)
         ========================================================= */}
      <nav className={'shrink-0 z-40 border-t px-2.5 py-2 flex items-center justify-around gap-1.5 shadow-2xl ' + themeStyles.header}>
        {[
          { id: 'agenda',   label: 'Kalender', icon: Calendar,     badge: filteredEvents.filter(e => e.date === todayStr).length },
          { id: 'tasks',    label: 'Aufgaben', icon: CheckSquare,  badge: openTasks.length },
          { id: 'scanner',  label: 'Scanner',  icon: Camera,       badge: safeStock.length },
          { id: 'shopping', label: 'Einkauf',  icon: ShoppingCart, badge: openShop.length }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== 'scanner') stopCameraStream();
                setActiveTab(tab.id);
              }}
              className={'relative flex-1 py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-extrabold ' + (active ? 'tw-active-nav' : 'tw-nav-inactive opacity-80')}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute top-1 right-2.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
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
