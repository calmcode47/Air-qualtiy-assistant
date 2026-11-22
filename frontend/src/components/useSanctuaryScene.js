import { useEffect, useRef } from 'react';
import * as THREE from 'three/src/Three.js';
import { getBand } from './sanctuaryBands';
import { createSanctuarySceneObjects } from './createSanctuarySceneObjects';

function createRng(seed) {
  let s = seed;
  return function () {
    return (s = (s * 16807) % 2147483647) / 2147483647;
  };
}

export default function useSanctuaryScene({ fallbackReason, setFallbackReason, aqi, fanSpeed, isNightMode, isSimpleMode }) {
  const stageRef = useRef(null);
  const labelLidRef = useRef(null);
  const labelHomeRef = useRef(null);
  const labelIndRef = useRef(null);
  const labelBurnRef = useRef(null);
  const sceneControls = useRef({ aqi, fanSpeed, isNightMode, isSimpleMode });

  useEffect(() => {
    sceneControls.current = { aqi, fanSpeed, isNightMode, isSimpleMode };
  }, [aqi, fanSpeed, isNightMode, isSimpleMode]);

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

    const sceneObjects = createSanctuarySceneObjects({
      T, scene, R, facadeTex, softTex, roadTex, sceneControls, isLowPowerDevice
    });
    const { airflowGroup, airflowArrows, PN, pp, pa, pg, SRC, TN, tp, tv, tg2,
      N, sp, su, ss, sg, smat, slabV, lid, lidEdge, pin } = sceneObjects;

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
  }, [fallbackReason, setFallbackReason]);


  return { stageRef, labelLidRef, labelHomeRef, labelIndRef, labelBurnRef };
}
