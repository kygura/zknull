import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function ZShape() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const material = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    metalness: 0.8,
    roughness: 0.2,
    emissive: '#22c55e',
    emissiveIntensity: 0.1,
  });

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: '#22c55e',
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });

  return (
    <group ref={meshRef}>
      {/* Top bar of Z */}
      <mesh position={[0, 0.8, 0]} material={material}>
        <boxGeometry args={[1.6, 0.25, 0.25]} />
      </mesh>
      
      {/* Diagonal of Z */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]} material={material}>
        <boxGeometry args={[2, 0.25, 0.25]} />
      </mesh>
      
      {/* Bottom bar of Z */}
      <mesh position={[0, -0.8, 0]} material={material}>
        <boxGeometry args={[1.6, 0.25, 0.25]} />
      </mesh>

      {/* Outer wireframe cube for brutalist effect */}
      <mesh material={wireframeMaterial}>
        <boxGeometry args={[2.2, 2.2, 0.8]} />
      </mesh>
    </group>
  );
}

export function ZSymbol3D() {
  return (
    <div className="w-32 h-32 md:w-40 md:h-40">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22c55e" />
        <ZShape />
      </Canvas>
    </div>
  );
}
