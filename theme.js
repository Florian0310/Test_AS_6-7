(function () {
  const key = 'as_theme_mode_v1';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = 'auto';
  try { const saved = localStorage.getItem(key); if (['light','dark','auto'].includes(saved)) mode = saved; } catch (_) {}
  const apply = () => {
    document.documentElement.dataset.theme = mode === 'auto' ? (system.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.themeMode = mode;
    document.dispatchEvent(new CustomEvent('as:theme', {detail: mode}));
  };
  window.ASTheme = {getMode: () => mode, setMode: value => {
    if (!['light','dark','auto'].includes(value)) return;
    mode = value;
    try {localStorage.setItem(key, mode);} catch (_) {}
    apply();
  }};
  system.addEventListener('change', () => {if (mode === 'auto') apply();});
  window.addEventListener('storage', e => {if (e.key === key) {mode = ['light','dark','auto'].includes(e.newValue) ? e.newValue : 'auto'; apply();}});
  apply();
})();
