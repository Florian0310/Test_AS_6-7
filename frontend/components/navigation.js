export function initNavigation() {
  const menu = document.querySelector('[data-nav-menu]');
  const open = document.querySelector('[data-open-menu]');
  const close = document.querySelector('[data-close-menu]');
  if (!menu || !open) return;
  const mobile = matchMedia('(max-width: 1023px)');
  const focusable = () => [...menu.querySelectorAll('a[href],button:not([disabled])')].filter(node => node.getClientRects().length);
  let isOpen = false;
  const setOpen = value => {
    const restore = menu.contains(document.activeElement);
    isOpen = value && mobile.matches;
    menu.classList.toggle('open', isOpen);
    menu.inert = mobile.matches && !isOpen;
    menu.setAttribute('aria-hidden', String(mobile.matches && !isOpen));
    open.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('no-scroll', isOpen);
    document.querySelector('main')?.toggleAttribute('inert', isOpen);
    document.querySelector('footer')?.toggleAttribute('inert', isOpen);
    if (isOpen) requestAnimationFrame(() => focusable()[0]?.focus());
    else if (restore) open.focus();
  };
  open.addEventListener('click', () => setOpen(!isOpen));
  close?.addEventListener('click', () => setOpen(false));
  menu.addEventListener('click', event => {if (event.target.closest('a[href]')) setOpen(false);});
  document.addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {event.preventDefault(); setOpen(false);}
    if (event.key !== 'Tab') return;
    const targets = focusable(), first = targets[0], last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
  });
  mobile.addEventListener('change', () => setOpen(false));
  document.querySelector('[data-catalog-search-link]')?.addEventListener('click', event => {
    const input = document.querySelector('[data-tools-search]');
    if (!input) return;
    event.preventDefault(); setOpen(false); input.focus(); input.scrollIntoView({block: 'center'});
  });
  setOpen(false);
}
