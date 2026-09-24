import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function ThreeScene({
  status = 'NORMAL',
  rpm = 1200,
  feedRate = 500,
  height = '360px',
  resetSignal = 0
}) {
  const mountRef = useRef(null);
  const coordRef = useRef({ x: 124.5, y: -45.2, z: 28.0 });
  const hudRef = useRef(null);
  // Live coordinate state for HUD re-renders
  const [coords, setCoords] = useState({ x: '124.50', y: '-45.20', z: '28.00' });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // allow slight low-angle view
    controls.minDistance = 10;
    controls.maxDistance = 60;
    controls.target.set(0, 4, 0);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    keyLight.position.set(20, 30, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.2);
    fillLight.position.set(-20, 15, -15);
    scene.add(fillLight);

    // Dynamic Status Accent Spotlight
    const statusLight = new THREE.PointLight(0x10b981, 4.0, 30);
    statusLight.position.set(0, 10, 5);
    scene.add(statusLight);

    // 5. Grid Ground
    const grid = new THREE.GridHelper(50, 50, 0x1e293b, 0x0f172a);
    grid.position.y = -0.05;
    scene.add(grid);

    // 6. Build Procedural Industrial CNC Milling Machine
    const cncGroup = new THREE.Group();

    // Machine Base (Cast Iron Sump Base)
    const baseGeo = new THREE.BoxGeometry(16, 2.5, 14);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.6
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 1.25;
    cncGroup.add(baseMesh);

    // Vertical Machine Column (Z-Axis Column)
    const columnGeo = new THREE.BoxGeometry(6, 14, 7);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.5
    });
    const columnMesh = new THREE.Mesh(columnGeo, columnMat);
    columnMesh.position.set(0, 9.5, -3.5);
    cncGroup.add(columnMesh);

    // Dual Linear Guide Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const railGeo = new THREE.CylinderGeometry(0.2, 0.2, 13, 16);
    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-1.8, 9.5, 0.05);
    cncGroup.add(railL);
    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(1.8, 9.5, 0.05);
    cncGroup.add(railR);

    // Spindle Headstock (Head Casting)
    const headGeo = new THREE.BoxGeometry(5.2, 6, 6.5);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 11, 0.5);
    cncGroup.add(headMesh);

    // Rotating Spindle Assembly (Tool Chuck + Cutter)
    const spindleGroup = new THREE.Group();
    spindleGroup.position.set(0, 8.0, 2.2);

    // Spindle Nose
    const noseGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.6, 24);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    spindleGroup.add(noseMesh);

    // Tool Chuck
    const chuckGeo = new THREE.CylinderGeometry(0.8, 0.9, 1.2, 24);
    const chuckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const chuckMesh = new THREE.Mesh(chuckGeo, chuckMat);
    chuckMesh.position.y = -1.2;
    spindleGroup.add(chuckMesh);

    // Carbide Endmill Tool
    const toolGeo = new THREE.CylinderGeometry(0.25, 0.15, 1.8, 16);
    const toolMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
    const toolMesh = new THREE.Mesh(toolGeo, toolMat);
    toolMesh.position.y = -2.4;
    spindleGroup.add(toolMesh);

    cncGroup.add(spindleGroup);

    // Machining Worktable (T-slot bed)
    const tableGeo = new THREE.BoxGeometry(10, 1.2, 6);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.8
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, 3.1, 1.8);
    cncGroup.add(tableMesh);

    // Workpiece (Aluminum Billet)
    const workGeo = new THREE.BoxGeometry(4, 2.0, 3.2);
    const workMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });
    const workpieceMesh = new THREE.Mesh(workGeo, workMat);
    workpieceMesh.position.set(0, 4.7, 1.8);
    cncGroup.add(workpieceMesh);

    // Dual Coolant Nozzles
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6 });
    const nozzleGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12);
    const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleL.rotation.z = Math.PI / 4;
    nozzleL.position.set(-1.8, 7.5, 2.2);
    cncGroup.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleR.rotation.z = -Math.PI / 4;
    nozzleR.position.set(1.8, 7.5, 2.2);
    cncGroup.add(nozzleR);

    // Status Indicator Halo Light Bar on Top of Column
    const beaconGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 16.7, -3.5);
    cncGroup.add(beaconMesh);

    scene.add(cncGroup);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Dynamic color by status
      let statusColor = 0x10b981; // Green
      if (status === 'CRITICAL') statusColor = 0xef4444; // Red
      else if (status === 'HIGH') statusColor = 0xf97316; // Orange
      else if (status === 'MEDIUM' || status === 'MONITOR') statusColor = 0xeab308; // Yellow

      beaconMat.color.setHex(statusColor);
      statusLight.color.setHex(statusColor);

      // Rotate Spindle when running
      if (status !== 'OFFLINE' && rpm > 0) {
        const speed = Math.min(0.35, (rpm / 1200.0) * 0.20);
        spindleGroup.rotation.y += speed;

        // Slight simulated axis vibration & tool feed movement
        if (status === 'CRITICAL') {
          spindleGroup.position.x = Math.sin(clock.getElapsedTime() * 40) * 0.08;
          spindleGroup.position.z = 2.2 + Math.cos(clock.getElapsedTime() * 35) * 0.08;
        } else {
          spindleGroup.position.x = 0;
          spindleGroup.position.z = 2.2;
        }

        // Live coordinate drift for HUD
        coordRef.current.x = (124.5 + Math.sin(clock.getElapsedTime() * 0.8) * 12.0).toFixed(2);
        coordRef.current.y = (-45.2 + Math.cos(clock.getElapsedTime() * 0.6) * 8.0).toFixed(2);
        coordRef.current.z = (28.0 + Math.sin(clock.getElapsedTime() * 0.4) * 4.0).toFixed(2);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [status, rpm]);

  // Tick HUD coordinate display every 200ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCoords({
        x: coordRef.current.x,
        y: coordRef.current.y,
        z: coordRef.current.z
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Status Styling Badge
  const getBadge = () => {
    switch (status) {
      case 'CRITICAL':
        return { text: 'CRITICAL SEVERITY', bg: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' };
      case 'HIGH':
        return { text: 'HIGH SEVERITY', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 'MEDIUM':
      case 'MONITOR':
        return { text: 'MONITORING', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
      default:
        return { text: 'NORMAL STATE', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
    }
  };

  const badge = getBadge();

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-[#0a0f1d] border border-slate-800 shadow-2xl" style={{ height }}>
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Twin Status Pill & Coordinate HUD */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${badge.bg}`}>
            {badge.text}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 font-mono text-[10px] border border-slate-700/60 backdrop-blur">
            WebGL 3D Twin • Orbit View
          </span>
        </div>

        {/* Real-time Coordinate HUD */}
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
