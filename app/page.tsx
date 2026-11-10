// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, GraduationCap, CheckSquare, Utensils, FileText,
  Palette, Cloud, Plus, ChevronLeft, ChevronRight, Maximize2,
  Smartphone, RefreshCw, X, Volume2, BellRing, Copy, ClipboardPaste, Clock
} from 'lucide-react';

import {
  formatDateStr, addDays, getMonday, playTouchwallAlarmSound,
  COLOR_PALETTES, PAGE_THEMES, DEFAULT_MEMBERS,
  DEFAULT_MEALS, DEFAULT_NOTES, DEFAULT_SCHOOL, DEFAULT_APPS_SCRIPT_URL,
  buildThemeStyles, buildMemberStyles,
  discoverTodoistWorkspace, pullFromTodoistTwoWay, createTodoistTaskItem,
  updateTodoistTaskItem, closeOrReopenTodoistTask, deleteTodoistTask,
  createNewTodoistProject
} from './touchwallConfig';

import CalendarSection from './CalendarSection';
import TasksTodoistSection from './TasksTodoistSection';
import OtherSections from './OtherSections';

export default function TouchwallApp() {
  const [todayStr, setTodayStr] = useState(() => formatDateStr(new Date()));
  const [currentBaseDate, setCurrentBaseDate] = useState(() => getMonday(new Date()));
  const [currentView, setCurrentView] = useState('1w');
  const [activeSection, setActiveSection] = useState('kalender');
  const [activeMemberFilter, setActiveMemberFilter] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [clockStr, setClockStr] = useState('');

  // Cloud- & Todoist-Konfiguration
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

  // Touch-Shockwave-Effekt für echtes Touchscreen-Gefühl
  const [touchRipples, setTouchRipples] = useState([]);

  // Alarm & Refs für fehlerfreien 8-Sekunden-Hintergrund-Sync
  const [pushPermission, setPushPermission] = useState('default');
  const [activeAlarmBanner, setActiveAlarmBanner] = useState(null);
  const triggeredAlarmsRef = useRef({});
  const isInitialLoadDone = useRef(false);
  const isApplyingRemoteState = useRef(false);
  const isMutatingCalendar = useRef(false);
  const lastLocalEditTimeRef = useRef(0);
  const autoSaveTimer = useRef(null);

  // Kerndaten
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [familyTasks, setFamilyTasks] = useState([
    { id: 1, member: 'hans',      title: 'Todoist Team „Familie Richter“ verbinden', description: '', priority: 3, due: 'Heute', dueDate: '', dueTime: '', notifyTime: '30m', done: false },
    { id: 2, member: 'sarah',     title: 'Essensplan für nächste Woche durchsehen',  description: '', priority: 2, due: 'Morgen', dueDate: '', dueTime: '', notifyTime: '30m', done: false },
    { id: 3, member: 'dean',      title: '🎒 Schultasche & Sportzeug richten',       description: '', priority: 3, due: 'Bis 17:00 Uhr', dueDate: '', dueTime: '17:00', notifyTime: '15m', done: false },
    { id: 4, member: 'valentina', title: '🧸 Zimmer aufräumen & 15 Min. Lesen',      description: '', priority: 2, due: 'Bis 16:30 Uhr', dueDate: '', dueTime: '16:30', notifyTime: '15m', done: false }
  ]);

  // Modals & Kopier-Speicher
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

  // =========================================================
  // TOUCH-SHOCKWAVE BEIM ANTIPPEN / KLICKEN
  // =========================================================
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
    if (member.avatarType === 'photo' && member.photoUrl) {
      return (
        <div
          style={{ borderColor: COLOR_PALETTES[member.color]?.hex || '#3b82f6' }}
          className={`${size} rounded-full border-2 shadow-sm shrink-0 overflow-hidden relative flex items-center justify-center font-extrabold`}
        >
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (member.avatarType === 'emoji' && member.emoji) {
      return (
        <div style={st.badgeStyle} className={`${size} rounded-full flex items-center justify-center ${textSize} shadow-sm shrink-0`}>
          {member.emoji}
        </div>
      );
    }
    return (
      <div style={st.badgeStyle} className={`${size} rounded-full font-extrabold ${textSize} flex items-center justify-center shadow-sm shrink-0`}>
        {member.badge}
      </div>
    );
  };

  const renderNotifyBadgeOnCard = (ev) => {
    if (!ev.notifyTime || ev.notifyTime === 'none') return null;
    const chIcon = ev.notifyChannel === 'push' ? '📲' : ev.notifyChannel === 'mail' ? '✉️' : '🔔';
    const userBadges = Array.isArray(ev.notifyUsers) && ev.notifyUsers.length > 0
      ? ev.notifyUsers.map(uid => members.find(x => x.id === uid)?.badge).filter(Boolean).join(',')
      : '';
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-extrabold shrink-0">
        {chIcon} {userBadges ? `${userBadges} • ` : ''}{ev.notifyTime}
      </span>
    );
  };

  // =========================================================
  // 1. UHRZEIT & BROWSER-PUSH ALARM
  // =========================================================
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
      setClockStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
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
      new Notification('🔔 Familien-Touchwall Push aktiv!', { body: 'Browser-Push & Sound sind bereit.' });
      showToast('Browser-Push aktiv', 'Alarme sind eingeschaltet!', '🔔');
      return true;
    }
    return false;
  };

  const triggerEventAlarmNow = (evObj, isTest = false) => {
    const whoNames = (evObj.notifyUsers || [])
      .map(uid => members.find(m => m.id === uid)?.name || uid)
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
        new Notification(`🔔 ${evObj.title}`, { body: `⏰ ${evObj.time} • Für: ${whoNames}` });
      } catch (e) {}
    }
  };

  useEffect(() => {
    const offsetMinutesMap = { '0m': 0, '5m': 5, '10m': 10, '15m': 15, '30m': 30, '1h': 60, '2h': 120, '1d': 1440 };
    const checkAlarms = () => {
      const now = new Date();
      const nowMs = now.getTime();

      events.forEach(ev => {
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
        const key = `ev_${ev.id}_${ev.date}_${ev.time}_${ev.notifyTime}`;
        if (diffMs >= 0 && diffMs <= 180000 && !triggeredAlarmsRef.current[key]) {
          triggeredAlarmsRef.current[key] = nowMs;
          try { localStorage.setItem('richter_tw_triggered_alarms', JSON.stringify(triggeredAlarmsRef.current)); } catch (e) {}
          triggerEventAlarmNow(ev, false);
        }
      });

      familyTasks.forEach(task => {
        if (!task || task.done || !task.dueTime || !task.notifyTime || task.notifyTime === 'none') return;
        const dStr = task.dueDate || todayStr;
        const offsetMins = offsetMinutesMap[task.notifyTime] ?? 15;
        const parts = String(dStr).split('-');
        const tm = String(task.dueTime).match(/(\d{1,2}):(\d{2})/);
        if (parts.length !== 3 || !tm) return;
        const tDue = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), Number(tm[1]), Number(tm[2]), 0);
        const diffMs = nowMs - (tDue.getTime() - offsetMins * 60000);
        const key = `task_${task.id}_${dStr}_${task.dueTime}_${task.notifyTime}`;
        if (diffMs >= 0 && diffMs <= 180000 && !triggeredAlarmsRef.current[key]) {
          triggeredAlarmsRef.current[key] = nowMs;
          try { localStorage.setItem('richter_tw_triggered_alarms', JSON.stringify(triggeredAlarmsRef.current)); } catch (e) {}
          triggerEventAlarmNow({
            id: task.id,
            title: `✅ Aufgabe fällig: ${task.title}`,
            date: dStr,
            time: `Bis ${task.dueTime} Uhr`,
            notifyTime: task.notifyTime,
            notifyUsers: [task.member]
          }, false);
        }
      });
    };

    const timer = setInterval(checkAlarms, 15000);
    return () => clearInterval(timer);
  }, [events, familyTasks, members, todayStr]);

  // =========================================================
  // 2. VOLLAUTOMATISCHER 8-SEKUNDEN TODOIST 2-WEGE-SYNC
  // =========================================================
  const createAndSelectTodoistProject = async (projectName) => {
    if (!todoistConfig.apiToken?.trim() || !projectName?.trim()) return null;
    try {
      const created = await createNewTodoistProject(todoistConfig.apiToken, projectName.trim());
      if (created?.id) {
        setTodoistConfig(prev => ({
          ...prev,
          projects: [...(prev.projects || []), created]
        }));
        showToast('Projekt erstellt', `Todoist-Projekt „${created.name}“ wurde angelegt!`, '📂');
        return created;
      }
    } catch (err) {
      showToast('Projekt-Fehler', err.message, '❌');
    }
    return null;
  };

  const connectAndDiscoverTodoist = async () => {
    if (!todoistConfig.apiToken?.trim()) {
      showToast('Token fehlt', 'Bitte zuerst dein Todoist API-Token eintragen.', '⚠️');
      return;
    }
    setIsSyncing(true);
    try {
      const disc = await discoverTodoistWorkspace(todoistConfig.apiToken);
      const nextCfg = {
        ...todoistConfig,
        projects: disc.projects,
        shoppingProjectId: todoistConfig.shoppingProjectId || disc.shoppingProjectId,
        tasksProjectId: todoistConfig.tasksProjectId || disc.tasksProjectId,
        collaborators: disc.collaborators
      };
      setTodoistConfig(nextCfg);

      if (disc.collaborators.length > 0) {
        setMembers(prev => prev.map(m => {
          if (m.id === 'all' || m.todoistUserId) return m;
          const match = disc.collaborators.find(c =>
            c.name?.toLowerCase().includes(m.name.toLowerCase()) ||
            c.email?.toLowerCase().includes(m.id.toLowerCase())
          );
          return match ? { ...m, todoistUserId: String(match.id) } : m;
        }));
      }

      showToast('Todoist Team verbunden!', `${disc.projects.length} Projekte & ${disc.collaborators.length} Team-Mitglieder geladen.`, '🎉');
      await syncWithTodoistNow(false, nextCfg);
    } catch (err) {
      showToast('Todoist-Fehler', err.message, '❌');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithTodoistNow = async (showFeedback = false, cfgOverride = null) => {
    // Verhindert, dass ein Hintergrund-Poll genau während eines lokalen Klicks überschreibt
    if (!showFeedback && Date.now() - lastLocalEditTimeRef.current < 3500) return;

    const cfg = cfgOverride || todoistConfig;
    if (!cfg?.apiToken?.trim()) return;
    if (showFeedback) setIsSyncing(true);

    try {
      // Falls Projekte noch nie geladen wurden, einmalig im Hintergrund entdecken
      let activeCfg = cfg;
      if (!cfg.projects || cfg.projects.length === 0) {
        const disc = await discoverTodoistWorkspace(cfg.apiToken);
        activeCfg = {
          ...cfg,
          projects: disc.projects,
          shoppingProjectId: cfg.shoppingProjectId || disc.shoppingProjectId,
          tasksProjectId: cfg.tasksProjectId || disc.tasksProjectId,
          collaborators: disc.collaborators
        };
        setTodoistConfig(activeCfg);
      }

      const pulled = await pullFromTodoistTwoWay(activeCfg.apiToken, activeCfg, familyTasks, familyNotes, members);
      if (pulled) {
        isApplyingRemoteState.current = true;
        setFamilyTasks(pulled.tasks);
        setFamilyNotes(pulled.familyNotes);
        const now = new Date();
        const tStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLastAutoSyncTime(tStr);
        setSyncStatusText(`⚡ Live-Sync (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`);
        setTimeout(() => { isApplyingRemoteState.current = false; }, 200);
      }
      if (showFeedback) showToast('Todoist synchron', 'Alle Kacheln & Projekte sind abgeglichen.', '✅');
    } catch (err) {
      if (showFeedback) showToast('Todoist-Sync Hinweis', err.message, '⚠️');
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  // WICHTIG: Hält immer die aktuellste Sync-Funktion für den 8-Sekunden-Timer bereit (löst das Stale-Closure-Problem!)
  const syncTodoistRef = useRef(null);
  syncTodoistRef.current = syncWithTodoistNow;

  useEffect(() => {
    // Startet nach 1.5 Sek. den ersten Todoist-Abruf und läuft danach alle 8 Sekunden vollautomatisch!
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
  }, []);

  // =========================================================
  // 3. GOOGLE APPS SCRIPT SYNC & LOKALER SPEICHER
  // =========================================================
  const sendCalendarApiAction = async (bodyData, statusLabel = '⏳ Synchronisiere...') => {
    const targetUrl = (appsScriptUrl || DEFAULT_APPS_SCRIPT_URL).trim();
    if (!targetUrl) return null;
    isMutatingCalendar.current = true;
    setIsSyncing(true);
    setSyncStatusText(statusLabel);
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
      });
      const json = await res.json();
      if (json?.result && Array.isArray(json.result.events)) {
        setEvents(json.result.events);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(json.result.events)); } catch (e) {}
      } else if (bodyData.action !== 'runDiagnostics') {
        setTimeout(() => pullFromCloud(targetUrl, false), 700);
      }
      const now = new Date();
      setSyncStatusText(`⚡ Live-Sync (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`);
      return json;
    } catch (err) {
      setSyncStatusText('⚠️ Sync-Hinweis');
      return null;
    } finally {
      isMutatingCalendar.current = false;
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async (urlOverride, showFeedback = true) => {
    if (isMutatingCalendar.current && !showFeedback) return;
    const targetUrl = (urlOverride !== undefined ? urlOverride : appsScriptUrl).trim();
    if (!targetUrl) return;
    if (showFeedback) setIsSyncing(true);
    try {
      const sep = targetUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${targetUrl}${sep}action=json&_t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
      const bundle = await res.json();

      isApplyingRemoteState.current = true;
      const calMap = bundle?.calendarData?.calendars || {};
      const statusMap = bundle?.calendarData?.status || {};

      if (bundle?.state) {
        const s = bundle.state;
        const baseMembers = (Array.isArray(s.members) && s.members.length >= 5) ? s.members : members;
        setMembers(baseMembers.map(m => {
          const cid = calMap[m.id] !== undefined && calMap[m.id] !== '' ? calMap[m.id] : (m.calendarId || (m.id === 'all' ? 'primary' : ''));
          const st = statusMap[m.id];
          return { ...m, calendarId: cid, ok: st ? Boolean(st.ok) : Boolean(cid), statusMsg: st?.msg || (cid ? 'Verbunden ✓' : 'Bereit') };
        }));
        if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
        if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
        if (s.schoolData?.dean) setSchoolData(s.schoolData);
        if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
        if (s.currentTheme) setCurrentTheme(s.currentTheme);
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
    } catch (err) {
      isInitialLoadDone.current = true;
      isApplyingRemoteState.current = false;
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  };

  const pullCloudRef = useRef(null);
  pullCloudRef.current = pullFromCloud;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('richter_touchwall_v6');
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.members) && data.members.length >= 5) setMembers(data.members);
        if (Array.isArray(data.mealPlan)) setMealPlan(data.mealPlan);
        if (Array.isArray(data.familyNotes)) setFamilyNotes(data.familyNotes);
        if (data.schoolData?.dean) setSchoolData(data.schoolData);
        if (Array.isArray(data.familyTasks)) setFamilyTasks(data.familyTasks);
        if (data.currentTheme) setCurrentTheme(data.currentTheme);
        if (data.customLogoUrl) setCustomLogoUrl(data.customLogoUrl);
        if (data.todoistConfig) setTodoistConfig(data.todoistConfig);
      }
      const savedEv = localStorage.getItem('richter_touchwall_events_cache');
      if (savedEv) setEvents(JSON.parse(savedEv));
    } catch (e) {}

    pullCloudRef.current?.(DEFAULT_APPS_SCRIPT_URL, false);
    const calInterval = setInterval(() => {
      pullCloudRef.current?.(undefined, false);
    }, 30000);
    return () => clearInterval(calInterval);
  }, []);

  useEffect(() => {
    const payload = { members, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl, todoistConfig };
    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload)); } catch (e) {}
    if (!isInitialLoadDone.current || isApplyingRemoteState.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const targetUrl = (appsScriptUrl || DEFAULT_APPS_SCRIPT_URL).trim();
      if (!targetUrl) return;
      try {
        await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveState', payload })
        });
      } catch (e) {}
    }, 600);
  }, [members, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl, todoistConfig, appsScriptUrl]);

  // =========================================================
  // 4. KACHEL-AKTIONEN FÜR AUFGABEN, EINKAUFSLISTE & NOTIZEN (INKL. PROJEKT-WAHL)
  // =========================================================
  const shoppingNoteBlock = useMemo(() => familyNotes[0] || { id: 1, title: '🛒 Einkaufsliste', items: [] }, [familyNotes]);

  const setShoppingTileProjectId = (projId) => {
    lastLocalEditTimeRef.current = Date.now();
    setTodoistConfig(prev => ({ ...prev, shoppingProjectId: projId }));
    setFamilyNotes(prev => prev.map((n, idx) => idx === 0 ? { ...n, todoistProjectId: projId } : n));
    setTimeout(() => syncTodoistRef.current?.(true), 300);
  };

  const addItemToNoteTile = async (noteId, textStr) => {
    const clean = String(textStr || '').trim();
    if (!clean) return;
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = familyNotes.find(n => n.id === noteId);
    const isFirst = familyNotes[0]?.id === noteId;
    const projId = targetNote?.todoistProjectId || (isFirst ? todoistConfig.shoppingProjectId : '');

    let todoistId = null;
    if (todoistConfig.apiToken && projId) {
      try {
        const created = await createTodoistTaskItem(todoistConfig.apiToken, projId, clean, null, '', '', 1, '', 'none');
        if (created?.id) todoistId = String(created.id);
      } catch (e) {}
    }
    setFamilyNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      items: [{ text: clean, done: false, todoistId }, ...(n.items || [])]
    } : n));
  };

  const toggleItemInNoteTile = async (noteId, itemIdx) => {
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = familyNotes.find(n => n.id === noteId);
    const item = targetNote?.items?.[itemIdx];
    if (!item) return;
    const nextDone = !item.done;
    setFamilyNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      items: n.items.map((it, i) => i === itemIdx ? { ...it, done: nextDone } : it)
    } : n));
    if (item.todoistId && todoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
  };

  const deleteItemInNoteTile = async (noteId, itemIdx) => {
    lastLocalEditTimeRef.current = Date.now();
    const targetNote = familyNotes.find(n => n.id === noteId);
    const item = targetNote?.items?.[itemIdx];
    setFamilyNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      items: n.items.filter((_, i) => i !== itemIdx)
    } : n));
    if (item?.todoistId && todoistConfig.apiToken) {
      try { await deleteTodoistTask(todoistConfig.apiToken, item.todoistId); } catch (e) {}
    }
  };

  const addShoppingItem = async (textStr) => {
    if (!familyNotes[0]) return;
    await addItemToNoteTile(familyNotes[0].id, textStr);
  };

  const addShoppingItemsBatch = async (textsArray) => {
    if (!familyNotes[0]) return;
    for (const txt of textsArray) {
      await addItemToNoteTile(familyNotes[0].id, txt);
    }
    showToast('In Todoist-Einkaufsliste', `${textsArray.length} Artikel übertragen!`, '🛒');
  };

  const toggleShoppingItem = async (itemIdx) => {
    if (!familyNotes[0]) return;
    await toggleItemInNoteTile(familyNotes[0].id, itemIdx);
  };

  const deleteShoppingItem = async (itemIdx) => {
    if (!familyNotes[0]) return;
    await deleteItemInNoteTile(familyNotes[0].id, itemIdx);
  };

  const clearCompletedShoppingItems = () => {
    lastLocalEditTimeRef.current = Date.now();
    setFamilyNotes(prev => prev.map((n, idx) => idx === 0 ? {
      ...n,
      items: (n.items || []).filter(it => !it.done)
    } : n));
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
    const memberObj = members.find(m => m.id === memberId);
    const targetProjId = customProjectId || memberObj?.todoistProjectId || todoistConfig.tasksProjectId;
    const dueLabel = dueDateStr
      ? `Bis ${dueDateStr.slice(8, 10)}.${dueDateStr.slice(5, 7)}.${dueTimeStr ? ' ' + dueTimeStr + ' Uhr' : ''}`
      : (dueTimeStr ? `Heute bis ${dueTimeStr} Uhr` : 'Offen');

    let todoistId = null;
    if (todoistConfig.apiToken && targetProjId) {
      try {
        const created = await createTodoistTaskItem(
          todoistConfig.apiToken,
          targetProjId,
          clean,
          memberObj,
          dueDateStr,
          dueTimeStr,
          priorityNum,
          descriptionStr,
          notifyStr
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
    setFamilyTasks(prev => [newTask, ...prev]);
    showToast('Aufgabe & Frist angelegt', `${clean} → ${memberObj?.name || memberId}`, '📲');

    if (pushToCal) {
      const calEv = {
        id: String(Date.now() + 500),
        title: `✅ Aufgabe: ${clean}`,
        date: dueDateStr || todayStr,
        time: dueTimeStr ? `${dueTimeStr} - ${dueTimeStr}` : 'Ganztägig',
        member: memberId,
        notifyTime: notifyStr === 'none' ? '15m' : notifyStr,
        notifyChannel: 'push',
        notifyUsers: [memberId],
        fromGoogle: true
      };
      setEvents(prev => [...prev, calEv]);
      await sendCalendarApiAction({ action: 'createEvent', event: calEv }, '📲 Sende zusätzlichen Kalender-Wecker...');
    }
  };

  const toggleTaskDone = async (taskId, makeDone) => {
    lastLocalEditTimeRef.current = Date.now();
    const target = familyTasks.find(t => t.id === taskId);
    setFamilyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: makeDone } : t));
    if (target?.todoistId && todoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(todoistConfig.apiToken, target.todoistId, makeDone); } catch (e) {}
    }
  };

  const deleteTaskItem = async (taskId) => {
    lastLocalEditTimeRef.current = Date.now();
    const target = familyTasks.find(t => t.id === taskId);
    setFamilyTasks(prev => prev.filter(t => t.id !== taskId));
    if (target?.todoistId && todoistConfig.apiToken) {
      try { await deleteTodoistTask(todoistConfig.apiToken, target.todoistId); } catch (e) {}
    }
  };

  const clearCompletedMemberTasks = (memberId) => {
    lastLocalEditTimeRef.current = Date.now();
    setFamilyTasks(prev => prev.filter(t => !(t.member === memberId && t.done)));
  };

  // =========================================================
  // 5. KALENDER-TERMINE & KOPIEREN / VERSCHIEBEN
  // =========================================================
  const duplicateEventToTarget = async (sourceEv, targetMemberId, targetDateStr) => {
    const newDate = targetDateStr || sourceEv.date || todayStr;
    const newMember = targetMemberId || sourceEv.member || 'all';
    const targetM = members.find(m => m.id === newMember);
    const copiedNewEv = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      title: String(sourceEv.title || 'Termin').trim(),
      date: newDate,
      time: sourceEv.time || 'Ganztägig',
      member: newMember,
      notifyTime: sourceEv.notifyTime || '30m',
      notifyChannel: sourceEv.notifyChannel || 'wall_push',
      notifyUsers: newMember === 'all' ? ['hans', 'sarah', 'dean', 'valentina'] : [newMember],
      fromGoogle: true
    };
    setEvents(prev => [...prev, copiedNewEv]);
    showToast('Termin eingefügt', `„${copiedNewEv.title}“ → ${targetM ? targetM.name : newMember}`, '📋');
    await sendCalendarApiAction({ action: 'createEvent', event: copiedNewEv }, '⏳ Speichere Kopie...');
  };

  const openNewEventModal = (dateStr = todayStr, memberId = 'all') => {
    setEventModal({
      open: true, id: null, origMember: '', origTitle: '', origDate: '',
      title: '', date: dateStr, time: '15:00 - 16:00',
      member: memberId, notifyTime: '30m', notifyChannel: 'wall_push',
      notifyUsers: memberId === 'all' ? ['hans', 'sarah', 'dean', 'valentina'] : [memberId]
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
      setEvents(prev => prev.map(item => String(item.id) === String(eventModal.id) ? updatedEv : item));
      setEventModal({ ...eventModal, open: false });
      await sendCalendarApiAction({
        action: 'updateEvent', event: updatedEv,
        oldMember: eventModal.origMember || updatedEv.member,
        oldTitle: eventModal.origTitle || updatedEv.title,
        oldDate: eventModal.origDate || updatedEv.date
      });
    } else {
      const newEv = { ...eventModal, id: String(Date.now()), title: eventModal.title.trim(), fromGoogle: true };
      setEvents(prev => [...prev, newEv]);
      setEventModal({ ...eventModal, open: false });
      await sendCalendarApiAction({ action: 'createEvent', event: newEv });
    }
  };

  const deleteEventById = async (id) => {
    const targetEv = events.find(ev => String(ev.id) === String(id));
    setEvents(prev => prev.filter(ev => String(ev.id) !== String(id)));
    setEventModal({ ...eventModal, open: false });
    if (targetEv) {
      await sendCalendarApiAction({
        action: 'deleteEvent', eventId: String(targetEv.id),
        member: targetEv.member, title: targetEv.title, date: targetEv.date
      });
    }
  };

  const transferEvent = async (evId, targetMemberId, targetDateStr) => {
    const targetEv = events.find(ev => String(ev.id) === String(evId));
    if (!targetEv) return;
    const newDate = targetDateStr || targetEv.date;
    if (targetEv.member === targetMemberId && targetEv.date === newDate) return;
    const snapshot = { ...targetEv };
    setEvents(prev => prev.map(ev => String(ev.id) === String(evId) ? { ...ev, member: targetMemberId, date: newDate } : ev));
    await sendCalendarApiAction({
      action: 'moveEvent', eventId: String(snapshot.id),
      oldMember: snapshot.member, targetMember: targetMemberId,
      newDate, eventSnapshot: snapshot, oldDate: snapshot.date
    });
  };

  const pushToCloudAndDrive = async (customMembersList, showFeedback = true) => {
    const listToSave = customMembersList || members;
    const calMap = {};
    listToSave.forEach(m => { calMap[m.id] = (m.calendarId || '').trim(); });
    const payload = { members: listToSave, calendars: calMap, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl, todoistConfig };
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
    if (currentView === 'year') return `Jahreswand ${currentBaseDate.getFullYear()} (BW)`;
    const start = getMonday(currentBaseDate);
    const add = currentView === '1w' ? 6 : currentView === '2w' ? 13 : 27;
    const end = addDays(start, add);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
    return `${fmt(start)} – ${fmt(end)}${end.getFullYear()}`;
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
    return activeMemberFilter === 'all' ? members : members.filter(m => m.id === activeMemberFilter || m.id === 'all');
  }, [members, activeMemberFilter]);

  return (
    <div
      onPointerDown={spawnTouchRipple}
      className={`w-screen h-screen overflow-hidden flex flex-col p-1.5 sm:p-2.5 select-none transition-colors duration-300 ${themeStyles.outer}`}
    >
      {/* GLOBALE TOUCH- & HOVER-GLOW ENGINE (BLAUES LEUCHTEN, PULSIEREN & FEDER-EFFEKT) */}
      <style>{`
        @keyframes twShockwave {
          0% { transform: translate(-50%, -50%) scale(0.15); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        @keyframes twNeonPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(56, 189, 248, 0.35), inset 0 0 8px rgba(56, 189, 248, 0.15); }
          50% { box-shadow: 0 0 26px rgba(56, 189, 248, 0.72), inset 0 0 14px rgba(56, 189, 248, 0.28); }
        }
        .tw-glow-card {
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .tw-glow-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.65) !important;
          box-shadow: 0 10px 28px -6px rgba(56, 189, 248, 0.28), 0 0 16px rgba(56, 189, 248, 0.22);
        }
        .tw-glow-subtle {
          transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tw-glow-subtle:hover {
          border-color: rgba(56, 189, 248, 0.6) !important;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.24), inset 0 0 8px rgba(56, 189, 248, 0.10);
          transform: translateY(-1px);
        }
        .tw-glow-subtle:active, .tw-glow-btn:active, button:active {
          transform: scale(0.95) !important;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.8) !important;
        }
        .tw-glow-btn {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tw-glow-btn:hover {
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.55);
          transform: translateY(-1px) scale(1.02);
        }
        .tw-active-nav {
          animation: twNeonPulse 2.8s infinite ease-in-out;
          border: 1px solid rgba(56, 189, 248, 0.75);
        }
      `}</style>

      {/* VISUELLE TOUCH-WELLEN BEI JEDEM FINGER-TIPP / MAUSKLICK */}
      {touchRipples.map(r => (
        <span
          key={r.id}
          style={{
            left: r.x,
            top: r.y,
            animation: 'twShockwave 0.62s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          className="fixed z-[9999] pointer-events-none w-16 h-16 rounded-full border-2 border-sky-400 bg-sky-400/20 shadow-[0_0_25px_rgba(56,189,248,0.85)]"
        />
      ))}

      <div className={`w-full h-full rounded-3xl border shadow-2xl flex overflow-hidden ${themeStyles.shell}`}>

        {/* LINKES SEITENMENÜ */}
        <aside className={`w-20 sm:w-24 border-r flex flex-col items-center justify-between py-4 shrink-0 ${themeStyles.sidebar}`}>
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => { setCurrentBaseDate(getMonday(new Date())); setActiveSection('kalender'); }}
              className="tw-glow-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-amber-400 flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/25 cursor-pointer"
            >
              {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-black text-lg text-white">FR</span>}
            </button>

            <nav className="flex flex-col items-center gap-1.5 w-full px-2">
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
                    className={`tw-glow-btn w-full py-2.5 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-extrabold transition-all cursor-pointer relative ${
                      active
                        ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white tw-active-nav scale-[1.03]'
                        : `${themeStyles.textMuted} hover:bg-sky-500/15 hover:text-sky-300`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="truncate max-w-full px-1">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={() => openNewEventModal(todayStr, 'all')}
            className="tw-glow-btn w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-sky-400 via-emerald-400 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.5)] cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </aside>

        {/* HAUPTBEREICH */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${themeStyles.header}`}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black">{clockStr}</span>
                <span className="opacity-30 text-xl">|</span>
                <span className="text-lg sm:text-xl font-extrabold">Familie Richter</span>

                <button
                  onClick={() => {
                    const idx = PAGE_THEMES.findIndex(t => t.id === currentTheme);
                    setCurrentTheme(PAGE_THEMES[(idx + 1) % PAGE_THEMES.length].id);
                  }}
                  className="tw-glow-btn px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 cursor-pointer"
                >
                  {PAGE_THEMES.find(t => t.id === currentTheme)?.name}
                </button>

                <button
                  onClick={() => { pullFromCloud(undefined, true); syncWithTodoistNow(true); }}
                  className="tw-glow-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {syncStatusText}
                </button>

                <button
                  onClick={requestBrowserPushPermission}
                  className="tw-glow-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/40 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  {pushPermission === 'granted' ? 'Push-Alarm aktiv' : 'Push aktivieren'}
                </button>

                <button onClick={() => setQrModalOpen(true)} className="tw-glow-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-pointer">
                  <Smartphone className="w-3.5 h-3.5" /> Handy-Sync
                </button>

                <button
                  onClick={() => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
                    else document.exitFullscreen?.();
                  }}
                  className={`tw-glow-btn inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${themeStyles.subtle} cursor-pointer`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Vollbild
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button onClick={() => navigatePeriod(-1)} className={`tw-glow-btn w-7 h-7 rounded-lg border flex items-center justify-center ${themeStyles.subtle} cursor-pointer`}><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => { setCurrentBaseDate(getMonday(new Date())); setActiveSection('kalender'); }} className={`tw-glow-btn px-2.5 py-1 rounded-lg border font-extrabold ${themeStyles.subtle} cursor-pointer`}>Heute</button>
                <button onClick={() => navigatePeriod(1)} className={`tw-glow-btn w-7 h-7 rounded-lg border flex items-center justify-center ${themeStyles.subtle} cursor-pointer`}><ChevronRight className="w-4 h-4" /></button>
                <span className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold border border-sky-400/30">{periodLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex p-1 rounded-2xl border ${themeStyles.subtle}`}>
                {[
                  { id: '1w', label: '1 Woche' },
                  { id: '2w', label: '2 Wochen' },
                  { id: '4w', label: '4 Wochen' },
                  { id: 'year', label: 'Jahreswand' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setCurrentView(v.id); setActiveSection('kalender'); }}
                    className={`tw-glow-btn px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      currentView === v.id && activeSection === 'kalender'
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_0_14px_rgba(56,189,248,0.5)]'
                        : themeStyles.textMuted
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMemberFilter('all')}
                  className={`tw-glow-btn px-3.5 h-10 rounded-full border-2 font-extrabold text-xs cursor-pointer ${
                    activeMemberFilter === 'all' ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.6)]' : themeStyles.subtle
                  }`}
                >
                  Alle
                </button>
                {members.filter(m => m.id !== 'all').map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemberFilter(m.id === activeMemberFilter ? 'all' : m.id)}
                    className={`tw-glow-btn relative rounded-full cursor-pointer ${activeMemberFilter === m.id ? 'ring-4 ring-sky-400 scale-110 shadow-[0_0_18px_rgba(56,189,248,0.8)]' : ''}`}
                  >
                    {renderAvatar(m, 'w-10 h-10', 'text-sm')}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {copiedEvent && (
            <div className="bg-amber-400 text-slate-950 px-5 py-2.5 flex items-center justify-between gap-3 border-b-2 border-slate-900 z-30 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
                <ClipboardPaste className="w-5 h-5" />
                <span>KOPIER-MODUS AKTIV: „{copiedEvent.title}“ — Tippe jetzt auf ein beliebiges Tagesfeld zum Einfügen!</span>
              </div>
              <button onClick={() => setCopiedEvent(null)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer">
                ✕ Beenden
              </button>
            </div>
          )}

          {/* HAUPT-VIEWPORT */}
          <main className={`flex-1 overflow-auto ${themeStyles.viewport}`}>
            {activeSection === 'kalender' && (
              <CalendarSection
                currentView={currentView}
                currentBaseDate={currentBaseDate}
                todayStr={todayStr}
                visibleMembers={visibleMembers}
                members={members}
                events={events}
                themeStyles={themeStyles}
                getMemberStyles={getMemberStyles}
                renderAvatar={renderAvatar}
                renderNotifyBadgeOnCard={renderNotifyBadgeOnCard}
                setActiveSection={setActiveSection}
                openNewEventModal={openNewEventModal}
                openEditEventModal={openEditEventModal}
                handleCalendarCellClick={handleCalendarCellClick}
                duplicateEventToTarget={duplicateEventToTarget}
                transferEvent={transferEvent}
                copiedEvent={copiedEvent}
                setCopiedEvent={setCopiedEvent}
                setYearDayModal={setYearDayModal}
                showToast={showToast}
              />
            )}

            {activeSection === 'aufgaben' && (
              <TasksTodoistSection
                members={members}
                setMembers={setMembers}
                familyTasks={familyTasks}
                shoppingNoteBlock={shoppingNoteBlock}
                setShoppingTileProjectId={setShoppingTileProjectId}
                todoistConfig={todoistConfig}
                createAndSelectTodoistProject={createAndSelectTodoistProject}
                isSyncing={isSyncing}
                lastAutoSyncTime={lastAutoSyncTime}
                themeStyles={themeStyles}
                getMemberStyles={getMemberStyles}
                renderAvatar={renderAvatar}
                syncWithTodoistNow={syncWithTodoistNow}
                addNewTaskWithSettings={addNewTaskWithSettings}
                toggleTaskDone={toggleTaskDone}
                deleteTaskItem={deleteTaskItem}
                clearCompletedMemberTasks={clearCompletedMemberTasks}
                openEditTaskModal={(e, task) => {
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
                }}
                addShoppingItem={addShoppingItem}
                toggleShoppingItem={toggleShoppingItem}
                deleteShoppingItem={deleteShoppingItem}
                clearCompletedShoppingItems={clearCompletedShoppingItems}
                setActiveSection={setActiveSection}
              />
            )}

            {['schule', 'essen', 'listen', 'design', 'google'].includes(activeSection) && (
              <OtherSections
                activeSection={activeSection}
                members={members}
                setMembers={setMembers}
                schoolData={schoolData}
                setSchoolData={setSchoolData}
                activeSchoolChild={activeSchoolChild}
                setActiveSchoolChild={setActiveSchoolChild}
                setSchoolModal={setSchoolModal}
                mealPlan={mealPlan}
                setMealPlan={setMealPlan}
                familyNotes={familyNotes}
                setFamilyNotes={setFamilyNotes}
                addItemToNoteTile={addItemToNoteTile}
                toggleItemInNoteTile={toggleItemInNoteTile}
                deleteItemInNoteTile={deleteItemInNoteTile}
                currentTheme={currentTheme}
                setCurrentTheme={setCurrentTheme}
                customLogoUrl={customLogoUrl}
                setCustomLogoUrl={setCustomLogoUrl}
                handleLogoUpload={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = (ev) => setCustomLogoUrl(ev.target.result);
                  r.readAsDataURL(f);
                }}
                handleMemberPhotoUpload={(mid, e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = (ev) => setMembers(prev => prev.map(m => m.id === mid ? { ...m, photoUrl: ev.target.result, avatarType: 'photo' } : m));
                  r.readAsDataURL(f);
                }}
                restoreScreenshotDefaults={() => {
                  setMembers(prev => prev.map(m => {
                    const def = DEFAULT_MEMBERS.find(d => d.id === m.id);
                    return def ? { ...def, calendarId: m.calendarId, todoistUserId: m.todoistUserId, todoistProjectId: m.todoistProjectId } : m;
                  }));
                  setCurrentTheme('metal');
                }}
                appsScriptUrl={appsScriptUrl}
                setAppsScriptUrl={setAppsScriptUrl}
                todoistConfig={todoistConfig}
                setTodoistConfig={setTodoistConfig}
                connectAndDiscoverTodoist={connectAndDiscoverTodoist}
                createAndSelectTodoistProject={createAndSelectTodoistProject}
                addShoppingItemsBatch={addShoppingItemsBatch}
                runAllPermissionsTest={runAllPermissionsTest}
                isTestingDiag={isTestingDiag}
                diagResult={diagResult}
                pullFromCloud={pullFromCloud}
                pushToCloudAndDrive={pushToCloudAndDrive}
                addExtraCalendarAccount={() => {
                  const name = prompt('Name für neuen Kalender / Person:');
                  if (!name?.trim()) return;
                  const calId = prompt('Google Kalender-ID:') || '';
                  setMembers(prev => [...prev, { id: 'cal_' + Date.now(), name: name.trim(), role: 'Zusatz', badge: name.trim().charAt(0).toUpperCase(), color: 'teal_bold', avatarType: 'emoji', emoji: '📅', calendarId: calId.trim(), todoistProjectId: '', ok: Boolean(calId.trim()) }]);
                }}
                importBackupJson={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = (ev) => {
                    try {
                      const d = JSON.parse(ev.target.result);
                      if (d.members) setMembers(d.members);
                      if (d.mealPlan) setMealPlan(d.mealPlan);
                      if (d.familyNotes) setFamilyNotes(d.familyNotes);
                      if (d.schoolData) setSchoolData(d.schoolData);
                      if (d.familyTasks) setFamilyTasks(d.familyTasks);
                      showToast('Import erfolgreich', 'Backup wiederhergestellt.', '🎉');
                    } catch (err) {}
                  };
                  r.readAsText(f);
                }}
                exportBackupJson={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ members, events, mealPlan, familyNotes, schoolData, familyTasks, todoistConfig }, null, 2));
                  const a = document.createElement('a');
                  a.setAttribute('href', dataStr);
                  a.setAttribute('download', `touchwall_backup_${todayStr}.json`);
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                setQrModalOpen={setQrModalOpen}
                themeStyles={themeStyles}
                getMemberStyles={getMemberStyles}
                renderAvatar={renderAvatar}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: TERMIN ERSTELLEN / BEARBEITEN */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={saveEventModal} className={`w-full max-w-xl rounded-3xl border-2 border-sky-400/50 p-6 shadow-2xl space-y-4 my-auto ${themeStyles.modal}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold">{eventModal.id ? 'Termin bearbeiten' : 'Neuer Familientermin'}</h3>
              <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className={`w-9 h-9 rounded-full border flex items-center justify-center ${themeStyles.subtle}`}><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text"
              required
              value={eventModal.title}
              onChange={(e) => setEventModal({ ...eventModal, title: e.target.value })}
              placeholder="z.B. ⚽ Fußballtraining oder 🦷 Zahnarzt"
              className={`w-full px-4 py-3 rounded-2xl border font-bold text-base ${themeStyles.input}`}
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEventModal({ ...eventModal, member: m.id, notifyUsers: m.id === 'all' ? ['hans', 'sarah', 'dean', 'valentina'] : [m.id] })}
                  className={`tw-glow-btn p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer ${eventModal.member === m.id ? 'border-sky-400 bg-sky-500/20' : themeStyles.subtle}`}
                >
                  {renderAvatar(m, 'w-8 h-8', 'text-xs')}
                  <span className="text-xs font-extrabold truncate max-w-full">{m.id === 'all' ? 'Familie' : m.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            {eventModal.title.trim() && (
              <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${themeStyles.subtle}`}>
                <span className="text-xs font-extrabold flex items-center gap-1"><Copy className="w-3.5 h-3.5 text-amber-400" /> Kopie einfügen bei:</span>
                <div className="flex flex-wrap gap-1.5">
                  {members.map(tm => (
                    <button key={tm.id} type="button" onClick={() => duplicateEventToTarget(eventModal, tm.id, eventModal.date)} style={getMemberStyles(tm).badgeStyle} className="tw-glow-btn px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer">
                      + {tm.id === 'all' ? 'Familie' : tm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={eventModal.date} onChange={(e) => setEventModal({ ...eventModal, date: e.target.value })} className={`px-4 py-2.5 rounded-2xl border font-bold text-sm ${themeStyles.input}`} />
              <input type="text" value={eventModal.time} onChange={(e) => setEventModal({ ...eventModal, time: e.target.value })} className={`px-4 py-2.5 rounded-2xl border font-bold text-sm ${themeStyles.input}`} />
            </div>
            <div className={`p-4 rounded-2xl border space-y-3 ${themeStyles.subtle}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Erinnerung</span>
                <button type="button" onClick={() => triggerEventAlarmNow(eventModal, true)} className="tw-glow-btn px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={eventModal.notifyTime} onChange={(e) => setEventModal({ ...eventModal, notifyTime: e.target.value })} className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}>
                  <option value="none" className="bg-slate-800 text-white">Keine</option>
                  <option value="0m" className="bg-slate-800 text-white">Pünktlich</option>
                  <option value="15m" className="bg-slate-800 text-white">15 Min. vorher</option>
                  <option value="30m" className="bg-slate-800 text-white">30 Min. vorher</option>
                  <option value="1h" className="bg-slate-800 text-white">1 Std. vorher</option>
                  <option value="1d" className="bg-slate-800 text-white">1 Tag vorher</option>
                </select>
                <select value={eventModal.notifyChannel} onChange={(e) => setEventModal({ ...eventModal, notifyChannel: e.target.value })} className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}>
                  <option value="wall_push" className="bg-slate-800 text-white">Touchwall + Handy Push</option>
                  <option value="wall" className="bg-slate-800 text-white">Nur Touchwall</option>
                  <option value="mail" className="bg-slate-800 text-white">E-Mail & Push</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              {eventModal.id ? <button type="button" onClick={() => deleteEventById(eventModal.id)} className="tw-glow-btn px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer">🗑️ Löschen</button> : <div />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className={`tw-glow-btn px-5 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer ${themeStyles.subtle}`}>Abbrechen</button>
                <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer">Speichern</button>
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
                ? `Bis ${taskModal.dueDate.slice(8, 10)}.${taskModal.dueDate.slice(5, 7)}.${taskModal.dueTime ? ' ' + taskModal.dueTime + ' Uhr' : ''}`
                : (taskModal.dueTime ? `Heute bis ${taskModal.dueTime} Uhr` : 'Offen');

              setFamilyTasks(prev => prev.map(t => t.id === taskModal.id ? {
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

              const targetMemberObj = members.find(m => m.id === taskModal.member);
              if (taskModal.todoistId && todoistConfig.apiToken) {
                try {
                  await updateTodoistTaskItem(todoistConfig.apiToken, taskModal.todoistId, {
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
                  title: `✅ Aufgabe: ${taskModal.title}`,
                  date: taskModal.dueDate || todayStr,
                  time: taskModal.dueTime ? `${taskModal.dueTime} - ${taskModal.dueTime}` : 'Ganztägig',
                  member: taskModal.member,
                  notifyTime: taskModal.notifyTime === 'none' ? '15m' : taskModal.notifyTime,
                  notifyChannel: 'push',
                  notifyUsers: [taskModal.member],
                  fromGoogle: true
                };
                setEvents(prev => [...prev, calEv]);
                await sendCalendarApiAction({ action: 'createEvent', event: calEv });
              }

              setTaskModal({ ...taskModal, open: false });
              showToast('Frist & Erinnerung gespeichert', `${taskModal.title} (${dueLabel})`, '⏰');
            }}
            className={`w-full max-w-lg rounded-3xl border-2 border-sky-400/50 p-6 shadow-2xl space-y-4 ${themeStyles.modal}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Aufgabe: Bis wann erledigen & Erinnerung
              </h3>
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                value={taskModal.title}
                onChange={(e) => setTaskModal({ ...taskModal, title: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.input}`}
              />
              <input
                type="text"
                value={taskModal.description}
                onChange={(e) => setTaskModal({ ...taskModal, description: e.target.value })}
                placeholder="Notiz / Beschreibung zur Aufgabe..."
                className={`w-full px-4 py-2 rounded-xl border text-xs font-semibold ${themeStyles.input}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-extrabold uppercase mb-1 ${themeStyles.textMuted}`}>Zuständig</label>
                <select
                  value={taskModal.member}
                  onChange={(e) => setTaskModal({ ...taskModal, member: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
                >
                  {members.filter(m => m.id !== 'all').map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-white">👤 {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-[11px] font-extrabold uppercase mb-1 ${themeStyles.textMuted}`}>Priorität</label>
                <select
                  value={taskModal.priority}
                  onChange={(e) => setTaskModal({ ...taskModal, priority: Number(e.target.value) })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ${themeStyles.input}`}
                >
                  <option value={4} className="bg-slate-800 text-white">🔥 P1 - Sehr dringend</option>
                  <option value={3} className="bg-slate-800 text-white">🟠 P2 - Wichtig</option>
                  <option value={2} className="bg-slate-800 text-white">🔵 P3 - Mittel</option>
                  <option value={1} className="bg-slate-800 text-white">⚪ P4 - Normal</option>
                </select>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${themeStyles.subtle}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400">⏳ Bis wann muss es erledigt sein?</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: todayStr, dueTime: '18:00' })} className={`tw-glow-btn px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${themeStyles.card}`}>Heute</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 1)), dueTime: '17:00' })} className={`tw-glow-btn px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${themeStyles.card}`}>Morgen</button>
                  <button type="button" onClick={() => setTaskModal({ ...taskModal, dueDate: formatDateStr(addDays(new Date(), 7)), dueTime: '17:00' })} className={`tw-glow-btn px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${themeStyles.card}`}>+1 Woche</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={taskModal.dueDate} onChange={(e) => setTaskModal({ ...taskModal, dueDate: e.target.value })} className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`} />
                <input type="time" value={taskModal.dueTime} onChange={(e) => setTaskModal({ ...taskModal, dueTime: e.target.value })} className={`px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`} />
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${themeStyles.subtle}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">🔔 Wann erinnern?</span>
                <button
                  type="button"
                  onClick={() => triggerEventAlarmNow({
                    title: `✅ Aufgabe: ${taskModal.title}`,
                    time: `Bis ${taskModal.dueTime || '17:00'} Uhr`,
                    date: taskModal.dueDate || todayStr,
                    notifyTime: taskModal.notifyTime,
                    notifyUsers: [taskModal.member]
                  }, true)}
                  className="tw-glow-btn px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Test-Alarm
                </button>
              </div>
              <select
                value={taskModal.notifyTime}
                onChange={(e) => setTaskModal({ ...taskModal, notifyTime: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${themeStyles.input}`}
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
              <button type="button" onClick={() => setTaskModal({ ...taskModal, open: false })} className={`tw-glow-btn px-4 py-2.5 rounded-xl border text-xs font-bold ${themeStyles.subtle}`}>Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer">💾 Speichern & Synchronisieren</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: JAHRESWAND TAGES-DETAILS */}
      {yearDayModal.open && (() => {
        const dayEvents = events.filter(e => e.date === yearDayModal.dateStr);
        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-xl rounded-3xl border-2 border-sky-400/50 p-6 shadow-2xl space-y-4 ${themeStyles.modal}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold">📅 Tagesübersicht: {yearDayModal.dateStr}</h3>
                <button onClick={() => setYearDayModal({ ...yearDayModal, open: false })}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dayEvents.map(ev => {
                  const mem = members.find(m => m.id === ev.member) || members[0];
                  return (
                    <div key={ev.id} style={getMemberStyles(mem).headerStyle} className="p-3 rounded-2xl border flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm">{ev.title} ({mem.name})</span>
                      <button onClick={() => deleteEventById(ev.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs">🗑️</button>
                    </div>
                  );
                })}
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
              const key = `${schoolModal.dayIdx}-${schoolModal.periodIdx}`;
              setSchoolData(prev => {
                const nextSlots = { ...prev[activeSchoolChild].slots };
                if (!schoolModal.subject.trim()) delete nextSlots[key];
                else nextSlots[key] = { subject: schoolModal.subject.trim(), room: schoolModal.room.trim(), status: schoolModal.status };
                return { ...prev, [activeSchoolChild]: { ...prev[activeSchoolChild], slots: nextSlots } };
              });
              setSchoolModal({ ...schoolModal, open: false });
            }}
            className={`w-full max-w-md rounded-3xl border-2 border-sky-400/50 p-6 shadow-2xl space-y-4 ${themeStyles.modal}`}
          >
            <h3 className="text-lg font-extrabold">Schulstunde anpassen</h3>
            <input type="text" value={schoolModal.subject} onChange={(e) => setSchoolModal({ ...schoolModal, subject: e.target.value })} placeholder="Fach..." className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.input}`} />
            <input type="text" value={schoolModal.room} onChange={(e) => setSchoolModal({ ...schoolModal, room: e.target.value })} placeholder="Raum / Lehrer..." className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.input}`} />
            <select value={schoolModal.status} onChange={(e) => setSchoolModal({ ...schoolModal, status: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.input}`}>
              <option value="normal" className="bg-slate-800 text-white">Regulär</option>
              <option value="change" className="bg-slate-800 text-white">Vertretung / Änderung</option>
              <option value="exam" className="bg-slate-800 text-white">Arbeit / Test</option>
              <option value="cancel" className="bg-slate-800 text-white">Entfall</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSchoolModal({ ...schoolModal, open: false })} className={`tw-glow-btn px-4 py-2 rounded-xl border text-xs font-bold ${themeStyles.subtle}`}>Abbrechen</button>
              <button type="submit" className="tw-glow-btn px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold">Speichern</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: QR CODE */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border-2 border-sky-400/50 p-6 shadow-2xl text-center space-y-4 ${themeStyles.modal}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">📱 Smartphone Live-App</h3>
              <button onClick={() => setQrModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://vercel.com')}`} alt="QR" className="w-48 h-48" />
            </div>
          </div>
        </div>
      )}

      {/* ALARM BANNER */}
      {activeAlarmBanner && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl space-y-4 text-center ${themeStyles.modal}`}>
            <h3 className="text-2xl font-extrabold">🔔 {activeAlarmBanner.title}</h3>
            <p className="text-sm font-bold">{activeAlarmBanner.time} ({activeAlarmBanner.date})</p>
            <p className="text-xs font-extrabold text-sky-400">👤 Für: {activeAlarmBanner.who}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => playTouchwallAlarmSound()} className={`tw-glow-btn px-4 py-2.5 rounded-2xl border text-xs font-extrabold cursor-pointer ${themeStyles.subtle}`}>🔊 Ton testen</button>
              <button onClick={() => setActiveAlarmBanner(null)} className="tw-glow-btn px-6 py-2.5 rounded-2xl bg-amber-400 text-slate-950 text-sm font-black cursor-pointer">✅ Verstanden</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-sky-400/50 flex items-center gap-3 ${themeStyles.modal}`}>
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
