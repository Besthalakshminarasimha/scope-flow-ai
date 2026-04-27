import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Brain, Eye, MessageSquare, Languages, Video, Car, Mic, Boxes } from "lucide-react";

const AIMLProjects = () => {
  const navigate = useNavigate();

  const projects = [
    {
      name: "Image Caption Generator",
      domain: "Generative AI",
      technologies: "Sequence-to-Sequence models, Combining CNNs (for image features) and RNNs/Transformers (for text generation)",
      description: "Harness the power of advanced neural networks to generate human-like descriptions of images. This project uses cutting-edge vision-language models to understand visual content and produce contextually relevant captions in natural language.",
      icon: Brain,
      features: ["Real-time image analysis", "Context-aware descriptions", "Multi-object recognition"],
      route: "/projects/image-caption"
    },
    {
      name: "AI Chatbot/Conversational Agent (using RAG)",
      domain: "Generative AI",
      technologies: "Transformer models (BERT/GPT), Retrieval-Augmented Generation (RAG), Fine-tuning LLMs",
      description: "Experience next-generation conversational AI powered by Retrieval-Augmented Generation. This intelligent chatbot combines the reasoning capabilities of large language models with real-time knowledge retrieval for accurate, context-aware responses.",
      icon: MessageSquare,
      features: ["Streaming responses", "Context retention", "RAG-enhanced accuracy"],
      route: "/projects/ai-chatbot"
    },
    {
      name: "Automated Attendance System (Face Recognition)",
      domain: "Computer Vision",
      technologies: "Real-time Object Detection/Recognition (e.g., using YOLO or SSD), Deep Learning for identity verification",
      description: "Transform attendance tracking with biometric precision. This system uses state-of-the-art facial recognition algorithms to instantly identify and verify individuals, providing contactless, secure, and automated attendance management.",
      icon: Eye,
      features: ["Real-time face detection", "High-confidence scoring", "Automated logging"],
      route: "/projects/face-recognition"
    },
    {
      name: "Object Detection in Videos",
      domain: "Computer Vision",
      technologies: "Real-time inference, Tracking algorithms, Deep Learning models (YOLO, Faster R-CNN)",
      description: "Unlock the power of video understanding with advanced object detection. This project processes video streams in real-time, identifying and tracking multiple objects simultaneously with precision and speed.",
      icon: Video,
      features: ["Multi-object tracking", "Real-time processing", "Confidence scoring"],
      route: "/projects/video-detection"
    },
    {
      name: "Autonomous Vehicle Simulation (Lane Line Detection)",
      domain: "Robotics/Control",
      technologies: "Computer Vision, Sensor Fusion concepts, Path Planning, Reinforcement Learning (advanced)",
      description: "Step into the future of autonomous driving. This simulation implements sophisticated computer vision algorithms to detect lane markings, assess road conditions, and provide the foundational technology for self-driving vehicles.",
      icon: Car,
      features: ["Lane boundary detection", "Real-time analysis", "Safety confidence metrics"],
      route: "/projects/lane-detection"
    },
    {
      name: "Language Translator App (using a Transformer)",
      domain: "NLP",
      technologies: "Advanced Transformer Architectures, Neural Machine Translation",
      description: "Break language barriers with neural machine translation. Powered by transformer models, this application delivers human-quality translations across multiple languages, understanding context and nuance.",
      icon: Languages,
      features: ["Multi-language support", "Context preservation", "Instant translation"],
      route: "/projects/translator"
    },
    {
      name: "Speech Emotion Recognition",
      domain: "Audio/Speech",
      technologies: "Signal Processing, Deep Learning (e.g., CNN or RNN) on audio features (Spectrograms)",
      description: "Decode human emotions from voice with advanced audio analysis. This project uses deep learning on audio spectrograms to detect emotional states, enabling emotionally intelligent AI applications.",
      icon: Mic,
      features: ["Real-time emotion detection", "Multi-emotion classification", "Confidence scoring"],
      route: "/projects/speech-emotion"
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
    <div className="container mx-auto py-8 px-4 space-y-12 animate-fade-in">
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Next-Generation AI/ML Portfolio</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Advanced AIML Projects
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the future of artificial intelligence with cutting-edge projects spanning generative AI, 
          computer vision, natural language processing, and advanced robotics. Each project demonstrates 
          state-of-the-art machine learning architectures and real-world applications.
        </p>
      </div>

      {/* Detailed Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => {
          const Icon = project.icon;
          return (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20 overflow-hidden"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className={`${getDomainColor(project.domain)}`}>
                    {project.domain}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-3">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Key Features
                  </p>
                  <ul className="space-y-1">
                    {project.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Technologies
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {project.technologies}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(project.route)}
                  className="w-full gap-2 group-hover:shadow-lg transition-shadow"
                >
                  Launch Project <ExternalLink className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Domain Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">AI Domain Coverage</CardTitle>
          <CardDescription>
            Comprehensive expertise across multiple AI/ML disciplines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {["Generative AI", "Computer Vision", "NLP", "Robotics/Control", "Audio/Speech"].map((domain) => (
              <div key={domain} className="text-center space-y-2">
                <Badge className={`${getDomainColor(domain)} w-full justify-center py-2`}>
                  {domain}
                </Badge>
                <p className="text-2xl font-bold text-primary">
                  {projects.filter(p => p.domain === domain).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {projects.filter(p => p.domain === domain).length === 1 ? 'Project' : 'Projects'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Overview Table */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Technical Specifications</CardTitle>
          <CardDescription>
            Detailed overview of technologies and architectures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground w-[25%]">Project Name</TableHead>
                  <TableHead className="font-semibold text-foreground w-[18%]">Domain</TableHead>
                  <TableHead className="font-semibold text-foreground w-[45%]">Key Technologies & Concepts</TableHead>
                  <TableHead className="font-semibold text-foreground w-[12%]">Action</TableHead>
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
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(project.route)}
                        className="gap-2"
                      >
                        Try It <ExternalLink className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMLProjects;
