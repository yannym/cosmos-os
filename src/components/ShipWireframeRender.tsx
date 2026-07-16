import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ShipWireframeRenderProps {
  shipId: string;
  themeHexColor: number;
  width?: number;
  height?: number;
  animate?: boolean;
}

export const ShipWireframeRender: React.FC<ShipWireframeRenderProps> = ({
  shipId,
  themeHexColor,
  width = 160,
  height = 100,
  animate = true
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear previous
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const material = new THREE.MeshBasicMaterial({
      color: themeHexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    const shipGroup = new THREE.Group();

    if (shipId === "interceptor") {
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
    else if (shipId === "freighter") {
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
    else if (shipId === "torpedoboat") {
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
    else if (shipId === "assault_gunship") {
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
    else if (shipId === "science_explorer") {
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
    else if (shipId === "battlecruiser") {
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
    else if (shipId === "heavy_hauler") {
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 7.5), material);
      shipGroup.add(spine);
      const cabin = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 4), material);
      cabin.position.set(0, 0.1, 4.3);
      cabin.rotation.x = Math.PI / 2;
      shipGroup.add(cabin);

      for (let i = 0; i < 4; i++) {
        const offsetZ = -2.2 + (i * 1.5);
        const boxL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.2), material);
        boxL.position.set(-1.3, 0, offsetZ);
        const boxR = boxL.clone();
        boxR.position.x = 1.3;
        shipGroup.add(boxL, boxR);
      }
    }
    else if (shipId === "mining_digger") {
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
    else if (shipId === "ferry_evac") {
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
    else if (shipId === "fuel_tanker") {
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
      // dreadnought / leviathan / default
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

      for (let i = 0; i < 3; i++) {
        const tur = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), material);
        tur.position.set(0, 1.1, -1.0 + (i * 1.5));
        shipGroup.add(tur);
      }
    }

    scene.add(shipGroup);

    let animationId: number;
    let rotationSpeed = 0.005;

    const animateRender = () => {
      animationId = requestAnimationFrame(animateRender);
      if (animate) {
        shipGroup.rotation.y += rotationSpeed;
      }
      renderer.render(scene, camera);
    };

    animateRender();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      material.dispose();
      // Dispose geometries to prevent memory leaks
      shipGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
        }
      });
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shipId, themeHexColor, width, height, animate]);

  return <div ref={mountRef} style={{ width, height }} className="flex justify-center items-center" />;
};
