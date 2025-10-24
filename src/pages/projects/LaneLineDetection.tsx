import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Car, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LaneLineDetection = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [laneData, setLaneData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLaneData(null);
    }
  };

  const detectLanes = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('detect-lanes', {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      setLaneData(data);
      toast({
        title: "Lane Detection Complete",
        description: "Road lanes have been identified successfully!",
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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Autonomous Vehicle Simulation</h1>
        <p className="text-lg text-muted-foreground">
          Lane line detection using computer vision, sensor fusion, and path planning algorithms.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Road Image Input
            </CardTitle>
            <CardDescription>Upload a road image for lane detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <div className="space-y-2">
                  <Navigation className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No image selected</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full"
            />
            <Button
              onClick={detectLanes}
              disabled={!selectedImage || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting Lanes...
                </>
              ) : (
                "Detect Lane Lines"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lane Detection Results</CardTitle>
            <CardDescription>Detected lane information and path guidance</CardDescription>
          </CardHeader>
          <CardContent>
            {laneData ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">Lane Analysis</h3>
                  <p className="text-sm text-muted-foreground">{laneData.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Left Lane</p>
                    <p className="font-semibold">{laneData.leftLane ? "Detected" : "Not Found"}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Right Lane</p>
                    <p className="font-semibold">{laneData.rightLane ? "Detected" : "Not Found"}</p>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="font-semibold">{(laneData.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Upload a road image and click "Detect Lane Lines" to see results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LaneLineDetection;
