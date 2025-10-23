import { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, MoreVertical, Calendar, Trash2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AnalysisHistory {
  id: string;
  user_id: string;
  filename: string;
  model: string;
  results: any;
  confidence: number;
  image_url: string;
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisHistory();
  }, [user, filterModel]);

  const loadAnalysisHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filterModel !== 'all') {
        const modelMap: { [key: string]: string } = {
          'object-detection': 'Object Detection',
          'ocr': 'OCR',
          'face-recognition': 'Face Recognition',
          'classification': 'Image Classification',
          'segmentation': 'Image Segmentation',
        };
        query = query.eq('model', modelMap[filterModel]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnalysisHistory(data || []);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      toast({
        title: "Error Loading History",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalysisHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Analysis Deleted",
        description: "Analysis has been removed from history",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete analysis",
        variant: "destructive",
      });
    }
  };

  const exportAllResults = async () => {
    try {
      const dataStr = JSON.stringify(analysisHistory, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'visionx-analysis-history.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Analysis history exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis history",
        variant: "destructive",
      });
    }
  };

  const getResultsCount = (analysis: AnalysisHistory) => {
    const results = analysis.results;
    switch (analysis.model) {
      case 'Object Detection':
        return `${results?.objects?.length || 0} objects`;
      case 'OCR':
        return `${results?.words?.length || 0} words`;
      case 'Face Recognition':
        return `${results?.faces?.length || 0} faces`;
      case 'Image Classification':
        return `${results?.categories?.length || 0} categories`;
      case 'Image Segmentation':
        return `${results?.segments?.length || 0} segments`;
      default:
        return 'N/A';
    }
  };

  const filteredHistory = analysisHistory.filter(item =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button className="btn-primary" onClick={exportAllResults}>
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
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
                    <DropdownMenuItem onClick={() => navigate(`/analysis/${item.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const dataStr = JSON.stringify(item.results, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${item.filename}-results.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => deleteAnalysis(item.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
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
                  src={item.image_url} 
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
                
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Results</span>
                  <span className="font-medium">{getResultsCount(item)}</span>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>Analyzed</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredHistory.length === 0 && (
        <Card className="glass">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-upload rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
            <p className="text-foreground-muted mb-6">
              Upload and analyze your first image to see results here
            </p>
            <Button className="btn-primary" onClick={() => navigate('/')}>
              Start Analyzing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;