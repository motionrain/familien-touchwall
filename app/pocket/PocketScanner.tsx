// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, ScanLine, FileText, Trash2,
  Check, Zap, ZoomIn, Sparkles, Apple, ShoppingCart, PackagePlus
} from 'lucide-react';
import * as Cfg from '../touchwallConfig';
import {
  FOOD_CATEGORIES,
  STORAGE_PILLS,
  detectFoodCategory,
  getFoodEmoji,
  stepMobileQty,
  playMobileBeep
} from '../foodUtils';

const { formatDateStr, addDays } = Cfg;

export const FRESH_PRODUCE_MHD_DB = [
  { id: 'cucumber',  name: 'Gurke (Schlangengurke)',             emoji: '🥒', days: 7,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 7 Tage knackig',      keywords: ['gurke', 'schlangengurke', 'minigurke', 'landgurke'], aiLabels: ['cucumber', 'cuke', 'zucchini', 'courgette'] },
  { id: 'apple',     name: 'Frische Äpfel',                      emoji: '🍎', days: 21, location: 'kitchen', category: 'produce', hint: 'Kühl gelagert ca. 3 Wochen haltbar',     keywords: ['apfel', 'äpfel', 'elstar', 'boskoop', 'pink lady', 'gala', 'braeburn'], aiLabels: ['granny smith', 'apple', 'pomegranate', 'fig'] },
  { id: 'orange',    name: 'Orangen / Clementinen',              emoji: '🍊', days: 14, location: 'kitchen', category: 'produce', hint: 'Zitrusfrüchte halten ca. 14 Tage',       keywords: ['orange', 'orangen', 'clementine', 'clementinen', 'mandarine', 'mandarinen', 'apfelsine'], aiLabels: ['orange', 'tangerine', 'clementine', 'mandarin'] },
  { id: 'melon',     name: 'Melone (Wasser-/Honigmelone)',       emoji: '🍈', days: 10, location: 'kitchen', category: 'produce', hint: 'Ungeschnitten ca. 10 Tage haltbar',      keywords: ['melone', 'wassermelone', 'honigmelone', 'galiamelone', 'cantaloupe'], aiLabels: ['watermelon', 'melon', 'cantaloupe', 'honeydew', 'jackfruit', 'spaghetti squash', 'butternut squash'] },
  { id: 'salad',     name: 'Frischer Salat (Eisberg / Feldsalat)', emoji: '🥬', days: 4, location: 'fridge', category: 'produce', hint: 'Im Gemüsefach ca. 4 Tage frisch',        keywords: ['salat', 'eisbergsalat', 'kopfsalat', 'feldsalat', 'mâche', 'rucola', 'blattsalat', 'spinat'], aiLabels: ['head cabbage', 'cabbage', 'lettuce', 'artichoke', 'cardoon', 'bok choy'] },
  { id: 'banana',    name: 'Bananen',                            emoji: '🍌', days: 5,  location: 'kitchen', category: 'produce', hint: 'Bei Raumtemperatur ca. 5 Tage',          keywords: ['banane', 'bananen'], aiLabels: ['banana', 'plantain'] },
  { id: 'tomato',    name: 'Frische Tomaten',                    emoji: '🍅', days: 7,  location: 'kitchen', category: 'produce', hint: 'Bei Zimmertemperatur ca. 7 Tage',        keywords: ['tomate', 'tomaten', 'rispentomaten', 'cherrytomaten', 'strauchtomaten'], aiLabels: ['tomato', 'hip'] },
  { id: 'pepper',    name: 'Paprika',                            emoji: '🫑', days: 8,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 8 Tage knackig',      keywords: ['paprika', 'spitzpaprika', 'paprikaschote'], aiLabels: ['bell pepper', 'pepper', 'chilli', 'jalapeno'] },
  { id: 'broccoli',  name: 'Brokkoli / Blumenkohl',              emoji: '🥦', days: 5,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 5 Tage frisch',       keywords: ['brokkoli', 'blumenkohl', 'kohlrabi', 'rosenkohl'], aiLabels: ['broccoli', 'cauliflower'] },
  { id: 'carrot',    name: 'Karotten / Möhren',                  emoji: '🥕', days: 14, location: 'fridge',  category: 'produce', hint: 'Im Gemüsefach bis zu 14 Tage haltbar',   keywords: ['karotte', 'karotten', 'möhre', 'möhren', 'wurzel'], aiLabels: ['carrot', 'parsnip'] },
  { id: 'berries',   name: 'Frische Beeren (Erd-/Heidelbeeren)', emoji: '🍓', days: 3,  location: 'fridge',  category: 'produce', hint: 'Empfindlich – im Kühlschrank ca. 3 Tage', keywords: ['erdbeeren', 'erdbeere', 'himbeeren', 'heidelbeeren', 'blaubeeren', 'brombeeren', 'beeren'], aiLabels: ['strawberry', 'raspberry', 'blackberry', 'blueberry'] },
  { id: 'lemon',     name: 'Zitrone / Limette',                  emoji: '🍋', days: 14, location: 'kitchen', category: 'produce', hint: 'Hält ca. 14 Tage frisch',                keywords: ['zitrone', 'zitronen', 'limette', 'limetten'], aiLabels: ['lemon', 'lime'] },
  { id: 'avocado',   name: 'Avocado',                            emoji: '🥑', days: 5,  location: 'kitchen', category: 'produce', hint: 'Reift in ca. 5 Tagen nach',              keywords: ['avocado', 'avocados'], aiLabels: ['avocado', 'guacamole', 'custard apple'] },
  { id: 'mushrooms', name: 'Frische Champignons / Pilze',        emoji: '🍄', days: 4,  location: 'fridge',  category: 'produce', hint: 'Im Kühlschrank ca. 4 Tage haltbar',      keywords: ['pilze', 'champignons', 'steinpilze', 'pfifferlinge'], aiLabels: ['mushroom', 'agaric', 'bolete', 'gyromitra'] },
  { id: 'potato',    name: 'Kartoffeln',                         emoji: '🥔', days: 30, location: 'pantry',  category: 'grains',  hint: 'Dunkel & kühl ca. 30 Tage lagerfähig',   keywords: ['kartoffel', 'kartoffeln', 'speisekartoffeln', 'drillinge'], aiLabels: ['potato', 'mashed potato', 'sweet potato'] },
  { id: 'onion',     name: 'Zwiebeln / Knoblauch',               emoji: '🧅', days: 30, location: 'pantry',  category: 'produce', hint: 'Trocken gelagert ca. 30 Tage haltbar',   keywords: ['zwiebel', 'zwiebeln', 'knoblauch', 'schalotten'], aiLabels: ['onion', 'garlic', 'shallot'] }
];

function estimateProduceByName(inputName) {
  const lower = String(inputName || '').toLowerCase().trim();
  if (!lower) return null;
  for (const item of FRESH_PRODUCE_MHD_DB) {
    if (item.keywords.some(kw => lower === kw || lower.includes(kw))) {
      return item;
    }
  }
  return null;
}

export default function PocketScanner({
  cartItems,
  todayStr,
  isSyncing,
  themeStyles,
  onAddSingleToCart,
  onAddBatchToCart,
  onRemoveCartItem,
  onTransferSingleCartItemToStock,
  onTransferAllCartToStock,
  showToast
}) {
  const [scannerMode, setScannerMode] = useState('barcode'); // 'barcode' | 'object_ai' | 'receipt'
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);

  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanName, setScanName] = useState('');
  const [scanQty, setScanQty] = useState('1x');
  const [scanLocation, setScanLocation] = useState('kitchen');
  const [scanCategory, setScanCategory] = useState('auto');
  const [scanExpiry, setScanExpiry] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('');
  const [estimatedMhdHint, setEstimatedMhdHint] = useState('');

  const [isLookingUpProduct, setIsLookingUpProduct] = useState(false);
  const [detectedMhdCandidate, setDetectedMhdCandidate] = useState('');
  const [lastOcrRawHint, setLastOcrRawHint] = useState('');
  const [isReadingMhd, setIsReadingMhd] = useState(false);
  const [isDetectingObject, setIsDetectingObject] = useState(false);
  const [autoMhdScanEnabled, setAutoMhdScanEnabled] = useState(true);

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const mhdAutoLoopRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const mobileNetModelRef = useRef(null);
  const wakeLockRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isReadingMhdRef = useRef(false);

  const requestScreenWakeLock = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  };

  const releaseScreenWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) {}
  };

  const stopCameraStream = () => {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    releaseScreenWakeLock();
    setCameraActive(false);
    setTorchOn(false);
    setZoomActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate?.().catch(() => {});
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  const toggleCameraTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      showToast('Kameralicht', 'Taschenlampe wird auf diesem Gerät nicht unterstützt.', '🔦');
    }
  };

  const toggleCameraZoom = async () => {
    const next = !zoomActive;
    setZoomActive(next);
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (track) {
        await track.applyConstraints({ advanced: [{ zoom: next ? 2.0 : 1.0 }] });
      }
    } catch (e) {}
  };

  const applyFreshProduceSelection = (produceItem, showFeedbackToast = true) => {
    if (!produceItem) return;
    const estDate = formatDateStr(addDays(new Date(), produceItem.days));
    setScanName(produceItem.name);
    setScanLocation(produceItem.location);
    setScanCategory(produceItem.category);
    setScanExpiry(estDate);
    setDetectedMhdCandidate(estDate);
    setEstimatedMhdHint(
      produceItem.emoji + ' ' + produceItem.name + ' → Geschätztes MHD: +' + produceItem.days + ' Tage (' + produceItem.hint + ')'
    );
    playMobileBeep('scan');
    try { navigator.vibrate?.(65); } catch (e) {}
    if (showFeedbackToast) {
      showToast(
        produceItem.name + ' erkannt!',
        'Geschätztes MHD (+' + produceItem.days + ' Tage): ' + estDate.slice(8, 10) + '.' + estDate.slice(5, 7) + '.' + estDate.slice(0, 4),
        produceItem.emoji
      );
    }
  };

  const loadMobileNetModel = async () => {
    if (mobileNetModelRef.current) return mobileNetModelRef.current;
    if (typeof window === 'undefined') return null;

    if (!window.tf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    if (!window.mobilenet) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const model = await window.mobilenet.load({ version: 2, alpha: 0.5 });
    mobileNetModelRef.current = model;
    return model;
  };

  const detectProduceByCenterColor = (canvas) => {
    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const data = ctx.getImageData(Math.floor(w * 0.25), Math.floor(h * 0.25), Math.floor(w * 0.5), Math.floor(h * 0.5)).data;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
      const r = rSum / count;
      const g = gSum / count;
      const b = bSum / count;

      if (g > r * 1.18 && g > b * 1.25) {
        return g < 110
          ? FRESH_PRODUCE_MHD_DB.find(x => x.id === 'cucumber')
          : FRESH_PRODUCE_MHD_DB.find(x => x.id === 'salad');
      }
      if (r > 165 && g > 95 && g < 165 && b < 80) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'orange');
      }
      if (r > 170 && g > 160 && b < 95) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'banana');
      }
      if (r > g * 1.35 && r > b * 1.35) {
        return FRESH_PRODUCE_MHD_DB.find(x => x.id === 'apple');
      }
    } catch (e) {}
    return null;
  };

  const recognizeProduceFromCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      showToast('Kamera starten', 'Bitte schalte oben rechts zuerst die Kamera ein.', '📷');
      return;
    }
    if (isDetectingObject) return;
    setIsDetectingObject(true);
    showToast('KI-Objekterkennung läuft...', 'Erkenne Obst/Gemüse & schätze Haltbarkeit...', '🍎');

    try {
      const vid = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

      let matchedProduce = null;

      try {
        const model = await loadMobileNetModel();
        if (model) {
          const predictions = await model.classify(canvas, 5);
          if (Array.isArray(predictions)) {
            for (const pred of predictions) {
              const cls = String(pred.className || '').toLowerCase();
              const found = FRESH_PRODUCE_MHD_DB.find(item =>
                item.aiLabels.some(lbl => cls.includes(lbl))
              );
              if (found) {
                matchedProduce = found;
                break;
              }
            }
          }
        }
      } catch (e) {}

      if (!matchedProduce) {
        matchedProduce = detectProduceByCenterColor(canvas);
      }

      if (matchedProduce) {
        applyFreshProduceSelection(matchedProduce, true);
      } else {
        showToast(
          'Bitte näher heranhalten',
          'Oder tippe das Obst/Gemüse direkt in der Schnellwahl-Leiste darunter an!',
          '🔍'
        );
      }
    } catch (err) {
      showToast('Hinweis', 'Nutze die 1-Klick-Obst-&-Gemüse-Leiste direkt darunter.', '🍎');
    } finally {
      setIsDetectingObject(false);
    }
  };

  const extractExpiryDateFromText = (rawText) => {
    const clean = String(rawText || '')
      .replace(/[|lI!]/g, '1')
      .replace(/[OQ]/g, '0')
      .replace(/S(?=\d)/g, '5')
      .replace(/B(?=\d)/g, '8')
      .replace(/Z(?=\d)/g, '2');

    const dmyRegex = /(0?[1-9]|[12][0-9]|3[01])\s*[.,/\-\s:·•_]+\s*(0?[1-9]|1[0-2])\s*[.,/\-\s:·•_]+\s*(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    let match;
    while ((match = dmyRegex.exec(clean)) !== null) {
      const day = String(match[1]).padStart(2, '0');
      const month = String(match[2]).padStart(2, '0');
      let year = String(match[3]);
      if (year.length === 2) year = '20' + year;
      const numYear = Number(year);
      if (numYear >= 2025 && numYear <= 2036) {
        return year + '-' + month + '-' + day;
      }
    }

    const compactRegex = /\b(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    while ((match = compactRegex.exec(clean)) !== null) {
      const day = match[1];
      const month = match[2];
      let year = match[3];
      if (year.length === 2) year = '20' + year;
      return year + '-' + month + '-' + day;
    }

    const myRegex = /\b(0?[1-9]|1[0-2])\s*[.,/\-:]+\s*(20[2-3][0-9]|2[6-9]|3[0-5])\b/g;
    while ((match = myRegex.exec(clean)) !== null) {
      const month = String(match[1]).padStart(2, '0');
      let year = String(match[2]);
      if (year.length === 2) year = '20' + year;
      return year + '-' + month + '-28';
    }

    return null;
  };

  const getFastMhdOcrWorker = async () => {
    if (ocrWorkerRef.current) return ocrWorkerRef.current;

    if (typeof window !== 'undefined' && !window.Tesseract) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    if (window.Tesseract?.createWorker) {
      const worker = await window.Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,/-:MHDmhd '
      });
      ocrWorkerRef.current = worker;
      return worker;
    }
    return null;
  };

  const captureMhdFromLiveCamera = async (silentMode = false) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      if (!silentMode) showToast('Kamera nicht bereit', 'Bitte zuerst die Kamera starten.', '⚠️');
      return;
    }
    if (isReadingMhdRef.current) return;

    isReadingMhdRef.current = true;
    setIsReadingMhd(true);

    try {
      const vid = videoRef.current;
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 480;

      const cropX = Math.floor(vw * 0.10);
      const cropY = Math.floor(vh * 0.28);
      const cropW = Math.floor(vw * 0.80);
      const cropH = Math.floor(vh * 0.44);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(2.1) grayscale(1) brightness(1.12)';
      ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const worker = await getFastMhdOcrWorker();
      const result = worker
        ? await worker.recognize(canvas)
        : await window.Tesseract.recognize(canvas, 'eng');

      const detectedText = String(result?.data?.text || '').trim();
      const singleLineHint = detectedText.replace(/\s+/g, ' ').slice(0, 42);
      if (singleLineHint) setLastOcrRawHint(singleLineHint);

      const parsedDate = extractExpiryDateFromText(detectedText);

      if (parsedDate) {
        setDetectedMhdCandidate(parsedDate);
        setScanExpiry(parsedDate);
        playMobileBeep('scan');
        try { navigator.vibrate?.(70); } catch (e) {}
        const niceDate = parsedDate.slice(8, 10) + '.' + parsedDate.slice(5, 7) + '.' + parsedDate.slice(0, 4);
        showToast('MHD erkannt: ' + niceDate, 'Tippe auf „🛒 In den Einkaufswagen“!', '🎉');
      } else if (!silentMode) {
        showToast(
          'Datum noch unscharf',
          'Tipp: Nutze oben im Bild „🔍 2x Lupe“ oder „🔦 Licht“.',
          '🔍'
        );
      }
    } catch (err) {
      if (!silentMode) showToast('MHD-Scan Hinweis', 'Bitte noch einmal antippen.', '⚠️');
    } finally {
      isReadingMhdRef.current = false;
      setIsReadingMhd(false);
    }
  };

  useEffect(() => {
    if (!cameraActive || !autoMhdScanEnabled || scannerMode === 'object_ai') {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
      return;
    }
    mhdAutoLoopRef.current = setInterval(() => {
      if (!isReadingMhdRef.current && !detectedMhdCandidate) {
        captureMhdFromLiveCamera(true);
      }
    }, 1250);

    return () => {
      if (mhdAutoLoopRef.current) clearInterval(mhdAutoLoopRef.current);
    };
  }, [cameraActive, autoMhdScanEnabled, detectedMhdCandidate, scannerMode]);

  const lookupBarcodeOnOpenFoodFacts = async (code) => {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) return;
    setScannedBarcode(cleanCode);
    setIsLookingUpProduct(true);
    try {
      const res = await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(cleanCode) + '.json');
      const data = await res.json();
      if (data && data.product) {
        const p = data.product;
        const foundName = p.product_name_de || p.product_name || p.generic_name_de || '';
        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const qty = p.quantity || '1x';
        const img = p.image_front_small_url || p.image_thumb_url
