import Link from 'next/link';

export const metadata = {
  title: 'Nutzungsbedingungen – Familien-Touchwall',
  description: 'Nutzungsbedingungen für die Webanwendung Familien-Touchwall und Touchwall Pocket.'
};

export default function NutzungsbedingungenPage() {
  return (
    <main className="min-h-screen bg-[#12151a] text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-700/80 bg-[#1c2128] p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-5">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold border border-sky-400/30">
              📄 Nutzungsbedingungen
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">Nutzungsbedingungen</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Familien-Touchwall & Touchwall Pocket • Stand: November 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-extrabold"
            >
              ← Zur Touchwall
            </Link>
            <Link
              href="/datenschutz"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-extrabold"
            >
              Datenschutz
            </Link>
          </div>
        </div>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">1. Geltungsbereich & Beschreibung des Dienstes</h2>
          <p>
            Diese Nutzungsbedingungen regeln die Verwendung der kostenlosen Webanwendung{' '}
            <strong>Familien-Touchwall</strong> einschließlich der mobilen Ansicht{' '}
            <strong>Touchwall Pocket</strong>. Die Anwendung ist ein privates Open-Source-/Hobby-Projekt
            zur Haushalts- und Familienorganisation (u. a. gemeinsamer Kalender, Aufgaben, Einkaufsliste,
            Vorratsverwaltung und Notizen).
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">2. Benutzerkonto & Zugangsdaten</h2>
          <p>
            Die Nutzung der Cloud-Synchronisation erfordert ein Familienkonto (über Benutzername/Passwort
            oder per Google-/Microsoft-OAuth). Nutzer sind selbst dafür verantwortlich, ihr Passwort,
            ihren Notfall-Recovery-Code sowie geteilte Handy-Einladungslinks vertraulich zu behandeln und
            nur innerhalb der eigenen Familie weiterzugeben.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">3. Einbindung von Drittanbietern</h2>
          <p>
            Die Anwendung ermöglicht optionale Verknüpfungen mit externen Diensten wie{' '}
            <strong>Google Kalender</strong>, <strong>Microsoft Outlook</strong> und{' '}
            <strong>Todoist</strong>. Für die Verfügbarkeit, Funktionsweise und Datenschutzbestimmungen
            dieser Drittanbieter gelten ergänzend deren jeweilige Nutzungsbedingungen. Durch eine
            Zwei-Wege-Synchronisation vorgenommene Änderungen (z. B. Anlegen oder Löschen von Terminen)
            werden direkt auf die verbundenen Kalender übertragen.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">4. Zulässige Nutzung</h2>
          <p>
            Die Anwendung darf ausschließlich zu rechtmäßigen, privaten Zwecken verwendet werden. Es ist
            untersagt, die Infrastruktur missbräuchlich zu belasten, Sicherheitsmechanismen zu umgehen
            oder fremde Konten ohne Berechtigung aufzurufen.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">5. Verfügbarkeit & Haftungsausschluss</h2>
          <p>
            Die Anwendung wird kostenlos und „wie besehen“ (<em>as is</em>) ohne Anspruch auf dauerhafte,
            unterbrechungsfreie Verfügbarkeit bereitgestellt. Es wird empfohlen, regelmäßig die integrierte
            Backup-Exportfunktion (JSON) zu nutzen. Eine Haftung für leichte Fahrlässigkeit, Datenverlust
            oder Ausfälle von Drittanbieter-Schnittstellen ist ausgeschlossen, soweit gesetzlich zulässig;
            unberührt bleibt die Haftung bei Vorsatz, grober Fahrlässigkeit sowie bei Verletzung von
            Leben, Körper oder Gesundheit.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-black text-white">6. Beendigung & Kontakt</h2>
          <p>
            Du kannst die Nutzung jederzeit beenden, OAuth-Verbindungen unter „Konten“ trennen und die
            vollständige Löschung deines Kontos per E-Mail an{' '}
            <strong>hgr3dsm@googlemail.com</strong> anfordern. Es gilt deutsches Recht.
          </p>
        </section>
      </div>
    </main>
  );
}
