// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie, ShieldCheck, SlidersHorizontal, Check, X } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'tw_cookie_consent_v1';
const CONSENT_COOKIE_NAME = 'tw_cookie_consent';
const CONSENT_VERSION = '1.0';

function persistConsentChoice(prefs) {
  const record = {
    version: CONSENT_VERSION,
    necessary: true,
    preferences: Boolean(prefs.preferences),
    external: Boolean(prefs.external),
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch (e) {}

  try {
    const maxAge = 60 * 60 * 24 * 180; // 6 Monate gültig
    document.cookie =
      CONSENT_COOKIE_NAME +
      '=' +
      encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, p: record.preferences ? 1 : 0, e: record.external ? 1 : 0 })) +
      '; path=/; max-age=' +
      maxAge +
      '; SameSite=Lax';
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('tw-cookie-consent-changed', { detail: record }));
  } catch (e) {}

  return record;
}

export function openCookieSettingsModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tw-open-cookie-settings'));
  }
}

export default function CookieBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [allowPreferences, setAllowPreferences] = useState(true);
  const [allowExternal, setAllowExternal] = useState(true);
  const [hasExistingChoice, setHasExistingChoice] = useState(false);

  const isLegalPage = pathname === '/datenschutz' || pathname === '/nutzungsbedingungen';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === CONSENT_VERSION) {
          setAllowPreferences(Boolean(parsed.preferences));
          setAllowExternal(Boolean(parsed.external));
          setHasExistingChoice(true);
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
    } catch (e) {
      setIsVisible(true);
    }

    const handleReopen = () => {
      try {
        const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setAllowPreferences(Boolean(parsed.preferences));
          setAllowExternal(Boolean(parsed.external));
          setHasExistingChoice(true);
        }
      } catch (e) {}
      setShowDetails(true);
      setIsVisible(true);
    };

    window.addEventListener('tw-open-cookie-settings', handleReopen);
    return () => window.removeEventListener('tw-open-cookie-settings', handleReopen);
  }, []);

  const handleAcceptAll = () => {
    persistConsentChoice({ preferences: true, external: true });
    setAllowPreferences(true);
    setAllowExternal(true);
    setHasExistingChoice(true);
    setShowDetails(false);
    setIsVisible(false);
  };

  const handleNecessaryOnly = () => {
    persistConsentChoice({ preferences: false, external: false });
    setAllowPreferences(false);
    setAllowExternal(false);
    setHasExistingChoice(true);
    setShowDetails(false);
    setIsVisible(false);
  };

  const handleSaveSelection = () => {
    persistConsentChoice({ preferences: allowPreferences, external: allowExternal });
    setHasExistingChoice(true);
    setShowDetails(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-[9990] p-3 sm:p-5 flex justify-center ' +
        (isLegalPage ? 'pointer-events-none' : 'inset-0 items-end sm:items-center bg-black/65 backdrop-blur-xs')
      }
    >
      <div
        role="dialog"
        aria-modal={!isLegalPage}
        aria-label="Cookie- und Datenschutzeinstellungen"
        className="pointer-events-auto w-full max-w-xl rounded-3xl border-4 border-slate-700/90 bg-[#382014] text-slate-100 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
      >
        {/* KOPFZEILE */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                🔒 Datenschutz & Cookies (DSGVO / TDDDG)
              </span>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                Cookie- & Speicher-Einstellungen
              </h2>
            </div>
          </div>

          {hasExistingChoice && (
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Schließen"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ERKLÄRTEXT */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          Wir nutzen technisch notwendige Cookies und den lokalen Browser-Speicher (<code>localStorage</code>), damit deine Anmeldung, die Cloud-Synchronisation und der Offline-Modus auf Touchwall und Handy zuverlässig funktionieren. Optional speichern wir Komfort-Einstellungen (z. B. Theme &amp; Filter) sowie freiwillig verbundene externe Dienste. Es findet <strong>kein Werbe-Tracking</strong> statt.
        </p>

        {/* DETAIL-EINSTELLUNGEN (AUFKLAPPBAR) */}
        {showDetails && (
          <div className="space-y-2.5 pt-1">
            {/* Kategorie 1: Technisch notwendig */}
            <div className="p-3.5 rounded-2xl bg-[#11151b] border border-slate-700/80 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. Technisch notwendig (Immer aktiv)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Erforderlich für Login-Sitzung (<code>tw_auth_session</code>, <code>tw_account_id</code>), Sicherheits-Tokens, Offline-Zwischenspeicher und diese Cookie-Auswahl (§ 25 Abs. 2 TDDDG).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black shrink-0">
                Aktiv
              </span>
            </div>

            {/* Kategorie 2: Komfort & Design */}
            <label className="p-3.5 rounded-2xl bg-[#11151b] border border-slate-700/80 flex items-start justify-between gap-3 cursor-pointer">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-black text-white">
                  2. Komfort &amp; Personalisierung
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Merkt sich lokal dein gewähltes Design-Theme, Personen-Filter, Alarm-Status und den mobilen Einkaufswagen direkt auf diesem Gerät.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowPreferences}
                onChange={(e) => setAllowPreferences(e.target.checked)}
                className="mt-1 w-5 h-5 accent-sky-500 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Kategorie 3: Externe Integrationen */}
            <label className="p-3.5 rounded-2xl bg-[#11151b] border border-slate-700/80 flex items-start justify-between gap-3 cursor-pointer">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-black text-white">
                  3. Externe Integrationen (Optional)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ermöglicht freiwillig genutzte Verbindungen zu externen Diensten wie Kalender-Synchronisation (Google/Outlook/ICS), Todoist oder Produktdaten-Abfragen beim Barcode-Scan.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowExternal}
                onChange={(e) => setAllowExternal(e.target.checked)}
                className="mt-1 w-5 h-5 accent-sky-500 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>
        )}

        {/* AKTIONEN (GLEICHWERTIGE BUTTONS OHNE DARK PATTERNS) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleNecessaryOnly}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs sm:text-sm font-extrabold cursor-pointer transition-colors"
          >
            Nur notwendige
          </button>

          {showDetails ? (
            <button
              type="button"
              onClick={handleSaveSelection}
              className="flex-1 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Auswahl speichern</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Einstellungen</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 border border-sky-400/70 text-white text-xs sm:text-sm font-black shadow-lg cursor-pointer transition-all"
          >
            Alle akzeptieren
          </button>
        </div>

        {/* RECHTLICHE LINKS */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
          <span>Du kannst deine Auswahl jederzeit ändern.</span>
          <div className="flex items-center gap-3">
            <Link href="/datenschutz" className="text-sky-400 hover:underline">
              Datenschutzerklärung
            </Link>
            <span className="opacity-30">•</span>
            <Link href="/nutzungsbedingungen" className="text-sky-400 hover:underline">
              Nutzungsbedingungen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
