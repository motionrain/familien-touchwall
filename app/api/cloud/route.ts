// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// 1. SUPABASE ADMIN-CLIENT, AUTH- & RECOVERY-HELFER
// ============================================================================
function getCleanSupabaseUrl() {
  const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!rawUrl) {
    throw new Error('SUPABASE_URL fehlt in den Vercel-Umgebungsvariablen.');
  }

  let cleanUrl = rawUrl;
  try {
    cleanUrl = new URL(rawUrl).origin;
  } catch {
    throw new Error(`Ungültige SUPABASE_URL in Vercel: "${rawUrl}"`);
  }

  if (!cleanUrl.includes('supabase.co')) {
    throw new Error(`SUPABASE_URL zeigt nicht auf *.supabase.co, sondern auf: ${cleanUrl}`);
  }
  return cleanUrl;
}

function getPublicAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');
}

function getSupabaseAdmin() {
  const cleanUrl = getCleanSupabaseUrl();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt in den Vercel-Umgebungsvariablen.');
  }
  return createClient(cleanUrl, key, { auth: { persistSession: false } });
}

function hashAuthKey(val: string) {
  return crypto.createHash('sha256').update(String(val || '').trim()).digest('hex');
}

function normalizeRecoveryCode(raw: string) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function generateReadableRecoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `TW-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

// Prüft sowohl klassische Passwort-Hashes als auch signierte OAuth-Session-Tokens (tws_...)
function verifyAccountAuth(authKey: string, accountId: string, storedHash: string) {
  const cleanKey = String(authKey || '').trim();
  if (!cleanKey || !storedHash) return false;
  if (hashAuthKey(cleanKey) === storedHash) return true;

  if (!cleanKey.startsWith('tws_')) return false;
  const secret = (process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!secret) return false;

  const parts = cleanKey.slice(4).split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (sig !== expectedSig) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (parsed.a !== accountId) return false;
    if (parsed.h && parsed.h !== String(storedHash).slice(0, 12)) return false;
    return true;
  } catch {
    return false;
  }
}

async function broadcastSync(
  supabase: any,
  accountId: string,
  sourceClientId?: string,
  scope: 'state' | 'calendar' | 'all' = 'state'
) {
  if (!accountId) return;
  const topic = `tw-sync-${accountId}`;
  const payload = { ts: Date.now(), clientId: sourceClientId || '', scope };

  if (supabase && typeof supabase.channel === 'function') {
    const channel = supabase.channel(topic);
    try {
      if (typeof channel?.httpSend === 'function') {
        const res = await channel.httpSend('sync', payload);
        if (res?.success !== false) return;
      }
    } catch {
      // Weiter zum REST-Fallback
    } finally {
      await supabase.removeChannel(channel).catch(() => {});
    }
  }

  try {
    const cleanUrl = getCleanSupabaseUrl();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (!cleanUrl || !key) return;

    const headers: Record<string, string> = {
      apikey: key,
      'Content-Type': 'application/json'
    };
    if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

    await fetch(`${cleanUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: [{ topic, event: 'sync', payload }] })
    });
  } catch {}
}

// ============================================================================
// 2. VORRAT & MÜLLEIMER (tw_pantry_items)
// ============================================================================
const KNOWN_PANTRY_KEYS = new Set([
  'id', 'name', 'barcode', 'quantity', 'location', 'category', 'glutenFree',
  'expiryDate', 'customEmoji', 'imageUrl', 'reason', 'reasonLabel',
  'addedAt', 'addedTimestamp', 'trashedAt', 'trashedTimestamp',
  'fromMobile', 'updatedAt'
]);

function normalizeGfValue(val: any) {
  if (val === true || val === 'yes') return 'yes';
  if (val === false || val === 'no') return 'no';
  return 'auto';
}

function mapPantryItemToRow(accountId: string, item: any, status: 'stock' | 'trash') {
  const extra: Record<string, any> = {};
  Object.keys(item || {}).forEach(k => {
    if (!KNOWN_PANTRY_KEYS.has(k) && item[k] !== undefined) extra[k] = item[k];
  });

  return {
    account_id: accountId,
    id: String(item.id),
    status,
    name: String(item.name || 'Produkt').trim(),
    barcode: String(item.barcode || '').trim(),
    quantity: String(item.quantity || '1x').trim() || '1x',
    location: String(item.location || 'fridge').trim() || 'fridge',
    category: String(item.category || 'produce').trim() || 'produce',
    gluten_free: normalizeGfValue(item.glutenFree),
    expiry_date: String(item.expiryDate || '').trim(),
    custom_emoji: String(item.customEmoji || '').trim(),
    image_url: String(item.imageUrl || '').trim(),
    reason: String(item.reason || '').trim(),
    reason_label: String(item.reasonLabel || '').trim(),
    added_at: String(item.addedAt || '').trim(),
    added_timestamp: Math.trunc(Number(item.addedTimestamp) || 0),
    trashed_at: String(item.trashedAt || '').trim(),
    trashed_timestamp: Math.trunc(Number(item.trashedTimestamp) || 0),
    from_mobile: Boolean(item.fromMobile),
    updated_at: Math.trunc(Number(item.updatedAt) || Date.now()),
    extra
  };
}

function mapRowToPantryItem(row: any) {
  return {
    ...(row.extra && typeof row.extra === 'object' ? row.extra : {}),
    id: row.id,
    name: row.name,
    barcode: row.barcode || '',
    quantity: row.quantity || '1x',
    location: row.location || 'fridge',
    category: row.category || 'produce',
    glutenFree: row.gluten_free || 'auto',
    expiryDate: row.expiry_date || '',
    customEmoji: row.custom_emoji || '',
    imageUrl: row.image_url || '',
    reason: row.reason || '',
    reasonLabel: row.reason_label || '',
    addedAt: row.added_at || '',
    addedTimestamp: Number(row.added_timestamp || 0),
    trashedAt: row.trashed_at || '',
    trashedTimestamp: Number(row.trashed_timestamp || 0),
    fromMobile: Boolean(row.from_mobile),
    updatedAt: Number(row.updated_at || 0)
  };
}

function stripPantryFromState(stateObj: any) {
  const copy = { ...(stateObj || {}) };
  delete copy.pantryItems;
  delete copy.pantryTrash;
  copy.pantryMigrated = true;
  return copy;
}

async function syncPantryTableForAccount(supabase: any, accountId: string, stockList: any[], trashList: any[]) {
  const rowMap = new Map<string, any>();

  (Array.isArray(stockList) ? stockList : []).forEach(it => {
    if (it && it.id) rowMap.set(String(it.id), mapPantryItemToRow(accountId, it, 'stock'));
  });

  (Array.isArray(trashList) ? trashList : []).forEach(it => {
    if (!it || !it.id) return;
    const idStr = String(it.id);
    const trashRow = mapPantryItemToRow(accountId, it, 'trash');
    const existing = rowMap.get(idStr);
    if (!existing || trashRow.trashed_timestamp >= existing.updated_at) rowMap.set(idStr, trashRow);
  });

  const { data: existingRows, error: selErr } = await supabase
    .from('tw_pantry_items')
    .select('id')
    .eq('account_id', accountId);
  if (selErr) throw selErr;

  const allRows = Array.from(rowMap.values());
  for (let i = 0; i < allRows.length; i += 200) {
    const { error: upErr } = await supabase
      .from('tw_pantry_items')
      .upsert(allRows.slice(i, i + 200), { onConflict: 'account_id,id' });
    if (upErr) throw upErr;
  }

  const idsToDelete = (existingRows || [])
    .map((r: any) => String(r.id))
    .filter((id: string) => !rowMap.has(id));

  for (let i = 0; i < idsToDelete.length; i += 200) {
    const { error: delErr } = await supabase
      .from('tw_pantry_items')
      .delete()
      .eq('account_id', accountId)
      .in('id', idsToDelete.slice(i, i + 200));
    if (delErr) throw delErr;
  }
}

async function loadPantryForAccount(supabase: any, accountId: string, accountRow: any) {
  const { data: rows, error } = await supabase
    .from('tw_pantry_items')
    .select('*')
    .eq('account_id', accountId);
  if (error) throw error;

  const list = Array.isArray(rows) ? rows : [];
  const legacyStock = Array.isArray(accountRow?.state?.pantryItems) ? accountRow.state.pantryItems : [];
  const legacyTrash = Array.isArray(accountRow?.state?.pantryTrash) ? accountRow.state.pantryTrash : [];

  if (list.length === 0 && !accountRow?.state?.pantryMigrated && (legacyStock.length > 0 || legacyTrash.length > 0)) {
    await syncPantryTableForAccount(supabase, accountId, legacyStock, legacyTrash);
    await supabase
      .from('tw_accounts')
      .update({ state: stripPantryFromState(accountRow.state), updated_at: new Date().toISOString() })
      .eq('account_id', accountId);
    return { pantryItems: legacyStock, pantryTrash: legacyTrash };
  }

  return {
    pantryItems: list
      .filter((r: any) => r.status !== 'trash')
      .map(mapRowToPantryItem)
      .sort((a: any, b: any) => String(a.expiryDate || '9999').localeCompare(String(b.expiryDate || '9999'))),
    pantryTrash: list
      .filter((r: any) => r.status === 'trash')
      .map(mapRowToPantryItem)
      .sort((a: any, b: any) => Number(b.trashedTimestamp || 0) - Number(a.trashedTimestamp || 0))
  };
}

// ============================================================================
// 3. OAUTH TOKEN-REFRESH (GOOGLE & MICROSOFT/OUTLOOK) + GOOGLE SERVICE ACCOUNT
// ============================================================================
let cachedGoogleSaToken = { token: '', expiresAt: 0 };

function hasGoogleServiceAccount() {
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim() &&
    (process.env.GOOGLE_PRIVATE_KEY || '').trim()
  );
}

async function getGoogleServiceAccountToken() {
  if (!hasGoogleServiceAccount()) return null;
  if (cachedGoogleSaToken.token && Date.now() < cachedGoogleSaToken.expiresAt - 60000) {
    return cachedGoogleSaToken.token;
  }

  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })
  ).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(header + '.' + claim);
  const jwt = header + '.' + claim + '.' + signer.sign(privateKey, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error('Google SA Auth fehlgeschlagen: ' + (data.error_description || data.error || res.status));
  }

  cachedGoogleSaToken = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3500) * 1000 };
  return data.access_token;
}

async function getValidOAuthAccessToken(supabase: any, conn: any) {
  if (!conn) return null;
  if (conn.access_token && Number(conn.token_expires_at || 0) > Date.now() + 90000) {
    return conn.access_token;
  }
  if (!conn.refresh_token) return conn.access_token || null;

  if (conn.provider === 'google') {
    const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
    if (!clientId || !clientSecret) return conn.access_token || null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: conn.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) {
      throw new Error('Google OAuth Refresh fehlgeschlagen: ' + (json.error_description || json.error || res.status));
    }

    const nextExp = Date.now() + Number(json.expires_in || 3500) * 1000;
    await supabase
      .from('tw_oauth_connections')
      .update({
        access_token: json.access_token,
        token_expires_at: nextExp,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', conn.account_id)
      .eq('member_id', conn.member_id)
      .eq('provider', 'google');

    return json.access_token;
  }

  if (conn.provider === 'microsoft') {
    const msId = (process.env.MICROSOFT_OAUTH_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    const msSecret = (process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
    if (!msId || !msSecret) return conn.access_token || null;

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: msId,
        client_secret: msSecret,
        refresh_token: conn.refresh_token,
        grant_type: 'refresh_token',
        scope: 'openid email profile offline_access User.Read Calendars.ReadWrite'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) {
      throw new Error('Outlook OAuth Refresh fehlgeschlagen: ' + (json.error_description || json.error || res.status));
    }

    const nextExp = Date.now() + Number(json.expires_in || 3500) * 1000;
    await supabase
      .from('tw_oauth_connections')
      .update({
        access_token: json.access_token,
        refresh_token: json.refresh_token || conn.refresh_token,
        token_expires_at: nextExp,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', conn.account_id)
      .eq('member_id', conn.member_id)
      .eq('provider', 'microsoft');

    return json.access_token;
  }

  return null;
}

// ============================================================================
// 4. ZEITZONEN- & PAYLOAD-KONVERTIERUNG (GOOGLE + OUTLOOK / EUROPE/BERLIN)
// ============================================================================
function addDaysToDateStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function formatBerlinDateAndTime(isoStr: string) {
  const d = new Date(isoStr);
  const datePart = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
  const timePart = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
  return { datePart, timePart };
}

function parseTouchwallTimeRange(rawTimeInput: string) {
  const rawTime = String(rawTimeInput || 'Ganztägig').trim();
  const rangeMatch = rawTime.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  const singleMatch = rawTime.match(/(\d{1,2}):(\d{2})/);

  if (!rawTime || rawTime.toLowerCase().includes('ganztägig') || (!rangeMatch && !singleMatch)) {
    return { allDay: true };
  }

  if (rangeMatch) {
    return {
      allDay: false,
      startH: rangeMatch[1].padStart(2, '0'),
      startM: rangeMatch[2],
      endH: rangeMatch[3].padStart(2, '0'),
      endM: rangeMatch[4]
    };
  }
  const startH = singleMatch[1].padStart(2, '0');
  const startM = singleMatch[2];
  const endH = String((Number(startH) + 1) % 24).padStart(2, '0');
  return { allDay: false, startH, startM, endH, endM: startM };
}

function buildGoogleEventPayload(ev: any) {
  const title = String(ev.title || 'Termin').trim();
  const dateStr = String(ev.date || '').slice(0, 10);
  const t = parseTouchwallTimeRange(ev.time);

  if (t.allDay) {
    return {
      summary: title,
      start: { date: dateStr },
      end: { date: addDaysToDateStr(dateStr, 1) }
    };
  }
  return {
    summary: title,
    start: { dateTime: `${dateStr}T${t.startH}:${t.startM}:00`, timeZone: 'Europe/Berlin' },
    end: { dateTime: `${dateStr}T${t.endH}:${t.endM}:00`, timeZone: 'Europe/Berlin' }
  };
}

function buildOutlookEventPayload(ev: any) {
  const title = String(ev.title || 'Termin').trim();
  const dateStr = String(ev.date || '').slice(0, 10);
  const t = parseTouchwallTimeRange(ev.time);

  if (t.allDay) {
    return {
      subject: title,
      isAllDay: true,
      start: { dateTime: `${dateStr}T00:00:00`, timeZone: 'Europe/Berlin' },
      end: { dateTime: `${addDaysToDateStr(dateStr, 1)}T00:00:00`, timeZone: 'Europe/Berlin' }
    };
  }
  return {
    subject: title,
    isAllDay: false,
    start: { dateTime: `${dateStr}T${t.startH}:${t.startM}:00`, timeZone: 'Europe/Berlin' },
    end: { dateTime: `${dateStr}T${t.endH}:${t.endM}:00`, timeZone: 'Europe/Berlin' }
  };
}

function mapGoogleEventToTouchwall(gEv: any, memberId: string, calendarId: string, idPrefix = 'gcal') {
  let dateStr = '';
  let timeStr = 'Ganztägig';

  if (gEv.start?.date) {
    dateStr = gEv.start.date.slice(0, 10);
  } else if (gEv.start?.dateTime) {
    const startFmt = formatBerlinDateAndTime(gEv.start.dateTime);
    dateStr = startFmt.datePart;
    timeStr = gEv.end?.dateTime
      ? `${startFmt.timePart} - ${formatBerlinDateAndTime(gEv.end.dateTime).timePart}`
      : startFmt.timePart;
  }

  return {
    id: `${idPrefix}__${memberId}__${gEv.id}`,
    googleEventId: gEv.id,
    calendarId,
    title: gEv.summary || '(Ohne Titel)',
    date: dateStr,
    time: timeStr,
    member: memberId,
    notifyTime: '30m',
    notifyChannel: 'wall_push',
    notifyUsers: [memberId],
    fromGoogle: true
  };
}

function mapOutlookEventToTouchwall(msEv: any, memberId: string) {
  const startRaw = String(msEv.start?.dateTime || '');
  const endRaw = String(msEv.end?.dateTime || '');
  const dateStr = startRaw.slice(0, 10);
  let timeStr = 'Ganztägig';

  if (!msEv.isAllDay && startRaw.length >= 16) {
    const st = startRaw.slice(11, 16);
    const en = endRaw.length >= 16 ? endRaw.slice(11, 16) : '';
    timeStr = en ? `${st} - ${en}` : st;
  }

  return {
    id: `msoauth__${memberId}__${msEv.id}`,
    outlookEventId: msEv.id,
    title: msEv.subject || '(Ohne Titel)',
    date: dateStr,
    time: timeStr,
    member: memberId,
    notifyTime: '30m',
    notifyChannel: 'wall_push',
    notifyUsers: [memberId],
    fromOutlook: true
  };
}

function parseExternalEventId(eventId: string) {
  const parts = String(eventId || '').split('__');
  if (parts.length >= 3 && ['gcal', 'goauth', 'msoauth'].includes(parts[0])) {
    return { kind: parts[0], memberId: parts[1], remoteId: parts.slice(2).join('__') };
  }
  return { kind: 'local', memberId: '', remoteId: String(eventId || '') };
}

// ============================================================================
// 5. KOMBINIERTER KALENDER-SYNC (SUPABASE + GOOGLE OAUTH + OUTLOOK + SA)
// ============================================================================
async function loadOAuthConnectionsForAccount(supabase: any, accountId: string) {
  const { data, error } = await supabase
    .from('tw_oauth_connections')
    .select('*')
    .eq('account_id', accountId);
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

async function loadCombinedCalendarData(supabase: any, accountId: string, calendarsMap: Record<string, string>) {
  const status: Record<string, { ok: boolean; msg: string }> = {};
  const allEvents: any[] = [];

  const [dbRes, oauthConns] = await Promise.all([
    supabase.from('tw_calendar_events').select('*').eq('account_id', accountId),
    loadOAuthConnectionsForAccount(supabase, accountId)
  ]);

  if (dbRes.error) throw dbRes.error;

  (dbRes.data || []).forEach((row: any) => {
    allEvents.push({
      id: row.id,
      title: row.title,
      date: row.event_date,
      time: row.event_time || 'Ganztägig',
      member: row.member || 'all',
      notifyTime: row.notify_time || '30m',
      notifyChannel: row.notify_channel || 'wall_push',
      notifyUsers: Array.isArray(row.notify_users) ? row.notify_users : [row.member || 'all'],
      fromGoogle: false
    });
  });

  const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
  const timeMax = new Date(Date.now() + 365 * 86400000).toISOString();

  // 1. OAuth-Kalender pro Familienmitglied laden (Google OAuth + Outlook/Microsoft Graph)
  const memberOAuthConns = oauthConns.filter((c: any) => c.member_id && c.member_id !== 'account');
  const membersWithGoogleOAuth = new Set<string>();

  await Promise.all(
    memberOAuthConns.map(async (conn: any) => {
      try {
        const token = await getValidOAuthAccessToken(supabase, conn);
        if (!token) return;

        if (conn.provider === 'google') {
          membersWithGoogleOAuth.add(conn.member_id);
          const calId = String(conn.calendar_id || 'primary').trim();
          const url =
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events` +
            `?singleEvents=true&orderBy=startTime&maxResults=500` +
            `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          if (!res.ok) {
            status[conn.member_id] = { ok: false, msg: 'Google OAuth: ' + (json?.error?.message || `HTTP ${res.status}`) };
            return;
          }
          const items = Array.isArray(json.items) ? json.items : [];
          items.forEach((gEv: any) => {
            if (gEv.status !== 'cancelled') {
              allEvents.push(mapGoogleEventToTouchwall(gEv, conn.member_id, calId, 'goauth'));
            }
          });
          status[conn.member_id] = { ok: true, msg: `Google OAuth aktiv (${items.length} Termine) ✓` };
        } else if (conn.provider === 'microsoft') {
          const url =
            `https://graph.microsoft.com/v1.0/me/calendarView` +
            `?startDateTime=${encodeURIComponent(timeMin)}&endDateTime=${encodeURIComponent(timeMax)}&$top=250`;

          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Prefer: 'outlook.timezone="Europe/Berlin"'
            }
          });
          const json = await res.json();
          if (!res.ok) {
            status[conn.member_id] = { ok: false, msg: 'Outlook OAuth: ' + (json?.error?.message || `HTTP ${res.status}`) };
            return;
          }
          const items = Array.isArray(json.value) ? json.value : [];
          items.forEach((msEv: any) => {
            if (!msEv.isCancelled) {
              allEvents.push(mapOutlookEventToTouchwall(msEv, conn.member_id));
            }
          });
          const prevMsg = status[conn.member_id]?.ok ? status[conn.member_id].msg + ' + ' : '';
          status[conn.member_id] = { ok: true, msg: `${prevMsg}Outlook OAuth aktiv (${items.length} Termine) ✓` };
        }
      } catch (err: any) {
        status[conn.member_id] = { ok: false, msg: err?.message || 'OAuth-Abruffehler' };
      }
    })
  );

  // 2. Legacy Google Service Account Fallback (für Mitglieder ohne Google-OAuth-Verknüpfung)
  const calEntries = Object.entries(calendarsMap || {}).filter(
    ([memberId, cid]) =>
      String(cid || '').trim() !== '' &&
      !String(cid).trim().startsWith('http') &&
      !String(cid).trim().startsWith('webcal') &&
      !membersWithGoogleOAuth.has(memberId)
  );

  if (calEntries.length > 0 && hasGoogleServiceAccount()) {
    let saToken: string | null = null;
    try {
      saToken = await getGoogleServiceAccountToken();
    } catch (err: any) {
      calEntries.forEach(([memberId]) => {
        if (!status[memberId]) status[memberId] = { ok: false, msg: 'Google Auth Fehler: ' + err.message };
      });
    }

    if (saToken) {
      await Promise.all(
        calEntries.map(async ([memberId, rawCalId]) => {
          const calId = String(rawCalId).split(',')[0].trim();
          try {
            const url =
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events` +
              `?singleEvents=true&orderBy=startTime&maxResults=500` +
              `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

            const res = await fetch(url, { headers: { Authorization: `Bearer ${saToken}` } });
            const json = await res.json();
            if (!res.ok) {
              if (!status[memberId]) {
                status[memberId] = {
                  ok: false,
                  msg: res.status === 404 ? 'Kalender nicht freigegeben' : (json?.error?.message || `HTTP ${res.status}`)
                };
              }
              return;
            }
            const items = Array.isArray(json.items) ? json.items : [];
            items.forEach((gEv: any) => {
              if (gEv.status !== 'cancelled') {
                allEvents.push(mapGoogleEventToTouchwall(gEv, memberId, calId, 'gcal'));
              }
            });
            status[memberId] = { ok: true, msg: `Google Kalender aktiv (${items.length} Termine) ✓` };
          } catch (err: any) {
            if (!status[memberId]) status[memberId] = { ok: false, msg: err.message || 'Abruffehler' };
          }
        })
      );
    }
  }

  return { events: allEvents, calendars: calendarsMap || {}, status };
}

// Hilfsfunktionen für Zwei-Wege-Schreiben (Google OAuth -> Outlook OAuth -> Google SA -> Supabase)
async function createEventForMember(
  supabase: any,
  accountId: string,
  ev: any,
  oauthConns: any[],
  currentCalendars: Record<string, string>
) {
  const memberId = String(ev.member || 'all');
  const gOAuth = oauthConns.find(c => c.member_id === memberId && c.provider === 'google');
  const msOAuth = oauthConns.find(c => c.member_id === memberId && c.provider === 'microsoft');

  if (gOAuth) {
    const token = await getValidOAuthAccessToken(supabase, gOAuth);
    const calId = String(gOAuth.calendar_id || 'primary').trim();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGoogleEventPayload(ev))
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Google OAuth Termin-Fehler: ' + (err?.error?.message || res.status));
    }
    return;
  }

  if (msOAuth) {
    const token = await getValidOAuthAccessToken(supabase, msOAuth);
    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOutlookEventPayload(ev))
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Outlook OAuth Termin-Fehler: ' + (err?.error?.message || res.status));
    }
    return;
  }

  const targetCalId = String(currentCalendars[memberId] || '').split(',')[0].trim();
  if (targetCalId && !targetCalId.startsWith('http') && !targetCalId.startsWith('webcal') && hasGoogleServiceAccount()) {
    const saToken = await getGoogleServiceAccountToken();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${saToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGoogleEventPayload(ev))
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Google Termin konnte nicht erstellt werden: ' + (err?.error?.message || res.status));
    }
    return;
  }

  const { error } = await supabase.from('tw_calendar_events').upsert({
    id: String(ev.id || Date.now()),
    account_id: accountId,
    member: memberId,
    title: ev.title || 'Termin',
    event_date: ev.date,
    event_time: ev.time || 'Ganztägig',
    notify_time: ev.notifyTime || '30m',
    notify_channel: ev.notifyChannel || 'wall_push',
    notify_users: Array.isArray(ev.notifyUsers) ? ev.notifyUsers : [memberId],
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function deleteExternalOrLocalEvent(
  supabase: any,
  accountId: string,
  eventId: string,
  memberId: string,
  oauthConns: any[],
  currentCalendars: Record<string, string>
) {
  const parsed = parseExternalEventId(eventId);
  const ownerMember = parsed.memberId || memberId;

  if (parsed.kind === 'goauth') {
    const conn = oauthConns.find(c => c.member_id === ownerMember && c.provider === 'google');
    if (conn) {
      const token = await getValidOAuthAccessToken(supabase, conn);
      const calId = String(conn.calendar_id || 'primary').trim();
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(parsed.remoteId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
    }
    return;
  }

  if (parsed.kind === 'msoauth') {
    const conn = oauthConns.find(c => c.member_id === ownerMember && c.provider === 'microsoft');
    if (conn) {
      const token = await getValidOAuthAccessToken(supabase, conn);
      await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(parsed.remoteId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    return;
  }

  if (parsed.kind === 'gcal') {
    const calId = String(currentCalendars[ownerMember] || '').split(',')[0].trim();
    if (calId && hasGoogleServiceAccount()) {
      const saToken = await getGoogleServiceAccountToken();
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(parsed.remoteId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${saToken}` } }
      );
    }
    return;
  }

  await supabase.from('tw_calendar_events').delete().eq('account_id', accountId).eq('id', eventId);
}

async function updateExternalOrLocalEvent(
  supabase: any,
  accountId: string,
  ev: any,
  oldMember: string,
  oauthConns: any[],
  currentCalendars: Record<string, string>
) {
  const parsed = parseExternalEventId(ev.id);
  const sameMember = String(oldMember || ev.member) === String(ev.member);

  if (sameMember && parsed.kind === 'goauth') {
    const conn = oauthConns.find(c => c.member_id === ev.member && c.provider === 'google');
    if (conn) {
      const token = await getValidOAuthAccessToken(supabase, conn);
      const calId = String(conn.calendar_id || 'primary').trim();
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(parsed.remoteId)}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildGoogleEventPayload(ev))
        }
      );
      return;
    }
  }

  if (sameMember && parsed.kind === 'msoauth') {
    const conn = oauthConns.find(c => c.member_id === ev.member && c.provider === 'microsoft');
    if (conn) {
      const token = await getValidOAuthAccessToken(supabase, conn);
      await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(parsed.remoteId)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOutlookEventPayload(ev))
      });
      return;
    }
  }

  if (sameMember && parsed.kind === 'gcal') {
    const calId = String(currentCalendars[ev.member] || '').split(',')[0].trim();
    if (calId && hasGoogleServiceAccount()) {
      const saToken = await getGoogleServiceAccountToken();
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(parsed.remoteId)}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${saToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildGoogleEventPayload(ev))
        }
      );
      return;
    }
  }

  if (!sameMember || parsed.kind !== 'local') {
    await deleteExternalOrLocalEvent(supabase, accountId, String(ev.id), oldMember, oauthConns, currentCalendars);
    await createEventForMember(supabase, accountId, { ...ev, id: String(Date.now()) }, oauthConns, currentCalendars);
    return;
  }

  const { error } = await supabase.from('tw_calendar_events').upsert({
    id: String(ev.id),
    account_id: accountId,
    member: ev.member || 'all',
    title: ev.title || 'Termin',
    event_date: ev.date,
    event_time: ev.time || 'Ganztägig',
    notify_time: ev.notifyTime || '30m',
    notify_channel: ev.notifyChannel || 'wall_push',
    notify_users: Array.isArray(ev.notifyUsers) ? ev.notifyUsers : [ev.member || 'all'],
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

// ============================================================================
// 6. STATUSCHECK + REALTIME-KONFIG (GET /api/cloud)
// ============================================================================
export async function GET() {
  try {
    const cleanUrl = getCleanSupabaseUrl();
    const anonKey = getPublicAnonKey();

    return NextResponse.json({
      ok: true,
      status: 'Touchwall Cloud API bereit (Turbo Live-Sync + OAuth)',
      supabaseHost: new URL(cleanUrl).host,
      supabaseKeyConfigured: Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()),
      realtimeConfigured: Boolean(cleanUrl && anonKey),
      googleConfigured: hasGoogleServiceAccount(),
      oauthProvidersReady: {
        google: Boolean((process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim() && (process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim()),
        microsoft: Boolean((process.env.MICROSOFT_OAUTH_CLIENT_ID || '').trim() && (process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '').trim())
      },
      realtime: anonKey ? { url: cleanUrl, anonKey } : null
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Konfigurationsfehler' }, { status: 500 });
  }
}

// ============================================================================
// 7. HAUPT-ENDPOINT (POST /api/cloud)
// ============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action || '').trim();
    const accountId = String(body.accountId || req.headers.get('x-account-id') || '').trim().toLowerCase();
    const authKey = String(body.authKey || req.headers.get('x-auth-key') || '').trim();

    if (!accountId || !authKey) {
      return NextResponse.json({ ok: false, error: 'accountId oder authKey fehlt.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ------------------------------------------------------------------------
    // REGISTER ACCOUNT (MIT E-MAIL & AUTOMATISCHEM NOTFALL-RECOVERY-CODE)
    // ------------------------------------------------------------------------
    if (action === 'registerAccount') {
      const { data: existing, error: exErr } = await supabase
        .from('tw_accounts')
        .select('account_id')
        .eq('account_id', accountId)
        .maybeSingle();

      if (exErr) throw exErr;
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Dieser Benutzername ist bereits vergeben.' }, { status: 409 });
      }

      const payload = body.payload || {};
      const calendars = payload.calendars || {};
      const cleanEmail = String(body.email || payload.email || '').trim().toLowerCase();
      const recoveryCode = generateReadableRecoveryCode();
      const recoveryHash = hashAuthKey(normalizeRecoveryCode(recoveryCode));
      const initStock = Array.isArray(payload.pantryItems) ? payload.pantryItems : [];
      const initTrash = Array.isArray(payload.pantryTrash) ? payload.pantryTrash : [];

      const { error } = await supabase.from('tw_accounts').insert({
        account_id: accountId,
        auth_hash: hashAuthKey(authKey),
        email: cleanEmail,
        recovery_hash: recoveryHash,
        state: stripPantryFromState(payload),
        calendars
      });

      if (error) throw error;

      if (initStock.length > 0 || initTrash.length > 0) {
        await syncPantryTableForAccount(supabase, accountId, initStock, initTrash);
      }

      return NextResponse.json({ ok: true, state: payload, recoveryCode });
    }

    // ------------------------------------------------------------------------
    // KONTO LADEN & AUTH PRÜFEN (PASSWORT-HASH ODER OAUTH-SESSION-TOKEN)
    // ------------------------------------------------------------------------
    const { data: accountRow, error: accErr } = await supabase
      .from('tw_accounts')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (accErr) throw accErr;
    if (!accountRow) {
      return NextResponse.json({ ok: false, error: 'Konto nicht gefunden.' }, { status: 404 });
    }
    if (!verifyAccountAuth(authKey, accountId, accountRow.auth_hash)) {
      return NextResponse.json({ ok: false, error: 'Passwort / PIN ist falsch.' }, { status: 401 });
    }

    const currentCalendars: Record<string, string> = {
      ...(accountRow.calendars || {}),
      ...(accountRow.state?.calendars || {})
    };
    if (Array.isArray(accountRow.state?.members)) {
      accountRow.state.members.forEach((m: any) => {
        if (m?.id && m?.calendarId) currentCalendars[m.id] = String(m.calendarId).trim();
      });
    }

    // ------------------------------------------------------------------------
    // LOGIN & LOAD BUNDLE (TURBO-MODUS MIT skipCalendars: true)
    // ------------------------------------------------------------------------
    if (action === 'loginAccount' || action === 'loadBundle') {
      const skipCalendars = Boolean(body.skipCalendars);
      const [calendarData, pantryData] = await Promise.all([
        skipCalendars ? Promise.resolve(null) : loadCombinedCalendarData(supabase, accountId, currentCalendars),
        loadPantryForAccount(supabase, accountId, accountRow)
      ]);

      return NextResponse.json({
        ok: true,
        state: {
          ...(accountRow.state || {}),
          pantryItems: pantryData.pantryItems,
          pantryTrash: pantryData.pantryTrash
        },
        ...(calendarData ? { calendarData } : {})
      });
    }

    // ------------------------------------------------------------------------
    // SAVE STATE & SAVE DRIVE AND SYNC
    // ------------------------------------------------------------------------
    if (action === 'saveState' || action === 'saveDriveAndSync') {
      const nextState = body.payload || accountRow.state || {};
      const nextCalendars = { ...currentCalendars, ...(body.calendars || {}) };
      if (Array.isArray(nextState.members)) {
        nextState.members.forEach((m: any) => {
          if (m?.id) nextCalendars[m.id] = String(m.calendarId || '').trim();
        });
      }

      if (Array.isArray(nextState.pantryItems) || Array.isArray(nextState.pantryTrash)) {
        await syncPantryTableForAccount(
          supabase,
          accountId,
          Array.isArray(nextState.pantryItems) ? nextState.pantryItems : [],
          Array.isArray(nextState.pantryTrash) ? nextState.pantryTrash : []
        );
      }

      const cleanState = stripPantryFromState({ ...nextState, calendars: nextCalendars });
      const { error } = await supabase
        .from('tw_accounts')
        .update({ state: cleanState, calendars: nextCalendars, updated_at: new Date().toISOString() })
        .eq('account_id', accountId);
      if (error) throw error;

      await broadcastSync(supabase, accountId, body.clientId, action === 'saveDriveAndSync' ? 'all' : 'state');

      if (action === 'saveDriveAndSync') {
        const calendarData = await loadCombinedCalendarData(supabase, accountId, nextCalendars);
        return NextResponse.json({ ok: true, result: calendarData });
      }
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // CREATE / UPDATE / DELETE / MOVE EVENT (GOOGLE OAUTH + OUTLOOK + SA + DB)
    // ------------------------------------------------------------------------
    if (action === 'createEvent') {
      const oauthConns = await loadOAuthConnectionsForAccount(supabase, accountId);
      await createEventForMember(supabase, accountId, body.event || {}, oauthConns, currentCalendars);
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      await broadcastSync(supabase, accountId, body.clientId, 'calendar');
      return NextResponse.json({ ok: true, result: calendarData });
    }

    if (action === 'updateEvent') {
      const ev = body.event || {};
      const oauthConns = await loadOAuthConnectionsForAccount(supabase, accountId);
      await updateExternalOrLocalEvent(supabase, accountId, ev, body.oldMember || ev.member, oauthConns, currentCalendars);
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      await broadcastSync(supabase, accountId, body.clientId, 'calendar');
      return NextResponse.json({ ok: true, result: calendarData });
    }

    if (action === 'deleteEvent') {
      const oauthConns = await loadOAuthConnectionsForAccount(supabase, accountId);
      await deleteExternalOrLocalEvent(
        supabase,
        accountId,
        String(body.eventId || ''),
        String(body.member || ''),
        oauthConns,
        currentCalendars
      );
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      await broadcastSync(supabase, accountId, body.clientId, 'calendar');
      return NextResponse.json({ ok: true, result: calendarData });
    }

    if (action === 'moveEvent') {
      const snap = body.eventSnapshot || {};
      const oldMember = String(body.oldMember || snap.member || '');
      const targetMember = String(body.targetMember || oldMember);
      const movedEv = {
        ...snap,
        id: String(body.eventId || snap.id || ''),
        member: targetMember,
        date: String(body.newDate || snap.date || '')
      };
      const oauthConns = await loadOAuthConnectionsForAccount(supabase, accountId);
      await updateExternalOrLocalEvent(supabase, accountId, movedEv, oldMember, oauthConns, currentCalendars);
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      await broadcastSync(supabase, accountId, body.clientId, 'calendar');
      return NextResponse.json({ ok: true, result: calendarData });
    }

    // ------------------------------------------------------------------------
    // RUN DIAGNOSTICS
    // ------------------------------------------------------------------------
    if (action === 'runDiagnostics') {
      const [calendarData, pantryData, catalogRes, oauthConns] = await Promise.all([
        loadCombinedCalendarData(supabase, accountId, currentCalendars),
        loadPantryForAccount(supabase, accountId, accountRow),
        supabase.from('tw_product_catalog').select('barcode', { count: 'exact', head: true }),
        loadOAuthConnectionsForAccount(supabase, accountId)
      ]);

      return NextResponse.json({
        ok: true,
        result: {
          supabaseConnected: true,
          realtimeBroadcastReady: Boolean(getPublicAnonKey()),
          oauthConnectionsActive: oauthConns.length,
          pantryStockInTable: pantryData.pantryItems.length,
          pantryTrashInTable: pantryData.pantryTrash.length,
          productCatalogEntries: catalogRes?.count || 0,
          googleServiceAccountConfigured: hasGoogleServiceAccount(),
          calendarsStatus: calendarData.status,
          totalEventsLoaded: calendarData.events.length
        }
      });
    }

    return NextResponse.json({ ok: false, error: 'Unbekannte Aktion: ' + action }, { status: 400 });
  } catch (err: any) {
    const details = [err?.message, err?.details, err?.hint, err?.code ? `(${err.code})` : '']
      .filter(Boolean)
      .join(' – ');
    return NextResponse.json(
      { ok: false, error: details || 'Interner Serverfehler in /api/cloud' },
      { status: 500 }
    );
  }
}
