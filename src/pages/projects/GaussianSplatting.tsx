import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Boxes, Camera, Cpu, Zap, Eye, Layers, Activity, Download, Share2, FileUp, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateSampleScene, parsePLY, writePLYAscii, writeJSON, type PlyData } from "@/lib/ply";
import { PointCloudViewer } from "@/components/gaussian/PointCloudViewer";
import { UploadPanel } from "@/components/gaussian/UploadPanel";
import { JobMonitor } from "@/components/gaussian/JobMonitor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SeparationMode = "all" | "static" | "dynamic" | "split";
type ColorMode = "rgb" | "depth" | "opacity";

const GaussianSplatting = () => {
  const { user } = useAuth();
  const { sceneId } = useParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<PlyData>(() => generateSampleScene(4000));
  const [sourceLabel, setSourceLabel] = useState("Bundled sample scene");
  const [density, setDensity] = useState([1.0]);
  const [pointSize, setPointSize] = useState([1.0]);
  const [colorMode, setColorMode] = useState<ColorMode>("rgb");
  const [separationMode, setSeparationMode] = useState<SeparationMode>("all");
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeJob, setActiveJob] = useState<string | null>(null);

  const dynamicCount = useMemo(() => data.points.filter(p => p.isDynamic).length, [data]);
  const staticCount = data.points.length - dynamicCount;

  // Load shared scene by id (via /scene/:sceneId route)
  useEffect(() => {
    if (!sceneId) return;
    (async () => {
      const { data: scene, error } = await supabase.from("scenes").select("*").eq("id", sceneId).maybeSingle();
      if (error || !scene) {
        toast({ title: "Scene not found", description: "This shared scene is unavailable.", variant: "destructive" });
        return;
      }
      if (scene.file_path) {
        const { data: pub } = supabase.storage.from("3d-scenes").getPublicUrl(scene.file_path);
        try {
          const buf = await fetch(pub.publicUrl).then(r => r.arrayBuffer());
          const parsed = await parsePLY(buf);
          setData(parsed);
          setSourceLabel(`Shared: ${scene.name}`);
        } catch (e) {
          toast({ title: "Failed to load scene", description: String(e), variant: "destructive" });
        }
      }
    })();
  }, [sceneId]);

  // Hash-based small scene config
  useEffect(() => {
    if (typeof window === "undefined" || sceneId) return;
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("scene=")) return;
    try {
      const json = atob(decodeURIComponent(hash.slice("scene=".length)));
      const parsed = JSON.parse(json);
      if (parsed.points) {
        setData({ points: parsed.points });
        setSourceLabel("Loaded from shared link");
      }
    } catch {}
  }, [sceneId]);

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parsePLY(buf);
      setData(parsed);
      setSourceLabel(`Uploaded: ${file.name}`);
      toast({ title: "Scene loaded", description: `${parsed.points.length.toLocaleString()} points` });
    } catch (e: any) {
      toast({ title: "Invalid PLY", description: e.message ?? String(e), variant: "destructive" });
    }
  };

  const exportFile = (format: "ply" | "json") => {
    const text = format === "ply" ? writePLYAscii(data) : writeJSON(data);
    const blob = new Blob([text], { type: format === "ply" ? "text/plain" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scene-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: `Downloaded as ${format.toUpperCase()}` });
  };

  const shareScene = async () => {
    // Small scenes -> URL hash; larger -> upload to Cloud
    if (data.points.length <= 800) {
      const compact = {
        points: data.points.map(p => ({
          x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2),
          r: +p.r.toFixed(2), g: +p.g.toFixed(2), b: +p.b.toFixed(2),
          isDynamic: p.isDynamic ? 1 : 0,
        })),
      };
      const enc = encodeURIComponent(btoa(JSON.stringify(compact)));
      const url = `${window.location.origin}/projects/gaussian-splatting#scene=${enc}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Compact scene link copied to clipboard." });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to host scenes.", variant: "destructive" });
      return;
    }
    try {
      const ply = writePLYAscii(data);
      const filename = `${user.id}/scene-${Date.now()}.ply`;
      const { error: upErr } = await supabase.storage.from("3d-scenes").upload(filename, new Blob([ply]), {
        contentType: "text/plain", upsert: false,
      });
      if (upErr) throw upErr;
      const { data: scene, error } = await supabase.from("scenes").insert({
        user_id: user.id,
        name: sourceLabel,
        point_count: data.points.length,
        file_path: filename,
        format: "ply",
        is_public: true,
      }).select().single();
      if (error) throw error;
      const url = `${window.location.origin}/scene/${scene.id}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Shareable link copied", description: url });
    } catch (e: any) {
      toast({ title: "Share failed", description: e.message ?? String(e), variant: "destructive" });
    }
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
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Spatial Computing</Badge>
              <Badge variant="outline" className="bg-accent/10 border-accent/20">3DGS</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Real-Time 3D Scene Reconstruction</h1>
            <p className="text-muted-foreground mt-1">
              3D Gaussian Splatting · {sourceLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Viewer + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden border-primary/20">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Reconstructed Scene Viewer
              </CardTitle>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10">
                  <Layers className="w-3 h-3 text-primary" />
                  <span className="font-mono">{data.points.length.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent/10">
                  <Activity className="w-3 h-3" />
                  <span className="font-mono">static {staticCount.toLocaleString()} · dyn {dynamicCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full bg-background">
              <PointCloudViewer
                data={data}
                density={density[0]}
                pointSize={pointSize[0]}
                colorMode={colorMode}
                separationMode={separationMode}
                autoRotate={autoRotate}
              />
            </div>
            <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground text-center">
              Drag to rotate · Scroll to zoom · Right-click to pan · Depth-sorted alpha blending
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="w-5 h-5 text-primary" />
                Scene Controls
              </CardTitle>
              <CardDescription>Render & visualization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Source */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Scene Source</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { setData(generateSampleScene(4000)); setSourceLabel("Bundled sample scene"); }}>
                    <Sparkles className="w-4 h-4" /> Sample
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <FileUp className="w-4 h-4" /> Upload PLY
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept=".ply" className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])} />
              </div>

              {/* Dynamic / Static separation */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Dynamic / Static Separation</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["all", "static", "dynamic", "split"] as SeparationMode[]).map(m => (
                    <Button key={m} size="sm" variant={separationMode === m ? "default" : "outline"}
                      className="text-xs capitalize" onClick={() => setSeparationMode(m)}>{m}</Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Mask moving foreground or recolor the static background to decouple them.
                </p>
              </div>

              {/* Visualization */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Visualization Mode</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["rgb", "depth", "opacity"] as ColorMode[]).map(m => (
                    <Button key={m} size="sm" variant={colorMode === m ? "default" : "outline"}
                      className="text-xs capitalize" onClick={() => setColorMode(m)}>{m}</Button>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Splat Density</span>
                  <span className="font-mono text-muted-foreground">{density[0].toFixed(2)}x</span>
                </div>
                <Slider value={density} onValueChange={setDensity} min={0.3} max={2.5} step={0.05} />
              </div>

              {/* Point size */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Splat Size</span>
                  <span className="font-mono text-muted-foreground">{pointSize[0].toFixed(2)}x</span>
                </div>
                <Slider value={pointSize} onValueChange={setPointSize} min={0.3} max={3} step={0.05} />
              </div>

              {/* Auto rotate */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-rotate camera</span>
                <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
              </div>

              {/* Export & Share */}
              <div className="pt-3 border-t space-y-2">
                <span className="text-sm font-medium">Export & Share</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => exportFile("ply")}>
                    <Download className="w-4 h-4" /> .PLY
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => exportFile("json")}>
                    <Download className="w-4 h-4" /> .JSON
                  </Button>
                </div>
                <Button size="sm" className="w-full gap-2" onClick={shareScene}>
                  <Share2 className="w-4 h-4" /> Generate Share Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload / pipeline */}
          <UploadPanel onJobStarted={setActiveJob} />
          {activeJob && (
            <JobMonitor
              jobId={activeJob}
              onComplete={(sid) => {
                toast({ title: "Reconstruction complete", description: "Loading reconstructed scene..." });
                // Simulator path: no real file -> regenerate sample as a placeholder result
                if (!sid) setData(generateSampleScene(5000));
              }}
            />
          )}
        </div>
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
              { phase: "Phase 1", title: "Data Acquisition", icon: Camera,
                desc: "Capture multi-view images or video. Run COLMAP for Structure-from-Motion to recover camera poses and a sparse point cloud.",
                tech: ["COLMAP", "SfM", "Bundle Adjustment"] },
              { phase: "Phase 2", title: "Gaussian Training", icon: Cpu,
                desc: "Initialize Gaussians from sparse points. Optimize position, covariance, opacity & spherical harmonics via differentiable rendering.",
                tech: ["Gradient Descent", "SH Coefficients", "Adaptive Density"] },
              { phase: "Phase 3", title: "Real-Time Render", icon: Zap,
                desc: "Tile-based rasterization with depth sorting and alpha blending — exactly what this in-browser viewer does.",
                tech: ["Depth Sort", "Tile Raster", "Alpha Blend"] },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{p.phase}</Badge>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
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
                <Block title="Gaussian Definition" code="G(x) = exp(−½(x−μ)ᵀ Σ⁻¹ (x−μ))"
                  note="μ = position (3D), Σ = 3×3 covariance matrix (anisotropic shape)" />
                <Block title="Covariance Decomposition" code="Σ = R · S · Sᵀ · Rᵀ"
                  note="R = rotation quaternion (4), S = scale vector (3) — keeps Σ positive semi-definite" />
                <Block title="Alpha Blending" code="C = Σ cᵢ · αᵢ · Πⱼ<ᵢ (1 − αⱼ)"
                  note="Front-to-back compositing of depth-sorted Gaussians per tile" />
                <Block title="Spherical Harmonics" code="c(d) = Σ kₗᵐ · Yₗᵐ(d)"
                  note="View-dependent color via SH up to degree 3 (48 RGB coefficients)" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Densification & Pruning</CardTitle>
              <CardDescription>Adaptive control of Gaussian count during training</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Clone", desc: "Duplicate small Gaussians in under-reconstructed regions." },
                { title: "Split", desc: "Divide oversized Gaussians where gradients are large." },
                { title: "Prune", desc: "Remove low-opacity / low-contribution Gaussians to compress the model." },
              ].map(b => (
                <div key={b.title} className="p-4 rounded-lg bg-muted/40 border border-border">
                  <h4 className="font-semibold mb-1">{b.title}</h4>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Critical Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <h4 className="font-semibold">Dynamic Scenes</h4>
                <p className="text-sm text-muted-foreground">
                  This viewer flags <em>dynamic</em> Gaussians. Use the Static / Dynamic / Split modes to decouple
                  moving foreground from a stable background — the same trick temporal-3DGS papers use via
                  time-variant latent codes or temporal masking.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <h4 className="font-semibold">Memory Footprint</h4>
                <p className="text-sm text-muted-foreground">
                  Pruning low-opacity Gaussians dramatically reduces model size with negligible PSNR loss.
                  Export to PLY/JSON to inspect or compress further offline.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Block = ({ title, code, note }: { title: string; code: string; note: string }) => (
  <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
    <h4 className="font-semibold text-sm">{title}</h4>
    <code className="text-xs block font-mono text-primary">{code}</code>
    <p className="text-xs text-muted-foreground">{note}</p>
  </div>
);

export default GaussianSplatting;
