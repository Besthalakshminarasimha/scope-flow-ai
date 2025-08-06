import { ProcessingResult } from "@/hooks/useImageProcessing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  result: ProcessingResult;
}

export const ResultsDisplay = ({ result }: ResultsDisplayProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Results copied to clipboard",
    });
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(result.results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.model.toLowerCase().replace(/\s+/g, '-')}-results.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderObjectDetection = () => {
    const objects = result.results.objects || [];
    return (
      <div className="space-y-3">
        <h4 className="font-medium">Detected Objects ({objects.length})</h4>
        {objects.map((obj: any, index: number) => (
          <div key={index} className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{obj.label}</span>
              <Badge variant="outline">{Math.round(obj.confidence * 100)}%</Badge>
            </div>
            <div className="text-sm text-foreground-muted mt-1">
              Position: [{obj.bbox.join(', ')}]
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderClassification = () => {
    const categories = result.results.categories || [];
    return (
      <div className="space-y-3">
        <h4 className="font-medium">Classification Results</h4>
        {categories.map((cat: any, index: number) => (
          <div key={index} className="flex justify-between items-center p-3 bg-background-tertiary rounded-lg">
            <span className="font-medium">{cat.label}</span>
            <Badge variant="outline">{Math.round(cat.confidence * 100)}%</Badge>
          </div>
        ))}
      </div>
    );
  };

  const renderFaceRecognition = () => {
    const faces = result.results.faces || [];
    return (
      <div className="space-y-3">
        <h4 className="font-medium">Detected Faces ({faces.length})</h4>
        {faces.map((face: any, index: number) => (
          <div key={index} className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Face {index + 1}</span>
              <Badge variant="outline">{Math.round(face.confidence * 100)}%</Badge>
            </div>
            <div className="text-sm text-foreground-muted space-y-1">
              <div>Age: ~{face.age}</div>
              <div>Gender: {face.gender}</div>
              <div>Position: [{face.bbox.join(', ')}]</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOCR = () => {
    const text = result.results.text || '';
    const words = result.results.words || [];
    
    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Extracted Text</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(text)}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>
          <div className="p-3 bg-background-tertiary rounded-lg">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Word Confidence</h4>
          <div className="space-y-2">
            {words.map((word: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-background-tertiary rounded">
                <span>{word.text}</span>
                <Badge variant="outline">{Math.round(word.confidence * 100)}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSegmentation = () => {
    const segments = result.results.segments || [];
    return (
      <div className="space-y-3">
        <h4 className="font-medium">Image Segments ({segments.length})</h4>
        {segments.map((segment: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-medium">{segment.label}</span>
            </div>
            <div className="text-sm text-foreground-muted">
              {segment.pixels.toLocaleString()} pixels
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResults = () => {
    switch (result.model) {
      case 'Object Detection':
        return renderObjectDetection();
      case 'Image Classification':
        return renderClassification();
      case 'Face Recognition':
        return renderFaceRecognition();
      case 'OCR':
        return renderOCR();
      case 'Image Segmentation':
        return renderSegmentation();
      default:
        return <div>Unknown model type</div>;
    }
  };

  return (
    <Card className="glass animate-scale-in">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Analysis Results
            <Badge variant="outline" className="ml-2">
              {result.model}
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadResults}
            className="btn-glass"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
        <div className="text-sm text-foreground-muted">
          Overall Confidence: {Math.round(result.confidence * 100)}%
        </div>
      </CardHeader>
      <CardContent>
        {renderResults()}
      </CardContent>
    </Card>
  );
};