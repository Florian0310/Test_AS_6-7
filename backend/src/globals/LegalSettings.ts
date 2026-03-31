import type { GlobalConfig } from 'payload'

const defaultImpressumDe = `Firmenname: Schroeder - Alles Saniert (Gesellschaft nach buergerlichem Recht)
Adresse: Fotzebenweg 3, 2763 Pernitz, Oesterreich
Telefon: +43 650 3021328
E-Mail: office@allessaniert.at
Taetigkeit: Werkzeugverleih sowie Dienstleistungen inklusive Forstarbeiten`

const defaultImpressumEn = `Company: Schroeder - Alles Saniert (civil law partnership)
Address: Fotzebenweg 3, 2763 Pernitz, Austria
Phone: +43 650 3021328
Email: office@allessaniert.at
Business: Tool rental and services including forestry work`

const defaultPrivacyDe = `Wir verarbeiten personenbezogene Daten ausschliesslich auf Grundlage der DSGVO, des DSG und des TKG in Oesterreich.
Kontaktanfragen werden zur Bearbeitung und zur Erfuellung vorvertraglicher Massnahmen verarbeitet.
Es werden nur technisch notwendige Daten ohne Tracking verarbeitet, solange keine Einwilligung fuer Analytics erteilt wurde.
Betroffene Personen haben das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung, Datenuebertragbarkeit und Widerspruch.`

const defaultPrivacyEn = `We process personal data only in accordance with the GDPR and applicable Austrian law.
Contact requests are processed to handle inquiries and to perform pre-contractual steps.
Only technically required data is processed unless analytics consent is provided.
Data subjects have rights of access, rectification, erasure, restriction, portability and objection.`

const defaultCookieDe = `Notwendige Cookies werden fuer den technischen Betrieb verwendet.
Analytics-Cookies werden nur nach ausdruecklicher Einwilligung aktiviert.
Sie koennen Ihre Einwilligung jederzeit auf der Seite Cookie-Einstellungen aendern oder widerrufen.`

const defaultCookieEn = `Necessary cookies are used for technical operation.
Analytics cookies are activated only after explicit consent.
You can change or withdraw consent at any time on the Cookie Settings page.`

const defaultAccessibilityDe = `Wir arbeiten laufend daran, die Website gemaess WCAG 2.2 auf Niveau AA zu verbessern.
Falls Sie Barrieren entdecken, senden Sie uns bitte eine Nachricht an office@allessaniert.at.`

const defaultAccessibilityEn = `We continuously improve this website in line with WCAG 2.2 level AA.
If you encounter barriers, please contact us at office@allessaniert.at.`

export const LegalSettings: GlobalConfig = {
  slug: 'legal-settings',
  label: 'Rechtstexte',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'impressumDe',
      label: 'Impressum (DE)',
      type: 'textarea',
      required: true,
      defaultValue: defaultImpressumDe,
    },
    {
      name: 'impressumEn',
      label: 'Imprint (EN)',
      type: 'textarea',
      required: true,
      defaultValue: defaultImpressumEn,
    },
    {
      name: 'privacyDe',
      label: 'Datenschutz (DE)',
      type: 'textarea',
      required: true,
      defaultValue: defaultPrivacyDe,
    },
    {
      name: 'privacyEn',
      label: 'Privacy Policy (EN)',
      type: 'textarea',
      required: true,
      defaultValue: defaultPrivacyEn,
    },
    {
      name: 'cookiePolicyDe',
      label: 'Cookie-Richtlinie (DE)',
      type: 'textarea',
      required: true,
      defaultValue: defaultCookieDe,
    },
    {
      name: 'cookiePolicyEn',
      label: 'Cookie Policy (EN)',
      type: 'textarea',
      required: true,
      defaultValue: defaultCookieEn,
    },
    {
      name: 'accessibilityDe',
      label: 'Barrierefreiheit (DE)',
      type: 'textarea',
      required: true,
      defaultValue: defaultAccessibilityDe,
    },
    {
      name: 'accessibilityEn',
      label: 'Accessibility Statement (EN)',
      type: 'textarea',
      required: true,
      defaultValue: defaultAccessibilityEn,
    },
  ],
}
