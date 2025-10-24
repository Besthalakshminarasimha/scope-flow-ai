import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VideoObjectDetection = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setDetections([]);
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: { 
        imageUrl: publicUrl,
        model: 'Object Detection'
      }
    });

    if (error) throw error;

    return data.results[0]?.objects || [];
  };

  const startProcessing = async () => {
    if (!selectedVideo) return;

    setIsProcessing(true);
    try {
      const objects = await processFrame();
      setDetections(objects);
      toast({
        title: "Frame Analyzed",
        description: `Detected ${objects.length} object(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Object Detection in Videos</h1>
        <p className="text-lg text-muted-foreground">
          Real-time object detection using YOLO and Faster R-CNN models with tracking algorithms.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Input
            </CardTitle>
            <CardDescription>Upload a video for object detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {videoUrl ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="max-h-64 mx-auto rounded-lg"
                    onEnded={() => setIsPlaying(false)}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={togglePlay} size="sm">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No video selected</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="w-full"
            />
            <Button
              onClick={startProcessing}
              disabled={!selectedVideo || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Frame...
                </>
              ) : (
                "Detect Objects in Current Frame"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detected Objects</CardTitle>
            <CardDescription>Objects found in the current frame</CardDescription>
          </CardHeader>
          <CardContent>
            {detections.length > 0 ? (
              <div className="space-y-2">
                {detections.map((obj: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">{obj.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {(obj.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Upload a video and click "Detect Objects" to see results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoObjectDetection;
