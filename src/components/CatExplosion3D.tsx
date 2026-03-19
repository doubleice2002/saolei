import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EMOJIS = ['🐱', '😻', '🙀', '😼', '🐟'];
const COUNT_PER_EMOJI = 600;
const TOTAL_COUNT = EMOJIS.length * COUNT_PER_EMOJI;

export default function CatExplosion3D() {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  
  const { positions, velocities, rotations, rotationalVelocities } = useMemo(() => {
    const positions = new Float32Array(TOTAL_COUNT * 3);
    const velocities = new Float32Array(TOTAL_COUNT * 3);
    const rotations = new Float32Array(TOTAL_COUNT * 3);
    const rotationalVelocities = new Float32Array(TOTAL_COUNT * 3);
    
    for (let i = 0; i < TOTAL_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 10 + Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      
      velocities[i * 3] = (Math.random() - 0.5) * 20;
      velocities[i * 3 + 1] = Math.random() * 20 + 5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 20;

      rotations[i * 3] = Math.random() * Math.PI;
      rotations[i * 3 + 1] = Math.random() * Math.PI;
      rotations[i * 3 + 2] = Math.random() * Math.PI;

      rotationalVelocities[i * 3] = (Math.random() - 0.5) * 10;
      rotationalVelocities[i * 3 + 1] = (Math.random() - 0.5) * 10;
      rotationalVelocities[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return { positions, velocities, rotations, rotationalVelocities };
  }, []);

  const textures = useMemo(() => {
    return EMOJIS.map(emoji => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.font = '90px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 64);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    
    let globalIdx = 0;
    for (let e = 0; e < EMOJIS.length; e++) {
      const mesh = refs.current[e];
      if (!mesh) {
        globalIdx += COUNT_PER_EMOJI;
        continue;
      }
      
      for (let i = 0; i < COUNT_PER_EMOJI; i++) {
        let y = positions[globalIdx * 3 + 1];
        let vy = velocities[globalIdx * 3 + 1];
        
        vy -= 40 * dt; // Gravity
        
        if (y < 0.5 && vy < 0) {
          y = 0.5;
          vy = -vy * 0.5; // Bounce
          velocities[globalIdx * 3] *= 0.8; // Friction
          velocities[globalIdx * 3 + 2] *= 0.8;
        }
        
        positions[globalIdx * 3] += velocities[globalIdx * 3] * dt;
        positions[globalIdx * 3 + 1] = y;
        positions[globalIdx * 3 + 2] += velocities[globalIdx * 3 + 2] * dt;
        velocities[globalIdx * 3 + 1] = vy;

        rotations[globalIdx * 3] += rotationalVelocities[globalIdx * 3] * dt;
        rotations[globalIdx * 3 + 1] += rotationalVelocities[globalIdx * 3 + 1] * dt;
        rotations[globalIdx * 3 + 2] += rotationalVelocities[globalIdx * 3 + 2] * dt;

        dummy.position.set(positions[globalIdx * 3], positions[globalIdx * 3 + 1], positions[globalIdx * 3 + 2]);
        dummy.rotation.set(rotations[globalIdx * 3], rotations[globalIdx * 3 + 1], rotations[globalIdx * 3 + 2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        
        globalIdx++;
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {EMOJIS.map((_, idx) => (
        <instancedMesh 
          key={idx} 
          ref={(el) => (refs.current[idx] = el)} 
          args={[undefined, undefined, COUNT_PER_EMOJI]}
          castShadow
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial map={textures[idx]} color="white" />
        </instancedMesh>
      ))}
    </group>
  );
}
