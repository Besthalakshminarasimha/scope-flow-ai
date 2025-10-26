import { useState, useRef, useEffect } from "react";
import { Upload, Camera, Clipboard, Play, Download, Share, Settings2, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useImageProcessing, ProcessingResult } from "@/hooks/useImageProcessing";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ResultsDisplay } from "@/components/ResultsDisplay";

const Dashboard = () => {
  const { user } = useAuth();
  const { processImage, loading: processingLoading, result } = useImageProcessing();
  const [selectedModel, setSelectedModel] = useState("Object Detection");
  const [confidence, setConfidence] = useState([0.7]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = [
    { value: "Object Detection", label: "Object Detection", description: "Identify and locate objects" },
    { value: "Image Classification", label: "Image Classification", description: "Categorize images" },
    { value: "Face Recognition", label: "Face Recognition", description: "Detect and recognize faces" },
    { value: "OCR", label: "OCR (Text Extraction)", description: "Extract text from images" },
    { value: "Image Segmentation", label: "Image Segmentation", description: "Segment image regions" },
  ];

  useEffect(() => {
    loadRecentAnalyses();
  }, [user]);

  const loadRecentAnalyses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentAnalyses(data || []);
    } catch (error) {
      console.error('Error loading recent analyses:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcess = async () => {
    if (!uploadedFile) return;
    
    const result = await processImage(uploadedFile, selectedModel, confidence[0]);
    if (result) {
      loadRecentAnalyses(); // Refresh recent analyses
    }
  };

  const handleWebcamCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element and capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
          }
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg');
      });
      
      toast({
        title: "Camera Accessed",
        description: "Frame captured successfully",
      });
    } catch (error) {
      toast({
        title: "Camera Access Failed",
        description: "Unable to access camera",
        variant: "destructive",
      });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'clipboard-image.png', { type });
            handleFileSelect(file);
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary-foreground drop-shadow-lg">
              AI Computer Vision Dashboard
            </h1>
            <p className="text-primary-foreground/90 text-lg">
              Unleash the power of AI - Upload, Analyze, and Transform your images
            </p>
          </div>
          <Button className="btn-glass bg-background/10 hover:bg-background/20 text-primary-foreground border-primary-foreground/20">
            <Settings2 className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-primary/20 hover:shadow-primary transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-muted">Total Analyses</p>
                <p className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                  {recentAnalyses.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-secondary/20 hover:shadow-secondary transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-muted">Active Model</p>
                <p className="text-2xl font-bold text-secondary truncate">
                  {selectedModel}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center">
                <Play className="w-6 h-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-accent/20 hover:shadow-elevated transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-muted">Confidence</p>
                <p className="text-3xl font-bold text-accent">
                  {Math.round(confidence[0] * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Zone */}
          <Card className="glass border-primary/10 shadow-elevated hover:shadow-glow transition-all duration-300">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-upload flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className={`upload-zone rounded-2xl p-12 text-center transition-all duration-300 border-2 ${
                  isDragging 
                    ? 'dragover border-primary shadow-primary scale-[1.02]' 
                    : 'border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-upload rounded-2xl flex items-center justify-center mx-auto animate-float shadow-primary">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-secondary rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 bg-gradient-brand bg-clip-text text-transparent">
                      Drop your image here or click to upload
                    </h3>
                    <p className="text-foreground-muted">
                      Supports JPG, PNG, GIF up to 10MB
                    </p>
                  </div>
                  
                  {/* Upload Options */}
                  <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <Button 
                      variant="outline" 
                      className="btn-glass hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWebcamCapture();
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                    <Button 
                      variant="outline" 
                      className="btn-glass hover:bg-secondary/10 hover:border-secondary/50 hover:scale-105 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePasteFromClipboard();
                      }}
                    >
                      <Clipboard className="w-4 h-4 mr-2" />
                      Paste
                    </Button>
                  </div>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Image Preview */}
          {previewUrl && (
            <Card className="glass animate-scale-in border-secondary/20 shadow-elevated">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-secondary flex items-center justify-center">
                    <Eye className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  Image Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative rounded-2xl overflow-hidden bg-background-tertiary border border-border/50 shadow-inner">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  {processingLoading && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center">
                      <div className="text-center space-y-6 p-8">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse shadow-glow">
                            <Play className="w-8 h-8 text-primary-foreground" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-50 animate-pulse" />
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-2">Processing Image...</p>
                          <p className="text-sm text-foreground-muted mb-4">AI is analyzing your image</p>
                          <Progress value={33} className="w-64 mx-auto" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Results Display */}
          {result && (
            <ResultsDisplay result={result} />
          )}
        </div>

        {/* Right Column - Model Selection & Settings */}
        <div className="space-y-6">
          {/* Model Selection */}
          <Card className="glass border-accent/20 shadow-elevated hover:shadow-glow transition-all duration-300">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-primary-foreground" />
                </div>
                AI Model Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Model Type</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-background-tertiary border-input-border h-12 hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-primary/20">
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value} className="hover:bg-primary/10">
                        <div className="py-1">
                          <div className="font-semibold">{model.label}</div>
                          <div className="text-xs text-foreground-muted">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Confidence Threshold</Label>
                <div className="px-2 py-4 rounded-lg bg-background-tertiary/50">
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm mt-3">
                    <span className="text-foreground-muted">Low (0.1)</span>
                    <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground px-3">
                      {Math.round(confidence[0] * 100)}%
                    </Badge>
                    <span className="text-foreground-muted">High (1.0)</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleProcess}
                disabled={!uploadedFile || processingLoading}
                className="w-full btn-primary mt-6 h-12 text-base shadow-primary hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                {processingLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="glass border-primary/10 shadow-elevated">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-secondary flex items-center justify-center">
                  <Eye className="w-5 h-5 text-secondary-foreground" />
                </div>
                Recent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentAnalyses.length > 0 ? recentAnalyses.map((analysis, index) => (
                  <div 
                    key={analysis.id} 
                    className="group flex items-center space-x-3 p-3 rounded-xl bg-background-tertiary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 cursor-pointer border border-border/30 hover:border-primary/50 hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative">
                      <img 
                        src={analysis.image_url} 
                        alt={analysis.filename}
                        className="w-14 h-14 object-cover rounded-lg ring-2 ring-border group-hover:ring-primary transition-all"
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {analysis.filename}
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs bg-gradient-secondary text-secondary-foreground">
                          {analysis.model}
                        </Badge>
                        <span className="text-xs text-foreground-muted">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Copy className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )) : (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-gradient-upload rounded-full flex items-center justify-center mx-auto opacity-50">
                      <Eye className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground-muted text-sm">
                      No recent analyses yet
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Upload an image to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          {uploadedFile && (
            <Card className="glass animate-scale-in border-success/20 shadow-elevated">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-success/5 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
                    <Share className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Export & Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button 
                  variant="outline" 
                  className="w-full btn-glass h-11 hover:bg-success/10 hover:border-success/50 hover:scale-[1.02] transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full btn-glass h-11 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02] transition-all"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;