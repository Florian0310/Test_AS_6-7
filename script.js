function setupPage() {
  const menu = document.querySelector('[data-nav-menu]');
  const openMenuBtn = document.querySelector('[data-open-menu]');
  const closeMenuBtn = document.querySelector('[data-close-menu]');
  const search = document.querySelector('[data-search]');
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-input');
  const openSearchBtn = document.querySelector('[data-open-search]');
  const closeSearchBtn = document.querySelector('[data-close-search]');
  const dialogButtons = document.querySelectorAll('[data-open-dialog]');
  const dialogs = document.querySelectorAll('.dialog');
  const contactForm = document.querySelector('[data-contact-form]');
  const pageBody = document.body;
  const focusableSelector =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let activeDialog = null;
  let lastDialogTrigger = null;

  const getFocusableElements = (container) =>
    Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
      return true;
    });

  const setBodyLock = () => {
    const menuOpen = Boolean(menu && menu.classList.contains('open'));
    const searchOpen = Boolean(search && search.classList.contains('active'));
    const dialogOpen = Array.from(dialogs).some((dialog) => dialog.classList.contains('active'));
    pageBody.classList.toggle('no-scroll', menuOpen || searchOpen || dialogOpen);
  };

  const setMenuState = (isOpen) => {
    if (!menu) return;
    menu.classList.toggle('open', isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));
    if (openMenuBtn) {
      openMenuBtn.setAttribute('aria-expanded', String(isOpen));
    }
    setBodyLock();
  };

  const setSearchState = (isOpen) => {
    if (!search) return;
    search.classList.toggle('active', isOpen);
    search.setAttribute('aria-hidden', String(!isOpen));
    if (openSearchBtn) {
      openSearchBtn.setAttribute('aria-expanded', String(isOpen));
    }
    if (isOpen && searchInput) {
      searchInput.focus();
    }
    setBodyLock();
  };

  const closeDialog = (dialog, restoreFocus = true) => {
    if (!dialog) return;
    dialog.classList.remove('active');
    dialog.setAttribute('aria-hidden', 'true');
    if (activeDialog === dialog) {
      activeDialog = null;
    }
    setBodyLock();

    if (restoreFocus && lastDialogTrigger instanceof HTMLElement && document.contains(lastDialogTrigger)) {
      lastDialogTrigger.focus();
      lastDialogTrigger = null;
    }
  };

  const closeAllDialogs = (restoreFocus = false) => {
    dialogs.forEach((dialog) => closeDialog(dialog, false));
    if (restoreFocus && lastDialogTrigger instanceof HTMLElement && document.contains(lastDialogTrigger)) {
      lastDialogTrigger.focus();
      lastDialogTrigger = null;
    }
  };

  const openDialog = (dialog, trigger) => {
    if (!dialog) return;
    closeAllDialogs(false);
    activeDialog = dialog;
    if (trigger instanceof HTMLElement) {
      lastDialogTrigger = trigger;
    }
    dialog.classList.add('active');
    dialog.setAttribute('aria-hidden', 'false');
    setBodyLock();

    const focusable = getFocusableElements(dialog);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }
  };

  const trapFocusInDialog = (event) => {
    if (!activeDialog || event.key !== 'Tab') return;
    const focusable = getFocusableElements(activeDialog);
    if (!focusable.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (menu) {
    if (!menu.id) {
      menu.id = 'site-navigation';
    }
    menu.setAttribute('aria-hidden', String(!menu.classList.contains('open')));
  }

  if (openMenuBtn && menu) {
    openMenuBtn.setAttribute('aria-controls', menu.id);
    openMenuBtn.setAttribute('aria-expanded', 'false');
    openMenuBtn.addEventListener('click', () => {
      closeAllDialogs(false);
      setSearchState(false);
      setMenuState(true);
    });
  }

  if (closeMenuBtn && menu) {
    closeMenuBtn.setAttribute('aria-controls', menu.id);
    closeMenuBtn.addEventListener('click', () => {
      setMenuState(false);
    });
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  if (search) {
    if (!search.id) {
      search.id = 'site-search';
    }
    search.setAttribute('aria-hidden', String(!search.classList.contains('active')));
  }

  if (searchInput && !searchInput.hasAttribute('aria-label')) {
    searchInput.setAttribute('aria-label', 'Website durchsuchen');
  }

  if (openSearchBtn && search) {
    openSearchBtn.setAttribute('aria-controls', search.id);
    openSearchBtn.setAttribute('aria-expanded', 'false');
    openSearchBtn.addEventListener('click', () => {
      closeAllDialogs(false);
      setMenuState(false);
      setSearchState(true);
    });
  }

  if (closeSearchBtn && search) {
    closeSearchBtn.setAttribute('aria-controls', search.id);
    closeSearchBtn.addEventListener('click', () => {
      setSearchState(false);
    });
  }

  if (search) {
    search.addEventListener('click', (event) => {
      if (event.target === search) {
        setSearchState(false);
      }
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }

  dialogs.forEach((dialog, index) => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', String(!dialog.classList.contains('active')));
    dialog.setAttribute('tabindex', '-1');

    const title = dialog.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      if (!title.id) {
        title.id = `dialog-title-${index + 1}`;
      }
      dialog.setAttribute('aria-labelledby', title.id);
    } else {
      dialog.setAttribute('aria-label', `Dialog ${index + 1}`);
    }
  });

  document.querySelectorAll('i[class^="ri-"], i[class*=" ri-"]').forEach((icon) => {
    icon.setAttribute('aria-hidden', 'true');
  });

  dialogButtons.forEach((button) => {
    const targetId = button.getAttribute('data-open-dialog');
    if (!targetId) return;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', targetId);

    button.addEventListener('click', () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      setMenuState(false);
      setSearchState(false);
      openDialog(target, button);
    });
  });

  dialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        closeDialog(dialog, true);
      }
    });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('.dialog');
      closeDialog(dialog, true);
    });
  });

  document.addEventListener('keydown', (event) => {
    trapFocusInDialog(event);

    if (event.key !== 'Escape') return;

    if (activeDialog) {
      closeDialog(activeDialog, true);
      return;
    }

    if (menu && menu.classList.contains('open')) {
      setMenuState(false);
    }
    if (search && search.classList.contains('active')) {
      setSearchState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1023 && menu) {
      setMenuState(false);
    }
  });

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const firstName = String(formData.get('first_name') || '').trim();
      const lastName = String(formData.get('last_name') || '').trim();
      const fallbackName = String(formData.get('name') || '').trim();
      const name = [firstName, lastName].filter(Boolean).join(' ') || fallbackName;
      const email = String(formData.get('email') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const selectedSubject = String(formData.get('subject') || '').trim();
      const message = String(formData.get('message') || '').trim();

      if (!name || !email || !EMAIL_PATTERN.test(email) || !message) {
        contactForm.reportValidity();
        return;
      }

      const subject = encodeURIComponent(`${selectedSubject || 'Kontaktanfrage'} - ${name || 'Website'}`);
      const body = encodeURIComponent(`Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone}\n\nNachricht:\n${message}`);

      window.location.assign(`mailto:test@test.at?subject=${subject}&body=${body}`);
    });
  }

  setMenuState(Boolean(menu && menu.classList.contains('open')));
  setSearchState(Boolean(search && search.classList.contains('active')));
  setBodyLock();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
document.addEventListener('DOMContentLoaded', setupPage);
