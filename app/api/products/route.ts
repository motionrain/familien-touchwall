// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .trim()
    .replace(/^["']|["']$/g, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!rawUrl || !key) {
    throw new Error('SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.');
  }

  const cleanUrl = new URL(rawUrl).origin;
  return createClient(cleanUrl, key, { auth: { persistSession: false } });
}

function buildLookupKeys(rawBarcode: string) {
  const clean = String(rawBarcode || '').trim();
  if (!clean || clean.length < 4) return [];

  const keys = [clean];
  const digits = clean.replace(/\D/g, '');

  if (digits && digits !== clean && digits.length >= 8) {
    keys.push(digits);
  }
  // 13-stellige Frischetheken-Codes (20... bis 29...): auch 7-stelligen Artikelstamm prüfen
  if (digits.length === 13 && /^2[0-9]/.test(digits)) {
    keys.push(digits.slice(0, 7));
  }
  return Array.from(new Set(keys));
}

// GET /api/products?barcode=4001234567890
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawBarcode = searchParams.get('barcode') || '';
    const keys = buildLookupKeys(rawBarcode);

    if (keys.length === 0) {
      return NextResponse.json({ ok: true, found: false, product: null });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tw_product_catalog')
      .select('*')
      .in('barcode', keys);

    if (error) throw error;

    const list = Array.isArray(data) ? data : [];
    // Exakten Treffer bevorzugen, sonst Prefix-Treffer
    const hit = list.find(row => row.barcode === keys[0]) || list[0] || null;

    if (!hit) {
      return NextResponse.json({ ok: true, found: false, product: null });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      product: {
        barcode: hit.barcode,
        name: hit.name,
        quantity: hit.quantity || '1x',
        location: hit.location || 'fridge',
        category: hit.category || 'produce',
        glutenFree: hit.gluten_free || 'auto',
        imageUrl: hit.image_url || '',
        scanCount: Number(hit.scan_count || 1)
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, found: false, error: err?.message || 'Produkt-Abfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}

// POST /api/products  -> Lernt oder aktualisiert ein gescanntes Produkt in Supabase
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawBarcode = String(body.barcode || '').trim();
    const name = String(body.name || '').trim();

    if (!rawBarcode || rawBarcode.length < 4 || !name) {
      return NextResponse.json({ ok: false, error: 'barcode oder name fehlt.' }, { status: 400 });
    }

    const keysToSave = buildLookupKeys(rawBarcode);
    const supabase = getSupabaseAdmin();

    const { data: existingRows } = await supabase
      .from('tw_product_catalog')
      .select('barcode, scan_count')
      .in('barcode', keysToSave);

    const existingMap = new Map();
    (existingRows || []).forEach((r: any) => existingMap.set(r.barcode, Number(r.scan_count || 0)));

    const nowIso = new Date().toISOString();
    const gfValue =
      body.glutenFree === true || body.glutenFree === 'yes'
        ? 'yes'
        : body.glutenFree === false || body.glutenFree === 'no'
        ? 'no'
        : 'auto';

    const rowsToUpsert = keysToSave.map(codeKey => ({
      barcode: codeKey,
      name,
      quantity: String(body.quantity || '1x').trim() || '1x',
      location: String(body.location || 'fridge').trim() || 'fridge',
      category: String(body.category || 'produce').trim() || 'produce',
      gluten_free: gfValue,
      image_url: String(body.imageUrl || '').trim(),
      scan_count: (existingMap.get(codeKey) || 0) + 1,
      updated_at: nowIso
    }));

    const { error } = await supabase
      .from('tw_product_catalog')
      .upsert(rowsToUpsert, { onConflict: 'barcode' });

    if (error) throw error;

    return NextResponse.json({ ok: true, savedKeys: keysToSave });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Produkt konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
