// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */

export function formatDateStr(dateObj) {
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateObj, days) {
  const copy = new Date(dateObj);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getISOWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function hexToRgba(hex, alpha) {
  const clean = String(hex || '#0284c7').replace('#', '');
  const num = parseInt(clean, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export function playTouchwallAlarmSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.48);
    });
  } catch (e) {}
}

export const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const MONTHS_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const bwHolidayCache = {};

function computeEasterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getBWHolidayName(dateStr) {
  if (!dateStr) return null;
  const year = Number(dateStr.slice(0, 4));
  if (!bwHolidayCache[year]) {
    const map = {};
    const easter = computeEasterSunday(year);
    map[`${year}-01-01`] = 'Neujahr';
    map[`${year}-01-06`] = 'Heilige Drei Könige';
    map[`${year}-05-01`] = 'Tag der Arbeit';
    map[`${year}-10-03`] = 'Tag der Dt. Einheit';
    map[`${year}-11-01`] = 'Allerheiligen';
    map[`${year}-12-25`] = '1. Weihnachtstag';
    map[`${year}-12-26`] = '2. Weihnachtstag';
    map[formatDateStr(addDays(easter, -2))] = 'Karfreitag';
    map[formatDateStr(addDays(easter, 1))] = 'Ostermontag';
    map[formatDateStr(addDays(easter, 39))] = 'Christi Himmelfahrt';
    map[formatDateStr(addDays(easter, 50))] = 'Pfingstmontag';
    map[formatDateStr(addDays(easter, 60))] = 'Fronleichnam';
    bwHolidayCache[year] = map;
  }
  return bwHolidayCache[year][dateStr] || null;
}

export const BW_SCHOOL_VACATIONS = [
  { start: '2025-04-14', end: '2025-04-26', name: 'Osterferien BW' },
  { start: '2025-06-10', end: '2025-06-20', name: 'Pfingstferien BW' },
  { start: '2025-07-31', end: '2025-09-13', name: 'Sommerferien BW' },
  { start: '2025-10-27', end: '2025-10-31', name: 'Herbstferien BW' },
  { start: '2025-12-22', end: '2026-01-05', name: 'Weihnachtsferien BW' },
  { start: '2026-03-30', end: '2026-04-11', name: 'Osterferien BW' },
  { start: '2026-05-26', end: '2026-06-05', name: 'Pfingstferien BW' },
  { start: '2026-07-30', end: '2026-09-12', name: 'Sommerferien BW' },
  { start: '2026-10-26', end: '2026-10-31', name: 'Herbstferien BW' },
  { start: '2026-12-23', end: '2027-01-09', name: 'Weihnachtsferien BW' },
  { start: '2027-03-30', end: '2027-04-03', name: 'Osterferien BW' },
  { start: '2027-05-18', end: '2027-05-29', name: 'Pfingstferien BW' },
  { start: '2027-07-29', end: '2027-09-11', name: 'Sommerferien BW' },
  { start: '2027-11-02', end: '2027-11-06', name: 'Herbstferien BW' },
  { start: '2027-12-23', end: '2028-01-08', name: 'Weihnachtsferien BW' }
];

export function getBWVacationInfo(dateStr) {
  if (!dateStr) return null;
  for (let i = 0; i < BW_SCHOOL_VACATIONS.length; i++) {
    const v = BW_SCHOOL_VACATIONS[i];
    if (dateStr >= v.start && dateStr <= v.end) {
      return {
        name: v.name,
        shortName: v.name.replace(' BW', ''),
        isFirstDay: dateStr === v.start,
        isLastDay: dateStr === v.end
      };
    }
  }
  return null;
}

export function getBWVacationName(dateStr) {
  const info = getBWVacationInfo(dateStr);
  return info ? info.name : null;
}

export const COLOR_PALETTES = {
  crimson_bold: { name: '🔥 Racing Rot',      hex: '#dc2626', border: '#991b1b', light: '#fee2e2', text: '#991b1b', bold: true },
  royal_bold:   { name: '⚡ Elektro Blau',    hex: '#2563eb', border: '#1e40af', light: '#dbeafe', text: '#1e40af', bold: true },
  emerald_bold: { name: '🍏 Kawa Grün',       hex: '#16a34a', border: '#166534', light: '#dcfce7', text: '#166534', bold: true },
  orange_bold:  { name: '🍊 Sunset Orange',   hex: '#ea580c', border: '#9a3412', light: '#ffedd5', text: '#9a3412', bold: true },
  violet_bold:  { name: '🔮 Royal Violett',   hex: '#7c3aed', border: '#5b21b6', light: '#ede9fe', text: '#5b21b6', bold: true },
  magenta_bold: { name: '💖 Neon Magenta',    hex: '#db2777', border: '#9d174d', light: '#fce7f3', text: '#9d174d', bold: true },
  gold_bold:    { name: '👑 Goldgelb',        hex: '#ca8a04', border: '#854d0e', light: '#fef9c3', text: '#854d0e', bold: true },
  teal_bold:    { name: '🌊 Ozean Türkis',    hex: '#0d9488', border: '#115e59', light: '#ccfbf1', text: '#115e59', bold: true },
  cyan_bold:    { name: '💎 Eisblau Cyan',    hex: '#0891b2', border: '#155e75', light: '#cffafe', text: '#155e75', bold: true },
  lime_bold:    { name: '🎾 Energie Limette', hex: '#65a30d', border: '#3f6212', light: '#ecfccb', text: '#3f6212', bold: true },
  berry_bold:   { name: '🍒 Dunkelkirsche',   hex: '#9f1239', border: '#881337', light: '#ffe4e6', text: '#881337', bold: true },
  navy_bold:    { name: '🌌 Nachtblau',       hex: '#1e3a8a', border: '#172554', light: '#dbeafe', text: '#1e3a8a', bold: true },

  sky:     { name: 'Himmelblau', hex: '#0284c7', border: '#0369a1', light: '#e0f2fe', text: '#0369a1', bold: false },
  pink:    { name: 'Rosé',       hex: '#db2777', border: '#be185d', light: '#fce7f3', text: '#be185d', bold: false },
  emerald: { name: 'Smaragd',    hex: '#16a34a', border: '#15803d', light: '#dcfce7', text: '#15803d', bold: false },
  amber:   { name: 'Sonnengelb', hex: '#d97706', border: '#b45309', light: '#fef3c7', text: '#b45309', bold: false },
  purple:  { name: 'Lavendel',   hex: '#9333ea', border: '#7e22ce', light: '#f3e8ff', text: '#7e22ce', bold: false },
  rose:    { name: 'Koralle',    hex: '#e11d48', border: '#be123c', light: '#ffe4e6', text: '#be123c', bold: false },
  teal:    { name: 'Türkis',     hex: '#0d9488', border: '#0f766e', light: '#ccfbf1', text: '#0f766e', bold: false },
  indigo:  { name: 'Indigo',     hex: '#4f46e5', border: '#3730a3', light: '#e0e7ff', text: '#3730a3', bold: false },
  lime:    { name: 'Limette',    hex: '#65a30d', border: '#3f6212', light: '#ecfccb', text: '#3f6212', bold: false },
  cyan:    { name: 'Petrol',     hex: '#0891b2', border: '#0e7490', light: '#cffafe', text: '#0e7490', bold: false }
};

export const PAGE_THEMES = [
  { id: 'light',     name: '☀️ Klassisch Hell', desc: 'Klares, helles Wandkalender-Design', dark: false },
  { id: 'cozy',      name: '🌅 Warm Cozy',      desc: 'Sanfte Sand- und Naturtöne',         dark: false },
  { id: 'mint',      name: '🌿 Nordic Mint',    desc: 'Frisches Skandinavien-Grün',         dark: false },
  { id: 'metal',     name: '⚙️ Metal Silver',   desc: 'Titan- & Gunmetal-Grau mit starkem Kontrast', dark: true },
  { id: 'lightdark', name: '🌗 Light Dark',     desc: 'Angenehmes Dunkelblau-Grau (Slate)', dark: true },
  { id: 'irongray',  name: '🛡️ Iron Gray',      desc: 'Tiefes Graphit & Anthrazit',         dark: true },
  { id: 'dark',      name: '🌙 Midnight Dark',  desc: 'Tiefdunkler Nachtmodus',             dark: true }
];

export const AVATAR_EMOJIS = ['👨‍👩‍👧‍👦', '👨', '👩', '👦', '👧', '🏎️', '💻', '🐕', '🐴', '⚽', '🎮', '🎨', '🦸‍♂️', '🦸‍♀️', '👑', '🦊'];

export const DEFAULT_MEMBERS = [
  { id: 'all',       name: 'Familie & Events', role: 'Alle gemeinsam', badge: 'FR', color: 'orange_bold',  avatarType: 'emoji', emoji: '👨‍👩‍👧‍👦', photoUrl: '', calendarId: 'primary', todoistUserId: '', todoistProjectId: '', statusMsg: 'Hauptkalender', ok: true },
  { id: 'hans',      name: 'Hans',             role: 'Vater',          badge: 'H',  color: 'navy_bold',    avatarType: 'photo', emoji: '🏎️',     photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', calendarId: '', todoistUserId: '', todoistProjectId: '', statusMsg: 'Bereit', ok: false },
  { id: 'sarah',     name: 'Sarah',            role: 'Mutter',         badge: 'S',  color: 'pink',         avatarType: 'photo', emoji: '👩',     photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', calendarId: '', todoistUserId: '', todoistProjectId: '', statusMsg: 'Bereit', ok: false },
  { id: 'dean',      name: 'Dean',             role: 'Sohn',           badge: 'D',  color: 'crimson_bold', avatarType: 'emoji', emoji: '⚽',     photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=120&q=80', calendarId: '', todoistUserId: '', todoistProjectId: '', statusMsg: 'Bereit', ok: false },
  { id: 'valentina', name: 'Valentina',        role: 'Tochter',        badge: 'V',  color: 'teal_bold',    avatarType: 'emoji', emoji: '🐴',     photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', calendarId: '', todoistUserId: '', todoistProjectId: '', statusMsg: 'Bereit', ok: false }
];

export const DEFAULT_MEALS = [
  { id: 1, dayLabel: 'Montag',     dish: '🍝 Glutenfreie Spaghetti Bolognese', ingredients: [{ name: 'Glutenfreie Spaghetti', done: true }, { name: 'Rinderhackfleisch 500g', done: false }, { name: 'Passierte Tomaten', done: true }, { name: 'Parmesan', done: false }] },
  { id: 2, dayLabel: 'Dienstag',   dish: '🥞 Pfannkuchen mit Apfelmus',        ingredients: [{ name: 'Glutenfreies Mehl', done: true }, { name: 'Eier (6 Stück)', done: true }, { name: 'Milch', done: false }, { name: 'Apfelmus im Glas', done: false }] },
  { id: 3, dayLabel: 'Mittwoch',   dish: '🥦 Gemüse-Wok mit Reis',             ingredients: [{ name: 'Basmatireis', done: true }, { name: 'Brokkoli & Paprika', done: false }, { name: 'Hähnchenbrust', done: false }, { name: 'Tamari (GF Sojasoße)', done: true }] },
  { id: 4, dayLabel: 'Donnerstag', dish: '🧀 Hausgemachte Mac & Cheese (GF)',  ingredients: [{ name: 'Glutenfreie Hörnchennudeln', done: true }, { name: 'Cheddar & Gouda gerieben', done: false }, { name: 'Maisstärke', done: true }, { name: 'Butter & Milch', done: true }] },
  { id: 5, dayLabel: 'Freitag',    dish: '🌮 Familien-Taco Abend',             ingredients: [{ name: 'Mais-Tacoschalen', done: false }, { name: 'Hackfleisch & Mais', done: false }, { name: 'Guacamole / Avocado', done: false }, { name: 'Salsa & Sauerrahm', done: true }] },
  { id: 6, dayLabel: 'Samstag',    dish: '🍕 Pizza-Abend',                     ingredients: [{ name: 'Glutenfreier Pizzateig', done: false }, { name: 'Mozzarella', done: false }, { name: 'Salami & Champignons', done: false }] },
  { id: 7, dayLabel: 'Sonntag',    dish: '🍗 Sonntagsbraten & Ofenkartoffeln', ingredients: [{ name: 'Kartoffeln 1,5 kg', done: true }, { name: 'Sonntagsbraten / Hähnchen', done: false }, { name: 'Grüner Salat', done: false }] }
];

export const DEFAULT_NOTES = [
  { id: 1, title: '🛒 Einkaufsliste (Geteilt)', color: 'amber', author: 'Sarah & Hans', todoistProjectId: '', items: [{ text: 'Glutenfreier Blätterteig', done: false }, { text: 'Fisch Seesternchen', done: false }, { text: 'Katzenfutter Norma', done: false }] },
  { id: 2, title: '📌 Wichtige Familien-Infos', color: 'sky',   author: 'Hans',         todoistProjectId: '', items: [{ text: 'Ponyhof Dienstplan am Wochenende prüfen', done: false }, { text: 'Müllabfuhr Gelber Sack: Dienstag früh', done: false }] },
  { id: 3, title: '🎁 Ideen & Besorgungen',     color: 'pink',  author: 'Familie',      todoistProjectId: '', items: [{ text: 'Dean: Neue Fußballschuhe schauen', done: false }, { text: 'Valentina: Bastelset & Reithandschuhe', done: false }] }
];

export const DEFAULT_SCHOOL = {
  dean: {
    periods: ['1. Std (07:55)', '2. Std (08:45)', '3. Std (09:50)', '4. Std (10:40)', '5. Std (11:40)', '6. Std (12:30)'],
    slots: {
      '0-0': { subject: '📐 Mathe', room: 'R. 204', status: 'normal' },
      '0-1': { subject: '📖 Deutsch', room: 'Fr. Kiefer', status: 'normal' },
      '0-2': { subject: '🇬🇧 Englisch', room: 'Hr. Wiedemann', status: 'normal' },
      '0-3': { subject: '🔬 NWT / Technik', room: 'Werkraum', status: 'normal' },
      '0-4': { subject: '⚽ Sport', room: 'Sporthalle', status: 'normal' },
      '1-0': { subject: '🇬🇧 Englisch', room: 'Hr. Wiedemann', status: 'exam' },
      '1-1': { subject: '📐 Mathe', room: 'R. 204', status: 'normal' },
      '1-2': { subject: '🌍 Geschichte', room: 'R. 204', status: 'normal' },
      '1-3': { subject: '📖 Deutsch', room: 'Fr. Kiefer', status: 'change' },
      '2-0': { subject: '📐 Mathe', room: 'R. 204', status: 'normal' },
      '2-1': { subject: '🔬 Physik / Chemie', room: 'Labor', status: 'normal' },
      '2-2': { subject: '📖 Deutsch', room: 'Fr. Kiefer', status: 'normal' },
      '3-0': { subject: '🇬🇧 Englisch', room: 'Hr. Wiedemann', status: 'normal' },
      '3-1': { subject: '🎨 Kunst / Werk', room: 'Kunstraum', status: 'normal' },
      '4-0': { subject: '📖 Deutsch', room: 'Fr. Kiefer', status: 'normal' },
      '4-1': { subject: '📐 Mathe', room: 'R. 204', status: 'normal' }
    },
    announcements: [
      'Dienstag 1. Stunde: Englisch-Vokabeltest bei Herrn Wiedemann',
      'Donnerstag: Sportzeug für Nachmittag nicht vergessen'
    ]
  },
  valentina: {
    periods: ['1. Std (08:00)', '2. Std (08:50)', '3. Std (09:55)', '4. Std (10:45)', '5. Std (11:45)'],
    slots: {
      '0-0': { subject: '📖 Deutsch', room: 'Klassenzimmer', status: 'normal' },
      '0-1': { subject: '📐 Mathe', room: 'Klassenzimmer', status: 'normal' },
      '0-2': { subject: '🌿 Sachunterricht', room: 'Klassenzimmer', status: 'normal' },
      '0-3': { subject: '🎨 Kunst', room: 'Werkraum', status: 'normal' },
      '1-0': { subject: '📐 Mathe', room: 'Klassenzimmer', status: 'normal' },
      '1-1': { subject: '📖 Deutsch / Lesen', room: 'Klassenzimmer', status: 'normal' },
      '1-2': { subject: '⚽ Sport', room: 'Turnhalle', status: 'normal' },
      '2-0': { subject: '📖 Deutsch', room: 'Klassenzimmer', status: 'normal' },
      '2-1': { subject: '🎵 Musik', room: 'Musikraum', status: 'change' },
      '3-0': { subject: '📐 Mathe', room: 'Klassenzimmer', status: 'normal' },
      '3-1': { subject: '🌿 Sachunterricht', room: 'Klassenzimmer', status: 'normal' },
      '4-0': { subject: '📖 Wochenabschluss', room: 'Klassenzimmer', status: 'normal' }
    },
    announcements: [
      'Mittwoch: Musikraum-Wechsel (Vertretung)',
      'Freitag: Lesebuch mitbringen'
    ]
  }
};

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyY2AOKbYqdHNbdcjbTRGW2w-8xqjL3fDN7mdLpKQtmBaQfYcA54NIM97FxmLca7-1L/exec';

export function buildThemeStyles(currentTheme) {
  switch (currentTheme) {
    case 'metal':
      return {
        outer: 'bg-[#202225] text-slate-100',
        shell: 'bg-[#32363b] border-[#525860]',
        sidebar: 'bg-gradient-to-b from-[#3f444a] via-[#2c3035] to-[#202327] border-[#606872]',
        header: 'bg-gradient-to-r from-[#42474d] via-[#31353a] to-[#26292d] border-[#606872]',
        viewport: 'bg-gradient-to-br from-[#373b40] via-[#2b2e33] to-[#222529]',
        card: 'bg-[#3e4349]/95 border-[#646d78] text-slate-100 tw-glow-card',
        subtle: 'bg-[#303439] border-[#525a63] text-slate-100 tw-glow-subtle',
        modal: 'bg-[#35393e] border-[#6e7782] text-slate-100',
        input: 'bg-[#26292d] border-[#586069] text-slate-100 placeholder-zinc-400',
        banner: 'bg-[#191b1e] text-white',
        divider: 'border-[#5c646e]',
        textMain: 'text-slate-100',
        textMuted: 'text-zinc-300',
        dark: true
      };
    case 'lightdark':
      return {
        outer: 'bg-[#11171a] text-slate-100',
        shell: 'bg-[#1c262b] border-[#334650]',
        sidebar: 'bg-[#161f24] border-[#334650]',
        header: 'bg-[#161f24] border-[#334650]',
        viewport: 'bg-[#141c20]',
        card: 'bg-[#233036]/95 border-[#3d5561] text-slate-100 tw-glow-card',
        subtle: 'bg-[#1b252a] border-[#334650] text-slate-100 tw-glow-subtle',
        modal: 'bg-[#202c32] border-[#45606e] text-slate-100',
        input: 'bg-[#151d21] border-[#3d5561] text-slate-100 placeholder-slate-400',
        banner: 'bg-[#0e1417] text-white',
        divider: 'border-[#3d5561]',
        textMain: 'text-slate-100',
        textMuted: 'text-slate-300',
        dark: true
      };
    case 'irongray':
      return {
        outer: 'bg-[#0d0e10] text-zinc-100',
        shell: 'bg-[#17181b] border-[#33363d]',
        sidebar: 'bg-[#131417] border-[#33363d]',
        header: 'bg-[#15171a] border-[#33363d]',
        viewport: 'bg-[#111215]',
        card: 'bg-[#212327] border-[#383b42] text-zinc-100 tw-glow-card',
        subtle: 'bg-[#191b1f] border-[#33363d] text-zinc-100 tw-glow-subtle',
        modal: 'bg-[#1e2024] border-[#3f434c] text-zinc-100',
        input: 'bg-[#141518] border-[#383b42] text-zinc-100 placeholder-zinc-500',
        banner: 'bg-[#090a0c] text-white',
        divider: 'border-[#3f434c]',
        textMain: 'text-zinc-100',
        textMuted: 'text-zinc-400',
        dark: true
      };
    case 'dark':
      return {
        outer: 'bg-slate-950 text-slate-100',
        shell: 'bg-slate-900 border-slate-800',
        sidebar: 'bg-slate-950 border-slate-800',
        header: 'bg-slate-900 border-slate-800',
        viewport: 'bg-slate-950',
        card: 'bg-slate-800/95 border-slate-700 text-slate-100 tw-glow-card',
        subtle: 'bg-slate-900 border-slate-700 text-slate-100 tw-glow-subtle',
        modal: 'bg-slate-900 border-slate-700 text-slate-100',
        input: 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500',
        banner: 'bg-indigo-950 text-white',
        divider: 'border-slate-700',
        textMain: 'text-slate-100',
        textMuted: 'text-slate-400',
        dark: true
      };
    case 'cozy':
      return {
        outer: 'bg-[#e7ddd3] text-[#3d2f1d]',
        shell: 'bg-[#fffdf9] border-[#dfd3c3]',
        sidebar: 'bg-[#f5efe6] border-[#dfd3c3]',
        header: 'bg-[#fffdf9] border-[#dfd3c3]',
        viewport: 'bg-[#faf6f0]',
        card: 'bg-[#fffdf9] border-[#dfd3c3] text-[#3d2f1d] tw-glow-card',
        subtle: 'bg-[#f5efe6] border-[#dfd3c3] text-[#3d2f1d] tw-glow-subtle',
        modal: 'bg-[#fffdf9] border-[#d5c5b0] text-[#3d2f1d]',
        input: 'bg-white border-[#d5c5b0] text-[#3d2f1d] placeholder-[#9c8974]',
        banner: 'bg-[#5c4738] text-white',
        divider: 'border-[#d5c5b0]',
        textMain: 'text-[#3d2f1d]',
        textMuted: 'text-[#786655]',
        dark: false
      };
    case 'mint':
      return {
        outer: 'bg-[#cce3de] text-[#1b4332]',
        shell: 'bg-[#f6fff8] border-[#c7e5d9]',
        sidebar: 'bg-[#eaf4f4] border-[#c7e5d9]',
        header: 'bg-[#f6fff8] border-[#c7e5d9]',
        viewport: 'bg-[#edf6f3]',
        card: 'bg-[#f8fffa] border-[#b7ded0] text-[#1b4332] tw-glow-card',
        subtle: 'bg-[#e3f2ed] border-[#b7ded0] text-[#1b4332] tw-glow-subtle',
        modal: 'bg-[#f6fff8] border-[#a3d5c3] text-[#1b4332]',
        input: 'bg-white border-[#a3d5c3] text-[#1b4332] placeholder-[#689689]',
        banner: 'bg-[#1b4332] text-white',
        divider: 'border-[#a3d5c3]',
        textMain: 'text-[#1b4332]',
        textMuted: 'text-[#40685e]',
        dark: false
      };
    default:
      return {
        outer: 'bg-slate-200 text-slate-900',
        shell: 'bg-white border-slate-300',
        sidebar: 'bg-slate-50 border-slate-300',
        header: 'bg-white border-slate-300',
        viewport: 'bg-slate-100',
        card: 'bg-white border-slate-300 text-slate-900 tw-glow-card',
        subtle: 'bg-slate-50 border-slate-200 text-slate-800 tw-glow-subtle',
        modal: 'bg-white border-slate-300 text-slate-900',
        input: 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400',
        banner: 'bg-slate-800 text-white',
        divider: 'border-slate-300',
        textMain: 'text-slate-900',
        textMuted: 'text-slate-500',
        dark: false
      };
  }
}

export function buildMemberStyles(member, isDark) {
  const p = COLOR_PALETTES[member?.color] || COLOR_PALETTES.royal_bold;
  if (p.bold) {
    return {
      cardStyle: {
        background: isDark
          ? `linear-gradient(135deg, ${hexToRgba(p.hex, 0.65)} 0%, ${hexToRgba(p.hex, 0.45)} 100%)`
          : `linear-gradient(135deg, ${hexToRgba(p.hex, 0.82)} 0%, ${hexToRgba(p.hex, 0.68)} 100%)`,
        borderLeft: `5px solid ${p.hex}`,
        borderTop: `1px solid ${hexToRgba(p.hex, 0.5)}`,
        borderRight: `1px solid ${hexToRgba(p.hex, 0.35)}`,
        borderBottom: `1px solid ${hexToRgba(p.hex, 0.35)}`,
        color: '#ffffff'
      },
      headerStyle: {
        background: isDark
          ? `linear-gradient(90deg, ${hexToRgba(p.hex, 0.32)} 0%, ${hexToRgba(p.hex, 0.12)} 100%)`
          : `linear-gradient(90deg, ${hexToRgba(p.hex, 0.20)} 0%, ${hexToRgba(p.hex, 0.08)} 100%)`,
        borderLeft: `6px solid ${p.hex}`
      },
      cellStyle: (isWeekend) => ({
        backgroundColor: isWeekend
          ? hexToRgba(p.hex, isDark ? 0.20 : 0.16)
          : hexToRgba(p.hex, isDark ? 0.11 : 0.09)
      }),
      badgeStyle: { backgroundColor: hexToRgba(p.hex, 0.88), color: '#ffffff' }
    };
  }
  return {
    cardStyle: {
      backgroundColor: isDark ? hexToRgba(p.hex, 0.32) : p.light,
      borderLeft: `4px solid ${p.hex}`,
      color: isDark ? '#f8fafc' : p.text
    },
    headerStyle: {
      backgroundColor: isDark ? hexToRgba(p.hex, 0.22) : p.light,
      borderLeft: `6px solid ${p.hex}`
    },
    cellStyle: (isWeekend) => ({
      backgroundColor: isWeekend
        ? hexToRgba(p.hex, isDark ? 0.18 : 0.15)
        : hexToRgba(p.hex, isDark ? 0.10 : 0.08)
    }),
    badgeStyle: { backgroundColor: p.hex, color: '#ffffff' }
  };
}

const TODOIST_V1_DIRECT = 'https://api.todoist.com/api/v1';

export async function todoistFetch(token, path, options = {}) {
  const cleanToken = String(token || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanToken) throw new Error('Kein Todoist API-Token eingetragen.');

  const method = options.method || 'GET';
  let cleanBody = options.rawBody ? { ...options.rawBody } : null;
  if (cleanBody && cleanBody.due_datetime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(cleanBody.due_datetime)) {
    cleanBody.due_datetime = new Date(cleanBody.due_datetime).toISOString();
  }

  try {
    const sep = path.includes('?') ? '&' : '?';
    const url = method === 'GET' ? `${TODOIST_V1_DIRECT}${path}${sep}_t=${Date.now()}` : `${TODOIST_V1_DIRECT}${path}`;
    const directRes = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        ...(cleanBody ? { 'Content-Type': 'application/json' } : {})
      },
      body: cleanBody && method !== 'GET' ? JSON.stringify(cleanBody) : undefined,
      cache: 'no-store'
    });

    if (directRes.status === 204) return { ok: true };
    const text = await directRes.text();
    if (!directRes.ok) {
      throw new Error(`Todoist-v1 (${directRes.status}): ${text}`);
    }
    const data = text ? JSON.parse(text) : {};
    return (method === 'GET' && data && !Array.isArray(data) && Array.isArray(data.results))
      ? data.results
      : data;
  } catch (directErr) {
    if (String(directErr.message || '').startsWith('Todoist-v1 (')) {
      throw directErr;
    }

    const proxyRes = await fetch(`/api/todoist?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: cleanToken,
        path,
        method,
        body: cleanBody || undefined
      }),
      cache: 'no-store'
    });
    const proxyData = await proxyRes.json().catch(() => ({}));
    if (!proxyRes.ok || proxyData?.error) {
      throw new Error(proxyData?.error || directErr.message);
    }
    return (method === 'GET' && proxyData && !Array.isArray(proxyData) && Array.isArray(proxyData.results))
      ? proxyData.results
      : proxyData;
  }
}

export async function createNewTodoistProject(token, projectName) {
  if (!token || !projectName?.trim()) return null;
  return todoistFetch(token, '/projects', {
    method: 'POST',
    rawBody: { name: projectName.trim() }
  });
}

export async function addTodoistRelativeReminder(token, itemId, notifyTimeStr) {
  const offsetMap = { '0m': 0, '5m': 5, '10m': 10, '15m': 15, '30m': 30, '1h': 60, '2h': 120, '1d': 1440 };
  const minuteOffset = offsetMap[notifyTimeStr];
  if (minuteOffset === undefined || !token || !itemId) return;
  const cleanToken = String(token).replace(/[^a-zA-Z0-9_-]/g, '');
  const cmd = [{
    type: 'reminder_add',
    temp_id: 'rem-' + Date.now(),
    uuid: 'tw-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
    args: {
      item_id: String(itemId),
      type: 'relative',
      minute_offset: Number(minuteOffset)
    }
  }];

  try {
    const formBody = new URLSearchParams({ commands: JSON.stringify(cmd) });
    await fetch(`${TODOIST_V1_DIRECT}/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody.toString(),
      cache: 'no-store'
    });
  } catch (e) {}
}

export async function discoverTodoistWorkspace(token) {
  const cleanToken = String(token || '').replace(/[^a-zA-Z0-9_-]/g, '');
  let projects = await todoistFetch(cleanToken, '/projects');
  if (!Array.isArray(projects)) projects = [];

  let shoppingProj = projects.find(p => /einkauf|shopping|supermarkt/i.test(p.name));
  let tasksProj = projects.find(p => /aufgaben|familie|touchwall|tasks|richter/i.test(p.name) && (!shoppingProj || p.id !== shoppingProj.id));

  if (!shoppingProj) {
    shoppingProj = await createNewTodoistProject(cleanToken, '🛒 Einkaufsliste');
    if (shoppingProj?.id) projects.push(shoppingProj);
  }
  if (!tasksProj) {
    tasksProj = await createNewTodoistProject(cleanToken, '✅ Familien-Aufgaben');
    if (tasksProj?.id) projects.push(tasksProj);
  }

  const collaboratorMap = {};
  for (const p of projects) {
    if (p.is_shared || p.id === tasksProj?.id || p.id === shoppingProj?.id) {
      try {
        const cols = await todoistFetch(cleanToken, `/projects/${p.id}/collaborators`);
        if (Array.isArray(cols)) {
          cols.forEach(c => {
            if (c?.id) {
              collaboratorMap[String(c.id)] = {
                id: String(c.id),
                name: c.name || c.full_name || c.email || 'Team-Mitglied',
                email: c.email || ''
              };
            }
          });
        }
      } catch (e) {}
    }
  }

  try {
    const formBody = new URLSearchParams({
      sync_token: '*',
      resource_types: JSON.stringify(['collaborators', 'user'])
    });
    const syncRes = await fetch(`${TODOIST_V1_DIRECT}/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody.toString(),
      cache: 'no-store'
    });
    if (syncRes.ok) {
      const syncData = await syncRes.json();
      if (syncData?.user?.id) {
        collaboratorMap[String(syncData.user.id)] = {
          id: String(syncData.user.id),
          name: syncData.user.full_name || 'Hauptkonto',
          email: syncData.user.email || ''
        };
      }
      if (Array.isArray(syncData?.collaborators)) {
        syncData.collaborators.forEach(c => {
          if (c?.id) {
            collaboratorMap[String(c.id)] = {
              id: String(c.id),
              name: c.full_name || c.name || c.email || 'Team-Mitglied',
              email: c.email || ''
            };
          }
        });
      }
    }
  } catch (e) {}

  return {
    projects,
    shoppingProjectId: String(shoppingProj?.id || projects[0]?.id || ''),
    tasksProjectId: String(tasksProj?.id || projects[0]?.id || ''),
    collaborators: Object.values(collaboratorMap)
  };
}

export async function pullFromTodoistTwoWay(token, config, currentTasks, currentFamilyNotes, members) {
  if (!token || !token.trim()) return null;

  const allRemoteRaw = await todoistFetch(token, '/tasks');
  const allRemote = Array.isArray(allRemoteRaw) ? allRemoteRaw : [];
  const activeRemoteIds = new Set(allRemote.map(rt => String(rt.id)));

  const defaultShopProjId = String(
    currentFamilyNotes?.[0]?.todoistProjectId || config?.shoppingProjectId || ''
  );
  const defaultTasksProjId = String(config?.tasksProjectId || '');

  const noteProjectIds = new Set();
  (currentFamilyNotes || []).forEach((note, idx) => {
    const pid = idx === 0 ? (note.todoistProjectId || defaultShopProjId) : note.todoistProjectId;
    if (pid) noteProjectIds.add(String(pid));
  });

  const updatedNotes = (currentFamilyNotes || []).map((note, idx) => {
    const pid = String((idx === 0 ? (note.todoistProjectId || defaultShopProjId) : note.todoistProjectId) || '');
    if (!pid) return note;

    const projRemoteItems = allRemote.filter(rt => String(rt.project_id) === pid);
    const nextItems = (Array.isArray(note.items) ? note.items : []).map(item => {
      if (item.todoistId && !activeRemoteIds.has(String(item.todoistId))) {
        return { ...item, done: true };
      }
      return item;
    });

    projRemoteItems.forEach(rs => {
      const cleanTxt = String(rs.content || '').trim();
      if (!cleanTxt) return;
      const existingIdx = nextItems.findIndex(it =>
        (it.todoistId && String(it.todoistId) === String(rs.id)) ||
        String(it.text || '').trim().toLowerCase() === cleanTxt.toLowerCase()
      );
      if (existingIdx > -1) {
        nextItems[existingIdx] = {
          ...nextItems[existingIdx],
          text: cleanTxt,
          todoistId: String(rs.id),
          done: false
        };
      } else {
        nextItems.unshift({
          text: cleanTxt,
          done: false,
          todoistId: String(rs.id)
        });
      }
    });

    return { ...note, todoistProjectId: pid, items: nextItems };
  });

  const updatedTasks = (Array.isArray(currentTasks) ? currentTasks : []).map(lt => {
    if (lt.todoistId && !activeRemoteIds.has(String(lt.todoistId))) {
      return { ...lt, done: true };
    }
    return lt;
  });

  allRemote.forEach(rt => {
    const rtProjId = String(rt.project_id || '');
    const memberWithThisProject = (Array.isArray(members) ? members : DEFAULT_MEMBERS).find(m => m.id !== 'all' && String(m.todoistProjectId || '') === rtProjId);
    if (noteProjectIds.has(rtProjId) && !memberWithThisProject && rtProjId !== defaultTasksProjId) {
      return;
    }

    const cleanContent = String(rt.content || '').replace(/^\[.*?\]\s*/, '').trim();
    if (!cleanContent) return;

    const existingIdx = updatedTasks.findIndex(lt =>
      (lt.todoistId && String(lt.todoistId) === String(rt.id)) ||
      (String(lt.title || '').trim().toLowerCase() === cleanContent.toLowerCase() && !lt.done)
    );

    const assignedUid = rt.assignee_id || rt.responsible_uid || null;
    let memberKey = 'hans';

    if (assignedUid) {
      const matchedMem = (Array.isArray(members) ? members : DEFAULT_MEMBERS).find(m => String(m.todoistUserId) === String(assignedUid));
      if (matchedMem) memberKey = matchedMem.id;
    } else if (memberWithThisProject) {
      memberKey = memberWithThisProject.id;
    } else {
      const prefix = String(rt.content || '').match(/^\[(.*?)\]/);
      if (prefix) {
        const byName = (Array.isArray(members) ? members : DEFAULT_MEMBERS).find(m =>
          m.name.toLowerCase().startsWith(prefix[1].toLowerCase()) ||
          m.id.toLowerCase() === prefix[1].toLowerCase()
        );
        if (byName) memberKey = byName.id;
      }
    }

    const dueDate = rt.due?.date ? rt.due.date.slice(0, 10) : '';
    const dueTime = rt.due?.datetime
      ? rt.due.datetime.slice(11, 16)
      : (rt.due?.date && rt.due.date.length >= 16 ? rt.due.date.slice(11, 16) : '');
    const dueLabel = dueDate
      ? `Bis ${dueDate.slice(8, 10)}.${dueDate.slice(5, 7)}.${dueTime ? ' ' + dueTime + ' Uhr' : ''}`
      : (rt.due?.string || 'Offen');

    const priorityNum = Number(rt.priority || 1);

    if (existingIdx > -1) {
      updatedTasks[existingIdx] = {
        ...updatedTasks[existingIdx],
        todoistId: String(rt.id),
        projectId: rtProjId,
        title: cleanContent,
        description: rt.description || updatedTasks[existingIdx].description || '',
        priority: priorityNum,
        member: memberKey,
        due: dueLabel,
        dueDate: dueDate || updatedTasks[existingIdx].dueDate,
        dueTime: dueTime || updatedTasks[existingIdx].dueTime,
        done: false
      };
    } else {
      updatedTasks.unshift({
        id: Date.now() + Math.floor(Math.random() * 100000),
        todoistId: String(rt.id),
        projectId: rtProjId,
        member: memberKey,
        title: cleanContent,
        description: rt.description || '',
        priority: priorityNum,
        due: dueLabel,
        dueDate,
        dueTime,
        notifyTime: dueTime ? '15m' : 'none',
        done: false
      });
    }
  });

  return { tasks: updatedTasks, familyNotes: updatedNotes };
}

export async function createTodoistTaskItem(
  token,
  projectId,
  title,
  memberObj,
  dueDate,
  dueTime,
  priority = 1,
  description = '',
  notifyTime = '15m'
) {
  if (!token || !projectId) return null;
  const rawBody = {
    content: memberObj?.todoistUserId ? title : (memberObj?.name ? `[${memberObj.name}] ${title}` : title),
    project_id: String(projectId),
    priority: Number(priority || 1)
  };

  if (description && description.trim()) {
    rawBody.description = description.trim();
  }
  if (memberObj?.todoistUserId) {
    rawBody.assignee_id = String(memberObj.todoistUserId);
  }
  if (dueDate && dueTime) {
    rawBody.due_datetime = new Date(`${dueDate}T${dueTime}:00`).toISOString();
  } else if (dueDate) {
    rawBody.due_date = dueDate;
  } else if (dueTime) {
    const today = formatDateStr(new Date());
    rawBody.due_datetime = new Date(`${today}T${dueTime}:00`).toISOString();
  }

  const created = await todoistFetch(token, '/tasks', {
    method: 'POST',
    rawBody
  });

  if (created?.id && notifyTime && notifyTime !== 'none' && (dueTime || dueDate)) {
    await addTodoistRelativeReminder(token, created.id, notifyTime);
  }

  return created;
}

export async function updateTodoistTaskItem(token, todoistId, updates) {
  if (!token || !todoistId) return null;
  const rawBody = {};
  if (updates.title) rawBody.content = updates.title;
  if (updates.description !== undefined) rawBody.description = updates.description;
  if (updates.priority) rawBody.priority = Number(updates.priority);
  if (updates.assigneeId) rawBody.assignee_id = String(updates.assigneeId);

  if (updates.dueDate && updates.dueTime) {
    rawBody.due_datetime = new Date(`${updates.dueDate}T${updates.dueTime}:00`).toISOString();
  } else if (updates.dueDate) {
    rawBody.due_date = updates.dueDate;
  }

  const res = await todoistFetch(token, `/tasks/${todoistId}`, {
    method: 'POST',
    rawBody
  });

  if (updates.notifyTime && updates.notifyTime !== 'none') {
    await addTodoistRelativeReminder(token, todoistId, updates.notifyTime);
  }
  return res;
}

export async function closeOrReopenTodoistTask(token, todoistId, makeDone) {
  if (!token || !todoistId) return;
  const action = makeDone ? 'close' : 'reopen';
  return todoistFetch(token, `/tasks/${todoistId}/${action}`, { method: 'POST' });
}

export async function deleteTodoistTask(token, todoistId) {
  if (!token || !todoistId) return;
  return todoistFetch(token, `/tasks/${todoistId}`, { method: 'DELETE' });
}
