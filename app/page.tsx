// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, GraduationCap, CheckSquare, Utensils, FileText,
  Palette, Cloud, Plus, ChevronLeft, ChevronRight, Maximize2,
  Smartphone, RefreshCw, X, Volume2, BellRing, Copy, ClipboardPaste,
  Clock, Lock, LogOut, KeyRound, Sparkles, ShieldCheck
} from 'lucide-react';

import * as Cfg from './touchwallConfig';
import CalendarSection from './CalendarSection';
import TasksTodoistSection from './TasksTodoistSection';
import OtherSections from './OtherSections';

const {
  formatDateStr,
  addDays,
  getMonday,
  playTouchwallAlarmSound,
  COLOR_PALETTES,
  PAGE_THEMES,
  DEFAULT_MEMBERS,
  DEFAULT_MEALS,
  DEFAULT_NOTES,
  DEFAULT_SCHOOL,
  DEFAULT_APPS_SCRIPT_URL,
  buildThemeStyles,
  buildMemberStyles,
  discoverTodoistWorkspace,
  pullFromTodoistTwoWay,
  createTodoistTaskItem,
  updateTodoistTaskItem,
  closeOrReopenTodoistTask,
  deleteTodoistTask,
  pushTodoistTaskToPhoneNow,
  setTouchwallAuthCookie,
  hasTouchwallAuthCookie,
  clearTouchwallAuthCookie
} = Cfg;

export default function TouchwallApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authTab, setAuthTab] = useState('cloud');
  const [familyName, setFamilyName] = useState('Familien-Touchwall');

  const [loginGasUrl, setLoginGasUrl] = useState('');
  const [loginTodoistToken, setLoginTodoistToken] = useState('');
  const [loginFamilyName, setLoginFamilyName] = useState('');
  const [setupMemberNames, setSetupMemberNames] = useState(['Person 1', 'Person 2', 'Kind 1', 'Kind 2']);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [todayStr, setTodayStr] = useState(() => formatDateStr(new Date()));
  const [currentBaseDate, setCurrentBaseDate] = useState(() => getMonday(new Date()));
  const [currentView, setCurrentView] = useState('1w');
  const [activeSection, setActiveSection] = useState('kalender');
  const [activeMemberFilter, setActiveMemberFilter] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [clockStr, setClockStr] = useState('');

  const [appsScriptUrl, setAppsScriptUrl] = useState(DEFAULT_APPS_SCRIPT_URL);
  const [todoistConfig, setTodoistConfig] = useState({
    apiToken: '',
    shoppingProjectId: '',
    tasksProjectId: '',
    projects: [],
    collaborators: []
  });
  const [syncStatusText, setSyncStatusText] = useState('⚡ Echtzeit-Sync bereit');
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [diagResult, setDiagResult] = useState(null);
  const [isTestingDiag, setIsTestingDiag] = useState(false);

  const [touchRipples, setTouchRipples] = useState([]);

  const [pushPermission, setPushPermission] = useState('default');
  const [activeAlarmBanner, setActiveAlarmBanner] = useState(null);
  const triggeredAlarmsRef = useRef({});
  const isInitialLoadDone = useRef(false);
  const isApplyingRemoteState = useRef(false);
  const isMutatingCalendar = useRef(false);
  const lastLocalEditTimeRef = useRef(0);
  const lastThemeChangeRef = useRef(0);
  const autoSaveTimer = useRef(null);

  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [familyTasks, setFamilyTasks] = useState([]);

  const [toast, setToast] = useState(null);
  const [copiedEvent, setCopiedEvent] = useState(null);
  const [eventModal, setEventModal] = useState({
    open: false, id: null, origMember: '', origTitle: '', origDate: '',
    title: '', date: '', time: '15:00 - 16:00', member: 'all',
    notifyTime: '30m', notifyChannel: 'wall_push',
    notifyUsers: ['hans', 'sarah', 'dean', 'valentina']
  });
  const [taskModal, setTaskModal] = useState({
    open: false, id: null, todoistId: null, title: '', description: '', member: 'hans',
    priority: 3, dueDate: '', dueTime: '17:00', notifyTime: '15m', syncToCalendar: false
  });
  const [yearDayModal, setYearDayModal] = useState({ open: false, dateStr: '', newTitle: '', newTime: 'Ganztägig', newMember: 'all' });
  const [schoolModal, setSchoolModal] = useState({ open: false, dayIdx: 0, periodIdx: 0, subject: '', room: '', status: 'normal' });
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const showToast = (title, message, icon = '🔔') => {
    setToast({ title, message, icon });
    setTimeout(() => setToast(null), 3800);
  };

  const handleSelectTheme = (nextThemeId) => {
    lastLocalEditTimeRef.current = Date.now();
    lastThemeChangeRef.current = Date.now();
    setCurrentTheme(nextThemeId);
    try {
      localStorage.setItem('richter_tw_theme_lock', nextThemeId);
    } catch (e) {}
  };

  const safeMembers = useMemo(() => {
    return (Array.isArray(members) && members.length > 0 ? members : DEFAULT_MEMBERS).map(m => ({
      ...m,
      name: m?.name || 'Mitglied',
      role: m?.role || '',
      badge: m?.badge || 'M',
      color: m?.color || 'royal_bold'
    }));
  }, [members]);

  const safeEvents = useMemo(() => {
    return (Array.isArray(events) ? events : []).map(ev => ({
      ...ev,
      notifyUsers: Array.isArray(ev?.notifyUsers) ? ev.notifyUsers : ['hans']
    }));
  }, [events]);

  const safeMeals = useMemo(() => {
    return (Array.isArray(mealPlan) && mealPlan.length > 0 ? mealPlan : DEFAULT_MEALS).map(m => ({
      ...m,
      ingredients: Array.isArray(m?.ingredients) ? m.ingredients : []
    }));
  }, [mealPlan]);

  const safeNotes = useMemo(() => {
    const base = Array.isArray(familyNotes) && familyNotes.length > 0 ? familyNotes : DEFAULT_NOTES;
    return base.map(n => ({
      ...n,
      items: Array.isArray(n?.items)
        ? n.items.map(it => (typeof it === 'string' ? { text: it, done: false } : { text: it?.text || '', done: Boolean(it?.done), todoistId: it?.todoistId }))
        : []
    }));
  }, [familyNotes]);

  const safeTasks = useMemo(() => {
    return Array.isArray(familyTasks) ? familyTasks : [];
  }, [familyTasks]);

  const safeSchoolData = useMemo(() => {
    const s = schoolData && typeof schoolData === 'object' ? schoolData : DEFAULT_SCHOOL;
    return {
      dean: {
        periods: Array.isArray(s?.dean?.periods) ? s.dean.periods : DEFAULT_SCHOOL.dean.periods,
        slots: s?.dean?.slots && typeof s.dean.slots === 'object' ? s.dean.slots : DEFAULT_SCHOOL.dean.slots,
        announcements: Array.isArray(s?.dean?.announcements) ? s.dean.announcements : []
      },
      valentina: {
        periods: Array.isArray(s?.valentina?.periods) ? s.valentina.periods : DEFAULT_SCHOOL.valentina.periods,
        slots: s?.valentina?.slots && typeof s.valentina.slots === 'object' ? s.valentina.slots : DEFAULT_SCHOOL.valentina.slots,
        announcements: Array.isArray(s?.valentina?.announcements) ? s.valentina.announcements : []
      }
    };
  }, [schoolData]);

  const safeTodoistConfig = useMemo(() => ({
    apiToken: todoistConfig?.apiToken || '',
    shoppingProjectId: todoistConfig?.shoppingProjectId || '',
    tasksProjectId: todoistConfig?.tasksProjectId || '',
    projects: Array.isArray(todoistConfig?.projects) ? todoistConfig.projects : [],
    collaborators: Array.isArray(todoistConfig?.collaborators) ? todoistConfig.collaborators : []
  }), [todoistConfig]);

  const spawnTouchRipple = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    if (!x && !y) return;
    const id = Date.now() + Math.random();
    setTouchRipples(prev => [...prev.slice(-4), { id, x, y }]);
    setTimeout(() => {
      setTouchRipples(prev => prev.filter(r => r.id !== id));
    }, 650);
  };

  const themeStyles = useMemo(() => buildThemeStyles(currentTheme), [currentTheme]);
  const getMemberStyles = (member) => buildMemberStyles(member, themeStyles.dark);

  const renderAvatar = (member, size = 'w-11 h-11', textSize = 'text-base') => {
    const st = getMemberStyles(member);
    if (member?.avatarType === 'photo' && member?.photoUrl) {
      return (
        <div
          style={{ borderColor: COLOR_PALETTES[member.color]?.hex || '#3b82f6' }}
          className={size + ' rounded-full border-2 shadow-sm shrink-0 overflow-hidden relative flex items-center justify-center font-extrabold'}
        >
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (member?.avatarType === 'emoji' && member?.emoji) {
      return (
        <div style={st.badgeStyle} className={size + ' rounded-full flex items-center justify-center ' + textSize + ' shadow-sm shrink-0'}>
          {member.emoji}
        </div>
      );
    }
    return (
      <div style={st.badgeStyle} className={size + ' rounded-full font-extrabold ' + textSize + ' flex items-center justify-center shadow-sm shrink-0'}>
        {member?.badge || 'F'}
      </div>
    );
  };

  const renderNotifyBadgeOnCard = (ev) => {
    if (!ev?.notifyTime || ev.notifyTime === 'none') return null;
    const chIcon = ev.notifyChannel === 'push' ? '📲' : ev.notifyChannel === 'mail' ? '✉️' : '🔔';
    const userBadges = Array.isArray(ev.notifyUsers) && ev.notifyUsers.length > 0
      ? ev.notifyUsers.map(uid => safeMembers.find(x => x.id === uid)?.badge).filter(Boolean).join(',')
      : '';
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-extrabold shrink-0">
        {chIcon} {userBadges ? userBadges + ' • ' : ''}{ev.notifyTime}
      </span>
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
    try {
      const savedTrig = localStorage.getItem('richter_tw_triggered_alarms');
      if (savedTrig) triggeredAlarmsRef.current = JSON.parse(savedTrig);
    } catch (e) {}

    const updateClock = () => {
      const now = new Date();
      setClockStr(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
      const nowStr = formatDateStr(now);
      setTodayStr(prev => {
        if (prev !== nowStr) {
          setCurrentBaseDate(getMonday(now));
          return nowStr;
        }
        return prev;
      });
    };
    updateClock();
    const t = setInterval(updateClock, 15000);
    return () => clearInterval(t);
  }, []);

  const requestBrowserPushPermission = async () => {
    playTouchwallAlarmSound();
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Sound-Alarm aktiv', 'Bildschirm- & Sound-Alarm ist eingeschaltet.', '🔊');
      return false;
    }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      new Notification('🔔 Touchwall Push aktiv!', { body: 'Browser-Push & Sound sind bereit.' });
      showToast('Browser-Push aktiv', 'Alarme sind eingeschaltet!', '🔔');
      return true;
    }
    return false;
  };

  const triggerEventAlarmNow = (evObj, isTest = false) => {
    const whoNames = (evObj.notifyUsers || [])
      .map(uid => safeMembers.find(m => m.id === uid)?.name || uid)
      .join(', ') || 'Familie';
    playTouchwallAlarmSound();
    setActiveAlarmBanner({
      title: evObj.title || 'Familientermin',
      time: evObj.time || 'Jetzt',
      date: evObj.date || todayStr,
      who: whoNames,
      notifyTime: evObj.notifyTime || '15m',
      isTest
    });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 ' + evObj.title, { body: '⏰ ' + evObj.time + ' • Für: ' + whoNames });
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const offsetMinutesMap = { '0m': 0, '5m': 5, '10m': 10, '15m': 15, '30m': 30, '1h': 60, '2h': 120, '1d': 1440 };
    const checkAlarms = () => {
      const now = new Date();
      const nowMs = now.getTime();

      safeEvents.forEach(ev => {
        if (!ev?.date || !ev.notifyTime || ev.notifyTime === 'none') return;
        const offsetMins = offsetMinutesMap[ev.notifyTime] ?? 30;
        const parts = String(ev.date).split('-');
        if (parts.length !== 3) return;
        let sh = 8, sm = 0;
        const tm = String(ev.time || '').match(/(\d{1,2}):(\d{2})/);
        if (tm && String(ev.time).toLowerCase() !== 'ganztägig') {
          sh = Number(tm[1]); sm = Number(tm[2]);
        }
        const evStart = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), sh, sm, 0);
        const diffMs = nowMs - (evStart.getTime() - offsetMins * 60000);
        const key = 'ev_' + ev.id + '_' + ev.date + '_' + ev.time + '_' + ev.notifyTime;
        if (diffMs >= 0 && diffMs <= 180000 && !triggeredAlarmsRef.current[key]) {
          triggeredAlarmsRef.current[key] = nowMs;
          try { localStorage.setItem('richter_tw_triggered_alarms', JSON.stringify(triggeredAlarmsRef.current)); } catch (e) {}
          triggerEventAlarmNow(ev, false);
        }
      });

      safeTasks.forEach(task => {
        if (!task || task.done || !task.dueTime || !task.notifyTime || task.notifyTime === 'none') return;
        const dStr = task.dueDate || todayStr;
        const offsetMins = offsetMinutesMap[task.notifyTime] ?? 15;
        const parts = String(dStr).split('-');
        const tm = String(task.dueTime).match(/(\d{1,2}):(\d{2})/);
        if (parts.length !== 3 || !tm) return;
        const tDue = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), Number(tm[1]), Number(tm[2]), 0);
        const diffMs = nowMs - (tDue.getTime() - offsetMins * 60000);
        const key = 'task_' + task.id + '_' + dStr + '_' + task.dueTime + '_' + task.notifyTime;
        if (diffMs >= 0 && diffMs <= 180000 && !triggeredAlarmsRef.current[key]) {
          triggeredAlarmsRef.current[key] = nowMs;
          try { localStorage.setItem('richter_tw_triggered_alarms', JSON.stringify(triggeredAlarmsRef.current)); } catch (e) {}
          triggerEventAlarmNow({
            id: task.id,
            title: '✅ Aufgabe fällig: ' + task.title,
            date: dStr,
            time: 'Bis ' + task.dueTime + ' Uhr',
            notifyTime: task.notifyTime,
            notifyUsers: [task.member]
          }, false);
        }
      });
    };

    const timer = setInterval(checkAlarms, 15000);
    return () => clearInterval(timer);
  }, [isAuthenticated, safeEvents, safeTasks, safeMembers, todayStr]);

  const createAndSelectTodoistProject = async (projectName) => {
    const token = safeTodoistConfig.apiToken.trim();
    if (!token || !projectName?.trim()) return null;
    try {
      const createFn = Cfg.createNewTodoistProject || (async (tk, name) => Cfg.todoistFetch(tk, '/projects', { method: 'POST', rawBody: { name } }));
      const created = await createFn(token, projectName.trim());
      if (created?.id) {
        setTodoistConfig(prev => ({
          ...prev,
          projects: [...(Array.isArray(prev?.projects) ? prev.projects : []), created]
        }));
        showToast('Projekt erstellt', 'Todoist-Projekt „' + created.name + '“ wurde angelegt!', '📂');
        return created;
      }
    } catch (err) {
      showToast('Projekt-Fehler', err.message, '❌');
    }
    return null;
  };

  const connectAndDiscoverTodoist = async () => {
    if (!safeTodoistConfig.apiToken.trim()) {
      showToast('Token fehlt', 'Bitte zuerst dein Todoist API-Token eintragen.', '⚠️');
      return;
    }
    setIsSyncing(true);
    try {
      const disc = await discoverTodoistWorkspace(safeTodoistConfig.apiToken);
      const nextCfg = {
        ...safeTodoistConfig,
        projects: Array.isArray(disc?.projects) ? disc.projects : [],
        shoppingProjectId: safeTodoistConfig.shoppingProjectId || disc?.shoppingProjectId || '',
        tasksProjectId: safeTodoistConfig.tasksProjectId || disc?.tasksProjectId || '',
        collaborators: Array.isArray(disc?.collaborators) ? disc.collaborators : []
      };
      setTodoistConfig(nextCfg);

      if (nextCfg.collaborators.length > 0) {
        setMembers(prev => (Array.isArray(prev) ? prev : DEFAULT_MEMBERS).map(m => {
          if (m.id === 'all' || m.todoistUserId) return m;
          const match = nextCfg.collaborators.find(c =>
            c.name?.toLowerCase().includes(m.name.toLowerCase()) ||
            c.email?.toLowerCase().includes(m.id.toLowerCase())
          );
          return match ? { ...m, todoistUserId: String(match.id) } : m;
        }));
      }

      showToast('Todoist Team verbunden!', nextCfg.projects.length + ' Projekte & ' + nextCfg.collaborators.length + ' Team-Mitglieder geladen.', '🎉');
      await syncWithTodoistNow(false, nextCfg);
    } catch (err) {
      showToast('Todoist-Fehler', err.message, '❌');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithTodoistNow = async (showFeedback = false, cfgOverride = null) => {
    if (!isAuthenticated) return;
    if (!showFeedback && Date.now() - lastLocalEditTimeRef.current < 3500) return;

    const cfg = cfgOverride || safeTodoistConfig;
    if (!cfg?.apiToken?.trim()) return;
    if (showFeedback) setIsSyncing(true);

    try {
      let activeCfg = cfg;
      if (!Array.isArray(cfg.projects) || cfg.projects.length === 0) {
        const disc = await discoverTodoistWorkspace(cfg.apiToken);
        activeCfg = {
          ...cfg,
          projects: Array.isArray(disc?.projects) ? disc.projects : [],
          shoppingProjectId: cfg.shoppingProjectId || disc?.shoppingProjectId || '',
          tasksProjectId: cfg.tasksProjectId || disc?.tasksProjectId || '',
          collaborators: Array.isArray(disc?.collaborators) ? disc.collaborators : []
        };
        setTodoistConfig(activeCfg);
      }

      const pulled = await pullFromTodoistTwoWay(activeCfg.apiToken, activeCfg, safeTasks, safeNotes, safeMembers);
      if (pulled) {
        isApplyingRemoteState.current = true;
        if (Array.isArray(pulled.tasks)) setFamilyTasks(pulled.tasks);
        if (Array.isArray(pulled.familyNotes)) {
          setFamilyNotes(pulled.familyNotes);
        } else if (Array.isArray(pulled.shoppingItems)) {
          setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map((n, idx) => idx === 0 ? { ...n, items: pulled.shoppingItems } : n));
        }
        const now = new Date();
        const tStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        setLastAutoSyncTime(tStr);
        setSyncStatusText('⚡ Live-Sync (' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ')');
        setTimeout(() => { isApplyingRemoteState.current = false; }, 200);
      }
      if (showFeedback) showToast('Todoist synchron', 'Alle Kacheln & Projekte sind abgeglichen.', '✅');
    } catch (err) {
      if (showFeedback) showToast('Todoist-Sync Hinweis', err.message, '⚠️');
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  const syncTodoistRef = useRef(null);
  syncTodoistRef.current = syncWithTodoistNow;

  useEffect(() => {
    if (!isAuthenticated) return;
    const initTimeout = setTimeout(() => {
      syncTodoistRef.current?.(false);
    }, 1500);

    const fastInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncTodoistRef.current?.(false);
      }
    }, 8000);

    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncTodoistRef.current?.(false);
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(fastInterval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [isAuthenticated]);

  const callGoogleAppsScript = async (targetUrl, method = 'GET', postBody = null) => {
    try {
      const proxyRes = await fetch('/api/todoist?_t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gasProxy',
          gasUrl: targetUrl,
          gasMethod: method,
          gasBody: postBody
        }),
        cache: 'no-store'
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData && !proxyData.notSupported && !proxyData.error) {
          return proxyData;
        }
      }
    } catch (e) {}

    if (method === 'GET') {
      const sep = targetUrl.includes('?') ? '&' : '?';
      const res = await fetch(targetUrl + sep + 'action=json&_t=' + Date.now(), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      });
      return res.json();
    } else {
      const res = await fetch(targetUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postBody)
      });
      return res.json();
    }
  };

  const sendCalendarApiAction = async (bodyData, statusLabel = '⏳ Synchronisiere...') => {
    const targetUrl = (appsScriptUrl || '').trim();
    if (!targetUrl) return null;
    isMutatingCalendar.current = true;
    setIsSyncing(true);
    setSyncStatusText(statusLabel);
    try {
      const json = await callGoogleAppsScript(targetUrl, 'POST', bodyData);
      if (json?.result && Array.isArray(json.result.events)) {
        setEvents(json.result.events);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(json.result.events)); } catch (e) {}
      } else if (bodyData.action !== 'runDiagnostics') {
        setTimeout(() => pullFromCloud(targetUrl, false), 700);
      }
      const now = new Date();
      setSyncStatusText('⚡ Live-Sync (' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ')');
      return json;
    } catch (err) {
      setSyncStatusText('⚠️ Google-Sync prüfen');
      return null;
    } finally {
      isMutatingCalendar.current = false;
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async (urlOverride, showFeedback = true) => {
    if ((isMutatingCalendar.current || Date.now() - lastLocalEditTimeRef.current < 8000) && !showFeedback) return false;
    const targetUrl = (urlOverride !== undefined ? urlOverride : appsScriptUrl).trim();
    if (!targetUrl) return false;
    if (showFeedback) setIsSyncing(true);
    try {
      const bundle = await callGoogleAppsScript(targetUrl, 'GET', null);

      isApplyingRemoteState.current = true;
      const calMap = bundle?.calendarData?.calendars || {};
      const statusMap = bundle?.calendarData?.status || {};

      if (bundle?.state) {
        const s = bundle.state;
        if (s.familyName) setFamilyName(s.familyName);
        const baseMembers = (Array.isArray(s.members) && s.members.length >= 2) ? s.members : safeMembers;
        setMembers(baseMembers.map(m => {
          const cid = calMap[m.id] !== undefined && calMap[m.id] !== '' ? calMap[m.id] : (m.calendarId || (m.id === 'all' ? 'primary' : ''));
          const st = statusMap[m.id];
          return { ...m, calendarId: cid, ok: st ? Boolean(st.ok) : Boolean(cid), statusMsg: st?.msg || (cid ? 'Verbunden ✓' : 'Bereit') };
        }));
        if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
        if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
        if (s.schoolData?.dean) setSchoolData(s.schoolData);
        if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);

        const lockedTheme = typeof window !== 'undefined' ? localStorage.getItem('richter_tw_theme_lock') : null;
        if (!lockedTheme && s.currentTheme && Date.now() - lastThemeChangeRef.current > 20000) {
          setCurrentTheme(s.currentTheme);
        }

        if (s.customLogoUrl) setCustomLogoUrl(s.customLogoUrl);
        if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
      }

      if (Array.isArray(bundle?.calendarData?.events)) {
        setEvents(bundle.calendarData.events);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(bundle.calendarData.events)); } catch (e) {}
      }

      setTimeout(() => {
        isApplyingRemoteState.current = false;
        isInitialLoadDone.current = true;
      }, 250);

      if (showFeedback) showToast('Synchronisiert', 'Kalender & Cloud sind aktuell.', '☁️');
      return true;
    } catch (err) {
      isInitialLoadDone.current = true;
      isApplyingRemoteState.current = false;
      if (showFeedback) {
        showToast('Google-Verbindung', 'Bitte prüfe die Apps-Script-URL und ob die Bereitstellung auf „Jeder“ steht.', '⚠️');
      }
      return false;
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  const pullCloudRef = useRef(null);
  pullCloudRef.current = pullFromCloud;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qrCloudUrl = params.get('cloud');
      const qrFamily = params.get('family');

      const lockedTheme = localStorage.getItem('richter_tw_theme_lock');
      if (lockedTheme) setCurrentTheme(lockedTheme);

      const savedGasUrl = localStorage.getItem('richter_tw_gas_url') || '';
      const rawState = localStorage.getItem('richter_touchwall_v6');
      let parsedState = null;
      if (rawState) {
        try { parsedState = JSON.parse(rawState); } catch (e) {}
      }

      if (qrCloudUrl && qrCloudUrl.startsWith('https://script.google.com')) {
        const cleanName = qrFamily || parsedState?.familyName || 'Familien-Touchwall';
        setAppsScriptUrl(qrCloudUrl);
        setFamilyName(cleanName);
        localStorage.setItem('richter_tw_gas_url', qrCloudUrl);
        setTouchwallAuthCookie(cleanName);
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => pullCloudRef.current?.(qrCloudUrl, true), 200);
        return;
      }

      const cookieActive = hasTouchwallAuthCookie();
      const hasExistingLocalSetup = Boolean(
        cookieActive && (savedGasUrl || parsedState?.isConfigured || parsedState?.todoistConfig?.apiToken)
      );

      if (hasExistingLocalSetup) {
        if (savedGasUrl) setAppsScriptUrl(savedGasUrl);
        if (parsedState) {
          if (parsedState.familyName) setFamilyName(parsedState.familyName);
          if (Array.isArray(parsedState.members) && parsedState.members.length >= 2) setMembers(parsedState.members);
          if (Array.isArray(parsedState.mealPlan) && parsedState.mealPlan.length > 0) setMealPlan(parsedState.mealPlan);
          if (Array.isArray(parsedState.familyNotes) && parsedState.familyNotes.length > 0) setFamilyNotes(parsedState.familyNotes);
          if (parsedState.schoolData?.dean) setSchoolData(parsedState.schoolData);
          if (Array.isArray(parsedState.familyTasks)) setFamilyTasks(parsedState.familyTasks);
          if (!lockedTheme && parsedState.currentTheme) setCurrentTheme(parsedState.currentTheme);
          if (parsedState.customLogoUrl) setCustomLogoUrl(parsedState.customLogoUrl);
          if (parsedState.todoistConfig && typeof parsedState.todoistConfig === 'object') {
            setTodoistConfig(prev => ({ ...prev, ...parsedState.todoistConfig }));
          }
        }
        const savedEv = localStorage.getItem('richter_touchwall_events_cache');
        if (savedEv) {
          try {
            const parsedEv = JSON.parse(savedEv);
            if (Array.isArray(parsedEv)) setEvents(parsedEv);
          } catch (e) {}
        }
        setIsAuthenticated(true);
        isInitialLoadDone.current = true;
        if (savedGasUrl) {
          setTimeout(() => pullCloudRef.current?.(savedGasUrl, false), 300);
        }
      } else {
        if (savedGasUrl) setLoginGasUrl(savedGasUrl);
        if (parsedState?.todoistConfig?.apiToken) setLoginTodoistToken(parsedState.todoistConfig.apiToken);
        if (parsedState?.familyName) setLoginFamilyName(parsedState.familyName);
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !appsScriptUrl?.trim()) return;
    const calInterval = setInterval(() => {
      pullCloudRef.current?.(undefined, false);
    }, 30000);
    return () => clearInterval(calInterval);
  }, [isAuthenticated, appsScriptUrl]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const payload = {
      isConfigured: true,
      familyName,
      members: safeMembers,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData: safeSchoolData,
      familyTasks: safeTasks,
      currentTheme,
      customLogoUrl,
      todoistConfig: safeTodoistConfig
    };
    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload)); } catch (e) {}
    if (!isInitialLoadDone.current || isApplyingRemoteState.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const targetUrl = (appsScriptUrl || '').trim();
      if (!targetUrl) return;
      try {
        await callGoogleAppsScript(targetUrl, 'POST', { action: 'saveState', payload });
      } catch (e) {}
    }, 600);
  }, [isAuthenticated, familyName, safeMembers, safeMeals, safeNotes, safeSchoolData, safeTasks, currentTheme, customLogoUrl, safeTodoistConfig, appsScriptUrl]);

  const handleCloudLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUrl = loginGasUrl.trim();
    const cleanTok = loginTodoistToken.trim();
    const chosenTitle = loginFamilyName.trim() || 'Familien-Touchwall';

    if (!cleanUrl && !cleanTok) {
      setLoginError('Bitte trage deine Google Apps-Script URL oder dein Todoist API-Token ein.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const existingRaw = localStorage.getItem('richter_touchwall_v6');
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed.members) && parsed.members.length >= 2) setMembers(parsed.members);
          if (Array.isArray(parsed.mealPlan)) setMealPlan(parsed.mealPlan);
          if (Array.isArray(parsed.familyNotes)) setFamilyNotes(parsed.familyNotes);
          if (parsed.schoolData?.dean) setSchoolData(parsed.schoolData);
          if (Array.isArray(parsed.familyTasks)) setFamilyTasks(parsed.familyTasks);
        } catch (err) {}
      }

      if (cleanUrl) {
        setAppsScriptUrl(cleanUrl);
        localStorage.setItem('richter_tw_gas_url', cleanUrl);
        await pullFromCloud(cleanUrl, false);
      }

      if (cleanTok) {
        const disc = await discoverTodoistWorkspace(cleanTok);
        setTodoistConfig({
          apiToken: cleanTok,
          projects: Array.isArray(disc?.projects) ? disc.projects : [],
          shoppingProjectId: disc?.shoppingProjectId || '',
          tasksProjectId: disc?.tasksProjectId || '',
          collaborators: Array.isArray(disc?.collaborators) ? disc.collaborators : []
        });
      }

      setFamilyName(chosenTitle);
      setTouchwallAuthCookie(chosenTitle);
      isInitialLoadDone.current = true;
      setIsAuthenticated(true);
      showToast('Willkommen!', chosenTitle + ' wurde erfolgreich verbunden und im Cookie gespeichert.', '🔓');
    } catch (err) {
      setLoginError('Verbindung fehlgeschlagen: ' + (err.message || 'Bitte Daten prüfen.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateOwnTouchwallSubmit = (e) => {
    e.preventDefault();
    const chosenTitle = loginFamilyName.trim() || 'Meine Familien-Touchwall';
    const colors = ['navy_bold', 'pink', 'crimson_bold', 'teal_bold'];
    const emojis = ['👨', '👩', '👦', '👧'];
    const roles = ['Elternteil', 'Elternteil', 'Kind', 'Kind'];
    const ids = ['hans', 'sarah', 'dean', 'valentina'];

    const customMembers = [
      { id: 'all', name: 'Familie & Events', role: 'Alle gemeinsam', badge: 'FA', color: 'orange_bold', avatarType: 'emoji', emoji: '👨‍👩‍👧‍👦', photoUrl: '', calendarId: 'primary', todoistUserId: '', todoistProjectId: '', statusMsg: 'Hauptkalender', ok: true }
    ];

    setupMemberNames.forEach((rawName, idx) => {
      const clean = String(rawName || '').trim();
      if (clean) {
        customMembers.push({
          id: ids[idx] || ('mem_' + idx),
          name: clean,
          role: roles[idx] || 'Mitglied',
          badge: clean.charAt(0).toUpperCase(),
          color: colors[idx % colors.length],
          avatarType: 'emoji',
          emoji: emojis[idx % emojis.length],
          photoUrl: '',
          calendarId: '',
          todoistUserId: '',
          todoistProjectId: '',
          statusMsg: 'Bereit',
          ok: false
        });
      }
    });

    setFamilyName(chosenTitle);
    setMembers(customMembers);
    setEvents([]);
    setFamilyTasks([]);
    if (loginGasUrl.trim()) {
      setAppsScriptUrl(loginGasUrl.trim());
      localStorage.setItem('richter_tw_gas_url', loginGasUrl.trim());
    }
    if (loginTodoistToken.trim()) {
      setTodoistConfig(prev => ({ ...prev, apiToken: loginTodoistToken.trim() }));
    }

    setTouchwallAuthCookie(chosenTitle);
    isInitialLoadDone.current = true;
    setIsAuthenticated(true);
    showToast('Touchwall eingerichtet!', chosenTitle + ' ist jetzt lokal im Browser-Cookie aktiv.', '🎉');
  };

  const handleLogoutAndLock = () => {
    clearTouchwallAuthCookie();
    localStorage.removeItem('richter_touchwall_v6');
    localStorage.removeItem('richter_touchwall_events_cache');
    localStorage.removeItem('richter_tw_gas_url');
    setAppsScriptUrl('');
    setTodoistConfig({ apiToken: '', shoppingProjectId: '', tasksProjectId: '', projects: [], collaborators: [] });
    setMembers(DEFAULT_MEMBERS);
    setEvents([]);
    setFamilyTasks([]);
    setFamilyNotes(DEFAULT_NOTES);
    setMealPlan(DEFAULT_MEALS);
    setSchoolData(DEFAULT_SCHOOL);
    setFamilyName('Familien-Touchwall');
    setIsAuthenticated(false);
  };

  const shoppingNoteBlock = useMemo(() => safeNotes[0] || { id: 1, title: '🛒 Einkaufsliste', items: [] }, [safeNotes]);

  const setShoppingTileProjectId = (projId) => {
    lastLocalEditTimeRef.current = Date.now();
    setTodoistConfig(prev => ({ ...prev, shoppingProjectId: projId }));
    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map((n, idx) => idx === 0 ? { ...n, todoistProjectId: projId } : n));
    setTimeout(() => syncTodoistRef.current?.(true), 300);
  };

  const addItemToNoteTile = async (noteId, textStr) => {
    const clean = String(textStr || '').trim();
    if (!clean) return;
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = safeNotes.find(n => n.id === noteId);
    const isFirst = safeNotes[0]?.id === noteId;
    const projId = targetNote?.todoistProjectId || (isFirst ? safeTodoistConfig.shoppingProjectId : '');

    let todoistId = null;
    if (safeTodoistConfig.apiToken && projId) {
      try {
        const created = await createTodoistTaskItem(
          safeTodoistConfig.apiToken,
          projId,
          clean,
          null,
          '',
          '',
          1,
          '',
          'none',
          safeTodoistConfig.collaborators,
          true
        );
        if (created?.id) todoistId = String(created.id);
      } catch (e) {}
    }
    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map(n => n.id === noteId ? {
      ...n,
      items: [{ text: clean, done: false, todoistId }, ...(Array.isArray(n.items) ? n.items : [])]
    } : n));
  };

  const toggleItemInNoteTile = async (noteId, itemIdx) => {
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = safeNotes.find(n => n.id === noteId);
    const item = targetNote?.items?.[itemIdx];
    if (!item) return;
    const nextDone = !item.done;
    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map(n => n.id === noteId ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).map((it, i) => i === itemIdx ? { ...it, done: nextDone } : it)
    } : n));
    if (item.todoistId && safeTodoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(safeTodoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
  };

  const deleteItemInNoteTile = async (noteId, itemIdx) => {
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = safeNotes.find(n => n.id === noteId);
    const item = targetNote?.items?.[itemIdx];
    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map(n => n.id === noteId ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter((_, i) => i !== itemIdx)
    } : n));
    if (item?.todoistId && safeTodoistConfig.apiToken) {
      try { await deleteTodoistTask(safeTodoistConfig.apiToken, item.todoistId); } catch (e) {}
    }
  };

  const addShoppingItem = async (textStr) => {
    if (!safeNotes[0]) return;
    await addItemToNoteTile(safeNotes[0].id, textStr);
  };

  const addShoppingItemsBatch = async (textsArray) => {
    if (!safeNotes[0] || !Array.isArray(textsArray)) return;
    for (const txt of textsArray) {
      await addItemToNoteTile(safeNotes[0].id, txt);
    }
    showToast('In Todoist-Einkaufsliste', textsArray.length + ' Artikel übertragen!', '🛒');
  };

  const toggleShoppingItem = async (itemIdx) => {
    if (!safeNotes[0]) return;
    await toggleItemInNoteTile(safeNotes[0].id, itemIdx);
  };

  const deleteShoppingItem = async (itemIdx) => {
    if (!safeNotes[0]) return;
    await deleteItemInNoteTile(safeNotes[0].id, itemIdx);
  };

  const clearCompletedShoppingItems = () => {
    lastLocalEditTimeRef.current = Date.now();
    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map((n, idx) => idx === 0 ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).filter(it => !it.done)
    } : n));
  };

  const pushTaskToPhoneNow = async (task) => {
    if (!task) return;
    const memberObj = safeMembers.find(m => m.id === task.member);
    const targetProjId = task.projectId || memberObj?.todoistProjectId || safeTodoistConfig.tasksProjectId;

    if (!safeTodoistConfig.apiToken) {
      showToast('Token fehlt', 'Bitte unter „Konten“ dein Todoist API-Token eintragen.', '⚠️');
      return;
    }

    showToast('Sende Handy-Push...', '„' + task.title + '“ wird sofort an ' + (memberObj?.name || 'das Handy') + ' gepusht...', '📲');

    try {
      let currentTodoistId = task.todoistId;
      if (!currentTodoistId && targetProjId) {
        const created = await createTodoistTaskItem(
          safeTodoistConfig.apiToken,
          targetProjId,
          task.title,
          memberObj,
          task.dueDate || todayStr,
          task.dueTime || '',
          task.priority || 4,
          task.description || '',
          '0m',
          safeTodoistConfig.collaborators,
          true
        );
        if (created?.id) {
          currentTodoistId = String(created.id);
          setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === task.id ? { ...t, todoistId: currentTodoistId } : t));
        }
      } else if (currentTodoistId && pushTodoistTaskToPhoneNow) {
        await pushTodoistTaskToPhoneNow(
          safeTodoistConfig.apiToken,
          currentTodoistId,
          task.title,
          memberObj?.todoistUserId,
          safeTodoistConfig.collaborators
        );
      }

      showToast('Handy-Push gesendet!', 'Todoist-Benachrichtigung an ' + (memberObj?.name || 'Team') + ' wurde ausgelöst!', '✅');
    } catch (err) {
      showToast('Push-Hinweis', err.message, '⚠️');
    }
  };

  const addNewTaskWithSettings = async (
    titleStr,
    memberId,
    dueDateStr = '',
    dueTimeStr = '',
    notifyStr = '15m',
    pushToCal = false,
    priorityNum = 3,
    descriptionStr = '',
    customProjectId = ''
  ) => {
    const clean = String(titleStr || '').trim();
    if (!clean) return;
    lastLocalEditTimeRef.current = Date.now();
    const memberObj = safeMembers.find(m => m.id === memberId);
    const targetProjId = customProjectId || memberObj?.todoistProjectId || safeTodoistConfig.tasksProjectId;
    const dueLabel = dueDateStr
      ? 'Bis ' + dueDateStr.slice(8, 10) + '.' + dueDateStr.slice(5, 7) + '.' + (dueTimeStr ? ' ' + dueTimeStr + ' Uhr' : '')
      : (dueTimeStr ? 'Heute bis ' + dueTimeStr + ' Uhr' : 'Offen');

    let todoistId = null;
    if (safeTodoistConfig.apiToken && targetProjId) {
      try {
        const created = await createTodoistTaskItem(
          safeTodoistConfig.apiToken,
          targetProjId,
          clean,
          memberObj,
          dueDateStr,
          dueTimeStr,
          priorityNum,
          descriptionStr,
          notifyStr,
          safeTodoistConfig.collaborators,
          true
        );
        if (created?.id) todoistId = String(created.id);
      } catch (err) {
        showToast('Todoist-Hinweis', err.message, '⚠️');
      }
    }

    const newTask = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      todoistId,
      projectId: targetProjId,
      member: memberId,
      title: clean,
      description: descriptionStr,
      priority: Number(priorityNum || 1),
      due: dueLabel,
      dueDate: dueDateStr,
      dueTime: dueTimeStr,
      notifyTime: notifyStr,
      done: false
    };
    setFamilyTasks(prev => [newTask, ...(Array.isArray(prev) ? prev : [])]);
    showToast('Aufgabe & Handy-Push gesendet', clean + ' → ' + (memberObj?.name || memberId), '📲');

    if (pushToCal) {
      const calEv = {
        id: String(Date.now() + 500),
        title: '✅ Aufgabe: ' + clean,
        date: dueDateStr || todayStr,
        time: dueTimeStr ? dueTimeStr + ' - ' + dueTimeStr : 'Ganztägig',
        member: memberId,
        notifyTime: notifyStr === 'none' ? '15m' : notifyStr,
        notifyChannel: 'push',
        notifyUsers: [memberId],
        fromGoogle: true
      };
      setEvents(prev => [...(Array.isArray(prev) ? prev : []), calEv]);
      await sendCalendarApiAction({ action: 'createEvent', event: calEv }, '📲 Sende zusätzlichen Kalender-Wecker...');
    }
  };

  const toggleTaskDone = async (taskId, makeDone) => {
    lastLocalEditTimeRef.current = Date.now();
    const target = safeTasks.find(t => t.id === taskId);
    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === taskId ? { ...t, done: makeDone } : t));
    if (target?.todoistId && safeTodoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(safeTodoistConfig.apiToken, target.todoistId, makeDone); } catch (e) {}
    }
  };

  const deleteTaskItem = async (taskId) => {
    lastLocalEditTimeRef.current = Date.now();
    const target = safeTasks.find(t => t.id === taskId);
    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).filter(t => t.id !== taskId));
    if (target?.todoistId && safeTodoistConfig.apiToken) {
      try { await deleteTodoistTask(safeTodoistConfig.apiToken, target.todoistId); } catch (e) {}
    }
  };

  const clearCompletedMemberTasks = (memberId) => {
    lastLocalEditTimeRef.current = Date.now();
    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).filter(t => !(t.member === memberId && t.done)));
  };

  const duplicateEventToTarget = async (sourceEv, targetMemberId, targetDateStr) => {
    const newDate = targetDateStr || sourceEv.date || todayStr;
    const newMember = targetMemberId || sourceEv.member || 'all';
    const targetM = safeMembers.find(m => m.id === newMember);
    const copiedNewEv = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      title: String(sourceEv.title || 'Termin').trim(),
      date: newDate,
      time: sourceEv.time || 'Ganztägig',
      member: newMember,
      notifyTime: sourceEv.notifyTime || '30m',
      notifyChannel: sourceEv.notifyChannel || 'wall_push',
      notifyUsers: newMember === 'all' ? safeMembers.filter(m => m.id !== 'all').map(m => m.id) : [newMember],
      fromGoogle: true
    };
    setEvents(prev => [...(Array.isArray(prev) ? prev : []), copiedNewEv]);
    showToast('Termin kopiert & eingefügt!', '„' + copiedNewEv.title + '“ → ' + (targetM ? targetM.name : newMember) + ' (' + newDate + ')', '📋');
    await sendCalendarApiAction({ action: 'createEvent', event: copiedNewEv }, '⏳ Speichere Kopie in Google...');
  };

  const openNewEventModal = (dateStr = todayStr, memberId = 'all') => {
    setEventModal({
      open: true, id: null, origMember: '', origTitle: '', origDate: '',
      title: '', date: dateStr, time: '15:00 - 16:00',
      member: memberId, notifyTime: '30m', notifyChannel: 'wall_push',
      notifyUsers: memberId === 'all' ? safeMembers.filter(m => m.id !== 'all').map(m => m.id) : [memberId]
    });
  };

  const openEditEventModal = (e, ev) => {
    if (e) e.stopPropagation();
    setEventModal({
      open: true, id: ev.id, origMember: ev.member, origTitle: ev.title, origDate: ev.date,
      title: ev.title, date: ev.date, time: ev.time || 'Ganztägig',
      member: ev.member, notifyTime: ev.notifyTime || '30m', notifyChannel: ev.notifyChannel || 'wall_push',
      notifyUsers: Array.isArray(ev.notifyUsers) ? ev.notifyUsers : ['hans', 'sarah']
    });
  };

  const handleCalendarCellClick = (dateStr, memberId) => {
    if (copiedEvent) {
      duplicateEventToTarget(copiedEvent, memberId, dateStr);
      return;
    }
    openNewEventModal(dateStr, memberId);
  };

  const saveEventModal = async (e) => {
    e.preventDefault();
    if (!eventModal.title.trim()) return;
    if (eventModal.id) {
      const updatedEv = { ...eventModal, title: eventModal.title.trim(), fromGoogle: true };
      setEvents(prev => (Array.isArray(prev) ? prev : []).map(item => String(item.id) === String(eventModal.id) ? updatedEv : item));
      setEventModal({ ...eventModal, open: false });
      await sendCalendarApiAction({
        action: 'updateEvent', event: updatedEv,
        oldMember: eventModal.origMember || updatedEv.member,
        oldTitle: eventModal.origTitle || updatedEv.title,
        oldDate: eventModal.origDate || updatedEv.date
      });
    } else {
      const newEv = { ...eventModal, id: String(Date.now()), title: eventModal.title.trim(), fromGoogle: true };
      setEvents(prev => [...(Array.isArray(prev) ? prev : []), newEv]);
      setEventModal({ ...eventModal, open: false });
      await sendCalendarApiAction({ action: 'createEvent', event: newEv });
    }
  };

  const deleteEventById = async (id) => {
    const targetEv = safeEvents.find(ev => String(ev.id) === String(id));
    setEvents(prev => (Array.isArray(prev) ? prev : []).filter(ev => String(ev.id) !== String(id)));
    setEventModal({ ...eventModal, open: false });
    if (targetEv) {
      await sendCalendarApiAction({
        action: 'deleteEvent', eventId: String(targetEv.id),
        member: targetEv.member, title: targetEv.title, date: targetEv.date
      });
    }
  };

  const transferEvent = async (evId, targetMemberId, targetDateStr) => {
    const targetEv = safeEvents.find(ev => String(ev.id) === String(evId));
    if (!targetEv) return;
    const newDate = targetDateStr || targetEv.date;
    if (targetEv.member === targetMemberId && targetEv.date === newDate) return;
    const snapshot = { ...targetEv };
    setEvents(prev => (Array.isArray(prev) ? prev : []).map(ev => String(ev.id) === String(evId) ? { ...ev, member: targetMemberId, date: newDate } : ev));
    await sendCalendarApiAction({
      action: 'moveEvent', eventId: String(snapshot.id),
      oldMember: snapshot.member, targetMember: targetMemberId,
      newDate, eventSnapshot: snapshot, oldDate: snapshot.date
    });
  };

  const pushToCloudAndDrive = async (customMembersList, showFeedback = true) => {
    const listToSave = Array.isArray(customMembersList) ? customMembersList : safeMembers;
    const calMap = {};
    listToSave.forEach(m => { calMap[m.id] = (m.calendarId || '').trim(); });
    const payload = {
      isConfigured: true,
      familyName,
      members: listToSave,
      calendars: calMap,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData: safeSchoolData,
      familyTasks: safeTasks,
      currentTheme,
      customLogoUrl,
      todoistConfig: safeTodoistConfig
    };
    await sendCalendarApiAction({ action: 'saveDriveAndSync', payload, calendars: calMap }, '⏳ Speichere...');
    if (showFeedback) showToast('Gespeichert', 'Alle Konten & Daten wurden gesichert.', '✅');
  };

  const runAllPermissionsTest = async () => {
    setIsTestingDiag(true);
    const res = await sendCalendarApiAction({ action: 'runDiagnostics' }, '🧪 Prüfe...');
    setIsTestingDiag(false);
    if (res?.result) setDiagResult(res.result);
  };

  const periodLabel = useMemo(() => {
    if (currentView === 'year') return 'Jahreswand ' + currentBaseDate.getFullYear() + ' (BW)';
    const start = getMonday(currentBaseDate);
    const add = currentView === '1w' ? 6 : currentView === '2w' ? 13 : 27;
    const end = addDays(start, add);
    const fmt = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
    return fmt(start) + ' – ' + fmt(end) + end.getFullYear();
  }, [currentBaseDate, currentView]);

  const navigatePeriod = (dir) => {
    if (currentView === '1w') setCurrentBaseDate(addDays(currentBaseDate, dir * 7));
    else if (currentView === '2w') setCurrentBaseDate(addDays(currentBaseDate, dir * 14));
    else if (currentView === '4w') setCurrentBaseDate(addDays(currentBaseDate, dir * 28));
    else {
      const copy = new Date(currentBaseDate);
      copy.setFullYear(copy.getFullYear() + dir);
      setCurrentBaseDate(copy);
    }
  };

  const visibleMembers = useMemo(() => {
    return activeMemberFilter === 'all' ? safeMembers : safeMembers.filter(m => m.id === activeMemberFilter || m.id === 'all');
  }, [safeMembers, activeMemberFilter]);

  // =========================================================
  // SAUBER AUSGELAGERTE HANDLER & PROPS (VERHINDERT JEGLICHE JSX-SYNTAXFEHLER)
  // =========================================================
  const handleOpenEditTaskModal = (e, task) => {
    if (e) e.stopPropagation();
    setTaskModal({
      open: true,
      id: task.id,
      todoistId: task.todoistId || null,
      title: task.title || '',
      description: task.description || '',
      member: task.member || 'hans',
      priority: task.priority || 3,
      dueDate: task.dueDate || todayStr,
      dueTime: task.dueTime || '17:00',
      notifyTime: task.notifyTime || '15m',
      syncToCalendar: false
    });
  };

  const handleLogoUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setCustomLogoUrl(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleMemberPhotoUpload = (mid, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setMembers(prev => (Array.isArray(prev) ? prev : DEFAULT_MEMBERS).map(m => m.id === mid ? { ...m, photoUrl: ev.target.result, avatarType: 'photo' } : m));
    r.readAsDataURL(f);
  };

  const restoreScreenshotDefaults = () => {
    setMembers(prev => (Array.isArray(prev) ? prev : DEFAULT_MEMBERS).map(m => {
      const def = DEFAULT_MEMBERS.find(d => d.id === m.id);
      return def ? { ...def, calendarId: m.calendarId, todoistUserId: m.todoistUserId, todoistProjectId: m.todoistProjectId } : m;
    }));
    handleSelectTheme('metal');
  };

  const addExtraCalendarAccount = () => {
    const name = prompt('Name für neuen Kalender / Person:');
    if (!name?.trim()) return;
    const calId = prompt('Google Kalender-ID:') || '';
    setMembers(prev => [
      ...(Array.isArray(prev) ? prev : DEFAULT_MEMBERS),
      {
        id: 'cal_' + Date.now(),
        name: name.trim(),
        role: 'Zusatz',
        badge: name.trim().charAt(0).toUpperCase(),
        color: 'teal_bold',
        avatarType: 'emoji',
        emoji: '📅',
        calendarId: calId.trim(),
        todoistProjectId: '',
        ok: Boolean(calId.trim())
      }
    ]);
  };

  const importBackupJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (Array.isArray(d.members)) setMembers(d.members);
        if (Array.isArray(d.mealPlan)) setMealPlan(d.mealPlan);
        if (Array.isArray(d.familyNotes)) setFamilyNotes(d.familyNotes);
        if (d.schoolData) setSchoolData(d.schoolData);
        if (Array.isArray(d.familyTasks)) setFamilyTasks(d.familyTasks);
        showToast('Import erfolgreich', 'Backup wiederhergestellt.', '🎉');
      } catch (err) {}
    };
    r.readAsText(f);
  };

  const exportBackupJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      familyName,
      members: safeMembers,
      events: safeEvents,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData: safeSchoolData,
      familyTasks: safeTasks,
      todoistConfig: safeTodoistConfig
    }, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'touchwall_backup_' + todayStr + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const syncIconClass = isSyncing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5';

  const calendarProps = {
    currentView,
    currentBaseDate,
    todayStr,
    visibleMembers,
    members: safeMembers,
    events: safeEvents,
    themeStyles,
    getMemberStyles,
    renderAvatar,
    renderNotifyBadgeOnCard,
    setActiveSection,
    openNewEventModal,
    openEditEventModal,
    handleCalendarCellClick,
    duplicateEventToTarget,
    transferEvent,
    copiedEvent,
    setCopiedEvent,
    setYearDayModal,
    showToast
  };

  const todoistProps = {
    members: safeMembers,
    setMembers,
    familyTasks: safeTasks,
    shoppingNoteBlock,
    setShoppingTileProjectId,
    todoistConfig: safeTodoistConfig,
    createAndSelectTodoistProject,
    isSyncing,
    lastAutoSyncTime,
    themeStyles,
    getMemberStyles,
    renderAvatar,
    syncWithTodoistNow,
    addNewTaskWithSettings,
    pushTaskToPhoneNow,
    toggleTaskDone,
    deleteTaskItem,
    clearCompletedMemberTasks,
    openEditTaskModal: handleOpenEditTaskModal,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCompletedShoppingItems,
    setActiveSection
  };

  const otherSectionsProps = {
    activeSection,
    members: safeMembers,
    setMembers,
    schoolData: safeSchoolData,
    setSchoolData,
    activeSchoolChild,
    setActiveSchoolChild,
    setSchoolModal,
    mealPlan: safeMeals,
    setMealPlan,
    familyNotes: safeNotes,
    setFamilyNotes,
    addItemToNoteTile,
    toggleItemInNoteTile,
    deleteItemInNoteTile,
    currentTheme,
    setCurrentTheme: handleSelectTheme,
    customLogoUrl,
    setCustomLogoUrl,
    handleLogoUpload,
    handleMemberPhotoUpload,
    restoreScreenshotDefaults,
    appsScriptUrl,
    setAppsScriptUrl,
    todoistConfig: safeTodoistConfig,
    setTodoistConfig,
    connectAndDiscoverTodoist,
    createAndSelectTodoistProject,
    addShoppingItemsBatch,
    runAllPermissionsTest,
    isTestingDiag,
    diagResult,
    pullFromCloud,
    pushToCloudAndDrive,
    addExtraCalendarAccount,
    importBackupJson,
    exportBackupJson,
    setQrModalOpen,
    themeStyles,
    getMemberStyles,
    renderAvatar,
    showToast
  };

  const globalStyles = [
    '@keyframes twShockwave {',
    '  0% { transform: translate(-50%, -50%) scale(0.15); opacity: 0.9; }',
    '  100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }',
    '}',
    '.tw-glow-card, .tw-glow-subtle {',
    '  transition: background-color 0.2s ease, border-color 0.2s ease;',
    '}',
    '.tw-glow-subtle.cursor-pointer {',
    '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, border-color 0.18s ease;',
    '}',
    '.tw-glow-subtle.cursor-pointer:hover {',
    '  transform: translateY(-1.5px) scale(1.01);',
    '  border-color: var(--tw-btn-border) !important;',
    '  box-shadow: 0 6px 18px -4px var(--tw-btn-glow), inset 0 1px 1px rgba(255, 255, 255, 0.2);',
    '}',
    '.tw-glow-subtle.cursor-pointer:active {',
    '  transform: scale(0.965) translateY(1px) !important;',
    '  box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.6), 0 0 10px var(--tw-btn-glow) !important;',
    '}',
    '.tw-glow-btn, .tw-theme-btn, button.bg-indigo-600, button.bg-sky-500, button.bg-emerald-600, button.bg-emerald-500, label.tw-glow-btn {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 24%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 24%, var(--tw-btn-rest-base)) 100%) !important;',
    '  color: var(--tw-btn-rest-text) !important;',
    '  border: 1px solid color-mix(in srgb, var(--tw-btn-border) 32%, transparent) !important;',
    '  box-shadow: none !important;',
    '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s cubic-bezier(0.22, 1, 0.36, 1), background 0.18s ease, border-color 0.18s ease, color 0.18s ease !important;',
    '}',
    '.tw-nav-inactive {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 12%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 12%, var(--tw-btn-rest-base)) 100%);',
    '  border: 1px solid rgba(255, 255, 255, 0.12);',
    '  box-shadow: none !important;',
    '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;',
    '}',
    '.tw-active-nav {',
    '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 46%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 46%, var(--tw-btn-rest-base)) 100%) !important;',
    '  color: #ffffff !important;',
    '  border: 1.5px solid color-mix(in srgb, var(--tw-btn-border) 70%, transparent) !important;',
    '  box-shadow: none !important;',
    '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease !important;',
    '}',
    '.tw-glow-btn:hover, .tw-theme-btn:hover, .tw-nav-inactive:hover, .tw-active-nav:hover, button.bg-indigo-600:hover, button.bg-sky-500:hover, button.bg-emerald-600:hover, button.bg-emerald-500:hover, label.tw-glow-btn:hover {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  border-color: var(--tw-btn-border) !important;',
    '  transform: translateY(-2px) scale(1.035);',
    '  box-shadow: 0 10px 24px -2px var(--tw-btn-glow), 0 0 18px var(--tw-btn-glow), inset 0 1px 3px rgba(255, 255, 255, 0.5) !important;',
    '}',
    'button:active, .tw-glow-btn:active, .tw-nav-inactive:active, .tw-active-nav:active, label.tw-glow-btn:active {',
    '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
    '  color: #ffffff !important;',
    '  transform: scale(0.94) translateY(1.5px) !important;',
    '  box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.65), 0 0 14px var(--tw-btn-glow) !important;',
    '  transition: transform 0.06s ease-out, box-shadow 0.06s ease-out !important;',
    '}'
  ].join('\n');

  if (isCheckingAuth) {
    return (
      <div className="w-screen h-screen bg-[#15181c] text-slate-100 flex items-center justify-center">
        <div className="text-sm font-extrabold opacity-70 animate-pulse">🔒 Prüfe lokalen Cookie-Login...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        onPointerDown={spawnTouchRipple}
        style={{
          '--tw-btn-from': themeStyles.btnFrom || '#0ea5e9',
          '--tw-btn-to': themeStyles.btnTo || '#4f46e5',
          '--tw-btn-border': themeStyles.btnBorder || '#38bdf8',
          '--tw-btn-glow': themeStyles.btnGlow || 'rgba(56, 189, 248, 0.5)',
          '--tw-btn-rest-base': '#1e222d',
          '--tw-btn-rest-text': '#e2e8f0'
        }}
        className="w-screen h-screen bg-[#12151a] text-slate-100 flex items-center justify-center p-4 overflow-y-auto select-none"
      >
        <style>{globalStyles}</style>

        <div className="w-full max-w-2xl rounded-3xl border-2 border-slate-700/80 bg-[#1c2128] p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
          <div className="flex items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-400/30">
                  🛡️ Zero-Data Privacy • Cookie-Login
                </span>
                <h1 className="text-2xl font-black mt-1">Touchwall Login & Einrichtung</h1>
                <p className="text-xs text-slate-400 font-semibold">
                  Auf dieser Seite sind vorab keine persönlichen Daten hinterlegt. Deine Zugangsdaten werden erst nach dem Eintragen lokal im Browser-Cookie gespeichert.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-[#13171c] border border-slate-700/70">
            <button
              type="button"
              onClick={() => { setAuthTab('cloud'); setLoginError(''); }}
              className={'py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ' + (authTab === 'cloud' ? 'tw-active-nav' : 'tw-nav-inactive text-slate-400')}
            >
              <KeyRound className="w-4 h-4" />
              <span>1. Mit Cloud-Touchwall anmelden</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('new'); setLoginError(''); }}
              className={'py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ' + (authTab === 'new' ? 'tw-active-nav' : 'tw-nav-inactive text-slate-400')}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Eigene Touchwall erstellen</span>
            </button>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
              ⚠️ {loginError}
            </div>
          )}

          {authTab === 'cloud' ? (
            <form onSubmit={handleCloudLoginSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-3.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                    🏠 Name deiner Touchwall (Anzeigename oben im Header)
                  </label>
                  <input
                    type="text"
                    value={loginFamilyName}
                    onChange={(e) => setLoginFamilyName(e.target.value)}
                    placeholder="z.B. Familie ..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-amber-400 mb-1">
                    🔗 Deine persönliche Google Apps-Script URL (Cloud-Login)
                  </label>
                  <input
                    type="url"
                    value={loginGasUrl}
                    onChange={(e) => setLoginGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-xs font-mono text-white placeholder-slate-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Lädt nach dem Login automatisch deine Familienmitglieder, Kalender-Termine, Notizen und Einstellungen aus deiner privaten Google-Cloud.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-emerald-400 mb-1">
                    🔑 Todoist API-Token (Optional – falls nicht bereits in der Cloud hinterlegt)
                  </label>
                  <input
                    type="password"
                    value={loginTodoistToken}
                    onChange={(e) => setLoginTodoistToken(e.target.value)}
                    placeholder="Todoist API-Token..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-xs font-mono text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isLoggingIn ? 'Verbinde & lade deine Daten...' : '🔓 Anmelden & im Cookie speichern'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateOwnTouchwallSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-3.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                    🏠 Euer Familien- / Team-Name
                  </label>
                  <input
                    type="text"
                    required
                    value={loginFamilyName}
                    onChange={(e) => setLoginFamilyName(e.target.value)}
                    placeholder="z.B. Familie Müller oder WG-Planer"
                    className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-amber-400 mb-1.5">
                    👨‍👩‍👧‍👦 Eure Personen / Spalten (Jederzeit später anpassbar)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {setupMemberNames.map((mName, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={mName}
                        onChange={(e) => {
                          const next = [...setupMemberNames];
                          next[idx] = e.target.value;
                          setSetupMemberNames(next);
                        }}
                        placeholder={'Person ' + (idx + 1)}
                        className="px-3.5 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-xs font-bold text-white placeholder-slate-500"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <input
                    type="url"
                    value={loginGasUrl}
                    onChange={(e) => setLoginGasUrl(e.target.value)}
                    placeholder="Eigene Apps-Script URL (optional)"
                    className="px-3.5 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-xs font-mono text-white placeholder-slate-500"
                  />
                  <input
                    type="password"
                    value={loginTodoistToken}
                    onChange={(e) => setLoginTodoistToken(e.target.value)}
                    placeholder="Eigenes Todoist-Token (optional)"
                    className="px-3.5 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-xs font-mono text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>✨ Eigene Touchwall starten & Cookie speichern</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const qrShareUrl = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname + (appsScriptUrl ? '?cloud=' + encodeURIComponent(appsScriptUrl) + '&family=' + encodeURIComponent(familyName) : '')
    : 'https://vercel.com';

  return (
    <div
      onPointerDown={spawnTouchRipple}
      style={{
        '--tw-btn-from': themeStyles.btnFrom || '#0ea5e9',
        '--tw-btn-to': themeStyles.btnTo || '#4f46e5',
        '--tw-btn-border': themeStyles.btnBorder || '#38bdf8',
        '--tw-btn-glow': themeStyles.btnGlow || 'rgba(56, 189, 248, 0.5)',
        '--tw-btn-rest-base': themeStyles.dark ? '#1e222d' : '#e2e8f0',
        '--tw-btn-rest-text': themeStyles.dark ? '#e2e8f0' : '#1e293b'
      }}
      className={'w-screen h-screen overflow-hidden flex flex-col p-1.5 sm:p-2.5 select-none transition-colors duration-300 ' + themeStyles.outer}
    >
      <style>{globalStyles}</style>

      {touchRipples.map(r => (
        <span
          key={r.id}
          style={{
            left: r.x,
            top: r.y,
            borderColor: themeStyles.btnBorder || '#38bdf8',
            boxShadow: '0 0 25px ' + (themeStyles.btnGlow || 'rgba(56,189,248,0.85)'),
            animation: 'twShockwave 0.62s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          className="fixed z-[9999] pointer-events-none w-16 h-16 rounded-full border-2 bg-white/15"
        />
      ))}

      <div className={'w-full h-full rounded-3xl border shadow-2xl flex overflow-hidden ' + themeStyles.shell}>

        {/* LINKES SEITENMENÜ */}
        <aside className={'w-20 sm:w-24 border-r flex flex-col items-center justify-between py-4 shrink-0 ' + themeStyles.sidebar}>
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => { setCurrentBaseDate(getMonday(new Date())); setActiveSection('kalender'); }}
              className="tw-glow-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-black text-lg">TW</span>}
            </button>

            <nav className="flex flex-col items-center gap-2 w-full px-2">
              {[
                { id: 'kalender', label: 'Kalender', icon: Calendar },
                { id: 'schule',   label: 'Schule',   icon: GraduationCap },
                { id: 'aufgaben', label: 'Todoist',  icon: CheckSquare },
                { id: 'essen',    label: 'Essensplan', icon: Utensils },
                { id: 'listen',   label: 'Notizen',  icon: FileText },
                { id: 'design',   label: 'Design',   icon: Palette },
                { id: 'google',   label: 'Konten',   icon: Cloud }
              ].map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={'w-full py-2.5 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-extrabold cursor-pointer relative ' + (active ? 'tw-active-nav scale-[1.02]' : 'tw-nav-inactive ' + themeStyles.textMuted)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="truncate max-w-full px-1">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <button
              onClick={() => openNewEventModal(todayStr, 'all')}
              title="Neuen Termin anlegen"
              className="tw-glow-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-black flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
            <button
              onClick={handleLogoutAndLock}
              title="Touchwall sperren & Cookie löschen (Abmelden)"
              className="tw-nav-inactive w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* HAUPTBEREICH */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className={'px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ' + themeStyles.header}>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black">{clockStr}</span>
                <span className="opacity-30 text-xl">|</span>
                <span className="text-lg sm:text-xl font-extrabold">{familyName}</span>

                <button
                  onClick={() => {
                    const idx = PAGE_THEMES.findIndex(t => t.id === currentTheme);
                    const nextTheme = PAGE_THEMES[(idx + 1) % PAGE_THEMES.length];
                    handleSelectTheme(nextTheme.id);
                    showToast('Theme dauerhaft aktiviert', nextTheme.name, '🎨');
                  }}
                  className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  {PAGE_THEMES.find(t => t.id === currentTheme)?.name}
                </button>

                <button
                  onClick={() => { pullFromCloud(undefined, true); syncWithTodoistNow(true); }}
                  className="tw-glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  <RefreshCw className={syncIconClass} />
                  <span>{syncStatusText}</span>
                </button>

                <button
                  onClick={requestBrowserPushPermission}
                  className="tw-glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{pushPermission === 'granted' ? 'Push-Alarm aktiv' : 'Push aktivieren'}</span>
                </button>

                <button onClick={() => setQrModalOpen(true)} className="tw-glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer">
                  <Smartphone className="w-3.5 h-3.5" /> Handy-Sync
                </button>

                <button
                  onClick={() => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
                    else document.exitFullscreen?.();
                  }}
                  className="tw-glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Vollbild
                </button>

                <button
                  onClick={handleLogoutAndLock}
                  title="Abmelden & lokale Daten/Cookie aus diesem Browser entfernen"
                  className="tw-nav-inactive inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-400 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Sperren
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button onClick={() => navigatePeriod(-1)} className="tw-glow-btn w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => { setCurrentBaseDate(getMonday(new Date())); setActiveSection('kalender'); }} className="tw-glow-btn px-3 py-1 rounded-xl font-extrabold cursor-pointer">Heute</button>
                <button onClick={() => navigatePeriod(1)} className="tw-glow-btn w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                <span className={'px-3 py-1 rounded-xl font-extrabold border ' + themeStyles.subtle}>{periodLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={'flex gap-1 p-1.5 rounded-2xl border ' + themeStyles.subtle}>
                {[
                  { id: '1w', label: '1 Woche' },
                  { id: '2w', label: '2 Wochen' },
                  { id: '4w', label: '4 Wochen' },
                  { id: 'year', label: 'Jahreswand' }
                ].map(v => {
                  const isAct = currentView === v.id && activeSection === 'kalender';
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setCurrentView(v.id); setActiveSection('kalender'); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ' + (isAct ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.textMuted)}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMemberFilter('all')}
                  className={'px-4 h-10 rounded-2xl font-extrabold text-xs cursor-pointer ' + (activeMemberFilter === 'all' ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.textMuted)}
                >
                  Alle
                </button>
                {safeMembers.filter(m => m.id !== 'all').map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemberFilter(m.id === activeMemberFilter ? 'all' : m.id)}
                    className={'relative rounded-full cursor-pointer transition-transform hover:scale-105 ' + (activeMemberFilter === m.id ? 'ring-3 ring-white scale-110 shadow-lg' : 'opacity-80 hover:opacity-100')}
                  >
                    {renderAvatar(m, 'w-10 h-10', 'text-sm')}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {copiedEvent && (
            <div className="bg-amber-400 text-slate-950 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 z-30 shrink-0 shadow-lg">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-black">
                <ClipboardPaste className="w-6 h-6 shrink-0" />
                <span>
                  KOPIER-MODUS AKTIV: „{copiedEvent.title}“ ({copiedEvent.time}) — Tippe jetzt einfach auf ein beliebiges Tagesfeld (auch bei einer anderen Person), um den Termin dort einzufügen!
                </span>
              </div>
              <button
                onClick={() => setCopiedEvent(null)}
                className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
              >
                ✕ Kopier-Modus beenden
              </button>
            </div>
          )}

          {/* HAUPT-VIEWPORT */}
          <main className={'flex-1 overflow-auto ' + themeStyles.viewport}>
            {activeSection === 'kalender' && (
              <CalendarSection {...calendarProps} />
            )}

            {activeSection === 'aufgaben' && (
              <TasksTodoistSection {...todoistProps} />
            )}

            {['schule', 'essen', 'listen', 'design', 'google'].includes(activeSection) && (
              <OtherSections {...otherSectionsProps} />
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: TERMIN ERSTELLEN / BEARBEITEN / KOPIEREN */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={saveEventModal} className={'w-full max-w-xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 my-auto ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold">{eventModal.id ? 'Termin bearbeiten & kopieren' : 'Neuer Familientermin'}</h3>
              <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text"
              required
              value={eventModal.title}
              onChange={(e) => setEventModal({ ...eventModal, title: e.target.value })}
              placeholder="z.B. ⚽ Fußballtraining oder 🦷 Zahnarzt"
              className={'w-full px-4 py-3 rounded-2xl border font-bold text-base ' + themeStyles.input}
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {safeMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEventModal({ ...eventModal, member: m.id, notifyUsers: m.id === 'all' ? safeMembers.filter(x => x.id !== 'all').map(x => x.id) : [m.id] })}
                  className={'p-2.5 rounded-2xl flex flex-col items-center gap-1 cursor-pointer ' + (eventModal.member === m.id ? 'tw-active-nav' : 'tw-nav-inactive ' + themeStyles.subtle)}
                >
                  {renderAvatar(m, 'w-8 h-8', 'text-xs')}
                  <span className="text-xs font-extrabold truncate max-w-full">{m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {eventModal.title.trim() && (
              <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase flex items-center gap-1.5 text-amber-400">
                    <Copy className="w-4 h-4" /> Termin sofort kopieren für:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedEvent(eventModal);
                      setEventModal({ ...eventModal, open: false });
                      showToast('Kopier-Modus aktiv!', 'Tippe jetzt im Kalender auf beliebige Tage zum Einfügen!', '📋');
                    }}
                    className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" /> Im Kalender frei einfügen...
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {safeMembers.map(tm => (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => duplicateEventToTarget(eventModal, tm.id, eventModal.date)}
                      className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> + {tm.id === 'all' ? 'Familie' : tm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={eventModal.date} onChange={(e) => setEventModal({ ...eventModal, date: e.target.value })} className={'px-4 py-2.5 rounded-2xl border font-bold text-sm ' + themeStyles.input} />
              <input type="text" value={eventModal.time} onChange={(e) => setEventModal({ ...eventModal, time: e.target.value })} className={'px-4 py-2.5 rounded-2xl border font-bold text-sm ' + themeStyles.input} />
            </div>
            <div className={'p-4 rounded-2xl border space-y-3 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Erinnerung</span>
                <button type="button" onClick={() => triggerEventAlarmNow(eventModal, true)} className="tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={eventModal.notifyTime} onChange={(e) => setEventModal({ ...eventModal, notifyTime: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}>
                  <option value="none" className="bg-slate-800 text-white">Keine</option>
                  <option value="0m" className="bg-slate-800 text-white">Pünktlich</option>
                  <option value="15m" className="bg-slate-800 text-white">15 Min. vorher</option>
                  <option value="30m" className="bg-slate-800 text-white">30 Min. vorher</option>
                  <option value="1h" className="bg-slate-800 text-white">1 Std. vorher</option>
                  <option value="1d" className="bg-slate-800 text-white">1 Tag vorher</option>
                </select>
                <select value={eventModal.notifyChannel} onChange={(e) => setEventModal({ ...eventModal, notifyChannel: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}>
                  <option value="wall_push" className="bg-slate-800 text-white">Touchwall + Handy Push</option>
                  <option value="wall" className="bg-slate-800 text-white">Nur Touchwall</option>
                  <option value="mail" className="bg-slate-800 text-white">E-Mail & Push</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              {eventModal.id ? <button type="button" onClick={() => deleteEventById(eventModal.id)} className="px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer">🗑️ Löschen</button> : <div />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className="tw-nav-inactive px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer">Abbrechen</button>
                <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer">Speichern</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1B: AUFGABEN-FRIST BEARBEITEN */}
      {taskModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              lastLocalEditTimeRef.current = Date.now();
              const dueLabel = taskModal.dueDate
                ? 'Bis ' + taskModal.dueDate.slice(8, 10) + '.' + taskModal.dueDate.slice(5, 7) + '.' + (taskModal.dueTime ? ' ' + taskModal.dueTime + ' Uhr' : '')
                : (taskModal.dueTime ? 'Heute bis ' + taskModal.dueTime + ' Uhr' : 'Offen');

              setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === taskModal.id ? {
                ...t,
                title: taskModal.title,
                description: taskModal.description,
                member: taskModal.member,
                priority: Number(taskModal.priority || 1),
                due: dueLabel,
                dueDate: taskModal.dueDate,
                dueTime: taskModal.dueTime,
                notifyTime: taskModal.notifyTime
              } : t));

              const targetMemberObj = safeMembers.find(m => m.id === taskModal.member);
              if (taskModal.todoistId && safeTodoistConfig.apiToken) {
                try {
                  await updateTodoistTaskItem(safeTodoistConfig.apiToken, taskModal.todoistId, {
                    title: taskModal.title,
                    description: taskModal.description,
                    priority: taskModal.priority,
                    assigneeId: targetMemberObj?.todoistUserId,
                    dueDate: taskModal.dueDate,
                    dueTime: taskModal.dueTime,
                    notifyTime: taskModal.notifyTime
                  });
                } catch (err) {}
              }

              if (taskModal.syncToCalendar) {
                const calEv = {
                  id: String(Date.now()),
                  title: '✅ Aufgabe: ' + taskModal.title,
                  date: taskModal.dueDate || todayStr,
                  time: taskModal.dueTime ? taskModal.dueTime + ' - ' + taskModal.dueTime : 'Ganztägig',
                  member: taskModal.member,
                  notifyTime: taskModal.notifyTime === 'none' ? '15m' : taskModal.notifyTime,
                  notifyChannel: 'push',
                  notifyUsers: [taskModal.member],
                  fromGoogle: true
                };
                setEvents(prev => [...(Array.isArray(prev) ? prev : []), calEv]);
                await sendCalendarApiAction({ action: 'createEvent', event: calEv });
              }

              setTaskModal({ ...taskModal, open: false });
              showToast('Frist & Erinnerung gespeichert', taskModal.title + ' (' + dueLabel + ')', '⏰');
            }}
            className={'w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Aufgabe: Bis wann erledigen & Erinnerung
              </h3>
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                value={taskModal.title}
                onChange={(e) => setTaskModal({ ...taskModal, title: e.target.value })}
                className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}
              />
              <input
                type="text"
                value={taskModal.description}
                onChange={(e) => setTaskModal({ ...taskModal, description: e.target.value })}
                placeholder="Notiz / Beschreibung zur Aufgabe..."
                className={'w-full px-4 py-2 rounded-xl border text-xs font-semibold ' + themeStyles.input}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={'block text-[11px] font-extrabold uppercase mb-1 ' + themeStyles.textMuted}>Zuständig</label>
                <select
                  value={taskModal.member}
                  onChange={(e) => setTaskModal({ ...taskModal, member: e.target.value })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  {safeMembers.filter(m => m.id !== 'all').map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-white">👤 {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={'block text-[11px] font-extrabold uppercase mb-1 ' + themeStyles.textMuted}>Priorität</label>
                <select
                  value={taskModal.priority}
                  onChange={(e) => setTaskModal({ ...taskModal, priority: Number(e.target.value) })}
                  className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                >
                  <option value={4} className="bg-slate-800 text-white">🔥 P1 - Sehr dringend</option>
                  <option value={3} className="bg-slate-800 text-white">🟠 P2 - Wichtig</option>
                  <option value={2} className="bg-slate-800 text-white">🔵 P3 - Mittel</option>
                  <option value={1} className="bg-slate-800 text-white">⚪ P4 - Normal</option>
                </select>
              </div>
            </div>

            <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400">⏳ Bis wann muss es erledigt sein?</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: todayStr, dueTime: '18:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">Heute</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 1)), dueTime: '17:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">Morgen</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 7)), dueTime: '17:00' })} className="tw-glow-btn px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer">+1 Woche</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={taskModal.dueDate} onChange={(e) => setTaskModal({ ...taskModal, dueDate: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input} />
                <input type="time" value={taskModal.dueTime} onChange={(e) => setTaskModal({ ...taskModal, dueTime: e.target.value })} className={'px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input} />
              </div>
            </div>

            <div className={'p-3.5 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Wann erinnern?</span>
                <button
                  type="button"
                  onClick={() => triggerEventAlarmNow({
                    title: '✅ Aufgabe: ' + taskModal.title,
                    time: 'Bis ' + (taskModal.dueTime || '17:00') + ' Uhr',
                    date: taskModal.dueDate || todayStr,
                    notifyTime: taskModal.notifyTime,
                    notifyUsers: [taskModal.member]
                  }, true)}
                  className="tw-glow-btn px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <select
                value={taskModal.notifyTime}
                onChange={(e) => setTaskModal({ ...taskModal, notifyTime: e.target.value })}
                className={'w-full px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
              >
                <option value="none" className="bg-slate-800 text-white">🔕 Keine Erinnerung</option>
                <option value="0m" className="bg-slate-800 text-white">🔔 Pünktlich zur Frist</option>
                <option value="5m" className="bg-slate-800 text-white">🔔 5 Min. vorher</option>
                <option value="15m" className="bg-slate-800 text-white">🔔 15 Min. vorher</option>
                <option value="30m" className="bg-slate-800 text-white">🔔 30 Min. vorher</option>
                <option value="1h" className="bg-slate-800 text-white">🔔 1 Std. vorher</option>
                <option value="1d" className="bg-slate-800 text-white">🔔 1 Tag vorher</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })} className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer">💾 Speichern & Synchronisieren</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: JAHRESWAND TAGES-DETAILS */}
      {yearDayModal.open && (() => {
        const dayEvents = safeEvents.filter(e => e.date === yearDayModal.dateStr);
        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={'w-full max-w-xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">📅 Tagesübersicht: {yearDayModal.dateStr}</h3>
                <button onClick={() => setYearDayModal({ ...yearDayModal, open: false })} className="tw-nav-inactive w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div className={'p-6 text-center rounded-2xl border border-dashed text-xs font-bold opacity-60 ' + themeStyles.divider}>
                    Keine Termine an diesem Tag.
                  </div>
                ) : (
                  dayEvents.map(ev => {
                    const mem = safeMembers.find(m => m.id === ev.member) || safeMembers[0];
                    return (
                      <div key={ev.id} style={getMemberStyles(mem).headerStyle} className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-sm">{ev.title} ({mem.name})</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCopiedEvent(ev);
                              setYearDayModal({ ...yearDayModal, open: false });
                              showToast('Termin kopiert!', 'Tippe jetzt auf einen beliebigen Tag zum Einfügen!', '📋');
                            }}
                            className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" /> Kopieren
                          </button>
                          <button onClick={() => deleteEventById(ev.id)} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: SCHULSTUNDE */}
      {schoolModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const key = schoolModal.dayIdx + '-' + schoolModal.periodIdx;
              setSchoolData(prev => {
                const base = prev && typeof prev === 'object' ? prev : DEFAULT_SCHOOL;
                const childObj = base[activeSchoolChild] || DEFAULT_SCHOOL[activeSchoolChild];
                const nextSlots = { ...(childObj.slots || {}) };
                if (!schoolModal.subject.trim()) delete nextSlots[key];
                else nextSlots[key] = { subject: schoolModal.subject.trim(), room: schoolModal.room.trim(), status: schoolModal.status };
                return { ...base, [activeSchoolChild]: { ...childObj, slots: nextSlots } };
              });
              setSchoolModal({ ...schoolModal, open: false });
            }}
            className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}
          >
            <h3 className="text-lg font-extrabold">Schulstunde anpassen</h3>
            <input type="text" value={schoolModal.subject} onChange={(e) => setSchoolModal({ ...schoolModal, subject: e.target.value })} placeholder="Fach..." className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input} />
            <input type="text" value={schoolModal.room} onChange={(e) => setSchoolModal({ ...schoolModal, room: e.target.value })} placeholder="Raum / Lehrer..." className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input} />
            <select value={schoolModal.status} onChange={(e) => setSchoolModal({ ...schoolModal, status: e.target.value })} className={'w-full px-4 py-2.5 rounded-xl border text-sm font-bold ' + themeStyles.input}>
              <option value="normal" className="bg-slate-800 text-white">Regulär</option>
              <option value="change" className="bg-slate-800 text-white">Vertretung / Änderung</option>
              <option value="exam" className="bg-slate-800 text-white">Arbeit / Test</option>
              <option value="cancel" className="bg-slate-800 text-white">Entfall</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSchoolModal({ ...schoolModal, open: false })} className="tw-nav-inactive px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer">Speichern</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: QR CODE (MIT MAGIC-LOGIN FÜR FAMILIEN-SMARTPHONES) */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl text-center space-y-4 ' + themeStyles.modal}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">📱 Smartphone Direkt-Login</h3>
              <button onClick={() => setQrModalOpen(false)} className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
              Scanne diesen QR-Code mit dem Handy – eure Cloud-Verbindung und das Login-Cookie werden auf dem Smartphone sofort automatisch eingerichtet!
            </p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
              <img src={'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(qrShareUrl)} alt="QR" className="w-48 h-48" />
            </div>
          </div>
        </div>
      )}

      {/* ALARM BANNER */}
      {activeAlarmBanner && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={'w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl space-y-4 text-center ' + themeStyles.modal}>
            <h3 className="text-2xl font-extrabold">🔔 {activeAlarmBanner.title}</h3>
            <p className="text-sm font-bold">{activeAlarmBanner.time} ({activeAlarmBanner.date})</p>
            <p className="text-xs font-extrabold text-sky-400">👤 Für: {activeAlarmBanner.who}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => playTouchwallAlarmSound()} className="tw-nav-inactive px-4 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer">🔊 Ton testen</button>
              <button onClick={() => setActiveAlarmBanner(null)} className="tw-glow-btn px-6 py-2.5 rounded-2xl text-sm font-black cursor-pointer">✅ Verstanden</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={'fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-3 ' + themeStyles.modal} style={{ borderColor: themeStyles.btnBorder }}>
          <span className="text-2xl">{toast.icon}</span>
          <div>
            <div className="font-extrabold text-xs text-amber-400 uppercase">{toast.title}</div>
            <div className="font-semibold text-sm">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
