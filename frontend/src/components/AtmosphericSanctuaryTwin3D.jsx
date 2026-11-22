import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/src/Three.js';
import './AtmosphericSanctuaryTwin3D.css';
import AtmosphericFallbackSVG from './AtmosphericFallbackSVG';

// US AQI bands used for the illustrative color scale.
const BANDS = [
  [50, 'GOOD', '#6F9A62', 'Use the current local air-quality guidance for your area.'],
  [100, 'MODERATE', '#6F9A62', 'People unusually sensitive to particle pollution may choose to reduce prolonged outdoor exertion.'],
  [150, 'UNHEALTHY FOR SENSITIVE GROUPS', '#D6B33F', 'Sensitive groups may need to reduce prolonged or strenuous outdoor activity.'],
  [200, 'UNHEALTHY', '#D9822B', 'People in sensitive groups should avoid prolonged outdoor exertion; others may need to limit it.'],
  [300, 'VERY UNHEALTHY', '#B5473A', 'Reduce outdoor exertion and follow current local public-health guidance.'],
  [Infinity, 'HAZARDOUS', '#7A2E3A', 'Avoid outdoor exertion and follow current local public-health guidance.']
];

function getBand(aqi) {
  for (const band of BANDS) {
    if (aqi <= band[0]) return band;
  }
  return BANDS[BANDS.length - 1];
}

/**
 * Check if WebGL context is available in browser
 */
export function isWebGLAvailable() {
  try {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function createRng(seed) {
  let s = seed;
  return function () {
    return (s = (s * 16807) % 2147483647) / 2147483647;
  };
}

export default function AtmosphericSanctuaryTwin3D({
  outdoorAqi = null,
  fanSpeed = 'high',
  setFanSpeed,
  isNightMode = false,
  cityData,
  height,
  showHeader = true,
  showPanel = true,
  isSimpleMode = true
}) {
  const [scenarioAqi, setScenarioAqi] = useState(null);
  const aqi = scenarioAqi ?? Math.min(outdoorAqi ?? 100, 500);
  const purifierOn = fanSpeed !== 'off';
  const [fallbackReason, setFallbackReason] = useState(() => isWebGLAvailable() ? null : 'unavailable');

  const stageRef = useRef(null);

  // Label refs for 3D-to-2D projected annotations
  const labelLidRef = useRef(null);
  const labelHomeRef = useRef(null);
  const labelIndRef = useRef(null);
  const labelBurnRef = useRef(null);

  // The renderer reads the latest controls without rebuilding scene resources.
  const sceneControls = useRef({ aqi, fanSpeed, isNightMode, isSimpleMode });

  useEffect(() => {
    sceneControls.current = { aqi, fanSpeed, isNightMode, isSimpleMode };
  }, [aqi, fanSpeed, isNightMode, isSimpleMode]);

  function handleAqiChange(value) {
    setScenarioAqi(Number(value));
  }

  function handlePurifierToggle(checked) {
    setFanSpeed(checked ? 'high' : 'off');
  }

  useEffect(() => {
    if (fallbackReason) return;

    const stage = stageRef.current;
    if (!stage) return;

    const T = THREE;
    const R = createRng(5);

    // Hardware capability check (Prompt 7 Task 1)
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
    const mem = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? navigator.deviceMemory : 4;
    const isLowPowerDevice = cores <= 4 || mem < 4;

    function cvs(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }

    function mkTexture(c) {
      const t = new T.CanvasTexture(c);
      if (T.SRGBColorSpace) {
        t.colorSpace = T.SRGBColorSpace;
      } else {
        t.encoding = T.sRGBEncoding;
      }
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = 4;
      return t;
    }

    // Procedural Facade Texture
    const facadeTex = (() => {
      const c = cvs(64, 128);
      const x = c.getContext('2d');
      x.fillStyle = '#f2f2f2';
      x.fillRect(0, 0, 64, 128);
      for (let r = 0; r < 8; r++) {
        for (let q = 0; q < 4; q++) {
          x.fillStyle = 'rgba(70,85,105,.38)';
          x.fillRect(q * 16 + 3, r * 16 + 4, 10, 8);
        }
      }
      x.fillStyle = 'rgba(0,0,0,.14)';
      for (let r2 = 0; r2 < 8; r2++) {
        x.fillRect(0, r2 * 16 + 14, 64, 2);
      }
      return mkTexture(c);
    })();

    // Soft Particle Texture
    const softTex = (() => {
      const c = cvs(64, 64);
      const x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(255,255,255,.3)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return new T.CanvasTexture(c);
    })();

    // Road Texture
    const roadTex = (() => {
      const c = cvs(32, 64);
      const x = c.getContext('2d');
      x.fillStyle = '#1b1e25';
      x.fillRect(0, 0, 32, 64);
      x.fillStyle = '#2c313b';
      for (let y = 0; y < 64; y += 32) {
        x.fillRect(15, y, 2, 14);
      }
      const t = mkTexture(c);
      t.repeat.set(1, 28);
      return t;
    })();

    // WebGL Renderer with graceful fallback
    let ren;
    try {
      ren = new T.WebGLRenderer({ antialias: !isLowPowerDevice, alpha: true });
    } catch (err) {
      console.warn('WebGL init failed, switching to 2D SVG fallback:', err);
      facadeTex.dispose();
      softTex.dispose();
      roadTex.dispose();
      // Surface a renderer initialization failure as the accessible diagram.
      // oxlint-disable-next-line react/set-state-in-effect
      setFallbackReason('unavailable');
      return;
    }

    // Cap devicePixelRatio at 1.5 (Prompt 7 Task 1)
    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 1.5);
    ren.setPixelRatio(dpr);
    if (T.SRGBColorSpace) {
      ren.outputColorSpace = T.SRGBColorSpace;
    } else {
      ren.outputEncoding = T.sRGBEncoding;
    }
    ren.toneMapping = T.ACESFilmicToneMapping;
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = isLowPowerDevice ? T.BasicShadowMap : T.PCFSoftShadowMap;

    const domElement = ren.domElement;
    stage.insertBefore(domElement, stage.firstChild);

    // Scene & Fog
    const scene = new T.Scene();
    const dayBackground = new T.Color('#252C37');
    const nightBackground = new T.Color('#0A0C10');
    scene.background = dayBackground.clone();
    scene.fog = new T.FogExp2('#0a0c10', 0.008);

    // Camera
    const cam = new T.PerspectiveCamera(28, 1, 1, 600);

    // Lights
    const ambientLight = new T.HemisphereLight(0xc6d0e0, 0x1a1d24, 0.75);
    scene.add(ambientLight);

    const keyLight = new T.DirectionalLight(0xfff0dc, 1.2);
    keyLight.position.set(-35, 55, 25);
    keyLight.castShadow = true;
    const shadowSize = isLowPowerDevice ? 1024 : 2048;
    keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    const sc = keyLight.shadow.camera;
    sc.left = -40;
    sc.right = 40;
    sc.top = 40;
    sc.bottom = -40;
    sc.far = 160;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new T.DirectionalLight(0x7aa2ff, 0.35);
    rimLight.position.set(40, 20, -40);
    scene.add(rimLight);

    // Ground Slab
    const slab = new T.Mesh(
      new T.BoxGeometry(58, 0.8, 58),
      new T.MeshStandardMaterial({ color: 0x12151a, roughness: 0.9 })
    );
    slab.position.y = -0.4;
    slab.receiveShadow = true;
    scene.add(slab);

    // Road Grid
    const roadMat = new T.MeshStandardMaterial({ map: roadTex, roughness: 0.9 });
    const rl = [];
    for (let k = -4; k <= 3; k++) {
      const c = 3.5 + 7 * k;
      const a = new T.Mesh(new T.PlaneGeometry(2.2, 56), roadMat);
      a.rotation.x = -Math.PI / 2;
      a.position.set(c, 0.02, 0);
      a.receiveShadow = true;
      scene.add(a);

      const b = new T.Mesh(new T.PlaneGeometry(2.2, 56), roadMat);
      b.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      b.position.set(0, 0.022, c);
      b.receiveShadow = true;
      scene.add(b);
      rl.push(c);
    }

    // Towers
    const tcol = ['#d7dae0', '#c3c8d0', '#aeb4be', '#e4e1da', '#9aa1ad'];
    const tm = tcol.map((c) => new T.MeshStandardMaterial({ color: c, map: facadeTex, roughness: 0.6 }));
    const roofMat = new T.MeshStandardMaterial({ color: 0x808690, roughness: 0.8 });

    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (i === 0 && j === 0) continue;
        const d0 = Math.sqrt(i * i + j * j);
        const w = 3.6 + R() * 1.1;
        const dd = 3.6 + R() * 1.1;
        const h = 3.5 + R() * 7 + Math.max(0, 3.5 - d0) * 1.6;

        const g = new T.BoxGeometry(w, h, dd);
        const uv = g.attributes.uv;
        for (let v = 0; v < uv.count; v++) {
          const f = Math.floor(v / 4);
          if (f < 4) {
            uv.setXY(v, uv.getX(v) * ((f < 2 ? dd : w) / 6), uv.getY(v) * (h / 8));
          }
        }
        const sm = tm[Math.floor(R() * 5)];
        const m = new T.Mesh(g, [sm, sm, roofMat, roofMat, sm, sm]);
        m.position.set(i * 7, h / 2, j * 7);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
      }
    }

    // Home Sanctuary
    const home = new T.Group();
    const hm = new T.MeshStandardMaterial({ color: 0xeae5da, roughness: 0.7 });
    const hb = new T.Mesh(new T.BoxGeometry(4.2, 2.4, 3.2), hm);
    hb.position.y = 1.2;
    hb.castShadow = true;
    hb.receiveShadow = true;
    home.add(hb);

    const hr = new T.Mesh(new T.BoxGeometry(4.6, 0.25, 3.6), new T.MeshStandardMaterial({ color: 0x353a43, roughness: 0.6 }));
    hr.position.y = 2.52;
    hr.castShadow = true;
    home.add(hr);

    [-1.1, 1.1].forEach((x) => {
      const w = new T.Mesh(new T.PlaneGeometry(1, 1.1), new T.MeshBasicMaterial({ color: 0xffc27a }));
      w.position.set(x, 1.3, 1.61);
      home.add(w);
    });

    const lawn = new T.Mesh(new T.PlaneGeometry(6, 6), new T.MeshStandardMaterial({ color: 0x1d2a22, roughness: 1 }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = 0.03;
    lawn.receiveShadow = true;
    home.add(lawn);
    scene.add(home);

    const pin = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 6, 6), new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.7 }));
    pin.position.y = 5.7;
    scene.add(pin);

    // Subtle Airflow Arrows showing air passing through the home purifier (no glowing force field dome)
    const airflowGroup = new T.Group();
    const arrowColor = 0x6f9a62; // Calm herbal green
    const airflowArrows = [];

    // Intake arrows drawn inward toward purifier base
    const intakePositions = [
      { dir: new T.Vector3(1, 0, 0), pos: new T.Vector3(-2.2, 0.8, 0) },
      { dir: new T.Vector3(-1, 0, 0), pos: new T.Vector3(2.2, 0.8, 0) },
      { dir: new T.Vector3(0, 0, 1), pos: new T.Vector3(0, 0.8, -2.2) },
      { dir: new T.Vector3(0, 0, -1), pos: new T.Vector3(0, 0.8, 2.2) }
    ];

    intakePositions.forEach(({ dir, pos }) => {
      const arrow = new T.ArrowHelper(dir, pos, 1.4, arrowColor, 0.35, 0.2);
      arrow.line.material.transparent = true;
      arrow.line.material.opacity = 0.5;
      arrow.cone.material.transparent = true;
      arrow.cone.material.opacity = 0.6;
      airflowGroup.add(arrow);
      airflowArrows.push({ arrow, origPos: pos.clone(), dir: dir.clone(), isIntake: true });
    });

    // Clean exhaust arrows discharging upward into the room
    const exhaustPositions = [
      { pos: new T.Vector3(-0.3, 1.4, 0) },
      { pos: new T.Vector3(0.3, 1.4, 0) }
    ];

    exhaustPositions.forEach(({ pos }) => {
      const upDir = new T.Vector3(0, 1, 0);
      const arrow = new T.ArrowHelper(upDir, pos, 1.6, 0x5a8a70, 0.4, 0.22);
      arrow.line.material.transparent = true;
      arrow.line.material.opacity = 0.6;
      arrow.cone.material.transparent = true;
      arrow.cone.material.opacity = 0.7;
      airflowGroup.add(arrow);
      airflowArrows.push({ arrow, origPos: pos.clone(), dir: upDir.clone(), isIntake: false });
    });

    airflowGroup.visible = sceneControls.current.fanSpeed !== 'off';
    scene.add(airflowGroup);

    // Industrial Sources
    const stack = new T.Mesh(
      new T.CylinderGeometry(0.6, 0.9, 9, 12),
      new T.MeshStandardMaterial({ color: 0x6b7078, roughness: 0.7 })
    );
    stack.position.set(-21, 4.5, -21);
    stack.castShadow = true;
    scene.add(stack);

    const burn = new T.Mesh(
      new T.CircleGeometry(3, 24),
      new T.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.55 })
    );
    burn.rotation.x = -Math.PI / 2;
    burn.position.set(21, 0.05, 21);
    scene.add(burn);

    const SRC = [[-21, 9, -21], [21, 0.3, 21]];
    const PN = isLowPowerDevice ? 70 : 160;
    const pp = new Float32Array(PN * 3);
    const pa = new Float32Array(PN);
    for (let n = 0; n < PN; n++) pa[n] = R() * 7;

    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(pp, 3));
    const plume = new T.Points(
      pg,
      new T.PointsMaterial({ map: softTex, size: 3.6, transparent: true, opacity: 0.4, depthWrite: false, color: 0x7a746b })
    );
    plume.frustumCulled = false;
    scene.add(plume);

    // Street Traffic Lights
    const TN = isLowPowerDevice ? 22 : 44;
    const tp = new Float32Array(TN * 3);
    const tv = [];
    for (let q = 0; q < TN; q++) {
      tv.push({
        ax: q % 2,
        c: rl[Math.floor(R() * rl.length)] + (R() < 0.5 ? 0.45 : -0.45),
        p: (R() - 0.5) * 54,
        s: (3 + R() * 3) * (R() < 0.5 ? 1 : -1)
      });
    }
    const tg2 = new T.BufferGeometry();
    tg2.setAttribute('position', new T.BufferAttribute(tp, 3));
    const traffic = new T.Points(
      tg2,
      new T.PointsMaterial({
        map: softTex,
        size: 0.9,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        color: 0xffd9a0,
        blending: T.AdditiveBlending
      })
    );
    traffic.frustumCulled = false;
    scene.add(traffic);

    // Smog Volume Particles (Adapted to hardware tier)
    const N = isLowPowerDevice ? 900 : 2200;
    const sp = new Float32Array(N * 3);
    const su = new Float32Array(N);
    const ss = new Float32Array(N);
    for (let s = 0; s < N; s++) {
      sp[s * 3] = (R() - 0.5) * 56;
      sp[s * 3 + 2] = (R() - 0.5) * 56;
      su[s] = Math.pow(R(), 0.8);
      ss[s] = R() * 6.28;
    }
    const sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    const smat = new T.PointsMaterial({
      map: softTex,
      size: 6,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      color: 0xD9822B
    });
    const smog = new T.Points(sg, smat);
    smog.frustumCulled = false;
    scene.add(smog);

    // Inversion Layer Box & Lid: faint translucent haze band with no glow
    const slabV = new T.Mesh(
      new T.BoxGeometry(58, 1, 58),
      new T.MeshBasicMaterial({ color: 0xD9822B, transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide })
    );
    scene.add(slabV);

    const lid = new T.Mesh(
      new T.PlaneGeometry(58, 58),
      new T.MeshBasicMaterial({ color: 0xD9822B, transparent: true, opacity: 0.05, depthWrite: false, side: T.DoubleSide })
    );
    lid.rotation.x = -Math.PI / 2;
    scene.add(lid);

    const lidEdge = new T.LineSegments(
      new T.EdgesGeometry(new T.PlaneGeometry(58, 58)),
      new T.LineBasicMaterial({ color: 0xD6B33F, transparent: true, opacity: 0.18 })
    );
    lidEdge.rotation.x = -Math.PI / 2;
    scene.add(lidEdge);

    // Vector projection helper for labels
    const wv = new T.Vector3();
    function placeLabel(el, x, y, z, title, subtitle) {
      if (!el) return;
      wv.set(x, y, z).project(cam);
      if (wv.z > 1) {
        el.style.display = 'none';
        return;
      }
      el.style.display = 'block';
      el.style.left = ((wv.x + 1) / 2 * stage.clientWidth) + 'px';
      el.style.top = ((1 - wv.y) / 2 * stage.clientHeight) + 'px';
      const [titleNode, subtitleNode] = el.children;
      if (titleNode.textContent !== title) titleNode.textContent = title;
      if (subtitleNode.textContent !== subtitle) subtitleNode.textContent = subtitle;
    }

    // Reduced motion check
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Camera Orbit Controls
    let th = 0.75;
    let ph = 1.02;
    let rad = 82;
    let autoRotate = !prefersReducedMotion;
    let drag = false;
    let lx = 0;
    let ly = 0;
    const tg = new T.Vector3(0, 4, 0);

    const onPointerDown = (e) => {
      drag = true;
      autoRotate = false;
      lx = e.clientX;
      ly = e.clientY;
      try {
        domElement.setPointerCapture(e.pointerId);
      } catch {}
      domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!drag) return;
      th -= (e.clientX - lx) * 0.006;
      ph = Math.min(1.45, Math.max(0.5, ph - (e.clientY - ly) * 0.006));
      lx = e.clientX;
      ly = e.clientY;
    };

    const onPointerUp = (e) => {
      drag = false;
      try {
        domElement.releasePointerCapture(e.pointerId);
      } catch {}
      domElement.style.cursor = 'grab';
    };

    const onWheel = (e) => {
      e.preventDefault();
      rad = Math.min(110, Math.max(35, rad + e.deltaY * 0.05));
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointercancel', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w === 0 || h === 0) return;
      ren.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    // Clock and animation loop variables
    const clk = new T.Clock();
    const tint = new T.Color();
    const mixColor = new T.Color();
    let H = 14;
    let tgtH = 14;
    let animId = null;

    // Visibility & Viewport Intersection tracking (Prompt 7 Task 2)
    let isIntersecting = true;
    let frameCount = 0;
    let totalFrameTime = 0;
    let lastT = performance.now();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting && !document.hidden && !animId) {
            lastT = performance.now();
            animId = requestAnimationFrame(frame);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(stage);

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        if (isIntersecting && !animId) {
          lastT = performance.now();
          animId = requestAnimationFrame(frame);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const airflowRates = { low: 1.8, med: 2.6, high: 3.5 };

    function frame() {
      animId = null;
      if (!isIntersecting || document.hidden) {
        return; // Pause rendering when offscreen or tab hidden (Prompt 7 Task 2)
      }

      // Quick frame-time benchmark in the first second (Prompt 7 Task 1)
      const now = performance.now();
      if (frameCount < 60) {
        frameCount++;
        totalFrameTime += (now - lastT);
        if (frameCount === 60) {
          const avgFrameMs = totalFrameTime / 60;
          if (avgFrameMs > 33.3) {
            // Low frame rate (<30 FPS): dynamically downscale DPR and throttle shadows
            ren.setPixelRatio(1.0);
            ren.shadowMap.autoUpdate = false;
            ren.shadowMap.needsUpdate = true;
          }
        }
      }
      lastT = now;

      animId = requestAnimationFrame(frame);
      const dt = Math.min(clk.getDelta(), 0.05);
      const t = clk.elapsedTime;

      const { aqi: currentAqi, fanSpeed: currentSpeed, isNightMode: isNight, isSimpleMode: useSimpleLabels } = sceneControls.current;
      const isPur = currentSpeed !== 'off';
      const k = Math.min(1, currentAqi / 500);
      const b = getBand(currentAqi);

      tgtH = 16 - 9 * k;
      H += (tgtH - H) * dt * 2;

      tint.set(b[2]);
      const background = isNight ? nightBackground : dayBackground;
      mixColor.copy(background).lerp(tint, k * 0.16);
      ambientLight.intensity = isNight ? 0.3 : 0.75;
      keyLight.intensity = isNight ? 0.45 : 1.2;
      scene.fog.color.lerp(mixColor, dt * 2);
      scene.background.copy(scene.fog.color);
      scene.fog.density += (0.006 + k * 0.014 - scene.fog.density) * dt * 2;

      smat.color.lerp(tint, dt * 3);
      smat.opacity = 0.06 + k * 0.22;

      slabV.material.color.lerp(tint, dt * 3);
      slabV.material.opacity = 0.03 + k * 0.14;
      slabV.scale.y = H;
      slabV.position.y = H / 2;

      lid.position.y = H;
      lidEdge.position.y = H;
      lidEdge.material.opacity = 0.15 + k * 0.3;

      const cnt = Math.floor(N * Math.max(0.06, k));
      sg.setDrawRange(0, cnt);

      if (!prefersReducedMotion) {
        for (let i = 0; i < cnt; i++) {
          const q = i * 3;
          sp[q] += dt * (0.35 + su[i] * 0.2);
          if (sp[q] > 28) sp[q] = -28;
          sp[q + 1] = (su[i] + Math.sin(t * 0.35 + ss[i]) * 0.035) * H;
        }
        sg.attributes.position.needsUpdate = true;

        // Industrial stack and burning plumes
        for (let n = 0; n < PN; n++) {
          pa[n] += dt;
          if (pa[n] > 7) pa[n] = 0;
          const a = pa[n];
          const s = SRC[n % 2];
          pp[n * 3] = s[0] + a * 1.7 + Math.sin(n * 7.3) * a * 0.5;
          pp[n * 3 + 1] = Math.min(s[1] + a * 2.2, H * 0.96) + Math.sin(n * 2.1) * 0.3;
          pp[n * 3 + 2] = s[2] + Math.cos(n * 3.1) * a * 0.5;
        }
        pg.attributes.position.needsUpdate = true;

        // Traffic flow
        for (let u = 0; u < TN; u++) {
          const v = tv[u];
          v.p += v.s * dt;
          if (v.p > 28) v.p = -28;
          if (v.p < -28) v.p = 28;
          if (v.ax === 0) {
            tp[u * 3] = v.p;
            tp[u * 3 + 2] = v.c;
          } else {
            tp[u * 3] = v.c;
            tp[u * 3 + 2] = v.p;
          }
          tp[u * 3 + 1] = 0.3;
        }
        tg2.attributes.position.needsUpdate = true;
      }

      // Subtle airflow animation passing through home purifier
      airflowGroup.visible = isPur;
      if (isPur) {
        if (!prefersReducedMotion) {
          const rate = airflowRates[currentSpeed];
          airflowArrows.forEach(({ arrow, origPos, dir, isIntake }, idx) => {
            const pulse = Math.sin(t * rate + idx * 1.3) * 0.15;
            if (isIntake) {
              arrow.position.copy(origPos).addScaledVector(dir, pulse);
            } else {
              arrow.position.y = origPos.y + pulse;
            }
          });
        }
      }

      pin.material.opacity = prefersReducedMotion ? 0.7 : 0.5 + Math.sin(t * 2) * 0.2;

      if (autoRotate && !prefersReducedMotion) th += dt * 0.05;

      cam.position.set(
        tg.x + rad * Math.sin(ph) * Math.sin(th),
        tg.y + rad * Math.cos(ph),
        tg.z + rad * Math.sin(ph) * Math.cos(th)
      );
      cam.lookAt(tg);
      cam.updateMatrixWorld();

      placeLabel(labelLidRef.current, -29, H, 29, 'POSSIBLE INVERSION LAYER', 'illustrative position');
      placeLabel(labelHomeRef.current, 0, 6.2, 0, 'HOME FILTER CONCEPT', isPur ? 'FILTER ON' : 'FILTER OFF');
      placeLabel(labelIndRef.current, -21, 9.5, -21,
        useSimpleLabels ? 'FACTORY SMOKE' : 'INDUSTRY', useSimpleLabels ? 'SMOG SOURCE' : 'STACK EMISSIONS');
      placeLabel(labelBurnRef.current, 21, 0.5, 21,
        useSimpleLabels ? 'CROP RESIDUE BURNING' : 'BIOMASS BURNING', useSimpleLabels ? 'SMOG SOURCE' : 'CROP RESIDUE');

      ren.render(scene, cam);
    }

    frame();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      ro.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointercancel', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);

      if (stage.contains(domElement)) {
        stage.removeChild(domElement);
      }

      // Dispose all geometries and materials in scene (Prompt 7 Task 3)
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });

      facadeTex.dispose();
      softTex.dispose();
      roadTex.dispose();
      ren.dispose();
    };
  }, [fallbackReason]);

  const currentBand = getBand(aqi);
  // If WebGL failed or low-power mode chosen, show SVG fallback (Prompt 7 Task 4)
  if (fallbackReason) {
    return (
      <div className={`winter-smog-model-container w-full text-[#14161b] ${height === '100%' ? 'fill-height h-full' : ''}`}>
        <AtmosphericFallbackSVG
          aqi={aqi}
          purifierOn={purifierOn}
          cityData={cityData}
          isSimpleMode={isSimpleMode}
          webGlFailed={fallbackReason === 'unavailable'}
          onTry3D={fallbackReason === 'manual' ? () => setFallbackReason(null) : null}
        />
      </div>
    );
  }

  return (
    <div className={`winter-smog-model-container w-full text-[#14161b] ${height === '100%' ? 'fill-height h-full' : ''}`}>
      {/* Optional Top Title Header */}
      {showHeader && (
        <div className="winter-smog-hd">
          <h2>Air pollution and home filtration</h2>
        </div>
      )}

      {/* Grid Layout: 3D Stage on left, Control & Telemetry Panel on right */}
      <div className={showPanel ? 'winter-smog-layout' : 'w-full h-full flex-1 flex flex-col'}>
        {/* 3D Canvas Stage */}
        <div
          ref={stageRef}
          className={`winter-smog-stage ${height === '100%' ? 'fill-height' : ''} ${!showPanel ? 'no-border' : ''}`}
          style={{ height: height || 'min(72vh, 640px)' }}
        >
          <div className="winter-smog-hint">DRAG TO ROTATE · SCROLL TO ZOOM</div>

          {/* Low-Power 2D Mode Button (Prompt 7 Task 4) */}
          <button
            type="button"
            onClick={() => setFallbackReason('manual')}
            className="absolute top-3 right-3 z-10 bg-[#141822]/85 hover:bg-[#1f2636] text-[#D8E4DC] px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition border border-[#2D333F] flex items-center gap-1 shadow-sm"
            title="Switch to lightweight 2D diagram"
            aria-label="Switch to 2D view"
          >
            <span>2D View</span>
          </button>

          {/* Screen Reader Alternative (Prompt 7 Task 7) */}
          <div className="sr-only" aria-live="polite">
            Interactive illustration. The AQI slider shows a scenario value and is not a local air-quality reading.
            The atmospheric layer and filter effects are illustrative; this view does not estimate indoor PM2.5 or cleaner performance.
          </div>

          {/* 3D-Projected HTML Labels (Keyboard Focusable per Prompt 7 Task 7) */}
          <div
            ref={labelLidRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Inversion Lid Layer"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelHomeRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Your Home Air Quality"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelIndRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Factory Stack Emissions"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelBurnRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Biomass Smoke"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>

          {/* Quick Purifier Action Switch when full panel is hidden */}
          {!showPanel && (
            <button
              type="button"
              onClick={() => handlePurifierToggle(!purifierOn)}
              className="winter-smog-quick-pur"
              title="Toggle home air purifier"
            >
              <span className={`winter-smog-dot ${purifierOn ? 'active' : ''}`} />
              <span>Purifier: {purifierOn ? 'ON' : 'OFF'}</span>
            </button>
          )}
        </div>

        {/* Side Panel Controls & Live Metrics */}
        {showPanel && (
          <div className="winter-smog-panel">
            <div>
              <div className="winter-smog-k">ILLUSTRATIVE AQI SCENARIO</div>
              <div className="winter-smog-aqi-n">{aqi}</div>
              <div
                className="winter-smog-band"
                style={{ color: '#18261F' }}
              >
                {currentBand[1]}
              </div>
            </div>

            <div className="winter-smog-tip">{currentBand[3]}</div>

            {/* AQI Range Slider */}
            <div>
              <input
                type="range"
                min="20"
                max="500"
                value={aqi}
                aria-label="Illustrative AQI scenario value"
                onChange={(e) => handleAqiChange(e.target.value)}
              />
            </div>

            {/* Quick Band Buttons */}
            <div className="winter-smog-chips">
              <button
                type="button"
                className={aqi === 25 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(25)}
              >
                GOOD
              </button>
              <button
                type="button"
                className={aqi === 75 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(75)}
              >
                MODERATE
              </button>
              <button
                type="button"
                className={aqi === 125 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(125)}
              >
                SENSITIVE
              </button>
              <button
                type="button"
                className={aqi === 175 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(175)}
              >
                UNHEALTHY
              </button>
              <button
                type="button"
                className={aqi === 250 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(250)}
              >
                VERY UNHEALTHY
              </button>
              <button
                type="button"
                className={aqi === 350 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(350)}
              >
                HAZARDOUS
              </button>
            </div>

            {/* Air Purifier Toggle */}
            <label className="winter-smog-sw">
              <span>Air purifier at home</span>
              <input
                type="checkbox"
                checked={purifierOn}
                onChange={(e) => handlePurifierToggle(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#14161b]"
              />
            </label>

            {/* Filter illustration note */}
            <div className="winter-smog-k" style={{ minHeight: '14px' }}>
              {purifierOn ? 'FILTER STATUS SHOWN FOR ILLUSTRATION ONLY' : ''}
            </div>

            <div className="winter-smog-note">
              Schematic illustration only. Particle motion, filter effect, and inversion position are not measured or calculated values.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
