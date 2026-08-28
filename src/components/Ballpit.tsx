import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface BallpitProps {
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface SphereData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  mass: number;
}

export const Ballpit: React.FC<BallpitProps> = ({
  count = 100,
  gravity = 0.3,
  friction = 1,
  wallBounce = 0.9,
  followCursor = false,
  colors = ['#ffffff', '#000000'],
  minSize = 0.5,
  maxSize = 1.15,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const configRef = useRef({
    count,
    gravity,
    friction,
    wallBounce,
    followCursor,
    colors,
    minSize,
    maxSize,
  });

  useEffect(() => {
    configRef.current = {
      count,
      gravity,
      friction,
      wallBounce,
      followCursor,
      colors,
      minSize,
      maxSize,
    };
  }, [count, gravity, friction, wallBounce, followCursor, colors, minSize, maxSize]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x90b0ff, 1.0);
    dirLight2.position.set(-10, -10, 8);
    scene.add(dirLight2);

    // Compute visible bounds at z = 0
    const getBounds = () => {
      const fovRad = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      return {
        left: -visibleWidth / 2,
        right: visibleWidth / 2,
        top: visibleHeight / 2,
        bottom: -visibleHeight / 2,
        front: 3.5,
        back: -3.5,
      };
    };

    let bounds = getBounds();

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
    });

    const activeCount = configRef.current.count;
    const instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, activeCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);

    // Create particles
    const particles: SphereData[] = [];
    const colorObjects = configRef.current.colors.map((c) => new THREE.Color(c));

    for (let i = 0; i < activeCount; i++) {
      const radius =
        configRef.current.minSize +
        Math.random() * (configRef.current.maxSize - configRef.current.minSize);
      
      const col = colorObjects[i % colorObjects.length].clone();
      if (col.getHexString() === '000000') {
        col.setHex(0x1a1a1e); // deep slate/black tone
      }

      particles.push({
        x: (Math.random() - 0.5) * (bounds.right - bounds.left) * 0.8,
        y: bounds.bottom + radius + Math.random() * (bounds.top - bounds.bottom) * 0.8,
        z: (Math.random() - 0.5) * 3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        radius,
        mass: radius * radius * radius,
      });

      instancedMesh.setColorAt(i, col);
    }
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    const dummy = new THREE.Object3D();

    // Mouse / Cursor interaction
    const pointer = {
      worldX: 0,
      worldY: 0,
      isDown: false,
      hasMoved: false,
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      const vector = new THREE.Vector3(normX, normY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));

      pointer.worldX = worldPos.x;
      pointer.worldY = worldPos.y;
      pointer.hasMoved = true;
    };

    const onMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);
    const onMouseDown = (e: MouseEvent) => {
      pointer.isDown = true;
      updatePointer(e.clientX, e.clientY);
      // Impulse on click
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - pointer.worldX;
        const dy = p.y - pointer.worldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5.0) {
          const force = (1 - dist / 5.0) * 1.5;
          p.vx += (dx / (dist || 0.1)) * force;
          p.vy += (dy / (dist || 0.1)) * force + 0.6;
        }
      }
    };
    const onMouseUp = () => { pointer.isDown = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.isDown = true;
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => { pointer.isDown = false; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      bounds = getBounds();
    });
    resizeObserver.observe(container);

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const conf = configRef.current;
      const g = conf.gravity * 28;
      const f = Math.pow(conf.friction, dt * 60) * 0.995;
      const bounce = conf.wallBounce;
      const numParticles = particles.length;

      // Update positions
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.vy -= g * dt;
        p.vx *= f;
        p.vy *= f;
        p.vz *= f;

        if (conf.followCursor && pointer.hasMoved) {
          const dx = pointer.worldX - p.x;
          const dy = pointer.worldY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 8.0 && dist > 0.1) {
            const pull = (1 - dist / 8.0) * 0.6;
            p.vx += (dx / dist) * pull;
            p.vy += (dy / dist) * pull;
          }
        } else if (pointer.isDown || pointer.hasMoved) {
          const dx = p.x - pointer.worldX;
          const dy = p.y - pointer.worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 4.0 && dist > 0.05) {
            const push = (1 - dist / 4.0) * 1.0;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
          }
        }

        p.x += p.vx * dt * 10;
        p.y += p.vy * dt * 10;
        p.z += p.vz * dt * 10;

        // Boundaries
        if (p.y - p.radius < bounds.bottom) {
          p.y = bounds.bottom + p.radius;
          p.vy = -p.vy * bounce;
          p.vx *= 0.96;
        }
        if (p.y + p.radius > bounds.top) {
          p.y = bounds.top - p.radius;
          p.vy = -p.vy * bounce;
        }
        if (p.x - p.radius < bounds.left) {
          p.x = bounds.left + p.radius;
          p.vx = -p.vx * bounce;
        }
        if (p.x + p.radius > bounds.right) {
          p.x = bounds.right - p.radius;
          p.vx = -p.vx * bounce;
        }
        if (p.z + p.radius > bounds.front) {
          p.z = bounds.front - p.radius;
          p.vz = -p.vz * bounce;
        }
        if (p.z - p.radius < bounds.back) {
          p.z = bounds.back + p.radius;
          p.vz = -p.vz * bounce;
        }
      }

      // Ball collisions
      for (let i = 0; i < numParticles; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          const minDist = p1.radius + p2.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            const overlap = (minDist - dist) * 0.5;
            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p1.z -= nz * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;
            p2.z += nz * overlap;

            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const kz = p1.vz - p2.vz;
            const p = 2 * (nx * kx + ny * ky + nz * kz) / (p1.mass + p2.mass);

            if (p > 0) {
              const restitution = bounce * 0.95;
              p1.vx -= p * p2.mass * nx * restitution;
              p1.vy -= p * p2.mass * ny * restitution;
              p1.vz -= p * p2.mass * nz * restitution;

              p2.vx += p * p1.mass * nx * restitution;
              p2.vy += p * p1.mass * ny * restitution;
              p2.vz += p * p1.mass * nz * restitution;
            }
          }
        }
      }

      // Render instances
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(p.radius, p.radius, p.radius);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);

      sphereGeometry.dispose();
      sphereMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="ballpit-container"
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        id="ballpit-canvas"
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
export default Ballpit;
