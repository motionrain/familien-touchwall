// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, GraduationCap, CheckSquare, Utensils, FileText,
  Palette, Cloud, Plus, ChevronLeft, ChevronRight, Maximize2,
  Smartphone, RefreshCw, Download, Upload, QrCode, X
} from 'lucide-react';

// =========================================================
// 1. HILFSFUNKTIONEN & DATUMS-LOGIK 2
// =========================================================
function formatDateStr(dateObj) {
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#0284c7').replace('#', '');
  const num = parseInt(clean, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// =========================================================
// 2. BADEN-WÜRTTEMBERG FEIERTAGE & SCHULFERIEN (2025-2029)
// =========================================================
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

function getBWHolidayName(dateStr) {
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
  { start: '2027-12-23', end: '2028-01-08', name: 'Weihnachtsferien BW' }
];

function getBWVacationName(dateStr) {
  if (!dateStr) return null;
  for (let i = 0; i < BW_SCHOOL_VACATIONS.length; i++) {
    const v = BW_SCHOOL_VACATIONS[i];
    if (dateStr >= v.start && dateStr <= v.end) return v.name;
  }
  return null;
}

// =========================================================
// 3. FARBPALETTEN, THEMES & STANDARD-DATEN
// =========================================================
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

const PAGE_THEMES = [
  { id: 'light',     name: '☀️ Klassisch Hell', desc: 'Klares, helles Wandkalender-Design', dark: false },
  { id: 'cozy',      name: '🌅 Warm Cozy',      desc: 'Sanfte Sand- und Naturtöne',         dark: false },
  { id: 'mint',      name: '🌿 Nordic Mint',    desc: 'Frisches Skandinavien-Grün',         dark: false },
  { id: 'metal',     name: '⚙️ Metal Silver',   desc: 'Titan- & Gunmetal-Grau mit starkem Kontrast', dark: true },
  { id: 'lightdark', name: '🌗 Light Dark',     desc: 'Angenehmes Dunkelblau-Grau (Slate)', dark: true },
  { id: 'irongray',  name: '🛡️ Iron Gray',      desc: 'Tiefes Graphit & Anthrazit',         dark: true },
  { id: 'dark',      name: '🌙 Midnight Dark',  desc: 'Tiefdunkler Nachtmodus',             dark: true }
];

const AVATAR_EMOJIS = ['👨‍👩‍👧‍👦', '👨', '👩', '👦', '👧', '🏎️', '💻', '🐕', '🐴', '⚽', '🎮', '🎨', '🦸‍♂️', '🦸‍♀️', '👑', '🦊'];

const DEFAULT_MEMBERS = [
  { id: 'all',       name: 'Familie & Events', role: 'Alle gemeinsam', badge: 'FR', color: 'orange_bold',  avatarType: 'emoji', emoji: '👨‍👩‍👧‍👦', photoUrl: '', calendarId: 'primary', statusMsg: 'Hauptkalender', ok: true },
  { id: 'hans',      name: 'Hans',             role: 'Vater',          badge: 'H',  color: 'navy_bold',    avatarType: 'photo', emoji: '🏎️',     photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', calendarId: '', statusMsg: 'Bereit', ok: false },
  { id: 'sarah',     name: 'Sarah',            role: 'Mutter',         badge: 'S',  color: 'pink',         avatarType: 'photo', emoji: '👩',     photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', calendarId: '', statusMsg: 'Bereit', ok: false },
  { id: 'dean',      name: 'Dean',             role: 'Sohn',           badge: 'D',  color: 'crimson_bold', avatarType: 'emoji', emoji: '⚽',     photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=120&q=80', calendarId: '', statusMsg: 'Bereit', ok: false },
  { id: 'valentina', name: 'Valentina',        role: 'Tochter',        badge: 'V',  color: 'teal_bold',    avatarType: 'emoji', emoji: '🐴',     photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', calendarId: '', statusMsg: 'Bereit', ok: false }
];

const DEFAULT_MEALS = [
  { id: 1, dayLabel: 'Montag',     dish: '🍝 Glutenfreie Spaghetti Bolognese', ingredients: [{ name: 'Glutenfreie Spaghetti', done: true }, { name: 'Rinderhackfleisch 500g', done: false }, { name: 'Passierte Tomaten', done: true }, { name: 'Parmesan', done: false }] },
  { id: 2, dayLabel: 'Dienstag',   dish: '🥞 Pfannkuchen mit Apfelmus',        ingredients: [{ name: 'Glutenfreies Mehl', done: true }, { name: 'Eier (6 Stück)', done: true }, { name: 'Milch', done: false }, { name: 'Apfelmus im Glas', done: false }] },
  { id: 3, dayLabel: 'Mittwoch',   dish: '🥦 Gemüse-Wok mit Reis',             ingredients: [{ name: 'Basmatireis', done: true }, { name: 'Brokkoli & Paprika', done: false }, { name: 'Hähnchenbrust', done: false }, { name: 'Tamari (GF Sojasoße)', done: true }] },
  { id: 4, dayLabel: 'Donnerstag', dish: '🧀 Hausgemachte Mac & Cheese (GF)',  ingredients: [{ name: 'Glutenfreie Hörnchennudeln', done: true }, { name: 'Cheddar & Gouda gerieben', done: false }, { name: 'Maisstärke', done: true }, { name: 'Butter & Milch', done: true }] },
  { id: 5, dayLabel: 'Freitag',    dish: '🌮 Familien-Taco Abend',             ingredients: [{ name: 'Mais-Tacoschalen', done: false }, { name: 'Hackfleisch & Mais', done: false }, { name: 'Guacamole / Avocado', done: false }, { name: 'Salsa & Sauerrahm', done: true }] },
  { id: 6, dayLabel: 'Samstag',    dish: '🍕 Pizza-Abend',                     ingredients: [{ name: 'Glutenfreier Pizzateig', done: false }, { name: 'Mozzarella', done: false }, { name: 'Salami & Champignons', done: false }] },
  { id: 7, dayLabel: 'Sonntag',    dish: '🍗 Sonntagsbraten & Ofenkartoffeln', ingredients: [{ name: 'Kartoffeln 1,5 kg', done: true }, { name: 'Sonntagsbraten / Hähnchen', done: false }, { name: 'Grüner Salat', done: false }] }
];

const DEFAULT_NOTES = [
  { id: 1, title: '🛒 Einkaufsliste (Geteilt)', color: 'amber', author: 'Sarah & Hans', items: [{ text: 'Glutenfreier Blätterteig', done: false }, { text: 'Fisch Seesternchen', done: false }, { text: 'Katzenfutter Norma', done: false }] },
  { id: 2, title: '📌 Wichtige Familien-Infos', color: 'sky',   author: 'Hans',         items: [{ text: 'Ponyhof Dienstplan am Wochenende prüfen', done: false }, { text: 'Müllabfuhr Gelber Sack: Dienstag früh', done: false }] },
  { id: 3, title: '🎁 Ideen & Besorgungen',     color: 'pink',  author: 'Familie',      items: [{ text: 'Dean: Neue Fußballschuhe schauen', done: false }, { text: 'Valentina: Bastelset & Reithandschuhe', done: false }] }
];

const DEFAULT_SCHOOL = {
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

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyY2AOKbYqdHNbdcjbTRGW2w-8xqjL3fDN7mdLpKQtmBaQfYcA54NIM97FxmLca7-1L/exec';

// =========================================================
// 4. HAUPTKOMPONENTE: TOUCHWALL APP
// =========================================================
export default function TouchwallApp() {
  const [todayStr, setTodayStr] = useState(() => formatDateStr(new Date()));
  const [currentBaseDate, setCurrentBaseDate] = useState(() => getMonday(new Date()));
  const [currentView, setCurrentView] = useState('1w');
  const [activeSection, setActiveSection] = useState('kalender');
  const [activeMemberFilter, setActiveMemberFilter] = useState('all');
  const [currentTheme, setCurrentTheme] = useState('metal');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [clockStr, setClockStr] = useState('');

  // Cloud- & Sync-Status
  const [appsScriptUrl, setAppsScriptUrl] = useState(DEFAULT_APPS_SCRIPT_URL);
  const [syncStatusText, setSyncStatusText] = useState('☁️ Auto-Sync aktiv');
  const [isSyncing, setIsSyncing] = useState(false);

  // Refs für sauberen Hintergrund-Sync ohne Endlosschleifen
  const isInitialLoadDone = useRef(false);
  const isApplyingRemoteState = useRef(false);
  const isMutatingCalendar = useRef(false);
  const autoSaveTimer = useRef(null);

  // Kerndaten
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [events, setEvents] = useState([]);
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS);
  const [familyNotes, setFamilyNotes] = useState(DEFAULT_NOTES);
  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL);
  const [activeSchoolChild, setActiveSchoolChild] = useState('dean');
  const [familyTasks, setFamilyTasks] = useState([
    { id: 1, member: 'hans',      title: 'Touchwall Vollbild & Google Sync prüfen', due: 'Heute', done: false },
    { id: 2, member: 'sarah',     title: 'Essensplan für nächste Woche durchsehen', due: 'Morgen', done: false },
    { id: 3, member: 'dean',      title: '🎒 Schultasche & Sportzeug richten',      due: 'Heute', done: false },
    { id: 4, member: 'valentina', title: '🧸 Zimmer aufräumen & 15 Min. Lesen',     due: 'Heute', done: false }
  ]);

  // Modals & Drag-and-Drop
  const [toast, setToast] = useState(null);
  const [eventModal, setEventModal] = useState({
    open: false, id: null, origMember: '', origTitle: '', origDate: '',
    title: '', date: '', time: '15:00 - 16:00', member: 'hans',
    notifyTime: '30m', notifyChannel: 'wall_push', notifyUsers: ['hans']
  });
  const [yearDayModal, setYearDayModal] = useState({ open: false, dateStr: '', newTitle: '', newTime: 'Ganztägig', newMember: 'all' });
  const [schoolModal, setSchoolModal] = useState({ open: false, dayIdx: 0, periodIdx: 0, subject: '', room: '', status: 'normal' });
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [draggedEv, setDraggedEv] = useState(null);

  // Eingabefelder
  const [newSchoolNote, setNewSchoolNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMember, setNewTaskMember] = useState('hans');
  const [colTaskInputs, setColTaskInputs] = useState({});
  const [ingInputs, setIngInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [newMealDay, setNewMealDay] = useState('');
  const [newMealDish, setNewMealDish] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Familie');
  const [newNoteColor, setNewNoteColor] = useState('amber');

  const showToast = (title, message, icon = '🔔') => {
    setToast({ title, message, icon });
    setTimeout(() => setToast(null), 3800);
  };

  // Zentrale Hilfsfunktion für POST-Aufrufe an Google Apps Script
  const sendCalendarApiAction = async (bodyData, statusLabel = '⏳ Synchronisiere mit Google...') => {
    const targetUrl = (appsScriptUrl || DEFAULT_APPS_SCRIPT_URL).trim();
    if (!targetUrl) return;
    isMutatingCalendar.current = true;
    setIsSyncing(true);
    setSyncStatusText(statusLabel);

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
      });
      const json = await res.json();
      if (json && json.result && Array.isArray(json.result.events)) {
        setEvents(json.result.events);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(json.result.events)); } catch (e) {}
      } else {
        // Fallback: Kurz danach aktuellen Stand abrufen
        setTimeout(() => pullFromCloud(targetUrl, false), 800);
      }
      const now = new Date();
      setSyncStatusText(`☁️ Synchron (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`);
    } catch (err) {
      setSyncStatusText('⚠️ Sync-Hinweis');
    } finally {
      isMutatingCalendar.current = false;
      setIsSyncing(false);
    }
  };

  // 1. Uhrzeit & automatischer Mitternachts-/Datums-Wechsel
  useEffect(() => {
    const updateClockAndDate = () => {
      const now = new Date();
      setClockStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      const nowStr = formatDateStr(now);
      setTodayStr(prev => {
        if (prev !== nowStr) {
          setCurrentBaseDate(getMonday(now));
          return nowStr;
        }
        return prev;
      });
    };
    updateClockAndDate();
    const timer = setInterval(updateClockAndDate, 15000);
    return () => clearInterval(timer);
  }, []);

  // 2. Beim ersten Start: Lokalen Cache laden & immer auf aktuelle Woche setzen
  useEffect(() => {
    setCurrentBaseDate(getMonday(new Date()));
    setTodayStr(formatDateStr(new Date()));

    try {
      const savedUrl = localStorage.getItem('richter_tw_gas_url') || DEFAULT_APPS_SCRIPT_URL;
      setAppsScriptUrl(savedUrl);

      const raw = localStorage.getItem('richter_touchwall_v6');
      if (raw) {
        isApplyingRemoteState.current = true;
        const data = JSON.parse(raw);
        if (Array.isArray(data.members) && data.members.length >= 5) setMembers(data.members);
        if (Array.isArray(data.mealPlan) && data.mealPlan.length > 0) setMealPlan(data.mealPlan);
        if (Array.isArray(data.familyNotes) && data.familyNotes.length > 0) setFamilyNotes(data.familyNotes);
        if (data.schoolData && data.schoolData.dean) setSchoolData(data.schoolData);
        if (Array.isArray(data.familyTasks)) setFamilyTasks(data.familyTasks);
        if (data.currentTheme) setCurrentTheme(data.currentTheme);
        if (data.customLogoUrl) setCustomLogoUrl(data.customLogoUrl);
        setTimeout(() => { isApplyingRemoteState.current = false; }, 200);
      }
      const savedEvents = localStorage.getItem('richter_touchwall_events_cache');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (e) {}
  }, []);

  // 3. Automatischer Hintergrund-Sync bei jeder Änderung an Aufgaben (Google Tasks!), Essensplan, Notizen, Schule oder Design
  useEffect(() => {
    const payload = { members, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl };
    try {
      localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload));
    } catch (e) {}

    if (!isInitialLoadDone.current || isApplyingRemoteState.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const targetUrl = (appsScriptUrl || DEFAULT_APPS_SCRIPT_URL).trim();
      if (!targetUrl) return;
      setSyncStatusText('⏳ Speichere in Google...');
      try {
        await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveState', payload })
        });
        const now = new Date();
        setSyncStatusText(`☁️ Cloud gespeichert (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`);
      } catch (e) {
        setSyncStatusText('💾 Lokal gesichert');
      }
    }, 550);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [members, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl, appsScriptUrl]);

  // 4. Daten aus Google Apps Script laden (inkl. Zusammenführung der Kalender-IDs & Tasks!)
  const pullFromCloud = async (urlOverride, showFeedback = true) => {
    if (isMutatingCalendar.current && !showFeedback) return;
    const targetUrl = (urlOverride !== undefined ? urlOverride : appsScriptUrl).trim();
    if (!targetUrl) {
      if (showFeedback) showToast('Keine URL', 'Bitte Apps-Script-URL unter Konten eintragen.', '⚠️');
      return;
    }
    setIsSyncing(true);
    setSyncStatusText('🔄 Lade aus Google...');
    try {
      const sep = targetUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${targetUrl}${sep}action=json`, { method: 'GET', cache: 'no-store' });
      const bundle = await res.json();

      isApplyingRemoteState.current = true;
      const calMap = (bundle && bundle.calendarData && bundle.calendarData.calendars) || {};
      const statusMap = (bundle && bundle.calendarData && bundle.calendarData.status) || {};

      if (bundle && bundle.state) {
        const s = bundle.state;
        const baseMembers = (Array.isArray(s.members) && s.members.length >= 5) ? s.members : members;
        const mergedMembers = baseMembers.map(m => {
          const cid = calMap[m.id] !== undefined && calMap[m.id] !== '' ? calMap[m.id] : (m.calendarId || (m.id === 'all' ? 'primary' : ''));
          const st = statusMap[m.id];
          return {
            ...m,
            calendarId: cid,
            ok: st ? Boolean(st.ok) : Boolean(cid),
            statusMsg: st && st.msg ? st.msg : (cid ? 'Verbunden ✓' : 'Bereit')
          };
        });
        setMembers(mergedMembers);

        if (Array.isArray(s.mealPlan) && s.mealPlan.length > 0) setMealPlan(s.mealPlan);
        if (Array.isArray(s.familyNotes) && s.familyNotes.length > 0) setFamilyNotes(s.familyNotes);
        if (s.schoolData && s.schoolData.dean) setSchoolData(s.schoolData);
        if (Array.isArray(s.familyTasks)) setFamilyTasks(s.familyTasks);
        if (s.currentTheme) setCurrentTheme(s.currentTheme);
        if (s.customLogoUrl) setCustomLogoUrl(s.customLogoUrl);
      } else if (Object.keys(calMap).length > 0) {
        setMembers(prev => prev.map(m => {
          const cid = calMap[m.id] !== undefined ? calMap[m.id] : (m.calendarId || '');
          const st = statusMap[m.id];
          return {
            ...m,
            calendarId: cid,
            ok: st ? Boolean(st.ok) : Boolean(cid),
            statusMsg: st && st.msg ? st.msg : (cid ? 'Verbunden ✓' : 'Bereit')
          };
        }));
      }

      if (bundle && bundle.calendarData && Array.isArray(bundle.calendarData.events)) {
        setEvents(bundle.calendarData.events);
        try { localStorage.setItem('richter_touchwall_events_cache', JSON.stringify(bundle.calendarData.events)); } catch (e) {}
      }

      setTimeout(() => {
        isApplyingRemoteState.current = false;
        isInitialLoadDone.current = true;
      }, 250);

      const now = new Date();
      setSyncStatusText(`☁️ Auto-Sync (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`);
      if (showFeedback) showToast('Google-Sync erfolgreich', 'Kalender, Konten, Aufgaben & Listen sind aktuell.', '☁️');
    } catch (err) {
      isInitialLoadDone.current = true;
      isApplyingRemoteState.current = false;
      setSyncStatusText('⚠️ Offline / Lokal');
      if (showFeedback) showToast('Verbindungs-Hinweis', 'Prüfe, ob die Apps-Script-Bereitstellung auf „Jeder“ steht.', '⚠️');
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatischer Cloud-Abruf beim Start & alle 2 Minuten
  useEffect(() => {
    const initialUrl = localStorage.getItem('richter_tw_gas_url') || DEFAULT_APPS_SCRIPT_URL;
    if (initialUrl) {
      pullFromCloud(initialUrl, false);
    } else {
      isInitialLoadDone.current = true;
    }
    const syncTimer = setInterval(() => {
      const currentUrl = localStorage.getItem('richter_tw_gas_url') || DEFAULT_APPS_SCRIPT_URL;
      if (currentUrl) pullFromCloud(currentUrl, false);
    }, 120000);
    return () => clearInterval(syncTimer);
  }, []);

  // 5. Manuell Konten & Komplettstand in Google sichern
  const pushToCloudAndDrive = async (customMembersList, showFeedback = true) => {
    const targetUrl = appsScriptUrl.trim();
    const listToSave = customMembersList || members;
    const calMap = {};
    listToSave.forEach(m => {
      calMap[m.id] = (m.calendarId || '').trim();
    });

    const payload = {
      members: listToSave,
      calendars: calMap,
      mealPlan,
      familyNotes,
      schoolData,
      familyTasks,
      currentTheme,
      customLogoUrl,
      exportedAt: new Date().toISOString()
    };

    try { localStorage.setItem('richter_touchwall_v6', JSON.stringify(payload)); } catch (e) {}

    if (!targetUrl) {
      if (showFeedback) showToast('Lokal gespeichert', 'Änderungen wurden im Browser gesichert.', '💾');
      return;
    }

    await sendCalendarApiAction(
      { action: 'saveDriveAndSync', payload, calendars: calMap },
      '⏳ Speichere Konten & Daten...'
    );
    if (showFeedback) showToast('In Google gespeichert', 'Daten, Aufgaben & Kalender-IDs wurden synchronisiert.', '✅');
  };

  // Theme-Styling
  const themeStyles = useMemo(() => {
    switch (currentTheme) {
      case 'metal':
        return {
          outer: 'bg-[#262626] text-slate-100',
          shell: 'bg-[#3b3b3b] border-[#525252]',
          sidebar: 'bg-gradient-to-b from-[#4a4a4a] via-[#333333] to-[#262626] border-[#6e6e6e]',
          header: 'bg-gradient-to-r from-[#4f4f4f] via-[#383838] to-[#2b2b2b] border-[#6e6e6e]',
          viewport: 'bg-gradient-to-br from-[#404040] via-[#333333] to-[#292929]',
          card: 'bg-[#4a4a4a] border-[#6e6e6e] text-slate-100',
          subtle: 'bg-[#3d3d3d] border-[#636363] text-slate-200',
          banner: 'bg-[#1f1f1f] text-white',
          divider: 'border-[#737373]',
          textMain: 'text-slate-100',
          textMuted: 'text-zinc-300',
          dark: true
        };
      case 'lightdark':
        return {
          outer: 'bg-[#161d20] text-slate-100',
          shell: 'bg-[#212a2e] border-[#37474f]',
          sidebar: 'bg-[#1c2428] border-[#37474f]',
          header: 'bg-[#1c2428] border-[#37474f]',
          viewport: 'bg-[#192125]',
          card: 'bg-[#2b363c] border-[#455a64] text-slate-100',
          subtle: 'bg-[#242e33] border-[#37474f] text-slate-200',
          banner: 'bg-[#12181b] text-white',
          divider: 'border-[#455a64]',
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
          card: 'bg-[#212327] border-[#383b42] text-zinc-100',
          subtle: 'bg-[#1b1d21] border-[#33363d] text-zinc-200',
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
          card: 'bg-slate-800 border-slate-700 text-slate-100',
          subtle: 'bg-slate-900 border-slate-700 text-slate-200',
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
          card: 'bg-white border-[#dfd3c3] text-[#3d2f1d]',
          subtle: 'bg-[#f5efe6] border-[#dfd3c3] text-[#3d2f1d]',
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
          card: 'bg-white border-[#b7ded0] text-[#1b4332]',
          subtle: 'bg-[#e3f2ed] border-[#b7ded0] text-[#1b4332]',
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
          card: 'bg-white border-slate-300 text-slate-900',
          subtle: 'bg-slate-50 border-slate-200 text-slate-800',
          banner: 'bg-slate-800 text-white',
          divider: 'border-slate-300',
          textMain: 'text-slate-900',
          textMuted: 'text-slate-500',
          dark: false
        };
    }
  }, [currentTheme]);

  const getMemberStyles = (member) => {
    const p = COLOR_PALETTES[member.color] || COLOR_PALETTES.royal_bold;
    const dark = themeStyles.dark;
    if (p.bold) {
      return {
        cardStyle: { backgroundColor: p.hex, borderLeft: `5px solid ${p.border}`, color: '#ffffff' },
        headerStyle: {
          background: dark
            ? `linear-gradient(90deg, ${hexToRgba(p.hex, 0.42)} 0%, ${hexToRgba(p.hex, 0.18)} 100%)`
            : `linear-gradient(90deg, ${hexToRgba(p.hex, 0.25)} 0%, ${hexToRgba(p.hex, 0.10)} 100%)`,
          borderLeft: `6px solid ${p.hex}`
        },
        cellStyle: (isWeekend) => ({
          backgroundColor: isWeekend
            ? hexToRgba(p.hex, dark ? 0.30 : 0.24)
            : hexToRgba(p.hex, dark ? 0.18 : 0.14)
        }),
        badgeStyle: { backgroundColor: p.hex, color: '#ffffff' }
      };
    } else {
      return {
        cardStyle: {
          backgroundColor: dark ? hexToRgba(p.hex, 0.36) : p.light,
          borderLeft: `4px solid ${p.hex}`,
          color: dark ? '#f8fafc' : p.text
        },
        headerStyle: {
          backgroundColor: dark ? hexToRgba(p.hex, 0.28) : p.light,
          borderLeft: `6px solid ${p.hex}`
        },
        cellStyle: (isWeekend) => ({
          backgroundColor: isWeekend
            ? hexToRgba(p.hex, dark ? 0.22 : 0.18)
            : hexToRgba(p.hex, dark ? 0.12 : 0.10)
        }),
        badgeStyle: { backgroundColor: p.hex, color: '#ffffff' }
      };
    }
  };

  const renderAvatar = (member, size = 'w-11 h-11', textSize = 'text-base') => {
    const st = getMemberStyles(member);
    if (member.avatarType === 'photo' && member.photoUrl) {
      return (
        <div
          style={{ borderColor: COLOR_PALETTES[member.color]?.hex || '#3b82f6' }}
          className={`${size} rounded-full border-2 shadow-sm shrink-0 overflow-hidden relative flex items-center justify-center font-extrabold`}
        >
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (member.avatarType === 'emoji' && member.emoji) {
      return (
        <div style={st.badgeStyle} className={`${size} rounded-full flex items-center justify-center ${textSize} shadow-sm shrink-0`}>
          {member.emoji}
        </div>
      );
    }
    return (
      <div style={st.badgeStyle} className={`${size} rounded-full font-extrabold ${textSize} flex items-center justify-center shadow-sm shrink-0`}>
        {member.badge}
      </div>
    );
  };

  const periodLabel = useMemo(() => {
    if (currentView === 'year') return `Jahreswand ${currentBaseDate.getFullYear()} (BW)`;
    const start = getMonday(currentBaseDate);
    const add = currentView === '1w' ? 6 : currentView === '2w' ? 13 : 27;
    const end = addDays(start, add);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
    return `${fmt(start)} – ${fmt(end)}${end.getFullYear()}`;
  }, [currentBaseDate, currentView]);

  const navigatePeriod = (dir) => {
    if (currentView === '1w') setCurrentBaseDate(addDays(currentBaseDate, dir * 7));
    else if (currentView === '2w') setCurrentBaseDate(addDays(currentBaseDate, dir * 14));
    else if (currentView === '4w') setCurrentBaseDate(addDays(currentBaseDate, dir * 28));
    else {
      const copy = new Date(currentBaseDate);
      copy.setFullYear(copy.getFullYear() + dir);
      setCurrentBaseDate(copy);
    }
  };

  // Uploads (Logo & Profilfoto)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomLogoUrl(ev.target.result);
      showToast('Logo aktualisiert', 'Dein eigenes Logo ist jetzt oben links aktiv!', '🖼️');
    };
    reader.readAsDataURL(file);
  };

  const handleMemberPhotoUpload = (memberId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photoUrl: ev.target.result, avatarType: 'photo' } : m));
      showToast('Foto gespeichert', 'Profilbild wurde aktualisiert.', '📷');
    };
    reader.readAsDataURL(file);
  };

  // =========================================================
  // 5. KALENDER-TERMINE SPEICHERN, BEARBEITEN, LÖSCHEN & VERSCHIEBEN (MIT GOOGLE SYNC!)
  // =========================================================
  const openNewEventModal = (dateStr = todayStr, memberId = 'hans') => {
    setEventModal({
      open: true, id: null, origMember: '', origTitle: '', origDate: '',
      title: '', date: dateStr, time: '15:00 - 16:00',
      member: memberId, notifyTime: '30m', notifyChannel: 'wall_push',
      notifyUsers: memberId === 'all' ? ['hans', 'sarah', 'dean', 'valentina'] : [memberId]
    });
  };

  const openEditEventModal = (e, ev) => {
    if (e) e.stopPropagation();
    setEventModal({
      open: true, id: ev.id,
      origMember: ev.member, origTitle: ev.title, origDate: ev.date,
      title: ev.title, date: ev.date, time: ev.time || 'Ganztägig',
      member: ev.member, notifyTime: ev.notifyTime || '30m', notifyChannel: ev.notifyChannel || 'wall_push',
      notifyUsers: ev.notifyUsers || [ev.member]
    });
  };

  const saveEventModal = async (e) => {
    e.preventDefault();
    if (!eventModal.title.trim()) return;

    if (eventModal.id) {
      const updatedEv = {
        id: eventModal.id,
        title: eventModal.title.trim(),
        date: eventModal.date,
        time: eventModal.time.trim(),
        member: eventModal.member,
        notifyTime: eventModal.notifyTime,
        notifyChannel: eventModal.notifyChannel,
        notifyUsers: eventModal.notifyUsers,
        fromGoogle: true
      };
      setEvents(prev => prev.map(item => String(item.id) === String(eventModal.id) ? updatedEv : item));
      setEventModal({ ...eventModal, open: false });
      showToast('Termin aktualisiert', updatedEv.title, '✅');

      await sendCalendarApiAction({
        action: 'updateEvent',
        event: updatedEv,
        oldMember: eventModal.origMember || updatedEv.member,
        oldTitle: eventModal.origTitle || updatedEv.title,
        oldDate: eventModal.origDate || updatedEv.date
      }, '⏳ Aktualisiere in Google Kalender...');
    } else {
      const newEv = {
        id: String(Date.now()),
        title: eventModal.title.trim(),
        date: eventModal.date,
        time: eventModal.time.trim(),
        member: eventModal.member,
        notifyTime: eventModal.notifyTime,
        notifyChannel: eventModal.notifyChannel,
        notifyUsers: eventModal.notifyUsers,
        fromGoogle: true
      };
      setEvents(prev => [...prev, newEv]);
      setEventModal({ ...eventModal, open: false });
      showToast('Termin eingetragen', newEv.title, '✅');

      await sendCalendarApiAction({
        action: 'createEvent',
        event: newEv
      }, '⏳ Erstelle in Google Kalender...');
    }
  };

  const deleteEventById = async (id) => {
    const targetEv = events.find(ev => String(ev.id) === String(id));
    setEvents(prev => prev.filter(ev => String(ev.id) !== String(id)));
    setEventModal({ ...eventModal, open: false });
    showToast('Termin gelöscht', targetEv ? `„${targetEv.title}“ wurde entfernt.` : 'Eintrag entfernt.', '🗑️');

    if (targetEv) {
      await sendCalendarApiAction({
        action: 'deleteEvent',
        eventId: String(targetEv.id),
        member: targetEv.member,
        title: targetEv.title,
        date: targetEv.date
      }, '⏳ Lösche im Google Kalender...');
    }
  };

  const transferEvent = async (evId, targetMemberId, targetDateStr) => {
    const targetEv = events.find(ev => String(ev.id) === String(evId));
    if (!targetEv) return;

    const oldMember = targetEv.member;
    const oldDate = targetEv.date;
    const newDate = targetDateStr || targetEv.date;
    if (oldMember === targetMemberId && oldDate === newDate) return;

    const snapshot = { ...targetEv };
    setEvents(prev => prev.map(ev => String(ev.id) === String(evId) ? { ...ev, member: targetMemberId, date: newDate } : ev));
    const targetM = members.find(m => m.id === targetMemberId);
    showToast('Termin verschoben', `Übertragen auf ${targetM ? targetM.name : targetMemberId}`, '🔄');

    await sendCalendarApiAction({
      action: 'moveEvent',
      eventId: String(snapshot.id),
      oldMember: oldMember,
      targetMember: targetMemberId,
      newDate: newDate,
      eventSnapshot: snapshot,
      oldDate: oldDate
    }, '⏳ Verschiebe im Google Kalender...');
  };

  const addExtraCalendarAccount = () => {
    const name = prompt('Name für den neuen Kalender (z.B. Arbeit / Verein / Ferien / Oma):');
    if (!name || !name.trim()) return;
    const calId = prompt('Google Kalender-ID (z.B. deine-email@gmail.com oder ...@group.calendar.google.com):') || '';
    const updated = [
      ...members,
      {
        id: 'cal_' + Date.now(), name: name.trim(), role: 'Zusatz-Kalender',
        badge: name.trim().charAt(0).toUpperCase(), color: 'teal_bold',
        avatarType: 'emoji', emoji: '📅', photoUrl: '',
        calendarId: calId.trim(), statusMsg: calId.trim() ? 'Verbunden ✓' : 'Bereit', ok: Boolean(calId.trim())
      }
    ];
    setMembers(updated);
    pushToCloudAndDrive(updated, true);
  };

  const restoreScreenshotDefaults = () => {
    setMembers(prev => prev.map(m => {
      const def = DEFAULT_MEMBERS.find(d => d.id === m.id);
      return def ? { ...def, calendarId: m.calendarId, ok: m.ok, statusMsg: m.statusMsg } : m;
    }));
    setCurrentTheme('metal');
    showToast('Standard-Profil aktiv', 'Metal Silver sowie Farben & Fotos wurden wiederhergestellt.', '✅');
  };

  // JSON Export & Import
  const exportBackupJson = () => {
    const payload = { members, events, mealPlan, familyNotes, schoolData, familyTasks, currentTheme, customLogoUrl };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `familien_touchwall_backup_${todayStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Backup heruntergeladen', 'JSON-Datei wurde gespeichert.', '📦');
  };

  const importBackupJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.members) && data.members.length >= 5) setMembers(data.members);
        if (Array.isArray(data.events)) setEvents(data.events);
        if (Array.isArray(data.mealPlan)) setMealPlan(data.mealPlan);
        if (Array.isArray(data.familyNotes)) setFamilyNotes(data.familyNotes);
        if (data.schoolData && data.schoolData.dean) setSchoolData(data.schoolData);
        if (Array.isArray(data.familyTasks)) setFamilyTasks(data.familyTasks);
        if (data.currentTheme) setCurrentTheme(data.currentTheme);
        if (data.customLogoUrl !== undefined) setCustomLogoUrl(data.customLogoUrl);
        showToast('Backup importiert', 'Alle Daten wurden 1:1 wiederhergestellt!', '🎉');
      } catch (err) {
        showToast('Import-Fehler', 'Ungültige JSON-Datei.', '❌');
      }
    };
    reader.readAsText(file);
  };

  const visibleMembers = useMemo(() => {
    return activeMemberFilter === 'all'
      ? members
      : members.filter(m => m.id === activeMemberFilter || m.id === 'all');
  }, [members, activeMemberFilter]);

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col p-1.5 sm:p-2.5 select-none transition-colors duration-300 ${themeStyles.outer}`}>
      <div className={`w-full h-full rounded-3xl border shadow-2xl flex overflow-hidden ${themeStyles.shell}`}>

        {/* LINKES SEITENMENÜ */}
        <aside className={`w-20 sm:w-24 border-r flex flex-col items-center justify-between py-4 shrink-0 ${themeStyles.sidebar}`}>
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => {
                setCurrentBaseDate(getMonday(new Date()));
                setActiveSection('kalender');
              }}
              title="Heute (Tippe unter Design zum Ändern des Logos)"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform"
            >
              {customLogoUrl ? (
                <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-lg sm:text-xl text-white tracking-tight">FR</span>
              )}
            </button>

            <nav className="flex flex-col items-center gap-1.5 w-full px-2">
              {[
                { id: 'kalender', label: 'Kalender', icon: Calendar },
                { id: 'schule',   label: 'Schule',   icon: GraduationCap },
                { id: 'aufgaben', label: 'Aufgaben', icon: CheckSquare },
                { id: 'essen',    label: 'Essensplan', icon: Utensils },
                { id: 'listen',   label: 'Notizen',  icon: FileText },
                { id: 'design',   label: 'Design',   icon: Palette },
                { id: 'google',   label: 'Konten',   icon: Cloud }
              ].map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full py-2.5 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-extrabold transition-all cursor-pointer relative ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md scale-[1.02]'
                        : `${themeStyles.textMuted} hover:bg-white/10`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="truncate max-w-full px-1">{item.label}</span>
                    {item.id === 'google' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={() => openNewEventModal(todayStr, 'hans')}
            title="Neuer Familientermin"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </aside>

        {/* HAUPTBEREICH */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

          {/* KOPFLEISTE */}
          <header className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${themeStyles.header}`}>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight">{clockStr}</span>
                <span className="opacity-30 text-xl">|</span>
                <span className="text-lg sm:text-xl font-extrabold">Familie Richter</span>

                <button
                  onClick={() => {
                    const idx = PAGE_THEMES.findIndex(t => t.id === currentTheme);
                    const next = PAGE_THEMES[(idx + 1) % PAGE_THEMES.length];
                    setCurrentTheme(next.id);
                    showToast('Design gewechselt', next.name, '🎨');
                  }}
                  className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 hover:bg-indigo-500/30 cursor-pointer"
                >
                  {PAGE_THEMES.find(t => t.id === currentTheme)?.name}
                </button>

                <button
                  onClick={() => pullFromCloud(undefined, true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {syncStatusText}
                </button>

                <button
                  onClick={() => setQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Handy-Sync
                </button>

                <button
                  onClick={() => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
                    else document.exitFullscreen?.();
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${themeStyles.subtle} cursor-pointer`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Vollbild
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <button onClick={() => navigatePeriod(-1)} className={`w-7 h-7 rounded-lg border flex items-center justify-center ${themeStyles.subtle} cursor-pointer`}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentBaseDate(getMonday(new Date()));
                      setActiveSection('kalender');
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-extrabold ${themeStyles.subtle} cursor-pointer`}
                  >
                    Heute
                  </button>
                  <button onClick={() => navigatePeriod(1)} className={`w-7 h-7 rounded-lg border flex items-center justify-center ${themeStyles.subtle} cursor-pointer`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-400/30">
                  {periodLabel}
                </span>

                <span className={`text-[11px] font-semibold ${themeStyles.textMuted} hidden xl:inline`}>
                  🔄 2-Min. Auto-Refresh • 🏖️ BW-Ferien & Feiertage aktiv
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex p-1 rounded-2xl border ${themeStyles.subtle}`}>
                {[
                  { id: '1w', label: '1 Woche' },
                  { id: '2w', label: '2 Wochen' },
                  { id: '4w', label: '4 Wochen' },
                  { id: 'year', label: 'Jahreswand' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setCurrentView(v.id); setActiveSection('kalender'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      currentView === v.id && activeSection === 'kalender'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : `${themeStyles.textMuted} hover:opacity-100`
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMemberFilter('all')}
                  className={`px-3.5 h-10 rounded-full border-2 font-extrabold text-xs cursor-pointer transition-all ${
                    activeMemberFilter === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : `${themeStyles.subtle}`
                  }`}
                >
                  Alle
                </button>
                {members.filter(m => m.id !== 'all').map(m => {
                  const selected = activeMemberFilter === m.id;
                  const dimmed = activeMemberFilter !== 'all' && !selected;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMemberFilter(m.id === activeMemberFilter ? 'all' : m.id)}
                      title={`${m.name} filtern`}
                      className={`relative rounded-full transition-all cursor-pointer ${selected ? 'ring-4 ring-indigo-500 scale-105' : ''} ${dimmed ? 'opacity-40' : ''}`}
                    >
                      {renderAvatar(m, 'w-10 h-10', 'text-sm')}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {/* HAUPT-VIEWPORT */}
          <main className={`flex-1 overflow-auto ${themeStyles.viewport}`}>

            {/* ANSICHT 1: KALENDER (1W & 2W) */}
            {activeSection === 'kalender' && (currentView === '1w' || currentView === '2w') && (() => {
              const numDays = currentView === '1w' ? 7 : 14;
              const startMonday = getMonday(currentBaseDate);
              const days = Array.from({ length: numDays }, (_, i) => addDays(startMonday, i));
              const isTwoWeeks = numDays === 14;
              const kw1 = getISOWeek(startMonday);
              const kw2 = getISOWeek(addDays(startMonday, 7));
              const gridCols = `185px repeat(${numDays}, minmax(${isTwoWeeks ? '95px' : '125px'}, 1fr))`;

              return (
                <div className="min-w-full min-h-full flex flex-col">
                  <div className={`sticky top-0 z-20 shadow-sm ${themeStyles.card}`}>
                    <div className={`grid text-xs font-extrabold uppercase tracking-wider border-b ${themeStyles.banner} ${themeStyles.divider}`} style={{ gridTemplateColumns: gridCols }}>
                      <div className={`px-3 py-2 bg-black/25 flex items-center border-r-2 ${themeStyles.divider}`}>Zeitraum</div>
                      <div className="px-3 py-2 flex items-center justify-between" style={{ gridColumn: 'span 7' }}>
                        <span className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-indigo-500 text-white">KW {kw1}</span>
                          <span>{days[0].getDate()}.{days[0].getMonth() + 1}. – {days[6].getDate()}.{days[6].getMonth() + 1}.</span>
                        </span>
                      </div>
                      {isTwoWeeks && (
                        <div className={`px-3 py-2 flex items-center justify-between bg-black/20 border-l-4 ${themeStyles.divider}`} style={{ gridColumn: 'span 7' }}>
                          <span className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">KW {kw2}</span>
                            <span>{days[7].getDate()}.{days[7].getMonth() + 1}. – {days[13].getDate()}.{days[13].getMonth() + 1}.</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`grid border-b-2 ${themeStyles.divider}`} style={{ gridTemplateColumns: gridCols }}>
                      <div className={`p-3 flex items-center justify-between border-r-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                        <span className="text-xs font-extrabold uppercase tracking-wider">Familie</span>
                        <button onClick={() => setActiveSection('design')} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">
                          🎨 Farben
                        </button>
                      </div>

                      {days.map((d, idx) => {
                        const dateStr = formatDateStr(d);
                        const isToday = dateStr === todayStr;
                        const holiday = getBWHolidayName(dateStr);
                        const vacation = getBWVacationName(dateStr);

                        return (
                          <div
                            key={dateStr}
                            className={`px-2.5 py-2 border-r-2 flex flex-col justify-between ${themeStyles.divider} ${idx === 7 ? 'border-l-4' : ''} ${
                              holiday ? 'bg-rose-500/20' : vacation ? 'bg-emerald-500/15' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold ${isToday ? 'text-orange-400' : themeStyles.textMuted}`}>
                                  {WEEKDAYS_SHORT[d.getDay()]},
                                </span>
                                <span className={`w-7 h-7 text-sm rounded-full flex items-center justify-center font-extrabold ${
                                  isToday ? 'bg-orange-500 text-white shadow-sm' : ''
                                }`}>
                                  {d.getDate()}.
                                </span>
                              </div>
                              <button
                                onClick={() => openNewEventModal(dateStr, 'hans')}
                                className="w-6 h-6 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            {holiday && <div className="text-[10px] font-extrabold text-rose-300 truncate mt-0.5">🎌 {holiday}</div>}
                            {!holiday && vacation && <div className="text-[10px] font-extrabold text-emerald-300 truncate mt-0.5">🏖️ {vacation}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SWIMLANE ZEILEN */}
                  <div className={`flex-1 flex flex-col divide-y-2 ${themeStyles.divider}`}>
                    {visibleMembers.map(member => {
                      const st = getMemberStyles(member);
                      return (
                        <div key={member.id} className="grid flex-1 min-h-[128px] items-stretch" style={{ gridTemplateColumns: gridCols }}>
                          <div style={st.headerStyle} className={`p-3 border-r-2 flex flex-col justify-center sticky left-0 z-10 ${themeStyles.divider}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {renderAvatar(member, 'w-11 h-11', 'text-lg')}
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm sm:text-base truncate">{member.name}</div>
                                  <div className={`text-xs font-semibold truncate ${themeStyles.textMuted}`}>{member.role}</div>
                                </div>
                              </div>
                              <button onClick={() => setActiveSection('design')} className="p-1.5 rounded-lg hover:bg-black/20 opacity-70 hover:opacity-100 cursor-pointer">
                                <Palette className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {days.map((d, idx) => {
                            const dateStr = formatDateStr(d);
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const isToday = dateStr === todayStr;
                            const cellEvents = events.filter(e => e.date === dateStr && e.member === member.id);

                            return (
                              <div
                                key={dateStr}
                                onClick={() => openNewEventModal(dateStr, member.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedEv) {
                                    transferEvent(draggedEv.id, member.id, dateStr);
                                    setDraggedEv(null);
                                  }
                                }}
                                style={st.cellStyle(isWeekend)}
                                className={`p-2 border-r-2 flex flex-col gap-1.5 transition-all hover:brightness-110 cursor-pointer ${themeStyles.divider} ${
                                  idx === 7 ? 'border-l-4' : ''
                                } ${isToday ? 'ring-2 ring-inset ring-orange-400' : ''}`}
                              >
                                {cellEvents.map(ev => (
                                  <div
                                    key={ev.id}
                                    draggable
                                    onDragStart={() => setDraggedEv(ev)}
                                    onClick={(e) => openEditEventModal(e, ev)}
                                    style={st.cardStyle}
                                    className="rounded-xl p-2 shadow-md flex flex-col justify-between cursor-grab active:cursor-grabbing border border-black/15"
                                  >
                                    <div className="font-extrabold text-xs sm:text-sm leading-snug break-words">{ev.title}</div>
                                    <div className="flex items-center justify-between gap-1 mt-1 flex-wrap">
                                      <span className="text-[11px] opacity-90 font-bold">{ev.time}</span>
                                      {ev.notifyTime && ev.notifyTime !== 'none' && (
                                        <span className="px-1.5 py-0.5 rounded bg-black/25 text-[9px] font-extrabold">
                                          🔔 {ev.notifyTime}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ANSICHT 2: 4-WOCHEN-ÜBERSICHT */}
            {activeSection === 'kalender' && currentView === '4w' && (() => {
              const startMonday = getMonday(currentBaseDate);
              return (
                <div className="p-5 space-y-6">
                  {[0, 1, 2, 3].map(w => {
                    const weekStart = addDays(startMonday, w * 7);
                    const weekEnd = addDays(weekStart, 6);
                    const kw = getISOWeek(weekStart);
                    return (
                      <div key={w} className={`rounded-3xl border-2 shadow-md overflow-hidden ${themeStyles.card}`}>
                        <div className={`px-5 py-2.5 flex items-center justify-between ${themeStyles.banner}`}>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-0.5 rounded-lg bg-indigo-500 text-xs font-black">KW {kw}</span>
                            <span className="font-extrabold text-sm sm:text-base">
                              {weekStart.getDate()}. {MONTHS_NAMES[weekStart.getMonth()]} – {weekEnd.getDate()}. {MONTHS_NAMES[weekEnd.getMonth()]} {weekEnd.getFullYear()}
                            </span>
                          </div>
                          <span className="text-xs font-bold opacity-75">Woche {w + 1} von 4</span>
                        </div>

                        <div className={`grid border-b-2 ${themeStyles.divider}`} style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))' }}>
                          <div className={`p-2.5 text-xs font-extrabold uppercase flex items-center justify-center border-r-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                            Person
                          </div>
                          {Array.from({ length: 7 }, (_, d) => {
                            const dayObj = addDays(weekStart, d);
                            const dateStr = formatDateStr(dayObj);
                            const isToday = dateStr === todayStr;
                            const hol = getBWHolidayName(dateStr);
                            const vac = getBWVacationName(dateStr);
                            return (
                              <div key={d} className={`px-3 py-2 border-r-2 flex items-center justify-between ${themeStyles.divider}`}>
                                <span className={`text-xs font-extrabold truncate ${isToday ? 'bg-orange-500 text-white px-2 py-0.5 rounded-full' : ''}`}>
                                  {WEEKDAYS_SHORT[dayObj.getDay()]}, {dayObj.getDate()}. {hol ? '🎌' : vac ? '🏖️' : ''}
                                </span>
                                <button onClick={() => openNewEventModal(dateStr, 'hans')} className="opacity-60 hover:opacity-100 font-bold text-sm cursor-pointer">+</button>
                              </div>
                            );
                          })}
                        </div>

                        <div className={`divide-y ${themeStyles.divider}`}>
                          {visibleMembers.map(member => {
                            const st = getMemberStyles(member);
                            return (
                              <div key={member.id} className="grid items-stretch" style={{ gridTemplateColumns: '165px repeat(7, minmax(0, 1fr))' }}>
                                <div style={st.headerStyle} className={`px-3 py-2 border-r-2 flex items-center gap-2 ${themeStyles.divider}`}>
                                  {renderAvatar(member, 'w-7 h-7', 'text-xs')}
                                  <span className="text-xs font-bold truncate">{member.name.split(' ')[0]}</span>
                                </div>
                                {Array.from({ length: 7 }, (_, d) => {
                                  const dayObj = addDays(weekStart, d);
                                  const dateStr = formatDateStr(dayObj);
                                  const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;
                                  const cellEvents = events.filter(e => e.date === dateStr && e.member === member.id);
                                  return (
                                    <div
                                      key={d}
                                      onClick={() => openNewEventModal(dateStr, member.id)}
                                      style={st.cellStyle(isWeekend)}
                                      className={`min-h-[54px] p-1.5 border-r-2 flex flex-col gap-1 cursor-pointer ${themeStyles.divider}`}
                                    >
                                      {cellEvents.map(ev => (
                                        <div
                                          key={ev.id}
                                          onClick={(e) => openEditEventModal(e, ev)}
                                          style={st.cardStyle}
                                          className="px-2 py-1 rounded text-xs font-bold truncate"
                                        >
                                          {ev.title}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ANSICHT 3: JAHRESWAND (BW) */}
            {activeSection === 'kalender' && currentView === 'year' && (() => {
              const year = currentBaseDate.getFullYear();
              return (
                <div className="p-3 w-full h-full flex flex-col gap-2 overflow-hidden">
                  <div className={`px-4 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shrink-0 ${themeStyles.card}`}>
                    <span className="font-extrabold text-xs uppercase tracking-wider">📅 Jahreswand {year} (Baden-Württemberg)</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">🎌 Gesetzlicher Feiertag BW</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">🏖️ Schulferien BW</span>
                      <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">🟠 Heute</span>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-sm overflow-hidden flex-1 grid grid-cols-12 divide-x min-h-0 ${themeStyles.card} ${themeStyles.divider}`}>
                    {Array.from({ length: 12 }, (_, month) => (
                      <div key={month} className="flex flex-col min-w-0 overflow-hidden h-full">
                        <div className={`font-extrabold text-[11px] uppercase py-1.5 px-1 text-center shrink-0 truncate ${themeStyles.banner}`}>
                          {MONTHS_NAMES[month]}
                        </div>
                        <div className={`divide-y flex-1 flex flex-col min-h-0 ${themeStyles.divider}`}>
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const testDate = new Date(year, month, day);
                            if (testDate.getMonth() !== month) {
                              return <div key={day} className="flex-1 min-h-[14px] bg-black/20" />;
                            }
                            const dateStr = formatDateStr(testDate);
                            const dow = testDate.getDay();
                            const isWeekend = dow === 0 || dow === 6;
                            const isToday = dateStr === todayStr;
                            const hol = getBWHolidayName(dateStr);
                            const vac = getBWVacationName(dateStr);
                            const dayEvents = events.filter(e => e.date === dateStr);
                            const firstEv = dayEvents[0];
                            const firstMem = firstEv ? members.find(m => m.id === firstEv.member) || members[0] : null;

                            return (
                              <div
                                key={day}
                                onClick={() => setYearDayModal({ open: true, dateStr, newTitle: '', newTime: 'Ganztägig', newMember: 'all' })}
                                className={`flex-1 min-h-[14px] px-1 flex items-center gap-1 text-[10px] cursor-pointer hover:bg-indigo-500/20 overflow-hidden ${
                                  hol ? 'bg-rose-500/25 font-bold' : vac ? 'bg-emerald-500/20' : isWeekend ? 'bg-black/15' : ''
                                } ${isToday ? 'ring-2 ring-inset ring-orange-500' : ''}`}
                              >
                                <span className="w-3.5 font-extrabold text-[9px] shrink-0">{String(day).padStart(2, '0')}</span>
                                <span className="w-3.5 text-[8px] opacity-60 uppercase shrink-0">{WEEKDAYS_SHORT[dow]}</span>
                                <div className="flex-1 flex items-center gap-0.5 min-w-0 overflow-hidden">
                                  {firstEv && firstMem ? (
                                    <span style={getMemberStyles(firstMem).badgeStyle} className="px-1 rounded text-[8px] font-bold truncate flex-1">
                                      {firstEv.title}
                                    </span>
                                  ) : hol ? (
                                    <span className="text-[8px] font-extrabold text-rose-300 truncate flex-1">🎌 {hol}</span>
                                  ) : vac ? (
                                    <span className="text-[8px] font-bold text-emerald-300 truncate flex-1">🏖️ {vac.replace(' BW', '')}</span>
                                  ) : null}
                                  {dayEvents.length > 1 && (
                                    <span className="px-1 rounded bg-indigo-600 text-white text-[8px] font-extrabold shrink-0">
                                      +{dayEvents.length - 1}
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
              );
            })()}

            {/* ANSICHT 4: SCHULE */}
            {activeSection === 'schule' && (() => {
              const childMember = members.find(m => m.id === activeSchoolChild) || members[3];
              const sched = schoolData[activeSchoolChild];
              const schoolDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

              return (
                <div className="p-6 flex flex-col gap-6">
                  <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                    <div className="flex items-center gap-4">
                      {renderAvatar(childMember, 'w-14 h-14', 'text-2xl')}
                      <div>
                        <h2 className="text-2xl font-extrabold">Stundenplan & Schul-Änderungen ({childMember.name})</h2>
                        <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Tippe auf eine Stunde zum Ändern.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => setActiveSchoolChild('dean')}
                        className={`px-6 py-3 rounded-2xl font-extrabold text-sm cursor-pointer ${activeSchoolChild === 'dean' ? 'bg-indigo-600 text-white shadow-md' : themeStyles.subtle}`}
                      >
                        👦 Dean
                      </button>
                      <button
                        onClick={() => setActiveSchoolChild('valentina')}
                        className={`px-6 py-3 rounded-2xl font-extrabold text-sm cursor-pointer ${activeSchoolChild === 'valentina' ? 'bg-indigo-600 text-white shadow-md' : themeStyles.subtle}`}
                      >
                        👧 Valentina
                      </button>
                      <button
                        onClick={() => {
                          setSchoolData(prev => ({
                            ...prev,
                            [activeSchoolChild]: {
                              ...prev[activeSchoolChild],
                              periods: [...prev[activeSchoolChild].periods, `${prev[activeSchoolChild].periods.length + 1}. Std (Nachmittag)`]
                            }
                          }));
                        }}
                        className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm cursor-pointer"
                      >
                        + Weitere Schulstunde
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-3xl border-2 shadow-sm overflow-x-auto ${themeStyles.card} ${themeStyles.divider}`}>
                    <table className="w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className={`text-sm uppercase font-extrabold tracking-wider ${themeStyles.banner}`}>
                          <th className="p-4 text-left w-52 border-r border-slate-700">Stunde / Zeit</th>
                          {schoolDays.map(d => <th key={d} className="p-4 text-left border-r border-slate-700">{d}</th>)}
                        </tr>
                      </thead>
                      <tbody className={`divide-y-2 ${themeStyles.divider}`}>
                        {sched.periods.map((periodLabel, pIdx) => (
                          <tr key={pIdx}>
                            <td className={`p-3.5 border-r-2 font-bold text-sm ${themeStyles.subtle} ${themeStyles.divider}`}>
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={periodLabel}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSchoolData(prev => {
                                      const nextP = [...prev[activeSchoolChild].periods];
                                      nextP[pIdx] = val;
                                      return { ...prev, [activeSchoolChild]: { ...prev[activeSchoolChild], periods: nextP } };
                                    });
                                  }}
                                  className="w-full bg-transparent font-extrabold focus:outline-none"
                                />
                                {sched.periods.length > 1 && (
                                  <button
                                    onClick={() => {
                                      setSchoolData(prev => ({
                                        ...prev,
                                        [activeSchoolChild]: {
                                          ...prev[activeSchoolChild],
                                          periods: prev[activeSchoolChild].periods.filter((_, i) => i !== pIdx)
                                        }
                                      }));
                                    }}
                                    className="opacity-50 hover:opacity-100 hover:text-rose-400 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </td>
                            {schoolDays.map((_, dIdx) => {
                              const key = `${dIdx}-${pIdx}`;
                              const slot = sched.slots[key] || { subject: '', room: '', status: 'normal' };
                              const childSt = getMemberStyles(childMember);

                              return (
                                <td
                                  key={dIdx}
                                  onClick={() => setSchoolModal({ open: true, dayIdx: dIdx, periodIdx: pIdx, subject: slot.subject || '', room: slot.room || '', status: slot.status || 'normal' })}
                                  className={`p-2 border-r-2 align-top cursor-pointer hover:bg-indigo-500/10 ${themeStyles.divider}`}
                                >
                                  {slot.subject ? (
                                    <div
                                      style={slot.status === 'normal' ? childSt.cardStyle : undefined}
                                      className={`p-3.5 rounded-2xl border min-h-[82px] flex flex-col justify-between shadow-sm ${
                                        slot.status === 'change'
                                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400'
                                          : slot.status === 'exam'
                                          ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-2 ring-purple-400'
                                          : slot.status === 'cancel'
                                          ? 'bg-rose-500/25 border-rose-400 text-rose-200 line-through opacity-80'
                                          : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="font-extrabold text-sm sm:text-base">{slot.subject}</span>
                                        {slot.status === 'change' && <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">ÄNDERUNG</span>}
                                        {slot.status === 'exam' && <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black">ARBEIT/TEST</span>}
                                        {slot.status === 'cancel' && <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">ENTFALL</span>}
                                      </div>
                                      {slot.room && <div className="text-xs font-semibold opacity-90 mt-1">{slot.room}</div>}
                                    </div>
                                  ) : (
                                    <div className={`min-h-[82px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold opacity-40 ${themeStyles.divider}`}>
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

                  {/* AKTUELLE SCHUL-ÄNDERUNGEN & HAUSAUFGABEN */}
                  <div className={`rounded-3xl border p-6 shadow-sm space-y-4 ${themeStyles.card}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="font-extrabold text-lg sm:text-xl">📌 Aktuelle Schul-Änderungen & Hausaufgaben ({childMember.name})</h3>
                      <div className="flex gap-2.5 w-full md:w-auto">
                        <input
                          type="text"
                          value={newSchoolNote}
                          onChange={(e) => setNewSchoolNote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSchoolNote.trim()) {
                              setSchoolData(prev => ({
                                ...prev,
                                [activeSchoolChild]: {
                                  ...prev[activeSchoolChild],
                                  announcements: [newSchoolNote.trim(), ...prev[activeSchoolChild].announcements]
                                }
                              }));
                              setNewSchoolNote('');
                            }
                          }}
                          placeholder="z.B. Freitag 5. Stunde fällt aus..."
                          className={`flex-1 md:w-96 px-4 py-3 rounded-xl border text-sm font-semibold ${themeStyles.subtle}`}
                        />
                        <button
                          onClick={() => {
                            if (!newSchoolNote.trim()) return;
                            setSchoolData(prev => ({
                              ...prev,
                              [activeSchoolChild]: {
                                ...prev[activeSchoolChild],
                                announcements: [newSchoolNote.trim(), ...prev[activeSchoolChild].announcements]
                              }
                            }));
                            setNewSchoolNote('');
                          }}
                          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
                        >
                          + Eintragen
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {(sched.announcements || []).map((info, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 text-sm font-bold">
                          <span>🔔 {info}</span>
                          <button
                            onClick={() => {
                              setSchoolData(prev => ({
                                ...prev,
                                [activeSchoolChild]: {
                                  ...prev[activeSchoolChild],
                                  announcements: prev[activeSchoolChild].announcements.filter((_, i) => i !== idx)
                                }
                              }));
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-rose-500/20 text-amber-300 hover:text-rose-300 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ANSICHT 5: AUFGABEN (MIT AUTOMATISCHEM GOOGLE TASKS SYNC) */}
            {activeSection === 'aufgaben' && (
              <div className="p-6 flex flex-col gap-6">
                <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                  <div>
                    <h2 className="text-2xl font-extrabold">✅ Familien-Aufgaben & Ämtli</h2>
                    <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Direkt antippen zum Abhaken – wird automatisch mit Google Tasks synchronisiert.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskTitle.trim()) {
                          setFamilyTasks(prev => [{ id: Date.now(), member: newTaskMember, title: newTaskTitle.trim(), due: 'Heute', done: false }, ...prev]);
                          setNewTaskTitle('');
                        }
                      }}
                      placeholder="Neue Aufgabe eintragen..."
                      className={`px-4 py-3 rounded-xl border text-sm font-bold w-72 ${themeStyles.subtle}`}
                    />
                    <select
                      value={newTaskMember}
                      onChange={(e) => setNewTaskMember(e.target.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold ${themeStyles.subtle}`}
                    >
                      {members.filter(m => m.id !== 'all').map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-800 text-white">{m.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!newTaskTitle.trim()) return;
                        setFamilyTasks(prev => [{ id: Date.now(), member: newTaskMember, title: newTaskTitle.trim(), due: 'Heute', done: false }, ...prev]);
                        setNewTaskTitle('');
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-extrabold text-sm cursor-pointer"
                    >
                      + Hinzufügen
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {members.filter(m => m.id !== 'all').map(member => {
                    const mTasks = familyTasks.filter(t => t.member === member.id);
                    const openCount = mTasks.filter(t => !t.done).length;
                    const st = getMemberStyles(member);

                    return (
                      <div key={member.id} className={`rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col justify-between min-h-[430px] ${themeStyles.card}`}>
                        <div className="flex-1 flex flex-col">
                          <div style={st.headerStyle} className={`p-5 border-b flex items-center justify-between ${themeStyles.divider}`}>
                            <div className="flex items-center gap-3">
                              {renderAvatar(member, 'w-11 h-11', 'text-lg')}
                              <div>
                                <div className="font-extrabold text-lg">{member.name}</div>
                                <div className={`text-xs font-semibold ${themeStyles.textMuted}`}>{member.role}</div>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-black/25 text-xs font-extrabold">{openCount} offen</span>
                          </div>

                          <div className="p-4 space-y-2.5 flex-1">
                            {mTasks.map(task => (
                              <div
                                key={task.id}
                                onClick={() => setFamilyTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ${themeStyles.subtle} ${task.done ? 'opacity-55' : ''}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input type="checkbox" checked={task.done} readOnly className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                  <span className={`text-sm font-bold break-words ${task.done ? 'line-through opacity-60' : ''}`}>{task.title}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFamilyTasks(prev => prev.filter(t => t.id !== task.id));
                                  }}
                                  className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-4 border-t flex gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                          <input
                            type="text"
                            value={colTaskInputs[member.id] || ''}
                            onChange={(e) => setColTaskInputs({ ...colTaskInputs, [member.id]: e.target.value })}
                            onKeyDown={(e) => {
                              const val = (colTaskInputs[member.id] || '').trim();
                              if (e.key === 'Enter' && val) {
                                setFamilyTasks(prev => [...prev, { id: Date.now(), member: member.id, title: val, due: 'Heute', done: false }]);
                                setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
                              }
                            }}
                            placeholder={`Aufgabe für ${member.name}...`}
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm font-semibold ${themeStyles.card}`}
                          />
                          <button
                            onClick={() => {
                              const val = (colTaskInputs[member.id] || '').trim();
                              if (!val) return;
                              setFamilyTasks(prev => [...prev, { id: Date.now(), member: member.id, title: val, due: 'Heute', done: false }]);
                              setColTaskInputs({ ...colTaskInputs, [member.id]: '' });
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
            )}

            {/* ANSICHT 6: ESSENSPLAN */}
            {activeSection === 'essen' && (
              <div className="p-6 flex flex-col gap-6">
                <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                  <div>
                    <h2 className="text-2xl font-extrabold">🍲 Familien-Essensplan & Zutaten-Listen</h2>
                    <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Fehlende Zutaten mit 1 Klick auf die Einkaufsliste setzen.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      value={newMealDay}
                      onChange={(e) => setNewMealDay(e.target.value)}
                      placeholder="Tag / Name"
                      className={`px-4 py-3 rounded-xl border text-sm font-bold w-48 ${themeStyles.subtle}`}
                    />
                    <input
                      type="text"
                      value={newMealDish}
                      onChange={(e) => setNewMealDish(e.target.value)}
                      placeholder="Gericht / Rezept..."
                      className={`px-4 py-3 rounded-xl border text-sm font-bold w-56 ${themeStyles.subtle}`}
                    />
                    <button
                      onClick={() => {
                        setMealPlan(prev => [...prev, { id: Date.now(), dayLabel: newMealDay.trim() || 'Zusatz-Tag', dish: newMealDish.trim() || '🍲 Wunschgericht', ingredients: [] }]);
                        setNewMealDay('');
                        setNewMealDish('');
                      }}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
                    >
                      + Essens-Block
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mealPlan.map(meal => {
                    const missing = meal.ingredients.filter(i => !i.done);
                    return (
                      <div key={meal.id} className={`rounded-3xl border-2 shadow-sm flex flex-col justify-between overflow-hidden min-h-[420px] ${themeStyles.card}`}>
                        <div className="flex-1 flex flex-col">
                          <div className={`px-5 py-4 border-b flex items-center justify-between gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                            <input
                              type="text"
                              value={meal.dayLabel}
                              onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dayLabel: e.target.value } : m))}
                              className="bg-transparent font-extrabold text-base uppercase tracking-wider flex-1 min-w-0 focus:outline-none"
                            />
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${missing.length === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {missing.length === 0 ? 'Alle da ✓' : `${missing.length} fehlt`}
                            </span>
                          </div>

                          <div className={`p-5 border-b ${themeStyles.divider}`}>
                            <input
                              type="text"
                              value={meal.dish}
                              onChange={(e) => setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, dish: e.target.value } : m))}
                              className={`w-full px-4 py-3 rounded-2xl border font-extrabold text-base ${themeStyles.subtle}`}
                            />
                          </div>

                          <div className="p-5 flex-1 flex flex-col space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-extrabold uppercase ${themeStyles.textMuted}`}>Zutaten ({meal.ingredients.length})</span>
                              <button
                                onClick={() => {
                                  if (missing.length === 0) {
                                    showToast('Alles da', 'Alle Zutaten sind bereits vorhanden!', '✅');
                                    return;
                                  }
                                  setFamilyNotes(prev => prev.map((n, idx) => idx === 0 ? {
                                    ...n,
                                    items: [...n.items, ...missing.map(i => ({ text: `${i.name} (${meal.dayLabel})`, done: false }))]
                                  } : n));
                                  showToast('Einkaufsliste ergänzt', `${missing.length} Zutaten übertragen.`, '🛒');
                                }}
                                className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-extrabold border border-indigo-400/30 cursor-pointer"
                              >
                                🛒 In Einkaufsliste
                              </button>
                            </div>

                            <div className="space-y-2 flex-1">
                              {meal.ingredients.map((ing, iIdx) => (
                                <div key={iIdx} className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl border text-sm ${themeStyles.subtle}`}>
                                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={ing.done}
                                      onChange={() => {
                                        setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                                          ...m,
                                          ingredients: m.ingredients.map((item, idx) => idx === iIdx ? { ...item, done: !item.done } : item)
                                        } : m));
                                      }}
                                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                                    />
                                    <span className={`font-bold break-words ${ing.done ? 'line-through opacity-50' : ''}`}>{ing.name}</span>
                                  </label>
                                  <button
                                    onClick={() => {
                                      setMealPlan(prev => prev.map(m => m.id === meal.id ? {
                                        ...m,
                                        ingredients: m.ingredients.filter((_, idx) => idx !== iIdx)
                                      } : m));
                                    }}
                                    className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 border-t flex gap-2 ${themeStyles.subtle} ${themeStyles.divider}`}>
                          <input
                            type="text"
                            value={ingInputs[meal.id] || ''}
                            onChange={(e) => setIngInputs({ ...ingInputs, [meal.id]: e.target.value })}
                            onKeyDown={(e) => {
                              const val = (ingInputs[meal.id] || '').trim();
                              if (e.key === 'Enter' && val) {
                                setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
                                setIngInputs({ ...ingInputs, [meal.id]: '' });
                              }
                            }}
                            placeholder="Zutat hinzufügen..."
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm font-semibold ${themeStyles.card}`}
                          />
                          <button
                            onClick={() => {
                              const val = (ingInputs[meal.id] || '').trim();
                              if (!val) return;
                              setMealPlan(prev => prev.map(m => m.id === meal.id ? { ...m, ingredients: [...m.ingredients, { name: val, done: false }] } : m));
                              setIngInputs({ ...ingInputs, [meal.id]: '' });
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
            )}

            {/* ANSICHT 7: NOTIZEN */}
            {activeSection === 'listen' && (
              <div className="p-6 flex flex-col gap-6">
                <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-extrabold">📝 Familien-Notizen & Smartphone-Listen</h2>
                      <button
                        onClick={() => setQrModalOpen(true)}
                        className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" /> Handy-App & QR-Code
                      </button>
                    </div>
                    <p className={`text-sm font-semibold mt-1 ${themeStyles.textMuted}`}>Direkt-Übernahme in Google Notizen (Keep) & Smartphone-Sync.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Titel (z.B. Baumarkt)"
                      className={`px-4 py-3 rounded-xl border text-sm font-bold w-56 ${themeStyles.subtle}`}
                    />
                    <select
                      value={newNoteAuthor}
                      onChange={(e) => setNewNoteAuthor(e.target.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold ${themeStyles.subtle}`}
                    >
                      {['Familie', 'Hans', 'Sarah', 'Sarah & Hans', 'Dean', 'Valentina'].map(a => (
                        <option key={a} value={a} className="bg-slate-800 text-white">👤 {a}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setFamilyNotes(prev => [...prev, { id: Date.now(), title: newNoteTitle.trim() || '📌 Neue Liste', author: newNoteAuthor, color: newNoteColor, items: [] }]);
                        setNewNoteTitle('');
                      }}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold cursor-pointer"
                    >
                      + Neuer Notizblock
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {familyNotes.map(note => (
                    <div key={note.id} className={`rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between min-h-[450px] ${themeStyles.card}`}>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <input
                            type="text"
                            value={note.title}
                            onChange={(e) => setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                            className="font-extrabold text-xl bg-transparent focus:outline-none flex-1 min-w-0"
                          />
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${themeStyles.subtle}`}>{note.author}</span>
                          <button
                            onClick={() => setFamilyNotes(prev => prev.filter(n => n.id !== note.id))}
                            className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        <div className={`flex flex-wrap items-center gap-2 mb-3 pb-2.5 border-b ${themeStyles.divider}`}>
                          <button
                            onClick={() => {
                              const lines = note.items.map(i => `${i.done ? '☑' : '☐'} ${i.text}`).join('\n');
                              const text = `${note.title} (${note.author})\n\n${lines}`;
                              navigator.clipboard?.writeText(text);
                              window.open('https://keep.google.com/', '_blank');
                              showToast('Für Google Keep kopiert', 'In Google Notizen einfach Strg+V drücken!', '💡');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                          >
                            💡 In Google Notizen (Keep)
                          </button>
                        </div>

                        <ul className="space-y-2 my-1 flex-1">
                          {note.items.map((item, idx) => (
                            <li key={idx} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-bold ${themeStyles.subtle}`}>
                              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={() => {
                                    setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                                      ...n,
                                      items: n.items.map((it, i) => i === idx ? { ...it, done: !it.done } : it)
                                    } : n));
                                  }}
                                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                />
                                <span className={`break-words ${item.done ? 'line-through opacity-50' : ''}`}>{item.text}</span>
                              </label>
                              <button
                                onClick={() => {
                                  setFamilyNotes(prev => prev.map(n => n.id === note.id ? {
                                    ...n,
                                    items: n.items.filter((_, i) => i !== idx)
                                  } : n));
                                }}
                                className="opacity-50 hover:opacity-100 hover:text-rose-400 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`mt-4 pt-4 border-t flex gap-2 ${themeStyles.divider}`}>
                        <input
                          type="text"
                          value={noteInputs[note.id] || ''}
                          onChange={(e) => setNoteInputs({ ...noteInputs, [note.id]: e.target.value })}
                          onKeyDown={(e) => {
                            const val = (noteInputs[note.id] || '').trim();
                            if (e.key === 'Enter' && val) {
                              setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
                              setNoteInputs({ ...noteInputs, [note.id]: '' });
                            }
                          }}
                          placeholder="Neuen Punkt eintragen..."
                          className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-semibold ${themeStyles.subtle}`}
                        />
                        <button
                          onClick={() => {
                            const val = (noteInputs[note.id] || '').trim();
                            if (!val) return;
                            setFamilyNotes(prev => prev.map(n => n.id === note.id ? { ...n, items: [...n.items, { text: val, done: false }] } : n));
                            setNoteInputs({ ...noteInputs, [note.id]: '' });
                          }}
                          className="w-12 h-12 rounded-2xl bg-indigo-600 text-white text-xl font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANSICHT 8: DESIGN */}
            {activeSection === 'design' && (() => {
              const boldKeys = Object.keys(COLOR_PALETTES).filter(k => COLOR_PALETTES[k].bold);
              const softKeys = Object.keys(COLOR_PALETTES).filter(k => !COLOR_PALETTES[k].bold);

              return (
                <div className="p-6 flex flex-col gap-6">
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${themeStyles.card}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-extrabold">1. Seiten-Theme & Eigenes Touchwall-Logo</h2>
                        <p className={`text-sm font-semibold ${themeStyles.textMuted}`}>Wähle dein Seiten-Design (inkl. abgedunkeltem Metal Silver) und dein eigenes Logo für oben links.</p>
                      </div>

                      <div className={`flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border ${themeStyles.subtle}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                          {customLogoUrl ? <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-xs">FR</span>}
                        </div>
                        <input
                          type="url"
                          value={customLogoUrl}
                          onChange={(e) => setCustomLogoUrl(e.target.value)}
                          placeholder="Logo Bild-URL..."
                          className={`w-40 px-3 py-1.5 rounded-xl border text-xs font-semibold ${themeStyles.card}`}
                        />
                        <label className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-500">
                          📁 Logo hochladen
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {customLogoUrl && (
                          <button onClick={() => setCustomLogoUrl('')} className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold cursor-pointer">
                            ✕
                          </button>
                        )}
                        <button
                          onClick={restoreScreenshotDefaults}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold cursor-pointer"
                        >
                          🔄 Standard-Profil wiederherstellen
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
                      {PAGE_THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setCurrentTheme(t.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            currentTheme === t.id
                              ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-400'
                              : `${themeStyles.subtle} hover:border-indigo-400/50`
                          }`}
                        >
                          <div className="font-extrabold text-sm">{t.name}</div>
                          <div className={`text-xs mt-1.5 leading-snug ${themeStyles.textMuted}`}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${themeStyles.card}`}>
                    <h2 className="text-2xl font-extrabold">2. Persönliche Farbe (Kräftig & Sanft) & Avatar pro Benutzer</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {members.map(m => {
                        const st = getMemberStyles(m);
                        return (
                          <div key={m.id} style={st.headerStyle} className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 ${themeStyles.divider}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                {renderAvatar(m, 'w-14 h-14', 'text-2xl')}
                                <div>
                                  <div className="font-extrabold text-lg">{m.name}</div>
                                  <div className={`text-xs font-semibold ${themeStyles.textMuted}`}>{m.role}</div>
                                </div>
                              </div>

                              <div className={`flex p-1 rounded-xl border text-xs font-bold ${themeStyles.card}`}>
                                {['emoji', 'photo', 'badge'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, avatarType: type } : item))}
                                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${m.avatarType === type ? 'bg-indigo-600 text-white' : ''}`}
                                  >
                                    {type === 'emoji' ? 'Emoji' : type === 'photo' ? 'Foto' : `Kürzel (${m.badge})`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-[11px] font-extrabold uppercase opacity-75">🔥 Kräftige Vollton-Farben:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {boldKeys.map(cKey => {
                                  const pal = COLOR_PALETTES[cKey];
                                  return (
                                    <button
                                      key={cKey}
                                      onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                                      style={{ backgroundColor: pal.hex, color: '#fff' }}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer ${m.color === cKey ? 'ring-2 ring-white scale-105' : 'opacity-85 hover:opacity-100'}`}
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
                                      onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, color: cKey } : item))}
                                      style={{ backgroundColor: pal.light, color: pal.text, border: `2px solid ${pal.hex}` }}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold cursor-pointer ${m.color === cKey ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-85 hover:opacity-100'}`}
                                    >
                                      {pal.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={`pt-3 border-t ${themeStyles.divider}`}>
                              {m.avatarType === 'emoji' && (
                                <div className="flex flex-wrap gap-1.5">
                                  {AVATAR_EMOJIS.map(em => (
                                    <button
                                      key={em}
                                      onClick={() => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, emoji: em, avatarType: 'emoji' } : item))}
                                      className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer ${themeStyles.card} ${m.emoji === em ? 'ring-2 ring-indigo-400' : ''}`}
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
                                    onChange={(e) => setMembers(prev => prev.map(item => item.id === m.id ? { ...item, photoUrl: e.target.value } : item))}
                                    placeholder="https://... (Bild-URL)"
                                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold ${themeStyles.card}`}
                                  />
                                  <label className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">
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
            })()}

            {/* ANSICHT 9: GOOGLE KONTEN & DRIVE SYNC */}
            {activeSection === 'google' && (
              <div className="p-6 flex flex-col gap-6">
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold">
                        ☁️ Vercel Cloud + Google Kalender / Tasks / Drive API-Brücke
                      </span>
                      <h2 className="text-2xl font-extrabold mt-2">Google Synchronisation & Kalender-Konten</h2>
                      <p className="text-sm text-slate-300 mt-1">
                        Verbinde hier deine bestehende Google Apps Script URL. Alle Termine, Aufgaben und Kalender-IDs synchronisieren in beide Richtungen.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => pullFromCloud(undefined, true)}
                        className="px-5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" /> Live aus Google laden
                      </button>
                      <button
                        onClick={() => pushToCloudAndDrive(members, true)}
                        className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Cloud className="w-4 h-4" /> Auf Google & Drive sichern
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-extrabold uppercase text-amber-400 shrink-0">🔗 Deine Apps-Script Web-App URL:</span>
                    <input
                      type="url"
                      value={appsScriptUrl}
                      onChange={(e) => {
                        setAppsScriptUrl(e.target.value);
                        try { localStorage.setItem('richter_tw_gas_url', e.target.value); } catch (err) {}
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 min-w-[260px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-300"
                    />
                  </div>
                </div>

                {/* KALENDER-KONTEN PRO PERSON + ZUSATZKALENDER */}
                <div className={`rounded-3xl border overflow-hidden divide-y ${themeStyles.card} ${themeStyles.divider}`}>
                  {members.map(m => {
                    const isCustom = !['all', 'hans', 'sarah', 'dean', 'valentina'].includes(m.id);
                    const st = getMemberStyles(m);
                    return (
                      <div key={m.id} style={st.headerStyle} className="p-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-[210px]">
                          {renderAvatar(m, 'w-12 h-12', 'text-xl')}
                          <div>
                            <div className="font-extrabold text-base">{m.name}</div>
                            <div className={`text-xs font-semibold ${themeStyles.textMuted}`}>{m.role}</div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-[260px]">
                          <input
                            type="text"
                            value={m.calendarId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers(prev => prev.map(item => item.id === m.id ? { ...item, calendarId: val, ok: Boolean(val.trim()), statusMsg: val.trim() ? 'Bereit zum Speichern' : 'Leer' } : item));
                            }}
                            placeholder={m.id === 'all' ? 'primary' : 'name@gmail.com oder ...@group.calendar.google.com'}
                            className={`w-full px-4 py-3 rounded-xl border text-sm font-bold ${themeStyles.card}`}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {isCustom && (
                            <button
                              onClick={() => {
                                const filtered = members.filter(item => item.id !== m.id);
                                setMembers(filtered);
                                pushToCloudAndDrive(filtered, true);
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-extrabold cursor-pointer"
                            >
                              🗑️ Löschen
                            </button>
                          )}
                          <span className={`px-4 py-2 rounded-xl text-xs font-extrabold ${m.calendarId ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {m.statusMsg || (m.calendarId ? 'Verbunden ✓' : 'Bereit')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* + WEITEREN KALENDER HINZUFÜGEN */}
                <div className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                  <div>
                    <div className="font-extrabold text-lg">➕ Weiteren Google-Kalender hinzufügen</div>
                    <p className={`text-sm ${themeStyles.textMuted}`}>Fügt eine zusätzliche Zeile für Arbeitskalender, Ferienkalender oder Vereine hinzu.</p>
                  </div>
                  <button
                    onClick={addExtraCalendarAccount}
                    className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm cursor-pointer shadow-md"
                  >
                    + Weiteren Kalender hinzufügen
                  </button>
                </div>

                {/* BACKUP EXPORT & IMPORT */}
                <div className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${themeStyles.card}`}>
                  <div>
                    <div className="font-extrabold text-lg">📦 1:1 Daten-Übernahme (JSON-Export & Import)</div>
                    <p className={`text-sm ${themeStyles.textMuted}`}>
                      Lade dein Backup aus der bisherigen Touchwall hier hoch oder sichere deinen aktuellen Stand als Datei.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-md">
                      <Upload className="w-4 h-4" /> Altes Backup (JSON) importieren
                      <input type="file" accept=".json,application/json" className="hidden" onChange={importBackupJson} />
                    </label>
                    <button
                      onClick={exportBackupJson}
                      className={`px-5 py-3 rounded-2xl border font-extrabold text-sm flex items-center gap-2 cursor-pointer ${themeStyles.subtle}`}
                    >
                      <Download className="w-4 h-4" /> Backup herunterladen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL 1: TERMIN ERSTELLEN / BEARBEITEN */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={saveEventModal} className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4 ${themeStyles.card}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">{eventModal.id ? 'Termin bearbeiten' : 'Neuer Familientermin'}</h3>
              <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase opacity-75 mb-1">Titel & Schnell-Emojis</label>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {['🎂', '⚽', '🐴', '🩺', '🛒', '🎉', '🏖️', '🏫'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEventModal({ ...eventModal, title: em + ' ' + eventModal.title })}
                      className={`w-9 h-9 rounded-xl border text-base cursor-pointer ${themeStyles.subtle}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={eventModal.title}
                  onChange={(e) => setEventModal({ ...eventModal, title: e.target.value })}
                  placeholder="z.B. Kinderarzt, Ponyhof, Fußball..."
                  className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm ${themeStyles.subtle}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase opacity-75 mb-1">Datum</label>
                  <input
                    type="date"
                    value={eventModal.date}
                    onChange={(e) => setEventModal({ ...eventModal, date: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm ${themeStyles.subtle}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase opacity-75 mb-1">Uhrzeit</label>
                  <input
                    type="text"
                    value={eventModal.time}
                    onChange={(e) => setEventModal({ ...eventModal, time: e.target.value })}
                    placeholder="15:00 - 16:00 oder Ganztägig"
                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm ${themeStyles.subtle}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase opacity-75 mb-1.5">Person / Kalender-Zeile</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {members.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEventModal({ ...eventModal, member: m.id })}
                      className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer ${
                        eventModal.member === m.id ? 'border-indigo-500 bg-indigo-500/20' : themeStyles.subtle
                      }`}
                    >
                      {renderAvatar(m, 'w-7 h-7', 'text-xs')}
                      <span className="text-xs font-bold truncate max-w-full">{m.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              {eventModal.id ? (
                <button
                  type="button"
                  onClick={() => deleteEventById(eventModal.id)}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  🗑️ Löschen
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEventModal({ ...eventModal, open: false })} className={`px-5 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer ${themeStyles.subtle}`}>
                  Abbrechen
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer">
                  💾 Speichern
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: JAHRESWAND TAGES-DETAILS */}
      {yearDayModal.open && (() => {
        const dayEvents = events.filter(e => e.date === yearDayModal.dateStr);
        const hol = getBWHolidayName(yearDayModal.dateStr);
        const vac = getBWVacationName(yearDayModal.dateStr);

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl space-y-4 ${themeStyles.card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold">📅 Tagesübersicht: {yearDayModal.dateStr}</h3>
                  <div className="flex gap-2 mt-1">
                    {hol && <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-extrabold">🎌 {hol}</span>}
                    {vac && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold">🏖️ {vac}</span>}
                  </div>
                </div>
                <button onClick={() => setYearDayModal({ ...yearDayModal, open: false })} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border-2 border-dashed text-sm font-bold opacity-60 ${themeStyles.divider}`}>
                    Noch keine eigenen Termine an diesem Tag.
                  </div>
                ) : (
                  dayEvents.map(ev => {
                    const mem = members.find(m => m.id === ev.member) || members[0];
                    return (
                      <div key={ev.id} style={getMemberStyles(mem).headerStyle} className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {renderAvatar(mem, 'w-9 h-9', 'text-xs')}
                          <div>
                            <div className="font-extrabold text-sm">{ev.title}</div>
                            <div className="text-xs opacity-75">{mem.name} • {ev.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {members.map(tm => (
                            <button
                              key={tm.id}
                              onClick={() => transferEvent(ev.id, tm.id, yearDayModal.dateStr)}
                              style={getMemberStyles(tm).badgeStyle}
                              className={`w-6 h-6 rounded-lg text-[10px] font-extrabold cursor-pointer ${ev.member === tm.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                              {tm.badge}
                            </button>
                          ))}
                          <button onClick={() => deleteEventById(ev.id)} className="ml-2 px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!yearDayModal.newTitle.trim()) return;
                  const newEv = {
                    id: String(Date.now()),
                    title: yearDayModal.newTitle.trim(),
                    date: yearDayModal.dateStr,
                    time: yearDayModal.newTime || 'Ganztägig',
                    member: yearDayModal.newMember,
                    notifyTime: '30m',
                    notifyChannel: 'wall_push',
                    notifyUsers: [yearDayModal.newMember],
                    fromGoogle: true
                  };
                  setEvents(prev => [...prev, newEv]);
                  setYearDayModal({ ...yearDayModal, newTitle: '' });
                  showToast('Termin eingetragen', newEv.title, '✅');
                  await sendCalendarApiAction({ action: 'createEvent', event: newEv }, '⏳ Erstelle in Google Kalender...');
                }}
                className={`p-4 rounded-2xl border space-y-3 ${themeStyles.subtle}`}
              >
                <div className="text-xs font-extrabold uppercase">Schnell-Termin an diesem Tag ergänzen:</div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={yearDayModal.newTitle}
                    onChange={(e) => setYearDayModal({ ...yearDayModal, newTitle: e.target.value })}
                    placeholder="Titel..."
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold ${themeStyles.card}`}
                  />
                  <select
                    value={yearDayModal.newMember}
                    onChange={(e) => setYearDayModal({ ...yearDayModal, newMember: e.target.value })}
                    className={`px-3 py-2 rounded-xl border text-sm font-bold ${themeStyles.card}`}
                  >
                    {members.map(m => <option key={m.id} value={m.id} className="bg-slate-800 text-white">{m.name}</option>)}
                  </select>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer">
                    + Hinzufügen
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: SCHULSTUNDE BEARBEITEN */}
      {schoolModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const key = `${schoolModal.dayIdx}-${schoolModal.periodIdx}`;
              setSchoolData(prev => {
                const nextSlots = { ...prev[activeSchoolChild].slots };
                if (!schoolModal.subject.trim()) delete nextSlots[key];
                else nextSlots[key] = { subject: schoolModal.subject.trim(), room: schoolModal.room.trim(), status: schoolModal.status };
                return { ...prev, [activeSchoolChild]: { ...prev[activeSchoolChild], slots: nextSlots } };
              });
              setSchoolModal({ ...schoolModal, open: false });
            }}
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${themeStyles.card}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Schulstunde anpassen</h3>
              <button type="button" onClick={() => setSchoolModal({ ...schoolModal, open: false })}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['📐 Mathe', '📖 Deutsch', '🇬🇧 Englisch', '⚽ Sport', '🎨 Kunst', '🎵 Musik', '🔬 NWT', '🌿 Sachunterricht', '— Frei —'].map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSchoolModal({ ...schoolModal, subject: sub === '— Frei —' ? '' : sub })}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-bold cursor-pointer ${themeStyles.subtle}`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={schoolModal.subject}
              onChange={(e) => setSchoolModal({ ...schoolModal, subject: e.target.value })}
              placeholder="Schulfach..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.subtle}`}
            />
            <input
              type="text"
              value={schoolModal.room}
              onChange={(e) => setSchoolModal({ ...schoolModal, room: e.target.value })}
              placeholder="Raum / Lehrer..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.subtle}`}
            />
            <select
              value={schoolModal.status}
              onChange={(e) => setSchoolModal({ ...schoolModal, status: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${themeStyles.subtle}`}
            >
              <option value="normal" className="bg-slate-800 text-white">Regulärer Unterricht</option>
              <option value="change" className="bg-slate-800 text-white">⚠️ Vertretung / Raumänderung</option>
              <option value="exam" className="bg-slate-800 text-white">📝 Klassenarbeit / Test</option>
              <option value="cancel" className="bg-slate-800 text-white">❌ Entfall / Frei</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSchoolModal({ ...schoolModal, open: false })} className={`px-4 py-2 rounded-xl border text-xs font-bold ${themeStyles.subtle}`}>
                Abbrechen
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: HANDY QR-CODE */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl text-center space-y-4 ${themeStyles.card}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">📱 Smartphone Live-App</h3>
              <button onClick={() => setQrModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className={`text-xs font-semibold ${themeStyles.textMuted}`}>
              Scanne den QR-Code mit deinem Handy, um eure Vercel-Touchwall unterwegs im Supermarkt zu öffnen:
            </p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://vercel.com')}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
        </div>
      )}

      {/* TOAST BENACHRICHTIGUNG */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">{toast.icon}</span>
          <div>
            <div className="font-extrabold text-xs text-amber-400 uppercase">{toast.title}</div>
            <div className="font-semibold text-sm">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
