// @ts-nocheck
import { NextResponse } from 'next/server';

const TODOIST_V1_BASE = 'https://api.todoist.com/api/v1';

export async function POST(req) {
  try {
    const payload = await req.json();
    const rawToken = String(payload.token || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!rawToken) {
      return NextResponse.json({ error: 'Kein gültiges Todoist API-Token übergeben.' }, { status: 400 });
    }

    // 1. Nativen Todoist-Reminder über den neuen /api/v1/sync Endpunkt setzen
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
      const syncRes = await fetch(`${TODOIST_V1_BASE}/sync`, {
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

    // 2. Alle Projekt- und Aufgaben-Aufrufe über den neuen /api/v1/ Endpunkt
    const path = payload.path || '/projects';
    const method = payload.method || 'GET';
    const url = `${TODOIST_V1_BASE}${path}`;

    // Falls eine Aufgabe mit Uhrzeit (due_datetime) angelegt wird: RFC3339-Zeitzone ergänzen
    let cleanBody = payload.body ? { ...payload.body } : null;
    if (cleanBody && cleanBody.due_datetime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(cleanBody.due_datetime)) {
      cleanBody.due_datetime = `${cleanBody.due_datetime}+01:00`;
    }

    const fetchOptions = {
      method,
      headers: {
        Authorization: `Bearer ${rawToken}`,
        ...(cleanBody ? { 'Content-Type': 'application/json' } : {})
      },
      cache: 'no-store'
    };

    if (cleanBody && method !== 'GET') {
      fetchOptions.body = JSON.stringify(cleanBody);
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

    // Todoist API v1 liefert Listen als { results: [...] } zurück -> direkt als Array entpacken
    let unwrapped = data;
    if (method === 'GET' && data && !Array.isArray(data) && Array.isArray(data.results)) {
      unwrapped = data.results;
    }

    // Lädt für das Team "Familie Richter" zusätzlich alle Team-/Workspace-Mitglieder über /api/v1/sync
    if (method === 'GET' && path.includes('/collaborators')) {
      try {
        const syncColRes = await fetch(`${TODOIST_V1_BASE}/sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${rawToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sync_token: '*',
            resource_types: ['collaborators', 'user']
          }),
          cache: 'no-store'
        });
        if (syncColRes.ok) {
          const syncColData = await syncColRes.json();
          const combined = Array.isArray(unwrapped) ? [...unwrapped] : [];
          if (syncColData?.user?.id) {
            combined.push({
              id: String(syncColData.user.id),
              name: syncColData.user.full_name || 'Hauptkonto',
              email: syncColData.user.email || ''
            });
          }
          if (Array.isArray(syncColData?.collaborators)) {
            syncColData.collaborators.forEach(c => {
              combined.push({
                id: String(c.id),
                name: c.full_name || c.name || c.email || 'Team-Mitglied',
                email: c.email || ''
              });
            });
          }
          return NextResponse.json(combined);
        }
      } catch (e) {}
