import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ─── Per-machine visual identity ─────────────────────────────────────────────
// CNC-M01: Vertical Mill  → tall column, blue accent, vertical spindle
// CNC-M02: Horizontal Mill → wide body, amber accent, horizontal spindle arm
// CNC-M03: Precision Lathe → long bed, emerald accent, rotating chuck on left
const MACHINE_PROFILES = {
  'CNC-M01': {
    baseColor: 0x1e293b,
    columnColor: 0x334155,
    accentHex: 0x3b82f6,    // blue
    label: 'Vertical Milling Center',
    columnH: 14, columnW: 6,
    tableW: 10,
    spindleOffset: { x: 0, y: 8.0, z: 2.2 },
    type: 'VMC',
  },
  'CNC-M02': {
    baseColor: 0x1a2035,
    columnColor: 0x2d3a52,
    accentHex: 0xf59e0b,    // amber
    label: 'Horizontal Milling Center',
    columnH: 11, columnW: 8,
    tableW: 12,
    spindleOffset: { x: 4.5, y: 6.0, z: 0 },
    type: 'HMC',
  },
  'CNC-M03': {
    baseColor: 0x0f2016,
    columnColor: 0x163024,
    accentHex: 0x10b981,    // emerald
    label: 'High-Precision CNC Lathe',
    columnH: 9, columnW: 5,
    tableW: 14,
    spindleOffset: { x: -5, y: 5.5, z: 0 },
    type: 'LATHE',
  },
};

export function ThreeScene({
  machineId = 'CNC-M01',
  status = 'NORMAL',
  rpm = 1200,
  feedRate = 500,
  height = '360px',
}) {
  const mountRef = useRef(null);
  const coordRef = useRef({ x: 124.5, y: -45.2, z: 28.0 });
  const [coords, setCoords] = useState({ x: '124.50', y: '-45.20', z: '28.00' });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const profile = MACHINE_PROFILES[machineId] || MACHINE_PROFILES['CNC-M01'];
    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(22, 16, 24);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 10;
    controls.maxDistance = 60;
    controls.target.set(0, 4, 0);

    // 4. Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    keyLight.position.set(20, 30, 20);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.2);
    fillLight.position.set(-20, 15, -15);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(profile.accentHex, 4.0, 30);
    accentLight.position.set(0, 10, 5);
    scene.add(accentLight);

    // 5. Grid Ground
    const grid = new THREE.GridHelper(50, 50, 0x1e293b, 0x0f172a);
    grid.position.y = -0.05;
    scene.add(grid);

    // 6. Build machine group based on type
    const cncGroup = new THREE.Group();

    // Shared mats
    const baseMat = new THREE.MeshStandardMaterial({ color: profile.baseColor, roughness: 0.7, metalness: 0.6 });
    const columnMat = new THREE.MeshStandardMaterial({ color: profile.columnColor, roughness: 0.5, metalness: 0.5 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const accentMat = new THREE.MeshStandardMaterial({ color: profile.accentHex, metalness: 0.7, roughness: 0.3, emissive: profile.accentHex, emissiveIntensity: 0.3 });
    const headMat = new THREE.MeshStandardMaterial({ color: profile.baseColor, roughness: 0.4, metalness: 0.7 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const chuckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const toolMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
    const workMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });

    // ── Machine Base ──
    const baseGeo = new THREE.BoxGeometry(profile.tableW + 6, 2.5, 14);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 1.25;
    cncGroup.add(baseMesh);

    // ── Machine Column (differs per type) ──
    if (profile.type === 'LATHE') {
      // Lathe: long flat headstock box on left, tailstock on right
      const headstockGeo = new THREE.BoxGeometry(5, 7, 6);
      const headstockMesh = new THREE.Mesh(headstockGeo, columnMat);
      headstockMesh.position.set(-5, 6, -2);
      cncGroup.add(headstockMesh);

      // Lathe bed ways (long horizontal rails)
      const bedGeo = new THREE.BoxGeometry(14, 1.5, 5);
      const bedMesh = new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 }));
      bedMesh.position.set(0, 3.5, -1);
      cncGroup.add(bedMesh);

      // Tailstock
      const tailstockGeo = new THREE.BoxGeometry(3, 5, 4);
      const tailstockMesh = new THREE.Mesh(tailstockGeo, columnMat);
      tailstockMesh.position.set(5.5, 6, -2);
      cncGroup.add(tailstockMesh);

      // Turret tool post
      const turretGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
      const turretMesh = new THREE.Mesh(turretGeo, accentMat);
      turretMesh.position.set(1.5, 5.5, 2);
      cncGroup.add(turretMesh);

    } else if (profile.type === 'HMC') {
      // HMC: wider column, horizontal spindle arm sticking out
      const colGeo = new THREE.BoxGeometry(profile.columnW, profile.columnH, 7);
      const colMesh = new THREE.Mesh(colGeo, columnMat);
      colMesh.position.set(-3, 7.5, -3.5);
      cncGroup.add(colMesh);

      // Horizontal spindle boom arm
      const armGeo = new THREE.BoxGeometry(9, 3.5, 3.5);
      const armMesh = new THREE.Mesh(armGeo, headMat);
      armMesh.position.set(2, 8, 0);
      cncGroup.add(armMesh);

      // Pallet/rotary table on HMC
      const palletGeo = new THREE.CylinderGeometry(3, 3, 1, 32);
      const palletMesh = new THREE.Mesh(palletGeo, new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 }));
      palletMesh.position.set(0, 3.5, 1);
      cncGroup.add(palletMesh);

      // Rails
      const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 16), railMat);
      r1.rotation.z = Math.PI / 2;
      r1.position.set(2, 10, 1);
      cncGroup.add(r1);

    } else {
      // VMC: default vertical column
      const colGeo = new THREE.BoxGeometry(profile.columnW, profile.columnH, 7);
      const colMesh = new THREE.Mesh(colGeo, columnMat);
      colMesh.position.set(0, 9.5, -3.5);
      cncGroup.add(colMesh);

      // Dual Linear Guide Rails
      const railGeo = new THREE.CylinderGeometry(0.2, 0.2, 13, 16);
      const railL = new THREE.Mesh(railGeo, railMat);
      railL.position.set(-1.8, 9.5, 0.05);
      cncGroup.add(railL);
      const railR = new THREE.Mesh(railGeo, railMat);
      railR.position.set(1.8, 9.5, 0.05);
      cncGroup.add(railR);

      // Head
      const headGeo = new THREE.BoxGeometry(5.2, 6, 6.5);
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 11, 0.5);
      cncGroup.add(headMesh);
    }

    // ── Spindle/Chuck Assembly ──
    const spindleGroup = new THREE.Group();
    spindleGroup.position.set(profile.spindleOffset.x, profile.spindleOffset.y, profile.spindleOffset.z);

    if (profile.type === 'LATHE') {
      // Lathe chuck — 3-jaw disc
      const chuckBodyGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.0, 32);
      spindleGroup.add(new THREE.Mesh(chuckBodyGeo, accentMat));
      // Jaw segments
      for (let i = 0; i < 3; i++) {
        const jawGeo = new THREE.BoxGeometry(0.4, 0.4, 1.4);
        const jawMesh = new THREE.Mesh(jawGeo, chuckMat);
        jawMesh.rotation.y = (i / 3) * Math.PI * 2;
        jawMesh.position.set(Math.cos((i / 3) * Math.PI * 2) * 1.1, 0.5, Math.sin((i / 3) * Math.PI * 2) * 1.1);
        spindleGroup.add(jawMesh);
      }
      // Workpiece bar
      const barGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 24);
      const barMesh = new THREE.Mesh(barGeo, workMat);
      barMesh.rotation.z = Math.PI / 2;
      barMesh.position.x = 3;
      spindleGroup.add(barMesh);
    } else {
      // VMC/HMC spindle nose + tool
      const noseGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.6, 24);
      spindleGroup.add(new THREE.Mesh(noseGeo, noseMat));
      const chuckGeo = new THREE.CylinderGeometry(0.8, 0.9, 1.2, 24);
      const chuckMesh = new THREE.Mesh(chuckGeo, chuckMat);
      chuckMesh.position.y = -1.2;
      spindleGroup.add(chuckMesh);
      const toolGeo = new THREE.CylinderGeometry(0.25, 0.15, 1.8, 16);
      const toolMesh = new THREE.Mesh(toolGeo, toolMat);
      toolMesh.position.y = -2.4;
      spindleGroup.add(toolMesh);
    }

    cncGroup.add(spindleGroup);

    // ── Worktable ──
    const tableGeo = new THREE.BoxGeometry(profile.tableW, 1.2, 6);
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, 3.1, 1.8);
    cncGroup.add(tableMesh);

    // Workpiece (VMC/HMC only)
    if (profile.type !== 'LATHE') {
      const workGeo = new THREE.BoxGeometry(4, 2.0, 3.2);
      const workpieceMesh = new THREE.Mesh(workGeo, workMat);
      workpieceMesh.position.set(0, 4.7, 1.8);
      cncGroup.add(workpieceMesh);
    }

    // ── Coolant nozzles ──
    const nozzleMat2 = new THREE.MeshStandardMaterial({ color: profile.accentHex, metalness: 0.6 });
    const nozzleGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12);
    const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat2);
    nozzleL.rotation.z = Math.PI / 4;
    nozzleL.position.set(-1.8, 7.5, 2.2);
    cncGroup.add(nozzleL);
    const nozzleR = new THREE.Mesh(nozzleGeo, nozzleMat2);
    nozzleR.rotation.z = -Math.PI / 4;
    nozzleR.position.set(1.8, 7.5, 2.2);
    cncGroup.add(nozzleR);

    // ── Status Beacon bar (accent colored) ──
    const beaconGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
    const beaconMat = new THREE.MeshBasicMaterial({ color: profile.accentHex });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 16.7, -3.5);
    cncGroup.add(beaconMesh);

    scene.add(cncGroup);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock.getDelta();

      // Dynamic status color
      let statusColor = profile.accentHex;
      if (status === 'CRITICAL') statusColor = 0xef4444;
      else if (status === 'HIGH') statusColor = 0xf97316;
      else if (status === 'MEDIUM' || status === 'MONITOR') statusColor = 0xeab308;

      beaconMat.color.setHex(statusColor);
      accentLight.color.setHex(statusColor);

      // Rotate spindle / chuck when running
      if (status !== 'OFFLINE' && rpm > 0) {
        const speed = Math.min(0.35, (rpm / 1200.0) * 0.20);
        spindleGroup.rotation.y += speed;

        if (status === 'CRITICAL') {
          spindleGroup.position.x = profile.spindleOffset.x + Math.sin(clock.getElapsedTime() * 40) * 0.08;
          spindleGroup.position.z = profile.spindleOffset.z + Math.cos(clock.getElapsedTime() * 35) * 0.08;
        } else {
          spindleGroup.position.x = profile.spindleOffset.x;
          spindleGroup.position.z = profile.spindleOffset.z;
        }

        coordRef.current.x = (124.5 + Math.sin(clock.getElapsedTime() * 0.8) * 12.0).toFixed(2);
        coordRef.current.y = (-45.2 + Math.cos(clock.getElapsedTime() * 0.6) * 8.0).toFixed(2);
        coordRef.current.z = (28.0 + Math.sin(clock.getElapsedTime() * 0.4) * 4.0).toFixed(2);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
    };
  }, [machineId, status, rpm]); // re-build when machine switches

  // Tick HUD every 200ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCoords({ x: coordRef.current.x, y: coordRef.current.y, z: coordRef.current.z });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const getBadge = () => {
    switch (status) {
      case 'CRITICAL': return { text: 'CRITICAL SEVERITY', bg: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' };
      case 'HIGH':     return { text: 'HIGH SEVERITY',     bg: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 'MEDIUM':
      case 'MONITOR':  return { text: 'MONITORING',        bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
      default:         return { text: 'NORMAL STATE',      bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
    }
  };

  const badge = getBadge();
  const profile = MACHINE_PROFILES[machineId] || MACHINE_PROFILES['CNC-M01'];

  // Accent CSS class for label
  const accentClass =
    machineId === 'CNC-M01' ? 'text-blue-400 border-blue-800/50' :
    machineId === 'CNC-M02' ? 'text-amber-400 border-amber-800/50' :
    'text-emerald-400 border-emerald-800/50';

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-[#0a0f1d] border border-slate-800 shadow-2xl" style={{ height }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Status + Machine Label */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${badge.bg}`}>
            {badge.text}
          </span>
          <span className={`px-2 py-0.5 rounded bg-slate-950/90 font-mono text-[10px] border backdrop-blur font-semibold ${accentClass}`}>
            {machineId} — {profile.label}
          </span>
        </div>

        {/* Coordinate HUD */}
        <div className="bg-slate-950/85 border border-slate-800/80 rounded-lg p-2 font-mono text-[11px] text-slate-300 backdrop-blur flex items-center gap-3">
          <div><span className="text-slate-500">X:</span> <strong className="text-cyan-400">{coords.x}</strong></div>
          <div><span className="text-slate-500">Y:</span> <strong className="text-indigo-400">{coords.y}</strong></div>
          <div><span className="text-slate-500">Z:</span> <strong className="text-purple-400">{coords.z}</strong></div>
          <div className="border-l border-slate-800 pl-2"><span className="text-slate-500">Feed:</span> <strong className="text-emerald-400">{feedRate} mm/m</strong></div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800/60 backdrop-blur">
        Drag to Rotate • Scroll to Zoom • Right-click to Pan
      </div>
    </div>
  );
}
