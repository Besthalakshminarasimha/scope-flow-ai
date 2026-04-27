import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Boxes, Camera, Cpu, Zap, Eye, Play, Pause, RotateCcw, Layers, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GaussianPoint {
  position: [number, number, number];
  color: [number, number, number];
  scale: number;
  opacity: number;
}

// Simulated 3D Gaussian field — represents a reconstructed scene
const GaussianField = ({ count, density, colorMode }: { count: number; density: number; colorMode: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  const gaussians = useMemo<GaussianPoint[]>(() => {
    const points: GaussianPoint[] = [];
    // Generate a "room-like" scene with structured Gaussian distribution
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 8;
      const radius = 2 + Math.sin(t * Math.PI * 4) * 1.5;
      const height = (Math.random() - 0.5) * 4;

      // Mix of structured (walls/objects) and ambient points
      const isStructure = Math.random() > 0.3;
      const x = isStructure ? Math.cos(angle) * radius : (Math.random() - 0.5) * 8;
      const y = isStructure ? height : (Math.random() - 0.5) * 6;
      const z = isStructure ? Math.sin(angle) * radius : (Math.random() - 0.5) * 8;

      let r = 0.5, g = 0.5, b = 0.8;
      if (colorMode === "depth") {
        const d = Math.sqrt(x * x + y * y + z * z) / 6;
        r = d; g = 0.4 + (1 - d) * 0.4; b = 1 - d;
      } else if (colorMode === "rgb") {
        r = (Math.sin(x) + 1) / 2;
        g = (Math.cos(z) + 1) / 2;
        b = (Math.sin(y * 2) + 1) / 2;
      } else if (colorMode === "opacity") {
        const o = Math.random();
        r = o; g = o * 0.6; b = 0.3;
      }

      points.push({
        position: [x, y, z],
        color: [r, g, b],
        scale: 0.04 + Math.random() * 0.08,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    return points;
  }, [count, colorMode]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    gaussians.forEach((g, i) => {
      const wobble = Math.sin(time * 0.5 + i * 0.01) * 0.02;
      dummy.position.set(
        g.position[0] + wobble,
        g.position[1] + wobble * 0.5,
        g.position[2]
      );
      const s = g.scale * density;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      colorObj.setRGB(g.color[0], g.color[1], g.color[2]);
      meshRef.current!.setColorAt(i, colorObj);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        transparent
        opacity={0.85}
        emissiveIntensity={0.4}
        roughness={0.3}
      />
    </instancedMesh>
  );
};

const SceneViewer = ({ gaussianCount, density, colorMode, isTraining }: {
  gaussianCount: number;
  density: number;
  colorMode: string;
  isTraining: boolean;
}) => {
  return (
    <Canvas camera={{ position: [6, 4, 6], fov: 60 }} dpr={[1, 2]}>
      <color attach="background" args={["hsl(240, 30%, 6%)"]} />
      <fog attach="fog" args={["hsl(240, 30%, 6%)", 8, 20]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="hsl(220, 80%, 70%)" />
      <pointLight position={[-10, -5, -10]} intensity={0.8} color="hsl(280, 80%, 70%)" />
      <Stars radius={50} depth={50} count={1500} factor={3} saturation={0} fade />
      <Suspense fallback={null}>
        <GaussianField count={gaussianCount} density={density} colorMode={colorMode} />
      </Suspense>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={isTraining}
        autoRotateSpeed={1}
        minDistance={3}
        maxDistance={20}
      />
      <gridHelper args={[20, 20, "hsl(220, 50%, 30%)", "hsl(220, 30%, 20%)"]} position={[0, -3, 0]} />
    </Canvas>
  );
};

const GaussianSplatting = () => {
  const [gaussianCount, setGaussianCount] = useState(2000);
  const [density, setDensity] = useState([1.0]);
  const [colorMode, setColorMode] = useState("rgb");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [psnr, setPsnr] = useState(0);
  const [fps, setFps] = useState(60);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setIteration(0);
    toast({
      title: "Training Started",
      description: "Optimizing 3D Gaussians via gradient descent...",
    });

    const interval = setInterval(() => {
      setTrainingProgress((p) => {
        const next = p + 1;
        if (next >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          toast({
            title: "Training Complete",
            description: `Converged at iteration ${30000} with PSNR 32.4 dB`,
          });
          return 100;
        }
        return next;
      });
      setIteration((i) => i + 300);
      setPsnr((p) => Math.min(32.4, p + 0.32));
      setFps(45 + Math.floor(Math.random() * 20));
    }, 100);
  };

  const resetScene = () => {
    setIsTraining(false);
    setTrainingProgress(0);
    setIteration(0);
    setPsnr(0);
    setGaussianCount(2000);
    setDensity([1.0]);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Boxes className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Spatial Computing
              </Badge>
              <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
                SOTA 2024
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Real-Time 3D Scene Reconstruction
            </h1>
            <p className="text-muted-foreground mt-1">
              3D Gaussian Splatting (3DGS) — Volumetric scene representation with real-time rendering
            </p>
          </div>
        </div>
      </div>

      {/* Main Viewer + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <Card className="lg:col-span-2 overflow-hidden border-primary/20">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Reconstructed Scene Viewer
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="font-mono">{fps} FPS</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent/10">
                  <Layers className="w-3 h-3" />
                  <span className="font-mono">{gaussianCount.toLocaleString()} Gaussians</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full bg-background">
              <SceneViewer
                gaussianCount={gaussianCount}
                density={density[0]}
                colorMode={colorMode}
                isTraining={isTraining}
              />
            </div>
            <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground text-center">
              Drag to rotate · Scroll to zoom · Right-click to pan
            </div>
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="w-5 h-5 text-primary" />
              Training Pipeline
            </CardTitle>
            <CardDescription>Adjust Gaussian parameters & train</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Training Button */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={startTraining}
                  disabled={isTraining}
                  className="flex-1 gap-2"
                >
                  {isTraining ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTraining ? "Training..." : "Start Training"}
                </Button>
                <Button onClick={resetScene} variant="outline" size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              {(isTraining || trainingProgress > 0) && (
                <div className="space-y-2">
                  <Progress value={trainingProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>Iter: {iteration.toLocaleString()}</span>
                    <span>PSNR: {psnr.toFixed(1)} dB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Gaussian Count */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Gaussian Count</span>
                <span className="font-mono text-muted-foreground">{gaussianCount.toLocaleString()}</span>
              </div>
              <Slider
                value={[gaussianCount]}
                onValueChange={(v) => setGaussianCount(v[0])}
                min={500}
                max={5000}
                step={100}
              />
            </div>

            {/* Density */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Splat Density</span>
                <span className="font-mono text-muted-foreground">{density[0].toFixed(2)}x</span>
              </div>
              <Slider
                value={density}
                onValueChange={setDensity}
                min={0.3}
                max={2.5}
                step={0.05}
              />
            </div>

            {/* Color Mode */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Visualization Mode</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "rgb", label: "RGB" },
                  { id: "depth", label: "Depth" },
                  { id: "opacity", label: "Opacity" },
                ].map((m) => (
                  <Button
                    key={m.id}
                    size="sm"
                    variant={colorMode === m.id ? "default" : "outline"}
                    onClick={() => setColorMode(m.id)}
                    className="text-xs"
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono">{((gaussianCount * 59) / 1024).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Render Time</span>
                <span className="font-mono">{(1000 / fps).toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">SH Degree</span>
                <span className="font-mono">3 (RGB + view-dep)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Tabs */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="math">Mathematics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                phase: "Phase 1",
                title: "Data Acquisition",
                icon: Camera,
                desc: "Capture multi-view images or video. Run COLMAP for Structure-from-Motion to recover camera poses and a sparse point cloud.",
                tech: ["COLMAP", "SfM", "Bundle Adjustment"],
              },
              {
                phase: "Phase 2",
                title: "Gaussian Training",
                icon: Cpu,
                desc: "Initialize Gaussians from sparse points. Optimize position, covariance, opacity & spherical harmonics via differentiable rendering.",
                tech: ["Gradient Descent", "SH Coefficients", "Adaptive Density"],
              },
              {
                phase: "Phase 3",
                title: "Real-Time Render",
                icon: Zap,
                desc: "Custom CUDA kernels perform tile-based rasterization with depth sorting and alpha blending for 30+ FPS rendering.",
                tech: ["CUDA", "Tile Rasterization", "Alpha Blending"],
              },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {p.phase}
                      </Badge>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="math">
          <Card>
            <CardHeader>
              <CardTitle>Mathematical Foundation</CardTitle>
              <CardDescription>Each 3D Gaussian is parameterized by 59 values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 className="font-semibold text-sm">Gaussian Definition</h4>
                  <code className="text-xs block font-mono text-primary">
                    G(x) = exp(−½(x−μ)ᵀ Σ⁻¹ (x−μ))
                  </code>
                  <p className="text-xs text-muted-foreground">
                    μ = position (3D), Σ = 3×3 covariance matrix (anisotropic shape)
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 className="font-semibold text-sm">Covariance Decomposition</h4>
                  <code className="text-xs block font-mono text-primary">
                    Σ = R · S · Sᵀ · Rᵀ
                  </code>
                  <p className="text-xs text-muted-foreground">
                    R = rotation quaternion (4), S = scale vector (3) — keeps Σ positive semi-definite
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 className="font-semibold text-sm">Alpha Blending</h4>
                  <code className="text-xs block font-mono text-primary">
                    C = Σᵢ cᵢ · αᵢ · Πⱼ&lt;ᵢ (1 − αⱼ)
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Front-to-back compositing of depth-sorted Gaussians per pixel tile
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 className="font-semibold text-sm">Loss Function</h4>
                  <code className="text-xs block font-mono text-primary">
                    L = (1−λ)·L₁ + λ·L_D-SSIM
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Combined L1 + structural similarity loss, λ = 0.2
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Adaptive Density Control</CardTitle>
              <CardDescription>Dynamic Gaussian management during training</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-primary">↗</span> Densification
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Clone:</strong> Duplicate small Gaussians in under-reconstructed regions</li>
                    <li><strong>Split:</strong> Divide large Gaussians into 2 smaller ones in over-reconstructed areas</li>
                    <li>Triggered every 100 iters when ∇L &gt; threshold</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-destructive">↘</span> Pruning
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Remove Gaussians with α &lt; 0.005 (transparent)</li>
                    <li>Cull oversized Gaussians in world space</li>
                    <li>Reduces model size 40-60% without quality loss</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Dynamic Scenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Standard 3DGS assumes static scenes. Moving objects cause floaters and ghosting artifacts.
                </p>
                <p className="font-medium">Solutions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Time-variant latent codes per Gaussian</li>
                  <li>Temporal masking to separate static/dynamic</li>
                  <li>Deformation networks (Deformable 3DGS)</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Memory Footprint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  A typical scene needs 1-5M Gaussians × 59 floats = 200MB-1GB raw.
                </p>
                <p className="font-medium">Compression strategies:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Vector quantization of SH coefficients</li>
                  <li>Aggressive opacity-based pruning</li>
                  <li>Codebook-based attribute encoding</li>
                  <li>Hash-grid spatial indexing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GaussianSplatting;
