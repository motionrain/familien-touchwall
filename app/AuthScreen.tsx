// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock, KeyRound, UserPlus, ShieldCheck, Sparkles,
  Mail, RotateCcw, ArrowLeft, CheckCircle2, Smartphone
} from 'lucide-react';

const SHOW_OAUTH_UI = process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true';

export const TOUCHWALL_GLOBAL_STYLES = [
  '@keyframes twShockwave {',
  '  0% { transform: translate(-50%, -50%) scale(0.15); opacity: 0.9; }',
  '  100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }',
  '}',
  '.tw-glow-card, .tw-glow-subtle {',
  '  transition: background-color 0.2s ease, border-color 0.2s ease;',
  '}',
  '.tw-glow-subtle.cursor-pointer {',
  '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, border-color 0.18s ease;',
  '}',
  '.tw-glow-subtle.cursor-pointer:hover {',
  '  transform: translateY(-1.5px) scale(1.01);',
  '  border-color: var(--tw-btn-border) !important;',
  '  box-shadow: 0 6px 18px -4px var(--tw-btn-glow), inset 0 1px 1px rgba(255, 255, 255, 0.2);',
  '}',
  '.tw-glow-subtle.cursor-pointer:active {',
  '  transform: scale(0.965) translateY(1px) !important;',
  '  box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.6), 0 0 10px var(--tw-btn-glow) !important;',
  '}',
  '.tw-glow-btn, .tw-theme-btn, button.bg-indigo-600, button.bg-sky-500, button.bg-emerald-600, button.bg-emerald-500, label.tw-glow-btn {',
  '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 24%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 24%, var(--tw-btn-rest-base)) 100%) !important;',
  '  color: var(--tw-btn-rest-text) !important;',
  '  border: 1px solid color-mix(in srgb, var(--tw-btn-border) 32%, transparent) !important;',
  '  box-shadow: none !important;',
  '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s cubic-bezier(0.22, 1, 0.36, 1), background 0.18s ease, border-color 0.18s ease, color 0.18s ease !important;',
  '}',
  '.tw-nav-inactive {',
  '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 12%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 12%, var(--tw-btn-rest-base)) 100%);',
  '  border: 1px solid rgba(255, 255, 255, 0.12);',
  '  box-shadow: none !important;',
  '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;',
  '}',
  '.tw-active-nav {',
  '  background: linear-gradient(135deg, color-mix(in srgb, var(--tw-btn-from) 46%, var(--tw-btn-rest-base)) 0%, color-mix(in srgb, var(--tw-btn-to) 46%, var(--tw-btn-rest-base)) 100%) !important;',
  '  color: #ffffff !important;',
  '  border: 1.5px solid color-mix(in srgb, var(--tw-btn-border) 70%, transparent) !important;',
  '  box-shadow: none !important;',
  '  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease !important;',
  '}',
  '.tw-glow-btn:hover, .tw-theme-btn:hover, .tw-nav-inactive:hover, .tw-active-nav:hover, button.bg-indigo-600:hover, button.bg-sky-500:hover, button.bg-emerald-600:hover, button.bg-emerald-500:hover, label.tw-glow-btn:hover {',
  '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
  '  color: #ffffff !important;',
  '  border-color: var(--tw-btn-border) !important;',
  '  transform: translateY(-2px) scale(1.035);',
  '  box-shadow: 0 10px 24px -2px var(--tw-btn-glow), 0 0 18px var(--tw-btn-glow), inset 0 1px 3px rgba(255, 255, 255, 0.5) !important;',
  '}',
  'button:active, .tw-glow-btn:active, .tw-nav-inactive:active, .tw-active-nav:active, label.tw-glow-btn:active {',
  '  background: linear-gradient(135deg, var(--tw-btn-from) 0%, var(--tw-btn-to) 100%) !important;',
  '  color: #ffffff !important;',
  '  transform: scale(0.94) translateY(1.5px) !important;',
  '  box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.65), 0 0 14px var(--tw-btn-glow) !important;',
  '  transition: transform 0.06s ease-out, box-shadow 0.06s ease-out !important;',
  '}'
].join('\n');

export function writeAuthSession(accountId, authKey, familyName) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    if (typeof document !== 'undefined') {
      document.cookie = 'tw_auth_session=1; path=/; max-age=' + maxAge + '; SameSite=Lax';
      document.cookie = 'tw_account_id=' + encodeURIComponent(accountId || 'local') + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('richter_tw_auth_active', '1');
      localStorage.setItem('richter_tw_account_id', accountId || 'local');
      localStorage.setItem('richter_tw_auth_key', authKey || '');
      if (familyName) localStorage.setItem('richter_tw_family_name', familyName);
    }
  } catch (e) {}
}

export function readAuthSession() {
  try {
    if (typeof localStorage === 'undefined') return { active: false, accountId: '', authKey: '' };
    const cookieActive = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('tw_auth_session=1'));
    const storageActive = localStorage.getItem('richter_tw_auth_active') === '1';
    return {
      active: Boolean(cookieActive || storageActive),
      accountId: localStorage.getItem('richter_tw_account_id') || '',
      authKey: localStorage.getItem('richter_tw_auth_key') || ''
    };
  } catch (e) {
    return { active: false, accountId: '', authKey: '' };
  }
}

export function clearAuthSession() {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = 'tw_auth_session=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'tw_account_id=; path=/; max-age=0; SameSite=Lax';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('richter_tw_auth_active');
      localStorage.removeItem('richter_tw_account_id');
      localStorage.removeItem('richter_tw_auth_key');
    }
  } catch (e) {}
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="9.2" height="9.2" fill="#F25022" />
      <rect x="12.8" y="2" width="9.2" height="9.2" fill="#7FBA00" />
      <rect x="2" y="12.8" width="9.2" height="9.2" fill="#00A4EF" />
      <rect x="12.8" y="12.8" width="9.2" height="9.2" fill="#FFB900" />
    </svg>
  );
}

export default function AuthScreen({
  isCheckingAuth,
  spawnTouchRipple = () => {},
  themeStyles = {},
  authTab = 'login',
  setAuthTab = () => {},
  loginError = '',
  setLoginError = () => {},
  formUsername = '',
  setFormUsername = () => {},
  formPassword = '',
  setFormPassword = () => {},
  formEmail = '',
  setFormEmail = () => {},
  loginFamilyName = '',
  setLoginFamilyName = () => {},
  setupMemberNames = ['Mama / Person 1', 'Papa / Person 2', 'Kind 1', 'Kind 2'],
  setSetupMemberNames = () => {},
  isLoggingIn = false,
  handleAccountLoginSubmit,
  handleRegisterSubmit,
  handleInstantLocalStart = null,
  returnTo = '/',
  isPocket = false
}) {
  const [showResetView, setShowResetView] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'confirm' | 'done'
  const [resetBusy, setResetBusy] = useState(false);
  const [resetInfo, setResetInfo] = useState('');
  const [resetError, setResetError] = useState('');

  const openResetView = () => {
    setLoginError('');
    setResetError('');
    setResetInfo('');
    setResetIdentifier(formUsername || formEmail || '');
    setResetCode('');
    setResetNewPassword('');
    setResetStep('request');
    setShowResetView(true);
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetInfo('');
    const cleanId = resetIdentifier.trim();
    if (!cleanId) {
      setResetError('Bitte gib deinen Benutzernamen oder deine E-Mail-Adresse ein.');
      return;
    }

    setResetBusy(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'requestReset', identifier: cleanId })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setResetError(json?.error || 'Konto konnte nicht gefunden werden.');
        return;
      }
      setResetInfo(json.message || 'Code angefordert. Gib deinen Reset- oder Notfall-Code unten ein.');
      setResetStep('confirm');
    } catch {
      setResetError('Verbindungsfehler beim Anfordern des Reset-Codes.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetInfo('');
    if (!resetCode.trim()) {
      setResetError('Bitte gib den 6-stelligen E-Mail-Code oder deinen Notfall-Code (TW-...) ein.');
      return;
    }
    if (resetNewPassword.trim().length < 4) {
      setResetError('Das neue Passwort / PIN muss mindestens 4 Zeichen lang sein.');
      return;
    }

    setResetBusy(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmReset',
          identifier: resetIdentifier.trim(),
          code: resetCode.trim(),
          newPassword: resetNewPassword.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setResetError(json?.error || 'Code ungültig oder abgelaufen.');
        return;
      }
      if (json.accountId) setFormUsername(json.accountId);
      setFormPassword('');
      setResetInfo(json.message || 'Passwort erfolgreich zurückgesetzt!');
      setResetStep('done');
    } catch {
      setResetError('Verbindungsfehler beim Zurücksetzen.');
    } finally {
      setResetBusy(false);
    }
  };

  const startOAuthLogin = (provider) => {
    if (typeof window === 'undefined') return;
    const url =
      '/api/oauth/start?provider=' +
      encodeURIComponent(provider) +
      '&intent=login&returnTo=' +
      encodeURIComponent(returnTo || '/');
    window.location.href = url;
  };

  if (isCheckingAuth) {
    return (
      <div className="w-screen h-screen bg-[#15181c] text-slate-100 flex items-center justify-center">
        <div className="text-sm font-extrabold opacity-70 animate-pulse">
          {isPocket ? '📱 Lade Touchwall Pocket...' : '🔒 Prüfe Anmeldung...'}
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={spawnTouchRipple}
      style={{
        '--tw-btn-from': themeStyles.btnFrom || '#0ea5e9',
        '--tw-btn-to': themeStyles.btnTo || '#4f46e5',
        '--tw-btn-border': themeStyles.btnBorder || '#38bdf8',
        '--tw-btn-glow': themeStyles.btnGlow || 'rgba(56, 189, 248, 0.5)',
        '--tw-btn-rest-base': '#1e222d',
        '--tw-btn-rest-text': '#e2e8f0'
      }}
      className="w-screen min-h-[100dvh] bg-[#12151a] text-slate-100 flex items-center justify-center p-4 overflow-y-auto select-none"
    >
      <style>{TOUCHWALL_GLOBAL_STYLES}</style>

      <div className={'w-full rounded-3xl border-2 border-slate-700/80 bg-[#1c2128] p-5 sm:p-7 shadow-2xl space-y-5 my-auto ' + (isPocket ? 'max-w-md' : 'max-w-xl')}>
        {/* KOPFZEILE */}
        <div className="flex items-center gap-3.5 border-b border-slate-700/80 pb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            {isPocket ? <Smartphone className="w-6 h-6 text-white" /> : <Lock className="w-7 h-7 text-white" />}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-extrabold border border-emerald-400/30">
              {isPocket ? '📱 Touchwall Pocket • App & Scanner' : '☁️ Familien-Touchwall Cloud • Kostenlos & Privat'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {showResetView ? 'Passwort zurücksetzen' : 'Anmelden oder Registrieren'}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {showResetView
                ? 'Per E-Mail-Code oder persönlichem Notfall-Recovery-Code (TW-...)'
                : SHOW_OAUTH_UI
                ? 'Klassisch mit Benutzername oder mit 1 Klick über Google / Outlook.'
                : 'Melde dich mit deinem Familien-Benutzernamen an oder erstelle ein neues Konto.'}
            </p>
          </div>
        </div>

        {/* PASSWORT-RESET ANSICHT */}
        {showResetView ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { setShowResetView(false); setResetError(''); setResetInfo(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück zur Anmeldung</span>
            </button>

            {resetError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
                ⚠️ {resetError}
              </div>
            )}

            {resetInfo && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-extrabold">
                ✅ {resetInfo}
              </div>
            )}

            {resetStep === 'done' ? (
              <div className="p-5 rounded-2xl bg-[#151920] border border-emerald-500/40 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <div className="text-sm font-black text-white">Dein neues Passwort ist aktiv!</div>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetView(false);
                    setAuthTab('login');
                  }}
                  className="tw-active-nav w-full py-3.5 rounded-2xl font-black text-sm cursor-pointer"
                >
                  🔓 Jetzt mit neuem Passwort anmelden
                </button>
              </div>
            ) : resetStep === 'request' ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                      👤 Benutzername oder hinterlegte E-Mail
                    </label>
                    <input
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="z.B. richters oder name@mail.de"
                      className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Wenn für dein Konto eine E-Mail hinterlegt ist, senden wir dir einen 6-stelligen Reset-Code. Alternativ kannst du im nächsten Schritt direkt deinen gespeicherten Notfall-Code (<code>TW-...</code>) eingeben.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetBusy}
                  className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>{resetBusy ? 'Prüfe Konto...' : '📨 Reset-Code anfordern / Weiter'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetStep('confirm')}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-extrabold text-amber-300 cursor-pointer"
                >
                  🔑 Ich habe bereits einen Code (Mail-Code oder TW-Notfallcode)
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                      👤 Konto (Benutzername oder E-Mail)
                    </label>
                    <input
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="Benutzername oder E-Mail"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-amber-400 mb-1">
                      🔑 6-stelliger E-Mail-Code oder Notfall-Code (TW-...)
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="z.B. 482910 oder TW-ABCD-EFGH-JKLM"
                      className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-black tracking-wider text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-emerald-400 mb-1">
                      🔒 Neues Passwort / PIN
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Mindestens 4 Zeichen"
                      className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetBusy}
                  className="tw-active-nav w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{resetBusy ? 'Speichere neues Passwort...' : '✅ Neues Passwort speichern'}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* TAB-UMSCHALTER: ANMELDEN / REGISTRIEREN */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-[#13171c] border border-slate-700/70">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setLoginError(''); }}
                className={'py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ' + (authTab === 'login' ? 'tw-active-nav' : 'tw-nav-inactive text-slate-400')}
              >
                <KeyRound className="w-4 h-4" />
                <span>🔑 Anmelden</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setLoginError(''); }}
                className={'py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ' + (authTab === 'register' ? 'tw-active-nav' : 'tw-nav-inactive text-slate-400')}
              >
                <UserPlus className="w-4 h-4" />
                <span>✨ Neu registrieren</span>
              </button>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
                ⚠️ {loginError}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleAccountLoginSubmit} className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                      👤 Familien-Benutzername
                    </label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="z.B. richters oder familie-mueller"
                      className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-extrabold uppercase text-amber-400">
                        🔒 Passwort / Familien-PIN
                      </label>
                      <button
                        type="button"
                        onClick={openResetView}
                        className="text-[11px] font-extrabold text-sky-400 hover:underline cursor-pointer"
                      >
                        Passwort vergessen?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Dein Passwort..."
                      className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isLoggingIn ? 'Melde an & lade eure Touchwall...' : '🔓 Jetzt anmelden'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-sky-400 mb-1">
                        1. Gewünschter Login-Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="z.B. familie-mueller"
                        className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-amber-400 mb-1">
                        2. Passwort / PIN festlegen
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Mindestens 4 Zeichen"
                        className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-emerald-400 mb-1">
                        3. Anzeigename Touchwall
                      </label>
                      <input
                        type="text"
                        value={loginFamilyName}
                        onChange={(e) => setLoginFamilyName(e.target.value)}
                        placeholder="z.B. Familie Müller"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-cyan-400 mb-1">
                        4. E-Mail (für Passwort-Reset)
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="optional: name@mail.de"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {!isPocket && Array.isArray(setupMemberNames) && setupMemberNames.length > 0 && (
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-purple-300 mb-1.5">
                        5. Eure Familienmitglieder (Später jederzeit anpassbar)
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {setupMemberNames.map((mName, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0e1116] border border-slate-700">
                            <span className="text-base">{['👨', '👩', '👦', '👧'][idx % 4]}</span>
                            <input
                              type="text"
                              value={mName}
                              onChange={(e) => {
                                const next = [...setupMemberNames];
                                next[idx] = e.target.value;
                                setSetupMemberNames(next);
                              }}
                              placeholder={'Person ' + (idx + 1)}
                              className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="tw-glow-btn w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isLoggingIn ? 'Erstelle euer Familien-Konto...' : '✨ Kostenloses Konto erstellen & sofort starten'}</span>
                </button>
              </form>
            )}

            {/* GOOGLE & OUTLOOK OAUTH DIREKT-LOGIN (ÜBER SHOW_OAUTH_UI STEUERBAR) */}
            {SHOW_OAUTH_UI && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-700/80" />
                  <span className="text-[11px] font-extrabold uppercase text-slate-400">
                    oder direkt weiter mit
                  </span>
                  <div className="h-px flex-1 bg-slate-700/80" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => startOAuthLogin('google')}
                    className="py-3 px-3.5 rounded-2xl bg-[#151920] hover:bg-[#1f2631] border border-slate-700 text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startOAuthLogin('microsoft')}
                    className="py-3 px-3.5 rounded-2xl bg-[#151920] hover:bg-[#1f2631] border border-slate-700 text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MicrosoftIcon />
                    <span>Outlook / MS</span>
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-semibold">
                  Google & Outlook kannst du nach einer normalen Registrierung auch jederzeit unter „Konten“ nachträglich verknüpfen.
                </p>
              </div>
            )}

            {/* FUSSZEILE: PASSWORT-RESET & LOKALER MODUS */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={openResetView}
                className="text-amber-300 hover:underline font-extrabold cursor-pointer"
              >
                🔑 Passwort zurücksetzen
              </button>

              {typeof handleInstantLocalStart === 'function' && !isPocket && (
                <button
                  type="button"
                  onClick={handleInstantLocalStart}
                  className="text-sky-400 hover:underline font-extrabold cursor-pointer"
                >
                  🚀 Nur lokal ohne Konto testen
                </button>
              )}
            </div>
          </>
        )}

        {/* RECHTLICHE LINKS (IMMER SICHTBAR FÜR GOOGLE / MICROSOFT OAUTH-PRÜFUNG) */}
        <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
          <Link href="/datenschutz" className="hover:text-sky-300 hover:underline transition-colors">
            🔒 Datenschutzerklärung
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/nutzungsbedingungen" className="hover:text-sky-300 hover:underline transition-colors">
            📄 Nutzungsbedingungen
          </Link>
        </div>
      </div>
    </div>
  );
}
