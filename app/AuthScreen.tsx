// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';
import { Lock, KeyRound, UserPlus, ShieldCheck, Sparkles } from 'lucide-react';

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

export default function AuthScreen({
  isCheckingAuth,
  spawnTouchRipple,
  themeStyles,
  authTab,
  setAuthTab,
  loginError,
  setLoginError,
  formUsername,
  setFormUsername,
  formPassword,
  setFormPassword,
  loginFamilyName,
  setLoginFamilyName,
  setupMemberNames,
  setSetupMemberNames,
  isLoggingIn,
  handleAccountLoginSubmit,
  handleRegisterSubmit,
  handleInstantLocalStart
}) {
  if (isCheckingAuth) {
    return (
      <div className="w-screen h-screen bg-[#15181c] text-slate-100 flex items-center justify-center">
        <div className="text-sm font-extrabold opacity-70 animate-pulse">🔒 Prüfe Anmeldung...</div>
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
      className="w-screen h-screen bg-[#12151a] text-slate-100 flex items-center justify-center p-4 overflow-y-auto select-none"
    >
      <style>{TOUCHWALL_GLOBAL_STYLES}</style>

      <div className="w-full max-w-xl rounded-3xl border-2 border-slate-700/80 bg-[#1c2128] p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <div className="flex items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-400/30">
                ☁️ Familien-Touchwall Cloud • Kostenlos & Privat
              </span>
              <h1 className="text-2xl font-black mt-1">Anmelden oder Registrieren</h1>
              <p className="text-xs text-slate-400 font-semibold">
                Jede Familie erhält ihren eigenen, passwortgeschützten Bereich. Keine Einrichtung von Google-Skripten nötig!
              </p>
            </div>
          </div>
        </div>

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
                  placeholder="z.B. familie-richter oder mueller"
                  className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-amber-400 mb-1">
                  🔒 Passwort / Familien-PIN
                </label>
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

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Noch kein Konto? Oben auf „Neu registrieren“ klicken.</span>
              <button
                type="button"
                onClick={handleInstantLocalStart}
                className="text-sky-400 hover:underline font-extrabold cursor-pointer"
              >
                🚀 Nur lokal ohne Konto testen
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#151920] border border-slate-700/70 space-y-4">
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
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mindestens 4 Zeichen"
                    className="w-full px-4 py-3 rounded-xl bg-[#0e1116] border border-slate-700 text-sm font-bold text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-emerald-400 mb-1">
                  3. Anzeigename eurer Touchwall
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
                <label className="block text-xs font-extrabold uppercase text-purple-300 mb-1.5">
                  4. Eure Familienmitglieder (Später jederzeit anpassbar)
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
      </div>
    </div>
  );
}
