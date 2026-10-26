import { RentalApi } from '../data/catalog-api.js';
import { locale } from '../i18n/index.js';
export async function hydrateSiteContact() {
  try {
    const {contact = {}} = await RentalApi.getPublicSiteConfig();
    const country = locale === 'en' && /^(Österreich|Oesterreich)$/i.test(contact.country) ? 'Austria' : contact.country;
    const values = {
      'legal-name': contact.legalCompanyName, 'brand-name': contact.brandName,
      address: [contact.street, contact.postalCode, contact.city, country].filter(Boolean).join(', '),
      phone: contact.phone, email: contact.email,
    };
    for (const [field, value] of Object.entries(values)) {
      if (!value) continue;
      document.querySelectorAll(`[data-company-${field}]`).forEach(node => {
        node.textContent = value;
        if (node.tagName === 'A' && field === 'phone') node.href = `tel:${String(value).replace(/\s/g, '')}`;
        if (node.tagName === 'A' && field === 'email') node.href = `mailto:${value}`;
      });
    }
  } catch { /* The centrally generated fallback stays visible if the CMS is unavailable. */ }
}
