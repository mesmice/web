import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Edges,
  Float,
  OrbitControls,
  RoundedBox,
  Sparkles,
  Text
} from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

function OrbitRings({ reducedMotion }: { reducedMotion: boolean }) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ringsRef.current || reducedMotion) return;
    ringsRef.current.rotation.z += delta * 0.08;
    ringsRef.current.rotation.y -= delta * 0.05;
  });

  return (
    <group ref={ringsRef} rotation={[0.42, -0.35, 0.08]}>
      <mesh>
        <torusGeometry args={[2.28, 0.012, 12, 128]} />
        <meshBasicMaterial color="#cabeff" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0.24, 0]}>
        <torusGeometry args={[2.72, 0.008, 12, 128]} />
        <meshBasicMaterial color="#ffffd8" transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[0.55, 0.1, 0.4]}>
        <torusGeometry args={[3.1, 0.005, 12, 128]} />
        <meshBasicMaterial color="#693de9" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function OrbitingNodes({ reducedMotion }: { reducedMotion: boolean }) {
  const nodesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!nodesRef.current || reducedMotion) return;
    nodesRef.current.rotation.y += delta * 0.12;
    nodesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <group ref={nodesRef} rotation={[0.42, -0.35, 0.08]}>
      <group position={[2.18, 0.42, 0.25]}>
        <mesh>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshStandardMaterial color="#ffffd8" emissive="#ffffd8" emissiveIntensity={0.35} />
        </mesh>
        <Text
          position={[0.1, 0.38, 0]}
          fontSize={0.17}
          color="#ffffd8"
          anchorX="center"
          anchorY="middle"
        >
          junto
        </Text>
      </group>
      <group position={[-2.12, -0.7, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#cabeff" emissive="#693de9" emissiveIntensity={0.4} />
        </mesh>
        <Text
          position={[-0.02, -0.35, 0]}
          fontSize={0.16}
          color="#cabeff"
          anchorX="center"
          anchorY="middle"
        >
          conversa
        </Text>
      </group>
      <group position={[0.18, 2.2, -0.3]}>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial color="#ff8e72" emissive="#ff8e72" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function Core({ reducedMotion }: { reducedMotion: boolean }) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!coreRef.current || reducedMotion) return;
    coreRef.current.rotation.y = state.clock.elapsedTime * 0.18;
    coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.04;
  });

  return (
    <group ref={coreRef}>
      <Float
        speed={reducedMotion ? 0 : 1.2}
        rotationIntensity={reducedMotion ? 0 : 0.12}
        floatIntensity={reducedMotion ? 0 : 0.32}
      >
        <RoundedBox args={[2.12, 2.12, 2.12]} radius={0.28} smoothness={8}>
          <meshStandardMaterial
            color="#cabeff"
            emissive="#693de9"
            emissiveIntensity={0.08}
            metalness={0.18}
            roughness={0.24}
          />
          <Edges color="#ffffd8" linewidth={1.4} threshold={15} />
        </RoundedBox>
        <Text
          position={[0, 0.02, 1.08]}
          fontSize={0.64}
          color="#2b1861"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
        >
          m/
        </Text>
        <mesh scale={1.46} rotation={[0.3, 0.2, 0]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial color="#cabeff" wireframe transparent opacity={0.1} />
        </mesh>
      </Float>
    </group>
  );
}

function SceneContent({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <color attach="background" args={['#100d22']} />
      <fog attach="fog" args={['#100d22', 7, 14]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 6]} intensity={3.2} color="#ffffd8" />
      <pointLight position={[-4, -2, 3]} intensity={16} distance={9} color="#693de9" />
      <pointLight position={[3, -1, -4]} intensity={10} distance={8} color="#ff8e72" />
      <Sparkles
        count={reducedMotion ? 18 : 72}
        scale={[7.2, 5.4, 5.6]}
        size={reducedMotion ? 1.1 : 1.7}
        speed={reducedMotion ? 0 : 0.28}
        color="#cabeff"
      />
      <OrbitRings reducedMotion={reducedMotion} />
      <OrbitingNodes reducedMotion={reducedMotion} />
      <Core reducedMotion={reducedMotion} />
      <ContactShadows
        position={[0, -2.15, 0]}
        opacity={0.42}
        scale={5}
        blur={2.8}
        far={4}
        color="#080611"
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.28}
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

export function MesmiceScene() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="scene-shell" aria-label="Uma esfera 3D representando conexões entre pessoas">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.1, 7.4], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        fallback={<div className="scene-fallback">Conexões em movimento</div>}
      >
        <SceneContent reducedMotion={reducedMotion} />
      </Canvas>
      <div className="scene-shell__legend" aria-hidden="true">
        <span className="scene-shell__pulse" />
        pessoas que ficam
      </div>
      <div className="scene-shell__hint" aria-hidden="true">
        arraste para explorar
      </div>
    </div>
  );
}
