import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Planet3D: React.FC<{ radius?: number }> = ({ radius = 20 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / 300, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, 300);
    mount.appendChild(renderer.domElement);

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    // Star (a small bright sphere)
    const starGeom = new THREE.SphereGeometry(12, 32, 32);
    const starMat = new THREE.MeshStandardMaterial({ emissive: 0xffd54a, emissiveIntensity: 1.2 });
    const star = new THREE.Mesh(starGeom, starMat);
    star.position.set(0, 0, 0);
    scene.add(star);

    // Planet
    const planetGeom = new THREE.SphereGeometry(Math.max(2, radius / 3), 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, metalness: 0.1, roughness: 0.7 });
    const planet = new THREE.Mesh(planetGeom, planetMat);
    scene.add(planet);

    // Orbit group
    const orbit = new THREE.Group();
    scene.add(orbit);
    orbit.add(planet);
    planet.position.set(40, 0, 0);

    // Draw orbit ring
    const ringGeom = new THREE.RingGeometry(39.5, 40.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Animation
    let req = 0;
    const animate = () => {
      orbit.rotation.y += 0.01;
      planet.rotation.y += 0.02;
      renderer.render(scene, camera);
      req = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const onResize = () => {
      if (!mount) return;
      renderer.setSize(mount.clientWidth, 300);
      camera.aspect = mount.clientWidth / 300;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(req);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [radius]);

  return <div ref={mountRef} style={{ width: '100%', height: 300 }} />;
};

export default Planet3D;
