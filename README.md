# 🖥️📱 Familien-Touchwall & Touchwall Pocket

Ein ganzheitliches Smart-Home-Familien-Dashboard für große Wand-Touchscreens (**Touchwall**) kombiniert mit einer mobilen Begleit-App (**Touchwall Pocket PWA**) für unterwegs, den Supermarkt und die Küche.

Das System vereint Familienkalender, Todoist-Aufgaben, Einkaufslisten, Stundenpläne, Essensplanung, ein spielerisches Skill-Board sowie eine KI-gestützte Speisekammer- und Vorratsverwaltung mit Barcode-/MHD-Scanner und Produktbild-Cloud in einer einzigen Echtzeit-Plattform.

---

## Inhaltsverzeichnis

1. [Systemübersicht & Architektur](#systemübersicht--architektur)
2. [Wie das System funktioniert](#wie-das-system-funktioniert)
   - [Touchwall (Wand-Display) vs. Pocket (Smartphone-PWA)](#1-touchwall-wand-display-vs-pocket-smartphone-pwa)
   - [4-Kanal-Echtzeit-Synchronisation](#2-4-kanal-echtzeit-synchronisation)
   - [Intelligenter 2-Phasen-Scanner (Barcode & MHD-KI)](#3-intelligenter-2-phasen-scanner-barcode--mhd-ki)
   - [Produktbild-Pipeline & Cloud-Katalog (Supabase Storage)](#4-produktbild-pipeline--cloud-katalog-supabase-storage)
   - [Speisekammer, MHD-Wächter, Rezepte & Angebote](#5-speisekammer-mhd-wächter-rezepte--angebote)
   - [Kalender, Aufgaben, Schule, Essensplan & Skill-Board](#6-kalender-aufgaben-schule-essensplan--skill-board)
3. [Technologie-Stack & Projektstruktur](#technologie-stack--projektstruktur)
4. [Installation & Einrichtung](#installation--einrichtung)
5. [Lizenzbestimmungen & Kommerzielle Nutzung](#lizenzbestimmungen--kommerzielle-nutzung)

---

## Systemübersicht & Architektur

```text
┌──────────────────────────────┐        ┌──────────────────────────────┐
│   🖥️ Große Touchwall (/)     │        │ 📱 Touchwall Pocket(/pocket)│
│  Wand-Display / Tablet / PC  │        │  Mobile PWA & Kamera-Scanner │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
            ┌─────────────────────────────────────────────┐
            │         Next.js App Router Backend          │
            │  /api/cloud  |  /api/products               │
            │  /api/product-image  |  /api/mhd-ai         │
            └──────┬───────────────┬───────────────┬──────┘
                   │               │               │
      ┌────────────▼───┐   ┌───────▼───────┐   ┌───▼──────────────────┐
      │    Supabase    │   │  KI & Produkt │   │   Externe Dienste    │
      │ • PostgreSQL   │   │ • Gemini AI   │   │ • Todoist (2-Wege)   │
      │ • Realtime     │   │ • OpenFood-   │   │ • Google / Outlook   │
      │ • Storage      │   │   Facts       │   │   Kalender           │
      │   (Bilder)     │   │ • Tesseract   │   │ • Web Push & Audio   │
      └────────────────┘   └───────────────┘   └──────────────────────┘
```

---

## Wie das System funktioniert

### 1. Touchwall (Wand-Display) vs. Pocket (Smartphone-PWA)

* **Touchwall (`/`)**: Optimiert für große Touch-Monitore in Küche oder Flur. Bietet eine dauerhafte Übersicht über Uhrzeit, Familienkalender (1-, 2-, 4-Wochen- und Jahreswand-Ansicht), die Excel-ähnliche Vorratstabelle, Stundenpläne, Essensplan, Todoist-Boards, Notizen und das Skill-Board. Über einen QR-Code („Handy-Einladung“) lassen sich Smartphones der Familienmitglieder direkt mit dem Familienkonto koppeln.
* **Touchwall Pocket (`/pocket`)**: Installierbare Progressive Web App (PWA) für Android und iOS mit Offline-Puffer, Push-Benachrichtigungen, Schnell-Einkaufsliste, persönlichem Personen-Filter, mobilem Bestandsmanagement und integriertem Kamera-Scanner.

---

### 2. 4-Kanal-Echtzeit-Synchronisation

Alle Geräte einer Familie greifen über ein gemeinsames Konto (`accountId` + `authKey`) auf den Cloud-State zu. Um Datenverluste bei gleichzeitiger Bearbeitung (z. B. ein Gerät scannt im Supermarkt, während an der Wand etwas abgehakt wird) zu verhindern, nutzt das System vier getrennte Sync-Mechanismen mit Konfliktauflösung:

1. **Supabase Realtime Turbo-Sync**: Änderungen am Familien-State lösen sofort ein Realtime-Event aus, sodass Wand und Handys innerhalb von unter einer Sekunde aktualisiert werden — ohne auf langsame Drittanbieter-APIs warten zu müssen.
2. **Tombstone-basierte Merge-Logik (`syncMeta`)**: Gelöschte oder abgehakte Artikel, Aufgaben und Termine werden mit Zeitstempeln versehen, damit bereits erledigte Einträge bei einem späteren Sync nicht wieder auftauchen.
3. **2-Wege-Todoist-Sync**: Aufgaben und die Einkaufsliste synchronisieren sich bidirektional mit Todoist-Projekten inklusive Team-Zuweisung und Handy-Push.
4. **Offline-Puffer**: Verliert das Smartphone im Supermarkt den Empfang, puffert Pocket alle Änderungen lokal und überträgt sie automatisch, sobald wieder eine Verbindung besteht.

---

### 3. Intelligenter 2-Phasen-Scanner (Barcode & MHD-KI)

Der mobile Scanner (`app/pocket/PocketScanner.tsx`) arbeitet mit einer **strikten 2-Phasen-Trennung**, damit sich Barcode-Erkennung und Mindesthaltbarkeitsdatum-Scan (MHD) nicht gegenseitig stören:

* **Phase 1 – Barcode- & QR-Erkennung (`barcode`)**:
  * Nutzt die native `BarcodeDetector`-API des Browsers (13+ Formate: EAN-13, EAN-8, UPC, Code-128, QR, GS1 DataMatrix usw.) sowie **ZXing** als Multi-Format-Fallback.
  * **Schutz vor Fehlauslösungen**: Der ZXing-Fallback prüft auf gültige Produkt-Payloads und verlangt **2 identische Treffer in Folge**, wodurch Geister-Barcodes zuverlässig verhindert werden.
  * **Produktauflösung in 3 Stufen**:
    1. Lokales Barcode-Gedächtnis (sofort offline verfügbar).
    2. Zentraler Supabase-Produktkatalog (`/api/products`) – inklusive Unterstützung für 13-stellige Gewichts-/Frischetheken-Barcodes (7-stelliger Präfix-Abgleich).
    3. OpenFoodFacts, OpenPetFoodFacts & OpenProductsFacts (inkl. automatischer Namensvereinfachung nach dem Schema `Produkt / Marke`, Kategorie-, Lagerort- und Glutenfrei-Erkennung).
* **Phase 2 – Fokus auf das MHD-Datum (`hunting_mhd`)**:
  * Sobald ein Produkt erkannt wurde, **pausiert der Barcode-Scanner komplett**. Der Produktname bleibt gesperrt und kann beim Drehen der Verpackung nicht mehr versehentlich überschrieben werden.
  * Die Kamera fokussiert sich über einen gelben Zielstreifen rein auf das aufgedruckte Ablaufdatum.
  * **Hybrid-MHD-Erkennung**: Kombiniert **Gemini Vision-KI** (`/api/mhd-ai` – erkennt auch schwierige Punktschrift/Dot-Matrix und weiße Schrift auf dunklem Grund) mit einem mehrstufigen lokalen **Tesseract-OCR-Fallback** (Kontrast-, Invert- und Rohbild-Pass).
  * Über den Button **„Neu“** lässt sich jederzeit mit einem Tipp wieder zurück in Phase 1 wechseln.
* **2-Stunden-Ausbuchungs-Automatik**:
  * Wird der Barcode eines Produkts gescannt, das bereits seit mindestens 2 Stunden im Vorrat liegt, erkennt das System dies automatisch und bietet an, den Artikel direkt auszubuchen (oder 1 Stück zu entnehmen), in den Mülleimer zu legen und optional direkt wieder auf die Einkaufsliste zu setzen.
* **Weitere Scanner-Modi**:
  * **Frische-KI**: Erkennung von unverpacktem Obst und Gemüse über TensorFlow MobileNet (inkl. Farb-Fallback und Schnellwahl-Datenbank mit geschätzter Haltbarkeit).
  * **Kassenbon-Scanner**: Abfotografieren ganzer Kassenbons mit OCR-Texterkennung und Stapelübernahme in den Einkaufswagen.

---

### 4. Produktbild-Pipeline & Cloud-Katalog (Supabase Storage)

Jedes Produkt wird über die zentrale Komponente `ProductThumb.tsx` einheitlich auf der Touchwall und in Pocket dargestellt (mit automatischem Emoji-Fallback, falls kein Bild vorhanden ist oder offline geladen wird):

1. **Automatische Bilder**: Beim Scannen eines Barcodes extrahiert `productImageUtils.ts` automatisch das optimale Vorschaubild aus OpenFoodFacts.
2. **Eigene Produktfotos**: Fehlt ein Bild (z. B. Bäcker, Fleischtheke, regionale Produkte), kann direkt aus dem Scanner-Sucher oder im Bearbeiten-Modal ein Foto aufgenommen werden.
3. **Browser-Komprimierung**: Fotos werden noch auf dem Gerät per HTML5-Canvas auf maximal `300 x 300 px` (ca. 12 bis 20 KB JPEG) verkleinert.
4. **Sicherer Server-Upload**: Das komprimierte Bild wird über die Next.js API-Route `/api/product-image` mit dem `SUPABASE_SERVICE_ROLE_KEY` in den öffentlichen Supabase-Storage-Bucket `product-images` hochgeladen. Der Bucket ist von außen ausschließlich lesbar.
5. **Geteilter Produktkatalog**: Über `/api/products` wird die Bild-URL zusammen mit dem Barcode gespeichert, sodass alle gekoppelten Geräte das Foto beim nächsten Scan sofort erhalten.

---

### 5. Speisekammer, MHD-Wächter, Rezepte & Angebote

* **Drei Ansichten auf der Touchwall (`PantrySection.tsx`)**:
  * **Excel-Gesamttabelle** (Standard): Spaltensortierung, Inline-Bearbeitung von Kategorie, Lagerort und Menge (`-` / `+`), farbliche MHD-Hervorhebung.
  * **Kategorien-Gruppen**: Übersichtliche Gliederung nach 7 Lebensmittel-Kategorien.
  * **Kachel-Ansicht**: Große Touch-Karten für schnelle Bedienung.
* **Intelligente Filter**: Lagerorte (Kühlschrank, Gefrierschrank, Vorratsschrank, Keller/Vorrat, Küche, Tierfutter), Kategorien, Live-Suche und **Glutenfrei-Filter (GF)** mit automatischer Allergenerkennung.
* **Automatischer MHD-Wächter**:
  * Sendet Push-Warnungen (und optional Todoist-Aufgaben) 1 bis 2 Tage vor Ablauf sowie eine letzte Warnung am Ablauftag.
  * Überschreitet ein Produkt das MHD, wird es am Folgetag automatisch in den **Mülleimer** verschoben.
* **Nachhaltigkeits-Statistik, Rezepte & Angebote**:
  * Auswertung des Verhältnisses von verzehrten zu abgelaufenen Lebensmitteln.
  * Rezeptvorschläge basierend auf dem aktuellen Vorrat (`PantryRecipes.tsx`) sowie lokaler Angebots-Check für verbrauchte Produkte (`PantryOffers.tsx`).

---

### 6. Kalender, Aufgaben, Schule, Essensplan & Skill-Board

* **Familienkalender (`CalendarSection.tsx`)**: 1-Wochen-, 2-Wochen-, 4-Wochen- und Jahreswand-Ansicht, Farbcodierung pro Familienmitglied, Kopier-/Einfüge-Modus, Drag/Move von Terminen sowie Bildschirm- und Sound-Alarme.
* **Schule & Stundenpläne (`SchoolSection.tsx`)**: Individuelle Stundenpläne pro Kind inkl. Raumangaben, Status-Markierungen und Mitteilungen.
* **Todoist & Einkaufsliste (`TasksTodoistSection.tsx` / `PocketShopping.tsx`)**: Aufgabenverwaltung pro Person mit Prioritäten, Fälligkeiten, Handy-Push sowie Einkaufsliste mit Direktübernahme gekaufter Artikel in den Vorrat.
* **Skill-Board / Quest-System (`quest`)**: Gamification-Modul zur Motivation im Familienalltag.
* **Themes & Personalisierung**: Mehrere wählbare Farbthemes (z. B. Metal), eigenes Familien-Logo, Foto- oder Emoji-Avatare sowie JSON-Backup-Export/-Import.

---

## Technologie-Stack & Projektstruktur

* **Framework**: Next.js (App Router) & React
* **Styling**: Tailwind CSS + Lucide Icons
* **Datenbank, Realtime & Storage**: Supabase (PostgreSQL, Realtime Channels, Storage Bucket)
* **KI & Erkennung**: Google Gemini Vision API, Tesseract.js (OCR), TensorFlow.js / MobileNet, ZXing & native BarcodeDetector API
* **Hosting**: Optimiert für Vercel

### Zentrale Dateien (modular in `PART`-Blöcke gegliedert)

```text
app/
├── page.tsx                     # Haupt-Touchwall-App (PART 01–12)
├── PantrySection.tsx            # Touchwall-Speisekammer, Excel-Tabelle & Modals (PART 01–10)
├── PantryRecipes.tsx            # Rezeptvorschläge & Menüplaner
├── PantryOffers.tsx             # Angebots- & Preisvergleich
├── ProductThumb.tsx             # Einheitliche Produktbild-Komponente mit Emoji-Fallback
├── productImageUtils.ts         # OpenFoodFacts-Extraktion, Bildkomprimierung & Upload-Client
├── CalendarSection.tsx          # Wochen- & Jahreskalender
├── TasksTodoistSection.tsx      # 2-Wege Todoist & Einkaufsliste
├── SchoolSection.tsx            # Stundenpläne
├── OtherSections.tsx            # Essensplan, Notizen, Design & Konten
├── sync.ts / sync.tsx           # 4-Kanal-Sync, Realtime-Hook & Merge-Strategien
├── touchwallConfig.ts           # Themes, Standardwerte & API-Helfer
├── pocket/
│   ├── page.tsx                 # Mobile Touchwall Pocket PWA
│   ├── PocketScanner.tsx        # 2-Phasen Barcode-, MHD-KI- & Bon-Scanner (PART 01–10)
│   ├── PocketAgenda.tsx         # Mobiler Kalender
│   ├── PocketTasks.tsx          # Mobile Aufgaben
│   └── PocketShopping.tsx       # Mobile Einkaufsliste
└── api/
    ├── cloud/route.ts           # Familien-State, Auth & Kalender-Backend
    ├── products/route.ts        # Zentraler Supabase-Barcode- & Bild-Katalog
    ├── product-image/route.ts   # Server-Upload in Supabase Storage (Bucket: product-images)
    └── mhd-ai/route.ts          # Gemini Vision-KI Endpunkt für MHD- & Etiketten-Erkennung
```

---

## Installation & Einrichtung

### 1. Voraussetzungen
* Node.js (v18 oder neuer)
* Ein [Supabase](https://supabase.com/)-Projekt (Datenbank, Realtime & Storage)
* Optional: Google Gemini API-Key (für KI-MHD-Erkennung) und Todoist API-Token

### 2. Umgebungsvariablen (`.env.local` / Vercel)

```env
SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key

# Optional für KI-MHD- & Etiketten-Scanner:
GEMINI_API_KEY=dein_gemini_api_key

# Optional für OAuth-UI:
NEXT_PUBLIC_ENABLE_OAUTH=false
```

### 3. Supabase SQL-Setup (Storage Bucket & Produktkatalog)

Im **Supabase SQL Editor** einmalig ausführen:

```sql
-- 1. Öffentlicher Storage-Bucket für komprimierte Produktfotos (nur Server darf schreiben)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 524288,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Zentraler Barcode- & Produktbild-Katalog
CREATE TABLE IF NOT EXISTS public.products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT DEFAULT '1x',
  location TEXT DEFAULT 'fridge',
  category TEXT DEFAULT 'produce',
  gluten_free TEXT DEFAULT 'auto',
  image_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Lokal starten

```bash
npm install
npm run dev
```

Die Touchwall ist anschließend unter `http://localhost:3000` und Touchwall Pocket unter `http://localhost:3000/pocket` erreichbar.

---

## Lizenzbestimmungen & Kommerzielle Nutzung

**© Hans Richter 2026 – Eigentümer der Entwicklung. Alle Rechte vorbehalten.**

Dieses Repository und der darin enthaltene Quellcode, die Architektur, das Design sowie sämtliche zugehörigen Komponenten sind geistiges Eigentum von **Hans Richter**.

### Nutzungsbedingungen

1. **Private / Nicht-kommerzielle Nutzung (Ansicht & persönlicher Test)**
   * Das Einsehen des Quellcodes zu Lern-, Bewertungs- oder rein privaten, nicht-kommerziellen Zwecken ist gestattet, sofern dieser Urheberrechtshinweis (`© Hans Richter 2026, Eigentümer der Entwicklung`) unverändert erhalten bleibt.
   * Eine öffentliche Weiterverbreitung, der Weiterverkauf oder das Anbieten als gehosteter Dienst (SaaS) ist ohne ausdrückliche Genehmigung untersagt.

2. **Kommerzielle Nutzung – Lizenzpflicht**
   * **Jede kommerzielle Nutzung** — einschließlich, aber nicht beschränkt auf den Einsatz in Unternehmen, die Integration in kommerzielle Produkte oder Hardware (z. B. Smart-Home-Displays), den Weiterverkauf, das White-Labeling, das Anbieten als kostenpflichtige oder werbefinanzierte Dienstleistung (SaaS) sowie die kommerzielle Weiterentwicklung — **ist ohne eine vorherige, schriftliche kommerzielle Lizenzvereinbarung mit Hans Richter ausdrücklich untersagt**.
   * Wer dieses System oder Teile davon kommerziell nutzen möchte, **muss sich verbindlich an die Lizenzbestimmungen des Eigentümers halten** und vorab eine entsprechende Nutzungslizenz erwerben bzw. vereinbaren.

3. **Haftungsausschluss**
   * Die Software wird „wie besehen“ („AS IS“) ohne ausdrückliche oder stillschweigende Gewährleistung bereitgestellt. Insbesondere für automatisch erkannte Mindesthaltbarkeitsdaten (MHD), Allergen-/Glutenfrei-Markierungen oder Produktdaten aus Drittquellen (z. B. OpenFoodFacts, KI-Erkennung) übernimmt der Eigentümer keine Haftung; eine eigene Prüfung am Originalprodukt bleibt stets erforderlich.

### Kontakt für kommerzielle Lizenzen

Für Anfragen zu kommerziellen Lizenzen, Kooperationen oder individuellen Anpassungen wenden Sie sich bitte direkt an den Eigentümer der Entwicklung:

* **Eigentümer & Rechteinhaber:** Hans Richter
* **Copyright:** `© Hans Richter 2026, Eigentümer der Entwicklung`
* **Kontakt:** *hgr3sm@googlemail.com* / *https://github.com/motionrain*
