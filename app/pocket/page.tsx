// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, GraduationCap, Camera,
  Plus, RefreshCw, Smartphone, LogOut, Send, Trash2, Utensils,
  X, ScanLine, FileText, Package, CheckCircle2
} from 'lucide-react';

import * as Cfg from '../touchwallConfig';

const {
  formatDateStr,
  addDays,
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

  // 5 Handy-Reiter inkl. neuem Kamera-Scanner
  const [activeTab, setActiveTab] = useState('scanner'); // 'agenda' | 'tasks' | 'scanner' | 'shopping' | 'school'
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [todayStr] = useState(() => formatDateStr(new Date()));

  // Gemeinsame Familiendaten inkl. Speisekammer (pantryItems & pantryTrash)
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [familyTasks, setFamilyTasks] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
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
  const [scannerMode, setScannerMode] = useState('barcode'); // 'barcode' | 'receipt' | 'manual'
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('pantry');
  const [scanExpiry, setScanExpiry] = useState('');
  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);

  // Kassenbon-Foto-Erkennung
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

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

  const renderAvatar = (member, size = 'w-9 h-9', textSize = 'text-xs') => {
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

  // =========================================================
  // CLOUD-KOMMUNIKATION INKL. SPEISEKAMMER
  // =========================================================
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
      if (showFeedback) showToast('Synchronisiert', 'Bestand, Termine & Listen sind aktuell.', '✅');
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

  // =========================================================
  // KAMERA-BARCODE-SCANNER + OPENFOODFACTS PRODUKT-ABFRAGE
  // =========================================================
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
        const fullTitle = [brand, foundName].filter(Boolean).join(' ').trim();
        if (fullTitle) {
          setScanName(fullTitle);
          setScanQty(qty);
          showToast('Produkt erkannt!', fullTitle + ' – bitte jetzt noch Ablaufdatum wählen.', '🎉');
          return;
        }
      }
      showToast('Barcode gescannt', 'Code ' + cleanCode + ' – bitte Produktnamen & MHD ergänzen.', '📷');
    } catch (e) {
      showToast('Barcode erfasst', 'Code: ' + cleanCode, '📷');
    } finally {
      setIsLookingUpProduct(false);
    }
  };

  const startLiveBarcodeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
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
              const rawVal = barcodes[0].rawValue;
              if (rawVal) {
                stopCameraStream();
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

  // =========================================================
  // KASSENBON-FOTO-SCANNER (BROWSER-OCR OHNE ZUSATZ-INSTALLATION)
  // =========================================================
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
        location: 'pantry',
        expiryDate: defaultExp,
        selected: true
      }));

      setReceiptItems(extracted);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt – bitte MHD prüfen.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen oder Produkt direkt eingeben.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleSaveScannedProduct = (e) => {
    e.preventDefault();
    if (!scanName.trim()) {
      showToast('Name fehlt', 'Bitte Produktnamen eingeben.', '⚠️');
      return;
    }
    if (!scanExpiry) {
      showToast('Ablaufdatum ist Pflicht!', 'Ohne Ablaufdatum (MHD) kann kein Produkt gespeichert werden.', '⚠️');
      return;
    }

    lastLocalEditRef.current = Date.now();
    const newItem = {
      id: 'p_' + Date.now(),
      name: scanName.trim(),
      barcode: scannedBarcode || '',
      quantity: scanQty.trim() || '1x',
      location: scanLocation,
      expiryDate: scanExpiry,
      addedAt: todayStr
    };

    const nextStock = [newItem, ...safeStock];
    setPantryItems(nextStock);
    saveStateToCloud({ pantryItems: nextStock });

    setScanName('');
    setScannedBarcode('');
    setScanExpiry('');
    showToast('In Speisekammer!', newItem.name + ' (MHD: ' + newItem.expiryDate + ') gespeichert!', '🥫');
  };

  const handleSaveAllReceiptItems = () => {
    const selected = receiptItems.filter(it => it.selected && it.name.trim() && it.expiryDate);
    if (selected.length === 0) {
      showToast('MHD prüfen', 'Bitte wähle mindestens einen Artikel mit gültigem Ablaufdatum.', '⚠️');
      return;
    }
    lastLocalEditRef.current = Date.now();
    const newEntries = selected.map(it => ({
      id: 'p_' + Date.now() + '_' + Math.random(),
      name: it.name.trim(),
      quantity: it.quantity || '1x',
      location: it.location || 'pantry',
      expiryDate: it.expiryDate,
      addedAt: todayStr
    }));

    const nextStock = [...newEntries, ...safeStock];
    setPantryItems(nextStock);
    saveStateToCloud({ pantryItems: nextStock });
    setReceiptItems([]);
    showToast('Kassenbon übernommen!', newEntries.length + ' Produkte in der Speisekammer gespeichert.', '🎉');
  };

  const handleConsumeFromPocket = (item) => {
    lastLocalEditRef.current = Date.now();
    const nextStock = safeStock.filter(x => x.id !== item.id);
    const nextTrash = [
      {
        ...item,
        trashedAt: todayStr,
        reason: 'consumed',
        reasonLabel: '🍽️ Verzehrt am ' + todayStr
      },
      ...safeTrash
    ];
    setPantryItems(nextStock);
    setPantryTrash(nextTrash);
    saveStateToCloud({ pantryItems: nextStock, pantryTrash: nextTrash });
    showToast('Verzehrt!', item.name + ' wurde aus dem Bestand gebucht.', '🍽️');
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
      <div className="min-h-screen bg-[#111418] text-white flex items-center justify-center p-6">
        <div className="text-sm font-extrabold opacity-75 animate-pulse">📱 Lade Touchwall Pocket...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111418] text-slate-100 flex flex-col justify-center p-5 select-none">
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

  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const filteredTasks = safeTasks.filter(t => selectedPerson === 'all' || t.member === selectedPerson);
  const openTasks = filteredTasks.filter(t => !t.done);
  const shopItems = Array.isArray(safeNotes[0]?.items) ? safeNotes[0].items : [];
  const openShop = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => !it.done);

  return (
    <div className={'min-h-screen pb-24 flex flex-col select-none ' + themeStyles.outer}>
      <header className={'sticky top-0 z-30 px-4 pt-3 pb-2.5 border-b shadow-md ' + themeStyles.header}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white text-xs font-black">POCKET</span>
            <h1 className="font-extrabold text-base truncate">{familyName}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => syncAllNow(true)} className="p-2 rounded-xl bg-white/10">
              <RefreshCw className={'w-4 h-4 ' + (isSyncing ? 'animate-spin text-sky-400' : '')} />
            </button>
            <a href="/" className="px-2.5 py-1.5 rounded-xl bg-white/10 text-[11px] font-extrabold">🖥️ Wand</a>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg w-full mx-auto space-y-4">
        {/* =====================================================
            NEUER HAUPT-TAB: HANDY-KAMERA-SCANNER (BARCODE & KASSENBON)
           ===================================================== */}
        {activeTab === 'scanner' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/30 border border-white/10">
              <button
                type="button"
                onClick={() => setScannerMode('barcode')}
                className={'py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ' + (scannerMode === 'barcode' ? 'bg-sky-500 text-white shadow-md' : 'opacity-75')}
              >
                <ScanLine className="w-4 h-4" />
                <span>Barcode / Produkt</span>
              </button>
              <button
                type="button"
                onClick={() => { stopCameraStream(); setScannerMode('receipt'); }}
                className={'py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ' + (scannerMode === 'receipt' ? 'bg-amber-500 text-slate-950 shadow-md' : 'opacity-75')}
              >
                <FileText className="w-4 h-4" />
                <span>🧾 Kassenbon-Foto</span>
              </button>
            </div>

            {scannerMode === 'barcode' ? (
              <div className={'p-4 rounded-3xl border space-y-4 shadow-md ' + themeStyles.card}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-base">📷 Produkt & MHD Scanner</h2>
                    <p className="text-[11px] opacity-75">Barcode scannen + Pflicht-Ablaufdatum wählen</p>
                  </div>
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startLiveBarcodeCamera}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Camera className="w-4 h-4" /> Kamera starten
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
                    <div className="absolute bottom-2 inset-x-0 text-center text-[11px] font-black text-white bg-black/60 py-1">
                      Halte den Barcode vor die Kamera...
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder="EAN-Barcode (oder oben Kamera starten)"
                    className={'flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono ' + themeStyles.input}
                  />
                  <button
                    type="button"
                    onClick={() => lookupBarcodeOnOpenFoodFacts(scannedBarcode)}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 text-xs font-extrabold"
                  >
                    {isLookingUpProduct ? '...' : '🔍 Suchen'}
                  </button>
                </div>

                <form onSubmit={handleSaveScannedProduct} className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-sky-400 mb-1">
                      1. Produktname / Beschreibung
                    </label>
                    <input
                      type="text"
                      required
                      value={scanName}
                      onChange={(e) => setScanName(e.target.value)}
                      placeholder="z.B. Vollmilch, Joghurt, Hackfleisch..."
                      className={'w-full px-4 py-3 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase opacity-75 mb-1">Menge</label>
                      <input
                        type="text"
                        value={scanQty}
                        onChange={(e) => setScanQty(e.target.value)}
                        className={'w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ' + themeStyles.input}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase opacity-75 mb-1">Lagerort</label>
                      <select
                        value={scanLocation}
                        onChange={(e) => setScanLocation(e.target.value)}
                        className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                      >
                        <option value="fridge" className="bg-slate-800 text-white">🧊 Kühlschrank</option>
                        <option value="freezer" className="bg-slate-800 text-white">❄️ Gefrierschrank</option>
                        <option value="pantry" className="bg-slate-800 text-white">🗄️ Vorratslager</option>
                        <option value="kitchen" className="bg-slate-800 text-white">🍎 Küche</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 space-y-2.5">
                    <label className="block text-xs font-black uppercase text-amber-300">
                      2. Pflichtfeld: Ablaufdatum (MHD) wählen
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { l: '+3 Tage', d: 3 },
                        { l: '+1 Woche', d: 7 },
                        { l: '+2 Wochen', d: 14 },
                        { l: '+1 Monat', d: 30 },
                        { l: '+6 Monate', d: 180 }
                      ].map(b => (
                        <button
                          key={b.d}
                          type="button"
                          onClick={() => setScanExpiry(formatDateStr(addDays(new Date(), b.d)))}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black active:scale-95"
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
                      className={'w-full px-4 py-3 rounded-xl border text-sm font-black ' + themeStyles.input}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!scanName.trim() || !scanExpiry}
                    className={'w-full py-3.5 rounded-2xl font-black text-sm shadow-lg ' + (!scanName.trim() || !scanExpiry ? 'bg-slate-700 text-slate-400 opacity-50' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white active:scale-95')}
                  >
                    {scanExpiry ? '🥫 In Speisekammer speichern' : '⚠️ Bitte erst Ablaufdatum (MHD) eingeben'}
                  </button>
                </form>
              </div>
            ) : (
              <div className={'p-4 rounded-3xl border space-y-4 shadow-md ' + themeStyles.card}>
                <div>
                  <h2 className="font-black text-base">🧾 Kassenbon abfotografieren</h2>
                  <p className="text-xs opacity-75">
                    Fotografiere deinen Einkaufszettel – die App erkennt die Lebensmittel automatisch!
                  </p>
                </div>

                <label className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95">
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
                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-black uppercase text-emerald-400">
                      Erkannte Produkte (Bitte Ablaufdatum prüfen):
                    </div>
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
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-7">
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
                            className={'px-2.5 py-1 rounded-lg border text-xs font-bold ' + themeStyles.input}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleSaveAllReceiptItems}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg active:scale-95"
                    >
                      ✓ Alle markierten Produkte in Speisekammer speichern
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* AKTUELLER VORRAT DIREKT UNTER DEM SCANNER */}
            <div className={'p-4 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
              <div className="font-extrabold text-sm flex items-center justify-between">
                <span>🥫 Aktueller Bestand ({safeStock.length})</span>
              </div>
              {safeStock.slice(0, 8).map(item => (
                <div key={item.id} className={'p-3 rounded-2xl border flex items-center justify-between gap-2 ' + themeStyles.subtle}>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs truncate">{item.name} ({item.quantity})</div>
                    <div className="text-[10px] text-amber-400 font-bold">MHD: {item.expiryDate}</div>
                  </div>
                  <button
                    onClick={() => handleConsumeFromPocket(item)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-black shrink-0"
                  >
                    🍽️ Verzehrt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">📅 Nächste Termine</h2>
              <button
                onClick={() => setNewEventModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-sky-500 text-white text-xs font-black"
              >
                + Termin
              </button>
            </div>
            {next14Days.slice(0, 7).map(dayObj => {
              const dStr = formatDateStr(dayObj);
              const dayEvs = safeEvents.filter(e => e.date === dStr);
              return (
                <div key={dStr} className={'p-3.5 rounded-2xl border space-y-1.5 ' + themeStyles.card}>
                  <div className="text-xs font-black text-sky-400">
                    {WEEKDAYS_SHORT[dayObj.getDay()]}, {dayObj.getDate()}.{dayObj.getMonth() + 1}.
                  </div>
                  {dayEvs.length === 0 ? (
                    <div className="text-[11px] opacity-45">Keine Termine</div>
                  ) : (
                    dayEvs.map(ev => (
                      <div key={ev.id} className="text-xs font-bold">• {ev.title} ({ev.time})</div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: AUFGABEN */}
        {activeTab === 'tasks' && (
          <div className={'p-4 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
            <h2 className="font-black text-base">✅ Offene Aufgaben ({openTasks.length})</h2>
            {openTasks.map(t => (
              <div key={t.id} className={'p-3 rounded-2xl border text-xs font-bold ' + themeStyles.subtle}>
                {t.title} ({t.due})
              </div>
            ))}
          </div>
        )}

        {/* TAB: EINKAUF */}
        {activeTab === 'shopping' && (
          <div className={'p-4 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
            <h2 className="font-black text-base">🛒 Einkaufsliste ({openShop.length})</h2>
            {openShop.map(it => (
              <div key={it.origIdx} className={'p-3 rounded-2xl border text-xs font-bold ' + themeStyles.subtle}>
                • {it.text}
              </div>
            ))}
          </div>
        )}

        {/* TAB: SCHULE */}
        {activeTab === 'school' && (
          <div className={'p-4 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
            <h2 className="font-black text-base">🎒 Schule</h2>
            <p className="text-xs opacity-75">Stundenplan & Infos sind synchron mit der Touchwall.</p>
          </div>
        )}
      </main>

      {/* UNTERE DAUMEN-LEISTE MIT KAMERA-SCANNER IN DER MITTE */}
      <nav className={'fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 flex items-center justify-around shadow-2xl ' + themeStyles.header}>
        {[
          { id: 'agenda',   label: 'Termine',  icon: Calendar },
          { id: 'tasks',    label: 'Aufgaben', icon: CheckSquare },
          { id: 'scanner',  label: 'Scanner',  icon: Camera },
          { id: 'shopping', label: 'Einkauf',  icon: ShoppingCart },
          { id: 'school',   label: 'Schule',   icon: GraduationCap }
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
              className={'flex-1 py-2 rounded-2xl flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ' + (active ? 'bg-sky-500 text-white shadow-md scale-105' : 'opacity-70')}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
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
