import { isAdmin } from '../utils/access'
import type { GlobalConfig } from 'payload'

const defaultImpressumDe = `Firmenname: Willy Schröder
Adresse: Fotzebenweg 3, 2763 Pernitz, Österreich
Telefon: +43 650 3021328
E-Mail: office@allessaniert.at
Tätigkeit: Werkzeugverleih sowie Dienstleistungen inklusive Forstarbeiten`

const defaultImpressumEn = `Company: Willy Schröder
Address: Fotzebenweg 3, 2763 Pernitz, Austria
Phone: +43 650 3021328
Email: office@allessaniert.at
Business: Tool rental and services including forestry work`

const defaultPrivacyDe = `Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der DSGVO, des DSG und des TKG in Österreich.
Kontaktanfragen werden zur Bearbeitung und zur Erfüllung vorvertraglicher Maßnahmen verarbeitet.
Es werden nur technisch notwendige Daten ohne Tracking verarbeitet, solange keine Einwilligung für Analytics erteilt wurde.
Betroffene Personen haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch.`

const defaultPrivacyEn = `We process personal data only in accordance with the GDPR and applicable Austrian law.
Contact requests are processed to handle inquiries and to perform pre-contractual steps.
Only technically required data is processed unless analytics consent is provided.
Data subjects have rights of access, rectification, erasure, restriction, portability and objection.`

const defaultCookieDe = `Notwendige Cookies werden für den technischen Betrieb verwendet.
Analytics-Cookies werden nur nach ausdrücklicher Einwilligung aktiviert.
Sie können Ihre Einwilligung jederzeit auf der Seite Cookie-Einstellungen ändern oder widerrufen.`

const defaultCookieEn = `Necessary cookies are used for technical operation.
Analytics cookies are activated only after explicit consent.
You can change or withdraw consent at any time on the Cookie Settings page.`

const defaultAccessibilityDe = `Wir arbeiten laufend daran, die Website gemäß WCAG 2.2 auf Niveau AA zu verbessern.
Falls Sie Barrieren entdecken, senden Sie uns bitte eine Nachricht an office@allessaniert.at.`

const defaultAccessibilityEn = `We continuously improve this website in line with WCAG 2.2 level AA.
If you encounter barriers, please contact us at office@allessaniert.at.`

export const LegalSettings: GlobalConfig = {
  slug: 'legal-settings',
  label: 'Rechtstexte',
  admin: {group:'Einstellungen'},
  access: {
    read: isAdmin,
    update: isAdmin,
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
