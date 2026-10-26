import { messages } from './messages.js';
export const locale = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
export const isEnglish = locale === 'en';
export function t(key, ...values) {
  const message = messages[locale][key] ?? messages.de[key] ?? key;
  return String(message).replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? ''));
}
export function messagesFor(prefix) {
  return Object.fromEntries(Object.entries(messages[locale]).filter(([key]) => key.startsWith(`${prefix}.`)).map(([key, value]) => [key.slice(prefix.length + 1), value]));
}
