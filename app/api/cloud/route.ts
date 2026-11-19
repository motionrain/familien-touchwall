// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// 1. SUPABASE SERVER-CLIENT (BEREINIGT URL & SCHLÜSSEL AUTOMATISCH)
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
    // Entfernt automatisch angehängte Pfade wie /rest/v1 oder Schrägstriche am Ende
    cleanUrl = new URL(rawUrl).origin;
  } catch {
    throw new Error(`Ungültige SUPABASE_URL in Vercel: "${rawUrl}"`);
  }

  if (!cleanUrl.includes('supabase.co')) {
    throw new Error(`SUPABASE_URL zeigt nicht auf *.supabase.co, sondern auf: ${cleanUrl}`);
  }

  return cleanUrl;
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

function hashAuthKey(authKey: string) {
  return crypto.createHash('sha256').update(String(authKey || '').trim()).digest('hex');
}
async function broadcastSync(accountId: string, sourceClientId?: string) {
  try {
    const cleanUrl = getCleanSupabaseUrl();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!cleanUrl || !key || !accountId) return;

    await fetch(`${cleanUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `tw-sync-${accountId}`,
            event: 'sync',
            payload: { ts: Date.now(), clientId: sourceClientId || '' }
          }
        ]
      })
    });
  } catch {
    // Broadcast-Fehler dürfen den eigentlichen Speichervorgang nie blockieren
  }
}

// ============================================================================
// 2. ZERO-DEPENDENCY GOOGLE SERVICE ACCOUNT AUTH (NODE CRYPTO JWT)
// ============================================================================
let cachedGoogleToken = { token: '', expiresAt: 0 };

function hasGoogleCredentials() {
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim() &&
    (process.env.GOOGLE_PRIVATE_KEY || '').trim()
  );
}

async function getGoogleAccessToken() {
  if (!hasGoogleCredentials()) return null;
  if (cachedGoogleToken.token && Date.now() < cachedGoogleToken.expiresAt - 60000) {
    return cachedGoogleToken.token;
  }

  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '')
    .trim()
    .replace(/^["']|["']$/g, '');
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

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
  const signature = signer.sign(privateKey, 'base64url');
  const jwt = header + '.' + claim + '.' + signature;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error('Google Auth fehlgeschlagen: ' + (data.error_description || data.error || res.status));
  }

  cachedGoogleToken = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3500) * 1000
  };
  return data.access_token;
}

// ============================================================================
// 3. ZEITZONEN-SICHERE KONVERTIERUNG (EUROPE/BERLIN FÜR VERCEL UTC-SERVER)
// ============================================================================
function addDaysToDateStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
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

function buildGoogleEventPayload(ev: any) {
  const title = String(ev.title || 'Termin').trim();
  const dateStr = String(ev.date || '').slice(0, 10);
  const rawTime = String(ev.time || 'Ganztägig').trim();

  const rangeMatch = rawTime.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  const singleMatch = rawTime.match(/(\d{1,2}):(\d{2})/);

  if (!rawTime || rawTime.toLowerCase().includes('ganztägig') || (!rangeMatch && !singleMatch)) {
    return {
      summary: title,
      start: { date: dateStr },
      end: { date: addDaysToDateStr(dateStr, 1) }
    };
  }

  let startH, startM, endH, endM;
  if (rangeMatch) {
    startH = rangeMatch[1].padStart(2, '0');
    startM = rangeMatch[2];
    endH = rangeMatch[3].padStart(2, '0');
    endM = rangeMatch[4];
  } else {
    startH = singleMatch[1].padStart(2, '0');
    startM = singleMatch[2];
    const nextH = (Number(startH) + 1) % 24;
    endH = String(nextH).padStart(2, '0');
    endM = startM;
  }

  return {
    summary: title,
    start: { dateTime: `${dateStr}T${startH}:${startM}:00`, timeZone: 'Europe/Berlin' },
    end: { dateTime: `${dateStr}T${endH}:${endM}:00`, timeZone: 'Europe/Berlin' }
  };
}

function mapGoogleEventToTouchwall(gEv: any, memberId: string, calendarId: string) {
  let dateStr = '';
  let timeStr = 'Ganztägig';

  if (gEv.start?.date) {
    dateStr = gEv.start.date.slice(0, 10);
    timeStr = 'Ganztägig';
  } else if (gEv.start?.dateTime) {
    const startFmt = formatBerlinDateAndTime(gEv.start.dateTime);
    dateStr = startFmt.datePart;
    if (gEv.end?.dateTime) {
      const endFmt = formatBerlinDateAndTime(gEv.end.dateTime);
      timeStr = `${startFmt.timePart} - ${endFmt.timePart}`;
    } else {
      timeStr = startFmt.timePart;
    }
  }

  return {
    id: `gcal__${memberId}__${gEv.id}`,
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

function extractGoogleEventId(eventId: string) {
  const parts = String(eventId || '').split('__');
  if (parts[0] === 'gcal' && parts.length >= 3) {
    return parts.slice(2).join('__');
  }
  return null;
}

// ============================================================================
// 4. KOMBINIERTES LADEN: SUPABASE CLOUD-KALENDER + GOOGLE KALENDER API V3
// ============================================================================
async function loadCombinedCalendarData(supabase: any, accountId: string, calendarsMap: Record<string, string>) {
  const status: Record<string, { ok: boolean; msg: string }> = {};
  const allEvents: any[] = [];

  // A. Cloud-Termine aus Supabase laden
  const { data: dbEvents, error: dbErr } = await supabase
    .from('tw_calendar_events')
    .select('*')
    .eq('account_id', accountId);

  if (dbErr) throw dbErr;

  (dbEvents || []).forEach((row: any) => {
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

  // B. Google Kalender parallel abrufen
  const calEntries = Object.entries(calendarsMap || {}).filter(([, cid]) => String(cid || '').trim() !== '');

  if (calEntries.length > 0 && hasGoogleCredentials()) {
    let token: string | null = null;
    try {
      token = await getGoogleAccessToken();
    } catch (err: any) {
      calEntries.forEach(([memberId]) => {
        status[memberId] = { ok: false, msg: 'Google Auth Fehler: ' + err.message };
      });
    }

    if (token) {
      const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
      const timeMax = new Date(Date.now() + 365 * 86400000).toISOString();

      await Promise.all(
        calEntries.map(async ([memberId, rawCalId]) => {
          const calId = String(rawCalId).trim();
          try {
            const url =
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events` +
              `?singleEvents=true&orderBy=startTime&maxResults=500` +
              `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

            const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();

            if (!res.ok) {
              status[memberId] = {
                ok: false,
                msg:
                  res.status === 404
                    ? 'Kalender nicht gefunden / noch nicht für Service-Account freigegeben'
                    : (json?.error?.message || `HTTP ${res.status}`)
              };
              return;
            }

            const items = Array.isArray(json.items) ? json.items : [];
            items.forEach((gEv: any) => {
              if (gEv.status === 'cancelled') return;
              allEvents.push(mapGoogleEventToTouchwall(gEv, memberId, calId));
            });
            status[memberId] = { ok: true, msg: `Google Kalender aktiv (${items.length} Termine) ✓` };
          } catch (err: any) {
            status[memberId] = { ok: false, msg: err.message || 'Abruffehler' };
          }
        })
      );
    }
  } else {
    calEntries.forEach(([memberId]) => {
      status[memberId] = {
        ok: true,
        msg: hasGoogleCredentials() ? 'Google Kalender bereit ✓' : 'Supabase Cloud-Kalender aktiv ✓'
      };
    });
  }

  return {
    events: allEvents,
    calendars: calendarsMap || {},
    status
  };
}

// ============================================================================
// 5. SCHNELLER BROWSER-STATUSCHECK (GET /api/cloud)
// ============================================================================
export async function GET() {
  try {
    const cleanUrl = getCleanSupabaseUrl();
    return NextResponse.json({
      ok: true,
      status: 'Touchwall Cloud API bereit',
      supabaseHost: new URL(cleanUrl).host,
      supabaseKeyConfigured: Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()),
      googleConfigured: hasGoogleCredentials()
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Konfigurationsfehler' }, { status: 500 });
  }
}

// ============================================================================
// 6. HAUPT-ENDPOINT (POST /api/cloud)
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
    const authHash = hashAuthKey(authKey);

    // ------------------------------------------------------------------------
    // REGISTER ACCOUNT
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

      const { error } = await supabase.from('tw_accounts').insert({
        account_id: accountId,
        auth_hash: authHash,
        state: payload,
        calendars
      });

      if (error) throw error;
      return NextResponse.json({ ok: true, state: payload });
    }

    // ------------------------------------------------------------------------
    // KONTO LADEN & AUTH PRÜFEN
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
    if (accountRow.auth_hash !== authHash) {
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
    // LOGIN & LOAD BUNDLE
    // ------------------------------------------------------------------------
    if (action === 'loginAccount' || action === 'loadBundle') {
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({
        ok: true,
        state: accountRow.state || {},
        calendarData
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

      const { error } = await supabase
        .from('tw_accounts')
        .update({
          state: { ...nextState, calendars: nextCalendars },
          calendars: nextCalendars,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId);

      if (error) throw error;

      if (action === 'saveDriveAndSync') {
        const calendarData = await loadCombinedCalendarData(supabase, accountId, nextCalendars);
        return NextResponse.json({ ok: true, result: calendarData });
      }
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // CREATE EVENT
    // ------------------------------------------------------------------------
    if (action === 'createEvent') {
      const ev = body.event || {};
      const targetCalId = String(currentCalendars[ev.member] || '').trim();

      if (targetCalId && hasGoogleCredentials()) {
        const token = await getGoogleAccessToken();
        const gRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(buildGoogleEventPayload(ev))
          }
        );
        if (!gRes.ok) {
          const gErr = await gRes.json().catch(() => ({}));
          throw new Error('Google Termin konnte nicht erstellt werden: ' + (gErr?.error?.message || gRes.status));
        }
      } else {
        const { error } = await supabase.from('tw_calendar_events').upsert({
          id: String(ev.id || Date.now()),
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

      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({ ok: true, result: calendarData });
    }

    // ------------------------------------------------------------------------
    // UPDATE EVENT
    // ------------------------------------------------------------------------
    if (action === 'updateEvent') {
      const ev = body.event || {};
      const oldMember = body.oldMember || ev.member;
      const gEventId = extractGoogleEventId(ev.id);
      const oldCalId = String(currentCalendars[oldMember] || '').trim();
      const newCalId = String(currentCalendars[ev.member] || '').trim();

      if (gEventId && oldCalId && hasGoogleCredentials()) {
        const token = await getGoogleAccessToken();
        if (oldCalId === newCalId) {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(oldCalId)}/events/${encodeURIComponent(gEventId)}`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(buildGoogleEventPayload(ev))
            }
          );
        } else {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(oldCalId)}/events/${encodeURIComponent(gEventId)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
          );
          if (newCalId) {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(newCalId)}/events`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(buildGoogleEventPayload(ev))
              }
            );
          } else {
            const { error } = await supabase.from('tw_calendar_events').upsert({
              id: String(Date.now()),
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
        }
      } else {
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

      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({ ok: true, result: calendarData });
    }

    // ------------------------------------------------------------------------
    // DELETE EVENT
    // ------------------------------------------------------------------------
    if (action === 'deleteEvent') {
      const eventId = String(body.eventId || '');
      const member = String(body.member || '');
      const gEventId = extractGoogleEventId(eventId);
      const calId = String(currentCalendars[member] || '').trim();

      if (gEventId && calId && hasGoogleCredentials()) {
        const token = await getGoogleAccessToken();
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(gEventId)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const { error } = await supabase
          .from('tw_calendar_events')
          .delete()
          .eq('account_id', accountId)
          .eq('id', eventId);
        if (error) throw error;
      }

      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({ ok: true, result: calendarData });
    }

    // ------------------------------------------------------------------------
    // MOVE EVENT
    // ------------------------------------------------------------------------
    if (action === 'moveEvent') {
      const eventId = String(body.eventId || '');
      const oldMember = String(body.oldMember || '');
      const targetMember = String(body.targetMember || oldMember);
      const newDate = String(body.newDate || '');
      const snap = body.eventSnapshot || {};

      const gEventId = extractGoogleEventId(eventId);
      const oldCalId = String(currentCalendars[oldMember] || '').trim();
      const targetCalId = String(currentCalendars[targetMember] || '').trim();

      const movedEv = { ...snap, member: targetMember, date: newDate };

      if (gEventId && oldCalId && hasGoogleCredentials()) {
        const token = await getGoogleAccessToken();
        if (oldCalId === targetCalId) {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(oldCalId)}/events/${encodeURIComponent(gEventId)}`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(buildGoogleEventPayload(movedEv))
            }
          );
        } else {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(oldCalId)}/events/${encodeURIComponent(gEventId)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
          );
          if (targetCalId) {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalId)}/events`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(buildGoogleEventPayload(movedEv))
              }
            );
          } else {
            const { error } = await supabase.from('tw_calendar_events').upsert({
              id: String(Date.now()),
              account_id: accountId,
              member: targetMember,
              title: movedEv.title || 'Termin',
              event_date: newDate,
              event_time: movedEv.time || 'Ganztägig',
              updated_at: new Date().toISOString()
            });
            if (error) throw error;
          }
        }
      } else {
        const { error } = await supabase
          .from('tw_calendar_events')
          .update({
            member: targetMember,
            event_date: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('account_id', accountId)
          .eq('id', eventId);
        if (error) throw error;
      }

      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({ ok: true, result: calendarData });
    }

    // ------------------------------------------------------------------------
    // RUN DIAGNOSTICS
    // ------------------------------------------------------------------------
    if (action === 'runDiagnostics') {
      const calendarData = await loadCombinedCalendarData(supabase, accountId, currentCalendars);
      return NextResponse.json({
        ok: true,
        result: {
          supabaseConnected: true,
          googleServiceAccountConfigured: hasGoogleCredentials(),
          serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Nicht konfiguriert (Cloud-Kalender aktiv)',
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
