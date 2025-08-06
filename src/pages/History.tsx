import { useState } from "react";
import { Search, Filter, Download, Eye, MoreVertical, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModel, setFilterModel] = useState("all");

  const analysisHistory = [
    {
      id: 1,
      filename: "street_scene.jpg",
      model: "Object Detection",
      date: "2024-01-15 14:30",
      confidence: 0.92,
      objects: 12,
      thumbnail: "/api/placeholder/100/100",
    },
    {
      id: 2,
      filename: "document_scan.png",
      model: "OCR",
      date: "2024-01-15 13:45",
      confidence: 0.88,
      words: 157,
      thumbnail: "/api/placeholder/100/100",
    },
    {
      id: 3,
      filename: "group_photo.jpg",
      model: "Face Recognition",
      date: "2024-01-15 12:20",
      confidence: 0.95,
      faces: 5,
      thumbnail: "/api/placeholder/100/100",
    },
    {
      id: 4,
      filename: "landscape.jpg",
      model: "Image Classification",
      date: "2024-01-15 11:15",
      confidence: 0.87,
      category: "Nature/Landscape",
      thumbnail: "/api/placeholder/100/100",
    },
    {
      id: 5,
      filename: "medical_scan.jpg",
      model: "Image Segmentation",
      date: "2024-01-15 10:30",
      confidence: 0.91,
      segments: 8,
      thumbnail: "/api/placeholder/100/100",
    },
  ];

  const getModelColor = (model: string) => {
    const colors = {
      "Object Detection": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "OCR": "bg-green-500/20 text-green-400 border-green-500/30",
      "Face Recognition": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Image Classification": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Image Segmentation": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    };
    return colors[model as keyof typeof colors] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            Analysis History
          </h1>
          <p className="text-foreground-muted mt-2">
            View and manage your previous image analyses
          </p>
        </div>
        <Button className="btn-primary">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
                <Input
                  placeholder="Search by filename or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background-tertiary border-input-border"
                />
              </div>
            </div>
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-48 bg-background-tertiary border-input-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="object-detection">Object Detection</SelectItem>
                <SelectItem value="ocr">OCR</SelectItem>
                <SelectItem value="face-recognition">Face Recognition</SelectItem>
                <SelectItem value="classification">Image Classification</SelectItem>
                <SelectItem value="segmentation">Image Segmentation</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="btn-glass">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisHistory.map((item) => (
          <Card key={item.id} className="glass hover:shadow-glow transition-all duration-300 cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{item.filename}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={getModelColor(item.model)}
                    >
                      {item.model}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete Analysis
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thumbnail */}
              <div className="relative rounded-lg overflow-hidden bg-background-tertiary h-32">
                <img 
                  src={item.thumbnail} 
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <Button size="sm" className="w-full btn-primary">
                      <Eye className="w-4 h-4 mr-2" />
                      View Analysis
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Confidence</span>
                  <span className="font-medium">{Math.round(item.confidence * 100)}%</span>
                </div>
                
                {item.objects && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Objects Found</span>
                    <span className="font-medium">{item.objects}</span>
                  </div>
                )}
                
                {item.words && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Words Extracted</span>
                    <span className="font-medium">{item.words}</span>
                  </div>
                )}
                
                {item.faces && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Faces Detected</span>
                    <span className="font-medium">{item.faces}</span>
                  </div>
                )}
                
                {item.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Category</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                )}
                
                {item.segments && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Segments</span>
                    <span className="font-medium">{item.segments}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>Analyzed</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {analysisHistory.length === 0 && (
        <Card className="glass">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-upload rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
            <p className="text-foreground-muted mb-6">
              Upload and analyze your first image to see results here
            </p>
            <Button className="btn-primary">
              Start Analyzing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;