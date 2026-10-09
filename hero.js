document.documentElement.classList.add('js');
const trigger = document.querySelector('.menu-trigger');
const navigation = document.querySelector('#gallery-navigation');
const menuLabel = trigger.querySelector('.menu-label');
const compact = matchMedia('(max-width: 999px)');
trigger.hidden = false;
const pageBehindMenu = [...document.querySelector('.gallery-stage').children].filter(element => element !== document.querySelector('.gallery-header'));
let closeTimer;
function setMenu(open, restoreFocus = false) {
  clearTimeout(closeTimer);
  trigger.setAttribute('aria-expanded', String(open));
  trigger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menuLabel.textContent = open ? 'Fechar' : 'Menu';
  navigation.classList.toggle('is-open', open);
  navigation.classList.remove('is-closing');
  document.body.classList.toggle('menu-open', open);
  document.documentElement.classList.toggle('menu-open', open);
  if (open) pageBehindMenu.forEach(element => { element.inert = true; });
  if (open) navigation.focus({ preventScroll: true });
  else {
    navigation.classList.add('is-closing');
    closeTimer = setTimeout(() => {
      navigation.classList.remove('is-closing');
      pageBehindMenu.forEach(element => { element.inert = false; });
    }, 300);
    if (restoreFocus) trigger.focus();
  }
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
navigation.addEventListener('transitionend', event => {
  if (event.target === navigation && event.propertyName === 'opacity' && !navigation.classList.contains('is-open')) navigation.classList.remove('is-closing');
});

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
