export const APPEARANCE_KEY = 'polymatik.preview.appearance.v1';

// Runs while parsing <head>, before page content or React hydration can paint.
// Only fixed theme names reach the DOM; blocked storage keeps the CSS system default.
export const appearanceBootstrap = `(()=>{try{const theme=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)});if(theme==='light'||theme==='dark')document.documentElement.dataset.theme=theme;}catch{}})();`;
