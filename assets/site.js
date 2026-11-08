const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    navigation.classList.add('is-collapsed');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.title = 'Open navigation';
  };
  closeMenu();
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-collapsed', !opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    menuButton.title = opening ? 'Close navigation' : 'Open navigation';
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
}

document.querySelectorAll('[data-slideshow]').forEach(slideshow => {
  const slides = [...slideshow.querySelectorAll('.slide')];
  const controls = slideshow.querySelector('.slideshow-controls');
  if (slides.length < 2 || !controls) return;
  controls.hidden = false;
  const pauseButton = controls.querySelector('[data-pause]');
  const count = controls.querySelector('.slide-count');
  const caption = slideshow.querySelector('.slide-caption');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let paused = motion.matches;
  let visible = true;
  let timer;
  const syncPause = () => {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    pauseButton.title = paused ? 'Play slideshow' : 'Pause slideshow';
  };
  const restart = () => {
    clearInterval(timer);
    if (!paused && visible && !document.hidden) timer = setInterval(() => advance(1), Number(slideshow.dataset.interval));
  };
  const advance = direction => {
    slides[index].classList.remove('is-active');
    slides[index].setAttribute('aria-hidden', 'true');
    index = (index + direction + slides.length) % slides.length;
    slides[index].classList.add('is-active');
    slides[index].removeAttribute('aria-hidden');
    count.textContent = (index + 1) + ' / ' + slides.length;
    if (caption) caption.textContent = slides[index].querySelector('img').alt;
  };
  controls.querySelector('[data-prev]').addEventListener('click', () => { advance(-1); restart(); });
  controls.querySelector('[data-next]').addEventListener('click', () => { advance(1); restart(); });
  pauseButton.addEventListener('click', () => { paused = !paused; syncPause(); restart(); });
  document.addEventListener('visibilitychange', restart);
  slideshow.addEventListener('focusin', () => clearInterval(timer));
  slideshow.addEventListener('focusout', event => { if (!slideshow.contains(event.relatedTarget)) restart(); });
  motion.addEventListener('change', () => { paused = motion.matches; syncPause(); restart(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    restart();
  }).observe(slideshow);
  syncPause();
  restart();
});

document.querySelectorAll('[data-news-list]').forEach(list => {
  const filters = list.querySelector('.news-filters');
  const posts = [...list.querySelectorAll('.news-item')];
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const category = button.dataset.filter;
    filters.querySelectorAll('button').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    posts.forEach(post => { post.hidden = category !== 'All updates' && post.dataset.category !== category; });
    const count = posts.filter(post => !post.hidden).length;
    list.querySelector('[data-filter-status]').textContent = count + ' ' + (count === 1 ? 'update' : 'updates') + ' shown';
  });
});

function revealSeason() {
  if (!location.hash.startsWith('#season-')) return;
  const season = document.getElementById(location.hash.slice(1));
  if (season?.matches('details')) season.open = true;
}
window.addEventListener('hashchange', revealSeason);
revealSeason();

// Keep links saved from the previous single-page site useful after the redesign.
if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
  const legacy = { '#hero': null, '#about': 'team.html', '#team': 'team.html', '#robots': 'robots.html', '#history': 'robots.html#history', '#sponsors': 'support.html#sponsors', '#support': 'support.html', '#current-season': 'news.html#season' };
  if (legacy[location.hash]) location.replace(legacy[location.hash]);
}
