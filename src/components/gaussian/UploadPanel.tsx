import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Camera, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onJobStarted: (jobId: string) => void;
}

export const UploadPanel = ({ onJobStarted }: Props) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

  const handlePick = (selected: FileList | null) => {
    if (!selected) return;
    setFiles(Array.from(selected));
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      setStreamObj(stream);
      setWebcamActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch (e) {
      toast({ title: "Webcam error", description: "Could not access camera.", variant: "destructive" });
    }
  };

  const stopWebcam = () => {
    streamObj?.getTracks().forEach(t => t.stop());
    setStreamObj(null);
    setWebcamActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      setFiles(prev => [...prev, f]);
      toast({ title: "Frame captured", description: `${files.length + 1} frames ready` });
    }, "image/jpeg", 0.92);
  };

  const startReconstruction = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to start reconstruction.", variant: "destructive" });
      return;
    }
    if (files.length === 0) {
      toast({ title: "No files", description: "Add images, a video, or capture frames first.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const jobBase = `${user.id}/${Date.now()}`;
      const uploaded: { path: string; name: string; size: number; type: string }[] = [];
      for (const file of files) {
        const path = `${jobBase}/${file.name}`;
        const { error } = await supabase.storage.from("reconstruction-uploads").upload(path, file, { upsert: true });
        if (error) throw error;
        uploaded.push({ path, name: file.name, size: file.size, type: file.type });
      }
      const sourceType = files.some(f => f.type.startsWith("video/")) ? "video" : "images";
      const { data, error } = await supabase.functions.invoke("start-reconstruction", {
        body: { sourceFiles: uploaded, sourceType },
      });
      if (error) throw error;
      stopWebcam();
      setFiles([]);
      toast({ title: "Reconstruction started", description: "Pipeline running — progress will stream live." });
      onJobStarted(data.jobId);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5 text-primary" />
          Capture & Reconstruct
        </CardTitle>
        <CardDescription>Upload multi-view images/video or capture from webcam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <ImageIcon className="w-4 h-4" /> Images
          </Button>
          <Button
            variant="outline"
            onClick={webcamActive ? stopWebcam : startWebcam}
            className="gap-2"
          >
            <Camera className="w-4 h-4" /> {webcamActive ? "Stop" : "Webcam"}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handlePick(e.target.files)}
        />

        {webcamActive && (
          <div className="space-y-2">
            <div className="rounded-md overflow-hidden border border-border bg-muted/30">
              <video ref={videoRef} className="w-full h-40 object-cover" muted playsInline />
            </div>
            <Button onClick={captureFrame} size="sm" variant="secondary" className="w-full gap-2">
              <Video className="w-4 h-4" /> Capture frame
            </Button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {files.length > 0 && (
          <div className="text-xs text-muted-foreground p-2 rounded bg-muted/30 border">
            {files.length} file{files.length === 1 ? "" : "s"} queued · {(files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(1)} MB
          </div>
        )}

        <Button onClick={startReconstruction} disabled={uploading || files.length === 0} className="w-full gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Start Reconstruction"}
        </Button>
      </CardContent>
    </Card>
  );
};
