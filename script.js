function setupPage() {
  const menu = document.querySelector('[data-nav-menu]');
  const openMenuBtn = document.querySelector('[data-open-menu]');
  const closeMenuBtn = document.querySelector('[data-close-menu]');
  const search = document.querySelector('[data-search]');
  const openSearchBtn = document.querySelector('[data-open-search]');
  const closeSearchBtn = document.querySelector('[data-close-search]');
  const dialogButtons = document.querySelectorAll('[data-open-dialog]');
  const dialogs = document.querySelectorAll('.dialog');
  const pageBody = document.body;

  const setBodyLock = () => {
    const menuOpen = Boolean(menu && menu.classList.contains('open'));
    const searchOpen = Boolean(search && search.classList.contains('active'));
    const dialogOpen = Array.from(dialogs).some((dialog) => dialog.classList.contains('active'));
    pageBody.classList.toggle('no-scroll', menuOpen || searchOpen || dialogOpen);
  };

  if (openMenuBtn && menu) {
    openMenuBtn.addEventListener('click', () => {
      menu.classList.add('open');
      setBodyLock();
    });
  }

  if (closeMenuBtn && menu) {
    closeMenuBtn.addEventListener('click', () => {
      menu.classList.remove('open');
      setBodyLock();
    });
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
      setBodyLock();
    });
  });

  if (openSearchBtn && search) {
    openSearchBtn.addEventListener('click', () => {
      search.classList.add('active');
      setBodyLock();
    });
  }

  if (closeSearchBtn && search) {
    closeSearchBtn.addEventListener('click', () => {
      search.classList.remove('active');
      setBodyLock();
    });
  }

  if (search) {
    search.addEventListener('click', (event) => {
      if (event.target === search) {
        search.classList.remove('active');
        setBodyLock();
      }
    });
  }

  dialogButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-open-dialog');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
        setBodyLock();
      }
    });
  });

  dialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.classList.remove('active');
        setBodyLock();
      }
    });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('.dialog');
      if (dialog) {
        dialog.classList.remove('active');
        setBodyLock();
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (menu) menu.classList.remove('open');
    if (search) search.classList.remove('active');
    dialogs.forEach((dialog) => dialog.classList.remove('active'));
    setBodyLock();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1023 && menu) {
      menu.classList.remove('open');
      setBodyLock();
    }
  });
}

document.addEventListener('DOMContentLoaded', setupPage);
