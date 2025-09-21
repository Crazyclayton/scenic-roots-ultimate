// src/theme.js
export function applyTheme(theme) {
  const t = theme || localStorage.getItem('theme') || 'light'; // default light
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(t);
  localStorage.setItem('theme', t);
  return t;
}

export function toggleTheme() {
  const current = localStorage.getItem('theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  return applyTheme(next);
}

export function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}
