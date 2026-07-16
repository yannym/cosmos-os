/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SHIPS_BLUEPRINTS } from "../constants";
import { ShipBlueprint } from "../types";
import { AudioEngine } from "../audio";

interface HologramShipyardProps {
  activeShipId: string;
  onPurchase: (shipId: string) => void;
  credits: number;
  themeColor: "green" | "amber" | "cyan";
  currentCrewCount: number;
  stationTechLevel: number;
}

export const HologramShipyard: React.FC<HologramShipyardProps> = ({
  activeShipId,
  onPurchase,
  credits,
  themeColor,
  currentCrewCount,
  stationTechLevel
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string>(activeShipId);

  const filteredShips = Object.keys(SHIPS_BLUEPRINTS).filter(key => {
      const ship = SHIPS_BLUEPRINTS[key];
      // Rare ships (tech level > 5) only at high tech stations
      if (ship.price > 10000 && stationTechLevel < 5) return false;
      return true;
  });

  const selectedShipIdToUse = filteredShips.includes(selectedShipId) ? selectedShipId : filteredShips[0];
  const selectedShip = SHIPS_BLUEPRINTS[selectedShipIdToUse] || SHIPS_BLUEPRINTS.interceptor;

  // Track color maps
  const getThemeHexColor = () => {
    if (themeColor === "amber") return 0xffb000;
    if (themeColor === "cyan") return 0x00ffff;
    return 0x33ff33;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Set up scene, camera, renderer
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear previous children
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Build Ship Mesh Group based on selectedShipId
    const hexColor = getThemeHexColor();
    const material = new THREE.MeshBasicMaterial({
      color: hexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    const shipGroup = new THREE.Group();

    if (selectedShipId === "interceptor") {
      const bodyGeo = new THREE.ConeGeometry(1.2, 4.2, 6);
      const body = new THREE.Mesh(bodyGeo, material);
      body.rotation.x = Math.PI / 2;
      shipGroup.add(body);

      const wingGeo = new THREE.BoxGeometry(4.8, 0.1, 1.2);
      const wings = new THREE.Mesh(wingGeo, material);
      wings.position.set(0, -0.4, -0.6);
      shipGroup.add(wings);

      const leftEng = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 4), material);
      leftEng.position.set(-0.7, -0.3, -1.8);
      leftEng.rotation.x = Math.PI / 2;
      const rightEng = leftEng.clone();
      rightEng.position.x = 0.7;
      shipGroup.add(leftEng, rightEng);

      const laserL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4), material);
      laserL.position.set(-1.8, -0.4, 0.1);
      laserL.rotation.x = Math.PI / 2;
      const laserR = laserL.clone();
      laserR.position.x = 1.8;
      shipGroup.add(laserL, laserR);
    } 
    else if (selectedShipId === "freighter") {
      const coreGeo = new THREE.BoxGeometry(1.3, 1.3, 6.0);
      const core = new THREE.Mesh(coreGeo, material);
      shipGroup.add(core);

      const cabGeo = new THREE.ConeGeometry(0.9, 1.6, 5);
      const cab = new THREE.Mesh(cabGeo, material);
      cab.position.set(0, 0.15, 3.5);
      cab.rotation.x = Math.PI / 2;
      shipGroup.add(cab);

      for (let i = 0; i < 3; i++) {
        const crateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.1), material);
        crateLeft.position.set(-1.1, 0, -1.6 + (i * 1.5));
        const crateRight = crateLeft.clone();
        crateRight.position.x = 1.1;
        shipGroup.add(crateLeft, crateRight);
      }

      const rad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 3.5), material);
      rad.position.set(0, 1.1, -0.8);
      shipGroup.add(rad);
    } 
    else if (selectedShipId === "torpedoboat") {
      const wedgeGeo = new THREE.CylinderGeometry(0.2, 1.5, 4.8, 4);
      const wedge = new THREE.Mesh(wedgeGeo, material);
      wedge.rotation.x = Math.PI / 2;
      shipGroup.add(wedge);

      const launcherL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 3.0), material);
      launcherL.position.set(-1.4, -0.15, -0.4);
      const launcherR = launcherL.clone();
      launcherR.position.x = 1.4;
      shipGroup.add(launcherL, launcherR);

      const finL = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 3), material);
      finL.position.set(-1.8, -0.3, -1.8);
      finL.rotation.z = -Math.PI / 4;
      const finR = finL.clone();
      finR.position.x = 1.8;
      finR.rotation.z = Math.PI / 4;
      shipGroup.add(finL, finR);
    } 
    else if (selectedShipId === "assault_gunship") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 4.0, 5), material);
      body.rotation.x = Math.PI / 2;
      shipGroup.add(body);

      const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.3), material);
      wingL.position.set(-1.6, 0, 0.1);
      const wingR = wingL.clone();
      wingR.position.x = 1.6;
      shipGroup.add(wingL, wingR);

      const podL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 2.0), material);
      podL.position.set(-2.6, -0.05, 0.3);
      const podR = podL.clone();
      podR.position.x = 2.6;
      shipGroup.add(podL, podR);

      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 4), material);
      turret.position.set(0, -0.8, 0.9);
      turret.rotation.x = Math.PI / 2;
      shipGroup.add(turret);
    } 
    else if (selectedShipId === "science_explorer") {
      const dish = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.7, 10), material);
      dish.position.set(0, 0, 3.2);
      dish.rotation.x = -Math.PI / 2;
      shipGroup.add(dish);

      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.5, 6), material);
      spine.rotation.x = Math.PI / 2;
      shipGroup.add(spine);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.2, 6, 20), material);
      ring.position.set(0, 0, -0.9);
      shipGroup.add(ring);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 4), material);
      mast.position.set(0, 1.5, 3.0);
      shipGroup.add(mast);
    } 
    else if (selectedShipId === "battlecruiser") {
      const deckLeft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 7.0), material);
      deckLeft.position.x = -0.9;
      const deckRight = deckLeft.clone();
      deckRight.position.x = 0.9;
      shipGroup.add(deckLeft, deckRight);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 1.6), material);
      bridge.position.set(0, 0.8, 1.3);
      shipGroup.add(bridge);

      const stabilizer = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 4, 16), material);
      stabilizer.position.set(0, 0, -1.3);
      shipGroup.add(stabilizer);

      const engines = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.6, 8), material);
      engines.position.set(0, 0, -4.0);
      engines.rotation.x = Math.PI / 2;
      shipGroup.add(engines);
    } 
    else if (selectedShipId === "heavy_hauler") {
      // Large cargo hauler mesh with prominent container stacks
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 7.5), material);
      shipGroup.add(spine);

      const cabin = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 4), material);
      cabin.position.set(0, 0.1, 4.3);
      cabin.rotation.x = Math.PI / 2;
      shipGroup.add(cabin);

      // 4 massive container pods on sides
      for (let i = 0; i < 4; i++) {
        const offsetZ = -2.2 + (i * 1.5);
        const boxL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.2), material);
        boxL.position.set(-1.3, 0, offsetZ);
        const boxR = boxL.clone();
        boxR.position.x = 1.3;
        shipGroup.add(boxL, boxR);
      }
    }
    else if (selectedShipId === "mining_digger") {
      // Mining barge with a giant drill/laser cone
      const core = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 5.0), material);
      shipGroup.add(core);

      const drill = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.5, 6), material);
      drill.position.set(0, 0, 3.4);
      drill.rotation.x = Math.PI / 2;
      shipGroup.add(drill);

      const braceL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 3.5), material);
      braceL.position.set(-1.25, 0, 0.5);
      const braceR = braceL.clone();
      braceR.position.x = 1.25;
      shipGroup.add(braceL, braceR);
    }
    else if (selectedShipId === "ferry_evac") {
      // Long multi-window passenger ferry liner
      const hullMain = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.6, 6.5), material);
      shipGroup.add(hullMain);

      const prow = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.0, 4), material);
      prow.position.set(0, 0, 4.25);
      prow.rotation.x = Math.PI / 2;
      shipGroup.add(prow);

      const engineBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.5, 6), material);
      engineBlock.position.set(0, 0, -3.8);
      engineBlock.rotation.x = Math.PI / 2;
      shipGroup.add(engineBlock);
    }
    else if (selectedShipId === "fuel_tanker") {
      // Fuel tanker with huge twin storage canisters
      const centerJoint = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 4.0), material);
      shipGroup.add(centerJoint);

      const tankL = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 5.2, 8), material);
      tankL.position.set(-1.3, 0, 0);
      tankL.rotation.x = Math.PI / 2;
      const tankR = tankL.clone();
      tankR.position.x = 1.3;
      shipGroup.add(tankL, tankR);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.0), material);
      bridge.position.set(0, 0.8, -1.8);
      shipGroup.add(bridge);
    }
    else {
      // dreadnought / leviathan
      const prow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.5, 3), material);
      prow.position.set(0, 0, 3.5);
      prow.rotation.x = Math.PI / 2;
      prow.rotation.y = Math.PI;
      shipGroup.add(prow);

      const core = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 5.5), material);
      shipGroup.add(core);

      const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 2.2), material);
      wingLeft.position.set(-2.9, 0, -1.3);
      wingLeft.rotation.y = -Math.PI / 6;
      const wingRight = wingLeft.clone();
      wingRight.position.x = 2.9;
      wingRight.rotation.y = Math.PI / 6;
      shipGroup.add(wingLeft, wingRight);

      for (let i = 0; i < 2; i++) {
        const tur = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), material);
        tur.position.set(0, 1.2, 0.8 - (i * 2.2));
        shipGroup.add(tur);
      }
    }

    scene.add(shipGroup);

    // Rotation & interactions
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !shipGroup) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      shipGroup.rotation.y += dx * 0.01;
      shipGroup.rotation.x += dy * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Handle touch interactions
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !shipGroup || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - prevMousePos.x;
      const dy = e.touches[0].clientY - prevMousePos.y;
      shipGroup.rotation.y += dx * 0.01;
      shipGroup.rotation.x += dy * 0.01;
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    container.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (shipGroup && !isDragging) {
        shipGroup.rotation.y += 0.005;
        shipGroup.rotation.z += 0.001;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let resizeFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }
      resizeFrameId = requestAnimationFrame(() => {
        handleResize();
      });
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      resizeObserver.disconnect();

      // Dispose WebGL/Three.js resources to prevent memory leaks
      renderer.dispose();
      material.dispose();
      shipGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
        }
      });
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedShipId, themeColor]);

  const handleShipClick = (id: string) => {
    AudioEngine.playBeep(450, 0.05);
    setSelectedShipId(id);
  };

  const handlePurchaseClick = () => {
    if (selectedShipId === activeShipId) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    if (credits < selectedShip.price) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    if (currentCrewCount > selectedShip.maxCrew) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    onPurchase(selectedShipId);
  };

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  const getRarityStyleClass = (id: string) => {
    if (id === "battlecruiser") return "text-orange-500";
    if (id === "void_leviathan") return "text-fuchsia-500 font-bold animate-pulse";
    return "";
  };

  return (
    <div id="viewport-three-shipyard" className="flex-grow flex flex-col font-mono p-1">
      <div className="flex justify-between items-center border-b border-current pb-2 mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center">
          <span className="mr-2">🛸</span> HOLOGRAM VESSEL ACQUISITION DOCK
        </h3>
        <span className="text-[10px] opacity-75">DRAG MODEL TO ROTATE WIREFRAME</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
        {/* Left list of ships */}
        <div className="md:col-span-5 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredShips.map((key) => {
            const ship = SHIPS_BLUEPRINTS[key];
            const isOwned = activeShipId === key;
            const isSelected = selectedShipIdToUse === key;

            return (
              <div
                key={key}
                id={`shipyard-vessel-${key}`}
                onClick={() => handleShipClick(key)}
                className={`p-3 border rounded text-xs transition cursor-pointer flex flex-col justify-between bg-black/60 ${
                  isOwned
                    ? "border-yellow-400 text-yellow-400 bg-yellow-500/10 shadow-[0_0_5px_rgba(234,179,8,0.2)]"
                    : isSelected
                    ? "border-current bg-current/10 shadow-[0_0_8px_rgba(51,255,51,0.2)]"
                    : "border-current/30 hover:bg-current/5"
                }`}
              >
                <div className="flex justify-between font-bold">
                  <span className={getRarityStyleClass(key)}>[ {ship.name.toUpperCase()} ]</span>
                  <span className="font-mono text-yellow-400">{isOwned ? "OWNED" : `${ship.price} CR`}</span>
                </div>
                <div className="text-[10px] opacity-80 mt-1">{ship.perk}</div>
              </div>
            );
          })}
        </div>

        {/* 3D area & stats */}
        <div className="md:col-span-7 border border-current/30 rounded bg-black/60 relative overflow-hidden flex flex-col min-h-[220px]">
          <div
            ref={mountRef}
            id="threejs-canvas-holder"
            className="w-full flex-grow relative cursor-grab active:cursor-grabbing min-h-[160px]"
          />
          <div id="threejs-ship-specs" className="p-3 bg-black/90 border-t border-current/20 text-xs space-y-2">
            <div className={`font-bold border-b border-dashed border-current pb-1 mb-2 ${themeTextClass}`}>
              {selectedShip.name.toUpperCase()} SPECIFICATIONS
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] leading-tight text-current/90">
              <div>Hull Integrity: <strong className="text-white">{selectedShip.maxHull} pts</strong></div>
              <div>Shield Capacitance: <strong className="text-white">{selectedShip.maxShield} pts</strong></div>
              <div>Reactor Warp Fuel: <strong className="text-white">{selectedShip.maxFuel} Max</strong></div>
              <div>Jump Rate Burn: <strong className="text-white">{selectedShip.fuelConsumption} per sector</strong></div>
              <div>Cargo Cells: <strong className="text-white">{selectedShip.cargoSlots} Bays</strong></div>
              <div>Bridge Stations: <strong className="text-white">{selectedShip.maxCrew} Crew Berths</strong></div>
              <div className="col-span-2 text-yellow-500/90 text-[10px] italic pt-1">{selectedShip.perk}</div>
            </div>

            <button
              id={`buy-ship-${selectedShip.id}`}
              onClick={handlePurchaseClick}
              disabled={selectedShipId === activeShipId || credits < selectedShip.price || currentCrewCount > selectedShip.maxCrew}
              className={`mt-3 w-full py-2.5 border border-current font-bold rounded text-center transition ${
                selectedShipId === activeShipId
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/40 cursor-not-allowed"
                  : credits < selectedShip.price
                  ? "border-red-500/40 text-red-500/60 bg-red-950/10 cursor-not-allowed"
                  : currentCrewCount > selectedShip.maxCrew
                  ? "border-amber-600/40 text-amber-500/60 bg-amber-950/10 cursor-not-allowed"
                  : "bg-current/20 hover:bg-current hover:text-black cursor-pointer"
              }`}
            >
              {selectedShipId === activeShipId
                ? "[ PILOTING ACTIVE VESSEL FRAME ]"
                : credits < selectedShip.price
                ? `[ REQUIRES ${selectedShip.price} CR - INSUFFICIENT ACCOUNT BALANCE ]`
                : currentCrewCount > selectedShip.maxCrew
                ? `[ REQUIRES MAX ${selectedShip.maxCrew} CREW (YOU HAVE ${currentCrewCount}) ]`
                : `[ ACQUIRE ${selectedShip.name.toUpperCase()} - ${selectedShip.price} CR ]`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
