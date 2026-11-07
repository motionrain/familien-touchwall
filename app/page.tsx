// @ts-nocheck
'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calendar,
  GraduationCap,
  CheckCircle2,
  Utensils,
  StickyNote,
  Palette,
  Globe,
  Plus,
  Smartphone,
  Cloud,
  Upload,
  Trash2,
  Bell,
  QrCode,
  ShoppingBag,
  RotateCcw,
  Check,
  X,
  Copy,
  Download,
  RefreshCw,
  WifiOff,
  Maximize2,
  Send,
  Sparkles,
  Rocket
} from 'lucide-react';

// ============================================================================
// 1. FARBPALETTEN & 7 THEMES (INKL. DUNKLEM METAL SILVER, LIGHT DARK, IRON GRAY)
// ============================================================================
const COLOR_PALETTES = {
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

  sky:     { name: 'Himmelblau (Sanft)', hex: '#0284c7', border: '#0369a1', light: '#e0f2fe', text: '#0369a1', bold: false },
  pink:    { name: 'Rosé (Sanft)',       hex: '#db2777', border: '#be185d', light: '#fce7f3', text: '#be185d', bold: false },
  emerald: { name: 'Smaragd (Sanft)',    hex: '#16a34a', border: '#15803d', light: '#dcfce7', text: '#15803d', bold: false },
  amber:   { name: 'Sonnengelb (Sanft)', hex: '#d97706', border: '#b45309', light: '#fef3c7', text: '#b45309', bold: false },
  purple:  { name: 'Lavendel (Sanft)',   hex: '#9333ea', border: '#7e22ce', light: '#f3e8ff', text: '#7e22ce', bold: false },
  rose:    { name: 'Koralle (Sanft)',    hex: '#e11d48', border: '#be123c', light: '#ffe4e6', text: '#be123c', bold: false },
  teal:    { name: 'Türkis (Sanft)',     hex: '#0d9488', border: '#0f766e', light: '#ccfbf1', text: '#0f766e', bold: false },
  indigo:  { name: 'Indigo (Sanft)',     hex: '#4f46e5', border: '#3730a3', light: '#e0e7ff', text: '#3730a3', bold: false },
  lime:    { name: 'Limette (Sanft)',    hex: '#65a30d', border: '#3f6212', light: '#ecfccb', text: '#3f6212', bold: false },
  cyan:    { name: 'Petrol (Sanft)',     hex: '#0891b2', border: '#0e7490', light: '#cffafe', text: '#0e7490', bold: false }
};

const PAGE_THEMES = [
  {
    id: 'metal',
    name: '⚙️ Metal Silver',
    desc: 'Edler Titan- & Gunmetal-Mix (Abgedunkeltes Metallic-Grau)',
    dark: true,
    outerBg: '#242424',
    shellBg: '#363636',
    sidebarBg: 'linear-gradient(180deg, #474747 0%, #2e2e2e 65%, #232323 100%)',
    headerBg: 'linear-gradient(135deg, #4a4a4a 0%, #363636 55%, #282828 100%)',
    viewportBg: '#2e2e2e',
    cardBg: '#434343',
    subtleBg: '#383838',
    weekendBg: 'rgba(20, 20, 20, 0.50)',
    textMain: '#f8fafc',
    textMuted: '#d4d4d8',
    borderColor: '#6e6e6e',
    kwBar: '#1a1a1a',
    accentBtn: '#525252'
  },
  {
    id: 'lightdark',
    name: '🌗 Light Dark',
    desc: 'Material Admin Slate / Blaugrau-Petrol mit hohem Kontrast',
    dark: true,
    outerBg: '#141b1e',
    shellBg: '#212a2e',
    sidebarBg: '#1c2428',
    headerBg: '#1c2428',
    viewportBg: '#182024',
    cardBg: '#2b363c',
    subtleBg: '#232d32',
    weekendBg: 'rgba(15, 21, 24, 0.58)',
    textMain: '#eceff1',
    textMuted: '#90a4ae',
    borderColor: '#455a64',
    kwBar: '#11171a',
    accentBtn: '#00897b'
  },
  {
    id: 'irongray',
    name: '🛡️ Iron Gray',
    desc: 'Digital Designer Graphit & Schmiedeeisen-Anthrazit',
    dark: true,
    outerBg: '#0c0d0f',
    shellBg: '#17181c',
    sidebarBg: 'linear-gradient(180deg, #1b1d22 0%, #121316 100%)',
    headerBg: '#16181c',
    viewportBg: '#111215',
    cardBg: '#212328',
    subtleBg: '#1a1c20',
    weekendBg: 'rgba(9, 10, 12, 0.68)',
    textMain: '#f3f4f6',
    textMuted: '#9ca3af',
    borderColor: '#383b44',
    kwBar: '#08090b',
    accentBtn: '#3b3f48'
  },
  {
    id: 'light',
    name: '☀️ Klassisch Hell',
    desc: 'Klares, helles Wandkalender-Design',
    dark: false,
    outerBg: '#cbd5e1',
    shellBg: '#ffffff',
    sidebarBg: '#f8fafc',
    headerBg: '#ffffff',
    viewportBg: '#f1f5f9',
    cardBg: '#ffffff',
    subtleBg: '#f1f5f9',
    weekendBg: 'rgba(226, 232, 240, 0.65)',
    textMain: '#0f172a',
    textMuted: '#475569',
    borderColor: '#cbd5e1',
    kwBar: '#1e293b',
    accentBtn: '#4f46e5'
  },
  {
    id: 'cozy',
    name: '🌅 Warm Cozy',
    desc: 'Sanfte Sand- und Naturtöne für Wohnräume',
    dark: false,
    outerBg: '#e7ddd3',
    shellBg: '#fffdf9',
    sidebarBg: '#f5efe6',
    headerBg: '#fffdf9',
    viewportBg: '#faf6f0',
    cardBg: '#ffffff',
    subtleBg: '#f5efe6',
    weekendBg: 'rgba(230, 220, 207, 0.65)',
    textMain: '#3d2f1d',
    textMuted: '#786655',
    borderColor: '#d5c7b4',
    kwBar: '#5c4738',
    accentBtn: '#b45309'
  },
  {
    id: 'mint',
    name: '🌿 Nordic Mint',
    desc: 'Frisches Skandinavien-Grün',
    dark: false,
    outerBg: '#cce3de',
    shellBg: '#f6fff8',
    sidebarBg: '#eaf4f4',
    headerBg: '#f6fff8',
    viewportBg: '#edf6f3',
    cardBg: '#ffffff',
    subtleBg: '#e3f2ed',
    weekendBg: 'rgba(204, 227, 222, 0.65)',
    textMain: '#1b4332',
    textMuted: '#40685e',
    borderColor: '#b7decb',
    kwBar: '#1b4332',
    accentBtn: '#0d9488'
  },
  {
    id: 'dark',
    name: '🌙 Midnight Dark',
    desc: 'Tiefdunkler Nachtmodus (blendfrei am Abend)',
    dark: true,
    outerBg: '#020617',
    shellBg: '#0f172a',
    sidebarBg: '#0b1120',
    headerBg: '#0f172a',
    viewportBg: '#060b16',
    cardBg: '#1e293b',
    subtleBg: '#152033',
    weekendBg: 'rgba(2, 6, 23, 0.72)',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    borderColor: '#334155',
    kwBar: '#1e1b4b',
    accentBtn: '#4f46e5'
  }
];

const AVATAR_EMOJIS = ['👨‍👩‍👧‍👦', '👨', '👩', '👦', '👧', '🏎️', '💻', '🐕', '🐴', '⚽', '🎮', '🎨', '🦸‍♂️', '🦸‍♀️', '👑', '🦊', '📅'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const NOTE_COLOR_THEMES = {
  amber:  { label: 'Gelb', lightBg: '#fffbeb', lightBorder: '#fcd34d', darkBg: 'rgba(245, 158, 11, 0.16)', darkBorder: '#d97706' },
  sky:    { label: 'Blau', lightBg: '#f0f9ff', lightBorder: '#7dd3fc', darkBg: 'rgba(14, 165, 233, 0.16)', darkBorder: '#0284c7' },
  pink:   { label: 'Rosé', lightBg: '#fdf2f8', lightBorder: '#f9a8d4', darkBg: 'rgba(236, 72, 153, 0.16)', darkBorder: '#db2777' },
  emerald:{ label: 'Grün', lightBg: '#ecfdf5', lightBorder: '#6ee7b7', darkBg: 'rgba(16, 185, 129, 0.16)', darkBorder: '#059669' },
  purple: { label: 'Lila', lightBg: '#faf5ff', lightBorder: '#d8b4fe', darkBg: 'rgba(168, 85, 247, 0.16)', darkBorder: '#9333ea' }
};

// ============================================================================
// 2. BADEN-WÜRTTEMBERG FEIERTAGE & SCHULFERIEN (AUTOMATISCHE BERECHNUNG)
// ============================================================================
const BW_SCHOOL_VACATIONS = [
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
  { start: '2027-12-23', end: '2028-01-08', name: 'Weihnachtsferien BW' },
  { start: '2028-04-10', end: '2028-04-22', name: 'Osterferien BW' },
  { start: '2028-06-06', end: '2028-06-17', name: 'Pfingstferien BW' },
  { start: '2028-07-27', end: '2028-09-09', name: 'Sommerferien BW' },
  { start: '2028-10-30', end: '2028-11-03', name: 'Herbstferien BW' }
];

function formatDateStr(dateObj) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

function addDays(dateObj, days) {
  const copy = new Date(dateObj);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getISOWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

const bwHolidayCache = {};
function getBWHolidaysForYear(year) {
  if (bwHolidayCache[year]) return bwHolidayCache[year];
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const map = {
    [`${year}-01-01`]: 'Neujahr',
    [`${year}-01-06`]: 'Heilige Drei Könige',
    [`${year}-05-01`]: 'Tag der Arbeit',
    [`${year}-10-03`]: 'Tag der Dt. Einheit',
    [`${year}-11-01`]: 'Allerheiligen',
    [`${year}-12-25`]: '1. Weihnachtstag',
    [`${year}-12-26`]: '2. Weihnachtstag',
    [formatDateStr(addDays(easter, -2))]: 'Karfreitag',
    [formatDateStr(addDays(easter, 0))]: 'Ostersonntag',
    [formatDateStr(addDays(easter, 1))]: 'Ostermontag',
    [formatDateStr(addDays(easter, 39))]: 'Christi Himmelfahrt',
    [formatDateStr(addDays(easter, 49))]: 'Pfingstsonntag',
    [formatDateStr(addDays(easter, 50))]: 'Pfingstmontag',
    [formatDateStr(addDays(easter, 60))]: 'Fronleichnam'
  };
  bwHolidayCache[year] = map;
  return map;
}

function getBWHolidayName(dateStr) {
  if (!dateStr) return null;
  const year = Number(dateStr.slice(0, 4));
  return getBWHolidaysForYear(year)[dateStr] || null;
}

function getBWVacationName(dateStr) {
  if (!dateStr) return null;
  const found = BW_SCHOOL_VACATIONS.find(v => dateStr >= v.start && dateStr <= v.end);
  return found ? found.name : null;
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#2563eb').replace('#', '');
  const num = parseInt(clean, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// ============================================================================
// 3. INITIAL-DATEN (EXAKT WIE AUF DEINEN SCREENSHOTS)
// ============================================================================
const INITIAL_MEMBERS = [
  { id: 'all',       name: 'Familie & Events', role: 'Alle gemeinsam', badge: 'FR', color: 'orange_bold',  avatarType: 'emoji', emoji: '👨‍👩‍👧‍👦', photoUrl: '', calendarId: 'primary', statusMsg: 'Hauptkalender', ok: true },
  { id: 'hans',      name: 'Hans',             role: 'Vater',          badge: 'H',  color: 'navy_bold',    avatarType: 'photo', emoji: '🏎️',     photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', calendarId: 'hans.richter@gmail.com', statusMsg: 'Verbunden', ok: true },
  { id: 'sarah',     name: 'Sarah',            role: 'Mutter',         badge: 'S',  color: 'pink',         avatarType: 'photo', emoji: '👩',     photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', calendarId: 'sarah.richter@gmail.com', statusMsg: 'Verbunden', ok: true },
  { id: 'dean',      name: 'Dean',             role: 'Sohn',           badge: 'D',  color: 'crimson_bold', avatarType: 'emoji', emoji: '⚽',     photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=120&q=80', calendarId: 'dean_cal@group.calendar.google.com', statusMsg: 'Verbunden', ok: true },
  { id: 'valentina', name: 'Valentina',        role: 'Tochter',        badge: 'V',  color: 'teal_bold',    avatarType: 'emoji', emoji: '🐴',     photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', calendarId: 'valentina_cal@group.calendar.google.com', statusMsg: 'Verbunden', ok: true }
];

const INITIAL_EVENTS = [
  { id: 'ev1', title: 'Ponyhof Hummel', date: '2026-11-06', time: '15:00 - 18:00', member: 'all', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['hans', 'sarah', 'valentina'] },
  { id: 'ev2', title: 'Ponyführen?', date: '2026-11-07', time: '14:00 - 16:00', member: 'all', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['sarah', 'valentina'] },
  { id: 'ev3', title: 'Development', date: '2026-11-04', time: '22:45 - 23:45', member: 'hans', notifyTime: '30m', notifyChannel: 'push', notifyUsers: ['hans'] },
  { id: 'ev4', title: 'Herzlichen Glückwunsch zum Geburtstag!', date: '2026-11-05', time: 'Ganztägig', member: 'hans', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['hans', 'sarah', 'dean', 'valentina'] },
  { id: 'ev5', title: 'Schadstoffannahme Deponie', date: '2026-11-06', time: 'Ganztägig', member: 'hans', notifyTime: '30m', notifyChannel: 'push', notifyUsers: ['hans'] },
  { id: 'ev6', title: '✔️ Kartbahn Rheinfelden (Halbtags Früh)', date: '2026-11-08', time: '10:00 - 14:00', member: 'hans', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['hans', 'dean'] },
  { id: 'ev7', title: 'Lernen', date: '2026-11-05', time: '15:00 - 16:00', member: 'dean', notifyTime: '1d', notifyChannel: 'wall_push', notifyUsers: ['dean'] },
  { id: 'ev8', title: '🎂 Papa Geburtstag', date: '2026-11-05', time: '18:00 - 19:30', member: 'dean', notifyTime: '1d', notifyChannel: 'wall_push', notifyUsers: ['dean'] },
  { id: 'ev9', title: '🎂 Papa Geburtstag', date: '2026-11-05', time: '18:00 - 19:30', member: 'valentina', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['valentina'] },
  { id: 'ev10', title: '🧘‍♀️ Yoga & Entspannung', date: '2026-11-03', time: '18:30 - 19:45', member: 'sarah', notifyTime: '30m', notifyChannel: 'push', notifyUsers: ['sarah'] },
  { id: 'ev11', title: '⚽ Fußballtraining', date: '2026-11-10', time: '16:30 - 18:00', member: 'dean', notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['dean', 'hans'] },
  { id: 'ev12', title: '🏮 Sankt Martin Umzug', date: '2026-11-11', time: '17:30 - 19:00', member: 'all', notifyTime: '1h', notifyChannel: 'wall_push', notifyUsers: ['hans', 'sarah', 'dean', 'valentina'] }
];

const INITIAL_SCHOOL = {
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

const INITIAL_MEALS = [
  { id: 1, dayLabel: 'Montag',     dish: '🍝 Glutenfreie Spaghetti Bolognese', ingredients: [{ name: 'Glutenfreie Spaghetti', done: true }, { name: 'Rinderhackfleisch 500g', done: false }, { name: 'Passierte Tomaten', done: true }, { name: 'Parmesan', done: false }] },
  { id: 2, dayLabel: 'Dienstag',   dish: '🥞 Pfannkuchen mit Apfelmus',        ingredients: [{ name: 'Glutenfreies Mehl', done: true }, { name: 'Eier (6 Stück)', done: true }, { name: 'Milch', done: false }, { name: 'Apfelmus im Glas', done: false }] },
  { id: 3, dayLabel: 'Mittwoch',   dish: '🥦 Gemüse-Wok mit Reis',             ingredients: [{ name: 'Basmatireis', done: true }, { name: 'Brokkoli & Paprika', done: false }, { name: 'Hähnchenbrust', done: false }, { name: 'Tamari (GF Sojasoße)', done: true }] },
  { id: 4, dayLabel: 'Donnerstag', dish: '🧀 Hausgemachte Mac & Cheese (GF)',  ingredients: [{ name: 'Glutenfreie Hörnchennudeln', done: true }, { name: 'Cheddar & Gouda gerieben', done: false }, { name: 'Maisstärke', done: true }, { name: 'Butter & Milch', done: true }] },
  { id: 5, dayLabel: 'Freitag',    dish: '🌮 Familien-Taco Abend',             ingredients: [{ name: 'Mais-Tacoschalen', done: false }, { name: 'Hackfleisch & Mais', done: false }, { name: 'Guacamole / Avocado', done: false }, { name: 'Salsa & Sauerrahm', done: true }] },
  { id: 6, dayLabel: 'Samstag',    dish: '🍕 Pizza-Abend',                     ingredients: [{ name: 'Glutenfreier Pizzateig', done: false }, { name: 'Mozzarella', done: false }, { name: 'Salami & Champignons', done: false }] },
  { id: 7, dayLabel: 'Sonntag',    dish: '🍗 Sonntagsbraten & Ofenkartoffeln', ingredients: [{ name: 'Kartoffeln 1,5 kg', done: true }, { name: 'Sonntagsbraten / Hähnchen', done: false }, { name: 'Grüner Salat', done: false }] }
];

const INITIAL_NOTES = [
  { id: 1, title: '🛒 Einkaufsliste (Geteilt)', color: 'amber', author: 'Sarah & Hans', items: [{ text: 'Glutenfreier Blätterteig', done: false }, { text: 'Fisch Seesternchen', done: false }, { text: 'Katzenfutter Norma', done: false }, { text: 'Frische Milch & Kaffeebohnen', done: true }] },
  { id: 2, title: '📌 Wichtige Familien-Infos', color: 'sky', author: 'Hans', items: [{ text: 'Ponyhof Dienstplan am Wochenende prüfen', done: false }, { text: 'Müllabfuhr Gelber Sack: Dienstag früh', done: false }] },
  { id: 3, title: '🎁 Ideen & Besorgungen', color: 'pink', author: 'Familie', items: [{ text: 'Dean: Neue Fußballschuhe schauen', done: false }, { text: 'Valentina: Bastelset & Reithandschuhe', done: false }] }
];

const INITIAL_TASKS = [
  { id: 1, member: 'hans',      title: 'Touchwall Vollbild & Google Sync prüfen', due: 'Heute', done: false },
  { id: 2, member: 'sarah',     title: 'Essensplan für nächste Woche durchsehen', due: 'Morgen', done: false },
  { id: 3, member: 'dean',      title: '🎒 Schultasche & Sportzeug richten', due: 'Heute', done: false },
  { id: 4, member: 'valentina', title: '🧸 Zimmer aufräumen & 15 Min. Lesen', due: 'Heute', done: false }
];

// ============================================================================
// 4. HAUPT-APP KOMPONENTE (VERCEL & NEXT.JS READY)
// ============================================================================
export default function App() {
  // Navigation & Ansichten
  const [currentThemeId, setCurrentThemeId] = useState('metal');
  const [activeSection, setActiveSection] = useState('kalender');
  const [currentView, setCurrentView] = useState('1w');
  const [activeMemberFilter, setActiveMemberFilter] = useState('all');
  const [pocketMode, setPocketMode] = useState(false);

  // Kalender-Basisdatum (KW 45: 02.11.2026, Heute = Do 05.11.2026)
  const [currentBaseDate, setCurrentBaseDate] = useState(() => new Date(2026, 10, 2));
  const TODAY_STR = '2026-11-05';

  // Kern-Daten
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [schoolData, setSchoolData] = useState(INITIAL_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [mealPlan, setMealPlan] = useState(INITIAL_MEALS);
  const [familyNotes, setFamilyNotes] = useState(INITIAL_NOTES);
  const [familyTasks, setFamilyTasks] = useState(INITIAL_TASKS);

  // Drag & Drop State
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dropTargetCell, setDropTargetCell] = useState(null);

  // Uhrzeit, Offline-Status & Toasts
  const [clockStr, setClockStr] = useState('20:55');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Modals
  const [eventModal, setEventModal] = useState({
    open: false,
    id: '',
    title: '',
    date: TODAY_STR,
    time: '15:00 - 16:00',
    member: 'hans',
    notifyTime: '30m',
    notifyChannel: 'wall_push',
    notifyUsers: ['hans']
  });
  const [yearDayModal, setYearDayModal] = useState({
    open: false,
    date: TODAY_STR,
    newTitle: '',
    newTime: 'Ganztägig',
    newMember: 'all'
  });
  const [schoolModal, setSchoolModal] = useState({
    open: false,
    dayIdx: 0,
    periodIdx: 0,
    subject: '',
    room: '',
    status: 'normal'
  });
  const [addCalModal, setAddCalModal] = useState({
    open: false,
    name: '',
    role: 'Zusatz-Kalender',
    calendarId: '',
    color: 'teal_bold',
    emoji: '📅'
  });
  const [qrModal, setQrModal] = useState({ open: false, selectedMember: 'all' });
  const [vercelGuideModalOpen, setVercelGuideModalOpen] = useState(false);

  // Vercel / Google Apps Script API-Brücke & Google Drive Backup
  const defaultEnvUrl =
    typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
      ? process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
      : '';
  const [appsScriptUrl, setAppsScriptUrl] = useState(defaultEnvUrl);
  const [driveBackupStatus, setDriveBackupStatus] = useState('Bereit für Google Drive & Cloud-Sync');
  const [isSyncingBridge, setIsSyncingBridge] = useState(false);

  // Formular-Inputs für Unterseiten
  const [newSchoolNote, setNewSchoolNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMember, setNewTaskMember] = useState('hans');
  const [columnTaskInputs, setColumnTaskInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [newNoteBlock, setNewNoteBlock] = useState({ title: '', author: 'Familie', color: 'amber' });
  const [newMealBlock, setNewMealBlock] = useState({ dayLabel: '', dish: '' });
  const [ingInputs, setIngInputs] = useState({});

  const logoFileInputRef = useRef(null);
  const memberPhotoInputRef = useRef(null);
  const jsonImportInputRef = useRef(null);
  const [photoTargetMemberId, setPhotoTargetMemberId] = useState(null);

  const theme = useMemo(
    () => PAGE_THEMES.find(t => t.id === currentThemeId) || PAGE_THEMES[0],
    [currentThemeId]
  );

  const showToast = useCallback((title, message, icon = '🔔') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  // Initiales Laden aus LocalStorage & URL-Parameter-Check (z.B. ?mobile=1&section=listen)
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('richter_vercel_touchwall_v1');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed.members) && parsed.members.length >= 5) setMembers(parsed.members);
        if (Array.isArray(parsed.events) && parsed.events.length > 0) setEvents(parsed.events);
        if (parsed.schoolData?.dean) setSchoolData(parsed.schoolData);
        if (Array.isArray(parsed.mealPlan) && parsed.mealPlan.length > 0) setMealPlan(parsed.mealPlan);
        if (Array.isArray(parsed.familyNotes) && parsed.familyNotes.length > 0) setFamilyNotes(parsed.familyNotes);
        if (Array.isArray(parsed.familyTasks)) setFamilyTasks(parsed.familyTasks);
        if (parsed.currentTheme) setCurrentThemeId(parsed.currentTheme);
        if (parsed.customLogoUrl) setCustomLogoUrl(parsed.customLogoUrl);
        if (parsed.appsScriptUrl && !defaultEnvUrl) setAppsScriptUrl(parsed.appsScriptUrl);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('mobile') === '1' || window.innerWidth < 680) {
        setPocketMode(true);
      }
      const sec = params.get('section');
      if (sec) setActiveSection(sec);
      const usr = params.get('user');
      if (usr) setActiveMemberFilter(usr);
    } catch (e) {}
  }, [defaultEnvUrl]);

  // Automatisches lokales Speichern bei jeder Änderung (Supermarkt-Offline-Schutz)
  useEffect(() => {
    try {
      const payload = {
        currentTheme: currentThemeId,
        customLogoUrl,
        appsScriptUrl,
        members,
        events,
        schoolData,
        mealPlan,
        familyNotes,
        familyTasks,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('richter_vercel_touchwall_v1', JSON.stringify(payload));
    } catch (e) {}
  }, [currentThemeId, customLogoUrl, appsScriptUrl, members, events, schoolData, mealPlan, familyNotes, familyTasks]);

  // Live-Uhrzeit & Online/Offline-Überwachung
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Wieder online', 'Synchronisiere gepufferte Änderungen mit der Cloud...', '🌐');
      setOfflineQueueCount(0);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline-Modus aktiv', 'Du kannst im Supermarkt weiter abhaken – alles wird lokal gepuffert!', '📶');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // ============================================================================
  // 5. GOOGLE APPS SCRIPT & GOOGLE DRIVE CLOUD-BRIDGE (FÜR VERCEL)
  // ============================================================================
  const getFullExportPayload = useCallback(() => ({
    version: 'vercel-touchwall-v2',
    exportedAt: new Date().toISOString(),
    currentTheme: currentThemeId,
    customLogoUrl,
    members,
    events,
    schoolData,
    mealPlan,
    familyNotes,
    familyTasks
  }), [currentThemeId, customLogoUrl, members, events, schoolData, mealPlan, familyNotes, familyTasks]);

  const handleExportLocalJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getFullExportPayload(), null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `familien_touchwall_backup_${TODAY_STR}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Backup-Datei erstellt', 'JSON-Export wurde heruntergeladen (bereit für Google Drive).', '📦');
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.members) && parsed.members.length >= 5) setMembers(parsed.members);
        if (Array.isArray(parsed.events)) setEvents(parsed.events);
        else if (Array.isArray(parsed.localEvents)) setEvents(parsed.localEvents);
        if (parsed.schoolData) setSchoolData(parsed.schoolData);
        if (Array.isArray(parsed.mealPlan)) setMealPlan(parsed.mealPlan);
        if (Array.isArray(parsed.familyNotes)) setFamilyNotes(parsed.familyNotes);
        if (Array.isArray(parsed.familyTasks)) setFamilyTasks(parsed.familyTasks);
        if (parsed.currentTheme) setCurrentThemeId(parsed.currentTheme);
        if (parsed.customLogoUrl) setCustomLogoUrl(parsed.customLogoUrl);
        showToast('1:1 Backup importiert!', 'Alle Daten, Farben, Konten & Pläne wurden wiederhergestellt.', '🎉');
      } catch (err) {
        showToast('Import-Fehler', 'Die gewählte JSON-Datei ist ungültig.', '⚠️');
      }
    };
    reader.readAsText(file);
  };

  const handlePushToGoogleDriveBridge = async (silent = false) => {
    if (!navigator.onLine) {
      setOfflineQueueCount(prev => prev + 1);
      if (!silent) showToast('Offline gespeichert', 'Wird automatisch mit Google synchronisiert, sobald Netz da ist.', '📶');
      return;
    }
    if (!appsScriptUrl.trim()) {
      if (!silent) {
        handleExportLocalJson();
        setDriveBackupStatus(`Lokales Backup gesichert (${clockStr}) – Für Live-Cloud-Sync oben Apps-Script-URL eintragen`);
      }
      return;
    }
    setIsSyncingBridge(true);
    setDriveBackupStatus('Synchronisiere mit Google Kalender, Tasks & Google Drive...');
    try {
      await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveDriveAndSync',
          payload: getFullExportPayload()
        })
      });
      setDriveBackupStatus(`✅ In Google Drive („Familien_Touchwall_Backup.json“) & Kalender synchronisiert (${clockStr})`);
      if (!silent) showToast('Cloud & Drive Sync aktiv', 'Kalender, Google Tasks & Google Drive sind aktuell!', '☁️');
    } catch (err) {
      setDriveBackupStatus('⚠️ Lokal gesichert – bitte Apps-Script-URL prüfen');
    } finally {
      setIsSyncingBridge(false);
    }
  };

  const handlePullFromGoogleBridge = useCallback(async (showFeedback = true) => {
    if (!appsScriptUrl.trim()) {
      if (showFeedback) {
        showToast('Apps-Script-Brücke', 'Trage unter „Konten“ deine Google Apps Script Web-App-URL ein, um live zu synchronisieren.', 'ℹ️');
      }
      return;
    }
    setIsSyncingBridge(true);
    try {
      const sep = appsScriptUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${appsScriptUrl.trim()}${sep}action=json`);
      const data = await res.json();
      if (data?.state) {
        const s = data.state;
        if (Array.isArray(s.members) && s.members.length >= 5) setMembers(s.members);
        if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
        if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
        if (s.schoolData?.dean) setSchoolData(s.schoolData);
        if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
        if (s.currentTheme) setCurrentThemeId(s.currentTheme);
        if (s.customLogoUrl) setCustomLogoUrl(s.customLogoUrl);
      }
      if (Array.isArray(data?.calendarData?.events)) {
        setEvents(data.calendarData.events);
      }
      setDriveBackupStatus(`☁️ Live aus Google Kalender, Tasks & Drive geladen (${clockStr})`);
      if (showFeedback) showToast('Google Sync abgeschlossen', 'Alle Familienkalender & Google Tasks wurden aktualisiert!', '✅');
    } catch (err) {
      if (showFeedback) showToast('Verbindungs-Hinweis', 'Prüfe, ob die Apps-Script-Bereitstellung auf „Jeder“ steht.', '⚠️');
    } finally {
      setIsSyncingBridge(false);
    }
  }, [appsScriptUrl, clockStr, showToast]);

  // Automatischer 2-Minuten-Hintergrund-Sync (wenn Apps-Script-URL hinterlegt ist)
  useEffect(() => {
    if (!appsScriptUrl.trim()) return;
    const syncInterval = setInterval(() => {
      if (navigator.onLine) handlePullFromGoogleBridge(false);
    }, 120000);
    return () => clearInterval(syncInterval);
  }, [appsScriptUrl, handlePullFromGoogleBridge]);

  const copyAppsScriptBridgeCode = () => {
    const bridgeSnippet = `// =========================================================================
// ERWEITERUNG FÜR DEINE CODE.GS (Für Vercel / Next.js + Google Drive + Tasks)
// Füge diese 3 Funktionen am Ende deiner bestehenden Code.gs ein und ersetze doGet(e)
// =========================================================================

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'json') {
    const bundle = loadTouchwallBundle();
    return ContentService.createTextOutput(JSON.stringify(bundle))
      .setMimeType(ContentService.MimeType.JSON);
  }
  let template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Familien Touchwall Kalender - Familie Richter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'saveDriveAndSync' && body.payload) {
      saveTouchwallState(body.payload);
      const fileInfo = saveBackupToGoogleDrive(body.payload);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, driveFile: fileInfo }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveBackupToGoogleDrive(payloadObj) {
  const fileName = 'Familien_Touchwall_Backup.json';
  const jsonString = JSON.stringify(payloadObj, null, 2);
  const files = DriveApp.getFilesByName(fileName);
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(jsonString);
  } else {
    file = DriveApp.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
  }
  return { name: file.getName(), url: file.getUrl(), updated: new Date().toISOString() };
}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(bridgeSnippet);
      showToast('Code.gs Erweiterung kopiert!', 'In Google Apps Script einfügen und „Neue Version“ bereitstellen.', '📋');
    }
  };

  // ============================================================================
  // 6. STYLING-HELFER & AVATAR-KOMPONENTE
  // ============================================================================
  const MemberAvatar = ({ member, size = 'w-11 h-11', textSize = 'text-base' }) => {
    const pal = COLOR_PALETTES[member.color] || COLOR_PALETTES.royal_bold;
    if (member.avatarType === 'photo' && member.photoUrl) {
      return (
        <div
          className={`${size} rounded-full shrink-0 overflow-hidden relative flex items-center justify-center font-extrabold text-white shadow-sm`}
          style={{ backgroundColor: pal.hex, border: `2.5px solid ${pal.hex}` }}
        >
          <span>{member.badge}</span>
          <img
            src={member.photoUrl}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      );
    }
    return (
      <div
        className={`${size} rounded-full shrink-0 flex items-center justify-center font-extrabold text-white shadow-sm ${textSize}`}
        style={{ backgroundColor: pal.hex }}
      >
        {member.avatarType === 'emoji' ? (member.emoji || member.badge) : member.badge}
      </div>
    );
  };

  const getRowHeaderStyle = (member) => {
    const pal = COLOR_PALETTES[member.color] || COLOR_PALETTES.royal_bold;
    if (theme.dark) {
      return {
        background: `linear-gradient(90deg, ${hexToRgba(pal.hex, 0.36)} 0%, ${hexToRgba(pal.hex, 0.16)} 100%)`,
        borderLeft: `6px solid ${pal.hex}`
      };
    }
    return {
      background: pal.bold
        ? `linear-gradient(90deg, ${hexToRgba(pal.hex, 0.24)} 0%, ${hexToRgba(pal.hex, 0.10)} 100%)`
        : pal.light,
      borderLeft: `6px solid ${pal.hex}`
    };
  };

  const getCellTintStyle = (member, isWeekend) => {
    const pal = COLOR_PALETTES[member.color] || COLOR_PALETTES.royal_bold;
    if (theme.dark) {
      return {
        backgroundColor: isWeekend ? hexToRgba(pal.hex, 0.28) : hexToRgba(pal.hex, 0.18)
      };
    }
    return {
      backgroundColor: isWeekend ? hexToRgba(pal.hex, 0.25) : hexToRgba(pal.hex, 0.15)
    };
  };

  const getEventCardStyle = (memberId) => {
    const member = members.find(m => m.id === memberId) || members[0];
    const pal = COLOR_PALETTES[member.color] || COLOR_PALETTES.royal_bold;
    if (pal.bold) {
      return {
        backgroundColor: pal.hex,
        borderLeft: `5px solid ${pal.border}`,
        color: '#ffffff'
      };
    }
    if (theme.dark) {
      return {
        backgroundColor: hexToRgba(pal.hex, 0.38),
        borderLeft: `4px solid ${pal.hex}`,
        color: '#f8fafc'
      };
    }
    return {
      backgroundColor: pal.light,
      borderLeft: `4px solid ${pal.hex}`,
      color: pal.text
    };
  };

  // ============================================================================
  // 7. INTERAKTIONS-HANDLER (DRAG & DROP, TERMINE, FOTOS, VOLLBILD)
  // ============================================================================
  const toggleFullScreen = () => {
    const doc = window.document;
    const docEl = doc.documentElement;
    const req = docEl.requestFullscreen || docEl.webkitRequestFullScreen;
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (req) req.call(docEl).catch(() => showToast('Vollbild', 'Drücke F11 auf der Tastatur.', '🖥️'));
    } else if (exit) {
      exit.call(doc);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, 128, 128);
        setCustomLogoUrl(canvas.toDataURL('image/png'));
        showToast('Logo aktualisiert', 'Dein neues Logo sitzt jetzt oben links im Eck!', '🖼️');
      };
      img.src = loadEv.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleMemberPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetMemberId) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, 128, 128);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setMembers(prev => prev.map(m => m.id === photoTargetMemberId ? { ...m, photoUrl: dataUrl, avatarType: 'photo' } : m));
        showToast('Profilfoto gespeichert', 'Das neue Foto wurde sofort übernommen.', '📷');
      };
      img.src = loadEv.target.result;
    };
    reader.readAsDataURL(file);
  };

  const cycleTheme = () => {
    const idx = PAGE_THEMES.findIndex(t => t.id === currentThemeId);
    const next = PAGE_THEMES[(idx + 1) % PAGE_THEMES.length];
    setCurrentThemeId(next.id);
    showToast('Design gewechselt', `Aktives Theme: ${next.name}`, '🎨');
  };

  const navigatePeriod = (dir) => {
    if (currentView === '1w') setCurrentBaseDate(prev => addDays(prev, dir * 7));
    else if (currentView === '2w') setCurrentBaseDate(prev => addDays(prev, dir * 14));
    else if (currentView === '4w') setCurrentBaseDate(prev => addDays(prev, dir * 28));
    else if (currentView === 'year') setCurrentBaseDate(prev => new Date(prev.getFullYear() + dir, prev.getMonth(), 1));
  };

  // Termin-Transfer per Drag & Drop oder 1-Klick im Jahreswand-Popup
  const transferEventToMemberAndDate = (evId, targetMemberId, targetDateStr) => {
    const targetEv = events.find(e => String(e.id) === String(evId));
    if (!targetEv) return;
    const newDate = targetDateStr || targetEv.date;
    if (targetEv.member === targetMemberId && targetEv.date === newDate) return;

    const targetMemberObj = members.find(m => m.id === targetMemberId) || members[0];
    setEvents(prev => prev.map(ev => {
      if (String(ev.id) !== String(evId)) return ev;
      const updatedUsers = Array.isArray(ev.notifyUsers)
        ? [...ev.notifyUsers.filter(u => u !== ev.member), ...(targetMemberId !== 'all' ? [targetMemberId] : [])]
        : [targetMemberId];
      return {
        ...ev,
        member: targetMemberId,
        date: newDate,
        notifyUsers: Array.from(new Set(updatedUsers))
      };
    }));
    showToast('Termin verschoben', `„${targetEv.title}“ → ${targetMemberObj.name} (${newDate})`, '🔄');
  };

  const openNewEventModal = (dateStr = TODAY_STR, memberId = 'hans') => {
    setEventModal({
      open: true,
      id: '',
      title: '',
      date: dateStr,
      time: '15:00 - 16:00',
      member: memberId,
      notifyTime: '30m',
      notifyChannel: 'wall_push',
      notifyUsers: memberId === 'all' ? ['hans', 'sarah', 'dean', 'valentina'] : [memberId]
    });
  };

  const openEditEventModal = (e, ev) => {
    if (e) e.stopPropagation();
    setEventModal({
      open: true,
      id: ev.id,
      title: ev.title,
      date: ev.date,
      time: ev.time || 'Ganztägig',
      member: ev.member,
      notifyTime: ev.notifyTime || '30m',
      notifyChannel: ev.notifyChannel || 'wall_push',
      notifyUsers: Array.isArray(ev.notifyUsers) ? ev.notifyUsers : [ev.member]
    });
  };

  const saveEventModal = (e) => {
    e.preventDefault();
    if (!eventModal.title.trim()) return;
    if (eventModal.id) {
      setEvents(prev => prev.map(item => String(item.id) === String(eventModal.id) ? { ...eventModal } : item));
      showToast('Termin aktualisiert', `„${eventModal.title}“ (${eventModal.notifyTime} Erinnerung)`, '✅');
    } else {
      setEvents(prev => [...prev, { ...eventModal, id: 'ev_' + Date.now() }]);
      showToast('Termin eingetragen', `„${eventModal.title}“ wurde gespeichert.`, '✅');
    }
    setEventModal(prev => ({ ...prev, open: false }));
  };

  const deleteEventById = (idVal) => {
    const target = events.find(item => String(item.id) === String(idVal));
    setEvents(prev => prev.filter(item => String(item.id) !== String(idVal)));
    setEventModal(prev => ({ ...prev, open: false }));
    showToast('Termin gelöscht', target ? `„${target.title}“ wurde entfernt.` : 'Termin entfernt.', '🗑️');
  };

  const handleAddCustomCalendar = (e) => {
    e.preventDefault();
    if (!addCalModal.name.trim()) return;
    const newMember = {
      id: 'cal_' + Date.now(),
      name: addCalModal.name.trim(),
      role: addCalModal.role.trim() || 'Zusatz-Kalender',
      badge: addCalModal.name.trim().charAt(0).toUpperCase(),
      color: addCalModal.color,
      avatarType: 'emoji',
      emoji: addCalModal.emoji || '📅',
      photoUrl: '',
      calendarId: addCalModal.calendarId.trim() || 'zusatz@group.calendar.google.com',
      statusMsg: 'Verbunden (Synchronisiert)',
      ok: true,
      isCustom: true
    };
    setMembers(prev => [...prev, newMember]);
    setAddCalModal({ open: false, name: '', role: 'Zusatz-Kalender', calendarId: '', color: 'teal_bold', emoji: '📅' });
    showToast('Kalender hinzugefügt', `„${newMember.name}“ ist jetzt als eigene Zeile im Kalender sichtbar!`, '📅');
  };

  const openNoteInGoogleKeep = (note) => {
    const lines = (note.items || []).map(item => `${item.done ? '☑ ' : '☐ '}${item.text}`).join('\n');
    const formatted = `${note.title} (${note.author || 'Familie'})\n\n${lines}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (isMobile && navigator.share) {
      navigator.share({ title: note.title, text: formatted }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    window.open('https://keep.google.com/', '_blank');
    showToast('Liste kopiert! Jetzt Strg+V drücken', `„${note.title}“ liegt in der Zwischenablage für Google Notizen.`, '💡');
  };

  const periodLabel = useMemo(() => {
    if (currentView === 'year') return `Jahreswand ${currentBaseDate.getFullYear()} (BW)`;
    const start = getMonday(currentBaseDate);
    const add = currentView === '1w' ? 6 : currentView === '2w' ? 13 : 27;
    const end = addDays(start, add);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
    return `${fmt(start)} – ${fmt(end)}${end.getFullYear()}`;
  }, [currentBaseDate, currentView]);

  // ============================================================================
  // 8. RENDER-FUNKTIONEN DER ANSICHTEN
  // ============================================================================

  // A1) 1-WOCHE & 2-WOCHEN ANSICHT (INKL. DRAG & DROP, BW-FERIEN & 2PX TRENNLINIEN)
  const renderSwimlaneCalendar = (numDays) => {
    const startMonday = getMonday(currentBaseDate);
    const days = Array.from({ length: numDays }, (_, i) => addDays(startMonday, i));
    const isTwoWeeks = numDays === 14;
    const kw1 = getISOWeek(startMonday);
    const kw2 = getISOWeek(addDays(startMonday, 7));

    const visibleMembers = activeMemberFilter === 'all'
      ? members
      : members.filter(m => m.id === activeMemberFilter || m.id === 'all');

    const gridCols = `190px repeat(${numDays}, minmax(${isTwoWeeks ? '96px' : '130px'}, 1fr))`;

    return (
      <div className="min-w-full min-h-full flex flex-col">
        <div className="sticky top-0 z-20 shadow-sm shrink-0" style={{ backgroundColor: theme.cardBg }}>
          {/* KW-Balken */}
          <div
            className="grid text-white text-xs font-extrabold uppercase tracking-wider border-b"
            style={{ gridTemplateColumns: gridCols, backgroundColor: theme.kwBar, borderColor: theme.borderColor }}
          >
            <div className="px-3 py-2 bg-black/25 flex items-center text-slate-300 border-r-2" style={{ borderColor: theme.borderColor }}>
              ZEITRAUM
            </div>
            <div className="px-3 py-2 flex items-center gap-2" style={{ gridColumn: 'span 7' }}>
              <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white">KW {kw1}</span>
              <span className="text-slate-200">
                {days[0].getDate()}.{days[0].getMonth() + 1}. – {days[6].getDate()}.{days[6].getMonth() + 1}.
              </span>
            </div>
            {isTwoWeeks && (
              <div className="px-3 py-2 flex items-center gap-2 bg-black/20 border-l-4 border-slate-400" style={{ gridColumn: 'span 7' }}>
                <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">KW {kw2}</span>
                <span className="text-amber-100">
                  {days[7].getDate()}.{days[7].getMonth() + 1}. – {days[13].getDate()}.{days[13].getMonth() + 1}.
                </span>
              </div>
            )}
          </div>

          {/* Wochentage-Zeile */}
          <div className="grid border-b-2" style={{ gridTemplateColumns: gridCols, borderColor: theme.borderColor }}>
            <div
              className="p-3 flex items-center justify-between border-r-2"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}
            >
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                FAMILIE
              </span>
              <button
                onClick={() => setActiveSection('design')}
                className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                🎨 Farben
              </button>
            </div>

            {days.map((d, idx) => {
              const dateStr = formatDateStr(d);
              const isToday = dateStr === TODAY_STR;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const isNewWeek = idx === 7;
              const holiday = getBWHolidayName(dateStr);
              const vacation = getBWVacationName(dateStr);

              let headerBg = isWeekend ? theme.weekendBg : theme.cardBg;
              if (holiday) headerBg = theme.dark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.14)';
              else if (vacation) headerBg = theme.dark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.14)';

              return (
                <div
                  key={dateStr}
                  className={`px-2.5 py-2 border-r-2 flex flex-col justify-between ${isNewWeek ? 'border-l-4 border-l-slate-400' : ''}`}
                  style={{ borderColor: theme.borderColor, backgroundColor: headerBg }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => setYearDayModal({ open: true, date: dateStr, newTitle: '', newTime: 'Ganztägig', newMember: 'all' })}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                      title="Tages-Übersicht öffnen"
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-orange-400' : ''}`} style={!isToday ? { color: theme.textMuted } : {}}>
                        {WEEKDAYS_SHORT[d.getDay()]},
                      </span>
                      <span
                        className={`w-7 h-7 text-sm rounded-full flex items-center justify-center font-extrabold ${
                          isToday ? 'bg-orange-500 text-white shadow-sm' : ''
                        }`}
                        style={!isToday ? { color: theme.textMain } : {}}
                      >
                        {d.getDate()}.
                      </span>
                    </div>
                    <button
                      onClick={() => openNewEventModal(dateStr, 'all')}
                      className="w-6 h-6 rounded-lg hover:bg-black/15 font-bold text-sm flex items-center justify-center cursor-pointer"
                      style={{ color: theme.textMuted }}
                    >
                      +
                    </button>
                  </div>
                  {holiday ? (
                    <div className="text-[10px] font-extrabold text-rose-400 truncate mt-0.5" title={holiday}>
                      🎌 {holiday}
                    </div>
                  ) : vacation ? (
                    <div className="text-[10px] font-extrabold text-emerald-400 truncate mt-0.5" title={vacation}>
                      🏖️ {vacation}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Swimlane-Zeilen pro Familienmitglied */}
        <div className="flex-1 flex flex-col divide-y-2" style={{ borderColor: theme.borderColor }}>
          {visibleMembers.map(member => (
            <div
              key={member.id}
              className="grid shrink-0 flex-1 min-h-[132px] items-stretch"
              style={{ gridTemplateColumns: gridCols, borderColor: theme.borderColor }}
            >
              {/* Personen-Spalte links */}
              <div
                className="p-3.5 border-r-2 flex flex-col justify-center sticky left-0 z-10"
                style={{ ...getRowHeaderStyle(member), borderRightColor: theme.borderColor }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar member={member} size="w-11 h-11" textSize="text-lg" />
                    <div className="overflow-hidden">
                      <div className="font-extrabold text-sm lg:text-base truncate" style={{ color: theme.textMain }}>
                        {member.name}
                      </div>
                      <div className="text-xs font-semibold truncate" style={{ color: theme.textMuted }}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('design')}
                    className="w-7 h-7 rounded-lg hover:bg-black/15 flex items-center justify-center shrink-0 cursor-pointer"
                    style={{ color: theme.textMuted }}
                    title="Farbe & Avatar anpassen"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tages-Zellen mit Drag & Drop und 2px Trennlinie */}
              {days.map((d, idx) => {
                const dateStr = formatDateStr(d);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = dateStr === TODAY_STR;
                const isNewWeek = idx === 7;
                const cellKey = `${dateStr}__${member.id}`;
                const isDropActive = dropTargetCell === cellKey;
                const cellEvents = events.filter(e => e.date === dateStr && e.member === member.id);

                return (
                  <div
                    key={dateStr}
                    onClick={() => openNewEventModal(dateStr, member.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dropTargetCell !== cellKey) setDropTargetCell(cellKey);
                    }}
                    onDragLeave={() => {
                      if (dropTargetCell === cellKey) setDropTargetCell(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropTargetCell(null);
                      if (draggedEvent) {
                        transferEventToMemberAndDate(draggedEvent.id, member.id, dateStr);
                        setDraggedEvent(null);
                      }
                    }}
                    className={`p-2 border-r-2 flex flex-col gap-1.5 transition-all hover:brightness-105 cursor-pointer relative overflow-hidden min-w-0 ${
                      isNewWeek ? 'border-l-4 border-l-slate-400' : ''
                    } ${isToday ? 'ring-2 ring-inset ring-orange-400' : ''} ${
                      isDropActive ? 'outline-3 outline-dashed outline-indigo-400 -outline-offset-3' : ''
                    }`}
                    style={{
                      ...getCellTintStyle(member, isWeekend),
                      borderRightColor: theme.borderColor
                    }}
                  >
                    {cellEvents.map(ev => {
                      const notifyBadges = (ev.notifyUsers || [])
                        .map(uid => members.find(x => x.id === uid)?.badge)
                        .filter(Boolean)
                        .join(',');
                      const chIcon = ev.notifyChannel === 'push' ? '📲' : ev.notifyChannel === 'mail' ? '✉️' : '🔔';

                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedEvent(ev);
                          }}
                          onDragEnd={() => {
                            setDraggedEvent(null);
                            setDropTargetCell(null);
                          }}
                          onClick={(e) => openEditEventModal(e, ev)}
                          className="rounded-xl p-2 shadow-sm flex flex-col justify-between cursor-grab active:cursor-grabbing border border-black/15 shrink-0 min-w-0 transition-transform hover:scale-[1.01]"
                          style={getEventCardStyle(member.id)}
                        >
                          <div className="font-extrabold text-xs lg:text-sm leading-snug break-words">
                            {ev.title}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1 flex-wrap">
                            <span className="text-[11px] opacity-90 font-bold truncate">
                              {ev.time}
                            </span>
                            {ev.notifyTime && ev.notifyTime !== 'none' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/25 text-[9px] font-extrabold shrink-0">
                                {chIcon} {notifyBadges ? `${notifyBadges} • ` : ''}{ev.notifyTime}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // A2) 4-WOCHEN-ÜBERSICHT
  const renderFourWeeksCalendar = () => {
    const startMonday = getMonday(currentBaseDate);
    const visibleMembers = activeMemberFilter === 'all'
      ? members
      : members.filter(m => m.id === activeMemberFilter || m.id === 'all');

    return (
      <div className="p-5 space-y-6 w-full">
        {[0, 1, 2, 3].map(w => {
          const weekStart = addDays(startMonday, w * 7);
          const weekEnd = addDays(weekStart, 6);
          const kwNumber = getISOWeek(weekStart);
          const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

          return (
            <div
              key={w}
              className="rounded-3xl border-2 shadow-md overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
            >
              <div className="text-white px-5 py-2.5 flex items-center justify-between" style={{ backgroundColor: theme.kwBar }}>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-0.5 rounded-lg bg-indigo-500 text-xs font-black">KW {kwNumber}</span>
                  <span className="text-sm lg:text-base font-extrabold">
                    {weekStart.getDate()}. {MONTHS_NAMES[weekStart.getMonth()]} – {weekEnd.getDate()}. {MONTHS_NAMES[weekEnd.getMonth()]} {weekEnd.getFullYear()}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-300">Woche {w + 1} von 4</span>
              </div>

              <div
                className="grid border-b-2"
                style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))', backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}
              >
                <div className="p-2.5 text-xs font-extrabold uppercase flex items-center justify-center border-r-2" style={{ borderColor: theme.borderColor, color: theme.textMuted }}>
                  Person
                </div>
                {days.map(d => {
                  const dateStr = formatDateStr(d);
                  const isToday = dateStr === TODAY_STR;
                  const holiday = getBWHolidayName(dateStr);
                  const vacation = getBWVacationName(dateStr);
                  return (
                    <div key={dateStr} className="px-3 py-2 border-r-2 flex items-center justify-between min-w-0" style={{ borderColor: theme.borderColor }}>
                      <span className={`text-xs font-extrabold truncate ${isToday ? 'bg-orange-500 text-white px-2 py-0.5 rounded-full' : ''}`} style={!isToday ? { color: theme.textMain } : {}}>
                        {WEEKDAYS_SHORT[d.getDay()]}, {d.getDate()}. {holiday ? '🎌' : vacation ? '🏖️' : ''}
                      </span>
                      <button onClick={() => openNewEventModal(dateStr, 'all')} className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer">+</button>
                    </div>
                  );
                })}
              </div>

              <div className="divide-y" style={{ borderColor: theme.borderColor }}>
                {visibleMembers.map(member => (
                  <div key={member.id} className="grid items-stretch" style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))' }}>
                    <div className="px-3 py-2.5 border-r-2 flex items-center gap-2.5 min-w-0" style={{ ...getRowHeaderStyle(member), borderRightColor: theme.borderColor }}>
                      <MemberAvatar member={member} size="w-7 h-7" textSize="text-xs" />
                      <span className="text-xs font-bold truncate" style={{ color: theme.textMain }}>{member.name.split(' ')[0]}</span>
                    </div>
                    {days.map(d => {
                      const dateStr = formatDateStr(d);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const cellEvents = events.filter(e => e.date === dateStr && e.member === member.id);
                      return (
                        <div
                          key={dateStr}
                          onClick={() => openNewEventModal(dateStr, member.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedEvent) {
                              transferEventToMemberAndDate(draggedEvent.id, member.id, dateStr);
                              setDraggedEvent(null);
                            }
                          }}
                          className="min-h-[54px] p-1.5 border-r-2 flex flex-col gap-1 cursor-pointer overflow-hidden min-w-0"
                          style={{ ...getCellTintStyle(member, isWeekend), borderRightColor: theme.borderColor }}
                        >
                          {cellEvents.map(ev => (
                            <div
                              key={ev.id}
                              draggable
                              onDragStart={() => setDraggedEvent(ev)}
                              onClick={(e) => openEditEventModal(e, ev)}
                              className="px-2 py-1 rounded text-[11px] font-bold truncate shrink-0 cursor-grab"
                              style={getEventCardStyle(member.id)}
                            >
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // A3) JAHRESWAND (MIT TAGES-POPUP & BW-FERIEN)
  const renderYearWallCalendar = () => {
    const year = currentBaseDate.getFullYear();
    return (
      <div className="p-3 w-full h-full flex flex-col gap-2 overflow-hidden">
        <div
          className="px-4 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <span className="font-extrabold text-xs uppercase tracking-wider" style={{ color: theme.textMain }}>
            📅 Jahreswand {year} (Baden-Württemberg) – Tippe auf einen Tag für Schnellverwaltung & Transfer
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
              🎌 Gesetzlicher Feiertag BW
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              🏖️ Schulferien BW
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
              Heute
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border shadow-sm overflow-x-auto flex-1 flex flex-col w-full min-h-0"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="grid divide-x flex-1 min-h-0 min-w-[1100px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', borderColor: theme.borderColor }}>
            {MONTHS_NAMES.map((mName, monthIdx) => (
              <div key={mName} className="flex flex-col min-w-0 overflow-hidden h-full">
                <div className="text-white font-extrabold text-[11px] uppercase py-1.5 px-1 text-center shrink-0 truncate" style={{ backgroundColor: theme.kwBar }}>
                  {mName}
                </div>
                <div className="divide-y flex-1 flex flex-col min-h-0" style={{ borderColor: theme.borderColor }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const testDate = new Date(year, monthIdx, day);
                    if (testDate.getMonth() !== monthIdx) {
                      return <div key={day} className="flex-1 min-h-[16px] opacity-25" style={{ backgroundColor: theme.subtleBg }} />;
                    }
                    const dateStr = formatDateStr(testDate);
                    const dow = testDate.getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    const isToday = dateStr === TODAY_STR;
                    const holiday = getBWHolidayName(dateStr);
                    const vacation = getBWVacationName(dateStr);

                    let dayEvents = events.filter(e => e.date === dateStr);
                    if (activeMemberFilter !== 'all') {
                      dayEvents = dayEvents.filter(e => e.member === activeMemberFilter || e.member === 'all');
                    }
                    const firstEv = dayEvents[0];
                    const extraCount = dayEvents.length - 1;

                    return (
                      <div
                        key={day}
                        onClick={() => setYearDayModal({ open: true, date: dateStr, newTitle: '', newTime: 'Ganztägig', newMember: 'all' })}
                        className={`flex-1 min-h-[16px] px-1 flex items-center gap-1 text-[10px] cursor-pointer hover:bg-indigo-500/20 min-w-0 overflow-hidden ${
                          isToday ? 'ring-2 ring-inset ring-orange-500' : ''
                        }`}
                        style={{
                          backgroundColor: holiday
                            ? 'rgba(244, 63, 94, 0.24)'
                            : vacation
                            ? 'rgba(16, 185, 129, 0.18)'
                            : isWeekend
                            ? theme.weekendBg
                            : theme.cardBg
                        }}
                      >
                        <span className="w-3.5 font-extrabold shrink-0 text-[9px]" style={{ color: holiday ? '#fda4af' : theme.textMain }}>
                          {String(day).padStart(2, '0')}
                        </span>
                        <span className="w-3.5 text-[8px] font-bold uppercase shrink-0" style={{ color: theme.textMuted }}>
                          {WEEKDAYS_SHORT[dow]}
                        </span>
                        <div className="flex-1 flex items-center gap-0.5 min-w-0 overflow-hidden">
                          {firstEv ? (
                            <span
                              className="px-1 rounded text-[9px] font-bold truncate min-w-0 flex-1 leading-tight"
                              style={getEventCardStyle(firstEv.member)}
                            >
                              {firstEv.title}
                            </span>
                          ) : holiday ? (
                            <span className="text-[8px] font-extrabold text-rose-300 truncate">🎌 {holiday}</span>
                          ) : vacation ? (
                            <span className="text-[8px] font-bold text-emerald-300 truncate opacity-85">🏖️ {vacation.replace(' BW', '')}</span>
                          ) : null}
                          {extraCount > 0 && (
                            <span className="px-1 rounded bg-indigo-600 text-white text-[8px] font-extrabold shrink-0">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // B) SCHULE & STUNDENPLAN (INKL. UNTEREM INFO-KASTEN & EDITIERBAREN ZEITEN)
  const renderSchoolSection = () => {
    const childMember = members.find(m => m.id === activeSchoolChild) || members[3];
    const sched = schoolData[activeSchoolChild];
    const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

    const addAnnouncement = () => {
      if (!newSchoolNote.trim()) return;
      setSchoolData(prev => ({
        ...prev,
        [activeSchoolChild]: {
          ...prev[activeSchoolChild],
          announcements: [newSchoolNote.trim(), ...prev[activeSchoolChild].announcements]
        }
      }));
      setNewSchoolNote('');
      showToast('Schul-Hinweis eingetragen', 'Wurde unter dem Stundenplan ergänzt.', '📌');
    };

    const removeAnnouncement = (idx) => {
      setSchoolData(prev => ({
        ...prev,
        [activeSchoolChild]: {
          ...prev[activeSchoolChild],
          announcements: prev[activeSchoolChild].announcements.filter((_, i) => i !== idx)
        }
      }));
    };

    const addPeriodRow = () => {
      setSchoolData(prev => {
        const nextNum = prev[activeSchoolChild].periods.length + 1;
        return {
          ...prev,
          [activeSchoolChild]: {
            ...prev[activeSchoolChild],
            periods: [...prev[activeSchoolChild].periods, `${nextNum}. Std (Nachmittag)`]
          }
        };
      });
    };

    const renamePeriodRow = (pIdx, newVal) => {
      setSchoolData(prev => ({
        ...prev,
        [activeSchoolChild]: {
          ...prev[activeSchoolChild],
          periods: prev[activeSchoolChild].periods.map((p, i) => i === pIdx ? newVal : p)
        }
      }));
    };

    const removePeriodRow = (pIdx) => {
      setSchoolData(prev => ({
        ...prev,
        [activeSchoolChild]: {
          ...prev[activeSchoolChild],
          periods: prev[activeSchoolChild].periods.filter((_, i) => i !== pIdx)
        }
      }));
    };

    return (
      <div className="w-full min-h-full p-5 flex flex-col gap-5">
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-4">
            <MemberAvatar member={childMember} size="w-14 h-14" textSize="text-2xl" />
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
                Stundenplan & Schul-Änderungen ({childMember.name})
              </h2>
              <p className="text-xs lg:text-sm font-semibold mt-0.5" style={{ color: theme.textMuted }}>
                Tippe auf eine Stunde zum Ändern. Unten findest du aktuelle Tests, Vertretungen & Hausaufgaben.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveSchoolChild('dean')}
              className={`px-5 py-3 rounded-2xl font-extrabold text-sm cursor-pointer transition-all ${
                activeSchoolChild === 'dean' ? 'bg-indigo-600 text-white shadow-md' : 'bg-black/15'
              }`}
              style={activeSchoolChild !== 'dean' ? { color: theme.textMain } : {}}
            >
              👦 Dean
            </button>
            <button
              onClick={() => setActiveSchoolChild('valentina')}
              className={`px-5 py-3 rounded-2xl font-extrabold text-sm cursor-pointer transition-all ${
                activeSchoolChild === 'valentina' ? 'bg-indigo-600 text-white shadow-md' : 'bg-black/15'
              }`}
              style={activeSchoolChild !== 'valentina' ? { color: theme.textMain } : {}}
            >
              👧 Valentina
            </button>
            <button
              onClick={addPeriodRow}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm cursor-pointer"
            >
              + Weitere Schulstunde
            </button>
          </div>
        </div>

        {/* Stundenplan-Tabelle */}
        <div
          className="rounded-3xl border-2 shadow-sm overflow-x-auto flex-1"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <table className="w-full border-collapse min-w-[860px]">
            <thead>
              <tr className="text-white text-xs lg:text-sm uppercase font-extrabold tracking-wider" style={{ backgroundColor: theme.kwBar }}>
                <th className="p-3.5 text-left w-52 border-r" style={{ borderColor: theme.borderColor }}>Stunde / Zeit</th>
                {schoolDays.map(d => (
                  <th key={d} className="p-3.5 text-left border-r" style={{ borderColor: theme.borderColor }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2" style={{ borderColor: theme.borderColor }}>
              {sched.periods.map((periodLabel, pIdx) => (
                <tr key={pIdx}>
                  <td
                    className="p-3 border-r-2 font-extrabold text-sm"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={periodLabel}
                        onChange={(e) => renamePeriodRow(pIdx, e.target.value)}
                        className="w-full bg-transparent font-extrabold text-sm focus:outline-none"
                        style={{ color: theme.textMain }}
                      />
                      {sched.periods.length > 1 && (
                        <button
                          onClick={() => removePeriodRow(pIdx)}
                          className="w-6 h-6 rounded text-xs opacity-50 hover:opacity-100 hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  {schoolDays.map((_, dIdx) => {
                    const key = `${dIdx}-${pIdx}`;
                    const slot = sched.slots[key] || { subject: '', room: '', status: 'normal' };

                    let cardStyle = getEventCardStyle(activeSchoolChild);
                    let badge = null;

                    if (slot.status === 'exam') {
                      cardStyle = { backgroundColor: '#f3e8ff', borderLeft: '5px solid #9333ea', color: '#581c87' };
                      badge = <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black">ARBEIT/TEST</span>;
                    } else if (slot.status === 'change') {
                      cardStyle = { backgroundColor: '#fef3c7', borderLeft: '5px solid #f59e0b', color: '#78350f' };
                      badge = <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">ÄNDERUNG</span>;
                    } else if (slot.status === 'cancel') {
                      cardStyle = { backgroundColor: '#ffe4e6', borderLeft: '5px solid #e11d48', color: '#881337', textDecoration: 'line-through' };
                      badge = <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">ENTFALL</span>;
                    }

                    return (
                      <td
                        key={key}
                        onClick={() => setSchoolModal({ open: true, dayIdx: dIdx, periodIdx: pIdx, subject: slot.subject, room: slot.room, status: slot.status || 'normal' })}
                        className="p-2 border-r-2 align-top cursor-pointer hover:bg-indigo-500/10 transition-colors"
                        style={{ borderColor: theme.borderColor }}
                      >
                        {slot.subject ? (
                          <div className="p-3 rounded-2xl min-h-[76px] flex flex-col justify-between shadow-2xs" style={cardStyle}>
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm">{slot.subject}</span>
                              {badge}
                            </div>
                            {slot.room && <div className="text-xs font-semibold opacity-90 mt-1">{slot.room}</div>}
                          </div>
                        ) : (
                          <div
                            className="min-h-[76px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold opacity-50"
                            style={{ borderColor: theme.borderColor, color: theme.textMuted }}
                          >
                            + Fach
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UNTERER KASTEN: AKTUELLE SCHUL-ÄNDERUNGEN & HAUSAUFGABEN */}
        <div
          className="rounded-3xl border p-5 shadow-xs space-y-4"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-extrabold text-base lg:text-lg" style={{ color: theme.textMain }}>
              📌 Aktuelle Schul-Änderungen & Hausaufgaben ({childMember.name})
            </h3>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newSchoolNote}
                onChange={(e) => setNewSchoolNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAnnouncement()}
                placeholder="z.B. Freitag 5. Stunde fällt aus..."
                className="flex-1 md:w-80 px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none"
                style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
              />
              <button
                onClick={addAnnouncement}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"
              >
                + Eintragen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sched.announcements.map((info, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 text-sm font-bold"
                style={{ color: theme.dark ? '#fde68a' : '#78350f' }}
              >
                <span>🔔 {info}</span>
                <button
                  onClick={() => removeAnnouncement(idx)}
                  className="w-7 h-7 rounded-lg hover:bg-rose-500/20 text-amber-400 hover:text-rose-400 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // C) DESIGN & LOGO-UPLOAD + VOLLE BENUTZER-FARBEN & AVATARE (FEHLERFREI)
  const renderDesignSection = () => {
    const boldKeys = Object.keys(COLOR_PALETTES).filter(k => COLOR_PALETTES[k].bold);
    const softKeys = Object.keys(COLOR_PALETTES).filter(k => !COLOR_PALETTES[k].bold);

    const restoreDefaultProfile = () => {
      setMembers(INITIAL_MEMBERS);
      setCurrentThemeId('metal');
      showToast('Standard-Profil wiederhergestellt', 'Metal Silver sowie alle Fotos & Farben von Hans, Sarah, Dean und Valentina sind aktiv.', '✅');
    };

    return (
      <div className="w-full min-h-full p-5 flex flex-col gap-6">
        {/* 1. SEITEN-THEMES & LOGO-STEUERUNG */}
        <div
          className="p-6 rounded-3xl border shadow-xs space-y-5"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
                1. Seiten-Theme der Touchwall wählen (7 Versionen)
              </h2>
              <p className="text-xs lg:text-sm font-semibold mt-0.5" style={{ color: theme.textMuted }}>
                Inklusive dunklerem Metal Silver (Titan/Gunmetal-Mix), Light Dark & Iron Gray sowie eigenem Familien-Logo oben links.
              </p>
            </div>

            <div
              className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-2xl border"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 flex items-center justify-center overflow-hidden shrink-0 border border-white/20 shadow-sm">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-extrabold text-sm">FR</span>
                )}
              </div>

              <input
                type="url"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                placeholder="Logo Bild-URL..."
                className="w-40 px-3 py-2 rounded-xl border text-xs font-semibold"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
              />

              <button
                onClick={() => logoFileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Logo wählen
              </button>

              {customLogoUrl && (
                <button
                  onClick={() => {
                    setCustomLogoUrl('');
                    showToast('Standard-Logo aktiv', 'Oben links wird wieder „FR“ angezeigt.', '🖼️');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold cursor-pointer"
                  title="Auf FR zurücksetzen"
                >
                  ✕
                </button>
              )}

              <button
                onClick={restoreDefaultProfile}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Standard-Profil wiederherstellen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {PAGE_THEMES.map(t => {
              const isSelected = currentThemeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentThemeId(t.id);
                    showToast('Design aktiviert', t.name, '🎨');
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected ? 'ring-3 ring-indigo-500 scale-[1.02]' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: t.cardBg,
                    borderColor: isSelected ? '#6366f1' : t.borderColor,
                    color: t.textMain
                  }}
                >
                  <div>
                    <div
                      className="h-14 rounded-xl mb-3 p-2 flex flex-col justify-between border"
                      style={{ backgroundColor: t.viewportBg, borderColor: t.borderColor }}
                    >
                      <div className="h-2.5 w-full rounded" style={{ backgroundColor: t.kwBar }} />
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-4 rounded bg-indigo-500/80" />
                        <div className="h-4 rounded bg-emerald-500/80" />
                        <div className="h-4 rounded bg-rose-500/80" />
                      </div>
                    </div>
                    <div className="font-extrabold text-sm">{t.name}</div>
                    <div className="text-[11px] mt-1 leading-snug" style={{ color: t.textMuted }}>
                      {t.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400">
                      ✓ Aktiviert
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. BENUTZER-FARBEN & AVATARE */}
        <div
          className="p-6 rounded-3xl border shadow-xs space-y-5"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
              2. Persönliche Farbe (Kräftig & Sanft) & Avatar pro Benutzer
            </h2>
            <p className="text-xs lg:text-sm font-semibold" style={{ color: theme.textMuted }}>
              Wähle zwischen 12 kräftigen Vollton-Farben und 10 sanften Pastell-Tönen sowie Emoji, Foto oder Initialen-Kürzel.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {members.map(m => (
              <div
                key={m.id}
                className="p-5 rounded-3xl border-2 flex flex-col justify-between gap-4"
                style={{ ...getRowHeaderStyle(m), borderColor: theme.borderColor }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <MemberAvatar member={m} size="w-14 h-14" textSize="text-2xl" />
                    <div>
                      <div className="font-extrabold text-lg" style={{ color: theme.textMain }}>{m.name}</div>
                      <div className="text-xs font-semibold" style={{ color: theme.textMuted }}>{m.role}</div>
                    </div>
                  </div>

                  <div className="flex p-1 rounded-xl border text-xs font-bold" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                    {['emoji', 'photo', 'badge'].map(type => (
                      <button
                        key={type}
                        onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, avatarType: type } : item))}
                        className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                          m.avatarType === type ? 'bg-indigo-600 text-white' : ''
                        }`}
                        style={m.avatarType !== type ? { color: theme.textMuted } : {}}
                      >
                        {type === 'emoji' ? 'Emoji' : type === 'photo' ? 'Foto' : `Kürzel (${m.badge})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kräftige & Sanfte Farben */}
                <div className="space-y-2.5">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>
                      🔥 Kräftige Vollton-Farben:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {boldKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        const active = m.color === cKey;
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.hex, color: '#ffffff' }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform border border-black/15 ${
                              active ? 'ring-2 ring-white outline outline-2 outline-slate-900 scale-105' : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            {pal.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>
                      🎨 Sanfte Pastell-Farben:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {softKeys.map(cKey => {
                        const pal = COLOR_PALETTES[cKey];
                        const active = m.color === cKey;
                        return (
                          <button
                            key={cKey}
                            onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                            style={{ backgroundColor: pal.light, color: pal.text, border: `2px solid ${pal.hex}` }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-transform ${
                              active ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-85 hover:opacity-100'
                            }`}
                          >
                            {pal.name.replace(' (Sanft)', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Avatar-Steuerung unten */}
                <div className="pt-2 border-t min-h-[56px] flex items-center" style={{ borderColor: theme.borderColor }}>
                  {m.avatarType === 'emoji' && (
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_EMOJIS.map(em => (
                        <button
                          key={em}
                          onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, emoji: em, avatarType: 'emoji' } : item))}
                          className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer ${
                            m.emoji === em ? 'border-indigo-500 ring-2 ring-indigo-400 scale-105' : ''
                          }`}
                          style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.avatarType === 'photo' && (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="url"
                        value={m.photoUrl || ''}
                        onChange={(e) => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, photoUrl: e.target.value } : item))}
                        placeholder="https://... (Direktlink zum Profilbild)"
                        className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold"
                        style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                      />
                      <button
                        onClick={() => {
                          setPhotoTargetMemberId(m.id);
                          memberPhotoInputRef.current?.click();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        📁 Foto wählen
                      </button>
                    </div>
                  )}

                  {m.avatarType === 'badge' && (
                    <div className="text-xs font-bold" style={{ color: theme.textMuted }}>
                      Initialen-Kürzel <span className="px-2 py-0.5 rounded bg-black/25 text-white font-extrabold">{m.badge}</span> aktiv.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // D) KONTEN, VERCEL CLOUD-ASSISTENT, GOOGLE DRIVE EXPORT/IMPORT & APPS-SCRIPT-BRIDGE
  const renderGoogleAccountsSection = () => {
    return (
      <div className="w-full min-h-full p-5 flex flex-col gap-5">
        <input ref={jsonImportInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportJsonFile} />

        {/* 1. KOPFBEREICH: VERCEL CLOUD + APPS SCRIPT HYBRID-ARCHITEKTUR */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4 border border-slate-700">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                Vercel Cloud Ready • 2-Wege Google Kalender & Tasks Sync
              </span>
              <button
                onClick={() => setVercelGuideModalOpen(true)}
                className="px-3 py-1 rounded-full bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer border border-indigo-400/30"
              >
                <Rocket className="w-3.5 h-3.5" /> Anleitung: In 3 Min. auf Vercel veröffentlichen
              </button>
            </div>
            <h2 className="text-2xl font-extrabold mt-2">Google Kalender-IDs, Tasks & Google Drive Backup</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Gleiches Prinzip wie bisher: Jeder hinterlegt seine Google-Kalender-Adresse. Deine <code className="text-amber-300">Code.gs</code> synchronisiert im Hintergrund alle Termine, Google Tasks und speichert ein Backup auf deinem Google Drive!
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setAddCalModal(prev => ({ ...prev, open: true }))}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Weiteren Kalender hinzufügen
            </button>
            <button
              onClick={() => handlePushToGoogleDriveBridge(false)}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer shadow-md"
            >
              💾 Alles in Cloud & Drive speichern
            </button>
          </div>
        </div>

        {/* 2. 1:1 DATEN-ÜBERNAHME & GOOGLE DRIVE BACKUP-ZENTRALE */}
        <div
          className="p-6 rounded-3xl border-2 space-y-4 shadow-sm"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                1:1 Umzug & Google Drive Datensicherung
              </div>
              <h3 className="text-lg lg:text-xl font-extrabold mt-0.5" style={{ color: theme.textMain }}>
                📦 Google Drive Export, JSON-Import & Live-Brücke zu deiner Code.gs
              </h3>
              <p className="text-xs font-semibold mt-0.5" style={{ color: theme.textMuted }}>
                Status: <span className="text-emerald-400 font-bold">{driveBackupStatus}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => jsonImportInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/30"
              >
                <Upload className="w-4 h-4" /> Altes Backup (JSON) 1:1 importieren
              </button>
              <button
                onClick={handleExportLocalJson}
                className="px-4 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-white/5"
                style={{ borderColor: theme.borderColor, color: theme.textMain }}
              >
                <Download className="w-4 h-4" /> Export-Datei herunterladen
              </button>
              <button
                onClick={copyAppsScriptBridgeCode}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" /> Code.gs Erweiterung (Drive + API) kopieren
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
            <div className="lg:col-span-2 flex items-center gap-2">
              <input
                type="url"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="Deine Google Apps Script Web-App URL (https://script.google.com/macros/s/.../exec)"
                className="flex-1 px-4 py-2.5 rounded-xl border text-xs lg:text-sm font-bold"
                style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
              />
              <button
                onClick={() => handlePullFromGoogleBridge(true)}
                disabled={isSyncingBridge}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shrink-0 cursor-pointer"
              >
                {isSyncingBridge ? '⏳ Lädt...' : '🔄 Live aus Google laden'}
              </button>
            </div>
            <div
              className="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMuted }}
            >
              💡 Tipp für Vercel: Du kannst die URL hier eintragen oder als <code className="mx-1">NEXT_PUBLIC_APPS_SCRIPT_URL</code> hinterlegen.
            </div>
          </div>
        </div>

        {/* 3. LISTE ALLER FAMILIEN- UND ZUSATZ-KALENDER */}
        <div
          className="rounded-3xl border overflow-hidden divide-y"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          {members.map(m => (
            <div
              key={m.id}
              className="p-4 flex flex-wrap items-center justify-between gap-4"
              style={getRowHeaderStyle(m)}
            >
              <div className="flex items-center gap-3.5 min-w-[210px]">
                <MemberAvatar member={m} size="w-12 h-12" textSize="text-xl" />
                <div>
                  <div className="font-extrabold text-base" style={{ color: theme.textMain }}>{m.name}</div>
                  <div className="text-xs font-semibold" style={{ color: theme.textMuted }}>{m.role}</div>
                </div>
              </div>

              <div className="flex-1 min-w-[260px]">
                <input
                  type="text"
                  value={m.calendarId}
                  onChange={(e) => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, calendarId: e.target.value } : item))}
                  placeholder="name@gmail.com oder ...@group.calendar.google.com"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                  style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
              </div>

              <div className="flex items-center gap-2">
                {m.id !== 'all' && (
                  <button
                    onClick={() => showToast('Freigabe-Anleitung', `Kalender von ${m.name} in Google Kalender unter „Freigabe“ für deine Haupt-Mailadresse freigeben.`, '✉️')}
                    className="px-3 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-extrabold cursor-pointer"
                  >
                    ✉️ Anleitung
                  </button>
                )}
                {m.isCustom && (
                  <button
                    onClick={() => {
                      setMembers(prev => prev.filter(item => item.id !== m.id));
                      showToast('Kalender entfernt', `„${m.name}“ wurde gelöscht.`, '🗑️');
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-extrabold cursor-pointer"
                  >
                    🗑️ Löschen
                  </button>
                )}
                <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
                  ✓ {m.statusMsg}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // E) AUFGABEN & ÄMTLI (INKL. 2-WEGE GOOGLE TASKS SYNC)
  const renderTasksSection = () => (
    <div className="w-full min-h-full p-5 flex flex-col gap-5">
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl border"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      >
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
            ✅ Familien-Aufgaben & Ämtli (2-Wege Google Tasks Sync)
          </h2>
          <p className="text-xs lg:text-sm font-semibold mt-0.5" style={{ color: theme.textMuted }}>
            Synchronisiert automatisch mit den Listen „TW Aufgaben: Hans / Sarah / Dean / Valentina“ in Google Tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTaskTitle.trim()) {
                setFamilyTasks(prev => [{ id: Date.now(), member: newTaskMember, title: newTaskTitle.trim(), due: 'Heute', done: false }, ...prev]);
                setNewTaskTitle('');
                handlePushToGoogleDriveBridge(true);
              }
            }}
            placeholder="Neue Aufgabe eintragen..."
            className="px-4 py-2.5 rounded-xl border text-sm font-bold w-64"
            style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
          />
          <select
            value={newTaskMember}
            onChange={(e) => setNewTaskMember(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm font-bold"
            style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
          >
            {members.filter(m => m.id !== 'all').map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!newTaskTitle.trim()) return;
              setFamilyTasks(prev => [{ id: Date.now(), member: newTaskMember, title: newTaskTitle.trim(), due: 'Heute', done: false }, ...prev]);
              setNewTaskTitle('');
              handlePushToGoogleDriveBridge(true);
              showToast('Aufgabe synchronisiert', 'An Google Tasks übertragen.', '✅');
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-extrabold text-sm cursor-pointer"
          >
            + Hinzufügen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 flex-1">
        {members.filter(m => m.id !== 'all').map(member => {
          const mTasks = familyTasks.filter(t => t.member === member.id);
          const openCount = mTasks.filter(t => !t.done).length;
          return (
            <div
              key={member.id}
              className="rounded-3xl border-2 overflow-hidden flex flex-col justify-between min-h-[400px]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
            >
              <div>
                <div className="p-4 border-b flex items-center justify-between" style={{ ...getRowHeaderStyle(member), borderBottomColor: theme.borderColor }}>
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={member} size="w-10 h-10" textSize="text-base" />
                    <div>
                      <div className="font-extrabold text-base" style={{ color: theme.textMain }}>{member.name}</div>
                      <div className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>TW Aufgaben: {member.name}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-black/20 text-xs font-extrabold" style={{ color: theme.textMain }}>
                    {openCount} offen
                  </span>
                </div>

                <div className="p-3.5 space-y-2.5">
                  {mTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setFamilyTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
                        handlePushToGoogleDriveBridge(true);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                        task.done ? 'opacity-50 line-through' : ''
                      }`}
                      style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input type="checkbox" checked={task.done} readOnly className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                        <span className="text-sm font-bold break-words">{task.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFamilyTasks(prev => prev.filter(t => t.id !== task.id));
                          handlePushToGoogleDriveBridge(true);
                        }}
                        className="text-slate-400 hover:text-rose-400 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 border-t flex gap-2" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <input
                  type="text"
                  value={columnTaskInputs[member.id] || ''}
                  onChange={(e) => setColumnTaskInputs(prev => ({ ...prev, [member.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (columnTaskInputs[member.id] || '').trim();
                      if (!val) return;
                      setFamilyTasks(prev => [...prev, { id: Date.now(), member: member.id, title: val, due: 'Heute', done: false }]);
                      setColumnTaskInputs(prev => ({ ...prev, [member.id]: '' }));
                      handlePushToGoogleDriveBridge(true);
                    }
                  }}
                  placeholder={`Aufgabe für ${member.name}...`}
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
                <button
                  onClick={() => {
                    const val = (columnTaskInputs[member.id] || '').trim();
                    if (!val) return;
                    setFamilyTasks(prev => [...prev, { id: Date.now(), member: member.id, title: val, due: 'Heute', done: false }]);
                    setColumnTaskInputs(prev => ({ ...prev, [member.id]: '' }));
                    handlePushToGoogleDriveBridge(true);
                  }}
                  className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // F) NOTIZEN & SMARTPHONE-EINKAUFSLISTEN (INKL. FARBWAHL, AUTOREN, KEEP & QR)
  const renderNotesSection = () => {
    const authorOptions = ['Familie', 'Hans', 'Sarah', 'Sarah & Hans', 'Dean', 'Valentina'];
    return (
      <div className="w-full min-h-full p-5 flex flex-col gap-5">
        <div
          className="p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
                📝 Familien-Notizen & Smartphone-Listen
              </h2>
              <button
                onClick={() => setQrModal({ open: true, selectedMember: 'all' })}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" /> Handy-App & QR-Code (Live-Sync)
              </button>
            </div>
            <p className="text-xs lg:text-sm font-semibold mt-1" style={{ color: theme.textMuted }}>
              2-Wege-Sync mit Google Tasks („TW: Einkaufsliste“), Google Notizen (Keep) & Offline-Puffer für den Supermarkt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newNoteBlock.title}
              onChange={(e) => setNewNoteBlock(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titel (z.B. Baumarkt / Drogerie)"
              className="px-3.5 py-2.5 rounded-xl border text-sm font-bold w-56"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
            />
            <select
              value={newNoteBlock.author}
              onChange={(e) => setNewNoteBlock(prev => ({ ...prev, author: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border text-sm font-bold"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
            >
              {authorOptions.map(a => <option key={a} value={a}>👤 {a}</option>)}
            </select>
            <select
              value={newNoteBlock.color}
              onChange={(e) => setNewNoteBlock(prev => ({ ...prev, color: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border text-sm font-bold"
              style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
            >
              {Object.entries(NOTE_COLOR_THEMES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!newNoteBlock.title.trim()) return;
                setFamilyNotes(prev => [...prev, { id: Date.now(), title: newNoteBlock.title.trim(), author: newNoteBlock.author, color: newNoteBlock.color, items: [] }]);
                setNewNoteBlock({ title: '', author: 'Familie', color: 'amber' });
                handlePushToGoogleDriveBridge(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
            >
              + Neuer Notizblock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1">
          {familyNotes.map(note => {
            const cTheme = NOTE_COLOR_THEMES[note.color] || NOTE_COLOR_THEMES.amber;
            return (
              <div
                key={note.id}
                className="rounded-3xl border-2 p-5 flex flex-col justify-between min-h-[440px]"
                style={{
                  backgroundColor: theme.dark ? cTheme.darkBg : cTheme.lightBg,
                  borderColor: theme.dark ? cTheme.darkBorder : cTheme.lightBorder
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                      className="font-extrabold text-lg bg-transparent focus:outline-none flex-1 min-w-0"
                      style={{ color: theme.textMain }}
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={note.author || 'Familie'}
                        onChange={(e) => setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, author: e.target.value } : n))}
                        className="px-2.5 py-1 rounded-full text-xs font-extrabold border cursor-pointer"
                        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                      >
                        {authorOptions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <button
                        onClick={() => setFamilyNotes(prev => prev.filter(n => n.id !== note.id))}
                        className="w-7 h-7 rounded-full bg-black/15 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 pb-2.5 border-b" style={{ borderColor: theme.borderColor }}>
                    <button
                      onClick={() => {
                        handlePushToGoogleDriveBridge(false);
                        showToast('Aufs Handy übertragen', `„${note.title}“ ist in Google Tasks & Kalender aktualisiert.`, '📲');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer"
                    >
                      📲 Aufs Handy & Tasks pushen
                    </button>
                    <button
                      onClick={() => openNoteInGoogleKeep(note)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                    >
                      💡 In Google Notizen (Keep)
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {note.items.map((it, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                            ...n,
                            items: n.items.map((item, i) => i === idx ? { ...item, done: !item.done } : item)
                          } : n));
                          handlePushToGoogleDriveBridge(true);
                        }}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border text-sm font-bold cursor-pointer"
                        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input type="checkbox" checked={it.done} readOnly className="w-5 h-5 accent-indigo-600 rounded" />
                          <span className={it.done ? 'line-through opacity-50' : ''}>{it.text}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                              ...n,
                              items: n.items.filter((_, i) => i !== idx)
                            } : n));
                            handlePushToGoogleDriveBridge(true);
                          }}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t flex gap-2" style={{ borderColor: theme.borderColor }}>
                  <input
                    type="text"
                    value={noteInputs[note.id] || ''}
                    onChange={(e) => setNoteInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (noteInputs[note.id] || '').trim();
                        if (!val) return;
                        setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
                        setNoteInputs(prev => ({ ...prev, [note.id]: '' }));
                        handlePushToGoogleDriveBridge(true);
                      }
                    }}
                    placeholder="Neuen Punkt eintragen..."
                    className="flex-1 px-3.5 py-2 rounded-xl border text-sm font-semibold"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                  <button
                    onClick={() => {
                      const val = (noteInputs[note.id] || '').trim();
                      if (!val) return;
                      setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
                      setNoteInputs(prev => ({ ...prev, [note.id]: '' }));
                      handlePushToGoogleDriveBridge(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // G) ESSENSPLAN & ZUTATEN-LISTEN (INKL. BEARBEITEN, ZUTAT HINZUFÜGEN & NEUER BLOCK)
  const renderMealPlanSection = () => (
    <div className="w-full min-h-full p-5 flex flex-col gap-5">
      <div
        className="p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      >
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: theme.textMain }}>
            🍲 Familien-Essensplan & Zutaten-Listen
          </h2>
          <p className="text-xs lg:text-sm font-semibold mt-0.5" style={{ color: theme.textMuted }}>
            Fehlende Zutaten lassen sich mit 1 Klick direkt auf die geteilte Einkaufsliste setzen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newMealBlock.dayLabel}
            onChange={(e) => setNewMealBlock(prev => ({ ...prev, dayLabel: e.target.value }))}
            placeholder="Tag / Name (z.B. Wochenende)"
            className="px-3.5 py-2.5 rounded-xl border text-sm font-bold w-48"
            style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
          />
          <input
            type="text"
            value={newMealBlock.dish}
            onChange={(e) => setNewMealBlock(prev => ({ ...prev, dish: e.target.value }))}
            placeholder="Gericht / Rezept..."
            className="px-3.5 py-2.5 rounded-xl border text-sm font-bold w-56"
            style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
          />
          <button
            onClick={() => {
              if (!newMealBlock.dish.trim()) return;
              setMealPlan(prev => [
                ...prev,
                {
                  id: Date.now(),
                  dayLabel: newMealBlock.dayLabel.trim() || 'Zusatz-Plan',
                  dish: newMealBlock.dish.trim(),
                  ingredients: [{ name: 'Zutat 1', done: false }]
                }
              ]);
              setNewMealBlock({ dayLabel: '', dish: '' });
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
          >
            + Essens-Block
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {mealPlan.map(meal => {
          const missing = meal.ingredients.filter(i => !i.done).length;
          return (
            <div
              key={meal.id}
              className="rounded-3xl border-2 overflow-hidden flex flex-col justify-between min-h-[410px]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
            >
              <div>
                <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                  <input
                    type="text"
                    value={meal.dayLabel}
                    onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dayLabel: e.target.value } : m))}
                    className="font-extrabold text-sm uppercase tracking-wider bg-transparent focus:outline-none flex-1 min-w-0"
                    style={{ color: theme.textMain }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${missing === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {missing === 0 ? 'Alle da ✓' : `${missing} fehlt`}
                    </span>
                    {meal.id > 7 && (
                      <button
                        onClick={() => setMealPlan(prev => prev.filter(m => m.id !== meal.id))}
                        className="text-slate-400 hover:text-rose-400 font-bold text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 border-b" style={{ borderColor: theme.borderColor }}>
                  <label className="block text-[10px] font-extrabold uppercase mb-1" style={{ color: theme.textMuted }}>Geplantes Gericht</label>
                  <input
                    type="text"
                    value={meal.dish}
                    onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dish: e.target.value } : m))}
                    className="w-full px-3 py-2 rounded-xl border font-extrabold text-sm"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase" style={{ color: theme.textMuted }}>
                      Zutaten ({meal.ingredients.length})
                    </span>
                    <button
                      onClick={() => {
                        const missingItems = meal.ingredients.filter(i => !i.done);
                        if (missingItems.length === 0) {
                          showToast('Alles da', 'Alle Zutaten sind bereits abgehakt.', '✅');
                          return;
                        }
                        setFamilyNotes(prev => prev.map((n, idx) => idx === 0 ? {
                          ...n,
                          items: [...n.items, ...missingItems.map(m => ({ text: `${m.name} (${meal.dayLabel})`, done: false }))]
                        } : n));
                        showToast('Auf Einkaufsliste gesetzt', `${missingItems.length} Zutaten wurden ergänzt.`, '🛒');
                      }}
                      className="text-xs font-extrabold text-indigo-400 hover:underline cursor-pointer"
                    >
                      🛒 Fehlende in Einkaufsliste
                    </button>
                  </div>
                  {meal.ingredients.map((ing, iIdx) => (
                    <div
                      key={iIdx}
                      onClick={() => {
                        setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                          ...m,
                          ingredients: m.ingredients.map((item, idx) => idx === iIdx ? { ...item, done: !item.done } : item)
                        } : m));
                      }}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input type="checkbox" checked={ing.done} readOnly className="w-4 h-4 accent-emerald-500 rounded" />
                        <span className={ing.done ? 'line-through opacity-50' : ''}>{ing.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                            ...m,
                            ingredients: m.ingredients.filter((_, idx) => idx !== iIdx)
                          } : m));
                        }}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 border-t flex gap-2" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <input
                  type="text"
                  value={ingInputs[meal.id] || ''}
                  onChange={(e) => setIngInputs(prev => ({ ...prev, [meal.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (ingInputs[meal.id] || '').trim();
                      if (!val) return;
                      setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
                      setIngInputs(prev => ({ ...prev, [meal.id]: '' }));
                    }
                  }}
                  placeholder="Zutat hinzufügen..."
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
                <button
                  onClick={() => {
                    const val = (ingInputs[meal.id] || '').trim();
                    if (!val) return;
                    setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
                    setIngInputs(prev => ({ ...prev, [meal.id]: '' }));
                  }}
                  className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ============================================================================
  // 9. HAUPT-RENDER & MODALS
  // ============================================================================
  return (
    <div
      className="h-screen w-screen flex items-center justify-center p-0 sm:p-2 transition-colors duration-300 select-none overflow-hidden"
      style={{ backgroundColor: theme.outerBg, color: theme.textMain }}
    >
      {/* Datei-Inputs für Logo & Profilfotos */}
      <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={memberPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleMemberPhotoUpload} />

      {/* Toast-Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 max-w-sm">
            <span className="text-xl">{t.icon}</span>
            <div>
              <div className="font-extrabold text-[11px] text-amber-400 uppercase">{t.title}</div>
              <div className="text-xs font-semibold text-slate-100">{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Haupt-Rahmen der Touchwall */}
      <div
        className={`${
          pocketMode ? 'max-w-md w-full h-[94vh] rounded-3xl border-4' : 'w-full h-full sm:rounded-3xl border-0 sm:border-4'
        } shadow-2xl flex overflow-hidden relative transition-all duration-300`}
        style={{ backgroundColor: theme.shellBg, borderColor: theme.borderColor }}
      >
        {/* LINKE SEITENLEISTE */}
        {!pocketMode && (
          <aside
            className="w-20 sm:w-24 border-r flex flex-col items-center py-4 justify-between z-20 shrink-0"
            style={{ background: theme.sidebarBg, borderColor: theme.borderColor }}
          >
            {/* Oben links: Eigenes Familien-Logo oder FR */}
            <button
              onClick={() => setActiveSection('design')}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 flex items-center justify-center text-white shadow-md cursor-pointer overflow-hidden border border-white/20 hover:scale-105 transition-transform"
              title="Klicken, um ein eigenes Logo hochzuladen"
            >
              {customLogoUrl ? (
                <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-xl">FR</span>
              )}
            </button>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 w-full items-center overflow-y-auto py-1">
              {[
                { id: 'kalender', label: 'Kalender', icon: Calendar },
                { id: 'schule',   label: 'Schule',   icon: GraduationCap },
                { id: 'aufgaben', label: 'Aufgaben', icon: CheckCircle2 },
                { id: 'essen',    label: 'Essensplan', icon: Utensils },
                { id: 'listen',   label: 'Notizen',  icon: StickyNote },
                { id: 'design',   label: 'Design',   icon: Palette, color: 'text-pink-400' },
                { id: 'google',   label: 'Konten',   icon: Globe, color: 'text-sky-400', dot: true }
              ].map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group flex flex-col items-center gap-1 w-16 sm:w-20 py-2.5 rounded-2xl transition-all relative cursor-pointer ${
                      active ? 'text-white shadow-md' : 'hover:bg-white/10'
                    }`}
                    style={
                      active
                        ? { backgroundColor: theme.accentBtn, color: '#ffffff' }
                        : { color: theme.textMuted }
                    }
                  >
                    {item.dot && <span className="absolute top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
                    <Icon className={`w-6 h-6 ${!active && item.color ? item.color : ''}`} />
                    <span className="text-[11px] font-bold">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* + Neuer Termin Button */}
            <button
              onClick={() => openNewEventModal(TODAY_STR, 'hans')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-emerald-400 p-0.5 shadow-lg cursor-pointer hover:scale-105 transition-transform"
              title="Neuer Termin"
            >
              <div className="w-full h-full bg-slate-900/20 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                +
              </div>
            </button>
          </aside>
        )}

        {/* HAUPTBEREICH */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* KOPFZEILE */}
          <header
            className="min-h-[86px] py-2 px-4 sm:px-6 border-b flex flex-wrap items-center justify-between shrink-0 z-10 gap-3"
            style={{ background: theme.headerBg, borderColor: theme.borderColor }}
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl lg:text-3xl font-extrabold tracking-tight" style={{ color: theme.textMain }}>
                  {clockStr}
                </span>
                <span className="text-xl font-light opacity-40 hidden sm:inline">|</span>
                <h1 className="text-lg lg:text-2xl font-bold tracking-tight" style={{ color: theme.textMain }}>
                  Familie Richter
                </h1>

                <button
                  onClick={cycleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 cursor-pointer hover:bg-indigo-500/30"
                >
                  <span>{theme.name}</span>
                </button>

                <button
                  onClick={() => handlePullFromGoogleBridge(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                    !isOnline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  <span>
                    {!isOnline
                      ? `📶 Offline-Puffer (${offlineQueueCount})`
                      : `☁️ Auto-Sync (${clockStr})`}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPocketMode(!pocketMode);
                    if (!pocketMode) setActiveSection('listen');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{pocketMode ? '🖥️ Wandansicht' : '📱 Handy-Modus'}</span>
                </button>

                {!pocketMode && (
                  <button
                    onClick={toggleFullScreen}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Vollbild
                  </button>
                )}
              </div>

              {/* Datums-Navigation */}
              {!pocketMode && (
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => navigatePeriod(-1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => {
                      setCurrentBaseDate(new Date(2026, 10, 2));
                      setActiveSection('kalender');
                    }}
                    className="px-3 py-0.5 rounded-full text-xs font-bold border cursor-pointer"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    Heute
                  </button>
                  <button
                    onClick={() => navigatePeriod(1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    ▶
                  </button>
                  <div className="ml-1 px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-400/30">
                    {periodLabel}
                  </div>
                  <span className="hidden 2xl:inline-flex text-[11px] font-bold opacity-60 ml-2">
                    🔄 2-Min. Auto-Refresh • 🏖️ BW-Ferien & Feiertage aktiv
                  </span>
                </div>
              )}
            </div>

            {/* Ansichten-Umschalter (1W, 2W, 4W, Jahreswand) & Familien-Filter */}
            {!pocketMode && (
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="flex p-1 rounded-2xl border shadow-inner"
                  style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}
                >
                  {[
                    { id: '1w', label: '1 Woche' },
                    { id: '2w', label: '2 Wochen' },
                    { id: '4w', label: '4 Wochen' },
                    { id: 'year', label: 'Jahreswand' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setActiveSection('kalender');
                        setCurrentView(v.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSection === 'kalender' && currentView === v.id ? 'shadow-sm text-white' : ''
                      }`}
                      style={
                        activeSection === 'kalender' && currentView === v.id
                          ? { backgroundColor: theme.accentBtn }
                          : { color: theme.textMuted }
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                {/* Rechts: Avatare zum Filtern */}
                <div className="hidden xl:flex items-center gap-2">
                  <button
                    onClick={() => setActiveMemberFilter('all')}
                    className={`px-3.5 h-11 rounded-full border-2 font-extrabold text-xs cursor-pointer ${
                      activeMemberFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-500' : ''
                    }`}
                    style={activeMemberFilter !== 'all' ? { backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain } : {}}
                  >
                    Alle
                  </button>
                  {members.filter(m => m.id !== 'all').map(m => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMemberFilter(activeMemberFilter === m.id ? 'all' : m.id)}
                      className={`relative rounded-full transition-all cursor-pointer ${
                        activeMemberFilter === m.id ? 'ring-4 ring-indigo-500 scale-105' : activeMemberFilter !== 'all' ? 'opacity-40' : ''
                      }`}
                      title={`${m.name} filtern`}
                    >
                      <MemberAvatar member={m} size="w-11 h-11" textSize="text-base" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* HAUPT-VIEWPORT */}
          <main className="flex-1 overflow-auto relative" style={{ backgroundColor: theme.viewportBg }}>
            {activeSection === 'kalender' && (
              currentView === '1w' ? renderSwimlaneCalendar(7) :
              currentView === '2w' ? renderSwimlaneCalendar(14) :
              currentView === '4w' ? renderFourWeeksCalendar() :
              renderYearWallCalendar()
            )}
            {activeSection === 'schule' && renderSchoolSection()}
            {activeSection === 'design' && renderDesignSection()}
            {activeSection === 'google' && renderGoogleAccountsSection()}
            {activeSection === 'aufgaben' && renderTasksSection()}
            {activeSection === 'listen' && renderNotesSection()}
            {activeSection === 'essen' && renderMealPlanSection()}
          </main>

          {/* UNTERE DAUMEN-NAVIGATION IM SMARTPHONE-MODUS */}
          {pocketMode && (
            <nav
              className="h-16 border-t grid grid-cols-5 items-center px-2 shrink-0"
              style={{ background: theme.headerBg, borderColor: theme.borderColor }}
            >
              {[
                { id: 'listen', label: 'Einkauf', icon: ShoppingBag },
                { id: 'aufgaben', label: 'Aufgaben', icon: CheckCircle2 },
                { id: 'essen', label: 'Essen', icon: Utensils },
                { id: 'kalender', label: 'Kalender', icon: Calendar },
                { id: 'schule', label: 'Schule', icon: GraduationCap }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-xl cursor-pointer ${
                      active ? 'text-white font-extrabold' : 'opacity-70'
                    }`}
                    style={active ? { backgroundColor: theme.accentBtn } : { color: theme.textMuted }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* ========================================================================
          MODAL 1: TERMIN ERSTELLEN / BEARBEITEN (INKL. EMOJIS & BENACHRICHTIGUNG)
          ======================================================================== */}
      {eventModal.open && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="rounded-3xl max-w-xl w-full p-6 shadow-2xl border space-y-4 max-h-[94vh] overflow-y-auto"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
              <h3 className="text-xl font-extrabold">
                {eventModal.id ? 'Termin bearbeiten' : 'Neuer Familientermin'}
              </h3>
              <button
                onClick={() => setEventModal(prev => ({ ...prev, open: false }))}
                className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEventModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Was steht an?</label>
                <input
                  type="text"
                  required
                  value={eventModal.title}
                  onChange={(e) => setEventModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. ⚽ Fußballtraining oder 🦷 Zahnarzt"
                  className="w-full px-4 py-3 rounded-xl border font-bold text-sm"
                  style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
              </div>

              {/* Schnell-Emojis */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { emoji: '⚽ ', label: '⚽ Sport' },
                  { emoji: '🐴 ', label: '🐴 Ponyhof' },
                  { emoji: '🦷 ', label: '🦷 Arzt' },
                  { emoji: '🎂 ', label: '🎂 Feier' },
                  { emoji: '🎒 ', label: '🎒 Schule' },
                  { emoji: '🏎️ ', label: '🏎️ Kartbahn' },
                  { emoji: '🐕 ', label: '🐕 Hund' }
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setEventModal(prev => ({ ...prev, title: item.emoji + prev.title }))}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: theme.textMuted }}>Kalender-Zeile wählen</label>
                <div className="grid grid-cols-5 gap-2">
                  {members.map(m => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setEventModal(prev => ({ ...prev, member: m.id }))}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer ${
                        eventModal.member === m.id ? 'border-indigo-500 bg-indigo-500/20' : ''
                      }`}
                      style={eventModal.member !== m.id ? { borderColor: theme.borderColor } : {}}
                    >
                      <MemberAvatar member={m} size="w-7 h-7" textSize="text-xs" />
                      <span className="text-[11px] font-bold truncate max-w-full">{m.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Datum</label>
                  <input
                    type="date"
                    value={eventModal.date}
                    onChange={(e) => setEventModal(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Uhrzeit</label>
                  <input
                    type="text"
                    value={eventModal.time}
                    onChange={(e) => setEventModal(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                </div>
              </div>

              {/* Erinnerungs- & Benachrichtigungs-Steuerung */}
              <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider">🔔 Benachrichtigung & Erinnerung</span>
                  <button
                    type="button"
                    onClick={() => showToast(`Alarm-Test (${eventModal.notifyChannel})`, `„${eventModal.title || 'Beispiel-Termin'}“ wird ${eventModal.notifyTime} vorher ausgelöst.`, '🔔')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold cursor-pointer"
                  >
                    🔊 Test-Alarm
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Wann erinnern?</label>
                    <select
                      value={eventModal.notifyTime}
                      onChange={(e) => setEventModal(prev => ({ ...prev, notifyTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                    >
                      <option value="none">Keine Erinnerung</option>
                      <option value="0m">Pünktlich zum Start</option>
                      <option value="15m">15 Min. vorher</option>
                      <option value="30m">30 Min. vorher</option>
                      <option value="1h">1 Stunde vorher</option>
                      <option value="1d">1 Tag vorher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Wie benachrichtigen?</label>
                    <select
                      value={eventModal.notifyChannel}
                      onChange={(e) => setEventModal(prev => ({ ...prev, notifyChannel: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
                    >
                      <option value="wall_push">Touchwall + Handy Push</option>
                      <option value="wall">Nur auf Touchwall</option>
                      <option value="push">Google / Handy Push</option>
                      <option value="mail">Per E-Mail & Push</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: theme.textMuted }}>Welche Personen erinnern?</label>
                  <div className="flex flex-wrap gap-2">
                    {members.filter(m => m.id !== 'all').map(m => {
                      const checked = (eventModal.notifyUsers || []).includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setEventModal(prev => {
                              const list = prev.notifyUsers || [];
                              return {
                                ...prev,
                                notifyUsers: list.includes(m.id) ? list.filter(u => u !== m.id) : [...list, m.id]
                              };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                            checked ? 'border-indigo-500 bg-indigo-500/20' : 'opacity-60'
                          }`}
                          style={!checked ? { borderColor: theme.borderColor } : {}}
                        >
                          <MemberAvatar member={m} size="w-5 h-5" textSize="text-[10px]" />
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                {eventModal.id ? (
                  <button
                    type="button"
                    onClick={() => deleteEventById(eventModal.id)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
                  >
                    🗑️ Sofort löschen
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventModal(prev => ({ ...prev, open: false }))}
                    className="px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                    style={{ borderColor: theme.borderColor }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: JAHRESWAND TAGES-POPUP (INKL. 1-KLICK PERSONEN-TRANSFER)
          ======================================================================== */}
      {yearDayModal.open && (() => {
        const parts = yearDayModal.date.split('-');
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const holiday = getBWHolidayName(yearDayModal.date);
        const vacation = getBWVacationName(yearDayModal.date);
        const dayEvents = events.filter(e => e.date === yearDayModal.date);

        return (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className="rounded-3xl max-w-2xl w-full p-6 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
                <div>
                  <span className="text-xs font-extrabold uppercase text-indigo-400">Tages-Übersicht & Schnellverwaltung</span>
                  <h3 className="text-2xl font-extrabold mt-0.5">
                    {WEEKDAYS_SHORT[dObj.getDay()]}, {dObj.getDate()}. {MONTHS_NAMES[dObj.getMonth()]} {dObj.getFullYear()}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {holiday && <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-extrabold">🎌 {holiday}</span>}
                    {vacation && <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">🏖️ {vacation}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setYearDayModal(prev => ({ ...prev, open: false }))}
                  className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[140px]">
                {dayEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm font-bold border-2 border-dashed rounded-2xl opacity-60" style={{ borderColor: theme.borderColor }}>
                    Noch keine eigenen Termine an diesem Tag eingetragen.
                  </div>
                ) : (
                  dayEvents.map(ev => {
                    const mem = members.find(m => m.id === ev.member) || members[0];
                    return (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3"
                        style={{ ...getRowHeaderStyle(mem), borderColor: theme.borderColor }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <MemberAvatar member={mem} size="w-10 h-10" textSize="text-sm" />
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-sm lg:text-base break-words">{ev.title}</div>
                            <div className="text-xs font-bold opacity-75 mt-0.5">{mem.name} • {ev.time || 'Ganztägig'}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase opacity-70 mr-1">Transfer:</span>
                          {members.map(targetM => {
                            const pal = COLOR_PALETTES[targetM.color] || COLOR_PALETTES.royal_bold;
                            const isCurrent = ev.member === targetM.id;
                            return (
                              <button
                                key={targetM.id}
                                type="button"
                                onClick={() => transferEventToMemberAndDate(ev.id, targetM.id, yearDayModal.date)}
                                style={{ backgroundColor: pal.hex, color: '#ffffff' }}
                                className={`w-7 h-7 rounded-lg font-extrabold text-[10px] cursor-pointer ${
                                  isCurrent ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-65 hover:opacity-100'
                                }`}
                                title={`Auf ${targetM.name} übertragen`}
                              >
                                {targetM.badge}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={(e) => {
                              setYearDayModal(prev => ({ ...prev, open: false }));
                              openEditEventModal(e, ev);
                            }}
                            className="ml-2 px-2.5 py-1.5 rounded-xl bg-black/20 text-xs font-extrabold cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEventById(ev.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!yearDayModal.newTitle.trim()) return;
                  setEvents(prev => [
                    ...prev,
                    {
                      id: 'ev_' + Date.now(),
                      title: yearDayModal.newTitle.trim(),
                      date: yearDayModal.date,
                      time: yearDayModal.newTime.trim() || 'Ganztägig',
                      member: yearDayModal.newMember,
                      notifyTime: '30m',
                      notifyChannel: 'wall_push',
                      notifyUsers: [yearDayModal.newMember]
                    }
                  ]);
                  setYearDayModal(prev => ({ ...prev, newTitle: '' }));
                  showToast('Termin eingetragen', `${yearDayModal.newTitle} (${yearDayModal.date})`, '✅');
                }}
                className="pt-4 border-t space-y-3"
                style={{ borderColor: theme.borderColor }}
              >
                <div className="text-xs font-extrabold uppercase opacity-75">➕ Neuen Termin an diesem Tag direkt hinzufügen</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={yearDayModal.newTitle}
                    onChange={(e) => setYearDayModal(prev => ({ ...prev, newTitle: e.target.value }))}
                    placeholder="Termin (z.B. 🎂 Geburtstag / Arzt)..."
                    className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-sm font-bold"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                  <input
                    type="text"
                    value={yearDayModal.newTime}
                    onChange={(e) => setYearDayModal(prev => ({ ...prev, newTime: e.target.value }))}
                    placeholder="Ganztägig"
                    className="px-3.5 py-2.5 rounded-xl border text-sm font-bold"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(m => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setYearDayModal(prev => ({ ...prev, newMember: m.id }))}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer ${
                          yearDayModal.newMember === m.id ? 'border-indigo-500 bg-indigo-500/20' : 'opacity-70'
                        }`}
                        style={yearDayModal.newMember !== m.id ? { borderColor: theme.borderColor } : {}}
                      >
                        {m.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer">
                    + Termin eintragen
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================
          MODAL 3: WEITEREN KALENDER HINZUFÜGEN (+ BUTTON UNTER KONTEN)
          ======================================================================== */}
      {addCalModal.open && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
              <h3 className="text-xl font-extrabold">➕ Weiteren Kalender hinzufügen</h3>
              <button
                onClick={() => setAddCalModal(prev => ({ ...prev, open: false }))}
                className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCalendar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Name der Zeile (z.B. Arbeit / Oma / Verein)</label>
                <input
                  type="text"
                  required
                  value={addCalModal.name}
                  onChange={(e) => setAddCalModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Schichtplan / Ferien"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                  style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Google Kalender-ID</label>
                <input
                  type="text"
                  value={addCalModal.calendarId}
                  onChange={(e) => setAddCalModal(prev => ({ ...prev, calendarId: e.target.value }))}
                  placeholder="name@gmail.com oder ...@group.calendar.google.com"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                  style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCalModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ borderColor: theme.borderColor }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  + Zeile anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 4: SCHULSTUNDE BEARBEITEN (INKL. SCHNELLWAHL-BUTTONS)
          ======================================================================== */}
      {schoolModal.open && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
              <h3 className="text-lg font-extrabold">Schulstunde anpassen</h3>
              <button onClick={() => setSchoolModal(prev => ({ ...prev, open: false }))} className="w-8 h-8 rounded-full bg-black/20 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={schoolModal.subject}
                onChange={(e) => setSchoolModal(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Schulfach (z.B. 📐 Mathe)"
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
              />

              <div className="flex flex-wrap gap-1.5">
                {['📐 Mathe', '📖 Deutsch', '🇬🇧 Englisch', '⚽ Sport', '🔬 NWT/Sachkunde', '🎨 Kunst/Musik'].map(subj => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSchoolModal(prev => ({ ...prev, subject: subj }))}
                    className="px-2.5 py-1 rounded-xl border text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
                  >
                    {subj}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSchoolModal(prev => ({ ...prev, subject: '' }))}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold cursor-pointer"
                >
                  Freistunde
                </button>
              </div>

              <input
                type="text"
                value={schoolModal.room}
                onChange={(e) => setSchoolModal(prev => ({ ...prev, room: e.target.value }))}
                placeholder="Raum / Lehrer (z.B. R. 204)"
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
              />
              <select
                value={schoolModal.status}
                onChange={(e) => setSchoolModal(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold"
                style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor, color: theme.textMain }}
              >
                <option value="normal">Regulär nach Plan</option>
                <option value="change">⚠️ Änderung / Vertretung</option>
                <option value="exam">📝 Arbeit / Test</option>
                <option value="cancel">❌ Entfall</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const key = `${schoolModal.dayIdx}-${schoolModal.periodIdx}`;
                  setSchoolData(prev => ({
                    ...prev,
                    [activeSchoolChild]: {
                      ...prev[activeSchoolChild],
                      slots: {
                        ...prev[activeSchoolChild].slots,
                        [key]: { subject: schoolModal.subject, room: schoolModal.room, status: schoolModal.status }
                      }
                    }
                  }));
                  setSchoolModal(prev => ({ ...prev, open: false }));
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 5: SMARTPHONE QR-CODE ZENTRALE (FÜR UNTERWEGS IM SUPERMARKT)
          ======================================================================== */}
      {qrModal.open && (() => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://deine-touchwall.vercel.app';
        const targetUrl = `${baseUrl}?mobile=1&section=listen&user=${qrModal.selectedMember}`;
        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;

        return (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className="rounded-3xl max-w-lg w-full p-6 shadow-2xl border text-center space-y-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
                <h3 className="text-lg font-extrabold">📱 Smartphone-App & QR-Code (Vercel Live-Sync)</h3>
                <button onClick={() => setQrModal({ open: false, selectedMember: 'all' })} className="w-8 h-8 rounded-full bg-black/20 cursor-pointer">✕</button>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setQrModal(prev => ({ ...prev, selectedMember: m.id }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                      qrModal.selectedMember === m.id ? 'bg-indigo-600 text-white border-indigo-500' : ''
                    }`}
                    style={qrModal.selectedMember !== m.id ? { borderColor: theme.borderColor } : {}}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-white rounded-3xl inline-block shadow-md">
                <img src={qrImgUrl} alt="Smartphone QR Code" className="w-48 h-48 mx-auto rounded-xl" />
              </div>

              <p className="text-xs font-semibold leading-relaxed" style={{ color: theme.textMuted }}>
                Scanne diesen Code mit der Handy-Kamera. Die Vercel-Web-App öffnet sich direkt im <strong>Handy-Modus</strong> und speichert die komplette Einkaufs- & Aufgabenliste offlinefähig für den Supermarkt!
              </p>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setQrModal({ open: false, selectedMember: 'all' });
                    setPocketMode(true);
                    setActiveSection('listen');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-extrabold cursor-pointer"
                >
                  📱 Handy-Modus hier testen
                </button>
                <button
                  onClick={() => setQrModal({ open: false, selectedMember: 'all' })}
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================
          MODAL 6: VERCEL CLOUD DEPLOYMENT-ASSISTENT (SCHRITT-FÜR-SCHRITT)
          ======================================================================== */}
      {vercelGuideModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="rounded-3xl max-w-2xl w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textMain }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderColor }}>
              <div className="flex items-center gap-2.5">
                <Rocket className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-extrabold">So stellst du deine Touchwall kostenlos auf Vercel online</h3>
              </div>
              <button onClick={() => setVercelGuideModalOpen(false)} className="w-8 h-8 rounded-full bg-black/20 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs lg:text-sm leading-relaxed">
              <div className="p-4 rounded-2xl border" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <div className="font-extrabold text-indigo-400 mb-1">Schritt 1: Code in ein Next.js- oder Vite-React-Projekt legen</div>
                <p style={{ color: theme.textMuted }}>
                  Erstelle ein kostenloses Projekt (z.B. mit <code className="text-amber-300">npx create-next-app@latest</code>), installiere <code className="text-amber-300">lucide-react</code> und kopiere diesen kompletten Code aus <code className="text-amber-300">App.jsx</code> in deine Hauptseite (<code className="text-amber-300">app/page.jsx</code> – ganz oben <code className="text-amber-300">'use client';</code> ergänzen).
                </p>
              </div>

              <div className="p-4 rounded-2xl border" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <div className="font-extrabold text-emerald-400 mb-1">Schritt 2: Bestehende Code.gs als API-Brücke erweitern (1 Klick)</div>
                <p style={{ color: theme.textMuted }}>
                  Klicke im Reiter „Konten“ auf <strong>„📋 Code.gs Erweiterung (Drive + API) kopieren“</strong> und füge die Zeilen unten in dein bestehendes Google Apps Script ein. Dadurch übernimmt dein Google-Skript weiterhin alle Google-Kalender-, Google-Tasks- und Google-Drive-Backups ohne OAuth-Aufwand.
                </p>
              </div>

              <div className="p-4 rounded-2xl border" style={{ backgroundColor: theme.subtleBg, borderColor: theme.borderColor }}>
                <div className="font-extrabold text-amber-400 mb-1">Schritt 3: Mit 1 Klick auf vercel.com veröffentlichen</div>
                <p style={{ color: theme.textMuted }}>
                  Lade dein Projekt auf GitHub hoch und verknüpfe es kostenlos auf <strong>vercel.com</strong>. Trage deine Apps-Script-URL entweder direkt in der App unter „Konten“ oder in Vercel als Umgebungsvariable <code className="text-amber-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code> ein – fertig!
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={copyAppsScriptBridgeCode}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
              >
                📋 Code.gs API-Brücke kopieren
              </button>
              <button
                onClick={() => setVercelGuideModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}