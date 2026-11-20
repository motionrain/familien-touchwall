// @ts-nocheck

/**
 * Zieht das schnellste kleine Vorschaubild aus einer OpenFoodFacts-Antwort.
 */
export function extractOpenFoodFactsImage(product) {
  if (!product || typeof product !== 'object') return '';
  return (
    product.image_front_small_url ||
    product.image_front_thumb_url ||
    product.image_small_url ||
    product.image_url ||
    ''
  );
}

/**
 * Komprimiert ein File (Handy-Foto) oder ein laufendes HTMLVideoElement (Scanner-Kamera)
 * direkt im Browser auf ein leichtes JPEG (~12–20 KB).
 */
export function compressProductPhoto(source, maxSize = 300, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const drawToDataUrl = (imgSource, srcW, srcH) => {
      if (!srcW || !srcH) return reject(new Error('Bildquelle hat keine Größe.'));
      const scale = Math.min(maxSize / srcW, maxSize / srcH, 1);
      const cw = Math.max(1, Math.round(srcW * scale));
      const ch = Math.max(1, Math.round(srcH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas nicht verfügbar.'));

      // Weißer Hintergrund, falls ein PNG mit Transparenz fotografiert/gewählt wird
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(imgSource, 0, 0, cw, ch);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
      drawToDataUrl(source, source.videoWidth, source.videoHeight);
      return;
    }

    const img = new Image();
    const objUrl = URL.createObjectURL(source);
    img.onload = () => {
      try {
        drawToDataUrl(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Foto konnte nicht gelesen werden.'));
    };
    img.src = objUrl;
  });
}

/**
 * Komprimiert ein Foto/Video-Frame und lädt es direkt in Supabase Storage hoch.
 * Gibt die fertige öffentliche Bild-URL zurück.
 */
export async function uploadProductPhotoToSupabase({
  source,
  accountId,
  barcode = ''
}: {
  source: File | HTMLVideoElement;
  accountId: string;
  barcode?: string;
}): Promise<string> {
  const imageBase64 = await compressProductPhoto(source, 300, 0.75);

  const res = await fetch('/api/product-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: accountId || 'local',
      barcode,
      imageBase64
    })
  });

  const json = await res.json();
  if (!res.ok || !json?.ok || !json?.url) {
    throw new Error(json?.error || 'Upload fehlgeschlagen');
  }
  return json.url;
}
