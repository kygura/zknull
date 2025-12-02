import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Hand() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  const wireframeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#22c55e',
    wireframe: true,
    transparent: true,
    opacity: 0.9,
  }), []);

  const solidMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#22c55e',
    transparent: true,
    opacity: 0.05,
  }), []);

  // Palm - elongated box
  const palmGeom = useMemo(() => new THREE.BoxGeometry(1.2, 1.6, 0.4, 3, 4, 2), []);
  
  // Finger segment geometries
  const fingerBaseGeom = useMemo(() => new THREE.BoxGeometry(0.22, 0.5, 0.25, 2, 2, 1), []);
  const fingerMidGeom = useMemo(() => new THREE.BoxGeometry(0.18, 0.45, 0.22, 2, 2, 1), []);
  const fingerTipGeom = useMemo(() => new THREE.BoxGeometry(0.15, 0.35, 0.18, 2, 2, 1), []);
  
  // Thumb geometries
  const thumbBaseGeom = useMemo(() => new THREE.BoxGeometry(0.25, 0.4, 0.28, 2, 2, 1), []);
  const thumbTipGeom = useMemo(() => new THREE.BoxGeometry(0.2, 0.35, 0.24, 2, 2, 1), []);

  const fingerPositions = [
    { x: -0.4, baseRot: 0.1, midRot: 0.15, tipRot: 0.2 },   // Index
    { x: -0.13, baseRot: 0.05, midRot: 0.1, tipRot: 0.15 }, // Middle
    { x: 0.13, baseRot: 0.08, midRot: 0.12, tipRot: 0.18 }, // Ring
    { x: 0.4, baseRot: 0.15, midRot: 0.2, tipRot: 0.25 },   // Pinky
  ];

  return (
    <group ref={groupRef} rotation={[0.3, 0, 0.2]} position={[0, -0.3, 0]}>
      {/* Palm */}
      <mesh geometry={palmGeom} material={wireframeMaterial} />
      <mesh geometry={palmGeom} material={solidMaterial} />
      
      {/* Wrist connector */}
      <mesh position={[0, -1.05, 0]} material={wireframeMaterial}>
        <boxGeometry args={[0.9, 0.5, 0.35, 2, 2, 1]} />
      </mesh>
      <mesh position={[0, -1.05, 0]} material={solidMaterial}>
        <boxGeometry args={[0.9, 0.5, 0.35, 2, 2, 1]} />
      </mesh>

      {/* Fingers */}
      {fingerPositions.map((finger, i) => (
        <group key={i} position={[finger.x, 0.8, 0]}>
          {/* Base segment */}
          <group rotation={[finger.baseRot, 0, 0]}>
            <mesh position={[0, 0.25, 0]} geometry={fingerBaseGeom} material={wireframeMaterial} />
            <mesh position={[0, 0.25, 0]} geometry={fingerBaseGeom} material={solidMaterial} />
            
            {/* Middle segment */}
            <group position={[0, 0.5, 0]} rotation={[finger.midRot, 0, 0]}>
              <mesh position={[0, 0.22, 0]} geometry={fingerMidGeom} material={wireframeMaterial} />
              <mesh position={[0, 0.22, 0]} geometry={fingerMidGeom} material={solidMaterial} />
              
              {/* Tip segment */}
              <group position={[0, 0.45, 0]} rotation={[finger.tipRot, 0, 0]}>
                <mesh position={[0, 0.17, 0]} geometry={fingerTipGeom} material={wireframeMaterial} />
                <mesh position={[0, 0.17, 0]} geometry={fingerTipGeom} material={solidMaterial} />
              </group>
            </group>
          </group>
        </group>
      ))}

      {/* Thumb */}
      <group position={[0.7, 0, 0.1]} rotation={[0.3, 0, -0.8]}>
        <mesh position={[0.2, 0, 0]} geometry={thumbBaseGeom} material={wireframeMaterial} />
        <mesh position={[0.2, 0, 0]} geometry={thumbBaseGeom} material={solidMaterial} />
        
        <group position={[0.4, 0, 0]} rotation={[0, 0, -0.3]}>
          <mesh position={[0.17, 0, 0]} geometry={thumbTipGeom} material={wireframeMaterial} />
          <mesh position={[0.17, 0, 0]} geometry={thumbTipGeom} material={solidMaterial} />
        </group>
      </group>

      {/* Subtle glow ring */}
      <mesh position={[0, 0, -0.5]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.8, 2, 6]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function WireframeHand() {
  return (
    <div className="w-48 h-48 md:w-64 md:h-64">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Hand />
      </Canvas>
    </div>
  );
}
