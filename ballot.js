'use strict';
(() => {
  const root = document.querySelector('.ballot-gallery');
  const scroll = root?.querySelector('.ballot-scroll');
  if (!scroll) return;
  const stage = root.querySelector('.ballot-stage');
  const frames = [...root.querySelectorAll('[data-ballot-frame]')];
  const backgrounds = [...root.querySelectorAll('.ballot-backdrop')];
  const wheelPhotos = [...root.querySelectorAll('.ballot-wheel-photo')];
  const wheel = root.querySelector('.ballot-wheel');
  const buttons = [...root.querySelectorAll('[data-ballot-go]')];
  const dates = ['TỔNG TUYỂN CỬ 1976','TỔNG TUYỂN CỬ 1976','25.04.1976','TỔNG TUYỂN CỬ 1976','25.04.1976','25.04.1976'];
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => (n = clamp(n)) * n * (3 - 2 * n);
  let enabled = false, top = 0, distance = 1, current = 0, target = 0, raf = 0, last = 0, selected = -1, visible = false;
  // A scene holds its position before the wheel turns into the next photograph.
  const position = progress => {
    const n = progress * frames.length;
    const index = Math.min(frames.length - 1, Math.floor(n));
    return index + (index === frames.length - 1 ? 0 : ease((n - index - .62) / .36));
  };
  function render(time) {
    raf = 0;
    const dt = Math.min(64, time - (last || time - 16)); last = time;
    current += (target - current) * (1 - Math.exp(-dt / 90));
    if (Math.abs(target - current) < .00015) current = target;
    const p = position(current);
    const active = Math.min(frames.length - 1, Math.round(p));
    wheel.style.transform = `rotate(${-p * 60}deg)`;
    stage.style.setProperty('--ballot-progress', `${current * 100}%`);
    backgrounds.forEach((bg,i) => {
      const delta = i - p, opacity = 1 - clamp(Math.abs(delta));
      bg.style.opacity = opacity;
      bg.style.transform = `scale(${1.035 + Math.abs(delta) * .04}) translateY(${delta * 2}%)`;
    });
    wheelPhotos.forEach((photo,i) => {
      photo.style.opacity = 1 - clamp(Math.abs(i - p));
      photo.style.transform = `rotate(${p * 60}deg)`;
    });
    frames.forEach((article,i) => {
      const delta = i - p;
      article.style.opacity = 1 - ease(Math.abs(delta));
      article.style.transform = `translateY(${delta * 55}px)`;
      const inactive = i !== active;
      article.inert = inactive;
      article.setAttribute('aria-hidden', String(inactive));
      article.style.pointerEvents = inactive ? 'none' : 'auto';
    });
    if (active !== selected) {
      selected = active;
      frames.forEach((article,i) => article.dataset.active = String(i === active));
      buttons.forEach((button,i) => {
        if(i === active) button.setAttribute('aria-current','step');
        else button.removeAttribute('aria-current');
      });
      root.querySelector('#ballot-count').textContent = `${String(active + 1).padStart(2,'0')} / 06`;
      root.querySelector('#ballot-date').textContent = dates[active];
    }
    if (enabled && visible && Math.abs(current - target) > .00015) request();
    else last = 0;
  }
  function request() {if (!raf && enabled && !document.hidden) raf = requestAnimationFrame(render);}
  function update() {
    if (!enabled) return;
    visible = scrollY + innerHeight > top && scrollY < top + scroll.offsetHeight;
    target = clamp((scrollY - top + 70) / distance);
    if (visible) request();
  }
  function measure() {
    top = scroll.getBoundingClientRect().top + scrollY;
    distance = Math.max(1, scroll.offsetHeight - stage.offsetHeight);
    update();
  }
  function configure() {
    const next = document.body.classList.contains('cinema-ready') && !document.body.classList.contains('motion-disabled');
    if(next === enabled) {measure(); return;}
    enabled = next;
    root.classList.toggle('ballot-motion', enabled);
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if(enabled) {measure(); current = target; selected = -1; request();}
    else {
      frames.forEach(article => {article.removeAttribute('style'); article.inert = false; article.removeAttribute('aria-hidden');});
      backgrounds.forEach(bg => bg.removeAttribute('style'));
      selected = -1;
    }
    // Other pinned scenes also depend on the page height after a layout change.
    window.dispatchEvent(new Event('resize'));
  }
  function go(index) {
    if(!enabled) {frames[index].scrollIntoView({behavior:'auto',block:'start'}); return;}
    measure();
    window.scrollTo({top: top - (innerWidth <= 760 ? 60 : 70) + distance * ((index + .22) / frames.length),behavior:'smooth'});
  }
  buttons.forEach((button,i) => {
    button.addEventListener('click', () => go(i));
    button.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowRight') next = Math.min(frames.length - 1,i+1);
      if(event.key === 'ArrowLeft') next = Math.max(0,i-1);
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = frames.length-1;
      if(next !== undefined) {event.preventDefault(); buttons[next].focus({preventScroll:true}); go(next);}
    });
  });
  new MutationObserver(configure).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) {cancelAnimationFrame(raf); raf=0; last=0;}
    else update();
  });
  document.fonts.ready.then(measure);
  configure();
})();
