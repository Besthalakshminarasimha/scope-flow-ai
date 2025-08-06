import { Brain, Code, Zap, Shield, Users, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "Advanced AI Models",
      description: "State-of-the-art computer vision models trained on millions of images for maximum accuracy.",
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Lightning-fast analysis powered by optimized algorithms and cloud infrastructure.",
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "Your images are processed securely and never stored. Complete privacy guaranteed.",
    },
    {
      icon: Code,
      title: "Developer Friendly",
      description: "Comprehensive APIs and SDKs for seamless integration into your applications.",
    },
  ];

  const models = [
    {
      name: "Object Detection",
      accuracy: "99.2%",
      description: "YOLO v8 with custom training on 100M+ images",
      supported: ["Common Objects", "Vehicles", "Animals", "People"],
    },
    {
      name: "Image Classification",
      accuracy: "98.7%",
      description: "ResNet-50 with transfer learning optimization",
      supported: ["Scenes", "Objects", "Activities", "Concepts"],
    },
    {
      name: "Face Recognition",
      accuracy: "99.8%",
      description: "FaceNet architecture with privacy protection",
      supported: ["Detection", "Recognition", "Emotions", "Age/Gender"],
    },
    {
      name: "OCR Text Extraction",
      accuracy: "97.5%",
      description: "Tesseract 5.0 with deep learning enhancement",
      supported: ["Documents", "Handwriting", "Multi-language", "Tables"],
    },
    {
      name: "Image Segmentation",
      accuracy: "96.3%",
      description: "Mask R-CNN with semantic understanding",
      supported: ["Instance", "Semantic", "Panoptic", "Medical"],
    },
  ];

  const stats = [
    { label: "Images Analyzed", value: "10M+", icon: Brain },
    { label: "Active Users", value: "50K+", icon: Users },
    { label: "Accuracy Rate", value: "99.1%", icon: Award },
    { label: "Processing Speed", value: "<1s", icon: Zap },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-brand rounded-2xl mx-auto flex items-center justify-center mb-6">
          <span className="text-white font-bold text-3xl">V</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          About VisionX
        </h1>
        <p className="text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed">
          VisionX is a cutting-edge AI Computer Vision platform that makes advanced image analysis 
          accessible to everyone. Powered by state-of-the-art machine learning models, we provide 
          accurate, fast, and secure image processing capabilities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-upload rounded-lg flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-foreground-muted">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Why Choose VisionX?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="glass hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-upload rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Models Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Our AI Models</h2>
          <p className="text-foreground-muted">
            Discover the powerful machine learning models that power VisionX
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {models.map((model, index) => (
            <Card key={index} className="glass">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <p className="text-sm text-foreground-muted mt-1">{model.description}</p>
                  </div>
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    {model.accuracy}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Supported Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {model.supported.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-center">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gradient-upload rounded-lg mx-auto flex items-center justify-center">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">TensorFlow.js</p>
                <p className="text-xs text-foreground-muted">Client-side ML</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gradient-upload rounded-lg mx-auto flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">PyTorch</p>
                <p className="text-xs text-foreground-muted">Deep Learning</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gradient-upload rounded-lg mx-auto flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">ONNX Runtime</p>
                <p className="text-xs text-foreground-muted">Optimized Inference</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gradient-upload rounded-lg mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">WebAssembly</p>
                <p className="text-xs text-foreground-muted">High Performance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Statement */}
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold mb-4">Our Mission</h3>
          <p className="text-foreground-muted leading-relaxed max-w-3xl mx-auto">
            We believe that advanced AI computer vision should be accessible to everyone. 
            Our mission is to democratize artificial intelligence by providing powerful, 
            easy-to-use tools that empower individuals and businesses to extract meaningful 
            insights from visual data. Whether you're a developer, researcher, or creative 
            professional, VisionX gives you the tools to see beyond the pixels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;