import { useMemo, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { PlyData } from "@/lib/ply";

interface Props {
  data: PlyData;
  density: number;
  colorMode: "rgb" | "depth" | "opacity";
  separationMode: "all" | "static" | "dynamic" | "split";
  pointSize: number;
  autoRotate?: boolean;
}

// Renders a 3DGS-style point cloud using THREE.Points with depth-sorted alpha-blended sprites.
const PointCloud = ({ data, density, colorMode, separationMode, pointSize }: Omit<Props, "autoRotate">) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  // Build geometry once per data + mode change.
  const { geometry, material, sortedIndex, positions, colors, sizes, alphas, dynamicFlags } = useMemo(() => {
    const n = data.points.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const alphas = new Float32Array(n);
    const dynamicFlags = new Uint8Array(n);

    let maxD = 0.001;
    for (const p of data.points) {
      const d = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (d > maxD) maxD = d;
    }

    for (let i = 0; i < n; i++) {
      const p = data.points[i];
      positions[3 * i] = p.x;
      positions[3 * i + 1] = p.y;
      positions[3 * i + 2] = p.z;

      let r = p.r, g = p.g, b = p.b;
      if (colorMode === "depth") {
        const d = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / maxD;
        r = d; g = 0.4 + (1 - d) * 0.4; b = 1 - d;
      } else if (colorMode === "opacity") {
        const o = p.opacity ?? 1;
        r = o; g = o * 0.6; b = 0.3;
      }

      // Static/dynamic styling
      const isDyn = !!p.isDynamic;
      dynamicFlags[i] = isDyn ? 1 : 0;
      if (separationMode === "split") {
        if (isDyn) {
          // Dynamic = warm tint
          r = Math.min(1, r * 0.6 + 0.6);
          g = g * 0.4;
          b = b * 0.3;
        } else {
          // Static background = cooler / dimmer
          r = r * 0.55;
          g = g * 0.6;
          b = Math.min(1, b * 0.7 + 0.15);
        }
      }

      colors[3 * i] = r;
      colors[3 * i + 1] = g;
      colors[3 * i + 2] = b;

      sizes[i] = (p.scale ?? 0.05) * density * pointSize;
      alphas[i] = p.opacity ?? 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    const idx = new Uint32Array(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    geometry.setIndex(new THREE.BufferAttribute(idx, 1));
    geometry.setDrawRange(0, n);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
      uniforms: {
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // Splat-like size: shrink with distance
          gl_PointSize = aSize * 320.0 * uPixelRatio / max(-mv.z, 0.1);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // Gaussian-like radial falloff
          vec2 uv = gl_PointCoord - 0.5;
          float r2 = dot(uv, uv);
          if (r2 > 0.25) discard;
          float a = exp(-r2 * 8.0) * vAlpha;
          gl_FragColor = vec4(vColor, a);
        }
      `,
    });

    return { geometry, material, sortedIndex: idx, positions, colors, sizes, alphas, dynamicFlags };
  }, [data, colorMode, density, pointSize, separationMode]);

  // Visibility filter for separation mode (controls draw count via visible indices)
  const visibleIndices = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < dynamicFlags.length; i++) {
      const isDyn = dynamicFlags[i] === 1;
      if (separationMode === "all" || separationMode === "split") idx.push(i);
      else if (separationMode === "static" && !isDyn) idx.push(i);
      else if (separationMode === "dynamic" && isDyn) idx.push(i);
    }
    return idx;
  }, [dynamicFlags, separationMode]);

  // Depth-sort visible points back-to-front each frame for proper alpha blending.
  const camPos = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const sortBuf = useMemo(() => ({
    keys: new Float32Array(visibleIndices.length),
    order: new Uint32Array(visibleIndices.length),
  }), [visibleIndices]);

  useFrame(() => {
    if (!pointsRef.current) return;
    camera.getWorldPosition(camPos);
    const n = visibleIndices.length;
    if (n === 0) {
      geometry.setDrawRange(0, 0);
      return;
    }

    // Throttle: only re-sort when camera moved noticeably
    for (let i = 0; i < n; i++) {
      const pi = visibleIndices[i];
      tmp.set(positions[3 * pi], positions[3 * pi + 1], positions[3 * pi + 2]);
      sortBuf.keys[i] = -tmp.distanceToSquared(camPos); // negative => far first
      sortBuf.order[i] = i;
    }
    // Insertion-style sort is too slow for big N; use Array.sort on indices
    const arr = Array.from(sortBuf.order);
    arr.sort((a, b) => sortBuf.keys[a] - sortBuf.keys[b]);

    const indexAttr = geometry.getIndex()!;
    const indexArr = indexAttr.array as Uint32Array;
    for (let i = 0; i < n; i++) indexArr[i] = visibleIndices[arr[i]];
    indexAttr.needsUpdate = true;
    geometry.setDrawRange(0, n);
  });

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export const PointCloudViewer = ({ data, density, colorMode, separationMode, pointSize, autoRotate }: Props) => {
  return (
    <Canvas camera={{ position: [6, 4, 6], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["hsl(240, 30%, 6%)"]} />
      <fog attach="fog" args={["hsl(240, 30%, 6%)", 12, 30]} />
      <ambientLight intensity={0.4} />
      <Stars radius={60} depth={50} count={1200} factor={3} saturation={0} fade />
      <Suspense fallback={null}>
        <PointCloud
          data={data}
          density={density}
          colorMode={colorMode}
          separationMode={separationMode}
          pointSize={pointSize}
        />
      </Suspense>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={1.5}
        maxDistance={40}
        makeDefault
      />
      <gridHelper args={[20, 20, "hsl(220, 50%, 30%)", "hsl(220, 30%, 20%)"]} position={[0, -3, 0]} />
    </Canvas>
  );
};
