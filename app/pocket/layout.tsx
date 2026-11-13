// @ts-nocheck
import React from 'react';

export const metadata = {
  title: 'Touchwall Pocket • Familien-App & Scanner',
  description: 'Mobiler Scanner, Kalender, Aufgaben & Einkaufsliste für die Familien-Touchwall',
  manifest: '/manifest.json',
  themeColor: '#111418',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TW Pocket'
  }
};

export const viewport = {
  themeColor: '#111418',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function PocketLayout({ children }) {
  return <>{children}</>;
}
