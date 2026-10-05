// Applies the system theme before first paint; the root layout takes over once
// the session (and the learner's saved choice) is known. Colours match
// themeColors in
// src/components/root-layout/components/theme-sync/constants.ts.
(function () {
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var root = document.documentElement;
  root.classList.toggle('dark-mode', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0a0a0a' : '#fffcf7');
})();
