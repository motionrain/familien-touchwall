// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import { createClient } from '@supabase/supabase-js';
import React from 'react';
import {
  RefreshCw, X, ShieldCheck
} from 'lucide-react';

export const PUBLIC_CLOUD_BACKEND_URL = '/api/cloud';

// Schneller JSON-Fingerabdruck: Verhindert unnötige Re-Renders & Endlos-Sync-Schleifen
export function hasJsonChanged(a, b) {
  try {
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch (e) {
    return true;
  }
}

// Lädt und speichert das lokale Lösch-Gedächtnis (Tombstones) inkl. Mülleimer-Gedächtnis (deletedTrashIds)
export function loadLocalSyncMeta() {
  try {
    if (typeof localStorage === 'undefined') {
      return { deletedPantryIds: {}, deletedTrashIds: {}, deletedTaskIds: {}, deletedEventIds: {} };
    }
    const raw = localStorage.getItem('richter_tw_sync_meta_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        deletedPantryIds: parsed.deletedPantryIds || {},
        deletedTrashIds: parsed.deletedTrashIds || {},
        deletedTaskIds: parsed.deletedTaskIds || {},
        deletedEventIds: parsed.deletedEventIds || {}
      };
    }
  } catch (e) {}
  return { deletedPantryIds: {}, deletedTrashIds: {}, deletedTaskIds: {}, deletedEventIds: {} };
}

export function saveLocalSyncMeta(meta) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('richter_tw_sync_meta_v1', JSON.stringify(meta));
  } catch (e) {}
}

export function mergeSyncMetaMaps(metaA, metaB) {
  const a = metaA || {};
  const b = metaB || {};
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14; // 14 Tage Gedächtnis

  const mergeSubMap = (map1, map2) => {
    const out = {};
    const combined = { ...(map1 || {}), ...(map2 || {}) };
    Object.keys(combined).forEach(k => {
      const ts = Math.max(Number(map1?.[k]) || 0, Number(map2?.[k]) || 0);
      if (ts > cutoff) out[k] = ts;
    });
    return out;
  };

  return {
    deletedPantryIds: mergeSubMap(a.deletedPantryIds, b.deletedPantryIds),
    deletedTrashIds: mergeSubMap(a.deletedTrashIds, b.deletedTrashIds),
    deletedTaskIds: mergeSubMap(a.deletedTaskIds, b.deletedTaskIds),
    deletedEventIds: mergeSubMap(a.deletedEventIds, b.deletedEventIds)
  };
}

// ============================================================================
// KANAL 3A: SPEISEKAMMER-BESTAND SMART-MERGE
// ============================================================================
export function applyPantryStateChangeWithMeta(prevList, nextListOrUpdater, syncMetaRef, isFromMobile = false) {
  const prev = Array.isArray(prevList) ? prevList : [];
  const nextRaw = typeof nextListOrUpdater === 'function' ? nextListOrUpdater(prev) : nextListOrUpdater;
  const next = Array.isArray(nextRaw) ? nextRaw : [];
  const now = Date.now();

  const prevMap = new Map();
  prev.forEach(it => {
    if (it && it.id) prevMap.set(String(it.id), it);
  });

  const nextIds = new Set();
  const stampedNext = next.map(it => {
    if (!it || !it.id) return it;
    const idStr = String(it.id);
    nextIds.add(idStr);
    const old = prevMap.get(idStr);

    if (!old) {
      // Falls ein Produkt neu oder wiederhergestellt ist, aus der Löschliste entfernen
      if (syncMetaRef?.current?.deletedPantryIds?.[idStr]) {
        delete syncMetaRef.current.deletedPantryIds[idStr];
      }
      return {
        ...it,
        updatedAt: it.updatedAt || now,
        fromMobile: isFromMobile ? true : Boolean(it.fromMobile)
      };
    }

    const changed =
      old.quantity !== it.quantity ||
      old.name !== it.name ||
      old.expiryDate !== it.expiryDate ||
      old.location !== it.location ||
      old.category !== it.category ||
      old.customEmoji !== it.customEmoji;

    if (changed) {
      return { ...it, updatedAt: now };
    }
    return { ...it, updatedAt: old.updatedAt || it.updatedAt || 1 };
  });

  // Alle Produkte, die aus dem Bestand entfernt wurden, als gelöscht/verzehrt merken
  if (syncMetaRef && syncMetaRef.current) {
    if (!syncMetaRef.current.deletedPantryIds) syncMetaRef.current.deletedPantryIds = {};
    let metaChanged = false;
    prev.forEach(oldIt => {
      if (oldIt && oldIt.id && !nextIds.has(String(oldIt.id))) {
        syncMetaRef.current.deletedPantryIds[String(oldIt.id)] = now;
        metaChanged = true;
      }
    });
    if (metaChanged) saveLocalSyncMeta(syncMetaRef.current);
  }

  return stampedNext;
}

// ============================================================================
// KANAL 3B: MÜLLEIMER SMART-MERGE (VERHINDERT WIEDERAUFTAUCHEN GELÖSCHTER ITEMS!)
// Merkt sich geleerte oder wiederhergestellte Mülleimer-Einträge in deletedTrashIds
// ============================================================================
export function applyTrashStateChangeWithMeta(prevTrash, nextTrashOrUpdater, syncMetaRef) {
  const prev = Array.isArray(prevTrash) ? prevTrash : [];
  const nextRaw = typeof nextTrashOrUpdater === 'function' ? nextTrashOrUpdater(prev) : nextTrashOrUpdater;
  const next = Array.isArray(nextRaw) ? nextRaw : [];
  const now = Date.now();

  const prevMap = new Map();
  prev.forEach(it => {
    if (it && it.id) prevMap.set(String(it.id), it);
  });

  const nextIds = new Set();
  const stampedNext = next.map(it => {
    if (!it || !it.id) return it;
    const idStr = String(it.id);
    nextIds.add(idStr);
    const old = prevMap.get(idStr);

    if (!old) {
      // Neu in den Mülleimer gelegt -> evtl. alten Lösch-Vermerk löschen
      if (syncMetaRef?.current?.deletedTrashIds?.[idStr]) {
        delete syncMetaRef.current.deletedTrashIds[idStr];
      }
      return { ...it, trashedTimestamp: it.trashedTimestamp || now };
    }
    return { ...it, trashedTimestamp: old.trashedTimestamp || it.trashedTimestamp || 1 };
  });

  // Alles, was aus dem Mülleimer gelöscht oder wiederhergestellt wurde, in deletedTrashIds sperren!
  if (syncMetaRef && syncMetaRef.current) {
    if (!syncMetaRef.current.deletedTrashIds) syncMetaRef.current.deletedTrashIds = {};
    let metaChanged = false;
    prev.forEach(oldIt => {
      if (oldIt && oldIt.id && !nextIds.has(String(oldIt.id))) {
        syncMetaRef.current.deletedTrashIds[String(oldIt.id)] = now;
        metaChanged = true;
      }
    });
    if (metaChanged) saveLocalSyncMeta(syncMetaRef.current);
  }

  return stampedNext;
}

export function mergePantryChannelSafe(localStock, remoteStock, localTrash, remoteTrash, syncMeta) {
  const delStockMap = syncMeta?.deletedPantryIds || {};
  const delTrashMap = syncMeta?.deletedTrashIds || {};

  // 1. Mülleimer zusammenführen (Ignoriert geleerte oder wiederhergestellte Einträge!)
  const trashMap = new Map();
  const addOrUpdateTrash = (it) => {
    if (!it || !it.id) return;
    const idStr = String(it.id);
    const itemTrashTs = Number(it.trashedTimestamp) || 1;
    const delTrashTs = Number(delTrashMap[idStr]) || 0;

    // Wenn im Mülleimer gelöscht oder in den Bestand zurückgeholt -> NICHT wiederherstellen!
    if (delTrashTs >= itemTrashTs) return;

    const existing = trashMap.get(idStr);
    if (!existing || itemTrashTs >= (Number(existing.trashedTimestamp) || 1)) {
      trashMap.set(idStr, it);
    }
  };

  (Array.isArray(remoteTrash) ? remoteTrash : []).forEach(addOrUpdateTrash);
  (Array.isArray(localTrash) ? localTrash : []).forEach(addOrUpdateTrash);

  const mergedTrash = Array.from(trashMap.values());
  const trashIds = new Set(mergedTrash.map(it => String(it.id)));

  // 2. Bestand zusammenführen (Neuerer Zeitstempel gewinnt; Gelöschtes bleibt draußen)
  const stockMap = new Map();
  const addOrUpdateStock = (item) => {
    if (!item || !item.id) return;
    const idStr = String(item.id);
    const itemTs = Number(item.updatedAt) || 1;
    const delTs = Number(delStockMap[idStr]) || 0;

    if (trashIds.has(idStr) && delTs >= itemTs) return;
    if (delTs > itemTs) return;

    const existing = stockMap.get(idStr);
    if (!existing) {
      stockMap.set(idStr, item);
    } else {
      const existingTs = Number(existing.updatedAt) || 1;
      if (itemTs >= existingTs) {
        stockMap.set(idStr, item);
      }
    }
  };

  (Array.isArray(remoteStock) ? remoteStock : []).forEach(addOrUpdateStock);
  (Array.isArray(localStock) ? localStock : []).forEach(addOrUpdateStock);

  const mergedStock = Array.from(stockMap.values()).sort((a, b) =>
    String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'))
  );

  return { mergedStock, mergedTrash };
}

// ============================================================================
// KANAL 1: KALENDER SMART-GUARD (VERHINDERT DAS HÜPFEN VON TERMINEN)
// ============================================================================
export function registerPendingCalendarOp(pendingOpsRef, opType, eventObj) {
  if (!pendingOpsRef?.current || !eventObj?.id) return;
  pendingOpsRef.current[String(eventObj.id)] = {
    op: opType,
    event: { ...eventObj },
    ts: Date.now()
  };
}

export function mergeCalendarEventsSafe(serverEvents, pendingOpsRef, syncMeta) {
  const list = Array.isArray(serverEvents) ? serverEvents : [];
  const now = Date.now();
  const ops = pendingOpsRef?.current || {};
  const delEventsMap = syncMeta?.deletedEventIds || {};

  Object.keys(ops).forEach(id => {
    if (now - ops[id].ts > 40000) {
      delete ops[id];
    }
  });

  const resultMap = new Map();
  list.forEach(ev => {
    if (!ev || !ev.id) return;
    const idStr = String(ev.id);
    if (delEventsMap[idStr]) return;
    if (ops[idStr]?.op === 'delete') return;

    if (ops[idStr] && (ops[idStr].op === 'update' || ops[idStr].op === 'move')) {
      resultMap.set(idStr, { ...ev, ...ops[idStr].event });
    } else {
      resultMap.set(idStr, ev);
    }
  });

  Object.keys(ops).forEach(idStr => {
    const entry = ops[idStr];
    if (entry.op === 'create' && !resultMap.has(idStr)) {
      resultMap.set(idStr, entry.event);
    }
  });

  return Array.from(resultMap.values());
}

// ============================================================================
// KANAL 4: SKILL BOARD SMART-MERGE (HÖCHSTE XP GEWINNEN IMMER)
// ============================================================================
export function mergeSkillBoardSafe(localSb, remoteSb) {
  if (!localSb && !remoteSb) return null;
  if (!localSb) return remoteSb;
  if (!remoteSb) return localSb;

  const locPlayers = localSb.playersData || {};
  const remPlayers = remoteSb.playersData || {};
  const allIds = new Set([...Object.keys(locPlayers), ...Object.keys(remPlayers)]);
  const mergedPlayers = {};

  allIds.forEach(pid => {
    const l = locPlayers[pid] || {};
    const r = remPlayers[pid] || {};
    const lTs = Number(l.pinUpdatedAt) || 0;
    const rTs = Number(r.pinUpdatedAt) || 0;

    mergedPlayers[pid] = {
      pin: lTs >= rTs ? (l.pin !== undefined ? l.pin : r.pin || '') : (r.pin !== undefined ? r.pin : l.pin || ''),
      pinUpdatedAt: Math.max(lTs, rTs),
      tasksDone: Math.max(Number(l.tasksDone) || 0, Number(r.tasksDone) || 0),
      pantryCare: Math.max(Number(l.pantryCare) || 0, Number(r.pantryCare) || 0),
      calendarEvents: Math.max(Number(l.calendarEvents) || 0, Number(r.calendarEvents) || 0),
      shoppingDone: Math.max(Number(l.shoppingDone) || 0, Number(r.shoppingDone) || 0),
      notesCreated: Math.max(Number(l.notesCreated) || 0, Number(r.notesCreated) || 0),
      clicks: Math.max(Number(l.clicks) || 0, Number(r.clicks) || 0),
      mousePixels: Math.max(Number(l.mousePixels) || 0, Number(r.mousePixels) || 0),
      bonusXp: Math.max(Number(l.bonusXp) || 0, Number(r.bonusXp) || 0)
    };
  });

  const locUpdated = Number(localSb.updatedAt) || 0;
  const remUpdated = Number(remoteSb.updatedAt) || 0;

  return {
    activePlayerId: locUpdated >= remUpdated ? (localSb.activePlayerId ?? remoteSb.activePlayerId) : (remoteSb.activePlayerId ?? localSb.activePlayerId),
    playersData: mergedPlayers,
    customRanks: (locUpdated >= remUpdated ? localSb.customRanks : remoteSb.customRanks) || localSb.customRanks || remoteSb.customRanks,
    updatedAt: Math.max(locUpdated, remUpdated)
  };
}

// ============================================================================
// NETZWERK-AUFRUF FÜR GOOGLE APPS SCRIPT CLOUD
// ============================================================================
export async function callCloudApi(targetUrl, method = 'POST', postBody = null, accountId = '', authKey = '') {
  const cleanTarget = (targetUrl || PUBLIC_CLOUD_BACKEND_URL).trim();
  const enrichedBody = postBody
    ? {
        ...postBody,
        accountId: postBody.accountId !== undefined ? postBody.accountId : accountId,
        authKey: postBody.authKey !== undefined ? postBody.authKey : authKey
      }
    : null;

  try {
    const proxyRes = await fetch('/api/todoist?_t=' + Date.now(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'gasProxy',
        gasUrl: cleanTarget,
        gasMethod: method,
        gasBody: enrichedBody
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
    const sep = cleanTarget.includes('?') ? '&' : '?';
    const query =
      'action=json&accountId=' +
      encodeURIComponent(accountId || '') +
      '&authKey=' +
      encodeURIComponent(authKey || '') +
      '&_t=' +
      Date.now();
    const res = await fetch(cleanTarget + sep + query, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });
    return res.json();
  } else {
    const res = await fetch(cleanTarget, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(enrichedBody)
    });
    return res.json();
  }
}

// ============================================================================
// VISUELLES 4-KANAL SYNC-COCKPIT (FÜR DIE TOUCHWALL)
// ============================================================================
export function SyncCenterModal({
  open,
  onClose,
  channelStatus,
  onSyncCalendarOnly,
  onSyncTodoistOnly,
  onSyncPantryOnly,
  onSyncSkillBoardOnly,
  onSyncAllChannels,
  themeStyles
}) {
  if (!open) return null;

  const channels = [
    {
      id: 'calendar',
      title: '📅 Kanal 1: Google & ICS Kalender',
      desc: 'Synchronisiert Termine inkl. 40s Hüpf-Schutz bei neuen oder verschobenen Einträgen.',
      status: channelStatus?.calendar || 'Bereit ✓',
      busy: Boolean(channelStatus?.calendarBusy),
      onSync: onSyncCalendarOnly
    },
    {
      id: 'todoist',
      title: '✅ Kanal 2: Todoist (Aufgaben & Einkauf)',
      desc: 'Zwei-Wege-Abgleich mit Fingerabdruck-Prüfung (löst keine unnötigen Cloud-Saves mehr aus).',
      status: channelStatus?.todoist || 'Bereit ✓',
      busy: Boolean(channelStatus?.todoistBusy),
      onSync: onSyncTodoistOnly
    },
    {
      id: 'pantry',
      title: '🥫 Kanal 3: Produktscan & Speisekammer',
      desc: 'Smart-Merge nach Produkt-ID, Zeitstempel & Lösch-Gedächtnis (für Bestand & Mülleimer).',
      status: channelStatus?.pantry || 'Bereit ✓',
      busy: Boolean(channelStatus?.pantryBusy),
      onSync: onSyncPantryOnly
    },
    {
      id: 'skillboard',
      title: '🎮 Kanal 4: Skill Board (RPG & Ränge)',
      desc: 'Isolierte Sicherung der höchsten XP-Stände und PINs (Mobile-App ist ausgeschlossen).',
      status: channelStatus?.skillboard || 'Bereit ✓',
      busy: Boolean(channelStatus?.skillboardBusy),
      onSync: onSyncSkillBoardOnly
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={'w-full max-w-2xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 ' + themeStyles.modal}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">⚡ 4-Kanal Sync-Zentrale (sync.tsx)</h3>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Jeder Bereich synchronisiert unabhängig mit eigenem Überschreib-Schutz
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tw-nav-inactive w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {channels.map(ch => (
            <div
              key={ch.id}
              className={'p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ' + themeStyles.subtle}
            >
              <div className="space-y-1 flex-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm">{ch.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                    {ch.status}
                  </span>
                </div>
                <p className="text-xs opacity-75">{ch.desc}</p>
              </div>

              <button
                type="button"
                onClick={ch.onSync}
                disabled={ch.busy}
                className="tw-glow-btn px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className={'w-3.5 h-3.5 ' + (ch.busy ? 'animate-spin' : '')} />
                <span>{ch.busy ? 'Synchronisiere...' : 'Nur diesen Kanal abgleichen'}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="tw-nav-inactive px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Schließen
          </button>
          <button
            type="button"
            onClick={onSyncAllChannels}
            className="tw-glow-btn px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>⚡ Alle 4 Kanäle jetzt sauber synchronisieren</span>
          </button>
        </div>
      </div>
    </div>
  );
}
