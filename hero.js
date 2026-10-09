document.documentElement.classList.add('js');
const trigger = document.querySelector('.menu-trigger');
const navigation = document.querySelector('#gallery-navigation');
const compact = matchMedia('(max-width: 999px)');
trigger.hidden = false;
function setMenu(open, restoreFocus = false) {
  trigger.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  if (open) navigation.querySelector('a').focus();
  else if (restoreFocus) trigger.focus();
}
trigger.addEventListener('click', () => setMenu(trigger.getAttribute('aria-expanded') !== 'true', true));
navigation.addEventListener('click', event => { if (event.target.closest('a') && compact.matches) setMenu(false, true); });
document.addEventListener('keydown', event => {
  if (trigger.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
  if (event.key === 'Tab') {
    const links = [...navigation.querySelectorAll('a')];
    if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); trigger.focus(); }
    else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); trigger.focus(); }
    else if (document.activeElement === trigger) { event.preventDefault(); (event.shiftKey ? links.at(-1) : links[0]).focus(); }
  }
});
compact.addEventListener('change', () => setMenu(false));

// Decode the existing hero images before releasing the CSS timeline. The
// independent head timeout also releases it if this script cannot load.
const heroRoot = document.documentElement;
const hero = document.querySelector('.gallery-hero');
const motionPreference = matchMedia('(prefers-reduced-motion: no-preference)');
const heroImages = [...hero.querySelectorAll('img')];
const readyImages = Promise.allSettled(heroImages.map(image => image.decode()));
readyImages.then(() => heroRoot.classList.remove('hero-waiting'));
hero.addEventListener('animationend', event => {
  if (event.animationName === 'gallery-room-settle') heroRoot.classList.remove('hero-motion');
});
motionPreference.addEventListener('change', event => {
  if (!event.matches) heroRoot.classList.remove('hero-motion', 'hero-waiting');
});
window.addEventListener('pageshow', event => {
  if (!event.persisted || !motionPreference.matches) return;
  heroRoot.classList.remove('hero-motion', 'hero-waiting');
  // Commit the reset before repaint, including restores during an active intro.
  void hero.offsetWidth;
  heroRoot.classList.add('hero-motion');
});
