import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Pyramid() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });
  const green = "#22c55e";
  const gray = "#0f212dff;"
  const variant = "#ac2bcdff";
  return (
    <group ref={groupRef}>
      {/* Main pyramid wireframe */}
      <mesh>
        <coneGeometry args={[1.5, 2.2, 4, 1]} />
        <meshBasicMaterial color={gray} wireframe transparent opacity={0.9} />
      </mesh>
      
      {/* Inner solid with low opacity */}
      <mesh>
        <coneGeometry args={[1.5, 2.2, 4, 1]} />
        <meshBasicMaterial color={gray} transparent opacity={0.05} />
      </mesh>

      {/* Outer wireframe frame */}
      <mesh scale={1.15}>
        <coneGeometry args={[1.5, 2.2, 4, 1]} />
        <meshBasicMaterial color={gray} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function WireframePyramid() {
  return (
    <div className="w-40 h-40 md:w-56 md:h-56">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Pyramid />
      </Canvas>
    </div>
  );
}
