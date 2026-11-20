// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

//
//
// ============================================================================
// PART 01: IMPORTS & BASIS-KONFIGURATION
// ============================================================================
//
//

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, GraduationCap, CheckSquare, Utensils, FileText,
  Palette, Cloud, Plus, ChevronLeft, ChevronRight, Maximize2,
  Smartphone, RefreshCw, BellRing, ClipboardPaste,
  Lock, LogOut, Sparkles, Package
} from 'lucide-react';

import * as Cfg from './touchwallConfig';
import CalendarSection from './CalendarSection';
import TasksTodoistSection from './TasksTodoistSection';
import SchoolSection from './SchoolSection';
import OtherSections from './OtherSections';
import PantrySection from './PantrySection';
import QuestSection from './quest';
import AuthScreen, {
  TOUCHWALL_GLOBAL_STYLES,
  writeAuthSession,
  readAuthSession,
  clearAuthSession
} from './AuthScreen';
import TouchwallModals from './TouchwallModals';
import {
  PUBLIC_CLOUD_BACKEND_URL,
  hasJsonChanged,
  loadLocalSyncMeta,
  saveLocalSyncMeta,
  mergeSyncMetaMaps,
  applyPantryStateChangeWithMeta,
  applyTrashStateChangeWithMeta,
  mergePantryChannelSafe,
  registerPendingCalendarOp,
  mergeCalendarEventsSafe,
  mergeSkillBoardSafe,
  callCloudApi,
  useTouchwallRealtime,
  SyncCenterModal
} from './sync';

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
  buildThemeStyles,
  buildMemberStyles,
  discoverTodoistWorkspace,
  pullFromTodoistTwoWay,
  createTodoistTaskItem,
  closeOrReopenTodoistTask,
  deleteTodoistTask,
  pushTodoistTaskToPhoneNow
} = Cfg;

//
//
// ============================================================================
// PART 02: MERGE- & SYNC-HILFSFUNKTIONEN (EINKAUFSLISTE & AUFGABEN)
// ============================================================================
//
//

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

// 1. Stabiler Merge für die Einkaufsliste (Cloud vs. Todoist Unterscheidung)
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

    if (loc.done || doneTs) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    if (source === 'cloud') {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
      return;
    }

    const isVeryRecent = loc.addedAtTs && (now - Number(loc.addedAtTs) < 25000);
    if (!loc.todoistId || isVeryRecent) {
      mergedMap.set(norm, {
        ...loc,
        text: String(loc.text).trim(),
        done: false,
        doneAt: 0
      });
    } else {
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

// 2. Stabiler Merge für Familien-Aufgaben (Cloud vs. Todoist Unterscheidung)
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

    if (loc.done || doneTs) {
      mergedList.push({
        ...loc,
        done: true,
        doneAt: Number(loc.doneAt || doneTs || now)
      });
      return;
    }

    if (source === 'cloud') {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
      return;
    }

    const createdMs = typeof loc.id === 'number' && loc.id > 1700000000000 ? loc.id : 0;
    const isVeryRecent = createdMs && (now - createdMs < 25000);
    if (!tdKey || isVeryRecent) {
      mergedList.push({
        ...loc,
        done: false,
        doneAt: 0
      });
    } else {
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

//
//
// ============================================================================
// PART 03: STATES, REFS & BASIS-HELFER (AUTH, DATEN, MODALS)
// ============================================================================
//
//

export default function TouchwallApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authTab, setAuthTab] = useState('login');
  const [accountId, setAccountId] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [familyName, setFamilyName] = useState('Familien-Touchwall');

  const [pantryItems, setPantryItemsRaw] = useState([]);
  const [pantryTrash, setPantryTrashRaw] = useState([]);
  const [skillBoardData, setSkillBoardDataRaw] = useState(null);

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [loginFamilyName, setLoginFamilyName] = useState('');
  const [setupMemberNames, setSetupMemberNames] = useState(['Mama / Person 1', 'Papa / Person 2', 'Kind 1', 'Kind 2']);
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

  const [appsScriptUrl, setAppsScriptUrl] = useState(PUBLIC_CLOUD_BACKEND_URL);
  const [todoistConfig, setTodoistConfig] = useState({
    apiToken: '',
    shoppingProjectId: '',
    tasksProjectId: '',
    projects: [],
    collaborators: []
  });

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('⚡ 4-Kanal Sync aktiv');
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [channelStatus, setChannelStatus] = useState({
    calendar: 'Bereit ✓',
    calendarBusy: false,
    todoist: 'Bereit ✓',
    todoistBusy: false,
    pantry: 'Bereit ✓',
    pantryBusy: false,
    skillboard: 'Bereit ✓',
    skillboardBusy: false
  });

  const [diagResult, setDiagResult] = useState(null);
  const [isTestingDiag, setIsTestingDiag] = useState(false);
  const [touchRipples, setTouchRipples] = useState([]);
  const [pushPermission, setPushPermission] = useState('default');
  const [activeAlarmBanner, setActiveAlarmBanner] = useState(null);

  const triggeredAlarmsRef = useRef({});
  const isInitialLoadDone = useRef(false);
  const isNetworkSavingRef = useRef(false);
  const isSyncRunningRef = useRef(false);
  const lastLocalEditTimeRef = useRef(0);
  const lastThemeChangeRef = useRef(0);
  const autoSaveTimer = useRef(null);
  const lastSavedPayloadHashRef = useRef('');
  const syncMetaRef = useRef({ deletedPantryIds: {}, deletedTrashIds: {}, deletedTaskIds: {}, deletedEventIds: {} });
  const pendingCalendarOpsRef = useRef({});

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

  const setPantryItems = (updater) => {
    lastLocalEditTimeRef.current = Date.now();
    setPantryItemsRaw(prev => applyPantryStateChangeWithMeta(prev, updater, syncMetaRef, false));
  };

  const setPantryTrash = (updater) => {
    lastLocalEditTimeRef.current = Date.now();
    setPantryTrashRaw(prev => applyTrashStateChangeWithMeta(prev, updater, syncMetaRef));
  };

  const setSkillBoardData = (nextSb) => {
    setSkillBoardDataRaw(prev => mergeSkillBoardSafe(nextSb, prev));
  };

  const handleSelectTheme = (nextThemeId) => {
    lastLocalEditTimeRef.current = Date.now();
    lastThemeChangeRef.current = Date.now();
    setCurrentTheme(nextThemeId);
    try {
      localStorage.setItem('richter_tw_theme_lock', nextThemeId);
    } catch (e) {}
  };

  //
  //
  // ============================================================================
  // PART 04: SICHERE DATEN-WRAPPER (MEMOS), THEME & AVATAR-RENDERER
  // ============================================================================
  //
  //

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
        ? n.items.map(it => (typeof it === 'string'
            ? { text: it, done: false, doneAt: 0 }
            : {
                text: it?.text || '',
                done: Boolean(it?.done),
                doneAt: Number(it?.doneAt || 0),
                addedAtTs: Number(it?.addedAtTs || 0),
                todoistId: it?.todoistId,
                fromMobile: it?.fromMobile
              }))
        : []
    }));
  }, [familyNotes]);

  const safeTasks = useMemo(() => Array.isArray(familyTasks) ? familyTasks : [], [familyTasks]);
  const safePantryItems = useMemo(() => Array.isArray(pantryItems) ? pantryItems : [], [pantryItems]);
  const safePantryTrash = useMemo(() => Array.isArray(pantryTrash) ? pantryTrash : [], [pantryTrash]);

  // Dynamisches safeSchoolData: Bewahrt ALLE angelegten Stundenpläne & Personen-Zuweisungen!
  const safeSchoolData = useMemo(() => {
    const s = schoolData && typeof schoolData === 'object' && Object.keys(schoolData).length > 0
      ? schoolData
      : DEFAULT_SCHOOL;

    const result = {};
    Object.keys(s).forEach(key => {
      const entry = s[key] || {};
      const fallbackDef = DEFAULT_SCHOOL[key] || DEFAULT_SCHOOL.dean;
      result[key] = {
        ...entry,
        title: entry.title || '',
        assignedMembers: Array.isArray(entry.assignedMembers) ? entry.assignedMembers : [key],
        periods: Array.isArray(entry.periods) ? entry.periods : fallbackDef.periods,
        slots: entry.slots && typeof entry.slots === 'object' ? entry.slots : (fallbackDef.slots || {}),
        announcements: Array.isArray(entry.announcements) ? entry.announcements : []
      };
    });
    return result;
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

//
  //
  // ============================================================================
  // PART 05: UHRZEIT, BROWSER-PUSH & TERMIN-/AUFGABEN-ALARME
  // ============================================================================
  //
  //

  useEffect(() => {
    syncMetaRef.current = loadLocalSyncMeta();
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

  //
  //
  // ============================================================================
  // PART 06: TODOIST-INTEGRATION & 2-WEGE-SYNC
  // ============================================================================
  //
  //

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
    if (isSyncRunningRef.current) return;
    if (!showFeedback && (isNetworkSavingRef.current || Date.now() - lastLocalEditTimeRef.current < 8000)) return;

    const cfg = cfgOverride || safeTodoistConfig;
    if (!cfg?.apiToken?.trim()) return;

    isSyncRunningRef.current = true;
    setChannelStatus(prev => ({ ...prev, todoistBusy: true }));
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
      if (pulled && (showFeedback || (!isNetworkSavingRef.current && Date.now() - lastLocalEditTimeRef.current >= 6500))) {
        if (Array.isArray(pulled.tasks)) {
          const guardedTasks = reconcileFamilyTasks(safeTasks, pulled.tasks, syncMetaRef.current, 'todoist');
          if (hasJsonChanged(safeTasks, guardedTasks)) {
            setFamilyTasks(guardedTasks);
          }
        }
        if (Array.isArray(pulled.familyNotes)) {
          const guardedNotes = reconcileShoppingNotes(safeNotes, pulled.familyNotes, syncMetaRef.current, 'todoist');
          if (hasJsonChanged(safeNotes, guardedNotes)) {
            setFamilyNotes(guardedNotes);
          }
        } else if (Array.isArray(pulled.shoppingItems)) {
          const candidateNotes = safeNotes.map((n, idx) => idx === 0 ? { ...n, items: pulled.shoppingItems } : n);
          const guardedNotes = reconcileShoppingNotes(safeNotes, candidateNotes, syncMetaRef.current, 'todoist');
          if (hasJsonChanged(safeNotes, guardedNotes)) {
            setFamilyNotes(guardedNotes);
          }
        }

        const now = new Date();
        const tStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        setLastAutoSyncTime(tStr);
        setChannelStatus(prev => ({ ...prev, todoist: 'Synchron (' + tStr + ') ✓', todoistBusy: false }));
      }
      if (showFeedback) showToast('Kanal 2 (Todoist) synchron', 'Aufgaben & Einkaufsliste sind abgeglichen.', '✅');
    } catch (err) {
      setChannelStatus(prev => ({ ...prev, todoistBusy: false }));
      if (showFeedback) showToast('Todoist-Sync Hinweis', err.message, '⚠️');
    } finally {
      isSyncRunningRef.current = false;
      setChannelStatus(prev => ({ ...prev, todoistBusy: false }));
      if (showFeedback) setIsSyncing(false);
    }
  };

  const syncTodoistRef = useRef(null);
  syncTodoistRef.current = syncWithTodoistNow;

  useEffect(() => {
    if (!isAuthenticated) return;
    const initTimeout = setTimeout(() => {
      syncTodoistRef.current?.(false);
    }, 3200);

    const todoistInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncTodoistRef.current?.(false);
      }
    }, 18000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(todoistInterval);
    };
  }, [isAuthenticated]);

  //
  //
  // ============================================================================
  // PART 07: CLOUD-SYNC, REALTIME, AUTO-SAVE & INITIAL-LADEN
  // ============================================================================
  //
  //

  const callGoogleAppsScript = async (targetUrl, method = 'POST', postBody = null) => {
    return callCloudApi(targetUrl || appsScriptUrl || PUBLIC_CLOUD_BACKEND_URL, method, postBody, accountId, authKey);
  };

  const applyBundleData = (bundle, channelsFilter = 'all') => {
    if (!bundle) return;
    const calMap = bundle?.calendarData?.calendars || {};
    const statusMap = bundle?.calendarData?.status || {};

    if (bundle?.state) {
      const s = bundle.state;

      if (s.syncMeta) {
        syncMetaRef.current = mergeSyncMetaMaps(syncMetaRef.current, s.syncMeta);
        saveLocalSyncMeta(syncMetaRef.current);
      }

      if (channelsFilter === 'all') {
        if (s.familyName && s.familyName !== familyName) setFamilyName(s.familyName);

        const baseMembers = (Array.isArray(s.members) && s.members.length >= 2) ? s.members : safeMembers;
        const nextMembers = baseMembers.map(m => {
          const cid = calMap[m.id] !== undefined && calMap[m.id] !== '' ? calMap[m.id] : (m.calendarId || '');
          const st = statusMap[m.id];
          return {
            ...m,
            calendarId: cid,
            ok: st ? Boolean(st.ok) : (m.ok !== undefined ? m.ok : true),
            statusMsg: st?.msg || m.statusMsg || 'Cloud aktiv ✓'
          };
        });
        if (hasJsonChanged(safeMembers, nextMembers)) setMembers(nextMembers);

        if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0 && hasJsonChanged(safeMeals, s.mealPlan)) {
          setMealPlan(s.mealPlan);
        }

        if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) {
          const guardedNotes = reconcileShoppingNotes(safeNotes, s.familyNotes, syncMetaRef.current, 'cloud');
          if (hasJsonChanged(safeNotes, guardedNotes)) {
            setFamilyNotes(guardedNotes);
          }
        }

        if (s.schoolData && typeof s.schoolData === 'object' && Object.keys(s.schoolData).length > 0 && hasJsonChanged(safeSchoolData, s.schoolData)) {
          setSchoolData(s.schoolData);
        }

        if (Array.isArray(s.familyTasks)) {
          const guardedTasks = reconcileFamilyTasks(safeTasks, s.familyTasks, syncMetaRef.current, 'cloud');
          if (hasJsonChanged(safeTasks, guardedTasks)) {
            setFamilyTasks(guardedTasks);
          }
        }

        const lockedTheme = typeof window !== 'undefined' ? localStorage.getItem('richter_tw_theme_lock') : null;
        if (!lockedTheme && s.currentTheme && Date.now() - lastThemeChangeRef.current > 20000) {
          setCurrentTheme(s.currentTheme);
        }
        if (s.customLogoUrl && s.customLogoUrl !== customLogoUrl) setCustomLogoUrl(s.customLogoUrl);
        if (s.todoistConfig?.apiToken) setTodoistConfig(prev => ({ ...prev, ...s.todoistConfig }));
      }

      if (channelsFilter === 'all' || channelsFilter === 'pantry') {
        if (Array.isArray(s.pantryItems) || Array.isArray(s.pantryTrash)) {
          const { mergedStock, mergedTrash } = mergePantryChannelSafe(
            safePantryItems,
            s.pantryItems,
            safePantryTrash,
            s.pantryTrash,
            syncMetaRef.current
          );
          if (hasJsonChanged(safePantryItems, mergedStock)) setPantryItemsRaw(mergedStock);
          if (hasJsonChanged(safePantryTrash, mergedTrash)) setPantryTrashRaw(mergedTrash);
        }
      }

      if (channelsFilter === 'all' || channelsFilter === 'skillboard') {
        if (s.skillBoardData && typeof s.skillBoardData === 'object') {
          setSkillBoardDataRaw(prev => mergeSkillBoardSafe(prev, s.skillBoardData));
        }
      }
    }

    if ((channelsFilter === 'all' || channelsFilter === 'calendar') && Array.isArray(bundle?.calendarData?.events)) {
      const guardedEvents = mergeCalendarEventsSafe(
        bundle.calendarData.events,
        pendingCalendarOpsRef,
        syncMetaRef.current
      );
      if (hasJsonChanged(safeEvents, guardedEvents)) {
        setEvents(guardedEvents);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(guardedEvents)); } catch (e) {}
      }
    }

    isInitialLoadDone.current = true;
  };

  const pullFromCloud = async (
    urlOverride,
    showFeedback = true,
    customAccId = undefined,
    customAuthKey = undefined,
    channelsFilter = 'all',
    isRealtimeTrigger = false,
    skipCalendars = false
  ) => {
    const activeAcc = customAccId !== undefined ? customAccId : accountId;
    const activeKey = customAuthKey !== undefined ? customAuthKey : authKey;
    if (!activeAcc || activeAcc === 'local') return false;
    if (isSyncRunningRef.current) return false;

    if (!showFeedback && !isRealtimeTrigger && (isNetworkSavingRef.current || Date.now() - lastLocalEditTimeRef.current < 8000)) {
      return false;
    }
    if (isRealtimeTrigger && isNetworkSavingRef.current) {
      return false;
    }

    const targetUrl = (urlOverride !== undefined ? urlOverride : (appsScriptUrl || PUBLIC_CLOUD_BACKEND_URL)).trim();
    if (!targetUrl) return false;

    const effectiveSkipCalendars = Boolean(
      skipCalendars || channelsFilter === 'pantry' || channelsFilter === 'skillboard'
    );

    isSyncRunningRef.current = true;
    if (showFeedback) setIsSyncing(true);

    try {
      const bundle = await callCloudApi(
        targetUrl,
        'POST',
        { action: 'loadBundle', skipCalendars: effectiveSkipCalendars },
        activeAcc,
        activeKey
      );
      if (bundle?.ok === false) {
        if (showFeedback) showToast('Hinweis', bundle.error || 'Daten konnten nicht geladen werden.', '⚠️');
        return false;
      }

      if (!showFeedback && !isRealtimeTrigger && (isNetworkSavingRef.current || Date.now() - lastLocalEditTimeRef.current < 6500)) {
        return false;
      }

      applyBundleData(bundle, channelsFilter);
      const now = new Date();
      const tStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      setSyncStatusText(isRealtimeTrigger ? '⚡ Live-Sync (' + tStr + ')' : '⚡ 4-Kanal Sync (' + tStr + ')');
      setChannelStatus(prev => ({
        ...prev,
        calendar: effectiveSkipCalendars ? prev.calendar : ('Synchron (' + tStr + ') ✓'),
        pantry: 'Synchron (' + tStr + ') ✓',
        skillboard: 'Synchron (' + tStr + ') ✓'
      }));
      if (showFeedback) showToast('Synchronisiert', 'Alle Kanäle sind sauber abgeglichen.', '☁️');
      return true;
    } catch (err) {
      isInitialLoadDone.current = true;
      return false;
    } finally {
      isSyncRunningRef.current = false;
      if (showFeedback) setIsSyncing(false);
    }
  };

  const pullCloudRef = useRef(null);
  pullCloudRef.current = pullFromCloud;

  const sendCalendarApiAction = async (bodyData, statusLabel = '⏳ Synchronisiere Kalender...') => {
    if (!accountId || accountId === 'local') return null;
    const targetUrl = (appsScriptUrl || PUBLIC_CLOUD_BACKEND_URL).trim();
    if (!targetUrl) return null;

    isNetworkSavingRef.current = true;
    lastLocalEditTimeRef.current = Date.now();
    setIsSyncing(true);
    setChannelStatus(prev => ({ ...prev, calendarBusy: true }));
    setSyncStatusText(statusLabel);

    try {
      const json = await callGoogleAppsScript(targetUrl, 'POST', bodyData);
      if (json?.result && Array.isArray(json.result.events)) {
        const guarded = mergeCalendarEventsSafe(json.result.events, pendingCalendarOpsRef, syncMetaRef.current);
        setEvents(guarded);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(guarded)); } catch (e) {}
      }
      const now = new Date();
      const tStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      setSyncStatusText('⚡ 4-Kanal Sync (' + tStr + ')');
      setChannelStatus(prev => ({ ...prev, calendar: 'Synchron (' + tStr + ') ✓', calendarBusy: false }));
      return json;
    } catch (err) {
      setSyncStatusText('⚠️ Cloud-Sync prüfen');
      setChannelStatus(prev => ({ ...prev, calendarBusy: false }));
      return null;
    } finally {
      lastLocalEditTimeRef.current = Date.now();
      isNetworkSavingRef.current = false;
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const oauthOk = params.get('oauth_ok');
      const oauthIntent = params.get('oauth_intent');
      const oauthErr = params.get('oauth_error');
      const qrAcc = params.get('account');
      const qrKey = params.get('key');
      const qrFamily = params.get('family');

      const lockedTheme = localStorage.getItem('richter_tw_theme_lock');
      if (lockedTheme) setCurrentTheme(lockedTheme);

      if (oauthErr) {
        setLoginError(oauthErr);
        showToast('OAuth-Hinweis', oauthErr, '⚠️');
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (oauthOk && oauthIntent === 'login') {
        window.history.replaceState({}, '', window.location.pathname);
        fetch('/api/oauth/session', { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            const h = data?.handoff;
            if (h?.accountId && h?.authKey) {
              const title = h.familyName || ('Familie ' + h.accountId);
              setAccountId(h.accountId);
              setAuthKey(h.authKey);
              setFamilyName(title);
              writeAuthSession(h.accountId, h.authKey, title);
              setIsAuthenticated(true);
              isInitialLoadDone.current = true;
              showToast(
                'Mit ' + (h.provider === 'google' ? 'Google' : 'Outlook') + ' angemeldet!',
                title + ' wurde geladen.',
                '🔓'
              );
              setTimeout(() => pullCloudRef.current?.(PUBLIC_CLOUD_BACKEND_URL, false, h.accountId, h.authKey), 150);
            } else {
              setLoginError('OAuth-Sitzung abgelaufen. Bitte erneut anmelden.');
            }
          })
          .catch(() => setLoginError('OAuth-Sitzung konnte nicht geladen werden.'))
          .finally(() => setIsCheckingAuth(false));
        return;
      }

      if (oauthOk && oauthIntent === 'link') {
        window.history.replaceState({}, '', window.location.pathname);
        setActiveSection('google');
        showToast(
          'OAuth verknüpft ✓',
          (oauthOk === 'google' ? 'Google' : 'Outlook / Microsoft') + ' wurde erfolgreich verbunden!',
          '🔗'
        );
      }

      if (qrAcc && qrKey) {
        const cleanTitle = qrFamily || 'Familien-Touchwall';
        setAccountId(qrAcc);
        setAuthKey(qrKey);
        setFamilyName(cleanTitle);
        writeAuthSession(qrAcc, qrKey, cleanTitle);
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => pullCloudRef.current?.(PUBLIC_CLOUD_BACKEND_URL, true, qrAcc, qrKey), 200);
        return;
      }

      const session = readAuthSession();
      const rawState = localStorage.getItem('richter_touchwall_v6');
      let parsedState = null;
      if (rawState) {
        try { parsedState = JSON.parse(rawState); } catch (e) {}
      }

      if (session.active && (session.accountId || parsedState?.isConfigured)) {
        setAccountId(session.accountId || 'local');
        setAuthKey(session.authKey || '');
        if (parsedState) {
          if (parsedState.familyName) setFamilyName(parsedState.familyName);
          if (Array.isArray(parsedState.members) && parsedState.members.length >= 2) setMembers(parsedState.members);
          if (Array.isArray(parsedState.mealPlan) && parsedState.mealPlan.length > 0) setMealPlan(parsedState.mealPlan);
          if (Array.isArray(parsedState.familyNotes) && parsedState.familyNotes.length > 0) setFamilyNotes(parsedState.familyNotes);
          if (parsedState.schoolData && typeof parsedState.schoolData === 'object') setSchoolData(parsedState.schoolData);
          if (Array.isArray(parsedState.familyTasks)) setFamilyTasks(parsedState.familyTasks);
          if (Array.isArray(parsedState.pantryItems)) setPantryItemsRaw(parsedState.pantryItems);
          if (Array.isArray(parsedState.pantryTrash)) setPantryTrashRaw(parsedState.pantryTrash);
          if (parsedState.skillBoardData && typeof parsedState.skillBoardData === 'object') setSkillBoardDataRaw(parsedState.skillBoardData);
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
        if (session.accountId && session.accountId !== 'local') {
          setTimeout(() => pullCloudRef.current?.(PUBLIC_CLOUD_BACKEND_URL, false, session.accountId, session.authKey), 300);
        }
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  // SUPABASE REALTIME TURBO LIVE-SYNC: Überspringt Google Kalender bei reinen State-Änderungen (< 1 Sek.)
  useTouchwallRealtime(isAuthenticated && accountId && accountId !== 'local' ? accountId : '', (scope) => {
    pullCloudRef.current?.(undefined, false, undefined, undefined, 'all', true, scope === 'state');
  });

  // Fallback-Intervall (30s) für externe Änderungen direkt im Google/Outlook Kalender
  useEffect(() => {
    if (!isAuthenticated || !accountId || accountId === 'local') return;
    const calInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pullCloudRef.current?.(undefined, false);
      }
    }, 30000);
    return () => clearInterval(calInterval);
  }, [isAuthenticated, accountId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const localPayload = {
      isConfigured: true,
      familyName,
      members: safeMembers,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData: safeSchoolData,
      familyTasks: safeTasks,
      pantryItems: safePantryItems,
      pantryTrash: safePantryTrash,
      skillBoardData,
      syncMeta: syncMetaRef.current,
      currentTheme,
      customLogoUrl,
      todoistConfig: safeTodoistConfig
    };

    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(localPayload)); } catch (e) {}
    if (!isInitialLoadDone.current) return;
    if (!accountId || accountId === 'local') return;

    const currentHash = JSON.stringify({
      familyName,
      members: safeMembers,
      mealPlan: safeMeals,
      familyNotes: safeNotes,
      schoolData: safeSchoolData,
      familyTasks: safeTasks,
      pantryItems: safePantryItems,
      pantryTrash: safePantryTrash,
      currentTheme,
      customLogoUrl
    });

    if (currentHash === lastSavedPayloadHashRef.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      isNetworkSavingRef.current = true;
      try {
        let mergedStock = safePantryItems;
        let mergedTrash = safePantryTrash;
        let mergedNotes = safeNotes;
        let mergedTasks = safeTasks;
        let mergedSkill = skillBoardData;

        try {
          // TURBO: Vor-Merge ohne Google-Kalender-Wartezeit (~60ms statt 2-3s)
          const fresh = await callCloudApi(
            appsScriptUrl || PUBLIC_CLOUD_BACKEND_URL,
            'POST',
            { action: 'loadBundle', skipCalendars: true },
            accountId,
            authKey
          );
          if (fresh?.ok && fresh.state) {
            syncMetaRef.current = mergeSyncMetaMaps(syncMetaRef.current, fresh.state.syncMeta);
            saveLocalSyncMeta(syncMetaRef.current);

            if (Array.isArray(fresh.state.familyNotes)) {
              mergedNotes = reconcileShoppingNotes(safeNotes, fresh.state.familyNotes, syncMetaRef.current, 'cloud');
              if (hasJsonChanged(safeNotes, mergedNotes)) setFamilyNotes(mergedNotes);
            }
            if (Array.isArray(fresh.state.familyTasks)) {
              mergedTasks = reconcileFamilyTasks(safeTasks, fresh.state.familyTasks, syncMetaRef.current, 'cloud');
              if (hasJsonChanged(safeTasks, mergedTasks)) setFamilyTasks(mergedTasks);
            }

            const pMerged = mergePantryChannelSafe(
              safePantryItems,
              fresh.state.pantryItems,
              safePantryTrash,
              fresh.state.pantryTrash,
              syncMetaRef.current
            );
            mergedStock = pMerged.mergedStock;
            mergedTrash = pMerged.mergedTrash;
            mergedSkill = mergeSkillBoardSafe(skillBoardData, fresh.state.skillBoardData);
            if (hasJsonChanged(safePantryItems, mergedStock)) setPantryItemsRaw(mergedStock);
            if (hasJsonChanged(safePantryTrash, mergedTrash)) setPantryTrashRaw(mergedTrash);
          }
        } catch (e) {}

        const finalPayload = {
          ...localPayload,
          familyNotes: mergedNotes,
          familyTasks: mergedTasks,
          pantryItems: mergedStock,
          pantryTrash: mergedTrash,
          skillBoardData: mergedSkill,
          syncMeta: syncMetaRef.current
        };

        lastSavedPayloadHashRef.current = JSON.stringify({
          familyName,
          members: safeMembers,
          mealPlan: safeMeals,
          familyNotes: mergedNotes,
          schoolData: safeSchoolData,
          familyTasks: mergedTasks,
          pantryItems: mergedStock,
          pantryTrash: mergedTrash,
          currentTheme,
          customLogoUrl
        });

        await callCloudApi(appsScriptUrl || PUBLIC_CLOUD_BACKEND_URL, 'POST', {
          action: 'saveState',
          payload: finalPayload
        }, accountId, authKey);
      } catch (e) {} finally {
        lastLocalEditTimeRef.current = Date.now();
        isNetworkSavingRef.current = false;
      }
    }, 250);
  }, [isAuthenticated, accountId, authKey, familyName, safeMembers, safeMeals, safeNotes, safeSchoolData, safeTasks, safePantryItems, safePantryTrash, currentTheme, customLogoUrl, safeTodoistConfig, appsScriptUrl]);

  //
  //
  // ============================================================================
  // PART 08: LOGIN, REGISTRIERUNG, LOKAL-MODUS & LOGOUT
  // ============================================================================
  //
  //

  const handleRegisterSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setLoginError('');

    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();
    const cleanEmail = formEmail.trim().toLowerCase();
    const chosenTitle = loginFamilyName.trim() || 'Familie ' + (cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1));

    if (cleanUser.length < 3) {
      setLoginError('Bitte wähle einen Benutzernamen mit mindestens 3 Buchstaben/Zahlen (z.B. familie-mueller).');
      return;
    }
    if (cleanPass.length < 4) {
      setLoginError('Bitte wähle ein Passwort / PIN mit mindestens 4 Zeichen.');
      return;
    }

    const colors = ['navy_bold', 'pink', 'crimson_bold', 'teal_bold'];
    const emojis = ['👨', '👩', '👦', '👧'];
    const roles = ['Elternteil', 'Elternteil', 'Kind', 'Kind'];
    const ids = ['hans', 'sarah', 'dean', 'valentina'];

    const customMembers = [
      { id: 'all', name: 'Familie & Events', role: 'Alle gemeinsam', badge: 'FA', color: 'orange_bold', avatarType: 'emoji', emoji: '👨‍👩‍👧‍👦', photoUrl: '', calendarId: '', todoistUserId: '', todoistProjectId: '', statusMsg: 'Cloud-Kalender ✓', ok: true }
    ];

    setupMemberNames.forEach((rawName, idx) => {
      const clean = String(rawName || '').trim() || ('Person ' + (idx + 1));
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
        statusMsg: 'Cloud-Kalender ✓',
        ok: true
      });
    });

    const initialPayload = {
      isConfigured: true,
      familyName: chosenTitle,
      members: customMembers,
      mealPlan: DEFAULT_MEALS,
      familyNotes: DEFAULT_NOTES,
      schoolData: DEFAULT_SCHOOL,
      familyTasks: [],
      pantryItems: [],
      pantryTrash: [],
      skillBoardData: null,
      currentTheme: 'metal',
      customLogoUrl: '',
      todoistConfig: { apiToken: '', shoppingProjectId: '', tasksProjectId: '', projects: [], collaborators: [] }
    };

    setIsLoggingIn(true);
    try {
      const res = await callCloudApi(PUBLIC_CLOUD_BACKEND_URL, 'POST', {
        action: 'registerAccount',
        accountId: cleanUser,
        authKey: cleanPass,
        email: cleanEmail,
        payload: initialPayload
      }, cleanUser, cleanPass);

      if (!res || res.ok === false) {
        setLoginError(res?.error || 'Registrierung fehlgeschlagen. Bitte anderen Benutzernamen probieren.');
        setIsLoggingIn(false);
        return;
      }

      setAccountId(cleanUser);
      setAuthKey(cleanPass);
      setFamilyName(chosenTitle);
      setMembers(customMembers);
      setEvents([]);
      setFamilyTasks([]);
      setPantryItemsRaw([]);
      setPantryTrashRaw([]);
      setSkillBoardDataRaw(null);
      writeAuthSession(cleanUser, cleanPass, chosenTitle);
      isInitialLoadDone.current = true;
      setIsAuthenticated(true);
      if (res.recoveryCode) {
        showToast('Konto erstellt! Notfall-Code sichern:', res.recoveryCode, '🔑');
      } else {
        showToast('Konto erstellt!', 'Willkommen! Euer Konto „' + cleanUser + '“ ist jetzt aktiv.', '🎉');
      }
    } catch (err) {
      setLoginError('Server-Verbindung fehlgeschlagen: ' + (err.message || 'Bitte Internet prüfen.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAccountLoginSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setLoginError('');

    const cleanUser = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = formPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Bitte gib deinen Benutzernamen und dein Passwort ein.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await callCloudApi(PUBLIC_CLOUD_BACKEND_URL, 'POST', {
        action: 'loginAccount',
        accountId: cleanUser,
        authKey: cleanPass
      }, cleanUser, cleanPass);

      if (!res || res.ok === false) {
        setLoginError(res?.error || 'Anmeldung fehlgeschlagen. Bitte Benutzername und Passwort prüfen.');
        setIsLoggingIn(false);
        return;
      }

      setAccountId(cleanUser);
      setAuthKey(cleanPass);
      applyBundleData(res);
      const loadedTitle = res?.state?.familyName || ('Familie ' + cleanUser);
      setFamilyName(loadedTitle);
      writeAuthSession(cleanUser, cleanPass, loadedTitle);
      isInitialLoadDone.current = true;
      setIsAuthenticated(true);
      showToast('Angemeldet!', loadedTitle + ' wurde erfolgreich aus der Cloud geladen.', '🔓');
    } catch (err) {
      setLoginError('Verbindung fehlgeschlagen: ' + (err.message || 'Bitte erneut versuchen.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInstantLocalStart = () => {
    const chosenTitle = loginFamilyName.trim() || 'Unsere Familien-Touchwall';
    setAccountId('local');
    setAuthKey('');
    setFamilyName(chosenTitle);
    writeAuthSession('local', '', chosenTitle);
    isInitialLoadDone.current = true;
    setIsAuthenticated(true);
    showToast('Lokaler Modus aktiv', 'Du nutzt die Touchwall direkt lokal im Browser.', '🚀');
  };

  const handleLogoutAndLock = () => {
    clearAuthSession();
    try {
      localStorage.removeItem('richter_touchwall_v6');
      localStorage.removeItem('richter_touchwall_events_cache');
    } catch (e) {}
    setAccountId('');
    setAuthKey('');
    setTodoistConfig({ apiToken: '', shoppingProjectId: '', tasksProjectId: '', projects: [], collaborators: [] });
    setMembers(DEFAULT_MEMBERS);
    setEvents([]);
    setFamilyTasks([]);
    setPantryItemsRaw([]);
    setPantryTrashRaw([]);
    setSkillBoardDataRaw(null);
    setFamilyNotes(DEFAULT_NOTES);
    setMealPlan(DEFAULT_MEALS);
    setSchoolData(DEFAULT_SCHOOL);
    setFamilyName('Familien-Touchwall');
    setIsAuthenticated(false);
  };

//
  //
  // ============================================================================
  // PART 09: NOTIZEN, EINKAUFSLISTE & AUFGABEN-AKTIONEN
  // ============================================================================
  //
  //

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
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const targetNote = safeNotes.find(n => n.id === noteId);
    const isFirst = safeNotes[0]?.id === noteId;
    const norm = getShopNormKey(clean);

    if (isFirst && syncMetaRef.current?.deletedTaskIds) {
      delete syncMetaRef.current.deletedTaskIds['shop_del_' + norm];
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      saveLocalSyncMeta(syncMetaRef.current);
    }

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
      items: [
        { text: clean, done: false, doneAt: 0, addedAtTs: now, todoistId },
        ...(Array.isArray(n.items) ? n.items : []).filter(it => !isFirst || getShopNormKey(it?.text) !== norm)
      ]
    } : n));
  };

  const toggleItemInNoteTile = async (noteId, itemIdx) => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const targetNote = safeNotes.find(n => n.id === noteId);
    const isFirst = safeNotes[0]?.id === noteId;
    const item = targetNote?.items?.[itemIdx];
    if (!item) return;

    const nextDone = !item.done;
    const norm = getShopNormKey(item.text);

    if (isFirst) {
      if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
      if (nextDone) {
        syncMetaRef.current.deletedTaskIds['shop_done_' + norm] = now;
      } else {
        delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
        delete syncMetaRef.current.deletedTaskIds['shop_del_' + norm];
        if (item.todoistId) delete syncMetaRef.current.deletedTaskIds[String(item.todoistId)];
      }
      saveLocalSyncMeta(syncMetaRef.current);
    }

    setFamilyNotes(prev => (Array.isArray(prev) ? prev : DEFAULT_NOTES).map(n => n.id === noteId ? {
      ...n,
      items: (Array.isArray(n.items) ? n.items : []).map((it, i) =>
        i === itemIdx ? { ...it, done: nextDone, doneAt: nextDone ? now : 0 } : it
      )
    } : n));

    if (item.todoistId && safeTodoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(safeTodoistConfig.apiToken, item.todoistId, nextDone); } catch (e) {}
    }
  };

  const deleteItemInNoteTile = async (noteId, itemIdx) => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const targetNote = safeNotes.find(n => n.id === noteId);
    const isFirst = safeNotes[0]?.id === noteId;
    const item = targetNote?.items?.[itemIdx];

    if (item && isFirst) {
      if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
      const norm = getShopNormKey(item.text);
      syncMetaRef.current.deletedTaskIds['shop_del_' + norm] = now;
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      if (item.todoistId) syncMetaRef.current.deletedTaskIds[String(item.todoistId)] = now;
      saveLocalSyncMeta(syncMetaRef.current);
    }

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

  const clearCompletedShoppingItems = async () => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const doneItems = (Array.isArray(safeNotes[0]?.items) ? safeNotes[0].items : []).filter(it => it?.done);

    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
    for (const it of doneItems) {
      const norm = getShopNormKey(it.text);
      syncMetaRef.current.deletedTaskIds['shop_del_' + norm] = now;
      delete syncMetaRef.current.deletedTaskIds['shop_done_' + norm];
      if (it.todoistId) {
        syncMetaRef.current.deletedTaskIds[String(it.todoistId)] = now;
        if (safeTodoistConfig.apiToken) {
          try { await deleteTodoistTask(safeTodoistConfig.apiToken, it.todoistId); } catch (e) {}
        }
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);

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
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const norm = getTaskNormKey({ member: memberId, title: clean });
    const titleKey = getTaskTitleKey({ title: clean });

    if (syncMetaRef.current?.deletedTaskIds) {
      delete syncMetaRef.current.deletedTaskIds['task_del_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_del_title_' + titleKey];
      delete syncMetaRef.current.deletedTaskIds['task_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey];
      saveLocalSyncMeta(syncMetaRef.current);
    }

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
      id: now + Math.floor(Math.random() * 1000),
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
      done: false,
      doneAt: 0
    };
    setFamilyTasks(prev => [newTask, ...(Array.isArray(prev) ? prev : []).filter(t => getTaskTitleKey(t) !== titleKey)]);
    showToast('Aufgabe angelegt', clean + ' → ' + (memberObj?.name || memberId), '📲');

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
      registerPendingCalendarOp(pendingCalendarOpsRef, 'create', calEv);
      setEvents(prev => [...(Array.isArray(prev) ? prev : []), calEv]);
      await sendCalendarApiAction({ action: 'createEvent', event: calEv }, '📲 Sende Kalender-Wecker...');
    }
  };

  const toggleTaskDone = async (taskId, makeDone) => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const target = safeTasks.find(t => t.id === taskId);

    if (target) {
      const norm = getTaskNormKey(target);
      const titleKey = getTaskTitleKey(target);
      const idKey = String(target.id || '');
      const tdKey = target.todoistId ? String(target.todoistId) : '';
      if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};

      if (makeDone) {
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
    }

    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).map(t =>
      t.id === taskId ? { ...t, done: makeDone, doneAt: makeDone ? now : 0 } : t
    ));

    if (target?.todoistId && safeTodoistConfig.apiToken) {
      try { await closeOrReopenTodoistTask(safeTodoistConfig.apiToken, target.todoistId, makeDone); } catch (e) {}
    }
  };

  const deleteTaskItem = async (taskId) => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const target = safeTasks.find(t => t.id === taskId);

    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
    syncMetaRef.current.deletedTaskIds[String(taskId)] = now;
    delete syncMetaRef.current.deletedTaskIds['task_done_id_' + String(taskId)];

    if (target) {
      const norm = getTaskNormKey(target);
      const titleKey = getTaskTitleKey(target);
      syncMetaRef.current.deletedTaskIds['task_del_' + norm] = now;
      syncMetaRef.current.deletedTaskIds['task_del_title_' + titleKey] = now;
      delete syncMetaRef.current.deletedTaskIds['task_done_' + norm];
      delete syncMetaRef.current.deletedTaskIds['task_done_title_' + titleKey];
      if (target.todoistId) {
        syncMetaRef.current.deletedTaskIds[String(target.todoistId)] = now;
        delete syncMetaRef.current.deletedTaskIds['task_done_td_' + String(target.todoistId)];
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);

    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).filter(t => t.id !== taskId));
    if (target?.todoistId && safeTodoistConfig.apiToken) {
      try { await deleteTodoistTask(safeTodoistConfig.apiToken, target.todoistId); } catch (e) {}
    }
  };

  const clearCompletedMemberTasks = async (memberId) => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    const toRemove = safeTasks.filter(t => t.member === memberId && t.done);

    if (!syncMetaRef.current.deletedTaskIds) syncMetaRef.current.deletedTaskIds = {};
    for (const t of toRemove) {
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
        if (safeTodoistConfig.apiToken) {
          try { await deleteTodoistTask(safeTodoistConfig.apiToken, tdKey); } catch (e) {}
        }
      }
    }
    saveLocalSyncMeta(syncMetaRef.current);

    setFamilyTasks(prev => (Array.isArray(prev) ? prev : []).filter(t => !(t.member === memberId && t.done)));
  };

  //
  //
  // ============================================================================
  // PART 10: KALENDER-, DESIGN- & BACKUP-AKTIONEN
  // ============================================================================
  //
  //

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
    registerPendingCalendarOp(pendingCalendarOpsRef, 'create', copiedNewEv);
    setEvents(prev => [...(Array.isArray(prev) ? prev : []), copiedNewEv]);
    showToast('Termin kopiert & eingefügt!', '„' + copiedNewEv.title + '“ → ' + (targetM ? targetM.name : newMember) + ' (' + newDate + ')', '📋');
    await sendCalendarApiAction({ action: 'createEvent', event: copiedNewEv }, '⏳ Speichere Kopie in Cloud...');
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
      registerPendingCalendarOp(pendingCalendarOpsRef, 'update', updatedEv);
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
      registerPendingCalendarOp(pendingCalendarOpsRef, 'create', newEv);
      setEvents(prev => [...(Array.isArray(prev) ? prev : []), newEv]);
      setEventModal({ ...eventModal, open: false });
      await sendCalendarApiAction({ action: 'createEvent', event: newEv });
    }
  };

  const deleteEventById = async (id) => {
    const targetEv = safeEvents.find(ev => String(ev.id) === String(id));
    if (targetEv) {
      registerPendingCalendarOp(pendingCalendarOpsRef, 'delete', targetEv);
      syncMetaRef.current.deletedEventIds[String(targetEv.id)] = Date.now();
      saveLocalSyncMeta(syncMetaRef.current);
    }
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
    const movedEv = { ...targetEv, member: targetMemberId, date: newDate };
    registerPendingCalendarOp(pendingCalendarOpsRef, 'move', movedEv);
    setEvents(prev => (Array.isArray(prev) ? prev : []).map(ev => String(ev.id) === String(evId) ? movedEv : ev));
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
      pantryItems: safePantryItems,
      pantryTrash: safePantryTrash,
      skillBoardData,
      syncMeta: syncMetaRef.current,
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
    const calId = prompt('Google Kalender-ID (leer lassen für Cloud-Kalender):') || '';
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
        ok: true
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
        if (Array.isArray(d.pantryItems)) setPantryItemsRaw(d.pantryItems);
        if (Array.isArray(d.pantryTrash)) setPantryTrashRaw(d.pantryTrash);
        if (d.skillBoardData && typeof d.skillBoardData === 'object') setSkillBoardDataRaw(d.skillBoardData);
        showToast('Import erfolgreich', 'Backup inkl. Skill-Board wiederhergestellt.', '🎉');
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
      pantryItems: safePantryItems,
      pantryTrash: safePantryTrash,
      skillBoardData,
      todoistConfig: safeTodoistConfig
    }, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'touchwall_backup_' + todayStr + '.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  //
  //
  // ============================================================================
  // PART 11: AUTH-CHECK & PROPS-PAKETE FÜR UNTER-KOMPONENTEN
  // ============================================================================
  //
  //

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <AuthScreen
        isCheckingAuth={isCheckingAuth}
        spawnTouchRipple={spawnTouchRipple}
        themeStyles={themeStyles}
        authTab={authTab}
        setAuthTab={setAuthTab}
        loginError={loginError}
        setLoginError={setLoginError}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        loginFamilyName={loginFamilyName}
        setLoginFamilyName={setLoginFamilyName}
        setupMemberNames={setupMemberNames}
        setSetupMemberNames={setSetupMemberNames}
        isLoggingIn={isLoggingIn}
        handleAccountLoginSubmit={handleAccountLoginSubmit}
        handleRegisterSubmit={handleRegisterSubmit}
        handleInstantLocalStart={handleInstantLocalStart}
        returnTo="/"
      />
    );
  }

  const syncIconClass = isSyncing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5';

  const qrShareUrl = typeof window !== 'undefined'
    ? window.location.origin + '/pocket' +
      (accountId && accountId !== 'local'
        ? '?account=' + encodeURIComponent(accountId) + '&key=' + encodeURIComponent(authKey) + '&family=' + encodeURIComponent(familyName)
        : '')
    : 'https://vercel.com';

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
    accountId,
    authKey,
    onAuthKeyUpdated: (nextKey) => {
      setAuthKey(nextKey);
      writeAuthSession(accountId, nextKey, familyName);
    },
    members: safeMembers,
    setMembers,
    schoolData: safeSchoolData,
    setSchoolData,
    activeSchoolChild,
    setActiveSchoolChild,
    setSchoolModal,
    addNewTaskWithSettings,
    mealPlan: safeMeals,
    setMealPlan,
    pantryItems: safePantryItems,
    setPantryItems,
    setPantryTrash,
    todayStr,
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

  //
  //
  // ============================================================================
  // PART 12: HAUPT-LAYOUT (SIDEBAR, HEADER, VIEWPORT & MODALS)
  // ============================================================================
  //
  //

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
      <style>{TOUCHWALL_GLOBAL_STYLES}</style>

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
                { id: 'kalender',   label: 'Kalender',    icon: Calendar },
                { id: 'schule',     label: 'Schule',      icon: GraduationCap },
                { id: 'aufgaben',   label: 'Todoist',     icon: CheckSquare },
                { id: 'essen',      label: 'Essensplan',  icon: Utensils },
                { id: 'vorrat',     label: 'Vorrat',      icon: Package },
                { id: 'listen',     label: 'Notizen',     icon: FileText },
                { id: 'design',     label: 'Design',      icon: Palette },
                { id: 'google',     label: 'Konten',      icon: Cloud },
                { id: 'skillboard', label: 'Skill Board', icon: Sparkles }
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
              title="Abmelden"
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
                {accountId && accountId !== 'local' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-400/30">
                    👤 {accountId}
                  </span>
                )}

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
                  onClick={() => setSyncModalOpen(true)}
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
                  <Smartphone className="w-3.5 h-3.5" /> Handy-Einladung
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
                  title="Abmelden"
                  className="tw-nav-inactive inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-400 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Abmelden
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

            {activeSection === 'schule' && (
              <SchoolSection
                members={safeMembers}
                schoolData={safeSchoolData}
                setSchoolData={setSchoolData}
                activeSchoolChild={activeSchoolChild}
                setActiveSchoolChild={setActiveSchoolChild}
                setSchoolModal={setSchoolModal}
                addNewTaskWithSettings={addNewTaskWithSettings}
                todayStr={todayStr}
                themeStyles={themeStyles}
                getMemberStyles={getMemberStyles}
                renderAvatar={renderAvatar}
                showToast={showToast}
              />
            )}

            {activeSection === 'aufgaben' && (
              <TasksTodoistSection {...todoistProps} />
            )}

            {activeSection === 'vorrat' && (
              <PantrySection
                accountId={accountId}
                pantryItems={safePantryItems}
                setPantryItems={setPantryItems}
                pantryTrash={safePantryTrash}
                setPantryTrash={setPantryTrash}
                mealPlan={safeMeals}
                setMealPlan={setMealPlan}
                addShoppingItem={addShoppingItem}
                todayStr={todayStr}
                themeStyles={themeStyles}
                showToast={showToast}
              />
            )}

            {['essen', 'listen', 'design', 'google'].includes(activeSection) && (
              <OtherSections {...otherSectionsProps} />
            )}

            <QuestSection
              isActive={activeSection === 'skillboard'}
              setActiveSection={setActiveSection}
              skillBoardData={skillBoardData}
              setSkillBoardData={setSkillBoardData}
              members={safeMembers}
              events={safeEvents}
              familyTasks={safeTasks}
              toggleTaskDone={toggleTaskDone}
              pantryItems={safePantryItems}
              pantryTrash={safePantryTrash}
              familyNotes={safeNotes}
              themeStyles={themeStyles}
              getMemberStyles={getMemberStyles}
              renderAvatar={renderAvatar}
              showToast={showToast}
            />
          </main>
        </div>
      </div>

      {/* 4-KANAL SYNC-COCKPIT MODAL */}
      <SyncCenterModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        channelStatus={channelStatus}
        onSyncCalendarOnly={() => pullFromCloud(undefined, true, undefined, undefined, 'calendar')}
        onSyncTodoistOnly={() => syncWithTodoistNow(true)}
        onSyncPantryOnly={() => pullFromCloud(undefined, true, undefined, undefined, 'pantry')}
        onSyncSkillBoardOnly={() => pullFromCloud(undefined, true, undefined, undefined, 'skillboard')}
        onSyncAllChannels={async () => {
          await pullFromCloud(undefined, true, undefined, undefined, 'all');
          await syncWithTodoistNow(true);
        }}
        themeStyles={themeStyles}
      />

      {/* AUSGELAGERTE POP-UP-FENSTER, QR-MODAL, ALARM-BANNER & TOASTS */}
      <TouchwallModals
        eventModal={eventModal}
        setEventModal={setEventModal}
        saveEventModal={saveEventModal}
        deleteEventById={deleteEventById}
        duplicateEventToTarget={duplicateEventToTarget}
        setCopiedEvent={setCopiedEvent}
        taskModal={taskModal}
        setTaskModal={setTaskModal}
        setFamilyTasks={setFamilyTasks}
        setEvents={setEvents}
        pendingCalendarOpsRef={pendingCalendarOpsRef}
        sendCalendarApiAction={sendCalendarApiAction}
        lastLocalEditTimeRef={lastLocalEditTimeRef}
        safeTodoistConfig={safeTodoistConfig}
        yearDayModal={yearDayModal}
        setYearDayModal={setYearDayModal}
        safeEvents={safeEvents}
        schoolModal={schoolModal}
        setSchoolModal={setSchoolModal}
        setSchoolData={setSchoolData}
        activeSchoolChild={activeSchoolChild}
        qrModalOpen={qrModalOpen}
        setQrModalOpen={setQrModalOpen}
        qrShareUrl={qrShareUrl}
        activeAlarmBanner={activeAlarmBanner}
        setActiveAlarmBanner={setActiveAlarmBanner}
        toast={toast}
        safeMembers={safeMembers}
        todayStr={todayStr}
        themeStyles={themeStyles}
        getMemberStyles={getMemberStyles}
        renderAvatar={renderAvatar}
        triggerEventAlarmNow={triggerEventAlarmNow}
        showToast={showToast}
      />
    </div>
  );
}
