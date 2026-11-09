// @ts-nocheck
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const payload = await req.json();
    // Entfernt unsichtbare Leerzeichen oder Zeilenumbrüche aus dem kopierten Token
    const rawToken = String(payload.token || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!rawToken) {
      return NextResponse.json({ error: 'Kein gültiges Todoist API-Token übergeben.' }, { status: 400 });
    }

    // Spezial-Aktion: Nativen Todoist-Reminder über Sync API v9 setzen
    if (payload.action === 'addReminder' && payload.itemId) {
      const uuid = 'tw-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
      const cmd = {
        type: 'reminder_add',
        temp_id: 'rem-' + Date.now(),
        uuid: uuid,
        args: {
          item_id: String(payload.itemId),
          type: 'relative',
          minute_offset: Number(payload.minuteOffset || 15)
        }
      };
      const syncRes = await fetch('https://api.todoist.com/sync/v9/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commands: [cmd] }),
        cache: 'no-store'
      });
      const syncData = await syncRes.json().catch(() => ({}));
      return NextResponse.json({ ok: true, syncData });
    }

    // Standard Todoist REST API v2 Aufruf über den Vercel-Server (verhindert "Failed to fetch")
    const path = payload.path || '/projects';
    const method = payload.method || 'GET';
    const url = `https://api.todoist.com/rest/v2${path}`;

    const fetchOptions = {
      method,
      headers: {
        Authorization: `Bearer ${rawToken}`,
        ...(payload.body ? { 'Content-Type': 'application/json' } : {})
      },
      cache: 'no-store'
    };

    if (payload.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(payload.body);
    }

    const res = await fetch(url, fetchOptions);
    if (res.status === 204) {
      return NextResponse.json({ ok: true });
    }

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: `Todoist (${res.status}): ${text}` }, { status: res.status });
    }

    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Server-Fehler beim Todoist-Aufruf' },
      { status: 500 }
    );
  }
}
