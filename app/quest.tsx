// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles, ShieldCheck, KeyRound, RotateCcw, Lock, Unlock,
  Swords, Settings, X, Cloud
} from 'lucide-react';

// ============================================================================
// 30 STANDARD-RÄNGE (VON "Wall-Newbie" BIS "Epic Wall Master Legend")
// ============================================================================
export const DEFAULT_RPG_RANKS = [
  { level: 1,  title: 'Wall-Newbie',                    badge: '🌱', minXp: 0 },
  { level: 2,  title: 'Touch-Lehrling',                 badge: '🪵', minXp: 80 },
  { level: 3,  title: 'Klick-Knappe',                   badge: '🧹', minXp: 180 },
  { level: 4,  title: 'Listen-Späher',                  badge: '🕯️', minXp: 320 },
  { level: 5,  title: 'Einkaufs-Kundschafter',          badge: '🛒', minXp: 500 },
  { level: 6,  title: 'Vorrats-Hüter',                  badge: '🥫', minXp: 720 },
  { level: 7,  title: 'Zeit-Chronist',                  badge: '📅', minXp: 980 },
  { level: 8,  title: 'Schild-Organisator',             badge: '🛡️', minXp: 1300 },
  { level: 9,  title: 'Aufgaben-Jäger',                 badge: '🏹', minXp: 1680 },
  { level: 10, title: 'Quest-Waldläufer',               badge: '🌲', minXp: 2120 },
  { level: 11, title: 'Touch-Akrobat',                  badge: '⚡', minXp: 2620 },
  { level: 12, title: 'Küchen-Alchemist',               badge: '🧪', minXp: 3200 },
  { level: 13, title: 'Planungs-Navigator',             badge: '🧭', minXp: 3850 },
  { level: 14, title: 'Kristall-Verwalter',             badge: '💎', minXp: 4600 },
  { level: 15, title: 'Familien-Paladin',               badge: '🦁', minXp: 5450 },
  { level: 16, title: 'Kalender-Magier',                badge: '🧙‍♂️', minXp: 6400 },
  { level: 17, title: 'Adleraugen-Stratege',            badge: '🦅', minXp: 7450 },
  { level: 18, title: 'Todoist-Gladiator',              badge: '⚔️', minXp: 8600 },
  { level: 19, title: 'Haushalts-Kommandant',           badge: '🏰', minXp: 9850 },
  { level: 20, title: 'Sternen-Koordinator',            badge: '🌟', minXp: 11200 },
  { level: 21, title: 'Drachen-Bezwinger des Alltags',  badge: '🐉', minXp: 12700 },
  { level: 22, title: 'Kronenhüter der Speisekammer',   badge: '🍱', minXp: 14350 },
  { level: 23, title: 'Astral-Planer',                  badge: '🌌', minXp: 16150 },
  { level: 24, title: 'Blitz-Großmeister',              badge: '🌩️', minXp: 18100 },
  { level: 25, title: 'Titan der Touchwall',            badge: '🔱', minXp: 20200 },
  { level: 26, title: 'Phönix-Meister',                 badge: '🔥', minXp: 22500 },
  { level: 27, title: 'Diamant-Imperator',              badge: '💠', minXp: 25000 },
  { level: 28, title: 'Kosmischer Zeit-Herrscher',      badge: '⏳', minXp: 27800 },
  { level: 29, title: 'Unsterblicher Gilden-Champion',  badge: '🏆', minXp: 31000 },
  { level: 30, title: 'Epic Wall Master Legend',        badge: '👑', minXp: 35000 }
];

const BADGE_EMOJI_PICKER = [
  '🌱', '🪵', '🧹', '🕯️', '🛒', '🥫', '📅', '🛡️', '🏹', '🌲',
  '⚡', '🧪', '🧭', '💎', '🦁', '🧙‍♂️', '🦅', '⚔️', '🏰', '🌟',
  '🐉', '🍱', '🌌', '🌩️', '🔱', '🔥', '💠', '⏳', '🏆', '👑',
  '🎮', '🚀', '🦊', '🐺', '🦄', '☄️', '🥇', '🎖️', '🔮', '🦸‍♂️'
];

const XP_WEIGHTS = {
  tasksDone:       60, // Aufgabe / Quest erledigt
  pantryCare:      45, // Lebensmittel eingebucht oder rechtzeitig verzehrt
  calendarEvents:  35, // Kalendereintrag geplant
  shoppingDone:    30, // Einkaufspunkt erledigt
  notesCreated:    20, // Notiz / Listenpunkt hinzugefügt
  clicks:           2, // Jeder Touch / Mausklick
  mouseMeters:      3  // Pro gelaufenem Maus-Meter
};

function playRpgSound(type = 'xp') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'levelup') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
        gain.gain.setValueAtTime(0.18, now + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.36);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 || now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    }
  } catch (e) {}
}

function createEmptyPlayerStats() {
  return {
    pin: '',
    tasksDone: 0,
    pantryCare: 0,
    calendarEvents: 0,
    shoppingDone: 0,
    notesCreated: 0,
    clicks: 0,
    mousePixels: 0,
    bonusXp: 0
  };
}

function calculatePlayerBreakdown(stats) {
  const s = stats || createEmptyPlayerStats();
  const mouseMeters = Math.floor((Number(s.mousePixels) || 0) / 3500);

  const xpTasks    = (Number(s.tasksDone) || 0) * XP_WEIGHTS.tasksDone;
  const xpPantry   = (Number(s.pantryCare) || 0) * XP_WEIGHTS.pantryCare;
  const xpCalendar = (Number(s.calendarEvents) || 0) * XP_WEIGHTS.calendarEvents;
  const xpShopping = (Number(s.shoppingDone) || 0) * XP_WEIGHTS.shoppingDone;
  const xpNotes    = (Number(s.notesCreated) || 0) * XP_WEIGHTS.notesCreated;
  const xpClicks   = (Number(s.clicks) || 0) * XP_WEIGHTS.clicks;
  const xpMouse    = mouseMeters * XP_WEIGHTS.mouseMeters;
  const xpBonus    = Number(s.bonusXp) || 0;

  const totalXp = xpTasks + xpPantry + xpCalendar + xpShopping + xpNotes + xpClicks + xpMouse + xpBonus;

  return {
    mouseMeters,
    xpTasks,
    xpPantry,
    xpCalendar,
    xpShopping,
    xpNotes,
    xpClicks,
    xpMouse,
    totalXp
  };
}

function getRankForXp(totalXp, ranksList) {
  const list = Array.isArray(ranksList) && ranksList.length > 0 ? ranksList : DEFAULT_RPG_RANKS;
  let current = list[0];
  let next = null;

  for (let i = 0; i < list.length; i++) {
    if (totalXp >= list[i].minXp) {
      current = list[i];
      next = list[i + 1] || null;
    } else {
      break;
    }
  }

  const xpIntoLevel = Math.max(0, totalXp - current.minXp);
  const xpNeededForNext = next ? Math.max(1, next.minXp - current.minXp) : 1;
  const progressPercent = next ? Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100)) : 100;

  return {
    current,
    next,
    xpIntoLevel,
    xpNeededForNext,
    progressPercent
  };
}

// Verbindet lokale & Cloud-Spielerdaten verlustfrei (behält immer den höheren Punktestand)
function mergePlayersDataSafe(localMap, remoteMap) {
  const out = { ...(localMap || {}) };
  if (!remoteMap || typeof remoteMap !== 'object') return out;

  Object.keys(remoteMap).forEach(pid => {
    const loc = out[pid] || createEmptyPlayerStats();
    const rem = remoteMap[pid] || createEmptyPlayerStats();
    out[pid] = {
      pin: rem.pin !== undefined && rem.pin !== '' ? rem.pin : (loc.pin || ''),
      tasksDone: Math.max(Number(loc.tasksDone) || 0, Number(rem.tasksDone) || 0),
      pantryCare: Math.max(Number(loc.pantryCare) || 0, Number(rem.pantryCare) || 0),
      calendarEvents: Math.max(Number(loc.calendarEvents) || 0, Number(rem.calendarEvents) || 0),
      shoppingDone: Math.max(Number(loc.shoppingDone) || 0, Number(rem.shoppingDone) || 0),
      notesCreated: Math.max(Number(loc.notesCreated) || 0, Number(rem.notesCreated) || 0),
      clicks: Math.max(Number(loc.clicks) || 0, Number(rem.clicks) || 0),
      mousePixels: Math.max(Number(loc.mousePixels) || 0, Number(rem.mousePixels) || 0),
      bonusXp: Math.max(Number(loc.bonusXp) || 0, Number(rem.bonusXp) || 0)
    };
  });
  return out;
}

export default function QuestSection({
  isActive,
  setActiveSection,
  skillBoardData,
  setSkillBoardData,
  members,
  events,
  familyTasks,
  toggleTaskDone,
  pantryItems,
  pantryTrash,
  familyNotes,
  themeStyles,
  getMemberStyles,
  renderAvatar,
  showToast
}) {
  const playerMembers = useMemo(() => {
    return (Array.isArray(members) ? members : []).filter(m => m.id !== 'all');
  }, [members]);

  const [activePlayerId, setActivePlayerId] = useState('hans');
  const [playersData, setPlayersData] = useState({});
  const [customRanks, setCustomRanks] = useState(DEFAULT_RPG_RANKS);
  const [isLoaded, setIsLoaded] = useState(false);

  const [pinModal, setPinModal] = useState({
    open: false,
    mode: 'login',
    targetMemberId: '',
    oldPinInput: '',
    newPinInput: '',
    errorMsg: ''
  });

  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [ranksDraft, setRanksDraft] = useState(DEFAULT_RPG_RANKS);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const activePlayerRef = useRef(activePlayerId);
  activePlayerRef.current = activePlayerId;

  const lastMousePosRef = useRef({ x: null, y: null });
  const pixelBufferRef = useRef(0);
  const lastCloudSyncStampRef = useRef(0);
  const prevCountsRef = useRef({
    initialized: false,
    eventsCount: 0,
    doneTasksCount: 0,
    pantryCount: 0,
    consumedTrashCount: 0,
    doneShopCount: 0,
    totalNotesItems: 0
  });
  const prevPlayerLevelsRef = useRef({});

  // 1. Initiales Laden aus LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('richter_tw_skillboard_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.activePlayerId) setActivePlayerId(parsed.activePlayerId);
        if (parsed.playersData && typeof parsed.playersData === 'object') {
          setPlayersData(parsed.playersData);
        }
        if (Array.isArray(parsed.customRanks) && parsed.customRanks.length >= 25) {
          setCustomRanks(parsed.customRanks);
        }
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  // 2. Empfang von Cloud- / Backup-Daten aus page.tsx (Gerätewechsel oder Backup-Import)
  useEffect(() => {
    if (!skillBoardData || typeof skillBoardData !== 'object') return;
    const remoteStamp = Number(skillBoardData.updatedAt) || 0;
    if (remoteStamp > 0 && remoteStamp === lastCloudSyncStampRef.current) return;

    if (skillBoardData.playersData && typeof skillBoardData.playersData === 'object') {
      setPlayersData(prev => mergePlayersDataSafe(prev, skillBoardData.playersData));
    }
    if (Array.isArray(skillBoardData.customRanks) && skillBoardData.customRanks.length >= 25) {
      setCustomRanks(skillBoardData.customRanks);
    }
    if (skillBoardData.activePlayerId) {
      setActivePlayerId(prev => prev || skillBoardData.activePlayerId);
    }
  }, [skillBoardData]);

  // 3. Sofort-Sync Funktion an page.tsx (für den Cloud-Tresor & Backup-Export)
  const pushSkillBoardToCloudState = (nextActiveId, nextPlayers, nextRanks) => {
    const stamp = Date.now();
    lastCloudSyncStampRef.current = stamp;
    const bundle = {
      activePlayerId: nextActiveId !== undefined ? nextActiveId : activePlayerId,
      playersData: nextPlayers !== undefined ? nextPlayers : playersData,
      customRanks: nextRanks !== undefined ? nextRanks : customRanks,
      updatedAt: stamp
    };
    try {
      localStorage.setItem('richter_tw_skillboard_v1', JSON.stringify(bundle));
    } catch (e) {}
    if (typeof setSkillBoardData === 'function') {
      setSkillBoardData(bundle);
    }
  };

  // Speichert lokal sofort und synchronisiert gebündelt alle 15s (schont Cloud bei Dauer-Klicks)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('richter_tw_skillboard_v1', JSON.stringify({
        activePlayerId,
        playersData,
        customRanks,
        updatedAt: Date.now()
      }));
    } catch (e) {}

    const timer = setTimeout(() => {
      pushSkillBoardToCloudState(activePlayerId, playersData, customRanks);
    }, 15000);

    return () => clearTimeout(timer);
  }, [isLoaded, activePlayerId, playersData, customRanks]);

  const incrementPlayerStat = (playerId, statKey, delta = 1, syncImmediately = false) => {
    if (!playerId) return;
    setPlayersData(prev => {
      const currentObj = prev[playerId] || createEmptyPlayerStats();
      const nextMap = {
        ...prev,
        [playerId]: {
          ...currentObj,
          [statKey]: Math.max(0, (Number(currentObj[statKey]) || 0) + delta)
        }
      };
      if (syncImmediately) {
        setTimeout(() => pushSkillBoardToCloudState(activePlayerRef.current, nextMap, customRanks), 50);
      }
      return nextMap;
    });
  };

  // =========================================================
  // GLOBALES KLICK- & MAUSBEWEGUNGS-TRACKING AUF DER TOUCHWALL
  // =========================================================
  useEffect(() => {
    if (!isLoaded) return;

    const handleGlobalClick = () => {
      const pid = activePlayerRef.current;
      if (!pid) return;
      setPlayersData(prev => {
        const cur = prev[pid] || createEmptyPlayerStats();
        return {
          ...prev,
          [pid]: { ...cur, clicks: (Number(cur.clicks) || 0) + 1 }
        };
      });
    };

    const handleGlobalMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      if (typeof x !== 'number' || typeof y !== 'number') return;

      if (lastMousePosRef.current.x !== null) {
        const dx = x - lastMousePosRef.current.x;
        const dy = y - lastMousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2 && dist < 500) {
          pixelBufferRef.current += dist;
        }
      }
      lastMousePosRef.current = { x, y };

      if (pixelBufferRef.current >= 800) {
        const addPx = Math.round(pixelBufferRef.current);
        pixelBufferRef.current = 0;
        const pid = activePlayerRef.current;
        if (!pid) return;
        setPlayersData(prev => {
          const cur = prev[pid] || createEmptyPlayerStats();
          return {
            ...prev,
            [pid]: { ...cur, mousePixels: (Number(cur.mousePixels) || 0) + addPx }
          };
        });
      }
    };

    window.addEventListener('pointerdown', handleGlobalClick, { passive: true });
    window.addEventListener('pointermove', handleGlobalMove, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleGlobalClick);
      window.removeEventListener('pointermove', handleGlobalMove);
    };
  }, [isLoaded]);

  // =========================================================
  // AUTOMATISCHE ERKENNUNG VON QUESTS, KALENDER, VORRAT & NOTIZEN
  // =========================================================
  useEffect(() => {
    if (!isLoaded) return;

    const evCount = (Array.isArray(events) ? events : []).filter(e => !e?.fromMobile).length;
    const doneTasks = (Array.isArray(familyTasks) ? familyTasks : []).filter(t => t.done && !t?.fromMobile).length;
    const pCount = (Array.isArray(pantryItems) ? pantryItems : []).filter(p => !p?.fromMobile).length;
    const consumedCount = (Array.isArray(pantryTrash) ? pantryTrash : []).filter(t => t.reason === 'consumed' && !t?.fromMobile).length;
    const shopDone = (Array.isArray(familyNotes?.[0]?.items) ? familyNotes[0].items : []).filter(i => i.done && !i?.fromMobile).length;
    const notesTotal = (Array.isArray(familyNotes) ? familyNotes : []).reduce((acc, n) => acc + (Array.isArray(n.items) ? n.items.filter(i => !i?.fromMobile).length : 0), 0);

    if (!prevCountsRef.current.initialized) {
      prevCountsRef.current = {
        initialized: true,
        eventsCount: evCount,
        doneTasksCount: doneTasks,
        pantryCount: pCount,
        consumedTrashCount: consumedCount,
        doneShopCount: shopDone,
        totalNotesItems: notesTotal
      };
      return;
    }

    const pid = activePlayerRef.current;
    const prev = prevCountsRef.current;

    if (doneTasks > prev.doneTasksCount) {
      const diff = doneTasks - prev.doneTasksCount;
      incrementPlayerStat(pid, 'tasksDone', diff, true);
      playRpgSound('xp');
      showToast?.('⚔️ Quest abgeschlossen!', '+' + (diff * XP_WEIGHTS.tasksDone) + ' Skill-XP erhalten!', '🏆');
    }

    if (evCount > prev.eventsCount) {
      const diff = evCount - prev.eventsCount;
      incrementPlayerStat(pid, 'calendarEvents', diff, true);
      playRpgSound('xp');
    }

    if (pCount > prev.pantryCount || consumedCount > prev.consumedTrashCount) {
      const diff = Math.max(1, (pCount - prev.pantryCount) + (consumedCount - prev.consumedTrashCount));
      incrementPlayerStat(pid, 'pantryCare', diff, true);
      playRpgSound('xp');
    }

    if (shopDone > prev.doneShopCount) {
      const diff = shopDone - prev.doneShopCount;
      incrementPlayerStat(pid, 'shoppingDone', diff, true);
      playRpgSound('xp');
    }

    if (notesTotal > prev.totalNotesItems) {
      const diff = notesTotal - prev.totalNotesItems;
      incrementPlayerStat(pid, 'notesCreated', diff, true);
    }

    prevCountsRef.current = {
      initialized: true,
      eventsCount: evCount,
      doneTasksCount: doneTasks,
      pantryCount: pCount,
      consumedTrashCount: consumedCount,
      doneShopCount: shopDone,
      totalNotesItems: notesTotal
    };
  }, [isLoaded, events, familyTasks, pantryItems, pantryTrash, familyNotes]);

  // Level-Up Detektor
  useEffect(() => {
    if (!isLoaded) return;
    playerMembers.forEach(m => {
      const st = playersData[m.id] || createEmptyPlayerStats();
      const bd = calculatePlayerBreakdown(st);
      const rk = getRankForXp(bd.totalXp, customRanks);
      const prevLv = prevPlayerLevelsRef.current[m.id];

      if (prevLv !== undefined && rk.current.level > prevLv) {
        playRpgSound('levelup');
        setLevelUpBanner({
          memberName: m.name,
          level: rk.current.level,
          title: rk.current.title,
          badge: rk.current.badge
        });
      }
      prevPlayerLevelsRef.current[m.id] = rk.current.level;
    });
  }, [isLoaded, playersData, customRanks, playerMembers]);

  // =========================================================
  // PIN-SYSTEM: FESTLEGEN, ANMELDEN, ÄNDERN & 0000-RESET
  // =========================================================
  const handleCharacterCardClick = (member) => {
    const pStats = playersData[member.id] || createEmptyPlayerStats();
    if (!pStats.pin) {
      setPinModal({
        open: true,
        mode: 'setup',
        targetMemberId: member.id,
        oldPinInput: '',
        newPinInput: '',
        errorMsg: ''
      });
    } else {
      setPinModal({
        open: true,
        mode: 'login',
        targetMemberId: member.id,
        oldPinInput: '',
        newPinInput: '',
        errorMsg: ''
      });
    }
  };

  const openChangePinModal = (e, member) => {
    e.stopPropagation();
    const pStats = playersData[member.id] || createEmptyPlayerStats();
    setPinModal({
      open: true,
      mode: pStats.pin ? 'change' : 'setup',
      targetMemberId: member.id,
      oldPinInput: '',
      newPinInput: '',
      errorMsg: ''
    });
  };

  const openResetPinModal = (e, member) => {
    e.stopPropagation();
    setPinModal({
      open: true,
      mode: 'reset',
      targetMemberId: member.id,
      oldPinInput: '',
      newPinInput: '',
      errorMsg: ''
    });
  };

  const handlePinFormSubmit = (e) => {
    if (e) e.preventDefault();
    const targetId = pinModal.targetMemberId;
    const targetMember = playerMembers.find(m => m.id === targetId);
    const curStats = playersData[targetId] || createEmptyPlayerStats();

    if (pinModal.mode === 'setup') {
      const cleanNew = pinModal.newPinInput.trim();
      if (cleanNew.length < 3) {
        setPinModal(prev => ({ ...prev, errorMsg: 'Bitte mindestens 3 Zeichen/Ziffern für deinen PIN wählen.' }));
        return;
      }
      const nextMap = {
        ...playersData,
        [targetId]: { ...curStats, pin: cleanNew }
      };
      setPlayersData(nextMap);
      setActivePlayerId(targetId);
      pushSkillBoardToCloudState(targetId, nextMap, customRanks);
      setPinModal({ ...pinModal, open: false });
      playRpgSound('xp');
      showToast?.('Charakter & PIN in Cloud gesichert!', targetMember?.name + ' ist jetzt aktiv.', '🛡️');
      return;
    }

    if (pinModal.mode === 'login') {
      if (pinModal.oldPinInput.trim() === '0000') {
        setPinModal(prev => ({ ...prev, errorMsg: 'Für einen PIN-Reset mit 0000 bitte auf den Button „Reset“ auf der Kachel klicken.' }));
        return;
      }
      if (pinModal.oldPinInput.trim() !== curStats.pin) {
        setPinModal(prev => ({ ...prev, errorMsg: 'Falscher PIN! (Tipp: Mit dem Reset-Button und „0000“ zurücksetzen).' }));
        return;
      }
      setActivePlayerId(targetId);
      pushSkillBoardToCloudState(targetId, playersData, customRanks);
      setPinModal({ ...pinModal, open: false });
      playRpgSound('xp');
      showToast?.('Spieler gewechselt!', 'Du bedienst die Touchwall jetzt als ' + targetMember?.name + '.', '🎮');
      return;
    }

    if (pinModal.mode === 'change') {
      if (pinModal.oldPinInput.trim() !== curStats.pin) {
        setPinModal(prev => ({ ...prev, errorMsg: 'Dein bisheriger PIN stimmt nicht.' }));
        return;
      }
      if (pinModal.newPinInput.trim().length < 3) {
        setPinModal(prev => ({ ...prev, errorMsg: 'Der neue PIN muss mindestens 3 Zeichen haben.' }));
        return;
      }
      const nextMap = {
        ...playersData,
        [targetId]: { ...curStats, pin: pinModal.newPinInput.trim() }
      };
      setPlayersData(nextMap);
      setActivePlayerId(targetId);
      pushSkillBoardToCloudState(targetId, nextMap, customRanks);
      setPinModal({ ...pinModal, open: false });
      showToast?.('PIN geändert!', 'Neuer PIN für ' + targetMember?.name + ' wurde in der Cloud gespeichert.', '🔑');
      return;
    }

    if (pinModal.mode === 'reset') {
      if (pinModal.oldPinInput.trim() !== '0000') {
        setPinModal(prev => ({ ...prev, errorMsg: 'Bitte gib den Master-Reset-PIN „0000“ ein, um den PIN zu löschen.' }));
        return;
      }
      const nextMap = {
        ...playersData,
        [targetId]: { ...curStats, pin: '' }
      };
      setPlayersData(nextMap);
      pushSkillBoardToCloudState(activePlayerId, nextMap, customRanks);
      setPinModal({
        open: true,
        mode: 'setup',
        targetMemberId: targetId,
        oldPinInput: '',
        newPinInput: '',
        errorMsg: ''
      });
      showToast?.('PIN zurückgesetzt!', 'Lege jetzt direkt einen neuen PIN für ' + targetMember?.name + ' fest.', '🔓');
    }
  };

  const activeMemberObj = useMemo(() => {
    return playerMembers.find(m => m.id === activePlayerId) || playerMembers[0] || { id: 'hans', name: 'Spieler', color: 'navy_bold' };
  }, [playerMembers, activePlayerId]);

  const activeStats = playersData[activeMemberObj.id] || createEmptyPlayerStats();
  const activeBreakdown = useMemo(() => calculatePlayerBreakdown(activeStats), [activeStats]);
  const activeRankInfo = useMemo(() => getRankForXp(activeBreakdown.totalXp, customRanks), [activeBreakdown.totalXp, customRanks]);

  const activeRpgClassTitle = useMemo(() => {
    const pairs = [
      { label: '⚔️ Großmeister der Quests', val: activeBreakdown.xpTasks },
      { label: '🥫 Hüter der Speisekammer', val: activeBreakdown.xpPantry },
      { label: '📅 Chronist der Zeit',      val: activeBreakdown.xpCalendar },
      { label: '🛒 Schatzmeister des Einkaufs', val: activeBreakdown.xpShopping },
      { label: '⚡ Touch-Virtuose',          val: activeBreakdown.xpClicks + activeBreakdown.xpMouse }
    ].sort((a, b) => b.val - a.val);
    return pairs[0]?.val > 0 ? pairs[0].label : '🌟 Aufstrebender Abenteurer';
  }, [activeBreakdown]);

  const radarAxes = useMemo(() => {
    const norm = (val, maxRef) => Math.min(100, Math.max(12, Math.round((val / maxRef) * 100)));
    return [
      { label: 'Quests',   val: norm(activeStats.tasksDone || 0, 15),      raw: (activeStats.tasksDone || 0) + ' Quests' },
      { label: 'Vorrat',   val: norm(activeStats.pantryCare || 0, 15),     raw: (activeStats.pantryCare || 0) + ' Vorrat' },
      { label: 'Kalender', val: norm(activeStats.calendarEvents || 0, 12), raw: (activeStats.calendarEvents || 0) + ' Termine' },
      { label: 'Einkauf',  val: norm(activeStats.shoppingDone || 0, 20),   raw: (activeStats.shoppingDone || 0) + ' Einkäufe' },
      { label: 'Touch',    val: norm(activeStats.clicks || 0, 250),        raw: (activeStats.clicks || 0) + ' Klicks' },
      { label: 'Ausdauer', val: norm(activeBreakdown.mouseMeters || 0, 40), raw: activeBreakdown.mouseMeters + 'm Maus' }
    ];
  }, [activeStats, activeBreakdown]);

  const radarPolygonPoints = useMemo(() => {
    const cx = 130;
    const cy = 130;
    const maxR = 88;
    return radarAxes.map((ax, idx) => {
      const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
      const r = (ax.val / 100) * maxR;
      const x = Math.round(cx + r * Math.cos(angle));
      const y = Math.round(cy + r * Math.sin(angle));
      return x + ',' + y;
    }).join(' ');
  }, [radarAxes]);

  if (!isActive) {
    return (
      <>
        <div
          onClick={() => setActiveSection?.('skillboard')}
          title="Klicken, um zum Skill Board & Charakter-Wechsel zu springen"
          className="fixed bottom-3 left-24 z-40 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-sky-400/50 text-white shadow-xl flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform"
        >
          <span className="text-lg">{activeRankInfo.current.badge}</span>
          <div className="text-[11px] leading-tight">
            <div className="font-black text-sky-300">
              🎮 {activeMemberObj.name} • Lv.{activeRankInfo.current.level}
            </div>
            <div className="font-bold opacity-80">
              {activeBreakdown.totalXp} XP • 👆 {activeStats.clicks || 0} Klicks
            </div>
          </div>
        </div>

        {levelUpBanner && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={'w-full max-w-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl text-center space-y-4 ' + themeStyles.modal}>
              <div className="text-6xl animate-bounce">{levelUpBanner.badge}</div>
              <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase inline-block">
                🎉 Level Up auf der Touchwall!
              </div>
              <h3 className="text-2xl font-black">
                {levelUpBanner.memberName} erreicht Level {levelUpBanner.level}!
              </h3>
              <p className="text-base font-extrabold text-sky-400">
                Neuer Rang: „{levelUpBanner.title}“
              </p>
              <button
                onClick={() => setLevelUpBanner(null)}
                className="tw-glow-btn w-full py-3 rounded-2xl font-black text-sm cursor-pointer"
              >
                ⚔️ Weiter sammeln!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const chartBars = [
    { label: '⚔️ Quests & Aufgaben (+60 XP)',     count: activeStats.tasksDone || 0,      xp: activeBreakdown.xpTasks,    color: '#f43f5e' },
    { label: '🥫 Vorrat & Nahrung (+45 XP)',      count: activeStats.pantryCare || 0,     xp: activeBreakdown.xpPantry,   color: '#10b981' },
    { label: '📅 Kalender-Planung (+35 XP)',      count: activeStats.calendarEvents || 0, xp: activeBreakdown.xpCalendar, color: '#3b82f6' },
    { label: '🛒 Einkauf & Versorgung (+30 XP)',  count: activeStats.shoppingDone || 0,   xp: activeBreakdown.xpShopping, color: '#f59e0b' },
    { label: '📝 Notizen & Listen (+20 XP)',      count: activeStats.notesCreated || 0,   xp: activeBreakdown.xpNotes,    color: '#a855f7' },
    { label: '👆 Touch & Mausklicks (+2 XP)',     count: activeStats.clicks || 0,         xp: activeBreakdown.xpClicks,   color: '#06b6d4' },
    { label: '🖱️ Maus-Strecke in Metern (+3 XP)', count: activeBreakdown.mouseMeters,     xp: activeBreakdown.xpMouse,    color: '#6366f1' }
  ];
  const maxBarXp = Math.max(100, ...chartBars.map(b => b.xp));

  const openQuestsList = (Array.isArray(familyTasks) ? familyTasks : []).filter(t => !t.done);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {/* 1. KOPFZEILE & CHARAKTER-WAHL */}
      <div className={'p-5 rounded-3xl border shadow-sm space-y-4 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black">
                🎮 RPG SKILL BOARD & QUEST-SYSTEM
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
                🟢 Aktiver Charakter: {activeMemberObj.name} ({activeRankInfo.current.badge} Lv.{activeRankInfo.current.level})
              </span>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-extrabold flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" /> Cloud-Tresor & Backup aktiv
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5">
              Wähle deinen Charakter (mit persönlichem PIN-Schutz)
            </h2>
            <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
              Beim ersten Antippen legst du deinen PIN fest. Vergessen? Über „🔄 Reset“ und den Code „0000“ kannst du deinen PIN jederzeit zurücksetzen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRanksDraft(customRanks);
              setRankModalOpen(true);
            }}
            className="tw-glow-btn px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>👑 30 Ränge & Abzeichen anpassen</span>
          </button>
        </div>

        {/* CHARAKTER-KACHELN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {playerMembers.map(member => {
            const pStats = playersData[member.id] || createEmptyPlayerStats();
            const bd = calculatePlayerBreakdown(pStats);
            const rk = getRankForXp(bd.totalXp, customRanks);
            const isCurrent = member.id === activeMemberObj.id;
            const hasPin = Boolean(pStats.pin);
            const st = getMemberStyles(member);

            return (
              <div
                key={member.id}
                onClick={() => handleCharacterCardClick(member)}
                style={st.headerStyle}
                className={'p-4 rounded-3xl border-2 flex flex-col justify-between gap-3 cursor-pointer transition-all hover:scale-[1.02] ' +
                  (isCurrent ? 'ring-3 ring-amber-400 border-amber-400 shadow-xl' : themeStyles.divider)}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAvatar(member, 'w-12 h-12', 'text-xl')}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base truncate">{member.name}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black">
                              AKTIV
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1 mt-0.5">
                          <span>{rk.current.badge}</span>
                          <span className="truncate">Lv.{rk.current.level} • {rk.current.title}</span>
                        </div>
                      </div>
                    </div>

                    <span className={'px-2 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 ' + (hasPin ? 'bg-black/35 text-emerald-300' : 'bg-amber-500 text-slate-950')}>
                      {hasPin ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{hasPin ? 'PIN aktiv' : '1. Klick: PIN'}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span>✨ {bd.totalXp} XP</span>
                      <span>{rk.next ? ('Nächster Rang: ' + rk.next.minXp + ' XP') : 'MAX LEVEL 👑'}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden p-0.5">
                      <div
                        style={{ width: rk.progressPercent + '%' }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-white/15">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCharacterCardClick(member);
                    }}
                    className="tw-glow-btn flex-1 py-2 px-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{hasPin ? (isCurrent ? 'Aktiv ✓' : 'Auswählen') : 'PIN setzen'}</span>
                  </button>

                  <button
                    type="button"
                    title="Persönlichen PIN ändern"
                    onClick={(e) => openChangePinModal(e, member)}
                    className="tw-nav-inactive py-2 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-sky-300" />
                    <span>PIN ändern</span>
                  </button>

                  {hasPin && (
                    <button
                      type="button"
                      title="PIN vergessen? Mit Master-PIN 0000 zurücksetzen"
                      onClick={(e) => openResetPinModal(e, member)}
                      className="tw-nav-inactive py-2 px-2.5 rounded-xl text-[11px] font-extrabold text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RPG-HELDEN-STATUS & LIVE-DIAGRAMME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={'lg:col-span-5 p-5 rounded-3xl border-2 border-sky-500/40 flex flex-col justify-between gap-4 ' + themeStyles.card}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/30 to-indigo-600/40 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg">
                {activeRankInfo.current.badge}
              </div>
              <div>
                <div className="text-xs font-black uppercase text-amber-400">
                  Level {activeRankInfo.current.level} / 30 • {activeRpgClassTitle}
                </div>
                <h3 className="text-2xl font-black leading-tight">
                  {activeMemberObj.name}
                </h3>
                <div className="text-sm font-extrabold text-sky-300">
                  Rang: „{activeRankInfo.current.title}“
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-amber-400">{activeBreakdown.totalXp}</div>
              <div className="text-[10px] font-black uppercase opacity-70">Gesamt-XP</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-1">
            <div className="text-xs font-black uppercase text-sky-400 mb-1">
              🕸️ RPG-Attribut-Diagramm ({activeMemberObj.name})
            </div>
            <svg viewBox="0 0 260 260" className="w-60 h-60 overflow-visible">
              {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
                const pts = [0, 1, 2, 3, 4, 5].map(i => {
                  const ang = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const r = 88 * scale;
                  return Math.round(130 + r * Math.cos(ang)) + ',' + Math.round(130 + r * Math.sin(ang));
                }).join(' ');
                return (
                  <polygon
                    key={sIdx}
                    points={pts}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.22)"
                    strokeWidth="1"
                  />
                );
              })}

              {radarAxes.map((ax, idx) => {
                const ang = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
                const x2 = Math.round(130 + 88 * Math.cos(ang));
                const y2 = Math.round(130 + 88 * Math.sin(ang));
                const lx = Math.round(130 + 114 * Math.cos(ang));
                const ly = Math.round(130 + 114 * Math.sin(ang));
                return (
                  <g key={ax.label}>
                    <line x1="130" y1="130" x2={x2} y2={y2} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-200 text-[10px] font-black"
                    >
                      {ax.label}
                    </text>
                  </g>
                );
              })}

              <polygon
                points={radarPolygonPoints}
                fill="rgba(56, 189, 248, 0.32)"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
            <div className={'p-2.5 rounded-2xl border ' + themeStyles.subtle}>
              <div className="text-base font-black text-rose-400">{activeStats.tasksDone || 0}</div>
              <div className="text-[10px] font-bold opacity-75">⚔️ Quests</div>
            </div>
            <div className={'p-2.5 rounded-2xl border ' + themeStyles.subtle}>
              <div className="text-base font-black text-emerald-400">{activeStats.pantryCare || 0}</div>
              <div className="text-[10px] font-bold opacity-75">🥫 Vorrat</div>
            </div>
            <div className={'p-2.5 rounded-2xl border ' + themeStyles.subtle}>
              <div className="text-base font-black text-cyan-400">{activeStats.clicks || 0}</div>
              <div className="text-[10px] font-bold opacity-75">👆 Klicks</div>
            </div>
            <div className={'p-2.5 rounded-2xl border ' + themeStyles.subtle}>
              <div className="text-base font-black text-indigo-400">{activeBreakdown.mouseMeters}m</div>
              <div className="text-[10px] font-bold opacity-75">🖱️ Mausweg</div>
            </div>
          </div>
        </div>

        <div className={'lg:col-span-7 p-5 rounded-3xl border flex flex-col justify-between gap-5 ' + themeStyles.card}>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-black">📊 Skill-Punkte & Aktivitäts-Diagramm ({activeMemberObj.name})</h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Wichtige Aufgaben (Quests, Vorrat & Einkauf) bringen großen XP-Fortschritt – Klicks & Mausbewegung sammeln nebenbei Ausdauer-XP!
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {chartBars.map(bar => {
                const widthPct = Math.max(4, Math.min(100, Math.round((bar.xp / maxBarXp) * 100)));
                return (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span>{bar.label}</span>
                      <span className="font-black" style={{ color: bar.color }}>
                        {bar.count}x ausgeführt • +{bar.xp} XP
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/35 overflow-hidden p-0.5">
                      <div
                        style={{ width: widthPct + '%', backgroundColor: bar.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={'p-4 rounded-2xl border space-y-2.5 ' + themeStyles.subtle}>
            <div className="text-xs font-black uppercase text-amber-400">
              🏆 Familien-Gilden-Rangliste (Level & XP-Vergleich)
            </div>
            <div className="space-y-2">
              {playerMembers
                .map(m => {
                  const st = playersData[m.id] || createEmptyPlayerStats();
                  const bd = calculatePlayerBreakdown(st);
                  const rk = getRankForXp(bd.totalXp, customRanks);
                  return { member: m, bd, rk };
                })
                .sort((a, b) => b.bd.totalXp - a.bd.totalXp)
                .map((entry, idx) => (
                  <div key={entry.member.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/25 border border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-black w-5 text-amber-400">#{idx + 1}</span>
                      {renderAvatar(entry.member, 'w-7 h-7', 'text-xs')}
                      <span className="font-extrabold text-xs truncate">{entry.member.name}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-black text-sky-300">
                        {entry.rk.current.badge} Lv.{entry.rk.current.level} {entry.rk.current.title}
                      </span>
                    </div>
                    <span className="font-black text-xs text-amber-300 shrink-0">
                      {entry.bd.totalXp} XP
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIREKTE QUEST-TAFEL */}
      <div className={'p-5 rounded-3xl border space-y-3.5 ' + themeStyles.card}>
        <div>
          <h3 className="text-lg font-black flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-400" />
            <span>⚔️ Aktive Familien-Quests (Jede erledigte Quest bringt sofort +60 XP!)</span>
          </h3>
          <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
            Schließe offene Aufgaben direkt hier auf dem Skill Board ab, um deinen Charakter hochzuleveln!
          </p>
        </div>

        {openQuestsList.length === 0 ? (
          <div className={'p-6 rounded-2xl border border-dashed text-center text-xs font-bold opacity-65 ' + themeStyles.divider}>
            🎉 Alle Quests auf der Touchwall sind aktuell erledigt! Lege unter „Todoist“ neue Aufgaben an oder kümmere dich um den „Vorrat“ (+45 XP).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {openQuestsList.slice(0, 9).map(q => {
              const assignedMem = playerMembers.find(m => m.id === q.member) || activeMemberObj;
              return (
                <div
                  key={q.id}
                  className={'p-3.5 rounded-2xl border flex items-center justify-between gap-3 ' + themeStyles.subtle}
                >
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black">
                      ⚔️ Quest (+60 XP) • {assignedMem.name}
                    </span>
                    <div className="font-extrabold text-sm mt-1 break-words">{q.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTaskDone?.(q.id, true)}
                    className="tw-glow-btn px-3.5 py-2.5 rounded-xl text-xs font-black shrink-0 cursor-pointer"
                  >
                    ✓ Erledigen
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: PIN FESTLEGEN / EINGEBEN / ÄNDERN / 0000-RESET */}
      {pinModal.open && (() => {
        const targetMem = playerMembers.find(m => m.id === pinModal.targetMemberId);
        const isSetup = pinModal.mode === 'setup';
        const isLogin = pinModal.mode === 'login';
        const isChange = pinModal.mode === 'change';
        const isReset = pinModal.mode === 'reset';

        const appendDigitToActiveField = (digit) => {
          if (isSetup) {
            setPinModal(prev => ({ ...prev, newPinInput: (prev.newPinInput + digit).slice(0, 8), errorMsg: '' }));
          } else {
            setPinModal(prev => ({ ...prev, oldPinInput: (prev.oldPinInput + digit).slice(0, 8), errorMsg: '' }));
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handlePinFormSubmit}
              className={'w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {targetMem && renderAvatar(targetMem, 'w-11 h-11', 'text-lg')}
                  <div>
                    <h3 className="text-lg font-black">
                      {isSetup && ('🔐 PIN festlegen für ' + targetMem?.name)}
                      {isLogin && ('🛡️ Charakter-Login: ' + targetMem?.name)}
                      {isChange && ('🔑 PIN ändern: ' + targetMem?.name)}
                      {isReset && ('🔄 PIN-Reset (Code 0000): ' + targetMem?.name)}
                    </h3>
                    <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                      {isSetup && 'Wähle deinen persönlichen PIN für das Skill Board.'}
                      {isLogin && 'Gib deinen PIN ein, um als dieser Charakter Punkte zu sammeln.'}
                      {isChange && 'Gib deinen bisherigen und deinen neuen PIN ein.'}
                      {isReset && 'Gib „0000“ ein, um den alten PIN zu löschen.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPinModal({ ...pinModal, open: false })}
                  className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pinModal.errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
                  ⚠️ {pinModal.errorMsg}
                </div>
              )}

              {!isSetup && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-sky-400 mb-1">
                    {isReset ? 'Master-Reset-Code („0000“ eingeben)' : 'Aktueller PIN'}
                  </label>
                  <input
                    type="password"
                    required
                    value={pinModal.oldPinInput}
                    onChange={(e) => setPinModal({ ...pinModal, oldPinInput: e.target.value, errorMsg: '' })}
                    placeholder={isReset ? '0000' : '••••'}
                    className={'w-full px-4 py-3 rounded-2xl border text-center text-lg font-black tracking-widest ' + themeStyles.input}
                  />
                </div>
              )}

              {(isSetup || isChange) && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-amber-400 mb-1">
                    Neuer persönlicher PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={pinModal.newPinInput}
                    onChange={(e) => setPinModal({ ...pinModal, newPinInput: e.target.value, errorMsg: '' })}
                    placeholder="Neuen PIN eingeben (z.B. 1234)..."
                    className={'w-full px-4 py-3 rounded-2xl border text-center text-lg font-black tracking-widest ' + themeStyles.input}
                  />
                </div>
              )}

              {!isChange && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0000', '0', '⌫'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === '⌫') {
                          if (isSetup) setPinModal(prev => ({ ...prev, newPinInput: prev.newPinInput.slice(0, -1) }));
                          else setPinModal(prev => ({ ...prev, oldPinInput: prev.oldPinInput.slice(0, -1) }));
                        } else {
                          appendDigitToActiveField(key);
                        }
                      }}
                      className="tw-nav-inactive py-2.5 rounded-xl font-black text-sm cursor-pointer"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModal({ ...pinModal, open: false })}
                  className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="tw-glow-btn px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                >
                  {isReset ? '🔓 PIN mit 0000 zurücksetzen' : '✓ Bestätigen'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* MODAL 2: 30 RANGNAMEN & EMOJI-ABZEICHEN FREI ANPASSEN */}
      {rankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={'w-full max-w-3xl rounded-3xl border-2 p-6 shadow-2xl flex flex-col max-h-[88vh] ' + themeStyles.modal}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black">👑 30 Ränge & Rangabzeichen anpassen</h3>
                <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                  Von Level 1 („Wall-Newbie“) bis Level 30 („Epic Wall Master Legend“) – passe Namen, Emojis und XP-Grenzen frei an!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRankModalOpen(false)}
                className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
              {ranksDraft.map((rk, idx) => (
                <div key={rk.level} className={'p-2.5 rounded-2xl border grid grid-cols-12 items-center gap-2 ' + themeStyles.subtle}>
                  <span className="col-span-2 text-xs font-black text-amber-400 pl-2">
                    Rang {rk.level}
                  </span>

                  <select
                    value={rk.badge}
                    onChange={(e) => {
                      const next = [...ranksDraft];
                      next[idx] = { ...next[idx], badge: e.target.value };
                      setRanksDraft(next);
                    }}
                    className={'col-span-2 px-2 py-1.5 rounded-xl border text-base font-bold ' + themeStyles.input}
                  >
                    {BADGE_EMOJI_PICKER.map(em => (
                      <option key={em} value={em} className="bg-slate-800 text-white">{em}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={rk.title}
                    onChange={(e) => {
                      const next = [...ranksDraft];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setRanksDraft(next);
                    }}
                    className={'col-span-5 px-3 py-1.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                  />

                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={rk.minXp}
                      onChange={(e) => {
                        const next = [...ranksDraft];
                        next[idx] = { ...next[idx], minXp: Number(e.target.value) || 0 };
                        setRanksDraft(next);
                      }}
                      className={'w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold ' + themeStyles.input}
                    />
                    <span className="text-[10px] font-bold opacity-70">XP</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRanksDraft(DEFAULT_RPG_RANKS)}
                className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-extrabold text-amber-300 cursor-pointer"
              >
                🔄 Standard-Ränge (1–30) wiederherstellen
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRankModalOpen(false)}
                  className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomRanks(ranksDraft);
                    pushSkillBoardToCloudState(activePlayerId, playersData, ranksDraft);
                    setRankModalOpen(false);
                    showToast?.('Ränge in Cloud gespeichert!', 'Alle 30 Rangnamen und Abzeichen wurden übernommen.', '👑');
                  }}
                  className="tw-glow-btn px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                >
                  ✅ Ränge & Abzeichen speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
