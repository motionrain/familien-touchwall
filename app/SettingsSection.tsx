// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Cloud, Check, Plus, ChevronDown } from 'lucide-react';
import { COLOR_PALETTES, PAGE_THEMES, AVATAR_EMOJIS } from './touchwallConfig';

const CALENDAR_PROVIDERS = [
  { id: 'outlook', label: '🟦 Microsoft Outlook / Hotmail (.ics Link)', placeholder: 'https://outlook.live.com/owa/calendar/.../reachcalendar.ics' },
  { id: 'google',  label: '🔵 Google Kalender (E-Mail / ID oder .ics Link)', placeholder: 'name@gmail.com oder https://calendar.google.com/calendar/ical/.../basic.ics' },
  { id: 'apple',   label: '🍎 Apple iCloud Kalender (webcal:// oder .ics Link)', placeholder: 'webcal://p12-caldav.icloud.com/published/2/...' },
  { id: 'school',  label: '🏫 Schule / WebUntis / Verein (.ics Link)', placeholder: 'https://... (.ics Kalender-Link)' }
];

export default function SettingsSection({
  activeSection,
  members,
  setMembers,
  currentTheme,
  setCurrentTheme,
  customLogoUrl,
  setCustomLogoUrl,
  handleLogoUpload,
  handleMemberPhotoUpload,
  restoreScreenshotDefaults,
  appsScriptUrl,
  setAppsScriptUrl,
  todoistConfig,
  setTodoistConfig,
  connectAndDiscoverTodoist,
  runAllPermissionsTest,
  isTestingDiag,
  pullFromCloud,
  pushToCloudAndDrive,
  addExtraCalendarAccount,
  importBackupJson,
  exportBackupJson,
  themeStyles,
  getMemberStyles,
  renderAvatar
}) {
  const [addingCalForMember, setAddingCalForMember] = useState(null);
  const [newCalProvider, setNewCalProvider] = useState('outlook');
  const [newCalLabel, setNewCalLabel] = useState('');
  const [newCalUrl, setNewCalUrl] = useState('');
  const [showExpertServerUrl, setShowExpertServerUrl] = useState(false);

  const projectsList = Array.isArray(todoistConfig?.projects) ? todoistConfig.projects : [];

  const getMemberCalendarSources = (m) => {
    const list = Array.isArray(m?.calendarSources) ? [...m.calendarSources] : [];
    if (m?.calendarId && String(m.calendarId).trim() !== '' && String(m.calendarId).toLowerCase() !== 'cloud') {
      String(m.calendarId).split(',').forEach(rawPart => {
        const clean = rawPart.trim();
        if (clean && !list.some(x => x.url === clean)) {
          const isUrl = clean.startsWith('http') || clean.startsWith('webcal');
          list.push({
            id: 'leg_' + clean.slice(0, 12),
            type: clean.includes('outlook') || clean.includes('office') ? 'outlook' : clean.includes('icloud') ? 'apple' : isUrl ? 'school' : 'google',
            name: isUrl ? 'Verknüpfter Kalender' : 'Google Kalender',
            url: clean
          });
        }
      });
    }
    return list;
  };

  const handleAddCalendarSource = (memberId) => {
    const cleanUrl = newCalUrl.trim();
    if (!cleanUrl) return;
    const providerObj = CALENDAR_PROVIDERS.find(p => p.id === newCalProvider) || CALENDAR_PROVIDERS[0];
    const defaultLabel =
      newCalProvider === 'outlook' ? 'Outlook' :
      newCalProvider === 'google' ? 'Google' :
      newCalProvider === 'apple' ? 'Apple iCloud' : 'Schule / ICS';

    const updatedMembers = (Array.isArray(members) ? members : []).map(item => {
      if (item.id !== memberId) return item;
      const existing = getMemberCalendarSources(item);
      const nextSources = [
        ...existing,
        {
          id: 'src_' + Date.now(),
          type: providerObj.id,
          name: newCalLabel.trim() || defaultLabel,
          url: cleanUrl
        }
      ];
      const combinedIds = nextSources.map(s => s.url).join(', ');
      return {
        ...item,
        calendarSources: nextSources,
        calendarId: combinedIds,
        ok: true,
        statusMsg: nextSources.length + ' Kalender aktiv ✓'
      };
    });

    setMembers(updatedMembers);
    setNewCalUrl('');
    setNewCalLabel('');
    setAddingCalForMember(null);
    pushToCloudAndDrive(updatedMembers, true);
  };

  const handleRemoveCalendarSource = (memberId, targetUrl) => {
    const updatedMembers = (Array.isArray(members) ? members : []).map(item => {
      if (item.id !== memberId) return item;
      const nextSources = getMemberCalendarSources(item).filter(s => s.url !== targetUrl);
      const combinedIds = nextSources.map(s => s.url).join(', ');
      return {
        ...item,
        calendarSources: nextSources,
        calendarId: combinedIds,
        ok: true,
        statusMsg: nextSources.length > 0 ? (nextSources.length + ' Kalender aktiv ✓') : 'Cloud-Kalender ✓'
      };
    });
    setMembers(updatedMembers);
    pushToCloudAndDrive(updatedMembers, true);
  };

  // =========================================================
  // ANSICHT: DESIGN & AVATARE
  // =========================================================
  if (activeSection === 'design') {
    const boldKeys = Object.keys(COLOR_PALETTES).filter(k => COLOR_PALETTES[k].bold);
    const softKeys = Object.keys(COLOR_PALETTES).filter(k => !COLOR_PALETTES[k].bold);

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={'p-6 rounded-3xl border shadow-sm space-y-4 ' + themeStyles.card}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">1. Seiten-Theme & Eigenes Logo</h2>
              <p className={'text-xs font-semibold ' + themeStyles.textMuted}>
                Wähle dein Theme – alle Buttons leuchten erst beim Darüberfahren mit der Maus voll auf.
              </p>
            </div>

            <div className={'flex flex-wrap items-center gap-2 p-2 rounded-2xl border ' + themeStyles.subtle}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-xs">TW</span>}
              </div>
              <input
                type="url"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                placeholder="Logo Bild-URL..."
                className={'w-36 px-3 py-1.5 rounded-xl border text-xs font-semibold ' + themeStyles.input}
              />
              <label className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer">
                📁 Logo hochladen
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {customLogoUrl && (
                <button onClick={() => setCustomLogoUrl('')} className="tw-nav-inactive px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                  ✕
                </button>
              )}
              <button
                onClick={restoreScreenshotDefaults}
                className="tw-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                🔄 Standard-Farben wiederherstellen
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {PAGE_THEMES.map(t => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCurrentTheme(t.id)}
                  title={t.desc}
                  className={'px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 ' + (isSelected ? 'tw-active-nav' : 'tw-glow-btn')}
                >
                  <span>{t.name}</span>
                  {isSelected && <span className="text-[10px] opacity-90">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={'p-6 rounded-3xl border shadow-sm space-y-5 ' + themeStyles.card}>
          <h2 className="text-xl font-extrabold">2. Persönliche Farbe & Avatar pro Kachel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(Array.isArray(members) ? members : []).map(m => {
              const st = getMemberStyles(m);
              return (
                <div key={m.id} style={st.headerStyle} className={'p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 ' + themeStyles.divider}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {renderAvatar(m, 'w-14 h-14', 'text-2xl')}
                      <div>
                        <div className="font-extrabold text-lg">{m.name}</div>
                        <div className={'text-xs font-semibold ' + themeStyles.textMuted}>{m.role}</div>
                      </div>
                    </div>

                    <div className={'flex gap-1 p-1 rounded-xl border text-xs font-bold ' + themeStyles.card}>
                      {['emoji', 'photo', 'badge'].map(type => (
                        <button
                          key={type}
                          onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, avatarType: type } : item))}
                          className={'px-3 py-1.5 rounded-lg cursor-pointer ' + (m.avatarType === type ? 'tw-active-nav' : 'tw-nav-inactive')}
                        >
                          {type === 'emoji' ? 'Emoji' : type === 'photo' ? 'Foto' : 'Kürzel (' + m.badge + ')'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase opacity-75">🔥 Vollton-Farben (harmonisch abgedämpft):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {boldKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.hex, color: '#fff' }}
                            className={'px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 ' + (m.color === cKey ? 'ring-2 ring-white scale-105' : 'opacity-75 hover:opacity-100')}
                          >
                            {pal.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] font-extrabold uppercase opacity-75 pt-1">🎨 Sanfte Pastell-Farben:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {softKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.light, color: pal.text, border: '2px solid ' + pal.hex }}
                            className={'px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 ' + (m.color === cKey ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-75 hover:opacity-100')}
                          >
                            {pal.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={'pt-3 border-t ' + themeStyles.divider}>
                    {m.avatarType === 'emoji' && (
                      <div className="flex flex-wrap gap-1.5">
                        {AVATAR_EMOJIS.map(em => (
                          <button
                            key={em}
                            onClick={() => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, emoji: em, avatarType: 'emoji' } : item))}
                            className={'w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ' + themeStyles.card + (m.emoji === em ? ' ring-2 ring-sky-400' : '')}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.avatarType === 'photo' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={m.photoUrl || ''}
                          onChange={(e) => setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, photoUrl: e.target.value } : item))}
                          placeholder="https://... (Bild-URL)"
                          className={'flex-1 px-3 py-2 rounded-xl border text-xs font-semibold ' + themeStyles.input}
                        />
                        <label className="tw-glow-btn px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                          📁 Foto wählen
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMemberPhotoUpload(m.id, e)} />
                        </label>
                      </div>
                    )}
                    {m.avatarType === 'badge' && (
                      <div className="text-xs font-bold opacity-80">Initialen-Kürzel ({m.badge}) aktiv.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ANSICHT: KONTEN & MULTI-KALENDER VERKNÜPFUNG
  // =========================================================
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className={'rounded-3xl p-6 shadow-xl border-2 border-sky-500/40 space-y-4 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold">
              ⚡ Multi-Kalender & Todoist Synchronisation
            </span>
            <h2 className="text-2xl font-extrabold mt-2">Externe Kalender & Todoist verbinden</h2>
            <p className={'text-sm mt-1 ' + themeStyles.textMuted}>
              Euer integrierter Cloud-Kalender ist sofort bereit. Zusätzlich könnt ihr unten bei jeder Person beliebig viele <strong>Microsoft Outlook</strong>-, <strong>Google</strong>-, <strong>Apple iCloud</strong>- oder <strong>Schul-Kalender</strong> verknüpfen!
            </p>
          </div>
          <button
            onClick={connectAndDiscoverTodoist}
            className="tw-glow-btn px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Todoist Team & Projekte verbinden
          </button>
        </div>

        <div className={'p-4 rounded-2xl border flex flex-wrap items-center gap-4 ' + themeStyles.subtle}>
          <span className="text-xs font-extrabold uppercase text-sky-400 shrink-0">🔑 Todoist API-Token (Optional):</span>
          <input
            type="password"
            value={todoistConfig?.apiToken || ''}
            onChange={(e) => setTodoistConfig(prev => ({ ...prev, apiToken: e.target.value }))}
            placeholder="Optional: Todoist API-Token für Aufgaben-Sync..."
            className={'flex-1 min-w-[260px] px-4 py-2.5 rounded-xl border text-xs font-mono ' + themeStyles.input}
          />
          <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
            📂 {projectsList.length} Projekte & 👥 {(Array.isArray(todoistConfig?.collaborators) ? todoistConfig.collaborators : []).length} Team-Mitglieder
          </span>
        </div>
      </div>

      <div className={'rounded-3xl border overflow-hidden divide-y ' + themeStyles.card + ' ' + themeStyles.divider}>
        {(Array.isArray(members) ? members : []).map(m => {
          const isCustom = !['all', 'hans', 'sarah', 'dean', 'valentina'].includes(m.id);
          const st = getMemberStyles(m);
          const calSources = getMemberCalendarSources(m);
          const isAddingHere = addingCalForMember === m.id;
          const activeProviderObj = CALENDAR_PROVIDERS.find(p => p.id === newCalProvider) || CALENDAR_PROVIDERS[0];

          return (
            <div key={m.id} style={st.headerStyle} className="p-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-[260px] flex-1">
                  {renderAvatar(m, 'w-12 h-12', 'text-xl')}
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <div className="flex-1">
                      <label className={'block text-[10px] font-extrabold uppercase mb-0.5 ' + themeStyles.textMuted}>
                        Name der Person / Zeile
                      </label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          const newBadge = m.id === 'all' ? 'FA' : (newName.trim().charAt(0).toUpperCase() || m.badge);
                          setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, name: newName, badge: newBadge } : item));
                        }}
                        className={'w-full px-3 py-2 rounded-xl border text-sm font-extrabold ' + themeStyles.input}
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <label className={'block text-[10px] font-extrabold uppercase mb-0.5 ' + themeStyles.textMuted}>
                        Rolle
                      </label>
                      <input
                        type="text"
                        value={m.role || ''}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, role: newRole } : item));
                        }}
                        className={'w-full px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
                      />
                    </div>
                  </div>
                </div>

                {m.id !== 'all' && (
                  <div className="min-w-[200px]">
                    <label className="block text-[10px] font-extrabold uppercase mb-0.5 text-sky-400">
                      📲 Todoist Team-Account
                    </label>
                    <select
                      value={m.todoistUserId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMembers(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === m.id ? { ...item, todoistUserId: val } : item));
                      }}
                      className={'w-full px-3 py-2 rounded-xl border text-xs font-bold ' + themeStyles.input}
                    >
                      <option value="" className="bg-slate-800 text-white">-- Nicht zugewiesen --</option>
                      {(Array.isArray(todoistConfig?.collaborators) ? todoistConfig.collaborators : []).map(col => (
                        <option key={col.id} value={col.id} className="bg-slate-800 text-white">
                          {col.name} ({col.email || 'Team'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCalForMember(isAddingHere ? null : m.id);
                      setNewCalUrl('');
                      setNewCalLabel('');
                    }}
                    className="tw-glow-btn px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Kalender verknüpfen (Outlook / Google / iCloud)</span>
                  </button>

                  {isCustom && (
                    <button
                      onClick={() => {
                        const filtered = (Array.isArray(members) ? members : []).filter(item => item.id !== m.id);
                        setMembers(filtered);
                        pushToCloudAndDrive(filtered, true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-extrabold cursor-pointer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-14">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold flex items-center gap-1.5">
                  ☁️ Integrierter Touchwall-Kalender ✓
                </span>

                {calSources.map((src, sIdx) => {
                  const icon =
                    src.type === 'outlook' ? '🟦 Outlook:' :
                    src.type === 'apple' ? '🍎 iCloud:' :
                    src.type === 'school' ? '🏫 ICS:' : '🔵 Google:';
                  return (
                    <div
                      key={sIdx}
                      className="px-3 py-1 rounded-xl bg-black/35 border border-white/15 text-xs font-extrabold flex items-center gap-2"
                    >
                      <span>{icon} {src.name}</span>
                      <span className="opacity-60 font-mono text-[10px] max-w-[180px] truncate">{src.url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCalendarSource(m.id, src.url)}
                        className="text-rose-400 hover:text-rose-300 font-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {isAddingHere && (
                <div className={'p-4 rounded-2xl border-2 border-sky-400/50 space-y-3 ml-0 sm:ml-14 ' + themeStyles.subtle}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-sky-400 mb-1">
                        1. Kalender-Anbieter wählen
                      </label>
                      <select
                        value={newCalProvider}
                        onChange={(e) => setNewCalProvider(e.target.value)}
                        className={'w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold ' + themeStyles.input}
                      >
                        {CALENDAR_PROVIDERS.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-amber-400 mb-1">
                        2. Bezeichnung (Optional)
                      </label>
                      <input
                        type="text"
                        value={newCalLabel}
                        onChange={(e) => setNewCalLabel(e.target.value)}
                        placeholder="z.B. Büro Outlook, Schichtplan, Verein..."
                        className={'w-full px-3 py-2.5 rounded-xl border text-xs font-bold ' + themeStyles.input}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-emerald-400 mb-1">
                        3. Kalender-Link (.ics) oder Google-ID
                      </label>
                      <input
                        type="text"
                        value={newCalUrl}
                        onChange={(e) => setNewCalUrl(e.target.value)}
                        placeholder={activeProviderObj.placeholder}
                        className={'w-full px-3 py-2.5 rounded-xl border text-xs font-mono ' + themeStyles.input}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] opacity-80 font-semibold">
                      💡 <strong>Tipp für Outlook / Apple / Google:</strong> Kopiere in deinen Kalender-Einstellungen unter „Kalender teilen / veröffentlichen“ einfach den <strong>ICS-Link</strong> hier hinein!
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingCalForMember(null)}
                        className="tw-nav-inactive px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCalendarSource(m.id)}
                        className="tw-glow-btn px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
                      >
                        ✓ Kalender hinzufügen & synchronisieren
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={'rounded-3xl p-6 shadow-md border space-y-4 ' + themeStyles.card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold">☁️ Cloud-Synchronisation & Backup</h3>
            <p className={'text-xs ' + themeStyles.textMuted}>
              Synchronisiert alle verknüpften Google-, Outlook- und iCloud-Kalender und sichert eure Einstellungen im Familien-Konto.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => pullFromCloud(undefined, true)}
              className="tw-glow-btn px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Jetzt alle Kalender abrufen
            </button>
            <button
              onClick={() => pushToCloudAndDrive(members, true)}
              className="tw-glow-btn px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4" /> Änderungen in Cloud speichern
            </button>
            <button
              onClick={addExtraCalendarAccount}
              className="tw-glow-btn px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer"
            >
              + Weitere Person / Kalender-Spalte
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 font-extrabold">
            <label className="text-sky-400 hover:underline cursor-pointer">
              📂 Backup-Datei (.json) importieren
              <input type="file" accept=".json" className="hidden" onChange={importBackupJson} />
            </label>
            <button onClick={exportBackupJson} className="text-emerald-400 hover:underline cursor-pointer">
              💾 Backup-Datei (.json) herunterladen
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowExpertServerUrl(!showExpertServerUrl)}
            className="text-[11px] font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
          >
            <ChevronDown className={'w-3.5 h-3.5 transition-transform ' + (showExpertServerUrl ? 'rotate-180' : '')} />
            <span>⚙️ Erweiterte Server-Einstellungen (Nur für Selbst-Hoster)</span>
          </button>
        </div>

        {showExpertServerUrl && (
          <div className={'p-3.5 rounded-2xl border space-y-3 ' + themeStyles.subtle}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-amber-400 shrink-0">🔗 Eigener Cloud-Server (Optional):</span>
              <input
                type="url"
                value={appsScriptUrl}
                onChange={(e) => {
                  setAppsScriptUrl(e.target.value);
                  try { localStorage.setItem('richter_tw_gas_url', e.target.value); } catch (err) {}
                }}
                placeholder="Standard-Cloud-Server aktiv"
                className={'flex-1 min-w-[260px] px-3.5 py-2 rounded-xl border text-xs font-mono ' + themeStyles.input}
              />
              <button
                onClick={runAllPermissionsTest}
                disabled={isTestingDiag}
                className="tw-glow-btn px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isTestingDiag ? 'Prüfe...' : '🧪 Server testen'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
