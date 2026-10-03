'use strict';

// Scroll follows the browser's own wheel, keyboard and touch behavior.
// Only the artwork is interpolated; reading and anchor navigation stay native.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.body;
  const intro = document.querySelector('.cover-intro');
  const stage = document.querySelector('.cover-stage');
  const journey = document.querySelector('.journey');
  const session = document.querySelector('.session-scene');
  if (!intro || !stage) return;

  let frame = 0;
  let previousTime = 0;
  let ranges = [];
  let states = [0, 0, 0];
  let targets = [...states];
  let visible = [true, false, false];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => value * value * (3 - 2 * value);
  const nodes = [stage, journey, session];
  const properties = ['--hero-p', '--journey-p', '--session-p'];

  function measure() {
    const scroll = window.scrollY;
    const elements = [intro, journey, session];
    ranges = elements.map((element, index) => {
      if (!element) return {top: 0, distance: 1};
      const box = element.getBoundingClientRect();
      return {top: box.top + scroll, distance: index === 0
        ? Math.max(1, box.height - stage.offsetHeight)
        : Math.max(1, box.height - innerHeight * .6)};
    });
    updateTargets();
  }

  function updateTargets() {
    if (preference.matches) return;
    const scroll = window.scrollY;
    targets = ranges.map((range, index) =>
      clamp((scroll - range.top + (index ? innerHeight * .25 : 0)) / range.distance));
    if (!frame && visible.some(Boolean) && !document.hidden) {
      previousTime = 0;
      frame = requestAnimationFrame(render);
    }
  }

  function render(time) {
    const elapsed = previousTime ? Math.min(50, time - previousTime) : 16;
    previousTime = time;
    // Time-based damping keeps the same feel on 60 Hz and 120 Hz displays.
    const damping = 1 - Math.exp(-elapsed / 105);
    let unfinished = false;
    nodes.forEach((node, index) => {
      if (!node) return;
      if (!visible[index]) {states[index] = targets[index]; return;}
      states[index] += (targets[index] - states[index]) * damping;
      if (Math.abs(targets[index] - states[index]) < .0003) states[index] = targets[index];
      else unfinished = true;
      node.style.setProperty(properties[index], smooth(states[index]).toFixed(5));
    });
    frame = unfinished ? requestAnimationFrame(render) : 0;
  }

  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    root.classList.toggle('motion-ready', !preference.matches);
    if (preference.matches) {
      nodes.forEach((node, index) => node?.style.removeProperty(properties[index]));
    } else {
      measure();
      states = [...targets];
      nodes.forEach((node, index) => node?.style.setProperty(properties[index], smooth(states[index]).toFixed(5)));
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const index = nodes.indexOf(entry.target);
        if (index >= 0) visible[index] = entry.isIntersecting;
      });
      updateTargets();
    }, {rootMargin: '120px'});
    nodes.forEach(node => node && observer.observe(node));
  } else visible.fill(true);

  window.addEventListener('scroll', updateTargets, {passive: true});
  window.addEventListener('resize', measure, {passive: true});
  window.addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(frame); frame = 0;}
    else updateTargets();
  });
  preference.addEventListener('change', configure);
  // The dates change only at chapter milestones, with a brief visual handover.
  ['.timeline-big', '.session-overlay strong'].forEach(selector => {
    const element = document.querySelector(selector);
    if (!element || !('MutationObserver' in window)) return;
    let previous = element.textContent;
    new MutationObserver(() => {
      const next = element.textContent;
      if (next === previous) return;
      previous = next;
      if (!preference.matches && element.animate) {
        element.getAnimations().forEach(animation => animation.cancel());
        element.animate([
          {opacity: .4, transform: 'translateY(9px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 380, easing: 'cubic-bezier(.16,1,.3,1)'});
      }
    }).observe(element, {childList: true, characterData: true, subtree: true});
  });
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  configure();
})();
