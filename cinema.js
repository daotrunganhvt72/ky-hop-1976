'use strict';

(() => {
  const body = document.body;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('#motion-toggle');
  const cover = document.querySelector('.cover-intro');
  const stage = document.querySelector('.cover-stage');
  const journey = document.querySelector('.journey');
  const session = document.querySelector('.session-scene');
  const title = document.querySelector('.cover-title');
  const description = document.querySelector('.cover-description');
  const heroStory = document.querySelector('.hero-story');
  const photo = document.querySelector('.cover-photo');
  const sides = [...document.querySelectorAll('.hero-side')];
  const cards = [...document.querySelectorAll('.gallery-card')];
  const journeyArticles = [...document.querySelectorAll('.journey-step')];
  const sessionArticles = [...document.querySelectorAll('.session-step')];
  const sessionPhoto = document.querySelector('.session-photo');
  const sessionButtons = [...document.querySelectorAll('.session-rail button')];
  const canvas = document.querySelector('#universe');
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = p => {p = clamp(p); return p * p * (3 - 2 * p);};
  const ramp = (p, a, b) => ease((p - a) / (b - a));
  // Each frame first holds for reading, then the camera travels to the next one.
  const travel = p => {
    const n = clamp(p) * 3;
    return Math.floor(n) + ramp(n % 1, .28, .87);
  };
  let manual = null;
  let enabled = !preference.matches;
  let frame = 0;
  let lastTime = 0;
  let ranges = [];
  let target = [0, 0, 0];
  let current = [0, 0, 0];
  let pointer = [0, 0];
  let smoothPointer = [0, 0];
  let viewport = {width: innerWidth, height: innerHeight};
  let artIsVisible = true;
  let galleryWidth = 440;
  let world = null;
  const cues = [...document.querySelectorAll('.copy-more')];

  document.querySelector('.council-dot-grid')?.append(...Array.from({length: 22}, () => document.createElement('i')));

  function measure() {
    viewport = {width: innerWidth, height: innerHeight};
    ranges = [cover, journey, session].map((element, index) => {
      const bounds = element.getBoundingClientRect();
      const pinned = index === 0 ? stage : element.querySelector(index === 1 ? '.journey-stage' : '.session-stage');
      return {top: bounds.top + scrollY, height: bounds.height,
        distance: Math.max(1, bounds.height - pinned.offsetHeight)};
    });
    galleryWidth = cards[0]?.offsetWidth || 440;
    world?.resize();
    refreshCues();
    updateTargets();
  }

  function refreshCues() {
    cues.forEach(cue => {
      const panel = cue.dataset.copy === 'journey' ? document.querySelector('.journey-stories') : document.querySelector('.session-steps');
      cue.hidden = !enabled || panel.scrollHeight <= panel.clientHeight + 16 || panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 10;
    });
  }

  function updateTargets() {
    if (!enabled || !ranges.length) return;
    const y = scrollY;
    target = ranges.map(range => clamp((y - range.top) / range.distance));
    artIsVisible = ranges.some(range => y + viewport.height > range.top && y < range.top + range.height);
    body.classList.toggle('scene-mode', artIsVisible);
    requestFrame();
  }

  function requestFrame() {
    if (!frame && enabled && !document.hidden) frame = requestAnimationFrame(render);
  }

  function showArticle(container, articles, index, amount) {
    const changed = container.dataset.active !== String(index);
    container.dataset.active = String(index);
    articles.forEach((article, i) => {
      const active = i === index;
      article.classList.toggle('active', active);
      article.inert = !active;
      article.setAttribute('aria-hidden', String(!active));
      const fade = active ? clamp(1 - Math.abs(amount - index) * 1.65, .2, 1) : 0;
      article.style.opacity = fade.toFixed(3);
      article.style.transform = `translate3d(0,${(amount - index) * -24}px,0)`;
    });
    if (changed) {
      container.querySelector('.journey-stories, .session-steps')?.scrollTo({top: 0});
      refreshCues();
      window.dispatchEvent(new Event('cinema:scene'));
    }
  }

  function render(time) {
    frame = 0;
    if (!enabled || document.hidden) return;
    const delta = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    const damping = 1 - Math.exp(-delta / 115);
    current = current.map((p, i) => Math.abs(target[i] - p) < .0001 ? target[i] : lerp(p, target[i], damping));
    smoothPointer = smoothPointer.map((p, i) => lerp(p, pointer[i], damping * .6));
    const mobile = viewport.width <= 760;
    const t = time / 1000;
    const h = current[0];
    const flight = ramp(h, .1, .45);
    const finale = ramp(h, .68, 1);
    const mouseX = smoothPointer[0];
    const mouseY = smoothPointer[1];

    title.style.transform = `translate3d(${mouseX * 8}px,${-ramp(h, .03, .28) * 90 + mouseY * 7}px,0) scale(${1 + ramp(h, .03, .3) * .45})`;
    title.style.opacity = (1 - ramp(h, .1, .3)).toFixed(4);
    description.style.opacity = (1 - ramp(h, .04, .16)).toFixed(4);
    description.inert = h > .15;
    stage.style.setProperty('--hero-progress', `${h * 100}%`);
    const storyOpacity = ramp(h, .31, .47) * (1 - ramp(h, .73, .9));
    heroStory.style.opacity = storyOpacity.toFixed(4);
    heroStory.style.transform = `translate3d(${(1 - ramp(h, .3, .5)) * -60}px,${(1 - storyOpacity) * 20}px,0)`;

    const x = mobile ? lerp(viewport.width * .72, 0, flight) : lerp(viewport.width * .87, viewport.width * .21, flight);
    const centerX = lerp(x, 0, finale);
    const centerY = mobile ? lerp(viewport.height * .03, viewport.height * .15, flight) * (1 - finale) : lerp(90, 0, flight);
    const angleY = lerp(-58, -14, flight) * (1 - finale) + mouseX * 4;
    const angleZ = lerp(-14, -5, flight) * (1 - finale);
    const scale = lerp(.72, 1, flight) + finale * (mobile ? .08 : .59);
    photo.style.opacity = ramp(h, .12, .28).toFixed(4);
    photo.inert = h < .22;
    photo.style.transform = `translate3d(calc(-50% + ${centerX}px),calc(-50% + ${centerY + Math.sin(t * .65) * 3}px),${flight * 40}px) rotateY(${angleY}deg) rotateX(${mouseY * -3}deg) rotateZ(${angleZ}deg) scale(${scale})`;
    sides.forEach((side, i) => {
      const sign = i ? 1 : -1;
      const sideOpacity = ramp(h, .15, .34) * (1 - ramp(h, .55, .8));
      side.style.opacity = (sideOpacity * .55).toFixed(4);
      const orbit = (h - .4) * Math.PI * 2 + (i ? .4 : -.4);
      const sideX = sign * viewport.width * (mobile ? .47 : .39) + Math.sin(orbit) * viewport.width * .2;
      const sideY = Math.cos(orbit) * viewport.height * (mobile ? .1 : .15);
      side.style.transform = `translate3d(calc(-50% + ${sideX}px),calc(-50% + ${sideY}px),${-150 + Math.cos(orbit) * 80}px) rotateY(${-sign * 35 + Math.sin(orbit) * 20}deg) rotateZ(${sign * 10}deg)`;
    });

    const g = travel(current[1]);
    const gi = Math.min(3, Math.round(g));
    showArticle(journey, journeyArticles, gi, g);
    document.querySelector('.gallery-index').textContent = `0${gi + 1} — 04`;
    cards.forEach((card, i) => {
      const d = i - g;
      const visible = clamp(1.55 - Math.abs(d), 0, 1);
      card.classList.toggle('active', i === gi);
      card.inert = i !== gi;
      card.setAttribute('aria-hidden', String(i !== gi));
      card.style.opacity = visible.toFixed(4);
      card.style.transform = `translate3d(calc(-50% + ${d * galleryWidth * .83 + mouseX * 8}px),calc(-50% + ${Math.sin(d * 1.4) * (mobile ? 25 : 65) + Math.sin(t * .55 + i) * 4}px),${-Math.abs(d) * 290}px) rotateY(${-d * 42 - 9 + mouseX * 4}deg) rotateX(${mobile ? 0 : mouseY * -3}deg) rotateZ(${-4 - d * 6}deg) scale(${1 - Math.min(.22, Math.abs(d) * .08)})`;
    });

    const s = travel(current[2]);
    const si = Math.min(3, Math.round(s));
    showArticle(session, sessionArticles, si, s);
    document.querySelector('.session-index').textContent = `0${si + 1} — 04`;
    sessionButtons.forEach((button, i) => {
      if (i === si) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    const open = ramp(current[2], .05, .75);
    sessionPhoto.style.borderRadius = `${lerp(mobile ? 18 : 50, 2, open)}%`;
    sessionPhoto.style.transform = `translate3d(-50%,calc(-50% + ${Math.sin(t * .4) * 3}px),0) rotateY(${lerp(22, -8, open) + mouseX * 3}deg) rotateZ(${lerp(5, -3, open)}deg) scale(${lerp(.88, 1.06, open)})`;
    sessionPhoto.querySelector('img').style.transform = `scale(${lerp(1.22, 1.08, open)}) translate3d(${Math.sin(s * .6) * -25}px,0,0)`;

    if (world) {
      const y = scrollY;
      let scene = 'ambient';
      if (y < ranges[0].top + ranges[0].height) scene = 'hero';
      else if (y + viewport.height > ranges[1].top && y < ranges[1].top + ranges[1].height) scene = 'gallery';
      else if (y + viewport.height > ranges[2].top && y < ranges[2].top + ranges[2].height) scene = 'session';
      world.draw(t, h, g, scene, smoothPointer);
    }
    const unfinished = current.some((p, i) => Math.abs(target[i] - p) > .0001);
    if (artIsVisible || unfinished) requestFrame(); else lastTime = 0;
  }

  function resetReading() {
    [title, description, heroStory, photo, ...sides, ...cards, ...journeyArticles, ...sessionArticles, sessionPhoto, sessionPhoto.querySelector('img')].forEach(element => {
      element.removeAttribute('style');
      element.inert = false;
      element.removeAttribute('aria-hidden');
    });
    delete journey.dataset.active;
    delete session.dataset.active;
    journeyArticles.forEach(article => article.classList.remove('active'));
    stage.style.removeProperty('--hero-progress');
  }

  function configure(preserve = false) {
    const old = enabled;
    let chapter = null;
    if (preserve) [...document.querySelectorAll('[data-chapter]')].forEach(element => {
      if (element.getBoundingClientRect().top <= innerHeight * .35) chapter = element;
    });
    enabled = manual === null ? !preference.matches : manual;
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    body.classList.toggle('cinema-ready', enabled);
    body.classList.toggle('motion-disabled', !enabled);
    document.documentElement.classList.toggle('no-motion', !enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.querySelector('span').textContent = enabled ? 'Bật' : 'Tắt';
    if (!enabled) {resetReading(); body.classList.remove('scene-mode'); world?.draw(0, 0, 0, 'still', [0, 0]);}
    measure();
    current = [...target];
    window.dispatchEvent(new Event('cinema:scene'));
    if (preserve && old !== enabled && chapter) window.scrollTo({top: chapter.getBoundingClientRect().top + scrollY - 80, behavior: 'instant'});
    requestFrame();
  }

  function goToScene(container, index) {
    if (!enabled) {
      const article = container === journey ? journeyArticles[index] : sessionArticles[index];
      article.scrollIntoView({behavior: 'auto', block: 'start'});
      return;
    }
    const range = ranges[container === journey ? 1 : 2];
    scrollTo({top: range.top + index / 3 * range.distance, behavior: 'smooth'});
  }

  document.querySelectorAll('.timeline-nav a').forEach((link, index) => link.addEventListener('click', event => {
    if (!enabled) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    goToScene(journey, index);
  }));
  sessionButtons.forEach((button, index) => button.addEventListener('click', () => goToScene(session, index)));
  cues.forEach(cue => cue.addEventListener('click', () => {
    const panel = cue.dataset.copy === 'journey' ? document.querySelector('.journey-stories') : document.querySelector('.session-steps');
    panel.scrollBy({top: panel.clientHeight * .68, behavior: 'smooth'});
  }));
  document.querySelectorAll('.journey-stories,.session-steps').forEach(panel => panel.addEventListener('scroll', refreshCues, {passive: true}));
  function syncHash() {
    const match = location.hash.match(/^#moc-([1-4])$/);
    if (match && enabled) goToScene(journey, Number(match[1]) - 1);
  }
  toggle.addEventListener('click', () => {manual = !enabled; configure(true);});
  preference.addEventListener('change', () => configure(true));
  window.addEventListener('scroll', updateTargets, {passive: true});
  window.addEventListener('resize', measure, {passive: true});
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('pageshow', () => {measure(); syncHash();});
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') pointer = [(event.clientX / viewport.width - .5) * 2, (event.clientY / viewport.height - .5) * 2];
  }, {passive: true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(frame); frame = 0; lastTime = 0;}
    else requestFrame();
  });

  // Real 3D geometry, rendered by the GPU. These particles are decorative;
  // the data chart below is a separate, exact set of 492 SVG dots.
  function createWorld() {
    const gl = canvas.getContext('webgl', {alpha: false, antialias: false, powerPreference: 'low-power'});
    if (!gl) return null;
    const vertex = `
      attribute vec3 aSphere; attribute vec3 aHelix; attribute vec3 aLetter; attribute float aSeed;
      uniform float uTime,uShape,uLetter,uSpread,uRot,uScale,uAspect,uPixel,uOpacity;
      uniform vec2 uCenter;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        vec3 p=mix(aSphere,aHelix,uShape); p=mix(p,aLetter,uLetter);
        p+=normalize(p+vec3(.01))*(uSpread*aSeed*2.8);
        p.y+=sin(uTime*.4+aSeed*10.)*.09*(1.-uLetter);
        float c=cos(uRot),s=sin(uRot); p.xz=mat2(c,-s,s,c)*p.xz;
        float rx=.2+sin(uTime*.12)*.06; p.yz=mat2(cos(rx),-sin(rx),sin(rx),cos(rx))*p.yz;
        p*=uScale; float depth=max(2.,p.z+8.);
        vec2 screen=p.xy*2.1/vec2(uAspect,1.)+uCenter*depth;
        gl_Position=vec4(screen,0.,depth);
        gl_PointSize=clamp((2.8+aSeed*4.2)*uPixel*8./depth,1.5,12.);
        vColor=mix(vec3(.72,.38,1.),vec3(.71,1.,.38),smoothstep(-2.,2.,aSphere.y));
        vColor=mix(vColor,vec3(1.,.7,.42),smoothstep(.85,1.,aSeed)*.25);
        vAlpha=uOpacity*(.38+pow(1.-aSeed,.5)*.8)*clamp((13.-depth)/6.,.2,1.);
      }`;
    const fragment = `precision mediump float; varying vec3 vColor; varying float vAlpha;
      void main(){float d=length(gl_PointCoord-.5); if(d>.5)discard;
        float a=(1.-smoothstep(.08,.5,d))*vAlpha;gl_FragColor=vec4(vColor,a);}`;
    function shader(type, source) {
      const value = gl.createShader(type); gl.shaderSource(value, source); gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {gl.deleteShader(value); return null;}
      return value;
    }
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const program = gl.createProgram();gl.attachShader(program, vs);gl.attachShader(program, fs);gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const count = innerWidth < 760 ? 4300 : 7600;
    const sphere = [], helix = [], seeds = [], letters = [];
    const textCanvas = document.createElement('canvas'); textCanvas.width = 1000; textCanvas.height = 360;
    const ctx = textCanvas.getContext('2d', {willReadFrequently: true});
    ctx.font = '600 340px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';ctx.textBaseline = 'middle';ctx.fillText('1976', 500, 190);
    const pixels = ctx.getImageData(0, 0, 1000, 360).data;
    const candidates = [];
    for(let y=0;y<360;y+=4)for(let x=0;x<1000;x+=4)if(pixels[(y*1000+x)*4+3]>160)candidates.push([x,y]);
    for(let i=0;i<count;i++) {
      const seed = ((i * 16807 + 13) % 65521) / 65521;
      const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),angle=i*2.39996323;
      sphere.push(Math.cos(angle)*r*2.65,y*2.65,Math.sin(angle)*r*2.65);
      const a=i/count*Math.PI*22,ribbon=1.2+Math.sin(a*.17)*.45;
      helix.push(Math.cos(a)*ribbon,(i/count-.5)*7,Math.sin(a)*ribbon);
      const point=candidates[(i*97)%candidates.length]||[500,180];
      letters.push((point[0]-500)/125,(180-point[1])/125,(seed-.5)*.15);
      seeds.push(seed);
    }
    function attribute(name, values, size) {
      const buffer = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
    }
    attribute('aSphere',sphere,3);attribute('aHelix',helix,3);attribute('aLetter',letters,3);attribute('aSeed',seeds,1);
    const uniforms = {};
    ['Time','Shape','Letter','Spread','Rot','Scale','Aspect','Pixel','Opacity','Center'].forEach(key=>uniforms[key]=gl.getUniformLocation(program,'u'+key));
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
    let pixel = 1;
    function resize() {
      pixel=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*pixel);canvas.height=Math.round(innerHeight*pixel);gl.viewport(0,0,canvas.width,canvas.height);
    }
    function draw(time, hero, gallery, scene, mouse) {
      gl.clearColor(.025,.028,.037,1);gl.clear(gl.COLOR_BUFFER_BIT);
      let shape=0,letter=0,spread=.08,rot=time*.075,scale=1,opacity=.2,center=[0,0];
      if(scene==='hero'){
        letter=ramp(hero,.04,.15)*(1-ramp(hero,.25,.43));
        shape=ramp(hero,.28,.5);spread=ramp(hero,.18,.4)*.3;
        rot=time*.06+hero*6.4*(1-letter);scale=1.05+ramp(hero,.05,.3)*1.2-ramp(hero,.4,.7)*.9;
        opacity=1.05-ramp(hero,.62,1)*.8;center=[lerp(0,.32,ramp(hero,.4,.7)),0];
      }else if(scene==='gallery'){
        shape=1;rot=time*.08+gallery*.65;spread=.3;scale=1.4;opacity=.75;center=[innerWidth<760?0:.3,0];
      }else if(scene==='session'){
        rot=time*.06+hero*.3;scale=1.5;opacity=.25;center=[.25,0];
      }else if(scene==='still') {opacity=.12;scale=1;}
      gl.uniform1f(uniforms.Time,time);gl.uniform1f(uniforms.Shape,shape);gl.uniform1f(uniforms.Letter,letter);
      gl.uniform1f(uniforms.Spread,spread);gl.uniform1f(uniforms.Rot,rot+mouse[0]*.12);gl.uniform1f(uniforms.Scale,scale);
      gl.uniform1f(uniforms.Aspect,innerWidth/innerHeight);gl.uniform1f(uniforms.Pixel,pixel);gl.uniform1f(uniforms.Opacity,opacity);
      gl.uniform2f(uniforms.Center,center[0]+mouse[0]*.015,center[1]-mouse[1]*.015);gl.drawArrays(gl.POINTS,0,count);
    }
    resize();canvas.dataset.renderer='webgl';canvas.dataset.particles=String(count);body.classList.add('webgl-ready');
    canvas.addEventListener('webglcontextlost', event => {event.preventDefault();world=null;body.classList.remove('webgl-ready');canvas.dataset.renderer='fallback';});
    return {resize,draw};
  }

  configure();
  document.fonts.ready.then(() => {
    try {world=createWorld();} catch {canvas.dataset.renderer='fallback';}
    measure();
    if (!enabled) world?.draw(0,0,0,'still',[0,0]);
    else requestFrame();
    syncHash();
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
})();
