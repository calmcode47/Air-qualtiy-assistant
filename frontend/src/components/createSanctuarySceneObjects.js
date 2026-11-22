export function createSanctuarySceneObjects({ T, scene, R, facadeTex, softTex, roadTex, sceneControls, isLowPowerDevice }) {
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

    return {
      airflowGroup, airflowArrows, PN, pp, pa, pg, SRC, TN, tp, tv, tg2,
      N, sp, su, ss, sg, smat, slabV, lid, lidEdge, pin
    };
}
