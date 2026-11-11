// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, CheckSquare, ShoppingCart, GraduationCap,
  Plus, RefreshCw, Smartphone, Lock, LogOut, Send,
  Trash2, Clock, Utensils, BellRing, Check, X, Sparkles, KeyRound
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
  deleteTodoistTask,
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

  // Login-Felder falls man sich am Handy manuell anmeldet
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mobile Navigation & Aktive Person ("Wer bist du?")
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'tasks' | 'shopping' | 'school'
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [todayStr] = useState(() => formatDateStr(new Date()));

  // Daten-State (synchron mit der großen Touchwall)
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [familyTasks, setFamilyTasks] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [todoistConfig, setTodoistConfig] = useState({
    apiToken: '',
    shoppingProjectId: '',
    tasksProjectId: '',
    projects: [],
    collaborators: []
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Schnell-Eingabe Modals / Bars für unterwegs
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState(() => formatDateStr(new Date()));
  const [newEvTime, setNewEvTime] = useState('15:00 - 16:00');
  const [newEvMember, setNewEvMember] = useState('all');

  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickTaskMember, setQuickTaskMember] = useState('hans');
  const [quickShopText, setQuickShopText] = useState('');

  const isInitialLoadDone = useRef(false);
  const isApplyingRemote = useRef(false);
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
  // CLOUD & TODOISTKOMMUNIKATION
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
    isApplyingRemote.current = true;
    if (bundle.state) {
      const s = bundle.state;
      if (s.familyName) setFamilyName(s.familyName);
      if (Array.isArray(s.members) && s.members.length >= 2) setMembers(s.members);
      if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
      if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
      if (s.schoolData?.dean) setSchoolData(s.schoolData);
      if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
      if (s.currentTheme) setCurrentTheme(s.currentTheme);
      if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
    }
    if (Array.isArray(bundle?.calendarData?.events)) {
      setEvents(bundle.calendarData.events);
      try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(bundle.calendarData.events)); } catch (e) {}
    }
    setTimeout(() => {
      isApplyingRemote.current = false;
      isInitialLoadDone.current = true;
    }, 200);
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
        if (bundle?.ok) {
          applyRemoteBundle(bundle);
        }
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
          isApplyingRemote.current = true;
          if (Array.isArray(pulled.tasks)) setFamilyTasks(pulled.tasks);
          if (Array.isArray(pulled.familyNotes)) setFamilyNotes(pulled.familyNotes);
          setTimeout(() => { isApplyingRemote.current = false; }, 200);
        }
      }
      if (showFeedback) showToast('Aktualisiert', 'Alle Termine & Listen sind synchron.', '✅');
    } catch (e) {
      if (showFeedback) showToast('Sync-Hinweis', 'Offline-Cache wird genutzt.', '⚠️');
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  const saveStateToCloud = async (nextTasks, nextNotes, nextMeals) => {
    const payload = {
      isConfigured: true,
      familyName,
      members: safeMembers,
      mealPlan: nextMeals || safeMeals,
      familyNotes: nextNotes || safeNotes,
      schoolData,
      familyTasks: nextTasks || safeTasks,
      currentTheme,
      todoistConfig
    };
    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload)); } catch (e) {}
    if (!accountId || accountId === 'local') return;
    try {
      await callCloudBackend({ action: 'saveState', payload });
    } catch (e) {}
  };

  // =========================================================
  // AUTO-LOGIN PER QR-LINK ODER GESPEICHERTER SITZUNG
  // =========================================================
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
        isInitialLoadDone.current = true;
        if (session.accountId !== 'local') {
          setTimeout(() => syncAllNow(false, session.accountId, session.authKey), 300);
        }
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  // Hintergrund-Sync alle 12 Sekunden auf dem Handy
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllNow(false);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accountId, authKey, todoistConfig]);

  const handlePocketLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError('Bitte Benutzername und Passwort eingeben.');
      return;
    }

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
      showToast('Verbunden!', title + ' ist jetzt auf deinem Handy aktiv.', '📱');
    } catch (err) {
      setLoginError('Verbindungsfehler: ' + (err.message || 'Bitte Internet prüfen.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // =========================================================
  // HANDY-AKTIONEN: TERMINE, AUFGABEN & EINKAUFSLISTE
  // =========================================================
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
    const nextEvents = [...safeEvents, newEv];
    setEvents(nextEvents);
    setNewEvTitle('');
    setNewEventModalOpen(false);
    showToast('Termin eingetragen', newEv.title, '📅');

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
    saveStateToCloud(nextTasks, undefined, undefined);
    showToast('Aufgabe gesendet!', clean + ' → ' + memberObj.name, '✅');
  };

  const handleToggleMobileTask = async (task) => {
    lastLocalEditRef.current = Date.now();
    const nextDone = !task.done;
    const nextTasks = safeTasks.map(t => t.id === task.id ? { ...t, done: nextDone } : t);
    setFamilyTasks(nextTasks);
    saveStateToCloud(nextTasks, undefined, undefined);
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
    saveStateToCloud(undefined, nextNotes, undefined);
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
    saveStateToCloud(undefined, nextNotes, undefined);
    if (item.todoistId && todoistConfig?.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
  };

  // =========================================================
  // LOGIN-SCREEN FALLS NOCH NICHT ANGEMELDET
  // =========================================================
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
                📱 Touchwall Pocket • Android & Mobile
              </span>
              <h1 className="text-xl font-black mt-0.5">Handy-Anmeldung</h1>
              <p className="text-xs text-slate-400">
                Melde dich mit eurem Familien-Konto an oder scanne einfach den QR-Code an eurer großen Touchwall!
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handlePocketLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-sky-400 mb-1">
                👤 Familien-Benutzername
              </label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="z.B. familie-richter"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-amber-400 mb-1">
                🔒 Passwort / PIN
              </label>
              <input
                type="password"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Passwort..."
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm shadow-lg active:scale-95 transition-transform"
            >
              {isLoggingIn ? 'Verbinde...' : '🔓 Auf dem Handy anmelden'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================
  // DATEN-AUFBEREITUNG FÜR DIE 4 HANDY-TABS
  // =========================================================
  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const filteredTasks = safeTasks.filter(t => selectedPerson === 'all' || t.member === selectedPerson);
  const openTasks = filteredTasks.filter(t => !t.done);
  const doneTasks = filteredTasks.filter(t => t.done);

  const shopItems = Array.isArray(safeNotes[0]?.items) ? safeNotes[0].items : [];
  const openShop = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => !it.done);
  const doneShop = shopItems.map((it, idx) => ({ ...it, origIdx: idx })).filter(it => it.done);

  const todayDow = new Date().getDay(); // 0=So, 1=Mo ...
  const mealIdxToday = todayDow === 0 ? 6 : todayDow - 1;
  const todaysMeal = safeMeals[mealIdxToday] || safeMeals[0];

  return (
    <div className={'min-h-screen pb-24 flex flex-col select-none ' + themeStyles.outer}>
      {/* KOMPAKTER MOBILE HEADER MIT PERSONEN-WAHL ("WER BIST DU?") */}
      <header className={'sticky top-0 z-30 px-4 pt-3 pb-2.5 border-b shadow-md ' + themeStyles.header}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white text-xs font-black">POCKET</span>
            <h1 className="font-extrabold text-base truncate">{familyName}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => syncAllNow(true)}
              className="p-2 rounded-xl bg-white/10 active:scale-90 transition-transform"
              title="Synchronisieren"
            >
              <RefreshCw className={'w-4 h-4 ' + (isSyncing ? 'animate-spin text-sky-400' : '')} />
            </button>
            <a
              href="/"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 text-[11px] font-extrabold"
            >
              🖥️ Wand
            </a>
            <button
              onClick={() => {
                localStorage.removeItem('richter_tw_auth_active');
                setIsAuthenticated(false);
              }}
              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 active:scale-90"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HORIZONTALE PERSONEN-LEISTE ("WER BIST DU?") */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              setSelectedPerson('all');
              try { localStorage.setItem('richter_tw_pocket_person', 'all'); } catch (e) {}
            }}
            className={'px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all active:scale-95 ' + (selectedPerson === 'all' ? 'bg-sky-500 text-white shadow-md ring-2 ring-white/60' : 'bg-black/25 opacity-75')}
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
                className={'pr-3 pl-1 py-1 rounded-full flex items-center gap-1.5 text-xs font-extrabold shrink-0 transition-all active:scale-95 ' + (isSel ? 'bg-indigo-600 text-white shadow-md ring-2 ring-white/70' : 'bg-black/25 opacity-80')}
              >
                {renderAvatar(m, 'w-6 h-6', 'text-[10px]')}
                <span>{m.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* HAUPT-INHALT JE NACH GEWÄHLTEM UNTEREN TAB */}
      <main className="flex-1 p-4 max-w-lg w-full mx-auto space-y-4">

        {/* =====================================================
            TAB 1: AGENDA & TERMINE (KOMPAKTE TAGES-TIMELINE)
           ===================================================== */}
        {activeTab === 'agenda' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">📅 Nächste Termine</h2>
                <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                  {selectedPerson === 'all' ? 'Alle Familienmitglieder' : ('Gefiltert für ' + (safeMembers.find(m => m.id === selectedPerson)?.name || ''))}
                </p>
              </div>
              <button
                onClick={() => {
                  setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                  setNewEventModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Termin
              </button>
            </div>

            {next14Days.map((dayObj, dIdx) => {
              const dateStr = formatDateStr(dayObj);
              const isToday = dateStr === todayStr;
              const hol = getBWHolidayName(dateStr);
              const vac = getBWVacationName(dateStr);

              const dayEvs = safeEvents.filter(ev => {
                if (ev.date !== dateStr) return false;
                if (selectedPerson === 'all') return true;
                return ev.member === selectedPerson || ev.member === 'all';
              });

              if (dayEvs.length === 0 && !isToday && !hol && dIdx > 2) return null;

              return (
                <div key={dateStr} className={'rounded-3xl border p-4 space-y-2.5 shadow-xs ' + themeStyles.card + (isToday ? ' ring-2 ring-orange-400' : '')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={'px-2.5 py-0.5 rounded-lg text-xs font-black ' + (isToday ? 'bg-orange-500 text-white' : 'bg-white/10')}>
                        {isToday ? 'HEUTE' : dIdx === 1 ? 'MORGEN' : WEEKDAYS_SHORT[dayObj.getDay()]}
                      </span>
                      <span className="font-extrabold text-sm">
                        {dayObj.getDate()}. {MONTHS_NAMES[dayObj.getMonth()]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewEvDate(dateStr);
                        setNewEvMember(selectedPerson === 'all' ? 'all' : selectedPerson);
                        setNewEventModalOpen(true);
                      }}
                      className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm active:scale-90"
                    >
                      +
                    </button>
                  </div>

                  {(hol || vac) && (
                    <div className="text-xs font-extrabold text-emerald-400">
                      {hol ? ('🎌 ' + hol) : ('🏖️ ' + vac)}
                    </div>
                  )}

                  {dayEvs.length === 0 ? (
                    <div className="text-xs opacity-50 font-semibold py-1">Keine Termine eingetragen</div>
                  ) : (
                    <div className="space-y-2">
                      {dayEvs.map(ev => {
                        const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                        const st = getMemberStyles(mem);
                        return (
                          <div
                            key={ev.id}
                            style={st.cardStyle}
                            className="p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderAvatar(mem, 'w-8 h-8', 'text-xs')}
                              <div className="min-w-0">
                                <div className="font-extrabold text-sm leading-snug break-words">{ev.title}</div>
                                <div className="text-[11px] font-bold opacity-90">
                                  ⏰ {ev.time || 'Ganztägig'} • {mem.name.split(' ')[0]}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMobileEvent(ev)}
                              className="p-2 rounded-xl bg-black/25 text-white/80 active:scale-90 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* =====================================================
            TAB 2: AUFGABEN & TODOIST (SOFORT-ABHAKEN & PUSH)
           ===================================================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
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
                  className={'flex-1 px-3.5 py-3 rounded-2xl border text-sm font-bold ' + themeStyles.input}
                />
                <button
                  type="submit"
                  className="px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center gap-1 shrink-0 active:scale-95"
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
                      className={'px-2.5 py-1 rounded-xl text-[11px] font-extrabold shrink-0 ' + (quickTaskMember === m.id ? 'bg-indigo-600 text-white' : 'bg-white/10 opacity-70')}
                    >
                      {m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className={'rounded-3xl border p-4 space-y-2.5 ' + themeStyles.card}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">Offene Aufgaben ({openTasks.length})</span>
              </div>

              {openTasks.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold opacity-50">
                  🎉 Alles erledigt! Keine offenen Aufgaben.
                </div>
              ) : (
                openTasks.map(task => {
                  const mem = safeMembers.find(m => m.id === task.member) || safeMembers[1];
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleMobileTask(task)}
                      className={'p-3.5 rounded-2xl border flex items-center justify-between gap-3 active:scale-[0.98] transition-transform cursor-pointer ' + themeStyles.subtle}
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
                        className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 text-[10px] font-black shrink-0"
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
                  {doneTasks.slice(0, 6).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleMobileTask(task)}
                      className={'p-2.5 rounded-xl border flex items-center gap-2.5 opacity-55 ' + themeStyles.subtle}
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
            TAB 3: EINKAUFSLISTE & HEUTIGES GERICHT
           ===================================================== */}
        {activeTab === 'shopping' && (
          <div className="space-y-4">
            <div className={'p-4 rounded-3xl border-2 border-amber-400/50 flex items-center justify-between gap-3 ' + themeStyles.card}>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">🍲 Heutiges Familien-Essen ({todaysMeal?.dayLabel})</span>
                <div className="font-extrabold text-base mt-0.5">{todaysMeal?.dish || 'Freie Auswahl'}</div>
              </div>
              <Utensils className="w-6 h-6 text-amber-400 shrink-0" />
            </div>

            <form onSubmit={handleAddQuickShopItem} className="flex gap-2">
              <input
                type="text"
                value={quickShopText}
                onChange={(e) => setQuickShopText(e.target.value)}
                placeholder="Artikel in den Einkaufswagen..."
                className={'flex-1 px-4 py-3.5 rounded-2xl border text-sm font-bold ' + themeStyles.input}
              />
              <button
                type="submit"
                className="px-5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95"
              >
                +
              </button>
            </form>

            <div className={'rounded-3xl border p-4 space-y-2 ' + themeStyles.card}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm">🛒 Einkaufsliste ({openShop.length} offen)</span>
              </div>

              {openShop.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold opacity-50">
                  🛒 Einkaufswagen ist leer!
                </div>
              ) : (
                openShop.map(item => (
                  <div
                    key={item.origIdx}
                    onClick={() => handleToggleShopItem(item.origIdx)}
                    className={'p-3.5 rounded-2xl border flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer ' + themeStyles.subtle}
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
                      className={'p-2.5 rounded-xl border flex items-center gap-2.5 opacity-50 ' + themeStyles.subtle}
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

        {/* =====================================================
            TAB 4: SCHULE & STUNDENPLAN UNTERWEGS
           ===================================================== */}
        {activeTab === 'school' && (() => {
          const childMem = safeMembers.find(m => m.id === activeSchoolChild) || safeMembers[3] || safeMembers[0];
          const sched = schoolData?.[activeSchoolChild] || { periods: [], slots: {}, announcements: [] };
          const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveSchoolChild('dean')}
                  className={'py-3 rounded-2xl font-extrabold text-xs ' + (activeSchoolChild === 'dean' ? 'bg-sky-500 text-white shadow-md' : 'bg-white/10')}
                >
                  👦 {safeMembers.find(m => m.id === 'dean')?.name || 'Kind 1'}
                </button>
                <button
                  onClick={() => setActiveSchoolChild('valentina')}
                  className={'py-3 rounded-2xl font-extrabold text-xs ' + (activeSchoolChild === 'valentina' ? 'bg-sky-500 text-white shadow-md' : 'bg-white/10')}
                >
                  👧 {safeMembers.find(m => m.id === 'valentina')?.name || 'Kind 2'}
                </button>
              </div>

              {(sched.announcements || []).length > 0 && (
                <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-400/50 space-y-1.5">
                  <div className="text-xs font-black uppercase text-amber-300">📌 Wichtige Schul-Infos ({childMem.name})</div>
                  {(sched.announcements || []).map((note, idx) => (
                    <div key={idx} className="text-xs font-bold">• {note}</div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {schoolDays.map((dayName, dIdx) => (
                  <div key={dayName} className={'p-4 rounded-3xl border space-y-2 ' + themeStyles.card}>
                    <div className="font-black text-sm text-sky-400 uppercase">{dayName}</div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(sched.periods || []).map((pLabel, pIdx) => {
                        const slot = sched.slots?.[dIdx + '-' + pIdx];
                        if (!slot || !slot.subject) return null;
                        return (
                          <div key={pIdx} className={'px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-bold ' + themeStyles.subtle}>
                            <span className="opacity-70">{pLabel}</span>
                            <span className="font-extrabold">{slot.subject}</span>
                            <span className="opacity-75">{slot.room}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </main>

      {/* MODAL: NEUER TERMIN AUF DEM HANDY */}
      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={handleCreateMobileEvent} className={'w-full max-w-md rounded-3xl border-2 p-5 space-y-3.5 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">📅 Neuer Termin</h3>
              <button type="button" onClick={() => setNewEventModalOpen(false)} className="p-2 rounded-full bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newEvTitle}
              onChange={(e) => setNewEvTitle(e.target.value)}
              placeholder="Was steht an? (z.B. Zahnarzt, Training)"
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
                  className={'px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ' + (newEvMember === m.id ? 'bg-sky-500 text-white' : 'bg-white/10 opacity-75')}
                >
                  {m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm shadow-lg active:scale-95"
            >
              💾 Termin speichern
            </button>
          </form>
        </div>
      )}

      {/* UNTERE DAUMEN-NAVIGATION (4 HAUPT-REITER FÜR UNTERWEGS) */}
      <nav className={'fixed bottom-0 left-0 right-0 z-40 border-t px-3 py-2 flex items-center justify-around shadow-2xl ' + themeStyles.header}>
        {[
          { id: 'agenda',   label: 'Termine',  icon: Calendar,      badge: safeEvents.filter(e => e.date === todayStr).length },
          { id: 'tasks',    label: 'Aufgaben', icon: CheckSquare,   badge: openTasks.length },
          { id: 'shopping', label: 'Einkauf',  icon: ShoppingCart,  badge: openShop.length },
          { id: 'school',   label: 'Schule',   icon: GraduationCap, badge: 0 }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'relative flex-1 py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-extrabold transition-all active:scale-90 ' + (active ? 'bg-sky-500 text-white shadow-md' : 'opacity-70')}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={'absolute top-1 right-4 px-1.5 py-0.2 rounded-full text-[9px] font-black ' + (active ? 'bg-white text-slate-950' : 'bg-amber-500 text-slate-950')}>
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
