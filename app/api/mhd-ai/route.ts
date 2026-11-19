// @ts-nocheck
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeExpiryDate(rawVal: string) {
  const s = String(rawVal || '').trim();
  if (!s) return null;
  const iso = s.match(/^(20[2-3]\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const maxDay = new Date(y, m, 0).getDate();
    return `${iso[1]}-${iso[2]}-${String(Math.min(d, maxDay)).padStart(2, '0')}`;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        fallbackToLocal: true,
        error: 'GEMINI_API_KEY fehlt in Vercel (lokales OCR aktiv).'
      });
    }

    const body = await req.json();
    const rawBase64 = String(body.imageBase64 || '');
    const mode = body.mode === 'label' ? 'label' : 'mhd';
    const todayStr = String(body.todayStr || new Date().toISOString().slice(0, 10));

    const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
    if (!cleanBase64 || cleanBase64.length < 200) {
      return NextResponse.json({ ok: false, error: 'Kein gültiges Kamerabild übermittelt.' }, { status: 400 });
    }

    const prompt =
      mode === 'label'
        ? [
            `Du bist ein präziser Lebensmittel-Etiketten-Scanner für Deutschland/Europa. Heute ist ${todayStr}.`,
            'Lies aus diesem Bild einer Lebensmittelverpackung:',
            '1. productName: Kurzer, klarer Produktname auf Deutsch (ohne Gewicht/Marketing-Floskeln).',
            '2. brand: Kurzer Markenname (falls sichtbar, sonst null).',
            '3. quantity: Menge/Gewicht falls sichtbar (z.B. "500g", "1L", "4x"), sonst null.',
            '4. expiryDate: Das Mindesthaltbarkeitsdatum (MHD / "zu verbrauchen bis") im Format YYYY-MM-DD.',
            '   - Erkenne auch Punktschrift/Dot-Matrix, schrägen Druck, weiße Schrift auf dunklem Grund und Kurzformate wie DD.MM.YY oder MM.YYYY (bei nur Monat/Jahr nimm den letzten Tag des Monats).',
            '   - Wenn Produktionsdatum UND Ablaufdatum draufstehen, wähle IMMER das spätere Ablaufdatum.',
            '   - Wenn kein Datum sicher lesbar ist, gib null zurück (nichts erfinden!).',
            '5. rawText: Der gelesene Datums-Text exakt wie aufgedruckt (oder null).',
            'Antworte ausschließlich als JSON mit den Schlüsseln: productName, brand, quantity, expiryDate, rawText.'
          ].join('\n')
        : [
            `Du bist ein hochpräziser MHD-Scanner (Mindesthaltbarkeitsdatum / Verbrauchsdatum) für Lebensmittelverpackungen in Deutschland/Europa. Heute ist ${todayStr}.`,
            'Lies ausschließlich das Ablaufdatum (MHD / "mindestens haltbar bis" / "zu verbrauchen bis" / "EXP") aus dem Bild.',
            'Regeln:',
            '- Erkenne Punktschrift (Dot-Matrix/Inkjet), Prägedruck, leichte Unschärfe, gedrehten Text und helle Schrift auf dunklem Hintergrund.',
            '- Europäisches Datumsformat ist Tag.Monat.Jahr (z.B. 24.11.26 = 2026-11-24, 05 12 2026 = 2026-12-05, 11/26 oder 11.2026 = 2026-11-30).',
            '- Ignoriere Uhrzeiten (z.B. 14:25), Chargennummern (L12345) und Gewichtsangaben.',
            '- Falls Verpackungsdatum UND Ablaufdatum sichtbar sind, gib das spätere Ablaufdatum zurück.',
            '- Wenn kein Datum erkennbar ist, gib expiryDate: null zurück – rate niemals ein Datum!',
            'Antworte ausschließlich als JSON: {"expiryDate": "YYYY-MM-DD" | null, "rawText": string | null, "confidence": "high" | "medium" | "low"}'
          ].join('\n');

    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
      encodeURIComponent(apiKey);

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        fallbackToLocal: true,
        error: data?.error?.message || `Gemini HTTP ${res.status}`
      });
    }

    const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(textOut);
    } catch {
      const m = textOut.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const expiryDate = normalizeExpiryDate(parsed.expiryDate);

    return NextResponse.json({
      ok: true,
      expiryDate,
      rawText: parsed.rawText || null,
      productName: parsed.productName || null,
      brand: parsed.brand || null,
      quantity: parsed.quantity || null,
      confidence: parsed.confidence || (expiryDate ? 'high' : 'low')
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      fallbackToLocal: true,
      error: err?.message || 'KI-Scan Fehler'
    });
  }
}
