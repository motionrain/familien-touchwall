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
        const img = p.image_front_small_url || p.image_thumb_url || '';
        const fullTitle = [brand, foundName].filter(Boolean).join(' ').trim();
        if (img) setScanImageUrl(img);
        if (fullTitle) {
          setScanName(fullTitle);
          setScanQty(qty);
          const freshMatch = estimateProduceByName(fullTitle);
          if (freshMatch && !scanExpiry) {
            const estDate = formatDateStr(addDays(new Date(), freshMatch.days));
            setScanExpiry(estDate);
            setDetectedMhdCandidate(estDate);
            setEstimatedMhdHint(freshMatch.emoji + ' Geschätztes MHD: +' + freshMatch.days + ' Tage (' + freshMatch.hint + ')');
          }
          playMobileBeep('scan');
          try { navigator.vibrate?.(50); } catch (e) {}
          showToast('Produkt erkannt!', fullTitle + ' – halte jetzt das MHD in den Rahmen!', getFoodEmoji(fullTitle));
          return;
        }
      }
      showToast('Barcode gescannt', 'Code ' + cleanCode + ' – jetzt MHD scannen.', '📷');
    } catch (e) {
      showToast('Barcode erfasst', 'Code: ' + cleanCode, '📷');
    } finally {
      setIsLookingUpProduct(false);
    }
  };

  const startLiveBarcodeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      const track = stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }

      streamRef.current = stream;
      setCameraActive(true);
      requestScreenWakeLock();
      getFastMhdOcrWorker().catch(() => {});

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);

      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'qr_code', 'upc_a', 'code_128']
        });
        scanLoopRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawVal = String(barcodes[0].rawValue || '').trim();
              const now = Date.now();
              if (rawVal && (rawVal !== lastScannedCodeRef.current || now - lastScanTimeRef.current > 6000)) {
                lastScannedCodeRef.current = rawVal;
                lastScanTimeRef.current = now;
                lookupBarcodeOnOpenFoodFacts(rawVal);
              }
            }
          } catch (err) {}
        }, 380);
      }
    } catch (err) {
      showToast('Kamera-Zugriff', 'Bitte erlaube den Kamera-Zugriff im Browser.', '⚠️');
    }
  };

  const handleReceiptPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningReceipt(true);
    showToast('Analysiere Kassenbon...', 'Texterkennung liest deine Einkäufe aus...', '🧾');

    try {
      if (typeof window !== 'undefined' && !window.Tesseract) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const result = await window.Tesseract.recognize(file, 'deu');
      const lines = String(result?.data?.text || '')
        .split(/\r?\n/)
        .map(l => l.replace(/[0-9]+[,.][0-9]{2}\s*[AB]?$/g, '').trim())
        .filter(l =>
          l.length >= 3 &&
          !/summe|gesamt|kartenzahlung|steuer|mwst|datum|uhrzeit|vielen dank|filiale|bon|eur|bar|rückgeld/i.test(l)
        );

      const extracted = lines.slice(0, 15).map((txt, idx) => {
        const freshEst = estimateProduceByName(txt);
        const estDays = freshEst ? freshEst.days : 7;
        return {
          id: 'rec_' + Date.now() + '_' + idx,
          name: txt,
          quantity: '1x',
          location: freshEst ? freshEst.location : 'fridge',
          category: freshEst ? freshEst.category : detectFoodCategory(txt),
          expiryDate: formatDateStr(addDays(new Date(), estDays)),
          selected: true
        };
      });

      setReceiptItems(extracted);
      showToast('Kassenbon gelesen!', extracted.length + ' Positionen erkannt – lege sie jetzt in den Einkaufswagen.', '✅');
    } catch (err) {
      showToast('Kassenbon-Hinweis', 'Bitte Foto bei gutem Licht aufnehmen.', '⚠️');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleNameInputChange = (val) => {
    setScanName(val);
    const matched = estimateProduceByName(val);
    if (matched) {
      const estDate = formatDateStr(addDays(new Date(), matched.days));
      setScanLocation(matched.location);
      setScanCategory(matched.category);
      if (!scanExpiry) {
        setScanExpiry(estDate);
        setDetectedMhdCandidate(estDate);
      }
      setEstimatedMhdHint(
        matched.emoji + ' ' + matched.name + ': Empfohlenes MHD +' + matched.days + ' Tage (' + matched.hint + ')'
      );
    } else {
      setEstimatedMhdHint('');
    }
  };

  // Legt das gescannte Produkt ganz oben in den Einkaufswagen!
  const triggerAddCurrentScanToCart = (overrideExpiry = '') => {
    const finalExp = overrideExpiry || scanExpiry || detectedMhdCandidate;
    const finalName = scanName.trim();
    if (!finalName || !finalExp) {
      showToast('Pflichtfelder', 'Bitte Produktname und Ablaufdatum (MHD) wählen.', '⚠️');
      return;
    }
    const resolvedCategory = scanCategory === 'auto' ? detectFoodCategory(finalName) : scanCategory;
    onAddSingleToCart(finalName, scannedBarcode, scanQty.trim(), scanLocation, resolvedCategory, finalExp, scanImageUrl);

    setScanName('');
    setScannedBarcode('');
    setScanCategory('auto');
    setScanExpiry('');
    setScanImageUrl('');
    setDetectedMhdCandidate('');
    setEstimatedMhdHint('');
    setLastOcrRawHint('');
    lastScannedCodeRef.current = '';
  };

  const detectedScanCatObj = FOOD_CATEGORIES.find(
    c => c.id === (scanCategory === 'auto' ? detectFoodCategory(scanName) : scanCategory)
  ) || FOOD_CATEGORIES[1];

  // Einkaufswagen sortiert nach "zuletzt gescannt" (neuester Eintrag immer ganz oben)
  const sortedCart = Array.isArray(cartItems)
    ? [...cartItems].sort((a, b) => Number(b.scannedAt || 0) - Number(a.scannedAt || 0))
    : [];

  return (
    <div className="space-y-3">
      {/* OBERE MODUS-WAHL */}
      <div className="flex items-center gap-1.5">
        <div className="grid grid-cols-3 gap-1 flex-1 p-1 rounded-2xl bg-black/35 border border-white/10">
          <button
            type="button"
            onClick={() => setScannerMode('barcode')}
            className={'py-2.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'barcode' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Barcode/MHD</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('object_ai')}
            className={'py-2.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'object_ai' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>🍎 Obst-KI</span>
          </button>
          <button
            type="button"
            onClick={() => { stopCameraStream(); setScannerMode('receipt'); }}
            className={'py-2.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ' + (scannerMode === 'receipt' ? 'tw-active-nav' : 'tw-nav-inactive')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>🧾 Bon</span>
          </button>
        </div>

        {scannerMode !== 'receipt' && (
          !cameraActive ? (
            <button
              type="button"
              onClick={startLiveBarcodeCamera}
              className="tw-active-nav px-3.5 py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 shrink-0 shadow-lg"
            >
              <Camera className="w-4 h-4" /> Kamera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCameraStream}
              className="px-3 py-3 rounded-2xl bg-rose-600 text-white text-xs font-black shrink-0 shadow-lg"
            >
              ✕ Aus
            </button>
          )
        )}
      </div>

      {scannerMode !== 'receipt' ? (
        <div className={'p-3.5 rounded-3xl border space-y-3 shadow-lg ' + themeStyles.card}>
          {cameraActive && (
            <div className="space-y-2">
              <div
                onClick={() => scannerMode === 'object_ai' ? recognizeProduceFromCamera() : captureMhdFromLiveCamera(false)}
                className="relative rounded-2xl overflow-hidden border-2 border-sky-400 bg-black aspect-[16/10] cursor-pointer"
              >
                <video
                  ref={videoRef}
                  style={zoomActive ? { transform: 'scale(1.85)', transformOrigin: 'center center' } : undefined}
                  className="w-full h-full object-cover transition-transform duration-200"
                  playsInline
                  muted
                />

                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-10">
                  <span className="text-[10px] font-black bg-black/75 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/40">
                    {scannerMode === 'object_ai'
                      ? '🍎 Obst/Gemüse (Gurke, Apfel, Salat...) zeigen'
                      : '🎯 Barcode / MHD-Datum in den Rahmen halten'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCameraZoom(); }}
                      className={'px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 border ' +
                        (zoomActive ? 'bg-sky-500 text-white border-white' : 'bg-black/75 text-white border-white/20')}
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> 2x
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCameraTorch(); }}
                      className={'px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 border ' +
                        (torchOn ? 'bg-amber-400 text-slate-950 border-white' : 'bg-black/75 text-white border-white/20')}
                    >
                      <Zap className="w-3.5 h-3.5" /> Licht
                    </button>
                  </div>
                </div>

                <div className="absolute inset-x-6 top-[26%] bottom-[26%] border-2 border-amber-400 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex flex-col justify-center">
                  <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_10px_#10b981] animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => captureMhdFromLiveCamera(false)}
                  disabled={isReadingMhd}
                  className="tw-active-nav min-h-[46px] py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <ScanLine className={'w-4 h-4 shrink-0 ' + (isReadingMhd ? 'animate-spin' : '')} />
                  <span>{isReadingMhd ? '⏳ Lese MHD...' : '📸 MHD ablesen'}</span>
                </button>

                <button
                  type="button"
                  onClick={recognizeProduceFromCamera}
                  disabled={isDetectingObject}
                  className="min-h-[46px] py-2.5 px-3 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Sparkles className={'w-4 h-4 shrink-0 ' + (isDetectingObject ? 'animate-spin' : '')} />
                  <span>{isDetectingObject ? '⏳ Erkenne...' : '🍎 Obst/Gemüse KI'}</span>
                </button>
              </div>

              {lastOcrRawHint && !detectedMhdCandidate && (
                <div className="text-[10px] text-slate-400 font-mono px-2 truncate">
                  Erkannte Zeichen: „{lastOcrRawHint}“
                </div>
              )}

              {detectedMhdCandidate && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-300">
                      📅 MHD: {detectedMhdCandidate.slice(8, 10)}.{detectedMhdCandidate.slice(5, 7)}.{detectedMhdCandidate.slice(0, 4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetectedMhdCandidate('')}
                      className="text-xs font-extrabold text-rose-300 px-2.5 py-1 rounded-lg bg-black/35"
                    >
                      Neu
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerAddCurrentScanToCart(detectedMhdCandidate)}
                    className="tw-active-nav w-full min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>🛒 Direkt in den Einkaufswagen legen</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 1-KLICK FRISCHE-LEISTE */}
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/35 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-300 block">
              🥒🍎 Frisches Obst & Gemüse (1-Klick inkl. MHD-Schätzung):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {FRESH_PRODUCE_MHD_DB.map(prod => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => applyFreshProduceSelection(prod, true)}
                  className="px-2.5 py-1.5 rounded-xl bg-black/35 border border-white/15 hover:border-emerald-400 flex items-center gap-1.5 shrink-0"
                >
                  <span className="text-base">{prod.emoji}</span>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-extrabold text-white">{prod.name.split(' ')[0]}</div>
                    <div className="text-[9px] font-black text-emerald-400">+{prod.days} Tage</div>
                  </div>
                </button>
              ))}
            </div>
            {estimatedMhdHint && (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-extrabold text-emerald-200">
                ✨ {estimatedMhdHint}
              </div>
            )}
          </div>

          {/* PRODUKT-EINGABEFORMULAR -> LEGT IN DEN EINKAUFSWAGEN AB */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerAddCurrentScanToCart();
            }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-12 h-12 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                {getFoodEmoji(scanName)}
              </span>
              <input
                type="text"
                required
                value={scanName}
                onChange={(e) => handleNameInputChange(e.target.value)}
                placeholder="Produktname (z.B. Gurke, Melone, Vollmilch)..."
                className={'w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-sm font-extrabold ' + themeStyles.input}
              />
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 flex items-center gap-1 bg-black/25 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setScanQty(stepMobileQty(scanQty, -1))}
                  className="tw-nav-inactive w-10 h-10 rounded-xl font-black text-base flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="text"
                  value={scanQty}
                  onChange={(e) => setScanQty(e.target.value)}
                  className="w-full bg-transparent text-center text-xs font-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setScanQty(stepMobileQty(scanQty, 1))}
                  className="tw-glow-btn w-10 h-10 rounded-xl font-black text-base flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>

              <select
                value={scanCategory}
                onChange={(e) => setScanCategory(e.target.value)}
                className={'col-span-7 min-h-[48px] px-3 py-2.5 rounded-2xl border text-xs font-extrabold ' + themeStyles.input}
              >
                <option value="auto" className="bg-slate-800 text-amber-300">
                  ✨ {detectedScanCatObj.icon} {detectedScanCatObj.title}
                </option>
                {FOOD_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                    {cat.icon} {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {STORAGE_PILLS.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setScanLocation(loc.id)}
                  className={'min-h-[44px] py-2 px-1.5 rounded-xl text-xs font-extrabold ' +
                    (scanLocation === loc.id ? 'tw-active-nav' : 'tw-nav-inactive')}
                >
                  {loc.label}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-amber-300">
                  📅 Pflicht-Ablaufdatum (MHD)
                </label>
                {scanExpiry && (
                  <span className="text-xs font-black text-emerald-400">
                    ✓ {scanExpiry.slice(8, 10)}.{scanExpiry.slice(5, 7)}.{scanExpiry.slice(0, 4)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { l: '+3 Tage', d: 3 },
                  { l: '+5 Tage', d: 5 },
                  { l: '+1 Woche', d: 7 },
                  { l: '+10 Tage', d: 10 },
                  { l: '+2 Wo.', d: 14 },
                  { l: '+1 Monat', d: 30 },
                  { l: '+6 Mon.', d: 180 },
                  { l: '+1 Jahr', d: 365 }
                ].map(b => (
                  <button
                    key={b.d}
                    type="button"
                    onClick={() => {
                      const d = formatDateStr(addDays(new Date(), b.d));
                      setScanExpiry(d);
                      setDetectedMhdCandidate(d);
                    }}
                    className="tw-glow-btn min-h-[42px] py-2 rounded-xl text-[11px] font-black"
                  >
                    {b.l}
                  </button>
                ))}
              </div>

              <input
                type="date"
                required
                min={todayStr}
                value={scanExpiry}
                onChange={(e) => {
                  setScanExpiry(e.target.value);
                  setDetectedMhdCandidate(e.target.value);
                }}
                className={'w-full min-h-[46px] px-3.5 py-2 rounded-xl border text-sm font-black ' + themeStyles.input}
              />
            </div>

            <button
              type="submit"
              disabled={!scanName.trim() || (!scanExpiry && !detectedMhdCandidate)}
              className={'w-full min-h-[54px] py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 ' +
                (!scanName.trim() || (!scanExpiry && !detectedMhdCandidate) ? 'bg-slate-700 text-slate-400 opacity-50' : 'tw-active-nav')}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {(scanExpiry || detectedMhdCandidate)
                  ? ('🛒 In den Einkaufswagen legen (' + (scanExpiry || detectedMhdCandidate).slice(8, 10) + '.' + (scanExpiry || detectedMhdCandidate).slice(5, 7) + '.)')
                  : '⚠️ Erst Ablaufdatum (MHD) wählen'}
              </span>
            </button>
          </form>
        </div>
      ) : (
        /* KASSENBON-SCANNER -> LEGT EBENFALLS ZUERST IN DEN EINKAUFSWAGEN AB */
        <div className={'p-4 rounded-3xl border space-y-3.5 shadow-md ' + themeStyles.card}>
          <h2 className="font-black text-base">🧾 Kassenbon abfotografieren</h2>
          <label className="tw-active-nav w-full min-h-[52px] py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg">
            <Camera className="w-5 h-5" />
            <span>{isScanningReceipt ? '⏳ Lese Kassenbon aus...' : '📸 Kassenbon jetzt fotografieren'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptPhotoUpload}
            />
          </label>

          {receiptItems.length > 0 && (
            <div className="space-y-2.5 pt-2">
              {receiptItems.map((rit, idx) => (
                <div key={rit.id} className={'p-3 rounded-2xl border space-y-2 ' + themeStyles.subtle}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rit.selected}
                      onChange={() => {
                        const next = [...receiptItems];
                        next[idx].selected = !next[idx].selected;
                        setReceiptItems(next);
                      }}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <input
                      type="text"
                      value={rit.name}
                      onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx].name = e.target.value;
                        setReceiptItems(next);
                      }}
                      className="flex-1 bg-transparent text-xs font-extrabold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pl-7">
                    <div className="flex gap-1">
                      {[
                        { l: '+5T', d: 5 },
                        { l: '+1W', d: 7 },
                        { l: '+2W', d: 14 },
                        { l: '+1M', d: 30 }
                      ].map(b => (
                        <button
                          key={b.d}
                          type="button"
                          onClick={() => {
                            const next = [...receiptItems];
                            next[idx].expiryDate = formatDateStr(addDays(new Date(), b.d));
                            setReceiptItems(next);
                          }}
                          className="tw-glow-btn px-2 py-1 rounded-lg text-[10px] font-black"
                        >
                          {b.l}
                        </button>
                      ))}
                    </div>

                    <input
                      type="date"
                      required
                      value={rit.expiryDate}
                      onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx].expiryDate = e.target.value;
                        setReceiptItems(next);
                      }}
                      className={'px-2.5 py-1 rounded-lg border text-xs font-bold ' + themeStyles.input}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const selected = receiptItems.filter(it => it.selected && it.name.trim() && it.expiryDate);
                  if (selected.length === 0) return;
                  onAddBatchToCart(selected);
                  setReceiptItems([]);
                }}
                className="tw-active-nav w-full min-h-[50px] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>🛒 Markierte Bon-Artikel in den Einkaufswagen legen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          EINKAUFSWAGEN! DIREKT UNTER DEM SCANNER (ZULETZT GESCANNT OBEN!)
         ========================================================= */}
      <div className={'p-3.5 rounded-3xl border space-y-2.5 ' + themeStyles.card}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-xs uppercase text-amber-400 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              <span>🛒 Einkaufswagen ({sortedCart.length})</span>
            </span>
            <p className="text-[10px] opacity-70 font-semibold">
              Zuletzt gescanntes Produkt steht immer ganz oben
            </p>
          </div>

          {sortedCart.length > 0 && (
            <button
              type="button"
              disabled={isSyncing}
              onClick={onTransferAllCartToStock}
              className="tw-active-nav px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Alle in Bestand ({sortedCart.length})</span>
            </button>
          )}
        </div>

        {sortedCart.length === 0 ? (
          <div className="py-5 text-center text-xs opacity-50 font-bold">
            🛒 Dein Einkaufswagen ist noch leer. Scanne oben ein Produkt oder einen Kassenbon!
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedCart.map((cItem, idx) => (
              <div
                key={cItem.id}
                className={'px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ' +
                  (idx === 0 ? 'border-amber-400/70 bg-amber-500/10' : themeStyles.subtle)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xl shrink-0">{getFoodEmoji(cItem.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                          NEU
                        </span>
                      )}
                      <span className="font-extrabold text-xs truncate">{cItem.name}</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-bold">
                      {cItem.quantity} • MHD: {cItem.expiryDate.slice(8, 10)}.{cItem.expiryDate.slice(5, 7)}.{cItem.expiryDate.slice(2, 4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onTransferSingleCartItemToStock(cItem)}
                    title="Einzeln in den Bestand übernehmen"
                    className="tw-glow-btn px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Bestand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCartItem(cItem.id)}
                    className="tw-nav-inactive p-1.5 rounded-xl text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
