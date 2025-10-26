import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ImageCaptionGenerator = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
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
      setCaption("");
    }
  };

  const generateCaption = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
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

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      setCaption(data.caption);
      toast({
        title: "Caption Generated",
        description: "AI has analyzed your image successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Generative AI · Vision-Language Model</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Image Caption Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Experience the power of neural vision-language models that understand and describe visual content. 
          Our advanced AI combines Convolutional Neural Networks for image feature extraction with Transformer-based 
          language models to generate contextually accurate, human-like captions in real-time.
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 rounded-full bg-muted text-sm">Real-time Analysis</div>
          <div className="px-3 py-1 rounded-full bg-muted text-sm">Sequence-to-Sequence</div>
          <div className="px-3 py-1 rounded-full bg-muted text-sm">CNN + Transformer</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image
            </CardTitle>
            <CardDescription>Select an image to generate a caption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No image selected</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full"
              id="image-upload"
            />
            <Button
              onClick={generateCaption}
              disabled={!selectedImage || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Caption"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Caption</CardTitle>
            <CardDescription>AI-generated description of your image</CardDescription>
          </CardHeader>
          <CardContent>
            {caption ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg">{caption}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Upload an image and click "Generate Caption" to see results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageCaptionGenerator;
