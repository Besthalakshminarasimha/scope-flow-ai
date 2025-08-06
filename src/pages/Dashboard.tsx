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
import { supabase } from "@/lib/supabase";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            AI Computer Vision Dashboard
          </h1>
          <p className="text-foreground-muted mt-2">
            Upload an image and select an AI model to analyze it
          </p>
        </div>
        <Button className="btn-glass">
          <Settings2 className="w-4 h-4 mr-2" />
          Preferences
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Zone */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`upload-zone rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging ? 'dragover' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-upload rounded-full flex items-center justify-center mx-auto animate-pulse-soft">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Drop your image here or click to upload
                    </h3>
                    <p className="text-foreground-muted text-sm">
                      Supports JPG, PNG, GIF up to 10MB
                    </p>
                  </div>
                  
                  {/* Upload Options */}
                  <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <Button 
                      variant="outline" 
                      className="btn-glass"
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
                      className="btn-glass"
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
            <Card className="glass animate-scale-in">
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden bg-background-tertiary">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  {processingLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Play className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Processing Image...</p>
                          <Progress value={33} className="w-48 mt-2" />
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
          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Model Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Model Type</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-background-tertiary border-input-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-foreground-muted">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold</Label>
                <div className="px-2">
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground-muted mt-1">
                    <span>0.1</span>
                    <span className="font-medium">{confidence[0]}</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleProcess}
                disabled={!uploadedFile || processingLoading}
                className="w-full btn-primary mt-6"
              >
                {processingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background-tertiary/50 hover:bg-background-tertiary transition-colors cursor-pointer">
                    <img 
                      src={analysis.image_url} 
                      alt={analysis.filename}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{analysis.filename}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {analysis.model}
                        </Badge>
                        <span className="text-xs text-foreground-muted">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-foreground-muted text-sm text-center py-4">
                    No recent analyses
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          {uploadedFile && (
            <Card className="glass animate-scale-in">
              <CardHeader>
                <CardTitle>Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full btn-glass">
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
                <Button variant="outline" className="w-full btn-glass">
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