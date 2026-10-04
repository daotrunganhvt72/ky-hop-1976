'use strict';

// A procedural cloth surface. The five-point star belongs to the fabric UVs,
// so it follows the same waves and perspective as the red field.
window.createVietnamFlagWorld = function(canvas) {
  const gl = canvas.getContext('webgl', {alpha:false,antialias:true,powerPreference:'low-power'});
  if (!gl) return null;
  const vertex = `
    attribute vec2 a_uv;
    uniform mediump float u_time;
    uniform float u_aspect, u_scale, u_yaw, u_roll, u_lift;
    uniform vec2 u_offset;
    varying vec2 v_uv;
    varying vec3 v_normal, v_position;
    float wave(vec2 p) {
      float freeEdge = .42 + .58 * (p.x / 9. + .5);
      return freeEdge * (.66*sin(p.x*1.28-u_time*.68)
        + .23*sin(p.x*2.85+p.y*.62-u_time*.94)
        + .07*sin(p.y*2.1+p.x*.46-u_time*.57));
    }
    vec3 orient(vec3 p) {
      float c=cos(u_yaw),s=sin(u_yaw);
      p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      c=cos(u_roll);s=sin(u_roll);
      return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);
    }
    void main() {
      v_uv=a_uv;
      vec2 p=(a_uv-.5)*vec2(9.,6.);
      float z=wave(p);
      vec3 n=normalize(vec3(-(wave(p+vec2(.025,0.))-z)/.025,
        -(wave(p+vec2(0.,.025))-z)/.025,1.));
      v_normal=orient(n);
      vec3 world=orient(vec3(p,z))*u_scale;
      world.xy+=u_offset;
      world.y+=u_lift;
      world.z-=7.2;
      v_position=world;
      float near=.1,far=35.;
      gl_Position=vec4(world.x*1.85/u_aspect,world.y*1.85,
        -((far+near)/(far-near))*world.z-2.*far*near/(far-near),-world.z);
    }`;
  const fragment = `
    precision mediump float;
    varying vec2 v_uv;
    varying vec3 v_normal,v_position;
    uniform float u_star,u_strength,u_time;
    vec2 corner(float i) {
      float angle=i*.6283185307;
      float radius=mod(i,2.)<.5?1.48:.565;
      return vec2(sin(angle),cos(angle))*radius;
    }
    float star(vec2 p) {
      bool inside=false;
      for(int i=0;i<10;i++) {
        vec2 a=corner(float(i)),b=corner(float(i+1));
        if((a.y>p.y)!=(b.y>p.y)) {
          if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
        }
      }
      return inside?1.:0.;
    }
    void main() {
      vec3 normal=normalize(v_normal);
      vec3 light=normalize(vec3(-.6+sin(u_time*.14)*.16,.78,1.25));
      float diffuse=.23+.83*max(dot(normal,light),0.);
      float sheen=pow(max(dot(reflect(-light,normal),normalize(-v_position)),0.),14.);
      float edge=pow(1.-max(normal.z,0.),2.);
      float emblem=star((v_uv-.5)*vec2(9.,6.))*u_star;
      vec3 red=vec3(.74,.023,.052);
      vec3 gold=vec3(1.,.77,.11);
      vec3 material=mix(red,gold,emblem);
      float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.014;
      vec3 color=material*diffuse + vec3(1.,.53,.22)*(sheen*.14+edge*.045)+grain;
      // Keep the center behind the title calm without changing the content layer.
      float readShade=.83+.17*smoothstep(.1,.55,abs(v_uv.x-.5));
      color*=readShade*u_strength;
      gl_FragColor=vec4(color,1.);
    }`;
  function program(vs,fs) {
    const result=gl.createProgram();
    for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]) {
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(result,shader);gl.deleteShader(shader);
    }
    gl.linkProgram(result);
    if(!gl.getProgramParameter(result,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
    return result;
  }
  const cloth=program(vertex,fragment);
  const uniforms=Object.fromEntries(['time','aspect','scale','yaw','roll','lift','offset','star','strength'].map(k=>[k,gl.getUniformLocation(cloth,'u_'+k)]));
  const uv=[],indices=[],cols=84,rows=56;
  for(let y=0;y<=rows;y++) for(let x=0;x<=cols;x++) uv.push(x/cols,y/rows);
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const mesh=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(cloth,'a_uv');
  const sparkle=program(`
    attribute vec4 a_particle;
    uniform float u_time,u_aspect,u_opacity,u_pixel;
    uniform vec2 u_pointer;
    varying float v_alpha;
    void main() {
      float phase=a_particle.w;
      vec3 p=a_particle.xyz;
      p.x+=sin(u_time*.17+phase)*.12+u_pointer.x*.035*(p.z+7.);
      p.y+=cos(u_time*.21+phase)*.10-u_pointer.y*.025*(p.z+7.);
      gl_Position=vec4(p.x*1.85/u_aspect,p.y*1.85,-1.006*p.z-.2006,-p.z);
      gl_PointSize=u_pixel*(1.2+mod(phase,3.))*7./(-p.z);
      v_alpha=u_opacity*(.35+.35*sin(u_time*.4+phase));
    }`, `
    precision mediump float;varying float v_alpha;
    void main() {float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(.12,.5,d))*v_alpha;
      gl_FragColor=vec4(1.,.79,.3,a);}`);
  const particles=[];
  for(let i=0;i<58;i++) particles.push(((i*7919%997)/997-.5)*15,((i*3571%991)/991-.5)*10,-4.-(i%9)*.55,i*1.618);
  const dust=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,dust);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(particles),gl.STATIC_DRAW);
  const particleLocation=gl.getAttribLocation(sparkle,'a_particle');
  const particleUniforms=Object.fromEntries(['time','aspect','opacity','pixel','pointer'].map(k=>[k,gl.getUniformLocation(sparkle,'u_'+k)]));
  let width=innerWidth,height=innerHeight,pixel=1,wasMoving=false,motionTime=0,lastTime=null,lost=false,replacement=null;
  function resize() {
    if(replacement) return replacement.resize();
    width=innerWidth;height=innerHeight;pixel=Math.min(devicePixelRatio||1,width<=760?1.25:1.5);
    canvas.width=Math.round(width*pixel);canvas.height=Math.round(height*pixel);
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  function draw(time,hero,gallery,scene,mouse) {
    if(replacement) return replacement.draw(time,hero,gallery,scene,mouse);
    if(lost) return;
    const moving=scene!=='still';
    // Pause time while reading outside the art scenes, avoiding jumps on re-entry.
    if(moving && wasMoving && lastTime!==null) motionTime+=Math.min(.05,Math.max(0,time-lastTime));
    lastTime=time;wasMoving=moving;
    const t=moving?motionTime:0,aspect=width/height,mobile=width<=760;
    let scale=(mobile?.93:Math.max(1,aspect/1.5)*1.28),yaw=-.11,roll=-.025,lift=.08;
    let offset=[mouse[0]*.14,-mouse[1]*.10],star=.22,strength=.58;
    if(scene==='hero') {
      const travel=Math.min(1,Math.max(0,(hero-.13)/.55));
      scale*=1+travel*.12;yaw+=travel*.25;roll+=travel*.045;
      offset[0]+=(mobile?.15:.42)+travel*(mobile?.45:1.45);
      star=.92-travel*.58;strength=.88-travel*.19;
    } else if(scene==='gallery') {
      offset[0]+=mobile?.15:1.95;star=.32;strength=.58;yaw+=.14+gallery*.035;
    } else if(scene==='session') {
      offset[0]+=mobile?.2:1.85;star=.23;strength=.48;yaw+=.18;
    } else {star=.18;strength=.40;}
    if(moving) {yaw+=Math.sin(t*.22)*.055+mouse[0]*.055;roll+=Math.sin(t*.18)*.012;lift+=Math.sin(t*.24)*.045;}
    gl.clearColor(.075,.008,.018,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(cloth);
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);
    for(const [k,v] of Object.entries({time:t,aspect,scale,yaw,roll,lift,star,strength})) gl.uniform1f(uniforms[k],v);
    gl.uniform2f(uniforms.offset,offset[0],offset[1]);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    gl.disableVertexAttribArray(location);
    gl.useProgram(sparkle);gl.bindBuffer(gl.ARRAY_BUFFER,dust);gl.enableVertexAttribArray(particleLocation);gl.vertexAttribPointer(particleLocation,4,gl.FLOAT,false,0,0);
    gl.uniform1f(particleUniforms.time,t);gl.uniform1f(particleUniforms.aspect,aspect);gl.uniform1f(particleUniforms.pixel,pixel);
    gl.uniform1f(particleUniforms.opacity,scene==='hero'?.36:.14);gl.uniform2f(particleUniforms.pointer,mouse[0],mouse[1]);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.drawArrays(gl.POINTS,0,particles.length/4);gl.depthMask(true);gl.disableVertexAttribArray(particleLocation);
    canvas.dataset.frame=String(Math.round(t*100));
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.style.opacity='0';});
  canvas.addEventListener('webglcontextrestored',()=>{
    if(replacement) return;
    replacement=window.createVietnamFlagWorld(canvas);
    canvas.style.opacity='';
  });
  resize();canvas.dataset.renderer='webgl';canvas.dataset.background='vietnam-flag-3d';
  document.body.classList.add('star-ready','flag-3d-ready');
  return {resize,draw};
};
