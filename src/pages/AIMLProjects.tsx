import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AIMLProjects = () => {
  const projects = [
    {
      name: "Image Caption Generator",
      domain: "Generative AI",
      technologies: "Sequence-to-Sequence models, Combining CNNs (for image features) and RNNs/Transformers (for text generation)"
    },
    {
      name: "AI Chatbot/Conversational Agent (using RAG)",
      domain: "Generative AI",
      technologies: "Transformer models (BERT/GPT), Retrieval-Augmented Generation (RAG), Fine-tuning LLMs"
    },
    {
      name: "Automated Attendance System (Face Recognition)",
      domain: "Computer Vision",
      technologies: "Real-time Object Detection/Recognition (e.g., using YOLO or SSD), Deep Learning for identity verification"
    },
    {
      name: "Object Detection in Videos",
      domain: "Computer Vision",
      technologies: "Real-time inference, Tracking algorithms, Deep Learning models (YOLO, Faster R-CNN)"
    },
    {
      name: "Autonomous Vehicle Simulation (Lane Line Detection)",
      domain: "Robotics/Control",
      technologies: "Computer Vision, Sensor Fusion concepts, Path Planning, Reinforcement Learning (advanced)"
    },
    {
      name: "Language Translator App (using a Transformer)",
      domain: "NLP",
      technologies: "Advanced Transformer Architectures, Neural Machine Translation"
    },
    {
      name: "Speech Emotion Recognition",
      domain: "Audio/Speech",
      technologies: "Signal Processing, Deep Learning (e.g., CNN or RNN) on audio features (Spectrograms)"
    }
  ];

  const getDomainColor = (domain: string) => {
    const colors: { [key: string]: string } = {
      "Generative AI": "bg-primary/10 text-primary border-primary/20",
      "Computer Vision": "bg-secondary/10 text-secondary-foreground border-secondary/20",
      "Robotics/Control": "bg-accent/10 text-accent-foreground border-accent/20",
      "NLP": "bg-muted text-muted-foreground border-muted-foreground/20",
      "Audio/Speech": "bg-primary/5 text-primary border-primary/10"
    };
    return colors[domain] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Advanced AIML Projects
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          These projects are excellent for demonstrating proficiency in advanced Machine Learning and Deep Learning. 
          Each project showcases cutting-edge technologies and concepts across various AI domains, from generative models 
          to computer vision, natural language processing, and beyond.
        </p>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Project Showcase</CardTitle>
          <CardDescription>
            Explore innovative AI/ML projects across multiple domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground w-[30%]">Project Name</TableHead>
                  <TableHead className="font-semibold text-foreground w-[20%]">Domain</TableHead>
                  <TableHead className="font-semibold text-foreground w-[50%]">Key Technologies & Concepts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, index) => (
                  <TableRow 
                    key={index} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-semibold text-foreground">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getDomainColor(project.domain)} font-medium`}
                      >
                        {project.domain}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.technologies}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {["Generative AI", "Computer Vision", "NLP", "Robotics/Control", "Audio/Speech"].map((domain) => (
          <Card key={domain} className="hover:shadow-md transition-shadow border-primary/10">
            <CardHeader className="pb-3">
              <Badge className={`${getDomainColor(domain)} w-fit`}>
                {domain}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {projects.filter(p => p.domain === domain).length} {projects.filter(p => p.domain === domain).length === 1 ? 'project' : 'projects'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIMLProjects;
