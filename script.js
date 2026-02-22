function setupPage() {
  const menu = document.querySelector('[data-nav-menu]');
  const openMenuBtn = document.querySelector('[data-open-menu]');
  const closeMenuBtn = document.querySelector('[data-close-menu]');
  const search = document.querySelector('[data-search]');
  const openSearchBtn = document.querySelector('[data-open-search]');
  const closeSearchBtn = document.querySelector('[data-close-search]');
  const dialogButtons = document.querySelectorAll('[data-open-dialog]');
  const dialogs = document.querySelectorAll('.dialog');

  if (openMenuBtn && menu) {
    openMenuBtn.addEventListener('click', () => menu.classList.add('open'));
  }

  if (closeMenuBtn && menu) {
    closeMenuBtn.addEventListener('click', () => menu.classList.remove('open'));
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
    });
  });

  if (openSearchBtn && search) {
    openSearchBtn.addEventListener('click', () => search.classList.add('active'));
  }

  if (closeSearchBtn && search) {
    closeSearchBtn.addEventListener('click', () => search.classList.remove('active'));
  }

  if (search) {
    search.addEventListener('click', (event) => {
      if (event.target === search) search.classList.remove('active');
    });
  }

  dialogButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-open-dialog');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  dialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.classList.remove('active');
    });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('.dialog');
      if (dialog) dialog.classList.remove('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', setupPage);
