const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open', !expanded);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

const reel = document.querySelector('.product-reel');
const reelToggle = document.querySelector('.reel-toggle');

reelToggle.addEventListener('click', () => {
  const paused = reel.classList.toggle('is-paused');
  reelToggle.setAttribute('aria-pressed', String(paused));
  reelToggle.textContent = paused ? 'Play product reel' : 'Pause product reel';
});

